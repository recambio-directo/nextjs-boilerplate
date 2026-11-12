// ══════════════════════════════════════════════════════════════
// IPDA (Isi Condal) — Cliente API para TecDoc
// Autenticación, búsqueda de vehículos, categorías y piezas
// ══════════════════════════════════════════════════════════════
//
// SESIONES: IPDA solo permite UNA sesión activa por usuario. Cada login nuevo
// invalida el token anterior ("Another session active"). Para que no falle:
//   1. El token de cada usuario se comparte entre todas las instancias del
//      servidor a través de la tabla `ipda_sesiones` de Supabase (así no se
//      pisan unas a otras haciendo login).
//   2. Hay varios usuarios (IPDA_USER + IPDA_USERS). Si la sesión de uno
//      cae, la petición se repite al momento con el siguiente y la sesión
//      caída se renueva. El usuario final no ve el fallo.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const IPDA_BASE = "https://rgranvia-backend.isicondal.com/public/api/v1";
const IPDA_CK = process.env.IPDA_CK || "3950753949";
const IPDA_CUSTOMER = parseInt(process.env.IPDA_CUSTOMER || "10811", 10);

type CuentaIpda = { usr: string; pss: string };

// Usuario principal (IPDA_USER / IPDA_PASS) + adicionales en IPDA_USERS con
// formato "usuario:contraseña,usuario:contraseña". Solo en variables de entorno.
function cuentasIpda(): CuentaIpda[] {
  const lista: CuentaIpda[] = [];
  const add = (usr?: string, pss?: string) => {
    const u = (usr || "").trim();
    const p = (pss || "").trim();
    if (u && p && !lista.some((c) => c.usr === u)) lista.push({ usr: u, pss: p });
  };
  add(process.env.IPDA_USER, process.env.IPDA_PASS);
  for (const par of (process.env.IPDA_USERS || "").split(",")) {
    const i = par.indexOf(":");
    if (i > 0) add(par.slice(0, i), par.slice(i + 1));
  }
  return lista;
}

// ── Estado en memoria de esta instancia ──
type Sesion = { token: string; expira: number };
const sesiones = new Map<string, Sesion>();            // usuario → token en uso
const bloqueados = new Map<string, number>();          // usuario → no reintentar login hasta (ms)
const rechazados = new Map<string, string>();          // usuario → último token que IPDA rechazó
const loginsEnCurso = new Map<string, Promise<Sesion>>();
const MARGEN_MS = 5 * 60 * 1000;
const TIMEOUT_MS = 20000;

let sb: SupabaseClient | null = null;
function tabla() {
  if (!sb) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return null;
    sb = createClient(url, key);
  }
  return sb.from("ipda_sesiones");
}

function vigente(s: Sesion | null | undefined): s is Sesion {
  return !!s && !!s.token && Date.now() < s.expira - MARGEN_MS;
}

function caducidadJwt(token: string): number {
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
    if (payload.exp) return payload.exp * 1000;
  } catch { /* se asume 6h */ }
  return Date.now() + 6 * 60 * 60 * 1000;
}

function descError(json: any): string {
  const e = json?.error;
  if (e && typeof e === "object") return e.DESC || JSON.stringify(e).slice(0, 200);
  return String(e || json?.message || JSON.stringify(json ?? "").slice(0, 200));
}

async function leerSesionCompartida(usr: string): Promise<Sesion | null> {
  try {
    const t = tabla();
    if (!t) return null;
    const { data, error } = await t.select("token, expira").eq("usuario", usr).maybeSingle();
    if (error || !data?.token) return null;
    return { token: data.token, expira: new Date(data.expira).getTime() };
  } catch {
    return null;
  }
}

async function guardarSesionCompartida(usr: string, s: Sesion): Promise<void> {
  try {
    const t = tabla();
    if (!t) return;
    const { error } = await t.upsert(
      { usuario: usr, token: s.token, expira: new Date(s.expira).toISOString(), actualizado: new Date().toISOString() },
      { onConflict: "usuario" }
    );
    if (error) console.error("[IPDA] No se pudo guardar la sesión compartida (¿falta la tabla ipda_sesiones?):", error.message);
  } catch (e) {
    console.error("[IPDA] Error guardando la sesión compartida:", e);
  }
}

async function login(cuenta: CuentaIpda): Promise<Sesion> {
  // Dentro de una misma instancia, un solo login a la vez por usuario
  const enCurso = loginsEnCurso.get(cuenta.usr);
  if (enCurso) return enCurso;

  const p = (async () => {
    const res = await fetch(`${IPDA_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usr: cuenta.usr, pss: cuenta.pss, force: 1, ck: IPDA_CK, language: "es", userType: "standard" }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    let json: any = null;
    try { json = await res.json(); } catch { json = null; }

    if (!res.ok || !json?.success || !json.data?.token) {
      // Usuario caducado o contraseña incorrecta: no insistir durante 30 min
      bloqueados.set(cuenta.usr, Date.now() + 30 * 60 * 1000);
      console.error(`IPDA login response (usuario ${cuenta.usr}):`, JSON.stringify(json).slice(0, 300));
      throw new Error(`IPDA login failed (usuario ${cuenta.usr}): ${res.status} - ${descError(json)}`);
    }

    const s: Sesion = { token: json.data.token, expira: caducidadJwt(json.data.token) };
    sesiones.set(cuenta.usr, s);
    bloqueados.delete(cuenta.usr);
    rechazados.delete(cuenta.usr);
    await guardarSesionCompartida(cuenta.usr, s);
    console.log(`[IPDA] Login OK usuario ${cuenta.usr}`);
    return s;
  })();

  loginsEnCurso.set(cuenta.usr, p);
  try {
    return await p;
  } finally {
    loginsEnCurso.delete(cuenta.usr);
  }
}

/**
 * Token válido para un usuario: memoria → sesión compartida en Supabase → login.
 * Un token que IPDA ha rechazado no se reutiliza aunque siga guardado.
 */
async function obtenerSesion(cuenta: CuentaIpda): Promise<Sesion> {
  const tokenCaido = rechazados.get(cuenta.usr);
  const enMemoria = sesiones.get(cuenta.usr);
  if (vigente(enMemoria) && enMemoria.token !== tokenCaido) return enMemoria;

  // Otra instancia puede haber renovado ya la sesión: se usa la suya, sin login
  const compartida = await leerSesionCompartida(cuenta.usr);
  if (vigente(compartida) && compartida.token !== tokenCaido) {
    sesiones.set(cuenta.usr, compartida);
    return compartida;
  }

  if ((bloqueados.get(cuenta.usr) || 0) > Date.now()) {
    throw new Error(`IPDA: usuario ${cuenta.usr} no disponible temporalmente`);
  }
  return await login(cuenta);
}

function esSesionCaida(status: number, json: any): boolean {
  const e = json?.error;
  return status === 401 || e?.HTTP_STATUS_CODE === 401 || e?.CODE === 8;
}

/**
 * Ejecuta una llamada a IPDA con sesión. Si la sesión del usuario ha caído,
 * la renueva y repite con el siguiente usuario. `llamar` recibe el token y
 * devuelve la respuesta; `caida` decide si esa respuesta es de sesión caída.
 */
async function conSesion<T>(
  llamar: (token: string) => Promise<T>,
  caida: (resultado: T) => boolean
): Promise<T> {
  const cuentas = cuentasIpda();
  if (cuentas.length === 0) throw new Error("IPDA: no hay usuarios configurados (IPDA_USER / IPDA_PASS)");

  let ultimo: T | undefined;
  let ultimoError: unknown = null;

  // Dos vueltas como máximo: la segunda usa las sesiones ya renovadas
  for (let intento = 0; intento < cuentas.length * 2; intento++) {
    const cuenta = cuentas[intento % cuentas.length];
    let sesion: Sesion;
    try {
      sesion = await obtenerSesion(cuenta);
    } catch (e) {
      ultimoError = e;
      continue;
    }
    const resultado = await llamar(sesion.token);
    if (!caida(resultado)) return resultado;

    console.warn(`[IPDA] Sesión caída del usuario ${cuenta.usr}; se reintenta con otra sesión`);
    rechazados.set(cuenta.usr, sesion.token);
    if (sesiones.get(cuenta.usr)?.token === sesion.token) sesiones.delete(cuenta.usr);
    ultimo = resultado;
  }

  if (ultimo !== undefined) return ultimo;
  throw ultimoError instanceof Error ? ultimoError : new Error("IPDA: no se pudo iniciar sesión con ningún usuario");
}

/** Token de sesión vigente (compatibilidad). Para peticiones usa ipdaFetchConSesion. */
export async function getIpdaToken(): Promise<string> {
  const cuentas = cuentasIpda();
  let ultimoError: unknown = new Error("IPDA: no hay usuarios configurados (IPDA_USER / IPDA_PASS)");
  for (const cuenta of cuentas) {
    try {
      return (await obtenerSesion(cuenta)).token;
    } catch (e) {
      ultimoError = e;
    }
  }
  throw ultimoError;
}

/**
 * fetch a IPDA con cabecera App-Token y reintento automático si la sesión ha
 * caído. `ruta` es relativa a la base de la API (p. ej. "/document/retrieve2?img=...").
 */
export async function ipdaFetchConSesion(ruta: string, init: RequestInit = {}): Promise<Response> {
  return await conSesion(
    (token) => fetch(`${IPDA_BASE}${ruta}`, {
      ...init,
      headers: { ...(init.headers as Record<string, string> | undefined), "App-Token": token },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    }),
    (res) => res.status === 401
  );
}

async function ipdaPost(endpoint: string, body: Record<string, any>): Promise<any> {
  console.log(`[IPDA] POST ${endpoint}`, JSON.stringify(body).slice(0, 300));

  const r = await conSesion(
    async (token) => {
      const res = await fetch(`${IPDA_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "App-Token": token },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const text = await res.text();
        return { status: res.status, ok: res.ok, json: null as any, noJson: `${contentType}: ${text.slice(0, 300)}` };
      }
      let json: any = null;
      try { json = await res.json(); } catch { json = null; }
      return { status: res.status, ok: res.ok, json, noJson: "" };
    },
    (x) => esSesionCaida(x.status, x.json)
  );

  if (r.noJson) {
    console.error(`[IPDA] ${endpoint} returned non-JSON (${r.noJson})`);
    throw new Error(`IPDA ${endpoint}: respuesta no JSON (${r.status})`);
  }

  if (!r.ok || !r.json?.success) {
    console.error(`IPDA ${endpoint} response:`, JSON.stringify(r.json).slice(0, 500));
    throw new Error(`IPDA ${endpoint}: ${r.status} - ${descError(r.json)}`);
  }

  return r.json.data;
}

// ══════════════════════════════════════════════════════════════
// Buscar vehículo por matrícula o VIN
// token2 format: "clienteId#bastidor_o_vacio#matricula"
// ══════════════════════════════════════════════════════════════
export interface IpdaVehiculo {
  id: string;
  area: number;
  marca: string;
  nombreMarca: string;
  modelo: string;
  nombreModelo: string;
  nombreVehiculo: string;
  aaaamm_desde: string;
  aaaamm_hasta: string;
  nombreMotor: string;
  kw_desde: string;
  cv_desde: string;
  cc_desde: string;
  capacidadMotor: string;
  cilindros: string;
  tipoMotor: string;
  combustibleMezcla: string;
  traccion: string;
  carroceria: string;
  combustibleTipo: string;
  catalizador: string;
  transmision: string;
  valvulas: string;
}

export interface IpdaPlateResult {
  vin: string;
  cc: string;
  kw: string;
  cv: string;
  mar: string;
  mod: string;
  pro: string;
  fma: string;
  car: string;
  record: IpdaVehiculo[];
}

export async function buscarVehiculo(busqueda: string): Promise<IpdaPlateResult> {
  const valor = busqueda.trim().toUpperCase().replace(/[\s\-]/g, "");

  // Determinar si es VIN (17 chars alfanumérico) o matrícula
  const esVin = /^[A-HJ-NPR-Z0-9]{17}$/.test(valor);

  if (esVin) {
    // ── VIN/Bastidor: usar endpoint /vehicle/vin ──
    console.log(`[IPDA] Buscando por VIN: ${valor}`);
    const data = await ipdaPost("/vehicle/vin", {
      vin: valor,
      country: "es",
    });
    return data as IpdaPlateResult;
  } else {
    // ── Matrícula: usar endpoint /search/plate con token2 ──
    const IPDA_PLATE_PREFIX = process.env.IPDA_PLATE_PREFIX || "75";
    const IPDA_PLATE_KEY = process.env.IPDA_PLATE_KEY || "6T8AZS9G";
    const prefijo = IPDA_PLATE_PREFIX.padStart(6, "0");
    const token2 = `${prefijo}#${IPDA_PLATE_KEY}#${valor}`;

    console.log(`[IPDA] Buscando por matrícula: token2=${token2}`);
    const data = await ipdaPost("/search/plate", {
      token2,
      country: "es",
    });
    return data as IpdaPlateResult;
  }
}

// ══════════════════════════════════════════════════════════════
// Árbol de categorías para un vehículo
// ══════════════════════════════════════════════════════════════
export interface IpdaTreeNode {
  id: string;
  name: string;
  children?: IpdaTreeNode[];
  hasChildren?: boolean;
}

export async function obtenerCategorias(vehicleId: string): Promise<any> {
  return await ipdaPost("/assemblygroup/tree", {
    area: 1,
    vehicle: vehicleId,
    language: 8,
  });
}

// ══════════════════════════════════════════════════════════════
// Lista de fabricantes para un vehículo + nodo
// ══════════════════════════════════════════════════════════════
export async function obtenerFabricantes(
  vehicleId: string,
  nodoId: string,
  genericoId: string
): Promise<any> {
  return await ipdaPost("/suppliers/list", {
    area: 1,
    vehicleId,
    node: nodoId,
    nodeList: null,
    supplierList: null,
    generic: genericoId,
    showAll: "false",
    showOnlyIsiPartReferences: false,
    universal: 0,
    user: parseInt(process.env.IPDA_USER_ID || "83647", 10),
    company: 1,
  });
}

// ══════════════════════════════════════════════════════════════
// Lista de referencias/piezas para un vehículo + nodo + genérico
// ══════════════════════════════════════════════════════════════
export interface IpdaReferencia {
  id: string;
  referencia: string;
  nombre: string;
  nombreDlnr: string;
  dlnr: string;
  refpropia: string;
  txtrefpropia: string;
  refprove: string;
  caracteristicasList: { txt: string; value: string; unit: string }[];
  grafico: string;
  graficoLogo: string;
  pvp: string;
  pvpNeto: number;
  dto1: string;
  stockColor: string;
  stockTexto: string;
  stockCantidad: number;
  ref_ean: string;
  ref_estado: string;
  hasEquivalencesWithStock: number;
}

export async function obtenerReferencias(
  vehicleId: string,
  nodoId: string,
  genericoId: string,
  dlnr?: string
): Promise<any> {
  return await ipdaPost("/reference/list", {
    area: "1",
    tipoBusqueda: "loadGeneric",
    userId: parseInt(process.env.IPDA_USER_ID || "83647", 10),
    almacen: "01",
    customer: IPDA_CUSTOMER,
    company: 1,
    dlnr: dlnr || null,
    dlnrLista: null,
    genericoId,
    groups: null,
    nodo: null,
    nodoId,
    nodoLista: null,
    showAll: 0,
    vehicleId,
  });
}

// ══════════════════════════════════════════════════════════════
// Buscar referencias por nodo usando tipoBusqueda "load"
// Funciona para nodos que NO tienen genéricos en el árbol
// (Filtro combustible, Sonda Lambda, Motor de arranque, etc.)
// ══════════════════════════════════════════════════════════════
export async function obtenerReferenciasPorNodo(
  vehicleId: string,
  nodoId: string
): Promise<any> {
  return await ipdaPost("/reference/list", {
    area: "1",
    tipoBusqueda: "load",
    userId: parseInt(process.env.IPDA_USER_ID || "83647", 10),
    almacen: "01",
    customer: IPDA_CUSTOMER,
    company: 1,
    dlnr: null,
    dlnrLista: null,
    genericoId: null,
    groups: null,
    nodo: nodoId,
    nodoId,
    nodoLista: null,
    showAll: 0,
    vehicleId,
  });
}

// ══════════════════════════════════════════════════════════════
// Buscar equivalencias/cruces por referencia OEM o IAM
// Usa tipoBusqueda "loadByReferencia" con buscarIncEquiv=1
// Devuelve las piezas equivalentes de TecDoc (IPDA)
// ══════════════════════════════════════════════════════════════
export interface IpdaEquivalencia {
  referencia: string;
  nombre: string;
  marca: string;        // nombreDlnr
  dlnr: string;
  descripcion: string;  // txtrefpropia
  grafico: string;
  graficoLogo: string;
  stockCantidad: number;
  stockColor: string;
  ref_ean: string;
}

export async function buscarEquivalenciasIPDA(
  referencia: string
): Promise<IpdaEquivalencia[]> {
  try {
    const data = await ipdaPost("/reference/list", {
      area: null,
      tipoBusqueda: "loadByReferencia",
      userId: parseInt(process.env.IPDA_USER_ID || "83647", 10),
      almacen: "01",
      customer: IPDA_CUSTOMER,
      company: 1,
      buscarRefer: referencia,
      buscarIncEquiv: 1,
      buscarTipo: "",
      dlnr: null,
      dlnrLista: null,
      groups: null,
      partial: false,
      showAll: 0,
    });

    const refs = data?.refs;
    if (!Array.isArray(refs) || refs.length === 0) {
      console.log(`[IPDA] buscarEquivalencias: 0 resultados para "${referencia}"`);
      return [];
    }

    console.log(`[IPDA] buscarEquivalencias: ${refs.length} resultados para "${referencia}"`);

    return refs.map((r: any) => ({
      referencia: r.referencia,
      nombre: r.nombre,
      marca: r.nombreDlnr,
      dlnr: r.dlnr,
      descripcion: r.txtrefpropia || r.nombre,
      grafico: r.grafico || "",
      graficoLogo: r.graficoLogo || "",
      stockCantidad: r.stockCantidad ?? 0,
      stockColor: r.stockColor || "rojo",
      ref_ean: r.ref_ean || "",
    }));
  } catch (error: any) {
    console.error(`[IPDA] buscarEquivalencias error para "${referencia}":`, error.message);
    return [];
  }
}

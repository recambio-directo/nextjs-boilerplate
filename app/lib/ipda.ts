// ══════════════════════════════════════════════════════════════
// IPDA (Isi Condal) — Cliente API para TecDoc
// Autenticación, búsqueda de vehículos, categorías y piezas
// ══════════════════════════════════════════════════════════════

const IPDA_BASE = "https://rgranvia-backend.isicondal.com/public/api/v1";
const IPDA_USER = process.env.IPDA_USER!;       // "10811"
const IPDA_PASS = process.env.IPDA_PASS!;       // contraseña
const IPDA_CK = process.env.IPDA_CK || "3950753949";
const IPDA_CUSTOMER = parseInt(process.env.IPDA_CUSTOMER || "10811", 10);

// ── Token cache en memoria (se renueva automáticamente) ──
let cachedToken: string | null = null;
let tokenExpiry: number = 0;

export async function getIpdaToken(): Promise<string> {
  // Si tenemos un token válido con margen de 5 min, reutilizar
  if (cachedToken && Date.now() < tokenExpiry - 300_000) {
    return cachedToken;
  }

  const res = await fetch(`${IPDA_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      usr: IPDA_USER,
      pss: IPDA_PASS,
      force: 1,
      ck: IPDA_CK,
      language: "es",
      userType: "standard",
    }),
  });

  const json = await res.json();

  if (!res.ok || !json.success || !json.data?.token) {
    console.error("IPDA login response:", JSON.stringify(json).slice(0, 500));
    throw new Error(`IPDA login failed: ${res.status} - ${json.error || json.message || JSON.stringify(json).slice(0, 200)}`);
  }

  cachedToken = json.data.token;
  // Log datos útiles del login (sin el token)
  const loginKeys = Object.keys(json.data).filter(k => k !== "token");
  const loginInfo: Record<string, any> = {};
  for (const k of loginKeys) loginInfo[k] = json.data[k];
  console.log("[IPDA] Login OK, data keys:", JSON.stringify(loginInfo).slice(0, 500));

  // Decodificar exp del JWT para saber cuándo caduca
  try {
    const payload = JSON.parse(
      Buffer.from(json.data.token.split(".")[1], "base64").toString()
    );
    tokenExpiry = (payload.exp || 0) * 1000;
  } catch {
    // Si no podemos decodificar, asumir 12h
    tokenExpiry = Date.now() + 12 * 60 * 60 * 1000;
  }

  return cachedToken!;
}

async function ipdaPost(endpoint: string, body: Record<string, any>): Promise<any> {
  const token = await getIpdaToken();
  const url = `${IPDA_BASE}${endpoint}`;
  console.log(`[IPDA] POST ${endpoint}`, JSON.stringify(body).slice(0, 300));

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "App-Token": token,
    },
    body: JSON.stringify(body),
  });

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const text = await res.text();
    console.error(`[IPDA] ${endpoint} returned non-JSON (${contentType}):`, text.slice(0, 300));
    throw new Error(`IPDA ${endpoint}: respuesta no JSON (${res.status})`);
  }

  const json = await res.json();

  if (!res.ok || !json.success) {
    console.error(`IPDA ${endpoint} response:`, JSON.stringify(json).slice(0, 500));
    throw new Error(`IPDA ${endpoint}: ${res.status} - ${json.error || json.message || JSON.stringify(json).slice(0, 200)}`);
  }

  return json.data;
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
  const valor = busqueda.trim().toUpperCase();

  // Determinar si es VIN (17 chars alfanumérico) o matrícula
  const esVin = /^[A-HJ-NPR-Z0-9]{17}$/.test(valor);

  // Construir token2: "idInstalacion#claveInstalacion#matricula"
  // idInstalacion = 75, claveInstalacion = 6T8AZS9G (ambos requeridos por IPDA)
  const IPDA_PLATE_PREFIX = process.env.IPDA_PLATE_PREFIX || "75";
  const IPDA_PLATE_KEY = process.env.IPDA_PLATE_KEY || "6T8AZS9G";
  const prefijo = IPDA_PLATE_PREFIX.padStart(6, "0");
  let token2: string;
  if (esVin) {
    token2 = `${prefijo}#${valor}#`;
  } else {
    const matriculaLimpia = valor.replace(/[\s\-]/g, "");
    token2 = `${prefijo}#${IPDA_PLATE_KEY}#${matriculaLimpia}`;
  }

  console.log(`[IPDA] Buscando vehículo: token2=${token2}`);

  const data = await ipdaPost("/search/plate", {
    token2,
    country: "es",
  });

  return data as IpdaPlateResult;
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

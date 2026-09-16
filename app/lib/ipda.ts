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
      force: 0,
      ck: IPDA_CK,
      language: "es",
      userType: "standard",
    }),
  });

  if (!res.ok) {
    throw new Error(`IPDA login failed: ${res.status}`);
  }

  const json = await res.json();
  if (!json.success || !json.data?.token) {
    throw new Error("IPDA login: no token in response");
  }

  cachedToken = json.data.token;

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
  const res = await fetch(`${IPDA_BASE}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "App-Token": token,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`IPDA ${endpoint}: ${res.status}`);
  }

  const json = await res.json();
  if (!json.success) {
    throw new Error(`IPDA ${endpoint}: ${json.error || "unknown error"}`);
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

  // Construir token2: "prefijo#bastidor#matricula"
  let token2: string;
  if (esVin) {
    token2 = `${String(IPDA_CUSTOMER).padStart(6, "0")}#${valor}#`;
  } else {
    // Matrícula — puede tener formatos variados (1234ABC, 0097JTV, etc.)
    const matriculaLimpia = valor.replace(/[\s\-]/g, "");
    token2 = `${String(IPDA_CUSTOMER).padStart(6, "0")}##${matriculaLimpia}`;
  }

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
  return await ipdaPost("/tree", {
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

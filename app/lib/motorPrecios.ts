// lib/motorPrecios.ts
//
// Motor de cálculo de tarifas de transporte.
// PENINSULA — Agencias activas: CTT, MRW, NACEX, Correos Express, DHL, SEUR, GLS.
// ISLAS (Baleares/Canarias) — Agencias activas: DHL, Correos Express, MRW,
// y CTT solo para Canarias (no tiene tabla propia de Baleares en el contrato).
// SEUR, NACEX y GLS quedan excluidas en rutas insulares (sin tarifa).
//
// Margen comercial fijo aplicado sobre el coste real de cada agencia.
export const MARGEN_COMERCIAL = 1.5;

// ─────────────────────────────────────────────────────────────────────────
// 1. Provincias limítrofes y comunidades autónomas (para determinar zona PENINSULAR)
// ─────────────────────────────────────────────────────────────────────────
const PROVINCIAS: Record<string, { ccaa: string; limitrofes: string[] }> = {
  "Álava": { ccaa: "País Vasco", limitrofes: ["Vizcaya", "Guipúzcoa", "Navarra", "La Rioja", "Burgos"] },
  "Albacete": { ccaa: "Castilla-La Mancha", limitrofes: ["Cuenca", "Valencia", "Alicante", "Murcia", "Jaén", "Ciudad Real"] },
  "Alicante": { ccaa: "Comunidad Valenciana", limitrofes: ["Valencia", "Albacete", "Murcia"] },
  "Almería": { ccaa: "Andalucía", limitrofes: ["Granada", "Murcia"] },
  "Ávila": { ccaa: "Castilla y León", limitrofes: ["Madrid", "Segovia", "Valladolid", "Salamanca", "Cáceres", "Toledo"] },
  "Badajoz": { ccaa: "Extremadura", limitrofes: ["Cáceres", "Ciudad Real", "Córdoba", "Sevilla", "Huelva"] },
  "Barcelona": { ccaa: "Cataluña", limitrofes: ["Girona", "Lleida", "Tarragona"] },
  "Burgos": { ccaa: "Castilla y León", limitrofes: ["Álava", "La Rioja", "Soria", "Segovia", "Valladolid", "Palencia", "Cantabria"] },
  "Cáceres": { ccaa: "Extremadura", limitrofes: ["Badajoz", "Toledo", "Ávila", "Salamanca"] },
  "Cádiz": { ccaa: "Andalucía", limitrofes: ["Sevilla", "Málaga"] },
  "Cantabria": { ccaa: "Cantabria", limitrofes: ["Asturias", "León", "Palencia", "Burgos", "Vizcaya"] },
  "Castellón": { ccaa: "Comunidad Valenciana", limitrofes: ["Tarragona", "Teruel", "Valencia"] },
  "Ciudad Real": { ccaa: "Castilla-La Mancha", limitrofes: ["Toledo", "Cuenca", "Albacete", "Jaén", "Córdoba", "Badajoz"] },
  "Córdoba": { ccaa: "Andalucía", limitrofes: ["Badajoz", "Ciudad Real", "Jaén", "Granada", "Málaga", "Sevilla"] },
  "Cuenca": { ccaa: "Castilla-La Mancha", limitrofes: ["Guadalajara", "Teruel", "Valencia", "Albacete", "Ciudad Real", "Madrid"] },
  "Girona": { ccaa: "Cataluña", limitrofes: ["Barcelona", "Lleida"] },
  "Granada": { ccaa: "Andalucía", limitrofes: ["Jaén", "Almería", "Málaga", "Córdoba", "Murcia", "Albacete"] },
  "Guadalajara": { ccaa: "Castilla-La Mancha", limitrofes: ["Madrid", "Segovia", "Soria", "Zaragoza", "Teruel", "Cuenca"] },
  "Guipúzcoa": { ccaa: "País Vasco", limitrofes: ["Vizcaya", "Álava", "Navarra"] },
  "Huelva": { ccaa: "Andalucía", limitrofes: ["Sevilla", "Badajoz"] },
  "Huesca": { ccaa: "Aragón", limitrofes: ["Lleida", "Zaragoza", "Navarra"] },
  "Jaén": { ccaa: "Andalucía", limitrofes: ["Ciudad Real", "Albacete", "Granada", "Córdoba", "Murcia"] },
  "La Rioja": { ccaa: "La Rioja", limitrofes: ["Álava", "Burgos", "Soria", "Zaragoza", "Navarra"] },
  "León": { ccaa: "Castilla y León", limitrofes: ["Asturias", "Cantabria", "Palencia", "Valladolid", "Zamora", "Orense", "Lugo"] },
  "Lleida": { ccaa: "Cataluña", limitrofes: ["Huesca", "Zaragoza", "Tarragona", "Barcelona", "Girona"] },
  "Lugo": { ccaa: "Galicia", limitrofes: ["Coruña", "Asturias", "León", "Orense", "Pontevedra"] },
  "Madrid": { ccaa: "Comunidad de Madrid", limitrofes: ["Segovia", "Ávila", "Toledo", "Cuenca", "Guadalajara"] },
  "Málaga": { ccaa: "Andalucía", limitrofes: ["Cádiz", "Sevilla", "Córdoba", "Granada"] },
  "Murcia": { ccaa: "Región de Murcia", limitrofes: ["Alicante", "Albacete", "Jaén", "Granada", "Almería"] },
  "Navarra": { ccaa: "Navarra", limitrofes: ["Álava", "Guipúzcoa", "La Rioja", "Zaragoza", "Huesca"] },
  "Orense": { ccaa: "Galicia", limitrofes: ["Lugo", "Pontevedra", "León", "Zamora"] },
  "Palencia": { ccaa: "Castilla y León", limitrofes: ["Cantabria", "Burgos", "Valladolid", "León"] },
  "Pontevedra": { ccaa: "Galicia", limitrofes: ["Coruña", "Lugo", "Orense"] },
  "Coruña": { ccaa: "Galicia", limitrofes: ["Lugo", "Pontevedra"] },
  "Salamanca": { ccaa: "Castilla y León", limitrofes: ["Zamora", "Valladolid", "Ávila", "Cáceres"] },
  "Segovia": { ccaa: "Castilla y León", limitrofes: ["Valladolid", "Burgos", "Soria", "Guadalajara", "Madrid", "Ávila"] },
  "Sevilla": { ccaa: "Andalucía", limitrofes: ["Huelva", "Badajoz", "Córdoba", "Málaga", "Cádiz"] },
  "Soria": { ccaa: "Castilla y León", limitrofes: ["Burgos", "La Rioja", "Zaragoza", "Guadalajara", "Segovia"] },
  "Tarragona": { ccaa: "Cataluña", limitrofes: ["Barcelona", "Lleida", "Castellón", "Teruel"] },
  "Teruel": { ccaa: "Aragón", limitrofes: ["Zaragoza", "Tarragona", "Castellón", "Valencia", "Cuenca", "Guadalajara"] },
  "Toledo": { ccaa: "Castilla-La Mancha", limitrofes: ["Madrid", "Ávila", "Cáceres", "Ciudad Real", "Cuenca"] },
  "Valencia": { ccaa: "Comunidad Valenciana", limitrofes: ["Castellón", "Teruel", "Cuenca", "Albacete", "Alicante"] },
  "Valladolid": { ccaa: "Castilla y León", limitrofes: ["Palencia", "Burgos", "Segovia", "Ávila", "Salamanca", "Zamora", "León"] },
  "Vizcaya": { ccaa: "País Vasco", limitrofes: ["Cantabria", "Álava", "Guipúzcoa", "Burgos"] },
  "Zamora": { ccaa: "Castilla y León", limitrofes: ["León", "Orense", "Valladolid", "Salamanca"] },
  "Zaragoza": { ccaa: "Aragón", limitrofes: ["Huesca", "Lleida", "Tarragona", "Teruel", "Guadalajara", "Soria", "La Rioja", "Navarra"] },
  "Asturias": { ccaa: "Asturias", limitrofes: ["Cantabria", "León", "Lugo"] },
};

const CAPITALES: Record<string, [number, number]> = {
  "Álava": [42.8467, -2.6716], "Albacete": [38.9943, -1.8585], "Alicante": [38.3452, -0.4810],
  "Almería": [36.8340, -2.4637], "Ávila": [40.6564, -4.6813], "Badajoz": [38.8786, -6.9707],
  "Barcelona": [41.3874, 2.1686], "Burgos": [42.3439, -3.6969], "Cáceres": [39.4762, -6.3722],
  "Cádiz": [36.5271, -6.2886], "Cantabria": [43.4623, -3.8099], "Castellón": [39.9864, -0.0513],
  "Ciudad Real": [38.9861, -3.9271], "Córdoba": [37.8882, -4.7794], "Cuenca": [40.0704, -2.1374],
  "Girona": [41.9794, 2.8214], "Granada": [37.1773, -3.5986], "Guadalajara": [40.6333, -3.1669],
  "Guipúzcoa": [43.3183, -1.9812], "Huelva": [37.2614, -6.9447], "Huesca": [42.1401, -0.4089],
  "Jaén": [37.7796, -3.7849], "La Rioja": [42.4627, -2.4449], "León": [42.5987, -5.5671],
  "Lleida": [41.6176, 0.6200], "Lugo": [43.0121, -7.5559], "Madrid": [40.4168, -3.7038],
  "Málaga": [36.7213, -4.4214], "Murcia": [37.9922, -1.1307], "Navarra": [42.8125, -1.6458],
  "Orense": [42.3399, -7.8639], "Palencia": [42.0096, -4.5288], "Pontevedra": [42.4310, -8.6444],
  "Coruña": [43.3623, -8.4115], "Salamanca": [40.9701, -5.6635], "Segovia": [40.9429, -4.1088],
  "Sevilla": [37.3891, -5.9845], "Soria": [41.7666, -2.4790], "Tarragona": [41.1189, 1.2445],
  "Teruel": [40.3456, -1.1065], "Toledo": [39.8628, -4.0273], "Valencia": [39.4699, -0.3763],
  "Valladolid": [41.6523, -4.7245], "Vizcaya": [43.2630, -2.9350], "Zamora": [41.5033, -5.7446],
  "Zaragoza": [41.6488, -0.8891], "Asturias": [43.3619, -5.8494],
};

function distanciaKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const dLat = (b[0] - a[0]) * Math.PI / 180;
  const dLon = (b[1] - a[1]) * Math.PI / 180;
  const lat1 = a[0] * Math.PI / 180, lat2 = b[0] * Math.PI / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export type Zona = "Provincial" | "Regional" | "Peninsular" | "Peninsular+";

/** Determina la zona tarifaria CTT/Correos Express en base a las provincias reales (PENÍNSULA). */
export function determinarZona(provinciaOrigen: string, provinciaDestino: string): Zona {
  const origen = provinciaOrigen?.trim();
  const destino = provinciaDestino?.trim();

  if (!origen || !destino) return "Peninsular"; // fallback si falta el dato

  if (origen === destino) return "Provincial";

  const infoOrigen = PROVINCIAS[origen];
  if (infoOrigen) {
    const mismaCCAA = PROVINCIAS[destino]?.ccaa === infoOrigen.ccaa;
    const limitrofe = infoOrigen.limitrofes.includes(destino);
    if (mismaCCAA || limitrofe) return "Regional";
  }

  const capOrigen = CAPITALES[origen];
  const capDestino = CAPITALES[destino];
  if (capOrigen && capDestino) {
    const km = distanciaKm(capOrigen, capDestino);
    if (km > 800) return "Peninsular+";
  }

  return "Peninsular";
}

// ─────────────────────────────────────────────────────────────────────────
// 1b. Detección de islas por código postal
// ─────────────────────────────────────────────────────────────────────────
export type TipoInsular = "baleares" | "canarias" | null;

/** Clasifica un CP como Baleares, Canarias, o null si es peninsular. */
export function detectarTipoInsular(cp: string): TipoInsular {
  const c = (cp || "").trim();
  if (c.startsWith("07")) return "baleares";
  if (c.startsWith("35") || c.startsWith("38")) return "canarias";
  return null;
}

/** Combina origen y destino: si cualquiera de los dos es insular, manda esa zona.
 * Si ambos son insulares de distinto archipiélago, se marca "canarias" por ser
 * la más restrictiva/cara — revisar caso a caso, es un supuesto raro. */
export function detectarTipoInsularEnvio(cpOrigen: string, cpDestino: string): TipoInsular {
  const o = detectarTipoInsular(cpOrigen);
  const d = detectarTipoInsular(cpDestino);
  if (o === "canarias" || d === "canarias") return "canarias";
  if (o === "baleares" || d === "baleares") return "baleares";
  return null;
}

// ─────────────────────────────────────────────────────────────────────────
// 2. Tablas de tarifas PENINSULARES por agencia (peso → precio por zona)
// ─────────────────────────────────────────────────────────────────────────
type TramoZona = { hasta: number; Provincial: number; Regional: number; Peninsular: number; "Peninsular+": number };

function buscarPorZona(tabla: TramoZona[], kgAdicional: TramoZona, pesoKg: number, zona: Zona): number {
  const tramo = tabla.find(t => pesoKg <= t.hasta);
  if (tramo) return tramo[zona];
  const ultimo = tabla[tabla.length - 1];
  const kgExtra = Math.ceil(pesoKg - ultimo.hasta);
  return ultimo[zona] + kgExtra * kgAdicional[zona];
}

// CTT 24h (tabla genérica de zonas, no depende de Murcia)
const TABLA_CTT: TramoZona[] = [
  { hasta: 1, Provincial: 3.90, Regional: 4.47, Peninsular: 4.58, "Peninsular+": 4.69 },
  { hasta: 2, Provincial: 4.12, Regional: 4.69, Peninsular: 4.81, "Peninsular+": 5.11 },
  { hasta: 3, Provincial: 4.33, Regional: 4.91, Peninsular: 5.04, "Peninsular+": 5.34 },
  { hasta: 4, Provincial: 4.55, Regional: 5.13, Peninsular: 5.28, "Peninsular+": 5.58 },
  { hasta: 5, Provincial: 4.70, Regional: 5.27, Peninsular: 5.44, "Peninsular+": 5.78 },
  { hasta: 10, Provincial: 6.15, Regional: 6.75, Peninsular: 6.97, "Peninsular+": 7.18 },
  { hasta: 15, Provincial: 7.47, Regional: 8.24, Peninsular: 8.45, "Peninsular+": 8.66 },
];
const CTT_KG_ADIC: TramoZona = { hasta: 0, Provincial: 0.29, Regional: 0.36, Peninsular: 0.42, "Peninsular+": 0.48 };
function recargoIntercityCTT(pesoKg: number): number {
  if (pesoKg <= 10) return 2.43;
  return 2.43 + (pesoKg - 10) * 0.10;
}

// Correos Express Paq24 (misma estructura de zonas que CTT, confirmado)
const TABLA_CEX: TramoZona[] = [
  { hasta: 1, Provincial: 5.60, Regional: 6.42, Peninsular: 6.59, "Peninsular+": 6.99 },
  { hasta: 2, Provincial: 5.96, Regional: 6.80, Peninsular: 6.98, "Peninsular+": 7.40 },
  { hasta: 3, Provincial: 6.35, Regional: 7.20, Peninsular: 7.40, "Peninsular+": 7.82 },
  { hasta: 4, Provincial: 6.73, Regional: 7.61, Peninsular: 7.82, "Peninsular+": 8.25 },
  { hasta: 5, Provincial: 7.09, Regional: 7.95, Peninsular: 8.21, "Peninsular+": 8.73 },
  { hasta: 10, Provincial: 9.55, Regional: 10.48, Peninsular: 10.82, "Peninsular+": 11.15 },
  { hasta: 15, Provincial: 11.81, Regional: 13.03, Peninsular: 13.37, "Peninsular+": 13.70 },
];
const CEX_KG_ADIC: TramoZona = { hasta: 0, Provincial: 0.48, Regional: 0.53, Peninsular: 0.64, "Peninsular+": 0.77 };
function recargoIntercityCEX(): number {
  return 2.0;
}

// MRW "Entrega en Domicilio" — Provincial=Urbano/Provincial, Regional=Reg.-Lim.,
// Peninsular y Peninsular+ = Nacional
const TABLA_MRW: TramoZona[] = [
  { hasta: 2, Provincial: 5.80, Regional: 6.33, Peninsular: 6.90, "Peninsular+": 6.90 },
  { hasta: 5, Provincial: 7.04, Regional: 8.23, Peninsular: 9.23, "Peninsular+": 9.23 },
  { hasta: 10, Provincial: 9.86, Regional: 10.19, Peninsular: 11.62, "Peninsular+": 11.62 },
  { hasta: 15, Provincial: 11.91, Regional: 12.14, Peninsular: 14.01, "Peninsular+": 14.01 },
  { hasta: 20, Provincial: 13.63, Regional: 14.09, Peninsular: 16.41, "Peninsular+": 16.41 },
];
const MRW_KG_ADIC: TramoZona = { hasta: 0, Provincial: 2.32, Regional: 3.58, Peninsular: 4.60, "Peninsular+": 4.60 };

// NACEX e-N@CEX — tarifa plana por rango de peso, sin zonas (confirmado "tercera
// ciudad" con el delegado de zona). Sustituye a la tarifa PlusPack anterior.
const TABLA_NACEX: { hasta: number; precio: number }[] = [
  { hasta: 2, precio: 7.50 },
  { hasta: 5, precio: 8.30 },
  { hasta: 10, precio: 9.60 },
  { hasta: 15, precio: 15.35 },
  { hasta: 20, precio: 17.50 },
];
function precioNacex(pesoKg: number): number {
  const tramo = TABLA_NACEX.find(t => pesoKg <= t.hasta);
  if (tramo) return tramo.precio;
  const ultimo = TABLA_NACEX[TABLA_NACEX.length - 1];
  const kgExtra = Math.ceil(pesoKg - ultimo.hasta);
  return ultimo.precio + kgExtra * 0.6;
}

// DHL RFP — plano, no depende de zona ni origen (confirmado por Paco/Francisco)
const TABLA_DHL_RFP: { hasta: number; precio: number }[] = [
  { hasta: 3, precio: 12.73 }, { hasta: 5, precio: 12.73 }, { hasta: 10, precio: 14.12 },
  { hasta: 15, precio: 16.81 }, { hasta: 20, precio: 19.51 }, { hasta: 25, precio: 22.09 },
  { hasta: 30, precio: 24.67 }, { hasta: 40, precio: 29.36 }, { hasta: 50, precio: 33.83 },
  { hasta: 60, precio: 38.23 }, { hasta: 70, precio: 42.66 }, { hasta: 80, precio: 47.11 },
];
const DHL_COMBUSTIBLE = 0.18; // confirmado por Paco, revisar periódicamente
function precioDHL(pesoKg: number): number {
  const tramo = TABLA_DHL_RFP.find(t => pesoKg <= t.hasta);
  const base = tramo ? tramo.precio : TABLA_DHL_RFP[TABLA_DHL_RFP.length - 1].precio;
  return base * (1 + DHL_COMBUSTIBLE);
}

// SEUR — tabla real del contrato firmado. Recargo recogida confirmado por
// Yasser: 0,60€. Colchón de seguridad 1,50€ por riesgo de bulto no encintable.
const TABLA_SEUR: TramoZona[] = [
  { hasta: 1, Provincial: 4.30, Regional: 4.77, Peninsular: 4.77, "Peninsular+": 4.77 },
  { hasta: 2, Provincial: 4.76, Regional: 5.29, Peninsular: 5.29, "Peninsular+": 5.29 },
  { hasta: 3, Provincial: 5.08, Regional: 5.64, Peninsular: 5.64, "Peninsular+": 5.64 },
  { hasta: 4, Provincial: 5.39, Regional: 5.99, Peninsular: 5.99, "Peninsular+": 5.99 },
  { hasta: 5, Provincial: 5.71, Regional: 6.33, Peninsular: 6.33, "Peninsular+": 6.33 },
  { hasta: 6, Provincial: 6.22, Regional: 6.92, Peninsular: 6.92, "Peninsular+": 7.02 },
  { hasta: 7, Provincial: 6.66, Regional: 7.38, Peninsular: 7.38, "Peninsular+": 7.64 },
  { hasta: 8, Provincial: 7.07, Regional: 7.86, Peninsular: 7.86, "Peninsular+": 8.33 },
  { hasta: 9, Provincial: 7.50, Regional: 8.34, Peninsular: 8.34, "Peninsular+": 9.14 },
  { hasta: 10, Provincial: 7.93, Regional: 8.82, Peninsular: 8.82, "Peninsular+": 10.21 },
  { hasta: 15, Provincial: 9.65, Regional: 10.72, Peninsular: 10.72, "Peninsular+": 12.78 },
  { hasta: 20, Provincial: 11.92, Regional: 13.25, Peninsular: 13.25, "Peninsular+": 16.35 },
  { hasta: 25, Provincial: 14.56, Regional: 16.18, Peninsular: 16.18, "Peninsular+": 21.03 },
  { hasta: 30, Provincial: 16.73, Regional: 18.60, Peninsular: 18.60, "Peninsular+": 25.10 },
];
const SEUR_KG_ADIC: TramoZona = { hasta: 0, Provincial: 0.47, Regional: 0.51, Peninsular: 0.51, "Peninsular+": 0.70 };
function recargoRecogidaSEUR(): number {
  return 0.60;
}
function colchonBultoIrregularSEUR(): number {
  return 1.50;
}

// GLS — tabla "24 HORAS". Recargo Interciudad confirmado: 3,00€ fijo.
const TABLA_GLS: TramoZona[] = [
  { hasta: 1, Provincial: 5.40, Regional: 6.10, Peninsular: 6.70, "Peninsular+": 6.70 },
  { hasta: 3, Provincial: 5.60, Regional: 6.20, Peninsular: 7.00, "Peninsular+": 7.00 },
  { hasta: 5, Provincial: 5.80, Regional: 6.40, Peninsular: 7.30, "Peninsular+": 7.30 },
  { hasta: 10, Provincial: 6.10, Regional: 6.90, Peninsular: 8.20, "Peninsular+": 8.20 },
  { hasta: 15, Provincial: 6.50, Regional: 8.50, Peninsular: 10.50, "Peninsular+": 10.50 },
];
const GLS_KG_ADIC: TramoZona = { hasta: 0, Provincial: 0.34, Regional: 0.44, Peninsular: 0.54, "Peninsular+": 0.54 };
function recargoInterciudadGLS(): number {
  return 3.00;
}

// ─────────────────────────────────────────────────────────────────────────
// 2b. Tablas de tarifas INSULARES (Baleares / Canarias)
//     Revisadas contra los PDF firmados (DHL, Correos Express, MRW, CTT).
// ─────────────────────────────────────────────────────────────────────────
type TramoFlat = { hasta: number; precio: number };

// Fuel estimado para agencias cuyo suplemento NO está incluido en tarifa
// (CTT y Correos Express: 0% de bonificación). Se calcula sobre el porte.
// Valor prudente; revisar con la primera factura real.
const FUEL_ESTIMADO = 0.06;

// Búsqueda por tramo. Si el peso supera el último tramo se suma "kg adicional".
function buscarFlatInsular(tabla: TramoFlat[], pesoKg: number, kgAdicional: number): number {
  const tramo = tabla.find(t => pesoKg <= t.hasta);
  if (tramo) return tramo.precio;
  const ultimo = tabla[tabla.length - 1];
  return ultimo.precio + Math.ceil(pesoKg - ultimo.hasta) * kgAdicional;
}

// Convierte una lista de precios por kg (1kg, 2kg, 3kg…) en tramos.
function porKg(precios: number[]): TramoFlat[] {
  return precios.map((precio, i) => ({ hasta: i + 1, precio }));
}

// ── Zonas dentro de cada archipiélago, según CP ─────────────────────────
// Baleares: Mallorca 07000-07699. Menorca / Ibiza / Formentera = "Islas menores".
function esMallorca(cp: string): boolean {
  const n = parseInt((cp || "").trim().slice(0, 5), 10);
  return n >= 7000 && n <= 7699;
}
// Canarias: Gran Canaria (35000-35499) y Tenerife (38000-38699) = islas principales.
// Resto (Lanzarote, Fuerteventura, La Palma, La Gomera, El Hierro) = islas menores.
function esCanariasPrincipal(cp: string): boolean {
  const n = parseInt((cp || "").trim().slice(0, 5), 10);
  return (n >= 35000 && n <= 35499) || (n >= 38000 && n <= 38699);
}
// DHL: tarifa directa solo en capitales (Sta. Cruz 38001-38010, Las Palmas 35001-35018);
// el resto lleva "reexpedición".
function esCapitalCanariasDHL(cp: string): boolean {
  const n = parseInt((cp || "").trim().slice(0, 5), 10);
  return (n >= 38001 && n <= 38010) || (n >= 35001 && n <= 35018);
}

// --- DHL Baleares (columna "Baleares", contrato firmado) ---
const DHL_BALEARES: TramoFlat[] = [
  { hasta: 3, precio: 6.55 }, { hasta: 5, precio: 6.99 }, { hasta: 10, precio: 10.07 },
  { hasta: 15, precio: 12.28 }, { hasta: 20, precio: 14.48 }, { hasta: 25, precio: 16.64 },
  { hasta: 30, precio: 18.78 }, { hasta: 40, precio: 22.83 }, { hasta: 50, precio: 26.12 },
  { hasta: 60, precio: 29.44 }, { hasta: 70, precio: 32.76 }, { hasta: 80, precio: 50.15 },
];
// --- DHL Canarias Aéreo (Tenerife / Las Palmas) ---
const DHL_CANARIAS_AEREO: TramoFlat[] = [
  { hasta: 3, precio: 32.34 }, { hasta: 5, precio: 43.93 }, { hasta: 10, precio: 63.54 },
  { hasta: 15, precio: 82.44 }, { hasta: 20, precio: 94.28 }, { hasta: 25, precio: 108.65 },
  { hasta: 30, precio: 123.00 }, { hasta: 40, precio: 158.60 }, { hasta: 50, precio: 199.16 },
  { hasta: 60, precio: 252.77 }, { hasta: 70, precio: 285.73 }, { hasta: 80, precio: 350.87 },
];
// --- DHL reexpedición a localidades que no son la capital (Canarias) ---
const DHL_REEXPEDICION_CANARIAS: TramoFlat[] = [
  { hasta: 3, precio: 23.56 }, { hasta: 5, precio: 24.81 }, { hasta: 10, precio: 26.12 },
  { hasta: 15, precio: 26.50 }, { hasta: 20, precio: 26.89 }, { hasta: 25, precio: 28.16 },
  { hasta: 30, precio: 29.43 }, { hasta: 40, precio: 32.31 }, { hasta: 50, precio: 34.81 },
  { hasta: 60, precio: 37.45 }, { hasta: 70, precio: 39.99 }, { hasta: 80, precio: 42.59 },
];
const DHL_COMBUSTIBLE_INSULAR = 0.18;      // mismo % confirmado por DHL para la península
const DHL_ADUANA_CANARIAS = 23.50;         // gestión aduanera Canarias (valor > 150 €)
const DHL_ADUANA_CANARIAS_BAJO_VALOR = 5.00; // valor ≤ 150 €
const DHL_RECOGIDA_OTRA_PROVINCIA = 1.50;  // recogida en origen distinto al habitual

// --- Correos Express "Islas Express" (Península ↔ islas). OJO: NO es la
//     columna "Interislas" de Paq24, que es solo entre islas. ---
const CEX_BALEARES_MALLORCA: TramoFlat[] = [
  { hasta: 1, precio: 10.07 }, { hasta: 2, precio: 11.51 }, { hasta: 3, precio: 13.63 },
  { hasta: 4, precio: 14.74 }, { hasta: 5, precio: 16.04 }, { hasta: 10, precio: 21.69 },
  { hasta: 15, precio: 27.38 },
];
const CEX_BALEARES_MENORES: TramoFlat[] = [
  { hasta: 1, precio: 10.61 }, { hasta: 2, precio: 12.29 }, { hasta: 3, precio: 14.63 },
  { hasta: 4, precio: 16.03 }, { hasta: 5, precio: 17.58 }, { hasta: 10, precio: 24.57 },
  { hasta: 15, precio: 32.65 },
];
const CEX_CANARIAS_PRINCIPAL: TramoFlat[] = [
  { hasta: 1, precio: 12.39 }, { hasta: 2, precio: 18.23 }, { hasta: 3, precio: 23.62 },
  { hasta: 4, precio: 29.14 }, { hasta: 5, precio: 35.08 }, { hasta: 10, precio: 64.22 },
  { hasta: 15, precio: 94.24 },
];
const CEX_CANARIAS_MENORES: TramoFlat[] = [
  { hasta: 1, precio: 13.61 }, { hasta: 2, precio: 20.07 }, { hasta: 3, precio: 26.00 },
  { hasta: 4, precio: 32.07 }, { hasta: 5, precio: 38.62 }, { hasta: 10, precio: 70.64 },
  { hasta: 15, precio: 103.67 },
];
const CEX_KG_ADIC_ISLAS = { mallorca: 1.13, menoresBaleares: 1.42, canariasPrincipal: 6.19, canariasMenores: 6.81 };
const CEX_RECOGIDA_OTRO_PUNTO = 2.00;  // 0,40 €/envío, mínimo 2 € (como en península)
// Canarias: el contrato NO incluye DUA ni gestión aduanera.
//   Valor ≤150 €: origen península 20,85 (export.) | origen Canarias 6,85 + import. a península 16
//   Valor >150 €: 22 (export.) + 16 (import.) en ambos sentidos
function aduanaCEXCanarias(origenCanarias: boolean, valorMercancia?: number): number {
  const bajoValor = valorMercancia !== undefined && valorMercancia <= 150;
  if (bajoValor) return origenCanarias ? 6.85 + 16 : 20.85 + 0;
  return 22 + 16;
}

// --- MRW (tablas completas por kg, hasta 40 kg; contrato firmado) ---
const MRW_BALEARES: TramoFlat[] = porKg([
  9.01, 11.77, 14.58, 17.38, 22.30, 30.23, 32.81, 35.39, 37.97, 40.55,
  45.92, 48.50, 51.08, 53.66, 56.24, 61.64, 64.22, 66.80, 69.38, 71.96,
  79.39, 81.97, 84.55, 87.13, 89.74, 97.63, 100.21, 102.79, 105.37, 107.95,
  113.60, 116.18, 118.76, 121.34, 123.92, 129.83, 132.41, 134.99, 137.57, 140.15,
]);
const MRW_BALEARES_KG_ADIC = 3.60; // pendiente medio de 40 a 60 kg (212,15−140,15)/20
const MRW_CANARIAS_PRINCIPAL: TramoFlat[] = porKg([
  12.84, 16.74, 23.37, 27.27, 31.17, 37.79, 41.69, 45.59, 49.49, 53.39,
  59.97, 63.87, 67.77, 71.67, 75.57, 82.17, 86.07, 89.97, 93.87, 97.77,
  106.44, 110.34, 114.24, 118.14, 122.04, 131.14, 135.04, 138.94, 142.84, 146.74,
  153.56, 157.46, 161.36, 165.26, 169.16, 176.30, 180.20, 184.10, 188.00, 191.90,
]);
const MRW_CANARIAS_MENORES: TramoFlat[] = porKg([
  13.51, 18.07, 25.34, 29.90, 34.46, 41.76, 46.32, 50.88, 55.44, 60.00,
  67.26, 71.82, 76.38, 80.94, 85.50, 92.78, 97.34, 101.90, 106.46, 111.02,
  120.35, 124.91, 129.47, 134.03, 138.59, 148.34, 152.90, 157.46, 162.02, 166.58,
  174.10, 178.66, 183.22, 187.78, 192.34, 200.14, 204.70, 209.26, 213.82, 218.38,
]);
const MRW_CANARIAS_KG_ADIC = 4.92; // pendiente 40→60 kg (290,30−191,90)/20
// Nota: MRW confirmó que el combustible va incluido en su tarifa.

// --- CTT Canarias Aéreo 24h (incluye DUA y GAS) ---
// Según contrato, los envíos entre zonas distintas se calculan SUMANDO la tarifa de
// la zona de origen + la de destino → se suma la tarifa peninsular (conservador).
const CTT_CANARIAS_AEREO_PRINCIPAL: TramoFlat[] = [
  { hasta: 1, precio: 17.32 }, { hasta: 2, precio: 21.95 }, { hasta: 3, precio: 26.55 },
  { hasta: 4, precio: 31.16 }, { hasta: 5, precio: 35.78 }, { hasta: 10, precio: 58.82 },
  { hasta: 15, precio: 81.85 },
];
const CTT_CANARIAS_AEREO_MENORES: TramoFlat[] = [
  { hasta: 1, precio: 20.58 }, { hasta: 2, precio: 25.76 }, { hasta: 3, precio: 30.94 },
  { hasta: 4, precio: 36.11 }, { hasta: 5, precio: 41.29 }, { hasta: 10, precio: 67.18 },
  { hasta: 15, precio: 93.06 },
];
const CTT_KG_ADIC_CANARIAS = { principal: 4.61, menores: 5.25 };
const CTT_MAX_KG_BULTO = 30;


// ─────────────────────────────────────────────────────────────────────────
// 3. Función pública del motor — PENÍNSULA
// ─────────────────────────────────────────────────────────────────────────
export type PrecioAgencia = { key: string; precio: number };

const AGENCIAS_ACTIVAS = ["CTT Express", "MRW", "NACEX", "Correos Express", "DHL", "SEUR", "GLS"];

export async function calcularPreciosAgencias(
  pesoKg: number,
  provinciaOrigen: string,
  provinciaDestino: string,
  agenciasDisponibles: string[],
  margen: number = MARGEN_COMERCIAL
): Promise<PrecioAgencia[]> {
  const zona = determinarZona(provinciaOrigen, provinciaDestino);
  const resultados: PrecioAgencia[] = [];

  const activas = agenciasDisponibles.filter(a => AGENCIAS_ACTIVAS.includes(a));

  for (const agencia of activas) {
    let costeReal = 0;

    if (agencia === "CTT Express") {
      costeReal = buscarPorZona(TABLA_CTT, CTT_KG_ADIC, pesoKg, zona) + recargoIntercityCTT(pesoKg);
    } else if (agencia === "Correos Express") {
      costeReal = buscarPorZona(TABLA_CEX, CEX_KG_ADIC, pesoKg, zona) + recargoIntercityCEX();
    } else if (agencia === "MRW") {
      costeReal = buscarPorZona(TABLA_MRW, MRW_KG_ADIC, pesoKg, zona);
    } else if (agencia === "NACEX") {
      costeReal = precioNacex(pesoKg);
    } else if (agencia === "DHL") {
      costeReal = precioDHL(pesoKg);
    } else if (agencia === "SEUR") {
      costeReal = buscarPorZona(TABLA_SEUR, SEUR_KG_ADIC, pesoKg, zona) + recargoRecogidaSEUR() + colchonBultoIrregularSEUR();
    } else if (agencia === "GLS") {
      costeReal = buscarPorZona(TABLA_GLS, GLS_KG_ADIC, pesoKg, zona) + recargoInterciudadGLS();
    } else {
      continue;
    }

    resultados.push({ key: agencia, precio: Math.round((costeReal + margen) * 100) / 100 });
  }

  if (agenciasDisponibles.includes("Mis Medios")) {
    resultados.push({ key: "Mis Medios", precio: 0 });
  }

  return resultados;
}

// ─────────────────────────────────────────────────────────────────────────
// 4. Función pública del motor — ISLAS (Baleares / Canarias)
// ─────────────────────────────────────────────────────────────────────────
// Agencias con tarifa insular en contrato:
//   Baleares: DHL, Correos Express, MRW
//   Canarias: DHL, Correos Express, MRW, CTT
// (CTT Baleares queda fuera hasta que CTT confirme cómo aplicar la "suma de zonas".)
const AGENCIAS_INSULARES: Record<Exclude<TipoInsular, null>, string[]> = {
  baleares: ["DHL", "Correos Express", "MRW"],
  canarias: ["DHL", "Correos Express", "MRW", "CTT Express"],
};

export type OpcionesInsulares = {
  cpOrigen?: string;
  cpDestino?: string;
  /** Valor de la mercancía en €. Si no se indica se asume ALTO valor (>150 €, caso más caro). */
  valorMercancia?: number;
};

const r2 = (n: number) => Math.round(n * 100) / 100;

export async function calcularPreciosInsulares(
  pesoKg: number,
  tipoInsular: Exclude<TipoInsular, null>,
  agenciasDisponibles: string[],
  margen: number = MARGEN_COMERCIAL,
  opciones: OpcionesInsulares = {}
): Promise<PrecioAgencia[]> {
  const resultados: PrecioAgencia[] = [];
  const activas = agenciasDisponibles.filter(a => AGENCIAS_INSULARES[tipoInsular].includes(a));

  const cpO = opciones.cpOrigen || "";
  const cpD = opciones.cpDestino || "";
  // CP del lado insular (para distinguir Mallorca/menores y principales/menores)
  const cpIsla = detectarTipoInsular(cpD) === tipoInsular ? cpD : cpO;
  const origenCanarias = detectarTipoInsular(cpO) === "canarias";
  const valor = opciones.valorMercancia;

  for (const agencia of activas) {
    let costeReal = 0;

    if (agencia === "DHL") {
      if (tipoInsular === "baleares") {
        const porte = buscarFlatInsular(DHL_BALEARES, pesoKg, 0.33);
        costeReal = porte * (1 + DHL_COMBUSTIBLE_INSULAR) + DHL_RECOGIDA_OTRA_PROVINCIA;
      } else {
        let porte = buscarFlatInsular(DHL_CANARIAS_AEREO, pesoKg, 5.00);
        if (!esCapitalCanariasDHL(cpIsla)) {
          porte += buscarFlatInsular(DHL_REEXPEDICION_CANARIAS, pesoKg, 0.40);
        }
        const aduana = valor !== undefined && valor <= 150 ? DHL_ADUANA_CANARIAS_BAJO_VALOR : DHL_ADUANA_CANARIAS;
        costeReal = porte * (1 + DHL_COMBUSTIBLE_INSULAR) + aduana + DHL_RECOGIDA_OTRA_PROVINCIA;
      }
    } else if (agencia === "Correos Express") {
      let porte: number;
      if (tipoInsular === "baleares") {
        porte = esMallorca(cpIsla)
          ? buscarFlatInsular(CEX_BALEARES_MALLORCA, pesoKg, CEX_KG_ADIC_ISLAS.mallorca)
          : buscarFlatInsular(CEX_BALEARES_MENORES, pesoKg, CEX_KG_ADIC_ISLAS.menoresBaleares);
      } else {
        porte = esCanariasPrincipal(cpIsla)
          ? buscarFlatInsular(CEX_CANARIAS_PRINCIPAL, pesoKg, CEX_KG_ADIC_ISLAS.canariasPrincipal)
          : buscarFlatInsular(CEX_CANARIAS_MENORES, pesoKg, CEX_KG_ADIC_ISLAS.canariasMenores);
      }
      costeReal = porte * (1 + FUEL_ESTIMADO) + CEX_RECOGIDA_OTRO_PUNTO;
      if (tipoInsular === "canarias") costeReal += aduanaCEXCanarias(origenCanarias, valor);
    } else if (agencia === "MRW") {
      if (tipoInsular === "baleares") {
        costeReal = buscarFlatInsular(MRW_BALEARES, pesoKg, MRW_BALEARES_KG_ADIC);
      } else {
        costeReal = esCanariasPrincipal(cpIsla)
          ? buscarFlatInsular(MRW_CANARIAS_PRINCIPAL, pesoKg, MRW_CANARIAS_KG_ADIC)
          : buscarFlatInsular(MRW_CANARIAS_MENORES, pesoKg, MRW_CANARIAS_KG_ADIC);
      }
    } else if (agencia === "CTT Express" && tipoInsular === "canarias") {
      if (pesoKg > CTT_MAX_KG_BULTO) continue; // máximo 30 kg por bulto
      const principal = esCanariasPrincipal(cpIsla);
      const tramoIsla = principal
        ? buscarFlatInsular(CTT_CANARIAS_AEREO_PRINCIPAL, pesoKg, CTT_KG_ADIC_CANARIAS.principal)
        : buscarFlatInsular(CTT_CANARIAS_AEREO_MENORES, pesoKg, CTT_KG_ADIC_CANARIAS.menores);
      // Suma de zonas origen + destino (contrato CTT): se añade la tarifa peninsular
      const tramoPeninsula = buscarPorZona(TABLA_CTT, CTT_KG_ADIC, pesoKg, "Peninsular");
      costeReal = (tramoIsla + tramoPeninsula) * (1 + FUEL_ESTIMADO) + recargoIntercityCTT(pesoKg);
    } else {
      continue;
    }

    resultados.push({ key: agencia, precio: r2(costeReal + margen) });
  }

  if (agenciasDisponibles.includes("Mis Medios")) {
    resultados.push({ key: "Mis Medios", precio: 0 });
  }

  return resultados;
}

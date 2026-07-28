// lib/motorPrecios.ts
//
// Motor de cálculo de tarifas de transporte.
// Agencias activas: CTT, MRW, NACEX, Correos Express, DHL, SEUR.
// GLS queda excluida hasta cerrar su tarifa.
//
// ⚠️ SEUR es una ESTIMACIÓN PROVISIONAL: el mapeo de zonas y la ausencia de
// recargo de recogida no están confirmados por escrito por SEUR. Revisar en
// cuanto lleguen facturas reales o respuesta de Yasser/ticket de soporte.
//
// Margen comercial fijo aplicado sobre el coste real de cada agencia.
export const MARGEN_COMERCIAL = 1.5;

// ─────────────────────────────────────────────────────────────────────────
// 1. Provincias limítrofes y comunidades autónomas (para determinar zona)
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

/** Determina la zona tarifaria CTT/Correos Express en base a las provincias reales. */
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
// 2. Tablas de tarifas por agencia (peso → precio por zona)
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
// Recargo Intercity confirmado por Lidia: 0,57€/envío, mínimo 2,43€ hasta 10kg (+0,10€/kg extra)
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
// Recargo confirmado: 0,40€/envío, mínimo 2€
function recargoIntercityCEX(): number {
  return 2.0;
}

// MRW "Entrega en Domicilio" — se usa Provincial como equivalente a Urbano/Provincial de MRW,
// Regional = Reg.-Lim., Peninsular y Peninsular+ = Nacional (MRW no distingue "+")
const TABLA_MRW: TramoZona[] = [
  { hasta: 2, Provincial: 5.80, Regional: 6.33, Peninsular: 6.90, "Peninsular+": 6.90 },
  { hasta: 5, Provincial: 7.04, Regional: 8.23, Peninsular: 9.23, "Peninsular+": 9.23 },
  { hasta: 10, Provincial: 9.86, Regional: 10.19, Peninsular: 11.62, "Peninsular+": 11.62 },
  { hasta: 15, Provincial: 11.91, Regional: 12.14, Peninsular: 14.01, "Peninsular+": 14.01 },
  { hasta: 20, Provincial: 13.63, Regional: 14.09, Peninsular: 16.41, "Peninsular+": 16.41 },
];
const MRW_KG_ADIC: TramoZona = { hasta: 0, Provincial: 2.32, Regional: 3.58, Peninsular: 4.60, "Peninsular+": 4.60 };
// MRW: combustible y recogida en tercera ciudad ya incluidos en el precio (confirmado)

// NACEX e-N@CEX — tarifa plana por rango de peso, sin zonas (confirmado "tercera
// ciudad" con el delegado de zona). Sustituye a la tarifa PlusPack anterior,
// ya que solo existe un contrato vigente con NACEX.
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
  // sin tabla de kg adicional confirmada más allá de 20kg; se extrapola de forma conservadora
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

// SEUR — tabla real del contrato firmado (columnas peninsulares).
// Mapeo de zonas: Provincial→Provincial, Corto→Regional, Medio→Peninsular,
// Largo→Peninsular+
// Recargo de recogida fuera de domicilio CONFIRMADO por Yasser: 0,60€ fijo
// (no es un mínimo variable como CTT, es un importe plano por envío).
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
  return 0.60; // confirmado por Yasser
}
// Colchón de seguridad: 1,50€ fijo por riesgo de "bulto no encintable" (1,50€)
// dado que muchas piezas de recambio tienen formas irregulares (tubos de
// escape, paragolpes, etc.) y podrían caer en esa categoría. Revisar y
// ajustar cuando se tengan facturas reales que confirmen la frecuencia real.
function colchonBultoIrregularSEUR(): number {
  return 1.50;
}

// GLS — tabla "24 HORAS" (servicio estándar). Solo 3 zonas: Provincial/
// Regional/Nacional. GLS no distingue Peninsular de Peninsular+, igual que
// MRW, así que ambas columnas usan el mismo valor "Nacional".
const TABLA_GLS: TramoZona[] = [
  { hasta: 1, Provincial: 5.40, Regional: 6.10, Peninsular: 6.70, "Peninsular+": 6.70 },
  { hasta: 3, Provincial: 5.60, Regional: 6.20, Peninsular: 7.00, "Peninsular+": 7.00 },
  { hasta: 5, Provincial: 5.80, Regional: 6.40, Peninsular: 7.30, "Peninsular+": 7.30 },
  { hasta: 10, Provincial: 6.10, Regional: 6.90, Peninsular: 8.20, "Peninsular+": 8.20 },
  { hasta: 15, Provincial: 6.50, Regional: 8.50, Peninsular: 10.50, "Peninsular+": 10.50 },
];
const GLS_KG_ADIC: TramoZona = { hasta: 0, Provincial: 0.34, Regional: 0.44, Peninsular: 0.54, "Peninsular+": 0.54 };
// Recargo Interciudad confirmado en tarifa: 3,00€ fijo por envío (siempre
// aplica en tu caso, ya que nunca recoges en tu propia dirección)
function recargoInterciudadGLS(): number {
  return 3.00;
}

// ─────────────────────────────────────────────────────────────────────────
// 3. Función pública del motor
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

  // Mis Medios: sin coste, siempre disponible si estaba en la lista
  if (agenciasDisponibles.includes("Mis Medios")) {
    resultados.push({ key: "Mis Medios", precio: 0 });
  }

  return resultados;
}
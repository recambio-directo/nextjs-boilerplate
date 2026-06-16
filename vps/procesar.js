require("dotenv").config({ path: "/opt/ftp-processor/.env" });
const fs = require("fs");
const https = require("https");
const iconv = require("/opt/ftp-processor/node_modules/iconv-lite");
const SUPABASE_URL = "gharfhzqowuyxighnqbz.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const PROVEEDOR_ID = process.env.PROVEEDOR_ID;
const PROVEEDOR_NOMBRE = process.env.PROVEEDOR_NOMBRE;
const CSV_PATH = process.env.CSV_PATH || "/tmp/test.csv";
const TIPO = process.env.TIPO_REFERENCIAS || "IAM";
const LOTE = 500;

function req(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = { hostname: SUPABASE_URL, path, method, headers: { "Content-Type": "application/json", "apikey": SUPABASE_KEY, "Authorization": "Bearer " + SUPABASE_KEY, "Prefer": "return=minimal" } };
    if (data) opts.headers["Content-Length"] = Buffer.byteLength(data);
    const r = https.request(opts, res => { let d = ""; res.on("data", c => d += c); res.on("end", () => resolve({ status: res.statusCode, body: d })); });
    r.on("error", reject);
    if (data) r.write(data);
    r.end();
  });
}

async function getTipo() {
  try {
    const r = await req("GET", "/rest/v1/usuarios?id=eq." + PROVEEDOR_ID + "&select=tipo_referencias_ftp,provincia", null);
    const d = JSON.parse(r.body);
    const row = d?.[0];
    global._provincia = row?.provincia || null;
    return row?.tipo_referencias_ftp || TIPO;
  } catch { return TIPO; }
}

async function main() {
  console.log("Procesando: " + CSV_PATH);
  if (!fs.existsSync(CSV_PATH)) { console.error("No encontrado"); process.exit(1); }

  const tipo = await getTipo();
  console.log("Tipo: " + tipo);
  console.log("Provincia: " + (global._provincia || "sin provincia"));

  const buf = fs.readFileSync(CSV_PATH);
  const contenido = iconv.decode(buf, "win1252");
  const lineas = contenido.split("\n").filter(l => l.trim());
  console.log("Filas: " + lineas.length);

  const sep = lineas[0].includes(";") ? ";" : ",";
  const cab = isNaN(parseFloat(lineas[0].split(sep)[2] ? lineas[0].split(sep)[2].replace(",", ".") : "x"));
  const ini = cab ? 1 : 0;

  // ============================================================
  // FORMATO CSV GRAN VIA (8 columnas separadas por ;)
  // Col 0: Referencia
  // Col 1: Descripcion
  // Col 2: Precio venta Cliente (NO usar)
  // Col 3: Descuento 1 (NO usar)
  // Col 4: Precio venta Neto <- PRECIO REAL
  // Col 5: Descripcion marca <- MARCA
  // Col 6: Stocks disponible <- STOCK
  // Col 7: Importe Casco <- ECOTASA/CASCO
  // ============================================================

  // Primera pasada: detectar cascos
  const cascos = new Map();
  for (let i = ini; i < lineas.length; i++) {
    const c = lineas[i].split(sep);
    const r = (c[0] || "").trim().toUpperCase();
    const d = (c[1] || "").trim().toUpperCase();
    const p = parseFloat((c[4] || "").trim().replace(",", "."));
    if (d.includes("CASCO") && r.endsWith("C") && p > 0) cascos.set(r.slice(0, -1), p);
  }

  // Segunda pasada: procesar referencias
  const filas = [];
  for (let i = ini; i < lineas.length; i++) {
    const c = lineas[i].split(sep);
    const r = (c[0] || "").trim().toUpperCase();
    const d = (c[1] || "").trim().toUpperCase();
    const p = parseFloat((c[4] || "").trim().replace(",", "."));
    const m = (c[5] || "").trim().toUpperCase();
    const s = parseInt((c[6] || "").trim());
    const imp = parseFloat((c[7] || "").trim().replace(",", ".")) || 0;

    if (d.includes("CASCO")) continue;
    if (r === "" || d === "") continue;
    if (isNaN(p) || p <= 0) continue;
    if (isNaN(s) || s < 0) continue;

    filas.push({
      referencia: r,
      descripcion: d,
      marca: m || "SIN MARCA",
      precio: p,
      stock: s,
      impuesto: imp || cascos.get(r) || 0,
      tipo,
    });
  }

  console.log("Referencias validas: " + filas.length);
  if (cascos.size > 0) console.log("Cascos detectados: " + cascos.size);

  // Borrar stock anterior de este proveedor
  console.log("Borrando anterior...");
  await req("DELETE", "/rest/v1/piezas_publicadas?proveedor_id=eq." + PROVEEDOR_ID, null);

  // Insertar en lotes
  let ins = 0;
  for (let i = 0; i < filas.length; i += LOTE) {
    const lote = filas.slice(i, i + LOTE).map(f => ({
      proveedor_id: PROVEEDOR_ID,
      proveedor_nombre: PROVEEDOR_NOMBRE,
      referencia: f.referencia,
      descripcion: f.descripcion,
      marca: f.marca,
      precio: f.precio,
      stock: f.stock,
      impuesto: f.impuesto,
      tipo: f.tipo,
      provincia: global._provincia || null,
    }));
    const res = await req("POST", "/rest/v1/piezas_publicadas", lote);
    if (res.status >= 400) console.error("Error lote: " + res.body);
    else ins += lote.length;
    if (ins % 5000 === 0) console.log(ins + " insertadas...");
  }

  console.log("Fin - insertadas:" + ins);
}

main().catch(console.error);
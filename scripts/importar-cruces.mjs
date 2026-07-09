/**
 * Recambio Directo · Importador de cruces OEM ↔ IAM
 * ---------------------------------------------------
 * Procesa todos los crosses_<MARCA>_OEM.csv de un directorio
 * y sube a Supabase SOLO las equivalencias de referencias:
 *   marca_iam + referencia_iam ↔ marca_oem + referencia_oem
 *
 * La descripción del producto la pone el proveedor al subir su pieza.
 * Estos cruces son solo el puente entre referencias.
 *
 * Uso:
 *   node importar-cruces.mjs ./datos-cruces
 */

import { createClient } from '@supabase/supabase-js';
import iconv from 'iconv-lite';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, basename } from 'node:path';

// ----------------------------------------------------------------
// Config
// ----------------------------------------------------------------
const DIR = process.argv[2] ?? './datos-cruces';
const BATCH_SIZE = 500;

const limpiar = (v) => (v ?? '').trim().replace(/^["']|["']$/g, '');
const SUPABASE_URL = limpiar(process.env.NEXT_PUBLIC_SUPABASE_URL);
const SERVICE_KEY = limpiar(process.env.SUPABASE_SERVICE_ROLE_KEY);

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

// ----------------------------------------------------------------
// Utilidades de parseo
// ----------------------------------------------------------------

function limpiarCampo(campo) {
  return campo.replace(/^=?"?|"?$/g, '').trim();
}

function normalizarRef(ref) {
  return ref.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function splitCSV(linea) {
  const campos = [];
  let actual = '';
  let enComillas = false;
  for (const ch of linea) {
    if (ch === '"') enComillas = !enComillas;
    else if (ch === ';' && !enComillas) { campos.push(actual); actual = ''; }
    else actual += ch;
  }
  campos.push(actual);
  return campos;
}

// ----------------------------------------------------------------
// Procesado de un fichero — solo referencias, sin tipo_pieza
// ----------------------------------------------------------------
function parsearFichero(ruta) {
  const buffer = readFileSync(ruta);
  const contenido = iconv.decode(buffer, 'win1251');
  const lineas = contenido.split(/\r?\n/).filter((l) => l.trim());

  const cabecera = splitCSV(lineas[0]).map((c) => c.trim());
  const idx = {
    marcaIam: cabecera.indexOf('mainART_BRANDS'),
    refIam: cabecera.indexOf('mainART_CODE_PARTS'),
    marcaOem: cabecera.indexOf('BRANDS'),
    refOemNorm: cabecera.indexOf('CODE_PARTS'),
    refOemVisual: cabecera.indexOf('CODE_PARTS_ADVANCED'),
  };

  // Solo necesitamos estas 5 columnas
  if (idx.marcaIam === -1 || idx.refIam === -1 || idx.marcaOem === -1 || idx.refOemNorm === -1) {
    console.log(`   ⚠️ Cabecera incompatible, saltando fichero`);
    return [];
  }

  const filas = [];
  const vistos = new Set();

  for (let i = 1; i < lineas.length; i++) {
    const c = splitCSV(lineas[i]);
    if (c.length < 5) continue;

    const marcaIam = limpiarCampo(c[idx.marcaIam]);
    const refIam = limpiarCampo(c[idx.refIam]);
    const marcaOem = limpiarCampo(c[idx.marcaOem]);
    const refOemVisual = idx.refOemVisual !== -1 ? limpiarCampo(c[idx.refOemVisual]) : '';
    const refOemNorm = normalizarRef(limpiarCampo(c[idx.refOemNorm]));
    const refIamNorm = normalizarRef(refIam);

    if (!marcaIam || !refIamNorm || !marcaOem || !refOemNorm) continue;

    const clave = `${marcaIam}|${refIamNorm}|${marcaOem}|${refOemNorm}`;
    if (vistos.has(clave)) continue;
    vistos.add(clave);

    filas.push({
      marca_iam: marcaIam,
      referencia_iam: refIam,
      referencia_iam_norm: refIamNorm,
      marca_oem: marcaOem,
      referencia_oem: refOemVisual || refOemNorm,
      referencia_oem_norm: refOemNorm,
    });
  }

  return filas;
}

// ----------------------------------------------------------------
// Subida por lotes
// ----------------------------------------------------------------
async function subirFilas(filas, etiqueta) {
  let subidas = 0;
  for (let i = 0; i < filas.length; i += BATCH_SIZE) {
    const lote = filas.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from('cruces_referencias')
      .upsert(lote, {
        onConflict: 'marca_iam,referencia_iam_norm,marca_oem,referencia_oem_norm',
        ignoreDuplicates: true,
      });

    if (error) {
      throw new Error(`[${etiqueta}] lote ${i / BATCH_SIZE + 1}: ${error.message}`);
    }
    subidas += lote.length;
    process.stdout.write(`\r   [${etiqueta}] ${subidas}/${filas.length} filas...`);
  }
  process.stdout.write('\n');
}

// ----------------------------------------------------------------
// Comprobación previa
// ----------------------------------------------------------------
async function comprobarConexion() {
  const { error } = await supabase
    .from('cruces_referencias')
    .select('id', { count: 'exact', head: true });

  if (error) {
    if (/api key|jwt|invalid/i.test(error.message)) {
      throw new Error(
        `Clave de Supabase inválida (${error.message}).\n` +
        `   → Revisa SUPABASE_SERVICE_ROLE_KEY en .env.local.`
      );
    }
    if (/does not exist|relation/i.test(error.message)) {
      throw new Error(
        `La tabla cruces_referencias no existe.\n` +
        `   → Ejecuta primero 001_cruces_referencias.sql en Supabase.`
      );
    }
    throw new Error(error.message);
  }
  console.log('🔑 Conexión con Supabase verificada.\n');
}

// ----------------------------------------------------------------
// Main
// ----------------------------------------------------------------
async function main() {
  const dir = resolve(DIR);
  const ficheros = readdirSync(dir).filter((f) => /^crosses_.*\.csv$/i.test(f));

  if (ficheros.length === 0) {
    throw new Error(`No hay ficheros crosses_*.csv en ${dir}`);
  }

  console.log(`📦 ${ficheros.length} fichero(s) encontrado(s) en ${dir}\n`);
  await comprobarConexion();

  let total = 0;
  let procesados = 0;
  for (const f of ficheros) {
    procesados++;
    const ruta = resolve(dir, f);
    console.log(`▶ [${procesados}/${ficheros.length}] ${f}...`);
    const filas = parsearFichero(ruta);
    console.log(`   ${filas.length} cruces únicos parseados`);
    await subirFilas(filas, f);
    total += filas.length;
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log(`\n✅ Importación completada: ${total} cruces procesados.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(`\n❌ ${err.message}`);
    process.exit(1);
  });

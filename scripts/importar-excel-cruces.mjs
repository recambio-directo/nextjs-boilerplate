/**
 * Importador genérico de cruces OEM desde Excel
 * Detecta automáticamente la estructura del fichero.
 *
 * Uso:
 *   node --env-file=.env.local scripts/importar-excel-cruces.mjs MARCA ruta/al/fichero.xlsx
 *
 * Ejemplos:
 *   node --env-file=.env.local scripts/importar-excel-cruces.mjs FARE ./FARE_-_OEM.xlsx
 *   node --env-file=.env.local scripts/importar-excel-cruces.mjs TALOSA ./TALOSA-OEM.xlsx
 */

import { createClient } from '@supabase/supabase-js';
import XLSX from 'xlsx';
import { resolve } from 'node:path';

const MARCA = process.argv[2];
const ARCHIVO = process.argv[3];
const BATCH_SIZE = 250;

if (!MARCA || !ARCHIVO) {
  console.error('❌ Uso: node --env-file=.env.local scripts/importar-excel-cruces.mjs MARCA ruta/fichero.xlsx');
  console.error('   Ejemplo: node --env-file=.env.local scripts/importar-excel-cruces.mjs FARE ./FARE_-_OEM.xlsx');
  process.exit(1);
}

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

function normalizarRef(ref) {
  return ref.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

async function comprobarConexion() {
  const { error } = await supabase
    .from('cruces_referencias')
    .select('id', { count: 'exact', head: true });
  if (error) throw new Error(`Error conectando con Supabase: ${error.message}`);
  console.log('🔑 Conexión con Supabase verificada.\n');
}

async function main() {
  await comprobarConexion();

  const ruta = resolve(ARCHIVO);
  console.log(`📄 Leyendo ${ruta}...`);
  console.log(`🏭 Marca: ${MARCA}\n`);

  const wb = XLSX.readFile(ruta);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

  // Detectar estructura: 2 columnas (REF_IAM, OEM) o 3 columnas (REF_IAM, DESCRIPCION, OEM)
  const numCols = (data[0] || []).length;
  const colIam = 0;
  const colOem = numCols >= 3 ? 2 : 1;

  console.log(`   Columnas detectadas: ${numCols} (IAM=col${colIam + 1}, OEM=col${colOem + 1})`);

  const filas = [];
  const vistos = new Set();

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < colOem + 1) continue;

    const refIam = String(row[colIam] || '').trim();
    const refOemRaw = String(row[colOem] || '').trim().replace(/\*$/, '');

    if (!refIam || !refOemRaw) continue;

    const refIamNorm = normalizarRef(refIam);
    const refOemNorm = normalizarRef(refOemRaw);

    if (!refIamNorm || !refOemNorm) continue;

    const clave = `${MARCA}|${refIamNorm}|OEM|${refOemNorm}`;
    if (vistos.has(clave)) continue;
    vistos.add(clave);

    filas.push({
      marca_iam: MARCA.toUpperCase(),
      referencia_iam: refIam,
      referencia_iam_norm: refIamNorm,
      marca_oem: 'OEM',
      referencia_oem: refOemRaw,
      referencia_oem_norm: refOemNorm,
    });
  }

  console.log(`   ${filas.length} cruces únicos parseados\n`);

  if (filas.length === 0) {
    console.log('⚠️ No se encontraron cruces válidos en el fichero.');
    return;
  }

  // Subir por lotes
  let subidas = 0;
  for (let i = 0; i < filas.length; i += BATCH_SIZE) {
    const lote = filas.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from('cruces_referencias')
      .upsert(lote, {
        onConflict: 'marca_iam,referencia_iam_norm,marca_oem,referencia_oem_norm',
        ignoreDuplicates: true,
      });

    if (error) throw new Error(`Error en lote ${i / BATCH_SIZE + 1}: ${error.message}`);
    subidas += lote.length;
    process.stdout.write(`\r   ${subidas}/${filas.length} filas...`);

    // Pausa entre lotes para no saturar Supabase
    if (i + BATCH_SIZE < filas.length) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  console.log(`\n\n✅ ${MARCA.toUpperCase()} importado: ${filas.length} cruces.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(`\n❌ ${err.message}`);
    process.exit(1);
  });

/**
 * Importador de cruces TALOSA (formato Excel)
 * Columnas: TALOSA (ref IAM) | DESCRIPCION | OEM (ref OEM)
 *
 * Uso: node --env-file=.env.local scripts/importar-talosa.mjs ruta/al/TALOSA-OEM.xlsx
 */

import { createClient } from '@supabase/supabase-js';
import XLSX from 'xlsx';
import { resolve } from 'node:path';

const ARCHIVO = process.argv[2];
const BATCH_SIZE = 250;

if (!ARCHIVO) {
  console.error('❌ Uso: node --env-file=.env.local scripts/importar-talosa.mjs ruta/al/TALOSA-OEM.xlsx');
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
  if (error) {
    throw new Error(`Error conectando con Supabase: ${error.message}`);
  }
  console.log('🔑 Conexión con Supabase verificada.\n');
}

async function main() {
  await comprobarConexion();

  const ruta = resolve(ARCHIVO);
  console.log(`📄 Leyendo ${ruta}...\n`);

  const wb = XLSX.readFile(ruta);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

  // Saltar cabecera
  const filas = [];
  const vistos = new Set();

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < 3) continue;

    const refIam = String(row[0] || '').trim();
    const refOemRaw = String(row[2] || '').trim().replace(/\*$/, ''); // Quitar asterisco final

    if (!refIam || !refOemRaw) continue;

    const refIamNorm = normalizarRef(refIam);
    const refOemNorm = normalizarRef(refOemRaw);

    if (!refIamNorm || !refOemNorm) continue;

    // La columna OEM no trae marca OEM, así que dejamos vacío
    // El cruce sigue funcionando porque se busca por referencia normalizada
    const clave = `TALOSA|${refIamNorm}|OEM|${refOemNorm}`;
    if (vistos.has(clave)) continue;
    vistos.add(clave);

    filas.push({
      marca_iam: 'TALOSA',
      referencia_iam: refIam,
      referencia_iam_norm: refIamNorm,
      marca_oem: 'OEM',
      referencia_oem: refOemRaw,
      referencia_oem_norm: refOemNorm,
    });
  }

  console.log(`   ${filas.length} cruces únicos parseados\n`);

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

    if (error) {
      throw new Error(`Error en lote ${i / BATCH_SIZE + 1}: ${error.message}`);
    }
    subidas += lote.length;
    process.stdout.write(`\r   ${subidas}/${filas.length} filas...`);
  }

  console.log(`\n\n✅ TALOSA importado: ${filas.length} cruces.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(`\n❌ ${err.message}`);
    process.exit(1);
  });

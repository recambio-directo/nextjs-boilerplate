// app/api/cruce-referencias/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function normalizarRef(ref: string): string {
  return ref.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const oem = searchParams.get('oem');
  const ref = searchParams.get('ref');
  const entrada = oem ?? ref;

  if (!entrada || normalizarRef(entrada).length < 3) {
    return NextResponse.json(
      { error: 'Parámetro "oem" o "ref" requerido (mínimo 3 caracteres)' },
      { status: 400 }
    );
  }

  const refNorm = normalizarRef(entrada);

  // Modo OEM→IAM
  if (oem) {
    const { data, error } = await supabase
      .from('cruces_referencias')
      .select('marca_iam, referencia_iam')
      .eq('referencia_oem_norm', refNorm)
      .limit(500);

    if (error) {
      console.error('[cruce-referencias] Supabase:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const vistos = new Set<string>();
    const equivalencias = (data ?? []).filter((d) => {
      const k = `${d.marca_iam}|${normalizarRef(d.referencia_iam)}`;
      if (vistos.has(k)) return false;
      vistos.add(k);
      return true;
    });

    return NextResponse.json({
      consulta: entrada,
      total: equivalencias.length,
      equivalencias_iam: equivalencias,
    }, { headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' } });
  }

  // Modo bidireccional
  const { data, error } = await supabase.rpc('buscar_equivalencias', { ref_input: entrada });

  if (error) {
    console.error('[cruce-referencias] RPC:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const iam: { marca: string; referencia: string }[] = [];
  const oems: { marca: string; referencia: string }[] = [];
  for (const fila of data ?? []) {
    const eq = { marca: fila.marca, referencia: fila.referencia };
    if (fila.direccion === 'oem_a_iam') iam.push(eq);
    else oems.push(eq);
  }

  return NextResponse.json({
    consulta: entrada,
    equivalencias_iam: iam,
    equivalencias_oem: oems,
  }, { headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' } });
}
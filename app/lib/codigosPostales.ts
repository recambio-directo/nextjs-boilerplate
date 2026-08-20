import { supabase } from "@/app/lib/supabase";

export async function buscarCP(cp: string): Promise<{poblacion: string; provincia: string} | null> {
  if (cp.length !== 5 || !/^\d{5}$/.test(cp)) return null;
  
  const { data, error } = await supabase
    .from("codigos_postales")
    .select("poblacion, provincia")
    .eq("cp", cp)
    .single();

  if (error || !data) return null;
  return { poblacion: data.poblacion, provincia: data.provincia };
}
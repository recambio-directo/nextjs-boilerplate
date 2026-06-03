import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  "https://gharfhzqowuyxighnqbz.supabase.co";

const supabaseKey =
  "sb_publishable_bh_LpFWtInmkCkZZVS2UIw_IImUDyb1";

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);
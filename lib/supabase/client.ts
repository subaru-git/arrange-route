import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const hasSupabase = Boolean(url && anon);

export function getSupabaseClient() {
  if (!url || !anon) {
    throw new Error("Supabase env vars are missing");
  }
  return createClient(url, anon);
}

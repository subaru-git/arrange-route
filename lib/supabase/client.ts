import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const hasSupabase = Boolean(url && (anon || serviceRole));
export const hasSupabaseAdmin = Boolean(url && serviceRole);

export function getSupabaseClient(options: { admin?: boolean } = {}) {
  const key = options.admin && serviceRole ? serviceRole : anon;

  if (!url || !key) {
    throw new Error("Supabase env vars are missing");
  }
  return createClient(url, key);
}

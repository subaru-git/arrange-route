const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.SUPABASE_PUBLISHABLE_KEY ??
  process.env.SUPABASE_ANON_KEY;

export const hasSupabaseAuthConfig = Boolean(supabaseUrl && supabasePublishableKey);

export function getSupabaseAuthConfig() {
  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error("Supabase URL and publishable key are required");
  }

  return {
    url: supabaseUrl,
    publishableKey: supabasePublishableKey,
  };
}

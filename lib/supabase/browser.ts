"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseAuthConfig } from "@/lib/supabase/config";

export function createBrowserSupabaseClient() {
  const { url, publishableKey } = getSupabaseAuthConfig();
  return createBrowserClient(url, publishableKey);
}

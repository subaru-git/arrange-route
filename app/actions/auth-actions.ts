"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { hasSupabaseAuthConfig } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function normalizeNext(value: FormDataEntryValue | string | null | undefined) {
  const next = String(value ?? "/scores");
  if (!next.startsWith("/") || next.startsWith("//")) return "/scores";
  return next;
}

function getOrigin() {
  const headerStore = headers();
  return (
    headerStore.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.VERCEL_URL?.replace(/^/, "https://") ??
    "http://localhost:3000"
  );
}

export async function signInWithGoogleAction(formData?: FormData) {
  const next = normalizeNext(formData?.get("next"));

  if (!hasSupabaseAuthConfig) {
    redirect(`/new?auth_error=missing_config`);
  }

  const supabase = createServerSupabaseClient();
  const redirectTo = `${getOrigin()}/auth/callback?next=${encodeURIComponent(next)}`;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
    },
  });

  if (error || !data.url) {
    redirect(`/new?auth_error=oauth`);
  }

  redirect(data.url);
}

export async function signOutAction() {
  if (hasSupabaseAuthConfig) {
    const supabase = createServerSupabaseClient();
    await supabase.auth.signOut();
  }

  redirect("/scores");
}

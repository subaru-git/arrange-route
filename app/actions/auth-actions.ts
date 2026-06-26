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
  const explicitOrigin = headerStore.get("origin");
  if (explicitOrigin) return explicitOrigin;

  const forwardedHost = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  if (forwardedHost) {
    const forwardedProto =
      headerStore.get("x-forwarded-proto") ?? (forwardedHost.startsWith("localhost") ? "http" : "https");
    return `${forwardedProto}://${forwardedHost}`;
  }

  const vercelUrl = process.env.VERCEL_URL ?? process.env.NEXT_PUBLIC_VERCEL_URL;
  if (vercelUrl) return vercelUrl.startsWith("http") ? vercelUrl : `https://${vercelUrl}`;

  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
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

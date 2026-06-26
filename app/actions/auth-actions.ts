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

function isLocalhostOrigin(origin: string) {
  try {
    const hostname = new URL(origin).hostname;
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  } catch {
    return false;
  }
}

function getVercelOrigin() {
  const vercelUrl =
    process.env.VERCEL_BRANCH_URL ?? process.env.VERCEL_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (!vercelUrl) return null;
  return vercelUrl.startsWith("http") ? vercelUrl : `https://${vercelUrl}`;
}

function getOrigin() {
  const headerStore = headers();
  const vercelOrigin = getVercelOrigin();
  const explicitOrigin = headerStore.get("origin");
  if (explicitOrigin && (!isLocalhostOrigin(explicitOrigin) || !vercelOrigin)) return explicitOrigin;

  const forwardedHost = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  if (forwardedHost) {
    const forwardedProto =
      headerStore.get("x-forwarded-proto") ?? (forwardedHost.startsWith("localhost") ? "http" : "https");
    const forwardedOrigin = `${forwardedProto}://${forwardedHost}`;
    if (!isLocalhostOrigin(forwardedOrigin) || !vercelOrigin) return forwardedOrigin;
  }

  if (vercelOrigin) return vercelOrigin;

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

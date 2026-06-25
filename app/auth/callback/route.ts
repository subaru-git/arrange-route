import { NextRequest, NextResponse } from "next/server";
import { syncProfileFromAuthUser } from "@/lib/profile-sync";
import { hasSupabaseAuthConfig } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function normalizeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/scores";
  return value;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = normalizeNext(requestUrl.searchParams.get("next"));

  if (code && hasSupabaseAuthConfig) {
    const supabase = createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        try {
          await syncProfileFromAuthUser(supabase, data.user);
        } catch (profileError) {
          console.error("Failed to sync profile from auth user", profileError);
        }
      }
      return NextResponse.redirect(new URL(next, requestUrl));
    }
  }

  return NextResponse.redirect(new URL("/scores?auth_error=callback", requestUrl));
}

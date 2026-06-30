import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|apple-icon.png|icon.png|arrange-route-icon.png|arrange-route-icon-source.png).*)",
  ],
};

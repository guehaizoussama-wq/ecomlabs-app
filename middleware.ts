import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";
import { resolveHost } from "@/lib/tenant/hosts";

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "";
  const resolution = resolveHost(host);

  response.headers.set("x-app-host-kind", resolution.kind);
  response.headers.set("x-request-host", resolution.host);

  if (resolution.tenantSlug) {
    response.headers.set("x-tenant-slug", resolution.tenantSlug);
  }

  if (resolution.kind === "unknown" && !request.nextUrl.pathname.startsWith("/_next")) {
    return NextResponse.redirect(new URL("/", request.url), {
      headers: response.headers
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};

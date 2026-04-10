import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { clientEnv } from "@/lib/env";
import { resolveHost } from "@/lib/tenant/hosts";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, redirectTo: "/auth/login" }, { status: 401 });
  }

  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "";
  const resolution = resolveHost(host);

  if (user.isSuperAdmin) {
    return NextResponse.json({ ok: true, redirectTo: "/super-admin/dashboard" });
  }

  if (resolution.kind === "tenant") {
    return NextResponse.json({ ok: true, redirectTo: "/dashboard" });
  }

  if (user.organizationSlug) {
    return NextResponse.json({
      ok: true,
      redirectTo: `https://${user.organizationSlug}.${clientEnv.NEXT_PUBLIC_ROOT_DOMAIN}/dashboard`
    });
  }

  return NextResponse.json({ ok: true, redirectTo: "/dashboard" });
}

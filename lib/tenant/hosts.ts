import { headers } from "next/headers";

import { clientEnv } from "@/lib/env";
import type { TenantResolution } from "@/types/tenant";

const publicHosts = new Set(
  clientEnv.NEXT_PUBLIC_PUBLIC_DOMAINS.split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
);

function normalizeHost(rawHost: string) {
  return rawHost.split(":")[0]?.toLowerCase() ?? "";
}

export function resolveHost(rawHost: string): TenantResolution {
  const host = normalizeHost(rawHost);
  const rootDomain = clientEnv.NEXT_PUBLIC_ROOT_DOMAIN.toLowerCase();
  const appDomain = clientEnv.NEXT_PUBLIC_APP_DOMAIN.toLowerCase();

  if (!host) {
    return { host, kind: "unknown", tenantSlug: null };
  }

  if (host === appDomain || host === "localhost" || host.startsWith("app.localhost")) {
    return { host, kind: "platform", tenantSlug: null };
  }

  if (publicHosts.has(host) || host === rootDomain || host === `www.${rootDomain}`) {
    return { host, kind: "public", tenantSlug: null };
  }

  if (host.endsWith(`.${rootDomain}`)) {
    const subdomain = host.replace(`.${rootDomain}`, "");
    if (subdomain && subdomain !== "app" && subdomain !== "www") {
      return { host, kind: "tenant", tenantSlug: subdomain };
    }
  }

  return { host, kind: "unknown", tenantSlug: null };
}

export async function getRequestTenantResolution() {
  const headersList = await headers();
  const host =
    headersList.get("x-forwarded-host") ??
    headersList.get("host") ??
    headersList.get("x-request-host") ??
    "";

  return resolveHost(host);
}

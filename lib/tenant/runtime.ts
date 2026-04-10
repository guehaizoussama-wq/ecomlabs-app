import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRequestTenantResolution } from "@/lib/tenant/hosts";
import type { AuthUser } from "@/types/auth";

export type TenantContext = {
  user: AuthUser;
  organization: {
    id: string;
    slug: string;
    name: string;
    status: "active" | "suspended" | "expired";
  };
};

export async function getTenantContext(): Promise<TenantContext> {
  const user = await getCurrentUser();
  const resolution = await getRequestTenantResolution();

  if (!user) {
    redirect("/auth/login");
  }

  if (resolution.kind !== "tenant" || !resolution.tenantSlug) {
    redirect("/organization-not-found");
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("organizations")
    .select("id, slug, name, status")
    .eq("slug", resolution.tenantSlug)
    .maybeSingle();

  const organization = (data as TenantContext["organization"] | null) ?? null;

  if (!organization) {
    redirect("/organization-not-found");
  }

  if (organization.status === "suspended") {
    redirect("/organization-suspended");
  }

  if (organization.status === "expired") {
    redirect("/subscription-expired");
  }

  if (user.organizationId !== organization.id && !user.isSuperAdmin) {
    redirect("/organization-not-found");
  }

  return {
    user,
    organization: organization as TenantContext["organization"]
  };
}

export async function getPlatformContext() {
  const user = await getCurrentUser();
  if (!user || !user.isSuperAdmin) {
    redirect("/auth/login");
  }

  return {
    user
  };
}

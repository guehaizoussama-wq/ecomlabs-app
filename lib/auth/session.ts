import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRequestTenantResolution } from "@/lib/tenant/hosts";
import type { AppRole, AuthUser } from "@/types/auth";

type UserProfileRecord = {
  id: string;
  full_name: string | null;
  role: AppRole;
  organization_id: string | null;
  organizations: {
    id: string;
    name: string;
    slug: string;
    status: "active" | "suspended" | "expired";
  } | null;
  role_permissions:
    | {
        permissions: {
          code: string;
        } | null;
      }[]
    | null;
};

function mapAuthUser(
  email: string,
  userId: string,
  profile: UserProfileRecord | null
): AuthUser | null {
  if (!profile) {
    return null;
  }

  return {
    id: userId,
    email,
    fullName: profile.full_name,
    role: profile.role,
    organizationId: profile.organization_id,
    organizationSlug: profile.organizations?.slug ?? null,
    organizationName: profile.organizations?.name ?? null,
    permissions:
      profile.role_permissions?.flatMap((entry) =>
        entry.permissions?.code ? [entry.permissions.code] : []
      ) ?? [],
    isSuperAdmin: profile.role === "super_admin"
  };
}

export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return null;
  }

  const { data } = await supabase
    .from("user_profiles")
    .select(
      "id, full_name, role, organization_id, organizations(id, name, slug, status), role_permissions(permissions(code))"
    )
    .eq("id", user.id)
    .maybeSingle();

  return mapAuthUser(user.email, user.id, (data as UserProfileRecord | null) ?? null);
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }
  return user;
}

export async function requireSuperAdmin() {
  const user = await requireAuth();
  const resolution = await getRequestTenantResolution();

  if (resolution.kind !== "platform" || !user.isSuperAdmin) {
    redirect("/auth/login");
  }

  return user;
}

export async function requireTenantUser() {
  const user = await requireAuth();
  const resolution = await getRequestTenantResolution();

  if (resolution.kind !== "tenant" || !resolution.tenantSlug) {
    redirect("/organization-not-found");
  }

  if (user.organizationSlug !== resolution.tenantSlug) {
    redirect("/organization-not-found");
  }

  return user;
}

export async function requireTenantAdmin() {
  const user = await requireTenantUser();
  if (user.role !== "tenant_admin") {
    redirect("/dashboard");
  }
  return user;
}

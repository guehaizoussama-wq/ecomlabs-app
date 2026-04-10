export type PlatformRole = "super_admin";

export type TenantRole =
  | "tenant_admin"
  | "agent"
  | "marketer"
  | "delivery_man"
  | "stock_manager"
  | "finance_manager";

export type AppRole = PlatformRole | TenantRole;

export type AuthUser = {
  id: string;
  email: string;
  fullName: string | null;
  role: AppRole;
  organizationId: string | null;
  organizationSlug: string | null;
  organizationName: string | null;
  permissions: string[];
  isSuperAdmin: boolean;
};

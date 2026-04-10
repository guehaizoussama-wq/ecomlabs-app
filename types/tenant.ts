export type HostKind = "platform" | "tenant" | "public" | "unknown";

export type TenantStatus = "active" | "suspended" | "expired";

export type TenantResolution = {
  host: string;
  kind: HostKind;
  tenantSlug: string | null;
};

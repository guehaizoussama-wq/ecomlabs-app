export const permissionCatalog = [
  "orders.read",
  "orders.write",
  "products.read",
  "products.write",
  "stock.read",
  "stock.adjust",
  "delivery.read",
  "delivery.manage",
  "finance.read",
  "finance.manage",
  "marketing.read",
  "marketing.manage",
  "analytics.read",
  "team.manage",
  "settings.manage",
  "ecomlabs.use"
] as const;

export const defaultRolePermissions: Record<string, string[]> = {
  super_admin: [...permissionCatalog],
  tenant_admin: [...permissionCatalog],
  agent: ["orders.read", "orders.write", "analytics.read", "ecomlabs.use"],
  marketer: ["marketing.read", "marketing.manage", "analytics.read", "ecomlabs.use"],
  delivery_man: ["delivery.read"],
  stock_manager: ["products.read", "stock.read", "stock.adjust", "orders.read"],
  finance_manager: ["finance.read", "finance.manage", "analytics.read"]
};

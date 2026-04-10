export type RouteDefinition = {
  title: string;
  description: string;
  eyebrow: string;
  actions: string[];
};

export const tenantRouteCatalog: Record<string, RouteDefinition> = {
  dashboard: {
    title: "Operations Dashboard",
    description: "Unified KPI board spanning sales velocity, delivery health, profitability, and team execution.",
    eyebrow: "Tenant Workspace",
    actions: ["Review KPIs", "Inspect risks", "Open live queues"]
  },
  orders: {
    title: "Orders",
    description: "Multi-step order workflow with assignment, delivery linkage, finance impact, and status history.",
    eyebrow: "CRM + Fulfillment",
    actions: ["Create order", "Bulk update", "Export filtered view"]
  },
  "orders/create": {
    title: "Create Order",
    description: "Validated order intake with customer capture, location pricing, delivery calculation, and source attribution.",
    eyebrow: "Order Intake",
    actions: ["Save draft", "Confirm order", "Assign agent"]
  },
  customers: {
    title: "Customers",
    description: "Searchable CRM with normalized phones, order history, blacklist flags, and address intelligence.",
    eyebrow: "CRM",
    actions: ["Add customer", "Record note", "Review lifetime value"]
  },
  products: {
    title: "Products",
    description: "SKU management with costs, selling prices, activation state, and stock-aware catalog settings.",
    eyebrow: "Catalog",
    actions: ["Create product", "Import SKUs", "Inspect margins"]
  },
  "products/create": {
    title: "Create Product",
    description: "Catalog entry form with brand, category, pricing, and optional delivery fee override.",
    eyebrow: "Catalog Form",
    actions: ["Save draft", "Activate product", "Attach media"]
  },
  brands: {
    title: "Brands",
    description: "Brand directory for reporting, grouping, and merchandising consistency.",
    eyebrow: "Catalog",
    actions: ["Create brand", "Assign products", "Review coverage"]
  },
  categories: {
    title: "Categories",
    description: "Hierarchical category structure for product organization and reporting rollups.",
    eyebrow: "Catalog",
    actions: ["Create category", "Set parent", "Review hierarchy"]
  },
  statuses: {
    title: "Order Statuses",
    description: "Operational status reference with editability and analytics semantics.",
    eyebrow: "Operations Rules",
    actions: ["Reorder pipeline", "Review transitions", "Audit automation triggers"]
  },
  warehouses: {
    title: "Warehouses",
    description: "Warehouse locations, codes, active state, and stock ownership boundaries.",
    eyebrow: "Inventory",
    actions: ["Add warehouse", "Review throughput", "Compare stock"]
  },
  stock: {
    title: "Stock",
    description: "Warehouse-aware stock ledger with reserved quantity, alerts, and movement traceability.",
    eyebrow: "Inventory Control",
    actions: ["Adjust quantity", "View movement log", "Resolve shortages"]
  },
  "stock-alerts": {
    title: "Stock Alerts",
    description: "Threshold rules and exception queues for low stock, zero stock, and over-reservation.",
    eyebrow: "Inventory Control",
    actions: ["Create rule", "Escalate risk", "Tune thresholds"]
  },
  suppliers: {
    title: "Suppliers",
    description: "Supplier master records with contacts, notes, and operational status.",
    eyebrow: "Procurement",
    actions: ["Create supplier", "Review lead time", "Open purchases"]
  },
  purchases: {
    title: "Purchases",
    description: "Purchase entry workflow that increases stock and records procurement cost by warehouse.",
    eyebrow: "Procurement",
    actions: ["Create purchase", "Receive stock", "Review costs"]
  },
  "purchases/create": {
    title: "Create Purchase",
    description: "Warehouse-aware inbound stock form tied to suppliers, unit costs, and stock movements.",
    eyebrow: "Procurement Form",
    actions: ["Save entry", "Receive now", "Attach invoice"]
  },
  returns: {
    title: "Returns",
    description: "Supplier and damage return flows with stock deduction and traceable reasons.",
    eyebrow: "Procurement",
    actions: ["Create return", "Review damaged stock", "Export report"]
  },
  "returns/create": {
    title: "Create Return",
    description: "Multi-item return form for damage, expiry, and supplier returns.",
    eyebrow: "Return Form",
    actions: ["Save return", "Deduct stock", "Notify supplier"]
  },
  "delivery-partners": {
    title: "Delivery Partners",
    description: "Carrier registry with credentials, activation state, and adapter-backed capabilities.",
    eyebrow: "Delivery",
    actions: ["Add partner", "Map statuses", "Test credentials"]
  },
  "delivery-men": {
    title: "Delivery Men",
    description: "Local delivery staff directory with phone, coverage, and assignment readiness.",
    eyebrow: "Delivery",
    actions: ["Add courier", "Assign routes", "Review performance"]
  },
  "pricing-matrix": {
    title: "Pricing Matrix",
    description: "Normalized wilaya and commune pricing with customer fees, real cost, and fallbacks.",
    eyebrow: "Delivery",
    actions: ["Bulk import prices", "Edit fallback", "Inspect margins"]
  },
  "delivery-analytics": {
    title: "Delivery Analytics",
    description: "Shipment performance, cost leakage, top regions, partner SLAs, and margin analytics.",
    eyebrow: "Delivery Intelligence",
    actions: ["Filter period", "Compare partners", "Inspect failed deliveries"]
  },
  finance: {
    title: "Finance Dashboard",
    description: "Revenue, product cost, delivery cost, charges, and ad spend rolled into net profit.",
    eyebrow: "Finance",
    actions: ["Review KPIs", "Open transactions", "Audit profitability"]
  },
  charges: {
    title: "Charges",
    description: "Operational and overhead charges tracked by category and reporting period.",
    eyebrow: "Finance",
    actions: ["Add charge", "Edit category", "Review monthly burn"]
  },
  wallets: {
    title: "Wallets",
    description: "Wallet balances by provider or internal account for liquidity visibility.",
    eyebrow: "Finance",
    actions: ["Create wallet", "Reconcile balance", "Review cash flow"]
  },
  payments: {
    title: "Payments",
    description: "Customer payment records, order linkage, method tracking, and settlement state.",
    eyebrow: "Finance",
    actions: ["Record payment", "Link order", "Export receipts"]
  },
  payouts: {
    title: "Payouts",
    description: "Outgoing settlements to partners, marketers, or suppliers with history and auditability.",
    eyebrow: "Finance",
    actions: ["Create payout", "Approve payout", "Review history"]
  },
  "sales-channels": {
    title: "Sales Channels",
    description: "Channel reference data for attribution, conversion analysis, and campaign structure.",
    eyebrow: "Marketing",
    actions: ["Create channel", "Assign defaults", "Inspect attribution"]
  },
  marketers: {
    title: "Marketers",
    description: "Marketer records linked to ad accounts, campaigns, and performance analytics.",
    eyebrow: "Marketing",
    actions: ["Add marketer", "Assign accounts", "Review CPA"]
  },
  "ad-accounts": {
    title: "Ad Accounts",
    description: "Advertising account registry tied to spend, exchange rate, and campaign ownership.",
    eyebrow: "Marketing",
    actions: ["Add account", "Set currency", "Audit spend"]
  },
  campaigns: {
    title: "Campaigns",
    description: "Campaign management with daily metrics, DZD conversion, CTR, CPC, CPA, and CVR.",
    eyebrow: "Marketing",
    actions: ["Create campaign", "Log daily stats", "Compare performance"]
  },
  analytics: {
    title: "Analytics",
    description: "Cross-functional KPI hub for top products, top wilayas, agent performance, and margin trends.",
    eyebrow: "Business Intelligence",
    actions: ["Filter date range", "Rank entities", "Export dashboard"]
  },
  ecomlabs: {
    title: "EcomLabs Workspace",
    description: "Native AI workspace rebuilt from the uploaded EcomLabs archive into structured tenant tools.",
    eyebrow: "AI Workspace",
    actions: ["Run generator", "Save output", "Review prompt history"]
  },
  team: {
    title: "Team",
    description: "Tenant users, role assignments, permissions, and operating ownership.",
    eyebrow: "Access Control",
    actions: ["Invite member", "Change role", "Review activity"]
  },
  settings: {
    title: "Workspace Settings",
    description: "Tenant defaults across branding, operations, finance, notifications, and integrations.",
    eyebrow: "Administration",
    actions: ["Update branding", "Manage automations", "Review domains"]
  }
};

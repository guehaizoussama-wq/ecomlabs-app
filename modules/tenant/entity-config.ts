export type EntityFieldType =
  | "text"
  | "email"
  | "phone"
  | "number"
  | "textarea"
  | "select"
  | "date"
  | "checkbox";

export type EntityField = {
  key: string;
  label: string;
  type: EntityFieldType;
  required?: boolean;
  optionsTable?:
    | "brands"
    | "categories"
    | "warehouses"
    | "suppliers"
    | "delivery_partners"
    | "delivery_men"
    | "marketers"
    | "ad_accounts"
    | "sales_channels"
    | "customers"
    | "order_statuses"
    | "wallets"
    | "charge_categories"
    | "products"
    | "wilayas"
    | "communes"
    | "orders";
  placeholder?: string;
};

export type EntityConfig = {
  key: string;
  table: string;
  title: string;
  description: string;
  singular: string;
  defaultSort?: { column: string; ascending?: boolean };
  listColumns: string[];
  fields: EntityField[];
  searchColumns?: string[];
};

export const tenantEntityConfigs: Record<string, EntityConfig> = {
  customers: {
    key: "customers",
    table: "customers",
    title: "Customers",
    description: "Manage customer records, addresses, blacklist state, and contact normalization.",
    singular: "customer",
    defaultSort: { column: "created_at", ascending: false },
    listColumns: ["full_name", "primary_phone", "email", "is_blacklisted", "created_at"],
    searchColumns: ["full_name", "primary_phone", "email"],
    fields: [
      { key: "full_name", label: "Full name", type: "text", required: true },
      { key: "primary_phone", label: "Primary phone", type: "phone", required: true },
      { key: "secondary_phone", label: "Secondary phone", type: "phone" },
      { key: "email", label: "Email", type: "email" },
      { key: "wilaya_id", label: "Wilaya", type: "select", optionsTable: "wilayas" },
      { key: "commune_id", label: "Commune", type: "select", optionsTable: "communes" },
      { key: "address_line1", label: "Address", type: "textarea" },
      { key: "is_blacklisted", label: "Blacklisted", type: "checkbox" },
      { key: "blacklist_reason", label: "Blacklist reason", type: "textarea" }
    ]
  },
  products: {
    key: "products",
    table: "products",
    title: "Products",
    description: "Control pricing, SKU, stock awareness, and delivery fee overrides.",
    singular: "product",
    defaultSort: { column: "created_at", ascending: false },
    listColumns: ["name", "sku", "selling_price", "cost_price", "is_active"],
    searchColumns: ["name", "sku"],
    fields: [
      { key: "name", label: "Product name", type: "text", required: true },
      { key: "sku", label: "SKU", type: "text", required: true },
      { key: "brand_id", label: "Brand", type: "select", optionsTable: "brands" },
      { key: "category_id", label: "Category", type: "select", optionsTable: "categories" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "selling_price", label: "Selling price", type: "number", required: true },
      { key: "cost_price", label: "Cost price", type: "number", required: true },
      { key: "delivery_fee_override", label: "Delivery override", type: "number" },
      { key: "stock_aware", label: "Stock aware", type: "checkbox" },
      { key: "is_active", label: "Active", type: "checkbox" }
    ]
  },
  brands: {
    key: "brands",
    table: "brands",
    title: "Brands",
    description: "Maintain the brand directory used across catalog and analytics.",
    singular: "brand",
    defaultSort: { column: "name", ascending: true },
    listColumns: ["name", "is_active", "notes", "created_at"],
    searchColumns: ["name"],
    fields: [
      { key: "name", label: "Brand name", type: "text", required: true },
      { key: "notes", label: "Notes", type: "textarea" },
      { key: "is_active", label: "Active", type: "checkbox" }
    ]
  },
  categories: {
    key: "categories",
    table: "categories",
    title: "Categories",
    description: "Organize products with parent-child category structures.",
    singular: "category",
    defaultSort: { column: "name", ascending: true },
    listColumns: ["name", "slug", "created_at"],
    searchColumns: ["name", "slug"],
    fields: [
      { key: "name", label: "Category name", type: "text", required: true },
      { key: "slug", label: "Slug", type: "text", required: true },
      { key: "parent_id", label: "Parent category", type: "select", optionsTable: "categories" }
    ]
  },
  statuses: {
    key: "statuses",
    table: "order_statuses",
    title: "Statuses",
    description: "Manage editable order statuses and their operational sequence.",
    singular: "status",
    defaultSort: { column: "sort_order", ascending: true },
    listColumns: ["label", "code", "is_editable", "sort_order"],
    searchColumns: ["label", "code"],
    fields: [
      { key: "label", label: "Label", type: "text", required: true },
      { key: "code", label: "Code", type: "text", required: true },
      { key: "color", label: "Color", type: "text" },
      { key: "sort_order", label: "Sort order", type: "number", required: true },
      { key: "is_editable", label: "Editable", type: "checkbox" }
    ]
  },
  warehouses: {
    key: "warehouses",
    table: "warehouses",
    title: "Warehouses",
    description: "Track warehouse identity, status, and location.",
    singular: "warehouse",
    defaultSort: { column: "name", ascending: true },
    listColumns: ["code", "name", "is_active", "created_at"],
    searchColumns: ["code", "name"],
    fields: [
      { key: "code", label: "Code", type: "text", required: true },
      { key: "name", label: "Name", type: "text", required: true },
      { key: "wilaya_id", label: "Wilaya", type: "select", optionsTable: "wilayas" },
      { key: "commune_id", label: "Commune", type: "select", optionsTable: "communes" },
      { key: "address_line1", label: "Address", type: "textarea" },
      { key: "notes", label: "Notes", type: "textarea" },
      { key: "is_active", label: "Active", type: "checkbox" }
    ]
  },
  suppliers: {
    key: "suppliers",
    table: "suppliers",
    title: "Suppliers",
    description: "Maintain supplier contact data and procurement readiness.",
    singular: "supplier",
    defaultSort: { column: "name", ascending: true },
    listColumns: ["name", "email", "phone", "is_active"],
    searchColumns: ["name", "email", "phone"],
    fields: [
      { key: "name", label: "Supplier name", type: "text", required: true },
      { key: "email", label: "Email", type: "email" },
      { key: "phone", label: "Phone", type: "phone" },
      { key: "notes", label: "Notes", type: "textarea" },
      { key: "is_active", label: "Active", type: "checkbox" }
    ]
  },
  "delivery-partners": {
    key: "delivery-partners",
    table: "delivery_partners",
    title: "Delivery Partners",
    description: "Manage partner activation, codes, notes, and adapter strategy.",
    singular: "delivery partner",
    defaultSort: { column: "name", ascending: true },
    listColumns: ["name", "code", "api_type", "is_active"],
    searchColumns: ["name", "code", "api_type"],
    fields: [
      { key: "name", label: "Partner name", type: "text", required: true },
      { key: "code", label: "Code", type: "text", required: true },
      { key: "api_type", label: "API type", type: "text", required: true },
      { key: "notes", label: "Notes", type: "textarea" },
      { key: "is_active", label: "Active", type: "checkbox" }
    ]
  },
  "delivery-men": {
    key: "delivery-men",
    table: "delivery_men",
    title: "Delivery Men",
    description: "Maintain local courier roster and assignment readiness.",
    singular: "delivery man",
    defaultSort: { column: "full_name", ascending: true },
    listColumns: ["full_name", "phone", "is_active"],
    searchColumns: ["full_name", "phone"],
    fields: [
      { key: "full_name", label: "Full name", type: "text", required: true },
      { key: "phone", label: "Phone", type: "phone", required: true },
      { key: "notes", label: "Notes", type: "textarea" },
      { key: "is_active", label: "Active", type: "checkbox" }
    ]
  },
  "sales-channels": {
    key: "sales-channels",
    table: "sales_channels",
    title: "Sales Channels",
    description: "Attribution channels used across orders and campaigns.",
    singular: "sales channel",
    defaultSort: { column: "name", ascending: true },
    listColumns: ["name", "code", "created_at"],
    searchColumns: ["name", "code"],
    fields: [
      { key: "name", label: "Channel name", type: "text", required: true },
      { key: "code", label: "Code", type: "text", required: true }
    ]
  },
  marketers: {
    key: "marketers",
    table: "marketers",
    title: "Marketers",
    description: "Manage marketers and connect them to campaign reporting.",
    singular: "marketer",
    defaultSort: { column: "full_name", ascending: true },
    listColumns: ["full_name", "email", "phone", "is_active"],
    searchColumns: ["full_name", "email", "phone"],
    fields: [
      { key: "full_name", label: "Full name", type: "text", required: true },
      { key: "email", label: "Email", type: "email" },
      { key: "phone", label: "Phone", type: "phone" },
      { key: "is_active", label: "Active", type: "checkbox" }
    ]
  },
  "ad-accounts": {
    key: "ad-accounts",
    table: "ad_accounts",
    title: "Ad Accounts",
    description: "Store ad account ownership, platform, and currency context.",
    singular: "ad account",
    defaultSort: { column: "account_name", ascending: true },
    listColumns: ["account_name", "platform", "currency_code"],
    searchColumns: ["account_name", "platform"],
    fields: [
      { key: "account_name", label: "Account name", type: "text", required: true },
      { key: "platform", label: "Platform", type: "text", required: true },
      { key: "currency_code", label: "Currency", type: "text", required: true },
      { key: "marketer_id", label: "Marketer", type: "select", optionsTable: "marketers" }
    ]
  },
  campaigns: {
    key: "campaigns",
    table: "campaigns",
    title: "Campaigns",
    description: "Manage marketing campaigns with spend, exchange rate, and status.",
    singular: "campaign",
    defaultSort: { column: "created_at", ascending: false },
    listColumns: ["name", "status", "spend_usd", "exchange_rate", "starts_at"],
    searchColumns: ["name", "status"],
    fields: [
      { key: "name", label: "Campaign name", type: "text", required: true },
      { key: "status", label: "Status", type: "text", required: true },
      { key: "ad_account_id", label: "Ad account", type: "select", optionsTable: "ad_accounts" },
      { key: "marketer_id", label: "Marketer", type: "select", optionsTable: "marketers" },
      { key: "sales_channel_id", label: "Sales channel", type: "select", optionsTable: "sales_channels" },
      { key: "spend_usd", label: "Spend USD", type: "number", required: true },
      { key: "exchange_rate", label: "Exchange rate", type: "number", required: true },
      { key: "starts_at", label: "Start date", type: "date" },
      { key: "ends_at", label: "End date", type: "date" }
    ]
  },
  charges: {
    key: "charges",
    table: "charges",
    title: "Charges",
    description: "Track operational charges and reporting categories.",
    singular: "charge",
    defaultSort: { column: "charged_at", ascending: false },
    listColumns: ["amount", "charged_at", "notes"],
    fields: [
      { key: "charge_category_id", label: "Charge category", type: "select", optionsTable: "charge_categories" },
      { key: "amount", label: "Amount", type: "number", required: true },
      { key: "charged_at", label: "Charged date", type: "date", required: true },
      { key: "notes", label: "Notes", type: "textarea" }
    ]
  },
  wallets: {
    key: "wallets",
    table: "wallets",
    title: "Wallets",
    description: "Maintain account balances for cash flow and reconciliation.",
    singular: "wallet",
    defaultSort: { column: "name", ascending: true },
    listColumns: ["name", "balance", "currency_code"],
    searchColumns: ["name"],
    fields: [
      { key: "name", label: "Wallet name", type: "text", required: true },
      { key: "balance", label: "Balance", type: "number", required: true },
      { key: "currency_code", label: "Currency", type: "text", required: true }
    ]
  },
  payments: {
    key: "payments",
    table: "payments",
    title: "Payments",
    description: "Capture incoming payments tied to orders and wallets.",
    singular: "payment",
    defaultSort: { column: "paid_at", ascending: false },
    listColumns: ["amount", "method", "paid_at"],
    fields: [
      { key: "order_id", label: "Order", type: "select", optionsTable: "orders" },
      { key: "wallet_id", label: "Wallet", type: "select", optionsTable: "wallets" },
      { key: "amount", label: "Amount", type: "number", required: true },
      { key: "method", label: "Method", type: "text", required: true },
      { key: "paid_at", label: "Paid at", type: "date", required: true }
    ]
  },
  payouts: {
    key: "payouts",
    table: "payouts",
    title: "Payouts",
    description: "Track outgoing payouts and beneficiaries.",
    singular: "payout",
    defaultSort: { column: "created_at", ascending: false },
    listColumns: ["beneficiary_name", "amount", "status", "paid_at"],
    fields: [
      { key: "wallet_id", label: "Wallet", type: "select", optionsTable: "wallets" },
      { key: "beneficiary_name", label: "Beneficiary", type: "text", required: true },
      { key: "amount", label: "Amount", type: "number", required: true },
      { key: "status", label: "Status", type: "text", required: true },
      { key: "paid_at", label: "Paid at", type: "date" }
    ]
  }
};

export function getEntityConfig(resourceKey: string) {
  return tenantEntityConfigs[resourceKey] ?? null;
}

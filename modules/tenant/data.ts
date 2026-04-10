import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant/runtime";
import { normalizePhone, slugify } from "@/lib/utils";
import { getEntityConfig } from "@/modules/tenant/entity-config";

type DbRecord = Record<string, unknown>;

export async function getEntityOptions(optionsTable: string) {
  const { organization } = await getTenantContext();
  const supabase = await createSupabaseServerClient();

  if (optionsTable === "wilayas") {
    const { data } = await supabase.from("wilayas").select("id, code, name").order("name");
    return (data ?? []) as DbRecord[];
  }

  if (optionsTable === "communes") {
    const { data } = await supabase.from("communes").select("id, wilaya_id, name").order("name");
    return (data ?? []) as DbRecord[];
  }

  const labelColumn =
    optionsTable === "warehouses"
      ? "name"
      : optionsTable === "delivery_men"
        ? "full_name"
        : optionsTable === "marketers"
          ? "full_name"
          : optionsTable === "ad_accounts"
            ? "account_name"
            : optionsTable === "orders"
              ? "order_number"
              : optionsTable === "wallets"
                ? "name"
                : optionsTable === "charge_categories"
                  ? "name"
                  : optionsTable === "order_statuses"
                    ? "label"
                    : optionsTable === "user_profiles"
                      ? "full_name"
                      : "name";

  const { data } = await supabase
    .from(optionsTable)
    .select(`id, ${labelColumn}`)
    .eq("organization_id", organization.id)
    .order(labelColumn);

  return (data ?? []) as DbRecord[];
}

export async function getEntityList(resourceKey: string, search?: string) {
  const config = getEntityConfig(resourceKey);
  if (!config) {
    return null;
  }

  const { organization } = await getTenantContext();
  const supabase = await createSupabaseServerClient();

  let query = supabase.from(config.table).select("*").eq("organization_id", organization.id);
  if (config.defaultSort) {
    query = query.order(config.defaultSort.column, {
      ascending: config.defaultSort.ascending ?? true
    });
  }

  const { data } = await query.limit(100);
  let records = ((data ?? []) as DbRecord[]).map((record) => record);

  if (search && config.searchColumns?.length) {
    const q = search.toLowerCase();
    records = records.filter((record) =>
      config.searchColumns?.some((column) => String(record[column] ?? "").toLowerCase().includes(q))
    );
  }

  return {
    config,
    records
  };
}

export async function getEntityRecord(resourceKey: string, id: string) {
  const config = getEntityConfig(resourceKey);
  if (!config) {
    return null;
  }

  const { organization } = await getTenantContext();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from(config.table)
    .select("*")
    .eq("organization_id", organization.id)
    .eq("id", id)
    .maybeSingle();

  return {
    config,
    record: (data as DbRecord | null) ?? null
  };
}

export async function getTenantDashboardData() {
  const { organization } = await getTenantContext();
  const supabase = await createSupabaseServerClient();

  const [orders, customers, shipments, campaigns, charges, products] = await Promise.all([
    supabase.from("orders").select("id, total_amount, created_at").eq("organization_id", organization.id),
    supabase.from("customers").select("id").eq("organization_id", organization.id),
    supabase.from("delivery_shipments").select("id, status").eq("organization_id", organization.id),
    supabase.from("campaigns").select("id, spend_usd, exchange_rate").eq("organization_id", organization.id),
    supabase.from("charges").select("id, amount").eq("organization_id", organization.id),
    supabase.from("products").select("id, name, selling_price").eq("organization_id", organization.id).limit(5)
  ]);

  const totalRevenue = (orders.data ?? []).reduce(
    (sum, order) => sum + Number((order as DbRecord).total_amount ?? 0),
    0
  );
  const totalAdSpend = (campaigns.data ?? []).reduce(
    (sum, campaign) =>
      sum + Number((campaign as DbRecord).spend_usd ?? 0) * Number((campaign as DbRecord).exchange_rate ?? 1),
    0
  );
  const totalCharges = (charges.data ?? []).reduce(
    (sum, charge) => sum + Number((charge as DbRecord).amount ?? 0),
    0
  );

  return {
    organization,
    kpis: [
      { label: "Orders", value: String(orders.data?.length ?? 0) },
      { label: "Customers", value: String(customers.data?.length ?? 0) },
      { label: "Revenue", value: `${totalRevenue.toFixed(0)} DZD` },
      { label: "Ad Spend", value: `${totalAdSpend.toFixed(0)} DZD` },
      { label: "Charges", value: `${totalCharges.toFixed(0)} DZD` },
      { label: "Shipments", value: String(shipments.data?.length ?? 0) }
    ],
    orderSeries: (orders.data ?? []).slice(0, 14).map((order, index) => ({
      label: `#${index + 1}`,
      value: Number((order as DbRecord).total_amount ?? 0)
    })),
    spotlightProducts: (products.data ?? []) as DbRecord[]
  };
}

export async function getOrdersPageData(search?: string) {
  const list = await getEntityList("orders", search);
  const { organization } = await getTenantContext();
  const supabase = await createSupabaseServerClient();
  const [customers, products, statuses, channels, campaigns, history] = await Promise.all([
    getEntityOptions("customers"),
    getEntityOptions("products"),
    getEntityOptions("order_statuses"),
    getEntityOptions("sales_channels"),
    getEntityOptions("campaigns"),
    supabase
      .from("order_status_history")
      .select("order_id, next_status_id, created_at")
      .eq("organization_id", organization.id)
      .order("created_at", { ascending: false })
      .limit(50)
  ]);

  const statusLookup = new Map(statuses.map((status) => [String(status.id), String(status.label ?? status.name ?? "")]));
  const statusCounts = (list?.records ?? []).reduce<Record<string, number>>((acc, record) => {
    const key = statusLookup.get(String(record.status_id ?? "")) || "Unassigned";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return {
    list,
    options: {
      customers,
      products,
      statuses,
      channels,
      campaigns,
      wilayas: await getEntityOptions("wilayas"),
      communes: await getEntityOptions("communes")
    },
    statusCounts,
    recentStatusEvents: (history.data ?? []) as DbRecord[]
  };
}

export async function getOrderDetail(id: string) {
  const { organization } = await getTenantContext();
  const supabase = await createSupabaseServerClient();
  const [order, orderItems, statusHistory, shipments, events] = await Promise.all([
    supabase.from("orders").select("*").eq("organization_id", organization.id).eq("id", id).maybeSingle(),
    supabase.from("order_items").select("*").eq("organization_id", organization.id).eq("order_id", id),
    supabase
      .from("order_status_history")
      .select("*")
      .eq("organization_id", organization.id)
      .eq("order_id", id)
      .order("created_at", { ascending: false }),
    supabase.from("delivery_shipments").select("*").eq("organization_id", organization.id).eq("order_id", id),
    supabase
      .from("delivery_events")
      .select("*, delivery_shipments(order_id)")
      .eq("organization_id", organization.id)
      .order("created_at", { ascending: false })
      .limit(50)
  ]);

  const shipmentIds = new Set((shipments.data ?? []).map((shipment) => String((shipment as DbRecord).id ?? "")));
  const shipmentEvents = ((events.data ?? []) as DbRecord[]).filter((event) =>
    shipmentIds.has(String(event.shipment_id ?? ""))
  );

  return {
    order: (order.data as DbRecord | null) ?? null,
    items: (orderItems.data ?? []) as DbRecord[],
    history: (statusHistory.data ?? []) as DbRecord[],
    shipments: (shipments.data ?? []) as DbRecord[],
    shipmentEvents
  };
}

export async function getCustomerDetail(id: string) {
  const { organization } = await getTenantContext();
  const supabase = await createSupabaseServerClient();
  const [customer, orders, notes] = await Promise.all([
    supabase.from("customers").select("*").eq("organization_id", organization.id).eq("id", id).maybeSingle(),
    supabase
      .from("orders")
      .select("*")
      .eq("organization_id", organization.id)
      .eq("customer_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("customer_notes")
      .select("*")
      .eq("organization_id", organization.id)
      .eq("customer_id", id)
      .order("created_at", { ascending: false })
  ]);

  return {
    customer: (customer.data as DbRecord | null) ?? null,
    orders: (orders.data ?? []) as DbRecord[],
    notes: (notes.data ?? []) as DbRecord[],
    totalSpent: ((orders.data ?? []) as DbRecord[]).reduce(
      (sum, order) => sum + Number(order.total_amount ?? 0),
      0
    )
  };
}

export async function getStockPageData() {
  const { organization } = await getTenantContext();
  const supabase = await createSupabaseServerClient();
  const [stock, movements, products, warehouses] = await Promise.all([
    supabase.from("stock").select("*").eq("organization_id", organization.id).order("updated_at", { ascending: false }),
    supabase
      .from("stock_movements")
      .select("*")
      .eq("organization_id", organization.id)
      .order("created_at", { ascending: false })
      .limit(100),
    getEntityOptions("products"),
    getEntityOptions("warehouses")
  ]);

  return {
    stock: (stock.data ?? []) as DbRecord[],
    movements: (movements.data ?? []) as DbRecord[],
    lowStock: ((stock.data ?? []) as DbRecord[]).filter(
      (entry) => Number(entry.quantity ?? 0) <= Number(entry.min_threshold ?? 0)
    ),
    options: { products, warehouses }
  };
}

export async function getProcurementPageData(kind: "purchases" | "returns") {
  const { organization } = await getTenantContext();
  const supabase = await createSupabaseServerClient();
  const table = kind === "purchases" ? "purchase_entries" : "return_entries";
  const itemTable = kind === "purchases" ? "purchase_entry_items" : "return_entry_items";
  const [entries, items, suppliers, warehouses, products] = await Promise.all([
    supabase.from(table).select("*").eq("organization_id", organization.id).order("created_at", { ascending: false }),
    supabase.from(itemTable).select("*").eq("organization_id", organization.id).limit(200),
    getEntityOptions("suppliers"),
    getEntityOptions("warehouses"),
    getEntityOptions("products")
  ]);

  return {
    entries: (entries.data ?? []) as DbRecord[],
    items: (items.data ?? []) as DbRecord[],
    options: { suppliers, warehouses, products }
  };
}

export async function getDeliveryPageData() {
  const { organization } = await getTenantContext();
  const supabase = await createSupabaseServerClient();
  const [shipments, partners, deliveryMen, pricing, orders, events] = await Promise.all([
    supabase
      .from("delivery_shipments")
      .select("*")
      .eq("organization_id", organization.id)
      .order("created_at", { ascending: false }),
    getEntityOptions("delivery_partners"),
    getEntityOptions("delivery_men"),
    supabase
      .from("delivery_pricing_matrix")
      .select("*")
      .eq("organization_id", organization.id)
      .order("updated_at", { ascending: false }),
    getEntityOptions("orders"),
    supabase
      .from("delivery_events")
      .select("*")
      .eq("organization_id", organization.id)
      .order("created_at", { ascending: false })
      .limit(100)
  ]);
  const [wilayas, communes] = await Promise.all([getEntityOptions("wilayas"), getEntityOptions("communes")]);

  const shipmentStatusCounts = ((shipments.data ?? []) as DbRecord[]).reduce<Record<string, number>>((acc, shipment) => {
    const key = String(shipment.status ?? "unknown");
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return {
    shipments: (shipments.data ?? []) as DbRecord[],
    partners,
    deliveryMen,
    pricing: (pricing.data ?? []) as DbRecord[],
    orders,
    wilayas,
    communes,
    events: (events.data ?? []) as DbRecord[],
    shipmentStatusCounts
  };
}

export async function getFinanceData() {
  const { organization } = await getTenantContext();
  const supabase = await createSupabaseServerClient();
  const [orders, charges, wallets, payments, payouts, transactions, campaigns] = await Promise.all([
    supabase.from("orders").select("id, total_amount, real_delivery_cost").eq("organization_id", organization.id),
    supabase.from("charges").select("*").eq("organization_id", organization.id).order("charged_at", { ascending: false }),
    supabase.from("wallets").select("*").eq("organization_id", organization.id),
    supabase.from("payments").select("*").eq("organization_id", organization.id).order("paid_at", { ascending: false }),
    supabase.from("payouts").select("*").eq("organization_id", organization.id).order("created_at", { ascending: false }),
    supabase.from("transactions").select("*").eq("organization_id", organization.id).order("occurred_at", { ascending: false }),
    supabase.from("campaigns").select("spend_usd, exchange_rate").eq("organization_id", organization.id)
  ]);

  const deliveredRevenue = (orders.data ?? []).reduce(
    (sum, order) => sum + Number((order as DbRecord).total_amount ?? 0),
    0
  );
  const realDeliveryCost = (orders.data ?? []).reduce(
    (sum, order) => sum + Number((order as DbRecord).real_delivery_cost ?? 0),
    0
  );
  const totalCharges = (charges.data ?? []).reduce((sum, charge) => sum + Number((charge as DbRecord).amount ?? 0), 0);
  const adsSpend = (campaigns.data ?? []).reduce(
    (sum, campaign) =>
      sum + Number((campaign as DbRecord).spend_usd ?? 0) * Number((campaign as DbRecord).exchange_rate ?? 1),
    0
  );

  return {
    kpis: [
      { label: "Delivered Revenue", value: `${deliveredRevenue.toFixed(0)} DZD` },
      { label: "Delivery Cost", value: `${realDeliveryCost.toFixed(0)} DZD` },
      { label: "Charges", value: `${totalCharges.toFixed(0)} DZD` },
      { label: "Ad Spend", value: `${adsSpend.toFixed(0)} DZD` },
      { label: "Net Profit", value: `${(deliveredRevenue - realDeliveryCost - totalCharges - adsSpend).toFixed(0)} DZD` }
    ],
    charges: (charges.data ?? []) as DbRecord[],
    wallets: (wallets.data ?? []) as DbRecord[],
    payments: (payments.data ?? []) as DbRecord[],
    payouts: (payouts.data ?? []) as DbRecord[],
    transactions: (transactions.data ?? []) as DbRecord[]
  };
}

export async function getAnalyticsData() {
  const { organization } = await getTenantContext();
  const supabase = await createSupabaseServerClient();
  const [orders, products, customers, shipments, campaigns, team] = await Promise.all([
    supabase.from("orders").select("id, total_amount, created_at, assigned_user_id").eq("organization_id", organization.id),
    supabase.from("products").select("id, name, selling_price").eq("organization_id", organization.id),
    supabase.from("customers").select("id, wilaya_id").eq("organization_id", organization.id),
    supabase.from("delivery_shipments").select("id, status").eq("organization_id", organization.id),
    supabase.from("campaigns").select("id, name, spend_usd").eq("organization_id", organization.id),
    supabase.from("user_profiles").select("id, full_name, role").eq("organization_id", organization.id)
  ]);

  return {
    kpis: [
      { label: "Orders", value: String(orders.data?.length ?? 0) },
      { label: "Products", value: String(products.data?.length ?? 0) },
      { label: "Customers", value: String(customers.data?.length ?? 0) },
      { label: "Shipments", value: String(shipments.data?.length ?? 0) },
      { label: "Campaigns", value: String(campaigns.data?.length ?? 0) }
    ],
    chartData: (orders.data ?? []).slice(0, 10).map((order, index) => ({
      label: `Period ${index + 1}`,
      revenue: Number((order as DbRecord).total_amount ?? 0)
    })),
    products: (products.data ?? []) as DbRecord[],
    campaigns: (campaigns.data ?? []) as DbRecord[],
    team: (team.data ?? []) as DbRecord[]
  };
}

export async function getCampaignDetail(id: string) {
  const { organization } = await getTenantContext();
  const supabase = await createSupabaseServerClient();
  const [campaign, metrics] = await Promise.all([
    supabase.from("campaigns").select("*").eq("organization_id", organization.id).eq("id", id).maybeSingle(),
    supabase
      .from("campaign_daily_metrics")
      .select("*")
      .eq("organization_id", organization.id)
      .eq("campaign_id", id)
      .order("metric_date", { ascending: false })
  ]);

  const metricRows = (metrics.data ?? []) as DbRecord[];
  return {
    campaign: (campaign.data as DbRecord | null) ?? null,
    metrics: metricRows,
    totals: {
      impressions: metricRows.reduce((sum, row) => sum + Number(row.impressions ?? 0), 0),
      clicks: metricRows.reduce((sum, row) => sum + Number(row.clicks ?? 0), 0),
      conversions: metricRows.reduce((sum, row) => sum + Number(row.conversions ?? 0), 0)
    }
  };
}

export async function getTeamSettingsData() {
  const { organization } = await getTenantContext();
  const supabase = await createSupabaseServerClient();
  const [members, roles, aiConfig] = await Promise.all([
    supabase.from("user_profiles").select("*").eq("organization_id", organization.id).order("created_at", { ascending: false }),
    supabase.from("roles").select("code, name, scope").eq("scope", "tenant").order("name"),
    supabase.from("ai_tool_configs").select("*").eq("organization_id", organization.id).order("created_at", { ascending: false }).limit(1)
  ]);

  return {
    organization,
    members: (members.data ?? []) as DbRecord[],
    roles: (roles.data ?? []) as DbRecord[],
    aiConfig: ((aiConfig.data ?? [])[0] as DbRecord | undefined) ?? null
  };
}

export async function getEcomlabsData() {
  const { organization } = await getTenantContext();
  const supabase = await createSupabaseServerClient();
  const [history, savedOutputs, generatedOutputs, settings] = await Promise.all([
    supabase
      .from("prompt_history")
      .select("*")
      .eq("organization_id", organization.id)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("saved_outputs")
      .select("*, generated_outputs(title, payload, output_type, created_at)")
      .eq("organization_id", organization.id)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("generated_outputs")
      .select("*")
      .eq("organization_id", organization.id)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("ai_tool_configs")
      .select("*")
      .eq("organization_id", organization.id)
      .order("created_at", { ascending: false })
      .limit(1)
  ]);

  return {
    history: (history.data ?? []) as DbRecord[],
    savedOutputs: (savedOutputs.data ?? []) as DbRecord[],
    generatedOutputs: (generatedOutputs.data ?? []) as DbRecord[],
    settings: (settings.data ?? []) as DbRecord[]
  };
}

export function prepareEntityPayload(resourceKey: string, formData: FormData) {
  const config = getEntityConfig(resourceKey);
  if (!config) {
    throw new Error(`Unknown entity resource: ${resourceKey}`);
  }

  return config.fields.reduce<Record<string, unknown>>((acc, field) => {
    if (field.type === "checkbox") {
      acc[field.key] = formData.get(field.key) === "on";
      return acc;
    }

    const rawValue = formData.get(field.key);
    if (rawValue === null || rawValue === "") {
      return acc;
    }

    if (field.type === "number") {
      acc[field.key] = Number(rawValue);
      return acc;
    }

    if (field.type === "phone") {
      acc[field.key] = normalizePhone(String(rawValue));
      return acc;
    }

    if (field.key === "slug") {
      acc[field.key] = slugify(String(rawValue));
      return acc;
    }

    acc[field.key] = String(rawValue);
    return acc;
  }, {});
}

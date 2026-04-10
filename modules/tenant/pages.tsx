import { SimpleBarChart } from "@/components/charts/simple-bar-chart";
import { KpiStrip } from "@/components/layout/kpi-strip";
import { ModulePage } from "@/components/layout/module-page";
import { EntityForm } from "@/components/tenant/entity-form";
import { EntityTable } from "@/components/tenant/entity-table";
import { EcomlabsWorkspace } from "@/components/tenant/ecomlabs-workspace";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createShipmentAction,
  saveCampaignMetricAction,
  saveCustomerNoteAction,
  saveOrderAction,
  savePricingMatrixAction,
  saveProcurementEntryAction,
  saveStockAdjustmentAction,
  saveTenantSettingsAction,
  updateOrderStatusAction,
  updateShipmentAction,
  updateTeamMemberAction
} from "@/modules/tenant/actions";
import { getEntityConfig } from "@/modules/tenant/entity-config";
import {
  getAnalyticsData,
  getCampaignDetail,
  getCustomerDetail,
  getDeliveryPageData,
  getEcomlabsData,
  getEntityList,
  getEntityOptions,
  getEntityRecord,
  getFinanceData,
  getOrderDetail,
  getOrdersPageData,
  getProcurementPageData,
  getStockPageData,
  getTeamSettingsData,
  getTenantDashboardData
} from "@/modules/tenant/data";
import { tenantRouteCatalog } from "@/modules/tenant/route-catalog";

function slugPath(slug: string[]) {
  return `/${slug.join("/")}`;
}

function optionLabel(option: Record<string, unknown>) {
  return String(
    option.name ??
      option.label ??
      option.full_name ??
      option.account_name ??
      option.order_number ??
      option.code ??
      option.id ??
      ""
  );
}

function renderObject(value: unknown) {
  if (value && typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }
  return String(value ?? "-");
}

export async function renderTenantRoute(slug: string[], search?: string) {
  const root = slug[0] ?? "dashboard";
  const pathKey = slug.join("/");

  if (root === "dashboard") {
    const data = await getTenantDashboardData();
    return (
      <div className="space-y-8">
        <section className="rounded-[2rem] border bg-card p-8 shadow-soft">
          <h1 className="text-4xl font-semibold">Operations Dashboard</h1>
          <p className="mt-3 text-muted-foreground">
            Real-time tenant overview for {data.organization.name} across operations, delivery, and profitability.
          </p>
        </section>
        <KpiStrip items={data.kpis} />
        <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
              <CardDescription>Latest order totals from the live database.</CardDescription>
            </CardHeader>
            <CardContent>
              <SimpleBarChart data={data.orderSeries} />
            </CardContent>
          </Card>
          <EntityTable
            title="Product Spotlight"
            description="Recent product records to keep the team oriented."
            path="/dashboard"
            resourceKey="products"
            records={data.spotlightProducts}
            columns={["name", "selling_price"]}
            detailBasePath="/products"
            allowDelete={false}
          />
        </div>
      </div>
    );
  }

  if (root === "orders") {
    if (slug[1] === "create") {
      const data = await getOrdersPageData();
      return <OrderFormPage path="/orders/create" options={data.options} />;
    }

    if (slug[1] && slug[1] !== "create") {
      const [detail, data] = await Promise.all([getOrderDetail(slug[1]), getOrdersPageData()]);
      return <OrderDetailPage id={slug[1]} detail={detail} options={data.options} />;
    }

    const data = await getOrdersPageData(search);
    return <OrdersListPage search={search} data={data} />;
  }

  if (root === "customers" && slug[1]) {
    const detail = await getCustomerDetail(slug[1]);
    return <CustomerDetailPage detail={detail} id={slug[1]} />;
  }

  if (root === "campaigns" && slug[1]) {
    const detail = await getCampaignDetail(slug[1]);
    return <CampaignDetailPage id={slug[1]} detail={detail} />;
  }

  if (root === "products" && slug[1] === "create") {
    return await renderEntityPage("products", slugPath(slug));
  }

  if (
    [
      "customers",
      "products",
      "brands",
      "categories",
      "warehouses",
      "suppliers",
      "delivery-partners",
      "delivery-men",
      "sales-channels",
      "marketers",
      "ad-accounts",
      "campaigns",
      "charges",
      "wallets",
      "payments",
      "payouts",
      "statuses"
    ].includes(root)
  ) {
    if (slug[1]) {
      return await renderEntityDetailPage(root, slugPath(slug), slug[1]);
    }
    return await renderEntityPage(root, slugPath(slug), search);
  }

  if (root === "stock" || root === "stock-alerts") {
    const data = await getStockPageData();
    return <StockPage data={data} activeTab={root} />;
  }

  if (root === "purchases" || root === "returns") {
    const data = await getProcurementPageData(root as "purchases" | "returns");
    return <ProcurementPage kind={root as "purchases" | "returns"} data={data} />;
  }

  if (root === "pricing-matrix" || root === "delivery-analytics") {
    const data = await getDeliveryPageData();
    return <DeliveryPage data={data} activeTab={root} />;
  }

  if (root === "finance") {
    const data = await getFinanceData();
    return <FinancePage data={data} />;
  }

  if (root === "analytics") {
    const data = await getAnalyticsData();
    return <AnalyticsPage data={data} />;
  }

  if (root === "ecomlabs") {
    const data = await getEcomlabsData();
    return <EcomlabsPage data={data} />;
  }

  if (root === "team" || root === "settings") {
    const data = await getTeamSettingsData();
    return root === "team" ? <TeamPage data={data} /> : <SettingsPage data={data} />;
  }

  const definition = tenantRouteCatalog[pathKey] ?? tenantRouteCatalog[root];
  return (
    <ModulePage
      eyebrow={definition?.eyebrow ?? "Tenant Workspace"}
      title={definition?.title ?? "Module"}
      description={definition?.description ?? "Module page"}
      actions={definition?.actions ?? []}
      stats={[
        { label: "Status", value: "Connected" },
        { label: "Records", value: "Live" },
        { label: "Mode", value: "Operational" }
      ]}
    />
  );
}

async function renderEntityPage(resourceKey: string, path: string, search?: string) {
  const list = await getEntityList(resourceKey, search);
  const config = getEntityConfig(resourceKey);
  if (!list || !config) {
    return null;
  }

  const options = Object.fromEntries(
    await Promise.all(
      config.fields
        .filter((field) => field.optionsTable)
        .map(async (field) => [field.key, await getEntityOptions(field.optionsTable!)] as const)
    )
  ) as Record<string, Record<string, unknown>[]>;

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border bg-card p-8 shadow-soft">
        <h1 className="text-4xl font-semibold">{config.title}</h1>
        <p className="mt-3 text-muted-foreground">{config.description}</p>
      </section>
      <form className="flex gap-3" action={path}>
        <Input name="search" defaultValue={search ?? ""} placeholder={`Search ${config.title.toLowerCase()}`} />
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>
      <EntityForm resourceKey={resourceKey} path={path} options={options} />
      <EntityTable
        title={`${config.title} List`}
        description={`Live records from ${config.table}.`}
        path={path}
        resourceKey={resourceKey}
        records={list.records}
        columns={config.listColumns}
        detailBasePath={`/${resourceKey}`}
      />
    </div>
  );
}

async function renderEntityDetailPage(resourceKey: string, path: string, id: string) {
  const data = await getEntityRecord(resourceKey, id);
  const config = getEntityConfig(resourceKey);
  if (!data || !data.record || !config) {
    return (
      <ModulePage
        eyebrow="Missing"
        title="Record not found"
        description="The requested record does not exist."
        actions={[]}
        stats={[]}
      />
    );
  }

  const options = Object.fromEntries(
    await Promise.all(
      config.fields
        .filter((field) => field.optionsTable)
        .map(async (field) => [field.key, await getEntityOptions(field.optionsTable!)] as const)
    )
  ) as Record<string, Record<string, unknown>[]>;

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border bg-card p-8 shadow-soft">
        <h1 className="text-4xl font-semibold">{config.title} Detail</h1>
        <p className="mt-3 text-muted-foreground">Update this {config.singular} with live tenant-scoped data.</p>
      </section>
      <EntityForm resourceKey={resourceKey} path={path} record={data.record} options={options} />
      <Card>
        <CardHeader>
          <CardTitle>Raw record view</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="overflow-auto rounded-2xl bg-secondary p-4 text-xs">
            {JSON.stringify(data.record, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

function OrderFormPage({
  path,
  options,
  order
}: {
  path: string;
  options: Record<string, Record<string, unknown>[]>;
  order?: Record<string, unknown> | null;
}) {
  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border bg-card p-8 shadow-soft">
        <h1 className="text-4xl font-semibold">{order ? "Edit Order" : "Create Order"}</h1>
        <p className="mt-3 text-muted-foreground">
          Create a real order, link it to a customer, and keep the initial order item and status history in sync.
        </p>
      </section>
      <Card>
        <CardHeader>
          <CardTitle>Order Form</CardTitle>
          <CardDescription>Writes directly into `orders`, `order_items`, and `order_status_history`.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={saveOrderAction.bind(null, path)} className="grid gap-4 md:grid-cols-2">
            {order?.id ? <input type="hidden" name="id" value={String(order.id)} /> : null}
            <label className="space-y-2">
              <span className="text-sm font-medium">Order number</span>
              <Input name="order_number" defaultValue={String(order?.order_number ?? "")} required />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Existing customer</span>
              <Select name="customer_id" defaultValue={String(order?.customer_id ?? "")}>
                <option value="">Create from fields below</option>
                {options.customers.map((option) => (
                  <option key={String(option.id)} value={String(option.id)}>
                    {optionLabel(option)}
                  </option>
                ))}
              </Select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Customer name</span>
              <Input name="customer_name" placeholder="Used only if no existing customer is selected" />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Customer phone</span>
              <Input name="customer_phone" />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Wilaya</span>
              <Select name="customer_wilaya_id">
                <option value="">Select wilaya</option>
                {options.wilayas.map((option) => (
                  <option key={String(option.id)} value={String(option.id)}>
                    {optionLabel(option)}
                  </option>
                ))}
              </Select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Commune</span>
              <Select name="customer_commune_id">
                <option value="">Select commune</option>
                {options.communes.map((option) => (
                  <option key={String(option.id)} value={String(option.id)}>
                    {optionLabel(option)}
                  </option>
                ))}
              </Select>
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium">Address</span>
              <Textarea name="customer_address_line1" />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Status</span>
              <Select name="status_id" defaultValue={String(order?.status_id ?? "")}>
                <option value="">Select status</option>
                {options.statuses.map((option) => (
                  <option key={String(option.id)} value={String(option.id)}>
                    {optionLabel(option)}
                  </option>
                ))}
              </Select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Sales channel</span>
              <Select name="sales_channel_id" defaultValue={String(order?.sales_channel_id ?? "")}>
                <option value="">Select sales channel</option>
                {options.channels.map((option) => (
                  <option key={String(option.id)} value={String(option.id)}>
                    {optionLabel(option)}
                  </option>
                ))}
              </Select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Campaign</span>
              <Select name="campaign_id" defaultValue={String(order?.campaign_id ?? "")}>
                <option value="">Select campaign</option>
                {options.campaigns.map((option) => (
                  <option key={String(option.id)} value={String(option.id)}>
                    {optionLabel(option)}
                  </option>
                ))}
              </Select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Subtotal</span>
              <Input name="subtotal" type="number" defaultValue={String(order?.subtotal ?? "")} required />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Delivery fee</span>
              <Input name="delivery_fee" type="number" defaultValue={String(order?.delivery_fee ?? "")} required />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Item name</span>
              <Input name="item_name" required />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Item quantity</span>
              <Input name="item_quantity" type="number" defaultValue="1" required />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Item unit price</span>
              <Input name="item_unit_price" type="number" required />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Item cost price</span>
              <Input name="item_cost_price" type="number" defaultValue="0" required />
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium">Notes</span>
              <Textarea name="notes" defaultValue={String(order?.notes ?? "")} />
            </label>
            <div className="md:col-span-2">
              <Button type="submit">{order ? "Save order changes" : "Create order"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function OrdersListPage({
  search,
  data
}: {
  search?: string;
  data: Awaited<ReturnType<typeof getOrdersPageData>>;
}) {
  const records = data.list?.records ?? [];

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border bg-card p-8 shadow-soft">
        <h1 className="text-4xl font-semibold">Orders</h1>
        <p className="mt-3 text-muted-foreground">Filter, review, create, and open live orders from Supabase.</p>
      </section>
      <KpiStrip
        items={Object.entries(data.statusCounts).map(([label, value]) => ({
          label,
          value: String(value)
        }))}
      />
      <form className="flex gap-3" action="/orders">
        <Input name="search" defaultValue={search ?? ""} placeholder="Search orders by order number or notes" />
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>
      <EntityTable
        title="Orders Queue"
        description="Live order queue"
        path="/orders"
        resourceKey="orders"
        records={records}
        columns={["order_number", "subtotal", "delivery_fee", "total_amount", "created_at"]}
        detailBasePath="/orders"
      />
      <EntityTable
        title="Recent Status Changes"
        description="Latest pipeline activity"
        path="/orders"
        resourceKey="orders"
        records={data.recentStatusEvents}
        columns={["order_id", "next_status_id", "created_at"]}
        detailBasePath="/orders"
        allowDelete={false}
        allowOpen={false}
      />
      <OrderFormPage path="/orders" options={data.options} />
    </div>
  );
}

function OrderDetailPage({
  id,
  detail,
  options
}: {
  id: string;
  detail: Awaited<ReturnType<typeof getOrderDetail>>;
  options: Record<string, Record<string, unknown>[]>;
}) {
  if (!detail.order) {
    return <ModulePage eyebrow="Orders" title="Order not found" description="This order does not exist." actions={[]} stats={[]} />;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border bg-card p-8 shadow-soft">
        <h1 className="text-4xl font-semibold">Order Detail</h1>
        <p className="mt-3 text-muted-foreground">Review item lines, status history, shipment linkage, and order edits.</p>
      </section>
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>{String(detail.order.order_number ?? id)}</CardTitle>
            <CardDescription>Live order snapshot</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl bg-secondary p-4">
                <div className="text-muted-foreground">Subtotal</div>
                <div className="mt-1 text-lg font-semibold">{String(detail.order.subtotal ?? 0)} DZD</div>
              </div>
              <div className="rounded-2xl bg-secondary p-4">
                <div className="text-muted-foreground">Delivery</div>
                <div className="mt-1 text-lg font-semibold">{String(detail.order.delivery_fee ?? 0)} DZD</div>
              </div>
              <div className="rounded-2xl bg-secondary p-4">
                <div className="text-muted-foreground">Total</div>
                <div className="mt-1 text-lg font-semibold">{String(detail.order.total_amount ?? 0)} DZD</div>
              </div>
              <div className="rounded-2xl bg-secondary p-4">
                <div className="text-muted-foreground">Real delivery cost</div>
                <div className="mt-1 text-lg font-semibold">{String(detail.order.real_delivery_cost ?? 0)} DZD</div>
              </div>
            </div>
            <pre className="overflow-auto rounded-2xl bg-secondary p-4 text-xs">{JSON.stringify(detail.order, null, 2)}</pre>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Status Change</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={updateOrderStatusAction.bind(null, id, `/orders/${id}`)} className="grid gap-4">
              <Select name="next_status_id">
                <option value="">Select status</option>
                {options.statuses.map((status) => (
                  <option key={String(status.id)} value={String(status.id)}>
                    {optionLabel(status)}
                  </option>
                ))}
              </Select>
              <Input name="status_note" placeholder="Status note" />
              <Button type="submit">Update status</Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <OrderFormPage path={`/orders/${id}`} options={options} order={detail.order} />
      <EntityTable
        title="Order Items"
        description="Current item lines"
        path={`/orders/${id}`}
        resourceKey="orders"
        records={detail.items}
        columns={["product_name", "quantity", "unit_price", "cost_price"]}
        detailBasePath="/orders"
        allowDelete={false}
        allowOpen={false}
      />
      <EntityTable
        title="Status History"
        description="Status timeline"
        path={`/orders/${id}`}
        resourceKey="orders"
        records={detail.history}
        columns={["note", "created_at"]}
        detailBasePath="/orders"
        allowDelete={false}
        allowOpen={false}
      />
      <EntityTable
        title="Shipments"
        description="Delivery links"
        path={`/orders/${id}`}
        resourceKey="orders"
        records={detail.shipments}
        columns={["tracking_number", "status", "customer_fee", "real_partner_cost"]}
        detailBasePath="/orders"
        allowDelete={false}
        allowOpen={false}
      />
      <EntityTable
        title="Shipment Events"
        description="Tracking and operational event log"
        path={`/orders/${id}`}
        resourceKey="orders"
        records={detail.shipmentEvents}
        columns={["event_type", "created_at"]}
        detailBasePath="/orders"
        allowDelete={false}
        allowOpen={false}
      />
    </div>
  );
}

function CustomerDetailPage({
  detail,
  id
}: {
  detail: Awaited<ReturnType<typeof getCustomerDetail>>;
  id: string;
}) {
  if (!detail.customer) {
    return <ModulePage eyebrow="Customers" title="Customer not found" description="This customer does not exist." actions={[]} stats={[]} />;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border bg-card p-8 shadow-soft">
        <h1 className="text-4xl font-semibold">Customer Detail</h1>
        <p className="mt-3 text-muted-foreground">Review customer record, order history, notes, and spend statistics.</p>
      </section>
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>{String(detail.customer.full_name ?? id)}</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="overflow-auto rounded-2xl bg-secondary p-4 text-xs">{JSON.stringify(detail.customer, null, 2)}</pre>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Customer Stats</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="rounded-2xl bg-secondary p-4">
              <div className="text-muted-foreground">Orders</div>
              <div className="mt-1 text-2xl font-semibold">{detail.orders.length}</div>
            </div>
            <div className="rounded-2xl bg-secondary p-4">
              <div className="text-muted-foreground">Total spent</div>
              <div className="mt-1 text-2xl font-semibold">{detail.totalSpent.toFixed(0)} DZD</div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Add Note</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={saveCustomerNoteAction.bind(null, id, `/customers/${id}`)} className="space-y-4">
            <Textarea name="note" placeholder="Record follow-up context, blacklist reasons, or important delivery details." />
            <Button type="submit">Save note</Button>
          </form>
        </CardContent>
      </Card>
      <EntityTable
        title="Orders"
        description="Customer order history"
        path={`/customers/${id}`}
        resourceKey="customers"
        records={detail.orders}
        columns={["order_number", "total_amount", "created_at"]}
        detailBasePath="/orders"
        allowDelete={false}
      />
      <EntityTable
        title="Notes"
        description="Customer notes"
        path={`/customers/${id}`}
        resourceKey="customers"
        records={detail.notes}
        columns={["note", "created_at"]}
        detailBasePath="/customers"
        allowDelete={false}
        allowOpen={false}
      />
    </div>
  );
}

function StockPage({
  data,
  activeTab
}: {
  data: Awaited<ReturnType<typeof getStockPageData>>;
  activeTab: string;
}) {
  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border bg-card p-8 shadow-soft">
        <h1 className="text-4xl font-semibold">Stock Control</h1>
        <p className="mt-3 text-muted-foreground">Live stock records, adjustments, movement logs, and low-stock visibility.</p>
      </section>
      <Card>
        <CardHeader>
          <CardTitle>Stock Adjustment</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={saveStockAdjustmentAction.bind(null, "/stock")} className="grid gap-4 md:grid-cols-4">
            <Select name="warehouse_id">
              <option value="">Warehouse</option>
              {data.options.warehouses.map((option) => (
                <option key={String(option.id)} value={String(option.id)}>
                  {optionLabel(option)}
                </option>
              ))}
            </Select>
            <Select name="product_id">
              <option value="">Product</option>
              {data.options.products.map((option) => (
                <option key={String(option.id)} value={String(option.id)}>
                  {optionLabel(option)}
                </option>
              ))}
            </Select>
            <Input name="quantity" type="number" placeholder="Quantity delta" />
            <Input name="reason" placeholder="Reason" />
            <div className="md:col-span-4">
              <Button type="submit">Save adjustment</Button>
            </div>
          </form>
        </CardContent>
      </Card>
      {activeTab === "stock-alerts" ? (
        <EntityTable
          title="Low Stock Alerts"
          description="Records at or below the minimum threshold"
          path="/stock-alerts"
          resourceKey="warehouses"
          records={data.lowStock}
          columns={["warehouse_id", "product_id", "quantity", "min_threshold"]}
          detailBasePath="/stock"
          allowDelete={false}
          allowOpen={false}
        />
      ) : null}
      <EntityTable
        title="Stock"
        description="Per warehouse per product stock"
        path="/stock"
        resourceKey="warehouses"
        records={data.stock}
        columns={["warehouse_id", "product_id", "quantity", "reserved_quantity", "min_threshold"]}
        detailBasePath="/stock"
        allowDelete={false}
        allowOpen={false}
      />
      <EntityTable
        title="Stock Movements"
        description="Latest movement log"
        path="/stock"
        resourceKey="warehouses"
        records={data.movements}
        columns={["movement_type", "quantity", "reason", "created_at"]}
        detailBasePath="/stock"
        allowDelete={false}
        allowOpen={false}
      />
    </div>
  );
}

function ProcurementPage({
  kind,
  data
}: {
  kind: "purchases" | "returns";
  data: Awaited<ReturnType<typeof getProcurementPageData>>;
}) {
  const path = `/${kind}`;
  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border bg-card p-8 shadow-soft">
        <h1 className="text-4xl font-semibold">{kind === "purchases" ? "Purchases" : "Returns"}</h1>
        <p className="mt-3 text-muted-foreground">Create procurement entries and keep stock quantities and movement logs in sync.</p>
      </section>
      <Card>
        <CardHeader>
          <CardTitle>{kind === "purchases" ? "New Purchase Entry" : "New Return Entry"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={saveProcurementEntryAction.bind(null, kind, path)} className="grid gap-4 md:grid-cols-2">
            <Input name="reference" placeholder="Reference" required />
            <Select name="supplier_id">
              <option value="">Supplier</option>
              {data.options.suppliers.map((option) => (
                <option key={String(option.id)} value={String(option.id)}>
                  {optionLabel(option)}
                </option>
              ))}
            </Select>
            <Select name="warehouse_id">
              <option value="">Warehouse</option>
              {data.options.warehouses.map((option) => (
                <option key={String(option.id)} value={String(option.id)}>
                  {optionLabel(option)}
                </option>
              ))}
            </Select>
            <Select name="product_id">
              <option value="">Product</option>
              {data.options.products.map((option) => (
                <option key={String(option.id)} value={String(option.id)}>
                  {optionLabel(option)}
                </option>
              ))}
            </Select>
            <Input name="quantity" type="number" placeholder="Quantity" required />
            <Input name="unit_cost" type="number" placeholder="Unit cost" required />
            {kind === "returns" ? <Input name="return_reason" placeholder="Return reason" /> : null}
            <Textarea name="notes" placeholder="Notes" />
            <div className="md:col-span-2">
              <Button type="submit">Save entry</Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <EntityTable
        title="Entries"
        description="Live procurement entries"
        path={path}
        resourceKey="suppliers"
        records={data.entries}
        columns={["reference", "warehouse_id", "supplier_id", "created_at"]}
        detailBasePath={path}
        allowDelete={false}
        allowOpen={false}
      />
      <EntityTable
        title="Items"
        description="Associated item lines"
        path={path}
        resourceKey="suppliers"
        records={data.items}
        columns={["product_id", "quantity", "unit_cost", "created_at"]}
        detailBasePath={path}
        allowDelete={false}
        allowOpen={false}
      />
    </div>
  );
}

function DeliveryPage({
  data,
  activeTab
}: {
  data: Awaited<ReturnType<typeof getDeliveryPageData>>;
  activeTab: string;
}) {
  const statusCards = Object.entries(data.shipmentStatusCounts).map(([label, value]) => ({
    label,
    value: String(value)
  }));

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border bg-card p-8 shadow-soft">
        <h1 className="text-4xl font-semibold">Delivery Operations</h1>
        <p className="mt-3 text-muted-foreground">Manage pricing, shipments, partner assignment, tracking, and status simulation.</p>
      </section>
      {statusCards.length > 0 ? <KpiStrip items={statusCards} /> : null}
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Create Shipment</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createShipmentAction.bind(null, "/delivery-analytics")} className="grid gap-4 md:grid-cols-2">
              <Select name="order_id">
                <option value="">Order</option>
                {data.orders.map((option) => (
                  <option key={String(option.id)} value={String(option.id)}>
                    {optionLabel(option)}
                  </option>
                ))}
              </Select>
              <Select name="delivery_partner_id">
                <option value="">Partner</option>
                {data.partners.map((option) => (
                  <option key={String(option.id)} value={String(option.id)}>
                    {optionLabel(option)}
                  </option>
                ))}
              </Select>
              <Select name="delivery_man_id">
                <option value="">Delivery man</option>
                {data.deliveryMen.map((option) => (
                  <option key={String(option.id)} value={String(option.id)}>
                    {optionLabel(option)}
                  </option>
                ))}
              </Select>
              <Input name="product_list" placeholder="Product list" />
              <Input name="quantity" type="number" defaultValue="1" />
              <Input name="customer_fee" type="number" placeholder="Optional customer fee override" />
              <Input name="real_partner_cost" type="number" placeholder="Optional partner cost override" />
              <label className="flex items-center gap-3 rounded-2xl border p-3 md:col-span-2">
                <Checkbox name="stop_desk" />
                <span className="text-sm font-medium">Stop desk shipment</span>
              </label>
              <div className="md:col-span-2">
                <Button type="submit">Create shipment</Button>
              </div>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pricing Matrix</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={savePricingMatrixAction.bind(null, "/pricing-matrix")} className="grid gap-4 md:grid-cols-2">
              <Select name="delivery_partner_id">
                <option value="">Partner</option>
                {data.partners.map((option) => (
                  <option key={String(option.id)} value={String(option.id)}>
                    {optionLabel(option)}
                  </option>
                ))}
              </Select>
              <Select name="wilaya_id">
                <option value="">Wilaya</option>
                {data.wilayas.map((option) => (
                  <option key={String(option.id)} value={String(option.id)}>
                    {optionLabel(option)}
                  </option>
                ))}
              </Select>
              <Select name="commune_id">
                <option value="">Commune</option>
                {data.communes.map((option) => (
                  <option key={String(option.id)} value={String(option.id)}>
                    {optionLabel(option)}
                  </option>
                ))}
              </Select>
              <Input name="customer_fee" type="number" placeholder="Customer fee" />
              <Input name="partner_cost" type="number" placeholder="Partner cost" />
              <label className="flex items-center gap-3 rounded-2xl border p-3">
                <Checkbox name="is_default_fallback" />
                <span className="text-sm font-medium">Default fallback</span>
              </label>
              <label className="flex items-center gap-3 rounded-2xl border p-3">
                <Checkbox name="is_active" defaultChecked />
                <span className="text-sm font-medium">Active</span>
              </label>
              <div className="md:col-span-2">
                <Button type="submit">Save pricing row</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Shipment Status Tools</CardTitle>
          <CardDescription>Use manual updates, sync tracking, or cancel a shipment without leaving the page.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateShipmentAction.bind(null, "/delivery-analytics")} className="grid gap-4 md:grid-cols-4">
            <Select name="shipment_id">
              <option value="">Shipment</option>
              {data.shipments.map((shipment) => (
                <option key={String(shipment.id)} value={String(shipment.id)}>
                  {String(shipment.tracking_number ?? shipment.id)}
                </option>
              ))}
            </Select>
            <Select name="mode">
              <option value="manual">Manual status update</option>
              <option value="track">Sync tracking</option>
              <option value="cancel">Cancel shipment</option>
            </Select>
            <Select name="status">
              <option value="">Choose manual status</option>
              <option value="pending_pickup">pending_pickup</option>
              <option value="submitted">submitted</option>
              <option value="in_transit">in_transit</option>
              <option value="delivered">delivered</option>
              <option value="failed_delivery">failed_delivery</option>
              <option value="returned">returned</option>
              <option value="cancelled">cancelled</option>
            </Select>
            <Button type="submit">Apply</Button>
          </form>
        </CardContent>
      </Card>
      {activeTab === "pricing-matrix" ? (
        <EntityTable
          title="Pricing Matrix"
          description="Location-based pricing rows"
          path="/pricing-matrix"
          resourceKey="delivery-partners"
          records={data.pricing}
          columns={["wilaya_id", "commune_id", "customer_fee", "partner_cost", "is_active"]}
          detailBasePath="/pricing-matrix"
          allowDelete={false}
          allowOpen={false}
        />
      ) : (
        <>
          <EntityTable
            title="Shipments"
            description="Shipment tracking and status"
            path="/delivery-analytics"
            resourceKey="delivery-partners"
            records={data.shipments}
            columns={["tracking_number", "status", "customer_fee", "real_partner_cost", "created_at"]}
            detailBasePath="/delivery-analytics"
            allowDelete={false}
            allowOpen={false}
          />
          <EntityTable
            title="Delivery Events"
            description="Latest shipment event log"
            path="/delivery-analytics"
            resourceKey="delivery-partners"
            records={data.events}
            columns={["event_type", "shipment_id", "created_at"]}
            detailBasePath="/delivery-analytics"
            allowDelete={false}
            allowOpen={false}
          />
        </>
      )}
    </div>
  );
}

function FinancePage({
  data
}: {
  data: Awaited<ReturnType<typeof getFinanceData>>;
}) {
  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border bg-card p-8 shadow-soft">
        <h1 className="text-4xl font-semibold">Finance Dashboard</h1>
        <p className="mt-3 text-muted-foreground">Revenue, charges, payouts, transactions, and cash visibility from live records.</p>
      </section>
      <KpiStrip items={data.kpis} />
      <EntityTable title="Charges" description="Latest charges" path="/finance" resourceKey="charges" records={data.charges} columns={["amount", "charged_at", "notes"]} detailBasePath="/charges" allowDelete={false} />
      <EntityTable title="Wallets" description="Wallet balances" path="/finance" resourceKey="wallets" records={data.wallets} columns={["name", "balance", "currency_code"]} detailBasePath="/wallets" allowDelete={false} />
      <EntityTable title="Payments" description="Incoming payments" path="/finance" resourceKey="payments" records={data.payments} columns={["amount", "method", "paid_at"]} detailBasePath="/payments" allowDelete={false} />
      <EntityTable title="Payouts" description="Outgoing payouts" path="/finance" resourceKey="payouts" records={data.payouts} columns={["beneficiary_name", "amount", "status", "paid_at"]} detailBasePath="/payouts" allowDelete={false} />
      <EntityTable title="Transactions" description="General ledger feed" path="/finance" resourceKey="wallets" records={data.transactions} columns={["amount", "direction", "occurred_at"]} detailBasePath="/finance" allowDelete={false} allowOpen={false} />
    </div>
  );
}

function AnalyticsPage({
  data
}: {
  data: Awaited<ReturnType<typeof getAnalyticsData>>;
}) {
  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border bg-card p-8 shadow-soft">
        <h1 className="text-4xl font-semibold">Analytics</h1>
        <p className="mt-3 text-muted-foreground">KPI cards, ranking tables, and performance charts from tenant data.</p>
      </section>
      <KpiStrip items={data.kpis} />
      <Card>
        <CardHeader>
          <CardTitle>Revenue Chart</CardTitle>
          <CardDescription>Latest revenue sequence from live orders.</CardDescription>
        </CardHeader>
        <CardContent>
          <SimpleBarChart data={data.chartData.map((entry) => ({ label: entry.label, value: entry.revenue }))} color="#10b981" />
        </CardContent>
      </Card>
      <div className="grid gap-6 xl:grid-cols-2">
        <EntityTable title="Products Ranking" description="Products in analytics scope" path="/analytics" resourceKey="products" records={data.products} columns={["name", "selling_price"]} detailBasePath="/products" allowDelete={false} />
        <EntityTable title="Campaigns" description="Campaign records" path="/analytics" resourceKey="campaigns" records={data.campaigns} columns={["name", "spend_usd"]} detailBasePath="/campaigns" allowDelete={false} />
      </div>
      <EntityTable title="Team" description="Team members available for operational analysis" path="/analytics" resourceKey="campaigns" records={data.team} columns={["full_name", "role", "created_at"]} detailBasePath="/team" allowDelete={false} allowOpen={false} />
    </div>
  );
}

function CampaignDetailPage({
  id,
  detail
}: {
  id: string;
  detail: Awaited<ReturnType<typeof getCampaignDetail>>;
}) {
  if (!detail.campaign) {
    return <ModulePage eyebrow="Marketing" title="Campaign not found" description="This campaign does not exist." actions={[]} stats={[]} />;
  }

  const spendDzd = Number(detail.campaign.spend_usd ?? 0) * Number(detail.campaign.exchange_rate ?? 1);

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border bg-card p-8 shadow-soft">
        <h1 className="text-4xl font-semibold">Campaign Detail</h1>
        <p className="mt-3 text-muted-foreground">Track spend, daily metrics, and conversion efficiency for a live campaign.</p>
      </section>
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{String(detail.campaign.name ?? id)}</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="overflow-auto rounded-2xl bg-secondary p-4 text-xs">{JSON.stringify(detail.campaign, null, 2)}</pre>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Campaign KPIs</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="rounded-2xl bg-secondary p-4">
              <div className="text-muted-foreground">Spend DZD</div>
              <div className="mt-1 text-2xl font-semibold">{spendDzd.toFixed(0)} DZD</div>
            </div>
            <div className="rounded-2xl bg-secondary p-4">
              <div className="text-muted-foreground">Impressions</div>
              <div className="mt-1 text-2xl font-semibold">{detail.totals.impressions}</div>
            </div>
            <div className="rounded-2xl bg-secondary p-4">
              <div className="text-muted-foreground">Clicks / Conversions</div>
              <div className="mt-1 text-2xl font-semibold">
                {detail.totals.clicks} / {detail.totals.conversions}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Save Daily Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={saveCampaignMetricAction.bind(null, id, `/campaigns/${id}`)} className="grid gap-4 md:grid-cols-5">
            <Input name="metric_date" type="date" required />
            <Input name="impressions" type="number" placeholder="Impressions" required />
            <Input name="clicks" type="number" placeholder="Clicks" required />
            <Input name="conversions" type="number" placeholder="Conversions" required />
            <Input name="spend_dzd" type="number" placeholder="Spend DZD" defaultValue={spendDzd.toFixed(0)} />
            <div className="md:col-span-5">
              <Button type="submit">Save daily metric</Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <EntityTable
        title="Daily Metrics"
        description="Campaign performance by day"
        path={`/campaigns/${id}`}
        resourceKey="campaigns"
        records={detail.metrics}
        columns={["metric_date", "impressions", "clicks", "conversions", "ctr", "cpc", "cpa", "cvr"]}
        detailBasePath="/campaigns"
        allowDelete={false}
        allowOpen={false}
      />
    </div>
  );
}

function TeamPage({
  data
}: {
  data: Awaited<ReturnType<typeof getTeamSettingsData>>;
}) {
  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border bg-card p-8 shadow-soft">
        <h1 className="text-4xl font-semibold">Team</h1>
        <p className="mt-3 text-muted-foreground">Manage tenant member roles and active state without duplicating auth systems.</p>
      </section>
      {data.members.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-sm text-muted-foreground">No tenant members yet.</CardContent>
        </Card>
      ) : (
        data.members.map((member) => (
          <Card key={String(member.id)}>
            <CardHeader>
              <CardTitle>{String(member.full_name ?? member.id)}</CardTitle>
              <CardDescription>{String(member.role ?? "tenant_user")}</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={updateTeamMemberAction.bind(null, String(member.id), "/team")} className="grid gap-4 md:grid-cols-[1fr_auto_auto]">
                <Select name="role" defaultValue={String(member.role ?? "")}>
                  {data.roles.map((role) => (
                    <option key={String(role.code)} value={String(role.code)}>
                      {String(role.name ?? role.code)}
                    </option>
                  ))}
                </Select>
                <label className="flex items-center gap-3 rounded-2xl border px-4 py-3">
                  <Checkbox name="is_active" defaultChecked={Boolean(member.is_active)} />
                  <span className="text-sm font-medium">Active</span>
                </label>
                <Button type="submit">Update member</Button>
              </form>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

function SettingsPage({
  data
}: {
  data: Awaited<ReturnType<typeof getTeamSettingsData>>;
}) {
  const organizationRecord = data.organization as unknown as Record<string, unknown>;
  const branding = (organizationRecord.branding as Record<string, unknown> | null) ?? {};
  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border bg-card p-8 shadow-soft">
        <h1 className="text-4xl font-semibold">Workspace Settings</h1>
        <p className="mt-3 text-muted-foreground">Configure tenant identity, contact details, and native EcomLabs defaults.</p>
      </section>
      <Card>
        <CardHeader>
          <CardTitle>Workspace Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={saveTenantSettingsAction.bind(null, "/settings")} className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium">Organization name</span>
              <Input name="organization_name" defaultValue={String(organizationRecord.name ?? "")} />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Contact email</span>
              <Input name="contact_email" type="email" defaultValue={String(organizationRecord.contact_email ?? "")} />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Contact phone</span>
              <Input name="contact_phone" defaultValue={String(organizationRecord.contact_phone ?? "")} />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Accent color</span>
              <Input name="accent_color" defaultValue={String(branding.accentColor ?? "#0f766e")} />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Support email</span>
              <Input name="support_email" type="email" defaultValue={String(branding.supportEmail ?? "")} />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">AI provider</span>
              <Input name="ai_provider" defaultValue={String(data.aiConfig?.provider ?? "openai")} />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">AI model</span>
              <Input name="ai_model" defaultValue={String(data.aiConfig?.model ?? "gpt-4.1-mini")} />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">AI tone</span>
              <Input name="ai_tone" defaultValue={String(((data.aiConfig?.settings as Record<string, unknown> | null)?.tone ?? "conversion-focused"))} />
            </label>
            <div className="md:col-span-2">
              <Button type="submit">Save settings</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function EcomlabsPage({
  data
}: {
  data: Awaited<ReturnType<typeof getEcomlabsData>>;
}) {
  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border bg-card p-8 shadow-soft">
        <h1 className="text-4xl font-semibold">EcomLabs Workspace</h1>
        <p className="mt-3 text-muted-foreground">Run tools, inspect structured output, and save prompt history.</p>
      </section>
      <EcomlabsWorkspace
        initialHistory={data.history}
        savedOutputs={data.savedOutputs}
        generatedOutputs={data.generatedOutputs}
      />
    </div>
  );
}

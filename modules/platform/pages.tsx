import { KpiStrip } from "@/components/layout/kpi-strip";
import { EntityTable } from "@/components/tenant/entity-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  invitePlatformAdminAction,
  savePlanAction,
  savePlatformSettingAction,
  saveSubscriptionAction,
  saveTenantAction
} from "@/modules/platform/actions";
import { getPlatformDashboardData } from "@/modules/platform/data";
import { platformNavigation } from "@/modules/platform/navigation";

export async function renderPlatformRoute(slug: string[]) {
  const pathKey = slug.join("/") || "dashboard";
  const page = platformNavigation.find((entry) => entry.href === `/super-admin/${pathKey}`);
  const data = await getPlatformDashboardData();

  const kpis = [
    { label: "Tenants", value: String(data.organizations.length) },
    { label: "Subscriptions", value: String(data.subscriptions.length) },
    { label: "Plans", value: String(data.plans.length) },
    { label: "Super Admins", value: String(data.admins.length) }
  ];

  if (pathKey === "dashboard") {
    return (
      <PlatformShell title={page?.label ?? "Platform"} description={page?.description ?? "Platform-level governance."}>
        <KpiStrip items={kpis} />
        <EntityTable title="Tenants" description="Platform organizations" path="/super-admin/tenants" resourceKey="brands" records={data.organizations} columns={["slug", "name", "status", "created_at"]} detailBasePath="/super-admin/tenants" allowDelete={false} allowOpen={false} />
        <EntityTable title="Subscriptions" description="Subscription records" path="/super-admin/subscriptions" resourceKey="brands" records={data.subscriptions} columns={["organization_id", "plan_id", "status", "starts_at", "ends_at"]} detailBasePath="/super-admin/subscriptions" allowDelete={false} allowOpen={false} />
        <EntityTable title="Latest Audit Logs" description="Recent high-level system activity" path="/super-admin/audit-logs" resourceKey="brands" records={data.auditLogs} columns={["action", "entity_type", "created_at"]} detailBasePath="/super-admin/audit-logs" allowDelete={false} allowOpen={false} />
      </PlatformShell>
    );
  }

  if (pathKey === "tenants" || pathKey.startsWith("tenants/")) {
    return (
      <PlatformShell title="Tenants" description="Create, update, suspend, and review tenant organizations.">
        <Card>
          <CardHeader>
            <CardTitle>Create Tenant</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={saveTenantAction.bind(null, "/super-admin/tenants")} className="grid gap-4 md:grid-cols-2">
              <Input name="name" placeholder="Tenant name" required />
              <Input name="slug" placeholder="tenant-slug" required />
              <Input name="legal_name" placeholder="Legal name" />
              <Input name="contact_email" placeholder="Contact email" type="email" />
              <Input name="contact_phone" placeholder="Contact phone" />
              <Select name="status" defaultValue="active">
                <option value="active">active</option>
                <option value="suspended">suspended</option>
                <option value="expired">expired</option>
              </Select>
              <div className="md:col-span-2">
                <Button type="submit">Save tenant</Button>
              </div>
            </form>
          </CardContent>
        </Card>
        <EntityTable title="Tenants" description="Live tenant records" path="/super-admin/tenants" resourceKey="brands" records={data.organizations} columns={["slug", "name", "status", "contact_email", "created_at"]} detailBasePath="/super-admin/tenants" allowDelete={false} allowOpen={false} />
      </PlatformShell>
    );
  }

  if (pathKey === "subscriptions") {
    return (
      <PlatformShell title="Subscriptions" description="Assign plans and manage subscription lifecycle.">
        <Card>
          <CardHeader>
            <CardTitle>Create Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={saveSubscriptionAction.bind(null, "/super-admin/subscriptions")} className="grid gap-4 md:grid-cols-2">
              <Select name="organization_id">
                <option value="">Organization</option>
                {data.organizations.map((organization) => (
                  <option key={String(organization.id)} value={String(organization.id)}>
                    {String(organization.name ?? organization.slug ?? organization.id)}
                  </option>
                ))}
              </Select>
              <Select name="plan_id">
                <option value="">Plan</option>
                {data.plans.map((plan) => (
                  <option key={String(plan.id)} value={String(plan.id)}>
                    {String(plan.name ?? plan.code ?? plan.id)}
                  </option>
                ))}
              </Select>
              <Select name="status" defaultValue="active">
                <option value="trialing">trialing</option>
                <option value="active">active</option>
                <option value="past_due">past_due</option>
                <option value="expired">expired</option>
                <option value="canceled">canceled</option>
              </Select>
              <Input name="starts_at" type="date" />
              <Input name="ends_at" type="date" />
              <Input name="renews_at" type="date" />
              <div className="md:col-span-2">
                <Button type="submit">Save subscription</Button>
              </div>
            </form>
          </CardContent>
        </Card>
        <EntityTable title="Subscriptions" description="Live subscription records" path="/super-admin/subscriptions" resourceKey="brands" records={data.subscriptions} columns={["organization_id", "plan_id", "status", "starts_at", "ends_at"]} detailBasePath="/super-admin/subscriptions" allowDelete={false} allowOpen={false} />
      </PlatformShell>
    );
  }

  if (pathKey === "plans") {
    return (
      <PlatformShell title="Plans" description="Control entitlements and pricing for the SaaS platform.">
        <Card>
          <CardHeader>
            <CardTitle>Create Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={savePlanAction.bind(null, "/super-admin/plans")} className="grid gap-4 md:grid-cols-2">
              <Input name="name" placeholder="Plan name" required />
              <Input name="code" placeholder="growth" required />
              <Input name="monthly_price_dzd" type="number" placeholder="Monthly DZD" />
              <Input name="yearly_price_dzd" type="number" placeholder="Yearly DZD" />
              <Input name="max_users" type="number" placeholder="Max users" defaultValue="5" />
              <Input name="max_orders_per_month" type="number" placeholder="Max orders / month" />
              <Input name="max_ai_requests_per_month" type="number" placeholder="Max AI requests / month" />
              <label className="flex items-center gap-3 rounded-2xl border p-3">
                <Checkbox name="is_active" defaultChecked />
                <span className="text-sm font-medium">Active plan</span>
              </label>
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium">Description</span>
                <Textarea name="description" />
              </label>
              <div className="md:col-span-2">
                <Button type="submit">Save plan</Button>
              </div>
            </form>
          </CardContent>
        </Card>
        <EntityTable title="Plans" description="Current subscription plans" path="/super-admin/plans" resourceKey="brands" records={data.plans} columns={["code", "name", "monthly_price_dzd", "max_users", "is_active"]} detailBasePath="/super-admin/plans" allowDelete={false} allowOpen={false} />
      </PlatformShell>
    );
  }

  if (pathKey === "admins") {
    return (
      <PlatformShell title="Admins" description="Invite and monitor platform administrators.">
        <Card>
          <CardHeader>
            <CardTitle>Invite Platform Admin</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={invitePlatformAdminAction.bind(null, "/super-admin/admins")} className="grid gap-4 md:grid-cols-2">
              <Input name="full_name" placeholder="Full name" required />
              <Input name="email" placeholder="Email" type="email" required />
              <div className="md:col-span-2">
                <Button type="submit">Invite admin</Button>
              </div>
            </form>
          </CardContent>
        </Card>
        <EntityTable title="Platform Admins" description="Current super admins" path="/super-admin/admins" resourceKey="brands" records={data.admins} columns={["full_name", "role", "created_at"]} detailBasePath="/super-admin/admins" allowDelete={false} allowOpen={false} />
      </PlatformShell>
    );
  }

  if (pathKey === "settings") {
    return (
      <PlatformShell title="Settings" description="Platform-wide settings and governance controls.">
        <Card>
          <CardHeader>
            <CardTitle>Save Platform Setting</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={savePlatformSettingAction.bind(null, "/super-admin/settings")} className="grid gap-4">
              <Input name="key" placeholder="setting.key" required />
              <Textarea name="value" placeholder='{"rootDomain":"ecomlabs.online"}' />
              <Button type="submit">Save setting</Button>
            </form>
          </CardContent>
        </Card>
        <EntityTable title="Platform Settings" description="Current platform settings" path="/super-admin/settings" resourceKey="brands" records={data.settings} columns={["key", "updated_at"]} detailBasePath="/super-admin/settings" allowDelete={false} allowOpen={false} />
      </PlatformShell>
    );
  }

  if (pathKey === "platform-analytics") {
    return (
      <PlatformShell title="Platform Analytics" description="Global usage and subscription visibility across the platform.">
        <KpiStrip items={kpis} />
        <EntityTable title="Organizations" description="Tenant population snapshot" path="/super-admin/platform-analytics" resourceKey="brands" records={data.organizations} columns={["slug", "status", "created_at"]} detailBasePath="/super-admin/platform-analytics" allowDelete={false} allowOpen={false} />
        <EntityTable title="Plans" description="Plan mix" path="/super-admin/platform-analytics" resourceKey="brands" records={data.plans} columns={["name", "monthly_price_dzd", "max_users"]} detailBasePath="/super-admin/platform-analytics" allowDelete={false} allowOpen={false} />
      </PlatformShell>
    );
  }

  if (pathKey === "audit-logs") {
    return (
      <PlatformShell title="Audit Logs" description="Recent platform-level administrative activity.">
        <EntityTable title="Audit Logs" description="Immutable platform activity" path="/super-admin/audit-logs" resourceKey="brands" records={data.auditLogs} columns={["action", "entity_type", "entity_id", "created_at"]} detailBasePath="/super-admin/audit-logs" allowDelete={false} allowOpen={false} />
      </PlatformShell>
    );
  }

  return null;
}

function PlatformShell({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border bg-card p-8 shadow-soft">
        <h1 className="text-4xl font-semibold">{title}</h1>
        <p className="mt-3 text-muted-foreground">{description}</p>
      </section>
      {children}
    </div>
  );
}

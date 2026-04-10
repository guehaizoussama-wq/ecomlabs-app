import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiStrip } from "@/components/layout/kpi-strip";

export function ModulePage({
  eyebrow,
  title,
  description,
  actions,
  stats
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions: string[];
  stats: {
    label: string;
    value: string;
  }[];
}) {
  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border bg-card p-8 shadow-soft">
        <Badge>{eyebrow}</Badge>
        <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-3 text-base text-muted-foreground">{description}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {actions.map((action) => (
              <Button key={action} variant="outline">
                {action}
              </Button>
            ))}
          </div>
        </div>
      </section>

      <KpiStrip items={stats} />

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <Card>
          <CardHeader>
            <CardTitle>Enterprise workflow coverage</CardTitle>
            <CardDescription>
              This module shell is wired for tenant-safe server rendering, reusable data tables, form patterns, and RBAC-aware actions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>Data access belongs in service modules under `modules/*` and should always scope by `organization_id` before rendering.</p>
            <p>Forms should use Zod validation schemas, server actions or route handlers, and activity logging after every state transition.</p>
            <p>Charts, exports, and automation hooks should consume the same normalized domain records used by the operational tables.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Ready next steps</CardTitle>
            <CardDescription>Recommended implementation checkpoints for this area.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded-xl bg-secondary p-4">Connect Supabase repositories and server actions for live CRUD.</div>
            <div className="rounded-xl bg-secondary p-4">Attach audit/activity logging per create, update, delete, and status transition.</div>
            <div className="rounded-xl bg-secondary p-4">Add filters, exports, and chart widgets backed by shared analytics queries.</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

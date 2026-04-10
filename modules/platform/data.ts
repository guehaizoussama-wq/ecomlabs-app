import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPlatformContext } from "@/lib/tenant/runtime";

type DbRecord = Record<string, unknown>;

export async function getPlatformDashboardData() {
  await getPlatformContext();
  const supabase = await createSupabaseServerClient();
  const [organizations, subscriptions, plans, admins, auditLogs, settings] = await Promise.all([
    supabase.from("organizations").select("*").order("created_at", { ascending: false }),
    supabase.from("subscriptions").select("*").order("created_at", { ascending: false }),
    supabase.from("subscription_plans").select("*").order("monthly_price_dzd", { ascending: true }),
    supabase.from("user_profiles").select("*").eq("role", "super_admin"),
    supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(50),
    supabase.from("platform_settings").select("*").order("key", { ascending: true })
  ]);

  return {
    organizations: (organizations.data ?? []) as DbRecord[],
    subscriptions: (subscriptions.data ?? []) as DbRecord[],
    plans: (plans.data ?? []) as DbRecord[],
    admins: (admins.data ?? []) as DbRecord[],
    auditLogs: (auditLogs.data ?? []) as DbRecord[],
    settings: (settings.data ?? []) as DbRecord[]
  };
}

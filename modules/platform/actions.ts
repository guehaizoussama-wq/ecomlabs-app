"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { toLooseSupabase } from "@/lib/supabase/loose";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPlatformContext } from "@/lib/tenant/runtime";
import { slugify } from "@/lib/utils";

async function writeAuditLog({
  actorId,
  action,
  entityType,
  entityId,
  newValues
}: {
  actorId: string;
  action: string;
  entityType: string;
  entityId?: string;
  newValues?: Record<string, unknown>;
}) {
  const supabase = toLooseSupabase(await createSupabaseServerClient());
  await supabase.from("audit_logs").insert({
    actor_id: actorId,
    action,
    entity_type: entityType,
    entity_id: entityId ?? null,
    new_values: newValues ?? {}
  });
}

export async function saveTenantAction(path: string, formData: FormData) {
  const { user } = await getPlatformContext();
  const supabase = toLooseSupabase(await createSupabaseServerClient());
  const id = String(formData.get("id") ?? "").trim();
  const payload = {
    slug: slugify(String(formData.get("slug") ?? "").trim()),
    name: String(formData.get("name") ?? "").trim(),
    legal_name: String(formData.get("legal_name") ?? "").trim() || null,
    contact_email: String(formData.get("contact_email") ?? "").trim() || null,
    contact_phone: String(formData.get("contact_phone") ?? "").trim() || null,
    status: String(formData.get("status") ?? "active").trim()
  };

  if (id) {
    await supabase.from("organizations").update(payload).eq("id", id);
    await writeAuditLog({ actorId: user.id, action: "platform.tenant_updated", entityType: "organizations", entityId: id, newValues: payload });
  } else {
    const { data } = await supabase.from("organizations").insert(payload).select("id").single();
    await writeAuditLog({
      actorId: user.id,
      action: "platform.tenant_created",
      entityType: "organizations",
      entityId: String((data as { id?: string } | null)?.id ?? ""),
      newValues: payload
    });
  }

  revalidatePath(path);
}

export async function saveSubscriptionAction(path: string, formData: FormData) {
  const { user } = await getPlatformContext();
  const supabase = toLooseSupabase(await createSupabaseServerClient());
  const payload = {
    organization_id: String(formData.get("organization_id") ?? "").trim(),
    plan_id: String(formData.get("plan_id") ?? "").trim(),
    status: String(formData.get("status") ?? "active").trim(),
    starts_at: String(formData.get("starts_at") ?? "").trim() || null,
    ends_at: String(formData.get("ends_at") ?? "").trim() || null,
    renews_at: String(formData.get("renews_at") ?? "").trim() || null
  };

  const { data } = await supabase.from("subscriptions").insert(payload).select("id").single();
  await writeAuditLog({
    actorId: user.id,
    action: "platform.subscription_saved",
    entityType: "subscriptions",
    entityId: String((data as { id?: string } | null)?.id ?? ""),
    newValues: payload
  });

  revalidatePath(path);
}

export async function savePlanAction(path: string, formData: FormData) {
  const { user } = await getPlatformContext();
  const supabase = toLooseSupabase(await createSupabaseServerClient());
  const id = String(formData.get("id") ?? "").trim();
  const payload = {
    code: slugify(String(formData.get("code") ?? "").trim()),
    name: String(formData.get("name") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim() || null,
    monthly_price_dzd: Number(formData.get("monthly_price_dzd") ?? 0),
    yearly_price_dzd: Number(formData.get("yearly_price_dzd") ?? 0),
    max_users: Number(formData.get("max_users") ?? 5),
    max_orders_per_month: Number(formData.get("max_orders_per_month") ?? 0) || null,
    max_ai_requests_per_month: Number(formData.get("max_ai_requests_per_month") ?? 0) || null,
    is_active: formData.get("is_active") === "on"
  };

  if (id) {
    await supabase.from("subscription_plans").update(payload).eq("id", id);
  } else {
    await supabase.from("subscription_plans").insert(payload);
  }

  await writeAuditLog({
    actorId: user.id,
    action: "platform.plan_saved",
    entityType: "subscription_plans",
    entityId: id || undefined,
    newValues: payload
  });

  revalidatePath(path);
}

export async function savePlatformSettingAction(path: string, formData: FormData) {
  const { user } = await getPlatformContext();
  const supabase = toLooseSupabase(await createSupabaseServerClient());
  const key = String(formData.get("key") ?? "").trim();
  const rawValue = String(formData.get("value") ?? "{}").trim();
  let value: Record<string, unknown> | string = rawValue;

  try {
    value = JSON.parse(rawValue) as Record<string, unknown>;
  } catch {
    value = rawValue;
  }

  const { data: existing } = await supabase.from("platform_settings").select("id").eq("key", key).maybeSingle();
  if (existing) {
    await supabase.from("platform_settings").update({ value }).eq("key", key);
  } else {
    await supabase.from("platform_settings").insert({ key, value });
  }
  await writeAuditLog({
    actorId: user.id,
    action: "platform.setting_saved",
    entityType: "platform_settings",
    entityId: key,
    newValues: { key, value }
  });

  revalidatePath(path);
}

export async function invitePlatformAdminAction(path: string, formData: FormData) {
  const { user } = await getPlatformContext();
  const email = String(formData.get("email") ?? "").trim();
  const fullName = String(formData.get("full_name") ?? "").trim();
  const admin = createSupabaseAdminClient();
  const inviteResult = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName }
  });

  if (inviteResult.error) {
    throw new Error(inviteResult.error.message);
  }

  if (inviteResult.data.user) {
    await admin.from("user_profiles").upsert({
      id: inviteResult.data.user.id,
      role: "super_admin",
      full_name: fullName,
      is_active: true
    });
  }

  await writeAuditLog({
    actorId: user.id,
    action: "platform.admin_invited",
    entityType: "user_profiles",
    entityId: inviteResult.data.user?.id,
    newValues: { email, fullName }
  });

  revalidatePath(path);
}

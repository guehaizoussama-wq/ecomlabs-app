"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { persistEcomlabsOutput } from "@/lib/ai/persistence";
import { toLooseSupabase } from "@/lib/supabase/loose";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant/runtime";
import { getDeliveryAdapter } from "@/modules/delivery/provider-registry";
import { getEntityConfig } from "@/modules/tenant/entity-config";
import { prepareEntityPayload } from "@/modules/tenant/data";

function normalizePath(path: string) {
  return path.startsWith("/") ? path : `/${path}`;
}

async function getLooseSupabase() {
  return toLooseSupabase(await createSupabaseServerClient());
}

async function writeActivityLog({
  organizationId,
  actorId,
  action,
  entityType,
  entityId,
  metadata
}: {
  organizationId: string;
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const supabase = await getLooseSupabase();
  await supabase.from("activity_logs").insert({
    organization_id: organizationId,
    actor_id: actorId ?? null,
    action,
    entity_type: entityType,
    entity_id: entityId ?? null,
    metadata: metadata ?? {}
  });
}

async function upsertStockQuantity({
  organizationId,
  warehouseId,
  productId,
  quantityDelta,
  reason,
  movementType
}: {
  organizationId: string;
  warehouseId: string;
  productId: string;
  quantityDelta: number;
  reason: string;
  movementType: string;
}) {
  const supabase = await getLooseSupabase();
  const { data: existing } = await supabase
    .from("stock")
    .select("id, quantity")
    .eq("organization_id", organizationId)
    .eq("warehouse_id", warehouseId)
    .eq("product_id", productId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("stock")
      .update({
        quantity: Number((existing as { quantity?: number }).quantity ?? 0) + quantityDelta
      })
      .eq("organization_id", organizationId)
      .eq("id", (existing as { id: string }).id);
  } else {
    await supabase.from("stock").insert({
      organization_id: organizationId,
      warehouse_id: warehouseId,
      product_id: productId,
      quantity: quantityDelta
    });
  }

  await supabase.from("stock_movements").insert({
    organization_id: organizationId,
    warehouse_id: warehouseId,
    product_id: productId,
    movement_type: movementType,
    quantity: quantityDelta,
    reason
  });
}

async function resolvePricing({
  organizationId,
  partnerId,
  wilayaId,
  communeId
}: {
  organizationId: string;
  partnerId: string;
  wilayaId?: string | null;
  communeId?: string | null;
}) {
  const supabase = await getLooseSupabase();
  if (!wilayaId) {
    return null;
  }

  const exact = await supabase
    .from("delivery_pricing_matrix")
    .select("customer_fee, partner_cost")
    .eq("organization_id", organizationId)
    .eq("delivery_partner_id", partnerId)
    .eq("wilaya_id", wilayaId)
    .eq("commune_id", communeId ?? "")
    .eq("is_active", true)
    .maybeSingle();

  if (exact.data) {
    return exact.data as { customer_fee?: number; partner_cost?: number };
  }

  const fallback = await supabase
    .from("delivery_pricing_matrix")
    .select("customer_fee, partner_cost")
    .eq("organization_id", organizationId)
    .eq("delivery_partner_id", partnerId)
    .eq("wilaya_id", wilayaId)
    .is("commune_id", null)
    .eq("is_active", true)
    .order("is_default_fallback", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (fallback.data as { customer_fee?: number; partner_cost?: number } | null) ?? null;
}

export async function saveEntityAction(resourceKey: string, path: string, formData: FormData) {
  const config = getEntityConfig(resourceKey);
  if (!config) {
    throw new Error(`Unknown entity resource: ${resourceKey}`);
  }

  const { organization, user } = await getTenantContext();
  const supabase = await getLooseSupabase();
  const id = String(formData.get("id") ?? "").trim();
  const payload = prepareEntityPayload(resourceKey, formData);
  const mutationPayload = {
    organization_id: organization.id,
    ...payload
  };

  if (id) {
    const { error } = await supabase
      .from(config.table)
      .update(mutationPayload)
      .eq("organization_id", organization.id)
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    await writeActivityLog({
      organizationId: organization.id,
      actorId: user.id,
      action: "entity.updated",
      entityType: config.table,
      entityId: id,
      metadata: { resourceKey }
    });
  } else {
    const { data, error } = await supabase.from(config.table).insert(mutationPayload).select("id").single();
    if (error) {
      throw new Error(error.message);
    }

    await writeActivityLog({
      organizationId: organization.id,
      actorId: user.id,
      action: "entity.created",
      entityType: config.table,
      entityId: String((data as { id?: string } | null)?.id ?? ""),
      metadata: { resourceKey }
    });
  }

  revalidatePath(normalizePath(path));
}

export async function deleteEntityAction(resourceKey: string, path: string, id: string) {
  const config = getEntityConfig(resourceKey);
  if (!config) {
    throw new Error(`Unknown entity resource: ${resourceKey}`);
  }

  const { organization, user } = await getTenantContext();
  const supabase = await getLooseSupabase();
  const { error } = await supabase
    .from(config.table)
    .delete()
    .eq("organization_id", organization.id)
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  await writeActivityLog({
    organizationId: organization.id,
    actorId: user.id,
    action: "entity.deleted",
    entityType: config.table,
    entityId: id,
    metadata: { resourceKey }
  });

  revalidatePath(normalizePath(path));
}

export async function saveOrderAction(path: string, formData: FormData) {
  const { organization, user } = await getTenantContext();
  const supabase = await getLooseSupabase();
  const id = String(formData.get("id") ?? "").trim();
  let customerId = String(formData.get("customer_id") ?? "").trim() || null;
  const statusId = String(formData.get("status_id") ?? "").trim() || null;
  const salesChannelId = String(formData.get("sales_channel_id") ?? "").trim() || null;
  const campaignId = String(formData.get("campaign_id") ?? "").trim() || null;
  const orderNumber = String(formData.get("order_number") ?? "").trim();
  const subtotal = Number(formData.get("subtotal") ?? 0);
  const deliveryFee = Number(formData.get("delivery_fee") ?? 0);
  const totalAmount = subtotal + deliveryFee;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const itemName = String(formData.get("item_name") ?? "").trim();
  const itemQuantity = Number(formData.get("item_quantity") ?? 1);
  const itemUnitPrice = Number(formData.get("item_unit_price") ?? subtotal);
  const itemCostPrice = Number(formData.get("item_cost_price") ?? 0);

  if (!customerId) {
    const customerName = String(formData.get("customer_name") ?? "").trim();
    const customerPhone = String(formData.get("customer_phone") ?? "").trim();
    if (customerName && customerPhone) {
      const { data: createdCustomer, error: customerError } = await supabase
        .from("customers")
        .insert({
          organization_id: organization.id,
          full_name: customerName,
          primary_phone: customerPhone,
          wilaya_id: String(formData.get("customer_wilaya_id") ?? "").trim() || null,
          commune_id: String(formData.get("customer_commune_id") ?? "").trim() || null,
          address_line1: String(formData.get("customer_address_line1") ?? "").trim() || null
        })
        .select("id")
        .single();

      if (customerError || !createdCustomer) {
        throw new Error(customerError?.message ?? "Failed to create customer");
      }

      customerId = String((createdCustomer as { id?: string }).id ?? "");
    }
  }

  const orderPayload = {
    organization_id: organization.id,
    customer_id: customerId,
    status_id: statusId,
    assigned_user_id: user.id,
    campaign_id: campaignId,
    sales_channel_id: salesChannelId,
    order_number: orderNumber,
    subtotal,
    delivery_fee: deliveryFee,
    total_amount: totalAmount,
    notes
  };

  if (id) {
    const { error } = await supabase
      .from("orders")
      .update(orderPayload)
      .eq("organization_id", organization.id)
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    await supabase.from("order_items").delete().eq("organization_id", organization.id).eq("order_id", id);
    await supabase.from("order_items").insert({
      organization_id: organization.id,
      order_id: id,
      product_name: itemName,
      quantity: itemQuantity,
      unit_price: itemUnitPrice,
      cost_price: itemCostPrice
    });

    await writeActivityLog({
      organizationId: organization.id,
      actorId: user.id,
      action: "order.updated",
      entityType: "orders",
      entityId: id,
      metadata: { orderNumber }
    });

    revalidatePath(normalizePath(path));
    revalidatePath("/orders");
    return;
  }

  const { data: createdOrder, error } = await supabase.from("orders").insert(orderPayload).select("id").single();
  if (error || !createdOrder) {
    throw new Error(error?.message ?? "Failed to create order");
  }

  const orderId = String((createdOrder as { id?: string }).id ?? "");

  const { error: itemError } = await supabase.from("order_items").insert({
    organization_id: organization.id,
    order_id: orderId,
    product_name: itemName,
    quantity: itemQuantity,
    unit_price: itemUnitPrice,
    cost_price: itemCostPrice
  });

  if (itemError) {
    throw new Error(itemError.message);
  }

  await supabase.from("order_status_history").insert({
    organization_id: organization.id,
    order_id: orderId,
    previous_status_id: null,
    next_status_id: statusId,
    changed_by: user.id,
    note: "Order created"
  });

  await writeActivityLog({
    organizationId: organization.id,
    actorId: user.id,
    action: "order.created",
    entityType: "orders",
    entityId: orderId,
    metadata: { orderNumber }
  });

  revalidatePath("/orders");
  redirect(`/orders/${orderId}`);
}

export async function updateOrderStatusAction(orderId: string, path: string, formData: FormData) {
  const { organization, user } = await getTenantContext();
  const supabase = await getLooseSupabase();
  const nextStatusId = String(formData.get("next_status_id") ?? "").trim();
  const note = String(formData.get("status_note") ?? "").trim() || null;

  const { data: currentOrder } = await supabase
    .from("orders")
    .select("status_id")
    .eq("organization_id", organization.id)
    .eq("id", orderId)
    .maybeSingle();

  const { error } = await supabase
    .from("orders")
    .update({ status_id: nextStatusId })
    .eq("organization_id", organization.id)
    .eq("id", orderId);

  if (error) {
    throw new Error(error.message);
  }

  await supabase.from("order_status_history").insert({
    organization_id: organization.id,
    order_id: orderId,
    previous_status_id: (currentOrder as { status_id?: string | null } | null)?.status_id ?? null,
    next_status_id: nextStatusId,
    changed_by: user.id,
    note
  });

  await writeActivityLog({
    organizationId: organization.id,
    actorId: user.id,
    action: "order.status_changed",
    entityType: "orders",
    entityId: orderId,
    metadata: { nextStatusId, note }
  });

  revalidatePath(normalizePath(path));
}

export async function saveStockAdjustmentAction(path: string, formData: FormData) {
  const { organization, user } = await getTenantContext();
  const warehouseId = String(formData.get("warehouse_id") ?? "").trim();
  const productId = String(formData.get("product_id") ?? "").trim();
  const quantity = Number(formData.get("quantity") ?? 0);
  const reason = String(formData.get("reason") ?? "").trim();

  await upsertStockQuantity({
    organizationId: organization.id,
    warehouseId,
    productId,
    quantityDelta: quantity,
    reason,
    movementType: "ADJUSTMENT"
  });

  await writeActivityLog({
    organizationId: organization.id,
    actorId: user.id,
    action: "stock.adjusted",
    entityType: "stock",
    metadata: { warehouseId, productId, quantity, reason }
  });

  revalidatePath(normalizePath(path));
}

export async function saveProcurementEntryAction(kind: "purchases" | "returns", path: string, formData: FormData) {
  const { organization, user } = await getTenantContext();
  const supabase = await getLooseSupabase();
  const entryTable = kind === "purchases" ? "purchase_entries" : "return_entries";
  const itemTable = kind === "purchases" ? "purchase_entry_items" : "return_entry_items";
  const reference = String(formData.get("reference") ?? "").trim();
  const supplierId = String(formData.get("supplier_id") ?? "").trim() || null;
  const warehouseId = String(formData.get("warehouse_id") ?? "").trim();
  const productId = String(formData.get("product_id") ?? "").trim();
  const quantity = Number(formData.get("quantity") ?? 1);
  const unitCost = Number(formData.get("unit_cost") ?? 0);
  const notes = String(formData.get("notes") ?? "").trim() || null;

  const entryPayload =
    kind === "purchases"
      ? {
          organization_id: organization.id,
          supplier_id: supplierId,
          warehouse_id: warehouseId,
          reference,
          total_cost: quantity * unitCost,
          notes
        }
      : {
          organization_id: organization.id,
          supplier_id: supplierId,
          warehouse_id: warehouseId,
          reference,
          return_reason: String(formData.get("return_reason") ?? "supplier_return"),
          notes
        };

  const { data: entry, error } = await supabase.from(entryTable).insert(entryPayload).select("id").single();
  if (error || !entry) {
    throw new Error(error?.message ?? "Failed to save entry");
  }

  await supabase.from(itemTable).insert({
    organization_id: organization.id,
    [`${kind === "purchases" ? "purchase_entry_id" : "return_entry_id"}`]: (entry as { id?: string }).id,
    product_id: productId,
    quantity,
    unit_cost: unitCost
  });

  await upsertStockQuantity({
    organizationId: organization.id,
    warehouseId,
    productId,
    quantityDelta: kind === "purchases" ? quantity : quantity * -1,
    reason: reference,
    movementType: kind === "purchases" ? "PURCHASE" : "RETURN"
  });

  await writeActivityLog({
    organizationId: organization.id,
    actorId: user.id,
    action: kind === "purchases" ? "purchase.created" : "return.created",
    entityType: entryTable,
    entityId: String((entry as { id?: string }).id ?? ""),
    metadata: { reference, warehouseId, productId, quantity, unitCost }
  });

  revalidatePath(normalizePath(path));
}

export async function savePricingMatrixAction(path: string, formData: FormData) {
  const { organization, user } = await getTenantContext();
  const supabase = await getLooseSupabase();
  const payload = {
    organization_id: organization.id,
    delivery_partner_id: String(formData.get("delivery_partner_id") ?? "").trim() || null,
    wilaya_id: String(formData.get("wilaya_id") ?? "").trim(),
    commune_id: String(formData.get("commune_id") ?? "").trim() || null,
    customer_fee: Number(formData.get("customer_fee") ?? 0),
    partner_cost: Number(formData.get("partner_cost") ?? 0),
    is_default_fallback: formData.get("is_default_fallback") === "on",
    is_active: formData.get("is_active") === "on"
  };

  const { error } = await supabase.from("delivery_pricing_matrix").insert(payload);
  if (error) {
    throw new Error(error.message);
  }

  await writeActivityLog({
    organizationId: organization.id,
    actorId: user.id,
    action: "delivery.pricing_saved",
    entityType: "delivery_pricing_matrix",
    metadata: payload
  });

  revalidatePath(normalizePath(path));
}

export async function createShipmentAction(path: string, formData: FormData) {
  const { organization, user } = await getTenantContext();
  const supabase = await getLooseSupabase();
  const orderId = String(formData.get("order_id") ?? "").trim();
  const partnerId = String(formData.get("delivery_partner_id") ?? "").trim();
  const deliveryManId = String(formData.get("delivery_man_id") ?? "").trim() || null;

  const { data: partner } = await supabase
    .from("delivery_partners")
    .select("*")
    .eq("organization_id", organization.id)
    .eq("id", partnerId)
    .maybeSingle();

  const { data: order } = await supabase
    .from("orders")
    .select("id, order_number, total_amount, customer_id, delivery_fee")
    .eq("organization_id", organization.id)
    .eq("id", orderId)
    .maybeSingle();

  const customerId = String((order as { customer_id?: string | null } | null)?.customer_id ?? "");
  const { data: customer } = customerId
    ? await supabase
        .from("customers")
        .select("full_name, primary_phone, address_line1, wilaya_id, commune_id")
        .eq("organization_id", organization.id)
        .eq("id", customerId)
        .maybeSingle()
    : { data: null };

  const pricing = await resolvePricing({
    organizationId: organization.id,
    partnerId,
    wilayaId: String((customer as { wilaya_id?: string | null } | null)?.wilaya_id ?? "") || null,
    communeId: String((customer as { commune_id?: string | null } | null)?.commune_id ?? "") || null
  });

  const customerFeeInput = String(formData.get("customer_fee") ?? "").trim();
  const partnerCostInput = String(formData.get("real_partner_cost") ?? "").trim();
  const customerFee =
    customerFeeInput !== ""
      ? Number(customerFeeInput)
      : Number(pricing?.customer_fee ?? (order as { delivery_fee?: number } | null)?.delivery_fee ?? 0);
  const realPartnerCost =
    partnerCostInput !== "" ? Number(partnerCostInput) : Number(pricing?.partner_cost ?? 0);

  const adapter = getDeliveryAdapter(String((partner as { code?: string } | null)?.code ?? "MANUAL"));
  const result = await adapter.createShipment({
    reference: String((order as { order_number?: string } | null)?.order_number ?? orderId),
    customerName: String((customer as { full_name?: string } | null)?.full_name ?? "Customer"),
    phone: String((customer as { primary_phone?: string } | null)?.primary_phone ?? ""),
    address: String((customer as { address_line1?: string } | null)?.address_line1 ?? ""),
    wilaya: String((customer as { wilaya_id?: string } | null)?.wilaya_id ?? ""),
    commune: String((customer as { commune_id?: string } | null)?.commune_id ?? ""),
    productList: String(formData.get("product_list") ?? "Order items"),
    quantity: Number(formData.get("quantity") ?? 1),
    codAmount: Number((order as { total_amount?: number } | null)?.total_amount ?? 0),
    customerFee,
    stopDesk: formData.get("stop_desk") === "on"
  });

  const { data: shipment, error } = await supabase
    .from("delivery_shipments")
    .insert({
      organization_id: organization.id,
      order_id: orderId,
      delivery_partner_id: partnerId,
      delivery_man_id: deliveryManId,
      tracking_number: result.trackingNumber,
      status: result.normalizedStatus,
      customer_fee: customerFee,
      real_partner_cost: realPartnerCost
    })
    .select("id")
    .single();

  if (error || !shipment) {
    throw new Error(error?.message ?? "Failed to create shipment");
  }

  await supabase
    .from("orders")
    .update({ real_delivery_cost: realPartnerCost })
    .eq("organization_id", organization.id)
    .eq("id", orderId);

  await supabase.from("delivery_events").insert({
    organization_id: organization.id,
    shipment_id: (shipment as { id?: string }).id,
    event_type: "shipment_created",
    payload: result.rawResponse ?? {}
  });

  await writeActivityLog({
    organizationId: organization.id,
    actorId: user.id,
    action: "shipment.created",
    entityType: "delivery_shipments",
    entityId: String((shipment as { id?: string }).id ?? ""),
    metadata: { orderId, partnerId, deliveryManId, customerFee, realPartnerCost }
  });

  revalidatePath(normalizePath(path));
  revalidatePath(`/orders/${orderId}`);
}

export async function updateShipmentAction(path: string, formData: FormData) {
  const { organization, user } = await getTenantContext();
  const supabase = await getLooseSupabase();
  const shipmentId = String(formData.get("shipment_id") ?? "").trim();
  const mode = String(formData.get("mode") ?? "manual").trim();
  const manualStatus = String(formData.get("status") ?? "").trim();

  const { data: shipment } = await supabase
    .from("delivery_shipments")
    .select("id, tracking_number, delivery_partner_id, status")
    .eq("organization_id", organization.id)
    .eq("id", shipmentId)
    .maybeSingle();

  if (!shipment) {
    throw new Error("Shipment not found");
  }

  const currentShipment = shipment as {
    id: string;
    tracking_number?: string | null;
    delivery_partner_id?: string | null;
    status?: string | null;
  };

  let nextStatus = manualStatus || String(currentShipment.status ?? "draft");
  let eventType = "shipment_status_updated";
  let payload: Record<string, unknown> = { mode };

  if (mode === "track" && currentShipment.tracking_number && currentShipment.delivery_partner_id) {
    const { data: partner } = await supabase
      .from("delivery_partners")
      .select("code")
      .eq("organization_id", organization.id)
      .eq("id", currentShipment.delivery_partner_id)
      .maybeSingle();

    const adapter = getDeliveryAdapter(String((partner as { code?: string } | null)?.code ?? "MANUAL"));
    const result = await adapter.trackShipment(currentShipment.tracking_number);
    nextStatus = result.normalizedStatus;
    eventType = "shipment_tracked";
    payload = result.rawResponse ?? { tracking_number: currentShipment.tracking_number };
  }

  if (mode === "cancel") {
    nextStatus = "cancelled";
    eventType = "shipment_cancelled";
    payload = { tracking_number: currentShipment.tracking_number };
  }

  await supabase
    .from("delivery_shipments")
    .update({ status: nextStatus })
    .eq("organization_id", organization.id)
    .eq("id", shipmentId);

  await supabase.from("delivery_events").insert({
    organization_id: organization.id,
    shipment_id: shipmentId,
    event_type: eventType,
    payload
  });

  await writeActivityLog({
    organizationId: organization.id,
    actorId: user.id,
    action: "shipment.updated",
    entityType: "delivery_shipments",
    entityId: shipmentId,
    metadata: { mode, nextStatus }
  });

  revalidatePath(normalizePath(path));
}

export async function saveCustomerNoteAction(customerId: string, path: string, formData: FormData) {
  const { organization, user } = await getTenantContext();
  const supabase = await getLooseSupabase();
  const note = String(formData.get("note") ?? "").trim();

  if (!note) {
    return;
  }

  await supabase.from("customer_notes").insert({
    organization_id: organization.id,
    customer_id: customerId,
    author_id: user.id,
    note
  });

  await writeActivityLog({
    organizationId: organization.id,
    actorId: user.id,
    action: "customer.note_created",
    entityType: "customer_notes",
    entityId: customerId,
    metadata: { noteLength: note.length }
  });

  revalidatePath(normalizePath(path));
}

export async function saveCampaignMetricAction(campaignId: string, path: string, formData: FormData) {
  const { organization, user } = await getTenantContext();
  const supabase = await getLooseSupabase();
  const metricDate = String(formData.get("metric_date") ?? "").trim();
  const impressions = Number(formData.get("impressions") ?? 0);
  const clicks = Number(formData.get("clicks") ?? 0);
  const conversions = Number(formData.get("conversions") ?? 0);
  const ctr = impressions > 0 ? clicks / impressions : 0;
  const cpc = clicks > 0 ? Number(formData.get("spend_dzd") ?? 0) / clicks : 0;
  const cpa = conversions > 0 ? Number(formData.get("spend_dzd") ?? 0) / conversions : 0;
  const cvr = clicks > 0 ? conversions / clicks : 0;

  await supabase
    .from("campaign_daily_metrics")
    .upsert(
      {
        organization_id: organization.id,
        campaign_id: campaignId,
        metric_date: metricDate,
        impressions,
        clicks,
        conversions,
        ctr,
        cpc,
        cpa,
        cvr
      },
      { onConflict: "organization_id,campaign_id,metric_date" }
    );

  await writeActivityLog({
    organizationId: organization.id,
    actorId: user.id,
    action: "campaign.metric_saved",
    entityType: "campaign_daily_metrics",
    entityId: campaignId,
    metadata: { metricDate, impressions, clicks, conversions }
  });

  revalidatePath(normalizePath(path));
}

export async function saveTenantSettingsAction(path: string, formData: FormData) {
  const { organization, user } = await getTenantContext();
  const supabase = await getLooseSupabase();

  await supabase
    .from("organizations")
    .update({
      name: String(formData.get("organization_name") ?? organization.name).trim(),
      contact_email: String(formData.get("contact_email") ?? "").trim() || null,
      contact_phone: String(formData.get("contact_phone") ?? "").trim() || null,
      branding: {
        accentColor: String(formData.get("accent_color") ?? "#0f766e").trim() || "#0f766e",
        supportEmail: String(formData.get("support_email") ?? "").trim() || null
      }
    })
    .eq("id", organization.id);

  const provider = String(formData.get("ai_provider") ?? "openai").trim();
  const model = String(formData.get("ai_model") ?? "gpt-4.1-mini").trim();
  const aiPayload = {
    organization_id: organization.id,
    provider,
    model,
    settings: {
      tone: String(formData.get("ai_tone") ?? "conversion-focused").trim()
    }
  };
  const { data: existingConfig } = await supabase
    .from("ai_tool_configs")
    .select("id")
    .eq("organization_id", organization.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingConfig) {
    await supabase.from("ai_tool_configs").update(aiPayload).eq("id", (existingConfig as { id: string }).id);
  } else {
    await supabase.from("ai_tool_configs").insert(aiPayload);
  }

  await writeActivityLog({
    organizationId: organization.id,
    actorId: user.id,
    action: "settings.updated",
    entityType: "organizations",
    entityId: organization.id,
    metadata: { provider, model }
  });

  revalidatePath(normalizePath(path));
}

export async function updateTeamMemberAction(memberId: string, path: string, formData: FormData) {
  const { organization, user } = await getTenantContext();
  const supabase = await getLooseSupabase();
  const role = String(formData.get("role") ?? "").trim();
  const isActive = formData.get("is_active") === "on";

  await supabase
    .from("user_profiles")
    .update({
      role,
      is_active: isActive
    })
    .eq("organization_id", organization.id)
    .eq("id", memberId);

  await writeActivityLog({
    organizationId: organization.id,
    actorId: user.id,
    action: "team.member_updated",
    entityType: "user_profiles",
    entityId: memberId,
    metadata: { role, isActive }
  });

  revalidatePath(normalizePath(path));
}

export async function saveEcomlabsOutputAction(path: string, formData: FormData) {
  const { organization, user } = await getTenantContext();
  const toolKey = String(formData.get("tool_key") ?? "");
  const inputPayload = JSON.parse(String(formData.get("input_payload") ?? "{}")) as Record<string, unknown>;
  const outputPayload = JSON.parse(String(formData.get("output_payload") ?? "{}")) as Record<string, unknown>;
  const title = String(formData.get("title") ?? toolKey).trim();

  await persistEcomlabsOutput({
    organizationId: organization.id,
    user,
    toolKey,
    title,
    inputPayload,
    outputPayload
  });

  revalidatePath(normalizePath(path));
  revalidatePath("/ecomlabs");
}

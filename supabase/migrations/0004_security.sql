alter table public.organizations enable row level security;
alter table public.subscriptions enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_profiles enable row level security;
alter table public.platform_settings enable row level security;
alter table public.order_statuses enable row level security;
alter table public.activity_logs enable row level security;
alter table public.audit_logs enable row level security;
alter table public.event_logs enable row level security;
alter table public.webhook_logs enable row level security;
alter table public.brands enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_media enable row level security;
alter table public.product_delivery_fees enable row level security;
alter table public.customers enable row level security;
alter table public.customer_notes enable row level security;
alter table public.sales_channels enable row level security;
alter table public.marketers enable row level security;
alter table public.ad_accounts enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_daily_metrics enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;
alter table public.warehouses enable row level security;
alter table public.stock enable row level security;
alter table public.stock_movements enable row level security;
alter table public.stock_alert_rules enable row level security;
alter table public.suppliers enable row level security;
alter table public.purchase_entries enable row level security;
alter table public.purchase_entry_items enable row level security;
alter table public.return_entries enable row level security;
alter table public.return_entry_items enable row level security;
alter table public.delivery_partners enable row level security;
alter table public.delivery_partner_credentials enable row level security;
alter table public.delivery_partner_status_map enable row level security;
alter table public.delivery_men enable row level security;
alter table public.delivery_pricing_matrix enable row level security;
alter table public.delivery_shipments enable row level security;
alter table public.delivery_events enable row level security;
alter table public.delivery_partner_webhook_logs enable row level security;
alter table public.charge_categories enable row level security;
alter table public.charges enable row level security;
alter table public.wallets enable row level security;
alter table public.transaction_categories enable row level security;
alter table public.transactions enable row level security;
alter table public.payments enable row level security;
alter table public.payouts enable row level security;
alter table public.prompt_history enable row level security;
alter table public.generated_outputs enable row level security;
alter table public.saved_outputs enable row level security;
alter table public.ai_tool_configs enable row level security;
alter table public.ai_usage_logs enable row level security;

create policy "public read wilayas" on public.wilayas for select using (true);
create policy "public read communes" on public.communes for select using (true);

create policy "super admin organizations" on public.organizations
  for all
  using (app.is_super_admin())
  with check (app.is_super_admin());

create policy "super admin platform settings" on public.platform_settings
  for all
  using (app.is_super_admin())
  with check (app.is_super_admin());

create policy "tenant user profiles" on public.user_profiles
  for select
  using (
    app.is_super_admin()
    or organization_id = app.current_organization_id()
    or id = auth.uid()
  );

create policy "tenant scoped subscriptions" on public.subscriptions
  for select
  using (app.is_super_admin() or organization_id = app.current_organization_id());

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'order_statuses',
    'activity_logs',
    'audit_logs',
    'event_logs',
    'webhook_logs',
    'brands',
    'categories',
    'products',
    'product_variants',
    'product_media',
    'product_delivery_fees',
    'customers',
    'customer_notes',
    'sales_channels',
    'marketers',
    'ad_accounts',
    'campaigns',
    'campaign_daily_metrics',
    'orders',
    'order_items',
    'order_status_history',
    'warehouses',
    'stock',
    'stock_movements',
    'stock_alert_rules',
    'suppliers',
    'purchase_entries',
    'purchase_entry_items',
    'return_entries',
    'return_entry_items',
    'delivery_partners',
    'delivery_partner_credentials',
    'delivery_partner_status_map',
    'delivery_men',
    'delivery_pricing_matrix',
    'delivery_shipments',
    'delivery_events',
    'delivery_partner_webhook_logs',
    'charge_categories',
    'charges',
    'wallets',
    'transaction_categories',
    'transactions',
    'payments',
    'payouts',
    'prompt_history',
    'generated_outputs',
    'saved_outputs',
    'ai_tool_configs',
    'ai_usage_logs'
  ]
  loop
    execute format(
      'create policy "tenant scoped %1$s" on public.%1$s
       for all
       using (app.is_super_admin() or organization_id = app.current_organization_id())
       with check (app.is_super_admin() or organization_id = app.current_organization_id());',
      table_name
    );
  end loop;
end $$;

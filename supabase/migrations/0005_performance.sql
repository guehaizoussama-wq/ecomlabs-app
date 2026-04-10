create index if not exists idx_orders_org_status on public.orders (organization_id, status_id, created_at desc);
create index if not exists idx_customers_org_phone on public.customers (organization_id, primary_phone);
create index if not exists idx_products_org_sku on public.products (organization_id, sku);
create index if not exists idx_campaigns_org_status on public.campaigns (organization_id, status);
create index if not exists idx_shipments_org_status on public.delivery_shipments (organization_id, status);
create index if not exists idx_transactions_org_date on public.transactions (organization_id, occurred_at desc);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
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
      'drop trigger if exists trg_%1$s_updated_at on public.%1$s;
       create trigger trg_%1$s_updated_at before update on public.%1$s
       for each row execute function app.touch_updated_at();',
      table_name
    );
  end loop;
end $$;

insert into public.subscription_plans (code, name, description, monthly_price_dzd, yearly_price_dzd, max_users, max_orders_per_month, max_ai_requests_per_month, features)
values
  ('starter', 'Starter', 'For growing stores starting operations.', 9900, 99000, 5, 1000, 200, '{"modules":["orders","customers","delivery"]}'),
  ('growth', 'Growth', 'Operational growth plan with analytics and marketing.', 24900, 249000, 20, 10000, 1200, '{"modules":["orders","customers","inventory","delivery","finance","marketing","analytics","ecomlabs"]}'),
  ('scale', 'Scale', 'For larger teams with broader automation and higher AI usage.', 49900, 499000, 60, 50000, 5000, '{"modules":["all"],"prioritySupport":true}'),
  ('enterprise', 'Enterprise', 'Custom enterprise plan.', 0, 0, 250, null, null, '{"modules":["all"],"sso":true,"customSla":true}')
on conflict (code) do nothing;

insert into public.roles (code, scope, name, description)
values
  ('super_admin', 'platform', 'Super Admin', 'Platform-wide administrator'),
  ('tenant_admin', 'tenant', 'Tenant Admin', 'Workspace administrator'),
  ('agent', 'tenant', 'Agent', 'Order and customer operator'),
  ('marketer', 'tenant', 'Marketer', 'Marketing manager'),
  ('delivery_man', 'tenant', 'Delivery Man', 'Delivery execution user'),
  ('stock_manager', 'tenant', 'Stock Manager', 'Inventory manager'),
  ('finance_manager', 'tenant', 'Finance Manager', 'Finance manager')
on conflict (code) do nothing;

insert into public.permissions (code, name, description)
values
  ('orders.read', 'Orders Read', 'Read orders'),
  ('orders.write', 'Orders Write', 'Create and update orders'),
  ('products.read', 'Products Read', 'Read catalog'),
  ('products.write', 'Products Write', 'Create and update catalog'),
  ('stock.read', 'Stock Read', 'Read stock'),
  ('stock.adjust', 'Stock Adjust', 'Adjust stock quantities'),
  ('delivery.read', 'Delivery Read', 'Read delivery data'),
  ('delivery.manage', 'Delivery Manage', 'Create and update deliveries'),
  ('finance.read', 'Finance Read', 'Read finance data'),
  ('finance.manage', 'Finance Manage', 'Manage finance records'),
  ('marketing.read', 'Marketing Read', 'Read marketing data'),
  ('marketing.manage', 'Marketing Manage', 'Manage marketing data'),
  ('analytics.read', 'Analytics Read', 'Read analytics'),
  ('team.manage', 'Team Manage', 'Manage tenant users'),
  ('settings.manage', 'Settings Manage', 'Manage settings'),
  ('ecomlabs.use', 'EcomLabs Use', 'Use AI workspace')
on conflict (code) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on (
  r.code = 'super_admin'
  or r.code = 'tenant_admin'
  or (r.code = 'agent' and p.code in ('orders.read','orders.write','analytics.read','ecomlabs.use'))
  or (r.code = 'marketer' and p.code in ('marketing.read','marketing.manage','analytics.read','ecomlabs.use'))
  or (r.code = 'delivery_man' and p.code in ('delivery.read'))
  or (r.code = 'stock_manager' and p.code in ('products.read','stock.read','stock.adjust','orders.read'))
  or (r.code = 'finance_manager' and p.code in ('finance.read','finance.manage','analytics.read'))
)
on conflict (role_id, permission_id) do nothing;

insert into public.organizations (slug, name, legal_name, contact_email, status)
values
  ('platform', 'EcomLabs Platform', 'EcomLabs Platform', 'platform@ecomlabs.online', 'active'),
  ('demo-store', 'Demo Store', 'Demo Store SARL', 'admin@demo-store.ecomlabs.online', 'active')
on conflict (slug) do nothing;

insert into public.platform_settings (key, value)
values
  ('host_rules', '{"appHost":"app.ecomlabs.online","publicHosts":["ecomlabs.online","www.ecomlabs.online"]}'),
  ('automation_defaults', '{"retryLimit":3,"queueMode":"placeholder"}')
on conflict (key) do nothing;

insert into public.order_statuses (organization_id, code, label, color, is_editable, sort_order)
select o.id, s.code, s.label, s.color, s.is_editable, s.sort_order
from public.organizations o
cross join (
  values
    ('pending','Pending','#f97316',true,1),
    ('confirmed','Confirmed','#0f766e',true,2),
    ('no_answer','No Answer','#f59e0b',true,3),
    ('cancelled','Cancelled','#dc2626',false,4),
    ('shipped','Shipped','#2563eb',false,5),
    ('delivered','Delivered','#16a34a',false,6),
    ('returned','Returned','#7c3aed',false,7)
) as s(code, label, color, is_editable, sort_order)
where o.slug in ('platform','demo-store')
on conflict (organization_id, code) do nothing;

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-1111-1111-111111111111',
    'authenticated',
    'authenticated',
    'superadmin@ecomlabs.online',
    crypt('Admin123!', gen_salt('bf')),
    timezone('utc', now()),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"EcomLabs Super Admin"}',
    timezone('utc', now()),
    timezone('utc', now())
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-2222-2222-222222222222',
    'authenticated',
    'authenticated',
    'admin@demo-store.ecomlabs.online',
    crypt('Admin123!', gen_salt('bf')),
    timezone('utc', now()),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Demo Store Admin"}',
    timezone('utc', now()),
    timezone('utc', now())
  )
on conflict (id) do nothing;

insert into public.user_profiles (id, organization_id, role, full_name, is_active)
select
  '11111111-1111-1111-1111-111111111111',
  (select id from public.organizations where slug = 'platform'),
  'super_admin',
  'EcomLabs Super Admin',
  true
where exists (select 1 from public.organizations where slug = 'platform')
on conflict (id) do nothing;

insert into public.user_profiles (id, organization_id, role, full_name, is_active)
select
  '22222222-2222-2222-2222-222222222222',
  (select id from public.organizations where slug = 'demo-store'),
  'tenant_admin',
  'Demo Store Admin',
  true
where exists (select 1 from public.organizations where slug = 'demo-store')
on conflict (id) do nothing;

# EcomLabs Enterprise SaaS

## Folder Structure

```text
app/
  (public)/                Public landing
  (platform)/              app.ecomlabs.online routes
  (tenant)/                {tenant}.ecomlabs.online routes
  auth/                    Login, register, forgot/reset password
  api/ecomlabs/generate/   Native EcomLabs generation endpoint
components/
  auth/                    Auth UI
  layout/                  Shared shell, KPI, module layouts
  ui/                      shadcn-style primitives
lib/
  ai/                      Native EcomLabs generation engine
  auth/                    Session + guards
  permissions/             Role-permission catalog
  supabase/                Browser, server, and middleware clients
  tenant/                  Host and tenancy resolution
  validation/              Zod schemas
modules/
  delivery/                Adapter architecture and provider catalog
  ecomlabs/                Tool registry derived from legacy EcomLabs
  platform/                Super-admin navigation
  tenant/                  Tenant navigation and route catalog
scripts/
  extract-wilayas.mjs      XLSX to normalized wilaya/commune JSON
  extract-legacy-sources.mjs
  generate-location-seed-sql.mjs
supabase/
  migrations/              Ordered schema and RLS migrations
  seed-data/               Generated JSON extracted from uploaded ZIPs
  seed.sql                 Core plans, roles, permissions, test users
  seed-locations.sql       Generated wilaya/commune SQL import
types/                     Canonical app types
```

## Uploaded ZIP Usage

- `Wilayas.zip`: parsed into `supabase/seed-data/wilayas.json`, `supabase/seed-data/communes.json`, and `supabase/seed-locations.sql`
- `APP SCRIPT.zip`: mined into delivery provider catalog and adapter patterns, especially Yalidine auth and payload structure
- `EcomLabs.zip`: mined into native tool registry, prompt/workflow shapes, and generator route design

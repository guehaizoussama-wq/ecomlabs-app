import { z } from "zod";

const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  NEXT_PUBLIC_ROOT_DOMAIN: z.string().default("ecomlabs.online"),
  NEXT_PUBLIC_APP_DOMAIN: z.string().default("app.ecomlabs.online"),
  NEXT_PUBLIC_PUBLIC_DOMAINS: z.string().default("ecomlabs.online,www.ecomlabs.online"),
  NEXT_PUBLIC_APP_NAME: z.string().default("EcomLabs"),
  NEXT_PUBLIC_ENABLE_REGISTRATION: z.string().default("true"),
  NEXT_PUBLIC_DEFAULT_LOCALE: z.string().default("fr-DZ"),
  NEXT_PUBLIC_DEFAULT_CURRENCY: z.string().default("DZD"),
  NEXT_PUBLIC_SITE_URL: z.string().default("http://localhost:3000")
});

const serverEnvSchema = clientEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional()
});

export const clientEnv = clientEnvSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_ROOT_DOMAIN: process.env.NEXT_PUBLIC_ROOT_DOMAIN,
  NEXT_PUBLIC_APP_DOMAIN: process.env.NEXT_PUBLIC_APP_DOMAIN,
  NEXT_PUBLIC_PUBLIC_DOMAINS: process.env.NEXT_PUBLIC_PUBLIC_DOMAINS,
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_ENABLE_REGISTRATION: process.env.NEXT_PUBLIC_ENABLE_REGISTRATION,
  NEXT_PUBLIC_DEFAULT_LOCALE: process.env.NEXT_PUBLIC_DEFAULT_LOCALE,
  NEXT_PUBLIC_DEFAULT_CURRENCY: process.env.NEXT_PUBLIC_DEFAULT_CURRENCY,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL
});

export const serverEnv = serverEnvSchema.parse({
  ...clientEnv,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
});

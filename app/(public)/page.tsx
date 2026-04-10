import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  "Multi-tenant operations across orders, inventory, delivery, finance, marketing, and AI.",
  "Robust host-aware routing for `app.ecomlabs.online`, tenant subdomains, and safe public hosts.",
  "Supabase Auth + Postgres + RLS foundation with enterprise-grade tenancy boundaries.",
  "Native EcomLabs AI workspace rebuilt from the uploaded archive rather than embedded as a legacy app."
];

export default function MarketingHomePage() {
  return (
    <main className="surface-grid min-h-screen px-6 py-10 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-10">
        <section className="rounded-[2rem] border bg-card/90 p-8 shadow-soft lg:p-12">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">EcomLabs OS</p>
              <h1 className="mt-4 max-w-3xl text-5xl font-semibold leading-tight">
                Enterprise operations SaaS for Algerian COD e-commerce teams.
              </h1>
              <p className="mt-4 max-w-2xl text-base text-muted-foreground">
                Built for platform governance on `app.ecomlabs.online` and isolated tenant workspaces on `{`{tenant}`}.ecomlabs.online`.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button>Request demo</Button>
                <Link
                  href="/auth/login"
                  className="inline-flex h-10 items-center justify-center rounded-lg border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary"
                >
                  Open login
                </Link>
              </div>
            </div>
            <Card className="border-none bg-secondary">
              <CardHeader>
                <CardTitle>Built from your uploaded source material</CardTitle>
                <CardDescription>Not a mockup and not a spreadsheet rebuild.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                {features.map((feature) => (
                  <div key={feature} className="rounded-xl bg-background p-4">
                    {feature}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}

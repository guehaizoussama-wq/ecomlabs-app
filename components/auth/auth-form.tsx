"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { clientEnv } from "@/lib/env";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type AuthMode = "login" | "register" | "forgot";

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);

    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const fullName = String(formData.get("fullName") ?? "");

    startTransition(async () => {
      let supabase;
      try {
        supabase = createSupabaseBrowserClient();
      } catch (clientError) {
        setError(
          clientError instanceof Error
            ? clientError.message
            : "Supabase browser client is not configured."
        );
        return;
      }

      if (mode === "login") {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          setError(signInError.message);
          return;
        }
        const redirectResponse = await fetch("/api/auth/post-login", {
          method: "GET"
        });
        const redirectData = (await redirectResponse.json()) as { redirectTo?: string };
        router.push((redirectData.redirectTo ?? "/dashboard") as Parameters<typeof router.push>[0]);
        router.refresh();
        return;
      }

      if (mode === "register") {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName
            }
          }
        });
        if (signUpError) {
          setError(signUpError.message);
          return;
        }
        router.push("/auth/login");
        router.refresh();
        return;
      }

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${clientEnv.NEXT_PUBLIC_SITE_URL}/auth/reset-password`
      });
      if (resetError) {
        setError(resetError.message);
        return;
      }
      router.refresh();
    });
  }

  const titleMap: Record<AuthMode, string> = {
    login: "Welcome back",
    register: "Create your workspace access",
    forgot: "Reset your password"
  };

  const descriptionMap: Record<AuthMode, string> = {
    login: "Use Supabase Auth with persistent sessions and server-safe routing.",
    register: "Provision your access cleanly without introducing a second auth system.",
    forgot: "Send a secure password reset email without breaking the SSR session flow."
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{titleMap[mode]}</CardTitle>
        <CardDescription>{descriptionMap[mode]}</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          {mode === "register" ? <Input name="fullName" placeholder="Full name" required /> : null}
          <Input name="email" type="email" placeholder="Email address" required />
          {mode !== "forgot" ? <Input name="password" type="password" placeholder="Password" required /> : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button className="w-full" disabled={isPending}>
            {isPending ? "Please wait..." : mode === "login" ? "Sign in" : mode === "register" ? "Create account" : "Send reset email"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

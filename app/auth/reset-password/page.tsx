import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Reset password</CardTitle>
          <CardDescription>
            This route is ready for Supabase recovery sessions and can host a dedicated password update form.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Once the recovery token lands here, continue with a password update form using `supabase.auth.updateUser(...)`.
        </CardContent>
      </Card>
    </main>
  );
}

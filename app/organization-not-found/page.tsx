import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function OrganizationNotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Organization not found</CardTitle>
          <CardDescription>The requested tenant subdomain does not match an active workspace.</CardDescription>
        </CardHeader>
        <CardContent>Check the tenant subdomain or access the public host instead.</CardContent>
      </Card>
    </main>
  );
}

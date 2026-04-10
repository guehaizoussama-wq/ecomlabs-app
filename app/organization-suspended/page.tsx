import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function OrganizationSuspendedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Organization suspended</CardTitle>
          <CardDescription>This tenant is currently suspended by platform administrators.</CardDescription>
        </CardHeader>
        <CardContent>Contact EcomLabs support or your platform administrator to restore access.</CardContent>
      </Card>
    </main>
  );
}

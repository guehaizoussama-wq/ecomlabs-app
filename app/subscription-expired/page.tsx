import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SubscriptionExpiredPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Subscription expired</CardTitle>
          <CardDescription>This workspace needs an active plan before tenant access can continue.</CardDescription>
        </CardHeader>
        <CardContent>Renew the subscription from the platform or assign a new plan from super admin.</CardContent>
      </Card>
    </main>
  );
}

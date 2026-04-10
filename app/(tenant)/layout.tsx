import { tenantNavigation } from "@/modules/tenant/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";

export default function TenantLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen lg:flex">
      <AppSidebar
        title="Tenant Workspace"
        subtitle="Orders, delivery, stock, finance, analytics, and the native EcomLabs AI workspace."
        items={tenantNavigation}
      />
      <main className="flex-1 p-6 lg:p-10">{children}</main>
    </div>
  );
}

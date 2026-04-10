import { platformNavigation } from "@/modules/platform/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";

export default function PlatformLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen lg:flex">
      <AppSidebar
        title="Platform Control"
        subtitle="Super admin governance across tenants, plans, subscriptions, and audit."
        items={platformNavigation}
      />
      <main className="flex-1 p-6 lg:p-10">{children}</main>
    </div>
  );
}

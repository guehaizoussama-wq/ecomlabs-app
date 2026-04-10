import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type SidebarItem = {
  label: string;
  href: string;
  description: string;
  icon: LucideIcon;
};

export function AppSidebar({
  title,
  subtitle,
  items
}: {
  title: string;
  subtitle: string;
  items: SidebarItem[];
}) {
  return (
    <aside className="hidden w-80 shrink-0 border-r border-sidebar-border bg-sidebar px-6 py-8 text-sidebar-foreground lg:block">
      <div className="space-y-3">
        <Badge className="bg-sidebar-accent text-white">EcomLabs</Badge>
        <div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="text-sm text-sidebar-muted">{subtitle}</p>
        </div>
      </div>
      <nav className="mt-10 space-y-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href as Parameters<typeof Link>[0]["href"]}
            className={cn(
              "flex rounded-2xl border border-transparent px-4 py-3 transition-colors hover:border-sidebar-border hover:bg-white/5"
            )}
          >
            <item.icon className="mr-3 mt-1 h-4 w-4 shrink-0" />
            <div>
              <div className="font-medium">{item.label}</div>
              <div className="text-xs text-sidebar-muted">{item.description}</div>
            </div>
          </Link>
        ))}
      </nav>
    </aside>
  );
}

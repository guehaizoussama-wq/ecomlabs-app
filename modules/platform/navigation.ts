import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BarChart3,
  Building2,
  CreditCard,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Users
} from "lucide-react";

export type PlatformNavItem = {
  label: string;
  href: string;
  description: string;
  icon: LucideIcon;
  stats: { label: string; value: string }[];
};

export const platformNavigation: PlatformNavItem[] = [
  {
    label: "Dashboard",
    href: "/super-admin/dashboard",
    description: "Global platform KPIs, active tenants, subscription health, and recent activity.",
    icon: LayoutDashboard,
    stats: [
      { label: "MRR", value: "1.24M DZD" },
      { label: "Tenants", value: "48" },
      { label: "Churn Risk", value: "3" }
    ]
  },
  {
    label: "Tenants",
    href: "/super-admin/tenants",
    description: "Create, update, suspend, and review tenant organizations.",
    icon: Building2,
    stats: [
      { label: "Active", value: "42" },
      { label: "Suspended", value: "2" },
      { label: "Trials", value: "4" }
    ]
  },
  {
    label: "Subscriptions",
    href: "/super-admin/subscriptions",
    description: "Monitor renewals, payment state, trial periods, and expirations.",
    icon: CreditCard,
    stats: [
      { label: "Expiring", value: "6" },
      { label: "Unpaid", value: "2" },
      { label: "Trials", value: "4" }
    ]
  },
  {
    label: "Plans",
    href: "/super-admin/plans",
    description: "Manage entitlements, quotas, pricing, and default provisioning.",
    icon: ShieldCheck,
    stats: [
      { label: "Plans", value: "4" },
      { label: "Most Used", value: "Growth" },
      { label: "Add-ons", value: "3" }
    ]
  },
  {
    label: "Admins",
    href: "/super-admin/admins",
    description: "Platform operators, security posture, and access control.",
    icon: Users,
    stats: [
      { label: "Admins", value: "5" },
      { label: "MFA", value: "100%" },
      { label: "Active", value: "4" }
    ]
  },
  {
    label: "Settings",
    href: "/super-admin/settings",
    description: "Platform-wide defaults, host rules, feature switches, and governance settings.",
    icon: Settings,
    stats: [
      { label: "Domains", value: "3" },
      { label: "Flags", value: "12" },
      { label: "Region", value: "eu-west" }
    ]
  },
  {
    label: "Platform Analytics",
    href: "/super-admin/platform-analytics",
    description: "Revenue, adoption, module usage, AI consumption, and tenant performance.",
    icon: BarChart3,
    stats: [
      { label: "Orders", value: "18.4k" },
      { label: "GMV", value: "38.6M DZD" },
      { label: "AI Runs", value: "7.9k" }
    ]
  },
  {
    label: "Audit Logs",
    href: "/super-admin/audit-logs",
    description: "Immutable platform-level admin activity and high-risk actions.",
    icon: Activity,
    stats: [
      { label: "Today", value: "132" },
      { label: "Critical", value: "4" },
      { label: "Retention", value: "365d" }
    ]
  }
];

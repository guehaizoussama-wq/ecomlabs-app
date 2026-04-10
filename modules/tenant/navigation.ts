import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Boxes,
  Building2,
  DollarSign,
  Megaphone,
  PackageCheck,
  Settings,
  ShoppingCart,
  Sparkles,
  Truck,
  Users,
  Warehouse
} from "lucide-react";

export type TenantNavItem = {
  label: string;
  href: string;
  description: string;
  icon: LucideIcon;
  stats: { label: string; value: string }[];
};

export const tenantNavigation: TenantNavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    description: "Daily operating system for sales, stock, delivery, finance, and AI.",
    icon: BarChart3,
    stats: [
      { label: "Orders", value: "148" },
      { label: "Delivery Rate", value: "87%" },
      { label: "Net Profit", value: "185k DZD" }
    ]
  },
  {
    label: "Orders",
    href: "/orders",
    description: "Create, filter, assign, update, and monitor order lifecycles.",
    icon: ShoppingCart,
    stats: [
      { label: "Pending", value: "38" },
      { label: "Confirmed", value: "49" },
      { label: "Delivered", value: "27" }
    ]
  },
  {
    label: "Customers",
    href: "/customers",
    description: "Customer CRM, order history, blacklist rules, notes, and segmentation.",
    icon: Users,
    stats: [
      { label: "Customers", value: "2.8k" },
      { label: "Repeat", value: "32%" },
      { label: "Blacklisted", value: "17" }
    ]
  },
  {
    label: "Catalog",
    href: "/products",
    description: "Products, categories, brands, pricing, and delivery fee overrides.",
    icon: Boxes,
    stats: [
      { label: "SKUs", value: "218" },
      { label: "Active", value: "203" },
      { label: "Low Margin", value: "12" }
    ]
  },
  {
    label: "Inventory",
    href: "/stock",
    description: "Warehouse-aware stock, alerts, movements, purchases, and returns.",
    icon: Warehouse,
    stats: [
      { label: "Warehouses", value: "3" },
      { label: "Low Stock", value: "15" },
      { label: "Reserved", value: "84" }
    ]
  },
  {
    label: "Procurement",
    href: "/suppliers",
    description: "Suppliers, purchase entries, return workflows, and cost visibility.",
    icon: Building2,
    stats: [
      { label: "Suppliers", value: "24" },
      { label: "Open Purchases", value: "7" },
      { label: "Returns", value: "3" }
    ]
  },
  {
    label: "Delivery",
    href: "/delivery-partners",
    description: "Partners, pricing matrix, delivery men, shipment lifecycle, and tracking.",
    icon: Truck,
    stats: [
      { label: "Partners", value: "4" },
      { label: "In Transit", value: "51" },
      { label: "Delivery Margin", value: "26k DZD" }
    ]
  },
  {
    label: "Finance",
    href: "/finance",
    description: "Revenue, costs, charges, wallets, payouts, and profitability.",
    icon: DollarSign,
    stats: [
      { label: "Revenue", value: "1.34M DZD" },
      { label: "Charges", value: "110k DZD" },
      { label: "Payouts", value: "482k DZD" }
    ]
  },
  {
    label: "Marketing",
    href: "/campaigns",
    description: "Channels, marketers, ad accounts, campaigns, and spend efficiency.",
    icon: Megaphone,
    stats: [
      { label: "Spend", value: "$4.3k" },
      { label: "CPA", value: "582 DZD" },
      { label: "ROAS", value: "5.8x" }
    ]
  },
  {
    label: "Analytics",
    href: "/analytics",
    description: "Cross-module intelligence across orders, delivery, finance, and teams.",
    icon: PackageCheck,
    stats: [
      { label: "Top Product", value: "Magnesium Plus" },
      { label: "Top Wilaya", value: "Alger" },
      { label: "Best Agent", value: "Rania" }
    ]
  },
  {
    label: "EcomLabs",
    href: "/ecomlabs",
    description: "AI workspace for hooks, copy, offers, landing helpers, and product ideas.",
    icon: Sparkles,
    stats: [
      { label: "Runs", value: "384" },
      { label: "Saved", value: "71" },
      { label: "Top Tool", value: "Hook Generator" }
    ]
  },
  {
    label: "Settings",
    href: "/settings",
    description: "Workspace team, branding, modules, delivery rules, and system preferences.",
    icon: Settings,
    stats: [
      { label: "Members", value: "11" },
      { label: "Roles", value: "6" },
      { label: "Webhooks", value: "2" }
    ]
  }
];

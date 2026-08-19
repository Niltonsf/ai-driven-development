/**
 * Menu config — concrete menu tree for the admin app.
 *
 * Replica: sites/demo.tailadmin.com/.menu-tree.json (gerado pela skill `sidebar`).
 * Fidelidade: ALTA (mesma estrutura/labels). Hrefs normalizados — o segmento
 * `(examples)` é route group do Next.js (não aparece na URL), por isso aqui ele
 * é stripped: `/(examples)/analytics` → `/analytics`.
 */
import type { MenuNode } from "@/shared/template/admin/menu.types";
import {
  DashboardIcon,
  AiIcon,
  EcommerceIcon,
  CalendarIcon,
  UserProfileIcon,
  TaskIcon,
  FormsIcon,
  TablesIcon,
  PagesIcon,
} from "@/shared/template/admin/icons";

export const adminMenu: MenuNode[] = [
  {
    type: "section",
    label: "MENU",
    children: [
      {
        type: "group",
        label: "Dashboard",
        icon: DashboardIcon,
        children: [
          { type: "item", label: "eCommerce", href: "/dashboard" },
          { type: "item", label: "Analytics", href: "/analytics" },
          { type: "item", label: "Marketing", href: "/marketing" },
          { type: "item", label: "CRM", href: "/crm" },
          { type: "item", label: "Stocks", href: "/stocks" },
          { type: "item", label: "SaaS", href: "/saas" },
          { type: "item", label: "Logistics", href: "/logistics" },
        ],
      },
      {
        type: "group",
        label: "AI",
        icon: AiIcon,
        badge: "New",
        children: [
          { type: "item", label: "Text Generator", href: "/ai/text-generator" },
          { type: "item", label: "Image Generator", href: "/ai/image-generator" },
          { type: "item", label: "Code Generator", href: "/ai/code-generator" },
          { type: "item", label: "Video Generator", href: "/ai/video-generator" },
        ],
      },
      {
        type: "group",
        label: "E-commerce",
        icon: EcommerceIcon,
        children: [
          { type: "item", label: "Products", href: "/products" },
          { type: "item", label: "Add Product", href: "/products/new" },
          { type: "item", label: "Billing", href: "/billing" },
          { type: "item", label: "Invoices", href: "/invoices" },
          { type: "item", label: "Single Invoice", href: "/invoices/single" },
          { type: "item", label: "Create Invoice", href: "/invoices/new" },
          { type: "item", label: "Transactions", href: "/transactions" },
          { type: "item", label: "Single Transaction", href: "/transactions/single" },
        ],
      },
      { type: "item", label: "Calendar", href: "/calendar", icon: CalendarIcon },
      { type: "item", label: "User Profile", href: "/profile", icon: UserProfileIcon },
      {
        type: "group",
        label: "Task",
        icon: TaskIcon,
        children: [
          { type: "item", label: "List", href: "/task/list" },
          { type: "item", label: "Kanban", href: "/task/kanban" },
        ],
      },
      {
        type: "group",
        label: "Forms",
        icon: FormsIcon,
        children: [
          { type: "item", label: "Form Elements", href: "/forms/elements" },
          { type: "item", label: "Form Layout", href: "/forms/layout" },
        ],
      },
      {
        type: "group",
        label: "Tables",
        icon: TablesIcon,
        children: [
          { type: "item", label: "Basic Tables", href: "/tables/basic" },
          { type: "item", label: "Data Tables", href: "/tables/data" },
        ],
      },
      {
        type: "group",
        label: "Pages",
        icon: PagesIcon,
        children: [
          { type: "item", label: "File Manager", href: "/file-manager" },
          { type: "item", label: "Pricing Tables", href: "/pricing" },
          { type: "item", label: "FAQ", href: "/faq" },
          { type: "item", label: "Blank Page", href: "/blank" },
          { type: "item", label: "404 Error", href: "/errors/404" },
          { type: "item", label: "500 Error", href: "/errors/500" },
        ],
      },
    ],
  },
];

/**
 * Custom-SVG icon set extracted from the demo.tailadmin.com template.
 * Library detected (Fase 1f): `custom-svg` (inline SVG, no external set).
 * Decision: ícones obrigatórios — todos os top-level items do original tinham
 * ícone inline; cada um foi convertido em componente React abaixo.
 */
export { DashboardIcon } from "./DashboardIcon";
export { AiIcon } from "./AiIcon";
export { EcommerceIcon } from "./EcommerceIcon";
export { CalendarIcon } from "./CalendarIcon";
export { UserProfileIcon } from "./UserProfileIcon";
export { TaskIcon } from "./TaskIcon";
export { FormsIcon } from "./FormsIcon";
export { TablesIcon } from "./TablesIcon";
export { PagesIcon } from "./PagesIcon";
export { ChevronDownIcon } from "./ChevronDownIcon";
export { MenuGroupIcon } from "./MenuGroupIcon";

import type { ComponentType, SVGProps } from "react";
import { DashboardIcon } from "./DashboardIcon";
import { AiIcon } from "./AiIcon";
import { EcommerceIcon } from "./EcommerceIcon";
import { CalendarIcon } from "./CalendarIcon";
import { UserProfileIcon } from "./UserProfileIcon";
import { TaskIcon } from "./TaskIcon";
import { FormsIcon } from "./FormsIcon";
import { TablesIcon } from "./TablesIcon";
import { PagesIcon } from "./PagesIcon";

export type AdminMenuIconId =
  | "dashboard"
  | "ai"
  | "ecommerce"
  | "calendar"
  | "user-profile"
  | "task"
  | "forms"
  | "tables"
  | "pages";

export const ADMIN_MENU_ICON_MAP: Record<AdminMenuIconId, ComponentType<SVGProps<SVGSVGElement>>> = {
  dashboard: DashboardIcon,
  ai: AiIcon,
  ecommerce: EcommerceIcon,
  calendar: CalendarIcon,
  "user-profile": UserProfileIcon,
  task: TaskIcon,
  forms: FormsIcon,
  tables: TablesIcon,
  pages: PagesIcon,
};

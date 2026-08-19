import type { ReactNode } from "react";
import { MenuStateProvider } from "@/shared/template/admin/menu-state.context";
import { AdminShell } from "@/shared/template/admin/admin-shell.component";
import { MenuProvider } from "@/modules/examples/admin-menu/menu-provider.client";

export default function PrivateLayout({ children }: { children: ReactNode }) {
  return (
    <MenuProvider>
      <MenuStateProvider>
        <AdminShell>{children}</AdminShell>
      </MenuStateProvider>
    </MenuProvider>
  );
}

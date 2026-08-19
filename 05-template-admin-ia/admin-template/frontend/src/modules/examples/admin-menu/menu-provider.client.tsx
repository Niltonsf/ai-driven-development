"use client";
/**
 * Wrapper client que materializa a árvore de menu e a injeta no
 * MenuConfigProvider. Necessário porque os ícones do menu são funções React
 * (não-serializáveis); o layout server não consegue passá-los como prop para
 * o provider client. Importando o config aqui dentro, ambos vivem no bundle do
 * client e a serialização nunca acontece.
 */
import type { ReactNode } from "react";
import { MenuConfigProvider } from "@/shared/template/admin/menu-config.context";
import { adminMenu } from "./menu.config";

export function MenuProvider({ children }: { children: ReactNode }) {
  return <MenuConfigProvider items={adminMenu}>{children}</MenuConfigProvider>;
}

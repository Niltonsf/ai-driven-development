/**
 * Public layout — usado pelas páginas de autenticação.
 * Não monta o admin shell; renderiza apenas a estrutura externa.
 */
import type { ReactNode } from "react";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-ui-card-bg">{children}</div>;
}

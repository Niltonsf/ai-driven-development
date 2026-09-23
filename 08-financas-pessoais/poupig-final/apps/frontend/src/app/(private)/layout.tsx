'use client';

import { useRouter } from 'next/navigation';
import {
  ChartColumn,
  ChartPie,
  CodeXml,
  CreditCard,
  LayoutDashboard,
  ReceiptText,
  Repeat,
  Tags,
  Wallet,
} from 'lucide-react';
import { SelectedMonthProvider } from '@/shared/context/selected-month.context';
import { ShellProvider } from '@/shared/context/shell.context';
import { AdminShell } from '@/shared/template/admin-shell.component';
import { MonthPicker } from '@/shared/components/ui/month-picker.component';
import { SidebarMenu, type SidebarMenuSection } from '@/shared/components/ui/sidebar-menu.component';
import { AuthGuard } from '@/modules/auth/components/auth-guard.component';
import { useAuth } from '@/modules/auth/data/auth.context';
import { DEV_TOOLS_ENABLED } from '@/modules/dev/data/dev-tools.env';

/**
 * Seção de ferramentas de desenvolvimento, exibida só quando o frontend é
 * construído com a chave ligada. Esconder o menu não é proteção: a tela /dev
 * ainda consulta a disponibilidade no backend.
 */
const EXTRAS_SECTION: SidebarMenuSection = {
  id: 'extras',
  label: 'Extras',
  items: [{ id: 'dev', label: 'Desenvolvimento', href: '/dev', icon: CodeXml, match: 'prefix' }],
};

/**
 * Navegação da aplicação.
 *
 * Os caminhos de navegação fazem parte do ESTADO da aplicação e por isso são
 * definidos aqui no layout — não em shared/. Para alterar o menu (adicionar
 * itens, seções ou reorganizar a estrutura), edite NAVIGATION_SECTIONS abaixo.
 * Cada `href` deve apontar para uma rota dentro do grupo (private).
 */
const NAVIGATION_SECTIONS: SidebarMenuSection[] = [
  {
    id: 'main',
    items: [
      { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, match: 'prefix' },
      { id: 'transactions', label: 'Extrato Mensal', href: '/transactions', icon: ReceiptText, match: 'prefix' },
    ],
  },
  {
    id: 'registrations',
    label: 'Cadastros',
    items: [
      { id: 'accounts', label: 'Contas', href: '/accounts', icon: Wallet, match: 'prefix' },
      { id: 'cards', label: 'Cartões', href: '/cards', icon: CreditCard, match: 'prefix' },
      { id: 'categories', label: 'Categorias', href: '/categories', icon: Tags, match: 'prefix' },
    ],
  },
  {
    id: 'reports',
    label: 'Relatórios',
    items: [
      { id: 'cash-flow', label: 'Entradas x Saídas', href: '/reports/cash-flow', icon: ChartColumn, match: 'prefix' },
      {
        id: 'category-spending',
        label: 'Gastos por Categoria',
        href: '/reports/categories',
        icon: ChartPie,
        match: 'prefix',
      },
      { id: 'recurrences', label: 'Recorrências', href: '/reports/recurrences', icon: Repeat, match: 'prefix' },
    ],
  },
  // "Extras" é sempre a última seção: seções novas entram ANTES desta linha,
  // preservando a condição de ambiente.
  ...(DEV_TOOLS_ENABLED ? [EXTRAS_SECTION] : []),
];

const HOME_ROUTE = '/dashboard';
const LANDING_ROUTE = '/';

export default function PrivateGroupLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, clearAuth } = useAuth();

  return (
    <AuthGuard>
      <SelectedMonthProvider>
        <ShellProvider defaultOpen>
          <AdminShell
            sidebar={<SidebarMenu sections={NAVIGATION_SECTIONS} homeHref={HOME_ROUTE} />}
            headerLeading={<MonthPicker />}
            logoHref={HOME_ROUTE}
            userName={user?.name ?? 'Usuário'}
            userEmail={user?.email ?? ''}
            userAvatarUrl={user?.avatarUrl ?? undefined}
            onLogout={() => {
              clearAuth();
              router.push(LANDING_ROUTE);
            }}
          >
            {children}
          </AdminShell>
        </ShellProvider>
      </SelectedMonthProvider>
    </AuthGuard>
  );
}

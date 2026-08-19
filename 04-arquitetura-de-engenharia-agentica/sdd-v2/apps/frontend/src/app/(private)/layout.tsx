'use client';

import { useRouter } from 'next/navigation';
import { LayoutDashboard, Package, Users } from 'lucide-react';
import { ShellProvider } from '@/shared/context/shell.context';
import { AdminShell } from '@/shared/template/admin-shell.component';
import { AppSidebarNavigation } from '@/shared/navigation/app-sidebar-navigation.component';
import type { ModuleNavigationEntry } from '@/shared/components/ui/sidebar-menu.component';
import { AuthGuard } from '@/modules/auth/guard/auth.guard';
import { useAuth } from '@/modules/auth/context/auth.context';

// ── Rotas ─────────────────────────────────────────────────────────────────────

const EXAMPLE_ROUTE = '/example';
const EXAMPLE_DASHBOARD_ROUTE = `${EXAMPLE_ROUTE}/dashboard`;
const USERS_ROUTE = '/users';
const PRODUCTS_ROUTE = '/products';

// ── Estrutura de navegação ─────────────────────────────────────────────────────
// Adicione, remova ou reordene módulos e seções aqui para refletir no menu lateral.

const APP_MODULES: ModuleNavigationEntry[] = [
  {
    item: {
      id: 'example',
      label: 'Exemplo',
      shortLabel: 'Ex',
      href: EXAMPLE_DASHBOARD_ROUTE,
      icon: LayoutDashboard,
    },
    sections: [
      {
        id: 'example-main',
        label: 'Exemplo',
        items: [
          {
            id: 'example-dashboard',
            label: 'Dashboard',
            href: EXAMPLE_DASHBOARD_ROUTE,
            icon: LayoutDashboard,
            match: 'exact',
          },
        ],
      },
    ],
  },
  {
    item: {
      id: 'auth',
      label: 'Acesso',
      shortLabel: 'Ac',
      href: USERS_ROUTE,
      icon: Users,
    },
    sections: [
      {
        id: 'auth-main',
        label: 'Acesso',
        items: [
          {
            id: 'auth-users',
            label: 'Usuários',
            href: USERS_ROUTE,
            icon: Users,
          },
        ],
      },
    ],
  },
  {
    item: {
      id: 'catalog',
      label: 'Catálogo',
      shortLabel: 'Ca',
      href: PRODUCTS_ROUTE,
      icon: Package,
    },
    sections: [
      {
        id: 'catalog-main',
        label: 'Catálogo',
        items: [
          {
            id: 'catalog-products',
            label: 'Produtos',
            href: PRODUCTS_ROUTE,
            icon: Package,
          },
        ],
      },
    ],
  },
];

// ──────────────────────────────────────────────────────────────────────────────

export default function PrivateGroupLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const auth = useAuth();

  return (
    <AuthGuard>
      <ShellProvider defaultOpen>
        <AdminShell
          sidebar={<AppSidebarNavigation modules={APP_MODULES} defaultModuleId="example" />}
          userName={auth.user?.name}
          userEmail={auth.user?.email}
          onLogout={() => {
            auth.logout();
            router.push('/join');
          }}
        >
          {children}
        </AdminShell>
      </ShellProvider>
    </AuthGuard>
  );
}

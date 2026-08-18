'use client';

import { useRouter } from 'next/navigation';
import { LayoutDashboard, Package, Users } from 'lucide-react';
import { ShellProvider } from '@/shared/context/shell.context';
import { AdminShell } from '@/shared/template/admin-shell.component';
import { AppSidebarNavigation } from '@/shared/navigation/app-sidebar-navigation.component';
import type { ModuleNavigationEntry } from '@/shared/components/ui/sidebar-menu.component';
import { AuthGuard, useAuth } from '@/modules/auth';

// ── Rotas ─────────────────────────────────────────────────────────────────────

const EXAMPLE_ROUTE = '/example';
const EXAMPLE_DASHBOARD_ROUTE = `${EXAMPLE_ROUTE}/dashboard`;

const AUTH_ROUTE = '/auth';
const AUTH_USERS_ROUTE = `${AUTH_ROUTE}/users`;

const CATALOG_ROUTE = '/catalog';
const CATALOG_PRODUCTS_ROUTE = `${CATALOG_ROUTE}/products`;

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
      label: 'Autenticação',
      shortLabel: 'Auth',
      href: AUTH_USERS_ROUTE,
      icon: Users,
    },
    sections: [
      {
        id: 'auth-main',
        label: 'Autenticação',
        items: [
          {
            id: 'auth-users',
            label: 'Usuários',
            href: AUTH_USERS_ROUTE,
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
      shortLabel: 'Cat',
      href: CATALOG_PRODUCTS_ROUTE,
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
            href: CATALOG_PRODUCTS_ROUTE,
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
  const { user, logout } = useAuth();

  return (
    <AuthGuard>
      <ShellProvider defaultOpen>
        <AdminShell
          sidebar={<AppSidebarNavigation modules={APP_MODULES} defaultModuleId="example" />}
          userName={user?.name}
          userEmail={user?.email}
          onLogout={() => {
            logout();
            router.push('/join');
          }}
        >
          {children}
        </AdminShell>
      </ShellProvider>
    </AuthGuard>
  );
}

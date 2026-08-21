'use client';

import { useRouter } from 'next/navigation';
import { LayoutDashboard, Lightbulb, Tags, Workflow } from 'lucide-react';
import { ShellProvider } from '@/shared/context/shell.context';
import { AdminShell } from '@/shared/template/admin-shell.component';
import {
  SidebarMenu,
  type SidebarMenuSection,
} from '@/shared/components/ui/sidebar-menu.component';
import { AuthGuard, useAuth } from '@/modules/auth';

const DASHBOARD_ROUTE = '/dashboard';
const PROCESSINGS_ROUTE = '/processings';

const SIDEBAR_SECTIONS: SidebarMenuSection[] = [
  {
    id: 'main',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        href: DASHBOARD_ROUTE,
        icon: LayoutDashboard,
        match: 'exact',
      },
      {
        id: 'idea-types',
        label: 'Tipos de Ideia',
        href: '/idea-types',
        icon: Tags,
        match: 'prefix',
      },
      {
        id: 'ideas',
        label: 'Ideias',
        href: '/ideas',
        icon: Lightbulb,
        match: 'prefix',
      },
      {
        id: 'processings',
        label: 'Processamentos',
        href: PROCESSINGS_ROUTE,
        icon: Workflow,
        match: 'prefix',
      },
    ],
  },
];

function PrivateShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, logout } = useAuth();

  return (
    <ShellProvider defaultOpen>
      <AdminShell
        sidebar={<SidebarMenu sections={SIDEBAR_SECTIONS} />}
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
  );
}

export default function PrivateGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <PrivateShell>{children}</PrivateShell>
    </AuthGuard>
  );
}

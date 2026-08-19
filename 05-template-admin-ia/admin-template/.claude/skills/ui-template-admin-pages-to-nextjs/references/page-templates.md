# Page templates (esqueletos JSX)

Snippets de referência para copiar e adaptar. **Não são componentes** — são pontos de partida. Os nomes de imports devem ser conferidos contra o `index.ts` real do projeto.

**Convenção:** `page.tsx` em `src/app/...` é entry-point fino (≤10 linhas). Estado, mocks e componentes específicos vivem em `src/modules/examples/<feature>/`.

---

## Lista CRUD

```tsx
// src/app/(admin)/users/page.tsx
/**
 * Lista de usuários
 * Replica: <template-path>/users-list.html
 * Fidelidade: MÉDIA
 */
import { UsersListContent } from "@/modules/examples/users/users-list.client";

export default function Page() {
  return <UsersListContent />;
}
```

```tsx
// src/modules/examples/users/users-list.client.tsx
"use client";
import { useState, useMemo } from "react";
import {
  PageHeader, Button, DataTable, DataTableToolbar, Pagination,
  Modal, Avatar, Badge, EmptyState
} from "@/shared/components/ui";
import { PlusIcon, SearchIcon, TrashIcon, PencilIcon } from "<icon-lib>";
import { users, type User } from "./mock-data";

const PAGE_SIZE = 10;

export function UsersListContent() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState<User | null>(null);

  const filtered = useMemo(
    () => users.filter(u =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    ),
    [users, search]
  );

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <PageHeader
        title="Usuários"
        breadcrumb={[{ label: "Início", href: "/dashboard" }, { label: "Usuários" }]}
        actions={<Button leftIcon={<PlusIcon />}>Novo usuário</Button>}
      />

      <DataTableToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por nome ou email"
      />

      {paginated.length === 0 ? (
        <EmptyState
          title="Nenhum usuário encontrado"
          description="Ajuste a busca ou crie um novo usuário."
        />
      ) : (
        <>
          <DataTable
            columns={[
              { id: "name", header: "Nome", cell: (u) => (
                <div className="flex items-center gap-3">
                  <Avatar src={u.avatarUrl} name={u.name} size="sm" />
                  <div>
                    <div className="font-medium">{u.name}</div>
                    <div className="text-sm text-ui-muted-foreground">{u.email}</div>
                  </div>
                </div>
              )},
              { id: "role", header: "Papel", cell: (u) => u.role },
              { id: "status", header: "Status", cell: (u) =>
                <Badge variant={statusVariant(u.status)}>{u.status}</Badge> },
              { id: "createdAt", header: "Criado em", cell: (u) =>
                new Intl.DateTimeFormat("pt-BR").format(new Date(u.createdAt)) },
              { id: "actions", header: "", cell: (u) => (
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon"><PencilIcon /></Button>
                  <Button variant="ghost" size="icon" onClick={() => setToDelete(u)}>
                    <TrashIcon />
                  </Button>
                </div>
              )}
            ]}
            data={paginated}
          />
          <Pagination
            page={page}
            totalPages={Math.ceil(filtered.length / PAGE_SIZE)}
            onPageChange={setPage}
          />
        </>
      )}

      <Modal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Excluir usuário"
        description={`Tem certeza que deseja excluir ${toDelete?.name}? Esta ação é apresentacional — sem efeito real.`}
        actions={
          <>
            <Button variant="ghost" onClick={() => setToDelete(null)}>Cancelar</Button>
            <Button variant="danger" onClick={() => setToDelete(null)}>Excluir</Button>
          </>
        }
      />
    </>
  );
}

function statusVariant(s: User["status"]) {
  return ({ Ativo: "success", Inativo: "neutral", Pendente: "warning", Suspenso: "danger" } as const)[s];
}
```

---

## Detalhe

```tsx
// src/app/(admin)/users/[id]/page.tsx
import { UserDetailContent } from "@/modules/examples/users/detail/user-detail";

export default function Page({ params }: { params: { id: string } }) {
  return <UserDetailContent id={params.id} />;
}
```

```tsx
// src/modules/examples/users/detail/user-detail.tsx
/**
 * Detalhe de usuário
 * Replica: <template-path>/user-view.html
 * Fidelidade: MÉDIA
 */
import { notFound } from "next/navigation";
import { PageHeader, Card, CardHeader, CardBody, Avatar, Badge, Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/components/ui";
import { user, activity } from "./mock-data";

export function UserDetailContent({ id }: { id: string }) {
  if (id !== user.id) return notFound();
  return (
    <>
      <PageHeader
        title={user.name}
        breadcrumb={[
          { label: "Início", href: "/dashboard" },
          { label: "Usuários", href: "/users" },
          { label: user.name }
        ]}
      />
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        <aside>
          <Card>
            <CardBody className="text-center">
              <Avatar src={user.avatarUrl} name={user.name} size="xl" className="mx-auto" />
              <h2 className="mt-3 text-lg font-semibold">{user.name}</h2>
              <p className="text-sm text-ui-muted-foreground">{user.email}</p>
              <Badge className="mt-2">{user.role}</Badge>
            </CardBody>
          </Card>
        </aside>
        <main>
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Visão geral</TabsTrigger>
              <TabsTrigger value="activity">Atividade</TabsTrigger>
              <TabsTrigger value="security">Segurança</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">{/* Cards informativos */}</TabsContent>
            <TabsContent value="activity">{/* Lista activity */}</TabsContent>
            <TabsContent value="security">{/* sessões, 2FA */}</TabsContent>
          </Tabs>
        </main>
      </div>
    </>
  );
}
```

---

## Settings

```tsx
// src/app/(admin)/settings/page.tsx
import { SettingsTabs } from "@/modules/examples/settings/settings-tabs.client";

export default function Page() {
  return <SettingsTabs />;
}
```

```tsx
// src/modules/examples/settings/settings-tabs.client.tsx
"use client";
import { useState } from "react";
import { PageHeader, Tabs, TabsList, TabsTrigger, TabsContent, FormSection, FormFooter, Input, Label, Switch, Select, Button } from "@/shared/components/ui";

export function SettingsTabs() {
  const [tab, setTab] = useState("account");

  return (
    <>
      <PageHeader title="Configurações" />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="account">Conta</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="appearance">Aparência</TabsTrigger>
          <TabsTrigger value="billing">Faturamento</TabsTrigger>
        </TabsList>

        <TabsContent value="account">
          <form onSubmit={(e) => { e.preventDefault(); console.info("[demo] settings/account"); }}>
            <FormSection title="Dados da conta" description="Informações públicas do perfil.">
              <div><Label>Nome</Label><Input defaultValue="Ana Beatriz" /></div>
              <div><Label>Email</Label><Input type="email" defaultValue="ana@exemplo.com.br" /></div>
            </FormSection>
            <FormFooter>
              <Button variant="ghost" type="button">Cancelar</Button>
              <Button type="submit">Salvar</Button>
            </FormFooter>
          </form>
        </TabsContent>

        <TabsContent value="notifications">
          <FormSection title="Notificações por email">
            <div className="flex items-center justify-between">
              <Label>Resumo semanal</Label><Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label>Alertas de segurança</Label><Switch defaultChecked />
            </div>
          </FormSection>
        </TabsContent>
        {/* outras tabs */}
      </Tabs>
    </>
  );
}
```

---

## 404 (`src/app/not-found.tsx`)

```tsx
/**
 * 404
 * Replica: <template-path>/page-misc-error.html
 * Fidelidade: ALTA
 */
import Link from "next/link";
import { Button } from "@/shared/components/ui";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-6 bg-ui-background">
      <div className="text-9xl font-bold text-ui-primary">404</div>
      <h1 className="mt-4 text-2xl font-semibold">Página não encontrada</h1>
      <p className="mt-2 text-ui-muted-foreground max-w-md">
        A página que você procura não existe ou foi movida.
      </p>
      <Button asChild className="mt-6">
        <Link href="/dashboard">Voltar para o início</Link>
      </Button>
    </div>
  );
}
```

---

## error.tsx

```tsx
"use client";
/**
 * Erro genérico (500)
 * Fidelidade: ALTA quando há equivalente
 */
import Link from "next/link";
import { Button } from "@/shared/components/ui";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-6 bg-ui-background">
      <div className="text-9xl font-bold text-ui-danger">500</div>
      <h1 className="mt-4 text-2xl font-semibold">Algo deu errado</h1>
      <p className="mt-2 text-ui-muted-foreground max-w-md">
        Ocorreu um erro inesperado. Tente novamente ou volte para o início.
      </p>
      <div className="mt-6 flex gap-3">
        <Button variant="ghost" onClick={reset}>Tentar novamente</Button>
        <Button asChild><Link href="/dashboard">Voltar</Link></Button>
      </div>
    </div>
  );
}
```

---

## Auth layout + page

Ver `auth-fidelity-guide.md` para a estrutura completa.

---

## Dashboard

Composição final fica em `src/modules/examples/dashboard/components/`, dirigida pelo `dashboard-fidelity-guide.md`. Esqueleto:

```tsx
// src/app/(admin)/dashboard/page.tsx
import { DashboardContent } from "@/modules/examples/dashboard/dashboard-content";
export default function Page() { return <DashboardContent />; }
```

```tsx
// src/modules/examples/dashboard/dashboard-content.tsx
/**
 * Dashboard
 * Replica: <template-path>/dashboard.html (variante "Analytics")
 * Fidelidade: ALTA
 */
import { PageHeader } from "@/shared/components/ui";
import { StatCardsRow } from "./components/stat-cards-row";
import { RevenueOverviewCard } from "./components/revenue-overview-card";
import { TrafficSourcesChart } from "./components/traffic-sources-chart";
import { TopProductsCard } from "./components/top-products-card";
import { RecentOrdersTable } from "./components/recent-orders-table";

export function DashboardContent() {
  return (
    <>
      <PageHeader title="Dashboard" />

      <StatCardsRow />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2"><RevenueOverviewCard /></div>
        <div className="grid gap-6">
          <TrafficSourcesChart />
          <TopProductsCard />
        </div>
      </div>

      <div className="mt-6">
        <RecentOrdersTable />
      </div>
    </>
  );
}
```

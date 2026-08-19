# Page composition patterns

## Onde mora o quê

| Tipo de arquivo | Local | Justificativa |
|-----------------|-------|---------------|
| Entry-point de rota (`page.tsx`, `layout.tsx`, `not-found.tsx`, `error.tsx`) | `src/app/...` | Convenção Next.js — arquivo fino, idealmente ≤10 linhas |
| Mocks (`mock-data.ts`, `users.ts`, `revenue.ts`) | `src/modules/examples/<feature>/` | Estado da app — fora de `src/shared/` por regra dura |
| Componentes específicos da feature (StatCardsRow, RevenueOverviewCard, etc.) | `src/modules/examples/<feature>/components/` | Específicos do exemplo, não reutilizáveis cross-feature |
| Client component principal (interatividade) | `src/modules/examples/<feature>/<feature>-content.client.tsx` | Cliente isolado por feature |
| Hooks de feature, contexts, constantes | `src/modules/examples/<feature>/hooks/`, `context/`, `constants.ts` | Estado e lógica de demo |
| Menu config (árvore de itens da app) | `src/modules/examples/admin-menu/menu.config.ts` | Estado herdado da skill `sidebar`; wired no layout privado |
| Tipos genéricos de menu | `src/shared/template/admin/menu.types.ts` | Já criado pela skill `sidebar` — apenas tipos, não dados |

**Regra absoluta:** `src/shared/` **nunca** recebe estado da aplicação (lista de itens reais, mocks, dados de demo). Apenas máquina genérica reutilizável.

## Server vs Client

**Default**: `page.tsx` é server component.

**Quando extrair client component**:
- Filtros que mudam estado local (search, dropdowns)
- Modais abertos/fechados
- Troca de tab
- Toggle mostrar/esconder
- Qualquer `useState`, `useEffect`, `useSearchParams`, `useRouter` no client

**Padrão**:

```tsx
// src/app/(admin)/users/page.tsx  (server, fino)
import { UsersListContent } from "@/modules/examples/users/users-list.client";

export default function Page() {
  return <UsersListContent />;
}
```

```tsx
// src/modules/examples/users/users-list.client.tsx  (client)
"use client";
import { useState } from "react";
import { DataTable, PageHeader } from "@/shared/components/ui";
import { users } from "./mock-data";

export function UsersListContent() {
  const [search, setSearch] = useState("");
  // ... filtros, paginação local, modal
}
```

```ts
// src/modules/examples/users/mock-data.ts
export type User = { /* ... */ };
export const users: User[] = [ /* ... */ ];
```

## Organização de arquivos

```
src/app/(admin)/<route>/
└── page.tsx                              # entry-point fino, ≤10 linhas

src/modules/examples/<feature>/
├── <feature>-content.client.tsx          # client principal (quando há interatividade)
├── mock-data.ts                          # tipos + dados
├── constants.ts                          # constantes da feature (page sizes, etc.)
├── components/                           # peças específicas da feature
│   ├── <bloco-a>.tsx
│   ├── <bloco-b>.tsx
│   └── <bloco-c>.tsx
├── hooks/                                # hooks de feature (opcional)
└── context/                              # contexts de feature (opcional)
```

Para rotas dinâmicas (`users/[id]`):

```
src/app/(admin)/users/[id]/page.tsx       # entry-point que recebe params e passa
src/modules/examples/users/detail/        # peças do detalhe (mock, componentes)
```

## Comentário-cabeçalho obrigatório

Toda página tem na primeira linha do arquivo:

```tsx
/**
 * <Nome da página>
 *
 * Replica: <caminho do HTML do template> (ou "sem equivalente no template — defaults coerentes")
 * Fidelidade: ALTA | MÉDIA | DEFAULT
 * Adaptações: <lista>
 */
```

## PageHeader consistente

Toda página dentro de `(admin)` começa com `PageHeader`:

```tsx
<PageHeader
  title="Usuários"
  breadcrumb={[
    { label: "Início", href: "/dashboard" },
    { label: "Usuários" }
  ]}
  actions={
    <Button variant="primary" leftIcon={<PlusIcon />}>Novo usuário</Button>
  }
/>
```

Verificar a API exata do `PageHeader` lendo o arquivo gerado pela skill de composites — adaptar.

## Responsividade

Replicar breakpoints do template. Padrões comuns:

```tsx
// 4 stat cards no topo
<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

// linha mista 1 grande + 2 pequenos
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <div className="lg:col-span-2"><BigChart /></div>
  <div className="grid gap-6">
    <SmallChart />
    <SmallChart />
  </div>
</div>

// 2 colunas no detalhe (sidebar + main)
<div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
  <aside>...</aside>
  <main>...</main>
</div>
```

## Loading e Empty

- Loading: usar `<Suspense fallback={<LoadingSkeleton />}>` quando aplicável; ou state local com fallback durante interações.
- Empty: sempre que houver lista filtrável, garantir que filtros possam zerar o resultado e renderizar `<EmptyState>`.

## Acessibilidade

- `<h1>` apenas no `<PageHeader>` (que já encapsula).
- Seções subsequentes usam `<h2>`/`<h3>` conforme hierarquia.
- Inputs sempre com `<Label>` (já vem dos primitivos).
- Modais e overlays já tratam foco (composites).

## Imports obrigatórios

- Componentes reutilizáveis: `@/shared/components/ui`, `@/shared/components/charts` — sempre via barrel `index.ts`.
- Estado/peças de feature: `@/modules/examples/<feature>` (relativo dentro do módulo, absoluto entre módulos e do `src/app/`).
- Tipos de menu: `@/shared/template/admin/menu.types` (apenas tipos).
- **Nunca** importar dados (`mock-data`) de `@/shared/...` — não existe lá. Se um import desses aparecer, é bug.

```tsx
// bom
import { Button, Input, Card } from "@/shared/components/ui";
import { LineChart, ChartContainer } from "@/shared/components/charts";
import { UsersListContent } from "@/modules/examples/users/users-list.client";

// ruim — caminho profundo no shared
import { Button } from "@/shared/components/ui/button";

// ruim — estado em shared
import { users } from "@/shared/data/users";
```

A regra é: páginas e módulos consomem `shared` via barrel `index.ts`. Se um nome não está no barrel, **interromper** — está faltando exportar (lacuna na skill anterior).

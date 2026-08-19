# Menu integrity protocol

Garante que **toda rota referenciada pelo menu tem página correspondente** após esta skill rodar. Sem links quebrados.

## Por que existe

A skill `sidebar` gera apenas a máquina de UI do menu (componentes + tipos + Provider genéricos). Ela **não** grava `menu.config.ts` em `src/shared/` (regra dura: `src/shared/` não tem estado da app). Em vez disso, ela entrega o JSON da árvore extraída do template no relatório final. **Esta skill** materializa essa árvore em `src/modules/examples/admin-menu/menu.config.ts` e wireia no layout privado.

## Passo 1 — Obter a árvore de navegação

Fontes (em ordem de preferência):

1. **JSON entregue no relatório da skill `sidebar`** — copiar/colar para `src/modules/examples/admin-menu/menu.config.ts`.
2. **Arquivo intermediário** `<template-root>/.menu-tree.json` — se a skill `sidebar` o tiver gravado.
3. **Re-extrair do template** rodando `scripts/extract-menu-tree.mjs` da skill `sidebar` se nada acima estiver disponível.
4. **Arquivo `menu.config.ts` legado em `src/shared/`** (de execuções antigas da skill `sidebar` antes da regra atual): MIGRAR — mover para `src/modules/examples/admin-menu/menu.config.ts` e deletar do shared.

Se um `menu.config.ts` existir em `src/shared/`, **ABORTAR** com mensagem instruindo migração e oferecer fazer a migração automaticamente.

## Passo 1.5 — Materializar o `menu.config.ts`

Criar `src/modules/examples/admin-menu/menu.config.ts`:

```ts
import type { MenuNode } from "@/shared/template/admin/menu.types";

export const menuConfig: MenuNode[] = [
  // árvore extraída do JSON entregue pela skill `sidebar`
];
```

Wirear no layout privado (`src/app/(admin)/layout.tsx` ou `(private)/layout.tsx`):

```tsx
import { MenuConfigProvider } from "@/shared/template/admin/menu-config.context";
import { menuConfig } from "@/modules/examples/admin-menu/menu.config";
// ... AdminShell envolto em <MenuConfigProvider value={menuConfig}>
```

## Passo 2 — Extrair recursivamente toda lista de hrefs

Iterar sobre `menuConfig` (recém criado em `src/modules/examples/admin-menu/menu.config.ts`) recursivamente. Ignorar:
- Links externos (começam com `http`, `https`, `mailto:`, `#`)
- Placeholders (`href: "#"` puro)

Output: lista plana de rotas internas.

```ts
type ExtractedRoute = {
  href: string;          // ex. "/users"
  label: string;         // "Usuários"
  depth: number;         // nível na árvore
};
```

## Passo 3 — Cruzar com a tabela de páginas planejadas

Para cada `ExtractedRoute`:

- Já existe na tabela de mapeamento (Fase 1)? OK.
- Ainda não está? Adicionar como linha extra com origem `menu`.

## Passo 4 — Resolver rotas órfãs

Para cada rota órfã (citada pelo menu mas sem arquétipo claro):

1. Tentar casar com o catálogo (`pages-catalog.md`) por palavra-chave do label/href.
2. Se casar (ex.: `/calendar` → app/calendar do catálogo): gerar com tratamento normal.
3. Se não casar: gerar página minimalista:

```tsx
import { PageHeader, EmptyState } from "@/shared/components/ui";

export default function Page() {
  return (
    <>
      <PageHeader title="<label-da-rota>" />
      <EmptyState
        title="Em construção"
        description="Esta página ainda não tem conteúdo. Substitua-a pelo seu fluxo de domínio quando estiver pronto."
      />
    </>
  );
}
```

## Passo 5 — Validação final pós-build

Após `npm run build` passar, confirmar para CADA rota da lista extraída:

```bash
# para cada href da lista, verificar que existe um page.tsx correspondente
# em src/app/(admin)/<href>/page.tsx (ou variantes com route group)
```

Reportar no relatório final:

```
[Integridade da navegação]
✓ /dashboard         → src/app/(admin)/dashboard/page.tsx
✓ /users             → src/app/(admin)/users/page.tsx
✓ /users/[id]        → src/app/(admin)/users/[id]/page.tsx
✓ /apps/calendar     → src/app/(admin)/apps/calendar/page.tsx (placeholder em construção)
✓ /settings          → src/app/(admin)/settings/page.tsx
✓ /profile           → src/app/(admin)/profile/page.tsx

Total: 14 rotas no menu, 14 páginas correspondentes. Sem links quebrados.
```

## Caso especial: rotas dinâmicas

Se o menu cita `/users` (lista) mas o template implica detalhe (`/users/:id`), gerar AMBAS — `users/page.tsx` e `users/[id]/page.tsx`. A presença no menu da rota-pai não exige a rota dinâmica filha; o detalhe vem do conjunto mínimo.

## Sobreposição com placeholders existentes (de execuções legadas)

Se uma versão antiga da skill `sidebar` deixou `src/app/(private)/(examples)/<rota>/page.tsx`, esta skill deve:

1. Para rotas do conjunto mínimo: gerar a página real em `(admin)/<rota>/page.tsx` (entry-point) + módulo em `src/modules/examples/<feature>/`, e **deletar** o placeholder em `(examples)/`.
2. Para rotas só citadas no menu (sem arquétipo claro): gerar a página minimalista (entry-point + módulo simples só com `<EmptyState>`) e deletar o placeholder.

Não duplicar rotas. Versões atuais da skill `sidebar` não geram esses placeholders — se eles existirem, são legado de execução anterior.

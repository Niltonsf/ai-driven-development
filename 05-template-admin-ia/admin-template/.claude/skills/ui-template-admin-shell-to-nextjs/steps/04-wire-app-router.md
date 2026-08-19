# Fase 4 — Wiring no App Router

## Goal

Tornar o shell observável em uma rota real, criando o grupo `(private)` com layout e a página `dashboard` como rota padrão da área privada.

## Inputs

- Componentes gerados na Fase 3 em `src/shared/template/admin/`.
- Templates `private-layout.tsx.tmpl` e `private-page.tsx.tmpl`.

## Procedure

1. **Criar `src/app/(private)/layout.tsx`** a partir de `templates/private-layout.tsx.tmpl`. O layout:
   - Importa `MenuStateProvider` de `@/shared/template/admin/menu-state.context`.
   - Importa `AdminShell` de `@/shared/template/admin/admin-shell.component`.
   - Envolve `{children}` com `<MenuStateProvider><AdminShell>{children}</AdminShell></MenuStateProvider>`.
   - É um Server Component por padrão; os filhos client components funcionam normalmente.

2. **Criar `src/app/(private)/dashboard/page.tsx`** a partir de `templates/private-page.tsx.tmpl`. Conteúdo: apenas `<div>Conteúdo</div>`. **Não** adicionar texto explicativo, layout adicional, breadcrumbs ou heading — o objetivo é provar visualmente que o slot principal do shell recebe filhos. A rota efetiva é `/dashboard` (o segmento `(private)` é grupo, não path).

3. **Não tocar** em nada fora desses dois arquivos. Em particular:
   - **Não** modificar nem remover `src/app/page.tsx` raiz — deve ficar exatamente como está.
   - **Não** modificar `src/app/layout.tsx` raiz.
   - **Não** criar `src/app/(private)/page.tsx` (rota raiz do grupo) — a rota padrão da área privada é `/dashboard`, não `/`. A rota `/` continua sendo servida pela `src/app/page.tsx` raiz preexistente.

   Como `(private)` é um route group (parênteses) e a página vive em `dashboard/`, não há colisão de path com a raiz: `/` resolve para `src/app/page.tsx`, `/dashboard` resolve para `src/app/(private)/dashboard/page.tsx`.

4. **Verificar import alias.** Se `@/*` não estiver configurado em `tsconfig.json`, usar paths relativos no layout (`../../shared/template/admin/...`). Não reconfigurar tsconfig nesta skill.

## Acceptance criteria

- [ ] `src/app/(private)/layout.tsx` existe e usa `<MenuStateProvider>` + `<AdminShell>`.
- [ ] `src/app/(private)/dashboard/page.tsx` existe e renderiza apenas `<div>Conteúdo</div>`.
- [ ] `src/app/page.tsx` raiz **inalterado** (mesmo hash que antes da skill rodar).
- [ ] `src/app/layout.tsx` raiz **inalterado**.
- [ ] Nenhum arquivo fora de `(private)/` foi criado/modificado.

## Verification gate

`npx tsc --noEmit` continua passando. Reportar os 2 arquivos criados e prosseguir para a Fase 5.

## Failure handling

- `src/app/(private)/dashboard/page.tsx` já existe com conteúdo diferente → não sobrescrever silenciosamente; perguntar ao usuário.
- `src/app/page.tsx` raiz ausente → seguir mesmo assim; a skill só garante a rota `/dashboard`. A rota `/` é responsabilidade do projeto.

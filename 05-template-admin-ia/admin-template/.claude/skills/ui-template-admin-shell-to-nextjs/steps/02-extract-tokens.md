# Fase 2 — Extração de tokens

## Goal

Extrair do CSS do template apenas os valores estruturais (medidas das áreas, alturas, paddings, cores das áreas) e materializá-los como **tokens consumíveis** pela stack detectada na Fase 0. Componentes da Fase 3 lerão esses tokens — nunca hardcode.

## Inputs

- CSSs do template (Fase 0).
- Tabela de áreas (Fase 1).
- Stack de estilização detectada (Fase 0).

## Procedure

1. **Extrair valores estruturais** do CSS do template:
   - Larguras do `aside` em cada estado: expanded, mini (se houver), mobile.
   - Alturas de `topbar` e `footer` (se existirem).
   - Paddings/margins do `main`.
   - Cores de fundo, cor de borda e cor de texto **apenas** das áreas estruturais.
   - Família de fonte e tamanho base aplicados ao `body`.
   - Breakpoints usados nas media queries do CSS original (anotar valores exatos em px).
   - **Logo region (sidebar-header)** — usar exatamente o que foi capturado na Fase 1.4.5. Não substituir por defaults "razoáveis"; valores literais do template.
   - **`menuBreakpointPx`** (Fase 1.7) — usado pelo `MenuStateProvider`. Materializar como CSS var `--shell-menu-bp` E como constante TypeScript `BP_MD` injetada no `menu-state.context.tsx` (placeholder `{{BP_MD_PX_NUMBER}}` já existe no template). **Crítico:** a constante TS é a fonte da verdade da máquina de estados; se sair errada, o sidebar entra em modo offcanvas no breakpoint errado.

2. **Mapear breakpoints** do CSS original para a estratégia da stack alvo. Ver [`../references/responsive-strategy.md`](../references/responsive-strategy.md).

3. **Emitir tokens** conforme a stack:

   - **Tailwind v4** → criar `src/shared/template/admin/admin-shell.tokens.css` com um bloco `@theme` contendo as variáveis. Importar o arquivo no topo do `src/app/globals.css` se ainda não estiver.
     ```css
     @theme {
       --shell-aside-w-expanded: 260px;
       --shell-aside-w-mini: 73px;
       --shell-topbar-h: 64px;
       --shell-footer-h: 48px;
       --shell-bg: #ffffff;
       --shell-aside-bg: #1f2937;
       --shell-topbar-bg: #ffffff;
       --shell-border: #e5e7eb;
       --shell-text: #111827;
       --shell-bp-md: 768px;
       --shell-bp-lg: 1024px;

       /* Logo region (sidebar-header) — valores literais do template original */
       --shell-aside-header-pt: 2rem;
       --shell-aside-header-pb: 1.75rem;
       --shell-aside-header-px-expanded: 1.5rem;
       --shell-aside-header-px-mini: 0px;
       --shell-aside-header-gap: 0.5rem;
       --shell-aside-header-align: center;
       /* `justify` por estado é aplicado em JSX (não cabe em var CSS porque alterna por modo) */

       /* Menu toggle button — wrapper (icon-agnostic, valores literais do template) */
       --shell-menu-toggle-w: 2.75rem;
       --shell-menu-toggle-h: 2.75rem;
       --shell-menu-toggle-bg: transparent;
       --shell-menu-toggle-bg-hover: #f2f4f7;
       /* Borda — quando o template usa borda só em alguns breakpoints, emitir
        * o valor "neutro" (1px solid transparent) no :root e SOBRESCREVER dentro
        * de @media queries. Nunca usar `none` (causa layout shift quando aparece). */
       --shell-menu-toggle-border: 1px solid transparent;
       --shell-menu-toggle-radius: 0.5rem;
       --shell-menu-toggle-padding: 0px;
       --shell-menu-toggle-color: currentColor;

       /* Topbar — espaçamentos literais do template. NUNCA usar `1rem` por
        * default. Capturados na Fase 1.2.1 e 1.2.1.1. */
       --shell-topbar-px: 1rem;          /* padding horizontal mobile do INNER ROW (não do <header>) */
       --shell-topbar-py: 0px;           /* padding vertical do inner row */
       --shell-topbar-gap: 1rem;          /* gap entre filhos do inner row */
       --shell-topbar-outer-px: 0px;      /* padding do OUTER wrapper (Fase 1.2.1.1) */
       --shell-topbar-toggle-mr: 0px;     /* margem direita do <MenuToggle> */
       --shell-topbar-inner-border: 1px solid transparent; /* border-b interno se houver */

       /* Breakpoint mobile↔desktop do menu (Fase 1.7) — fronteira efetiva
        * onde o sidebar muda de offcanvas para static. Valor literal do template. */
       --shell-menu-bp: 1280px;

       /* Main content area — espaçamentos literais do template (Fase 1.2.1.2).
        * NUNCA deixar o `<main>` sem padding (sintoma "conteúdo colado nas bordas"). */
       --shell-main-px: 1rem;            /* padding-x mobile */
       --shell-main-py: 1rem;            /* padding-y mobile */
       --shell-main-gap: 1.5rem;          /* gap-y entre seções do main, se aplicável */
       --shell-main-max-w: none;          /* `none` quando template não centraliza; ex.: 1536px = max-w-screen-2xl */
     }

     /* Breakpoints do main — sobrescrever via @media quando o template define
      * `md:p-6`, `lg:p-8`, `2xl:p-10` etc. */
     /* @media (min-width: 768px)  { :root { --shell-main-px: 1.5rem; --shell-main-py: 1.5rem; } }
        @media (min-width: 1024px) { :root { --shell-main-px: 2rem;   --shell-main-py: 2rem;   } }
        @media (min-width: 1536px) { :root { --shell-main-px: 2.5rem; --shell-main-py: 2.5rem; } } */

     /* Borda condicional do toggle — só aparece a partir de xl no exemplo TailAdmin */
     @media (min-width: 1280px) {
       :root { --shell-menu-toggle-border: 1px solid #e5e7eb; }
     }
     /* Padding lateral do topbar pode também variar por breakpoint — replicar
      * via @media query quando o template define `lg:px-6` etc. */
     ```
   - **Tailwind v3** → criar `src/shared/template/admin/admin-shell.tokens.css` com `:root { --shell-...: ...; }` e estender `tailwind.config.ts` em `theme.extend.spacing`/`theme.extend.colors` com as chaves `shell-aside-expanded`, `shell-aside-mini`, etc., apontando para `var(--shell-...)`. Importar o `.css` no `globals.css`.
   - **CSS Modules / styled-components** → criar `src/shared/template/admin/admin-shell.tokens.css` com `:root { --shell-...: ...; }` e importar globalmente. Componentes consomem via `var(--shell-...)`.

4. **Sem hardcode.** Qualquer cor/medida estrutural usada na Fase 3 precisa vir destes tokens. Valores muito específicos (ex.: `73px` mini width) podem aparecer nos componentes apenas como referência ao token (`w-[var(--shell-aside-w-mini)]`).

5. **Tema único.** Emitir apenas o conjunto de tokens do tema padrão detectado na Fase 0. **Não** criar variantes `[data-theme="dark"]`.

## Acceptance criteria

- [ ] `admin-shell.tokens.css` existe em `src/shared/template/admin/`.
- [ ] Toda dimensão e cor estrutural identificada na Fase 1/2 tem um token correspondente.
- [ ] Para Tailwind v3, `tailwind.config.ts` foi estendido (idempotentemente — não duplicar chaves se rodar novamente).
- [ ] Tokens importados no `globals.css` (uma única linha de `@import`).
- [ ] Nenhum bloco de tema alternativo (dark/light toggle) foi emitido.

## Verification gate

`npm run build` (parcial, apenas para confirmar que o CSS importa) **OU**, mais barato, `npx tsc --noEmit` para garantir que nenhum import quebrou. Se a stack é Tailwind, rodar também `npx tailwindcss -i src/app/globals.css -o /tmp/_check.css --minify` para validar parsing.

Só prosseguir para a Fase 3.

## Failure handling

- Variável CSS com valor não-resolvível (`var(--unknown)`) → resolver para o valor literal do template original; nunca deixar `--unknown` vazando.
- Token duplicado em re-execução → sobrescrever, não duplicar.

---
name: ui-template-admin-composites-to-nextjs
description: >
  Extrai e recria FIELMENTE os componentes compostos (page-header com breadcrumb, card/stat-card/widget-card, modal, confirm/delete-modal, drawer, popover, toast, empty-state, error-state, skeleton, data-table + toolbar + pagination, filtros aplicados, form-section/form-footer/stepper, file-upload, tabs, action-menu, segmented-control, user-menu, command-palette etc.) de um template administrativo HTML/CSS/JS estático como componentes React em uma aplicação Next.js (App Router) já existente, preservando aparência, variantes, estados e comportamentos do original. Cobre uma lista canônica E descobre compostos próprios do template (pricing-card, notification-item, kanban-card, invoice-summary, media-object etc.) por varredura ampla. Stack fixa — Next.js App Router + Tailwind + TypeScript estrito + class-variance-authority + clsx + tailwind-merge via `cn()` + Radix UI sem estilização (Dialog, Popover, DropdownMenu, Tooltip) como base de overlays + sonner para fila de toasts. Toda saída fica confinada a `src/shared/components/ui/` (mesma pasta dos primitivos), expandindo o namespace Tailwind `ui` com subgrupos semânticos (ui.card, ui.modal, ui.table, ui.breadcrumb e equivalentes para compostos descobertos). Pré-requisito NÃO-NEGOCIÁVEL — a skill `ui-template-admin-primitives-to-nextjs` precisa ter sido executada antes; Fase 0 verifica e ABORTA se faltar primitivo. NÃO cria primitivos, layout, shell, sidebar, gráficos, datepickers, rich-text editors, páginas de exemplo, tema dark, autenticação, i18n, fetch, validação de formulário ou lógica server-side de tabela. Fidelidade ao template > opinião de design — sem "melhorias", sem shadcn/Mantine/Chakra. Dispara quando o usuário pede para "portar / extrair / recriar / replicar" compostos / blocos / padrões reutilizáveis (page header com breadcrumb, modal de confirmação, card de estatística, toolbar de tabela, paginação, empty state etc.) de um template admin (AdminLTE, Metronic, Tabler, Sneat, Vuexy, Materio, CoreUI, custom) em React/Next.js, ou fornece uma pasta de template e pede compostos em `shared/components/ui`.
when_to_use: >
  Use quando houver um projeto Next.js com primitivos já gerados em `src/shared/components/ui/` e o usuário pedir para extrair/portar componentes compostos do template (page-header, breadcrumb, card, modal, drawer, toast, empty-state, data-table, pagination, form-section, stepper, file-upload, tabs, action-menu, user-menu, command-palette, ou compostos próprios do template). NÃO use para primitivos (skill própria), shell/sidebar (skills próprias), gráficos, datepickers ou páginas concretas.
---

# ui-template-admin-composites-to-nextjs

Extrai compostos de um template HTML/CSS/JS admin e os recria como componentes React em uma aplicação Next.js (App Router) existente, **com fidelidade absoluta ao original** e **consumindo os primitivos já presentes** em `src/shared/components/ui/`.

## Princípio central

**O template é a fonte da verdade.** Esta skill tem duas responsabilidades inseparáveis:

1. Cobrir a **lista canônica** de compostos esperados em apps administrativos (catálogo em `references/composites-catalog.md`) — apenas os que existem no template.
2. **Descobrir compostos próprios do template** que não estão na lista canônica (pricing-card, notification-item, kanban-card, invoice-summary, media-object, feature-item etc.) por varredura ampla — protocolo em `references/template-discovery-protocol.md`.

A lista canônica é piso, não teto. Fidelidade pixel-a-pixel é critério #1 — sem "melhorias", sem opinião própria. Se o template é datado, o composto é datado.

## Stack (fixa, não-negociável)

- Next.js App Router + `src/`
- Tailwind CSS — tokens expandindo namespace `ui.*` com subgrupos (`ui.card`, `ui.modal`, `ui.table`, `ui.breadcrumb`, etc.)
- TypeScript estrito
- `class-variance-authority` + `clsx` + `tailwind-merge` via helper `cn()` em `src/shared/utils/cn.ts` (já criado pela skill de primitivos)
- **Radix UI sem estilização** como base de overlays: `@radix-ui/react-dialog` (modal/drawer), `@radix-ui/react-popover`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-tooltip`. Estilização 100% via Tailwind + tokens do template.
- **`sonner`** para fila de toasts (perguntar uma vez se prefere `react-hot-toast`).
- Ícones: a mesma biblioteca já instalada pelas skills anteriores.
- Composição obrigatória via primitivos de `src/shared/components/ui/` — **proibido recriar visual de Button/Input/Badge/Avatar/Alert/Spinner/etc**.

## Saída — confinada a:

- `src/shared/components/ui/` (mesma pasta dos primitivos; convenção de nomenclatura idêntica)
- `tailwind.config.{ts,js}` — expandindo `ui.*`
- `src/app/globals.css` — apenas para regras impossíveis em Tailwind utilities
- `src/app/layout.tsx` — **somente** para registrar `<Toaster />` do sonner, se houver toast

Tudo mais é PROIBIDO.

---

## Fluxo (6 fases sequenciais com gates)

### Fase 0 — Reconhecimento e verificação de pré-requisitos (GATE HARD)

**Antes de qualquer coisa, ler `references/prerequisite-check.md`.**

1. Aceitar (ou perguntar) caminho do template e do projeto Next.js destino.
2. Verificar `src/shared/components/ui/` existe e tem primitivos mínimos (Button, Input, Label, Badge|Chip).
3. Ler `src/shared/components/ui/index.ts` e mapear primitivos disponíveis.
4. **Capturar a convenção de nomenclatura** dos primitivos (filename, subpastas, padrão de export). Compostos seguirão a mesma.
5. Verificar Tailwind, CVA, clsx, tailwind-merge, helper `cn()`.
6. Detectar biblioteca de ícones em uso.
7. Listar **todos** os HTMLs do template (sem filtro inicial).
8. **Detecção do tema ativo (single-theme)**. Esta skill gera compostos para **um único tema**. Procedimento:
   - Se a skill de primitivos já registrou `activeTheme` (em comentário no `tailwind.config` sob namespace `ui`, README do `src/shared/components/ui/`, ou variável exportada), reutilizar exatamente o mesmo valor — NUNCA divergir do tema dos primitivos.
   - Se ainda não registrado, detectar pelo template: atributo `class="dark"`/`data-theme`/`data-bs-theme` no `<html>`/`<body>` padrão, JS de toggle (estado inicial), background do `body` (claro ≥ #E8 → light; escuro ≤ #2A → dark).
   - Se ambíguo, **assumir `light`** e registrar.
   - Toda extração de cor da Fase 2 sai **exclusivamente** do CSS efetivo desse tema; ignorar variantes do tema não-ativo no CSS do template.

**Se faltar primitivo essencial, ABORTAR** com mensagem orientando o usuário a executar antes a skill `ui-template-admin-primitives-to-nextjs`. Listar exatamente quais primitivos faltam.

### Fase 1 — Inventário de compostos (varredura profunda do template)

**Ler `references/template-discovery-protocol.md`, `references/inspection-checklist.md` e `references/composites-catalog.md`.**

Rodar o script:

```bash
node .claude/skills/ui-template-admin-composites-to-nextjs/scripts/extract-composites-inventory.mjs <pasta-template>
```

Produz JSON `{ canonical: [...], discovered: [...] }`. Falha graciosa → inspeção manual.

**Duas passadas obrigatórias:**

- **Passada A — cobertura canônica.** Para cada composto do catálogo, marcar: existe / não / variantes.
- **Passada B — descoberta livre.** Identificar blocos visuais recorrentes não-canônicos. Critérios:
  - aparece em ≥2 contextos distintos, OU
  - aparece 1 vez mas tem classe própria bem definida em página de demonstração / vitrine.

Para cada composto identificado, preencher a linha do checklist em `inspection-checklist.md` (seletor, contagens, primitivos consumidos, variantes, estados, comportamentos JS, origem canônico/descoberto, páginas de origem).

### Fase 2 — Extração de tokens

**Ler `references/tailwind-token-mapping.md`.**

Para cada composto identificado, extrair do CSS do template:

- Reutilizar tokens `ui.*` já existentes (`ui.danger`, `ui.success` etc.) — **não duplicar**.
- Adicionar novos tokens expandindo `ui.*` em subgrupos semânticos: `ui.card.bg`, `ui.modal.overlay`, `ui.table.headerBg`, `ui.breadcrumb.separator`, e equivalentes para compostos descobertos (`ui.pricingCard.featuredBg` etc.).
- Animações (duração + easing) de modal/drawer/popover/toast → `transitionTimingFunction` + `keyframes` no Tailwind.

Valores específicos do template que não existem na escala Tailwind: adicionar como token, **não aproximar**. Fidelidade > convenção.

### Fase 3 — Registro do plano

Registrar (apenas como output de status, sem aguardar confirmação) ANTES de seguir para a Fase 4:

1. Lista de compostos a criar, agrupada em (a) canônicos encontrados, (b) descobertos no template. Para cada: primitivos consumidos, variantes/estados, uso de Radix, origem rastreável.
2. Compostos canônicos descartados e por quê.
3. Tabela de tokens a adicionar a `ui.*` (subgrupados).
4. Dependências a instalar (apenas Radix packages efetivamente usados, sonner se houver toast).
5. Ambiguidades do template — resolver por decisão automática (escolher a variante mais frequente / mais completa) e registrar a decisão tomada.

**NÃO pedir confirmação ao usuário. Seguir direto para a Fase 4.** Só interromper o fluxo para perguntar quando houver risco real (ex.: faltar primitivo essencial detectado na Fase 0, conflito destrutivo com arquivo existente). Decisões cosméticas e de variantes são tomadas autonomamente e apenas reportadas no relatório final da Fase 5.

### Fase 4 — Geração de código

**Antes de cada composto, ler `references/fidelity-checklist.md`. Antes de overlays, `references/radix-integration-patterns.md`. Antes de toasts, `references/sonner-integration.md`. Para variantes, `references/cva-patterns.md`. Como esqueleto inicial, `references/component-templates.md`.**

Ordem obrigatória (das menores dependências para as maiores):

1. Patch do `tailwind.config` com tokens.
2. Compostos sem dependências: `breadcrumb`, `section-header`, `empty-state`, `error-state`, `loading-skeleton`, `page-banner`, `applied-filters`, `segmented-control`, `pagination`.
3. `card` + subpartes; depois `stat-card`, `widget-card`, `profile-card`, `timeline`, `collapsible-panel`.
4. `page-header` (consome `breadcrumb`).
5. Compostos Radix: `modal` + subpartes, `drawer`, `action-popover`, `action-menu`, `tabs`.
6. Variantes especializadas: `confirm-modal`, `delete-confirm-modal`.
7. Toast (sonner): `toaster.component.tsx`, helpers `showToast.success/.error/...`. Registrar `<Toaster />` em `src/app/layout.tsx`.
8. Formulário: `form-section`, `form-two-column`, `form-footer`, `stepper`, `file-upload`.
9. Tabela: `data-table/` com subpartes.
10. `user-menu`, `user-card`, `command-palette`, `search-result-item`.
11. **Compostos descobertos**, na ordem de suas dependências.
12. Patch de `globals.css` (apenas se necessário).
13. `src/shared/components/ui/index.ts` — re-exports nomeados (preservar primitivos + adicionar compostos).

**Padrões obrigatórios em cada composto:**

- Espelhamento fiel da árvore HTML do template em JSX — sem simplificação.
- Cada classe Tailwind aplicada mapeia uma propriedade CSS efetiva no original. `[arbitrary]` apenas como último recurso.
- Estados (hover/focus/active/disabled/loading/error) idênticos.
- Animações/transições portadas com mesma duração e easing.
- Importar primitivos de `src/shared/components/ui/` — proibido recriar visual primitivo.
- Radix sempre `unstyled` + Tailwind via `data-state`.
- Props tipadas estendendo elemento HTML base quando aplicável.
- CVA para ≥3 variantes ou ≥2 dimensões. Ternário simples para 2 variantes.
- `forwardRef` + `displayName` em compostos com elemento focável principal.
- `className` recebido e mesclado via `cn()`.
- Acessibilidade: `aria-current="page"` no breadcrumb ativo, `aria-label` em ações sem texto, foco gerenciado pelo Radix em overlays, `role="alert"` em error-state.
- `"use client"` apenas em compostos com estado interno (modal controlado, drawer, stepper, file-upload, command-palette).

**Proibido:**

- Hardcode de cor/medida no JSX — sempre via token.
- CSS-in-JS, styled-components, CSS Modules.
- Dependências fora da lista (CVA, clsx, tailwind-merge, ícones já instalados, Radix justificado, sonner).
- "Melhorias" de design.
- **Variantes `dark:`/`light:` no JSX — a app é single-theme, gerar somente o `activeTheme` registrado**.
- Misturar cores do tema não-ativo nos tokens `ui.*`.
- Reimplementar primitivos.
- shadcn/ui, headless-ui, Mantine, Chakra, MUI, Ant Design.
- Lógica de negócio (fetch, state global, auth, i18n, validação).

### Fase 5 — Verificação

1. `npm run build` (ou `next build`) — zero erros, zero `any` não-justificado.
2. **Comparação visual fiel composto a composto** — para cada composto, descrever no relatório o casamento de cores, espaçamentos, tipografia, sombras, bordas, raios, estados interativos e animações com o original. Apontar divergências conhecidas e por quê.
3. Reportar:
   - arquivos criados, separando canônicos e descobertos.
   - dependências instaladas.
   - tokens adicionados ao `ui.*`.
   - primitivos consumidos por cada composto (rastreabilidade).
4. Corrigir lint/tipo antes de encerrar.

---

## Critérios de aceitação (auto-checklist)

- [ ] Primitivos pré-existentes verificados na Fase 0 e suficientes
- [ ] `npm run build` passa
- [ ] Todos os compostos canônicos presentes no template foram gerados
- [ ] **Todos os compostos descobertos no template foram gerados**
- [ ] Cada composto consome primitivos — nenhum visual primitivo recriado
- [ ] Tokens visuais idênticos ao original — comparação documentada
- [ ] `activeTheme` herdado da skill de primitivos (ou detectado e assumido `light`); nenhuma classe `dark:`/`light:` emitida; cores do tema não-ativo ignoradas
- [ ] Estrutura HTML do composto fielmente refletida em JSX
- [ ] Estados e comportamentos JS replicados
- [ ] `forwardRef` + `displayName` onde aplicável
- [ ] Acessibilidade básica presente
- [ ] Tailwind expande `ui.*` sem colidir com `adminMenu`/`adminShell`
- [ ] `globals.css` modificado apenas para o que Tailwind genuinamente não cobre
- [ ] Saída confinada a `src/shared/components/ui/` (+ `<Toaster />` em `layout.tsx` se aplicável)
- [ ] Nomenclatura idêntica à dos primitivos
- [ ] Nenhum primitivo, layout, navegação, gráfico, datepicker ou página criado
- [ ] `index.ts` exporta primitivos preservados + todos os compostos
- [ ] Componentes compostos via objeto (Card.Header, Modal.Header) expostos
- [ ] Sem erro de hydration

## Não-escopo

Não criar: primitivos, shell, layout, navegação, gráficos, datepickers/calendars/time-pickers/color-pickers, rich-text/code editors, tabelas com lógica server-side, páginas concretas, dashboards, formulários reais, tema dark/toggle, i18n, autenticação, fetch, estado global, validação. Sem testes/Storybook (skills separadas).

## Relação com as outras skills

| skill | namespace | escreve em |
|---|---|---|
| `ui-template-admin-shell-to-nextjs` | `adminShell.*` | `src/shared/template/admin/` |
| `ui-template-admin-sidebar-to-nextjs` | `adminMenu.*` | `src/shared/template/admin/` |
| `ui-template-admin-primitives-to-nextjs` | `ui.*` (cria) | `src/shared/components/ui/` |
| **esta skill** | **`ui.*` (expande)** | **`src/shared/components/ui/`** |

`ui-template-admin-primitives-to-nextjs` é **pré-requisito hard** — sem o vocabulário primitivo, esta skill aborta na Fase 0.

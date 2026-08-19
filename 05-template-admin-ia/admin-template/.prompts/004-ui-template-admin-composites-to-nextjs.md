# Prompt para geração de skill: `ui-template-admin-composites-to-nextjs`

## Contexto

Quero que você gere uma skill do Claude Code (formato SKILL.md + arquivos de apoio) chamada **`ui-template-admin-composites-to-nextjs`**. A skill será invocada dentro de um projeto Next.js (App Router) e tem como input uma pasta local contendo um template administrativo em HTML/CSS/JS puro. Seu output são os **componentes compostos** desse template — peças reutilizáveis de nível mais alto que combinam primitivos para resolver padrões recorrentes em aplicações administrativas (cabeçalho de página com breadcrumb, modal de confirmação, card de estatística, paginação, toolbar de tabela, etc.).

A skill **não** gera shell de layout, **não** gera navegação/menu, **não** gera primitivos de UI, **não** gera páginas. Ela é estritamente focada em **componentes compostos**: blocos de construção de nível médio que aparecem repetidamente em telas administrativas e que são montados a partir dos primitivos existentes.

A skill deve funcionar com qualquer template administrativo (AdminLTE, Metronic, Tabler, Sneat, Vuexy, Materio, CoreUI, custom), independentemente do framework CSS de origem (Bootstrap, Tailwind, custom CSS).

## Princípio central: o template é a fonte da verdade

Esta skill tem **duas responsabilidades igualmente importantes e inseparáveis**:

1. **Cobrir a lista canônica de compostos esperados em aplicações administrativas** (page header, modal, card, paginação, etc., conforme catálogo abaixo) — desde que esses padrões existam no template.
2. **Varrer o template em profundidade para descobrir compostos adicionais que não estão na lista canônica**, mas que são padrões recorrentes e claramente intencionais naquele template específico, e gerá-los também como compostos React.

A lista canônica é um **piso, não um teto**. Templates admin reais frequentemente trazem compostos próprios que não cabem em uma taxonomia genérica (ex.: `pricing-card` com layout específico, `feature-list` com ícone+título+descrição, `notification-item` com layout próprio, `chat-message-bubble`, `kanban-column-header`, `invoice-summary`, `stats-banner-horizontal`, `media-object` em N variações, `alert-with-action`, etc.). Esses compostos próprios do template **devem** ser identificados e gerados, com o mesmo rigor dos compostos da lista canônica.

**Fidelidade absoluta ao template é o critério #1 de qualidade.** Cada composto gerado deve ser indistinguível visual e comportamentalmente do composto correspondente no template original. Isso significa:

- **CSS pixel-perfect**: cores, espaçamentos, raios, sombras, tipografia, bordas, gradientes, line-heights — todos extraídos diretamente do template, sem aproximação. Se o template usa `padding: 1.125rem 1.5rem`, o composto React usa exatamente esses valores via tokens Tailwind (criados quando não existirem na escala padrão).
- **Estrutura HTML preservada**: a hierarquia de elementos, classes semânticas e composição interna do composto no template devem ser refletidas na árvore JSX. Não simplificar, não "modernizar", não substituir `div > div > span` por uma estrutura mais enxuta se isso muda o comportamento visual.
- **Comportamentos preservados**: hover, focus, active, disabled, transições, animações de abertura/fechamento, comportamento de teclado, estados de loading — replicados exatamente como no JS/CSS original. Se o card tem `transition: transform 200ms ease-out` no hover, o componente React tem o mesmo. Se o modal abre com fade + slide específicos, esses são reproduzidos.

Replicar o template fielmente vale mais do que aplicar boas práticas genéricas de design ou sugerir melhorias. Se o template tem uma escolha que parece datada ou questionável, ela é mantida — a opinião própria fica de fora.

## Skill independente, mas com pré-requisito obrigatório

Esta skill é **independente** das demais — pode ser invocada isoladamente, com seu próprio fluxo, sua própria inspeção do template, seus próprios checkpoints. Não depende do mesmo template que foi usado nas outras skills, nem do mesmo momento de execução.

**Porém**, ela tem um pré-requisito não-negociável: **os componentes primitivos da skill `ui-template-admin-primitives-to-nextjs` precisam existir no projeto destino antes desta skill ser executada**. Componentes compostos são montados consumindo primitivos (`Button`, `Input`, `Badge`, `Avatar`, `Alert`, etc.) — sem eles, esta skill não tem o vocabulário visual necessário para construir nada com fidelidade.

A primeira ação obrigatória da skill é verificar a presença e a completude do diretório `src/shared/components/ui/`. Se ele não existir, estiver vazio, ou faltar primitivos essenciais para os compostos identificados no template, a skill **interrompe** com uma mensagem clara orientando o usuário a executar antes a skill `ui-template-admin-primitives-to-nextjs`. O detalhamento do protocolo de verificação está na Fase 0.

## Quando a skill deve disparar

A skill deve ser usada SEMPRE que o usuário:

- pedir para "extrair", "portar", "recriar" ou "replicar" os **componentes compostos** / "blocos" / "padrões reutilizáveis" de um template admin em React/Next.js
- pedir explicitamente componentes como "cabeçalho de página com breadcrumb", "modal de confirmação", "card de estatística", "toolbar de tabela", "paginação", "empty state" — quando o pedido é claramente sobre múltiplos compostos a partir do template
- mencionar um template admin e pedir os "componentes intermediários" / "blocos de página" / "padrões de tela" em Next.js
- fornecer uma pasta de template e pedir compostos em `shared/components/ui` (na mesma pasta dos primitivos)
- pedir, especificamente, "título de página com migalhas" / "breadcrumb da aplicação" / "padrão de cabeçalho de página" baseado no template

A skill **NÃO** deve ser usada para:

- portar o template inteiro
- gerar shell/layout administrativo (skill `ui-template-admin-shell-to-nextjs`)
- gerar navegação/menu lateral (skill `ui-template-admin-sidebar-to-nextjs`)
- gerar primitivos de UI (skill `ui-template-admin-primitives-to-nextjs`)
- gerar gráficos / data visualization (skill futura, fora do escopo)
- gerar páginas concretas, dashboards de exemplo, formulários de cadastro reais

## Stack fixa (não negociável)

- **Next.js App Router** com `src/`
- **Estilização: Tailwind CSS**, com tokens extraídos do template original adicionados ao `tailwind.config`. Reutilizar tokens já existentes em `ui` (criados pela skill de primitivos) sempre que possível — não duplicar. Quando um token é específico de compostos, expandir o namespace `ui` (já que compostos vivem na mesma pasta dos primitivos) com sub-grupos semânticos quando útil (ex.: `ui.card.bg`, `ui.modal.overlay`, `ui.table.headerBg`).
- **Composição obrigatória via primitivos**: todo composto deve ser construído consumindo primitivos de `src/shared/components/ui/`. Não recriar botões, inputs, badges, avatars, alerts, spinners do zero — sempre importar do mesmo diretório.
- **Variantes**: `class-variance-authority` (CVA) para compostos com múltiplas variantes (ex.: `Card` com variantes de elevação, `EmptyState` com variantes de tamanho).
- **Composição/utilitários**: `clsx` + `tailwind-merge` via helper `cn()` (já criado pela skill de primitivos em `src/shared/utils/cn.ts`).
- **Comportamento de overlay (modal, drawer, popover, tooltip)**: usar **Radix UI primitives sem estilização** como base de comportamento (`@radix-ui/react-dialog`, `@radix-ui/react-popover`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-tooltip`). Estilização vem inteiramente de Tailwind + tokens do template. Radix é a única biblioteca de behavior permitida para overlays.
- **Toasts**: usar **`sonner`** como biblioteca de fila de toasts, estilizado para parecer com o padrão do template (ou `react-hot-toast` se o usuário preferir — perguntar uma vez no plano). Não implementar fila própria.
- **Tipagem: TypeScript estrito**. Cada composto expõe `Props` claramente tipadas. Para compostos com múltiplas subpartes (Card.Header, Card.Body, Card.Footer), usar padrão de **componentes compostos via objeto** (`Card.Header = CardHeader`).
- **Ícones**: usar a mesma biblioteca detectada/instalada pelas skills anteriores (Lucide / Font Awesome / Tabler / Heroicons / SVGs custom).
- **Forwarding de ref**: todo composto que envolve elemento interativo composto usa `forwardRef` quando relevante.
- **Server vs Client**: compostos puramente apresentacionais ficam server components. Compostos com estado (modal aberto/fechado, drawer, dropdown, paginação controlada, upload com progresso) recebem `"use client"`.
- **Nomenclatura consistente com primitivos**: seguir exatamente a mesma convenção de nomes de arquivo já usada em `src/shared/components/ui/` (ex.: `kebab-case.component.tsx`, ou o padrão que estiver lá). Ler o `index.ts` e amostras de arquivos antes de criar para garantir consistência.

## Entradas esperadas

1. **Caminho da pasta do template** (HTML/CSS/JS estático)
2. **Caminho da aplicação Next.js de destino** (raiz do projeto, com `src/`, Tailwind, primitivos em `src/shared/components/ui/` e helper `cn()`)

Se algum dos dois não estiver claro no contexto, a skill deve perguntar antes de prosseguir. A skill deve verificar que:

- o projeto Next.js destino tem Tailwind instalado e configurado
- o diretório `src/shared/components/ui/` existe e contém os primitivos necessários (ver Fase 0)
- `class-variance-authority`, `clsx`, `tailwind-merge` estão instalados
- as bibliotecas Radix necessárias (`@radix-ui/react-dialog`, `@radix-ui/react-popover`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-tooltip`) estão instaladas — instalar via `npm install` apenas as efetivamente usadas pelos compostos identificados
- `sonner` está instalado (apenas se algum toast for gerado)

## Saída esperada

Toda saída fica confinada a:

- `src/shared/components/ui/` — **mesma pasta dos primitivos**. Cada composto vai como um arquivo (ou pasta, quando o composto tiver subpartes) seguindo exatamente a nomenclatura usada para os primitivos do projeto. Compostos e primitivos coexistem no mesmo diretório.
- `tailwind.config.{ts,js}` — adicionar tokens extraídos expandindo o namespace `ui` (subgrupando semanticamente quando útil: `ui.card.*`, `ui.modal.*`, `ui.table.*`).
- `src/app/globals.css` — apenas para regras impossíveis em Tailwind utilities (ex.: animações de modal/drawer não cobertas pelas classes do Radix CSS, scrollbar custom de drawer). Manter ao mínimo.
- `src/app/layout.tsx` — **somente** para registrar o `<Toaster />` do sonner (raiz da árvore), se a skill gerar toasts. Nenhuma outra alteração permitida no layout root.

Estrutura típica gerada (criar **apenas** o que o template original justificar; nomes ilustrativos — seguir a convenção que o projeto já adota em `ui/`):

```
src/shared/components/ui/
├── (primitivos já existentes: button, input, badge, avatar, alert, etc.)
│
├── page-header/                          (título de página + breadcrumb integrado)
│   ├── page-header.component.tsx
│   ├── breadcrumb.component.tsx
│   └── index.ts
├── section-header.component.tsx
├── card/
│   ├── card.component.tsx
│   ├── card-header.component.tsx
│   ├── card-body.component.tsx
│   ├── card-footer.component.tsx
│   └── index.ts
├── stat-card.component.tsx
├── widget-card.component.tsx
├── profile-card.component.tsx
├── timeline.component.tsx
├── collapsible-panel.component.tsx
├── modal/
│   ├── modal.component.tsx
│   ├── modal-header.component.tsx
│   ├── modal-body.component.tsx
│   ├── modal-footer.component.tsx
│   └── index.ts
├── confirm-modal.component.tsx
├── delete-confirm-modal.component.tsx
├── drawer.component.tsx
├── action-popover.component.tsx
├── toast/
│   ├── toast.tsx
│   ├── toaster.component.tsx
│   └── index.ts
├── empty-state.component.tsx
├── error-state.component.tsx
├── loading-skeleton.component.tsx
├── page-banner.component.tsx
├── data-table/
│   ├── data-table.component.tsx
│   ├── data-table-header.component.tsx
│   ├── data-table-row.component.tsx
│   ├── data-table-toolbar.component.tsx
│   ├── data-table-empty.component.tsx
│   └── index.ts
├── pagination.component.tsx
├── applied-filters.component.tsx
├── item-list.component.tsx
├── form-section.component.tsx
├── form-two-column.component.tsx
├── form-footer.component.tsx
├── stepper.component.tsx
├── file-upload.component.tsx
├── tabs.component.tsx
├── action-menu.component.tsx
├── segmented-control.component.tsx
├── user-menu.component.tsx
├── user-card.component.tsx
├── command-palette.component.tsx
├── search-result-item.component.tsx
│
├── (compostos descobertos especificamente neste template, com nomes derivados das classes/intenções do template — ex.: pricing-card, feature-item, notification-item, chat-bubble, kanban-card, invoice-summary, etc.)
│
└── index.ts                              (re-exports nomeados — primitivos + compostos)
```

**Regra de criação**:

- Criar **apenas** os compostos que o template original justifica e cuja estrutura é claramente identificável no HTML do template.
- Cobrir a lista canônica **quando aplicável** ao template em questão. Se o template não tem stepper, não gerar stepper.
- **Adicionar todos os compostos próprios do template descobertos durante a varredura**, mesmo que não constem da lista canônica, desde que cumpram o critério de recorrência (ver Fase 1).
- Se o template tem três variações de card visualmente similares, gerar uma única `card.component.tsx` cobrindo todas via CVA. Se o template tem `widget-card` e `stat-card` visualmente distintos (e não apenas variações de tamanho), separar.
- Nomear cada arquivo seguindo a mesma convenção dos primitivos já presentes no projeto.

**PROIBIDO criar**: layout, shell, navegação, header de aplicação, footer de aplicação, primitivos (botão, input, badge, etc. — pré-requisito), gráficos / charts / data visualization, datepickers, calendars, rich text editors, code editors, tabelas com lógica de servidor (sorting/filtering server-side), telas de exemplo, dashboards completos, formulários completos de cadastro, autenticação. PROIBIDO criar componentes fora de `src/shared/components/ui/` (exceto o registro do `<Toaster />` em `src/app/layout.tsx`, se aplicável).

## Fluxo da skill (passos obrigatórios, nesta ordem)

### Fase 0 — Reconhecimento e verificação de pré-requisitos

1. Aceitar (ou perguntar) o caminho da pasta do template e da aplicação Next.js destino.
2. **Verificação obrigatória dos primitivos** (gate de execução):
   - Confirmar que `src/shared/components/ui/` existe.
   - Listar arquivos do diretório.
   - Confirmar a presença mínima de: `button`, `input`, `label`, e ao menos um entre `badge` ou `chip`. Sem esses, não há vocabulário mínimo para compostos.
   - Listar os primitivos disponíveis e mapeá-los por nome (`button.component.tsx` → `Button`, `badge.component.tsx` → `Badge`, etc.) lendo o arquivo `src/shared/components/ui/index.ts`.
   - **Capturar a convenção de nomenclatura usada pelos primitivos** (formato de nome de arquivo, uso ou não de subpastas, padrão de `index.ts`, padrão de export — default vs nomeado). Os compostos seguirão exatamente a mesma convenção.
   - Se algum primitivo necessário para um composto identificado mais adiante não existir, **interromper** com mensagem orientando a rodar antes a skill `ui-template-admin-primitives-to-nextjs`. Listar exatamente quais primitivos faltam.
3. Verificar Tailwind, CVA, clsx, tailwind-merge no projeto destino. Verificar `cn()` em `src/shared/utils/cn.ts`. Ler o `tailwind.config` para entender os tokens já criados em `ui` pela skill de primitivos.
4. Detectar a biblioteca de ícones em uso (compatível com as outras skills do conjunto).
5. Detectar o tema padrão do template (light por padrão; não criar toggle).
6. Listar **todos** os HTMLs do template, sem filtro inicial. A varredura ampla é essencial — compostos próprios do template costumam aparecer em páginas de demonstração específicas (`components.html`, `ui-elements.html`, `cards.html`, `extras.html`) que não seriam óbvias a partir de uma lista funcional de páginas.

### Fase 1 — Inventário de compostos (varredura profunda do template)

Esta é a fase mais crítica da skill. **A varredura do template é o que define a entrega**, não a lista canônica. A lista canônica serve como mapa mental e checklist — o template define o que de fato será gerado.

**Procedimento de varredura, em duas passadas:**

**Passada A — Cobertura da lista canônica.** Para cada composto da lista canônica abaixo, procurar evidência no template (HTML + CSS) e marcar: existe / não existe / existe em variantes (quantas).

**Passada B — Descoberta livre.** Varrer todos os HTMLs do template procurando blocos visuais recorrentes que **não** se encaixam na lista canônica. Critérios de inclusão durante a passada B:

- O bloco aparece em **pelo menos 2 contextos distintos** (2 páginas diferentes, ou 2 ocorrências em uma página de demonstração que claramente é uma vitrine de componentes do template), **OU**
- O bloco aparece uma única vez mas é claramente uma "peça publicada" do template — tem classes próprias bem definidas (`.pricing-card`, `.feature-item`, `.notification-list-item`), está em uma página dedicada a mostrá-lo, ou está documentado em comentários do HTML/CSS.

Para cada composto identificado (canônico ou descoberto), montar uma linha na tabela:

| composto | seletor/classe no template | aparece em quantas páginas / contextos | primitivos consumidos | variantes encontradas | estados (hover, focus, active, disabled, loading, error) | comportamentos (animações, transições, interações JS) | origem (canônico / descoberto) |
| -------- | -------------------------- | -------------------------------------- | --------------------- | --------------------- | -------------------------------------------------------- | ----------------------------------------------------- | ------------------------------ |

Para os compostos descobertos, propor um nome em kebab-case derivado da classe principal ou da intenção visual do bloco — sempre coerente com a nomenclatura dos primitivos do projeto destino.

**Lista canônica (passada A) — verificar quais existem no template e descartar o que não existir:**

**Cabeçalho de página**

- Título de página com breadcrumb integrado (verificar como o template trata: título acima de breadcrumb, lado a lado, breadcrumb dentro de um header menor, etc.)
- Breadcrumb isolado (caso o template trate como elemento independente reutilizável)
- Header de seção / subseção dentro de uma página

**Cartões e contêineres**

- Card genérico (header + body + footer)
- Card de estatística (KPI)
- Card de widget (com slot para conteúdo)
- Card de perfil resumido
- Timeline / atividade recente
- Painel colapsável

**Diálogos e sobreposições**

- Modal genérico
- Modal de confirmação genérico
- Modal de confirmação de exclusão (variante destrutiva)
- Drawer lateral
- Popover de ações

**Feedback ao usuário**

- Toast (wrapper sobre sonner)
- Empty state
- Error state com retry
- Loading skeleton
- Page banner

**Tabelas e listagens**

- Tabela de dados padrão
- Cabeçalho de tabela com ordenação
- Linha de tabela com ações
- Toolbar de tabela
- Paginação
- Filtros aplicados (chips removíveis)
- Lista não-tabular

**Formulários compostos**

- Seção de formulário
- Formulário em duas colunas
- Footer de formulário
- Stepper / wizard
- Upload de arquivo

**Navegação interna**

- Tabs
- Action menu (dropdown de ações)
- Segmented control / pill nav

**Usuário**

- Avatar com menu de usuário
- Card de usuário

**Busca**

- Command palette / busca global (somente se o template tiver)
- Item de resultado de busca

**Exemplos do tipo de coisa que deve aparecer apenas na passada B (descoberta livre)** — listados aqui apenas para ilustrar o tipo de captura esperada, **não** como obrigação:

- `pricing-card`, `feature-card`, `feature-item`, `media-object`, `notification-item`, `notification-list`, `chat-message-bubble`, `chat-input`, `kanban-card`, `kanban-column-header`, `invoice-summary`, `order-line-item`, `cart-item`, `review-card`, `testimonial-card`, `stats-banner-horizontal`, `info-tile`, `icon-box`, `process-step`, `social-feed-post`, `email-list-item`, `inbox-row`, `setting-row`, `permission-row`, `activity-log-row`, `tag-input`, `color-swatch-list`, `image-with-overlay`, `attached-file-row` — qualquer um desses pode ou não estar no template específico, e a skill os captura **se e somente se** ela os encontra durante a varredura.

### Fase 2 — Extração de tokens

Extrair do CSS do template, **somente para os compostos identificados na Fase 1** (canônicos + descobertos), e priorizando reutilização do namespace `ui` já existente:

- **Reutilizar quando possível**: cores de variantes (primary, danger, success, warning) já estão em `ui.*` — não duplicar.
- **Adicionar quando específico do composto**, expandindo `ui` com subgrupos semânticos:
  - Cores e elevações de card (background, border, shadow de elevação por nível, shadow de hover)
  - Cores de overlay de modal/drawer (cor + opacidade do backdrop)
  - Spacing interno padrão de card (header padding, body padding, footer padding)
  - Spacing de page header (margin entre título e breadcrumb, padding inferior antes do conteúdo)
  - Typography do breadcrumb (cor do separador, cor do item ativo vs anterior)
  - Cores e dimensões da tabela (header bg, row hover, divisor, padding de célula, altura mínima de linha)
  - Cores de chips de filtro aplicado
  - Spacing e tipografia do empty state
  - Animações: duração e easing de abertura de modal/drawer/popover, fade-in de toast
  - **Tokens próprios dos compostos descobertos**: o que for específico do template (ex.: `ui.pricingCard.featuredBg`, `ui.notificationItem.unreadIndicator`).

Adicionar ao `tailwind.config` expandindo `ui`:

```ts
theme: {
  extend: {
    colors: {
      ui: {
        // ... tokens existentes dos primitivos
        card: { bg: '#...', border: '#...', headerBg: '#...' },
        modal: { overlay: 'rgba(0,0,0,0.5)' },
        table: { headerBg: '#...', rowHover: '#...' },
        breadcrumb: { separator: '#...', activeText: '#...' },
        // tokens de compostos descobertos
        pricingCard: { featuredBg: '#...', featuredRing: '#...' },
        // ...
      }
    },
    boxShadow: {
      // ... existentes
      uiCardElevation: '...',
      uiCardElevationHover: '...',
    },
    transitionTimingFunction: {
      uiModalEnter: '...',
    }
  }
}
```

Valores específicos do template que não existam na escala Tailwind devem ser adicionados — não aproximar. **Fidelidade > convenção.**

### Fase 3 — Apresentação do plano

Antes de gerar código, apresentar ao usuário:

1. Lista de compostos que serão criados, **agrupados em duas seções**: (a) compostos da lista canônica encontrados no template, (b) compostos próprios do template descobertos durante a varredura. Para cada um indicar:
   - quais primitivos serão consumidos
   - quais variantes/estados foram identificados no template
   - se usará Radix (e qual primitivo Radix)
   - origem (página/seletor onde foi encontrado, para rastreabilidade)
2. Lista de compostos da lista canônica **descartados** e motivo (não aparece no template, é conteúdo de página específica, é gráfico — fora de escopo).
3. Tabela resumida de tokens que serão adicionados ao `ui` (subgrupando por composto).
4. Dependências a instalar (Radix packages efetivamente usados, sonner se houver toast).
5. Qualquer ambiguidade no template que mereça decisão do usuário (ex.: "o template tem dois padrões de page-header diferentes nas páginas X e Y — qual seguir, ou criar variantes?", "o composto `feature-item` aparece em 3 variações sutilmente diferentes — unificar via CVA ou separar?").

Pedir confirmação para prosseguir. Não gerar código antes do "ok".

### Fase 4 — Geração de código

Ordem obrigatória de geração (das menores dependências para as maiores):

1. Patch do `tailwind.config` com tokens
2. Compostos sem dependências entre si: `breadcrumb`, `section-header`, `empty-state`, `error-state`, `loading-skeleton`, `page-banner`, `applied-filters`, `segmented-control`, `pagination`
3. Card e suas subpartes (`card`, `card-header`, `card-body`, `card-footer`); depois `stat-card`, `widget-card`, `profile-card`, `timeline`, `collapsible-panel`
4. `page-header` (que pode consumir `breadcrumb`)
5. Compostos baseados em Radix: `modal` + subpartes, `drawer`, `action-popover`, `action-menu`, `tabs`
6. Variantes especializadas de modal: `confirm-modal`, `delete-confirm-modal`
7. Toast (wrapper sobre sonner): `toaster.component.tsx`, helpers `showToast.success()`, etc. Registrar `<Toaster />` em `src/app/layout.tsx`.
8. Compostos de formulário: `form-section`, `form-two-column`, `form-footer`, `stepper`, `file-upload`
9. Tabela e suas subpartes em `data-table/`
10. `user-menu`, `user-card`, `command-palette`, `search-result-item`
11. **Compostos descobertos durante a varredura**, na ordem das suas dependências (compostos sem dependência primeiro, compostos que consomem outros depois)
12. Patch de `globals.css` (apenas se necessário)
13. `src/shared/components/ui/index.ts` — atualizar com re-exports nomeados de todos os compostos (preservando os exports dos primitivos já presentes)

**Padrões obrigatórios para cada composto:**

- **Espelhamento fiel do HTML do template**: a estrutura JSX deve refletir a hierarquia do HTML original. Inspecionar o composto no template, anotar a árvore de elementos e replicá-la em React. Não simplificar, não reorganizar, não "modernizar".
- **Espelhamento fiel do CSS do template**: cada classe Tailwind aplicada no JSX deve corresponder a uma propriedade CSS efetiva no template original. Conferir após escrever (ou usar uma comparação lado a lado mental). Quando o valor não existir na escala Tailwind, usar o token recém-criado em `ui.*`. Quando o valor é arbitrário e único, usar a sintaxe `[valor]` do Tailwind apenas como último recurso, e preferir adicionar à config.
- **Espelhamento fiel dos comportamentos**: ler o JS do template (jQuery, vanilla, Bootstrap data-attributes) e identificar o que cada interação faz. Replicar em React idiomático (estado controlado, callbacks, Radix para overlays).
- Importar primitivos de `src/shared/components/ui/` — nunca recriar visual de botão, badge, input, etc.
- Importar Radix sem estilização e estilizar 100% via Tailwind + tokens
- Props tipadas, estendendo elemento HTML base quando aplicável
- Variantes via CVA quando houver mais de uma; ternário direto justificado para 2 variantes simples
- `forwardRef` quando o composto envolve elemento focável principal (modal trigger, drawer trigger, dropdown trigger via Radix)
- `displayName` em `forwardRef`
- `className` recebido como prop e mesclado via `cn()` — nunca sobrescrever
- Acessibilidade:
  - `aria-label` em botões de ação sem texto (close de modal, ações de linha de tabela, action menu trigger)
  - `aria-current="page"` no item ativo do breadcrumb
  - Foco gerenciado por Radix em modais, drawers, popovers (não tentar reimplementar)
  - `role="alert"` em error-state, `role="status"` em loading-skeleton quando aplicável
- Componentes com estado interno (modal controlado/incontrolado, drawer, stepper com etapa atual, file-upload com progresso): `"use client"` no topo, justificado em comentário
- Componentes puramente apresentacionais (card, stat-card sem interação, empty-state estático): server components

**Padrões específicos:**

- **Page header com breadcrumb**: ler atentamente o template para entender se o breadcrumb fica acima do título, abaixo, à direita, ou se há alguma variação por tipo de página. Replicar exatamente. Se o template tem dois padrões, criar variantes via CVA, não componentes separados.
- **Modal/Drawer (Radix Dialog)**: usar `Dialog.Root`, `Dialog.Trigger`, `Dialog.Portal`, `Dialog.Overlay`, `Dialog.Content`. Estrutura interna `Modal.Header`/`Modal.Body`/`Modal.Footer` exposta como subpartes. Animações de entrada/saída lidas do CSS do template e portadas via Tailwind keyframes ou `data-state` do Radix.
- **Confirm modal**: API simples — `<ConfirmModal title description confirmLabel cancelLabel onConfirm onCancel variant="danger|default" />`. Internamente monta `Modal` com `Modal.Footer` contendo dois `Button` primitivos.
- **Toast (sonner)**: criar arquivo `toast.tsx` exportando helpers (`showToast.success(message)`, `.error()`, `.warning()`, `.info()`) que delegam para `toast()` do sonner. `Toaster` componente estiliza para combinar com o template (cores, ícones, posição lida do CSS original).
- **Data table**: a tabela padrão do template, sem bind a estado de servidor. Recebe `columns`, `data` genéricos via TypeScript generics. Sorting é UI-only (callback `onSort`). A skill **não** implementa sorting/filtering server-side; expõe os hooks/callbacks para o consumidor implementar.
- **Pagination**: stateless. Recebe `currentPage`, `totalPages`, `onPageChange`, `pageSize`, `onPageSizeChange`. Variante "numérica + setas" + "só setas" + "só seletor" via CVA, conforme padrões do template.
- **File upload**: usa `<input type="file">` sob o capô; drag & drop via eventos nativos; progresso visual via `Progress` primitivo. Não implementa upload real (sem fetch) — expõe callback `onFiles(files)`.
- **Compostos descobertos**: tratamento idêntico ao dos canônicos — análise de HTML/CSS/JS do template, replicação fiel, props tipadas, variantes via CVA quando aplicável, primitivos importados, tokens em `ui.*`.

**Não fazer:**

- Sem hardcode de cores/medidas no JSX — sempre via tokens Tailwind
- Sem CSS-in-JS, sem styled-components, sem CSS Modules
- Sem dependências além das listadas (CVA, clsx, tailwind-merge, ícones, Radix justificado, sonner)
- Sem "melhorias" de design — fidelidade ao template original > opinião própria
- Sem reimplementar primitivos (se algo parece um botão, importar `Button`)
- Sem lógica de negócio (sem fetch, sem state global, sem auth, sem i18n)

### Fase 5 — Verificação

1. Rodar `npm run build` (ou `next build`) para validar compilação e tipos.
2. **Comparação visual fiel composto a composto**: para cada composto gerado, abrir lado a lado o HTML original do template e descrever (no relatório final) o casamento de: cores, espaçamentos, tipografia, sombras, bordas, raios, estados interativos, animações. Apontar qualquer divergência conhecida e por quê (limitação técnica documentada, não opinião).
3. Reportar ao usuário:
   - lista de arquivos criados, separando canônicos e descobertos
   - dependências instaladas (Radix packages, sonner)
   - tokens adicionados ao Tailwind
   - compostos gerados com suas variantes
   - primitivos consumidos por cada composto (rastreabilidade)
   - sugestão de como inspecionar visualmente (criar uma página `/dev/components` em uma skill futura ou Storybook)
4. Se houver erros de tipo/lint, corrigir antes de encerrar.

## Critérios de aceitação (auto-verificar antes de finalizar)

- [ ] `src/shared/components/ui/` existia e tinha primitivos suficientes antes da execução
- [ ] `npm run build` passa sem erros e sem `any` não justificado
- [ ] Todos os compostos da lista canônica que existem no template foram gerados
- [ ] **Todos os compostos próprios do template descobertos na Fase 1 foram gerados**
- [ ] Cada composto consome primitivos existentes em `src/shared/components/ui/` — nenhum visual primitivo recriado
- [ ] **Tokens visuais (cores, spacing, radius, shadows, animações) idênticos ao original — comparação lado a lado executada e documentada no relatório**
- [ ] **Estrutura HTML do composto fielmente refletida na árvore JSX**
- [ ] Estados hover, focus, active, disabled, error replicados conforme o template
- [ ] Comportamentos JS do template (animações, transições, interações) replicados em React
- [ ] Componentes interativos têm `forwardRef` (quando aplicável) e `displayName`
- [ ] Acessibilidade básica presente (aria-\* relevantes, foco gerenciado por Radix em overlays)
- [ ] Tailwind config atualizado expandindo namespace `ui`, sem colisão com `adminMenu`/`adminShell`
- [ ] `globals.css` modificado apenas para o que Tailwind genuinamente não cobre
- [ ] Nenhum componente criado fora de `src/shared/components/ui/` (exceto o `<Toaster />` em `src/app/layout.tsx`, se aplicável)
- [ ] Nomenclatura de arquivo dos compostos idêntica à convenção dos primitivos do projeto
- [ ] Nenhum primitivo, layout, navegação, gráfico, datepicker, ou tela de exemplo foi criado
- [ ] `index.ts` exporta primitivos (preservados) + todos os compostos com nomes consistentes
- [ ] Componentes compostos via objeto (Card.Header, Modal.Header) expostos corretamente
- [ ] Nenhum erro de hydration

## Não-escopo (explícito)

- Não criar primitivos (botão, input, badge, avatar, alert, spinner, etc.) — pré-requisito
- Não criar layout, shell, navegação, header de aplicação, footer de aplicação
- Não criar gráficos, charts, data visualization (skill separada futura)
- Não criar datepicker, calendar, time picker, color picker, rich text editor, code editor
- Não criar tabelas com lógica de servidor (sorting/filtering/pagination server-side) — apenas a UI
- Não criar páginas concretas, dashboards de exemplo, formulários de cadastro reais
- Não criar tema dark / toggle de tema
- Não internacionalizar nada — manter idioma do template ou usar texto neutro/inglês quando o composto não tiver texto no original
- Não adicionar dependências fora da lista permitida (CVA, clsx, tailwind-merge, ícones, Radix, sonner)
- Não usar shadcn/ui, headless-ui, Mantine, Chakra, MUI, Ant Design ou similares — a skill recria a partir do template
- Não opinar sobre o design — replicar o template, ainda que feio ou datado
- Não implementar autenticação, fetch, estado global, validação de formulário, máscaras de input
- Não criar testes (skill separada)
- Não criar Storybook (skill separada)

## Estrutura de arquivos da própria skill

```
ui-template-admin-composites-to-nextjs/
├── SKILL.md                                    # fluxo principal, < 500 linhas
├── references/
│   ├── prerequisite-check.md                   # protocolo detalhado da Fase 0 (verificar primitivos + capturar nomenclatura)
│   ├── composites-catalog.md                   # taxonomia da lista canônica de compostos
│   ├── template-discovery-protocol.md          # protocolo detalhado de varredura ampla (passada B) para descoberta de compostos próprios do template
│   ├── inspection-checklist.md                 # como varrer o template procurando compostos canônicos e descobertos
│   ├── fidelity-checklist.md                   # checklist de espelhamento fiel HTML/CSS/JS do template para JSX/Tailwind/React
│   ├── tailwind-token-mapping.md               # padrões de mapeamento template → tokens, expandindo `ui` com subgrupos semânticos
│   ├── radix-integration-patterns.md           # padrões de uso de Radix Dialog/Popover/DropdownMenu/Tooltip + estilização Tailwind
│   ├── sonner-integration.md                   # padrões de wrapper sobre sonner para alinhar visualmente ao template
│   ├── cva-patterns.md                         # como estruturar variantes com CVA em compostos
│   └── component-templates.md                  # snippets de referência para cada categoria de composto
└── scripts/
    └── extract-composites-inventory.mjs        # varredura HTML para listar candidatos a compostos (canônicos + descobertos)
```

**`scripts/extract-composites-inventory.mjs`** (Node, com `node-html-parser` ou similar via npx): recebe a pasta do template, percorre **todos** os HTMLs, e produz um JSON com duas seções:

- `canonical`: ocorrências de blocos típicos da lista canônica (`.card`, `.modal`, `.dialog`, `.breadcrumb`, `.page-header`, `.pagination`, `table`, `.toast`, `.alert-banner`, `.empty-state`, `[role="dialog"]`, `[role="tablist"]`, etc.)
- `discovered`: blocos recorrentes com classes próprias do template que não casam com a lista canônica — agrupados por classe principal, com contagem de ocorrências, páginas onde aparecem e snippet de HTML representativo.

Falha graciosa se a estrutura for muito atípica — nesse caso Claude faz a inspeção lendo HTML/CSS diretamente, mas sempre produzindo o mesmo JSON intermediário antes de prosseguir.

**`references/`** seguem progressive disclosure: SKILL.md aponta quando ler cada um (ex.: "antes da Fase 1, ler `template-discovery-protocol.md` e `inspection-checklist.md`"; "antes de gerar cada composto, conferir `fidelity-checklist.md`"; "antes de gerar modais/drawers/popovers, ler `radix-integration-patterns.md`"; "antes de gerar toasts, ler `sonner-integration.md`"; "no início, antes de qualquer coisa, ler `prerequisite-check.md`").

## Formato do output da skill

A skill que você vai gerar deve seguir o formato Claude Code:

- Um arquivo `SKILL.md` na raiz da skill, com frontmatter (`name`, `description`, `when_to_use`) e o corpo dividido nas fases acima.
- Arquivos de apoio (templates, snippets, exemplos) na mesma pasta, referenciados a partir do `SKILL.md`.
- A `description` no frontmatter deve disparar a skill em pedidos como "extrair componentes compostos do template", "criar page header com breadcrumb a partir do template", "gerar modal de confirmação de exclusão", "portar cards de estatística do template", "criar toolbar de tabela e paginação", e variantes em pt-BR.

## O que eu quero de você agora

Gere a skill completa. Antes do código, me mostre:

1. A estrutura de arquivos da skill que você vai criar.
2. O frontmatter proposto da `SKILL.md`.
3. Quais arquivos de apoio você vai incluir e por quê — em especial, como `template-discovery-protocol.md` e `fidelity-checklist.md` serão estruturados para garantir, respectivamente, a descoberta de compostos próprios do template e a fidelidade pixel-a-pixel da migração.
4. Como essa skill se relaciona com as outras três (`design-adm-template-structure`, `ui-template-admin-sidebar-to-nextjs`, `ui-template-admin-primitives-to-nextjs`):
   - ordem de execução recomendada na esteira (e por que `ui-template-admin-primitives-to-nextjs` é pré-requisito desta)
   - namespaces de tokens utilizados por cada uma para evitar colisão (lembrando que esta skill **expande** `ui`, em vez de criar `composites`, já que compostos vivem na mesma pasta dos primitivos)
   - o que esta skill **explicitamente** não faz, deixando para skills posteriores (charts, datepickers, etc.).

---
name: ui-template-admin-topbar-to-nextjs
description: Extrai e recria FIELMENTE apenas a estrutura da barra superior (top bar / header / navbar) de um template administrativo HTML/CSS/JS estático como componentes React em uma aplicação Next.js (App Router) já existente, preservando aparência, comportamento responsivo, estados visuais e interações do original. Stack fixa — Next.js App Router + Tailwind CSS + TypeScript estrito + Client Components com `useState` para interatividade (dropdowns, busca expansível, drawer mobile). Detecta o set de ícones do original (Lucide, Font Awesome, Heroicons, Tabler, Material) e instala a versão React correspondente; copia SVGs custom para `src/shared/template/admin/topbar/icons/` quando o template usa um set próprio. Toda saída fica confinada a `src/shared/template/admin/topbar/` (componentes, tipos, config, ícones); tokens visuais (cores, alturas, larguras de busca/dropdowns, spacing, tipografia, breakpoints, durações, sombras, z-index) são adicionados ao `tailwind.config` sob o namespace `adminTopbar` para não colidir com tokens existentes; `globals.css` só é tocado para regras impossíveis em Tailwind. NÃO porta sidebar, menu lateral, breadcrumbs, footer, dashboards, cards, layouts globais, nem qualquer componente fora da topbar — fidelidade > opinião, sem "melhorias" de design, sem internacionalização. NÃO implementa lógica funcional de tema (apenas botão visual com stub), busca (apenas input controlado com stub), ações de dropdown (apenas estrutura visual com stub) ou autenticação. Dispara quando o usuário pede para "portar / converter / extrair / recriar / replicar" a topbar / barra superior / header / navbar de um template admin (AdminLTE, Metronic, Tabler, Sneat, Vuexy, Materio, CoreUI, custom etc.) em React/Next.js, ou fornece uma pasta de template e diz "quero só a topbar desse no meu Next", mesmo sem nomear "skill".
---

# ui-template-admin-topbar-to-nextjs

Recria a barra superior de um template admin HTML em uma app Next.js já existente, **somente a topbar**. Toda fidelidade vai para o original; nenhuma "melhoria" de design. Nenhuma lógica de negócio (tema, busca, autenticação, ações de dropdown) — apenas a casca visual e interativa (abrir/fechar dropdowns, expandir busca, toggle mobile).

## Stack fixa (não negociável)

- Next.js App Router com `src/`
- Tailwind CSS (tokens extraídos sob namespace `adminTopbar`)
- Client Components com `useState` para interatividade (dropdowns, busca expansível, mobile toggle)
- TypeScript estrito (sem `any` injustificado)
- Ícones: pacote React oficial do set usado pelo original (`lucide-react`, `@fortawesome/react-fontawesome`, `@heroicons/react`, `@tabler/icons-react`, `@mui/icons-material`); SVGs custom viram componentes em `src/shared/template/admin/topbar/icons/`
- Sem dependências adicionais (não usar Framer Motion, Radix, headless-ui, shadcn — `useState` + Tailwind transitions resolvem)

## Entradas obrigatórias

1. **Caminho da pasta do template** (HTML/CSS/JS estático)
2. **Caminho da app Next.js de destino** (raiz com `src/`, Tailwind já configurado)

Se algum não estiver claro: PERGUNTAR antes de prosseguir. Verificar que o destino tem Tailwind; se não, instruir o usuário a instalá-lo antes.

## Saída — confinamento estrito

Permitido escrever em:

- `src/shared/template/admin/topbar/` — componentes, tipos, config, ícones
- `tailwind.config.{ts,js}` — sob `theme.extend.colors.adminTopbar`, `theme.extend.spacing.adminTopbar*`, etc.
- `src/app/globals.css` — só para o que Tailwind não cobre (ex.: animação custom de dropdown). Manter ao mínimo.

PROIBIDO:
- Criar sidebar, menu lateral, breadcrumbs, footer, dashboards, cards, widgets, layouts globais elaborados
- Criar rotas em `src/app/`
- Criar componentes fora de `src/shared/template/admin/topbar/` (exceto patches de `tailwind.config` / `globals.css`)
- Implementar alternância real de tema (apenas botão visual com `// TODO`)
- Implementar busca real (apenas input controlado com `// TODO`)
- Implementar ações reais de itens de dropdown (apenas estrutura visual com `// TODO`)
- Implementar autenticação ou logout
- Internacionalizar labels (manter idioma do template)
- Usar CSS Modules, styled-components ou CSS-in-JS

## Componentes — criar SOMENTE os que o original justificar

- `topbar.component.tsx` — container raiz; orquestra slots e estado responsivo + único `openDropdownId`
- `topbar-brand.component.tsx` — logo/marca à esquerda (apenas se existir na topbar do original, não na sidebar)
- `topbar-search.component.tsx` — campo de busca (inline ou expansível, conforme original)
- `topbar-actions.component.tsx` — agrupador dos botões de ação à direita
- `topbar-action-button.component.tsx` — botão genérico de ação (ícone + badge opcional + dropdown opcional)
- `topbar-dropdown.component.tsx` — painel suspenso reutilizável (header opcional, lista, footer opcional)
- `topbar-theme-toggle.component.tsx` — botão de tema claro/escuro (apenas visual, **sem alternância real**)
- `topbar-user-menu.component.tsx` — avatar + nome/role + dropdown
- `topbar-mobile-toggle.component.tsx` — botão hambúrguer/toggle mobile
- `topbar-divider.component.tsx` — separador vertical

Auxiliares:

- `topbar.types.ts` — `TopbarConfig`, `TopbarAction`, `TopbarDropdownItem`, `TopbarSearchConfig`, `TopbarUserConfig`, `TopbarZone`
- `topbar.config.ts` — configuração tipada (lista de ações, dropdowns, user, search) — materializada a partir do JSON da fase 1b
- `icons/` — SVGs custom convertidos em componentes React (apenas se aplicável)

## Fluxo (passos sequenciais, gate em cada um)

### 1. Inspeção do template

#### 1a — Localizar arquivos relevantes

- Listar HTMLs; identificar os que contêm `<header>`, `<nav class="navbar">`, `.topbar`, `.header`, `.app-header`, `.main-header`, `.layout-navbar` ou similar
- Identificar CSS(s) com regras que afetam a topbar (busca por seletores encontrados no HTML)
- Identificar JS(s) que tocam na topbar (toggles de dropdown via `data-bs-toggle="dropdown"`, `data-toggle`, `@click`, handlers de busca expansível, scroll listeners para sticky)

#### 1b — Extrair estrutura semântica → JSON

Rodar `scripts/extract-topbar-structure.mjs <html> [selector]` para gerar JSON com `{ zones: { left, center, right } }` e elementos tipados (`brand`, `mobile-toggle`, `search`, `action-button`, `dropdown`, `theme-toggle`, `user-menu`, `divider`). Conferir manualmente contra o HTML.

Se o script falhar (template muito atípico): Claude extrai lendo o HTML diretamente, **mas SEMPRE produz o mesmo JSON intermediário** antes de gerar código.

#### 1c — Extrair tokens visuais (lendo CSS)

Antes de mapear, ler `references/inspection-checklist.md`. Extrair:

- **Cores**: bg da topbar, bg hover dos botões, bg do botão ativo/aberto, ícone (default/hover), texto, borda inferior, bg dropdowns, badge de notificação, divisor vertical, placeholder e ring/focus da busca
- **Spacing**: altura da topbar, padding horizontal interno, gap entre elementos, tamanho dos botões de ação, padding interno dos botões, largura da busca (normal/expandida), largura dos dropdowns (notificações vs perfil podem diferir), padding interno dos itens, offset vertical do dropdown
- **Tipografia**: family, size, weight da busca, dos itens, do nome do usuário, dos títulos de seção dos dropdowns
- **Breakpoints**: em que largura cada elemento se reorganiza (esconde busca? colapsa ações em hambúrguer? esconde nome do usuário mantendo só avatar?)
- **Transições**: duração e easing de abertura de dropdowns, expansão da busca, hover dos botões
- **Animações dos dropdowns**: fade / slide / scale, têm seta? têm header/footer ("Ver todas as notificações")?
- **Badges**: formato (círculo, pílula), posição (canto superior direito do ícone), conteúdo (número, ponto)
- **Sombra**: box-shadow da topbar e dos dropdowns
- **Posicionamento**: `sticky` / `fixed` / estática? z-index? a topbar fica sob ou sobre a sidebar?
- **Modos responsivos**: enumerar comportamento de cada elemento por breakpoint (ver `references/responsive-modes.md`)

#### 1d — Apresentar relatório de inspeção e PEDIR CONFIRMAÇÃO

Formato curto e tabular: estrutura da topbar (zonas left/center/right com lista de elementos) + tabela de tokens + tabela de comportamento responsivo por elemento + lista de dropdowns identificados com estrutura interna (header / itens / footer). Não gerar código sem confirmação do usuário.

### 2. Mapeamento para Tailwind

Antes de patchar, ler `references/tailwind-token-mapping.md`.

Adicionar tokens sob namespace dedicado:

```ts
theme: {
  extend: {
    colors: {
      adminTopbar: {
        bg: '#...',
        border: '#...',
        iconDefault: '#...',
        iconHover: '#...',
        buttonHoverBg: '#...',
        buttonActiveBg: '#...',
        dropdownBg: '#...',
        dropdownBorder: '#...',
        dropdownItemHover: '#...',
        badgeBg: '#...',
        badgeText: '#...',
        searchBg: '#...',
        searchPlaceholder: '#...',
        searchRing: '#...',
        divider: '#...',
      },
    },
    spacing: {
      adminTopbarHeight: '64px',
      adminTopbarButton: '40px',
    },
    width: {
      adminTopbarSearch: '320px',
      adminTopbarDropdownNotifications: '380px',
      adminTopbarDropdownUser: '240px',
    },
    boxShadow: {
      adminTopbar: '0 1px 2px rgba(0,0,0,0.05)',
      adminTopbarDropdown: '0 10px 30px rgba(0,0,0,0.1)',
    },
    transitionDuration: {
      adminTopbar: '200ms',
    },
    zIndex: {
      adminTopbar: '40',
      adminTopbarDropdown: '50',
    },
  },
}
```

Valores fora da escala default do Tailwind: **adicionar literalmente** (`64px`, `320px`), não aproximar para `h-16` ou `w-80`. Fidelidade > convenção.

### 3. Geração de código (ordem obrigatória)

Antes de gerar, ler `references/component-templates.md` para snippets de referência e `references/dropdown-patterns.md` para a estrutura interna de cada tipo de dropdown.

1. `topbar.types.ts` (apenas tipos)
2. `topbar.config.ts` (dados a partir do JSON da 1b)
3. Patch em `tailwind.config`
4. `topbar-divider.component.tsx`, `topbar-action-button.component.tsx` (primitivos)
5. `topbar-dropdown.component.tsx` (painel suspenso reutilizável)
6. `topbar-search.component.tsx`, `topbar-theme-toggle.component.tsx`, `topbar-user-menu.component.tsx`, `topbar-mobile-toggle.component.tsx`, `topbar-brand.component.tsx`
7. `topbar-actions.component.tsx` (agrupador)
8. `topbar.component.tsx` (orquestrador)
9. Patch em `globals.css` (só se necessário)

**Padrões obrigatórios:**

- Componentes com estado: `"use client"` no topo, `useState` para `openDropdownId`, `searchExpanded`, `mobileMenuOpen`
- **Apenas um dropdown aberto por vez**: estado único `openDropdownId: string | null` no `topbar.component.tsx` (ou em `topbar-actions.component.tsx`), passado via prop. Nunca um `useState` por botão.
- **Fechar dropdown ao clicar fora**: `useEffect` com listener em `document` para `mousedown`, comparando com `ref` do dropdown
- **Fechar dropdown com ESC**: `useEffect` com listener em `keydown`
- **Fechar dropdown ao trocar de rota**: `useEffect` observando `usePathname()`
- Busca expansível (se aplicável): `useState` para `expanded`, focar input automaticamente ao expandir com `useRef` + `useEffect`
- **Theme toggle não funcional**: renderiza ícone (sol/lua, conforme original), `onClick` apenas alterna `useState` local de visualização; comentário explícito `// TODO: integrar com sistema de tema real (next-themes ou similar)`
- **Search não funcional**: input controlado com `useState` local; `onChange` apenas atualiza estado; `onSubmit` previne default; comentário `// TODO: integrar com lógica de busca real`
- **Itens de dropdown não funcionais**: `<a href="#">` ou `<button onClick={() => {}}>`, comentário `// TODO: integrar com ação real`
- Transições: `transition-all duration-adminTopbar ease-in-out` (ou easing do original); para dropdowns, animar `opacity` + `translate-y` + `scale` conforme o original
- z-index: replicar exatamente (topbar sob ou sobre a sidebar conforme o original)
- Acessibilidade mínima: `aria-label` em botões só com ícone, `aria-expanded` nos botões de dropdown, `aria-haspopup="menu"`, `role="menu"` no painel, `role="menuitem"` nos itens — replicar o que o original tiver e completar o que faltar
- Responsividade: cada elemento esconde/colapsa exatamente no breakpoint do original, usando prefixos Tailwind (`hidden md:flex` etc.) com breakpoints customizados se o template usar valores não-default
- Sem hydration mismatch: estado client-only lido em `useEffect`, não em `useState` initializer

### 4. Sem rotas de exemplo

Esta skill **não gera rotas de exemplo**. A topbar não tem itens de navegação primária — seus dropdowns/botões apontam para ações que serão integradas pela aplicação. A skill termina ao gerar componentes e configuração.

Opcional ao final: sugerir snippet de uso em `src/app/layout.tsx` ou layout privado, **sem criá-lo automaticamente**.

## Critérios de aceitação (auto-verificar antes de finalizar)

- [ ] `tailwind.config` com todos os tokens sob namespace `adminTopbar`
- [ ] Altura, cores, spacing e tipografia visualmente idênticos ao original (lado a lado, não "parecido")
- [ ] Todos os elementos da topbar original presentes na ordem correta nas zonas left/center/right
- [ ] Busca (se existir) replica comportamento (inline vs expansível) e estados visuais (focus ring, placeholder)
- [ ] Cada botão de ação tem ícone correto, badge correto (se aplicável), abre dropdown correto (se aplicável)
- [ ] Dropdowns abrem/fecham com mesma animação, mesma largura, mesma estrutura interna (header, lista, footer) do original
- [ ] Apenas um dropdown abre por vez; clique fora, ESC e mudança de rota fecham
- [ ] Theme toggle visualmente correto, mas **não altera o tema** (stub `// TODO` documentado)
- [ ] User menu (se existir) mostra avatar/nome/role conforme original e abre dropdown com os mesmos itens
- [ ] Mobile toggle (se existir) aparece no breakpoint correto
- [ ] Comportamento responsivo idêntico em cada breakpoint (busca, nome do usuário, ações secundárias escondem/colapsam exatamente como no original)
- [ ] Sombra, borda, z-index e posicionamento (sticky/fixed/static) replicados
- [ ] Nenhum componente criado fora de `src/shared/template/admin/topbar/` (exceto patches em `tailwind.config`/`globals.css`)
- [ ] Nenhum componente extra além da topbar (sem sidebar, footer, layouts)
- [ ] Nenhuma lógica funcional de tema, busca, autenticação ou ações implementada — apenas stubs com `// TODO`
- [ ] Sem erros de hydration (estado client-only lido em `useEffect`)
- [ ] TypeScript compila sem erros, sem `any` injustificado

## Não-escopo (explícito)

- Não portar sidebar, menu lateral, breadcrumbs, footer, dashboards, widgets
- Não criar layouts globais além do mínimo
- Não adicionar deps além do pacote de ícones do original
- Não implementar alternância real de tema, busca real, ações reais ou autenticação
- Não "melhorar" o design — fidelidade > opinião
- Não internacionalizar labels (manter idioma do template)
- Não usar CSS Modules, styled-components ou CSS-in-JS — Tailwind first; `globals.css` só para o que Tailwind não cobre

## Estrutura desta skill

```
ui-template-admin-topbar-to-nextjs/
├── SKILL.md
├── references/
│   ├── inspection-checklist.md
│   ├── tailwind-token-mapping.md
│   ├── responsive-modes.md
│   ├── dropdown-patterns.md
│   └── component-templates.md
└── scripts/
    └── extract-topbar-structure.mjs
```

Progressive disclosure: SKILL.md aponta quando ler cada referência (passos 1c, 2 e 3). `extract-topbar-structure.mjs` falha graciosa quando o seletor não encontra — nesse caso Claude faz a extração manualmente, mas sempre produzindo o JSON intermediário antes de gerar código.

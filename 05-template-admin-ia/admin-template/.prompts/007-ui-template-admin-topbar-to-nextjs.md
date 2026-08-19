# Skill a ser criada: `ui-template-admin-topbar-to-nextjs`

## Objetivo

Gerar uma skill que, dado um template administrativo em HTML/CSS/JS estático, extrai e recria FIELMENTE apenas a estrutura da **barra superior (top bar / header / navbar)** como componentes React em uma aplicação Next.js (App Router), preservando aparência, comportamento responsivo, estados visuais e interações do original — sem reimplementar nenhuma outra parte do template. A skill deve funcionar com qualquer template admin (AdminLTE, Metronic, Tabler, Sneat, Vuexy, Materio, CoreUI, custom, etc.) independentemente do framework CSS de origem (Bootstrap, Tailwind, custom).

## Quando a skill deve disparar

A skill deve ser usada SEMPRE que o usuário:

- pedir para "portar", "converter", "extrair", "recriar" ou "replicar" a top bar / barra superior / header / navbar de um template admin HTML em React/Next.js
- mencionar qualquer template admin conhecido e pedir a barra superior em Next.js
- fornecer uma pasta de template e disser algo como "quero só a topbar desse aqui no meu Next" — mesmo sem nomear "skill"
- pedir um header/navbar Next.js baseado em um design HTML existente

A skill NÃO deve ser usada para portar um template inteiro, apenas a barra superior. Também NÃO deve ser usada para portar a sidebar/menu lateral (essa é função da skill `ui-template-admin-sidebar-to-nextjs`).

## Stack fixa (não negociável)

- **Next.js App Router** com `src/`
- **Estilização: Tailwind CSS** com tokens extraídos do template original (cores, spacing, breakpoints, tipografia mapeados para o `tailwind.config`)
- **Interatividade: Client Components com `useState`** (dropdowns, busca expansível, drawer mobile da topbar, toggles). Marcar com `"use client"` os componentes que tiverem estado; os puramente apresentacionais ficam server components.
- **Tipagem: TypeScript** estrito
- **Ícones**: se o template original usa Lucide, usar `lucide-react`; se usa Font Awesome, Heroicons, Tabler Icons ou Material Icons, usar a versão React oficial correspondente; se usa um set custom (SVGs próprios), copiar os SVGs para `src/shared/template/admin/icons/` e usar como componentes React.

## Entradas esperadas

1. **Caminho da pasta do template** (HTML/CSS/JS estático)
2. **Caminho da aplicação Next.js de destino** (raiz do projeto, com `src/` e Tailwind já configurado)

Se algum dos dois não estiver claro no contexto, a skill deve perguntar antes de prosseguir. A skill deve verificar que o projeto Next.js destino tem Tailwind instalado; se não tiver, instruir o usuário a instalá-lo antes de continuar.

## Saída esperada

Toda saída fica confinada a:

- `src/shared/template/admin/topbar/` — componentes da topbar, tipos, config, ícones
- `tailwind.config.{ts,js}` — adicionar tokens extraídos sob um namespace (`theme.extend.colors.adminTopbar`, etc.) para não colidir com tokens existentes
- `src/app/globals.css` — apenas se o template precisar de regras impossíveis em Tailwind utilities (ex.: animação custom de dropdown). Manter ao mínimo.

Componentes (criar apenas os que o template original justificar):

- `topbar.component.tsx` — container raiz; orquestra slots e estado responsivo
- `topbar-brand.component.tsx` — logo/marca à esquerda (se existir no original e fizer parte da topbar, não da sidebar)
- `topbar-search.component.tsx` — campo de busca (se existir); pode ser inline ou expansível
- `topbar-actions.component.tsx` — agrupador dos botões de ação à direita
- `topbar-action-button.component.tsx` — botão genérico de ação (ícone + badge opcional + dropdown opcional)
- `topbar-dropdown.component.tsx` — painel suspenso usado por botões com dropdown (notificações, mensagens, atalhos, idiomas, perfil)
- `topbar-theme-toggle.component.tsx` — botão de tema claro/escuro (apenas visual, **sem implementar a alternância**)
- `topbar-user-menu.component.tsx` — avatar do usuário com dropdown (se existir)
- `topbar-mobile-toggle.component.tsx` — botão hambúrguer/toggle que abre o menu mobile da topbar (se o original tiver)
- `topbar-divider.component.tsx` — separador vertical entre grupos de ações (se existir)

Arquivos auxiliares permitidos:

- `topbar.types.ts` — tipos `TopbarConfig`, `TopbarAction`, `TopbarDropdownItem`, `TopbarSearchConfig`, `TopbarUserConfig`, etc.
- `topbar.config.ts` — configuração tipada da topbar (lista de ações, dropdowns, user, search)
- `icons/` — SVGs custom convertidos em componentes React (se aplicável)

PROIBIDO criar: sidebar, menu lateral, breadcrumbs, footer, dashboards, cards, layouts globais elaborados, ou qualquer componente fora da topbar. PROIBIDO criar componentes fora de `src/shared/template/admin/topbar/` exceto patches de `tailwind.config` e `globals.css`.

PROIBIDO implementar lógica funcional de:

- alternância real de tema (apenas o botão visual)
- busca real (apenas o campo, com `onChange` vazio ou stub)
- ações reais dos itens de dropdown (apenas a estrutura visual com `href="#"` ou `onClick` stub)
- autenticação ou logout real

A skill entrega a **casca visual e interativa** (abrir/fechar dropdowns, expandir busca, toggle mobile) — não a lógica de negócio por trás dos botões.

## Fluxo da skill (passos obrigatórios, nesta ordem)

### 1. Inspeção do template

Antes de gerar qualquer código, a skill deve:

**1a. Localizar arquivos relevantes:**

- Listar HTMLs do template; identificar os que contêm `<header>`, `<nav class="navbar">`, `.topbar`, `.header`, `.app-header`, `.main-header` ou similar
- Identificar CSS(s) com regras que afetam a topbar (busca por seletores encontrados no HTML)
- Identificar JS(s) que tocam na topbar (busca por classes de toggle de dropdown, data-attributes como `data-bs-toggle="dropdown"`, IDs da topbar, handlers de busca expansível)

**1b. Extrair estrutura semântica da topbar** (parte mecânica, propensa a alucinação):

- Usar o script `scripts/extract-topbar-structure.mjs` da skill (descrito abaixo) para produzir um JSON descrevendo a topbar em três zonas — `left`, `center`, `right` — com todos os elementos identificados (brand, search, action-button, dropdown, divider, theme-toggle, user-menu, mobile-toggle), seus ícones, badges, itens de dropdown, ordem
- Conferir manualmente o JSON contra o HTML antes de prosseguir
- Se o script falhar (template muito atípico), Claude faz a extração lendo o HTML diretamente — mas SEMPRE produzindo o mesmo JSON intermediário

**1c. Extrair tokens visuais** (parte interpretativa, Claude faz lendo CSS):

- **Cores**: background da topbar, background hover dos botões, background do botão ativo/aberto, cor do ícone (default/hover), cor do texto, cor da borda inferior se houver, background dos dropdowns, cor do badge de notificação, cor do divisor vertical, cor do placeholder da busca, cor do ring/focus da busca
- **Spacing**: altura da topbar, padding horizontal interno, gap entre elementos, tamanho dos botões de ação (largura/altura), padding interno dos botões, largura do campo de busca (estado normal e expandido se aplicável), largura dos dropdowns (notificações vs perfil podem ter larguras diferentes), padding interno dos itens de dropdown, offset vertical do dropdown em relação ao botão
- **Tipografia**: font-family, size, weight do texto da busca, dos itens de dropdown, do nome do usuário, dos títulos de seção dentro de dropdowns
- **Breakpoints**: em que largura a topbar reorganiza elementos (esconde busca? colapsa ações em hambúrguer? esconde nome do usuário mantendo só avatar?)
- **Transições**: duração e easing da abertura de dropdowns, da expansão da busca, do hover dos botões
- **Estado dos dropdowns**: aparecem com fade, slide, scale? têm seta apontando para o botão? têm header e/ou footer (ex.: "Ver todas as notificações")?
- **Badges**: formato (círculo, pílula), posição (canto superior direito do ícone), conteúdo (número, ponto)
- **Sombra**: a topbar tem box-shadow? os dropdowns têm box-shadow específica?
- **Posicionamento**: a topbar é `sticky`, `fixed` ou estática? tem `z-index` específico?
- **Modos responsivos**: enumerar como cada elemento se comporta em cada breakpoint (ex.: "busca vira ícone-only no md", "perfil esconde nome no sm", "ações secundárias colapsam em menu hambúrguer no sm")

**1d. Apresentar relatório de inspeção ao usuário** antes de gerar código, em formato curto e tabular: estrutura da topbar (zonas left/center/right com lista de elementos), tabela de tokens, tabela de comportamento responsivo por elemento, lista de dropdowns identificados com seus conteúdos. Pedir confirmação para prosseguir.

### 2. Mapeamento para Tailwind

Adicionar ao `tailwind.config` os tokens extraídos sob namespace dedicado:

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
      }
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
    }
  }
}
```

Spacing values específicos do template que não existam na escala Tailwind default devem ser adicionados — não aproximar para `h-16` se o template usa `64px` exatos, e não aproximar para `w-80` se a busca tem `320px`. Fidelidade > convenção Tailwind.

### 3. Geração de código

**Ordem:**

1. `topbar.types.ts` — tipos
2. `topbar.config.ts` — dados (a partir do JSON extraído na 1b)
3. `tailwind.config` patch — tokens
4. `topbar-divider.component.tsx`, `topbar-action-button.component.tsx` — primitivos
5. `topbar-dropdown.component.tsx` — painel suspenso reutilizável
6. `topbar-search.component.tsx`, `topbar-theme-toggle.component.tsx`, `topbar-user-menu.component.tsx`, `topbar-mobile-toggle.component.tsx`, `topbar-brand.component.tsx` — peças específicas
7. `topbar-actions.component.tsx` — agrupador
8. `topbar.component.tsx` — orquestrador
9. `globals.css` patch (apenas se necessário)

**Padrões obrigatórios:**

- Componentes com estado: `"use client"` no topo, `useState` para `openDropdownId`, `searchExpanded`, `mobileMenuOpen`, etc.
- **Apenas um dropdown aberto por vez**: usar um único estado `openDropdownId: string | null` no `topbar.component.tsx` (ou em `topbar-actions.component.tsx`) e passar via prop, não um `useState` por botão
- **Fechar dropdown ao clicar fora**: `useEffect` com listener em `document` para `mousedown`, comparando com `ref` do dropdown
- **Fechar dropdown com ESC**: `useEffect` com listener em `keydown`
- **Fechar dropdown ao trocar de rota**: `useEffect` observando `usePathname()`
- Busca expansível (se aplicável): `useState` para `expanded`, focar input automaticamente ao expandir com `useRef` + `useEffect`
- **Theme toggle não funcional**: o botão renderiza ícone (sol/lua, ou o que o original usa), tem `onClick` stub que apenas alterna um `useState` local de visualização — comentário explícito `// TODO: integrar com sistema de tema real (next-themes ou similar)`
- **Search não funcional**: input controlado com `useState` local; `onChange` apenas atualiza o estado; `onSubmit` previne default — comentário explícito `// TODO: integrar com lógica de busca real`
- **Itens de dropdown não funcionais**: renderizar como `<a href="#">` ou `<button onClick={() => {}}>`, com comentário `// TODO: integrar com ação real`
- Transições: usar classes Tailwind `transition-all duration-adminTopbar ease-in-out` (ou o easing do original); para dropdowns, animar `opacity` + `translate-y` + `scale` conforme o original faz
- z-index: topbar fica sob a sidebar OU sobre, conforme o original — verificar e replicar
- Acessibilidade mínima: `aria-label` em botões só com ícone, `aria-expanded` nos botões de dropdown, `aria-haspopup="menu"`, `role="menu"` no painel, `role="menuitem"` nos itens — replicar o que o original tiver e completar o que faltar
- Responsividade: cada elemento deve esconder/colapsar exatamente no breakpoint do original; usar prefixos Tailwind (`hidden md:flex`, etc.) com os breakpoints customizados se o template usar valores não-default

### 4. Sem rotas de exemplo

Diferentemente da skill de sidebar, esta skill **não gera rotas de exemplo**. A topbar não tem itens de navegação primária — seus dropdowns e botões apontam para ações que serão integradas posteriormente pela aplicação. A skill termina ao gerar os componentes e a configuração.

Se o usuário quiser ver a topbar funcionando, deve incluí-la em um layout próprio — a skill pode opcionalmente sugerir, ao final, um snippet de exemplo de uso em `src/app/layout.tsx` ou em um layout privado, mas **sem criá-lo automaticamente**.

## Critérios de aceitação (auto-verificar antes de finalizar)

- [ ] Tailwind config tem todos os tokens extraídos sob namespace `adminTopbar`
- [ ] Altura, cores, spacing e tipografia visualmente idênticos ao original
- [ ] Todos os elementos da topbar original estão presentes na ordem correta dentro das zonas left/center/right
- [ ] Campo de busca (se existir) replica comportamento (inline vs expansível) e estados visuais (focus ring, placeholder)
- [ ] Cada botão de ação tem o ícone correto, badge correto (se aplicável), e abre o dropdown correto (se aplicável)
- [ ] Dropdowns abrem/fecham com a mesma animação, têm a mesma largura, mesma estrutura interna (header, lista, footer) do original
- [ ] Apenas um dropdown abre por vez; clique fora, ESC e mudança de rota fecham
- [ ] Theme toggle aparece visualmente correto, mas **não altera o tema** (stub documentado)
- [ ] User menu (se existir) mostra avatar, nome, role conforme o original e abre dropdown com os mesmos itens
- [ ] Mobile toggle (se existir) aparece no breakpoint correto e abre o que o original abre
- [ ] Comportamento responsivo idêntico em cada breakpoint (busca, nome do usuário, ações secundárias escondem/colapsam exatamente como no original)
- [ ] Sombra, borda, z-index e posicionamento (sticky/fixed/static) replicados
- [ ] Nenhum componente criado fora de `src/shared/template/admin/topbar/` (exceto patches de `tailwind.config`/`globals.css`)
- [ ] Nenhum componente extra além da topbar foi criado (sem sidebar, sem footer, sem layouts)
- [ ] Nenhuma lógica funcional de tema, busca, autenticação ou ações de dropdown foi implementada — apenas stubs com comentários `// TODO`
- [ ] Nenhum erro de hydration (estado client-only lido em `useEffect`)
- [ ] TypeScript compila sem erros e sem `any` não justificado

## Não-escopo (explícito)

- Não portar sidebar, menu lateral, breadcrumbs, footer, dashboards, widgets
- Não criar layouts globais além do necessário para a topbar funcionar
- Não adicionar dependências além do pacote de ícones correspondente ao original (não usar Framer Motion, Radix, headless-ui, shadcn — `useState` + Tailwind transitions resolvem)
- Não implementar alternância real de tema — apenas o botão visual com `// TODO`
- Não implementar busca real — apenas o input controlado com `// TODO`
- Não implementar ações reais de itens de dropdown — apenas estrutura visual com `// TODO`
- Não implementar autenticação ou logout
- Não "melhorar" o design — fidelidade > opinião
- Não internacionalizar labels (manter idioma do template)
- Não usar CSS Modules, styled-components ou CSS-in-JS — Tailwind first, `globals.css` só para o que Tailwind não cobre

## Estrutura de arquivos da própria skill

```
ui-template-admin-topbar-to-nextjs/
├── SKILL.md                              # fluxo principal, < 500 linhas
├── references/
│   ├── inspection-checklist.md           # como ler HTML/CSS da topbar (detalhado)
│   ├── tailwind-token-mapping.md         # padrões de mapeamento template → Tailwind
│   ├── responsive-modes.md               # taxonomia de comportamentos responsivos por elemento
│   ├── dropdown-patterns.md              # padrões comuns de dropdown (notificações, mensagens, perfil, idioma) com estrutura interna
│   └── component-templates.md            # snippets de referência dos componentes
└── scripts/
    └── extract-topbar-structure.mjs      # parser HTML → JSON da estrutura da topbar
```

**`scripts/extract-topbar-structure.mjs`** (Node, sem dependências externas além de `node-html-parser` ou similar via npx): recebe caminho do HTML e seletor da topbar, devolve JSON com formato:

```ts
{
  zones: {
    left: TopbarElement[],
    center: TopbarElement[],
    right: TopbarElement[],
  }
}

type TopbarElement =
  | { type: 'brand', label?: string, logoSrc?: string }
  | { type: 'mobile-toggle', icon: string }
  | { type: 'search', placeholder: string, expandable: boolean }
  | { type: 'action-button', icon: string, label?: string, badge?: string | number, dropdownId?: string }
  | { type: 'dropdown', id: string, header?: string, items: DropdownItem[], footer?: string }
  | { type: 'theme-toggle', iconLight: string, iconDark: string }
  | { type: 'user-menu', avatarSrc?: string, name?: string, role?: string, items: DropdownItem[] }
  | { type: 'divider' }
```

Falha graciosa se o seletor não encontrar — nesse caso Claude faz a extração manualmente lendo o HTML.

**`references/`** seguem progressive disclosure: SKILL.md aponta quando ler cada um (ex.: "antes de mapear tokens, ler `tailwind-token-mapping.md`"; "antes de gerar dropdowns, ler `dropdown-patterns.md`").

# inspection-checklist.md

Como ler o HTML/CSS/JS da topbar de um template admin estático para extrair tudo o que a Fase 1 da skill exige. Use esta lista como checklist; cada item gera uma linha no relatório de inspeção (passo 1d) ou um campo do JSON intermediário (passo 1b).

## 1. Localização

- [ ] Encontrar o(s) arquivo(s) HTML que renderizam a topbar. Busca por: `<header`, `<nav class="navbar"`, `class="topbar"`, `class="app-header"`, `class="main-header"`, `class="layout-navbar"`, `id="header"`, `id="topbar"`.
- [ ] Verificar se a topbar é compartilhada entre páginas (geralmente é, mas confirmar — pode haver variantes de página).
- [ ] Identificar o CSS responsável: `grep` pelas classes do HTML nos `.css` do template. Anotar cada arquivo que contém regras matching.
- [ ] Identificar o JS responsável: buscar handlers `data-bs-toggle="dropdown"`, `data-toggle`, `@click`, `x-show`, `onclick`, listeners imperativos por ID/classe da topbar.

## 2. Estrutura semântica (vai para o JSON da 1b)

A topbar é dividida em três zonas visuais lendo da esquerda para a direita:

- **left**: brand/logo, mobile toggle, breadcrumb (ignorar — fora do escopo), eventualmente busca
- **center**: busca centralizada (se existir), eventualmente menu horizontal (ignorar — fora do escopo)
- **right**: ações (notificações, mensagens, idioma, fullscreen, quick actions), theme toggle, user menu, divisores

Para cada elemento identificado:

- [ ] Tipo (`brand`, `mobile-toggle`, `search`, `action-button`, `dropdown`, `theme-toggle`, `user-menu`, `divider`)
- [ ] Posição (zona + índice na zona)
- [ ] Ícone usado (classe Font Awesome, nome Lucide, src de SVG, etc.)
- [ ] Badge — se houver, anotar conteúdo (número, "•", "NEW") e cor
- [ ] Para `action-button` com dropdown: anotar `dropdownId` correlacionando com o painel
- [ ] Para `dropdown`: estrutura interna — header (título, botão "Marcar todas como lidas"), lista (itens com avatar/ícone/título/subtítulo/timestamp), footer ("Ver todos")
- [ ] Para `user-menu`: avatar src, nome, role/email, itens do dropdown
- [ ] Para `search`: placeholder, expansível ou inline, atalho de teclado anunciado (`⌘K`, `Ctrl+/`)

## 3. Tokens visuais (lendo CSS)

### Cores

- [ ] `bg` da topbar (estado normal); `bg` quando scrolled (se mudar)
- [ ] `border-bottom` (cor + espessura) ou ausência
- [ ] `bg` hover dos botões de ação
- [ ] `bg` do botão ativo / com dropdown aberto
- [ ] Cor do ícone (default + hover + ativo)
- [ ] Cor do texto (placeholder da busca, nome do usuário, role do usuário, itens do dropdown)
- [ ] `bg` dos dropdowns
- [ ] `border` dos dropdowns
- [ ] `bg` hover dos itens de dropdown
- [ ] `bg` e cor de texto do badge de notificação
- [ ] Cor do divisor vertical
- [ ] Cor do ring/focus da busca

### Spacing

- [ ] Altura da topbar (em px exatos — não aproximar)
- [ ] Padding horizontal interno
- [ ] Gap entre elementos (entre brand e search, entre ações)
- [ ] Largura/altura dos botões de ação (geralmente quadrados)
- [ ] Padding interno dos botões
- [ ] Largura da busca: estado normal e estado expandido (se aplicável)
- [ ] Largura dos dropdowns — anotar separadamente para cada tipo (notificações tipicamente 360–400px, perfil 200–260px, idioma 160–200px)
- [ ] Padding interno dos itens de dropdown
- [ ] Offset vertical do dropdown em relação ao botão (`top: calc(100% + 8px)`?)

### Tipografia

- [ ] Family, size, weight de: input da busca, placeholder, itens de dropdown, nome do usuário, role do usuário, títulos de seção dentro de dropdowns, badges

### Breakpoints

Para cada elemento, anotar em que largura ele:

- esconde por completo
- vira ícone-only (perde texto/label)
- colapsa em hambúrguer
- muda de posição (de center para um dropdown mobile)

Exemplo:

| Elemento | < 640 | 640–768 | 768–1024 | > 1024 |
|----------|-------|---------|----------|--------|
| Search | hidden | icon-only (expansível) | inline | inline |
| User name+role | hidden | hidden | visible | visible |
| Notifications | visible | visible | visible | visible |
| Mobile toggle | visible | visible | hidden | hidden |

### Transições / animações

- [ ] Duração e easing do hover dos botões
- [ ] Duração e easing da abertura de dropdowns (geralmente 150–250ms)
- [ ] Tipo de animação dos dropdowns: fade, slide-down, scale-in, ou combinação
- [ ] Transformação inicial (`opacity-0 translate-y-2 scale-95` é comum)
- [ ] Duração da expansão da busca

### Estado dos dropdowns

- [ ] Posicionamento (à direita do botão com `right-0`, ou centralizado)
- [ ] Tem seta apontando para o botão? Se sim, cor + tamanho + offset
- [ ] Tem `header` interno? Conteúdo (título + ação rápida)
- [ ] Tem `footer` interno? Conteúdo (link "Ver todas")
- [ ] Lista interna scrollável? Altura máxima?

### Badges

- [ ] Formato: círculo (apenas com ponto) ou pílula (com número)
- [ ] Posição: top-right do ícone (offset?)
- [ ] Cor do `bg`, cor do texto
- [ ] Tamanho mínimo

### Sombra e borda

- [ ] `box-shadow` da topbar
- [ ] `box-shadow` dos dropdowns (geralmente mais pronunciada — `0 10px 30px rgba(0,0,0,0.1)` ou similar)

### Posicionamento

- [ ] `position`: `sticky` / `fixed` / estática
- [ ] `top: 0` ou outro
- [ ] `z-index`: anotar valor exato (a topbar fica sob ou sobre a sidebar?)
- [ ] A topbar deslocada se a sidebar estiver presente? Margem esquerda igual à largura da sidebar?

## 4. Comportamentos JS observados

Para cada interação, anotar gatilho e efeito:

- [ ] Click em botão de ação → abre dropdown (qual?)
- [ ] Click fora do dropdown → fecha
- [ ] ESC → fecha dropdown aberto
- [ ] Click em outro botão de ação → fecha o anterior, abre o novo (apenas um por vez)
- [ ] Mudança de rota → fecha dropdown
- [ ] Busca: input expande on focus / on click? Atalho `⌘K` foca?
- [ ] Mobile toggle → abre o quê? (drawer mobile da topbar, ou trigger de sidebar — se for sidebar, é fora do escopo desta skill)
- [ ] Scroll da página → topbar muda de aparência (sombra, bg)?

Se algum comportamento não couber em recipes (`useState` + `useEffect` + Tailwind transitions), parar antes de gerar código e propor tradução ao usuário. Não cair em Framer Motion / Radix / outra dependência sem aprovação.

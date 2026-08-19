# Fase 1 — Mapeamento de áreas

## Goal

A partir do HTML principal do template, montar (em memória) duas estruturas: **(a)** a tabela de áreas estruturais com dimensões e comportamento responsivo; **(b)** a lista fechada de componentes que a Fase 3 vai gerar.

## Inputs

- Caminho do HTML principal e CSSs (Fase 0).
- Biblioteca de ícones detectada (Fase 0).

## Procedure

1. **Identificar áreas estruturais** no HTML, na ordem do DOM. Mapear elementos para áreas canônicas:

   | Elemento detectado                                  | Área canônica |
   | --------------------------------------------------- | ------------- |
   | `<aside>`, `<nav class*="sidebar">`, `<div id="sidebar">` | `aside` (menu lateral) |
   | `<header>`, `<nav class*="topbar">`, `<div class*="header">` | `topbar` |
   | `<main>`, `<div class*="content">`, `<section class*="main">` | `main` |
   | `<footer>`                                          | `footer` |
   | qualquer outra área estrutural (rail de notificações, sub-aside, splitbar) | nome próprio |

2. **Tabela de áreas.** Para cada área detectada, preencher mentalmente:

   | área | seletor de origem | dimensões em mobile | dimensões em tablet | dimensões em desktop | posição (fixed/sticky/static) | comportamento responsivo |
   | ---- | ----------------- | ------------------- | ------------------- | -------------------- | ----------------------------- | ------------------------ |

   Dimensões saem do CSS (Fase 2 vai formalizar; aqui basta anotar a evidência: `width: 260px @ ≥1024px`, `width: 73px @ .sidebar-mini`, `display: none @ <768px`, etc.).

   2.1. **Topbar — capturar espaçamentos literais.** O `<header>`/topbar costuma ter padding e gaps específicos que **não** são `1rem` por default. Extrair do template:
   - `paddingTop` / `paddingBottom` / `paddingLeft` / `paddingRight` do container do topbar — incluindo variantes por breakpoint (`px-4` / `lg:px-6` / `xl:px-8`).
   - `gap` entre filhos do topbar (entre toggle, search, widgets, user-menu).
   - `marginLeft` / `marginRight` específico de algum filho do topbar (ex.: o `<MenuToggle>` pode ter `mr-4` ou `gap-2` aplicado pelo container).
   - Altura efetiva do topbar (`h-16`, `lg:h-20`).
   - **Anotar evidência por valor** — snippet HTML + linha. Sem inferir defaults; sem "1rem porque parece razoável".

   2.1.1. **Topbar inner row.** Vários templates têm uma estrutura aninhada: `<header>` → `<div>` outer → `<div>` inner-row contendo o toggle e os widgets. As classes de spacing aplicadas neste **inner-row** (não só no `<header>` raiz) são as que efetivamente posicionam o toggle. Capturar separadamente:
   - `padding`/`gap` do outer wrapper (entre o header raiz e o inner-row).
   - `padding`/`gap`/`align`/`justify` do inner-row — esses são os que dão o "respiro" entre o `<MenuToggle>`, search, e widgets.
   - Quando o template tem **inner border** entre seções do topbar (`border-b border-gray-200` no inner-row, sumindo no xl com `xl:border-b-0`), capturar como token separado.
   - Margens específicas do `<MenuToggle>` dentro do inner-row (regra do "primeiro filho recebe `mr-X`"). Materializar em `--shell-topbar-toggle-mr` (ou similar) e aplicar via inline style no slot do toggle dentro do `admin-shell.component.tsx`.

   2.1.2. **Main content area — espaçamentos literais (CRÍTICO, frequentemente esquecido).** A área `<main>` do template **nunca** é "colada nas bordas". Em quase todos os admin templates ela tem padding e/ou max-width próprios. Inspecionar:
   - O `<main>`, `<div class*="content">`, `<section class*="page-content">`, ou o primeiro wrapper que envolve o conteúdo das páginas dentro do shell (após sidebar e topbar).
   - **Capturar literalmente** padding por lado, com variantes por breakpoint. Ex.: TailAdmin tem geralmente `p-4 md:p-6 lg:p-8` em `<div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">` no wrapper interno do main.
   - **Capturar `max-width`** e `margin: 0 auto` se houver — vários templates centralizam o conteúdo com `mx-auto max-w-screen-2xl` ou similar.
   - **Capturar `gap` vertical** entre seções do main (`space-y-6`, `gap-6`) quando o template define um padrão.
   - **Anotar evidência** (snippet HTML + linha) por valor. Sem `1rem` por hábito; sem "padding ali está apertado, vou colocar 24px" — extrair do template.

   2.2. **Dupla checagem do topbar.** Antes de fechar a Fase 1: revisitar o snippet do topbar e listar **cada utility class de spacing** (`p-*`, `px-*`, `py-*`, `m-*`, `gap-*`, `space-x-*`) presente no container e em seus filhos diretos. Cada uma precisa virar um valor concreto na tabela; se algo ficou de fora, voltar e capturar. Esta dupla checagem é obrigatória — a Fase 5 confere que nenhum hardcode genérico (`padding: 0 1rem`, `gap: 1rem`, `margin: 0 0.5rem`) sobreviva no `top-bar.component.tsx`.

3. **Detectar toggle de menu.** Procurar:
   - `<button class*="menu-toggle">`, `<button class*="burger">`, `<a class*="sidebar-toggle">`
   - JS que adiciona/remove classes como `.sidebar-mini`, `.sidebar-collapsed`, `.sidebar-open` ao `<body>` ou a um wrapper.
   - Ícone `fa-bars`, `bi-list`, `mdi-menu`, etc.
   Se houver, anotar: gatilho, alvo, classes alteradas, breakpoint em que o botão fica visível.

   3.1. **Capturar a estrutura do botão (wrapper).** O toggle de admin templates raramente é só um ícone solto — geralmente tem caixa, borda e dimensões próprias. Extrair literalmente do HTML/CSS:
   - Tag (`<button>` vs `<a>`) e classes aplicadas.
   - **Largura/altura** (em px ou rem) — `w-11 h-11` → `2.75rem`. Se ausente, deixar `auto`.
   - **Borda — capturar com nuance** (atributo crítico, pode variar por contexto):
     - **Sempre presente?** Classe `border` sem prefixo → sim, em todos os breakpoints/estados.
     - **Só em breakpoint?** Classes como `xl:border`, `lg:border`, `md:border` → presente apenas a partir desse breakpoint.
     - **Só em estado?** Borda dentro de uma binding condicional Alpine/x-data ou JS (`:class="sidebarToggle ? 'border ...' : ''"`) → presente apenas quando o menu está num estado específico (mini/expanded/mobile-open).
     - **Cor / espessura / estilo:** `border-gray-200` → `1px solid #e5e7eb`. Anotar separadamente o valor "ativo" e o valor "inativo" (sem borda = `1px solid transparent` para preservar layout, **não** `none` que causaria salto de dimensão).
   - **Border-radius** (`rounded-lg` → `0.5rem`, `rounded-full` → `9999px`).
   - **Background** em estado idle e em estado hover/active (se diferente). Capturar ambos quando o template define um hover.
     - **Background condicional por estado/breakpoint** — mesma lógica da borda. Ex.: TailAdmin `:class="sidebarToggle ? 'xl:bg-transparent bg-gray-100' : ''"` → quando `sidebarToggle=true` (sidebar mini), bg muda para gray-100 em mobile mas continua transparent em xl. Capturar a matriz completa: `bg[breakpoint][estado]`.
   - **Padding interno** (`p-2`, `px-3`, etc.).
   - **Cor do ícone** (texto/svg current color).
   - **Posição relativa**: alinhamento dentro do topbar/aside e qualquer `margin` ou `gap` específico.

   3.1.1. **Tabela de presença da borda** (preencher obrigatoriamente quando o toggle existe):

   | breakpoint     | estado `closed` (`mini`/`mobile-closed`) | estado `open` (`expanded`/`mobile-open`) |
   | -------------- | ---------------------------------------- | ---------------------------------------- |
   | mobile (<md)   | sim/não + cor                            | sim/não + cor                            |
   | tablet (md-xl) | sim/não + cor                            | sim/não + cor                            |
   | desktop (xl+)  | sim/não + cor                            | sim/não + cor                            |

   Mesma tabela para `background-idle` e `background-hover`. Se uma célula é "não", explicitar — não deixar implícito.

   3.2. **Capturar os ícones (estado aberto E estado fechado).**
   - Se o template usa inline SVG: extrair `viewBox` + cada `<path d="...">` literalmente, mantendo `fill`/`stroke`/`stroke-width`/`stroke-linecap`/`stroke-linejoin`. Anotar as duas variantes:
     - **`iconClosed`**: o ícone visível quando o menu está fechado/mini (geralmente "hamburger", "menu", "chevron-right", "arrow-right").
     - **`iconOpen`**: o ícone visível quando o menu está aberto/expanded (geralmente "X", "close", "chevron-left", "arrow-left"). **Importante:** alguns templates usam o mesmo SVG e apenas rotacionam via CSS (`transform: rotate(180deg)`); detectar esse caso e anotar `iconOpen = iconClosed + transform`.
   - Se o template usa uma biblioteca de ícones (font-awesome, bootstrap-icons, lucide, heroicons, etc.): anotar o nome exato do ícone para cada estado.
   - **Se nenhum ícone é claramente identificável**, escolher o par mais próximo da biblioteca de ícones detectada na Fase 0:
     - lucide: `Menu`/`X`, ou `PanelLeftClose`/`PanelLeftOpen` (mais fiel a sidebars com seta).
     - heroicons: `Bars3`/`XMark`, ou `ChevronDoubleLeft`/`ChevronDoubleRight`.
     - Marcar no relatório como **fallback**.

   3.3. **Mapear estados do menu para ícones.** Cruzar com Fase 4 (estados detectados):
   - desktop com mini: `mode === "expanded"` → `iconOpen`; `mode === "mini"` → `iconClosed`.
   - desktop sem mini, mobile: `mobile-open` → `iconOpen`; `mobile-closed` → `iconClosed`.
   - Se o template aplica `rotate` em vez de trocar o SVG, replicar como `transform: rotate(...)` no JSX em vez de dois `<svg>` distintos.

   3.4. **Anotar evidência** (snippet HTML/CSS + linhas) para cada um dos valores acima — Fase 5 confere fidelidade.

4. **Detectar logo.** Procurar `<a class*="logo">`, `<img class*="logo">`, `<div class*="brand">`, `<header class*="sidebar-header">`. Anotar se há texto, imagem, ou ambos. O logo entra no `logo.component.tsx` mesmo que esteja dentro do `aside` no original.

   4.0. **Logo placement — pode haver mais de uma posição visível por breakpoint.** Vários admin templates duplicam o logo: uma instância no aside (visível em desktop) e outra no topbar (visível só em mobile, quando o sidebar está escondido). **Inspecionar todo o HTML principal** procurando elementos do brand em mais de um lugar. Para cada ocorrência, anotar:
   - `location`: `aside` | `topbar` | `outside-shell` (ignorar a última).
   - `visibilityClasses`: classes de breakpoint que controlam quando essa instância aparece. Ex.: `xl:hidden` (visível só <xl), `hidden xl:block` (visível só ≥xl), `lg:hidden` (visível <lg).
   - `assetVariant`: qual `role` da Fase 1.4.2 essa instância usa (`full`, `icon`, `mobile`).

   Tabela `logo placement`:

   | location | visibility | role usado | evidência |
   | -------- | ---------- | ---------- | --------- |
   | aside    | sempre / `xl:` / `lg:` | full / icon | snippet+linha |
   | topbar   | `xl:hidden` etc. | full / mobile | snippet+linha |

   Esta tabela determina onde o `<Logo />` é renderizado:
   - Apenas `aside`: `<Menu>` renderiza `<Logo />`, `<TopBar>` não.
   - Apenas `topbar`: `<TopBar>` renderiza `<Logo />`, `<Menu>` não.
   - Ambos com **breakpoints complementares** (ex.: aside visible ≥xl, topbar visible <xl): cada componente renderiza seu `<Logo />` envelopado em wrapper com a classe de visibilidade traduzida (ver Fase 3.4.3 para a regra de implementação).

   4.1. **Classificar o `kind` do logo** — exatamente um dos:

   | kind | quando usar |
   | ---- | ----------- |
   | `text-only`     | só texto/inline-SVG sem dependência de asset externo |
   | `image-single`  | exatamente um `<img>` (ou um único asset referenciado por CSS `background-image`) |
   | `image-variants`| dois ou mais `<img>` no mesmo wrapper, OU um `<picture>` com `<source>`, OU um `<img>` cujo `src` é trocado por JS quando o sidebar muda de estado |

   **Regra dura (proibido violar) — derivada da evidência da Fase 0.6:**

   1. Se `logoImageCount === 0 && logoHasInlineSvg === false` → `kind` **deve** ser `text-only`.
   2. Se `logoImageCount === 1` (depois da deduplicação por `src`) → `kind` **deve** ser `image-single`. **Não** rebaixar para `text-only` "para simplificar".
   3. Se `logoImageCount >= 2` OU existe `<picture>` OU JS troca o `src` por estado → `kind` **deve** ser `image-variants`.
   4. Se `logoHasInlineSvg === true && logoImageCount === 0`: tratar como `text-only`, mas **incluir o `<svg>` literal** no `LOGO_BODY` (não substituir por texto).
   5. **Nunca** classificar como `text-only` quando há qualquer `<img>` ou `<svg>` inline no wrapper de brand do template — isso descarta fidelidade visual e quebra o gate de paridade da Fase 5 (passo 4.0).

   Quando a regra dura for violada, parar e voltar à Fase 0.6 para conferir a evidência. Não prosseguir.

   4.2. **Se `kind` for `image-single` ou `image-variants`** — para cada `<img>` envolvido, anotar:
   - `assetPath`: caminho relativo do `src` original a partir da raiz do template (ex.: `assets/images/logo-full.svg`).
   - `role`: papel da variante. Inferir cruzando classes CSS, regras de `display:none`, e o estado de menu que dispara o swap:
     - `full` → variante "ampla" (expanded sidebar; visível por padrão).
     - `icon` → variante "ícone" (mini/compact sidebar; geralmente classe contém `mini`, `icon`, `collapsed`, `small`, ou `hidden` por padrão e revelada quando o body recebe a classe de collapse).
     - `mobile` → variante exclusiva para breakpoint mobile (somente se houver media-query CSS dedicada e `assetPath` distinto).
   - `widthHint`/`heightHint`: dimensões anotadas no `<img width="..." height="...">` ou no CSS aplicado. Se ausentes, deixar `null`.
   - `altText`: do atributo `alt` do `<img>` ou, na ausência, do texto do brand. Se nada existir, usar o nome do site.

   4.3. **Mapear variantes para estados do menu** (apenas para `image-variants`):
   - `full` → modos `expanded`, `mobile-open`.
   - `icon` → modo `mini`.
   - `mobile` → ativo quando `isMobile === true` (sobrescreve `full`/`icon`).
   - Se faltar a variante `icon` mas o template tem modo `mini`, reusar `full` no `mini` e anotar no relatório.

   4.4. **Variantes de tema (dark/light)** estão fora do escopo desta skill — escolher apenas as variantes do tema padrão detectado na Fase 0 e descartar as demais.

   4.5. **Capturar o "logo region" (sidebar-header).** O wrapper imediato do logo no aside (`<div class*="sidebar-header">`, `<header class*="logo-wrapper">`, ou o primeiro flex container do `<aside>` que contém a `<a>`/`<img>` do logo) costuma ter regras de espaçamento e alinhamento que mudam entre os estados expanded/mini. **Capturar literalmente** do CSS/HTML do template — não inferir defaults razoáveis:
   - `paddingTop` / `paddingBottom` / `paddingLeft` / `paddingRight`. Se o template usa Tailwind utility classes (`pt-8 pb-7 px-6` etc.), traduzir para valores `rem`/`px` exatos. Se há classes de breakpoint (`xl:px-6`), capturar o par mobile/desktop.
   - `gap` entre filhos do flex.
   - `alignItems` (default `center` em quase todos os templates).
   - `justifyContent` **por estado**:
     - `expandedJustify` — valor aplicado quando o sidebar está expanded. Lendo `class="..."` estática mais qualquer `:class` Alpine/JS condicional negado (ex.: no TailAdmin: `:class="sidebarToggle ? 'justify-center' : 'justify-between'"` → expanded = `space-between`).
     - `miniJustify` — valor aplicado quando o sidebar está mini/compact (ex.: TailAdmin → `center`).
     - Se o template não tem mini, `miniJustify` é `null`.
   - `height` do logo region (px ou `auto`). Quando ausente, deixar `auto`.

   4.6. **Anotar a evidência** (snippet HTML + linha) para cada um dos valores acima — a Fase 5 vai conferir que os tokens emitidos batem com o template original.

5. **Lista canônica de componentes.** Marcar como **OBRIGATÓRIO** ou **CONDICIONAL** com base no detectado:

   | Componente | Regra |
   | ---------- | ----- |
   | `admin-shell.component.tsx` | obrigatório |
   | `menu.component.tsx` | obrigatório |
   | `logo.component.tsx` | obrigatório |
   | `top-bar.component.tsx` | só se houver header/topbar |
   | `footer.component.tsx` | só se houver footer |
   | `menu-toggle.component.tsx` | só se houver botão de toggle |
   | `use-menu-state.hook.ts` | obrigatório |
   | `menu-state.context.tsx` | obrigatório |
   | `admin-shell.tokens.css` (ou tokens no tailwind.config) | obrigatório |

   Áreas extras (sub-aside, rail) viram componentes próprios **somente se** forem estruturalmente distintas E tiverem comportamento responsivo próprio. Caso contrário, ficam como `<div>` interna do shell.

6. **Estados do menu.** Cruzar a Fase 0 + classes JS detectadas para inferir o conjunto de estados que `use-menu-state` precisa expor. Ver [`../references/menu-state-machine.md`](../references/menu-state-machine.md).

7. **Breakpoint efetivo mobile↔desktop do menu.** Esta é a fronteira em px na qual o **comportamento do sidebar muda de "offcanvas/mobile" para "static/desktop"** — e é o valor que `MenuStateProvider` usa em `matchMedia(max-width: BP-1)` para alternar entre as famílias `mobile-*` e `expanded`/`mini`.

   Determinar **literalmente** olhando o CSS/HTML do `<aside>` e do toggle:
   - Procurar a primeira utility de breakpoint nas classes do `<aside>` que muda layout: `xl:translate-x-0 xl:static` → boundary é `xl` (1280px). `lg:flex lg:static` → `lg` (1024px). `md:translate-x-0` → `md` (768px).
   - Procurar o breakpoint em que o toggle muda de "abre offcanvas" para "alterna mini" — geralmente o mesmo (`xl:hidden` no toggle mobile + `xl:block` no toggle desktop, ou um único toggle cujo handler comporta-se diferente conforme o `matchMedia`).
   - Cruzar com a `collapseTrigger` (Fase 0/inventory) — o estado `mini` só faz sentido a partir desse breakpoint.

   Tabela de mapeamento típico Tailwind → px:

   | utility | px |
   | ------- | -- |
   | `sm:`   | 640  |
   | `md:`   | 768  |
   | `lg:`   | 1024 |
   | `xl:`   | 1280 |
   | `2xl:`  | 1536 |

   Anotar como **`menuBreakpointPx`** (número inteiro). Default seguro **só** quando nada é detectável: `768`. **Importante:** este valor é independente do `--shell-bp-md`/`--shell-bp-lg` (que são para CSS responsivo geral) — `menuBreakpointPx` é especificamente a fronteira da máquina de estados do menu.

   Anotar evidência (snippet do `<aside>` + linha).

## Acceptance criteria

- [ ] Toda área estrutural do template tem uma linha na tabela.
- [ ] Lista de componentes a criar está fechada — nada de "talvez".
- [ ] Toggle de menu: ou foi encontrado (com gatilho + classes), ou foi explicitamente marcado como ausente.
- [ ] Estados do menu enumerados (mínimo 1, ex.: só `expanded` se não há toggle; máximo 4: `expanded | mini | mobile-open | mobile-closed`).
- [ ] Logo classificado como `text-only`, `image-single` ou `image-variants` — e, nos dois últimos casos, lista de assets com `role` determinado. **A classificação respeita a regra dura da Fase 1.4.1** (derivada de `logoImageCount`/`logoHasInlineSvg` da Fase 0.6); parar se a violar.
- [ ] **Contagem esperada de assets a copiar** anotada explicitamente: `expectedLogoFiles = N` (onde N é o tamanho de `logoAssetPaths` do tema padrão, depois de descartar variantes do tema oposto na Fase 1.4.4). Esse número será conferido contra o conteúdo de `public/template/admin/logo/` na Fase 5.4.0.
- [ ] **Logo placement** preenchido: ao menos uma linha; se o template tem instância no topbar mobile, ela aparece com `visibilityClasses` literais.
- [ ] Logo region (sidebar-header) capturado: padding por lado, gap, alignItems, e `expandedJustify`/`miniJustify` literais do template — com snippet de evidência por valor.
- [ ] Topbar: padding por lado (com variantes por breakpoint quando houver), gap entre filhos, margens específicas de filhos, altura por breakpoint — todos literais do template, com evidência. Dupla checagem feita: cada utility de spacing do snippet original aparece na tabela.
- [ ] **Main content area** (Fase 1.2.1.2): padding por lado (com variantes por breakpoint), `max-width`+`mx-auto` se houver, gap vertical entre seções — literais do template, com evidência. Sem este passo o conteúdo aparece "colado nas bordas" — esse é o sintoma a evitar.
- [ ] **`menuBreakpointPx`** anotado: valor inteiro em px (ex.: `1280`) extraído do utility de breakpoint que controla o sidebar do template, com evidência. **Não** assumir 768 sem evidência.
- [ ] Toggle (se existir): wrapper capturado (w/h/border/radius/bg/padding) + ícone aberto e fechado (inline SVG literal OU nome da biblioteca) + estratégia (dois SVGs vs `rotate`) + evidência por valor. Quando algo for fallback, marcar explicitamente.

## Verification gate

Reportar a tabela e a lista de componentes ao usuário em uma única mensagem. Só prosseguir para a Fase 2.

## Failure handling

- HTML sem nenhuma área estrutural identificável → parar e pedir confirmação do arquivo correto.
- Toggle ambíguo (existe botão mas não há JS funcional) → tratar como ausente; anotar para o relatório final.

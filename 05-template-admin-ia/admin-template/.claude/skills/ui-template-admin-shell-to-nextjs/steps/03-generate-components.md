# Fase 3 — Geração de componentes

## Goal

Materializar, em `src/shared/template/admin/`, todos os componentes/contextos/hook que a Fase 1 marcou como obrigatórios ou condicionais-presentes, lendo tokens da Fase 2 e seguindo os contratos de [`../references/component-contracts.md`](../references/component-contracts.md).

## Inputs

- Lista de componentes (Fase 1).
- Tokens emitidos (Fase 2).
- Templates em `../templates/*.tmpl`.
- Contratos em `../references/component-contracts.md`.
- Estados do menu em `../references/menu-state-machine.md`.

## Procedure

1. **Para cada componente da lista**, copiar o `.tmpl` correspondente para o destino final em `src/shared/template/admin/`, removendo a extensão `.tmpl` e substituindo placeholders `{{...}}` pelos valores extraídos. Componentes condicionais marcados como ausentes na Fase 1 **não** devem ser gerados.

2. **Tabela de placeholders comuns** (preenchidos a partir das Fases 0–2):

   | Placeholder | Origem |
   | ----------- | ------ |
   | `{{ICON_LIB_IMPORT}}` | linha de import da biblioteca de ícones detectada (ex.: `import { Menu } from "lucide-react";`). Vazio se `none`. |
   | `{{ICON_TOGGLE_OPEN}}` | JSX do ícone "abrir menu" (ex.: `<Menu size={20} />`). Fallback: `<svg>` inline da Fase 0. |
   | `{{ICON_TOGGLE_CLOSE}}` | JSX do ícone "fechar menu" (X). Fallback idem. |
   | `{{ASIDE_W_EXPANDED}}` | `var(--shell-aside-w-expanded)` |
   | `{{ASIDE_W_MINI}}` | `var(--shell-aside-w-mini)` ou `0` se não houver modo mini |
   | `{{TOPBAR_H}}` | `var(--shell-topbar-h)` ou `0` se não houver topbar |
   | `{{FOOTER_H}}` | `var(--shell-footer-h)` ou `0` se não houver footer |
   | `{{BP_MD}}` / `{{BP_LG}}` | breakpoints em px |
   | `{{HAS_TOPBAR}}` / `{{HAS_FOOTER}}` / `{{HAS_TOGGLE}}` / `{{HAS_MINI}}` | flags booleanas que controlam imports e JSX condicional no `admin-shell.component.tsx` |

2.1. **Seleção do sub-template do `<Logo>` (não improvisar JSX).** O template freeform `logo.component.tsx.tmpl` foi descontinuado — ele permitia o gerador rebaixar logo de imagem para texto. A Fase 3 agora **escolhe um, e exatamente um**, dos três sub-templates pré-prontos com base no `kind` da Fase 1.4.1:

   | kind do logo (Fase 1.4.1) | sub-template usado |
   | ------------------------- | ------------------ |
   | `text-only`     | `templates/logo.text-only.component.tsx.tmpl` |
   | `image-single`  | `templates/logo.image-single.component.tsx.tmpl` |
   | `image-variants`| `templates/logo.image-variants.component.tsx.tmpl` |

   O destino final é sempre `src/shared/template/admin/logo.component.tsx`. O sub-template tem o JSX completo já materializado — a Fase 3 preenche apenas placeholders escalares.

   Placeholders por sub-template:

   **`text-only`:**
   | Placeholder | Origem |
   | ----------- | ------ |
   | `{{LOGO_USE_CLIENT}}` | vazio (text-only não usa `useMenuState`). |
   | `{{LOGO_IMPORTS}}` | vazio. |
   | `{{LOGO_TEXT}}` | texto literal capturado no wrapper de brand do template (ex.: nome do produto). Se ausente, usar o nome do site. |
   | `{{LOGO_INLINE_SVG_OR_EMPTY}}` | SVG inline literal capturado em Fase 0.6 (quando `logoHasInlineSvg === true`); vazio caso contrário. Converter `class=` → `className=`, `stroke-width` → `strokeWidth`. |

   **`image-single`:**
   | Placeholder | Origem |
   | ----------- | ------ |
   | `{{LOGO_FULL_SRC}}` | `/template/admin/logo/<basename do único asset copiado>`. |
   | `{{LOGO_ALT}}` | `alt` original do `<img>`, ou texto do brand. |
   | `{{LOGO_HEIGHT}}` | `heightHint` da Fase 1 + `px`, ou `32px`. |
   | `{{LOGO_WIDTH_HEIGHT_ATTRS}}` | `width="..." height="..."` quando `widthHint`+`heightHint` existem (reduz layout shift); vazio caso contrário. |

   **`image-variants`:**
   | Placeholder | Origem |
   | ----------- | ------ |
   | `{{LOGO_FULL_SRC}}` | path do asset com `role: "full"` (ex.: `/template/admin/logo/<basename-full>`). **Sempre presente** — é o fallback. |
   | `{{LOGO_ICON_SRC}}` | path do asset com `role: "icon"`; quando ausente no template, repetir o valor de `{{LOGO_FULL_SRC}}` (skill anota como fallback no relatório da Fase 5). |
   | `{{LOGO_TOPBAR_SRC}}` | path do asset com `role: "mobile"`; quando ausente, repetir `{{LOGO_FULL_SRC}}`. |
   | `{{LOGO_ALT}}`, `{{LOGO_HEIGHT}}`, `{{LOGO_WIDTH_HEIGHT_ATTRS}}` | iguais ao caso `image-single`. |

   **Proibido** modificar a estrutura do sub-template ou criar um quarto kind. Se a Fase 1 produzir algo que não cabe nesses três casos, voltar e refinar a Fase 1.

2.2. **Copiar assets do logo (apenas para `image-single` e `image-variants`).** Para cada variante anotada na Fase 1.4.2:
   - Origem: `<rootTemplate>/<assetPath>`.
   - Destino: `public/template/admin/logo/<basename>` no projeto Next.js.
   - Sobrescrever silenciosamente se o destino já existir (idempotência) — desde que o conteúdo seja byte-igual; caso contrário, parar e perguntar ao usuário.
   - Caminho consumível pelo componente: `/template/admin/logo/<basename>` (Next.js serve a pasta `public/` na raiz).
   - Não otimizar, não converter formato, não redimensionar — copiar bytes exatos. SVGs ficam SVG; PNGs ficam PNG.

2.2.1. **Conferência de paridade (cópia × referência).** Após copiar os assets E renderizar o sub-template, conferir antes de fechar a Fase 3:
   - `count(arquivos em public/template/admin/logo/) === expectedLogoFiles` (Fase 1, último critério de aceite).
   - `count(<img src=... em logo.component.tsx) === count(arquivos em public/template/admin/logo/)`.
   - Cada `src=` no `logo.component.tsx` aponta para um arquivo que **existe** em `public/template/admin/logo/`.
   Se qualquer linha falhar, **não fechar a Fase 3** — voltar a 2.2 (cópia) ou 2.1 (sub-template). Esta é a contraparte interna da verificação independente da Fase 5.4.0.

2.3. **(Histórico — não usar mais.) Montar `{{LOGO_BODY}}` conforme o `kind`:**

   _Esta seção é mantida por referência. A Fase 3 agora usa os sub-templates pré-prontos descritos em 2.1. Os snippets abaixo permanecem como guia visual do JSX final._

   - **`text-only`** — texto + (opcional) ícone inline:
     ```tsx
     <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", fontWeight: 600 }}>
       {{LOGO_ICON_JSX}}
       <span>{{LOGO_TEXT}}</span>
     </span>
     ```

   - **`image-single`** — exatamente uma `<img>`:
     ```tsx
     <span style={{ display: "inline-flex", alignItems: "center" }}>
       <img
         src="/template/admin/logo/<basename-da-variante-única>"
         alt="<altText>"
         style={{ height: "<heightHint || 32px>", width: "auto", display: "block" }}
       />
     </span>
     ```

   - **`image-variants`** — escolha responsiva pelo estado do menu:
     ```tsx
     <span style={{ display: "inline-flex", alignItems: "center" }}>
       <img
         src={isMini ? "/template/admin/logo/<icon-basename>" : "/template/admin/logo/<full-basename>"}
         alt="<altText>"
         style={{ height: "<heightHint || 32px>", width: "auto", display: "block" }}
       />
     </span>
     ```
     Se houver variante `mobile` distinta, usar uma cadeia: `isMobile ? "/...mobile..." : isMini ? "/...icon..." : "/...full..."`.

2.4. **Width/height na `<img>`:** preferir `style={{ height: ... }}` com `width: "auto"` para preservar proporção. Quando `widthHint`/`heightHint` da Fase 1 estiverem disponíveis, materializá-los como atributos `width=` / `height=` HTML para reduzir layout shift; caso contrário, aplicar apenas `style.height` igual a `var(--shell-topbar-h)` menos um padding (default `32px`).

2.4.1. **Logo placement multi-localização (Fase 1.4.0).** Quando a tabela `logo placement` tem **uma só linha**, renderizar `<Logo />` no componente correspondente (`<Menu>` ou `<TopBar>`) sem nenhum wrapper de visibilidade. Quando tem **duas linhas com breakpoints complementares** (típico: aside ≥xl, topbar <xl), cada componente renderiza seu `<Logo />` envelopado em `<span>` com a regra de visibilidade traduzida:

   - Tradução `xl:hidden` → `<span style={{ display: "none" }} className="logo-mobile-only">` + uma regra CSS no `admin-shell.tokens.css`:
     ```css
     .logo-mobile-only { display: inline-flex; }
     @media (min-width: var(--shell-menu-bp)) { .logo-mobile-only { display: none; } }
     ```
   - Tradução `hidden xl:block` (visível só ≥xl) → simétrica:
     ```css
     .logo-desktop-only { display: none; }
     @media (min-width: var(--shell-menu-bp)) { .logo-desktop-only { display: inline-flex; } }
     ```
   - **Importante:** as classes `.logo-mobile-only` / `.logo-desktop-only` ficam no `admin-shell.tokens.css` (mesmo arquivo dos tokens) — não introduzir um novo arquivo CSS só por causa disso. A media-query lê `--shell-menu-bp` (Fase 2) para casar exatamente com a fronteira do menu state machine.

   Quando os dois logos usam `assetVariant` distintos (ex.: aside usa `full`/`icon`, topbar mobile usa `mobile`), o `<Logo>` precisa receber uma prop opcional `placement?: "aside" | "topbar"` para escolher o asset correto. Manter a prop opcional e default `"aside"` para não quebrar uso simples.

2.5.1. **`<TopBar>` — espaçamentos via tokens, não literais.** O `top-bar.component.tsx` é vazio em conteúdo (só wrapper + slot), mas seu **espaçamento** precisa ser fiel. Substituir literais (`padding: 0 1rem`, `gap: 1rem`) por tokens emitidos na Fase 2:
   ```tsx
   export function TopBar({ children }: { children?: ReactNode }) {
     return (
       <div
         style={{
           display: "flex",
           alignItems: "center",
           gap: "var(--shell-topbar-gap)",
           flex: 1,
           paddingTop: "var(--shell-topbar-py)",
           paddingBottom: "var(--shell-topbar-py)",
           paddingLeft: "var(--shell-topbar-px)",
           paddingRight: "var(--shell-topbar-px)",
         }}
       >
         <div style={{ flex: 1 }}>{children}</div>
       </div>
     );
   }
   ```
   Variantes por breakpoint (`--shell-topbar-px-md`, `-lg`) são aplicadas via `@media` no `admin-shell.tokens.css` sobrescrevendo `--shell-topbar-px`. A margem direita do `<MenuToggle>` (quando o template define `mr-*` específico) sai de `--shell-topbar-toggle-mr` e é aplicada **dentro** do `admin-shell.component.tsx` como `marginRight` no slot do toggle.

2.6. **`<MenuToggle>` — replicar fielmente o botão do template.** O toggle é mais que um ícone: é um *botão com estrutura* (wrapper + ícone). A skill **não inventa** decoração que não existe (sem borda fictícia, sem hover artificial), mas **replica integralmente** o que o template tem.

   2.6.1. **Wrapper.** O `<button>` recebe estilos vindos diretamente dos tokens emitidos na Fase 2 (`--shell-menu-toggle-w`, `-h`, `-bg`, `-bg-hover`, `-border`, `-radius`, `-padding`, `-color`). Quando o template **não** tem borda/background/radius (botão "naked"), os tokens correspondentes saem com `1px solid transparent`/`transparent`/`0` e o JSX não muda — fidelidade direta. **Nunca emitir `border: none`** quando a borda aparece em algum breakpoint/estado: usar `1px solid transparent` para preservar o footprint, e sobrescrever com a cor real via `@media`/JSX condicional.

   2.6.1.1. **Borda e background condicionais por estado.** Se a Fase 1.3.1.1 (tabela de presença) registrar que a borda OU o background variam por **estado do menu** (não só breakpoint), o `menu-toggle.component.tsx` precisa aplicar essas variações em JSX, lendo `useMenuState()`. Padrão:
   ```tsx
   const isOpen = isMobile ? mode === "mobile-open" : mode === "expanded";
   // Quando o template muda bg só no estado "fechado/mini" em mobile:
   const bgOverride = !isMobile || isOpen ? undefined : "{{TOGGLE_BG_WHEN_CLOSED_MOBILE}}";
   // Aplicar:  background: bgOverride ?? "var(--shell-menu-toggle-bg)"
   ```
   Quando a variação é puramente por **breakpoint** (ex.: `xl:border`), preferir `@media` no tokens.css em vez de JSX (mais barato, sem reflow). Quando a variação cruza **breakpoint × estado**, usar a combinação: `@media` para o breakpoint + condicional JSX para o estado, sempre lendo o estado via `useMenuState()`.

   2.6.1.2. **Antes de gerar o componente, conferir explicitamente** a tabela 3.1.1: para cada célula `(breakpoint, estado)` da matriz de borda e background, decidir o caminho de implementação (`@media`, JSX condicional, ou ambos) e materializá-lo. Se uma única célula da matriz for ignorada, voltar e corrigir — esse erro é o que produz o sintoma "às vezes tem borda, às vezes não, e o React não traz".

   2.6.2. **Ícones — duas estratégias mutuamente exclusivas:**

   - **`inline-svg`** (padrão quando o template usa SVG inline ou o ícone não tem equivalente óbvio em biblioteca): emitir o SVG **literal** capturado na Fase 1.3.2, como JSX. Manter `viewBox`, `fill`, `stroke`, `stroke-width`, `stroke-linecap`, `stroke-linejoin`, `<path d="...">`, etc. Converter `class=` → `className=` e `stroke-width` → `strokeWidth` (camelCase JSX). **Não** redesenhar; **não** simplificar. O `<svg>` final renderiza no tamanho controlado por CSS (`width: 1.25rem; height: 1.25rem;` por padrão, ou o tamanho exato detectado).

   - **`library`** (quando o template usa font-awesome/lucide/heroicons/bootstrap-icons e existe equivalente nomeado): importar o ícone exato da biblioteca instalada na Fase 0/3 (`lucide-react` é o fallback global). Usar `size={ICON_SIZE_PX}` ou `width=`/`height=` para casar com o template.

   - Quando o template aplica `rotate` em vez de trocar o SVG: emitir **um único** SVG (ou import) e aplicar `transform: rotate({{ROT_DEG}})` condicionalmente no JSX em vez de manter dois ícones distintos.

   2.6.3. **Mapeamento de estado → ícone.** No `menu-toggle.component.tsx`:
   ```tsx
   const isOpen = isMobile ? mode === "mobile-open" : mode === "expanded";
   ```
   - `isOpen === true` → renderizar `iconOpen` (ou aplicar `transform` quando estratégia é rotate).
   - `isOpen === false` → renderizar `iconClosed`.
   Manter `aria-label` em pt-BR ("Abrir menu" / "Fechar menu") e `aria-expanded={isOpen}`.

   2.6.4. **Fidelidade dos ícones.** Sempre que possível, **inline-svg** vence biblioteca — preserva exatamente o glifo do template (proporções, espessura de stroke, raios de canto). Só cair em biblioteca quando o template usar uma biblioteca conhecida E houver match óbvio. Quando nem uma coisa nem outra é viável, escolher na biblioteca de fallback (lucide) o ícone visualmente mais próximo, anotando como **fallback** para o relatório da Fase 5. **Nunca** deixar o botão sem ícone.

   2.6.5. **Tabela de placeholders do `<MenuToggle>`** (preenchidos pela Fase 3):

   | Placeholder | Origem |
   | ----------- | ------ |
   | `{{TOGGLE_ICON_STRATEGY}}` | `inline-svg` ou `library` (decidido em 2.6.2). |
   | `{{TOGGLE_ICON_IMPORTS}}` | quando `library`: `import { ChevronLeft, ChevronRight } from "lucide-react";` (ou equivalente). Quando `inline-svg`: vazio. |
   | `{{TOGGLE_ICON_SIZE_PX}}` | tamanho do ícone em px (default `20`). |
   | `{{TOGGLE_ICON_OPEN_JSX}}` | quando `inline-svg`: o `<svg>...</svg>` literal do estado aberto. Quando `library`: `<ChevronLeft size={20} />` (ou equivalente). Quando estratégia é rotate, igual ao `{{TOGGLE_ICON_CLOSED_JSX}}` mas envelopado em `<span style={{ transform: "rotate({{TOGGLE_ROT_OPEN_DEG}})" }}>...</span>`. |
   | `{{TOGGLE_ICON_CLOSED_JSX}}` | mesmo critério que o aberto. |
   | `{{TOGGLE_ROT_OPEN_DEG}}` / `{{TOGGLE_ROT_CLOSED_DEG}}` | apenas quando estratégia é rotate; senão vazio. |

2.5. **Placeholders do `<Menu>`** (preenchidos a partir da Fase 1.4.5 e da Fase 2):

   | Placeholder | Origem |
   | ----------- | ------ |
   | `{{MENU_USE_CLIENT}}` | a string `"use client";\n\n` quando o logo está no aside (precisa de `useMenuState` para o `justify` per-state); vazio caso contrário. |
   | `{{MENU_IMPORTS}}` | `import { useMenuState } from "./use-menu-state.hook";\n` quando o logo está no aside; vazio caso contrário. |
   | `{{MENU_HOOK_CALL}}` | `const { mode, isMobile } = useMenuState();\n  const isMini = !isMobile && mode === "mini";\n  ` quando o logo está no aside; vazio caso contrário. |
   | `{{ASIDE_HEADER_JUSTIFY_EXPANDED}}` | valor literal CSS (ex.: `space-between`, `flex-start`) capturado na Fase 1.4.5. |
   | `{{ASIDE_HEADER_JUSTIFY_MINI}}` | valor literal CSS (ex.: `center`) capturado na Fase 1.4.5. Se template não tem mini, usar o mesmo de `EXPANDED`. |

3. **Instalar a biblioteca de ícones**, se houver toggle ou logo com glifo, e ainda não estiver no `package.json`:
   - lucide → `npm install lucide-react`
   - font-awesome → `npm install @fortawesome/react-fontawesome @fortawesome/free-solid-svg-icons`
   - bootstrap-icons → `npm install react-bootstrap-icons`
   - heroicons → `npm install @heroicons/react`
   - Qualquer outra biblioteca proprietária do template sem equivalente React → cair em **lucide-react** como fallback e usar o ícone visualmente mais próximo (`Menu`, `X`).

4. **Áreas vazias.** `menu.component.tsx`, `top-bar.component.tsx`, `footer.component.tsx` recebem apenas a estrutura/wrapper + `children?: ReactNode`. Sem itens, sem texto, sem widgets. O `top-bar` deve, contudo, renderizar slots para `<MenuToggle />` (à esquerda) e `<Logo />` quando o template original prevê o logo no topbar (mutuamente exclusivo com logo no aside). Quando o logo está no aside, o `menu.component.tsx` renderiza um **logo region** wrapper (replicando os valores capturados na Fase 1.4.5) com `<Logo />` dentro + `{children}` abaixo.

   4.1. **Logo region no `menu.component.tsx`** — quando o logo está no aside, o wrapper imediato precisa replicar **fielmente** o sidebar-header do template. Como `justifyContent` alterna entre estados (ex.: `space-between` em expanded vs. `center` em mini), o `menu.component.tsx` recebe `"use client";` e lê `useMenuState()`. Os demais valores (padding, gap, align) saem dos tokens da Fase 2:
   ```tsx
   "use client";

   import type { ReactNode } from "react";
   import { useMenuState } from "./use-menu-state.hook";
   import { Logo } from "./logo.component";

   export function Menu({ children }: { children?: ReactNode }) {
     const { mode, isMobile } = useMenuState();
     const isMini = !isMobile && mode === "mini";
     return (
       <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
         <div
           style={{
             display: "flex",
             alignItems: "var(--shell-aside-header-align)",
             justifyContent: isMini ? "{{ASIDE_HEADER_JUSTIFY_MINI}}" : "{{ASIDE_HEADER_JUSTIFY_EXPANDED}}",
             gap: "var(--shell-aside-header-gap)",
             paddingTop: "var(--shell-aside-header-pt)",
             paddingBottom: "var(--shell-aside-header-pb)",
             paddingLeft: isMini ? "var(--shell-aside-header-px-mini)" : "var(--shell-aside-header-px-expanded)",
             paddingRight: isMini ? "var(--shell-aside-header-px-mini)" : "var(--shell-aside-header-px-expanded)",
           }}
         >
           <Logo />
         </div>
         <nav style={{ flex: 1, overflowY: "auto" }}>{children}</nav>
       </div>
     );
   }
   ```
   Onde `{{ASIDE_HEADER_JUSTIFY_EXPANDED}}` e `{{ASIDE_HEADER_JUSTIFY_MINI}}` são os valores literais capturados na Fase 1.4.5 (ex.: `"space-between"` e `"center"`). Se `miniJustify` for `null` (template sem mini), usar o mesmo valor de `expandedJustify`.

   4.2. **Por que `justify` não vira CSS var:** ele depende do estado runtime do menu, e CSS vars não condicionam a um booleano de React. Mantemos os outros valores como var (re-tematizáveis depois) e o `justify` em JSX.

5. **`admin-shell.component.tsx`.** Único lugar que conhece a coreografia. Ele:
   - Lê o estado via `useMenuState()`.
   - Aplica largura/visibilidade do aside conforme estado e breakpoint.
   - Aplica `padding-left` (ou `margin-left`) no `<main>` igual à largura do aside efetiva.
   - Renderiza `<TopBar>`, `<Footer>` e `<MenuToggle>` apenas se foram gerados.
   - Em mobile com `mobile-open`, renderiza um overlay clicável que dispara `closeOnMobile()`.

   5.1. **Main content padding — fiel ao template (Fase 1.2.1.2).** O `<main>` precisa aplicar os tokens emitidos na Fase 2:
   ```tsx
   <main
     style={{
       flex: 1,
       paddingTop: "var(--shell-main-py)",
       paddingBottom: "var(--shell-main-py)",
       paddingLeft: "var(--shell-main-px)",
       paddingRight: "var(--shell-main-px)",
     }}
   >
     {/* Centralização opcional quando o template usa mx-auto + max-width */}
     <div style={{ maxWidth: "var(--shell-main-max-w)", marginLeft: "auto", marginRight: "auto" }}>
       {children}
     </div>
   </main>
   ```
   - **Proibido** deixar `<main style={{ flex: 1 }}>` sem padding — esse é o erro que produz o sintoma "conteúdo colado nas bordas".
   - O wrapper interno com `maxWidth` é opcional: se `--shell-main-max-w: none`, ele não tem efeito visual mas mantém estrutura consistente. Quando o template centraliza (ex.: `mx-auto max-w-screen-2xl`), o wrapper aplica.
   - Variantes por breakpoint vivem no `admin-shell.tokens.css` via `@media` sobrescrevendo `--shell-main-px`/`-py`.

6. **Hook + Context.**
   - `use-menu-state.hook.ts` expõe: `mode`, `isMobile`, `setMode(next)`, `toggle()`, `openOnMobile()`, `closeOnMobile()`.
   - `menu-state.context.tsx` exporta `MenuStateProvider` e `useMenuState`. O provider escuta `window.matchMedia` para alternar entre os modos desktop e mobile, conforme [`../references/menu-state-machine.md`](../references/menu-state-machine.md).
   - **`BP_MD` constante = `menuBreakpointPx` da Fase 1.7** (não 768 por default). Ex.: TailAdmin captura `xl:` → `BP_MD = 1280`. O placeholder `{{BP_MD_PX_NUMBER}}` no template do context precisa receber esse valor inteiro.
   - Toda a leitura/escrita de `window` acontece dentro de `useEffect` para compatibilidade SSR.

7. **`"use client"`** no topo de todos os arquivos `.tsx` que usam estado, efeito ou contexto (ou seja: shell, menu-toggle, hook/context).

## Acceptance criteria

- [ ] Apenas os componentes marcados na Fase 1 foram gerados — nada a mais, nada a menos.
- [ ] Áreas internas (menu, topbar, footer) estão visualmente vazias (apenas wrapper + opcional `<Logo />` ou `<MenuToggle />`).
- [ ] `admin-shell.component.tsx` é o único arquivo que importa o hook de estado, **exceto**: (a) `logo.component.tsx` quando `kind === "image-variants"`; (b) `menu.component.tsx` quando o logo está no aside (precisa de `justify` per-state).
- [ ] `npx tsc --noEmit` passa para tudo em `src/shared/template/admin/`.
- [ ] `package.json` foi atualizado com a dependência de ícones, se aplicável.
- [ ] Para logo `image-single`/`image-variants`: cada `assetPath` da Fase 1 tem um arquivo correspondente em `public/template/admin/logo/`, e cada `<img src>` no `logo.component.tsx` referencia um desses arquivos.
- [ ] **Sub-template correto foi escolhido** (passo 2.1): `kind === "text-only"` → `logo.text-only.component.tsx.tmpl`; `image-single` → `logo.image-single.component.tsx.tmpl`; `image-variants` → `logo.image-variants.component.tsx.tmpl`. **Proibido** voltar ao `logo.component.tsx.tmpl` freeform.
- [ ] **Paridade interna conferida** (passo 2.2.1): contagem de arquivos copiados === contagem de `<img src=>` no `logo.component.tsx` === `expectedLogoFiles`.

## Verification gate

Rodar `npx tsc --noEmit`. Se falhar, corrigir antes de prosseguir. Reportar ao usuário a lista de arquivos criados e dependências instaladas.

## Failure handling

- Erro de tipos nos templates → corrigir os tipos (geralmente `children?: ReactNode` ou imports faltando), nunca silenciar com `any`.
- Ícone da biblioteca detectada não tem equivalente óbvio → usar lucide como fallback e anotar no relatório final (Fase 5).

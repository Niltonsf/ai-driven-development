# Fase 5 — Verificação e relatório

## Goal

Provar que tudo compila, conferir cada critério de aceite, e entregar um relatório curto ao usuário.

## Procedure

1. **Build.** Rodar `npm run build` (ou o equivalente do gerenciador de pacotes detectado: `pnpm build`, `yarn build`, `bun run build`). Se falhar, voltar para a fase apropriada e corrigir; **não** seguir adiante.

2. **Allowlist.** Comparar a lista de arquivos **e diretórios** criados/modificados com [`../references/allowlist.md`](../references/allowlist.md). Qualquer arquivo fora da allowlist é uma violação — parar e reportar.

   2.1. **Sem pastas vazias / sem `.gitkeep`.** Listar tudo que a skill criou nesta execução e validar:
   - Nenhum arquivo `.gitkeep`, `.keep`, `index.ts` vazio, ou `README.md` placeholder foi gerado.
   - Nenhum diretório criado pela skill ficou vazio (todo diretório novo recebeu pelo menos um arquivo da allowlist).
   - Nenhum diretório fora da lista do bloco "Regras de criação de diretórios" da allowlist foi criado (ex.: `src/components/`, `src/lib/`, `src/hooks/`, `src/types/`, `src/styles/`).

   Se qualquer item acima falhar, **reverter o(s) extra(s)** (apagar arquivos marcadores e remover pastas vazias) antes de prosseguir. Anotar o evento no relatório.

3. **Áreas vazias (visual).** Inspecionar (lendo o JSX gerado) que:
   - `menu.component.tsx` não contém `<li>`, `<a>`, `<ul>` com hrefs concretos, breadcrumbs, ou texto que não seja o do logo.
   - `top-bar.component.tsx` não contém avatar, badge de notificação, search input, breadcrumbs.
   - `footer.component.tsx` não contém copyright, links, ou texto.
   Exceção: `<MenuToggle />` no topbar/aside e `<Logo />` no aside/topbar são permitidos.

3.0. **Fidelidade do `<MenuToggle>`** (apenas se o componente foi gerado). Abrir `menu-toggle.component.tsx` e conferir:
   - Wrapper usa `var(--shell-menu-toggle-w/h/bg/bg-hover/border/radius/padding/color)` — **sem** literais hardcoded e **sem** decoração que não esteja na evidência da Fase 1.3.1 (ex.: nenhuma borda emitida se o template não tem borda; nenhum hover se o template não tem hover).
   - Os tokens em `admin-shell.tokens.css` batem com os valores literais (px/rem/cor) anotados na Fase 1.3.4.
   - Ícone: se a estratégia é `inline-svg`, o JSX contém **exatamente** os mesmos `viewBox`/`<path d=...>`/`stroke`/`fill` capturados na Fase 1.3.2 (sem ajustes "para parecer melhor"). Se é `library`, o nome do ícone bate com o equivalente mais próximo da biblioteca instalada.
   - Estado aberto e estado fechado correspondem ao mapeamento do template (Fase 1.3.3) — incluindo o caso `rotate` quando aplicável.
   - Quando algum aspecto foi marcado como **fallback** na Fase 1, isso aparece no relatório final (passo 5).

3.0.1. **Borda e background do toggle — checagem da matriz.** Reabrir a tabela de presença da Fase 1.3.1.1. Para cada célula `(breakpoint, estado)`:
   - Se a célula diz "sim, cor X" — verificar que existe um caminho de implementação (token base, `@media`, ou JSX condicional) que produz essa cor naquele contexto. Abrir o navegador (ou ler o CSS resultante) e confirmar.
   - Se diz "não" — verificar que o valor neutro (`1px solid transparent` para borda; `transparent` para bg) está em vigor naquele contexto.
   - **Caso comum perdido:** template tem `xl:border` (borda só em desktop). Se o `tokens.css` não tem o `@media (min-width: 1280px)` sobrescrevendo `--shell-menu-toggle-border`, a borda nunca aparece. Conferir.
   - **Outro caso comum:** template muda bg apenas no estado fechado (`:class="x ? 'bg-gray-100' : ''"`). Se o JSX não condiciona via `useMenuState()`, o bg fica fixo. Conferir.
   Se qualquer célula falha, voltar à Fase 3 e corrigir antes de relatar sucesso.

3.0.0. **Breakpoint mobile↔desktop do menu — fidelidade.** Abrir `menu-state.context.tsx` e conferir:
   - A constante `BP_MD` é exatamente o `menuBreakpointPx` da Fase 1.7 (ex.: `1280` para templates com sidebar `xl:static`). **Não** é 768 default sem evidência.
   - O CSS var `--shell-menu-bp` em `admin-shell.tokens.css` casa com a constante TS (mesmo valor em px).
   - Testar redimensionando o navegador: o sidebar entra em modo offcanvas exatamente no breakpoint do template original — nem antes, nem depois.

3.0.0.1. **Logo placement — fidelidade.** Abrir `menu.component.tsx` e `top-bar.component.tsx`:
   - Se a tabela `logo placement` (Fase 1.4.0) tem duas linhas com breakpoints complementares, ambos os componentes renderizam `<Logo />` com o `placement` correto e envolvido na classe de visibilidade (`.logo-mobile-only` / `.logo-desktop-only`).
   - As regras CSS `.logo-mobile-only`/`.logo-desktop-only` em `admin-shell.tokens.css` usam `min-width: var(--shell-menu-bp)` ou o equivalente literal, **não** 768 fixo.
   - Testar visualmente: redimensionar até cruzar `menuBreakpointPx` — em uma direção a instância do aside aparece, na outra a do topbar. Nunca ambas ao mesmo tempo.

3.0.3. **Main content area — fidelidade dos paddings.** Abrir `admin-shell.component.tsx` e localizar o `<main>`:
   - O `<main>` aplica `paddingTop`/`paddingBottom`/`paddingLeft`/`paddingRight` lendo `var(--shell-main-py)` e `var(--shell-main-px)`. Se estiver `<main style={{ flex: 1 }}>` puro, é violação — o conteúdo aparecerá colado nas bordas.
   - Tokens `--shell-main-px`/`-py` em `admin-shell.tokens.css` batem com o snippet original (Fase 1.2.1.2). Variantes por breakpoint estão materializadas via `@media` quando o template define `md:p-6` etc.
   - Se o template centraliza (`mx-auto max-w-*`), `--shell-main-max-w` é um valor px/rem e o wrapper interno do `<main>` aplica `marginLeft: auto; marginRight: auto`. Se não centraliza, `--shell-main-max-w: none`.
   - **Teste rápido:** abrir `/dashboard` no navegador. O texto "Conteúdo" precisa estar afastado das bordas (esquerda, direita, topo) com a mesma "respiração" que páginas equivalentes do template original. Se está colado, voltar e corrigir.

3.0.2. **Espaçamentos do `<TopBar>` — dupla checagem.** Abrir `top-bar.component.tsx`:
   - **Proibido** literais como `padding: 0 1rem`, `gap: 1rem`, `margin: 0 0.5rem` no JSX. Todo spacing precisa vir de `var(--shell-topbar-*)`.
   - Os tokens `--shell-topbar-px`, `-py`, `-gap`, `-toggle-mr` em `admin-shell.tokens.css` batem com os valores literais anotados na Fase 1.2.1.
   - Variantes por breakpoint do topbar (`md:px-6`, `lg:px-8`) estão materializadas como `@media` no `tokens.css` sobrescrevendo `--shell-topbar-px`. Se o snippet original tem `px-4 md:px-6`, o tokens.css precisa ter os dois valores; se só tem `px-4`, basta um.
   - Se a Fase 1.2.2 listou utility classes que não viraram tokens, voltar e corrigir. Erro típico: `gap-4` no snippet original mas o token saiu como `1rem` por hábito (correto seria `1rem` mesmo, mas conferir caso a caso).

3.1. **Fidelidade do logo region.** Quando o logo está no aside, abrir `menu.component.tsx` e conferir que:
   - O wrapper imediato do `<Logo />` tem `paddingTop`/`paddingBottom`/`gap`/`alignItems` ligados aos tokens `--shell-aside-header-*`, **não** a literais hardcoded.
   - `paddingLeft`/`paddingRight` e `justifyContent` alternam por `isMini` usando exatamente os valores capturados na Fase 1.4.5 (`expandedJustify`, `miniJustify`, `--shell-aside-header-px-expanded`, `--shell-aside-header-px-mini`).
   - Os valores em `admin-shell.tokens.css` (px/rem) batem com a evidência (snippet HTML) anotada na Fase 1.4.6 — sem "arredondamentos razoáveis".
   - Em particular, quando o template original centraliza o logo no estado mini (`miniJustify === "center"`), o JSX precisa refletir isso literalmente; não aceitar `flex-start` como fallback silencioso.

4.0. **Cross-check independente do logo (não depende da classificação `kind`).** Este passo confere a paridade entre o template fonte e a saída, sem confiar em decisões anteriores — o objetivo é pegar o erro clássico em que o gerador classifica como `text-only` por inércia mesmo quando há `<img>` no template.

   Procedimento:
   - **Lado fonte:** contar `<img>` distintos (deduplicados por `src`) nos wrappers de brand do HTML principal — exatamente o `logoImageCount` da Fase 0.6 + lista `logoAssetPaths[]`. Descartar variantes do tema oposto (ex.: `dark:hidden`/`hidden dark:block` quando o tema padrão é `light`).
   - **Lado destino:** listar `public/template/admin/logo/` (se existir).
   - **Lado código:** `grep -E '<img|src=' src/shared/template/admin/logo.component.tsx` — contar `<img>` renderizados.

   Regras de paridade:

   | situação fonte | destino esperado | código esperado |
   | -------------- | ---------------- | --------------- |
   | `logoImageCount === 0 && logoHasInlineSvg === false` | pasta `public/template/admin/logo/` **não criada** | `logo.component.tsx` sem nenhum `<img>` |
   | `logoImageCount === 0 && logoHasInlineSvg === true` | pasta **não criada** | `logo.component.tsx` contém `<svg>` inline literal do template |
   | `logoImageCount >= 1` | pasta criada com **exatamente** `expectedLogoFiles` arquivos (Fase 1) | `logo.component.tsx` referencia **cada** arquivo via `src="/template/admin/logo/<basename>"` |

   Se qualquer linha falhar, **voltar à Fase 3** e gerar/copiar o que falta. **Não relatar sucesso** com paridade quebrada. O sintoma típico desse furo é "logo do template virou texto" ou "imagem só aparece em um breakpoint".

4.0.1. **Visibility classes — checagem independente.** Quando `logoPlacement` da Fase 1.4.0 tem **duas linhas com breakpoints complementares** (ex.: aside `hidden xl:block`, topbar `xl:hidden`):

   - `admin-shell.tokens.css` precisa conter as duas regras CSS `.logo-aside-only` e `.logo-topbar-only` (ou `.logo-desktop-only`/`.logo-mobile-only`), com a media-query lendo `var(--shell-menu-bp)` ou seu valor literal em px.
   - `menu.component.tsx` envolve `<Logo placement="aside" />` em `<span className="logo-aside-only">` (ou equivalente).
   - `top-bar.component.tsx` (ou o `admin-shell.component.tsx` quando o slot do logo no topbar mora lá) envolve `<Logo placement="topbar" />` em `<span className="logo-topbar-only">`.
   - Se a tabela de placement tem **uma só linha**, nenhuma das classes acima deve estar presente — sua existência sem necessidade é também violação (ruído).

4. **Checklist de aceite** (Fase final do brief):

   | # | Critério | Como verificar |
   | - | -------- | -------------- |
   | 1 | `npm run build` passa | retorno do passo 1 |
   | 2 | `/dashboard` renderiza shell + `<div>Conteúdo</div>` | revisar `(private)/dashboard/page.tsx` + `(private)/layout.tsx`; conferir que aparece em `Route (app)` no log do build |
   | 3 | `src/app/page.tsx` e `src/app/layout.tsx` raiz inalterados | comparar com o estado pré-skill (`git diff` esperado: 0 linhas nesses arquivos) |
   | 4 | Cada breakpoint do template original é coberto | conferir tokens `--shell-bp-*` + ramos no `admin-shell.component.tsx` |
   | 5 | Toggle alterna entre estados (se template tem) | revisar `menu-toggle.component.tsx` + `use-menu-state.hook.ts` |
   | 6 | Nenhum arquivo fora da allowlist | passo 2 |
   | 7 | Nenhum item de conteúdo nas áreas | passo 3 |

5. **Relatório final** ao usuário, em uma única mensagem, contendo:
   - **Arquivos criados** (lista completa, paths relativos à raiz do projeto).
   - **Dependências instaladas** (com versão).
   - **Breakpoints implementados** (em px).
   - **Estados do menu suportados** (subset de `expanded | mini | mobile-open | mobile-closed`).
   - **Como visualizar:** `npm run dev` e abrir `http://localhost:3000/dashboard` (a rota `/` permanece servida pela página raiz preexistente do projeto).
   - **Notas** (se algum ícone foi substituído por fallback, se algum estado do template ficou de fora por ambiguidade, etc.).
   - **Toggle fidelity** (quando há toggle): estratégia de ícone (`inline-svg` ou `library`), nome dos ícones aberto/fechado quando `library`, e marcação explícita se algum aspecto (wrapper ou ícones) foi resolvido por fallback — para o usuário saber onde a fidelidade não é 100%.

## Acceptance criteria

- [ ] Build passa.
- [ ] Allowlist respeitada.
- [ ] Nenhuma pasta vazia, nenhum `.gitkeep`/marcador criado pela skill.
- [ ] Áreas vazias confirmadas.
- [ ] **Paridade do logo** (passo 4.0) verificada: contagem de `<img>` no template fonte === arquivos em `public/template/admin/logo/` === `<img>` referenciados no `logo.component.tsx`.
- [ ] **Visibility classes do logo** (passo 4.0.1) presentes se houver multi-placement, ausentes se houver placement único.
- [ ] Relatório enviado.

## Failure handling

- Build falha por erro de tipo/lint → corrigir e re-rodar; não pular.
- Allowlist violada → reverter o(s) arquivo(s) extra(s) antes de relatar sucesso.

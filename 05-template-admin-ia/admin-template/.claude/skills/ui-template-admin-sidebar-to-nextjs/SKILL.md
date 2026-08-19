---
name: ui-template-admin-sidebar-to-nextjs
description: Extrai e recria FIELMENTE apenas a estrutura de navegação (menu lateral / sidebar) de um template administrativo HTML/CSS/JS estático como componentes React em uma aplicação Next.js (App Router) já existente, preservando aparência, modos responsivos e estados visuais do original. Stack fixa — Next.js App Router + Tailwind CSS + TypeScript estrito + Client Components com `useState` para interatividade. Detecta o set de ícones do original (Lucide, Font Awesome, Heroicons, Tabler, Material) e instala a versão React correspondente; copia SVGs custom para `src/shared/template/admin/icons/` quando o template usa um set próprio. Toda saída fica confinada a `src/shared/template/admin/` (componentes, tipos, config, ícones) e a uma rota de exemplo por item folha em `src/app/(private)/(examples)/`. Tokens visuais (cores, larguras, spacing, tipografia, breakpoints, durações) são adicionados ao `tailwind.config` sob o namespace `adminMenu` para não colidir com tokens existentes; `globals.css` só é tocado para regras impossíveis em Tailwind (ex.: scrollbar custom). NÃO porta header, topbar, footer, breadcrumbs, dashboards, cards, layouts globais elaborados, nem qualquer componente fora de navegação — fidelidade > opinião, sem "melhorias" de design, sem internacionalização, sem autenticação. Dispara quando o usuário pede para "portar / converter / extrair / recriar / replicar" o menu/sidebar de um template admin (AdminLTE, Metronic, Tabler, Sneat, Vuexy, Materio, CoreUI, custom etc.) em React/Next.js, ou fornece uma pasta de template e diz "quero só o menu desse no meu Next", mesmo sem nomear "skill".
---

# ui-template-admin-sidebar-to-nextjs

Recria a navegação lateral de um template admin HTML em uma app Next.js já existente, **somente o menu**. Toda fidelidade vai para o original; nenhuma "melhoria" de design.

## Stack fixa (não negociável)

- Next.js App Router com `src/`
- Tailwind CSS (tokens extraídos sob namespace `adminMenu`)
- Client Components com `useState` para interatividade (toggle, expand, drawer)
- TypeScript estrito (sem `any` injustificado)
- Ícones: pacote React oficial do set usado pelo original (`lucide-react`, `@fortawesome/react-fontawesome` + `@fortawesome/free-solid-svg-icons` etc., `@heroicons/react`, `@tabler/icons-react`, `@mui/icons-material`, `react-icons` quando o template usa Boxicons/Remix/Feather sem wrapper React próprio); SVGs custom viram componentes em `src/shared/template/admin/icons/`. **A biblioteca instalada nesta skill é a biblioteca de ícones canônica do projeto inteiro** — topbar, primitivos, composites, charts e páginas (skills posteriores) DEVEM reutilizar o mesmo pacote. Por isso a detecção e a instalação são obrigatórias mesmo quando o sidebar tem poucos ícones.

## Entradas obrigatórias

1. **Caminho da pasta do template** (HTML/CSS/JS estático)
2. **Caminho da app Next.js de destino** (raiz com `src/`, Tailwind já configurado)

Se algum não estiver claro: PERGUNTAR antes de prosseguir. Verificar que o destino tem Tailwind; se não, instruir o usuário a instalá-lo antes.

## Saída — confinamento estrito (DUAS metades, decoupladas)

**Regra mestra:** a skill produz DUAS metades que ficam em pastas separadas e **nunca se misturam**:

1. **Metade genérica (shared)** — máquina de UI reutilizável, sem nenhum dado da aplicação. Outro projeto poderia copiar essa pasta e usar com outro menu completamente diferente.
2. **Metade de exemplo (app-side)** — espelho exato do menu do template, vivendo do lado da aplicação como dados/estado, consumindo a metade genérica. Serve como evidência visível de que a metade genérica funciona end-to-end.

**Por que essa separação importa:** sem a metade de exemplo, o final da skill é invisível (componentes existem mas o menu não renderiza). Sem o decoupling, o shared vira refém dos itens concretos do template e perde reuso. As duas metades juntas resolvem ambos os problemas.

### Pasta SHARED (genéricos, sem dados da app)

Permitido escrever em:

- `src/shared/template/admin/` — **apenas** componentes genéricos, tipos, contexts e ícones. Nenhuma string de label, nenhuma URL de rota, nenhum array de itens. Outros desenvolvedores devem conseguir ler essa pasta e não descobrir nada sobre o domínio da aplicação.
- `tailwind.config.{ts,js}` — sob `theme.extend.colors.adminMenu`, `theme.extend.spacing.adminMenu*`, etc.
- `src/app/globals.css` — só para o que Tailwind não cobre (scrollbar custom escopada)

### Pasta APP-SIDE (estado/exemplo, espelho do template)

Permitido escrever em:

- `src/modules/examples/admin-menu/menu.config.ts` — **árvore concreta** de `MenuNode[]` espelhando 1:1 o menu do template (todos os labels, hrefs, ícones e badges). Importa os tipos e ícones do shared.
- `src/modules/examples/admin-menu/menu-provider.tsx` — **wrapper Client Component** (`"use client"`) que importa `menuConfig` localmente e renderiza o `MenuConfigProvider` genérico do shared. Existe para resolver a fronteira RSC: ícones são `ComponentType` (funções) e não atravessam server→client como prop, então o array precisa ser importado *dentro* de código client.
- `src/app/(private)/(examples)/[...slug]/page.tsx` — **catch-all** que renderiza o nome derivado do path, dando uma página funcional para cada item do menu sem precisar de 60 arquivos.
- Patch em `src/app/(private)/layout.tsx` — embrulha o shell com `ExamplesMenuProvider` para o menu materializar.

### PROIBIDO

- Misturar as metades. `src/shared/template/admin/` **NUNCA** importa de `src/modules/examples/`. Se um componente do shared precisa de um dado concreto, esse componente está mal projetado.
- Criar `menu.config.ts` com array de itens em `src/shared/` (estado da app vai para `modules/examples/`).
- Criar rotas por item folha individualmente em `src/app/(private)/(examples)/` — usar o catch-all único. Quando o usuário for criar páginas reais depois, ele adiciona um arquivo específico que Next.js automaticamente prioriza sobre o catch-all.
- Criar header, topbar, footer, breadcrumbs, dashboards, cards, layouts elaborados — fora do escopo.

## Componentes — criar SOMENTE os que o original justificar

Componentes genéricos (consomem dados via props/context, **não importam menu.config**):

- `menu.component.tsx` — orquestrador, estado responsivo + collapsed; recebe `items: MenuNode[]` via prop ou via `MenuConfigContext`
- `menu-section.component.tsx` — título de seção (se existir no original)
- `menu-group.component.tsx` — item expansível com filhos (se existir)
- `menu-item.component.tsx` — folha (link com ícone + label)
- `menu-divider.component.tsx` — separador (se existir)

Auxiliares (apenas tipos e ícones — nunca dados):

- `menu.types.ts` — `MenuNode | MenuItem | MenuGroup | MenuSection | MenuDivider` (somente tipos)
- `menu-config.context.tsx` — `Provider` + `useMenuConfig()` (genéricos; o consumidor injeta o `items`)
- `icons/` — SVGs convertidos em React (genéricos, sem associação a item específico)

A árvore concreta de itens (`menu.config.ts` com labels/hrefs reais) vive **fora do shared**, em `src/modules/examples/admin-menu/menu.config.ts`. Esta skill escreve esse array como **evidência visível**: ele espelha 1:1 o menu do template e é consumido pelo catch-all de rotas em `(private)/(examples)/[...slug]/page.tsx`. O usuário final substitui esse arquivo pelo menu real da app dele, mas o exemplo permanece como contrato funcional de "isto compila e renderiza".

**Wrapper client obrigatório.** Como `menuConfig` contém `icon: ComponentType` (funções) e o `(private)/layout.tsx` é Server Component por default, passar `menuConfig` direto via prop do server para o `MenuConfigProvider` (client) **falha em build** com `Functions cannot be passed directly to Client Components`. Por isso a skill cria `menu-provider.tsx` `"use client"` que importa `menuConfig` localmente — o array nunca atravessa a fronteira RSC.

## Fluxo (passos sequenciais, gate em cada um)

### 1. Inspeção do template

#### 1a — Localizar arquivos relevantes

- Listar HTMLs; identificar os que contêm `<aside>`, `.sidebar`, `.menu`, `.navigation` ou similares
- Identificar CSS(s) com regras que afetam o sidebar (busca por seletores encontrados no HTML)
- Identificar JS(s) que tocam no sidebar (classes de toggle, data-attributes, IDs)

#### 1b — Extrair árvore semântica → JSON

Rodar `scripts/extract-menu-tree.mjs <html> <selector>` para gerar JSON `MenuNode[]` com `{type, label, icon, href, children}`. Conferir manualmente contra o HTML.

Se o script falhar (template muito atípico): Claude extrai lendo o HTML diretamente, **mas SEMPRE produz o mesmo JSON intermediário** antes de gerar código.

#### 1c — Extrair tokens visuais (lendo CSS)

Antes de mapear, ler `references/inspection-checklist.md`. Extrair:

- **Cores**: bg sidebar, bg hover, bg ativo, texto (default/hover/ativo), ícone, divisor, indicador lateral do ativo
- **Cores de badge** (se o template tem selo "New", "Pro", contador, etc. ao lado de itens): bg inativo, bg ativo (ou hover), cor do texto. **Buscar literalmente** as classes/regras CSS que estilizam o badge (ex.: `.menu-dropdown-badge`, `.menu-dropdown-badge-active`) — não inferir das cores do menu, pois badges costumam usar uma paleta dedicada (success/warning) diferente do resto do sidebar. Sem essa extração, o badge sai sem fundo no código gerado.
- **Spacing**: largura full / mini, altura dos itens, paddings, gap ícone↔label, indentação dos filhos, gap entre seções
- **Tipografia**: family, size, weight do label e do título de seção
- **Breakpoints**: onde alterna full → mini → mobile
- **Transições**: duração e easing de colapso e drawer
- **Scroll**: scrollável? scrollbar custom (cor, largura)?
- **Estado ativo**: bg sólido / borda lateral / cor / tint de ícone
- **Modos responsivos**: enumerar (full / mini-collapsed / mobile-drawer / mobile-overlay / mobile-bottom-nav) — ver `references/responsive-modes.md`

#### 1d — Apresentar relatório de inspeção e PEDIR CONFIRMAÇÃO

Formato curto e tabular: árvore (resumida) + tabela de tokens + lista de modos responsivos + **tabela de comportamentos do passo 1e**. Não gerar código sem confirmação do usuário.

#### 1e — Inventário de comportamentos dinâmicos (CRÍTICO — não pular)

Tokens cobrem o estado *parado* do menu. Esta etapa cobre o estado *em movimento*: o que muda quando o usuário interage (hover, click, focus, navegação, resize) ou quando o estado interno do menu muda (collapsed, mode, route).

Antes de fechar a Fase 1, ler `references/dynamic-behaviors.md` por inteiro e executar:

1. **Varrer as cinco fontes** (CSS pseudo-classes, atributos de framework no HTML, listeners JS imperativos, animações declarativas, libs de terceiros) — cada match vira uma linha-candidata. Buscar literalmente os recortes da seção 1.1 do reference (`:hover`, `:focus-within`, `:has(...)`, `[aria-expanded]`, etc.) e os atributos da seção 1.2 (`@click`, `x-show`, `v-on`, `data-bs-toggle`, `onmouseenter`, ...).

2. **Validar cada candidato** abrindo o template no navegador (ou inferindo conservadoramente quando isso não for possível). Comportamento que está no código mas é sobrescrito por specificity maior **não conta** — descartar.

3. **Materializar a tabela do passo 4** do reference, com colunas: gatilho · alvo · efeito observado · evidência (linha/seletor) · recipe React/Next prevista (apontando para a seção 5.x do reference, ou marcando como "novo — pedir orientação" se não couber em 5.1–5.9).

4. **Regra dura**: a Fase 3 só pode terminar com **todas** as linhas da tabela tendo um arquivo + função/handler correspondente no código gerado. A Fase 5 confere isso linha a linha (gate "paridade de comportamentos"). Se algum comportamento não couber em recipes existentes, **parar antes de gerar código** e propor a tradução ao usuário; não cair em Framer Motion / Radix / outra dependência sem aprovação.

5. **Caso especial — vazio.** Se a varredura não encontrar nenhum gatilho dinâmico além dos tokens visuais, registrar literalmente "Nenhum comportamento dinâmico além dos tokens visuais" na tabela e seguir. Não inferir comportamentos por instinto. Não copiar comportamentos de templates anteriores ("o último admin que vi tinha hover-expand, então este também deve ter") — cada template é avaliado isoladamente.

A tabela inteira entra no relatório do passo 1d, **antes** da confirmação do usuário.

### 1f — Detecção e instalação da biblioteca de ícones (CRÍTICO — não pular, gate duro)

Esta etapa é **bloqueante**: a Fase 3 NÃO pode começar enquanto este gate não fechar. A biblioteca de ícones detectada aqui será reutilizada por todas as skills posteriores do pipeline (topbar, primitives, composites, pages), portanto a decisão é arquitetural — não pode ser adiada.

#### Passo 1 — Detecção de presença de ícones no menu original

Para cada item de menu da árvore extraída em 1b, verificar no HTML se há um elemento de ícone associado (irmão imediato ou ancestral próximo da label). Sinais que **contam como ícone**:

- Tag `<i class="...">` com classe de fonte de ícone (`fa-`, `fas`, `far`, `fab`, `bi-`, `bx-`, `ti-`, `mdi-`, `material-icons`, `feather`, `remixicon`, `iconify`, `lni-`, `ki-` (Keenicons/Metronic), etc.)
- Tag `<svg>` inline (custom ou de set como Heroicons/Lucide injetado)
- Tag `<img src="...">` apontando para arquivo `.svg`/`.png` em pasta `icons/`, `assets/icons/`, `images/icons/`
- `<span>` com classe de ícone OU com `background-image` de SVG/PNG no CSS
- `<use xlink:href="#icon-...">` (sprite SVG)
- Pseudo-elemento `::before` com `content: "\fXXX"` aplicado a uma classe usada nos itens (Font Awesome / Material via CSS)

Resultado da varredura: para CADA item da árvore, marcar `hasIcon: true | false` e, se `true`, capturar o identificador (`fa-home`, `bi-house`, `<svg>` inline, caminho do arquivo).

#### Passo 2 — Decisão dura (regra binária)

- **Se ≥1 item tem ícone no original** → ícones são OBRIGATÓRIOS no gerado. Nenhum item original com ícone pode chegar ao código sem ícone correspondente. **Falhar fechado**: se a detecção apontar ícones e o código final não os tiver, a skill ABORTA e refaz a Fase 3.
- **Se NENHUM item tem ícone no original** → o gerado NÃO PODE adicionar ícones. Nada de "completar" com Lucide por estética. Fidelidade > opinião.
- **Misto** (alguns itens com ícone, outros sem) → replicar exatamente o padrão original, item a item. Nunca uniformizar (nem adicionar onde falta, nem remover onde tem).

#### Passo 3 — Identificar a biblioteca

Mapear o sinal detectado para o pacote React correspondente:

| Sinal no template | Pacote React a instalar |
|---|---|
| `fa-`, `fas`, `far`, `fab`, `fa-solid` | `@fortawesome/react-fontawesome` + `@fortawesome/fontawesome-svg-core` + `@fortawesome/free-solid-svg-icons` (e `free-regular-svg-icons`/`free-brands-svg-icons` conforme uso) |
| `bi-` (Bootstrap Icons) | `react-icons` (subpath `react-icons/bi`) OU `react-bootstrap-icons` |
| `bx-`, `bxs-` (Boxicons) | `react-icons/bi` (Boxicons) |
| `ti-` (Tabler Icons) | `@tabler/icons-react` |
| `mdi-` (Material Design Icons) | `@mdi/react` + `@mdi/js` |
| `material-icons` | `@mui/icons-material` (ou `react-icons/md`) |
| `feather` | `react-feather` ou `lucide-react` (Lucide é o fork mantido) |
| `remixicon`, `ri-` | `react-icons/ri` ou `@remixicon/react` |
| Lucide inline (`<svg lucide-...>`) | `lucide-react` |
| Heroicons inline | `@heroicons/react` |
| `ki-` (Keenicons/Metronic) ou ícones proprietários | Copiar SVGs como componentes React em `src/shared/template/admin/icons/` |
| SVGs inline custom (sem set identificável) | Copiar como componentes React em `src/shared/template/admin/icons/` |
| Sprite SVG (`<use xlink:href>`) | Copiar o sprite e gerar wrappers em `src/shared/template/admin/icons/` |

Em caso de ambiguidade, perguntar ao usuário antes de instalar.

#### Passo 4 — Instalação (executar antes de gerar código)

Rodar `npm install <pacote>` (ou `pnpm add` / `yarn add` conforme o projeto) na raiz do destino. Confirmar que o `package.json` foi atualizado. Falha de instalação ABORTA a skill — não cair em fallback silencioso para outra biblioteca.

#### Passo 5 — Mapa nome→ícone

Produzir um mapa explícito `originalIconId → ReactIconComponent` cobrindo TODOS os ícones detectados no menu. Esse mapa entra no relatório do passo 1d e é usado na Fase 3 para resolver cada `<MenuItem>` ao seu ícone.

Para SVGs custom: criar um componente React por arquivo em `src/shared/template/admin/icons/<KebabName>.tsx`, exportando como `default` ou nomeado, mantendo `viewBox` e paths originais. Aceitar `className` para herdar cor via `currentColor`.

#### Passo 6 — Confirmação no relatório 1d

O relatório do passo 1d **deve incluir**:

1. Lista dos itens do menu com a coluna `hasIcon` preenchida.
2. Pacote escolhido + comando de instalação executado.
3. Mapa `originalIconId → componente React`.
4. Linha explícita: "Ícones são obrigatórios no gerado: SIM/NÃO" — derivada da regra dura do passo 2.

Sem essas quatro entradas no relatório, a confirmação do usuário não é válida e a Fase 3 não pode iniciar.

### 2. Mapeamento para Tailwind

Antes de patchar, ler `references/tailwind-token-mapping.md`.

Adicionar tokens sob namespace dedicado:

```ts
theme: {
  extend: {
    colors: {
      adminMenu: {
        bg: '#...',
        bgHover: '#...',
        bgActive: '#...',
        text: '#...',
        textActive: '#...',
        icon: '#...',
        divider: '#...',
      },
    },
    spacing: {
      adminMenuFull: '260px',
      adminMenuMini: '64px',
    },
    transitionDuration: {
      adminMenu: '300ms',
    },
  },
}
```

Valores fora da escala default do Tailwind: **adicionar literalmente** (`260px`), não aproximar para `w-64`. Fidelidade > convenção.

### 3. Geração de código (ordem obrigatória)

Antes de gerar, ler `references/component-templates.md` para snippets de referência.

**Metade SHARED (genéricos):**

1. `src/shared/template/admin/menu.types.ts` (apenas tipos, sem dados)
2. `src/shared/template/admin/menu-config.context.tsx` (Provider/hook genéricos; consumidor injeta `items`)
3. Patch em `tailwind.config` (incluindo tokens de badge se extraídos em 1c)
4. `menu-divider.component.tsx`, `menu-item.component.tsx` (folhas)
5. `menu-group.component.tsx`, `menu-section.component.tsx`
6. `menu.component.tsx` (orquestrador, lê `items` do context)
7. Patch em `globals.css` (só se necessário)

**Renderização do badge — regra dura:** se 1c extraiu cores de badge, o `menu-item.component.tsx` e `menu-group.component.tsx` DEVEM usar essas cores literalmente (via classes Tailwind hardcoded ou tokens `adminMenu.badgeBg` etc.). PROIBIDO referenciar variáveis CSS que ninguém definiu (ex.: `bg-[var(--color-adminMenu-badge-bg)]` quando o token não está no tailwind.config) — esse foi um modo de falha real: componente renderiza sem fundo porque a var não existe.

**Metade APP-SIDE (espelho do template, evidência visível):**

8. `src/modules/examples/admin-menu/menu.config.ts` — `menuConfig: MenuNode[]` espelhando 1:1 a árvore extraída em 1b. Importa tipos de `@/shared/template/admin/menu.types` e ícones de `@/shared/template/admin/icons`. Todos os labels, hrefs, ícones e badges preservados. Hrefs apontam para paths que combinam com o catch-all do passo 10 (sem prefixo `/examples` — o `(examples)` é route group e some da URL).
9. `src/modules/examples/admin-menu/menu-provider.tsx` — `"use client"`, importa `menuConfig` localmente, renderiza `<MenuConfigProvider items={menuConfig}>{children}</MenuConfigProvider>`. Esse arquivo é o **único lugar** onde o array atravessa a fronteira para o client; o layout server NUNCA importa `menuConfig`.
10. `src/app/(private)/(examples)/[...slug]/page.tsx` — catch-all que lê `params: Promise<{ slug: string[] }>`, mapeia segmentos para um label legível (kebab-case → Title Case, segmentos juntados com " / "), e renderiza `<div>{label}</div>`. Uma página só, todos os itens do menu funcionam.
11. Patch em `src/app/(private)/layout.tsx` — embrulha o shell com `<ExamplesMenuProvider>` (fora do `MenuStateProvider` para que o config esteja disponível em todo lugar). Exemplo de wiring esperado:

    ```tsx
    import { ExamplesMenuProvider } from "@/modules/examples/admin-menu/menu-provider";

    export default function PrivateLayout({ children }: { children: ReactNode }) {
      return (
        <ExamplesMenuProvider>
          <MenuStateProvider>
            <AdminShell>{children}</AdminShell>
          </MenuStateProvider>
        </ExamplesMenuProvider>
      );
    }
    ```

**Rotas individuais por item folha NÃO são criadas.** O catch-all cobre 100% da navegação para fins de evidência. Quando o usuário criar páginas reais depois, ele adiciona arquivos específicos em `(examples)/<segmentos>/page.tsx` — Next.js prioriza estático sobre catch-all automaticamente, então nenhum conflito.

**Ícones — regra dura na geração:**

- O componente `menu-item.component.tsx` DEVE aceitar `icon?: ReactNode` (ou `icon?: ComponentType<{className?: string}>`) e renderizá-lo quando presente, com o mesmo posicionamento, tamanho e cor (via `currentColor`) do original.
- O `MenuNode` em `menu.types.ts` DEVE ter o campo `icon` tipado adequadamente para o pacote escolhido na Fase 1f. Sem `icon` no tipo, a skill `pages` não consegue passar o ícone — falha de contrato.
- Se a Fase 1f decidiu "ícones obrigatórios": `menu-item.component.tsx` deve ter um caminho de renderização com ícone e o mapa de ícones do passo 1f-5 deve estar disponível (re-exportado em `src/shared/template/admin/icons/index.ts`) para a skill `pages` consumir.
- Se a Fase 1f decidiu "sem ícones": `menu-item.component.tsx` ainda pode ter o slot opcional, mas a skill NÃO instala biblioteca de ícones e NÃO importa nenhum pacote de ícones.
- Importação do pacote: usar import nomeado por ícone (`import { Home } from 'lucide-react'`) — nunca import default barrel que arrasta tree-shaking quebrado.

Padrões obrigatórios:

- Componentes com estado: `"use client"` no topo, `useState` para collapsed/groupOpen, `useEffect` + `matchMedia` para breakpoint mobile
- Item ativo: derivar de `usePathname()` — match exato OU prefixo, conforme o original tratar
- Drawer mobile: overlay `fixed inset-0`, fecha em clique fora, ESC, e botão X se o original tiver
- Persistir collapsed em `localStorage` SOMENTE se o original o fizer; ler em `useEffect` (nunca em `useState` initializer) para evitar hydration mismatch
- Transições: classes Tailwind `transition-[width] duration-adminMenu ease-in-out` (ou o easing do original)
- Scroll: `overflow-y-auto` na área correta; scrollbar custom via `globals.css` com seletores escopados se o original tiver

**Tradução de comportamentos dinâmicos (passo 1e):**

Para cada linha da tabela do passo 1e, aplicar a recipe correspondente em `references/dynamic-behaviors.md` §5 ao arquivo certo:

- Comportamentos no nível do `<aside>` (hover-expand, persist collapsed, click-fora, ESC, scroll-lock do body) → `menu.component.tsx`.
- Comportamentos no nível do grupo (auto-abrir quando contém ativo, rotação de seta) → `menu-group.component.tsx`.
- Comportamentos no nível do item (tooltip em mini, prefetch on hover, atalho que foca) → `menu-item.component.tsx`.
- Atalhos globais e listeners de roteamento (auto-fechar drawer ao navegar) → `menu.component.tsx` em `useEffect` que depende de `usePathname()`.

**Manter referência cruzada explícita.** Cada handler/`useEffect` introduzido por essa tradução leva um comentário curto apontando para o número da linha da tabela 1e (`/* behavior #N: hover reveals labels in mini */`). A Fase 5 grep esses marcadores para validar paridade.

### 3.1 Verificação de paridade ANTES de fechar a Fase 3

Iterar a tabela do passo 1e e confirmar que **cada linha** tem:

1. Um arquivo concreto (ex.: `menu.component.tsx`) onde o comportamento foi implementado.
2. Um símbolo concreto (estado, handler, ou efeito) que carrega o comportamento.
3. Um comentário `behavior #N` no código apontando para a linha correspondente.

Se faltar qualquer dos três para qualquer linha, voltar a 3.* e completar. Não fechar Fase 3 com tabela parcial.

### 4. Evidência visível (gate duro — não pular)

A skill SÓ fecha se o menu renderiza de fato. Não basta TypeScript compilar — a primeira execução real falhou justamente porque os componentes existiam mas nenhum config era injetado e o usuário viu uma área de menu vazia.

Antes de declarar concluído, executar e validar:

1. **`npm run build` passa sem erros.** Especialmente: nenhum `Functions cannot be passed directly to Client Components` (sinal de que o wrapper client do passo 9 está mal colocado), nenhum `Cannot find module @/modules/examples/admin-menu/...` (sinal de path/alias errado).
2. **Diff árvore extraída (1b) × `menuConfig` gerado (passo 8):** cada item folha do template está presente no array, com mesmo label, mesmo ícone (ou ausência dele), mesmo badge (ou ausência dele). Contar nós e comparar.
3. **Cada href no `menuConfig` resolve no catch-all.** Como o catch-all matcha `[...slug]`, qualquer href com ao menos um segmento (ex.: `/calendar`, `/dashboard/ecommerce`) é coberto. Hrefs `"#"` ou vazios são proibidos — substituir por path real derivado do label/key.
4. **`(private)/layout.tsx` realmente embrulha com `ExamplesMenuProvider`** — grep o arquivo e confirmar o import + o JSX. Esquecer o wiring é o modo de falha mais comum.

Se algum dos quatro pontos falha, voltar à Fase 3 e corrigir. NÃO entregar a skill com qualquer um pendente.

O JSON da árvore extraído em 1b é incluído no relatório final apenas como documentação do que foi espelhado — não é um artefato consumível por outra skill.

## Critérios de aceitação (auto-verificar antes de finalizar)

- [ ] **Fase 1f executada e relatada**: varredura de ícones por item, decisão binária registrada, biblioteca instalada (ou explicitamente "nenhuma" quando o original não tem ícones), mapa `originalIconId → componente React` no relatório
- [ ] **Paridade de ícones — gate duro**: se o original tem ícones em N itens, o gerado tem ícones nos MESMOS N itens (mesmos itens, não só mesma quantidade). Validar comparando a árvore extraída em 1b com o array final consumido pela skill `pages` — diff item a item, coluna `hasIcon` original vs gerada deve ser idêntica. Se divergir, ABORTAR e refazer Fase 3.
- [ ] **Pacote de ícones presente no `package.json`** quando a decisão da Fase 1f foi "ícones obrigatórios" — confirmar com `cat package.json | grep <pacote>`
- [ ] **`MenuNode.icon` está no tipo** em `menu.types.ts` e `menu-item.component.tsx` renderiza o ícone quando recebido
- [ ] **Nenhum ícone inventado**: itens que não tinham ícone no original continuam sem ícone no gerado
- [ ] Tokens extraídos no `tailwind.config` sob namespace `adminMenu`
- [ ] Todos os modos responsivos do original presentes e funcionais
- [ ] Largura, cores, spacing, tipografia visualmente idênticos em cada modo (lado a lado, não "parecido")
- [ ] Item ativo com o mesmo padrão visual do original
- [ ] Hover, focus, grupo expandido replicados
- [ ] Scroll da área de menu se comporta como no original
- [ ] Transições com mesma duração e easing
- [ ] Toggle mobile abre/fecha overlay/drawer conforme o original
- [ ] **Inventário de comportamentos do passo 1e materializado como tabela e incluído no relatório do passo 1d**
- [ ] **Paridade de comportamentos: cada linha da tabela 1e tem arquivo + símbolo + comentário `behavior #N` no código gerado** — validar com grep `behavior #` e contar contra o número de linhas da tabela
- [ ] **Nenhum comportamento foi inventado** que não estava no template original (ex.: persistência em `localStorage` que o original não tinha, atalho de teclado que o original não tinha)
- [ ] **Decoupling preservado:** `src/shared/template/admin/` não contém nenhum label, href ou array de itens; `grep -r "href\|label:" src/shared/template/admin/` retorna só ocorrências em tipos/comentários, nunca dados concretos
- [ ] **Shared não importa de examples:** `grep -r "from.*modules/examples" src/shared/` retorna vazio
- [ ] **`menuConfig` existe em `src/modules/examples/admin-menu/menu.config.ts`** e espelha 1:1 a árvore extraída em 1b (mesmos labels, hrefs, ícones, badges)
- [ ] **`menu-provider.tsx` existe com `"use client"` no topo** e é o único lugar que importa `menuConfig`
- [ ] **`src/app/(private)/(examples)/[...slug]/page.tsx` existe** e renderiza um label derivado dos segmentos do path
- [ ] **`(private)/layout.tsx` embrulha o shell com `ExamplesMenuProvider`** — confirmar com leitura do arquivo
- [ ] **`npm run build` passa** sem erros de RSC boundary, sem module-not-found
- [ ] **Badges do template aparecem renderizados com cor** — se 1c extraiu cores de badge, os componentes do shared usam essas cores literalmente (não referenciam vars CSS indefinidas)
- [ ] Nenhum componente extra além de navegação
- [ ] Nenhuma rota individual por item folha em `src/app/(private)/(examples)/` (apenas o catch-all)
- [ ] Sem erros de hydration (estado client-only lido em `useEffect`)
- [ ] TypeScript compila sem erros, sem `any` injustificado

## Não-escopo (explícito)

- Não portar header, topbar, breadcrumbs, footer, widgets, dashboards
- Não criar layouts globais além do mínimo para o menu funcionar
- Não adicionar deps além do pacote de ícones do original (não usar Framer Motion, Radix, headless-ui, shadcn — `useState` resolve)
- Não "melhorar" o design — fidelidade > opinião
- Não internacionalizar labels (manter idioma do template)
- Não implementar autenticação apesar do `(private)`
- Não usar CSS Modules, styled-components ou CSS-in-JS — Tailwind first; `globals.css` só para o que Tailwind não cobre

## Estrutura desta skill

```
ui-template-admin-sidebar-to-nextjs/
├── SKILL.md
├── references/
│   ├── inspection-checklist.md
│   ├── tailwind-token-mapping.md
│   ├── responsive-modes.md
│   ├── dynamic-behaviors.md          ← descoberta + recipes para hover/click/focus/persistence/etc.
│   └── component-templates.md
└── scripts/
    └── extract-menu-tree.mjs
```

Progressive disclosure: SKILL.md aponta quando ler cada referência (ver passos 1c, **1e**, 2 e 3). `extract-menu-tree.mjs` falha graciosa quando o seletor não encontra — nesse caso Claude faz a extração manualmente, mas sempre produzindo o JSON intermediário antes de gerar código.

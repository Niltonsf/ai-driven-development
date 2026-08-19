# Skill a ser criada: `ui-template-admin-sidebar-to-nextjs`

## Objetivo

Gerar uma skill que, dado um template administrativo em HTML/CSS/JS estático,
extrai e recria FIELMENTE apenas a estrutura de navegação (menu lateral) como
componentes React em uma aplicação Next.js (App Router), preservando aparência,
comportamento responsivo e estados visuais do original — sem reimplementar
nenhuma outra parte do template. A skill deve funcionar com qualquer template
admin (AdminLTE, Metronic, Tabler, Sneat, Vuexy, Materio, CoreUI, custom, etc.)
independentemente do framework CSS de origem (Bootstrap, Tailwind, custom).

## Quando a skill deve disparar

A skill deve ser usada SEMPRE que o usuário:

- pedir para "portar", "converter", "extrair", "recriar" ou "replicar" o menu/sidebar
  de um template admin HTML em React/Next.js
- mencionar qualquer template admin conhecido e pedir o menu/navegação em Next.js
- fornecer uma pasta de template e disser algo como "quero só o menu desse aqui no
  meu Next" — mesmo sem nomear "skill"
- pedir uma sidebar Next.js baseada em um design HTML existente

A skill NÃO deve ser usada para portar um template inteiro, apenas a navegação.

## Stack fixa (não negociável)

- **Next.js App Router** com `src/`
- **Estilização: Tailwind CSS** com tokens extraídos do template original
  (cores, spacing, breakpoints, tipografia mapeados para o `tailwind.config`)
- **Interatividade: Client Components com `useState`** (toggle de menu, expansão
  de grupos, drawer mobile). Marcar com `"use client"` os componentes que tiverem
  estado; os puramente apresentacionais ficam server components.
- **Tipagem: TypeScript** estrito
- **Ícones**: se o template original usa Lucide, usar `lucide-react`; se usa
  Font Awesome, Heroicons, Tabler Icons ou Material Icons, usar a versão React
  oficial correspondente; se usa um set custom (SVGs próprios), copiar os SVGs
  para `src/shared/template/admin/icons/` e usar como componentes React.

## Entradas esperadas

1. **Caminho da pasta do template** (HTML/CSS/JS estático)
2. **Caminho da aplicação Next.js de destino** (raiz do projeto, com `src/`
   e Tailwind já configurado)

Se algum dos dois não estiver claro no contexto, a skill deve perguntar antes
de prosseguir. A skill deve verificar que o projeto Next.js destino tem Tailwind
instalado; se não tiver, instruir o usuário a instalá-lo antes de continuar.

## Saída esperada

Toda saída fica confinada a:

- `src/shared/template/admin/` — componentes do menu, tipos, config, ícones
- `src/app/(private)/(examples)/` — rotas de exemplo (uma por item-folha)
- `tailwind.config.{ts,js}` — adicionar tokens extraídos sob um namespace
  (`theme.extend.colors.adminMenu`, etc.) para não colidir com tokens existentes
- `src/app/globals.css` — apenas se o template precisar de regras impossíveis em
  Tailwind utilities (ex.: scrollbar custom). Manter ao mínimo.

Componentes (criar apenas os que o template original justificar):

- `menu.component.tsx` — container raiz; gerencia estado responsivo e collapsed
- `menu-section.component.tsx` — agrupador com título de seção (se existir no original)
- `menu-group.component.tsx` — item expansível com filhos (se existir no original)
- `menu-item.component.tsx` — item folha (link com ícone + label)
- `menu-divider.component.tsx` — separador (se existir no original)

Arquivos auxiliares permitidos:

- `menu.types.ts` — tipos `MenuNode`, `MenuItem`, `MenuGroup`, `MenuSection`, `MenuDivider`
- `menu.config.ts` — árvore de dados do menu, tipada
- `icons/` — SVGs custom convertidos em componentes React (se aplicável)

PROIBIDO criar: header, topbar, footer, breadcrumbs, dashboards, cards, layouts
globais elaborados, ou qualquer componente fora de navegação. PROIBIDO criar
componentes fora de `src/shared/template/admin/` exceto as `page.tsx` mínimas
das rotas de exemplo.

## Fluxo da skill (passos obrigatórios, nesta ordem)

### 1. Inspeção do template

Antes de gerar qualquer código, a skill deve:

**1a. Localizar arquivos relevantes:**

- Listar HTMLs do template; identificar os que contêm `<aside>`, `.sidebar`,
  `.menu`, `.navigation` ou similar
- Identificar CSS(s) com regras que afetam o sidebar (busca por seletores
  encontrados no HTML)
- Identificar JS(s) que tocam no sidebar (busca por classes de toggle,
  data-attributes, IDs do sidebar)

**1b. Extrair árvore semântica do menu** (parte mecânica, propensa a alucinação):

- Usar o script `scripts/extract-menu-tree.mjs` da skill (descrito abaixo) para
  produzir um JSON com `{type, label, icon, href, children}` recursivo
- Conferir manualmente o JSON contra o HTML antes de prosseguir
- Se o script falhar (template muito atípico), Claude faz a extração lendo o
  HTML diretamente — mas SEMPRE produzindo o mesmo JSON intermediário

**1c. Extrair tokens visuais** (parte interpretativa, Claude faz lendo CSS):

- **Cores**: background do sidebar, background hover, background do item ativo,
  cor do texto (default/hover/ativo), cor do ícone, cor da borda/divisor,
  background do indicador lateral do ativo se existir
- **Spacing**: largura do sidebar (full e mini), altura dos itens, padding
  interno horizontal/vertical, gap entre ícone e label, indentação dos filhos,
  espaço entre seções
- **Tipografia**: font-family, size, weight do label e do título de seção
- **Breakpoints**: em que largura o template alterna entre full → mini → mobile
- **Transições**: duração e easing do colapso e do drawer mobile
- **Scroll**: a área de menu é scrollável? scrollbar custom (cor, largura)?
- **Estado ativo**: como é marcado (background sólido, borda lateral, cor
  diferente, ícone com tint)?
- **Modos responsivos**: enumerar quais existem (full / mini-collapsed /
  mobile-drawer / mobile-overlay / mobile-bottom-nav) lendo CSS media queries
  e JS de toggle

**1d. Apresentar relatório de inspeção ao usuário** antes de gerar código, em
formato curto e tabular: árvore do menu (resumida), tabela de tokens, lista de
modos responsivos detectados. Pedir confirmação para prosseguir.

### 2. Mapeamento para Tailwind

Adicionar ao `tailwind.config` os tokens extraídos sob namespace dedicado:

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
      }
    },
    spacing: {
      adminMenuFull: '260px',
      adminMenuMini: '64px',
    },
    transitionDuration: {
      adminMenu: '300ms',
    }
  }
}
```

Spacing values específicos do template que não existam na escala Tailwind
default devem ser adicionados — não aproximar para `w-64` se o template usa
`260px`. Fidelidade > convenção Tailwind.

### 3. Geração de código

**Ordem:**

1. `menu.types.ts` — tipos
2. `menu.config.ts` — dados (a partir do JSON extraído na 1b)
3. `tailwind.config` patch — tokens
4. `menu-divider.component.tsx`, `menu-item.component.tsx` — folhas primeiro
5. `menu-group.component.tsx`, `menu-section.component.tsx`
6. `menu.component.tsx` — orquestrador
7. `globals.css` patch (apenas se necessário)
8. Rotas de exemplo

**Padrões obrigatórios:**

- Componentes com estado: `"use client"` no topo, `useState` para
  collapsed/groupOpen, `useEffect` + `matchMedia` para detectar breakpoint mobile
- Item ativo: derivar de `usePathname()` comparando com `href` (match exato OU
  prefixo, conforme o template original tratar — verificar)
- Drawer mobile: overlay com `fixed inset-0`, fecha em clique fora, ESC, e botão
  X se o original tiver
- Persistir collapsed em `localStorage` APENAS se o template original o fizer;
  ler em `useEffect` (não em `useState` inicializer) para evitar hydration mismatch
- Transições: usar classes Tailwind `transition-[width] duration-adminMenu 
ease-in-out` (ou o easing do original)
- Scroll: `overflow-y-auto` na área correta; scrollbar custom via `globals.css`
  com seletores escopados se o original tiver

### 4. Rotas de exemplo

Para cada item-folha do menu, gerar:
`src/app/(private)/(examples)/<slug>/page.tsx`

Onde `<slug>` é derivado do `href` do item original (remover barra inicial,
trocar `/` por aninhamento de pastas). Conteúdo:

```tsx
export default function Page() {
  return <div>{/* label do item original */}</div>;
}
```

Não criar `layout.tsx`, `loading.tsx`, `error.tsx`, `metadata`. Não criar
autenticação apesar do `(private)`.

## Critérios de aceitação (auto-verificar antes de finalizar)

- [ ] Tailwind config tem todos os tokens extraídos sob namespace `adminMenu`
- [ ] Todos os modos responsivos do template original estão presentes e funcionais
- [ ] Largura, cores, spacing e tipografia visualmente idênticos ao original em
      cada modo (comparar lado a lado — não "parecido")
- [ ] Item ativo destacado com o mesmo padrão visual do original
- [ ] Hover, focus e estados de grupo expandido replicados
- [ ] Scroll da área de menu se comporta como no original
- [ ] Transições/animações de colapso com mesma duração/easing
- [ ] Toggle mobile abre overlay/drawer fechável conforme o original
- [ ] Nenhum componente criado fora de `src/shared/template/admin/`
      (exceto `page.tsx` em `(examples)` e patches de `tailwind.config`/`globals.css`)
- [ ] Nenhum componente extra além de navegação foi criado
- [ ] Cada item folha tem rota de exemplo correspondente
- [ ] Nenhum erro de hydration (estado client-only lido em `useEffect`)
- [ ] TypeScript compila sem erros e sem `any` não justificado

## Não-escopo (explícito)

- Não portar header, topbar, breadcrumbs, footer, widgets, dashboards
- Não criar layouts globais além do mínimo para o menu funcionar
- Não adicionar dependências além do pacote de ícones correspondente ao original
  (não usar Framer Motion, Radix, headless-ui, shadcn — useState resolve)
- Não "melhorar" o design — fidelidade > opinião
- Não internacionalizar labels (manter idioma do template)
- Não implementar autenticação apesar do `(private)`
- Não usar CSS Modules, styled-components ou CSS-in-JS — Tailwind first,
  `globals.css` só para o que Tailwind não cobre

## Estrutura de arquivos da própria skill

ui-template-admin-sidebar-to-nextjs/
├── SKILL.md # fluxo principal, < 500 linhas
├── references/
│ ├── inspection-checklist.md # como ler HTML/CSS do template (detalhado)
│ ├── tailwind-token-mapping.md # padrões de mapeamento template → Tailwind
│ ├── responsive-modes.md # taxonomia de modos com exemplos
│ └── component-templates.md # snippets de referência dos 5 componentes
└── scripts/
└── extract-menu-tree.mjs # parser HTML → JSON da árvore do menu

**`scripts/extract-menu-tree.mjs`** (Node, sem dependências externas além de
`node-html-parser` ou similar via npx): recebe caminho do HTML e seletor do
sidebar, devolve JSON `MenuNode[]`. Falha graciosa se o seletor não encontrar —
nesse caso Claude faz a extração manualmente lendo o HTML.

**`references/`** seguem progressive disclosure: SKILL.md aponta quando ler
cada um (ex.: "antes de mapear tokens, ler `tailwind-token-mapping.md`").

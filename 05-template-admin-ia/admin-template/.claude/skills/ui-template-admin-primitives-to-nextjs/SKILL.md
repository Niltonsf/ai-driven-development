---
name: ui-template-admin-primitives-to-nextjs
description: Extrai e recria FIELMENTE apenas os componentes primitivos de UI (Button, IconButton, Input, Textarea, Label, FormField, Select, Checkbox, Radio, Switch, Badge, Chip, Tag, Avatar, Alert, Tooltip, Divider, Spinner, Progress) de um template administrativo HTML/CSS/JS estático como componentes React reutilizáveis em uma aplicação Next.js (App Router) já existente, preservando aparência, variantes, tamanhos e estados (default/hover/focus/active/disabled/error/loading) do original. Stack fixa — Next.js App Router + Tailwind CSS + TypeScript estrito + class-variance-authority (CVA) para variantes + clsx + tailwind-merge via helper `cn()` + forwardRef em todo primitivo interativo. Usa elementos HTML nativos sempre que possível; Radix UI primitives apenas como base de comportamento quando o nativo não cobre o caso (ex.: dropdown custom estilizado), com justificativa em comentário. Detecta a biblioteca de ícones já instalada e reutiliza. Toda saída fica confinada a `src/shared/components/ui/` (um arquivo por primitivo, `index.ts` com re-exports nomeados) e ao helper `src/shared/utils/cn.ts`. Tokens visuais (cores por variante, spacing, radius, shadows, focus-rings, tipografia) são adicionados ao `tailwind.config` sob o namespace `ui` para não colidir com namespaces existentes; `globals.css` só é tocado para regras genuinamente impossíveis em Tailwind utilities. Cria APENAS primitivos que o template original justifica (presença em ≥2 páginas OU controle de formulário) — sem componentes especulativos, sem shadcn/ui, sem headless-ui, sem Mantine/Chakra/MUI; recria a partir do template, não importa um design system pronto. NÃO gera shell, layout, navegação, header, footer, breadcrumbs, dashboards, cards de conteúdo, modais com lógica de negócio, datepickers, tabelas, paginação, formulários completos, telas de exemplo, tema dark, toggle de tema, testes ou Storybook — fidelidade > opinião, sem "melhorias" de design, sem internacionalização. Dispara quando o usuário pede para "extrair / portar / recriar / replicar" os botões, inputs, form controls, primitivos, UI kit, design system básico ou componentes base de um template admin (AdminLTE, Metronic, Tabler, Sneat, Vuexy, Materio, CoreUI, custom etc.) em React/Next.js, ou fornece uma pasta de template e pede explicitamente componentes em `shared/components/ui` ou equivalente.
---

# ui-template-admin-primitives-to-nextjs

Recria os **componentes primitivos de UI** de um template admin HTML em uma app Next.js já existente, **somente os primitivos**. Toda fidelidade vai para o original; nenhuma "melhoria" de design.

## Stack fixa (não negociável)

- **Next.js App Router** com `src/`
- **Tailwind CSS** (tokens extraídos sob namespace `ui`)
- **TypeScript estrito** (sem `any` injustificado)
- **class-variance-authority (CVA)** — única biblioteca de variantes permitida
- **clsx + tailwind-merge** — via helper `cn()` em `src/shared/utils/cn.ts`
- **Radix UI primitives (apenas behavior)** — somente quando o HTML nativo não cobre o caso, justificado em comentário
- **forwardRef + displayName** em todo primitivo interativo
- **Ícones**: a biblioteca já instalada no projeto (Lucide / Font Awesome / Tabler / Heroicons / Material). Se nenhuma estiver instalada e o template usar ícones, perguntar antes.

## Entradas obrigatórias

1. **Caminho da pasta do template** HTML/CSS/JS estático
2. **Caminho da raiz do projeto Next.js destino** (com `src/` e Tailwind já configurado)

Se algum dos dois não estiver claro, perguntar antes de prosseguir.

## Saída — caminhos permitidos

```
src/shared/components/ui/
├── <primitivo>.component.tsx     # um arquivo por primitivo
├── <primitivo-composto>/         # pasta apenas se o primitivo se quebra em sub-arquivos
└── index.ts                      # re-exports nomeados
src/shared/utils/cn.ts            # helper, criar se não existir
tailwind.config.{ts,js}           # patch sob namespace `ui`
src/app/globals.css               # somente se Tailwind genuinamente não cobrir
```

**Proibido escrever em qualquer outro caminho.**

## Pré-requisitos (assumidos)

- Projeto Next.js App Router já criado, com `src/`, `tailwind.config.{ts,js}`, `src/app/globals.css` e `src/app/layout.tsx`.
- Tailwind funcional (build do projeto passa antes desta skill rodar).
- A skill instala automaticamente: `class-variance-authority`, `clsx`, `tailwind-merge` (e Radix sob demanda, com confirmação).

---

## Fluxo (5 fases sequenciais — não pular)

### Fase 0 — Reconhecimento

1. Confirmar caminho do template e da app Next.js.
2. Verificar `package.json` da app: presença de `tailwindcss`, `class-variance-authority`, `clsx`, `tailwind-merge`. Listar o que falta.
3. Detectar biblioteca de ícones em uso (`lucide-react`, `@fortawesome/react-fontawesome`, `@heroicons/react`, `@tabler/icons-react`, `@mui/icons-material`). Anotar.
4. Listar os HTMLs do template e marcar os com maior densidade de UI (tipicamente `forms.html`, `buttons.html`, `components.html`, `ui-elements.html`, `cards.html`, `form-elements.html`).
5. Instalar dependências faltantes em uma única chamada: `npm install class-variance-authority clsx tailwind-merge`.
6. **Detecção do tema ativo (OBRIGATÓRIO — single-theme)**. Esta skill gera componentes para **um único tema** — nunca dois ao mesmo tempo. Determinar qual:
   - Inspecionar `<html>`/`<body>` dos HTMLs do template (atributos `class="dark"`, `data-theme="dark|light"`, `data-bs-theme`, `data-layout-mode`, etc.) e a folha de estilo principal carregada por padrão.
   - Verificar o estado inicial em JS de toggle (`localStorage.theme`, `defaultTheme`, classe inicial aplicada antes de qualquer interação).
   - Comparar a cor de background do `body`/contêiner principal: claro (≥ #E8) → tema claro; escuro (≤ #2A) → tema escuro.
   - Se o template suporta ambos mas **um é o padrão**, usar o padrão. Se ambíguo ou indeterminado, **assumir tema CLARO** (default) e registrar a decisão.
   - Registrar `activeTheme: "light" | "dark"` no plano. Toda extração de cor da Fase 2 sai **exclusivamente** das regras CSS efetivas para esse tema.

**Gate**: dependências instaladas, biblioteca de ícones identificada, lista de HTMLs candidatos pronta, **`activeTheme` definido e registrado**. Sem isso, parar.

### Fase 1 — Inventário de primitivos

Rodar o script de varredura:

```bash
node .claude/skills/ui-template-admin-primitives-to-nextjs/scripts/extract-ui-inventory.mjs <caminho-do-template>
```

O script imprime JSON com contagens de tags e classes candidatas a primitivos por arquivo. Se o script falhar (estrutura atípica), fazer a inspeção manual lendo HTMLs/CSS — o objetivo final é o mesmo: produzir mentalmente uma tabela:

| primitivo | seletor/classe no template | variantes | tamanhos | estados | nº de páginas |

**Critério de inclusão**:
- aparece em **≥2 páginas distintas** do template, OU
- é claramente um **controle de formulário** (input, textarea, select, checkbox, radio, switch, label).

Aparições únicas em uma página específica são conteúdo, não primitivo — descartar.

Antes de prosseguir, ler `references/primitives-catalog.md` (taxonomia) e `references/inspection-checklist.md` (mapa classe→primitivo por framework CSS).

**Gate**: tabela mental do inventário fechada, com decisão explícita por cada primitivo (incluir/descartar) e justificativa.

### Fase 2 — Extração de tokens

Para cada primitivo incluído, extrair do CSS do template **somente o que ele usa, e somente as regras efetivas no `activeTheme` definido na Fase 0**. Se o template tem variantes light/dark no CSS, ignorar completamente o conjunto não-ativo — não emitir `dark:` variants, não emitir tokens duplicados, não preparar terreno para troca de tema. A app gerada é single-theme:

- **Cores**: bg/border/text/hover/active/focus-ring/disabled por variante; estados error/success/warning para inputs.
- **Spacing**: paddings horizontais/verticais por tamanho, gap entre ícone e texto, altura de controles.
- **Tipografia**: font-size, weight, line-height por tamanho.
- **Border**: radius, width, cores por estado.
- **Shadow**: focus-ring, hover elevation.
- **Transitions**: duração e easing.
- **Sizes fixos**: avatar, switch knob, checkbox.

Adicionar ao `tailwind.config` sob `theme.extend` no namespace `ui`. **Nunca** sobrescrever tokens default do Tailwind; **nunca** aproximar valores — usar o valor exato do CSS do template.

Antes de escrever no config, ler `references/tailwind-token-mapping.md`.

**Gate**: patch do `tailwind.config` pronto mentalmente, sem colisões com namespaces existentes (verificar lendo o arquivo atual). Se já existir `ui.*` com conteúdo divergente, parar e pedir confirmação ao usuário.

### Fase 3 — Apresentação do plano

Apresentar ao usuário, em uma única mensagem:

1. **Lista de primitivos a criar**, com variantes/tamanhos/estados de cada.
2. **Lista de primitivos descartados** e por quê.
3. **Tabela resumida** dos tokens que serão adicionados ao Tailwind.
4. **Dependências a instalar** (se ainda houver — Radix sob demanda).
5. **Quais primitivos usarão Radix** e a justificativa por componente.

Pedir "ok" para prosseguir. **Não gerar código antes do ok**, exceto se o usuário tiver dito explicitamente "execute tudo sem confirmar".

### Fase 4 — Geração de código

Ordem obrigatória (das menores dependências para as maiores):

1. `src/shared/utils/cn.ts` (se não existir)
2. Patch do `tailwind.config` com tokens
3. Primitivos sem dependências internas: `divider`, `spinner`, `badge`, `chip`, `avatar`, `label`, `tag`, `progress`
4. Primitivos de formulário base: `input`, `textarea`, `checkbox`, `radio`, `switch`, `select`
5. Primitivos compostos: `form-field`, `radio-group`, `alert`, `button`, `icon-button`, `tooltip`
6. Patch de `globals.css` (apenas se necessário)
7. `src/shared/components/ui/index.ts` com re-exports nomeados

Antes de gerar componentes com variantes, ler `references/cva-patterns.md`. Para esqueletos de cada primitivo, consultar `references/component-templates.md`.

**Padrões obrigatórios para cada componente**:

- `forwardRef` em todo primitivo que envolve elemento interativo ou de formulário, com `displayName` definido (ex.: `Button.displayName = 'Button'`).
- Props extendendo o elemento HTML base (`extends ButtonHTMLAttributes<HTMLButtonElement>`, `extends InputHTMLAttributes<HTMLInputElement>`, etc.).
- Variantes via CVA quando houver ≥2 dimensões (variant × size). Para 1 variante simples binária, ternário direto é aceitável.
- `className` recebido como prop e mesclado via `cn()` — nunca sobrescrever, sempre compor por último.
- Spread de props HTML (`{...props}`) no elemento final.
- Acessibilidade que o template original sinaliza visualmente: `aria-invalid` em input com erro, `aria-disabled` em estados disabled visuais, `aria-busy` em loading, `aria-label` em IconButton sem texto, `role` quando apropriado.
- Componentes puramente visuais: server components (sem `"use client"`).
- Componentes com estado interno ou `useId`: `"use client"` no topo, **com comentário de uma linha** justificando.
- Comentários: zero, exceto justificar `"use client"` ou uso de Radix.

**Proibido**:
- hardcode de cores/medidas no JSX (sempre via tokens Tailwind do namespace `ui`)
- CSS-in-JS, styled-components, CSS Modules
- dependências fora da lista permitida (CVA, clsx, tailwind-merge, ícones já presentes, Radix justificado)
- "melhorias" de design — fidelidade > opinião
- shadcn/ui, headless-ui, Mantine, Chakra, MUI, daisyUI, Flowbite ou qualquer DS pronto
- **emitir variantes `dark:` (ou `light:`) — a app é single-theme, gerar somente o `activeTheme`**
- misturar cores do tema não-ativo nos tokens `ui.*`

### Fase 5 — Verificação

1. Rodar `npm run build` (ou `next build`) na raiz da app Next.js. Corrigir erros de tipo/lint.
2. Rodar `npx tsc --noEmit` se o build não cobrir tipos.
3. Reportar ao usuário, em uma única mensagem:
   - arquivos criados (caminhos)
   - dependências instaladas
   - tokens adicionados ao Tailwind (resumo)
   - primitivos gerados com variantes/tamanhos
   - sugestão para inspeção visual (criar página manual `/dev/ui` ou usar Storybook em skill futura — não escopo desta).

**Gate de aceite (auto-checar antes de finalizar)**:

- [ ] `npm run build` passa
- [ ] Todos os primitivos da Fase 1 foram gerados; nenhum extra fora do inventário
- [ ] Cada primitivo cobre as variantes/tamanhos/estados que o template demonstra
- [ ] Tokens idênticos ao original (não aproximados)
- [ ] `activeTheme` declarado (light|dark) e tokens extraídos somente desse tema; nenhuma classe `dark:`/`light:` emitida
- [ ] Estados hover/focus/active/disabled/error replicados
- [ ] `forwardRef` + `displayName` em todo primitivo interativo
- [ ] Acessibilidade básica (`aria-*`, label associado, foco visível)
- [ ] Tailwind config sob namespace `ui` sem colisão
- [ ] `globals.css` modificado só onde Tailwind genuinamente não cobre
- [ ] Nada criado fora de `src/shared/components/ui/` (exceto `cn.ts` em `src/shared/utils/`)
- [ ] Nada fora do escopo de primitivos (sem layout, sem navegação, sem páginas, sem composites)
- [ ] `index.ts` exporta tudo com nomes consistentes (PascalCase do componente; ex.: `export { Button } from './button.component'`)
- [ ] Sem erros de hydration

---

## Não-escopo (explícito)

- Layout, shell, navegação, header, footer, breadcrumbs
- Páginas de exemplo, dashboards, listagens, formulários completos
- Modais com lógica, drawers, datepickers, tabelas com paginação, sistemas de toast com fila
- Tema dark, toggle de tema
- Internacionalização
- Dependências fora da lista permitida
- Design systems prontos
- Opinar sobre o design (replicar, mesmo se feio)
- Testes, Storybook

## Arquivos de referência (progressive disclosure)

Ler somente quando a fase indicar:

- `references/primitives-catalog.md` — Fase 1 (taxonomia de primitivos)
- `references/inspection-checklist.md` — Fase 1 (mapa classe→primitivo por framework)
- `references/tailwind-token-mapping.md` — Fase 2 (CSS → tokens `ui.*`)
- `references/cva-patterns.md` — Fase 4 (esqueletos CVA)
- `references/component-templates.md` — Fase 4 (snippet por primitivo)

`scripts/extract-ui-inventory.mjs` — varredura HTML para JSON inicial (Fase 1).

# Prompt para geração de skill: `ui-template-admin-primitives-to-nextjs`

## Contexto

Quero que você gere uma skill do Claude Code (formato SKILL.md + arquivos de apoio) chamada **`ui-template-admin-primitives-to-nextjs`**. A skill será invocada dentro de um projeto Next.js (App Router) e tem como input uma pasta local contendo um template administrativo em HTML/CSS/JS puro. Seu output são os **componentes primitivos de UI** desse template, traduzidos para componentes React reutilizáveis em `src/shared/components/ui/`, preservando fielmente a aparência, variantes, estados e comportamentos do original.

A skill **não** gera shell de layout, **não** gera navegação/menu, **não** gera páginas. Ela é estritamente focada em **primitivos**: os tijolos visuais reutilizáveis que aparecem repetidamente ao longo do template (botões, inputs, selects, checkboxes, radios, switches, badges, etc.). É a skill que estabelece o "vocabulário visual" da aplicação.

A skill deve funcionar com qualquer template administrativo (AdminLTE, Metronic, Tabler, Sneat, Vuexy, Materio, CoreUI, custom), independentemente do framework CSS de origem (Bootstrap, Tailwind, custom CSS).

## Quando a skill deve disparar

A skill deve ser usada SEMPRE que o usuário:

- pedir para "extrair", "portar", "recriar" ou "replicar" os componentes primitivos / de UI / de formulário de um template admin em React/Next.js
- pedir "os botões", "os inputs", "os componentes de formulário", "o design system básico", "os primitivos" de um template HTML
- mencionar um template admin e pedir os "componentes base" / "UI kit" / "form controls" em Next.js
- fornecer uma pasta de template e pedir explicitamente componentes primitivos em `shared/components/ui` ou equivalente

A skill **NÃO** deve ser usada para:

- portar o template inteiro
- gerar shell/layout administrativo (essa é a skill `ui-template-admin-shell-to-nextjs`)
- gerar navegação/menu lateral (essa é a skill `ui-template-admin-sidebar-to-nextjs`)
- gerar componentes compostos (cards de dashboard, tabelas com paginação completa, modais com lógica de negócio) — apenas primitivos

## Stack fixa (não negociável)

- **Next.js App Router** com `src/`
- **Estilização: Tailwind CSS**, com tokens extraídos do template original adicionados em namespace dedicado no `tailwind.config` (ex.: `theme.extend.colors.ui`, `theme.extend.spacing.ui*`)
- **Variantes: `class-variance-authority` (CVA)** para componentes com múltiplas variantes (botões, badges, alerts). É a única dependência de variantes permitida.
- **Composição/utilitários**: `clsx` + `tailwind-merge` (via helper `cn()`) para concatenar classes condicionalmente. Helper fica em `src/shared/utils/cn.ts`.
- **Acessibilidade**: usar elementos nativos sempre que possível (`<button>`, `<input>`, `<label>`). Componentes que precisem de comportamento composto (select custom estilizado, switch, combobox) podem usar **Radix UI primitives sem estilização** apenas como base de comportamento — Radix é a única biblioteca de behavior permitida, e somente quando o elemento HTML nativo não cobre o caso. Justificar no comentário do componente quando Radix for usado.
- **Tipagem: TypeScript estrito**. Cada componente expõe `Props` extendendo do elemento HTML base (ex.: `ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>`).
- **Ícones**: usar a mesma biblioteca detectada/instalada pelas outras skills (Lucide / Font Awesome / Tabler / Heroicons / SVGs custom). Se nenhuma estiver instalada, perguntar antes de instalar.
- **Forwarding de ref**: todo primitivo que envolve um elemento de formulário ou interativo usa `forwardRef`.

## Entradas esperadas

1. **Caminho da pasta do template** (HTML/CSS/JS estático)
2. **Caminho da aplicação Next.js de destino** (raiz do projeto, com `src/` e Tailwind já configurado)

Se algum dos dois não estiver claro no contexto, a skill deve perguntar antes de prosseguir. A skill deve verificar que:

- o projeto Next.js destino tem Tailwind instalado e configurado
- existe `src/shared/components/` (criar `ui/` dentro se ainda não existir)
- `class-variance-authority`, `clsx` e `tailwind-merge` estão instalados; se não estiverem, instalar via `npm install` antes de gerar componentes

## Saída esperada

Toda saída fica confinada a:

- `src/shared/components/ui/` — um arquivo por primitivo (ou pasta quando o primitivo for composto, ex.: `select/`)
- `src/shared/utils/cn.ts` — helper de classes (criar se ainda não existir)
- `tailwind.config.{ts,js}` — adicionar tokens extraídos sob namespace `ui` para não colidir com tokens existentes ou com tokens de outras skills (`adminMenu`, `adminShell`, etc.)
- `src/app/globals.css` — apenas para regras impossíveis em Tailwind utilities (ex.: estilização de scrollbar interna de select, animações keyframe muito específicas). Manter ao mínimo.

Estrutura típica gerada:

```
src/shared/components/ui/
├── button.component.tsx
├── icon-button.component.tsx           (se o template tiver variante distinta)
├── input.component.tsx
├── textarea.component.tsx
├── label.component.tsx
├── form-field.component.tsx             (wrapper label + control + helper + error, se houver padrão no template)
├── checkbox.component.tsx
├── radio.component.tsx                  (item individual)
├── radio-group.component.tsx            (se o template padronizar agrupamento)
├── switch.component.tsx
├── select.component.tsx                 (nativo estilizado por padrão; Radix só se o template usa custom dropdown)
├── badge.component.tsx
├── chip.component.tsx                   (apenas se distinto de badge no template)
├── avatar.component.tsx
├── alert.component.tsx
├── tooltip.component.tsx                (somente se aparecer recorrentemente no template)
├── tag.component.tsx                    (apenas se distinto de badge/chip no template)
├── divider.component.tsx
├── spinner.component.tsx
├── progress.component.tsx
└── index.ts                             (re-exports nomeados)
```

**Regra de criação**: criar **apenas** os primitivos que o template original justifica. Se o template não tem switch, não gerar switch. Se tem três variações distintas de botão, gerar uma única `button.component.tsx` com as três variantes via CVA. Se o template tem botão e icon-button como elementos visualmente distintos (e não apenas tamanho), separar em dois arquivos.

**PROIBIDO criar**: layouts, navegação, headers, breadcrumbs, dashboards, cards de conteúdo, modais com lógica de negócio, datepickers, tabelas, paginação, formulários completos, telas de exemplo. PROIBIDO criar componentes fora de `src/shared/components/ui/` (exceto o helper `cn.ts`).

## Fluxo da skill (passos obrigatórios, nesta ordem)

### Fase 0 — Reconhecimento

1. Aceitar (ou perguntar) o caminho da pasta do template e da aplicação Next.js destino.
2. Verificar Tailwind, CVA, clsx, tailwind-merge no projeto destino. Instalar o que faltar.
3. Detectar a biblioteca de ícones em uso (compatível com as outras skills do conjunto).
4. Detectar o tema padrão do template (light por padrão; não criar toggle).
5. Listar os HTMLs do template e identificar os arquivos com maior densidade de exemplos de UI (geralmente `forms.html`, `buttons.html`, `components.html`, `ui-elements.html`, `cards.html`).

### Fase 1 — Inventário de primitivos

Varredura sistemática dos HTMLs do template, classificando cada elemento de UI recorrente. Para cada primitivo identificado, montar uma tabela:

| primitivo | seletor/classe no template | variantes encontradas | tamanhos | estados | aparece em quantas páginas |
| --------- | -------------------------- | --------------------- | -------- | ------- | -------------------------- |

Critério de inclusão: o primitivo aparece em **pelo menos 2 páginas distintas** do template OU é claramente um componente de formulário (input, select, checkbox, radio, switch, textarea, label). Aparições únicas em uma página específica geralmente são conteúdo, não primitivo.

Exemplos do que mapear:

- **Button**: variantes (primary, secondary, outline, ghost, link, danger, success), tamanhos (xs, sm, md, lg, xl), estados (default, hover, active, focus, disabled, loading), com/sem ícone à esquerda/direita
- **Input**: tipos (text, email, password, number, search), tamanhos, estados (default, focus, error, disabled, readonly), com/sem ícone, com/sem prefixo/sufixo, com/sem helper text, com/sem mensagem de erro
- **Select**: nativo vs custom dropdown (verificar JS do template)
- **Checkbox/Radio/Switch**: tamanhos, estados, com/sem label associado
- **Badge/Chip/Tag**: cores/variantes, com/sem ícone, com/sem botão de remover
- **Alert**: variantes semânticas (info, success, warning, error), com/sem ícone, com/sem botão de fechar, com/sem título
- **Avatar**: tamanhos, formato (círculo/quadrado), com/sem status indicator, fallback de iniciais

### Fase 2 — Extração de tokens

Extrair do CSS do template, **somente para os primitivos identificados na Fase 1**:

- **Cores**: cores de cada variante (background, border, text, hover, active, focus ring, disabled). Estados de validação (error/success/warning) para inputs.
- **Spacing**: paddings horizontais/verticais por tamanho, gap entre ícone e label, altura dos controles de formulário.
- **Tipografia**: font-size, font-weight, line-height por tamanho de cada primitivo.
- **Border**: border-radius por primitivo, border-width, cores de borda em cada estado.
- **Shadow**: box-shadow de focus ring, hover elevation (se houver).
- **Transitions**: duração e easing de hover/focus.
- **Sizes**: dimensões de elementos com tamanho fixo (avatar, switch knob, checkbox).

Adicionar ao `tailwind.config` sob namespace `ui`:

```ts
theme: {
  extend: {
    colors: {
      ui: {
        primary: { DEFAULT: '#...', hover: '#...', active: '#...', fg: '#...' },
        secondary: { ... },
        danger: { ... },
        // ...
        input: {
          bg: '#...',
          border: '#...',
          borderFocus: '#...',
          borderError: '#...',
          placeholder: '#...',
        },
      }
    },
    borderRadius: { uiSm: '4px', uiMd: '6px', uiLg: '8px' },
    boxShadow: { uiFocus: '0 0 0 3px rgba(...)' },
    fontSize: { /* somente se o template usa tamanhos fora da escala default */ },
  }
}
```

Valores específicos do template que não existam na escala Tailwind devem ser adicionados — não aproximar. Fidelidade > convenção.

### Fase 3 — Apresentação do plano

Antes de gerar código, apresentar ao usuário:

1. Lista de primitivos que serão criados (com variantes/tamanhos/estados de cada um).
2. Lista de primitivos descartados e motivo (não aparece o suficiente, é conteúdo, é composto).
3. Tabela resumida de tokens que serão adicionados ao Tailwind.
4. Dependências a instalar (se houver).
5. Quais primitivos usarão Radix (se algum) e a justificativa.

Pedir confirmação para prosseguir. Não gerar código antes do "ok".

### Fase 4 — Geração de código

Ordem obrigatória de geração (das menores dependências para as maiores):

1. `src/shared/utils/cn.ts` — helper se ainda não existir
2. Patch do `tailwind.config` com tokens
3. Primitivos sem dependências de outros primitivos: `divider`, `spinner`, `badge`, `chip`, `avatar`, `label`, `tag`, `progress`
4. Primitivos de formulário base: `input`, `textarea`, `checkbox`, `radio`, `switch`, `select`
5. Primitivos compostos: `form-field` (que pode usar `label` internamente), `radio-group`, `alert`, `button` (pode receber `spinner` como children no estado loading), `icon-button`, `tooltip`
6. Patch de `globals.css` (apenas se necessário)
7. `src/shared/components/ui/index.ts` com re-exports nomeados

**Padrões obrigatórios para cada componente:**

- Usar `forwardRef` em todo primitivo que envolve elemento interativo ou de formulário
- Props extendendo o elemento HTML base correspondente: `extends InputHTMLAttributes<HTMLInputElement>`
- Variantes via CVA quando houver mais de uma; para 2 variantes simples pode ser ternário direto, justificar a escolha
- `displayName` em todo `forwardRef` para debug (`Button.displayName = 'Button'`)
- Spread de props HTML nativas no elemento final (`{...props}`)
- `className` recebido como prop e mesclado via `cn()` — nunca sobrescrever, sempre compor
- Acessibilidade: `aria-*` em estados que o template original sinaliza visualmente (ex.: `aria-invalid` em input com erro, `aria-disabled` em button disabled, `aria-busy` em loading)
- Componentes puramente visuais: server components (sem `"use client"`)
- Componentes com estado interno (ex.: tooltip controlado, switch que precisa de useId): `"use client"` no topo, justificado em comentário

**Não fazer:**

- Sem hardcode de cores/medidas no JSX — sempre via tokens Tailwind
- Sem CSS-in-JS, sem styled-components, sem CSS Modules
- Sem dependências além das já listadas (CVA, clsx, tailwind-merge, ícones, Radix se justificado)
- Sem "melhorias" de design — fidelidade ao template original > opinião própria

### Fase 5 — Verificação

1. Rodar `npm run build` (ou `next build`) para validar compilação e tipos.
2. Reportar ao usuário:
   - lista de arquivos criados
   - dependências instaladas
   - tokens adicionados ao Tailwind
   - primitivos gerados com suas variantes/tamanhos
   - sugestão de como inspecionar visualmente (ex.: criar uma página `/dev/ui` em uma skill futura ou sugerir Storybook)
3. Se houver erros de tipo/lint, corrigir antes de encerrar.

## Critérios de aceitação (auto-verificar antes de finalizar)

- [ ] `npm run build` passa sem erros e sem `any` não justificado
- [ ] Todos os primitivos identificados como recorrentes na Fase 1 foram gerados
- [ ] Cada primitivo cobre todas as variantes, tamanhos e estados encontrados no template original
- [ ] Tokens visuais (cores, spacing, radius, shadows, tipografia) idênticos ao original — comparação lado a lado, não "parecido"
- [ ] Estados hover, focus, active, disabled, error replicados
- [ ] Componentes interativos têm `forwardRef` e `displayName`
- [ ] Acessibilidade básica presente (aria-\* relevantes, label associado, foco visível)
- [ ] Tailwind config atualizado sob namespace `ui` (sem colisão com namespaces de outras skills)
- [ ] `globals.css` modificado apenas para o que Tailwind genuinamente não cobre
- [ ] Nenhum componente criado fora de `src/shared/components/ui/` (exceto `cn.ts` em `src/shared/utils/`)
- [ ] Nenhum componente fora do escopo de primitivos (sem layout, sem navegação, sem páginas, sem composições de negócio)
- [ ] `index.ts` exporta todos os primitivos com nomes consistentes
- [ ] Nenhum erro de hydration

## Não-escopo (explícito)

- Não criar layout, shell, navegação, header, footer, breadcrumbs
- Não criar páginas de exemplo, dashboards, listagens, formulários completos
- Não criar modais, drawers, datepickers, tabelas com paginação, toasts complexos com fila — esses são compostos, ficam para skill posterior
- Não criar tema dark / toggle de tema
- Não internacionalizar nada (componentes não têm texto hardcoded de qualquer forma)
- Não adicionar dependências fora da lista permitida (CVA, clsx, tailwind-merge, ícones, Radix justificado)
- Não usar shadcn/ui, headless-ui, Mantine, Chakra, MUI ou similares — a skill recria a partir do template, não importa um design system pronto
- Não opinar sobre o design — replicar o template, ainda que feio ou datado
- Não criar testes (skill separada)
- Não criar Storybook (skill separada)

## Estrutura de arquivos da própria skill

```
ui-template-admin-primitives-to-nextjs/
├── SKILL.md                                    # fluxo principal, < 500 linhas
├── references/
│   ├── primitives-catalog.md                   # taxonomia de primitivos comuns em templates admin
│   ├── inspection-checklist.md                 # como varrer o template procurando primitivos
│   ├── tailwind-token-mapping.md               # padrões de mapeamento template → tokens Tailwind
│   ├── cva-patterns.md                         # como estruturar variantes com CVA
│   └── component-templates.md                  # snippets de referência para cada primitivo
└── scripts/
    └── extract-ui-inventory.mjs                # varredura HTML para listar candidatos a primitivos
```

**`scripts/extract-ui-inventory.mjs`** (Node, com `node-html-parser` ou similar via npx): recebe a pasta do template, percorre HTMLs, conta ocorrências de elementos típicos (`button`, `input`, `select`, classes como `.btn`, `.badge`, `.alert`, `.form-control`) e produz um JSON resumindo o que apareceu, em quantas páginas, com quais classes. Falha graciosa se a estrutura for muito atípica — nesse caso Claude faz a inspeção lendo HTML/CSS diretamente, mas sempre produzindo o mesmo JSON intermediário antes de prosseguir.

**`references/`** seguem progressive disclosure: SKILL.md aponta quando ler cada um (ex.: "antes de mapear tokens, ler `tailwind-token-mapping.md`"; "antes de gerar componentes com variantes, ler `cva-patterns.md`").

## Formato do output da skill

A skill que você vai gerar deve seguir o formato Claude Code:

- Um arquivo `SKILL.md` na raiz da skill, com frontmatter (`name`, `description`, `when_to_use`) e o corpo dividido nas fases acima.
- Arquivos de apoio (templates, snippets, exemplos) na mesma pasta, referenciados a partir do `SKILL.md`.
- A `description` no frontmatter deve disparar a skill em pedidos como "extrair botões e inputs do template", "criar componentes primitivos a partir do template admin", "gerar UI kit do template em Next.js", "portar form controls do template", e variantes em pt-BR.

## O que eu quero de você agora

Gere a skill completa. Antes do código, me mostre:

1. A estrutura de arquivos da skill que você vai criar.
2. O frontmatter proposto da `SKILL.md`.
3. Quais arquivos de apoio você vai incluir e por quê.
4. Como essa skill se relaciona com as outras duas (`design-adm-template-structure` e `ui-template-admin-sidebar-to-nextjs`) — ordem de execução recomendada e namespaces de tokens para evitar colisão.

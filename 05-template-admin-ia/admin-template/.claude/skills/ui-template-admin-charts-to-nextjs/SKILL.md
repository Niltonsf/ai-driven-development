---
name: ui-template-admin-charts-to-nextjs
description: >
  Extrai e recria FIELMENTE os componentes primitivos de visualização de dados (bar-chart, line-chart, area-chart, pie-chart, donut-chart, sparkline, mais radial-bar/radar/gauge/heatmap/scatter quando o template tiver) de um template administrativo HTML/CSS/JS estático como componentes React reutilizáveis em uma aplicação Next.js (App Router) já existente, preservando paleta de séries, tipografia dos eixos, formato de tooltip, posição/estilo da legenda, gridlines, animações, raio de cantos em barras, espessura de linhas e gradientes de área do original. Detecta a biblioteca de gráficos usada no template (ApexCharts, Chart.js, ECharts, Highcharts, Chartist, Plotly, amCharts, Morris.js, Flot, C3, NVD3, SVG custom) e instala o wrapper React oficial correspondente — `react-apexcharts`, `react-chartjs-2`, `echarts-for-react`, `highcharts-react-official` (com alerta sobre licença comercial), wrapper próprio para Chartist, ou `react-plotly.js`. Bibliotecas legadas/problemáticas em React (Morris/Flot/C3/NVD3/amCharts) são migradas para Recharts com aviso ao usuário. Quando o template não tem gráficos, usa Recharts como fallback padrão. Apenas UMA biblioteca por projeto. Cobre um conjunto MÍNIMO obrigatório (bar, line, area, pie, donut, sparkline + wrappers chart-container/chart-loading/chart-empty-state) gerado com defaults coerentes mesmo quando ausente do template, MAIS todos os tipos adicionais que o template tiver. Stack fixa — Next.js App Router + Tailwind CSS + TypeScript estrito + `cn()` (clsx + tailwind-merge) + `"use client"` em todos os componentes + `next/dynamic` com `ssr: false` quando a biblioteca não é SSR-safe. Toda saída fica confinada a `src/shared/components/charts/`, expandindo o `tailwind.config` com namespace `charts.*` (séries, gridlines, eixos, tooltip, legenda, animações) sem colidir com `ui`/`adminMenu`/`adminShell`. Componentes são STATELESS — recebem dados via prop, nunca fazem fetch, nunca conhecem domínio. Consome `Card`, `Spinner`, `Button` de `src/shared/components/ui/` quando existirem (não é pré-requisito hard); senão, replica inline. NÃO cria shell, sidebar, primitivos de UI, compostos genéricos, dashboards com dados reais, mapas geográficos, gráficos 3D, candlestick/OHLC, tema dark, autenticação ou páginas. Fidelidade ao template > opinião — sem "melhorias", sem múltiplas bibliotecas misturadas. Dispara quando o usuário pede para "extrair / portar / recriar / replicar" gráficos / charts / visualizações / data viz / "biblioteca de visualizações" / "kit de gráficos" / "bar chart e line chart do dashboard" de um template admin (AdminLTE, Metronic, Tabler, Sneat, Vuexy, Materio, CoreUI, custom) em React/Next.js, ou fornece pasta de template e pede gráficos em `shared/components/charts`.
when_to_use: >
  Use quando o usuário fornecer um template admin HTML/CSS/JS local + projeto Next.js destino e pedir explicitamente para extrair/portar os GRÁFICOS / CHARTS / VISUALIZAÇÕES / DATA VIZ do template como componentes React reutilizáveis. NÃO use para shell/layout (skill própria), navegação/sidebar (skill própria), primitivos de UI (skill própria), componentes compostos (skill própria), dashboards prontos com dados reais, mapas geográficos, gráficos 3D ou candlestick/OHLC.
---

# ui-template-admin-charts-to-nextjs

Extrai gráficos de um template HTML/CSS/JS admin e os recria como componentes React **stateless** em uma aplicação Next.js (App Router) existente, **com fidelidade absoluta ao original** e **com a mesma biblioteca de gráficos do template** (ou substituto justificado).

## Princípio central

**O template é a fonte da verdade.** Esta skill tem duas responsabilidades inseparáveis:

1. **Detectar a biblioteca de gráficos do template** e instalar o wrapper React correspondente — replicando configuração visual, paleta, tipografia e comportamentos.
2. **Garantir o conjunto mínimo de tipos de gráfico** (bar/line/area/pie/donut/sparkline + wrappers de suporte) mesmo quando o template não exemplifica todos. Tipos faltantes são gerados com a mesma biblioteca, mesma paleta e mesmo tom visual.

A lista do template é o **piso, não o teto**. Tipos descobertos são gerados com fidelidade absoluta; tipos faltantes do mínimo são gerados com defaults coerentes com os outros.

**Fidelidade > opinião.** Cada gráfico cuja contraparte existe no template deve ser indistinguível visualmente do original.

## Stack (fixa, não-negociável)

- Next.js App Router + `src/`
- Tailwind CSS — namespace `charts.*` (séries, grid, eixos, tooltip, legenda, animações)
- TypeScript estrito
- `cn()` em `src/shared/utils/cn.ts` (`clsx` + `tailwind-merge`); instalar se faltar
- **Apenas UMA** biblioteca de gráficos no projeto, escolhida segundo `references/library-mapping-matrix.md`
- `"use client"` em todo componente de gráfico
- `next/dynamic` com `ssr: false` quando a biblioteca não é SSR-safe (ApexCharts, Plotly) — ver `references/ssr-safe-patterns.md`
- Ícones: a biblioteca já instalada pelas skills anteriores
- **Sem dependências adicionais** além da biblioteca de gráficos e suas peer-deps

## Saída — confinada a:

- `src/shared/components/charts/` — um arquivo por tipo de gráfico
- `src/shared/components/charts/_chart-theme.ts` — configuração visual centralizada
- `src/shared/components/charts/index.ts` — re-exports nomeados
- `tailwind.config.{ts,js}` — namespace `charts.*`
- `src/app/globals.css` — apenas para o que a biblioteca injeta em DOM externo e não pode ser estilizado de outro modo

Tudo mais é PROIBIDO. Nenhum shell, navegação, primitivo, composto, dashboard, página, fetch, state global.

## Conjunto mínimo obrigatório (sempre gerado)

- `bar-chart` (variantes via prop: `simple` | `stacked` | `grouped` | `horizontal`)
- `line-chart` (variantes: `simple` | `multi-series` | com marcadores)
- `area-chart` (curva preenchida; gradiente quando o template usa)
- `pie-chart`
- `donut-chart`
- `sparkline` (variantes: `line` | `area` | `bar`)
- Wrappers de suporte: `chart-container`, `chart-loading`, `chart-empty-state`, `chart-tooltip` (quando a lib permite tooltip customizado), `chart-legend` (idem)

## Conjunto adicional (gerado APENAS se o template tiver)

`radial-bar-chart`, `radar-chart`, `gauge-chart`, `heatmap-chart`, `scatter-chart`, `mixed-chart`, e quaisquer outros tipos presentes no template.

**Regra**: gráfico do conjunto mínimo presente no template → fidelidade total. Ausente → defaults coerentes com os extraídos. Adicional do template → fidelidade total.

---

## Fluxo (6 fases sequenciais com gates)

### Fase 0 — Reconhecimento

**Antes de prosseguir, ler `references/library-detection-protocol.md` e `references/library-mapping-matrix.md`.**

1. Aceitar (ou perguntar) caminho do template e do projeto Next.js destino.
2. Verificar Tailwind, `cn()` helper, `clsx`, `tailwind-merge`. Instalar o que faltar.
3. Verificar `src/shared/components/`. Criar `charts/` se não existir.
4. Detectar primitivos de UI (`src/shared/components/ui/`): mapear `Card`, `Spinner`, `Button` se presentes — serão consumidos por `chart-container` e `chart-loading`. Se ausentes, replicar inline (não abortar).
5. Detectar biblioteca de ícones em uso.
6. Detectar a biblioteca de gráficos do template seguindo o protocolo do `library-detection-protocol.md`.
7. Listar HTMLs candidatos: `dashboard*.html`, `analytics*.html`, `crm*.html`, `ecommerce*.html`, `charts*.html`, `apex*.html`, `chartjs*.html`, `echarts*.html`, e qualquer página com `<canvas>`/`<svg class*="chart">`/contêineres com IDs/classes contendo `chart`.
8. **Detecção do tema ativo (single-theme)**. Os gráficos devem casar com o tema único da app. Procedimento:
   - Reutilizar `activeTheme` registrado pela skill de primitivos/composites quando existir (comentário no `tailwind.config`, namespace `ui.*`).
   - Caso contrário, detectar pelo template: atributo `class="dark"`/`data-theme`/`data-bs-theme` no `<html>`/`<body>` padrão das páginas com gráficos, JS de toggle (estado inicial), background do contêiner do gráfico (claro ≥ #E8 → light; escuro ≤ #2A → dark).
   - Se ambíguo, **assumir `light`**.
   - Toda extração de paleta de séries, gridlines, eixos, tooltip e legenda na Fase 2 sai **exclusivamente** das regras CSS/JS efetivas para esse tema. Se o template tem palettes diferentes para light e dark, ignorar a inativa.

### Fase 1 — Inventário de gráficos

**Ler `references/inspection-checklist.md` e `references/charts-catalog.md`.**

Rodar o script:

```bash
node .claude/skills/ui-template-admin-charts-to-nextjs/scripts/extract-charts-inventory.mjs <pasta-template>
```

Produz JSON `{ detectedLibraries: [...], chartInstances: [...], palette: [...], typography: {...} }`. Falha graciosa → inspeção manual lendo HTML/JS diretamente, mas sempre produzir o mesmo JSON intermediário.

Para cada instância de gráfico encontrada, preencher a tabela do `inspection-checklist.md`:

| tipo | biblioteca | arquivo de config | nº páginas | séries | paleta | particularidades visuais | tooltip custom | legenda |

Marcar todos os gráficos do conjunto mínimo na tabela como "presente no template" ou "gerar com defaults".

### Fase 2 — Extração de tokens

**Ler `references/token-extraction-guide.md` e `references/tailwind-token-mapping.md`.**

Extrair do CSS/JS do template:

- **Paleta de séries**: sequência de cores na ordem em que aparecem (6–12 cores típicas).
- **Cores semânticas** (success/danger/warning/info) quando o template as usa em gráficos.
- **Cores de gridlines, eixos, labels, ticks**.
- **Tipografia** dos textos do gráfico (font-family, size, weight para axis-label, tick-label, tooltip, legend).
- **Tooltip**: bg, fg, border, radius, padding, shadow.
- **Legenda**: posição, marker (círculo/quadrado/linha), tamanho.
- **Animações**: duração e easing de entrada.
- **Bar**: border radius, gap entre barras, gap entre grupos.
- **Line**: stroke width, smooth/straight/stepped, marker (sim/não, tamanho).
- **Area**: opacidade, gradiente (paradas exatas).
- **Pie/Donut**: ângulo inicial, sentido, gap entre fatias, ratio do furo.

Adicionar ao `tailwind.config` sob `theme.extend.colors.charts.*` (séries, semânticas, grid, axisLine, axisLabel, tickLabel, tooltipBg/Fg/Border, legendFg) + `boxShadow.chartTooltip` + `transitionTimingFunction.chartEnter` + `keyframes.chartFadeIn`. Valores específicos do template que não existem na escala Tailwind: adicionar como token, **não aproximar**.

A paleta `charts.series.*` é a **fonte única de verdade** para cores de séries em todos os gráficos.

### Fase 3 — Apresentação do plano (gate de confirmação)

Apresentar ao usuário ANTES de gerar código:

1. **Decisão de biblioteca**: detectada no template, escolhida em React, justificativa, substituição se houver (ex.: Morris→Recharts; Highcharts pede confirmação por licença comercial).
2. **Lista de gráficos a criar**, agrupada em:
   - (a) mínimo presente no template (fidelidade total)
   - (b) mínimo ausente (defaults coerentes)
   - (c) adicionais descobertos no template
3. Variantes que cada gráfico exporá via prop discriminada.
4. Tabela de tokens a adicionar a `charts.*`.
5. Dependências a instalar (com bundle aproximado).
6. Ambiguidades que exigem decisão (paletas múltiplas; bibliotecas misturadas no template).

**Pedir confirmação para prosseguir.** Não gerar código antes do "ok". Esta skill instala biblioteca de runtime — exige confirmação explícita (diferente da skill de compostos, que segue autônoma).

### Fase 4 — Geração de código

**Antes da geração, ler o `references/<biblioteca>-recipes.md` correspondente, `references/chart-theme-pattern.md`, `references/ssr-safe-patterns.md` e `references/tooltip-legend-customization.md`.**

Ordem obrigatória:

1. Patch de `tailwind.config` com tokens `charts.*`.
2. Instalar a biblioteca escolhida e peer-deps.
3. `src/shared/components/charts/_chart-theme.ts` — objeto único exportando paleta, tipografia, gridlines, tooltip, legenda, animações lendo dos tokens Tailwind. Toda configuração de gráfico passa por aqui.
4. Wrappers de suporte: `chart-container`, `chart-loading`, `chart-empty-state`, `chart-tooltip` (se aplicável), `chart-legend` (se aplicável).
5. Gráficos sem dependência: `sparkline`, `pie-chart`, `donut-chart`.
6. Cartesianos: `bar-chart`, `line-chart`, `area-chart`.
7. Adicionais descobertos no template, na ordem do inventário.
8. Patch de `globals.css` (apenas se necessário).
9. `src/shared/components/charts/index.ts` com re-exports nomeados.

**Padrões obrigatórios em cada componente:**

- `"use client"` no topo. Sem exceção.
- `next/dynamic` com `ssr: false` quando a biblioteca não é SSR-safe (ver `ssr-safe-patterns.md`).
- Props tipadas com genéricos para o shape dos dados quando aplicável (`BarChartProps<T extends Record<string, unknown>>`).
- Variantes via prop discriminada (`variant: "simple" | "stacked"`). **Não usar CVA** em gráficos — a configuração varia além de classes CSS.
- Aceitar `data` via prop. Nunca hardcoded. Aceitar `height`, `colors?`, `showLegend?`, `showGrid?`, `tooltipFormatter?` opcionais com defaults sensatos.
- Cores default de `_chart-theme.ts` (que lê `charts.series.*`). Nenhuma cor hardcoded no JSX.
- Altura padrão razoável (300px para cartesianos; 40–60px para sparkline).
- `className` mesclado via `cn()` no container externo.
- Acessibilidade: `role="img"` + `aria-label` resumindo o gráfico.
- `chart-container` consome `Card` de `ui/` se existir; senão replica estrutura.
- `chart-loading` consome `Spinner` de `ui/` se existir; senão skeleton com pulse.
- `chart-empty-state` mostra ícone + mensagem; aceita `message` e `action` opcionais.

**Padrões específicos por tipo:**

- **Bar**: replicar border radius do topo, gap entre barras, hover (highlight + dim).
- **Line**: replicar espessura, smooth/straight, marcadores, animação de sweep.
- **Area**: replicar opacidade e gradiente exatos (paradas).
- **Pie/Donut**: replicar ângulo inicial, gap entre fatias, ratio do furo, label central em donut.
- **Sparkline**: minimalista — sem eixos, sem grid, sem legenda, sem tooltip ou tooltip mínimo.

**Proibido:**

- Hardcode de cor/medida no JSX ou na configuração da lib — sempre via `_chart-theme.ts` / tokens.
- Dados de exemplo embutidos.
- Lógica de negócio (fetch, state global, auth).
- "Melhorias" visuais.
- Múltiplas bibliotecas de gráficos.
- Componentes que sejam dashboards/composições.
- **Configurar tema dual no `_chart-theme.ts` — gerar somente o `activeTheme`. Sem switch claro/escuro, sem leitura de `prefers-color-scheme`, sem variantes `dark:`/`light:`.**
- Mapas geográficos, gráficos 3D, candlestick (a menos que o template tenha explicitamente).
- Tema dark, i18n, testes, Storybook.

### Fase 5 — Verificação

1. `npm run build` — zero erros, zero `any` não-justificado.
2. **Comparação visual** gráfico a gráfico contra o original do template — descrever no relatório o casamento de paleta, tipografia, tooltip, legenda, animação, gridlines, formato de barras/linhas/fatias.
3. Reportar:
   - biblioteca instalada + versão
   - arquivos criados, separando: (a) mínimo presente no template, (b) mínimo com defaults, (c) adicionais do template
   - tokens adicionados ao Tailwind
   - sugestão de inspeção visual (página `/dev/charts` em skill futura ou Storybook)
4. Corrigir lint/tipo antes de encerrar. Verificar ausência de erros de hydration.

---

## Critérios de aceitação (auto-checklist)

- [ ] `npm run build` passa sem erros e sem `any` não-justificado
- [ ] Apenas **uma** biblioteca de gráficos instalada
- [ ] A biblioteca é a do template, ou substituto confirmado pelo usuário
- [ ] Conjunto mínimo gerado completo (bar/line/area/pie/donut/sparkline + wrappers de suporte)
- [ ] Todos os adicionais do template gerados
- [ ] Paleta `charts.series.*` é exatamente a do template, na mesma ordem
- [ ] `activeTheme` registrado (light|dark, herdado ou detectado, fallback `light`); paleta/eixos/tooltip extraídos somente desse tema; nenhum dual-theme no `_chart-theme.ts`
- [ ] Tokens visuais idênticos ao original — comparação documentada
- [ ] Comportamentos do template (hover, animação, formato de tooltip) replicados
- [ ] `"use client"` em todos os componentes; `dynamic` + `ssr: false` onde a lib exige
- [ ] `chart-container` consome `Card` se existir
- [ ] `chart-loading` e `chart-empty-state` cobrem estados auxiliares
- [ ] Tailwind atualizado sob `charts.*`, sem colisão com `ui`/`adminMenu`/`adminShell`
- [ ] `globals.css` só para o que a lib injeta fora do controle do React
- [ ] Saída confinada a `src/shared/components/charts/`
- [ ] Nenhum dashboard/página/composição com dados reais
- [ ] `index.ts` exporta todos os gráficos com nomes consistentes
- [ ] Sem erro de hydration

## Não-escopo

Não cria: shell/layout, sidebar/navegação, primitivos de UI, compostos genéricos, dashboards/páginas com dados reais, fetch/state global, mapas geográficos, gráficos 3D, candlestick/OHLC (a menos que o template tenha), tema dark/toggle, i18n, testes, Storybook, autenticação.

## Relação com as outras skills

| skill | escreve em | namespace tokens |
|---|---|---|
| `ui-template-admin-shell-to-nextjs` | `src/shared/template/admin/` | `adminShell` |
| `ui-template-admin-sidebar-to-nextjs` | `src/shared/template/admin/` | `adminMenu` |
| `ui-template-admin-primitives-to-nextjs` | `src/shared/components/ui/` | `ui` (cria) |
| `ui-template-admin-composites-to-nextjs` | `src/shared/components/ui/` | `ui` (expande) |
| **esta skill** | **`src/shared/components/charts/`** | **`charts`** |

Esta skill **não tem pré-requisito hard**. Roda independente. Se primitivos de UI (`Card`, `Spinner`, `Button`) existirem, são consumidos pelos wrappers; senão, replica inline. Ordem recomendada na esteira: analyzer → shell → sidebar → primitives → composites → **charts** → page-templates.

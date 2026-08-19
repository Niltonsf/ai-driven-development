# Prompt para geração de skill: `ui-template-admin-charts-to-nextjs`

## Contexto

Quero que você gere uma skill do Claude Code (formato SKILL.md + arquivos de apoio) chamada **`ui-template-admin-charts-to-nextjs`**. A skill será invocada dentro de um projeto Next.js (App Router) e tem como input uma pasta local contendo um template administrativo em HTML/CSS/JS puro. Seu output são os **componentes primitivos de gráficos** desse template, traduzidos para componentes React reutilizáveis em `src/shared/components/charts/`, preservando fielmente a aparência, paleta de cores, tipografia, comportamentos de tooltip/legenda e variantes do original.

A skill **não** gera shell de layout, **não** gera navegação/menu, **não** gera primitivos de UI, **não** gera componentes compostos, **não** gera dashboards de exemplo, **não** gera páginas. Ela é estritamente focada em **primitivos de visualização de dados**: os tipos de gráfico reutilizáveis que aparecem no template (barras, linhas, área, pizza/donut, radar, gauge, sparkline, etc.). É a skill que estabelece o "vocabulário de data visualization" da aplicação.

A skill deve funcionar com qualquer template administrativo (AdminLTE, Metronic, Tabler, Sneat, Vuexy, Materio, CoreUI, custom), independentemente do framework CSS de origem (Bootstrap, Tailwind, custom CSS) e independentemente da biblioteca de gráficos usada no template original.

## Princípio central: detectar a biblioteca do template e replicar fielmente

Esta skill tem **duas responsabilidades igualmente importantes e inseparáveis**:

1. **Detectar a biblioteca de gráficos usada no template original** (ApexCharts, Chart.js, ECharts, Highcharts, Recharts, Chartist, Plotly, amCharts, Morris.js, Flot, custom SVG, etc.) e tentar usar a mesma biblioteca — ou a mais próxima viável — no projeto React, replicando configuração visual, paleta, tipografia e comportamentos.
2. **Garantir um conjunto mínimo de tipos de gráfico disponíveis na aplicação**, mesmo quando o template não exemplifica todos. Se o template tem barras e linhas mas não tem pizza, a skill ainda gera um componente de pizza usando a mesma biblioteca e a mesma paleta extraídas, para que o consumidor da aplicação tenha o vocabulário completo de visualizações comuns em telas administrativas.

A lista de gráficos do template é o **piso, não o teto**. O teto é a cobertura mínima esperada de qualquer dashboard administrativo. Os tipos descobertos no template são gerados com fidelidade absoluta; os tipos faltantes são gerados com a mesma biblioteca, paleta e tom visual, garantindo coerência.

**Fidelidade ao template é o critério #1 de qualidade.** Cada gráfico cuja contraparte existe no template original deve ser indistinguível visualmente do original: paleta, tipografia dos eixos, formato de tooltip, posição/estilo da legenda, gridlines, animações, raio de cantos em barras, espessura de linhas, área de preenchimento sob curvas, marcadores de pontos. Para gráficos não presentes no template, manter coerência visual com os que estão (mesma paleta, mesma tipografia, mesmas convenções de tooltip e legenda).

## Estratégia de seleção de biblioteca

A skill deve seguir esta ordem de decisão:

1. **Detectar a biblioteca do template** lendo:
   - `<script>` tags nos HTMLs (procurar `apexcharts`, `chart.js`, `chartjs`, `echarts`, `highcharts`, `chartist`, `plotly`, `amcharts`, `morris`, `flot`, `c3`, `nvd3`)
   - arquivos JS na pasta `assets/js/` ou similar
   - referências a `Chart(`, `ApexCharts(`, `echarts.init(`, etc.
   - arquivos CSS específicos (`apexcharts.css`, `chartist.css`)
2. **Mapear para uma biblioteca React equivalente ou wrapper oficial**, preferindo nesta ordem:
   - **ApexCharts no template** → `react-apexcharts` + `apexcharts` (wrapper oficial; mantém configuração quase idêntica ao template original — alta fidelidade)
   - **Chart.js no template** → `react-chartjs-2` + `chart.js` (wrapper oficial; configuração quase idêntica)
   - **ECharts no template** → `echarts-for-react` + `echarts` (wrapper bem mantido; configuração idêntica)
   - **Highcharts no template** → `highcharts-react-official` + `highcharts` (wrapper oficial; **alertar o usuário** sobre licenciamento comercial do Highcharts antes de instalar)
   - **Chartist no template** → `chartist` direto + wrapper React mínimo escrito pela skill (Chartist é leve e tem API estável)
   - **Plotly no template** → `react-plotly.js` + `plotly.js`
   - **amCharts/Morris/Flot/C3/NVD3 no template** → bibliotecas legadas ou problemáticas em React; **migrar para Recharts** como fallback de qualidade, alertando o usuário sobre a substituição
   - **SVG custom no template** → tentar replicar como componentes SVG próprios (sem biblioteca) **apenas para gráficos simples** (sparklines, barras pequenas, gauges minimalistas); para gráficos complexos, cair em Recharts
3. **Quando o template não tem gráficos** (caso raro mas possível), usar **Recharts** como padrão. Recharts é bem mantido, idiomático em React, leve, e cobre todos os tipos comuns.
4. **Quando o template tem múltiplas bibliotecas misturadas**, escolher a predominante (a que aparece em mais páginas) e migrar as exceções para a predominante, alertando o usuário.

A skill **deve apresentar a decisão ao usuário no plano (Fase 3) antes de instalar qualquer coisa**, com a justificativa, e perguntar se aceita a substituição quando não há mapeamento direto (Highcharts comercial, libs legadas).

## Quando a skill deve disparar

A skill deve ser usada SEMPRE que o usuário:

- pedir para "extrair", "portar", "recriar" ou "replicar" os **gráficos** / "charts" / "visualizações" / "data viz" do template em React/Next.js
- pedir explicitamente "componentes de gráfico", "gráficos primitivos", "gráficos do dashboard", "gráficos de barras/linhas/pizza" a partir do template
- mencionar um template admin e pedir "a parte de charts" / "os gráficos do dashboard" em Next.js
- fornecer uma pasta de template e pedir gráficos em `shared/components/charts` ou equivalente
- pedir a "biblioteca de visualizações" ou "kit de gráficos" baseado no template

A skill **NÃO** deve ser usada para:

- portar o template inteiro
- gerar shell/layout administrativo (skill `ui-template-admin-shell-to-nextjs`)
- gerar navegação/menu lateral (skill `ui-template-admin-sidebar-to-nextjs`)
- gerar primitivos de UI (skill `ui-template-admin-primitives-to-nextjs`)
- gerar componentes compostos (skill `ui-template-admin-composites-to-nextjs`)
- gerar dashboards completos com dados reais, fetch, ou lógica de negócio
- gerar mapas / geo viz (escopo específico, skill futura)

## Stack fixa (não negociável)

- **Next.js App Router** com `src/`
- **Estilização: Tailwind CSS**, com tokens extraídos do template original (paleta de cores dos gráficos, tipografia dos eixos, cores de gridlines/tooltip) adicionados ao `tailwind.config` sob namespace `charts` (ex.: `theme.extend.colors.charts.series.*`, `theme.extend.colors.charts.grid`, `theme.extend.colors.charts.tooltipBg`).
- **Biblioteca de gráficos**: detectada do template conforme estratégia acima. Apenas **uma** biblioteca de gráficos no projeto — a skill não mistura.
- **Wrapper SSR-safe**: gráficos quase sempre dependem de DOM/Canvas/SVG renderizados no cliente. Todo componente de gráfico recebe `"use client"` no topo. Quando a biblioteca não é SSR-safe (ApexCharts, Plotly), usar `dynamic(() => import(...), { ssr: false })` ou o padrão recomendado pela biblioteca.
- **Composição/utilitários**: `clsx` + `tailwind-merge` via helper `cn()` (já criado pela skill de primitivos em `src/shared/utils/cn.ts`).
- **Tipagem: TypeScript estrito**. Cada componente expõe `Props` claramente tipadas, com tipos genéricos para os dados quando aplicável (ex.: `BarChartProps<T>`).
- **Ícones**: usar a mesma biblioteca detectada/instalada pelas skills anteriores, quando o gráfico precisar de ícones (ex.: ícone de exportar, expandir).
- **Sem dependências adicionais** além da biblioteca de gráficos escolhida e suas dependências diretas. Sem `lodash`, sem `date-fns` (a menos que a biblioteca de gráficos exija), sem libs de utilitários genéricos.

## Entradas esperadas

1. **Caminho da pasta do template** (HTML/CSS/JS estático)
2. **Caminho da aplicação Next.js de destino** (raiz do projeto, com `src/`, Tailwind, e idealmente os primitivos de UI já em `src/shared/components/ui/`)

Se algum dos dois não estiver claro no contexto, a skill deve perguntar antes de prosseguir. A skill deve verificar que:

- o projeto Next.js destino tem Tailwind instalado e configurado
- existe `src/shared/components/` (criar `charts/` dentro se ainda não existir)
- `clsx` e `tailwind-merge` estão instalados (e o helper `cn()` em `src/shared/utils/cn.ts`); se não estiverem, instalar
- a biblioteca de gráficos escolhida será instalada via `npm install`

A skill **não** depende formalmente de `ui-template-admin-primitives-to-nextjs`, mas se primitivos como `Card`, `Spinner`, `Button` existirem, a skill **deve** consumi-los nos wrappers de gráfico (ex.: card que envelopa o gráfico, spinner de loading, botões de ação no header do gráfico). Verificar presença e usar quando disponíveis.

## Saída esperada

Toda saída fica confinada a:

- `src/shared/components/charts/` — um arquivo por tipo de gráfico (ou pasta quando o gráfico tiver subpartes, ex.: `bar-chart/` com variantes)
- `tailwind.config.{ts,js}` — adicionar tokens extraídos sob namespace `charts`
- `src/app/globals.css` — apenas para regras impossíveis em Tailwind utilities (ex.: estilização de tooltip da biblioteca quando ela injeta DOM próprio fora do controle do React). Manter ao mínimo.

Estrutura típica gerada (criar **todos** os do conjunto mínimo, mais quaisquer descobertos no template que não estejam no mínimo):

```
src/shared/components/charts/
├── chart-container.component.tsx        (wrapper opcional: card com header, título, ações, slot do gráfico)
├── chart-tooltip.component.tsx          (componente customizado de tooltip, quando a lib permite)
├── chart-legend.component.tsx           (componente customizado de legenda, quando a lib permite)
├── chart-empty-state.component.tsx      (estado vazio dedicado a gráficos)
├── chart-loading.component.tsx          (skeleton dedicado a gráficos)
│
├── bar-chart.component.tsx              (vertical, com variantes via prop: stacked, grouped, horizontal)
├── line-chart.component.tsx             (com variantes: simples, multi-série, com área)
├── area-chart.component.tsx             (curva preenchida; pode ser variante de line ou separado conforme template)
├── pie-chart.component.tsx
├── donut-chart.component.tsx            (variante de pie; separado se template tratar diferente)
├── radial-bar-chart.component.tsx       (apenas se template tem ou se a lib oferece e faz sentido)
├── radar-chart.component.tsx            (apenas se template tem ou se faz parte do mínimo da lib)
├── sparkline.component.tsx              (gráfico inline sem eixos, comum em stat-cards)
├── gauge-chart.component.tsx            (apenas se template tem)
├── heatmap-chart.component.tsx          (apenas se template tem)
├── scatter-chart.component.tsx          (apenas se template tem)
│
└── index.ts                             (re-exports nomeados)
```

**Conjunto mínimo obrigatório**, gerado independentemente do que o template exemplifica:

- `bar-chart` (vertical, com pelo menos as variantes simples e empilhada)
- `line-chart` (com pelo menos as variantes simples e multi-série)
- `area-chart` (linha com área preenchida)
- `pie-chart`
- `donut-chart`
- `sparkline` (gráfico de linha minimalista para uso inline)
- `chart-container`, `chart-loading`, `chart-empty-state` (wrappers de suporte)

**Conjunto adicional**, gerado **apenas se o template tiver**:

- `radial-bar-chart`, `radar-chart`, `gauge-chart`, `heatmap-chart`, `scatter-chart`, e qualquer outro tipo presente no template

**Regra de criação**: para cada gráfico do conjunto mínimo, se o template tem um exemplo, replicar fielmente (paleta, tipografia, tooltip, legenda, animações, gridlines). Se o template não tem um exemplo, gerar com defaults coerentes com os outros gráficos extraídos (mesma paleta de séries, mesmas cores de gridlines, mesmo estilo de tooltip e legenda).

**PROIBIDO criar**: layouts, navegação, primitivos de UI, componentes compostos genéricos, dashboards de exemplo, telas com gráficos populados de dados reais, formulários, modais, datepickers, mapas geográficos, gráficos 3D, candlestick (a menos que o template tenha explicitamente). PROIBIDO criar componentes fora de `src/shared/components/charts/`.

## Fluxo da skill (passos obrigatórios, nesta ordem)

### Fase 0 — Reconhecimento

1. Aceitar (ou perguntar) o caminho da pasta do template e da aplicação Next.js destino.
2. Verificar Tailwind, `cn()` helper, `clsx`, `tailwind-merge` no projeto destino. Instalar o que faltar.
3. Detectar a biblioteca de gráficos do template conforme estratégia descrita acima. Decidir o mapeamento React.
4. Detectar a presença de primitivos de UI já gerados (`src/shared/components/ui/`) — se existirem, mapear `Card`, `Spinner`, `Button` para uso nos wrappers.
5. Detectar a biblioteca de ícones em uso.
6. Listar os HTMLs do template e identificar os arquivos com gráficos: tipicamente `dashboard.html`, `analytics.html`, `crm.html`, `ecommerce.html`, `charts.html`, `apex-charts.html`, `chartjs.html`. Ler o JS associado a cada gráfico para extrair configuração.

### Fase 1 — Inventário de gráficos

Varredura sistemática dos HTMLs e dos arquivos JS de configuração de gráfico no template. Para cada gráfico identificado, montar uma tabela:

| tipo de gráfico | biblioteca usada no template | arquivo JS de config | aparece em quantas páginas | série(s) de dados | paleta usada | particularidades visuais (gradientes, marcadores, animação) | tooltip customizado | legenda |
| --------------- | ---------------------------- | -------------------- | -------------------------- | ----------------- | ------------ | ----------------------------------------------------------- | ------------------- | ------- |

Critério de inclusão: qualquer tipo de gráfico que apareça **uma vez** no template já entra no inventário (gráficos costumam aparecer em poucas instâncias mas são intencionais). Adicionar à tabela todos os tipos do conjunto mínimo, marcando "não presente no template" para os que faltam.

### Fase 2 — Extração de tokens visuais

Extrair do CSS/JS do template, **para todos os gráficos do inventário**:

- **Paleta de séries**: a sequência de cores que o template usa para colorir múltiplas séries (geralmente 6 a 12 cores). Extrair na ordem em que aparecem.
- **Cores de variantes semânticas** dos gráficos (success, danger, warning, info) quando o template usa cores semânticas em vez da paleta sequencial.
- **Cores de gridlines** (eixo X, eixo Y, gridlines internas).
- **Cores de eixos** (linha do eixo, texto dos labels, texto dos ticks).
- **Tipografia dos textos do gráfico**: font-family, font-size, font-weight de labels de eixo, ticks, título do gráfico, texto da legenda, texto do tooltip.
- **Tooltip**: cor de fundo, cor do texto, border radius, padding, sombra.
- **Legenda**: posição padrão, espaçamento, marcador (círculo/quadrado/linha), tamanho do marcador.
- **Animações**: duração e easing das animações de entrada do gráfico.
- **Bar charts**: border radius das barras (0, 2, 4, 8 — frequente em templates modernos), espaçamento entre barras, espaçamento entre grupos.
- **Line charts**: espessura da linha, presença ou não de marcadores nos pontos, tamanho do marcador, tipo de curva (smooth/straight/stepped).
- **Area charts**: opacidade do preenchimento, presença de gradiente, paradas do gradiente.
- **Pie/Donut**: espessura do donut (ratio interno), espaçamento entre fatias, label central (donut).

Adicionar ao `tailwind.config` sob namespace `charts`:

```ts
theme: {
  extend: {
    colors: {
      charts: {
        series: {
          1: '#...',
          2: '#...',
          3: '#...',
          // ... toda a paleta na ordem
        },
        success: '#...',
        danger: '#...',
        warning: '#...',
        info: '#...',
        grid: '#...',
        axisLine: '#...',
        axisLabel: '#...',
        tickLabel: '#...',
        tooltipBg: '#...',
        tooltipFg: '#...',
        tooltipBorder: '#...',
        legendFg: '#...',
      }
    },
    boxShadow: {
      chartTooltip: '...',
    },
    transitionTimingFunction: {
      chartEnter: '...',
    }
  }
}
```

Valores específicos do template que não existam na escala Tailwind devem ser adicionados — não aproximar. **Fidelidade > convenção.**

A paleta extraída em `charts.series.*` é a **fonte única de verdade** para cores de séries em todos os gráficos gerados, garantindo coerência visual mesmo nos tipos não presentes no template original.

### Fase 3 — Apresentação do plano

Antes de gerar código, apresentar ao usuário:

1. **Decisão de biblioteca**: biblioteca detectada no template, biblioteca React escolhida, justificativa, e qualquer substituição (ex.: "template usa Morris.js, vamos migrar para Recharts; template usa Highcharts comercial — confirmar uso ou trocar por Recharts").
2. **Lista de gráficos que serão criados**, agrupados em duas seções:
   - (a) gráficos do conjunto mínimo presentes no template (com fidelidade total)
   - (b) gráficos do conjunto mínimo ausentes no template (gerados com defaults coerentes)
   - (c) gráficos adicionais descobertos no template (radar, gauge, heatmap, etc.)
3. Para cada gráfico, indicar variantes que serão expostas via props (ex.: `BarChart` com `variant: "simple" | "stacked" | "grouped" | "horizontal"`).
4. **Tabela resumida de tokens** que serão adicionados ao `charts`.
5. **Dependências a instalar**, com tamanho aproximado do bundle.
6. **Ambiguidades** que merecem decisão do usuário (ex.: "o template tem três paletas diferentes em páginas distintas — qual usar como padrão?", "o template usa duas bibliotecas diferentes — confirmar consolidação em uma só").

Pedir confirmação para prosseguir. Não gerar código antes do "ok".

### Fase 4 — Geração de código

Ordem obrigatória de geração:

1. Patch do `tailwind.config` com tokens
2. Instalar a biblioteca de gráficos escolhida (e dependências peer)
3. Wrappers de suporte: `chart-container`, `chart-loading`, `chart-empty-state`, `chart-tooltip` (se a lib permite tooltip customizado), `chart-legend` (se a lib permite legenda customizada)
4. Gráficos sem dependência de outros: `sparkline`, `pie-chart`, `donut-chart`
5. Gráficos cartesianos: `bar-chart`, `line-chart`, `area-chart`
6. Gráficos adicionais descobertos no template, na ordem em que aparecem no inventário
7. Patch de `globals.css` (apenas se necessário, por exemplo para estilizar tooltip injetado pela lib em DOM externo)
8. `src/shared/components/charts/index.ts` com re-exports nomeados

**Padrões obrigatórios para cada componente:**

- `"use client"` no topo de todo componente de gráfico
- Quando a biblioteca não é SSR-safe, importar via `next/dynamic` com `ssr: false`
- Props tipadas, com genéricos para o shape dos dados quando aplicável: `BarChartProps<T extends Record<string, unknown>>`
- Variantes via prop discriminada (ex.: `variant: "simple" | "stacked"`) — gráficos não usam CVA porque a configuração varia muito além de classes CSS
- Aceitar **dados** via prop (`data`), não hardcoded; aceitar configuração visual mínima via props (`height`, `colors?`, `showLegend?`, `showGrid?`, `tooltipFormatter?`)
- Defaults sensatos: cores tiradas de `charts.series.*`, altura padrão razoável (ex.: 300px), legenda visível por padrão se o template assim usa
- `className` recebido como prop e mesclado via `cn()` no container externo
- Acessibilidade: `role="img"` com `aria-label` resumindo o gráfico (a maioria das libs já cobre, mas garantir)
- **Server vs Client**: todos client. Sem exceção em gráficos.
- **Mapeamento de tokens para a configuração da biblioteca**: criar um arquivo interno `src/shared/components/charts/_chart-theme.ts` exportando objetos de configuração que leem de CSS variables ou de constantes Tailwind, e que são consumidos por todos os gráficos. Isso garante consistência e facilita manutenção.

**Padrões específicos:**

- **Bar chart**: replicar o border radius das barras do template (frequentemente arredondado no topo), o espaçamento entre barras, e o comportamento de hover (highlight da barra, dim das outras se o template fizer isso).
- **Line chart**: replicar espessura, smooth/straight, marcadores (sim/não, tamanho, cor), animação de entrada (sweep da esquerda para direita é comum). Quando multi-série, manter ordem de cores da paleta.
- **Area chart**: replicar opacidade e gradiente do preenchimento. Templates modernos quase sempre usam gradiente (forte no topo, transparente no fundo) — extrair as paradas exatas.
- **Pie/Donut**: replicar ângulo inicial, sentido, espaçamento entre fatias. Em donuts, replicar ratio do furo central e qualquer label central (valor total, título).
- **Sparkline**: minimalista — sem eixos, sem grid, sem legenda, altura pequena (40-60px), uma série, sem tooltip ou tooltip mínimo. Aceitar `variant: "line" | "area" | "bar"`.
- **Tooltip**: quando a biblioteca permite tooltip customizado em React (Recharts, Chart.js v3+ com plugin, ApexCharts via formatter), implementar `chart-tooltip.component.tsx` que combina visualmente com o template. Quando a lib injeta DOM próprio, estilizar via classes globais em `globals.css` (mínimo necessário).
- **Legenda**: idem tooltip — preferir customização React quando possível.
- **Loading**: `chart-loading` é um skeleton com a forma aproximada do gráfico (barras de altura aleatória, linha ondulada), animado com pulse Tailwind.
- **Empty state**: `chart-empty-state` mostra ícone + mensagem ("Sem dados para exibir"), aceita `message` e `action` opcionais como props.
- **Container**: `chart-container` é opcional — quando presente, envelopa o gráfico em um card com header (título, subtítulo, ações), corpo (slot do gráfico) e footer (legenda customizada, se aplicável). Consome `Card` de `ui/` se existir; senão, replica a estrutura inline.

**Não fazer:**

- Sem hardcode de cores no JSX ou na configuração do gráfico — sempre via tokens (lendo de `_chart-theme.ts`)
- Sem dados de exemplo embutidos nos componentes (componentes recebem `data` via prop; valores padrão apenas em casos triviais como `sparkline` com `data: number[]`)
- Sem lógica de negócio (sem fetch, sem state global)
- Sem "melhorias" visuais — fidelidade ao template > opinião própria
- Sem múltiplas bibliotecas de gráficos no projeto
- Sem componentes que sejam "dashboards": cada arquivo gera **um tipo de gráfico**, não uma composição de vários

### Fase 5 — Verificação

1. Rodar `npm run build` (ou `next build`) para validar compilação e tipos.
2. **Comparação visual**: para cada gráfico cuja contraparte existe no template, abrir lado a lado o HTML original e descrever (no relatório final) o casamento de paleta, tipografia, tooltip, legenda, animação, gridlines, formato de barras/linhas/fatias.
3. Reportar ao usuário:
   - biblioteca de gráficos instalada e versão
   - lista de arquivos criados, separando: conjunto mínimo presente no template, conjunto mínimo gerado com defaults, gráficos adicionais do template
   - tokens adicionados ao Tailwind
   - sugestão de como inspecionar visualmente (criar uma página `/dev/charts` em uma skill futura ou Storybook)
4. Se houver erros de tipo/lint, corrigir antes de encerrar.

## Critérios de aceitação (auto-verificar antes de finalizar)

- [ ] `npm run build` passa sem erros e sem `any` não justificado
- [ ] Apenas **uma** biblioteca de gráficos foi instalada no projeto
- [ ] A biblioteca escolhida é a do template, ou um substituto justificado e confirmado pelo usuário
- [ ] Todos os gráficos do conjunto mínimo foram gerados (`bar-chart`, `line-chart`, `area-chart`, `pie-chart`, `donut-chart`, `sparkline`, mais wrappers de suporte)
- [ ] Todos os gráficos adicionais identificados no template foram gerados
- [ ] Paleta de séries em `charts.series.*` é exatamente a do template, na mesma ordem
- [ ] Tokens visuais (cores, tipografia, tooltip, legenda, animações) idênticos ao original — comparação documentada no relatório
- [ ] Comportamentos do template (hover, animação de entrada, formato de tooltip) replicados
- [ ] Todos os componentes têm `"use client"` e usam `dynamic` com `ssr: false` quando a biblioteca exige
- [ ] Wrapper `chart-container` consome `Card` de `ui/` se existir; senão, replica a estrutura
- [ ] `chart-loading` e `chart-empty-state` cobrem os estados auxiliares
- [ ] Tailwind config atualizado sob namespace `charts`, sem colisão com `ui`/`adminMenu`/`adminShell`
- [ ] `globals.css` modificado apenas para o que Tailwind/lib genuinamente não cobrem
- [ ] Nenhum componente criado fora de `src/shared/components/charts/`
- [ ] Nenhum dashboard, página, ou composição com dados reais foi criado
- [ ] `index.ts` exporta todos os gráficos com nomes consistentes
- [ ] Nenhum erro de hydration

## Não-escopo (explícito)

- Não criar shell, layout, navegação, header, footer
- Não criar primitivos de UI (botão, input, badge, etc.) — pré-requisito da skill `ui-template-admin-primitives-to-nextjs`
- Não criar componentes compostos (page header, modal, card genérico, data table) — escopo da skill `ui-template-admin-composites-to-nextjs`
- Não criar dashboards completos, páginas com dados reais, lógica de fetch, integração com API
- Não criar mapas geográficos / geo viz / coropletas
- Não criar gráficos 3D
- Não criar candlestick, OHLC, ou outros gráficos financeiros específicos a menos que o template tenha explicitamente
- Não criar tema dark / toggle de tema (paleta única extraída do tema padrão do template)
- Não internacionalizar nada — gráficos não têm texto hardcoded; quando houver (ex.: "Sem dados"), usar pt-BR por padrão ou inglês neutro
- Não usar múltiplas bibliotecas de gráficos no mesmo projeto
- Não criar testes (skill separada)
- Não criar Storybook (skill separada)
- Não opinar sobre o design dos gráficos — replicar o template

## Estrutura de arquivos da própria skill

```
ui-template-admin-charts-to-nextjs/
├── SKILL.md                                    # fluxo principal, < 500 linhas
├── references/
│   ├── library-detection-protocol.md           # como detectar a biblioteca do template e mapear para wrapper React
│   ├── library-mapping-matrix.md               # tabela template-lib → React-lib, com notas de fidelidade e licenciamento
│   ├── charts-catalog.md                       # taxonomia completa de tipos de gráfico em templates admin (mínimo + adicionais)
│   ├── inspection-checklist.md                 # como varrer o template procurando configuração de gráficos no JS
│   ├── token-extraction-guide.md               # como extrair paleta, tipografia, tooltip, legenda, animações do template
│   ├── tailwind-token-mapping.md               # padrões de mapeamento template → tokens Tailwind no namespace `charts`
│   ├── chart-theme-pattern.md                  # padrão do arquivo `_chart-theme.ts` que centraliza configuração visual
│   ├── ssr-safe-patterns.md                    # padrões de `next/dynamic` por biblioteca; quais libs são SSR-safe e quais não
│   ├── recharts-recipes.md                     # snippets para cada tipo de gráfico em Recharts (fallback padrão)
│   ├── apexcharts-recipes.md                   # snippets para cada tipo de gráfico em react-apexcharts
│   ├── chartjs-recipes.md                      # snippets para cada tipo de gráfico em react-chartjs-2
│   ├── echarts-recipes.md                      # snippets para cada tipo de gráfico em echarts-for-react
│   └── tooltip-legend-customization.md         # padrões de tooltip e legenda customizados em React por biblioteca
└── scripts/
    └── extract-charts-inventory.mjs            # varredura HTML/JS para detectar biblioteca e listar configurações de gráfico
```

**`scripts/extract-charts-inventory.mjs`** (Node, com `node-html-parser` e leitura de arquivos JS via fs): recebe a pasta do template e produz um JSON com:

- `detectedLibraries`: bibliotecas de gráfico identificadas (com contagem de ocorrências por biblioteca)
- `chartInstances`: cada gráfico encontrado, com tipo (bar, line, pie, etc.), arquivo de origem, biblioteca, e snippet da configuração
- `palette`: cores observadas em uso em séries de gráficos, com frequência
- `typography`: tipografia detectada em labels de eixo e tooltip

Falha graciosa quando a configuração está minificada ou inacessível — nesse caso Claude faz a inspeção lendo HTML/CSS/JS diretamente, mas sempre produzindo o mesmo JSON intermediário antes de prosseguir.

**`references/`** seguem progressive disclosure: SKILL.md aponta quando ler cada um (ex.: "antes da Fase 0, ler `library-detection-protocol.md`"; "após detectar a biblioteca, ler o `*-recipes.md` correspondente"; "antes de gerar componentes, ler `chart-theme-pattern.md` e `ssr-safe-patterns.md`").

## Formato do output da skill

A skill que você vai gerar deve seguir o formato Claude Code:

- Um arquivo `SKILL.md` na raiz da skill, com frontmatter (`name`, `description`, `when_to_use`) e o corpo dividido nas fases acima.
- Arquivos de apoio (templates, snippets, exemplos) na mesma pasta, referenciados a partir do `SKILL.md`.
- A `description` no frontmatter deve disparar a skill em pedidos como "extrair gráficos do template", "criar componentes de gráfico a partir do template admin", "gerar charts do dashboard em Next.js", "portar bar chart e line chart do template", "criar biblioteca de gráficos primitivos", e variantes em pt-BR.

## O que eu quero de você agora

Gere a skill completa. Antes do código, me mostre:

1. A estrutura de arquivos da skill que você vai criar.
2. O frontmatter proposto da `SKILL.md`.
3. Quais arquivos de apoio você vai incluir e por quê — em especial, como `library-detection-protocol.md` e `library-mapping-matrix.md` serão estruturados para garantir, respectivamente, a detecção correta da biblioteca do template e o mapeamento justificado para um wrapper React.
4. Como essa skill se relaciona com as outras quatro (`design-adm-template-structure`, `ui-template-admin-shell-to-nextjs`, `ui-template-admin-sidebar-to-nextjs`, `ui-template-admin-primitives-to-nextjs`, `ui-template-admin-composites-to-nextjs`):
   - ordem de execução recomendada na esteira (e por que esta skill pode rodar **independentemente**, mas se beneficia da skill de primitivos para reusar `Card`, `Spinner`, `Button` nos wrappers)
   - namespaces de tokens utilizados por cada uma para evitar colisão (esta skill usa `charts`, sem expandir `ui` ou criar subgrupos em outros namespaces)
   - o que esta skill **explicitamente** não faz, deixando para skills posteriores (mapas geográficos, gráficos 3D, dashboards prontos, etc.)

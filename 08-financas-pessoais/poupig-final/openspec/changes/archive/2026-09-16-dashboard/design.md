## Context

Ver `proposal.md` — Why. Requisitos em `specs/month-dashboard/spec.md` e `specs/private-area-layout/spec.md`. Restrições do estado atual que moldam a abordagem:

- **Rota e layout**: `app/(private)/dashboard/page.tsx` era um placeholder inline ("Métrica A/B/C"). As demais rotas do grupo só delegam para uma página de módulo (`cards/page.tsx` → `CreditCardsPage`). Proteção, `SelectedMonthProvider` e `MonthPicker` já estão no layout `(private)`.
- **Corpo do shell**: o `<main>` do `AdminShell` já tem `p-4 md:p-6` e nenhuma largura máxima. A caixa centralizada vinha de cada página, que repetia `mx-auto max-w-{3xl|4xl|6xl} px-4 py-6` — ou seja, margem dupla e larguras diferentes entre telas.
- **Formulários**: todos os formulários da área privada usam `FormSectionLayout`, que já limita os campos a `max-w-2xl` dentro de cada seção.
- **Extrato — hook**: `useStatement(params: ListStatementParams)` devolve `{ entries, total, isLoading, error, refresh }`. O hook não pagina, usa chave de requisição, descarta resposta obsoleta e não tem `setState` síncrono em efeito. **`params` está nas dependências do `useEffect`**: um objeto literal novo a cada render refaz a requisição a cada render e entra em loop. O extrato monta os parâmetros em `useMemo`.
- **Extrato — teto**: `FindMonthlyStatement` corta em `STATEMENT_MAX_ENTRIES = 500` (exportado por `@poupig/transaction`) sem sinal na resposta, e `meta.total` é o tamanho já cortado. A única pista de corte é `entries.length === 500`.
- **`StatementEntryDTO`**: traz `value` positivo em reais, `direction`, `status`, `expectedOn` (`YYYY-MM-DD`), `accountName`, `categoryName`, `kind` e o bloco da série. Não traz cor de categoria.
- **Peças prontas no módulo**:
  - `statement-format.ts` (`formatDateOnly` sem fuso)
  - `group-statement-entries.ts` (função pura, com `UNCLASSIFIED_GROUP_LABEL = 'Sem classificação'`)
  - `statement-item-parts.component.tsx`: `TransactionAmount` (valor com sinal e cor) e `RecurrenceSign` (`Repeat` + `N/T`, que usa `Tooltip` e exige `TooltipProvider` acima)
- **Data de hoje**: o helper `getTodayDateOnly()` existe duas vezes, **privado**, nos formulários de transação e de série. `shared/util/month.util.ts` exporta `MONTH_SHORT_LABELS` (`jan` … `dez`).
- **Compartilhado**:
  - `MetricCard` e `NavigationLinkCard`: visual fixo (cartão alto, conteúdo centralizado), sem espaço para medidor, anel ou layout horizontal
  - `PieBreakdownChart`: paleta própria de verdes cíclica, legenda do `recharts` e raios fixos em pixels; tem um único consumidor do scaffold
  - `recharts` 3.9 está instalado
  - `Card` e `Button`
- **Tema**: o app é só escuro (`--background` ≈ `#020817`), e os cards seguem o gradiente `zinc-900` do `MetricCard` (≈ `#18181b`).
- **Cadastros**:
  - `listAccounts(token, page, pageSize)` devolve `{ items, total, page, pageSize }`
  - `listCategories(token)` devolve `CategoryDTO[]` com `isActive`
  - `useAuth` vem de `modules/auth/data/auth.context`
- **Qualidade**:
  - o frontend não tem testes e o lint já falha com 88 erros
  - `react-hooks/set-state-in-effect` e `no-explicit-any` estão ativas
  - a verificação é `npm run build` + `npx eslint` sem `--fix` nos arquivos tocados
- **Execução**: a primeira versão foi implementada por um único sub-agente. A revisão visual (gráficos, cards próprios, largura total) foi aplicada depois, direto no código, e estes artefatos foram atualizados por engenharia reversa. Sem teste via navegador: o usuário testa manualmente.

## Goals / Non-Goals

**Goals:**

- Números do dashboard idênticos aos do extrato do mesmo mês, sem requisição nova para eles.
- Toda soma, filtro, ordenação, agrupamento e corte em funções puras, sem React. Os componentes só desenham (proporções de barra e anel incluídas, via `shareOf`).
- Gráficos legíveis por quem tem daltonismo, com a cor nunca sendo a única forma de identificar uma fatia.
- Um visual único para todos os cards do dashboard.
- Todas as telas privadas alinhadas pelas mesmas bordas e aproveitando a largura da tela.

**Non-Goals:**

- Não alterar `shared/` (nem `MetricCard`, `NavigationLinkCard` ou `PieBreakdownChart`), os módulos `account`/`category`/`credit-card`/`auth` além da classe do contêiner das páginas, os componentes de dashboard do scaffold nem os formulários de transação.
- Não criar hook genérico de requisição, cliente HTTP, hook de mês ou contexto novo.
- Não unificar o helper de data de hoje com o dos formulários.
- Não usar a cor cadastrada da categoria no gráfico.

## Decisions

### 1. Dashboard no módulo `transaction`, não em `shared/` nem em módulo novo

A tela é a leitura do movimento do mês, com a mesma fonte do extrato, e usa as peças que já moram em `modules/transaction`. Os cadastros entram só para o guia, pelos clientes que os módulos `account` e `category` já exportam, importados sem alteração.

Alternativas: um módulo `dashboard` novo — rejeitada, criaria um módulo só para importar tudo de `transaction`. Colocar a tela em `shared/` — rejeitada, porque `shared/` não conhece domínio.

### 2. Funções puras em `data/dashboard-summary.ts`

Um arquivo sem React, no desenho de `group-statement-entries.ts`:

- **Constantes**: `DASHBOARD_PENDING_LIMIT = 5`, `DASHBOARD_BREAKDOWN_LIMIT = 5` e `OTHERS_SLICE_LABEL = 'Outras'`, documentados.
- **`summarizeMonth(entries)` → `MonthSummary`**: uma passada que ignora `CANCELED`.
  - `inflow`/`outflow` somam `PENDING` + `SETTLED`
  - `settledInflow`/`settledOutflow` somam só `SETTLED`
  - `expectedResult` e `settledResult`
  - `settledCount` e `activeCount`
- **`splitPending(entries, today)` → `{ overdue, upcoming }`**, cada grupo um `PendingGroup = { items; remaining }`.
  - só `PENDING`, divididas por `expectedOn < today` (comparação de strings)
  - ordena uma cópia por `expectedOn` crescente, com desempate `localeCompare` pt-BR do nome
  - `items` cortado no limite e `remaining` com o excedente
- **`breakdownOutflow(entries, dimension, limit)` → `OutflowBreakdown = { slices; totalOutflow }`**, com `dimension: 'category' | 'account'`.
  - soma as `OUT` não canceladas num `Map` por `categoryName ?? UNCLASSIFIED_GROUP_LABEL` ou por `accountName`
  - ordena por total decrescente com desempate por rótulo
  - os primeiros `limit` viram `OutflowSlice` (`key`, `label`, `total`, `share`, `isOthers: false`)
  - o restante vira uma única fatia `Outras` (`key: '__others__'`, `isOthers: true`), sempre por último e só quando soma mais que zero
- **`shareOf(part, whole)`**: fração limitada a 1, e `0` sem total. É usado pelas fatias, pelos medidores de efetivado e pelo anel, para que nenhum componente divida por zero.
- **`isStatementTruncated(entries)`**: `entries.length >= STATEMENT_MAX_ENTRIES`.
- **`todayDateOnly()`**: `getFullYear()`, `getMonth() + 1` e `getDate()` com `padStart(2, '0')`, sem `toISOString()`.

Somas em ponto flutuante sobre reais com duas casas são exibidas só por `formatCurrency`, que arredonda na exibição.

Alternativas:
- **Calcular dentro dos componentes** — rejeitada, espalharia a regra "cancelada fica fora" por vários arquivos.
- **Um endpoint de resumo** — rejeitada, os números divergiriam do extrato e seria backend novo.
- **Uma função por dimensão** (`byCategory`, `byAccount`) — rejeitada, duplicaria o agrupamento, a ordenação e o `Outras`; a dimensão é só a chave.
- **Listar só as cinco maiores, sem `Outras`** — rejeitada, porque as fatias deixariam de somar 100% das saídas mostradas no centro do gráfico.

### 3. `todayDateOnly()` exportado no arquivo do dashboard

Os dois helpers existentes são privados de componentes de formulário. O dashboard cria o seu com o mesmo algoritmo e comentário. A unificação fica registrada como fora de escopo.

Alternativa: importar de `transaction-form.component.tsx` exportando o helper — rejeitada, alteraria o formulário e faria `data/` depender de `components/`.

### 4. Parâmetros do extrato em `useMemo`

A página faz `useMemo(() => ({ from: monthStart, to: monthEnd }), [monthStart, monthEnd])` e chama `useStatement(params)`. Os derivados (`summary`, `pending`, `byCategory`, `byAccount`, `truncated`) ficam num `useMemo` sobre `entries`, com `today = todayDateOnly()` calculado dentro dele.

Alternativa: passar o objeto literal — rejeitada, dispara a requisição a cada render e entra em loop.

### 5. Guia de primeiros passos em hook próprio, tolerante a falha

`data/use-dashboard-onboarding.ts` lê o `token` de `useAuth` e, num `useEffect` com `[token]`, dispara `Promise.all([listAccounts(token, 1, 1), listCategories(token)])`.

- **Estado**: é gravado só no `.then`/`.catch`, junto com o token a que pertence, e uma flag `isCurrent` desligada no cleanup descarta a resposta obsoleta.
- **Carregando**: é derivado — `status: 'loading'` sem token ou quando o estado gravado é de outro token.
- **Resultado**: `hasAccounts = total > 0`, `hasActiveCategories = some(isActive)` e `status: 'ready'`.
- **Falha**: qualquer erro vira `unavailable`, sem toast.

O terceiro passo vem da página (`summary.activeCount > 0`). O guia só renderiza com `status === 'ready'`, extrato carregado sem erro e algum passo pendente. Assim não pisca durante o carregamento nem marca a primeira transação como pendente por causa de uma falha.

Alternativa: usar `useAccounts`/`useCategories` dos módulos — rejeitada, esses hooks carregam listas com estado de tela, toasts e ações de CRUD.

### 6. Superfície comum e cards próprios em vez de `MetricCard`/`NavigationLinkCard`

`components/dashboard-card.styles.ts` exporta `DASHBOARD_CARD_CLASSES`: o mesmo gradiente escuro, borda e brilho interno do `MetricCard`, aplicado a todos os cards do dashboard (indicadores, gráficos, pendências, atalhos, guia e erro).

Os componentes, que só desenham:

- **`DashboardSummaryComponent`** (`summary`): grade `sm:grid-cols-2 xl:grid-cols-4` com um `IndicatorCard` interno (título, ícone com fundo tingido e brilho radial por tom `inflow`/`outflow`/`neutral`).
  - `Resultado previsto`: valor em destaque colorido pelo sinal e faixa `Resultado efetivado`.
  - `FlowIndicator` para `Entradas`/`Saídas`: previsto em destaque e medidor `role="meter"` no tom do card com `shareOf(settled, expected)`.
  - `Efetivação`: `SettlementRing` em SVG puro — trilha e arco por `strokeDasharray`/`strokeDashoffset`, com `role="progressbar"` e o percentual no centro.
- **`DashboardBreakdownChartComponent`** (`title`, `description`, `slices`, `totalOutflow`, `emptyText`, `icon`): gráfico de rosca e legenda. Ver decisão 8.
- **`DashboardPendingComponent`** (`overdue`, `upcoming`): card com `TooltipProvider` e `@container` no conteúdo, com os grupos lado a lado a partir de `@2xl`.
  - cabeçalho de grupo com ícone (`AlertTriangle`/`CalendarClock`) e contagem em pílula (vermelha em atrasadas com contagem maior que zero)
  - linhas `Link` para `/transactions` com `DateChip` (dia e `MONTH_SHORT_LABELS`, lidos do `split('-')` da string, com `formatDateOnly` no `title` e para leitor de tela), nome, conta, `TransactionAmount` e `RecurrenceSign`
  - grupo vazio em caixa tracejada
  - rodapé `Ver no extrato`
- **`DashboardShortcutsComponent`**: seção `Atalhos` com quatro `Link` horizontais em `sm:grid-cols-2 xl:grid-cols-4`, cada um com ícone do menu em quadrado tingido (azul, verde, violeta, âmbar), título, descrição truncada e `ArrowUpRight` animado no hover.
- **`DashboardOnboardingComponent`** (`hasAccounts`, `hasActiveCategories`, `hasTransactions`): card com brilho azul, ícone `Sparkles`, contador `N de 3 concluídos` e passos em `md:grid-cols-3`. Passo pendente é um `Link` com o número; passo feito mostra `Check` e título riscado. Devolve `null` quando os três estão feitos.

Alternativas: continuar com `MetricCard` e `NavigationLinkCard` — rejeitada, porque não comportam medidor, anel nem layout horizontal, e o cartão centralizado alto do `NavigationLinkCard` pesava mais que o conteúdo. Alterar esses componentes em `shared/` — rejeitada, mudaria telas de scaffold que os usam.

### 7. Página `MonthDashboardPage`, grade dos painéis e estados

- **Topo**: `PageSectionHeader` com `badge="Dashboard"`, `title={monthLabel}` e `subtitle="Visão geral do mês selecionado"`.
- **Ordem do corpo**: onboarding → indicadores → painéis → atalhos → aviso de corte.
- **Painéis**: grade `xl:grid-cols-12`.
  - cada rosca ocupa `xl:col-span-6 2xl:col-span-4`, e as pendências `xl:col-span-12 2xl:col-span-4`
  - resultado: empilhado abaixo de `xl`; dois gráficos lado a lado e pendências em linha inteira no `xl`; três colunas no `2xl`
  - cada painel tem `min-h-96`, a mesma altura dos esqueletos
- **Carregando**: `DashboardSkeleton` reproduz as duas grades (quatro blocos `h-44` e os três painéis com as mesmas classes de coluna).
- **Erro**: card com `Não foi possível carregar o mês.`, a mensagem em `text-rose-300` (o token `destructive` é escuro demais sobre o fundo escuro) e `Button` `Tentar de novo` → `refresh()`.
- **Aviso de corte**: parágrafo discreto ao final, com o número vindo de `STATEMENT_MAX_ENTRIES`.

A navegação para o extrato preserva o mês porque o `SelectedMonthProvider` fica no layout `(private)`, que não desmonta na navegação cliente.

### 8. Gráfico de rosca sobre `recharts`, com paleta validada e legenda própria

**Por que rosca**: é uma leitura de parte do todo com no máximo seis fatias (cinco com nome + `Outras`), o limite em que uma pizza ainda se lê de relance. A efetivação, que seria uma pizza de duas fatias, é um anel de valor único (decisão 6).

**Desenho**: `PieChart`/`Pie`/`Cell` dentro de `ResponsiveContainer`, num quadrado de 208px.
- `innerRadius="68%"`, começo às 12h
- `paddingAngle={2}` como espaço entre fatias (zero com uma fatia só) e `cornerRadius={4}`
- centro em HTML sobreposto: `Total` e `totalOutflow`, ou rótulo, total e `N% das saídas` da fatia ativa
- `aria-live="polite"` no centro

**Paleta**: slots categóricos para fundo escuro, em ordem fixa por posição: `#3987e5` (azul), `#d95926` (laranja), `#199e70` (verde-água), `#c98500` (amarelo), `#d55181` (magenta). `Outras` usa o neutro `#475569`.

O validador de paleta, rodado como anel (a última fatia encosta na primeira) contra `#020817` e `#18181b`, deu:
- faixa de luminosidade, croma e contraste aprovados nos slots com cor
- pior separação entre vizinhas para daltonismo com ΔE 8,4, acima do alvo de 8
- pior separação entre vizinhas para visão normal com ΔE 19,3, acima do mínimo de 15
- o neutro fica abaixo de 3:1 de contraste por ser cinza de propósito

A legenda escrita ao lado de cada fatia é a compensação exigida. Um cinza mais claro (`#64748b`) foi descartado por se confundir com o magenta para protanopia (ΔE 1,8).

**Legenda e hover**: a legenda é HTML (`ul`), com um ponto de cor, rótulo, total e percentual. `activeKey` em `useState` é compartilhado entre `Pie.onMouseEnter`/`onMouseLeave` e `onMouseEnter`/`onFocus`/`onBlur` das linhas (focáveis por `tabIndex`). A fatia ativa fica opaca e as demais a 35%. O card usa `@container`: gráfico e legenda lado a lado a partir de `@md`, e empilhados abaixo disso — funciona tanto na coluna estreita do `2xl` quanto no mobile.

Alternativas:
- **`PieBreakdownChart` compartilhado** — rejeitada: paleta cíclica de verdes não validada, legenda do `recharts` sem valores, raios fixos e sem destaque sincronizado.
- **Tooltip do `recharts`** — rejeitada, o centro da rosca mostra a mesma informação sem cobrir o gráfico e funciona também pelo teclado na legenda.
- **Cor cadastrada da categoria** — rejeitada: o DTO não traz a cor, cores escolhidas pelo usuário não são validadas entre si, e o gráfico de contas não teria equivalente.
- **Barras horizontais neutras** — versão anterior; o usuário pediu gráficos de pizza.

### 9. Largura total nas páginas privadas

O contêiner raiz de cada página privada passa de `mx-auto max-w-{3xl|4xl|6xl} px-4 py-6` para `w-full` (mantendo `space-y-6` onde existia). Isso vale para o dashboard, o extrato e seus quatro modos de formulário, e as listas e formulários de contas, cartões, categorias e dev. O espaçamento fica só no `<main>` do `AdminShell`, o que elimina a margem dupla e alinha todas as telas. Os campos continuam limitados pelo `max-w-2xl` do `FormSectionLayout`.

Alternativas:
- **Limite maior (`max-w-screen-2xl`)** — rejeitada, ainda deixaria faixas vazias em monitores largos, e o pedido foi ocupar o espaço inteiro.
- **Mudar o `AdminShell`** — rejeitada, a caixa não vinha dele.
- **Criar um componente `PageContainer`** — rejeitada por ora, seria um arquivo novo em `shared/` para uma classe só.

## Risks / Trade-offs

- **[Soma sobre conjunto cortado em meses com mais de 500 entradas]** → O corte é pelas datas mais recentes. O aviso visível evita erro silencioso; um resumo no servidor fica para quando houver caso real.
- **[`meta.total` não diz se houve corte]** → `entries.length >= 500` é tratado como "possivelmente cortado"; um mês com exatamente 500 entradas mostra o aviso sem ter perdido nada.
- **[Dashboard × relatórios]** → Os relatórios somarão só o que está gravado, e o dashboard inclui ocorrências geradas. Os rótulos "previsto" e "efetivado" deixam explícito o que cada número soma.
- **[Cor pela posição, não pela entidade]** → A mesma categoria pode mudar de cor entre meses se mudar de posição no ranking. É aceitável num gráfico de um mês só, e a legenda sempre nomeia; cor fixa por entidade fica para os relatórios, com cor de categoria vinda do backend.
- **[Cor da rosca vs. tons semânticos]** → O laranja e o magenta da paleta não significam alerta. Entradas/saídas e atrasadas usam verde/vermelho só nos indicadores e nas pendências, sempre com rótulo.
- **[Cinza de `Outras` com baixo contraste]** → É compensado pela legenda sempre visível com rótulo, valor e percentual.
- **["Hoje" parado]** → `todayDateOnly()` é recalculado quando as entradas mudam, não à meia-noite. É aceito.
- **[Três helpers de data de hoje]** → Duplicação consciente, registrada como fora de escopo.
- **[Leitura extra de cadastros a cada visita]** → Duas requisições leves, uma vez por montagem.
- **[Formulários em tela larga]** → As seções se espalham, mas os campos ficam limitados a `max-w-2xl`. Se alguma tela futura não usar `FormSectionLayout`, precisará limitar os campos por conta própria.
- **[Animação do `recharts` a cada troca de mês]** → As roscas são remontadas depois do esqueleto e animam de novo. É aceito como transição.

## Migration Plan

Mudança só de frontend, sem dados nem API. O deploy é o build normal do frontend; o rollback é reverter o commit. A rota `/dashboard` volta ao placeholder e as páginas voltam à caixa centralizada.

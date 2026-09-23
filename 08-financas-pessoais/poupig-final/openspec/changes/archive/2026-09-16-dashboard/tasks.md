## 1. Sub-agente único — Leitura do contexto

- [x] 1.1 Ler `proposal.md`, `design.md` e `specs/month-dashboard/spec.md` desta mudança e consultar `node_modules/next/dist/docs/` sobre páginas do App Router antes de mexer na rota
- [x] 1.2 Ler as peças reaproveitadas, sem alterá-las:
  - `modules/transaction/data/use-statement.ts` (retorno `{ entries, total, isLoading, error, refresh }` e `params` nas dependências do efeito)
  - `data/statement-format.ts` e `data/group-statement-entries.ts` (`UNCLASSIFIED_GROUP_LABEL`)
  - `components/statement-item-parts.component.tsx` (`TransactionAmount`, `RecurrenceSign`)
  - `pages/monthly-statement.page.tsx` (`useMemo` dos parâmetros e `TooltipProvider`)
  - `shared/components/ui/metric-card.tsx`, `navigation-link-card.tsx`, `page-section-header.tsx`, `card.tsx` e `badge.tsx`
  - `modules/account/data/account-api.client.ts` e `modules/category/data/category-api.client.ts`
  - `modules/auth/data/auth.context.tsx`

## 2. Funções de apresentação

- [x] 2.1 Criar `apps/frontend/src/modules/transaction/data/dashboard-summary.ts`, sem React, com `DASHBOARD_PENDING_LIMIT = 5` e `DASHBOARD_TOP_CATEGORIES_LIMIT = 5` documentados e os tipos exportados `MonthSummary`, `PendingGroup` e `SpendingCategory`
- [x] 2.2 Implementar `todayDateOnly()`: data local em `YYYY-MM-DD` por `getFullYear`/`getMonth() + 1`/`getDate` com padding e comentário explicando por que não usar `toISOString()`
- [x] 2.3 Implementar `summarizeMonth(entries)`, ignorando `CANCELED`:
  - `inflow`/`outflow` com `PENDING` + `SETTLED` e `settledInflow`/`settledOutflow` só com `SETTLED`
  - `expectedResult` e `settledResult`
  - `settledCount` e `activeCount`
- [x] 2.4 Implementar `splitPending(entries, today)`:
  - só `PENDING`, com `overdue` para `expectedOn < today` e `upcoming` para `expectedOn >= today`, comparando strings
  - ordenar uma cópia por `expectedOn` crescente com desempate `localeCompare` pt-BR do nome
  - `items` cortado em `DASHBOARD_PENDING_LIMIT` e `remaining` com o excedente
- [x] 2.5 Implementar `breakdownOutflow(entries, dimension, limit)` com `dimension: 'category' | 'account'`, `DASHBOARD_BREAKDOWN_LIMIT = 5`, `OTHERS_SLICE_LABEL = 'Outras'` e os tipos `OutflowSlice`/`OutflowBreakdown`:
  - somar `OUT` não canceladas por `categoryName ?? UNCLASSIFIED_GROUP_LABEL` (importado de `group-statement-entries.ts`) ou por `accountName`
  - ordenar por `total` decrescente com desempate por rótulo; os primeiros `limit` viram fatias com nome e o restante uma única fatia `Outras` (`isOthers: true`), sempre a última e só quando soma mais que zero
  - `share` sobre o total de saídas não canceladas, e devolver também `totalOutflow`
  - `shareOf(part, whole)` exportado: fração limitada a 1, `0` sem total
- [x] 2.6 Implementar `isStatementTruncated(entries)` como `entries.length >= STATEMENT_MAX_ENTRIES`, importado de `@poupig/transaction`

## 3. Guia de primeiros passos (dados)

- [x] 3.1 Criar `data/use-dashboard-onboarding.ts`:
  - `useAuth` de `@/modules/auth/data/auth.context` e `useEffect` com `[token]` que dispara `Promise.all([listAccounts(token, 1, 1), listCategories(token)])`
  - estado gravado só no `.then`/`.catch` com chave do token e flag `isCurrent` desligada no cleanup
  - retorno `{ status: 'loading' | 'ready' | 'unavailable'; hasAccounts; hasActiveCategories }`, com `loading` derivado (estado de outro token ou sem token), `hasAccounts = total > 0` e `hasActiveCategories` por `isActive`
  - qualquer falha vira `unavailable` sem toast
  - sem `any`, sem `setState` síncrono no efeito e sem alterar arquivos de `account`/`category`

## 4. Componentes

- [x] 4.1 Criar `components/dashboard-card.styles.ts` com `DASHBOARD_CARD_CLASSES` (gradiente escuro, borda e brilho interno do `MetricCard`), usado por todos os cards do dashboard
- [x] 4.2 Criar `components/dashboard-summary.component.tsx` (`DashboardSummaryComponent`, recebe `summary: MonthSummary`), sem `MetricCard`:
  - grade `sm:grid-cols-2 xl:grid-cols-4` com `IndicatorCard` interno (título, ícone em quadrado tingido e brilho radial por tom `inflow`/`outflow`/`neutral`)
  - `Resultado previsto` com valor colorido pelo sinal (verde ≥ 0, vermelho < 0) e faixa `Resultado efetivado`
  - `Entradas`/`Saídas` com previsto em destaque, legenda `previsto no mês` e medidor `role="meter"` com `shareOf(settled, expected)`, `Efetivado R$ …` e percentual
  - `Efetivação` com anel em SVG (`strokeDasharray`/`strokeDashoffset`, `role="progressbar"`, percentual no centro) e `N de M` transações efetivadas
- [x] 4.3 Criar `components/dashboard-breakdown-chart.component.tsx` (`DashboardBreakdownChartComponent`, recebe `title`, `description`, `slices`, `totalOutflow`, `emptyText` e `icon`):
  - rosca do `recharts` num quadrado de 208px (`innerRadius="68%"`, início às 12h, `paddingAngle` 2, `cornerRadius` 4)
  - paleta validada em ordem fixa `#3987e5`, `#d95926`, `#199e70`, `#c98500`, `#d55181` e neutro `#475569` para `Outras`
  - centro com `Total` e `totalOutflow`, ou rótulo, total e `N% das saídas` da fatia ativa (`aria-live="polite"`)
  - legenda HTML com ponto de cor, rótulo, total e percentual; `activeKey` compartilhado entre hover da fatia e hover/foco da linha, com as demais fatias a 35%
  - `@container` com gráfico e legenda lado a lado a partir de `@md`, e caixa tracejada com `emptyText` quando não há fatias
- [x] 4.4 Criar `components/dashboard-pending.component.tsx` (`DashboardPendingComponent`, recebe `overdue` e `upcoming`):
  - `Card` com `TooltipProvider`, título `Pendências`, descrição `O que ainda falta efetivar neste mês`, e grupos lado a lado a partir de `@2xl` (`@container`)
  - cabeçalho de grupo com ícone (`AlertTriangle`/`CalendarClock`) e contagem em pílula, vermelha em `Atrasadas` com contagem maior que zero
  - linhas `Link` para `/transactions` com selo de dia e mês abreviado (`split('-')` + `MONTH_SHORT_LABELS`, `formatDateOnly` no `title` e para leitor de tela), nome, conta, `TransactionAmount` e `RecurrenceSign`
  - `e mais N`, textos de grupo vazio (`Nada atrasado neste mês` e `Nada por vir neste mês`) em caixa tracejada e rodapé `Ver no extrato`
- [x] 4.5 Criar `components/dashboard-shortcuts.component.tsx` (`DashboardShortcutsComponent`), sem `NavigationLinkCard`: seção `Atalhos` com quatro `Link` horizontais em `sm:grid-cols-2 xl:grid-cols-4`, cada um com ícone em quadrado tingido, título, descrição de uma linha e `ArrowUpRight`:
  - `Extrato Mensal` (`/transactions`, `ReceiptText`, azul)
  - `Contas` (`/accounts`, `Wallet`, verde)
  - `Cartões` (`/cards`, `CreditCard`, violeta)
  - `Categorias` (`/categories`, `Tags`, âmbar)
- [x] 4.6 Criar `components/dashboard-onboarding.component.tsx` (`DashboardOnboardingComponent`, recebe `hasAccounts`, `hasActiveCategories` e `hasTransactions`):
  - card com brilho azul, ícone `Sparkles`, título `Primeiros passos`, descrição `Complete a base para acompanhar o seu mês` e contador `N de 3 concluídos`
  - passos em `md:grid-cols-3` com título e descrição curta: `Cadastrar a primeira conta` (`/accounts`), `Aplicar as categorias padrão` (`/categories`) e `Registrar a primeira transação` (`/transactions`)
  - passo pendente como `Link` com o número; passo feito com `Check` e título riscado, sem link
  - devolve `null` quando os três estão feitos

## 5. Página e rota

- [x] 5.1 Criar `pages/month-dashboard.page.tsx` (`MonthDashboardPage`):
  - `useSelectedMonth` e `PageSectionHeader` com badge `Dashboard`, título `monthLabel` e subtítulo `Visão geral do mês selecionado`
  - parâmetros do extrato em `useMemo(() => ({ from: monthStart, to: monthEnd }), [monthStart, monthEnd])` passados a `useStatement` — nunca objeto literal na chamada
  - `summary`, `pending`, `byCategory`, `byAccount` e `truncated` num `useMemo` sobre `entries` com `todayDateOnly()`
- [x] 5.2 Na mesma página, montar o corpo na ordem onboarding → indicadores → painéis → atalhos → aviso de corte:
  - painéis em grade `xl:grid-cols-12`: `Gastos por categoria` (`PieChart`) e `Saídas por conta` (`Landmark`) em `xl:col-span-6 2xl:col-span-4`, e pendências em `xl:col-span-12 2xl:col-span-4`, cada painel com `min-h-96`
  - aviso de corte (`isStatementTruncated`) discreto, com o número de `STATEMENT_MAX_ENTRIES`
- [x] 5.3 Tratar os estados na página:
  - **carregando**: `DashboardSkeleton` com as mesmas grades dos indicadores e dos painéis
  - **erro**: card com `Não foi possível carregar o mês.`, mensagem em `text-rose-300` e `Button` `Tentar de novo` chamando `refresh`, no lugar de indicadores e painéis
  - **guia**: renderizado só com `onboarding.status === 'ready'`, extrato carregado sem erro e algum passo pendente (`hasTransactions = summary.activeCount > 0`)
  - atalhos sempre visíveis
- [x] 5.4 Substituir `apps/frontend/src/app/(private)/dashboard/page.tsx` por uma rota que só delega para `MonthDashboardPage` (import relativo, como `cards/page.tsx`), sem guard próprio
- [x] 5.5 Exportar em `modules/transaction/data/index.ts` os arquivos `dashboard-summary` e `use-dashboard-onboarding`, e em `modules/transaction/index.ts` os componentes `dashboard-*` e a página `month-dashboard.page`, em ordem alfabética e sem colisão de nomes com exports existentes

## 6. Largura total na área privada

- [x] 6.1 Trocar o contêiner raiz `mx-auto max-w-{3xl|4xl|6xl} px-4 py-6` por `w-full` (mantendo `space-y-6` onde existia) em `month-dashboard.page.tsx`, nos cinco retornos de `monthly-statement.page.tsx` (lista, nova transação/edição, nova série, ocorrência e editar série), em `accounts.page.tsx`, `credit-cards.page.tsx` e `categories.page.tsx` (lista e formulário) e em `data-generator.page.tsx`
- [x] 6.2 Conferir que todos os formulários tocados usam `FormSectionLayout` (campos limitados a `max-w-2xl`) e que `/` e `/join` continuam centralizados

## 7. Verificação final

- [x] 7.1 `npm run build` na raiz verde
- [x] 7.2 `npx eslint` **sem `--fix`** limpo nos arquivos criados; nas páginas só ajustadas, apenas o `any` pré-existente de `accounts.page.tsx` (os 88 erros pré-existentes do frontend ficam como estão)
- [x] 7.3 Conferir por busca nos arquivos novos: nenhum `any`, nenhum `setState` síncrono em `useEffect`, nenhum `toISOString`, nenhum `new Date(<string YYYY-MM-DD>)`, nenhuma chamada a `useStatement` com objeto literal e nenhuma dependência nova em `package.json`
- [x] 7.4 Rodar o validador de paleta sobre as cores da rosca (como anel, contra `#020817` e `#18181b`) e registrar o resultado no `design.md`
- [x] 7.5 Conferir que as alterações se limitam a `apps/frontend/src/modules/transaction`, `apps/frontend/src/app/(private)/dashboard/page.tsx` e à classe do contêiner das páginas de `account`, `credit-card`, `category` e `dev`. `shared/`, `MetricCard`, `NavigationLinkCard`, `PieBreakdownChart`, `DashboardBreakdownCard`, `DashboardRankingListCard` e `dashboard.constants.ts` ficam intocados. O working tree já tem mudanças não commitadas de prompts anteriores: comparar só os arquivos tocados. Não testar via navegador (teste manual do usuário)

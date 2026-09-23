## 1. Sub-agente de negócio — Leitura do contexto

- [x] 1.1 Ler `proposal.md`, `design.md` e o spec `recurrence-report-domain` desta mudança
- [x] 1.2 Ler as peças reaproveitadas, sem alterá-las:
  - `modules/transaction/src/report` inteiro (em especial `use-case/summarize-monthly-cash-flow.use-case.ts`, `model/cash-flow-calendar.service.ts`, `model/cash-flow-window.ts`, `model/cash-flow-accumulator.service.ts` e os barris)
  - `modules/transaction/src/scheduled-transaction/model/scheduled-transaction-generator.service.ts` e `provider/list-materialized-occurrence-keys.query.ts`
  - `modules/transaction/src/transaction-series/provider/list-active-transaction-series.query.ts`, `provider/find-transaction-series-by-id.query.ts`, `dto/transaction-series.dto.ts`, `model/series-kind.enum.ts` e `model/recurrence-rule.ts`
  - `modules/transaction/test/report/summarize-monthly-cash-flow.use-case.test.ts`, `test/report/cash-flow-accumulator.service.test.ts` e `test/mock/transaction-series-dto.fixture.ts`

## 2. Negócio — DTO, acumulador, consulta e caso de uso

- [x] 2.1 Criar `src/report/dto/recurrence-report.dto.ts` (skill `module-dto`):
  - `RecurrenceMonthTotalDTO { month: string; total: number }`
  - `RecurrenceReportLineDTO { seriesId; name; direction; value; recurrence; accountName; creditCardName; categoryName; subcategoryName; startDate; endDate; total; months }`
  - documentar campo a campo: `value` é o valor atual da série; valores positivos com duas casas; `total` soma dos meses; `months` com exatamente os meses da janela, crescentes, terminando na referência, com zero no mês sem ocorrência; quais séries aparecem (abertas vigentes, mesmo zeradas, e a encerrada com ocorrência adiada para a janela) e por quê; ordem (`IN` antes de `OUT`, nome `pt-BR`, `seriesId`)
- [x] 2.2 Criar `src/report/model/recurrence-accumulator.service.ts` com `RecurrenceAccumulator` no desenho da decisão 3 do `design.md`: `constructor(monthKeys)`, `register(series)` idempotente, `add(series, month, value)` em centavos ignorando mês fora da janela e `toDTOs()` com `total` em centavos, valores em reais e a ordem da resposta
- [x] 2.3 Criar `src/report/provider/summarize-stored-recurrence-occurrences.query.ts` (skill `module-query-cqrs`):
  - `StoredRecurrenceOccurrenceTotal { seriesId: string; month: string; total: number }`
  - `SummarizeStoredRecurrenceOccurrencesInput { userId; from; to }`
  - `SummarizeStoredRecurrenceOccurrencesQuery` com `execute` devolvendo `Promise<Result<StoredRecurrenceOccurrenceTotal[]>>`
  - documentar: ocorrências gravadas do usuário por série e mês de `expectedOn` no período inclusivo; só séries `OPEN` não excluídas; sem `CANCELED`; total positivo com duas casas; só pares com ocorrência, sem ordem; **sem** ocorrências geradas e sem avulsas
- [x] 2.4 Criar `src/report/use-case/summarize-recurrences.use-case.ts` (skill `module-use-case`):
  - `SummarizeRecurrencesInput { userId: string; reference: string; months: number }` (entrada crua)
  - `SummarizeRecurrences implements UseCase<SummarizeRecurrencesInput, RecurrenceReportLineDTO[]>` com as quatro consultas no construtor, na ordem da decisão 1 do `design.md`
  - fluxo da decisão 1: validação com `CashFlowCalendar.isValidReference`/`isCashFlowWindow` e `SummarizeMonthlyCashFlowErrors` sem consultar; `periodOf`; `Promise.all` + `Result.combine`; séries `OPEN` registradas; ids gravados ausentes buscados com `FindTransactionSeriesByIdQuery` em `Promise.all` (falha propagada, `null` ou `CLOSED` descartados); gravados somados; `generateForPeriod` com supressão por `seriesId:occurrenceIndex`; `toDTOs()`
  - documentar no arquivo o que cada mês enxerga, por que a supressão vale para qualquer situação e por que reaproveita janela, calendário e erros do relatório de entradas x saídas
- [x] 2.5 Exportar os arquivos novos nos barris existentes `src/report/dto/index.ts`, `model/index.ts`, `provider/index.ts` e `use-case/index.ts`, conferindo que nenhum nome colide com as peças do prompt 22

## 3. Negócio — testes

- [x] 3.1 Criar `test/report/recurrence-accumulator.service.test.ts`:
  - série registrada sem valor sai com todos os meses em `0` e `total` `0`
  - `0.1` + `0.2` no mesmo mês dá exatamente `0.3`, e o `total` também
  - mês fora da janela ignorado sem falhar
  - `register` repetido e `add` depois de `register` não duplicam a linha
  - ordem `IN` antes de `OUT` e por nome com acento (`Água` antes de `Internet`), com desempate por `seriesId`
- [x] 3.2 Criar `test/report/summarize-recurrences.use-case.test.ts` com stubs em memória das quatro consultas e `seriesDTO({ kind: SeriesKind.OPEN, installments: null, ... })`, cobrindo:
  - referência inválida e janela inválida devolvem `INVALID_REPORT_REFERENCE`/`INVALID_REPORT_WINDOW` sem chamar nenhuma consulta
  - série `CLOSED` não aparece e não gera
  - recorrência mensal gera o valor da série em cada mês da janela
  - recorrência semanal soma cinco ocorrências em agosto de 2026 e quatro em setembro de 2026
  - recorrência anual sem ocorrência na janela aparece zerada
  - recorrência que começa no meio da janela zerada antes do início; com fim no meio, zerada depois do fim
  - ocorrência gravada soma o valor gravado e suprime a gerada da mesma chave
  - chave gravada `CANCELED` (ausente da soma gravada) não reaparece gerada
  - ocorrência gravada adiada para outro mês da janela soma no mês novo
  - `seriesId` gravado fora da lista busca a série por id e vira linha; `null` descarta os valores
  - cada linha com `months` do tamanho da janela, em ordem crescente
  - usuário sem recorrência devolve `[]`
  - falha de cada uma das quatro consultas propagada
- [x] 3.3 Rodar `npm run build` na raiz e os testes de `@poupig/transaction`, todos verdes

## 4. Sub-agente de backend — Adapter, controller e roteiro

- [x] 4.1 Ler `proposal.md`, `design.md`, o spec `recurrence-report-backend` e as peças: `transaction-report.prisma.ts`, `transaction-report.controller.ts`, `transaction-report.integration.http`, `transaction.module.ts`, `transaction-series.prisma.ts` (`findTransactionSeriesById`), os roteiros `.http` de `transaction-series`, `scheduled-transaction` e `statement` e o model Prisma de `transaction`
- [x] 4.2 Em `transaction-report.prisma.ts` (skill `backend-prisma-data`), acrescentar ao `TransactionReportPrisma`, sem mexer na `summarizeStoredCashFlow`:
  - `StoredRecurrenceOccurrenceRow { seriesId: string; month: string; total: unknown }`
  - `readonly summarizeStoredRecurrenceOccurrences: SummarizeStoredRecurrenceOccurrencesQuery` com o `$queryRaw` da decisão 5 do `design.md`: nomes mapeados entre aspas, aliases em toda coluna, literais de enum sem tipo, `::date` nos parâmetros, `::timestamp` na chave do mês, `GROUP BY 1, 2` e sem ordem; conferir cada nome de coluna no model antes de escrever
  - conversão com o `toAmount` que já existe no arquivo; comentário dizendo que o período chega validado pelo caso de uso
- [x] 4.3 Em `transaction-report.controller.ts` (skill `backend-controller`), acrescentar `@Get('recurrences')`:
  - monta `new SummarizeRecurrences(this.transactionReportPrisma.summarizeStoredRecurrenceOccurrences, this.scheduledTransactionPrisma.listMaterializedOccurrenceKeys, this.transactionSeriesPrisma.listActiveTransactionSeries, this.transactionSeriesPrisma.findTransactionSeriesById)` no método
  - `@CurrentUser()`, `reference as string` e `Number(months)`, sem valor padrão
  - falha → `BadRequestException(result.errors)`; sucesso → `result.instance`
  - comentário do método explicando a resposta sem paginação e a validação no domínio
  - `transaction.module.ts` sem mudança
- [x] 4.4 Criar `recurrence-report.integration.http` no formato de `transaction-report.integration.http` (`@baseUrl`/`@password`, usuários com `{{$guid}}`, cabeçalho explicando a rota e o formato de erro, status e corpo esperados comentados), conferindo rotas e corpos nos roteiros existentes e cobrindo todos os casos do requisito "Testes de integração via Rest Client" do spec de backend
- [x] 4.5 Rodar `npm run build` e os testes do backend e do domínio, todos verdes

## 5. Sub-agente de frontend — Dados

- [x] 5.1 Ler `proposal.md`, `design.md`, os specs `recurrence-report-frontend` e `sidebar-navigation` e as peças: `use-cash-flow-report.ts`, `cash-flow-report-api.client.ts`, `cash-flow-window.ts`, `cash-flow-series.ts`, `cash-flow-summary.component.tsx`, `cash-flow-comparison-chart.component.tsx`, `cash-flow-window-selector.component.tsx`, `cash-flow-report.page.tsx`, `dashboard-card.styles.ts`, `statement-format.ts`, `transaction-series.labels.ts`, `composed-bar-line-chart.tsx`, `table.tsx`, `checkbox.tsx`, `month.util.ts`, `selected-month.hook.ts`, `use-local-storage.hook.ts`, `modules/transaction/data/index.ts`, `modules/transaction/index.ts` e `app/(private)/layout.tsx`
- [x] 5.2 Criar `modules/transaction/data/recurrence-report-api.client.ts`: `RecurrenceReportApiError` e `fetchRecurrenceReport(token, { reference, months }): Promise<RecurrenceReportLineDTO[]>` com `URL.searchParams`; `headers`, `extractMessages` e `handleError` locais e não exportados. Nada novo no i18n
- [x] 5.3 Em `modules/transaction/data/transaction-series.labels.ts`, acrescentar `formatRecurrenceFrequency(rule: RecurrenceRule): string` (`Semanal`/`Mensal`/`Anual` com intervalo 1; `A cada N semanas/meses/anos` acima), declarado sobre `FrequencyUnit`, sem alterar os rótulos existentes
- [x] 5.4 Criar `modules/transaction/data/recurrence-report.ts` (puro, sem React), no desenho da decisão 6 do `design.md`:
  - `RecurrenceGroupId`, `RECURRENCE_GROUP_LABELS`, `RecurrencePreferences { version: 1; months: CashFlowWindow }`, `DEFAULT_RECURRENCE_WINDOW = 12` e `RECURRENCE_PREFERENCES_STORAGE_KEY = 'poupig:recurrence-report'`, comentando por que só a janela é gravada
  - `RecurrenceRow`, `RecurrenceGroup`, `RecurrenceTotals` e `RecurrenceReport`
  - `buildRecurrenceReport(lines, uncheckedIds, excludeHiddenFromTotals)` com meses e rótulos curtos, os dois grupos sempre presentes, `isChecked` (visível) e `isCounted` por linha, `checkState` tri-estado sobre as visíveis, subtotais, `resultByMonth` e totais só das `isCounted` (todas com a opção desligada), médias sobre os meses da janela, `commitment` (`null` sem entrada), `excludesHidden`, `uncheckedCount` só dos ids presentes, tudo em centavos; lista vazia sem meses
  - `formatCommitment(value)` → `42%` ou `—`
- [x] 5.5 Criar `modules/transaction/data/use-recurrence-report.ts` no molde do `use-cash-flow-report.ts`:
  - `RequestState` por chave com `[token, reference, months, reloadCount]`, `isCurrent`, `toErrorMessage` local e `refresh`
  - janela no `useLocalStorage` com `deserialize` que lança no inválido (`version`, `isCashFlowWindow`), sem `isReady`
  - `uncheckedIds` em `useState`, preservado entre mês e janela, filtrado no `buildRecurrenceReport` e sem `useEffect`; comentário da decisão
  - `hiddenTotalIds` (linhas de total escondidas), `highlightedLineId` e `excludeHiddenFromTotals` (padrão `false`) em `useState`, na sessão e sem chave; comentário do porquê a opção não é gravada
  - `report` (`buildRecurrenceReport(lines, uncheckedIds, excludeHiddenFromTotals)`) e `chart` (`buildRecurrenceChart(report, hiddenTotalIds)`) em `useMemo`
  - `toggleRecurrence(id)`, `setGroupChecked(groupId, checked)`, `checkAll()`, `toggleChartLine(lineId)`, `toggleChartSection(sectionId)` e `showAllChartLines()` sem `fetch`, na regra da decisão 7 do `design.md`
  - expõe `months`, `setMonths`, `report`, `chart`, `hasRecurrences`, as seis ações, `highlightedLineId`, `setHighlightedLineId`, `excludeHiddenFromTotals`, `setExcludeHiddenFromTotals`, `isLoading`, `error` e `refresh`; sem `any` e sem `setState` síncrono em `useEffect`
- [x] 5.6 Em `shared/components/ui/checkbox.tsx`, desenhar o estado indeterminado: `Minus` no `Indicator` quando `checked === 'indeterminate'` e `data-[state=indeterminate]` com o fundo e a cor do marcado, sem prop nova e sem mudar marcado e desmarcado
- [x] 5.7 Criar `modules/transaction/data/recurrence-chart.ts` (puro, sem React), no desenho da decisão 7 do `design.md`: `RECURRENCE_TOTAL_LINE_IDS`, `isRecurrenceTotalLineId`, paletas `INFLOW_LINE_COLORS`/`OUTFLOW_LINE_COLORS` por posição no grupo, `RecurrenceChartLine`, `RecurrenceChartSection` (com `onCount` e `state` `on`/`off`/`mixed`), `RecurrenceChartPoint` no formato largo e `buildRecurrenceChart(report, hiddenTotalIds)` devolvendo `sections` (`totals`, `inflow`, `outflow`), `visibleLines`, `points` e `hiddenCount`, com a descrição das linhas de total seguindo `report.excludesHidden`
- [x] 5.8 Criar `shared/components/ui/multi-line-chart.tsx` (`MultiLineChart`), apresentação pura com o estilo do `composed-bar-line-chart.tsx`: `series` só com as linhas a desenhar (`key`, `label`, `color`, `emphasis?`, `dashed?`), `zeroLine` (padrão `true`), `highlightedKey`, `dot={false}` com `activeDot`, tooltip ordenado por valor decrescente, sem `Legend` do `recharts` e `emptyState` com `data` ou `series` vazios

## 6. Frontend — Componentes, página, rota e menu

- [x] 6.1 Criar `components/recurrence-summary.component.tsx`: grade `sm:grid-cols-2 xl:grid-cols-4` com quatro cards locais no desenho do `TotalCard` (`DASHBOARD_CARD_CLASSES`, tons de entrada, saída e neutro): `Entradas recorrentes`, `Saídas recorrentes` e `Resultado recorrente` (sinal só como cor) com legenda `média de R$ X por mês`, e `Comprometimento` com `formatCommitment`; só formatando o que recebe
- [x] 6.2 Criar o gráfico e a legenda:
  - `components/recurrence-chart.component.tsx`: `Card` com título `Evolução das recorrências`, subtítulo `Clique na legenda para habilitar ou desabilitar uma linha ou um grupo inteiro`, a caixa `Descontar dos totais as recorrências ocultas` (`Checkbox` + `Label` com `useId`, chamando `setExcludeHiddenFromTotals`) e ícone `ChartLine`; corpo `grid lg:grid-cols-[minmax(0,1fr)_20rem]` com `MultiLineChart` (`chart.points`, `chart.visibleLines`, `highlightedKey`, `formatCurrency`, `emptyState` `Habilite ao menos uma linha na legenda para ver a evolução`) e a legenda
  - `components/recurrence-chart-legend.component.tsx`: `Mostrar todas (N)` só com linha desligada; por grupo com linhas, título como botão (`aria-pressed` `true`/`false`/`'mixed'`, `onCount/total`, ícone `EyeOff` ou `Eye`) chamando `toggleChartSection`; itens como botões com `aria-pressed`, amostra da linha (cor, espessura, tracejado), nome (riscado e apagado quando desligado), descrição, total em `formatCurrency` (`Total geral` com cor pelo sinal), clique em `toggleChartLine` e hover/foco em `setHighlightedLineId`; sem `FilterPill`
- [x] 6.3 Criar `components/recurrence-table.component.tsx`:
  - `Card` `Recorrências` com subtítulo `Desmarque uma recorrência para escondê-la do gráfico` (mais ` e descontá-la dos totais` com `excludesHidden`) e `Mostrar todas (N)` no cabeçalho só quando `uncheckedCount > 0`; corpo em `overflow-x-auto`
  - primeira coluna `sticky left-0` com fundo opaco: `Checkbox` com `aria-label`, nome, `frequencyLabel` e `detailLabel`; colunas de mês com `monthLabels`; coluna `Total`; valores `tabular-nums` alinhados à direita com `formatCurrency` e traço discreto no zero
  - por grupo: cabeçalho com `Checkbox` tri-estado (`checked={group.checkState}`, `onCheckedChange` → `setGroupChecked`), rótulo e `N de M visíveis`; linhas (escondida com opacidade e valores visíveis); linha vazia quando o grupo não tem recorrência; subtotal `Total de entradas`/`Total de saídas` na cor do grupo, seguindo a opção de descontar
  - linha final `Resultado recorrente` com `resultByMonth` e o resultado do período, sinal só como cor; nenhuma linha navega
- [x] 6.4 Criar `pages/recurrence-report.page.tsx`:
  - `w-full space-y-6`; `PageSectionHeader` com badge `Relatórios`, título `Recorrências`, subtítulo `Últimos N meses, até <mês>` (`formatMonthInSentence`) e `CashFlowWindowSelectorComponent` no `aside`
  - corpo: totais → gráfico com legenda → tabela → nota de rodapé (`text-xs text-muted-foreground`) dizendo que soma ocorrências pendentes e efetivadas das recorrências pela data prevista, incluindo as não abertas com o valor atual da série, sem canceladas, sem parcelamentos e avulsas, e que esconder só tira do gráfico, com os totais considerando todas a não ser com a opção de descontar as ocultas ligada
  - sem recorrência: `Card` de estado vazio com link para `/transactions` (`Extrato Mensal`)
  - esqueleto com os blocos e alturas finais; erro em `Card role="alert"` com `Tentar de novo` chamando `refresh`
- [x] 6.5 Criar `app/(private)/reports/recurrences/page.tsx` só delegando para a página do módulo
- [x] 6.6 Em `app/(private)/layout.tsx`, acrescentar à seção `reports`, depois de `category-spending`, `{ id: 'recurrences', label: 'Recorrências', href: '/reports/recurrences', icon: Repeat, match: 'prefix' }`, importando `Repeat`; não mexer no `SidebarMenu`, nos itens existentes nem na posição do `EXTRAS_SECTION`
- [x] 6.7 Atualizar `modules/transaction/data/index.ts` e `modules/transaction/index.ts` com os arquivos novos, conferindo que nenhum nome exportado colide dentro do módulo

## 7. Fechamento

- [x] 7.1 Rodar `npm run build` no workspace e `npm test`, com domínio e backend verdes
- [x] 7.2 Rodar `npx eslint` sem `--fix` em todos os arquivos criados ou alterados, de frontend e backend, sem nenhum erro (os erros pré-existentes continuam iguais); não rodar `npm run lint` no backend
- [x] 7.3 Conferir que o diff se limita a:
  - `modules/transaction/src/report` e `modules/transaction/test/report`
  - `apps/backend/src/modules/transaction`: `transaction-report.prisma.ts`, `transaction-report.controller.ts` e `recurrence-report.integration.http`
  - `apps/frontend/src/modules/transaction`, `apps/frontend/src/shared/components/ui/checkbox.tsx` e `apps/frontend/src/shared/components/ui/multi-line-chart.tsx`
  - `app/(private)`: layout e rota nova

  O working tree já tem mudanças não commitadas de prompts anteriores: comparar só os arquivos tocados. Não testar via navegador (teste manual do usuário)

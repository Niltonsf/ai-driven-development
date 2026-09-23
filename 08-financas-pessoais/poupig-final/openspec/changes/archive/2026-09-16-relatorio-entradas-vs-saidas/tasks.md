## 1. Sub-agente de negócio — Leitura do contexto

- [x] 1.1 Ler `proposal.md`, `design.md` e os specs `cash-flow-report-domain` e `scheduled-transaction-domain` desta mudança
- [x] 1.2 Ler as peças reaproveitadas, sem alterá-las:
  - `modules/transaction/src/monthly-statement` (`use-case/find-monthly-statement.use-case.ts`, barris e `model/`)
  - `src/scheduled-transaction/model/scheduled-transaction-generator.service.ts` e `src/scheduled-transaction/provider/*`
  - `src/transaction-series/provider/list-active-transaction-series.query.ts`
  - `src/movement/model/direction.enum.ts` (`isDirection`) e `DateOnly` do `@poupig/shared`
  - `test/monthly-statement/find-monthly-statement.use-case.test.ts`, `test/movement/movement-enums.test.ts`, `test/mock/in-memory-scheduled-transaction.repository.ts` e `test/mock/transaction-series-dto.fixture.ts`

## 2. Negócio — consulta das chaves gravadas (`scheduled-transaction`)

- [x] 2.1 Criar `src/scheduled-transaction/provider/list-materialized-occurrence-keys.query.ts` (skill `module-query-cqrs`):
  - `MaterializedOccurrenceKey { seriesId; occurrenceIndex }`
  - `ListMaterializedOccurrenceKeysInput { userId; from; to }`
  - `ListMaterializedOccurrenceKeysQuery` com `execute` devolvendo `Promise<Result<MaterializedOccurrenceKey[]>>`
  - documentar: filtro por `occurrenceOn` no período inclusivo, qualquer situação (inclusive `CANCELED`), série excluída fora, sem ordem, existe só para suprimir a geração
  - exportar no `provider/index.ts`
- [x] 2.2 Acrescentar `listMaterializedOccurrenceKeys` ao `test/mock/in-memory-scheduled-transaction.repository.ts`, reaproveitando `visible(userId)`
- [x] 2.3 Cobrir no `test/scheduled-transaction/in-memory-scheduled-transaction.repository.test.ts`:
  - filtro por `occurrenceOn`, e não por `expectedOn`
  - `CANCELED` incluída
  - série excluída fora
  - outro usuário fora

## 3. Negócio — modelo de leitura `report`

- [x] 3.1 Criar `src/report/dto/monthly-cash-flow.dto.ts` (skill `module-dto`) com `MonthlyCashFlowDTO { month; inflow; outflow; balance }`, documentando cada campo e a garantia de todo mês da janela presente
- [x] 3.2 Criar `src/report/model/cash-flow-window.ts`:
  - `CASH_FLOW_WINDOWS = [6, 12, 18, 24] as const`
  - `CashFlowWindow`
  - `isCashFlowWindow(value: unknown)`
  - comentário explicando por que o conjunto é fechado
- [x] 3.3 Criar `src/report/model/cash-flow-calendar.service.ts` com `CashFlowCalendar` (estáticos, sem `Date` local):
  - `isValidReference(value: unknown)`: padrão `^\d{4}-\d{2}$` e `DateOnly.tryCreate` do dia 1 com valor normalizado igual
  - `periodOf(reference, months)` → `{ from, to, monthKeys }`, pelo índice absoluto de mês, com último dia via `Date.UTC(year, month, 0)` lido com `getUTCDate`
  - `monthKeyOf(date)`
- [x] 3.4 Criar `src/report/model/cash-flow-accumulator.service.ts` com `CashFlowAccumulator`:
  - baldes dos `monthKeys` zerados
  - `add(month, direction, value)` em centavos inteiros, ignorando mês fora da janela
  - `toDTOs()` na ordem das chaves com `balance` e divisão por 100
  - sem expor a estrutura interna
- [x] 3.5 Criar `src/report/provider/summarize-stored-cash-flow.query.ts` (skill `module-query-cqrs`):
  - `StoredMonthlyCashFlow { month; inflow; outflow }`
  - `SummarizeStoredCashFlowInput { userId; from; to }`
  - `SummarizeStoredCashFlowQuery`
  - contrato documentado: avulsas não excluídas + ocorrências gravadas de séries não excluídas, por mês de `expectedOn` no período, sem `CANCELED`, só meses com linha, positivos com duas casas, sem ocorrências geradas
- [x] 3.6 Criar `src/report/use-case/summarize-monthly-cash-flow.use-case.ts` (skill `module-use-case`), no desenho do `FindMonthlyStatement`:
  - `SummarizeMonthlyCashFlowErrors` (`INVALID_REPORT_REFERENCE`, `INVALID_REPORT_WINDOW`) e `SummarizeMonthlyCashFlowInput { userId; reference; months: number }`
  - construtor com `SummarizeStoredCashFlowQuery`, `ListMaterializedOccurrenceKeysQuery` e `ListActiveTransactionSeriesQuery`
  - validar referência e depois janela, sem chamar consultas; derivar o período; `Promise.all` + `Result.combine`
  - `Set` de chaves `` `${seriesId}:${occurrenceIndex}` ``; somar as linhas gravadas; gerar com `ScheduledTransactionGenerator.generateForPeriod` e somar cada ocorrência por `monthKeyOf(expectedOn)`, `direction` e `value`
  - documentar as três fontes, a supressão por `occurrenceOn` com qualquer situação, o eixo `expectedOn`, `CANCELED` fora e a equivalência com o extrato sem o teto
- [x] 3.7 Criar os barris `dto/index.ts`, `model/index.ts`, `provider/index.ts`, `use-case/index.ts` e `index.ts` de `src/report`, e exportar `./report` no `src/index.ts` depois de `./monthly-statement`

## 4. Negócio — testes

- [x] 4.1 Criar `test/report/cash-flow-window.test.ts`:
  - `CASH_FLOW_WINDOWS` igual a `[6, 12, 18, 24]`
  - aceitos `6`, `12`, `18` e `24`
  - recusados (`test.each`) `7`, `0`, `-6`, `12.5`, `NaN`, `'12'`, `null` e `undefined`
- [x] 4.2 Criar `test/report/cash-flow-calendar.service.test.ts`:
  - referências válidas e as recusadas `2026-13`, `2026-9`, `2026-09-01`, vazio e `undefined`
  - `periodOf('2026-09', 12)` → `2025-10-01`/`2026-09-30` e 12 chaves
  - janelas de 6 e 24, virada de ano
  - `2028-02` → `2028-02-29` e `2027-02` → `2027-02-28`
  - `monthKeyOf`
- [x] 4.3 Criar `test/report/cash-flow-accumulator.service.test.ts`:
  - baldes zerados na ordem
  - soma por direção
  - mês fora da janela ignorado
  - `0.1 + 0.2` saindo `0.3`
  - `balance` negativo
- [x] 4.4 Criar `test/report/summarize-monthly-cash-flow.use-case.test.ts`, com consultas como objetos `{ execute }` e séries da fixture `seriesDTO`:
  - referência e janela inválidas com o código certo e nenhuma consulta chamada
  - período repassado às três consultas
  - `months` baldes crescentes zerados sem movimento
  - linhas gravadas somadas no mês certo
  - série sem nada gravado aparecendo em todos os meses com ocorrência, respeitando `installments` e `endDate`
  - supressão por chave gravada: valor alterado sem contar duas vezes, `expectedOn` movido e `CANCELED`
  - falha de qualquer consulta propagada
- [x] 4.5 No mesmo arquivo, o teste de equivalência:
  - com a mesma massa (avulsas, série sem nada gravado, ocorrência com valor alterado, uma movida e uma cancelada), rodar `FindMonthlyStatement` para cada mês da janela
  - conferir entradas e saídas não canceladas contra `inflow`/`outflow` do balde
- [x] 4.6 Rodar os testes e o build de `modules/transaction` e deixar verdes

## 5. Sub-agente de backend — Adapter, controller e roteiro

- [x] 5.1 Ler `proposal.md`, `design.md` e o spec `cash-flow-report-backend`, e ler sem alterar:
  - `statement.controller.ts`, `scheduled-transaction.prisma.ts`, `transaction-series.prisma.ts`, `transaction-prisma.util.ts` e `transaction.module.ts`
  - `statement.integration.http` e os roteiros de `transaction`, `transaction-series` e `scheduled-transaction`
  - `apps/backend/prisma/models/transaction.model.prisma` e `src/db/prisma.service.ts`
- [x] 5.2 Criar `apps/backend/src/modules/transaction/transaction-report.prisma.ts` (skill `backend-prisma-data`):
  - classe `TransactionReportPrisma` com `@Injectable()` e `PrismaService`
  - atributo inline `readonly summarizeStoredCashFlow: SummarizeStoredCashFlowQuery`
  - uma consulta `this.prisma.client.$queryRaw<StoredCashFlowRow[]>` com template tag
  - `UNION ALL` de `"transaction"` (`deleted_at IS NULL`) e `"scheduled_transaction"` com `JOIN "transaction_series"` (`s."deleted_at" IS NULL`)
  - filtros `user_id`, `status <> 'CANCELED'` e `expected_on BETWEEN ${from}::date AND ${to}::date`
  - `to_char(expected_on::timestamp, 'YYYY-MM')` e `SUM` condicional por direção
  - nomes mapeados entre aspas, colunas qualificadas por alias, nenhum `timestamptz`, `$queryRawUnsafe` ou `Prisma.raw`
- [x] 5.3 No mesmo arquivo, criar o helper local documentado `toAmount(value: unknown): number` (aceita `Decimal`, `string`, `number` e `null`; nulo vira `0`; duas casas) e mapear as linhas para `StoredMonthlyCashFlow[]` sem vazar tipo do Prisma
- [x] 5.4 Acrescentar ao `scheduled-transaction.prisma.ts` o atributo inline `readonly listMaterializedOccurrenceKeys: ListMaterializedOccurrenceKeysQuery`:
  - `findMany` com `where: { userId, series: { deletedAt: null }, occurrenceOn: { gte: toDbDate(from), lte: toDbDate(to) } }`
  - sem filtro de status
  - `select: { seriesId: true, occurrenceIndex: true }`
- [x] 5.5 Criar `transaction-report.controller.ts` (skill `backend-controller`):
  - `@Controller('reports')` com `TransactionReportController` e `@Get('cash-flow')`
  - `type AuthUser` local
  - injeta `TransactionReportPrisma`, `ScheduledTransactionPrisma` e `TransactionSeriesPrisma`
  - monta `SummarizeMonthlyCashFlow` dentro do método
  - repassa `reference as string` e `Number(months)`
  - falha → `BadRequestException(result.errors)`; sucesso → array direto
- [x] 5.6 Registrar `TransactionReportPrisma` em `providers` e `TransactionReportController` em `controllers` no `transaction.module.ts`
- [x] 5.7 Criar `transaction-report.integration.http` no formato de `statement.integration.http`, com os casos do requisito de testes de integração do spec de backend, incluindo:
  - saída em `2026-09-30` e entrada em `2026-10-01` caindo nos meses certos
  - a comparação comentada com `GET /statement` de dois meses
- [x] 5.8 Rodar `npm run build` e os testes do backend, e `npx eslint` sem `--fix` nos arquivos criados ou alterados do backend, sem erro novo (os 58 erros e 1 aviso pré-existentes continuam iguais). Não rodar `npm run lint` no backend

## 6. Sub-agente de frontend — Dados

- [x] 6.1 Ler `proposal.md`, `design.md` e os specs `cash-flow-report-frontend` e `sidebar-navigation`, e ler sem alterar:
  - `data/use-statement.ts`, `data/use-statement-preferences.ts`, `data/statement-api.client.ts`, `data/statement-format.ts` e `data/index.ts`
  - `components/dashboard-summary.component.tsx`, `components/dashboard-breakdown-chart.component.tsx`, `components/dashboard-card.styles.ts` e `pages/month-dashboard.page.tsx`
  - `shared/components/ui/composed-bar-line-chart.tsx`, `filter-pill.tsx` e `page-section-header.tsx`
  - `shared/util/month.util.ts`, `shared/hooks/use-local-storage.hook.ts` e `app/(private)/layout.tsx`
- [x] 6.2 Acrescentar `parseMonthKey(key: string): SelectedMonth` em `shared/util/month.util.ts`, só com texto e inteiros, documentado junto do `monthKey`
- [x] 6.3 Acrescentar `INVALID_REPORT_REFERENCE` e `INVALID_REPORT_WINDOW`, em ordem alfabética, em `shared/i18n/messages.pt.ts` e `messages.en.ts`
- [x] 6.4 Criar `modules/transaction/data/cash-flow-report-api.client.ts`:
  - `CashFlowReportApiError` e `fetchMonthlyCashFlow(token, { reference, months }): Promise<MonthlyCashFlowDTO[]>` com `URL.searchParams`
  - `headers`, `extractMessages` e `handleError` locais e não exportados
- [x] 6.5 Criar `data/cash-flow-window.ts`:
  - `CASH_FLOW_WINDOW_OPTIONS` derivado de `CASH_FLOW_WINDOWS` (`{ value, label: 'N meses' }`)
  - `DEFAULT_CASH_FLOW_WINDOW = 12`, `CashFlowPreferences { version: 1; months }` e `CASH_FLOW_PREFERENCES_STORAGE_KEY = 'poupig:cash-flow-report'`
  - `CASH_FLOW_COLORS` (entrada emerald, saída rose, saldo blue, acumulado numa quarta cor distinguível)
  - sem reexportar tipos do domínio
- [x] 6.6 Criar `data/cash-flow-series.ts`, sem React:
  - `CashFlowPoint` e `toCashFlowSeries` (`label` por `formatShortMonthLabel(parseMonthKey(month))`, `cumulative` corrido em duas casas e documentado como acumulado da janela)
  - `CashFlowTotals` e `summarizeCashFlow` (`monthlyAverage = balance / rows.length`, `0` sem linhas)
  - `hasCashFlowMovement`
- [x] 6.7 Criar `data/use-cash-flow-report.ts`:
  - referência por `monthKey(selectedMonth)` do `useSelectedMonth()`
  - preferência sobre `useLocalStorage` com `deserialize` que confere `version` e `isCashFlowWindow` e lança no inválido
  - leitura no desenho do `useStatement` (`RequestState`, `requestKey` com token, referência, janela e contador, `isLoading` derivado, `isCurrent`)
  - `points`, `totals` e `hasMovement` memorizados
  - `toErrorMessage` local
  - retorno `{ months, setMonths, points, totals, hasMovement, isLoading, error, refresh }`
  - sem `any` e sem `setState` síncrono em efeito

## 7. Frontend — Componentes, página, rota e menu

- [x] 7.1 Criar `shared/components/ui/grouped-bar-chart.tsx` (`GroupedBarChart`):
  - props `data`, `xKey`, `series: { key, label, color }[]`, `height`, `className`, `emptyState`, `valueFormatter`, `xAxisTickFormatter` e `tooltipLabelFormatter`
  - mesmo grid, eixos, tooltip, legenda no topo e barras do `ComposedBarLineChart`
  - lista vazia no `emptyState`
  - exportar no `shared/index.ts` ao lado do `composed-bar-line-chart`
- [x] 7.2 Criar `components/cash-flow-window-selector.component.tsx`: `FilterPill` por opção em `role="group"` com `aria-label`, `active` na janela corrente e `aria-label` do período
- [x] 7.3 Criar `components/cash-flow-summary.component.tsx`:
  - grade `sm:grid-cols-2 xl:grid-cols-4` com quatro cards sobre `DASHBOARD_CARD_CLASSES` no desenho do `IndicatorCard`
  - `Entradas` (emerald, `ArrowUpRight`), `Saídas` (rose, `ArrowDownRight`), `Saldo do período` e `Média mensal` (blue, valor colorido pelo sinal)
  - recebe `CashFlowTotals` e formata com `formatCurrency`
  - sem `MetricCard`
- [x] 7.4 Criar `components/cash-flow-comparison-chart.component.tsx`:
  - `Card` com `DASHBOARD_CARD_CLASSES`, título e subtítulo
  - `GroupedBarChart` com `Entradas` e `Saídas` nessa ordem, `formatCurrency` e `CASH_FLOW_COLORS`
  - com `isEmpty`, `data={[]}` e `emptyState` com texto curto
- [x] 7.5 Criar `components/cash-flow-balance-chart.component.tsx`:
  - mesmo `Card` e `ComposedBarLineChart` como está, com `barKey: 'balance'` (`Saldo do mês`) e `lineKey: 'cumulative'` (`Acumulado no período`)
  - mesma formatação, cores e estado vazio
- [x] 7.6 Criar `pages/cash-flow-report.page.tsx`:
  - `w-full space-y-6`
  - `PageSectionHeader` com badge `Relatórios`, título `Entradas x Saídas`, subtítulo `Últimos N meses, até <formatMonthInSentence>` e o seletor no `aside`
  - corpo: totais → comparação → saldo → nota de rodapé (`text-xs text-muted-foreground`)
  - esqueleto com as mesmas grades e alturas; card de erro `role="alert"` com `Tentar de novo` chamando `refresh`
  - janela sem movimento com totais zerados e `isEmpty` nos gráficos
- [x] 7.7 Criar `app/(private)/reports/cash-flow/page.tsx` só delegando para a página do módulo
- [x] 7.8 Em `app/(private)/layout.tsx`, acrescentar a seção `{ id: 'reports', label: 'Relatórios', items: [{ id: 'cash-flow', label: 'Entradas x Saídas', href: '/reports/cash-flow', icon: ChartColumn, match: 'prefix' }] }` depois de `registrations` e antes do `EXTRAS_SECTION`, importando `ChartColumn`. Não mexer no `SidebarMenu`
- [x] 7.9 Atualizar `modules/transaction/data/index.ts` e `modules/transaction/index.ts` com os arquivos novos, em ordem alfabética

## 8. Fechamento

- [x] 8.1 Rodar `npm run build` no workspace e `npm test`, com domínio e backend verdes
- [x] 8.2 Rodar `npx eslint` sem `--fix` em todos os arquivos criados ou alterados, de frontend e backend, sem nenhum erro (os 88 erros do frontend e os 58 do backend pré-existentes continuam iguais)
- [x] 8.3 Conferir que o diff se limita a:
  - `modules/transaction/src/report`, `modules/transaction/src/scheduled-transaction/provider` e `modules/transaction/src/index.ts`
  - `modules/transaction/test/report`, o mock e o teste do repositório em memória de ocorrências
  - `apps/backend/src/modules/transaction`
  - `apps/frontend/src/modules/transaction` e `apps/frontend/src/shared` (gráfico novo, barril, `parseMonthKey` e i18n)
  - `app/(private)`: layout e rota nova

  O working tree já tem mudanças não commitadas de prompts anteriores: comparar só os arquivos tocados. Não testar via navegador (teste manual do usuário)

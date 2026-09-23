## Context

Ver `proposal.md` — Why. Requisitos em `specs/cash-flow-report-domain`, `specs/cash-flow-report-backend`, `specs/cash-flow-report-frontend`, `specs/sidebar-navigation` e `specs/scheduled-transaction-domain`. Restrições do estado atual que moldam a abordagem:

- **Molde de leitura**: `modules/transaction/src/monthly-statement` tem `dto/`, `model/` e `use-case/`, sem entidade e sem repositório.
  - `FindMonthlyStatement` recebe as consultas no construtor, valida o período com `DateOnly.tryCreate` e roda as três leituras em `Promise.all` + `Result.combine`
  - a supressão da geração usa um `Set` de chaves `` `${seriesId}:${occurrenceIndex}` `` das ocorrências gravadas cuja `occurrenceOn` está no período
  - `FindMonthlyStatementErrors` e `STATEMENT_MAX_ENTRIES` são exportados do arquivo do caso de uso
- **Geração**: `ScheduledTransactionGenerator.generateForPeriod(series, { from, to }, isMaterialized)` devolve entidades `PENDING` com `expectedOn = occurrenceOn` e valor e direção da série, sobre o `RecurrenceScheduleCalculator.occurrencesBetween` (que já respeita `endDate` e `installments`). `ListActiveTransactionSeriesQuery` (`{ userId, from, to }`) devolve as séries não excluídas que podem ter ocorrência no período.
- **Materialização**: salvar série pelo formulário não grava ocorrência. Uma linha em `scheduled_transaction` só existe quando o usuário edita, efetiva ou cancela a ocorrência. O gerador do `/dev` grava tudo até o fim do mês corrente. Excluir a série não apaga as ocorrências gravadas: o `ScheduledTransactionPrisma` as esconde com `series: { deletedAt: null }`.
- **Banco**: PostgreSQL via `PrismaService.client` (adapter `PrismaPg`).
  - tabelas `transaction`, `transaction_series` e `scheduled_transaction` com colunas em snake_case; `value` é `numeric(14,2)` e `expected_on`/`occurrence_on` são `date`
  - `transaction_series` repete `user_id`, `value`, `direction` e `deleted_at` de `scheduled_transaction`
  - índices `(user_id, expected_on)` nas duas tabelas de movimento, `(user_id, occurrence_on)` em `scheduled_transaction` e `(user_id, start_date)` em `transaction_series`
  - o projeto nunca usou `$queryRaw`; os adapters convertem datas com `toDbDate`/`fromDbDate` em UTC
- **Controllers**: `statement.controller.ts` monta o caso de uso dentro do método com as consultas dos adapters injetados, repassa a query string crua para o domínio validar e mapeia falha para `BadRequestException(result.errors)`. `JwtGuard` é global; o dono vem de `@CurrentUser()`.
- **Frontend**:
  - `useStatement` é o molde de hook de leitura: `RequestState { key, data, error }`, `requestKey` com os parâmetros e um contador, `isLoading` derivado, `isCurrent` para descartar resposta obsoleta e `refresh`
  - `useStatementPreferences` é o molde de preferência gravada sobre `useLocalStorage`, com `deserialize` que lança no valor inválido
  - o barril `data/index.ts` reexporta tudo, então nomes repetidos entre arquivos colidem
- **Visual**: o dashboard do mês (prompt 21) fixou a superfície `DASHBOARD_CARD_CLASSES`, cards próprios com tons emerald/rose/blue e rejeitou o `MetricCard`. `ComposedBarLineChart` (barra + linha, `recharts`) existe em `shared/` sem consumidor; não há gráfico de barras agrupadas. `formatMonthInSentence` e `formatCurrency` já existem.
- **Qualidade**:
  - o frontend não tem testes e o lint já falha com 88 erros; o backend, com 58 erros e 1 aviso
  - o `lint` do backend roda `--fix`: a verificação é `npx eslint` sem `--fix` nos arquivos tocados
  - sem teste via navegador

## Goals / Non-Goals

**Goals:**

- Cada balde do relatório igual aos totais previstos do extrato daquele mês, por construção: a mesma regra de geração e de supressão, e nenhuma regra de recorrência reescrita.
- Uma única requisição por janela, com custo limitado pela janela fechada e pelas séries ativas, sem consulta por mês.
- Toda regra (janela, período, soma, acumulado, média, estado vazio) em código puro e testável, fora de React e fora do adapter.
- Soma das linhas gravadas independente do fuso do servidor e da sessão do banco.
- A tela com a mesma linguagem visual do dashboard do mês.

**Non-Goals:**

- Não alterar `FindMonthlyStatement`, `ScheduledTransactionGenerator`, `ListScheduledTransactionsInPeriodQuery`, `SaveTransactionSeries` nem nenhum contrato HTTP existente.
- Não extrair utilitários comuns entre extrato e relatório (chave de ocorrência, validação de data) nesta mudança.
- Não alterar o dashboard, `MetricCard`, `ComposedBarLineChart` ou `SidebarMenu`.
- Não criar hook genérico de requisição, contexto de mês ou biblioteca de gráfico.

## Decisions

### 1. Caso de uso no domínio que junta SQL e geração em memória

`SummarizeMonthlyCashFlow` em `modules/transaction/src/report/use-case`, no desenho do `FindMonthlyStatement`, com três consultas no construtor:

- `SummarizeStoredCashFlowQuery`: soma por mês das linhas gravadas
- `ListMaterializedOccurrenceKeysQuery`: chaves das ocorrências gravadas na janela
- `ListActiveTransactionSeriesQuery`: séries ativas na janela

Fluxo:
1. Valida a referência e depois a janela.
2. Deriva o período.
3. Roda as três consultas em paralelo.
4. Monta o `Set` de chaves suprimidas.
5. Soma as linhas gravadas e as ocorrências geradas num acumulador.
6. Devolve os baldes.

Alternativas:
- **Só SQL, somando o que está gravado** — rejeitada: séries criadas pelo formulário não teriam linha e sumiriam do relatório, divergindo do extrato e do dashboard.
- **Gerar as ocorrências em SQL** — rejeitada: duplicaria no banco as regras de recorrência (ajuste de fim de mês, parcelas, data fim) que só o `RecurrenceScheduleCalculator` conhece.
- **Frontend chamando `GET /statement` mês a mês** — rejeitada: até 24 requisições por tela, somas no cliente e o teto de 500 entradas por mês.
- **Carregar todas as linhas gravadas e somar em TypeScript** — rejeitada: traz milhares de linhas com nomes de vínculo para usar três campos.

### 2. Consulta leve das chaves gravadas no agregado `scheduled-transaction`

`ListMaterializedOccurrenceKeysQuery` devolve só `{ seriesId, occurrenceIndex }` das ocorrências com `occurrenceOn` no período, qualquer situação e série não excluída. Ela é implementada no `ScheduledTransactionPrisma` com `findMany` e `select` dos dois campos, e usa o índice `(user_id, occurrence_on)`.

- **Qualquer situação**: uma ocorrência gravada como `CANCELED` precisa suprimir a geração. Se não suprimisse, o índice reapareceria como `PENDING`, somando algo que o usuário cancelou.
- **Pela `occurrenceOn`, não pela `expectedOn`**: a `occurrenceOn` de um índice é fixa, então suprimir pela janela inteira equivale a suprimir mês a mês como o extrato faz. Uma ocorrência movida para fora da janela continua suprimindo a geração do mês original.

Alternativa: reaproveitar `ListScheduledTransactionsInPeriodQuery` — rejeitada, porque devolve o DTO completo (joins de conta, cartão, subcategoria, categoria e série) de ocorrências por `expectedOn` **ou** `occurrenceOn`, o que é pesado numa janela de 24 meses para usar dois campos. A consulta nova mora no agregado dono da tabela.

### 3. Soma das linhas gravadas em uma consulta `$queryRaw`

`TransactionReportPrisma.summarizeStoredCashFlow` executa uma única consulta com template tag:

```sql
SELECT to_char(m.expected_on::timestamp, 'YYYY-MM') AS month,
       SUM(CASE WHEN m.direction = 'IN'  THEN m.value ELSE 0 END) AS inflow,
       SUM(CASE WHEN m.direction = 'OUT' THEN m.value ELSE 0 END) AS outflow
FROM (
  SELECT t."expected_on" AS expected_on, t."direction" AS direction, t."value" AS value
  FROM "transaction" t
  WHERE t."user_id" = ${userId} AND t."deleted_at" IS NULL AND t."status" <> 'CANCELED'
    AND t."expected_on" BETWEEN ${from}::date AND ${to}::date
  UNION ALL
  SELECT st."expected_on", st."direction", st."value"
  FROM "scheduled_transaction" st
  JOIN "transaction_series" s ON s."id" = st."series_id"
  WHERE st."user_id" = ${userId} AND s."deleted_at" IS NULL AND st."status" <> 'CANCELED'
    AND st."expected_on" BETWEEN ${from}::date AND ${to}::date
) m
GROUP BY 1
ORDER BY 1
```

O esboço acima é orientativo: os nomes precisam ser conferidos no `transaction.model.prisma`. Pontos obrigatórios:

- nomes mapeados entre aspas duplas (`transaction` é palavra reservada) e toda coluna qualificada por alias, porque o `JOIN` com `transaction_series` torna `user_id`, `value`, `direction` e `deleted_at` ambíguos
- todo valor como bind parameter, com cast explícito (`::date`); `$queryRawUnsafe` e `Prisma.raw` proibidos
- `to_char`/`date_trunc` não têm versão para `date`: sem `::timestamp` o Postgres converte para `timestamptz` e o mês passa a depender do `TimeZone` da sessão. Nunca `timestamptz` nem `AT TIME ZONE`
- `SUM` de `numeric` pode chegar como `Prisma.Decimal`, `string` ou `number`: um `toAmount(value: unknown)` local converte, trata nulo como `0` e arredonda para duas casas
- sem `generate_series`: os meses vazios são responsabilidade do domínio (decisão 5)

Alternativa: `groupBy` do Prisma — rejeitada, porque não agrupa por mês de data nem cruza duas tabelas.

Alternativa: colocar a consulta no `TransactionPrisma` ou no `ScheduledTransactionPrisma` — rejeitada, porque a consulta lê as duas tabelas. O adapter próprio com prefixo `transaction-report` deixa os relatórios dos próximos prompts (`category-report`, `account-report`) conviverem sob `/reports/*`.

### 4. Entrada `reference` + `months`, validada no domínio

A API recebe `reference=YYYY-MM` e `months`. O controller repassa `reference` cru e `Number(months)`, então ausente vira `NaN` e vazio vira `0`, e os dois caem em `INVALID_REPORT_WINDOW`. O caso de uso valida antes de qualquer consulta, como o `INVALID_STATEMENT_PERIOD` do extrato.

- **Referência**: aceita pelo padrão `^\d{4}-\d{2}$` quando o dia 1 passa no `DateOnly.tryCreate` com valor normalizado igual.
- **Janela**: `CASH_FLOW_WINDOWS = [6, 12, 18, 24] as const` com `isCashFlowWindow`, em `report/model/cash-flow-window.ts`, exportado para o frontend.

Os códigos `SummarizeMonthlyCashFlowErrors` (`INVALID_REPORT_REFERENCE`, `INVALID_REPORT_WINDOW`) ficam no arquivo do caso de uso.

Alternativa: `from`/`to` como no extrato — rejeitada, porque admite mês pela metade e exigiria validar alinhamento de mês. Validar no controller — rejeitada, porque o padrão do módulo é o domínio julgar a entrada crua.

### 5. Calendário e acumulador puros em `report/model`

- **`CashFlowCalendar`** (métodos estáticos):
  - `isValidReference`
  - `periodOf(reference, months)` → `{ from, to, monthKeys }`, pelo índice absoluto `year * 12 + month - 1`, com o último dia do mês por `Date.UTC(year, month, 0)` lido em UTC
  - `monthKeyOf(date)` → os sete primeiros caracteres
- **`CashFlowAccumulator`**:
  - inicia os `monthKeys` zerados e soma em **centavos inteiros** (`Math.round(value * 100)`)
  - ignora mês fora da janela sem lançar
  - devolve `MonthlyCashFlowDTO[]` na ordem das chaves, com `balance` calculado e valores divididos por 100

É o domínio que garante "exatamente `months` baldes crescentes" para qualquer combinação de fontes. O `Money` do `@poupig/shared` não serve para somas porque recusa zero.

Alternativa: preencher os meses no SQL com `generate_series` — rejeitada depois que as ocorrências geradas passaram a ser somadas em memória: o domínio precisaria dos baldes de qualquer forma, e o preenchimento ficaria em dois lugares.

### 6. Controller e módulo Nest

`TransactionReportController` (`@Controller('reports')`, `@Get('cash-flow')`) injeta `TransactionReportPrisma`, `ScheduledTransactionPrisma` e `TransactionSeriesPrisma` e monta o caso de uso dentro do método. O `type AuthUser` é local, como nos outros controllers do módulo. A resposta é o array direto, sem `PaginatedResultDTO`. O `TransactionReportPrisma` entra em `providers` e o controller em `controllers` do `TransactionModule`.

### 7. Frontend: dados puros, hook e preferência

- **`shared/util/month.util.ts`**: `parseMonthKey('2026-09')` → `{ year: 2026, month: 9 }`, só com texto e inteiros.
- **`data/cash-flow-report-api.client.ts`**: `fetchMonthlyCashFlow(token, { reference, months })` e `CashFlowReportApiError`, com os helpers locais não exportados.
- **`data/cash-flow-window.ts`**:
  - `CASH_FLOW_WINDOW_OPTIONS` derivado do `CASH_FLOW_WINDOWS` do domínio
  - `DEFAULT_CASH_FLOW_WINDOW = 12`
  - `CashFlowPreferences { version: 1; months }` e a chave `poupig:cash-flow-report`
  - `CASH_FLOW_COLORS`: entrada emerald, saída rose, saldo blue e o acumulado numa quarta cor distinguível no fundo escuro
- **`data/cash-flow-series.ts`**:
  - `toCashFlowSeries` → pontos com `label` curto e `cumulative` (soma corrida dentro da janela, duas casas)
  - `summarizeCashFlow` → totais com `monthlyAverage = balance / rows.length`
  - `hasCashFlowMovement`, porque a API nunca devolve lista vazia e o estado vazio precisa de um critério explícito
- **`data/use-cash-flow-report.ts`**:
  - referência vinda de `monthKey(selectedMonth)` e janela vinda da preferência
  - leitura no desenho do `useStatement`, com `requestKey` sobre token, referência, janela e contador
  - expõe `months`, `setMonths`, `points`, `totals`, `hasMovement`, `isLoading`, `error` e `refresh`
  - `toErrorMessage` local

Os nomes novos não repetem nada do barril (`summarizeMonth`, `MonthSummary`, `toErrorMessage` exportado etc.).

Alternativa: a média sobre os meses com movimento — rejeitada, porque distorce janelas com meses vazios e deixa de responder "quanto sobra por mês no período".

### 8. Frontend: componentes e página

- **`shared/components/ui/grouped-bar-chart.tsx`** (`GroupedBarChart`):
  - props `data`, `xKey`, `series: { key, label, color }[]`, `height`, `className`, `emptyState`, `valueFormatter`, `xAxisTickFormatter` e `tooltipLabelFormatter`
  - mesmo grid, eixos, tooltip, legenda no topo e barras arredondadas do `ComposedBarLineChart`
  - exportado no barril `shared/index.ts`
- **`cash-flow-window-selector.component.tsx`**: `FilterPill` em `role="group"`.
- **`cash-flow-summary.component.tsx`**:
  - quatro cards próprios sobre `DASHBOARD_CARD_CLASSES`, no desenho do `IndicatorCard` do dashboard (que é interno e não é importado)
  - tons emerald/rose/blue e valores de saldo coloridos pelo sinal
- **`cash-flow-comparison-chart.component.tsx`** e **`cash-flow-balance-chart.component.tsx`**:
  - `Card` com `DASHBOARD_CARD_CLASSES` e cabeçalho no desenho do `DashboardBreakdownChartComponent`
  - recebem `points` e `isEmpty`; com `isEmpty`, passam `data={[]}` e o `emptyState`
  - o de saldo usa `ComposedBarLineChart` como está (`balance` + `cumulative`)
- **`pages/cash-flow-report.page.tsx`**:
  - `PageSectionHeader` com o seletor no `aside` e subtítulo `Últimos N meses, até <formatMonthInSentence>`
  - corpo `w-full space-y-6`: totais → comparação → saldo → nota
  - esqueleto com as mesmas grades e alturas; card de erro `role="alert"` com `Tentar de novo`
- **Rota e menu**:
  - `app/(private)/reports/cash-flow/page.tsx` só delega
  - `layout.tsx` ganha a seção `reports` (`ChartColumn`) antes do `EXTRAS_SECTION`

Alternativas:
- `MetricCard` na faixa de totais — rejeitada, porque destoa do dashboard, que o rejeitou.
- Barras empilhadas de entrada e saída — rejeitada, porque empilhar soma o que se quer comparar.
- Criar outro gráfico para o saldo — rejeitada, porque o `ComposedBarLineChart` já faz barra + linha.

### 9. Execução

Três sub-agentes sequenciais: negócio, backend e frontend. Cada um termina com build e testes da sua camada verdes antes do próximo começar. O de backend usa as skills `backend-prisma-data` e `backend-controller`; o de negócio, `module-dto`, `module-query-cqrs` e `module-use-case`.

## Risks / Trade-offs

- **[Geração em memória cresce com séries semanais em janelas longas]** Por exemplo, 20 séries semanais em 24 meses dão cerca de 2.000 entidades por requisição. → A janela é fechada em 24 e o extrato já faz o mesmo trabalho por mês. Se aparecer lentidão, o próximo passo é gerar só datas (`occurrencesBetween`) sem criar entidades, sem mudar contrato.
- **[Tipo de retorno do `$queryRaw` com o adapter `PrismaPg`]** É a primeira consulta crua do projeto, e o `numeric` pode chegar como `Decimal`, `string` ou `number`. → `toAmount` aceita os três, e o roteiro `.http` confere os valores com centavos.
- **[Mês errado por fuso no SQL]** → cast `::timestamp` obrigatório e cenários de primeiro e último dia do mês no `.http`.
- **[Divergência com o dashboard em mês acima de 500 entradas]** O extrato corta e o relatório não. → Diferença aceita e documentada no spec; o dashboard já exibe aviso de corte nesse caso.
- **[Ocorrência gravada que não pertence mais à série]** Por exemplo, depois de editar a recorrência. → Soma como linha gravada, igual ao extrato; a equivalência continua valendo.
- **[Barra negativa no `ComposedBarLineChart`]** O `radius` fixo foi pensado para barras positivas. → Aceito como está nesta mudança, porque alterar o componente compartilhado está fora do escopo; conferir no teste manual.
- **[Rótulos do eixo em 24 meses]** `set/2026` é longo. → O `minTickGap` dos gráficos pula rótulos, e o tooltip sempre mostra o mês.
- **[Colisão de nomes no barril do frontend]** → Helpers de cliente e hook locais e não exportados; nomes novos prefixados com `CashFlow`.

## Migration Plan

Sem migração de banco nem mudança de contrato existente. O deploy é aditivo: rota nova, tela nova e item de menu novo. O rollback é reverter o commit, sem dados a desfazer.

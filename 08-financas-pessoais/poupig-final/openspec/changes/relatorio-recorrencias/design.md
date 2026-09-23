## Context

Ver `proposal.md` — Why. Requisitos em `specs/recurrence-report-domain`, `specs/recurrence-report-backend`, `specs/recurrence-report-frontend` e `specs/sidebar-navigation`. Prompt de origem: `.docs/prompts/24-relatorio-recorrencias.md`. Restrições do estado atual que moldam a abordagem:

- **Relatório de entradas x saídas (prompt 22) no mesmo módulo e na mesma pasta** (`modules/transaction/src/report`):
  - `model/cash-flow-window.ts` (`CASH_FLOW_WINDOWS`, `isCashFlowWindow`), `model/cash-flow-calendar.service.ts` (`isValidReference`, `periodOf` → `{ from, to, monthKeys }`, `monthKeyOf`) e `model/cash-flow-accumulator.service.ts` (baldes pré-criados, centavos inteiros, mês fora da janela ignorado)
  - `SummarizeMonthlyCashFlow` com `SummarizeMonthlyCashFlowErrors` (`INVALID_REPORT_REFERENCE`, `INVALID_REPORT_WINDOW`), `Promise.all` + `Result.combine` e supressão por `` `${seriesId}:${occurrenceIndex}` ``
  - barris `dto/`, `model/`, `provider/` e `use-case/` já exportados por `src/index.ts`; testes em `test/report` e a fixture `test/mock/transaction-series-dto.fixture.ts` (`seriesDTO(overrides)`, padrão `CLOSED`)
- **Séries e ocorrências**:
  - `SeriesKind.OPEN` (recorrência) e `SeriesKind.CLOSED` (parcelamento); `RecurrenceRule` discriminada por `unit` (`WEEK`/`MONTH`/`YEAR`) com `interval`
  - `ListActiveTransactionSeriesQuery` devolve séries não excluídas dos dois tipos e das duas direções com `startDate <= to` e `endDate` nulo ou `>= from`; `FindTransactionSeriesByIdQuery.execute(id, userId)` devolve `null` para série excluída ou de outro usuário
  - `ScheduledTransactionGenerator.generateForPeriod` gera ocorrências `PENDING` com `expectedOn = occurrenceOn` e o valor atual da série; `ListMaterializedOccurrenceKeysQuery` filtra por `occurrenceOn`, qualquer situação, ignorando série excluída
  - o `expectedOn` de uma ocorrência gravada é livre: pode sair do mês original e passar do `endDate` da série
- **Backend** (`apps/backend/src/modules/transaction`): `TransactionReportPrisma` (único `$queryRaw` do módulo, com `hasToNumber`/`toAmount` locais, aliases qualificando colunas, literais de enum sem tipo, `::date` e `::timestamp`) e `TransactionReportController` (`@Controller('reports')`, já injeta `TransactionReportPrisma`, `ScheduledTransactionPrisma` e `TransactionSeriesPrisma`). O `TransactionModule` já registra todos.
- **Frontend** (`apps/frontend/src/modules/transaction`):
  - `use-cash-flow-report.ts` é o molde de hook: `RequestState { key, data, error }`, `requestKey` com parâmetros e contador, `isLoading` derivado, descarte de resposta obsoleta, `toErrorMessage` local e `refresh`; preferência com `useLocalStorage` e `deserialize` que lança no inválido
  - `CashFlowWindowSelectorComponent` e `CASH_FLOW_WINDOW_OPTIONS` são genéricos (rótulo `Período do relatório`); `CASH_FLOW_COLORS` tem os tons de entrada e saída; `TotalCard` é interno ao `cash-flow-summary.component.tsx`
  - `GroupedBarChart`, `ComposedBarLineChart` (estilo visual dos gráficos: grade, eixos e tooltip escuro), `Table*` e `Checkbox` (Radix, sem desenho de indeterminado e sem consumidor) em `shared/components/ui`; **não existe** gráfico de N linhas
  - `data/index.ts` reexporta tudo, então nomes repetidos entre arquivos do módulo colidem
  - não há tela de listagem de séries: elas são criadas pelo extrato (`/transactions`)
- **Qualidade**: frontend sem testes; frontend e backend com erros de lint pré-existentes; o `lint` do backend roda `--fix`, então a verificação é `npx eslint` sem `--fix` nos arquivos tocados; sem teste via navegador.

## Goals / Non-Goals

**Goals:**

- Cada mês de cada recorrência igual ao que o extrato mostra para as ocorrências dela, por construção: mesma geração e mesma supressão do relatório de entradas x saídas.
- Uma requisição por referência e janela; esconder, mostrar, descontar e recalcular tudo sem rede.
- Esconder (visual) separado de descontar (soma), com a decisão de descontar tomada **uma vez** para o relatório inteiro.
- Zero duplicação de janela, calendário e códigos de erro com o relatório vizinho.
- Regras de junção, vigência, ordenação e totais em código puro e testável, fora de React e fora do adapter.
- Soma gravada independente do fuso do servidor e da sessão do banco.

**Non-Goals:**

- Não renomear nem alterar as peças do prompt 22 (`CashFlowCalendar`, `CASH_FLOW_WINDOWS`, `CashFlowAccumulator`, `SummarizeMonthlyCashFlow`, `summarizeStoredCashFlow`, `TotalCard`).
- Não criar consulta nova fora de `src/report` nem alterar `ListActiveTransactionSeriesQuery`, `FindTransactionSeriesByIdQuery` ou `ListMaterializedOccurrenceKeysQuery`.
- Não alterar os gráficos compartilhados existentes nem `Table`; o único gráfico compartilhado novo é o de N linhas, só de apresentação.
- Não tocar em `transaction.module.ts`, `SidebarMenu`, dicionários de i18n ou nos outros módulos.

## Decisions

### 1. Caso de uso `SummarizeRecurrences` no `src/report` do módulo `transaction`

Construtor com `SummarizeStoredRecurrenceOccurrencesQuery` (nova, em `provider/`), `ListMaterializedOccurrenceKeysQuery`, `ListActiveTransactionSeriesQuery` e `FindTransactionSeriesByIdQuery`.

Fluxo:
1. `CashFlowCalendar.isValidReference(reference)` ou `INVALID_REPORT_REFERENCE`; `isCashFlowWindow(months)` ou `INVALID_REPORT_WINDOW` — sem consultar.
2. `CashFlowCalendar.periodOf(reference, months)` → `{ from, to, monthKeys }`.
3. Soma gravada, chaves gravadas e séries vigentes em `Promise.all` + `Result.combine`.
4. Séries vigentes filtradas por `kind === OPEN` e registradas no `RecurrenceAccumulator`.
5. `seriesId`s da soma gravada ausentes da lista → `FindTransactionSeriesByIdQuery` em `Promise.all`, combinadas; `null` ou `CLOSED` descartam os valores daquela série.
6. Cada `{ seriesId, month, total }` gravado somado na linha da série.
7. Para cada série `OPEN` vigente, `generateForPeriod(series, { from, to }, isSuppressed)` e soma de cada ocorrência em `CashFlowCalendar.monthKeyOf(expectedOn)`.
8. `accumulator.toDTOs()`.

Os erros `SummarizeMonthlyCashFlowErrors` são reaproveitados; nenhum `SummarizeRecurrencesErrors` é criado.

**Alternativas:**
- *Relatório num módulo de dimensão*: não se aplica — o sujeito é a série, agregado do próprio `transaction`.
- *Somar só o gravado*: salvar uma série não grava ocorrência, então as recorrências ficariam vazias.
- *`RECURRENCE_WINDOWS` e erros próprios*: duas fontes para a mesma regra no mesmo módulo; os códigos atuais já têm texto genérico e tradução.
- *Renomear as peças do prompt 22 para nomes genéricos*: correto a longo prazo, mas mexe num relatório entregue e amplia o diff; fica fora de escopo e o reaproveitamento é comentado no caso de uso.

### 2. Série encerrada com ocorrência adiada buscada por id

A lista de séries vigentes não enxerga a série cujo `endDate` é anterior à janela mas que tem ocorrência gravada adiada para dentro dela. O caso de uso busca só esses ids, com a `FindTransactionSeriesByIdQuery` existente.

**Alternativas:**
- *Descartar os valores*: o mês divergiria do extrato.
- *Consulta nova de séries "vigentes ou com ocorrência gravada na janela"*: duplicaria o `select` e o mapeamento de `TransactionSeriesDTO`, que são locais ao `TransactionSeriesPrisma`.
- *SQL da soma devolvendo também nome, regra e referências*: duas fontes de identidade para a mesma série.

Custo: normalmente zero chamadas; no pior caso uma leitura por chave primária por série afetada.

### 3. `RecurrenceAccumulator` em `model/`

Mesmo desenho do `CashFlowAccumulator`, com a série como chave de primeiro nível:
- `Map<seriesId, { series: TransactionSeriesDTO; cents: Map<month, number> }>`, meses pré-criados com `0` a partir de `monthKeys`
- `register(series)` idempotente; `add(series, month, value)` registra se preciso, ignora mês fora da janela e soma `Math.round(value * 100)`
- `toDTOs()` monta `RecurrenceReportLineDTO` com `months` na ordem das chaves, `total` somado em centavos e valores divididos por 100; ordena por direção (`IN` antes de `OUT`), `name.localeCompare(other, 'pt-BR', { sensitivity: 'base' })` e `seriesId`

**Alternativa**: reaproveitar o `CashFlowAccumulator` com uma instância por série — ele separa entrada e saída e produz `balance`, que não existe numa série de direção única; adaptá-lo mudaria o relatório vizinho.

### 4. DTO aninhado com a identidade da série

`RecurrenceReportLineDTO` copia do `TransactionSeriesDTO` `id` (como `seriesId`), `name`, `direction`, `value`, `recurrence`, `accountName`, `creditCardName`, `categoryName`, `subcategoryName`, `startDate` e `endDate`, e acrescenta `total` e `months: RecurrenceMonthTotalDTO[]` (`{ month, total }`). Não expõe `userId`, `accountId`, `subcategoryId`, `kind`, `installments` nem datas de auditoria.

**Alternativa**: lista plana `(seriesId, month, total)` + `GET /transaction-series` — a rota é paginada, e a tela desenha uma linha por série.

### 5. Soma gravada como atributo do `TransactionReportPrisma`

```sql
SELECT st."series_id" AS "seriesId",
       to_char(st."expected_on"::timestamp, 'YYYY-MM') AS "month",
       SUM(st."value") AS "total"
FROM "scheduled_transaction" st
JOIN "transaction_series" s ON s."id" = st."series_id"
WHERE st."user_id" = ${userId}
  AND s."deleted_at" IS NULL
  AND s."kind" = 'OPEN'
  AND st."status" <> 'CANCELED'
  AND st."expected_on" BETWEEN ${from}::date AND ${to}::date
GROUP BY 1, 2
```

Linha crua `StoredRecurrenceOccurrenceRow { seriesId: string; month: string; total: unknown }`, convertida com o `toAmount` do arquivo. Rota `@Get('recurrences')` no `TransactionReportController`, montando o caso de uso no método com `reference as string` e `Number(months)`.

**Alternativas:**
- *Adapter e controller próprios (`RecurrenceReportPrisma`/`RecurrenceReportController`)*: faria sentido em outro módulo; aqui duplicaria `toAmount`, injeções e registro no módulo sem ganho.
- *`groupBy` do Prisma*: não trunca data por mês.
- *Filtrar `kind` só no caso de uso*: a soma traria valores de parcelamentos que depois seriam descartados e provocaria buscas por id desnecessárias.

### 6. Frontend: funções puras + hook + três componentes

- `data/recurrence-report.ts`: `buildRecurrenceReport(lines, uncheckedIds, excludeHiddenFromTotals)` devolve `monthKeys`, `monthLabels`, os dois grupos (sempre `inflow` e `outflow`), `resultByMonth`, `totals`, `excludesHidden` e `uncheckedCount`, tudo em centavos. Cada linha tem `isChecked` (visível) e `isCounted = isChecked || !excludeHiddenFromTotals`; `monthTotals`, `total`, `resultByMonth` e `totals` somam só `isCounted`, e `checkedCount` conta só `isChecked`. `checkState` do grupo: `true`, `false` ou `'indeterminate'` (valor aceito direto pelo `Checkbox` do Radix). `commitment = outflow / inflow` ou `null` com `inflow` zero; `formatCommitment` com `Math.round(value * 100)` + `%` ou `—`.
- `data/use-recurrence-report.ts`: molde do `use-cash-flow-report.ts`; preferência `{ version: 1, months }` na chave `poupig:recurrence-report`; `uncheckedIds: ReadonlySet<string>` em `useState`, **sem** chave de mês/janela, filtrado contra a resposta dentro do `buildRecurrenceReport`; `toggleRecurrence`, `setGroupChecked(groupId, checked)` (usa os ids do grupo na resposta corrente) e `checkAll`; `excludeHiddenFromTotals` em `useState(false)`, de sessão, exposto com o setter.
- `formatRecurrenceFrequency(rule)` em `transaction-series.labels.ts`, com `Record<FrequencyUnit, { singular: string; plural: string }>` para `A cada N ...`.
- Componentes: `recurrence-summary.component.tsx` (card local no desenho do `TotalCard`, aceitando valor já formatado), `recurrence-chart.component.tsx` e `recurrence-chart-legend.component.tsx` (decisão 7) e `recurrence-table.component.tsx` (`Table` dentro de `overflow-x-auto`, primeira coluna `sticky left-0` com fundo opaco, linhas de grupo, subtotal e resultado).
- `checkbox.tsx`: dentro do `Indicator`, `Minus` quando `props.checked === 'indeterminate'`, senão `Check`; classe `data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground`.
- Página reaproveita `CashFlowWindowSelectorComponent`, `formatMonthInSentence`, `DASHBOARD_CARD_CLASSES` e o desenho do esqueleto/erro de `cash-flow-report.page.tsx`.

**Alternativas:**
- *Recorrências escondidas guardadas junto de uma chave `mês|janela`* (como as fatias do prompt 23): a série é a mesma entre meses; o usuário perderia o recorte a cada troca.
- *Guardar visíveis em vez de escondidas*: uma recorrência nova entraria escondida.
- *Esconder sempre descontando dos totais* (primeira versão): impedia ver só o `Total geral` de todas as recorrências ou comparar duas linhas sem distorcer os totais.
- *Duas ações por recorrência (esconder e descontar)*: dois controles por linha confundem e exigem explicar qual está ativo em cada item; uma opção global responde "os totais consideram as escondidas?" com uma resposta só.
- *Gravar a opção de descontar no navegador*: o relatório abriria outro dia com valores fora dos totais sem o usuário perceber.
- *Só a tabela como controle*: obriga a rolar até ela para mudar o gráfico; a legenda ao lado do gráfico controla o mesmo estado sem sair dele (decisão 7).
- *Exportar `TotalCard`*: alteraria um arquivo do prompt 22 fora do escopo.

### 7. Gráfico de linhas com legenda liga-desliga por linha e por grupo

- **`shared/components/ui/multi-line-chart.tsx` (`MultiLineChart`)**: apresentação pura sobre `LineChart` do `recharts`, com o estilo do `ComposedBarLineChart` (margens, grade, eixos, tooltip escuro). Props: `data`, `xKey`, `series: { key; label; color; emphasis?; dashed? }[]` (só as linhas a desenhar), `height`, `emptyState`, `zeroLine` (padrão `true`, `ReferenceLine y={0}`), `highlightedKey` (engrossa a linha e apaga as outras com `strokeOpacity`), `valueFormatter`, `xAxisTickFormatter` e `tooltipLabelFormatter`. `dot={false}` com `activeDot`, animação desligada, `itemSorter` do tooltip pelo valor decrescente e **sem** `Legend` do `recharts`. `data` vazio ou `series` vazio caem no `emptyState`.
- **`data/recurrence-chart.ts` (puro)**: `buildRecurrenceChart(report, hiddenTotalIds)` sobre o `RecurrenceReport` já calculado:
  - `RECURRENCE_TOTAL_LINE_IDS` (`total-inflow`, `total-outflow`, `total-result`) e `isRecurrenceTotalLineId`; as linhas de recorrência usam o `seriesId` (uuid), então não há colisão
  - `RecurrenceChartLine { id; label; description; color; kind: 'total' | 'recurrence'; isOn; total; emphasis; dashed }`: totais com `emphasis`, `Total geral` com `dashed` e cor `CASH_FLOW_COLORS.balance`, e descrição das linhas de entradas e saídas seguindo `report.excludesHidden` (`soma de todas as entradas` ou `soma das entradas visíveis`); recorrência com `isOn = row.isChecked`, `description` = frequência e cor de `INFLOW_LINE_COLORS`/`OUTFLOW_LINE_COLORS` por `index % length` dentro do grupo
  - `RecurrenceChartSection { id: 'totals' | RecurrenceGroupId; label; lines; onCount; state: 'on' | 'off' | 'mixed' }`, sempre `totals`, `inflow`, `outflow`
  - `points` no formato largo (`{ month, label, [lineId]: number }`): totais de `group.monthTotals` e `resultByMonth` (que já seguem a opção de descontar), recorrências de `row.months`
  - `visibleLines` (só `isOn`) e `hiddenCount` (linhas desligadas de todos os grupos)
- **Hook**: `hiddenTotalIds` em `useState` (sessão, sem chave, como `uncheckedIds`), `highlightedLineId`, `chart` em `useMemo`, e as ações:
  - `toggleChartLine(id)`: linha de total → alterna em `hiddenTotalIds`; recorrência → `toggleRecurrence`
  - `toggleChartSection(sectionId)`: liga tudo quando `state === 'off'`, senão desliga tudo; `totals` → `hiddenTotalIds` vazio ou com os três ids; `inflow`/`outflow` → `setGroupChecked`
  - `showAllChartLines()`: limpa `uncheckedIds` e `hiddenTotalIds`
- **Componentes**: `recurrence-chart.component.tsx` (`Card` com a caixa `Descontar dos totais as recorrências ocultas` — `Checkbox` + `Label` ligados por `useId` — no cabeçalho, e `grid lg:grid-cols-[minmax(0,1fr)_20rem]` com `MultiLineChart` de `visibleLines` à esquerda e legenda à direita) e `recurrence-chart-legend.component.tsx` (`Mostrar todas (N)`, título de grupo como botão com `aria-pressed` `true`/`false`/`'mixed'`, contagem `onCount/total` e ícone `EyeOff`/`Eye`; itens com `aria-pressed`, amostra de linha em `border-t` na cor, espessura e tracejado da linha, nome riscado e opacidade quando desligado, descrição, total em `formatCurrency` e hover/foco chamando `setHighlightedLineId`).

**Alternativas:**
- *Barras agrupadas de entradas x saídas (`GroupedBarChart`)*: mostra só as somas; não deixa ver a evolução de cada recorrência nem ligá-las no próprio gráfico.
- *`Legend` do `recharts`*: não tem grupos, não é navegável por teclado como botão e não mostra o total do período.
- *Desligar linha de total mudando somas*: esconder `Total geral` não pode tirar recorrências dos cards; por isso `hiddenTotalIds` é um conjunto separado de `uncheckedIds`, e a opção de descontar só age sobre recorrências.
- *Clique no grupo parcial ligando tudo* (como a caixa tri-estado do Radix): para desligar 20 saídas com uma já desligada seriam dois cliques; na legenda o gesto é "esconder", e só o grupo todo desligado religa.
- *Cor por hash do id*: estável mesmo com recorrências novas, mas sem controle de contraste nem separação visual entre entradas e saídas.

## Risks / Trade-offs

- [Nomes `CashFlow*` usados por outro relatório confundem quem lê] → comentário no caso de uso novo explicando o reaproveitamento; renomeação registrada como fora de escopo.
- [Ocorrência gerada usa o valor atual da série, então um reajuste muda meses passados ainda não abertos] → é o que o extrato mostra; a nota de rodapé diz "com o valor atual da série".
- [Janela de 24 meses com muitas recorrências e semanais gera muitas ocorrências em memória] → conjunto fechado de janelas limita o custo, igual ao relatório de entradas x saídas.
- [Muitas recorrências deixam o gráfico carregado e repetem cores da paleta] → linhas finas sem pontos, destaque por hover, desligar grupo inteiro com um clique e amostra na legenda com o total; a paleta cíclica separa ao menos entradas (frios) de saídas (quentes).
- [Tabela de 24 colunas em tela estreita] → rolagem horizontal só na tabela, primeira coluna fixa; a página não rola na horizontal.
- [Busca por id de série encerrada multiplica leituras] → só para ids ausentes da lista, normalmente nenhum.
- [`localeCompare` depende do ICU do Node] → Node com ICU completo é o padrão; o teste fixa o caso `Água` antes de `Internet`.
- [Radix alterna `indeterminate` → `true`] → a caixa do grupo indeterminada mostra todas no primeiro clique, como a spec descreve.
- [Com a opção de descontar desligada, uma recorrência escondida continua nos totais e o usuário pode achar que ela saiu] → as linhas de total dizem `soma de todas as entradas`/`saídas`, o subtítulo da tabela só fala em descontar com a opção ligada e a nota de rodapé explica a regra.

## Migration Plan

Sem migração de banco nem dado. Deploy comum de backend e frontend; rollback é reverter o código — a rota e a tela novas não têm estado persistido além da chave de janela no `localStorage`, ignorada por versões anteriores.

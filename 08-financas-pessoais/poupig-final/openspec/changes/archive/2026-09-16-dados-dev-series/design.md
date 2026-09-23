## Context

Ver `proposal.md` — Why. Requisitos em `specs/`. Estado atual que molda a abordagem (conferido no código em 2026-09-16):

- **Parte 1 arquivada** (`2026-09-15-dados-dev-transacoes-avulsas`). No domínio: `DEV_DATA_LIMITS`, `DevDataErrors`, catálogo `as const` por tema, `createRandom` (`mulberry32`) com `PseudoRandom` e `SeedSource`, `DevDataPlanner` com estáticos puros (`periodOf`, `monthsOf`, `planAccounts`, `planCreditCards`, `planTransactions` e helpers privados de data em UTC) e `PlanTransactionData(seedSource).execute({ request, today, links })`, com `links: DevDataLinksDTO` só de contagens. No backend: `DataGeneratorWriter` (`loadLinks` → `DataGeneratorLinks`, `resolveLinks`, `writeTransactionData(userId, plan, links)`, classe privada `ItemSummary`), `InMemoryMovementReferences` e `DevController` (`assertEnabled`, `toNumber`, `today` UTC). No frontend: `DataGeneratorQuantityRow`, `DataGeneratorResult` (tabela fixa sobre `DevDataItemSummaryDTO`), `transaction-data.schema.ts` (caixas fora do schema, `parseInteger` exportado), `useGenerateTransactionData` e a página com um card por gerador.
- **Séries e ocorrências** (prompts 18 e 19): `SaveTransactionSeries(repository, references)` cria sem `id`, calcula o `endDate` de `CLOSED` e normaliza a regra. `SaveScheduledTransaction(repository, findByOccurrence, findSeriesById, references)` exige `id`, recalcula `occurrenceOn` a partir da série gravada, valida `SETTLED`/`settledOn` e decide inserir ou atualizar por `(seriesId, occurrenceIndex)`. `findTransactionSeriesById.execute(id, userId)` devolve `Result<TransactionSeriesDTO | null>`. `RecurrenceScheduleCalculator.occurrencesBetween` devolve `{ index, date }[]` sem percorrer a série desde o índice 0.
- **`TransactionModule` não exporta `ScheduledTransactionPrisma`** (só `TransactionPrisma` e `TransactionSeriesPrisma`).
- Séries não têm nome único: não há colisão de nome a tratar, ao contrário de contas e cartões.
- Não existe subcategoria padrão de eletrodoméstico, eletrônico ou móvel; os códigos `TRANSACTION_SERIES_*`, `INVALID_RECURRENCE_*` e `SCHEDULED_TRANSACTION_*` já estão traduzidos em pt e en.
- Lint pré-existente: 88 erros no frontend, 58 erros e 1 aviso no backend; o `npm run lint` do backend aplica `--fix`. Frontend sem suíte de testes.
- A implementação roda em **três sub-agentes sequenciais** — (1) negócio, (2) backend, (3) frontend —, cada um fechando com a própria verificação. Sem teste via navegador.

## Goals / Non-Goals

**Goals:**

- Estender a parte 1 nos mesmos pontos de extensão, sem duplicar gerador pseudoaleatório, período, erros, resolução de vínculos, referências em memória, resumo por item, linha de quantidade nem tabela de resultado.
- Toda escrita pelos casos de uso donos: série por `SaveTransactionSeries`, ocorrência por `SaveScheduledTransaction`.
- Domínio continua só **descrevendo** (plano puro e reprodutível); o cálculo das ocorrências a gravar fica no backend, sobre a série **gravada**.
- Diff restrito aos três diretórios do módulo `dev` e a uma linha do `TransactionModule`.

**Non-Goals:**

- Não otimizar a materialização (lote, `createMany`, transação de banco, cache da série) — cada ocorrência passa pelo caso de uso.
- Não generalizar o `DataGeneratorResult` para colunas variáveis.
- Não planejar ocorrências no domínio `dev`: isso exigiria importar a regra de recorrência do módulo `transaction`.

## Decisions

### 1. Exportar `ScheduledTransactionPrisma` no `TransactionModule`

Acrescentar o adapter ao `exports` de `apps/backend/src/modules/transaction/transaction.module.ts`. O provider já existe no módulo; exportá-lo segue o precedente do `TransactionSeriesPrisma`, exportado para outro módulo usar. O `dev.module.ts` não muda.

Alternativas: registrar `ScheduledTransactionPrisma` como provider do `DevModule` importando `DbModule` — rejeitada, cria uma segunda instância do adapter e contraria a decisão da parte 1 de o `dev` não ter adapter nem `DbModule`; gravar ocorrências pelo `TransactionPrisma` ou pelo Prisma direto — proibida, contornaria a validação de índice, o `occurrenceOn` e a invariante de efetivação.

### 2. `TransactionSeriesBlueprint` com literais e posições

Mesmo desenho dos blueprints da parte 1: a forma da entrada do `SaveTransactionSeries` **sem** `id`, `userId` e `endDate`, com `direction: DirectionLiteral`, `kind: 'OPEN' | 'CLOSED'`, `recurrence: { unit: 'WEEK' | 'MONTH' | 'YEAR'; interval: number; weekDay?: number; dayOfMonth?: number; month?: number }` (compatível com `RecurrenceRuleInput`), `startDate`, `installments: number | null`, `note: string | null`, `categoryHint: string | null`, `accountIndex` e `creditCardIndex: number | null`. Os campos `accountIndex`/`creditCardIndex`/`categoryHint` têm os mesmos nomes do `TransactionBlueprint`, então o `resolveLinks` da parte 1 serve sem mudança. `SeriesDataPlanDTO` traz `series` numa lista única — recorrências primeiro, depois parcelamentos —, e o gravador separa as contagens pelo `kind`.

Alternativa: duas listas (`recurrences`, `installmentPlans`) — rejeitada, o laço de gravação é o mesmo para as duas e o `kind` já distingue.

### 3. Catálogo de séries: unidade e parcelas no molde

- `recurrences.catalog.ts`: `{ name, direction, valueRange, weight, unit, categoryHint }`. A unidade vem do molde, e o peso do molde decide quantas recorrências caem em cada unidade — o requisito "`MONTH` na maioria, `YEAR` raro" vira uma propriedade verificável do catálogo (soma de pesos por unidade), não uma segunda sorteada.
- `installment-plans.catalog.ts`: `{ name, totalRange, installmentsRange, weight, categoryHint }`, sempre saída (sem campo `direction`, o planejador preenche `'OUT'`).
- Dicas conforme a tabela do prompt 20 (por exemplo `Balé da Fernanda` → `Cursos e Idiomas`, `Diarista` → `Serviços Domésticos`, `Geladeira`/`Sofá` → `Manutenção e Reparos`, `Notebook` → `Material Didático`). O cabeçalho documenta que, sem subcategoria própria, usa-se a mais próxima existente.
- Os tetos novos entram em `DEV_DATA_LIMITS`: `maxRecurrences: 20`, `maxInstallmentPlans: 20`, `minInstallments: 2`, `maxInstallmentsPlanned: 24`, com comentário do porquê (execução síncrona com até mil e poucas ocorrências; 24 cobre parcelamentos de consumo comuns sem inflar a materialização).

### 4. `DevDataPlanner.planTransactionSeries(recurrences, installmentPlans, period, links, random)`

Estático e puro, reaproveitando os helpers privados de data do planejador:

1. **Recorrências** (`recurrences` vezes): molde por `weightedPick`; `value = int(min × 100, max × 100) / 100`; `startDate` = dia sorteado entre `period.from` e `period.today` (contagem de dias por `Date.UTC`); regra com `interval: 1` e âncora da unidade — `MONTH`: `dayOfMonth = int(1, 28)`; `WEEK`: `weekDay = int(1, 7)`; `YEAR`: `month = int(1, 12)` e `dayOfMonth = int(1, 28)`; `installments: null`.
2. **Parcelamentos** (`installmentPlans` vezes): molde por `weightedPick`; `installments = int(range)`; total em centavos `int(min × 100, max × 100)`; `value = Math.round(totalCents / installments) / 100`; regra `MONTH` com `dayOfMonth = int(1, 28)`; `startDate` sorteado entre `max(period.from, primeiro dia do mês que fica installments - 1 meses antes de hoje)` e `today`, para que, quando o período permite, parte das parcelas já tenha vencido e parte ainda esteja por vir.
3. Em cada série: `accountIndex = int(0, accountCount - 1)`; cartão só em `OUT`, com `creditCardCount > 0` e `chance(0.3)`, em `int(0, creditCardCount - 1)`; `note: null`; `categoryHint` do molde.

`dayOfMonth` em `1..28` evita o ajuste de fim de mês sem perder realismo (o spec aceita `1..31`). O planejador **não** calcula ocorrências.

### 5. `PlanSeriesData(seedSource)` no desenho do `PlanTransactionData`

`execute({ request, today, links })`, com `request.months` opcional. Fase (a), acumulando sem repetição: `INVALID_DEV_DATA_REQUEST` (nenhuma quantidade `> 0`), `INVALID_DEV_DATA_QUANTITY` (`Number.isInteger` e `0..teto`, `NaN` incluso), `INVALID_DEV_DATA_PERIOD`, `INVALID_DEV_DATA_SEED` (`Number.isSafeInteger` quando presente). Fase (b), só se (a) passou: `DEV_DATA_ACCOUNT_REQUIRED` quando `links.accountCount === 0`. Depois `seed = request.seed ?? seedSource()`, **um** `random`, e a ordem fixa `periodOf` → `planTransactionSeries` (recorrências antes dos parcelamentos), registrada em comentário como contrato de reprodutibilidade.

Alternativa: extrair a validação de formato comum para um helper compartilhado com `PlanTransactionData` — rejeitada nesta mudança, alteraria arquivo e testes da parte 1 sem ganho de comportamento; as duas validações têm itens diferentes.

### 6. `DataGeneratorWriter.writeSeriesData(userId, plan, links)`

Injeta também `TransactionSeriesPrisma` e `ScheduledTransactionPrisma`. Fluxo **sequencial** (sem `Promise.all`):

1. `InMemoryMovementReferences` preenchido com `replaceAccounts`, `replaceCreditCards` e `setSubcategories` a partir de `links`; `resolveRandom = createRandom(plan.seed)` separado do plano.
2. Para cada blueprint: `resolveLinks`; `new SaveTransactionSeries(transactionSeriesPrisma, references).execute({ userId, name, note, value, direction: Direction[...], accountId: accountId ?? '', creditCardId, subcategoryId, kind: SeriesKind[...], recurrence, startDate, installments })`; registra no `ItemSummary` de `recurrences` ou `installmentPlans` pelo `kind`. Falha → segue para a próxima série.
3. Série criada → `transactionSeriesPrisma.findTransactionSeriesById.execute(id, userId)`. Falha ou `null` → registra no resumo de ocorrências um ignorado com o código (`SCHEDULED_TRANSACTION_SERIES_NOT_FOUND` no caso `null`) e segue.
4. `RecurrenceScheduleCalculator.occurrencesBetween(series.startDate, series.recurrence, { from: series.startDate, to: plan.period.to, endDate: series.endDate, installments: series.installments })`.
5. Para cada ocorrência: `new SaveScheduledTransaction(...)` com `seriesId`, `occurrenceIndex`, `id: randomUUID()`, `userId`, campos da **série gravada**, `expectedOn: date` e `date < plan.period.today` → `TransactionStatus.SETTLED` + `settledOn: date`, senão `PENDING` + `settledOn: null`.
6. `OccurrenceSummary` privado (irmão do `ItemSummary`): `record(result, status)` soma em `settled`/`pending` ou em `skipped` e acumula `errors` num `Set`.

Os casos de uso são instanciados uma vez por execução, fora dos laços. Exceção lançada propaga como `500`, como na parte 1.

Por que ler a série gravada em vez de usar o blueprint: o `endDate` e a regra normalizada são calculados pela entidade, e o `SaveScheduledTransaction` recalcula `occurrenceOn` pela série gravada — a mesma fonte evita divergência de índice. Por que `plan.period.today` e não um novo `new Date()`: planejamento e gravação usam o mesmo "hoje", mesmo que a execução atravesse a meia-noite UTC.

Alternativas: calcular as ocorrências no domínio `dev` — rejeitada, exigiria importar `RecurrenceScheduleCalculator` de `@poupig/transaction`; passar ao `SaveScheduledTransaction` uma consulta de série em cache — rejeitada por ora, o prompt pede o adapter e o custo cabe numa execução de desenvolvimento (ver Riscos).

### 7. `POST series` no `DevController`

Cópia do desenho de `POST transactions`: `@Post('series')` com `@HttpCode(HttpStatus.OK)`; `assertEnabled()` na primeira linha; `recurrences`/`installmentPlans` por `this.toNumber(...) ?? 0`, `months`/`seed` por `this.toNumber(...)`; `today` UTC; `writer.loadLinks(user.id)`; `new PlanSeriesData(() => randomInt(0, 2 ** 31)).execute({ request, today, links: links.counts })`; `BadRequestException(planResult.errors)`; `writer.writeSeriesData(user.id, plan, links)`.

### 8. Frontend

- **Cliente**: `generateSeriesData(token, payload)` → `POST /dev/data-generator/series`, com o mesmo `headers`/`handleError` do `generateTransactionData`.
- **Schema** `series-data.schema.ts`: `SeriesDataSelection` (`recurrences`, `installmentPlans`), `SERIES_DATA_ITEM_LIMITS` de `DEV_DATA_LIMITS`, `SERIES_DATA_SELECTION_FIELD = 'selection'`, `createSeriesDataSchema(selection)` com `Text` e refinamentos, e `SeriesDataFormData` por `v.infer`; importa `parseInteger` de `transaction-data.schema.ts`.
- **Hook** `useGenerateSeriesData()`: cópia do formato de `useGenerateTransactionData`, com `GenerateSeriesDataResult`, estado gravado só no handler.
- **Componente** `SeriesDataGenerator`: `Card` `Séries e parcelas`; seleção em `useState` (as duas marcadas); valores iniciais `5`/`3`/`3`/vazio; `FormSectionLayout` `Séries` e `Opções`; aviso curto no mesmo estilo `role="note"` da página; botão com estado de envio; `toSeriesResultRows(summary)` → `Recorrências`, `Parcelamentos` e `Ocorrências` (`requested = settled + pending + skipped`, `created = settled + pending`, `skipped`, `errors`); abaixo do `DataGeneratorResult`, quando há resumo, a linha `N efetivadas · M pendentes`; `toast.success` com séries criadas e ocorrências gravadas.
- **Página**: `<SeriesDataGenerator />` logo abaixo de `<TransactionDataGenerator />`, no lugar indicado pelo comentário.

Alternativa para o resultado: acrescentar colunas ou uma prop de conteúdo extra ao `DataGeneratorResult` — rejeitada, muda o componente da parte 1 para atender um caso que a conversão resolve.

### 9. Testes do domínio

- `plan-series-data.use-case.test.ts` (novo): validação de cada código, acúmulo sem repetição, `DEV_DATA_ACCOUNT_REQUIRED` só depois do formato, mesma semente/mesmo plano e `seedSource` usado quando falta semente.
- `dev-data-planner.service.test.ts` (estendido): `startDate` em `[from, today]`; `CLOSED` sempre `MONTH`/`OUT` com `installments` em `2..24` e parcela com duas casas cujo produto fica na faixa total (tolerância de centavos); `OPEN` com `installments: null`; âncoras só da unidade e `interval: 1`; entradas sem cartão; sem cartão quando `creditCardCount` é `0`; `accountIndex` em faixa; quantidades exatas.
- `catalog.test.ts` (estendido): nomes em `2..100`; dicas de saída em `DEFAULT_SUBCATEGORY_NAMES` (lista já copiada); entradas com dica nula; parcelamentos todos com faixa em `2..24`; ao menos uma recorrência de entrada e de cada unidade; soma de pesos `MONTH` > `WEEK + YEAR` e `YEAR` < `WEEK`.

## Risks / Trade-offs

- [Custo da materialização] → cada ocorrência faz três consultas (série, ocorrência gravada, inserção). No pior caso, mil e poucas ocorrências somam alguns milhares de consultas sequenciais — segundos a dezenas de segundos num banco local. Aceito por ser só de desenvolvimento; os tetos existem para isso. Se incomodar, uma consulta de série em memória no `dev` resolve sem mudar spec.
- [Ocorrências gravadas não acompanham a série] → exceção deliberada, documentada no spec do backend e no aviso do cartão; cada ocorrência pode ser revertida para a série pela tela do extrato.
- [Série sem nenhuma ocorrência gravada] → início perto do fim do mês com âncora anterior ao dia leva a primeira ocorrência para o mês seguinte. Aceito; a série aparece no extrato futuro.
- ["Hoje" em UTC] → entre 21h e 24h em UTC−3, ocorrências do "hoje local" nascem efetivadas. Mesma regra aceita na parte 1.
- [Literal de enum divergente] → `Direction[...]`, `SeriesKind[...]` e `TransactionStatus[...]` indexados pelo literal quebram o build se divergirem; a regra crua passa pela validação do caso de uso, que reprova com código no resumo.
- [Dicas aproximadas para eletrodoméstico, eletrônico e móvel] → documentadas no catálogo; em runtime, o casamento por nome funciona e nenhuma regra depende da semântica.
- [Linha do `TransactionModule` fora do diretório do `dev`] → única exceção, registrada na proposta e conferida no diff final.
- [Roteiro `.http` dependente da data] → as conferências do extrato usam `{{$datetime}}` em UTC e descrevem o esperado em comentário, como na parte 1.
- [Lint pré-existente e `--fix` do backend] → `npx eslint <arquivos tocados>` sem `--fix`; nunca `npm run lint` no backend.

## Migration Plan

Sem migração de banco nem variável nova. Produção não define `DEV_TOOLS_ENABLED`, então a rota nova responde `404`. Em desenvolvimento, reiniciar backend e frontend depois do build.

Rollback: reverter os arquivos do módulo `dev` e a linha do `exports`. Séries e ocorrências já geradas continuam como dados comuns do usuário.

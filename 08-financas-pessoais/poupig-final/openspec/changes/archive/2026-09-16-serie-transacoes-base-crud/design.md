## Context

Ver `proposal.md` — Why. Requisitos em `specs/`. Restrições do estado atual que moldam a abordagem (verificadas no código):

- Os prompts 15, 16 e 17 estão concluídos e arquivados: `movement`, `transaction`, `Money`, `MovementReferencesQuery`, `TransactionPrisma`, `TransactionController`, extrato mensal e `useTransactionOptions` existem como o prompt descreve.
- `Entity.cloneWith` do `@poupig/shared` chama o `tryCreate` da própria classe: qualquer derivação reaplica validação e invariantes. É isso que recalcula a `endDate` no `update` e no `softDelete`.
- `Id.tryCreate` gera uuid para valor vazio; `DateOnly`, `PositiveInteger` e `DayOfMonth` falham com códigos genéricos (`INVALID_DATE_ONLY`, `INVALID_POSITIVE_INTEGER`, `INVALID_DAY_OF_MONTH`/`DAY_OF_MONTH_OUT_OF_RANGE`). Esses três últimos **não** estão no dicionário de i18n, e `getErrorMessage` devolve o código cru quando não acha a chave.
- `ValueObject.equals` compara com `===`; enum numérico do TypeScript tem mapeamento reverso.
- No `transaction.prisma.ts`, `toDbDate`, `fromDbDate` e `transactionDTOSelect` são **locais** ao arquivo.
- O `TransactionController` já está com teto de `pageSize` 100 (mudança do prompt 16) e a listagem de transações ganhou `creditCardId`/`onlyCreditCard`. Nada disso é tocado.
- O validador `v` do frontend monta o objeto processado **só com os campos declarados** no schema: os refinamentos recebem esse objeto e o submit devolve só esses campos. Mensagem de refinamento é exibida como veio (por isso é traduzida com `getMessage` na declaração).
- Na página do extrato, a barra recebe `onNewTransaction` e o estado vazio sem filtros tem um segundo botão "Nova transação" que chama o mesmo handler.
- O lint do frontend e do backend já falha (88 e 58 erros) e o script `lint` do backend aplica `--fix` em tudo.
- A implementação roda em três sub-agentes sequenciais (negócio, backend, frontend); cada grupo de tarefas termina com uma verificação para o agente seguinte partir de um estado verde.

## Goals / Non-Goals

**Goals:**

- Uma única implementação do cálculo de agenda, consumida pela entidade (backend) e pela prévia do formulário (frontend), e reaproveitável pelo prompt 19.
- Uma única fonte de verdade para a `endDate` de parcelamento: a entidade.
- Reaproveitar sem duplicar: núcleo `movement`, VOs do `@poupig/shared`, conversões e seleção do adapter de transações, opções e componentes do frontend.

**Non-Goals:**

- Mexer no comportamento de `Transaction` (domínio, backend ou tela), exceto a extração de conversões/seleção e o menu do botão "Nova transação".
- Validar coerência entre `accountId` e `creditCardId`, ou ordem entre `startDate` e `endDate` além da primeira ocorrência.
- Restrições `CHECK` no banco para a coerência das colunas da regra.

## Decisions

### 1. Tudo da série nasce no agregado, não no núcleo `movement`

`SeriesKind`, `FrequencyUnit`, `DayOfWeek`, `RecurrenceRule` e `RecurrenceScheduleCalculator` ficam em `modules/transaction/src/transaction-series/model`. O spec `movement-core` proíbe essas peças no núcleo e hoje só a série as consome; o prompt 19 importa do agregado da série (ou move para o núcleo quando houver o segundo consumidor, com o spec alterado).

Alternativa: antecipar no núcleo — rejeitada pelo critério "mais de um consumidor" já adotado.

### 2. `RecurrenceRule` como união + função de validação normalizadora

```ts
type RecurrenceRule =
  | { unit: FrequencyUnit.WEEK; interval: number; weekDay: DayOfWeek }
  | { unit: FrequencyUnit.MONTH; interval: number; dayOfMonth: number }
  | { unit: FrequencyUnit.YEAR; interval: number; month: number; dayOfMonth: number };

interface RecurrenceRuleInput {
  unit?: string; interval?: number | string; weekDay?: number | string;
  dayOfMonth?: number | string; month?: number | string;
}
```

`tryCreateRecurrenceRule(input)`:
1. Converte cada número com uma função local: `undefined`/`null`/`''` viram ausente; string vira `Number(trim)` (texto não numérico vira `NaN`, reprovado adiante — nunca gravado).
2. `unit` por `isFrequencyUnit`; `interval` por `PositiveInteger.tryCreate` e `<= MAX_RECURRENCE_INTERVAL` (99).
3. Só se a unidade é válida, lê as âncoras **dela**: `weekDay` por `isDayOfWeek`; `dayOfMonth` por `DayOfMonth.tryCreate` (os dois códigos do VO viram `INVALID_RECURRENCE_DAY_OF_MONTH`); `month` por `PositiveInteger` e `<= 12`.
4. Acumula todos os códigos e, com sucesso, monta um objeto novo só com os campos da unidade — o excedente some por construção.

A regra anual não cruza mês e dia (30/02 é aceito): o grampo do cálculo resolve, e reprovar criaria uma regra que o formulário não consegue explicar no ano bissexto.

Alternativas: (a) `ValueObject` — rejeitada, `equals` com `===` não compara objeto; (b) validação rigorosa que reprova âncora sobrando — rejeitada, o formulário troca de frequência sem limpar o campo anterior; (c) três classes, uma por unidade — rejeitada, multiplica o código sem ganho de regra.

### 3. `DayOfWeek` numérico com guard que não usa `Object.values`

`enum DayOfWeek { MONDAY = 1, … SUNDAY = 7 }` e `isDayOfWeek = (v: unknown): v is DayOfWeek => typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 7`. `Object.values` devolveria também `'MONDAY'`…, aceitando nomes. String `'1'` é reprovada pelo guard; a conversão de formulário acontece antes, na regra (decisão 2). `SeriesKind`/`FrequencyUnit` são enums de string com `Object.values`, como `Direction`.

### 4. `RecurrenceScheduleCalculator`: aritmética sobre ano/mês/dia em UTC

Classe com métodos estáticos puros (skill `module-domain-service`), com a pré-condição documentada de receber data e regra já válidas (a entidade valida antes; o formulário só chama com a regra aprovada):

- Parse único `YYYY-MM-DD` → `{ y, m, d }` inteiros; formatação com `padStart`. Comparação de datas pela própria string (`YYYY-MM-DD` ordena lexicograficamente).
- `daysInMonth(y, m) = new Date(Date.UTC(y, m, 0)).getUTCDate()`; `clamp(y, m, day) = min(day, daysInMonth)`.
- `WEEK`: ISO do início `= ((getUTCDay() + 6) % 7) + 1`; primeira `= início + ((weekDay − isoInício + 7) % 7)` dias; n-ésima `= primeira + 7 × interval × n` dias via `Date.UTC(y, m − 1, d + delta)`.
- `MONTH`: candidata no mês do início com o dia grampeado; se `< início`, o **mês seguinte** (não `+ interval`: o intervalo conta a partir da primeira). N-ésima: índice absoluto de mês `y × 12 + (m − 1) + interval × n`, dia `clamp(anchor)` — a âncora nunca é substituída pelo dia grampeado.
- `YEAR`: candidata no ano do início em `month`/`clamp(dayOfMonth)`; se `< início`, ano seguinte. N-ésima: `ano da primeira + interval × n`, com o mesmo grampo (29/02).
- `lastOccurrence(start, rule, installments) = occurrenceAt(start, rule, installments − 1)`.
- Proibido: `Date.now()`, `new Date()` sem argumentos, getters locais (`getDate`, `getDay`, `getMonth`), `new Date('YYYY-MM-DD')` e bibliotecas de data.

Alternativas: (a) `date-fns` — rejeitada, o pacote de domínio não depende dela e suas funções usam fuso local; (b) iterar ocorrência por ocorrência até o índice — rejeitada, O(n) sem necessidade e mais sujeito a acumular o grampo; (c) tratar `startDate` como primeira ocorrência — rejeitada pela regra "a âncora manda".

### 5. Entidade: validação primeiro, invariantes dependentes depois

`TransactionSeriesProps extends EntityProps` com `kind: SeriesKind`, `recurrence: RecurrenceRuleInput`, `startDate: string`, `endDate?: string | null`, `installments?: number | null` (demais como `TransactionProps`). O getter `recurrence` devolve `RecurrenceRule` (o `tryCreate` só guarda a regra normalizada).

Ordem no `tryCreate`, espelhando `Transaction.tryCreate`:
1. `id`, `userId`, `name`, `value`, `direction` (`isDirection` → `MovementErrors.INVALID_DIRECTION`), `accountId` (vazio reprovado **antes** do `Id`), `startDate` (remapeado), `kind` (`isSeriesKind`), `recurrence` (códigos da regra passam como vieram), opcionais só quando preenchidos (remapeados).
2. `CLOSED`: `installments` ausente → `TRANSACTION_SERIES_INSTALLMENTS_REQUIRED`; presente → `PositiveInteger` e `<= MAX_INSTALLMENTS` (480) → `INVALID_TRANSACTION_SERIES_INSTALLMENTS`. A `endDate` recebida não é lida.
3. `OPEN`: `installments` não é lido; `endDate` preenchida → `DateOnly` (remapeado para `INVALID_TRANSACTION_SERIES_END_DATE`).
4. Com `Result.combine` verde, as invariantes que dependem de mais de um atributo: `CLOSED` calcula `endDate = lastOccurrence(...)`; `OPEN` com `endDate < firstOccurrence(...)` falha com `TRANSACTION_SERIES_END_DATE_BEFORE_START`. Rodar depois garante que o cálculo nunca recebe entrada inválida.
5. Props finais: `installments` só em `CLOSED`, `endDate` calculada em `CLOSED`, informada ou `null` em `OPEN`.

`kind` inválido pula os passos 2–4 (não há como saber qual invariante vale); a falha já contém `INVALID_SERIES_KIND`.

Diferença proposital da `Transaction` (que valida `settledOn` preenchido mesmo em `PENDING`): em `OPEN`, `installments` é descartado **sem validação**, porque a normalização existe justamente para o formulário que troca de tipo, e reprovar um valor que será jogado fora não protege nada.

Alternativas: (a) aceitar `endDate` do cliente e só conferir coerência — rejeitada, duas fontes de verdade; (b) guardar `occurrences` calculadas na entidade — rejeitada, é o papel da `ScheduledTransaction` (prompt 19).

### 6. Onde mora cada código

- Regra: `RecurrenceRuleErrors` em `recurrence-rule.ts` (5 códigos).
- Agregado: `TransactionSeriesErrors` em `transaction-series.entity.ts` (10 códigos, lista exata no spec).
- Aplicação: `SaveTransactionSeriesErrors` em `save-transaction-series.use-case.ts` (3 códigos de vínculo).
- Nenhum `*.errors.ts` ou `*.constants.ts` novo; limites exportados dos arquivos que os usam (`MAX_RECURRENCE_INTERVAL`, `MAX_INSTALLMENTS`). Nenhum `TRANSACTION_*` da `Transaction` é reaproveitado: a mensagem precisa falar de série.

### 7. Casos de uso no desenho da `Transaction`

`SaveTransactionSeries(repository, movementReferences)` copia a estrutura de `SaveTransaction`: `buildNew` (sem `id`) ou `buildUpdated` (`findById`, posse → `TRANSACTION_SERIES_NOT_FOUND`, `cloneWith` com **substituição completa** dos campos editáveis, opcionais ausentes como `null`, `updatedAt: new Date()`), depois `checkReferences` em paralelo (conta sempre; cartão e subcategoria só se informados; falha técnica propagada; códigos acumulados) e por fim `create`/`update`, devolvendo `{ id }`. Os campos editáveis incluem `kind`, `recurrence`, `startDate`, `endDate` e `installments`; a entidade decide o que vale para cada tipo. `DeleteTransactionSeries` repete `DeleteTransaction`.

A duplicação de ~40 linhas de `checkReferences` entre os dois `Save*` é aceita: extrair um helper para o núcleo mudaria `SaveTransaction`, e o prompt restringe o agregado `transaction`. O prompt 19 é o momento natural para extrair, com três consumidores.

### 8. Prisma: colunas planas, `SmallInt` e `endDate` persistida

`frequencyUnit FrequencyUnit`, `frequencyInterval Int @db.SmallInt`, `weekDay/dayOfMonth/month/installments Int? @db.SmallInt`, `startDate DateTime @db.Date`, `endDate DateTime? @db.Date`. A `endDate` de parcelamento é gravada, mesmo sendo derivável, porque o prompt 19 vai consultar "séries ativas no mês" por coluna. A coerência entre `frequency_unit` e as âncoras é garantida pelo adapter (sem `CHECK`, que o Prisma não gera):

- `toData`: `frequencyUnit`/`frequencyInterval` da regra e `weekDay`, `dayOfMonth`, `month` por `'weekDay' in rule ? rule.weekDay : null` (ou `switch` em `unit`).
- `toRecurrenceInput(row)`: `switch (row.frequencyUnit)` montando só as âncoras daquela unidade; o resultado passa pelo `tryCreate` da entidade (no `findById`) ou vai direto ao DTO (leituras), já que a linha foi gravada por uma entidade válida.

Relações inversas `transactionSeries TransactionSeries[]` em `User`, `Account`, `Card` e `Subcategory` (sem coluna nova). Migração `add_transaction_series` com o banco local de pé.

Alternativa: `Json` para a regra — rejeitada pelo prompt (consulta por unidade e conferência pelo banco).

### 9. Utilitário compartilhado entre os dois adapters

Novo `apps/backend/src/modules/transaction/transaction-prisma.util.ts` com `toDbDate`, `fromDbDate` e `referenceNamesSelect` (`account.name`, `creditCard.name`, `subcategory.name`, `subcategory.category.name`) mais `toReferenceNames(row)` (os quatro nomes com `?? null`). `transaction.prisma.ts` passa a importá-los e a espalhar `...referenceNamesSelect` no `transactionDTOSelect`, **sem mudar corpo nem resultado** das funções. A constante é declarada `as const` e cada `select` mantém o próprio `satisfies Prisma.<Model>Select`, para o `GetPayload` continuar inferindo os tipos.

Alternativa: copiar as funções no adapter novo — rejeitada pelo prompt (duplicação da regra de fuso).

### 10. Adapter e controller da série

`TransactionSeriesPrisma implements TransactionSeriesRepository` com `findTransactionSeriesById` e `listTransactionSeries` como atributos `readonly` inline, `db(tx)` e `Result.tryAsync`, exatamente como `TransactionPrisma`. A listagem valida `kind`/`direction` pelos guards e falha com `INVALID_SERIES_KIND`/`INVALID_DIRECTION` (400) em vez de deixar o Prisma lançar erro, e usa `orderBy: [{ startDate: 'desc' }, { createdAt: 'desc' }]`.

`TransactionSeriesController` (`@Controller('transaction-series')`) injeta `TransactionSeriesPrisma` e `TransactionPrisma` (só o `movementReferences`). O corpo tem a regra achatada; um `toSaveInput(body, userId, id?)` local escolhe os campos aceitos (descarta `id`/`userId` do corpo) e remonta `recurrence: { unit, interval, weekDay, dayOfMonth, month }`. Um helper privado `parseNumber(value)` converte `value`, `interval`, `weekDay`, `dayOfMonth`, `month` e `installments`: `undefined`/`null`/`''` → `undefined`, número passa, string → `Number(trim)`; o `NaN` segue para o domínio, que o reprova com o código do atributo. `page >= 1`, `pageSize` padrão 10 e teto **50** (como pede o prompt; o teto 100 do `TransactionController` não é alterado). `toHttpException`: `TRANSACTION_SERIES_NOT_FOUND` → 404; resto → 400 com a lista. `transaction.module.ts` registra o controller e o provider novos.

### 11. Schema do formulário: campos de transporte e refinamentos que chamam o domínio

O prompt diz que `kind`, `direction`, `unit`, `weekDay` e `month` "ficam fora do schema", mas o validador descarta campos não declarados (Context), e os refinamentos pedidos precisam deles e de `interval`, `dayOfMonth` e `installments`, que o prompt nem lista. Aplica-se a mesma solução já **decidida com o usuário** na mudança `transacao-base-crud` (decisão 12 dela) para `direction`/`status`: declarar como **transporte**.

```ts
v.defineObject({
  name: MovementName, note: { vo: MovementNote, optional: true }, value: Money,
  direction: Text, accountId: Text,
  creditCardId: { vo: Id, optional: true }, subcategoryId: { vo: Id, optional: true },
  kind: Text, startDate: DateOnly, unit: Text,
  interval: { vo: Text, optional: true }, weekDay: { vo: Text, optional: true },
  dayOfMonth: { vo: Text, optional: true }, month: { vo: Text, optional: true },
  installments: { vo: Text, optional: true },
  endDate: { vo: DateOnly, optional: true },
})
```

Os cinco campos numéricos trafegam como **string** (é o que `Input type="number"` e `Combobox` produzem, e o que `RecurrenceRuleInput` já aceita). Assim nenhum deles falha no nível do campo: toda mensagem vem de um refinamento com código do domínio traduzido por `getMessage`, e um campo escondido nunca bloqueia o envio.

Refinamentos (um por campo, porque cada um tem um `field` e uma mensagem):
- `ruleErrors(d) = tryCreateRecurrenceRule(d).errors ?? []` → `interval`, `weekDay`, `dayOfMonth`, `month` reprovados quando a lista contém o código correspondente (a regra já ignora âncoras de outra unidade).
- `kind === CLOSED` e `installments` ausente → `TRANSACTION_SERIES_INSTALLMENTS_REQUIRED`; presente e `PositiveInteger.tryCreate(Number(...))` falho ou `> MAX_INSTALLMENTS` → `INVALID_TRANSACTION_SERIES_INSTALLMENTS`.
- `kind === OPEN`, `endDate`, `startDate` e regra válidos e `endDate < RecurrenceScheduleCalculator.firstOccurrence(...)` → `TRANSACTION_SERIES_END_DATE_BEFORE_START`.

`TransactionSeriesFormData` estreita `direction`, `kind`, `unit` para os enums e as datas para `string`, como `TransactionFormData`.

Alternativas: (a) deixar fora do schema, como no prompt — rejeitada, refinamentos nunca disparariam; (b) `PositiveInteger`/`DayOfMonth` nos campos numéricos — rejeitada, um dia do mês inválido escondido ao trocar para `Semanal` travaria o envio sem erro visível, e `INVALID_POSITIVE_INTEGER`/`INVALID_DAY_OF_MONTH` apareceriam crus (não estão no dicionário); (c) resolver composto lendo `getValues()` — rejeitada, segundo ponto de validação.

### 12. Formulário: handlers em vez de efeitos, prévia derivada na renderização

- Estado local só `anchorTouched` (`useState(false)`), ligado nos `onChange` dos campos de âncora.
- `handleStartDateChange` e `handleUnitChange` gravam o novo valor e, se `!anchorTouched`, chamam `form.setValue` para `weekDay`, `dayOfMonth` e `month` com `deriveAnchor(startDate)` — as três de uma vez, então trocar de unidade depois já encontra a âncora certa. `deriveAnchor` divide a string e usa `Date.UTC(...).getUTCDay()` para o dia ISO (não é regra de agenda, é leitura da data escolhida).
- `handleKindChange`: `CLOSED → OPEN` limpa `installments`; `OPEN → CLOSED` limpa `endDate`; ambos com `clearErrors`.
- Prévia e data fim somente leitura: `useWatch` dos campos da regra, `startDate`, `kind` e `installments`; na renderização, `DateOnly.tryCreate` + `tryCreateRecurrenceRule`; se ok, `occurrenceAt` para `0..min(3, parcelas)-1` e `lastOccurrence` em `CLOSED`, formatadas por `split('-')`. Nenhum `useEffect` grava estado.
- `toSaveInput(data)`: a regra normalizada de `tryCreateRecurrenceRule(data)` é achatada com `null` nas âncoras ausentes; `installments: kind === CLOSED ? Number(data.installments) : null`; `endDate: kind === OPEN ? data.endDate ?? null : null`; opcionais vazios → `null`.
- Frase do intervalo por um helper local com singular/plural (`toda semana`/`a cada N semanas`…).

### 13. Página, barra, hook e rótulos

- `ViewMode = 'list' | 'form' | 'series-form'`; `series-form` renderiza `PageSectionHeader` (badge `Extrato Mensal`, título `Nova série de transações`) + `TransactionSeriesFormComponent` com o `options` já carregado na página. Sucesso: `toast.success('Série criada com sucesso!')` e `setMode('list')`, **sem** `refresh()`.
- `StatementToolbarComponent`: `onNewTransaction` vira `onCreateSingle` e `onCreateSeries`; o `Button` atual passa a ser o filho do `DropdownMenuTrigger` (mesmo `size`, `aria-label` e texto oculto em telas estreitas, com `ChevronDown`), e o `DropdownMenuContent` tem os dois `DropdownMenuItem`. O botão do estado vazio continua chamando o handler da transação avulsa: o convite ali é "registrar a primeira transação do mês" e a série não aparece no extrato.
- `useCreateTransactionSeries()` → `{ create, isSubmitting }`, `create(input): Promise<MutationResult>` importando o tipo `MutationResult` de `use-transactions.ts` (redeclarar quebraria o `export *` do barril); o conversor de erro é local e não exportado, pelo mesmo motivo.
- `transaction-series.labels.ts`: `SERIES_KIND_LABELS: Record<SeriesKind, string>`, `FREQUENCY_UNIT_LABELS: Record<FrequencyUnit, string>`, `DAY_OF_WEEK_LABELS: Record<DayOfWeek, string>` e `MONTH_LABELS` indexado pelo mês humano (1..12). Dias e meses derivados de `format(..., 'EEEE' | 'MMMM', { locale: ptBR })` sobre datas locais fixas (2024-01-01 é segunda) e capitalizados.
- O client só tem `createTransactionSeries`; `TransactionSeriesDTO` já nasce completo para o prompt 19.

## Risks / Trade-offs

- [Mapeamento reverso do enum numérico aceitando `'MONDAY'`] → guard sem `Object.values` e teste explícito com `'MONDAY'` e `'1'`.
- [Data deslocando um dia pelo fuso] → aritmética só com `Date.UTC`/getters UTC; rodar os testes do agregado também com `TZ=America/Sao_Paulo`; cenário do `.http` conferindo `YYYY-MM-DD`.
- [Prévia do front divergindo do que o backend grava] → mesma função importada de `@poupig/transaction`; o frontend consome o `dist` do pacote, então o build do Turbo precisa recompilar o domínio antes (verificado na etapa final).
- [Âncoras de outra unidade sobrando no estado do formulário] → a regra do domínio as descarta, o payload é montado a partir da regra normalizada e o adapter grava `null` nas colunas alheias.
- [Extração no `TransactionPrisma` mudando comportamento] → mover o código sem editar os corpos, build verde e revisão do diff limitada a imports e spread do `select`.
- [`checkReferences` duplicado entre os dois `Save*`] → aceito nesta mudança (decisão 7); candidato a extração no prompt 19.
- [`endDate` persistida ficar desatualizada se o cálculo mudar] → toda leitura por `findById` recalcula pela entidade e todo `update` regrava; mudança futura no cálculo exigiria migração de dados — aceito.
- [Série salva sem efeito visível no extrato] → aceito até o prompt 19; o toaster confirma a gravação.
- [Teto de 480 parcelas semanais cobre só ~9 anos] → aceito: o teto existe para limitar a geração futura, não para modelar todos os casos.
- [Migração depende do banco local de pé] → subir o Docker Compose do backend antes do `migrate dev`; conferir que o SQL só cria objetos novos (as relações inversas não geram coluna).
- [Lint pré-existente e `--fix` do script do backend] → `npx eslint <arquivos>` sem `--fix`, nunca `npm run lint` no backend.
- [Next.js com convenções diferentes] → não há rota nova; ainda assim o sub-agente de frontend consulta `node_modules/next/dist/docs/` antes de alterar a página, como pede o `AGENTS.md`.

## Migration Plan

1. Aplicar a migração aditiva `add_transaction_series` (nenhuma coluna existente é alterada).
2. Publicar o backend com `/transaction-series` (o `/transactions` segue igual).
3. Publicar o frontend com o menu "Nova transação" e o formulário de série.

Rollback: reverter frontend e backend; no banco, remover a tabela `transaction_series` e os enums `SeriesKind`/`FrequencyUnit` por SQL manual (o Prisma não gera *down*). Nenhuma tabela de outro módulo perde dados.

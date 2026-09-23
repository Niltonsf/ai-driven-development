## Context

Ver `proposal.md` — Why. Requisitos em `specs/`. Restrições do estado atual que moldam a abordagem:

- `modules/transaction`, `apps/backend/src/modules/transaction` e `apps/frontend/src/modules/transaction` são scaffold: pacote `@poupig/transaction` já dependência do backend e do frontend, `TransactionModule` já registrado no `AppModule`, model Prisma vazio e uma rota placeholder `/transaction`.
- `@poupig/shared` já tem `Text`, `Id`, `DateOnly`, `Entity`/`EntityProps`, `Result`, `CrudRepository` e `PaginatedInputDTO`/`PaginatedResultDTO`/`PaginationMetaDTO`, mas nenhum VO monetário. `NonNegative` não serve (não estende `ValueObject`, aceita `NaN` e zero).
- `Id.tryCreate` **gera** um uuid quando recebe valor vazio e falha sempre com `INVALID_ID`; `DateOnly` falha sempre com `INVALID_DATE_ONLY`. Sem remapeamento, o formulário não sabe qual campo errou.
- O validador `v` do frontend (`shared/components/form/validator/validators.ts`) monta `processedValue` **apenas com os campos declarados no schema**: os refinamentos recebem esse objeto e o resolver devolve só esses campos no submit.
- No Prisma, o model do cartão se chama `Card` (tabela `card`) e a subcategoria só pertence ao usuário através de `Category.userId`. Todos os vizinhos têm exclusão lógica.
- O lint de frontend e backend já falha com erros pré-existentes (88 e 58), e o script `lint` do backend aplica `--fix` em todos os arquivos.
- A implementação roda em quatro sub-agentes sequenciais (negócio A, negócio B, backend, frontend); cada grupo de tarefas termina com uma verificação própria para que o agente seguinte parta de um estado verde.

## Goals / Non-Goals

**Goals:**

- Entregar um núcleo `movement` que `TransactionSeries` e `ScheduledTransaction` (prompts 18 e 19) consumam sem refatoração.
- Manter uma única fonte de regra por atributo: o VO define limites e códigos; a coluna do banco espelha os limites; o schema do formulário usa o próprio VO.
- Concentrar as conversões de fronteira (`Decimal`, `@db.Date`, `value` em string, `YYYY-MM-DD` na tela) em pontos únicos e explícitos.

**Non-Goals:**

- Não alinhar `account`, `credit-card` e `category` às divergências propositais (repositório, paginação, `null`, 404 por posse) — ficam como estão.
- Não criar contrato base `MovementProps`, hook genérico de paginação, `routes.ts` nem arquivo de constantes de tamanho.
- Não validar ordem de datas, unicidade ou regras entre `accountId` e `creditCardId`.

## Decisions

### 1. Núcleo `movement` como pasta irmã, com o critério "mais de um consumidor"

`modules/transaction/src/movement` fica ao lado de `src/transaction` (e, no futuro, `src/transaction-series` e `src/scheduled-transaction`). Entra no núcleo só o que tem pelo menos dois agregados consumidores: `MovementName`, `MovementNote`, `Direction`, `TransactionStatus`, `MovementErrors` e `MovementReferencesQuery`. `SeriesKind`, `FrequencyUnit`, `DayOfWeek` e `RecurrenceRule` nascem no agregado da série.

Alternativas: (a) um módulo `movement` separado — rejeitada, os três agregados são do mesmo contexto e o pacote já existe; (b) cada agregado com seus próprios VOs — rejeitada, triplicaria regra e códigos; (c) antecipar todas as enumerações no núcleo — rejeitada, cria peças sem consumidor.

### 2. `Money` global, em reais, arredondado uma vez na entrada

`Money extends ValueObject<number, ValueObjectConfig>`, no formato de `PositiveInteger`: checa `typeof === 'number'` e `Number.isFinite` antes de comparar, arredonda com `Math.round(value * 100) / 100`, valida `> 0` depois do arredondamento e falha com `INVALID_MONEY_AMOUNT` (chave já traduzida). Fica em `packages/shared` porque dinheiro não é assunto só de movimento.

Alternativas: (a) centavos inteiros, como o limite do cartão — rejeitada, a API, a coluna `Decimal(14,2)` e o formulário trabalham em reais e haveria conversão em cada borda; (b) reaproveitar `NonNegative` — rejeitada pelos defeitos citados em Context; (c) config `allowZero` — rejeitada, nenhum consumidor previsto aceita zero.

### 3. Enums TypeScript com type guards, não VO

`enum Direction { IN = 'IN', OUT = 'OUT' }` e `enum TransactionStatus { PENDING, SETTLED, CANCELED }` com valor igual à chave, como `AccountType`, casando com os enums gerados pelo Prisma. `isDirection`/`isTransactionStatus` usam `Object.values(...)` e permitem que as três entidades devolvam `MovementErrors.*` sem repetir a checagem.

Alternativas: VO por enum — rejeitada (conjunto fechado, sem normalização, e a mudança proíbe VO novo); união de strings — rejeitada, o backend importa o enum e o Prisma gera enum.

### 4. Códigos de erro: onde cada um mora e o remapeamento na entidade

- Códigos de VO ficam no VO (`MOVEMENT_NAME_*`, `MOVEMENT_NOTE_*`, `INVALID_MONEY_AMOUNT`).
- `MovementErrors` (arquivo próprio, porque o núcleo não tem entidade) guarda só os dois códigos de enum.
- `TransactionErrors` fica em `transaction.entity.ts`, como `CategoryErrors`. Os de aplicação ficam no arquivo de cada caso de uso (`SaveTransactionErrors`).
- A entidade troca `INVALID_ID` por `INVALID_TRANSACTION_{ACCOUNT,CREDIT_CARD,SUBCATEGORY}_ID` e `INVALID_DATE_ONLY` por `INVALID_TRANSACTION_{EXPECTED,SETTLED}_ON`, mapeando o `Result` de falha do VO para o código do atributo. `id` e `userId` mantêm `INVALID_ID` (nunca vêm do formulário).
- `accountId` ausente ou vazio é reprovado **antes** de chamar `Id.tryCreate`, porque o `Id` geraria um uuid e a conta passaria como válida.

### 5. Invariante `status`/`settledOn`: falhar só em `SETTLED`, normalizar nos demais

`SETTLED` sem `settledOn` falha com `TRANSACTION_SETTLED_ON_REQUIRED`; `PENDING`/`CANCELED` descartam `settledOn` (viram `null`). A normalização acontece depois da validação dos opcionais, na montagem das props finais, tanto em `tryCreate` quanto em `cloneWith`.

Alternativa: reprovar `PENDING` com `settledOn` — rejeitada, quem edita uma transação efetivada e volta para pendente estaria enviando a data antiga e seria punido por um estado que a própria regra consegue corrigir. Ordem entre `settledOn` e `expectedOn` não é validada (pagar adiantado é normal).

### 6. `CrudRepository` + `SaveTransaction` único decidido pela presença do `id`

`TransactionRepository extends CrudRepository<Transaction>`. `findById` devolve `Result.fail(TRANSACTION_NOT_FOUND)` para ausente ou excluído (o tipo não admite `null` em `strict`). `SaveTransaction` cria (`create`) sem `id` e, com `id`, carrega, confere posse e chama `update`; ambos devolvem `{ id }` — mesmo contrato dos `Save*` dos prompts 18 e 19.

A atualização é **substituição completa** dos campos editáveis: o caso de uso aplica em `cloneWith` todos os campos da entrada, com opcional ausente virando `null`. Assim limpar a observação ou o cartão no formulário efetivamente limpa, em vez de preservar o valor antigo por chave omitida. `id`, `userId` e `createdAt` vêm sempre da entidade carregada.

Alternativas: `save` com upsert, como os outros módulos — rejeitada, `PUT` com id inexistente criaria registro; casos de uso `Create`/`Update` separados — rejeitada pelo contrato comum com os prompts seguintes.

### 7. Posse: transação de outro usuário é tratada como inexistente

Caso de uso, query por id e controller respondem `TRANSACTION_NOT_FOUND` (404) quando o `userId` não bate. Alternativa: `UNAUTHORIZED` (403) como `account`/`credit-card` — rejeitada, confirma a existência de ids alheios.

### 8. `MovementReferencesQuery` no núcleo, conferida depois da entidade

O contrato vive em `movement/provider` e é implementado pelo adapter Prisma com `count` escopado (`account.count({ id, userId, deletedAt: null })`, `card.count(...)`, `subcategory.count({ id, deletedAt: null, category: { userId, deletedAt: null } })`). No `SaveTransaction`, a entidade é validada primeiro (não consulta banco com id malformado); em seguida as consultas necessárias rodam em paralelo (conta sempre; cartão e subcategoria só se informados) e todos os códigos `TRANSACTION_*_NOT_FOUND` falhos são acumulados numa única falha. Falha técnica de consulta é propagada.

Alternativas: importar repositórios de `account`/`credit-card`/`category` — rejeitada, acopla módulos de domínio; confiar na FK do banco — rejeitada, não verifica posse nem exclusão lógica e devolveria erro genérico do Prisma.

### 9. Leituras sem caso de uso, como queries inline no adapter

`TransactionPrisma` expõe `findTransactionById`, `listTransactions` e `movementReferences` como atributos `readonly` inline (padrão `CreditCardPrisma`), e o controller os chama direto. Um único mapper `toDTO` atende as duas leituras, com `select` das relações (`account.name`, `creditCard.name`, `subcategory.name`, `subcategory.category.name`) na mesma consulta.

A listagem usa `Promise.all([findMany, count])`, `orderBy: [{ expectedOn: 'desc' }, { createdAt: 'desc' }]`, `where` sempre com `userId` e `deletedAt: null`, `name: { contains, mode: 'insensitive' }` e `expectedOn: { gte?, lte? }`, e calcula `totalPages = Math.ceil(total / pageSize)`. Filtros de enum passam por `isDirection`/`isTransactionStatus` e, fora do conjunto, a query falha com o código de `MovementErrors` (400) em vez de deixar o Prisma lançar erro de validação; `expectedFrom`/`expectedTo` passam por `DateOnly` e, inválidos, falham com `INVALID_DATE_ONLY` (400). Os filtros são repassados crus pelo controller: quem reprova é o domínio.

### 10. Conversões de fronteira no adapter e no controller

- `Decimal` → `number` com `.toNumber()` no mapper (entidade e DTO); gravação escreve o número direto.
- `@db.Date`: gravação com `new Date(\`${ymd}T00:00:00.000Z\`)`; leitura com `DateOnly` / `toISOString().slice(0, 10)`. Nunca `getDate()`/`toLocaleDateString()` no servidor.
- Controller: `value` string é convertido com `Number(...)` (string vazia vira `undefined`); o `NaN` resultante é reprovado pelo `Money` com `INVALID_MONEY_AMOUNT`. `id` do corpo é descartado no `POST`; no `PUT` vem da rota. `userId` sempre de `@CurrentUser()`.
- Um helper local ao controller converte `string[]` em exceção: contém `TRANSACTION_NOT_FOUND` → `NotFoundException`; senão `BadRequestException` com a lista. `page` mínimo 1 e `pageSize` padrão 10 com teto 50, como o `AccountController`.

### 11. Prisma: model aditivo e relações inversas mínimas

`Transaction` com `@@map("transaction")`, colunas com `@map` em snake_case, `value Decimal @db.Decimal(14, 2)`, `expectedOn`/`settledOn DateTime @db.Date`, `name @db.VarChar(100)`, `note @db.VarChar(500)`; `user` e `account` com `onDelete: Cascade`, `creditCard Card?` e `subcategory Subcategory?` com `onDelete: SetNull`; `@@index([userId, expectedOn])`, `@@index([accountId])`, `@@index([creditCardId])`, `@@index([subcategoryId])`. Os campos `transactions Transaction[]` em `User`, `Account`, `Card` e `Subcategory` não geram coluna: a migração `add_transaction` só cria enums, tabela, FKs e índices.

### 12. Schema do formulário: `direction` e `status` como `Text` de transporte + refinamento nativo

**Decidido com o usuário na abertura da mudança.** Como o `v` só entrega aos refinamentos e ao submit os campos declarados (ver Context), `direction` e `status` entram no schema como `Text`, apenas para serem transportados; os controles (`RadioGroup` e `Combobox`) só produzem valores do enum e a validação real do conjunto continua no domínio/backend. O schema fica:

`name: MovementName`, `note: { vo: MovementNote, optional: true }`, `value: Money`, `direction: Text`, `expectedOn: DateOnly`, `accountId: Text`, `creditCardId: { vo: Id, optional: true }`, `subcategoryId: { vo: Id, optional: true }`, `status: Text`, `settledOn: { vo: DateOnly, optional: true }`, com `.refine(d => d.status !== TransactionStatus.SETTLED || !!d.settledOn, { field: 'settledOn', message: <mensagem de TRANSACTION_SETTLED_ON_REQUIRED> })`.

O tipo do formulário estreita os dois campos: `TransactionFormData = Omit<v.infer<typeof transactionSchema>, 'direction' | 'status'> & { direction: Direction; status: TransactionStatus }`. `accountId` usa `Text` e não `Id`, como pede o prompt, para não haver caminho em que um vazio vire uuid.

Alternativas: (a) manter os dois fora do schema, como no prompt original — rejeitada, o refinamento nunca dispararia e o resolver os descartaria; (b) resolver composto lendo `form.getValues()` — rejeitada, cria um segundo ponto de validação; (c) alterar o validador compartilhado — rejeitada, fora das exceções de escopo.

O `settledOn` é desabilitado e limpo **no handler de mudança do status** (não em `useEffect`), e o payload converte opcionais vazios em `null` explícito, casando com a substituição completa da decisão 6.

### 13. Hooks sem `any` e sem `setState` síncrono em efeito

`useTransactions(page, pageSize, filters)` calcula uma chave (`page`, `pageSize`, filtros, contador de recarga e token); o efeito dispara a requisição e só grava `{ key, data, error }` no retorno da promessa, ignorando a resposta se o efeito já foi limpo (requisição obsoleta). `isLoading` é derivado (`state.key !== keyAtual`). `refresh()` incrementa o contador de recarga dentro dos handlers de salvar/excluir. `catch (err: unknown)` + `getErrorMessage`. `useTransactionOptions` segue o mesmo formato com `Promise.all` de `listAccounts(token, 1, 50)`, `listCreditCards(token, { page: 1, pageSize: 50 })` e `listCategories(token)`, filtrando ativos e montando `Categoria › Subcategoria`.

Alternativa: copiar `use-credit-cards.ts` — rejeitada, reproduziria os erros `no-explicit-any` e `react-hooks/set-state-in-effect` já existentes.

### 14. Tela: modos na mesma página, filtros resetando página no handler

`TransactionsPage` guarda `mode`, transação em edição, `page` e `filters`; o handler de filtro atualiza filtros e `page = 1` na mesma chamada. `TransactionListComponent` usa `TableCard` + `Table`, formata data dividindo a string `YYYY-MM-DD` e valor com `formatCurrency` (com sinal/cor por direção). `transaction.labels.ts` concentra `DIRECTION_LABELS` e `TRANSACTION_STATUS_LABELS` porque lista, filtros e formulário usam os dois. A data de hoje do formulário vem de `getFullYear/getMonth/getDate` locais (não `toISOString`, que vira o dia à noite em UTC-3).

### 15. `MoneyInput` em reais com máscara por dígitos

O componente é controlado por `value?: number`; exibe `formatCurrency(value)` e, ao digitar, extrai só dígitos e interpreta como centavos (`123456` → `1234.56`), emitindo reais; campo vazio emite `undefined`. `formatCurrency` reutiliza uma instância de `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })` no módulo. Alternativa: texto livre com vírgula — rejeitada, cursor e separadores ambíguos. Centavos são só a técnica de digitação: o contrato do componente é em reais.

## Risks / Trade-offs

- [`Decimal` vazando como string/objeto no JSON] → conversão única no mapper e cenário do `.http` conferindo `value` numérico.
- [Data voltando um dia por fuso] → conversão UTC nos dois sentidos no adapter, `split('-')` na tela e cenário do `.http` conferindo `YYYY-MM-DD`.
- [`PUT` com opcional omitido preservando valor antigo] → substituição completa no `SaveTransaction` (decisão 6) e `null` explícito no payload do formulário.
- [`Text` como transporte aceita qualquer string no formulário] → os controles só produzem valores do enum e o backend reprova o resto com `INVALID_DIRECTION`/`INVALID_TRANSACTION_STATUS`.
- [Ponto flutuante no arredondamento (`Math.round(1.005 * 100)` dá `100`)] → aceito: é o comportamento especificado; testes usam `10.126`/`10.124` e a coluna `Decimal(14,2)` guarda o valor já arredondado.
- [Opções limitadas a 50 contas/cartões e só ativos] → aceito (autocomplete fora de escopo). Uma transação cujo vínculo foi inativado ou excluído continua exibindo o nome na lista; ao editá-la, o vínculo não aparece nas opções e precisa ser trocado — se estiver excluído, o salvamento falha com `TRANSACTION_*_NOT_FOUND`.
- [Migração depende do banco local de pé] → subir o Docker Compose do backend antes do `migrate dev`; conferir que o SQL gerado só cria objetos novos.
- [Lint pré-existente e `--fix` do script do backend] → rodar `npx eslint <arquivos criados/alterados>` sem `--fix`, nunca `npm run lint` no backend.
- [Remoção de `/transaction` quebra links salvos] → aceito: a rota era placeholder sem função.
- [Next.js do projeto com convenções diferentes das conhecidas] → o sub-agente de frontend consulta `node_modules/next/dist/docs/` antes de criar a rota, como pede o `AGENTS.md` do frontend.

## Migration Plan

1. Aplicar a migração aditiva `add_transaction` (nenhuma coluna existente é alterada).
2. Publicar o backend com `/transactions`.
3. Publicar o frontend com a nova rota e o menu atualizado.

Rollback: reverter frontend e backend; no banco, remover a tabela `transaction` e os enums `Direction`/`TransactionStatus` por SQL manual (o Prisma não gera *down*). Nenhuma tabela de outro módulo perde dados.

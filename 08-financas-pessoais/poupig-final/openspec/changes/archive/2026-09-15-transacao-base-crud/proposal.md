## Why

Contas, cartões e categorias já estão cadastráveis, mas o usuário ainda não consegue registrar o que de fato move o dinheiro: o módulo `transaction` é só scaffold (`getModuleName()`, controller de exemplo, model Prisma vazio e um dashboard placeholder em `/transaction`). A `Transaction` é a primeira das três entidades agrupadas pela linguagem ubíqua como `<Movement>` (`Transaction`, `TransactionSeries`, `ScheduledTransaction`), então esta mudança precisa entregar, junto com o primeiro CRUD visível, o núcleo comum que as duas próximas (prompts 18 e 19) vão reaproveitar — sem repetir os termos de uma modelagem anterior (`FinancialDirection`, `INFLOW`/`OUTFLOW`, `COMPLETED`, `TransactionName`...).

## What Changes

- Novo VO **global** `Money` em `packages/shared`: valor em reais, número finito, arredondado uma única vez para duas casas e estritamente positivo (`INVALID_MONEY_AMOUNT`). O sinal do movimento passa a ser do `direction`, nunca do valor
- Novo **núcleo `movement`** em `modules/transaction/src/movement`, contendo só o que mais de um agregado usa: VOs `MovementName` (2–100) e `MovementNote` (1–500), enums `Direction` (`IN`/`OUT`) e `TransactionStatus` (`PENDING`/`SETTLED`/`CANCELED`) com type guards `isDirection`/`isTransactionStatus`, `MovementErrors` e o contrato de consulta `MovementReferencesQuery` (posse de conta, cartão e subcategoria pelo usuário)
- Novo agregado `Transaction` em `modules/transaction/src/transaction`: entidade com as invariantes `status`/`settledOn` (`SETTLED` exige `settledOn`; `PENDING`/`CANCELED` normalizam para `null`), status padrão `PENDING`, códigos próprios por vínculo e por data, exclusão lógica; `TransactionRepository extends CrudRepository`; `TransactionDTO` com nomes dos vínculos resolvidos; queries `FindTransactionByIdQuery` e `ListTransactionsQuery` (paginação do `@poupig/shared`); casos de uso `SaveTransaction` (cria sem `id`, atualiza com `id`) e `DeleteTransaction`
- Backend: enums e model `Transaction` no Prisma (`Decimal(14,2)`, datas `@db.Date`, relações e índices), migração `add_transaction`, `TransactionPrisma` implementando repositório e queries, e `TransactionController` em `/transactions` com `POST`, `PUT /:id`, `GET` paginado e filtrado, `GET /:id` e `DELETE /:id`, mais testes de integração em `.http`
- Frontend: tela `/transactions` com lista paginada (`TableCard` + `Table`), filtros (nome, direção, status, conta, período), formulário único de criação/edição em três seções (Lançamento, Vínculos, Situação), exclusão com confirmação e toasters; novo componente compartilhado `MoneyInput` com `formatCurrency`
- **BREAKING** (rota do frontend): `/transaction` deixa de existir e é substituída por `/transactions`; o item "Transações" do menu passa a apontar para a nova rota, e o dashboard placeholder do módulo é removido
- i18n: acréscimo dos novos códigos de erro de movimento e transação em pt e en e remoção das chaves legadas (`INVALID_FINANCIAL_DIRECTION`, `INVALID_FINANCIAL_RECORD_STATUS`, `TRANSACTION_NOTE_TOO_*`, `TRANSACTION_DESCRIPTION_TOO_*`)
- Divergências propositais dos cadastros existentes: repositório via `CrudRepository`, paginação `{ data, meta }` do `@poupig/shared`, opcionais do DTO como `null` e transação de outro usuário respondendo `TRANSACTION_NOT_FOUND` (404) para não vazar existência

## Capabilities

### New Capabilities

- `shared-money`: VO global `Money` do `@poupig/shared` — validação de número finito, arredondamento único para duas casas, positividade estrita e código `INVALID_MONEY_AMOUNT`
- `movement-core`: núcleo compartilhado dos movimentos no módulo `transaction` — `MovementName`, `MovementNote`, `Direction`, `TransactionStatus` com type guards, `MovementErrors` e o contrato `MovementReferencesQuery`
- `transaction-domain`: agregado `Transaction` — atributos, invariantes de `status`/`settledOn`, remapeamento de códigos de vínculo e data, exclusão lógica, contrato do repositório, `TransactionDTO` e queries de leitura
- `transaction-use-cases`: casos de uso `SaveTransaction` (criação x atualização, posse, conferência de vínculos) e `DeleteTransaction` (exclusão lógica escopada pelo usuário)
- `transaction-backend`: model e migração Prisma, `TransactionPrisma` (repositório, queries e `movementReferences`), `TransactionController` em `/transactions`, mapeamento de falhas HTTP e testes de integração
- `transaction-frontend`: tela `/transactions` (lista paginada com filtros, formulário de criação/edição, exclusão), camada de dados (client, schema, rótulos, hooks), `MoneyInput`/`formatCurrency` compartilhados e ajustes do dicionário de erros

### Modified Capabilities

- `sidebar-navigation`: o menu da área privada passa a exigir o item "Transações" no grupo principal apontando para `/transactions` (antes `/transaction`, sem requisito formal)

## Impact

- **Pacote compartilhado** (`packages/shared`): novo `src/vo/money.vo.ts`, reexportado em `src/vo/index.ts`, e teste em `test/vo/money.vo.test.ts`. Nenhum VO existente é alterado (`NonNegative` permanece como está)
- **Domínio** (`modules/transaction`): novas pastas `src/movement` e `src/transaction`, barril `src/index.ts` estendido (mantendo `getModuleName()`), testes em `test/movement`, `test/transaction` e mocks em `test/mock`
- **Backend** (`apps/backend`): `prisma/models/transaction.model.prisma`, nova migração `add_transaction`, campos de relação inversa `transactions Transaction[]` em `User`, `Account`, `Card` e `Subcategory` (única alteração em models de outros módulos); `src/modules/transaction` (controller, adapter Prisma, `.http`)
- **API REST**: novos endpoints `POST|GET /transactions` e `GET|PUT|DELETE /transactions/:id`, todos protegidos pelo `JwtGuard` global; o `GET /transaction` de exemplo é removido
- **Frontend** (`apps/frontend`): `modules/transaction/{data,pages,components}`, nova rota `app/(private)/transactions/page.tsx`, remoção de `app/(private)/transaction` e do dashboard placeholder, `shared/components/ui/money-input.tsx`, `shared/i18n/messages.{pt,en}.ts` e o `href` do item de menu em `app/(private)/layout.tsx`
- **Sem alteração** nos módulos de domínio, backend ou frontend de `account`, `category`, `credit-card` e `auth` (o frontend apenas consome `listAccounts`, `listCreditCards` e `listCategories` já existentes)
- **Qualidade**: `npm run build` e `npm test` verdes; `npx eslint` sem `--fix` limpo nos arquivos criados ou alterados (os 88 erros pré-existentes do frontend e 58 do backend ficam fora desta mudança)
- **Fora de escopo**: `TransactionSeries`, `ScheduledTransaction` e recorrência; `MovementProps` compartilhado; transferências, conciliação, importação e anexos; saldo, limite, fatura e totais; efetivar/cancelar como ação dedicada; restauração de excluídas; autocomplete de vínculos; aritmética monetária e multi-moeda; migrar o cartão para `Money`/`MoneyInput`

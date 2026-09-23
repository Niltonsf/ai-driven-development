## 1. Negócio (parte A) — VO global `Money`

- [x] 1.1 Ler `references/vo-pattern.md` da skill `module-value-object` e os VOs de referência `PositiveInteger` e `DayOfMonth` em `packages/shared/src/vo`
- [x] 1.2 Criar `packages/shared/src/vo/money.vo.ts`: `ValueObject<number, ValueObjectConfig>`, construtor privado, código estático `INVALID_MONEY_AMOUNT`, checagem de `typeof`/`Number.isFinite` antes de comparar, arredondamento único para duas casas e `> 0` depois do arredondamento, sem exceção escapando do `tryCreate`
- [x] 1.3 Reexportar o `Money` em `packages/shared/src/vo/index.ts` mantendo a ordem alfabética
- [x] 1.4 Criar `packages/shared/test/vo/money.vo.test.ts` cobrindo: válido, `10.126` → `10.13`, `10.124` → `10.12`, negativo, zero, `0.004`, `NaN`/`Infinity`/string/`undefined`, `tryCreate` com `INVALID_MONEY_AMOUNT` e `create` lançando

## 2. Negócio (parte A) — núcleo `movement`

- [x] 2.1 Criar `modules/transaction/src/movement/model/` e `modules/transaction/src/movement/movement.errors.ts` com `MovementErrors` (`INVALID_DIRECTION`, `INVALID_TRANSACTION_STATUS`) `as const`
- [x] 2.2 Criar `model/movement-name.vo.ts` estendendo `Text` como `CategoryName` (`MOVEMENT_NAME_TOO_SHORT`/`TOO_LONG`, mínimo 2, máximo 100, `tryCreate`/`create` estreitando o tipo)
- [x] 2.3 Criar `model/movement-note.vo.ts` estendendo `Text` (`MOVEMENT_NOTE_TOO_SHORT`/`TOO_LONG`, mínimo padrão 1, máximo 500)
- [x] 2.4 Criar `model/direction.enum.ts` com `Direction` (`IN`, `OUT`) e o type guard `isDirection`
- [x] 2.5 Criar `model/transaction-status.enum.ts` com `TransactionStatus` (`PENDING`, `SETTLED`, `CANCELED`) e o type guard `isTransactionStatus`
- [x] 2.6 Criar os barris `movement/model/index.ts` e `movement/index.ts` e acrescentar `export * from './movement';` em `modules/transaction/src/index.ts`, mantendo o `getModuleName()` e sem tocar em `test/index.test.ts`
- [x] 2.7 Criar `modules/transaction/test/movement/movement-name.vo.test.ts` (válido, `trim`, curto, longo, vazio, `undefined`, `create` lançando)
- [x] 2.8 Criar `modules/transaction/test/movement/movement-note.vo.test.ts` (válida, `trim`, acima do limite, string vazia com `MOVEMENT_NOTE_TOO_SHORT`, `create` lançando)
- [x] 2.9 Criar `modules/transaction/test/movement/movement-enums.test.ts` (todos os valores aprovados; minúsculas, `INFLOW`, `OUTFLOW`, `COMPLETED`, `undefined`, `null` e número reprovados)
- [x] 2.10 Conferir a parte A: `npx turbo run test --filter=@poupig/shared --filter=@poupig/transaction` verde e `Money` importável de `@poupig/shared` e as peças do núcleo importáveis de `@poupig/transaction`

## 3. Negócio (parte B) — agregado `Transaction`

- [x] 3.1 Rodar `node .claude/skills/module-aggregate/scripts/create-aggregate.js --module transaction --aggregate transaction --mode example`, remover o caso de uso de exemplo e garantir que `export * from './movement'` continua em `src/index.ts`
- [x] 3.2 Criar `modules/transaction/src/movement/provider/movement-references.query.ts` com `MovementReferencesQuery` (`accountBelongsToUser`, `creditCardBelongsToUser`, `subcategoryBelongsToUser`, todos `Promise<Result<boolean>>`) e exportá-lo pelo barril do `movement`
- [x] 3.3 Criar `transaction.entity.ts` com `TransactionErrors` e as props da entidade usando `Id`, `MovementName`, `MovementNote`, `Money`, `DateOnly`, `isDirection` e `isTransactionStatus` (skill: `module-entity`)
- [x] 3.4 Implementar no `tryCreate`: reprovação de `accountId` ausente/vazio antes do `Id`, remapeamento de `INVALID_ID`/`INVALID_DATE_ONLY` para os códigos do atributo, opcionais vazios como `null`, status padrão `PENDING`, `TRANSACTION_SETTLED_ON_REQUIRED` em `SETTLED` sem data, normalização de `settledOn` em `PENDING`/`CANCELED` e `softDelete()`
- [x] 3.5 Criar `TransactionRepository extends CrudRepository<Transaction>` documentando `findById` com `TRANSACTION_NOT_FOUND` para ausente ou excluído e `delete` lógico (skill: `module-repository`)
- [x] 3.6 Criar `TransactionDTO` com os nomes de vínculo, `value` numérico, datas `YYYY-MM-DD`, opcionais `null` e sem `deletedAt` (skill: `module-dto`)
- [x] 3.7 Criar em `src/transaction/provider` `FindTransactionByIdQuery` e `ListTransactionsQuery` com `ListTransactionsInput extends PaginatedInputDTO` (skill: `module-query-cqrs`)
- [x] 3.8 Criar `save-transaction.use-case.ts` com `SaveTransactionErrors`: criação sem `id`, atualização com `id` (propaga falha do `findById`, posse com `TRANSACTION_NOT_FOUND`, substituição completa dos campos editáveis com opcionais ausentes como `null`), conferência dos vínculos depois da entidade acumulando os códigos, retorno `{ id }` (skill: `module-use-case`)
- [x] 3.9 Criar `delete-transaction.use-case.ts`: `findById`, posse com `TRANSACTION_NOT_FOUND`, `softDelete()` e `update`
- [x] 3.10 Atualizar os barris do agregado para exportar entidade, erros, repositório, DTO, queries e casos de uso
- [x] 3.11 Criar `modules/transaction/test/mock/in-memory-transaction.repository.ts` e `in-memory-movement-references.query.ts`
- [x] 3.12 Criar os testes da entidade em `modules/transaction/test/transaction/` cobrindo obrigatórios, opcionais vazios, valor zero/negativo/arredondado, direção e status inválidos (inclusive `INFLOW` e `COMPLETED`), status padrão, invariantes de `settledOn`, `settledOn` anterior ao `expectedOn`, datas e ids de vínculo com código próprio
- [x] 3.13 Criar os testes dos casos de uso cobrindo criação x atualização, id inexistente, outro usuário, excluída como inexistente, limpeza de opcional na atualização e cada vínculo inválido
- [x] 3.14 Conferir a parte B: `npx turbo run test --filter=@poupig/transaction` e build do pacote verdes

## 4. Backend — Prisma

- [x] 4.1 Mapear enums `Direction`/`TransactionStatus` e o model `Transaction` em `apps/backend/prisma/models/transaction.model.prisma` com colunas snake_case, tipos, relações (`Cascade`/`SetNull`) e índices (skill: `backend-prisma-data`)
- [x] 4.2 Acrescentar `transactions Transaction[]` em `User`, `Account`, `Card` e `Subcategory`, sem nenhuma outra alteração nesses models
- [x] 4.3 Subir o banco local, gerar a migração `add_transaction` e o client; conferir que o SQL só cria enums, tabela, FKs e índices

## 5. Backend — adapter `TransactionPrisma`

- [x] 5.1 Implementar `TransactionRepository` em `transaction.prisma.ts`: `create`/`update` gravando todos os campos (inclusive `deletedAt`), `findById` filtrando excluídos e `delete` lógico, com conversão `Decimal` → `number` e datas UTC ↔ `YYYY-MM-DD`
- [x] 5.2 Criar o mapper único para `TransactionDTO` com `select` das relações (conta, cartão, subcategoria e categoria)
- [x] 5.3 Implementar `readonly findTransactionById` escopado por usuário e ignorando excluídas
- [x] 5.4 Implementar `readonly listTransactions` com `Promise.all` de `findMany`/`count`, ordenação `expectedOn`/`createdAt` desc, busca `contains` insensitive, filtros de enum validados pelos type guards, período validado por `DateOnly` e `meta` com `totalPages`
- [x] 5.5 Implementar `readonly movementReferences` com `count` escopado em `account`, `card` e `subcategory` (posse via categoria)

## 6. Backend — controller e integração

- [x] 6.1 Trocar para `@Controller('transactions')`, remover o `getExample`, injetar `TransactionPrisma` e declarar o `type AuthUser` local (skill: `backend-controller`)
- [x] 6.2 Implementar `POST` (201, sem `id` do corpo) e `PUT /:id` montando `SaveTransaction` com `this.transactionPrisma` e `this.transactionPrisma.movementReferences`, convertendo `value` string para número
- [x] 6.3 Implementar `GET` paginado com normalização de `page`/`pageSize` e filtros crus, e `GET /:id` com `null` → `NotFoundException('TRANSACTION_NOT_FOUND')`
- [x] 6.4 Implementar `DELETE /:id` montando `DeleteTransaction`
- [x] 6.5 Criar o helper de mapeamento de falhas (`TRANSACTION_NOT_FOUND` → 404; demais → 400 com a lista de códigos)
- [x] 6.6 Criar `apps/backend/src/modules/transaction/transaction.integration.http` com todos os cenários do spec `transaction-backend`
- [x] 6.7 Conferir o backend: build verde e `npx eslint` **sem `--fix`** nos arquivos criados/alterados sem erros (não rodar `npm run lint`)

## 7. Frontend — compartilhado e i18n

- [x] 7.1 Criar `apps/frontend/src/shared/components/ui/money-input.tsx` com `MoneyInput` (reais, máscara por dígitos, vazio → `undefined`, estilo do `input`) e `formatCurrency`
- [x] 7.2 Acrescentar os 15 novos códigos em `shared/i18n/messages.pt.ts` e `messages.en.ts`
- [x] 7.3 Confirmar por busca que as chaves legadas só aparecem nos dicionários e removê-las dos dois arquivos

## 8. Frontend — camada de dados

- [x] 8.1 Criar `data/transaction-api.client.ts` com `TransactionDTO`, `SaveTransactionInput`, `ListTransactionsParams`, `TransactionApiError` e `listTransactions`/`createTransaction`/`updateTransaction`/`deleteTransaction`, tipando com `PaginatedResultDTO` e os enums de `@poupig/transaction`
- [x] 8.2 Criar `data/transaction.schema.ts` com os VOs do domínio, `direction`/`status` como `Text` de transporte, `accountId: Text`, refinamento de `settledOn` em `SETTLED` e `TransactionFormData` estreitando os enums (skill: `frontend-form-schema`)
- [x] 8.3 Criar `data/transaction.labels.ts` com `DIRECTION_LABELS` e `TRANSACTION_STATUS_LABELS`
- [x] 8.4 Criar `data/use-transactions.ts` com `useTransactions` (chave de requisição, descarte de resposta obsoleta, carregamento derivado, contador de recarga), `useSaveTransaction` e `useDeleteTransaction`, sem `any` e sem `setState` síncrono em efeito
- [x] 8.5 Implementar `useTransactionOptions` com os clientes existentes de contas, cartões e categorias, só ativos e subcategorias como `Categoria › Subcategoria`
- [x] 8.6 Substituir o conteúdo de `data/index.ts` pelos exports reais

## 9. Frontend — tela, rota e menu

- [x] 9.1 Criar `components/transaction-list.component.tsx` com `TableCard` + `Table`, `EmptyListState`, data `dd/MM/yyyy` a partir da string, valor com `formatCurrency` e sinal/cor por direção, status em `Badge` e ações
- [x] 9.2 Criar `components/transaction-form.component.tsx` com as seções Lançamento, Vínculos e Situação, `MoneyInput`, `DatePickerInput`, `RadioGroup`, `Combobox` e `Textarea`, padrões de criação (`OUT`, `PENDING`, hoje local) e preenchimento na edição
- [x] 9.3 Desabilitar e limpar `settledOn` no handler de mudança do status e montar o payload com opcionais vazios como `null`
- [x] 9.4 Criar `pages/transactions.page.tsx` com modos `list`/`form`, "Nova transação", barra de filtros (voltando à página 1 no handler), `PaginationControls`, `DeleteConfirmationDialog` e toasters
- [x] 9.5 Consultar `node_modules/next/dist/docs/` sobre páginas do App Router, criar `app/(private)/transactions/page.tsx` delegando para `TransactionsPage` e remover `app/(private)/transaction`, `pages/dashboard.page.tsx` e `components/transaction-dashboard.component.tsx` após confirmar por busca que não há outras referências
- [x] 9.6 Atualizar o `href` do item "Transações" em `NAVIGATION_SECTIONS` para `/transactions`, mantendo `id`, rótulo, grupo e ícone
- [x] 9.7 Exportar página, componentes e `data` em `apps/frontend/src/modules/transaction/index.ts`

## 10. Verificação final

- [x] 10.1 `npm run build` na raiz verde
- [x] 10.2 `npm test` na raiz sem falhas
- [x] 10.3 `npx eslint` **sem `--fix`** nos arquivos de frontend criados ou alterados, sem erros
- [x] 10.4 `npx eslint` **sem `--fix`** nos arquivos de backend criados ou alterados, sem erros
- [x] 10.5 Buscar em `modules/transaction`, `apps/backend/src/modules/transaction` e `apps/frontend/src/modules/transaction` os termos proibidos (`FinancialDirection`, `INFLOW`, `OUTFLOW`, `FinancialRecordStatus`, `COMPLETED`, `TransactionName`, `TransactionNote`) e confirmar que só aparecem em testes de reprovação

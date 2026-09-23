# Lista de Tarefas

Cadastro (CRUD) de `Transaction` no módulo `transaction`, a primeira das três entidades agrupadas pela linguagem ubíqua como `<Movement>`. A mudança começa pelo **núcleo compartilhado `movement`** — os objetos de valor e as enumerações comuns a `Transaction`, `TransactionSeries` e `ScheduledTransaction`, mais o VO global `Money` — e termina com a tela `/transactions` funcionando: listar, filtrar, criar, editar e excluir transações. É o checkpoint visível do núcleo e do primeiro agregado.

## Linguagem Ubíqua

> Fonte: `.docs/desenhos/modulo-transaction.excalidraw`. Os nomes abaixo vão para o código exatamente como estão.

- Entidades agrupadas por `<Movement>`:
  - `Transaction`
  - `TransactionSeries`
  - `ScheduledTransaction`
- Enums/Consts:
  - `Direction = IN | OUT`
  - `TransactionStatus = PENDING | SETTLED | CANCELED`
  - `SeriesKind = OPEN | CLOSED`
  - `FrequencyUnit = WEEK | MONTH | YEAR`
  - `DayOfWeek = MONDAY(1) … SUNDAY(7)`
  - `RecurrenceRule` (união discriminada por `unit`)
- **Esta mudança entrega, do núcleo, só o que é usado por mais de um agregado**: `Direction` e `TransactionStatus`. `SeriesKind`, `FrequencyUnit`, `DayOfWeek` e `RecurrenceRule` têm só a `TransactionSeries` como consumidora e nascem no agregado dela (prompt `18-serie-transacoes-base-crud.md`)
- Termos de uma modelagem anterior que **não** podem aparecer no código: `FinancialDirection`, `INFLOW`/`OUTFLOW`, `FinancialRecordStatus`, `COMPLETED`, `TransactionName`, `TransactionNote` e a pasta `src/shared`

## Funcionalidade

- Nome: núcleo `movement` + cadastro de transação
- Módulo: `modules/transaction` e `packages/shared` (o `Money`); fora deles, só as exceções listadas nas seções Backend e Frontend
- Entregas, nesta ordem:
  1. **Núcleo `movement`** (`modules/transaction/src/movement`): `MovementName`, `MovementNote`, `Direction`, `TransactionStatus` (com type guards), `MovementErrors` e, na Parte B, a `MovementReferencesQuery`
  2. **VO global `Money`** (`packages/shared`): valor em reais, positivo, com duas casas
  3. **Agregado `Transaction`** (`modules/transaction/src/transaction`): entidade, repositório, consultas e casos de uso de escrita
  4. **Backend**: model do Prisma, migração, adapter, controller e testes de integração
  5. **Tela `/transactions`**: lista paginada com filtros, formulário de criação e edição, exclusão e `MoneyInput`
- Atributos dos agregados que motivam o núcleo (a `TransactionSeries` e a `ScheduledTransaction` chegam nos prompts 18 e 19):
  - `id`, `userId`, `accountId`, `creditCardId`, `subcategoryId` — usam o `Id` do `@poupig/shared`, nada novo a criar
  - `name` — `MovementName` (VO novo, deste módulo) — usado pelos três agregados
  - `note` — `MovementNote` (VO novo, deste módulo, opcional na entidade) — usado pelos três agregados
  - `value` — `Money` (VO novo, **global**, número positivo em reais) — usado pelos três agregados
  - `direction` — enum `Direction` (`IN`, `OUT`) — usado pelos três agregados
  - `status` — enum `TransactionStatus` (`PENDING`, `SETTLED`, `CANCELED`) — usado por `Transaction` e `ScheduledTransaction` (a `TransactionSeries` não tem status)
  - datas (`expectedOn`, `settledOn`, `startDate`...) — usam o `DateOnly` do `@poupig/shared`, nada novo a criar
- O sinal do movimento é do `direction`, não do `value`: por isso o `Money` é positivo e não existe valor negativo no domínio

## Entidade

- Nome: `Transaction` — plural na URL: `transactions`
- Módulo: `modules/transaction` (não alterar os módulos `account`, `category`, `credit-card` nem `auth`; as únicas exceções estão listadas nas seções Backend e Frontend)
- Novo agregado, pasta irmã do núcleo `movement` criado nesta mesma mudança: `modules/transaction/src/transaction`
- Atributos:
  - `id` (identificador da transação, gerado quando ausente — `Id` do `@poupig/shared`)
  - `userId` (dono da transação — sempre do usuário autenticado, nunca vem do cliente)
  - `name` (obrigatório — `MovementName`, do núcleo `movement`)
  - `note` (opcional, `null` quando ausente — `MovementNote`, do núcleo `movement`)
  - `value` (obrigatório — `Money` do `@poupig/shared`, em reais, positivo; zero é inválido)
  - `direction` (obrigatório — enum `Direction`: `IN` ou `OUT`)
  - `accountId` (obrigatório — conta que paga ou recebe a transação)
  - `creditCardId` (opcional, `null` quando ausente — cartão usado na compra)
  - `subcategoryId` (opcional, `null` quando ausente — classificação da transação)
  - `status` (obrigatório — enum `TransactionStatus`: `PENDING`, `SETTLED` ou `CANCELED`; padrão `PENDING` quando não informado)
  - `expectedOn` (obrigatório — `DateOnly`, data prevista da transação)
  - `settledOn` (opcional, `null` quando ausente — `DateOnly`, data em que a transação foi efetivada)
  - `createdAt`, `updatedAt`, `deletedAt` vêm do `EntityProps` do `@poupig/shared` e não são declarados de novo na entidade
- **Todos os identificadores usam o `Id` do `@poupig/shared`**: não existe VO de id por entidade no projeto e não é para inventar um agora
- `accountId` e `creditCardId` **não** são mutuamente exclusivos: uma compra no cartão continua apontando para a conta que vai pagar a fatura. Não criar regra de exclusão entre os dois
- Invariantes entre `status` e `settledOn` (é a regra própria deste agregado):
  - `status: SETTLED` exige `settledOn` — falhar com `TRANSACTION_SETTLED_ON_REQUIRED` quando não vier
  - `status: PENDING` ou `CANCELED` normaliza `settledOn` para `null` (uma transação não efetivada não tem data de efetivação), sem falhar
  - **Não** validar ordem entre `settledOn` e `expectedOn`: pagar adiantado é normal, e as duas datas podem coincidir
- Exclusão **lógica**, como nos demais cadastros: `softDelete()` na entidade preenche `deletedAt`, a coluna é persistida, toda consulta filtra `deletedAt: null` e o `deletedAt` **não** sai no DTO. Transação excluída se comporta como inexistente (`TRANSACTION_NOT_FOUND`)
- Chave única: **nenhuma**. Duas transações do mesmo usuário podem ter o mesmo nome, valor e data — não criar checagem de unicidade, `@@unique` de negócio nem código `TRANSACTION_ALREADY_EXISTS`
- Listagem: ordenar por `expectedOn` desc, com `createdAt` desc como desempate (duas transações do mesmo dia têm ordem estável). Filtros: busca por nome, `direction`, `status`, `accountId` e período (`expectedFrom`/`expectedTo` sobre o `expectedOn`); filtro ausente significa "sem filtro"
- Grupos do formulário: `Lançamento` (nome, valor, direção, data prevista), `Vínculos` (conta, cartão, subcategoria), `Situação` (status, data de efetivação, observação)

## Contexto Atual (verificado no código)

> Estado real do repositório na abertura desta mudança — usar como ponto de partida, não repetir o que já existe.

- `modules/transaction` está vazio: só `src/index.ts` com o `getModuleName()` de scaffold e `test/index.test.ts` conferindo esse retorno. O `jest.config.ts` coleta `**/test/**/*.test.ts`, então subpastas de `test/` entram sem configuração extra. O pacote é `@poupig/transaction` e já está declarado como dependência do backend e do frontend
- `apps/backend/src/modules/transaction/` tem `transaction.controller.ts` com um `@Get()` de exemplo (`@Controller('transaction')`, método `getExample`), `transaction.prisma.ts` (só com o `PrismaService` injetado e o getter `client`) e `transaction.module.ts` já registrado no `AppModule` (importa `DbModule`, exporta `TransactionPrisma`). Reaproveitar e estender esses arquivos
- `apps/backend/prisma/models/transaction.model.prisma` só tem o comentário de scaffold. A última migração é `20260706150620_add_category_subcategory` (nomes no padrão `add_account_table`, `add_credit_card`)
- Os models com que a transação se relaciona são `User` (`auth.model.prisma`), `Account` (`account.model.prisma`), **`Card`** (`credit-card.model.prisma` — o model se chama `Card`, tabela `card`, não `CreditCard`) e `Subcategory` (`category.model.prisma`, que pertence ao usuário através de `Category.userId`). Todos têm `deletedAt`
- O `JwtGuard` já é global (`APP_GUARD` no `AppModule`): toda rota nasce protegida, então **não** marcar nada com `@Public()`. O usuário vem de `@CurrentUser()` (`src/shared/decorators`) e os controllers declaram um `type AuthUser` local
- `@poupig/shared` expõe em `packages/shared/src/vo`: `Alias`, `Cpf`, `DateOnly` (normaliza `Date`/`string` para `YYYY-MM-DD`, falha com `INVALID_DATE_ONLY`), `DayOfMonth`, `Description`, `Duration`, `Email`, `EncryptedPassword`, `HashPassword`, `HexColor`, `Id`, `NonNegative`, `Password`, `PersonName`, `PositiveInteger`, `ShortDescription`, `StrongPassword`, `Text` (+ `TextConfig`) e `Url`, além de `Entity`/`EntityProps`, `Result`, `UseCase`, `CrudRepository` e as interfaces de paginação. **Não existe** VO monetário
- `NonNegative` **não** serve para dinheiro: não estende `ValueObject`, lança `ValidationError` com código `non-negative.invalid` e aceita `NaN` (`NaN < 0` é `false`). Não é alterado aqui
- Padrão de VO numérico global: `PositiveInteger` e `DayOfMonth` — estendem `ValueObject<number, ValueObjectConfig>`, construtor privado, código de erro `private static readonly`, checam `typeof` e `Number.isFinite` **antes** de comparar e fazem `throw new Error(CODE)` dentro do `try` com `Result.fail(error.message)` no `catch`
- Padrão de VO de módulo por herança de `Text`: `modules/category/src/category/model/category-name.vo.ts` (e `account-name.vo.ts`) sobrescreve `TOO_SHORT`/`TOO_LONG` com códigos do próprio atributo (`CATEGORY_NAME_TOO_SHORT`/`CATEGORY_NAME_TOO_LONG`), sobrescreve `DEFAULT_MIN_LENGTH`/`DEFAULT_MAX_LENGTH` e sobrescreve `tryCreate`/`create` só para estreitar o tipo de retorno. `trim` e checagem de tamanho vêm do `Text`
- Os limites de tamanho vivem **no próprio VO**: nenhum módulo tem arquivo de constantes de tamanho, os models existentes usam `String` sem tamanho e o frontend valida passando o VO direto ao schema (`apps/frontend/src/modules/category/data/category.schema.ts` usa `name: CategoryName`). Por isso **não** criar `*.constants.ts`
- Padrão de enum de domínio: `enum` do TypeScript com valor string igual à chave (`modules/account/src/account/model/account-type.enum.ts`, `modules/credit-card/src/credit-card/model/card-brand.enum.ts`), casando com o enum gerado pelo Prisma e importado pelo backend (`AccountType` em `account.controller.ts`/`account.prisma.ts`). Nenhum enum atual tem type guard
- Padrões reais dos cadastros `account`, `credit-card` e `category` (referência de estilo):
  - Entidade: `tryCreate` com `Result.combine`, opcionais validados só quando preenchidos (`if (props.color)`), `softDelete()` com `cloneWith({ deletedAt: new Date() })`. **Não** existem helpers `optional()`/`as()`/`validateOptional()`
  - Códigos de erro: objetos `as const` — os de aplicação no arquivo do caso de uso (`SaveCreditCardErrors`, `DeleteAccountErrors`) e os de invariante no arquivo da entidade (`CategoryErrors` em `category.entity.ts`). **Não** existem `*.errors.ts` nem `*.constants.ts` nos agregados; como o núcleo `movement` não tem entidade, os códigos dele ficam num arquivo próprio
  - Queries CQRS como atributos inline na classe Prisma (`findCreditCardsByUserId: FindCreditCardsByUserIdQuery = { execute: async (...) => Result.tryAsync(...) }`)
  - Controller: `POST` cria e `PUT /:id` atualiza, os dois montando o caso de uso de salvar à mão; `DELETE /:id` monta o de excluir. O `AccountController` normaliza `page` (mínimo 1) e `pageSize` (padrão 10, teto 50 com `Math.min`)
- **Onde esta mudança diverge dos cadastros existentes, de propósito:**
  - Repositório estende o `CrudRepository` do `@poupig/shared` (`create`, `update`, `findById`, `delete`), como no template da skill `module-aggregate`, em vez do `save`/`findByNameAndUserId` dos outros módulos
  - Paginação usa `PaginatedInputDTO`/`PaginatedResultDTO`/`PaginationMetaDTO` do `@poupig/shared` (`{ data, meta: { page, pageSize, total, totalPages } }`), e **não** copia o `PaginatedResult` local (`items/total/page/pageSize`) que `account` e `credit-card` redefinem
  - Opcionais do DTO saem como `null`, não como `undefined`
  - Transação de outro usuário responde `TRANSACTION_NOT_FOUND` (404), e não `UNAUTHORIZED` (403) como os outros módulos, para não vazar existência
- `CrudRepository.findById(id)` devolve `Promise<Result<T>>` (sem `null`) e o TypeScript está em `strict`: ausência é `Result.fail`, como o repositório em memória do template da skill faz
- `Id.tryCreate` **gera** um uuid quando o valor vem vazio e falha sempre com `INVALID_ID`, independentemente do `attribute`. Por isso: no domínio, os ids de vínculo são remapeados para códigos próprios (ver Negócio); no formulário, campo de id obrigatório **não** pode ser validado com `Id`
- Testes de VO global ficam em `packages/shared/test/vo/*.vo.test.ts` (14 arquivos hoje, importando de `'../../src'`) e os de módulo em `modules/<domain>/test/<feature>/` (skill `module-value-object`)
- Frontend:
  - Existe `app/(private)/transaction/page.tsx` renderizando `modules/transaction/pages/dashboard.page.tsx` → `components/transaction-dashboard.component.tsx` (placeholder), além de `modules/transaction/data/index.ts` e `modules/transaction/index.ts`
  - O item "Transações" está em `NAVIGATION_SECTIONS` (`app/(private)/layout.tsx`), no grupo `main`, com `href: '/transaction'` e ícone `ArrowRightLeft`
  - Padrão dos módulos (pastas no singular: `account`, `credit-card`, `category`): `data/<x>-api.client.ts` (tipos, classe `XApiError`, `headers(token)`, `handleError`, funções `list/create/update/delete`), `data/<x>.schema.ts` (`v.defineObject` com VOs), `data/use-<x>s.ts` (token via `useAuth` de `@/modules/auth/data/auth.context`, erro via `getErrorMessage` de `@/shared/i18n`), `pages/<x>s.page.tsx` alternando `mode: 'list' | 'form'` na mesma página (`credit-cards.page.tsx`), `components/<x>-list.component.tsx` e `components/<x>-form.component.tsx` (`react-hook-form` + `v.resolver`, seções com `FormSectionLayout`). A rota em `app/(private)/cards/page.tsx` só delega para a página do módulo. **Não** existem `routes.ts`, arquivo de rótulos nem mapa de erros por módulo: rótulos de enum são `Record` no componente (`BRAND_LABELS`, `ACCOUNT_TYPE_LABELS`) e erros passam pelo `getErrorMessage`
  - Já existem em `apps/frontend/src/shared/components/ui`: `badge`, `combobox` (`options: { label, value }[]`), `date-picker-input` (`value`/`onChange` em `string`), `delete-confirmation-dialog`, `empty-list-state`, `form-section-layout`, `input`, `pagination-controls`, `radio-group`, `table`, `table-card` e `textarea`. Nenhum módulo usa ainda `Table`/`TableCard`, `DatePickerInput` ou `RadioGroup`
  - **Não existem** `MoneyInput`, `formatCurrency` nem hook genérico de paginação. O cartão formata moeda com `Intl.NumberFormat` dentro de `credit-card-list.component.tsx` e trabalha o limite em centavos — **não** é referência para esta mudança
  - Clientes de outros módulos reaproveitáveis para as opções dos selects: `listAccounts(token, page, pageSize)` em `modules/account/data/account-api.client.ts`, `listCreditCards(token, { page, pageSize })` em `modules/credit-card/data/credit-card-api.client.ts` e `listCategories(token)` em `modules/category/data/category-api.client.ts` (sem paginação, com as `subcategories` embutidas). O teto de `pageSize` dos backends é `50` (o de cartões responde `PAGE_SIZE_TOO_LARGE` acima disso)
  - O i18n (`shared/i18n/messages.pt.ts` e `messages.en.ts`) já tem `TRANSACTION_NOT_FOUND`, `INVALID_MONEY_AMOUNT`, `INVALID_DATE_ONLY`, `INVALID_VALUE`, `REQUIRED_FIELD`, `TEXT_INVALID` — e chaves legadas de uma modelagem anterior: `INVALID_FINANCIAL_DIRECTION`, `INVALID_FINANCIAL_RECORD_STATUS`, `TRANSACTION_NOTE_TOO_SHORT`/`TOO_LONG` e `TRANSACTION_DESCRIPTION_TOO_SHORT`/`TOO_LONG`
- Lint:
  - O `npx eslint .` do frontend **já falha com 88 erros pré-existentes**: 78 `no-explicit-any` em `shared/components/form/validator/*`, e `no-explicit-any`/`react-hooks/set-state-in-effect` em `use-accounts.ts`, `use-credit-cards.ts`, `use-categories.ts` e `accounts.page.tsx`. O `set-state-in-effect` vem justamente do `useEffect(() => { refresh(); }, [refresh])` desses hooks, que chama `setIsLoading` de forma síncrona: copiar a estrutura, **não** esses dois erros
  - O `npx eslint "src/**/*.ts"` do backend **já falha com 58 erros e 1 aviso** (`prettier/prettier` e `no-unnecessary-type-assertion` em controllers e adapters de `account`/`auth`/`category`/`credit-card`, `no-unsafe-*` em `api-exception.filter.ts` e `no-floating-promises` em `main.ts`). **Atenção**: o script `lint` do backend roda `eslint ... --fix` e reescreveria arquivos de outros módulos
- O monorepo usa **npm** + Turbo (`packageManager: npm@10.9.2`), não pnpm

## Negócio

### Parte A — núcleo `movement` e `Money`

> Executar na ordem. Cada passo só depende dos anteriores.

1. **Criar a pasta do núcleo compartilhado** `modules/transaction/src/movement/` com a subpasta `model/`, seguindo o caminho de VO de módulo da skill (`modules/<domain>/src/<feature>/model/<name>.vo.ts`). Ela guarda **só** o que mais de um agregado usa: `Transaction`, `TransactionSeries` e `ScheduledTransaction` terão cada um a sua pasta irmã (`src/transaction`, `src/transaction-series`, `src/scheduled-transaction`). A única subpasta além de `model/` é `provider/`, criada na Parte B para a `MovementReferencesQuery`
2. **Criar os códigos de erro compartilhados** em `modules/transaction/src/movement/movement.errors.ts`, no formato do `CategoryErrors`, sem tradução (o domínio devolve código, o frontend traduz):

   ```ts
   export const MovementErrors = {
     INVALID_DIRECTION: 'INVALID_DIRECTION',
     INVALID_TRANSACTION_STATUS: 'INVALID_TRANSACTION_STATUS',
   } as const;
   ```

   - São os códigos que as entidades devolvem ao validar os dois enums. Os códigos de VO (`MOVEMENT_NAME_*`, `MOVEMENT_NOTE_*`, `INVALID_MONEY_AMOUNT`) ficam dentro dos próprios VOs, como no resto do projeto
   - Não incluir códigos de aplicação (`TRANSACTION_NOT_FOUND` e afins) nem os de `id`/`accountId`/`creditCardId`/`subcategoryId`: pertencem a cada agregado
3. **Criar o VO global `Money`** em `packages/shared/src/vo/money.vo.ts` (skill: module-value-object). É VO **global**, e não de módulo, porque valor monetário não é assunto exclusivo de movimento. Regras:
   - Estende `ValueObject<number, ValueObjectConfig>` com construtor privado e a API `create`/`tryCreate`, no mesmo formato de `PositiveInteger`; nenhuma exceção escapa do `tryCreate`
   - Trabalha em **reais**, não em centavos
   - Rejeita o que não é número finito (`typeof !== 'number'`, `NaN`, `Infinity`) **antes** de qualquer comparação
   - Arredonda para duas casas uma única vez, na entrada (`Math.round(value * 100) / 100`), e guarda o valor já arredondado: quem lê o VO nunca arredonda de novo
   - Valida `> 0` **depois** de arredondar: negativo, zero e valores que viram `0.00` (ex.: `0.004`) são reprovados. Não há `allowZero` nem config própria: nenhum consumidor previsto aceita zero
   - Código de erro estático `INVALID_MONEY_AMOUNT` (chave já traduzida no i18n)
   - Reexportar em `packages/shared/src/vo/index.ts`, mantendo a ordem alfabética
   - Teste em `packages/shared/test/vo/money.vo.test.ts` cobrindo: valor válido, arredondamento para cima (`10.126` → `10.13`) e para baixo (`10.124` → `10.12`), negativo reprovado, zero reprovado, `0.004` reprovado, `NaN`/`Infinity`/string/`undefined` reprovados, `tryCreate` devolvendo `INVALID_MONEY_AMOUNT` e `create` lançando quando inválido
4. **Criar o VO `MovementName`** em `modules/transaction/src/movement/model/movement-name.vo.ts` (skill: module-value-object):
   - Estende `Text` exatamente como `CategoryName`: sobrescreve `TOO_SHORT = 'MOVEMENT_NAME_TOO_SHORT'`, `TOO_LONG = 'MOVEMENT_NAME_TOO_LONG'`, `DEFAULT_MIN_LENGTH = 2`, `DEFAULT_MAX_LENGTH = 100` e `tryCreate`/`create` para estreitar o tipo — não reimplementar `trim` nem a checagem de tamanho
   - Os limites cabem "Mercado do mês" e ainda cabem numa linha de tabela
   - Teste em `modules/transaction/test/movement/movement-name.vo.test.ts`: nome válido, `trim` aplicado no valor guardado, curto demais e longo demais com os códigos próprios, string vazia e `undefined` reprovados, `create` lançando quando inválido
5. **Criar o VO `MovementNote`** em `modules/transaction/src/movement/model/movement-note.vo.ts` (skill: module-value-object), pelo mesmo caminho do passo anterior:
   - Estende `Text` com `TOO_SHORT = 'MOVEMENT_NOTE_TOO_SHORT'`, `TOO_LONG = 'MOVEMENT_NOTE_TOO_LONG'`, `DEFAULT_MAX_LENGTH = 500` e o `DEFAULT_MIN_LENGTH` padrão do `Text` (`1`)
   - O VO **não** modela a ausência: campo opcional é decidido na entidade, que só chama o VO quando o valor vier preenchido (mesmo padrão do `if (props.color)` em `Account`/`Card`). String vazia, portanto, nunca deve chegar aqui — e o teste registra que, se chegar, é reprovada com `MOVEMENT_NOTE_TOO_SHORT`
   - Teste em `modules/transaction/test/movement/movement-note.vo.test.ts`: observação válida, `trim`, acima do limite reprovada, string vazia reprovada, `create` lançando quando inválido
6. **Criar o enum `Direction`** em `modules/transaction/src/movement/model/direction.enum.ts`, na forma do `AccountType`: `enum Direction { IN = 'IN', OUT = 'OUT' }`. Acrescentar no mesmo arquivo o type guard `isDirection(value: unknown): value is Direction` (via `Object.values(Direction)`): é o que os três agregados usam para devolver `MovementErrors.INVALID_DIRECTION` sem repetir a checagem. Não é VO: conjunto fechado, sem normalização. Sem rótulo em pt-BR no domínio
7. **Criar o enum `TransactionStatus`** em `modules/transaction/src/movement/model/transaction-status.enum.ts`, na mesma forma: `PENDING`, `SETTLED` e `CANCELED` (grafia com um `L`, igual à que vai para o Prisma), com o type guard `isTransactionStatus`. O nome segue a linguagem ubíqua mesmo sendo usado também pela `ScheduledTransaction`. `SETTLED` é o estado que corresponde ao atributo `settledOn` das entidades
8. **Testar os type guards** em `modules/transaction/test/movement/movement-enums.test.ts`: cada valor dos dois enums aprovado; minúsculas (`'in'`, `'settled'`), valores da modelagem anterior (`'INFLOW'`, `'OUTFLOW'`, `'COMPLETED'`), `undefined`, `null` e número reprovados
9. **Criar os barris** `modules/transaction/src/movement/model/index.ts` (os dois VOs e os dois enums) e `modules/transaction/src/movement/index.ts` (reexportando `model` e `movement.errors`), e acrescentar `export * from './movement';` em `modules/transaction/src/index.ts` — mantendo o `getModuleName()` que já existe lá, como fazem `account` e `credit-card`. Não mexer em `modules/transaction/test/index.test.ts`
10. **Conferir a Parte A antes de seguir**: `npx turbo run test --filter=@poupig/shared --filter=@poupig/transaction` verde, com o `Money` importável de `@poupig/shared` e `MovementName`, `MovementNote`, `Direction`, `isDirection`, `TransactionStatus`, `isTransactionStatus` e `MovementErrors` importáveis de `@poupig/transaction`

### Parte B — agregado `Transaction`

- Criar o agregado `transaction` no módulo `transaction` com a skill `module-aggregate` em modo `example` (`node .claude/skills/module-aggregate/scripts/create-aggregate.js --module transaction --aggregate transaction --mode example`), e depois trocar o caso de uso de exemplo pelos dois desta mudança. Preservar o `export * from './movement'` do `src/index.ts`
- Criar a entidade `Transaction` com os atributos acima, reaproveitando os VOs da Parte A e do `@poupig/shared` e **sem criar nenhum VO novo** (skill: module-entity):
  - `Id` para `id`, `userId`, `accountId`, `creditCardId` e `subcategoryId`
  - `MovementName` e `MovementNote` do núcleo `movement`
  - `Money` do `@poupig/shared` para `value`
  - `DateOnly` do `@poupig/shared` para `expectedOn` e `settledOn`
  - `isDirection` e `isTransactionStatus` do núcleo para `direction` e `status`, falhando com `MovementErrors.INVALID_DIRECTION`/`INVALID_TRANSACTION_STATUS`
- Opcionais seguem o padrão do `Account`/`Card`: só passam pelo VO quando preenchidos; string vazia é tratada como não informada e vira `null`
- Aplicar na entidade as invariantes de `status`/`settledOn` descritas acima, o padrão `status: PENDING` quando não informado e o método `softDelete()`
- Exportar `TransactionErrors` (`as const`) em `transaction.entity.ts`, no formato do `CategoryErrors`, **sem** repetir códigos do núcleo nem dos VOs:
  - `TRANSACTION_NOT_FOUND` (usado pelo adapter e pelos casos de uso)
  - `TRANSACTION_SETTLED_ON_REQUIRED`
  - `INVALID_TRANSACTION_ACCOUNT_ID`, `INVALID_TRANSACTION_CREDIT_CARD_ID`, `INVALID_TRANSACTION_SUBCATEGORY_ID` — a entidade troca o `INVALID_ID` do `Id` por esses códigos, para o formulário saber qual vínculo está errado (`id` e `userId` continuam com `INVALID_ID`: nunca vêm do formulário). Como `Id.tryCreate` **gera** um uuid para valor vazio, `accountId` ausente ou vazio precisa ser reprovado com `INVALID_TRANSACTION_ACCOUNT_ID` **antes** de passar pelo `Id`
  - `INVALID_TRANSACTION_EXPECTED_ON`, `INVALID_TRANSACTION_SETTLED_ON` — mesma troca sobre o `INVALID_DATE_ONLY`
  - Não traduzir erro no domínio nem no backend
- Criar `TransactionRepository extends CrudRepository<Transaction>` (skill: module-repository), sem consulta de unicidade. Documentar no contrato que `findById` devolve `Result.fail(TransactionErrors.TRANSACTION_NOT_FOUND)` quando o registro não existe **ou** está com `deletedAt` preenchido, e que `delete` é lógico
- Criar o DTO de leitura `TransactionDTO` (skill: module-dto): atributos da entidade (sem `deletedAt`) mais os nomes dos vínculos resolvidos pela consulta — `accountName`, `creditCardName | null`, `subcategoryName | null` e `categoryName | null`. Os nomes existem só na projeção. `value` sai como `number`, `expectedOn`/`settledOn` como `YYYY-MM-DD`, `createdAt`/`updatedAt` como `Date` (igual aos outros DTOs) e os opcionais como `null`
- Criar as interfaces de consulta em `src/transaction/provider` (skill: module-query-cqrs):
  - `FindTransactionByIdQuery` — `execute(id, userId): Promise<Result<TransactionDTO | null>>`, escopada pelo usuário e ignorando excluídas
  - `ListTransactionsQuery` — `execute(input: ListTransactionsInput): Promise<Result<PaginatedResultDTO<TransactionDTO>>>`, com `ListTransactionsInput extends PaginatedInputDTO` acrescentando `userId`, `search?`, `direction?`, `status?`, `accountId?`, `expectedFrom?` e `expectedTo?`. Não criar tipo de paginação novo
- Criar **uma** consulta de vínculos no núcleo, porque `TransactionSeries` e `ScheduledTransaction` vão precisar da mesma checagem: `MovementReferencesQuery` em `modules/transaction/src/movement/provider/movement-references.query.ts`, com `accountBelongsToUser(id, userId)`, `creditCardBelongsToUser(id, userId)` e `subcategoryBelongsToUser(id, userId)`, todas `Promise<Result<boolean>>`. É o contrato que permite ao caso de uso conferir os vínculos **sem** importar os outros módulos de domínio. Exportar pelo barril do `movement`
- Criar só os casos de uso de escrita (skill: module-use-case), cada um com o seu objeto de erros `as const` no próprio arquivo:
  - `SaveTransaction` (`save-transaction.use-case.ts`, recebe `TransactionRepository` e `MovementReferencesQuery`), com `SaveTransactionErrors`: `TRANSACTION_ACCOUNT_NOT_FOUND`, `TRANSACTION_CREDIT_CARD_NOT_FOUND`, `TRANSACTION_SUBCATEGORY_NOT_FOUND`
  - `DeleteTransaction` (`delete-transaction.use-case.ts`)
- O `SaveTransaction` cria e atualiza no mesmo caso de uso, decidindo pela presença do `id` na entrada, e devolve `Result<{ id: string }>` com o id gravado (o mesmo contrato de `SaveTransactionSeries` e `SaveScheduledTransaction`, nos prompts 18 e 19):
  - **sem `id`**: cria a entidade (o `Id` gera o identificador) e chama `create`
  - **com `id`**: carrega com `findById`; falha do repositório é propagada; registro de outro usuário falha com `TRANSACTION_NOT_FOUND`; senão aplica `cloneWith` com os campos da entrada e chama `update`
  - Assim um `PUT` com id inexistente responde 404 em vez de criar um registro novo
- No `SaveTransaction`, conferir os vínculos pela `MovementReferencesQuery` **depois** da validação da entidade: conta inexistente, excluída ou de outro usuário falha com `TRANSACTION_ACCOUNT_NOT_FOUND`, cartão com `TRANSACTION_CREDIT_CARD_NOT_FOUND` e subcategoria com `TRANSACTION_SUBCATEGORY_NOT_FOUND`. Vínculo opcional ausente não é consultado
- O `DeleteTransaction` carrega com `findById`, falha com `TRANSACTION_NOT_FOUND` quando o registro é de outro usuário, aplica `softDelete()` e persiste com `update`
- Não criar caso de uso para as consultas: sem regra de negócio, elas são resolvidas direto no controller
- Criar os testes em `modules/transaction/test/transaction/` (entidade e casos de uso) com os repositórios em memória em `modules/transaction/test/mock/` (`in-memory-transaction.repository.ts` e um `in-memory-movement-references.query.ts`), cobrindo: obrigatórios ausentes, opcionais ausentes e string vazia virando `null`, valor zero e negativo reprovados, valor arredondado para 2 casas, direção e status inválidos (inclusive `INFLOW` e `COMPLETED`), status padrão `PENDING`, `SETTLED` sem `settledOn` reprovado, `settledOn` descartado em `PENDING`/`CANCELED`, `settledOn` anterior ao `expectedOn` aceito, data inválida com o código próprio, id de vínculo inválido com o código próprio, criação (sem id) x atualização (com id), id inexistente, transação de outro usuário, transação excluída tratada como inexistente e cada um dos três vínculos inválidos

## Backend

- Mapear a entidade em `apps/backend/prisma/models/transaction.model.prisma` e gerar a migração `add_transaction` (skill: backend-prisma-data):
  - enums `Direction` (`IN`, `OUT`) e `TransactionStatus` (`PENDING`, `SETTLED`, `CANCELED`), espelhando os enums de domínio, como o `AccountType` faz em `account.model.prisma`
  - model `Transaction` (`@@map("transaction")`, colunas em snake_case com `@map` como nos outros models): `value` em `Decimal @db.Decimal(14, 2)`, `expectedOn`/`settledOn` em `DateTime @db.Date` (data pura), `name` em `@db.VarChar(100)` e `note` em `@db.VarChar(500)` (os mesmos limites de `MovementName`/`MovementNote`, que continuam sendo a fonte da regra), `createdAt`, `updatedAt` e `deletedAt DateTime?`
  - relações: `user` com `onDelete: Cascade`, `account` com `onDelete: Cascade`, `creditCard` (model `Card`) e `subcategory` opcionais com `onDelete: SetNull`. Como os cadastros vizinhos são excluídos logicamente, essas regras só atuam em exclusão física
  - acrescentar os campos de relação inversa (`transactions Transaction[]`) em `User`, `Account`, `Card` e `Subcategory`: o Prisma exige os dois lados. É a **única** alteração permitida nos arquivos de model dos outros módulos
  - índices: `@@index([userId, expectedOn])` (ordenação da listagem), `@@index([accountId])`, `@@index([creditCardId])` e `@@index([subcategoryId])`
- Atenção na conversão do `Decimal` do Prisma: converter para `number` ao montar DTO e entidade e escrever o número direto na gravação — nunca deixar o objeto `Decimal` vazar para o DTO nem serializar como string no JSON
- Atenção nas colunas `@db.Date`: o Prisma devolve `Date` em UTC; usar o `DateOnly` (ou `toISOString().slice(0, 10)`) para montar o DTO e nunca formatar com fuso local, senão a data volta um dia. Na gravação, converter `YYYY-MM-DD` para `Date` em UTC
- Implementar `TransactionPrisma implements TransactionRepository` em `transaction.prisma.ts`:
  - `create`/`update` gravam todos os campos, inclusive `deletedAt`; `findById` filtra `deletedAt: null` e falha com `TRANSACTION_NOT_FOUND` quando não acha; `delete(id)` é lógico (`deletedAt: new Date()`), como o `delete` do `CreditCardPrisma`
  - consultas como atributos públicos inline, nomeados como as interfaces: `readonly findTransactionById: FindTransactionByIdQuery = { execute: ... }`, `readonly listTransactions: ListTransactionsQuery = { ... }` e `readonly movementReferences: MovementReferencesQuery = { ... }`
- A consulta por id devolve o DTO pronto; a paginada usa `skip`/`take`/`orderBy` (`expectedOn` desc, `createdAt` desc) e `count` em `Promise.all` (como o `CreditCardPrisma`), sempre com `userId` e `deletedAt: null`, e devolve `{ data, meta }` com `totalPages` calculado. Os nomes de conta, cartão, subcategoria e categoria vêm por `select` das relações na própria consulta, sem segunda chamada
- A busca por nome é parcial e case-insensitive (`contains` + `mode: 'insensitive'`); o período filtra `expectedOn` com `gte`/`lte`, aceitando só um dos dois lados
- A `movementReferences` usa `count` na tabela vizinha, escopada pelo usuário e ignorando excluídos: `account.count({ where: { id, userId, deletedAt: null } })`, `card.count({ where: { id, userId, deletedAt: null } })` e `subcategory.count({ where: { id, deletedAt: null, category: { userId, deletedAt: null } } })`. É o único ponto do backend que lê tabela de outro módulo, e só para conferir posse
- Alterar o `TransactionController` para `@Controller('transactions')` (skill: backend-controller), removendo o `@Get()` de exemplo. Injetar a classe concreta `TransactionPrisma` direto no controller. Rotas:
  - `POST /transactions` (201): `SaveTransaction` **sem** `id`, respondendo `{ id }`
  - `PUT /transactions/:id`: `SaveTransaction` com o `id` da rota, respondendo `{ id }`
  - `GET /transactions`: paginada, com `page`, `pageSize`, `search`, `direction`, `status`, `accountId`, `expectedFrom` e `expectedTo`
  - `GET /transactions/:id`: `findTransactionById`; `null` vira `NotFoundException('TRANSACTION_NOT_FOUND')`
  - `DELETE /transactions/:id`: `DeleteTransaction`
- Nas rotas de escrita, montar o caso de uso manualmente dentro do método, passando `this.transactionPrisma` como repositório e `this.transactionPrisma.movementReferences` como consulta de vínculos. Nas rotas de consulta, chamar o atributo de consulta e retornar o resultado, sem caso de uso no meio
- Normalizar `page` (mínimo 1) e `pageSize` (padrão 10, teto 50) como o `AccountController`. `direction` e `status` chegam como string: repassar crus e deixar o domínio reprovar valor fora do conjunto
- No corpo de `POST`/`PUT`, `value` pode chegar como string: converter para número antes de chamar o caso de uso e deixar o valor não numérico virar `INVALID_MONEY_AMOUNT` do domínio, não `NaN` silencioso
- Nunca aceitar `userId` pelo body ou query: sempre `@CurrentUser()`
- Mapear as falhas: `NotFoundException` quando os erros contiverem `TRANSACTION_NOT_FOUND`; `BadRequestException` com a lista de códigos para todo o resto, inclusive os três `TRANSACTION_*_NOT_FOUND` de vínculo (o recurso da rota existe; o que veio errado foi o payload)
- Criar os testes de integração em `apps/backend/src/modules/transaction/transaction.integration.http` no formato do Rest Client (plugin do VS Code), cobrindo: criar, atualizar, `PUT` com id inexistente (404), listar (2 páginas, conferindo `meta`), listar com busca e com filtro de status/direção/período, buscar por id (conferindo `value` como número e datas em `YYYY-MM-DD`), excluir e buscar de novo (404), `SETTLED` sem `settledOn` (400), valor zero (400, `INVALID_MONEY_AMOUNT`), direção fora do conjunto (400, `INVALID_DIRECTION`), conta de outro usuário (400) e acesso sem token (401)

## Frontend

- Criar o `MoneyInput` genérico em `apps/frontend/src/shared/components/ui/money-input.tsx`, exportando também `formatCurrency(value: number): string` (`Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`). O componente trabalha em **reais** (`value?: number`, `onChange(value: number | undefined)`), exibe a máscara `R$ 1.234,56` e segue o estilo do `input`. Será reaproveitado por `TransactionSeries` e `ScheduledTransaction`. **Não** refatorar o cartão nem os cards de dashboard para usá-lo
- Criar em `apps/frontend/src/modules/transaction/data`:
  - `transaction-api.client.ts` — `TransactionDTO`, `SaveTransactionInput`, `ListTransactionsParams` (página + filtros), `TransactionApiError` e as funções `listTransactions`, `createTransaction`, `updateTransaction` e `deleteTransaction`, no mesmo formato de `credit-card-api.client.ts`. Tipar a paginação com `PaginatedResultDTO` do `@poupig/shared` e os enums com `Direction`/`TransactionStatus` importados de `@poupig/transaction` (sem redefinir união de string)
  - `transaction.schema.ts` — schema do formulário com `v.defineObject` (skill: frontend-form-schema), reaproveitando os VOs do domínio: `name: MovementName`, `note: { vo: MovementNote, optional: true }`, `value: Money`, `expectedOn: DateOnly`, `settledOn: { vo: DateOnly, optional: true }`, `accountId: Text` (obrigatório — **não** usar `Id`, que aceitaria vazio gerando um uuid), `creditCardId`/`subcategoryId` como `{ vo: Id, optional: true }`. `direction` e `status` não são VO: ficam fora do schema e entram no tipo do formulário como `Direction`/`TransactionStatus`, no mesmo espírito do `isActive` em `category.schema.ts`. Usar refinamento do `v` para exigir `settledOn` quando `status` for `SETTLED`, com a mensagem de `TRANSACTION_SETTLED_ON_REQUIRED`
  - `transaction.labels.ts` — `DIRECTION_LABELS: Record<Direction, string>` (`Entrada`/`Saída`) e `TRANSACTION_STATUS_LABELS: Record<TransactionStatus, string>` (`Pendente`/`Efetivada`/`Cancelada`). Fica em arquivo próprio, e não dentro do componente como o `BRAND_LABELS`, porque lista e formulário usam os dois
  - `use-transactions.ts` — `useTransactions(page, pageSize, filters)`, `useSaveTransaction`, `useDeleteTransaction` e `useTransactionOptions`, no formato de `use-credit-cards.ts` (token via `useAuth`, erro via `getErrorMessage`). Não criar hook genérico de paginação. Diferente dos hooks existentes, **sem** `any` (`catch (err: unknown)`) e **sem** `setState` síncrono dentro de `useEffect`: a busca roda no efeito e só grava estado no retorno da promessa (descartando a resposta de requisição obsoleta), o carregamento é derivado de "resposta atual ainda não chegou", e o `refresh` depois de salvar/excluir incrementa um contador de recarga no handler
  - Substituir o conteúdo de `data/index.ts` pelos exports reais
- O `useTransactionOptions` carrega as opções dos selects reaproveitando os clientes que já existem: `listAccounts(token, 1, 50)`, `listCreditCards(token, { page: 1, pageSize: 50 })` e `listCategories(token)`. Mantém só os ativos, e as subcategorias saem do `CategoryDTO` agrupadas pela categoria (rótulo `Categoria › Subcategoria`). Não criar endpoint de opções e não alterar nenhum arquivo dos outros módulos do frontend
- Criar `pages/transactions.page.tsx` alternando `mode: 'list' | 'form'` na mesma página, como `credit-cards.page.tsx`: título, botão "Nova transação", barra de filtros (busca por nome, direção, status, conta e período — trocar qualquer filtro volta para a página 1), lista, `PaginationControls` e `DeleteConfirmationDialog` (deixando claro que a transação será excluída). Toaster de sucesso e erro em salvar e excluir, recarregando a lista
- Criar `components/transaction-list.component.tsx` usando `TableCard` + `Table` de `shared/components/ui` e `EmptyListState` quando não houver transações. Colunas: data prevista (`dd/MM/yyyy`, montada a partir da string `YYYY-MM-DD`, sem `new Date` com fuso local), nome, conta, subcategoria (com a categoria), valor com `formatCurrency` (sinal e cor conforme a direção) e status em `Badge`, mais as ações de editar e excluir. Não montar `Intl.NumberFormat` novo
- Criar `components/transaction-form.component.tsx` (`TransactionFormComponent`), um único componente para criar e editar: recebe opcionalmente a transação (vinda da lista) e preenche os campos com `defaultValues`/`reset`; sem transação, abre com `direction: OUT`, `status: PENDING` e `expectedOn` no dia de hoje (data local em `YYYY-MM-DD`). Só o título e o texto do botão mudam entre os dois fluxos
- Organizar o formulário com `FormSectionLayout`, uma seção por grupo (Lançamento, Vínculos, Situação), cada uma com título e descrição curta. Usar `MoneyInput` para o valor, `DatePickerInput` para as duas datas, `RadioGroup` para a direção, `Combobox` para status, conta, cartão e subcategoria, e `Textarea` para a observação
- O campo de data de efetivação só faz sentido com status `SETTLED`: com outro status, o formulário desabilita e limpa o campo, espelhando a regra da entidade — sem inventar regra nova no front
- Traduzir os erros com o `getErrorMessage` e ajustar o dicionário em `shared/i18n/messages.pt.ts` **e** `messages.en.ts`:
  - acrescentar `INVALID_DIRECTION`, `INVALID_TRANSACTION_STATUS`, `MOVEMENT_NAME_TOO_SHORT`, `MOVEMENT_NAME_TOO_LONG`, `MOVEMENT_NOTE_TOO_SHORT`, `MOVEMENT_NOTE_TOO_LONG`, `TRANSACTION_SETTLED_ON_REQUIRED`, `INVALID_TRANSACTION_ACCOUNT_ID`, `INVALID_TRANSACTION_CREDIT_CARD_ID`, `INVALID_TRANSACTION_SUBCATEGORY_ID`, `INVALID_TRANSACTION_EXPECTED_ON`, `INVALID_TRANSACTION_SETTLED_ON`, `TRANSACTION_ACCOUNT_NOT_FOUND`, `TRANSACTION_CREDIT_CARD_NOT_FOUND` e `TRANSACTION_SUBCATEGORY_NOT_FOUND`
  - reaproveitar `TRANSACTION_NOT_FOUND`, `INVALID_MONEY_AMOUNT`, `INVALID_DATE_ONLY` e `REQUIRED_FIELD`
  - remover as chaves legadas `INVALID_FINANCIAL_DIRECTION`, `INVALID_FINANCIAL_RECORD_STATUS`, `TRANSACTION_NOTE_TOO_SHORT`/`TOO_LONG` e `TRANSACTION_DESCRIPTION_TOO_SHORT`/`TOO_LONG`, depois de conferir com busca que nada mais as referencia
  - nenhum código de erro aparece cru na tela
- Trocar a rota `/transaction` por `/transactions` (plural, como `/accounts`, `/cards` e `/categories`): criar `app/(private)/transactions/page.tsx` apenas delegando para `TransactionsPage` e remover a pasta `app/(private)/transaction`, junto com o `dashboard.page.tsx` e o `transaction-dashboard.component.tsx` do módulo, que ficam sem uso. Não implementar guard na página: a proteção já está no layout do grupo
- Atualizar o item "Transações" de `NAVIGATION_SECTIONS` (`app/(private)/layout.tsx`) para `href: '/transactions'`, mantendo `id`, rótulo, grupo e ícone `ArrowRightLeft` — não adicionar item novo
- Exportar a página, os componentes e o `data` em `modules/transaction/index.ts`

## Fora de Escopo

- `TransactionSeries`, `ScheduledTransaction` e qualquer recorrência, parcelamento ou repetição (`SeriesKind`, `FrequencyUnit`, `DayOfWeek`, `RecurrenceRule`) — prompts 18 e 19
- Um contrato base `MovementProps` compartilhado pelas três entidades
- Transferência entre contas, conciliação bancária, importação de extrato/OFX e anexos
- Saldo de conta, limite utilizado do cartão, fatura, ciclo de fatura e qualquer valor calculado a partir das transações
- Extrato, dashboard, gráficos e totais por período, categoria ou direção — prompts 16 em diante
- Efetivar/cancelar como ação própria da listagem: nesta mudança o status muda pelo formulário, sem endpoint dedicado
- Restaurar transação excluída e qualquer tela de lixeira
- Política para transações de conta, cartão ou subcategoria excluídas logicamente (continuam existindo e exibindo o nome do vínculo), e qualquer refatoração de `account`, `category` ou `credit-card`
- Rotas próprias para o formulário (`/transactions/novo`, `/transactions/[id]`), `routes.ts` e hook genérico de paginação
- Levar o `Money` ou o `MoneyInput` para o cartão, ou migrar o limite do cartão de centavos para reais
- Trocar o `NonNegative` ou qualquer VO global existente
- Busca das opções de conta/cartão/subcategoria no servidor (autocomplete): o formulário carrega uma página de ativos
- Moeda diferente de real, câmbio, multi-moeda e aritmética monetária (soma, saldo, total) — o `Money` valida e normaliza, não calcula

## Pasta do Módulo

- VO global e reexportação: `packages/shared/src/vo/money.vo.ts`, `packages/shared/src/vo/index.ts`
- Teste do VO global: `packages/shared/test/vo/money.vo.test.ts`
- Núcleo compartilhado: `modules/transaction/src/movement` (`movement.errors.ts`, `model/`, `provider/movement-references.query.ts`, `index.ts`)
- Domínio: `modules/transaction/src/transaction` (irmã de `modules/transaction/src/movement`)
- Barril do pacote: `modules/transaction/src/index.ts`
- Testes do domínio: `modules/transaction/test/movement`, `modules/transaction/test/transaction` e `modules/transaction/test/mock`
- Modelo do prisma: `apps/backend/prisma/models/transaction.model.prisma` (+ relações inversas em `auth`, `account`, `credit-card` e `category`)
- Backend do módulo: `apps/backend/src/modules/transaction`
- Rota: `apps/frontend/src/app/(private)/transactions/page.tsx`
- Menu: `apps/frontend/src/app/(private)/layout.tsx`
- Páginas: `apps/frontend/src/modules/transaction/pages`
- Componentes: `apps/frontend/src/modules/transaction/components`
- Ger. de Estado: `apps/frontend/src/modules/transaction/data`
- Componente compartilhado novo: `apps/frontend/src/shared/components/ui/money-input.tsx`
- Dicionário de erros: `apps/frontend/src/shared/i18n/messages.pt.ts` e `messages.en.ts`

## Instruções

- O código deverá ser escrito em inglês, usando os termos da linguagem ubíqua exatamente como estão (`Direction`, `IN`/`OUT`, `TransactionStatus`, `SETTLED`, `Movement*`)
- A especificação deverá ser escrita em português do brasil
- Use as skills mencionadas (principalmente `module-value-object`, lendo `references/vo-pattern.md` antes de escrever qualquer VO). A skill cita `../skills-standards.md`, que não existe no repositório: seguir os arquivos de referência listados em Contexto Atual
- Reaproveitar o que já existe (`ValueObject`, `Result`, `Text`, `Id`, `DateOnly`, `CrudRepository`, paginação do `@poupig/shared`, `useAuth`, `getErrorMessage`, clientes de listagem dos outros módulos, componentes de UI, validador `v`), sem duplicar e sem criar caminho paralelo de validação
- Seguir os padrões de `account`, `category` e `credit-card` descritos em Contexto Atual, exceto nos pontos listados como divergência proposital
- Cada peça do núcleo `movement` precisa ter um consumidor previsto (esta mudança ou os prompts 18 e 19): não adicionar VO, enum, constante ou helper "por precaução"
- Fora de `modules/transaction` e do `Money` em `packages/shared`, só são permitidos: as relações inversas nos models do Prisma, o `money-input.tsx` em `shared/components/ui`, o dicionário de erros em `shared/i18n` e o `href` do item de menu
- Não criar nenhum VO além de `Money`, `MovementName` e `MovementNote`
- Executar em quatro sub agentes sequenciais: (1) negócio parte A (núcleo `movement` e `Money`), (2) negócio parte B (agregado `Transaction`), (3) backend, (4) frontend
- Garantir no final o build do projeto (`npm run build`) funcionando, os testes (`npm test`) sem falha e o `npx eslint` **sem `--fix`** dos arquivos de frontend e de backend criados ou alterados sem nenhum erro (os erros pré-existentes — 88 no frontend, 58 no backend — não são corrigidos nesta mudança; **não** rodar `npm run lint` no backend, que aplica `--fix` em todos os arquivos)
- Não executar teste via Web Browser (farei testes manuais)

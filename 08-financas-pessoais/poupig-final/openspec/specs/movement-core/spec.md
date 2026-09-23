# movement-core Specification

## Purpose
Concentrar no módulo `transaction` os objetos de valor, enumerações, códigos de erro e contratos de consulta comuns às entidades de movimento (`Transaction`, `TransactionSeries` e `ScheduledTransaction`), para que cada agregado os reutilize sem duplicar regra.
## Requirements
### Requirement: Núcleo movement expõe apenas as peças usadas por mais de um agregado
O pacote `@poupig/transaction` SHALL exportar, a partir do núcleo `movement`, exatamente: `MovementName`, `MovementNote`, `Direction`, `isDirection`, `TransactionStatus`, `isTransactionStatus`, `MovementErrors` e o contrato `MovementReferencesQuery`, preservando o `getModuleName()` já exportado. O núcleo SHALL NOT conter `SeriesKind`, `FrequencyUnit`, `DayOfWeek`, `RecurrenceRule`, um contrato base `MovementProps` nem qualquer VO, enum, constante ou helper sem consumidor previsto. O código do módulo SHALL NOT usar os termos da modelagem anterior: `FinancialDirection`, `INFLOW`, `OUTFLOW`, `FinancialRecordStatus`, `COMPLETED`, `TransactionName`, `TransactionNote` nem uma pasta `src/shared`.

#### Scenario: Peças do núcleo importáveis pelo pacote
- **WHEN** outro pacote importa `MovementName`, `MovementNote`, `Direction`, `isDirection`, `TransactionStatus`, `isTransactionStatus`, `MovementErrors` e `MovementReferencesQuery` de `@poupig/transaction`
- **THEN** todos os imports resolvem sem erros
- **AND** `getModuleName()` continua exportado com o mesmo retorno

#### Scenario: Peças exclusivas da série ausentes
- **WHEN** o conteúdo exportado por `@poupig/transaction` é inspecionado
- **THEN** não existem `SeriesKind`, `FrequencyUnit`, `DayOfWeek` nem `RecurrenceRule`

#### Scenario: Termos da modelagem anterior ausentes
- **WHEN** o código-fonte de `modules/transaction` é pesquisado pelos termos `FinancialDirection`, `INFLOW`, `OUTFLOW`, `FinancialRecordStatus`, `COMPLETED`, `TransactionName` e `TransactionNote`
- **THEN** nenhum deles aparece fora dos testes que confirmam a sua reprovação

---

### Requirement: MovementName valida o nome de um movimento
O VO `MovementName` SHALL remover espaços nas extremidades, SHALL aceitar de 2 a 100 caracteres após o `trim` e SHALL reprovar com `MOVEMENT_NAME_TOO_SHORT` abaixo do mínimo e com `MOVEMENT_NAME_TOO_LONG` acima do máximo. String vazia e `undefined` SHALL ser reprovados. `tryCreate` SHALL devolver `Result`; `create` SHALL lançar quando inválido.

#### Scenario: Nome válido
- **WHEN** `MovementName.tryCreate("Mercado do mês")` é chamado
- **THEN** o resultado é sucesso com o valor `"Mercado do mês"`

#### Scenario: Espaços nas extremidades removidos
- **WHEN** `MovementName.tryCreate("  Aluguel  ")` é chamado
- **THEN** o valor guardado é `"Aluguel"`

#### Scenario: Nome curto demais
- **WHEN** `MovementName.tryCreate("A")` é chamado
- **THEN** o resultado é falha com o código `MOVEMENT_NAME_TOO_SHORT`

#### Scenario: Nome longo demais
- **WHEN** `MovementName.tryCreate` é chamado com 101 caracteres
- **THEN** o resultado é falha com o código `MOVEMENT_NAME_TOO_LONG`

#### Scenario: Nome vazio ou ausente
- **WHEN** `MovementName.tryCreate` é chamado com `""` ou `undefined`
- **THEN** o resultado é falha

#### Scenario: create lança quando inválido
- **WHEN** `MovementName.create("A")` é chamado
- **THEN** um erro é lançado

---

### Requirement: MovementNote valida a observação de um movimento sem modelar ausência
O VO `MovementNote` SHALL remover espaços nas extremidades, SHALL aceitar de 1 a 500 caracteres após o `trim` e SHALL reprovar com `MOVEMENT_NOTE_TOO_SHORT` abaixo do mínimo e com `MOVEMENT_NOTE_TOO_LONG` acima do máximo. O VO SHALL NOT tratar a observação ausente como válida: a opcionalidade é decidida pela entidade, que só aciona o VO quando o valor vier preenchido.

#### Scenario: Observação válida
- **WHEN** `MovementNote.tryCreate("Pago no débito")` é chamado
- **THEN** o resultado é sucesso com o valor `"Pago no débito"`

#### Scenario: Espaços nas extremidades removidos
- **WHEN** `MovementNote.tryCreate("  parcela única  ")` é chamado
- **THEN** o valor guardado é `"parcela única"`

#### Scenario: Observação longa demais
- **WHEN** `MovementNote.tryCreate` é chamado com 501 caracteres
- **THEN** o resultado é falha com o código `MOVEMENT_NOTE_TOO_LONG`

#### Scenario: String vazia reprovada
- **WHEN** `MovementNote.tryCreate("")` é chamado
- **THEN** o resultado é falha com o código `MOVEMENT_NOTE_TOO_SHORT`

#### Scenario: create lança quando inválido
- **WHEN** `MovementNote.create("")` é chamado
- **THEN** um erro é lançado

---

### Requirement: Direction define o sentido do movimento
O enum `Direction` SHALL ter exatamente os valores `IN` e `OUT`, cada um com valor string igual à chave. O type guard `isDirection(value)` SHALL aprovar somente esses dois valores exatos e SHALL reprovar qualquer outra entrada, sem normalização. O domínio SHALL NOT conter rótulos em português para a direção.

#### Scenario: Valores válidos aprovados
- **WHEN** `isDirection` é chamado com `"IN"` e com `"OUT"`
- **THEN** ambos retornam `true`

#### Scenario: Valores fora do conjunto reprovados
- **WHEN** `isDirection` é chamado com `"in"`, `"INFLOW"`, `"OUTFLOW"`, `undefined`, `null` ou um número
- **THEN** todos retornam `false`

---

### Requirement: TransactionStatus define a situação do movimento
O enum `TransactionStatus` SHALL ter exatamente os valores `PENDING`, `SETTLED` e `CANCELED` (grafia com um `L`), cada um com valor string igual à chave. `SETTLED` SHALL ser o estado que corresponde à data de efetivação (`settledOn`) das entidades. O type guard `isTransactionStatus(value)` SHALL aprovar somente esses três valores exatos.

#### Scenario: Valores válidos aprovados
- **WHEN** `isTransactionStatus` é chamado com `"PENDING"`, `"SETTLED"` e `"CANCELED"`
- **THEN** todos retornam `true`

#### Scenario: Valores fora do conjunto reprovados
- **WHEN** `isTransactionStatus` é chamado com `"settled"`, `"COMPLETED"`, `"INFLOW"`, `undefined`, `null` ou um número
- **THEN** todos retornam `false`

---

### Requirement: MovementErrors reúne só os códigos de enum compartilhados
`MovementErrors` SHALL conter exatamente os códigos `INVALID_DIRECTION` e `INVALID_TRANSACTION_STATUS`, com valor igual à chave e sem tradução. SHALL NOT conter códigos de VO (`MOVEMENT_NAME_*`, `MOVEMENT_NOTE_*`, `INVALID_MONEY_AMOUNT`), códigos de aplicação (`TRANSACTION_NOT_FOUND` e afins) nem códigos de identificadores de vínculo, que pertencem a cada VO ou agregado.

#### Scenario: Conteúdo de MovementErrors
- **WHEN** as chaves de `MovementErrors` são inspecionadas
- **THEN** existem exatamente `INVALID_DIRECTION` e `INVALID_TRANSACTION_STATUS`, cada uma com valor igual ao próprio nome

---

### Requirement: MovementReferencesQuery confere a posse dos vínculos de um movimento
O contrato `MovementReferencesQuery` SHALL oferecer `accountBelongsToUser(id, userId)`, `creditCardBelongsToUser(id, userId)` e `subcategoryBelongsToUser(id, userId)`, todos devolvendo `Result<boolean>`. Cada consulta SHALL responder `true` somente quando o registro existe, não está excluído logicamente e pertence ao usuário informado; para a subcategoria, a posse SHALL ser a da categoria a que ela pertence, que também não pode estar excluída. O contrato SHALL permitir que os casos de uso confiram vínculos sem importar os módulos de domínio `account`, `credit-card` e `category`.

#### Scenario: Vínculo do próprio usuário
- **WHEN** `accountBelongsToUser` é chamado com o id de uma conta ativa do usuário
- **THEN** o resultado é sucesso com `true`

#### Scenario: Vínculo de outro usuário
- **WHEN** `creditCardBelongsToUser` é chamado com o id de um cartão de outro usuário
- **THEN** o resultado é sucesso com `false`

#### Scenario: Vínculo excluído logicamente
- **WHEN** `accountBelongsToUser` é chamado com o id de uma conta do usuário com exclusão lógica
- **THEN** o resultado é sucesso com `false`

#### Scenario: Subcategoria de categoria excluída
- **WHEN** `subcategoryBelongsToUser` é chamado com uma subcategoria cuja categoria do usuário está excluída logicamente
- **THEN** o resultado é sucesso com `false`


# scheduled-transaction-domain Specification

## Purpose
Definir o agregado `ScheduledTransaction` do módulo `transaction`: a ocorrência que uma `TransactionSeries` gera, seus atributos e invariantes, a identidade da ocorrência pela série e pelo índice, os códigos de erro próprios, o contrato de persistência, as projeções de leitura e a geração em memória das ocorrências de um período.
## Requirements
### Requirement: Entidade ScheduledTransaction possui os atributos definidos
A entidade `ScheduledTransaction` SHALL conter: `id` (gerado quando ausente), `userId`, `seriesId`, `occurrenceIndex` (inteiro base 0), `occurrenceOn` (`DateOnly`), `name` (`MovementName`), `note` (`MovementNote`, opcional), `value` (`Money`), `direction` (`Direction`), `accountId`, `creditCardId` (opcional), `subcategoryId` (opcional), `status` (`TransactionStatus`, padrão `PENDING`), `expectedOn` (`DateOnly`) e `settledOn` (`DateOnly`, opcional), além de `createdAt` e `updatedAt` herdados das propriedades base de entidade. Todos os identificadores SHALL usar o `Id` do `@poupig/shared`. A entidade SHALL NOT introduzir nenhum VO além dos do núcleo `movement` e do `@poupig/shared`. `occurrenceOn` é a data que a série calculou para a ocorrência; `expectedOn` é a data que o usuário vê e pode mudar; a entidade SHALL NOT exigir relação de ordem entre as duas.

#### Scenario: Criação apenas com obrigatórios
- **WHEN** a entidade é criada com `userId`, `seriesId`, `occurrenceIndex: 2`, `occurrenceOn`, `name`, `value`, `direction`, `accountId` e `expectedOn` válidos
- **THEN** a criação é bem-sucedida com um `id` gerado, `status` igual a `PENDING` e `note`, `creditCardId`, `subcategoryId` e `settledOn` iguais a `null`

#### Scenario: Primeira ocorrência da série
- **WHEN** a entidade é criada com `occurrenceIndex: 0`
- **THEN** a criação é bem-sucedida

#### Scenario: Data prevista antes da data da ocorrência
- **WHEN** a entidade é criada com `occurrenceOn: "2026-09-10"` e `expectedOn: "2026-09-05"`
- **THEN** a criação é bem-sucedida com as duas datas preservadas

#### Scenario: Data prevista depois da data da ocorrência
- **WHEN** a entidade é criada com `occurrenceOn: "2026-09-10"` e `expectedOn: "2026-10-02"`
- **THEN** a criação é bem-sucedida com as duas datas preservadas

---

### Requirement: Obrigatórios inválidos ou ausentes são reprovados com códigos próprios
A entidade SHALL reprovar: `name` inválido com o código do `MovementName`; `value` ausente, zero ou negativo com `INVALID_MONEY_AMOUNT`; `direction` fora do conjunto com `INVALID_DIRECTION`; `status` informado fora do conjunto com `INVALID_TRANSACTION_STATUS`; `seriesId` ausente, vazio ou inválido com `INVALID_SCHEDULED_TRANSACTION_SERIES_ID`; `occurrenceIndex` ausente, negativo ou não inteiro com `INVALID_SCHEDULED_TRANSACTION_OCCURRENCE_INDEX`; `occurrenceOn` ausente ou inválido com `INVALID_SCHEDULED_TRANSACTION_OCCURRENCE_ON`; `expectedOn` ausente ou inválido com `INVALID_SCHEDULED_TRANSACTION_EXPECTED_ON`; e `accountId` ausente, vazio ou inválido com `INVALID_SCHEDULED_TRANSACTION_ACCOUNT_ID`. `seriesId` e `accountId` vazios SHALL ser reprovados **sem** gerar um identificador novo. `id` e `userId` inválidos SHALL continuar reprovados com `INVALID_ID`. Todas as falhas de atributo SHALL ser acumuladas em uma única resposta.

#### Scenario: Série ausente ou vazia
- **WHEN** a entidade é criada sem `seriesId` ou com `seriesId: ""`
- **THEN** a criação falha com `INVALID_SCHEDULED_TRANSACTION_SERIES_ID`

#### Scenario: Série com identificador malformado
- **WHEN** a entidade é criada com `seriesId: "abc"`
- **THEN** a criação falha com `INVALID_SCHEDULED_TRANSACTION_SERIES_ID`

#### Scenario: Índice negativo ou fracionário
- **WHEN** a entidade é criada com `occurrenceIndex: -1` ou `occurrenceIndex: 1.5`
- **THEN** a criação falha com `INVALID_SCHEDULED_TRANSACTION_OCCURRENCE_INDEX`

#### Scenario: Índice ausente
- **WHEN** a entidade é criada sem `occurrenceIndex`
- **THEN** a criação falha com `INVALID_SCHEDULED_TRANSACTION_OCCURRENCE_INDEX`

#### Scenario: Data da ocorrência inválida
- **WHEN** a entidade é criada com `occurrenceOn: "2026-02-30"` ou sem `occurrenceOn`
- **THEN** a criação falha com `INVALID_SCHEDULED_TRANSACTION_OCCURRENCE_ON`

#### Scenario: Data prevista inválida
- **WHEN** a entidade é criada sem `expectedOn`
- **THEN** a criação falha com `INVALID_SCHEDULED_TRANSACTION_EXPECTED_ON`

#### Scenario: Conta ausente ou vazia
- **WHEN** a entidade é criada sem `accountId` ou com `accountId: ""`
- **THEN** a criação falha com `INVALID_SCHEDULED_TRANSACTION_ACCOUNT_ID`

#### Scenario: Valor zero
- **WHEN** a entidade é criada com `value: 0`
- **THEN** a criação falha com `INVALID_MONEY_AMOUNT`

#### Scenario: Direção e status fora do conjunto
- **WHEN** a entidade é criada com `direction: "INFLOW"` e `status: "COMPLETED"`
- **THEN** a criação falha com `INVALID_DIRECTION` e `INVALID_TRANSACTION_STATUS`

---

### Requirement: Opcionais ausentes ou vazios viram null e preenchidos são validados
`note`, `creditCardId`, `subcategoryId` e `settledOn` SHALL ser armazenados como `null` quando ausentes ou informados como string vazia. Quando preenchidos, SHALL ser validados, com os códigos: `MOVEMENT_NOTE_TOO_LONG` para observação longa demais, `INVALID_SCHEDULED_TRANSACTION_CREDIT_CARD_ID`, `INVALID_SCHEDULED_TRANSACTION_SUBCATEGORY_ID` e `INVALID_SCHEDULED_TRANSACTION_SETTLED_ON`.

#### Scenario: Opcionais como string vazia
- **WHEN** a entidade é criada com `note: ""`, `creditCardId: ""` e `subcategoryId: ""`
- **THEN** a criação é bem-sucedida com os três atributos iguais a `null`

#### Scenario: Cartão e subcategoria malformados
- **WHEN** a entidade é criada com `creditCardId: "abc"` e `subcategoryId: "abc"`
- **THEN** a criação falha com `INVALID_SCHEDULED_TRANSACTION_CREDIT_CARD_ID` e `INVALID_SCHEDULED_TRANSACTION_SUBCATEGORY_ID`

#### Scenario: Data de efetivação inválida
- **WHEN** a entidade é criada com `status: "SETTLED"` e `settledOn: "31/12/2026"`
- **THEN** a criação falha com `INVALID_SCHEDULED_TRANSACTION_SETTLED_ON`

---

### Requirement: Status e data de efetivação são coerentes
Com `status: SETTLED`, a entidade SHALL exigir `settledOn` e SHALL falhar com `SCHEDULED_TRANSACTION_SETTLED_ON_REQUIRED` quando ele não vier. Com `status: PENDING` ou `CANCELED`, a entidade SHALL normalizar `settledOn` para `null`, sem falhar. A entidade SHALL NOT validar a ordem entre `settledOn` e as datas da ocorrência.

#### Scenario: Efetivada sem data de efetivação
- **WHEN** a entidade é criada com `status: "SETTLED"` e sem `settledOn`
- **THEN** a criação falha com `SCHEDULED_TRANSACTION_SETTLED_ON_REQUIRED`

#### Scenario: Pendente com data de efetivação
- **WHEN** a entidade é criada com `status: "PENDING"` e `settledOn: "2026-09-10"`
- **THEN** a criação é bem-sucedida e `settledOn` é `null`

#### Scenario: Cancelada com data de efetivação
- **WHEN** a entidade é criada com `status: "CANCELED"` e `settledOn: "2026-09-10"`
- **THEN** a criação é bem-sucedida e `settledOn` é `null`

---

### Requirement: Derivação preserva a identidade da ocorrência
Toda nova instância derivada de uma `ScheduledTransaction` SHALL reaplicar a validação e a invariante de efetivação. Uma derivação que altere somente os campos editáveis (`name`, `note`, `value`, `direction`, `accountId`, `creditCardId`, `subcategoryId`, `status`, `expectedOn`, `settledOn`) SHALL preservar `id`, `userId`, `seriesId`, `occurrenceIndex` e `occurrenceOn`.

#### Scenario: Efetivar por derivação
- **WHEN** uma ocorrência pendente é derivada com `status: "SETTLED"` e `settledOn: "2026-09-10"`
- **THEN** a nova instância é válida, tem a situação efetivada e mantém `id`, `seriesId`, `occurrenceIndex` e `occurrenceOn` da original

#### Scenario: Derivação que quebra a invariante
- **WHEN** uma ocorrência é derivada com `status: "SETTLED"` e sem `settledOn`
- **THEN** a derivação falha com `SCHEDULED_TRANSACTION_SETTLED_ON_REQUIRED`

---

### Requirement: ScheduledTransaction não tem exclusão lógica e é única por ocorrência
A entidade SHALL NOT oferecer exclusão lógica: a linha gravada de uma ocorrência é uma sobreposição do usuário sobre a série, e desfazê-la SHALL remover o registro. A chave de negócio do agregado SHALL ser o par `(seriesId, occurrenceIndex)`: SHALL existir no máximo uma ocorrência gravada por par.

#### Scenario: Sem exclusão lógica
- **WHEN** a entidade é inspecionada
- **THEN** ela não oferece operação de exclusão lógica

---

### Requirement: ScheduledTransactionErrors reúne só os códigos próprios do agregado
`ScheduledTransactionErrors` SHALL conter exatamente `SCHEDULED_TRANSACTION_NOT_FOUND`, `SCHEDULED_TRANSACTION_SETTLED_ON_REQUIRED`, `INVALID_SCHEDULED_TRANSACTION_SERIES_ID`, `INVALID_SCHEDULED_TRANSACTION_OCCURRENCE_INDEX`, `INVALID_SCHEDULED_TRANSACTION_ACCOUNT_ID`, `INVALID_SCHEDULED_TRANSACTION_CREDIT_CARD_ID`, `INVALID_SCHEDULED_TRANSACTION_SUBCATEGORY_ID`, `INVALID_SCHEDULED_TRANSACTION_OCCURRENCE_ON`, `INVALID_SCHEDULED_TRANSACTION_EXPECTED_ON` e `INVALID_SCHEDULED_TRANSACTION_SETTLED_ON`, com valor igual à chave e sem tradução. SHALL NOT repetir códigos do núcleo `movement`, dos VOs nem do agregado `transaction`.

#### Scenario: Conteúdo de ScheduledTransactionErrors
- **WHEN** as chaves de `ScheduledTransactionErrors` são inspecionadas
- **THEN** existem exatamente os dez códigos listados, cada um com valor igual ao próprio nome

---

### Requirement: Contrato de repositório com exclusão física
`ScheduledTransactionRepository` SHALL estender o `CrudRepository` do `@poupig/shared` (`create`, `update`, `findById`, `delete`), sem operação extra. `findById` SHALL devolver falha com `SCHEDULED_TRANSACTION_NOT_FOUND` quando o registro não existe. `delete` SHALL remover o registro fisicamente. Localizar uma ocorrência pelo par `(seriesId, occurrenceIndex)` SHALL ser papel das consultas de leitura, e não do repositório.

#### Scenario: Busca de id inexistente
- **WHEN** `findById` é chamado com um id que não existe
- **THEN** o resultado é falha com `SCHEDULED_TRANSACTION_NOT_FOUND`

#### Scenario: Exclusão física
- **WHEN** `delete` é chamado com o id de uma ocorrência gravada
- **THEN** `findById` com esse id passa a falhar com `SCHEDULED_TRANSACTION_NOT_FOUND` e o par `(seriesId, occurrenceIndex)` fica livre para uma nova gravação

---

### Requirement: ScheduledTransactionDTO projeta a ocorrência com a série e os vínculos
`ScheduledTransactionDTO` SHALL conter `id`, `userId`, `seriesId`, `occurrenceIndex`, `occurrenceOn`, `name`, `note`, `value`, `direction`, `accountId`, `accountName`, `creditCardId`, `creditCardName`, `subcategoryId`, `subcategoryName`, `categoryName`, `status`, `expectedOn`, `settledOn`, `createdAt`, `updatedAt`, `materialized`, `seriesName`, `seriesKind` e `installments`. `id` SHALL ser sempre `string`, inclusive na ocorrência ainda não gravada; `value` SHALL ser `number`; as datas SHALL estar em `YYYY-MM-DD`; `createdAt` e `updatedAt` SHALL ser `Date`; todo opcional ausente SHALL ser `null`. `materialized` SHALL ser `true` somente quando a ocorrência está gravada. `installments` SHALL ser o da série (preenchido só em parcelamento). O DTO SHALL NOT expor `deletedAt`.

#### Scenario: Ocorrência gravada de um parcelamento
- **WHEN** a parcela de índice 2 de um parcelamento de 12 chamado "Notebook" é lida do armazenamento
- **THEN** `materialized` é `true`, `occurrenceIndex` é `2`, `seriesName` é `"Notebook"`, `seriesKind` é `"CLOSED"` e `installments` é `12`

#### Scenario: Ocorrência de recorrência sem vínculos opcionais
- **WHEN** uma ocorrência de uma recorrência sem cartão, subcategoria e observação é projetada
- **THEN** `installments`, `creditCardName`, `subcategoryName`, `categoryName`, `note` e `settledOn` são `null`

---

### Requirement: Consultas de leitura escopadas pelo usuário e pela série ativa
O agregado SHALL definir `FindScheduledTransactionByOccurrenceQuery`, com `execute(seriesId, occurrenceIndex, userId)` devolvendo `Result<ScheduledTransactionDTO | null>` — `null` quando a ocorrência não está gravada, é de outro usuário ou pertence a uma série excluída logicamente —, e `ListScheduledTransactionsInPeriodQuery`, com `execute({ userId, from, to })` devolvendo `Result<ScheduledTransactionDTO[]>` com as ocorrências gravadas do usuário cuja `expectedOn` **ou** `occurrenceOn` está dentro do período, ignorando as de série excluída, ordenadas por `expectedOn` decrescente e, em empate, por `createdAt` decrescente. A listagem do período SHALL NOT aplicar nenhum outro filtro. Todo resultado das duas consultas SHALL ter `materialized: true`.

#### Scenario: Ocorrência movida para o mês seguinte
- **WHEN** a listagem de setembro de 2026 é executada e existe uma ocorrência gravada com `occurrenceOn: "2026-09-10"` e `expectedOn: "2026-10-02"`
- **THEN** a ocorrência é devolvida

#### Scenario: Ocorrência movida para dentro do mês
- **WHEN** a listagem de outubro de 2026 é executada para a mesma ocorrência
- **THEN** a ocorrência é devolvida

#### Scenario: Série excluída
- **WHEN** a busca pela ocorrência é executada para uma ocorrência gravada de uma série excluída logicamente
- **THEN** o resultado é sucesso com `null`

#### Scenario: Ocorrência de outro usuário
- **WHEN** a busca pela ocorrência é executada com o `userId` de outro usuário
- **THEN** o resultado é sucesso com `null`

---

### Requirement: Geração em memória das ocorrências de uma série
O agregado SHALL oferecer um cálculo puro, sem acesso a armazenamento, que:
- dada uma série e um índice, devolva a data da ocorrência, ou `null` quando o índice não pertence à série (negativo, `>= installments` em parcelamento, ou data posterior à `endDate` em recorrência com fim). Essa SHALL ser a única regra do módulo que decide se uma ocorrência existe;
- dada uma série, um período e um critério de "já gravada", devolva as ocorrências do período que ainda não estão gravadas como entidades `ScheduledTransaction` válidas, cada uma com `id` gerado, `status: PENDING`, `settledOn: null`, `occurrenceOn` e `expectedOn` iguais à data da ocorrência, e `name`, `note`, `value`, `direction`, `accountId`, `creditCardId` e `subcategoryId` copiados da série. Uma série válida SHALL sempre gerar ocorrências válidas; uma falha de validação na geração SHALL interromper a operação em vez de omitir a ocorrência;
- projete uma ocorrência gerada como `ScheduledTransactionDTO` com `materialized: false`, os nomes dos vínculos e o contexto da série (`seriesName`, `seriesKind`, `installments`).

O `id` de uma ocorrência gerada SHALL ser efêmero: gerar o mesmo período de novo SHALL produzir outro `id`. A identidade estável da ocorrência SHALL ser o par `(seriesId, occurrenceIndex)`.

#### Scenario: Data de índice dentro de um parcelamento
- **WHEN** a data do índice 11 é pedida para um parcelamento de 12 com início `2026-09-15` e regra mensal no dia 10
- **THEN** o resultado é `2027-09-10`

#### Scenario: Índice fora de um parcelamento
- **WHEN** a data do índice 12 ou do índice -1 é pedida para um parcelamento de 12
- **THEN** o resultado é `null`

#### Scenario: Índice depois do fim de uma recorrência
- **WHEN** a data do índice 8 é pedida para uma recorrência semanal na segunda-feira com início `2026-09-15` e `endDate: "2026-11-15"`
- **THEN** o resultado é `null`, porque a ocorrência cairia em `2026-11-16`

#### Scenario: Ocorrência já gravada suprimida
- **WHEN** as ocorrências de novembro de 2026 são geradas para uma recorrência semanal com índices 6 a 10 no mês e o índice 8 já está gravado
- **THEN** são geradas as ocorrências dos índices 6, 7, 9 e 10

#### Scenario: Campos copiados da série
- **WHEN** a ocorrência de janeiro de 2027 é gerada para o parcelamento "Notebook" de R$ 250,00, saída, na conta "Nubank" e sem cartão
- **THEN** a entidade tem `occurrenceIndex: 3`, `name: "Notebook"`, `value: 250`, `direction: "OUT"`, a conta "Nubank", `creditCardId: null`, `status: "PENDING"`, `settledOn: null`, `occurrenceOn` e `expectedOn` iguais a `2027-01-10` e um `id` preenchido

#### Scenario: Projeção da ocorrência gerada
- **WHEN** essa ocorrência gerada é projetada
- **THEN** o DTO tem `materialized: false`, `seriesName: "Notebook"`, `seriesKind: "CLOSED"`, `installments: 12` e o `accountName` da série

### Requirement: Consulta das chaves das ocorrências gravadas no período
O agregado SHALL definir `ListMaterializedOccurrenceKeysQuery`, com `execute({ userId, from, to })` devolvendo `Result<{ seriesId, occurrenceIndex }[]>` com o par série e índice de cada ocorrência gravada do usuário cuja `occurrenceOn` está dentro do período inclusivo. A consulta SHALL incluir ocorrências de **qualquer situação**, inclusive `CANCELED`, SHALL ignorar ocorrências de série excluída logicamente e SHALL NOT filtrar pela `expectedOn`. A consulta SHALL NOT devolver valor, datas, nomes nem nenhum outro campo, e SHALL NOT garantir ordem.

#### Scenario: Filtro pela data da ocorrência
- **WHEN** a consulta de setembro de 2026 é executada e existe uma ocorrência gravada com `occurrenceOn: "2026-09-10"` e `expectedOn: "2026-10-02"`
- **THEN** o par dessa ocorrência é devolvido

#### Scenario: Data prevista movida para dentro não conta
- **WHEN** a consulta de outubro de 2026 é executada para a mesma ocorrência
- **THEN** o par não é devolvido

#### Scenario: Ocorrência cancelada
- **WHEN** existe uma ocorrência gravada com `status: CANCELED` e `occurrenceOn` no período
- **THEN** o par dessa ocorrência é devolvido

#### Scenario: Série excluída
- **WHEN** a ocorrência gravada pertence a uma série excluída logicamente
- **THEN** o par não é devolvido

#### Scenario: Ocorrência de outro usuário
- **WHEN** a consulta é executada com o `userId` de outro usuário
- **THEN** o par não é devolvido


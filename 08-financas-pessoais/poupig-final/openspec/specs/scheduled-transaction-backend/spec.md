# scheduled-transaction-backend Specification

## Purpose
Expor as ocorrências de série pela API REST do backend: persistência da ocorrência gravada com unicidade por série e índice, endpoints protegidos endereçados pela ocorrência, conversões de valor e data sem perda e mapeamento dos códigos de domínio para respostas HTTP.
## Requirements
### Requirement: Model ScheduledTransaction mapeado no banco com chave única da ocorrência
O schema do banco SHALL conter a tabela `scheduled_transaction` com colunas em snake_case e os mesmos tipos e tamanhos da tabela de transações (`name` até 100 caracteres, `note` até 500 e anulável, `value` decimal com 14 dígitos e 2 casas, `direction`, `status`, `expected_on` e `settled_on` anulável como data pura, `created_at`, `updated_at`), **sem** `deleted_at`, mais `series_id`, `occurrence_index` inteiro e `occurrence_on` como data pura. SHALL existir restrição única sobre (`series_id`, `occurrence_index`). As relações SHALL ser: série, usuário e conta obrigatórios com exclusão em cascata; cartão e subcategoria opcionais com anulação na exclusão. SHALL existir índices por (`user_id`, `expected_on`), (`user_id`, `occurrence_on`), `account_id`, `credit_card_id` e `subcategory_id`. A migração SHALL se chamar `add_scheduled_transaction`. Nos models de outros módulos, a única alteração permitida SHALL ser o campo de relação inversa com as ocorrências.

#### Scenario: Migração aplicada
- **WHEN** as migrações são aplicadas em um banco na versão anterior
- **THEN** a migração `add_scheduled_transaction` cria a tabela `scheduled_transaction`, a restrição única, as chaves estrangeiras e os índices, sem alterar colunas das tabelas existentes

#### Scenario: Mesma ocorrência gravada duas vezes em paralelo
- **WHEN** duas requisições simultâneas tentam inserir uma ocorrência com o mesmo `series_id` e `occurrence_index`
- **THEN** o banco aceita somente uma das inserções

#### Scenario: Exclusão física de subcategoria
- **WHEN** uma subcategoria referenciada por uma ocorrência gravada é removida fisicamente do banco
- **THEN** a ocorrência permanece com `subcategory_id` nulo

---

### Requirement: Persistência da ocorrência preserva valor e datas e remove fisicamente
O adapter de persistência SHALL implementar o repositório de ocorrências gravando todos os campos em `create` e `update`; `findById` SHALL falhar com `SCHEDULED_TRANSACTION_NOT_FOUND` quando o registro não existir; `delete` SHALL remover o registro. As consultas de leitura SHALL filtrar pelo usuário e ignorar ocorrências de série excluída logicamente. O valor decimal SHALL ser convertido para `number` e as datas puras de e para `YYYY-MM-DD` em UTC, reaproveitando as conversões e a seleção de nomes de vínculo já usadas pelas transações e séries, sem alterar nenhuma resposta de `/transactions` ou `/transaction-series`. O adapter de séries SHALL oferecer a consulta de séries ativas no período, filtrando pelo usuário e por `deletedAt` nulo.

#### Scenario: Valor sai como número
- **WHEN** uma ocorrência gravada com `value: 250.5` é consultada pela API
- **THEN** o JSON contém `"value": 250.5` (número, não string)

#### Scenario: Datas puras sem deslocamento de fuso
- **WHEN** uma ocorrência é gravada com `expectedOn: "2026-10-01"` em um servidor com fuso diferente de UTC
- **THEN** a consulta devolve `"expectedOn": "2026-10-01"` e o `occurrenceOn` calculado, também sem deslocamento

---

### Requirement: Endpoints de ocorrência protegidos e endereçados pela ocorrência
Todas as rotas em `/scheduled-transactions` SHALL exigir autenticação JWT e SHALL identificar o dono sempre pelo usuário autenticado. O recurso SHALL ser endereçado por `/scheduled-transactions/:seriesId/:occurrenceIndex`. SHALL NOT existir `POST` nem listagem em `/scheduled-transactions`. `occurrenceIndex` não numérico SHALL ser tratado como índice inválido pelo domínio, nunca convertido silenciosamente.

#### Scenario: Acesso sem token
- **WHEN** qualquer rota de `/scheduled-transactions` é chamada sem token
- **THEN** a resposta é `401`

#### Scenario: Sem criação por POST
- **WHEN** `POST /scheduled-transactions` é chamado com token válido
- **THEN** a resposta é `404`

---

### Requirement: GET abre a ocorrência gravada ou gerada
`GET /scheduled-transactions/:seriesId/:occurrenceIndex` SHALL responder o DTO da ocorrência: a gravada (`materialized: true`) quando existir, ou a gerada em memória (`materialized: false`) quando não, sem gravar nada. Série inexistente, excluída ou de outro usuário SHALL responder `404` com `SCHEDULED_TRANSACTION_SERIES_NOT_FOUND`; índice que não pertence à série SHALL responder `404` com `SCHEDULED_TRANSACTION_OCCURRENCE_NOT_FOUND`.

#### Scenario: Ocorrência ainda não gravada
- **WHEN** `GET /scheduled-transactions/:seriesId/0` é chamado para um parcelamento recém-criado
- **THEN** a resposta traz `materialized: false`, `status: "PENDING"`, `seriesName`, `seriesKind`, `installments` e `id` preenchido

#### Scenario: Índice fora da série
- **WHEN** `GET /scheduled-transactions/:seriesId/12` é chamado para um parcelamento de 12
- **THEN** a resposta é `404` com `SCHEDULED_TRANSACTION_OCCURRENCE_NOT_FOUND`

#### Scenario: Série de outro usuário
- **WHEN** `GET /scheduled-transactions/:seriesId/0` é chamado com a série de outro usuário
- **THEN** a resposta é `404` com `SCHEDULED_TRANSACTION_SERIES_NOT_FOUND`

---

### Requirement: PUT grava a ocorrência de forma idempotente
`PUT /scheduled-transactions/:seriesId/:occurrenceIndex` SHALL gravar a ocorrência — inserindo na primeira vez e alterando nas seguintes — e responder `{ id }` com o id do registro gravado. O corpo SHALL aceitar `id` e os campos editáveis (`name`, `note`, `value`, `direction`, `accountId`, `creditCardId`, `subcategoryId`, `status`, `expectedOn`, `settledOn`). `seriesId` e `occurrenceIndex` SHALL vir somente da rota; `seriesId`, `occurrenceIndex`, `occurrenceOn` e `userId` enviados no corpo SHALL ser ignorados. `value` enviado como string numérica SHALL ser aceito; string não numérica SHALL ser reprovada pelo domínio. `direction` e `status` SHALL ser repassados crus para o domínio reprovar.

#### Scenario: Primeira gravação
- **WHEN** `PUT /scheduled-transactions/:seriesId/0` é chamado com o `id` recebido no `GET` e `value: 300`
- **THEN** a resposta traz `{ id }` igual ao enviado e um novo `GET` traz `materialized: true` e `value: 300`

#### Scenario: Gravação repetida
- **WHEN** o mesmo `PUT` é chamado de novo com `status: "CANCELED"`
- **THEN** a resposta traz o mesmo `{ id }` e continua existindo uma única ocorrência gravada para o par

#### Scenario: Campos de identidade no corpo ignorados
- **WHEN** o `PUT` é chamado com `occurrenceOn`, `occurrenceIndex` e `userId` diferentes no corpo
- **THEN** a ocorrência gravada mantém o índice da rota, a data calculada pela série e o usuário autenticado

#### Scenario: Valor não numérico
- **WHEN** o `PUT` é chamado com `value: "abc"`
- **THEN** a resposta é `400` contendo `INVALID_MONEY_AMOUNT`

---

### Requirement: DELETE reverte a ocorrência para a série
`DELETE /scheduled-transactions/:seriesId/:occurrenceIndex` SHALL remover fisicamente a ocorrência gravada do usuário e responder com sucesso. Em seguida, `GET` na mesma rota SHALL devolver a ocorrência gerada (`materialized: false`). Ocorrência não gravada, de outro usuário ou de série excluída SHALL responder `404` com `SCHEDULED_TRANSACTION_NOT_FOUND`.

#### Scenario: Reverter e abrir de novo
- **WHEN** `DELETE` é chamado para uma ocorrência gravada e, em seguida, `GET` na mesma rota
- **THEN** a reversão responde com sucesso e a busca traz `materialized: false` com os valores da série

#### Scenario: Reverter ocorrência não gravada
- **WHEN** `DELETE` é chamado para uma ocorrência que nunca foi gravada
- **THEN** a resposta é `404` com `SCHEDULED_TRANSACTION_NOT_FOUND`

---

### Requirement: Falhas de ocorrência mapeadas para respostas HTTP
A API SHALL responder `404` quando os códigos de falha contiverem `SCHEDULED_TRANSACTION_NOT_FOUND`, `SCHEDULED_TRANSACTION_SERIES_NOT_FOUND` ou `SCHEDULED_TRANSACTION_OCCURRENCE_NOT_FOUND`, e `400` com a lista de códigos para qualquer outra falha, inclusive `SCHEDULED_TRANSACTION_ACCOUNT_NOT_FOUND`, `SCHEDULED_TRANSACTION_CREDIT_CARD_NOT_FOUND` e `SCHEDULED_TRANSACTION_SUBCATEGORY_NOT_FOUND`. O backend SHALL NOT traduzir códigos de erro.

#### Scenario: Efetivada sem data
- **WHEN** o `PUT` é chamado com `status: "SETTLED"` e sem `settledOn`
- **THEN** a resposta é `400` contendo `SCHEDULED_TRANSACTION_SETTLED_ON_REQUIRED`

#### Scenario: Conta de outro usuário
- **WHEN** o `PUT` é chamado com o `accountId` de uma conta de outro usuário
- **THEN** a resposta é `400` contendo `SCHEDULED_TRANSACTION_ACCOUNT_NOT_FOUND`

---

### Requirement: Testes de integração via Rest Client cobrem ocorrências e extrato
O módulo SHALL ter os arquivos `scheduled-transaction.integration.http` e `statement.integration.http` no formato do Rest Client cobrindo: criar um parcelamento de 12 e ver as ocorrências do mês no extrato sem nenhuma gravação; abrir uma ocorrência gerada (`materialized: false`); alterar o valor de uma ocorrência e conferir que o extrato traz a versão gravada, e uma só; mover a ocorrência para o mês seguinte e conferir que ela sai de um mês, entra no outro e não é regerada; efetivar; cancelar; reverter para a série e conferir a ocorrência gerada de volta; alterar o valor da série por `PUT /transaction-series/:id` e conferir que as geradas trazem o valor novo enquanto as gravadas mantêm o delas; excluir a série e conferir que as ocorrências dela somem do extrato; índice fora da série (404); série de outro usuário (404); extrato sem `from`/`to` (400); e acesso sem token (401).

#### Scenario: Roteiro de integração executável
- **WHEN** as requisições dos arquivos `.http` são executadas em ordem contra o backend com banco migrado
- **THEN** cada resposta tem o status e o conteúdo esperados descritos na própria requisição


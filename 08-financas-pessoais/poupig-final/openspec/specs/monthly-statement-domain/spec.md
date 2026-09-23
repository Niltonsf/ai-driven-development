# monthly-statement-domain Specification

## Purpose
Definir o modelo de leitura do extrato mensal unificado: a entrada comum a transações avulsas e ocorrências de série, a regra única de filtros, a supressão das ocorrências já gravadas ou movidas, a ordenação e o teto de entradas por mês.
## Requirements
### Requirement: Entrada do extrato unifica avulsas e ocorrências
O extrato SHALL devolver entradas de um único formato, `StatementEntryDTO`, com `id` (sempre `string`), `kind` (`TRANSACTION` ou `SCHEDULED`), os campos comuns `name`, `note`, `value`, `direction`, `accountId`, `accountName`, `creditCardId`, `creditCardName`, `subcategoryId`, `subcategoryName`, `categoryName`, `status`, `expectedOn` e `settledOn`, e o bloco da série `seriesId`, `seriesName`, `seriesKind`, `occurrenceIndex`, `occurrenceOn` e `installments`. Na entrada `TRANSACTION`, todo o bloco da série SHALL ser `null`. Na entrada `SCHEDULED`, `seriesId`, `seriesName`, `seriesKind`, `occurrenceIndex` e `occurrenceOn` SHALL estar preenchidos. O `id` SHALL ser a chave da entrada na resposta; para uma ocorrência ainda não gravada ele SHALL ser efêmero, e o endereço da ocorrência SHALL ser o par `(seriesId, occurrenceIndex)`. A série em si SHALL NOT aparecer como entrada.

#### Scenario: Entrada de transação avulsa
- **WHEN** uma transação avulsa é convertida em entrada do extrato
- **THEN** `kind` é `"TRANSACTION"`, os campos comuns são os da transação e `seriesId`, `seriesName`, `seriesKind`, `occurrenceIndex`, `occurrenceOn` e `installments` são `null`

#### Scenario: Entrada de ocorrência
- **WHEN** a parcela de índice 2 de um parcelamento de 12 é convertida em entrada do extrato
- **THEN** `kind` é `"SCHEDULED"`, `occurrenceIndex` é `2`, `installments` é `12` e `seriesId`, `seriesName`, `seriesKind` e `occurrenceOn` estão preenchidos

---

### Requirement: Uma única regra de filtros do extrato
O extrato SHALL aceitar os filtros opcionais `search` (parte do nome, sem diferenciar maiúsculas de minúsculas), `direction`, `status`, `accountId`, `creditCardId` e `onlyCreditCard` (somente entradas com algum cartão). Quando `creditCardId` vier, `onlyCreditCard` SHALL ser ignorado. A mesma semântica SHALL valer para transações avulsas e para ocorrências — gravadas ou geradas —, definida em uma única regra pura para as entradas em memória, equivalente ao filtro já aplicado às transações avulsas no armazenamento.

#### Scenario: Busca sem diferenciar maiúsculas
- **WHEN** o filtro é `search: "netf"` e há entradas "Netflix" e "Mercado"
- **THEN** somente "Netflix" atende ao filtro

#### Scenario: Filtros isolados
- **WHEN** cada filtro `direction: "IN"`, `status: "SETTLED"`, `accountId` e `creditCardId` é aplicado isoladamente
- **THEN** somente as entradas com o valor correspondente atendem ao filtro

#### Scenario: Somente cartão
- **WHEN** o filtro é `onlyCreditCard: true`
- **THEN** somente as entradas com `creditCardId` preenchido atendem ao filtro

#### Scenario: Cartão específico vale sobre somente cartão
- **WHEN** o filtro traz `creditCardId` do cartão "Nubank" e `onlyCreditCard: true`
- **THEN** somente as entradas do cartão "Nubank" atendem ao filtro

---

### Requirement: Extrato do período junta avulsas, ocorrências gravadas e ocorrências geradas
O caso de uso `FindMonthlyStatement` SHALL receber `userId`, `from`, `to` e os filtros, e SHALL devolver o extrato do período como `PaginatedResultDTO<StatementEntryDTO>` com `page: 1`, `totalPages: 1`, `pageSize` igual ao teto e `total` igual à quantidade de entradas devolvidas. `from` e `to` SHALL ser datas `YYYY-MM-DD` válidas com `from <= to`; caso contrário, SHALL falhar com `INVALID_STATEMENT_PERIOD`, que SHALL ser o único código de `FindMonthlyStatementErrors`. O extrato SHALL conter:
- as transações avulsas não excluídas do usuário com `expectedOn` no período e que atendem aos filtros;
- as ocorrências gravadas do usuário, de séries não excluídas, com `expectedOn` no período e que atendem aos filtros;
- as ocorrências geradas das séries ativas no período que ainda não estão gravadas e que atendem aos filtros.

Uma ocorrência gravada cuja `occurrenceOn` está no período SHALL suprimir a geração dessa ocorrência mesmo quando a `expectedOn` dela foi movida para fora do período, e mesmo quando ela não atende aos filtros. Uma ocorrência gerada SHALL ter sempre `status: PENDING`.

#### Scenario: Período inválido
- **WHEN** o extrato é pedido sem `from`, com `from: "2026-09-31"` ou com `from: "2026-09-30"` e `to: "2026-09-01"`
- **THEN** o resultado é falha com `INVALID_STATEMENT_PERIOD`

#### Scenario: Mês só com avulsas
- **WHEN** o usuário não tem séries e tem duas transações avulsas em setembro de 2026
- **THEN** o extrato de setembro tem as duas entradas `TRANSACTION` e `total: 2`

#### Scenario: Mês só com ocorrências geradas
- **WHEN** o usuário não tem transações avulsas, tem um parcelamento mensal no dia 10 com início `2026-09-15` e nenhuma ocorrência gravada
- **THEN** o extrato de outubro de 2026 tem uma entrada `SCHEDULED` com `occurrenceIndex: 0` e `expectedOn: "2026-10-10"`, e nada foi gravado

#### Scenario: Mês misto
- **WHEN** outubro de 2026 tem uma transação avulsa e uma ocorrência gerada
- **THEN** o extrato de outubro traz as duas entradas, uma de cada `kind`

#### Scenario: Ocorrência gravada suprime a gerada
- **WHEN** a ocorrência de índice 0 de outubro de 2026 está gravada com `value: 300`
- **THEN** o extrato de outubro traz uma única entrada para esse par, com `value: 300`

#### Scenario: Ocorrência movida para o mês seguinte
- **WHEN** a ocorrência com `occurrenceOn: "2026-10-10"` está gravada com `expectedOn: "2026-11-02"`
- **THEN** o extrato de outubro não traz essa ocorrência nem uma versão gerada dela, e o extrato de novembro traz a versão gravada

#### Scenario: Filtro de situação exclui as geradas
- **WHEN** o extrato de outubro de 2026 é pedido com `status: "SETTLED"` e o mês tem uma ocorrência gerada e uma transação avulsa efetivada
- **THEN** somente a transação avulsa efetivada é devolvida

#### Scenario: Filtro de conta vale para os dois tipos
- **WHEN** o extrato é pedido com o `accountId` da conta "Itaú" e o mês tem avulsas e ocorrências nas contas "Itaú" e "Nubank"
- **THEN** somente as avulsas e as ocorrências da conta "Itaú" são devolvidas

#### Scenario: Série excluída some do extrato
- **WHEN** uma série com ocorrências gravadas e geradas no mês é excluída logicamente
- **THEN** o extrato do mês não traz nenhuma ocorrência dessa série

---

### Requirement: Ordenação estável e teto de entradas
As entradas do extrato SHALL ser ordenadas por `expectedOn` decrescente com ordenação estável sobre a sequência: transações avulsas (na ordem da consulta delas), depois ocorrências gravadas (na ordem da consulta delas), depois ocorrências geradas. Em empate de `expectedOn`, SHALL prevalecer essa sequência. O extrato SHALL devolver no máximo `STATEMENT_MAX_ENTRIES = 500` entradas; o excedente SHALL ser descartado depois da ordenação, sem sinalização extra na resposta.

#### Scenario: Empate de data
- **WHEN** em `2026-10-10` existem uma transação avulsa, uma ocorrência gravada e uma ocorrência gerada
- **THEN** as três aparecem nessa ordem: avulsa, gravada, gerada

#### Scenario: Datas diferentes
- **WHEN** existem uma ocorrência gerada em `2026-10-20` e uma avulsa em `2026-10-05`
- **THEN** a ocorrência gerada aparece antes da avulsa

#### Scenario: Corte no teto
- **WHEN** o período teria 520 entradas
- **THEN** o extrato devolve as 500 primeiras na ordenação, com `pageSize: 500`, `page: 1` e `totalPages: 1`

---

### Requirement: Extrato coberto por testes com dublês das consultas
O modelo de leitura do extrato SHALL ter testes, sem banco de dados e sem repositório, que usam dublês das três consultas de que o extrato depende (transações avulsas, ocorrências gravadas do período e séries ativas), cobrindo: cada filtro isolado e a precedência de `creditCardId` sobre `onlyCreditCard`; período inválido; mês só com avulsas; mês só com geradas; mês misto; gravada suprimindo a gerada; ocorrência movida para outro mês; filtro de situação excluindo as geradas; filtro de conta nos dois tipos; ordenação estável; e corte no teto.

#### Scenario: Suíte do extrato verde
- **WHEN** os testes de `@poupig/transaction` são executados
- **THEN** todos os cenários listados passam sem depender de banco de dados


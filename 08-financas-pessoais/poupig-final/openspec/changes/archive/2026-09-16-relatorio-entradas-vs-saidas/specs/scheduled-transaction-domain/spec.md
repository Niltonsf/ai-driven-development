## ADDED Requirements

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

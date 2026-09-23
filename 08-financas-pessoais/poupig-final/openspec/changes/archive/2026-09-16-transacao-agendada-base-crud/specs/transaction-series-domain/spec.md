## ADDED Requirements

### Requirement: Consulta de séries ativas em um período
O agregado SHALL definir `ListActiveTransactionSeriesQuery`, com `execute({ userId, from, to })` devolvendo `Result<TransactionSeriesDTO[]>` com as séries do usuário que não estão excluídas, têm `startDate <= to` e têm `endDate` nulo ou `endDate >= from`. A consulta SHALL NOT paginar, SHALL devolver as séries em ordem determinística e SHALL NOT calcular ocorrências. SHALL NOT existir caso de uso para essa consulta.

#### Scenario: Série que começa depois do período
- **WHEN** a consulta é executada para setembro de 2026 e a série tem `startDate: "2026-10-01"`
- **THEN** a série não é devolvida

#### Scenario: Série que terminou antes do período
- **WHEN** a consulta é executada para setembro de 2026 e a série tem `endDate: "2026-08-31"`
- **THEN** a série não é devolvida

#### Scenario: Recorrência sem data fim
- **WHEN** a consulta é executada para setembro de 2026 e a série tem `startDate: "2020-01-06"` e `endDate: null`
- **THEN** a série é devolvida

#### Scenario: Série excluída ou de outro usuário
- **WHEN** a consulta é executada e existe uma série excluída logicamente do usuário e uma série ativa de outro usuário no período
- **THEN** nenhuma das duas é devolvida

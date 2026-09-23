## ADDED Requirements

### Requirement: Ocorrências de uma série dentro de um período
O cálculo da agenda SHALL devolver, para uma data de início, uma regra e um período (`from` e `to`, inclusivos, em `YYYY-MM-DD`), a lista de ocorrências `{ index, date }` cuja data está dentro do período, em ordem crescente de índice. O cálculo SHALL aceitar opcionalmente `installments` — e então SHALL NOT devolver índice `>= installments` — e `endDate` — e então SHALL NOT devolver data posterior a `endDate`. Índice e data de cada ocorrência SHALL ser exatamente os da n-ésima ocorrência já definida para a regra, inclusive com o grampo de fim de mês. Período sem ocorrência SHALL devolver lista vazia. O primeiro índice do período SHALL ser encontrado pela diferença de semanas, meses ou anos em relação à primeira ocorrência, dividida pelo intervalo, e SHALL NOT ser encontrado percorrendo as ocorrências desde o índice 0: o custo SHALL depender da quantidade de ocorrências dentro do período, e não de quanto tempo a série já tem.

#### Scenario: Período antes do início da série
- **WHEN** as ocorrências de setembro de 2026 são calculadas com início `2026-09-15`, regra mensal no dia 10 e 12 parcelas
- **THEN** o resultado é uma lista vazia

#### Scenario: Período depois da última parcela
- **WHEN** as ocorrências de outubro de 2027 são calculadas com início `2026-09-15`, regra mensal no dia 10 e 12 parcelas
- **THEN** o resultado é uma lista vazia

#### Scenario: Período no meio da série
- **WHEN** as ocorrências de janeiro de 2027 são calculadas com início `2026-09-15`, regra mensal no dia 10 e 12 parcelas
- **THEN** o resultado é `[{ index: 3, date: "2027-01-10" }]`

#### Scenario: Semanal com quatro e com cinco ocorrências no mês
- **WHEN** as ocorrências de outubro e de novembro de 2026 são calculadas com início `2026-09-15` e regra semanal a cada 1 na segunda-feira
- **THEN** outubro tem os índices 2 a 5 (`2026-10-05`, `2026-10-12`, `2026-10-19`, `2026-10-26`) e novembro tem os índices 6 a 10 (`2026-11-02` a `2026-11-30`)

#### Scenario: Semanal a cada 2 semanas
- **WHEN** as ocorrências de novembro e de dezembro de 2026 são calculadas com início `2026-09-15` e regra semanal a cada 2 na segunda-feira
- **THEN** novembro tem `[{ index: 3, date: "2026-11-02" }, { index: 4, date: "2026-11-16" }, { index: 5, date: "2026-11-30" }]` e dezembro tem `[{ index: 6, date: "2026-12-14" }, { index: 7, date: "2026-12-28" }]`

#### Scenario: Mensal a cada 3 meses caindo e não caindo no mês
- **WHEN** as ocorrências de agosto e de setembro de 2026 são calculadas com início `2026-01-20` e regra mensal a cada 3 no dia 15
- **THEN** agosto tem `[{ index: 2, date: "2026-08-15" }]` e setembro tem lista vazia

#### Scenario: Anual
- **WHEN** as ocorrências de março e de abril de 2027 são calculadas com início `2026-01-01` e regra anual em 10 de março
- **THEN** março tem `[{ index: 1, date: "2027-03-10" }]` e abril tem lista vazia

#### Scenario: Dia 31 em mês de 30 dias
- **WHEN** as ocorrências de junho de 2026 são calculadas com início `2026-04-01` e regra mensal no dia 31
- **THEN** o resultado é `[{ index: 2, date: "2026-06-30" }]`

#### Scenario: Parcelamento que acaba no meio do mês
- **WHEN** as ocorrências de novembro de 2026 são calculadas com início `2026-09-15`, regra semanal a cada 1 na segunda-feira e 8 parcelas
- **THEN** o resultado é `[{ index: 6, date: "2026-11-02" }, { index: 7, date: "2026-11-09" }]`

#### Scenario: Recorrência com data fim no meio do mês
- **WHEN** as ocorrências de novembro de 2026 são calculadas com início `2026-09-15`, regra semanal a cada 1 na segunda-feira e data fim `2026-11-15`
- **THEN** o resultado é `[{ index: 6, date: "2026-11-02" }, { index: 7, date: "2026-11-09" }]`

#### Scenario: Série antiga não recalcula desde o início
- **WHEN** as ocorrências de setembro de 2026 são calculadas com início `2020-01-06` e regra semanal a cada 1 na segunda-feira
- **THEN** o resultado tem os índices 348 a 351 (`2026-09-07`, `2026-09-14`, `2026-09-21`, `2026-09-28`), e nenhuma ocorrência anterior ao período é calculada

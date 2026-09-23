# recurrence-schedule Specification

## Purpose
Descrever onde caem as ocorrências de uma série de transações: a regra de recorrência (unidade, intervalo e âncora) com validação normalizadora e o cálculo determinístico da agenda, reutilizável pela geração futura das ocorrências.
## Requirements
### Requirement: Conjuntos fechados de frequência e dia da semana
O módulo SHALL definir `FrequencyUnit` com exatamente `WEEK`, `MONTH` e `YEAR`, e `DayOfWeek` numérico no padrão ISO-8601, com a semana começando na segunda: `MONDAY = 1`, `TUESDAY = 2`, `WEDNESDAY = 3`, `THURSDAY = 4`, `FRIDAY = 5`, `SATURDAY = 6` e `SUNDAY = 7`. Cada conjunto SHALL ter um type guard: `isFrequencyUnit` SHALL aceitar somente os três valores; `isDayOfWeek` SHALL aceitar somente números inteiros de 1 a 7 e SHALL NOT aceitar os nomes do enum nem números em string. Esses conjuntos SHALL NOT ficar no núcleo `movement`.

#### Scenario: Dias da semana válidos
- **WHEN** `isDayOfWeek` é chamado com cada número de 1 a 7
- **THEN** todos são aceitos

#### Scenario: Dias da semana inválidos
- **WHEN** `isDayOfWeek` é chamado com `0`, `8`, `1.5`, `"MONDAY"` ou `"1"`
- **THEN** todos são reprovados

#### Scenario: Unidade de frequência
- **WHEN** `isFrequencyUnit` é chamado com `"WEEK"`, `"MONTH"`, `"YEAR"`, `"DAY"` e `"month"`
- **THEN** os três primeiros são aceitos e os dois últimos reprovados

---

### Requirement: Regra de recorrência validada pela unidade escolhida
A regra de recorrência SHALL ser uma união discriminada por `unit`: `WEEK` com `interval` e `weekDay`; `MONTH` com `interval` e `dayOfMonth`; `YEAR` com `interval`, `month` e `dayOfMonth`. A validação SHALL receber uma entrada crua, com todos os campos opcionais e os números aceitos como número ou como string numérica, e SHALL devolver a regra normalizada com números e **somente** as âncoras da unidade escolhida. As falhas SHALL ser acumuladas com os códigos:
- `unit` fora do conjunto: `INVALID_RECURRENCE_FREQUENCY_UNIT`
- `interval` ausente, não inteiro, menor que 1 ou maior que 99: `INVALID_RECURRENCE_INTERVAL`
- `WEEK` com `weekDay` ausente ou fora de 1..7: `INVALID_RECURRENCE_WEEK_DAY`
- `MONTH` ou `YEAR` com `dayOfMonth` ausente, não inteiro ou fora de 1..31: `INVALID_RECURRENCE_DAY_OF_MONTH`
- `YEAR` com `month` ausente, não inteiro ou fora de 1..12: `INVALID_RECURRENCE_MONTH`

Âncora de outra unidade enviada junto SHALL ser descartada, sem falhar. Um dia que não existe no mês escolhido (por exemplo 30 de fevereiro) SHALL ser aceito na regra anual, porque o cálculo o grampeia. O teto do intervalo SHALL ser exportado pelo módulo. Os cinco códigos SHALL ficar reunidos em um objeto de erros próprio da regra, com valor igual à chave.

#### Scenario: Regra semanal válida
- **WHEN** a regra é validada com `{ unit: "WEEK", interval: 2, weekDay: 1 }`
- **THEN** o resultado é sucesso com `{ unit: "WEEK", interval: 2, weekDay: 1 }`

#### Scenario: Números vindos como string
- **WHEN** a regra é validada com `{ unit: "MONTH", interval: "3", dayOfMonth: "15" }`
- **THEN** o resultado é sucesso com `{ unit: "MONTH", interval: 3, dayOfMonth: 15 }`

#### Scenario: Regra anual válida
- **WHEN** a regra é validada com `{ unit: "YEAR", interval: 1, month: 3, dayOfMonth: 10 }`
- **THEN** o resultado é sucesso com os três campos numéricos preservados

#### Scenario: Dia inexistente no mês da regra anual
- **WHEN** a regra é validada com `{ unit: "YEAR", interval: 1, month: 2, dayOfMonth: 30 }`
- **THEN** o resultado é sucesso

#### Scenario: Âncora de outra unidade descartada
- **WHEN** a regra é validada com `{ unit: "MONTH", interval: 1, dayOfMonth: 5, weekDay: 3, month: 7 }`
- **THEN** o resultado é sucesso com `{ unit: "MONTH", interval: 1, dayOfMonth: 5 }`, sem `weekDay` e sem `month`

#### Scenario: Âncora faltando para a unidade
- **WHEN** a regra é validada com `{ unit: "MONTH", interval: 1 }`
- **THEN** o resultado é falha com `INVALID_RECURRENCE_DAY_OF_MONTH`

#### Scenario: Semanal sem dia da semana válido
- **WHEN** a regra é validada com `{ unit: "WEEK", interval: 1, weekDay: 8 }`
- **THEN** o resultado é falha com `INVALID_RECURRENCE_WEEK_DAY`

#### Scenario: Anual sem mês válido
- **WHEN** a regra é validada com `{ unit: "YEAR", interval: 1, month: 13, dayOfMonth: 10 }`
- **THEN** o resultado é falha com `INVALID_RECURRENCE_MONTH`

#### Scenario: Intervalo inválido
- **WHEN** a regra é validada com `interval` igual a `0`, `-1`, `1.5`, `100` ou `"abc"`
- **THEN** cada validação falha com `INVALID_RECURRENCE_INTERVAL`

#### Scenario: Intervalo no teto
- **WHEN** a regra é validada com `{ unit: "WEEK", interval: 99, weekDay: 5 }`
- **THEN** o resultado é sucesso

#### Scenario: Unidade fora do conjunto
- **WHEN** a regra é validada com `{ unit: "DAY", interval: 1 }`
- **THEN** o resultado é falha com `INVALID_RECURRENCE_FREQUENCY_UNIT`

---

### Requirement: Primeira ocorrência casa a âncora a partir da data de início
A primeira ocorrência SHALL ser a primeira data maior ou igual à data de início que casa com a âncora da regra; a data de início SHALL NOT ser, por si só, uma ocorrência. No cálculo da primeira ocorrência, um dia inexistente no mês SHALL ser tratado como o último dia daquele mês.

#### Scenario: Âncora mensal ainda não passou
- **WHEN** a primeira ocorrência é calculada com início `2026-01-10` e regra mensal no dia 15
- **THEN** o resultado é `2026-01-15`

#### Scenario: Âncora mensal já passou
- **WHEN** a primeira ocorrência é calculada com início `2026-01-20` e regra mensal no dia 15
- **THEN** o resultado é `2026-02-15`

#### Scenario: Início no próprio dia da âncora
- **WHEN** a primeira ocorrência é calculada com início `2026-01-15` e regra mensal no dia 15
- **THEN** o resultado é `2026-01-15`

#### Scenario: Semanal a partir de uma terça-feira
- **WHEN** a primeira ocorrência é calculada com início `2026-09-15` (terça-feira) e regra semanal na sexta-feira (`5`)
- **THEN** o resultado é `2026-09-18`

#### Scenario: Anual cuja data já passou no ano
- **WHEN** a primeira ocorrência é calculada com início `2026-09-15` e regra anual em 10 de setembro
- **THEN** o resultado é `2027-09-10`

#### Scenario: Dia 31 grampeado na primeira ocorrência
- **WHEN** a primeira ocorrência é calculada com início `2026-02-28` e regra mensal no dia 31
- **THEN** o resultado é `2026-02-28`

---

### Requirement: Ocorrências seguintes andam pelo intervalo sem reescrever a âncora
A n-ésima ocorrência (índice base 0, sendo 0 a primeira) SHALL ser calculada a partir da primeira: `WEEK` soma `7 × interval` dias por índice; `MONTH` soma `interval` meses por índice sobre o dia da âncora; `YEAR` soma `interval` anos por índice sobre o mês e o dia da âncora. Em `MONTH` e `YEAR`, um dia inexistente no mês de destino SHALL ser grampeado no último dia daquele mês, e o grampo SHALL NOT alterar a âncora usada nas ocorrências seguintes.

#### Scenario: Semanal a cada 2 semanas
- **WHEN** as ocorrências de índice 0, 1 e 2 são calculadas com início `2026-09-15` e regra semanal a cada 2 na segunda-feira (`1`)
- **THEN** os resultados são `2026-09-21`, `2026-10-05` e `2026-10-19`

#### Scenario: Mensal a cada 3 meses
- **WHEN** as ocorrências de índice 0, 1 e 2 são calculadas com início `2026-01-20` e regra mensal a cada 3 no dia 15
- **THEN** os resultados são `2026-02-15`, `2026-05-15` e `2026-08-15`

#### Scenario: Anual a cada ano
- **WHEN** as ocorrências de índice 0 e 1 são calculadas com início `2026-01-01` e regra anual em 10 de março
- **THEN** os resultados são `2026-03-10` e `2027-03-10`

#### Scenario: Dia 31 em meses de 30 dias
- **WHEN** as ocorrências de índice 0, 1 e 2 são calculadas com início `2026-04-01` e regra mensal no dia 31
- **THEN** os resultados são `2026-04-30`, `2026-05-31` e `2026-06-30`

#### Scenario: Dia 31 em fevereiro de ano comum
- **WHEN** as ocorrências de índice 0, 1 e 2 são calculadas com início `2026-01-31` e regra mensal no dia 31
- **THEN** os resultados são `2026-01-31`, `2026-02-28` e `2026-03-31`

#### Scenario: Dia 31 em fevereiro de ano bissexto
- **WHEN** a ocorrência de índice 1 é calculada com início `2028-01-31` e regra mensal no dia 31
- **THEN** o resultado é `2028-02-29`

#### Scenario: 29 de fevereiro anual
- **WHEN** as ocorrências de índice 0 e 1 são calculadas com início `2027-01-01` e regra anual em 29 de fevereiro
- **THEN** os resultados são `2027-02-28` e `2028-02-29`

---

### Requirement: Última parcela de uma série com quantidade definida
Para uma quantidade de parcelas `n`, a última ocorrência SHALL ser a ocorrência de índice `n - 1`.

#### Scenario: Última parcela de uma série de 12
- **WHEN** a última ocorrência é calculada com início `2026-09-15`, regra mensal no dia 10 e 12 parcelas
- **THEN** o resultado é `2027-09-10`

#### Scenario: Parcela única
- **WHEN** a última ocorrência é calculada com 1 parcela
- **THEN** o resultado é igual à primeira ocorrência

---

### Requirement: Cálculo puro, em UTC e sem relógio
O cálculo da agenda SHALL receber e devolver datas no formato `YYYY-MM-DD`, SHALL fazer toda a aritmética de data em UTC, SHALL NOT consultar a data atual e SHALL NOT depender de banco, rede ou framework. As mesmas entradas SHALL produzir sempre as mesmas saídas, independentemente do fuso horário do ambiente.

#### Scenario: Mesmo resultado em qualquer fuso
- **WHEN** as ocorrências de uma mesma série são calculadas em um processo com fuso `UTC` e em outro com fuso `America/Sao_Paulo`
- **THEN** as datas devolvidas são idênticas

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


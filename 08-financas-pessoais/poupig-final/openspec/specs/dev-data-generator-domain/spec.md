# dev-data-generator-domain Specification

## Purpose
Descrever, sem persistir nada, a massa de dados de desenvolvimento a ser criada para um usuário: validar o pedido, calcular o período e produzir um plano reprodutível de contas, cartões de crédito e transações avulsas a partir de um catálogo estático, sem inteligência artificial nem chamada externa.
## Requirements
### Requirement: Limites e códigos de erro compartilhados
O pacote `@poupig/dev` SHALL exportar os limites de geração — no máximo `10` contas, `10` cartões de crédito, `500` transações avulsas, `20` recorrências, `20` parcelamentos e `12` meses de período, e parcelas planejadas entre `2` e `24` por parcelamento — e os códigos de erro `INVALID_DEV_DATA_REQUEST`, `INVALID_DEV_DATA_QUANTITY`, `INVALID_DEV_DATA_PERIOD`, `INVALID_DEV_DATA_SEED`, `DEV_DATA_ACCOUNT_REQUIRED` e `DEV_DATA_DISABLED`, para que backend e frontend usem os mesmos valores sem repeti-los. Os dois geradores SHALL usar os mesmos códigos; nenhum código novo SHALL ser criado para as séries. O pacote SHALL depender apenas de `@poupig/shared` e SHALL NOT importar nenhum outro módulo de domínio.

#### Scenario: Limites disponíveis ao frontend
- **WHEN** o frontend importa os limites de `@poupig/dev`
- **THEN** recebe `10` para contas, `10` para cartões, `500` para transações, `20` para recorrências, `20` para parcelamentos e `12` para meses

#### Scenario: Faixa de parcelas planejadas
- **WHEN** os limites de `@poupig/dev` são lidos
- **THEN** o mínimo de parcelas planejadas é `2` e o máximo é `24`

#### Scenario: Módulo isolado
- **WHEN** as dependências do pacote `@poupig/dev` são inspecionadas
- **THEN** a única dependência de domínio é `@poupig/shared`

### Requirement: Validação do pedido de geração
O pedido de geração SHALL conter as quantidades `accounts`, `creditCards` e `transactions` (em que `0` significa item não marcado), `months` e `seed` opcional, e SHALL ser avaliado junto com a quantidade de contas que o usuário já tem. O pedido SHALL ser recusado com:
- `INVALID_DEV_DATA_REQUEST` quando nenhuma quantidade é maior que zero;
- `INVALID_DEV_DATA_QUANTITY` quando alguma quantidade não é inteira, é negativa ou passa do limite do seu item;
- `INVALID_DEV_DATA_PERIOD` quando `months` está ausente, não é inteiro ou está fora de `1..12`;
- `INVALID_DEV_DATA_SEED` quando `seed` é informada e não é um inteiro seguro;
- `DEV_DATA_ACCOUNT_REQUIRED` quando `transactions` é maior que zero, o usuário não tem nenhuma conta e `accounts` é zero.

Quando várias das quatro primeiras regras são violadas, a falha SHALL trazer todos os códigos correspondentes, sem repetição. `DEV_DATA_ACCOUNT_REQUIRED` SHALL ser avaliado apenas quando o pedido passa nessas quatro regras. Um pedido recusado SHALL NOT produzir plano.

#### Scenario: Nada marcado
- **WHEN** o pedido tem `accounts: 0`, `creditCards: 0`, `transactions: 0` e `months: 3`
- **THEN** a falha contém `INVALID_DEV_DATA_REQUEST`

#### Scenario: Quantidade acima do limite
- **WHEN** o pedido tem `transactions: 501` e `months: 3`, e o usuário tem contas
- **THEN** a falha contém `INVALID_DEV_DATA_QUANTITY`

#### Scenario: Quantidade fracionária
- **WHEN** o pedido tem `accounts: 2.5` e `months: 3`
- **THEN** a falha contém `INVALID_DEV_DATA_QUANTITY`

#### Scenario: Período fora da faixa
- **WHEN** o pedido tem `accounts: 1` e `months: 13`
- **THEN** a falha contém `INVALID_DEV_DATA_PERIOD`

#### Scenario: Semente não inteira
- **WHEN** o pedido tem `accounts: 1`, `months: 1` e `seed: 1.5`
- **THEN** a falha contém `INVALID_DEV_DATA_SEED`

#### Scenario: Várias regras violadas
- **WHEN** o pedido tem `accounts: 11` e `months: 0`
- **THEN** a falha contém `INVALID_DEV_DATA_QUANTITY` e `INVALID_DEV_DATA_PERIOD`

#### Scenario: Transações sem conta
- **WHEN** o usuário não tem nenhuma conta e o pedido tem `accounts: 0`, `transactions: 20` e `months: 3`
- **THEN** a falha contém `DEV_DATA_ACCOUNT_REQUIRED`

#### Scenario: Transações com contas a criar
- **WHEN** o usuário não tem nenhuma conta e o pedido tem `accounts: 2`, `transactions: 20` e `months: 3`
- **THEN** o pedido é aceito e o plano é produzido

---

### Requirement: Período de geração
Dado `months` (N) e a data de hoje em `YYYY-MM-DD`, o período SHALL começar no primeiro dia do mês que fica N - 1 meses antes do mês de hoje e SHALL terminar no último dia do mês de hoje, incluindo o mês atual inteiro. O período SHALL trazer `from`, `to` e `today`, todos em `YYYY-MM-DD`, calculados em UTC e sem deslocamento de fuso, respeitando a virada de ano e fevereiro de ano bissexto.

#### Scenario: Um mês
- **WHEN** o período é calculado com `months: 1` e hoje `2026-09-15`
- **THEN** o resultado é `from: 2026-09-01`, `to: 2026-09-30` e `today: 2026-09-15`

#### Scenario: Doze meses
- **WHEN** o período é calculado com `months: 12` e hoje `2026-09-15`
- **THEN** o resultado é `from: 2025-10-01` e `to: 2026-09-30`

#### Scenario: Virada de ano
- **WHEN** o período é calculado com `months: 3` e hoje `2026-01-10`
- **THEN** o resultado é `from: 2025-11-01` e `to: 2026-01-31`

#### Scenario: Fevereiro bissexto
- **WHEN** o período é calculado com `months: 1` e hoje `2028-02-10`
- **THEN** o resultado é `to: 2028-02-29`

---

### Requirement: Plano reprodutível por semente
O plano SHALL ser determinado apenas pelo pedido, pela data de hoje, pelas quantidades de contas e cartões que o usuário já tem e pela semente: as mesmas entradas SHALL produzir exatamente o mesmo plano. Quando o pedido não informa `seed`, uma semente inteira não negativa SHALL ser sorteada fora da lógica do plano e devolvida no próprio plano; repetir o pedido com essa semente SHALL reproduzir o plano. Nenhuma fonte de aleatoriedade além do gerador alimentado pela semente SHALL influenciar o plano.

#### Scenario: Mesma semente, mesmo plano
- **WHEN** o mesmo pedido com `seed: 42` é planejado duas vezes com o mesmo hoje e as mesmas quantidades existentes
- **THEN** os dois planos são idênticos

#### Scenario: Semente sorteada devolvida
- **WHEN** um pedido sem `seed` é planejado
- **THEN** o plano traz a semente usada, e planejar o mesmo pedido com essa semente produz o mesmo plano

---

### Requirement: Plano de contas
O plano SHALL conter exatamente `accounts` descrições de conta, sem repetir nome dentro do plano. Cada descrição SHALL trazer `name` (2 a 100 caracteres), `type` com um dos literais `CHECKING`, `SAVINGS`, `CASH`, `INVESTMENT` ou `OTHER`, `financialInstitution`, `icon` e `color` no formato `#RRGGBB`, e SHALL NOT trazer identificador nem dono.

#### Scenario: Dez contas sem repetição
- **WHEN** um pedido com `accounts: 10` é planejado
- **THEN** o plano tem 10 contas com 10 nomes distintos, todos com tipo válido e cor `#RRGGBB`

---

### Requirement: Plano de cartões de crédito
O plano SHALL conter exatamente `creditCards` descrições de cartão, sem repetir nome dentro do plano. Cada descrição SHALL trazer `name` (2 a 100 caracteres), `brand` com um dos literais `VISA`, `MASTERCARD`, `ELO`, `AMEX`, `HIPERCARD`, `DINERS` ou `OTHER`, `closingDay` e `dueDay` entre 1 e 31 formando um par plausível do catálogo, `lastFourDigits` com exatamente 4 dígitos, `limit` como inteiro positivo **em centavos** dentro da faixa do catálogo e `color` no formato `#RRGGBB`, e SHALL NOT trazer identificador nem dono.

#### Scenario: Limite em centavos
- **WHEN** um pedido com `creditCards: 5` é planejado
- **THEN** todo cartão do plano tem `limit` inteiro e positivo, cujo valor dividido por 100 fica dentro da faixa em reais do catálogo, e `lastFourDigits` com 4 dígitos

#### Scenario: Dez cartões sem repetição
- **WHEN** um pedido com `creditCards: 10` é planejado
- **THEN** o plano tem 10 cartões com 10 nomes distintos

---

### Requirement: Plano de transações avulsas
O plano SHALL conter exatamente `transactions` descrições de transação, ordenadas por `expectedOn` crescente. Cada descrição SHALL trazer `name` (2 a 100 caracteres) de um molde do catálogo sorteado por peso, `value` positivo com no máximo duas casas decimais dentro da faixa do molde, `direction` (`IN` ou `OUT`) do molde, `expectedOn` dentro do período, `status`, `settledOn`, `note` nulo, a dica de categoria do molde e as posições da conta e do cartão. As posições SHALL substituir identificadores:
- a posição da conta SHALL estar entre `0` e o total de contas disponíveis menos um, sendo o total as contas já existentes somadas às contas do próprio plano;
- a posição do cartão SHALL ser nula em toda entrada e em toda saída quando não há cartão disponível; havendo cartões (existentes somados aos do plano), uma fração das saídas SHALL receber uma posição entre `0` e o total menos um.

As entradas SHALL ser no máximo 20% das transações do plano, arredondado para baixo. Quando `transactions` é maior ou igual a `months`, cada mês do período SHALL receber ao menos uma transação; o mês atual SHALL receber ao menos uma transação sempre.

#### Scenario: Datas dentro do período e mês atual coberto
- **WHEN** um pedido com `transactions: 60` e `months: 3` é planejado com hoje `2026-09-15`
- **THEN** todo `expectedOn` está entre `2026-07-01` e `2026-09-30`, e julho, agosto e setembro têm ao menos uma transação cada

#### Scenario: Uma transação cai no mês atual
- **WHEN** um pedido com `transactions: 1` e `months: 12` é planejado com hoje `2026-09-15`
- **THEN** a única transação tem `expectedOn` em setembro de 2026

#### Scenario: Entradas sem cartão
- **WHEN** um pedido com `transactions: 200` é planejado e há 3 cartões disponíveis
- **THEN** nenhuma transação `IN` tem posição de cartão e ao menos uma saída tem posição de cartão entre 0 e 2

#### Scenario: Sem cartão disponível
- **WHEN** um pedido com `transactions: 50` e `creditCards: 0` é planejado para um usuário sem cartões
- **THEN** nenhuma transação do plano tem posição de cartão

#### Scenario: Posição de conta considera as contas a criar
- **WHEN** o usuário tem 1 conta e um pedido com `accounts: 2` e `transactions: 100` é planejado
- **THEN** toda posição de conta do plano está entre 0 e 2

#### Scenario: Proporção de entradas
- **WHEN** um pedido com `transactions: 100` é planejado
- **THEN** no máximo 20 transações do plano são `IN`

---

### Requirement: Situação da transação pela data
Toda transação do plano com `expectedOn` anterior à data de hoje SHALL ter `status` `SETTLED` e `settledOn` igual a `expectedOn`. Toda transação com `expectedOn` igual ou posterior a hoje SHALL ter `status` `PENDING` e `settledOn` nulo. O plano SHALL NOT conter transação `CANCELED` nem data posterior ao último dia do mês atual.

#### Scenario: Passado efetivado, presente e futuro pendentes
- **WHEN** um pedido com `transactions: 120` e `months: 2` é planejado com hoje `2026-09-15`
- **THEN** toda transação com `expectedOn` até `2026-09-14` é `SETTLED` com `settledOn` igual a `expectedOn`, e toda transação de `2026-09-15` a `2026-09-30` é `PENDING` sem `settledOn`

---

### Requirement: Catálogo estático em português do Brasil
O conteúdo dos registros gerados SHALL vir de um catálogo estático, sem inteligência artificial e sem chamada externa, com nomes em português do Brasil que pareçam registros reais. O catálogo SHALL ter ao menos tantas contas e tantos cartões quanto os respectivos limites, e SHALL ter moldes de transação avulsa de saída e de entrada. Todo nome do catálogo SHALL ter de 2 a 100 caracteres. Todo molde de saída SHALL ter como dica de categoria o nome exato de uma subcategoria padrão da aplicação, e todo molde de entrada SHALL ter dica nula. Moldes frequentes no dia a dia SHALL pesar mais no sorteio que moldes raros.

#### Scenario: Nomes dentro dos limites
- **WHEN** os nomes de contas, cartões e transações do catálogo são verificados
- **THEN** todos têm entre 2 e 100 caracteres

#### Scenario: Dicas de categoria válidas
- **WHEN** as dicas de categoria dos moldes de transação são comparadas com a lista de subcategorias padrão
- **THEN** toda dica de saída pertence à lista e toda dica de entrada é nula

#### Scenario: Frequência por peso
- **WHEN** os pesos dos moldes `Mercado` e `Revisão do carro` são comparados
- **THEN** `Mercado` tem peso maior

### Requirement: Validação do pedido de séries
O pedido de geração de séries SHALL conter as quantidades `recurrences` e `installmentPlans` (em que `0` significa item não marcado), `months` e `seed` opcional, e SHALL ser avaliado junto com a quantidade de contas que o usuário já tem. O pedido SHALL ser recusado com:
- `INVALID_DEV_DATA_REQUEST` quando nenhuma das duas quantidades é maior que zero;
- `INVALID_DEV_DATA_QUANTITY` quando alguma quantidade não é inteira, é negativa ou passa do limite do seu item;
- `INVALID_DEV_DATA_PERIOD` quando `months` está ausente, não é inteiro ou está fora de `1..12`;
- `INVALID_DEV_DATA_SEED` quando `seed` é informada e não é um inteiro seguro;
- `DEV_DATA_ACCOUNT_REQUIRED` quando o usuário não tem nenhuma conta.

Quando várias das quatro primeiras regras são violadas, a falha SHALL trazer todos os códigos correspondentes, sem repetição. `DEV_DATA_ACCOUNT_REQUIRED` SHALL ser avaliado apenas quando o pedido passa nessas quatro regras. Um pedido recusado SHALL NOT produzir plano. O período SHALL seguir a mesma regra de período de geração da parte 1.

#### Scenario: Nada marcado
- **WHEN** o pedido tem `recurrences: 0`, `installmentPlans: 0` e `months: 3`, e o usuário tem contas
- **THEN** a falha contém `INVALID_DEV_DATA_REQUEST`

#### Scenario: Quantidade acima do limite
- **WHEN** o pedido tem `recurrences: 21` e `months: 3`, e o usuário tem contas
- **THEN** a falha contém `INVALID_DEV_DATA_QUANTITY`

#### Scenario: Quantidade negativa ou fracionária
- **WHEN** o pedido tem `installmentPlans: -1` ou `installmentPlans: 2.5`, com `months: 3`
- **THEN** a falha contém `INVALID_DEV_DATA_QUANTITY`

#### Scenario: Várias regras violadas
- **WHEN** o pedido tem `recurrences: 30`, `months: 13` e `seed: 1.5`
- **THEN** a falha contém `INVALID_DEV_DATA_QUANTITY`, `INVALID_DEV_DATA_PERIOD` e `INVALID_DEV_DATA_SEED`, sem repetição

#### Scenario: Usuário sem conta
- **WHEN** o usuário não tem nenhuma conta e o pedido tem `recurrences: 5` e `months: 3`
- **THEN** a falha contém `DEV_DATA_ACCOUNT_REQUIRED` e nenhum plano é produzido

#### Scenario: Pedido válido
- **WHEN** o usuário tem 1 conta e o pedido tem `recurrences: 5`, `installmentPlans: 3` e `months: 6`
- **THEN** o pedido é aceito e o plano tem 8 séries

---

### Requirement: Plano de séries reprodutível por semente
O plano de séries SHALL ser determinado apenas pelo pedido, pela data de hoje, pelas quantidades de contas e cartões que o usuário já tem e pela semente: as mesmas entradas SHALL produzir exatamente o mesmo plano. Quando o pedido não informa `seed`, uma semente inteira não negativa SHALL ser sorteada fora da lógica do plano e devolvida no próprio plano; repetir o pedido com essa semente SHALL reproduzir o plano. O plano SHALL trazer as séries, a semente e o período (`from`, `to`, `today`). Nenhuma fonte de aleatoriedade além do gerador alimentado pela semente SHALL influenciar o plano, e o plano SHALL NOT trazer identificador, dono nem data de fim.

#### Scenario: Mesma semente, mesmo plano
- **WHEN** o mesmo pedido de séries com `seed: 42` é planejado duas vezes com o mesmo hoje e as mesmas quantidades existentes
- **THEN** os dois planos são idênticos

#### Scenario: Semente sorteada devolvida
- **WHEN** um pedido de séries sem `seed` é planejado
- **THEN** o plano traz a semente usada, e planejar o mesmo pedido com essa semente produz o mesmo plano

---

### Requirement: Campos comuns das séries planejadas
Toda série do plano SHALL trazer `name` (2 a 100 caracteres) de um molde do catálogo sorteado por peso, `value` positivo com no máximo duas casas decimais, `direction` (`IN` ou `OUT`) do molde, `kind`, a regra de recorrência, `startDate`, `installments`, `note` nulo, a dica de categoria do molde e as posições da conta e do cartão. As posições SHALL substituir identificadores:
- a posição da conta SHALL estar entre `0` e o total de contas existentes menos um;
- a posição do cartão SHALL ser nula em toda entrada e em toda série quando o usuário não tem cartão; havendo cartões, uma fração das saídas SHALL receber uma posição entre `0` e o total de cartões menos um.

`startDate` SHALL estar entre o primeiro dia do período e a data de hoje, inclusive. Toda regra SHALL ter `interval` igual a `1` e SHALL trazer **somente** as âncoras da sua unidade: `MONTH` com `dayOfMonth` entre 1 e 31; `WEEK` com `weekDay` entre 1 e 7; `YEAR` com `month` entre 1 e 12 e `dayOfMonth` entre 1 e 31.

#### Scenario: Início dentro do período
- **WHEN** um pedido com `recurrences: 20`, `installmentPlans: 20` e `months: 6` é planejado com hoje `2026-09-16`
- **THEN** todo `startDate` está entre `2026-04-01` e `2026-09-16`

#### Scenario: Âncoras só da unidade
- **WHEN** um pedido com `recurrences: 20` é planejado
- **THEN** toda regra `WEEK` tem só `weekDay`, toda `MONTH` tem só `dayOfMonth`, toda `YEAR` tem só `month` e `dayOfMonth`, e todas têm `interval: 1`

#### Scenario: Entradas sem cartão
- **WHEN** um pedido com `recurrences: 20` é planejado para um usuário com 2 cartões
- **THEN** nenhuma série `IN` tem posição de cartão e toda posição de cartão está entre 0 e 1

#### Scenario: Sem cartão disponível
- **WHEN** um pedido com `recurrences: 20` e `installmentPlans: 20` é planejado para um usuário sem cartões
- **THEN** nenhuma série do plano tem posição de cartão

#### Scenario: Posição de conta
- **WHEN** um pedido com `recurrences: 20` é planejado para um usuário com 3 contas
- **THEN** toda posição de conta está entre 0 e 2

---

### Requirement: Plano de recorrências
O plano SHALL conter exatamente `recurrences` séries `OPEN`, cada uma de um molde de recorrência do catálogo, com `value` dentro da faixa do molde, a unidade de recorrência do molde e `installments` nulo. Recorrências SHALL NOT ter data de fim.

#### Scenario: Recorrências abertas
- **WHEN** um pedido com `recurrences: 10` e `installmentPlans: 0` é planejado
- **THEN** o plano tem 10 séries, todas `OPEN`, com `installments` nulo e sem data de fim

---

### Requirement: Plano de parcelamentos
O plano SHALL conter exatamente `installmentPlans` séries `CLOSED`, cada uma de um molde de parcelamento do catálogo, sempre de saída e sempre com regra `MONTH`. `installments` SHALL ser um inteiro dentro da faixa de parcelas do molde, que fica entre `2` e `24`. `value` SHALL ser a parcela: um valor total sorteado dentro da faixa do molde dividido por `installments` e arredondado para duas casas decimais.

#### Scenario: Parcelamentos mensais
- **WHEN** um pedido com `recurrences: 0` e `installmentPlans: 20` é planejado
- **THEN** o plano tem 20 séries, todas `CLOSED`, `OUT` e com regra `MONTH`, e `installments` entre 2 e 24

#### Scenario: Parcela a partir do total
- **WHEN** um parcelamento do plano tem `installments: 10`
- **THEN** `value` multiplicado por 10 fica dentro da faixa de valor total do molde, com tolerância do arredondamento de centavos, e `value` tem no máximo duas casas decimais

---

### Requirement: Catálogo estático de séries em português do Brasil
O conteúdo das séries SHALL vir de um catálogo estático, sem inteligência artificial e sem chamada externa, com nomes em português do Brasil que pareçam registros reais: moldes de recorrência (por exemplo `Conta de energia`, `Escola das crianças`, `Balé da Fernanda`, `Salário`) e moldes de parcelamento (por exemplo `Geladeira`, `Curso de inglês`, `IPVA`). Todo nome do catálogo SHALL ter de 2 a 100 caracteres. Cada molde de recorrência SHALL ter direção, faixa de valor, peso e unidade (`WEEK`, `MONTH` ou `YEAR`); cada molde de parcelamento SHALL ter faixa de valor total, faixa de parcelas dentro de `2..24` e peso, e SHALL ser de saída. O catálogo SHALL ter ao menos uma recorrência de entrada e ao menos uma de cada unidade. Todo molde de saída SHALL ter como dica de categoria o nome exato de uma subcategoria padrão da aplicação, e todo molde de entrada SHALL ter dica nula. A soma dos pesos das recorrências `MONTH` SHALL ser maior que a soma dos pesos das `WEEK` e `YEAR` juntas, e a soma dos pesos das `YEAR` SHALL ser a menor das três.

#### Scenario: Nomes dentro dos limites
- **WHEN** os nomes dos moldes de recorrência e de parcelamento são verificados
- **THEN** todos têm entre 2 e 100 caracteres

#### Scenario: Dicas de categoria válidas
- **WHEN** as dicas de categoria dos moldes de série são comparadas com a lista de subcategorias padrão
- **THEN** toda dica de saída pertence à lista e toda dica de entrada é nula

#### Scenario: Faixas de parcelas válidas
- **WHEN** as faixas de parcelas dos moldes de parcelamento são verificadas
- **THEN** todas ficam entre 2 e 24, com o mínimo menor ou igual ao máximo

#### Scenario: Mensais na maioria
- **WHEN** os pesos das recorrências são somados por unidade
- **THEN** `MONTH` soma mais que `WEEK` e `YEAR` juntas, e `YEAR` soma menos que `WEEK`


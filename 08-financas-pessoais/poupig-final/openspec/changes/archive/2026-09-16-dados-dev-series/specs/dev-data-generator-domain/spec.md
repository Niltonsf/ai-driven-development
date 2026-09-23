## MODIFIED Requirements

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

## ADDED Requirements

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

# shared-money Specification

## Purpose
Oferecer no `@poupig/shared` um único objeto de valor monetário, em reais, que valida e normaliza valores positivos com duas casas decimais para qualquer módulo que registre dinheiro, sem aritmética monetária.
## Requirements
### Requirement: Money aceita apenas números finitos estritamente positivos, em reais
O VO global `Money`, exportado por `@poupig/shared`, SHALL representar um valor em **reais** (não em centavos). A criação SHALL reprovar, antes de qualquer comparação, toda entrada que não seja do tipo `number` ou que não seja finita (`NaN`, `Infinity`, `-Infinity`), e SHALL reprovar valores menores ou iguais a zero. Toda reprovação SHALL usar o código `INVALID_MONEY_AMOUNT`. O `Money` SHALL NOT oferecer configuração para aceitar zero ou valores negativos.

#### Scenario: Valor positivo válido
- **WHEN** `Money.tryCreate(150.5)` é chamado
- **THEN** o resultado é sucesso e o valor guardado é `150.5`

#### Scenario: Zero reprovado
- **WHEN** `Money.tryCreate(0)` é chamado
- **THEN** o resultado é falha com o código `INVALID_MONEY_AMOUNT`

#### Scenario: Negativo reprovado
- **WHEN** `Money.tryCreate(-10)` é chamado
- **THEN** o resultado é falha com o código `INVALID_MONEY_AMOUNT`

#### Scenario: Número não finito reprovado
- **WHEN** `Money.tryCreate` é chamado com `NaN`, `Infinity` ou `-Infinity`
- **THEN** o resultado é falha com o código `INVALID_MONEY_AMOUNT`

#### Scenario: Tipo diferente de número reprovado
- **WHEN** `Money.tryCreate` é chamado com a string `"10"` ou com `undefined`
- **THEN** o resultado é falha com o código `INVALID_MONEY_AMOUNT`

---

### Requirement: Money arredonda para duas casas uma única vez, na entrada
O `Money` SHALL arredondar o valor para duas casas decimais no momento da criação e SHALL guardar o valor já arredondado, de modo que a leitura nunca precise arredondar de novo. A checagem de positividade SHALL ser feita **depois** do arredondamento.

#### Scenario: Arredondamento para cima
- **WHEN** `Money.tryCreate(10.126)` é chamado
- **THEN** o valor guardado é `10.13`

#### Scenario: Arredondamento para baixo
- **WHEN** `Money.tryCreate(10.124)` é chamado
- **THEN** o valor guardado é `10.12`

#### Scenario: Valor que arredonda para zero é reprovado
- **WHEN** `Money.tryCreate(0.004)` é chamado
- **THEN** o resultado é falha com o código `INVALID_MONEY_AMOUNT`

---

### Requirement: Money segue a API de criação dos VOs globais
O `Money` SHALL expor `tryCreate`, que devolve um `Result` e nunca deixa exceção escapar, e `create`, que lança erro quando o valor é inválido. O `Money` SHALL ser importável a partir de `@poupig/shared`, junto dos demais VOs.

#### Scenario: tryCreate não lança
- **WHEN** `Money.tryCreate` é chamado com qualquer entrada inválida
- **THEN** nenhuma exceção é lançada e o resultado é falha com `INVALID_MONEY_AMOUNT`

#### Scenario: create lança quando inválido
- **WHEN** `Money.create(0)` é chamado
- **THEN** um erro é lançado

#### Scenario: Importação pelo pacote compartilhado
- **WHEN** um módulo importa `Money` de `@poupig/shared`
- **THEN** o import resolve sem erros


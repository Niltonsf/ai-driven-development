# modulo-negocio-cartao Specification

## Purpose

Especificação reaproveitável da camada de negócio de um cadastro (modelada sobre Cartão) — entidade no padrão `create`/`tryCreate`, objetos de valor baseados em `Text`, atributos numéricos via VOs compartilhados (`NonNegative`, `DayOfMonth`), DTO espelhando as props, contratos de persistência/consulta e casos de uso de salvar e excluir. Cobre apenas o núcleo de domínio em `modules/cartao/src/cartao`; backend (Prisma/API), frontend e configuração de módulo ficam explicitamente fora de escopo.

## Requirements

### Requirement: Organização do módulo de negócio

A camada de negócio do cadastro de Cartão SHALL viver em `modules/cartao/src/cartao` e ser dividida em quatro pastas com responsabilidades distintas: `model` (entidade + objetos de valor), `dto` (contratos de dados), `provider` (contratos de persistência e consulta) e `use-case` (casos de uso). Cada pasta SHALL ter um `index.ts` que reexporta seu conteúdo, e o `index.ts` do agregado SHALL reexportar as quatro pastas. A camada de negócio SHALL depender apenas de `@arquitetura/shared` e dos seus próprios arquivos — nunca de backend, frontend, ORM ou framework HTTP.

#### Scenario: Estrutura de pastas do agregado

- **WHEN** o agregado de negócio é criado
- **THEN** existem as pastas `model/`, `dto/`, `provider/` e `use-case/`, cada uma com seu `index.ts`, e um `index.ts` raiz que reexporta as quatro

#### Scenario: Isolamento de dependências

- **WHEN** se inspeciona qualquer `import` da camada de negócio
- **THEN** ele aponta apenas para `@arquitetura/shared` ou para caminhos relativos dentro do próprio agregado, sem referência a Prisma, NestJS, React ou qualquer detalhe de infraestrutura

### Requirement: Objetos de valor textuais

Cada atributo textual com regra própria SHALL ser modelado como um objeto de valor que estende `Text` de `@arquitetura/shared`. Cada VO SHALL declarar seus limites `DEFAULT_MIN_LENGTH` e `DEFAULT_MAX_LENGTH` e seus códigos de erro `TOO_SHORT`/`TOO_LONG` com um prefixo próprio do atributo (ex.: `NOME_CARTAO_TOO_SHORT`). A validação (trim, mínimo e máximo) SHALL ser herdada de `Text`; o VO apenas configura os limites e as mensagens. Para Cartão, os VOs textuais e limites são:

- `NomeCartao`: 3 a 80
- `DescricaoCartao`: 8 a 256
- `BandeiraCartao`: 2 a 40
- `UltimosDigitosCartao`: 1 a 4
- `IconeCartao`: 1 a 60

A cor (`color`) SHALL reutilizar o VO compartilhado `HexColor` em vez de um VO próprio.

#### Scenario: Valor dentro dos limites

- **WHEN** `tryCreate` recebe um texto cujo comprimento (após trim) está entre o mínimo e o máximo do VO
- **THEN** retorna um `Result` de sucesso contendo o valor normalizado

#### Scenario: Valor curto demais

- **WHEN** o texto fica abaixo do mínimo do VO
- **THEN** retorna um `Result` de falha com o código `<ATRIBUTO>_TOO_SHORT`

#### Scenario: Valor longo demais

- **WHEN** o texto ultrapassa o máximo do VO
- **THEN** retorna um `Result` de falha com o código `<ATRIBUTO>_TOO_LONG`

### Requirement: Atributos numéricos via objetos de valor compartilhados

Os atributos numéricos de Cartão SHALL reutilizar objetos de valor compartilhados de `@arquitetura/shared` em vez de VOs próprios, herdando deles a validação e os códigos de erro:

- `limit` (limite do cartão) SHALL usar `NonNegative` — valor numérico maior ou igual a zero.
- `closingDay` (dia de fechamento) e `dueDay` (dia de vencimento) SHALL usar `DayOfMonth` — inteiro entre 1 e 31.

Esses atributos são opcionais e, quando presentes, SHALL ser validados pelo VO correspondente; a validação e as mensagens SHALL vir do VO compartilhado, não da entidade.

#### Scenario: Dia de mês válido

- **WHEN** `closingDay` ou `dueDay` recebe um inteiro entre 1 e 31
- **THEN** `DayOfMonth.tryCreate` retorna sucesso e o valor é aceito

#### Scenario: Dia de mês fora da faixa

- **WHEN** `closingDay` ou `dueDay` recebe um valor não inteiro ou fora de 1..31
- **THEN** `DayOfMonth.tryCreate` retorna um `Result` de falha e a criação da entidade falha

#### Scenario: Limite negativo

- **WHEN** `limit` recebe um valor menor que zero
- **THEN** `NonNegative.tryCreate` retorna um `Result` de falha e a criação da entidade falha

### Requirement: Entidade/agregado no padrão create/tryCreate

O agregado `Cartao` SHALL ser uma classe que estende `Entity` de `@arquitetura/shared`, com construtor `private` e exposto através de duas fábricas estáticas:

- `tryCreate(props): Result<Cartao>` — valida todos os atributos sem lançar exceção e retorna um `Result`.
- `create(props): Cartao` — chama `tryCreate`, lança se houver falha (`throwsIfFailed`) e retorna a instância pronta.

Em `tryCreate`, o `id` SHALL ser validado por `Id.tryCreate`, os atributos obrigatórios pelos seus VOs e os atributos opcionais pela função `optional(valor, VO)` (que só valida quando o valor é definido), inclusive os numéricos via `optional(valor, DayOfMonth)` e `optional(valor, NonNegative)`. Os `Result` de todos os atributos presentes SHALL ser combinados via `Result.combine`; se a combinação falhar, `tryCreate` retorna a falha. A entidade SHALL aplicar valores padrão de negócio na criação (`active` assume `true` quando não informado). A props do Cartão SHALL ser:

- `name` (obrigatório), `description?`, `limit?`, `closingDay?`, `dueDay?`, `flag?`, `lastDigits?`, `active?` (default `true`), `color?`, `icon?`, além dos campos herdados de `EntityProps` (`id`, `createdAt`, `updatedAt`, `deletedAt`).

A entidade SHALL expor cada atributo por getter (somente leitura) e SHALL expor comportamentos de domínio que retornam um novo estado validado via `cloneWith` em vez de mutar — `activate()` e `deactivate()`.

#### Scenario: Criação válida com tryCreate

- **WHEN** `tryCreate` recebe props com `name` válido e opcionais válidos ou ausentes
- **THEN** retorna um `Result` de sucesso cuja instância tem os valores normalizados pelos VOs e `active = true` quando `active` não foi informado

#### Scenario: Criação inválida acumula erros

- **WHEN** `tryCreate` recebe props com um ou mais atributos inválidos
- **THEN** retorna um `Result` de falha combinando os erros dos atributos inválidos, sem lançar exceção

#### Scenario: create lança em entrada inválida

- **WHEN** `create` é chamado com props inválidas
- **THEN** a exceção é lançada (via `throwsIfFailed`) em vez de retornar um `Result`

#### Scenario: Comportamento de domínio retorna novo estado

- **WHEN** `deactivate()` (ou `activate()`) é chamado sobre uma instância
- **THEN** retorna um `Result` com uma nova instância em que `active` está `false` (ou `true`), preservando os demais atributos

### Requirement: DTO do agregado

O agregado SHALL expor um DTO que espelha as props da entidade (`interface CartaoDTO extends CartaoProps {}`), servindo de contrato de entrada/saída da camada de negócio sem expor a classe da entidade. Os casos de uso e contratos de consulta SHALL trafegar o DTO, não a entidade, nas suas fronteiras.

#### Scenario: DTO espelha as props

- **WHEN** uma nova prop de negócio é adicionada à entidade
- **THEN** ela passa a fazer parte do DTO automaticamente, por herança de `CartaoProps`, sem redeclaração manual

### Requirement: Contratos de persistência e consulta (provider)

A camada de negócio SHALL declarar apenas **contratos** (interfaces) de acesso a dados, deixando a implementação para o backend. SHALL existir:

- `CartaoRepository` estendendo `CrudRepository<Cartao>` (operações `create`, `update`, `findById`, `delete`), usado para escrita e leitura por id.
- `CartoesPaginadosQuery` (CQRS de leitura) com `execute(input: PaginatedInputDTO): Promise<Result<PaginatedResultDTO<CartaoDTO>>>`, retornando DTOs paginados.
- `NomeCartaoEmUsoQuery` com `execute(input: { name: string; ignoreId?: string }): Promise<Result<boolean>>`, para verificar unicidade de nome ignorando opcionalmente um id (no caso de atualização).

Toda operação de provider SHALL retornar `Result` (ou `Result` envolvido em `Promise`) — nunca lançar para sinalizar erro de negócio esperado.

#### Scenario: Contrato de repositório CRUD

- **WHEN** um caso de uso precisa persistir ou buscar a entidade por id
- **THEN** ele depende de `CartaoRepository`, cujos métodos retornam `Result`/`Promise<Result>`

#### Scenario: Consulta de unicidade ignorando id

- **WHEN** `NomeCartaoEmUsoQuery.execute` é chamado com `name` e um `ignoreId`
- **THEN** o registro de id igual a `ignoreId` é desconsiderado na verificação de nome em uso

### Requirement: Caso de uso Salvar Cartão (criação e atualização unificadas)

SHALL existir `SalvarCartaoUseCase` implementando `UseCase<SalvarCartaoIn, void>`, com `SalvarCartaoIn extends CartaoDTO`, e dependendo de `CartaoRepository` e `NomeCartaoEmUsoQuery`. A execução inteira SHALL ser envolvida por `Result.tryAsync` para converter exceções de validação em `Result` de falha. O fluxo SHALL ser:

1. Determinar se é atualização: é atualização quando há `id` e `findById(id)` retorna sucesso; caso contrário é criação.
2. Verificar unicidade do nome via `NomeCartaoEmUsoQuery`, passando `ignoreId` igual ao `id` quando for atualização; se o nome estiver em uso, falhar com `CARTAO_NAME_ALREADY_IN_USE`.
3. Reconstruir a entidade com `Cartao.tryCreate(data)` e abortar se a validação falhar.
4. Persistir via `update` (atualização) ou `create` (criação) e falhar se a persistência falhar.

O caso de uso SHALL publicar seus códigos de erro de negócio (ex.: `SalvarCartaoErrors.NAME_ALREADY_IN_USE = 'CARTAO_NAME_ALREADY_IN_USE'`).

#### Scenario: Criação de cartão novo

- **WHEN** `execute` recebe dados sem `id` (ou cujo `id` não existe) e com nome livre e atributos válidos
- **THEN** a entidade é validada e persistida via `create`, e o resultado é um `Result` de sucesso

#### Scenario: Atualização de cartão existente

- **WHEN** `execute` recebe dados com `id` cujo `findById` retorna sucesso
- **THEN** a verificação de nome ignora o próprio `id` e a entidade é persistida via `update`

#### Scenario: Nome já em uso

- **WHEN** `execute` recebe um nome já usado por outro cartão
- **THEN** retorna um `Result` de falha com o código `CARTAO_NAME_ALREADY_IN_USE` e nada é persistido

#### Scenario: Dados inválidos

- **WHEN** `execute` recebe atributos que violam os VOs (ex.: nome curto demais ou dia de fechamento fora de 1..31)
- **THEN** retorna um `Result` de falha com os erros de validação e nada é persistido

### Requirement: Caso de uso Excluir Cartão

SHALL existir `ExcluirCartaoUseCase` implementando `UseCase<ExcluirCartaoIn, void>`, com `ExcluirCartaoIn = { id: string }`, dependendo de `CartaoRepository`, com a execução envolvida por `Result.tryAsync`. O fluxo SHALL: (1) buscar o cartão por `findById` e falhar com `CARTAO_NOT_FOUND` se a busca falhar ou vier vazia; (2) excluir via `delete(id)` e falhar se a exclusão falhar. O caso de uso SHALL publicar `ExcluirCartaoErrors.NOT_FOUND = 'CARTAO_NOT_FOUND'`.

#### Scenario: Exclusão de cartão existente

- **WHEN** `execute` recebe o `id` de um cartão existente
- **THEN** o cartão é removido via `delete` e o resultado é um `Result` de sucesso

#### Scenario: Exclusão de cartão inexistente

- **WHEN** `execute` recebe um `id` que não corresponde a nenhum cartão
- **THEN** retorna um `Result` de falha com o código `CARTAO_NOT_FOUND` e nada é removido

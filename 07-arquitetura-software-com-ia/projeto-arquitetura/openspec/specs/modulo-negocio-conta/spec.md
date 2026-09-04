# modulo-negocio-conta Specification

## Purpose

Especificação reaproveitável da camada de negócio de um cadastro (modelada sobre Conta) — entidade no padrão `create`/`tryCreate`, objetos de valor baseados em `Text`, DTO espelhando as props, contratos de persistência/consulta e casos de uso de salvar e excluir. Cobre apenas o núcleo de domínio em `modules/contas/src/conta`; backend (Prisma/API), frontend e configuração de módulo ficam explicitamente fora de escopo.

## Requirements

### Requirement: Organização do módulo de negócio

A camada de negócio do cadastro SHALL viver em `modules/<modulo>/src/<agregado>` e ser dividida em quatro pastas com responsabilidades distintas: `model` (entidade + objetos de valor), `dto` (contratos de dados), `provider` (contratos de persistência e consulta) e `use-case` (casos de uso). Cada pasta SHALL ter um `index.ts` que reexporta seu conteúdo, e o `index.ts` do agregado SHALL reexportar as quatro pastas. A camada de negócio SHALL depender apenas de `@arquitetura/shared` e dos seus próprios arquivos — nunca de backend, frontend, ORM ou framework HTTP.

#### Scenario: Estrutura de pastas do agregado

- **WHEN** o agregado de negócio é criado
- **THEN** existem as pastas `model/`, `dto/`, `provider/` e `use-case/`, cada uma com seu `index.ts`, e um `index.ts` raiz que reexporta as quatro

#### Scenario: Isolamento de dependências

- **WHEN** se inspeciona qualquer `import` da camada de negócio
- **THEN** ele aponta apenas para `@arquitetura/shared` ou para caminhos relativos dentro do próprio agregado, sem referência a Prisma, NestJS, React ou qualquer detalhe de infraestrutura

### Requirement: Objetos de valor textuais

Cada atributo textual com regra própria SHALL ser modelado como um objeto de valor que estende `Text` de `@arquitetura/shared`. Cada VO SHALL declarar seus limites `DEFAULT_MIN_LENGTH` e `DEFAULT_MAX_LENGTH` e seus códigos de erro `TOO_SHORT`/`TOO_LONG` com um prefixo próprio do atributo (ex.: `NOME_CONTA_TOO_SHORT`). A validação (trim, mínimo e máximo) SHALL ser herdada de `Text`; o VO apenas configura os limites e as mensagens. Para Conta, os VOs e limites são:

- `NomeConta`: 3 a 80
- `DescricaoConta`: 8 a 256
- `NumeroConta`: 1 a 30
- `AgenciaConta`: 1 a 20
- `InstituicaoConta`: 2 a 120
- `IconeConta`: 1 a 60

Cor (`color`) SHALL reutilizar o VO compartilhado `HexColor` em vez de um VO próprio.

#### Scenario: Valor dentro dos limites

- **WHEN** `tryCreate` recebe um texto cujo comprimento (após trim) está entre o mínimo e o máximo do VO
- **THEN** retorna um `Result` de sucesso contendo o valor normalizado

#### Scenario: Valor curto demais

- **WHEN** o texto fica abaixo do mínimo do VO
- **THEN** retorna um `Result` de falha com o código `<ATRIBUTO>_TOO_SHORT`

#### Scenario: Valor longo demais

- **WHEN** o texto ultrapassa o máximo do VO
- **THEN** retorna um `Result` de falha com o código `<ATRIBUTO>_TOO_LONG`

### Requirement: Entidade/agregado no padrão create/tryCreate

O agregado SHALL ser uma classe que estende `Entity` de `@arquitetura/shared`, com construtor `private` e exposto através de duas fábricas estáticas:

- `tryCreate(props): Result<T>` — valida todos os atributos sem lançar exceção e retorna um `Result`.
- `create(props): T` — chama `tryCreate`, lança se houver falha (`throwsIfFailed`) e retorna a instância pronta.

Em `tryCreate`, o `id` SHALL ser validado por `Id.tryCreate`, os atributos obrigatórios pelos seus VOs e os atributos opcionais pela função `optional(valor, VO)` (que só valida quando o valor é definido). Os `Result` de todos os atributos presentes SHALL ser combinados via `Result.combine`; se a combinação falhar, `tryCreate` retorna a falha. A entidade SHALL aplicar valores padrão de negócio na criação (para Conta: `active` assume `true` quando não informado). A props da Conta SHALL ser:

- `name` (obrigatório), `description?`, `agency?`, `accountNumber?`, `institutionName?`, `active?` (default `true`), `color?`, `icon?`, além dos campos herdados de `EntityProps` (`id`, `createdAt`, `updatedAt`, `deletedAt`).

A entidade SHALL expor cada atributo por getter (somente leitura) e SHALL expor comportamentos de domínio que retornam um novo estado validado via `cloneWith` em vez de mutar — para Conta: `activate()` e `deactivate()`.

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

O agregado SHALL expor um DTO que espelha as props da entidade (`interface ContaDTO extends ContaProps {}`), servindo de contrato de entrada/saída da camada de negócio sem expor a classe da entidade. Os casos de uso e contratos de consulta SHALL trafegar o DTO, não a entidade, nas suas fronteiras.

#### Scenario: DTO espelha as props

- **WHEN** uma nova prop de negócio é adicionada à entidade
- **THEN** ela passa a fazer parte do DTO automaticamente, por herança de `ContaProps`, sem redeclaração manual

### Requirement: Contratos de persistência e consulta (provider)

A camada de negócio SHALL declarar apenas **contratos** (interfaces) de acesso a dados, deixando a implementação para o backend. SHALL existir:

- `ContaRepository` estendendo `CrudRepository<Conta>` (operações `create`, `update`, `findById`, `delete`), usado para escrita e leitura por id.
- `ContasPaginadasQuery` (CQRS de leitura) com `execute(input: PaginatedInputDTO): Promise<Result<PaginatedResultDTO<ContaDTO>>>`, retornando DTOs paginados.
- `NomeContaEmUsoQuery` com `execute(input: { name: string; ignoreId?: string }): Promise<Result<boolean>>`, para verificar unicidade de nome ignorando opcionalmente um id (no caso de atualização).

Toda operação de provider SHALL retornar `Result` (ou `Result` envolvido em `Promise`) — nunca lançar para sinalizar erro de negócio esperado.

#### Scenario: Contrato de repositório CRUD

- **WHEN** um caso de uso precisa persistir ou buscar a entidade por id
- **THEN** ele depende de `ContaRepository`, cujos métodos retornam `Result`/`Promise<Result>`

#### Scenario: Consulta de unicidade ignorando id

- **WHEN** `NomeContaEmUsoQuery.execute` é chamado com `name` e um `ignoreId`
- **THEN** o registro de id igual a `ignoreId` é desconsiderado na verificação de nome em uso

### Requirement: Caso de uso Salvar Conta (criação e atualização unificadas)

SHALL existir `SalvarContaUseCase` implementando `UseCase<SalvarContaIn, void>`, com `SalvarContaIn extends ContaDTO`, e dependendo de `ContaRepository` e `NomeContaEmUsoQuery`. A execução inteira SHALL ser envolvida por `Result.tryAsync` para converter exceções de validação em `Result` de falha. O fluxo SHALL ser:

1. Determinar se é atualização: é atualização quando há `id` e `findById(id)` retorna sucesso; caso contrário é criação.
2. Verificar unicidade do nome via `NomeContaEmUsoQuery`, passando `ignoreId` igual ao `id` quando for atualização; se o nome estiver em uso, falhar com `CONTA_NAME_ALREADY_IN_USE`.
3. Reconstruir a entidade com `Conta.tryCreate(data)` e abortar se a validação falhar.
4. Persistir via `update` (atualização) ou `create` (criação) e falhar se a persistência falhar.

O caso de uso SHALL publicar seus códigos de erro de negócio (ex.: `SalvarContaErrors.NAME_ALREADY_IN_USE = 'CONTA_NAME_ALREADY_IN_USE'`).

#### Scenario: Criação de conta nova

- **WHEN** `execute` recebe dados sem `id` (ou cujo `id` não existe) e com nome livre e atributos válidos
- **THEN** a entidade é validada e persistida via `create`, e o resultado é um `Result` de sucesso

#### Scenario: Atualização de conta existente

- **WHEN** `execute` recebe dados com `id` cujo `findById` retorna sucesso
- **THEN** a verificação de nome ignora o próprio `id` e a entidade é persistida via `update`

#### Scenario: Nome já em uso

- **WHEN** `execute` recebe um nome já usado por outra conta
- **THEN** retorna um `Result` de falha com o código `CONTA_NAME_ALREADY_IN_USE` e nada é persistido

#### Scenario: Dados inválidos

- **WHEN** `execute` recebe atributos que violam os VOs (ex.: nome curto demais)
- **THEN** retorna um `Result` de falha com os erros de validação e nada é persistido

### Requirement: Caso de uso Excluir Conta

SHALL existir `ExcluirContaUseCase` implementando `UseCase<ExcluirContaIn, void>`, com `ExcluirContaIn = { id: string }`, dependendo de `ContaRepository`, com a execução envolvida por `Result.tryAsync`. O fluxo SHALL: (1) buscar a conta por `findById` e falhar com `CONTA_NOT_FOUND` se a busca falhar ou vier vazia; (2) excluir via `delete(id)` e falhar se a exclusão falhar. O caso de uso SHALL publicar `ExcluirContaErrors.NOT_FOUND = 'CONTA_NOT_FOUND'`.

#### Scenario: Exclusão de conta existente

- **WHEN** `execute` recebe o `id` de uma conta existente
- **THEN** a conta é removida via `delete` e o resultado é um `Result` de sucesso

#### Scenario: Exclusão de conta inexistente

- **WHEN** `execute` recebe um `id` que não corresponde a nenhuma conta
- **THEN** retorna um `Result` de falha com o código `CONTA_NOT_FOUND` e nada é removido

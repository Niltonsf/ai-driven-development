# modulo-backend-conta Specification

## Purpose

Camada de backend do módulo Conta: persistência Prisma, seed, adapter de repositório, queries CQRS de leitura, controller HTTP, wiring do módulo Nest e testes de integração.

## Requirements

### Requirement: Modelo Prisma da Conta

A camada de backend SHALL definir o modelo de persistência da Conta em um arquivo Prisma próprio do módulo (`apps/backend/prisma/models/contas.model.prisma`), espelhando as props do domínio e respeitando as convenções do projeto. O nome da conta SHALL ser único; a tabela SHALL suportar soft delete; timestamps de criação/atualização SHALL ser gerenciados pelo banco.

#### Scenario: Campos e tipos do modelo

- **WHEN** o modelo `Conta` é definido
- **THEN** ele contém `id` (UUID, chave primária), `name` (obrigatório), `description`, `agency`, `accountNumber`, `institutionName`, `color`, `icon` (todos opcionais), `active` (booleano com default `true`), `createdAt`, `updatedAt` e `deletedAt` (opcional)
- **AND** colunas com nome composto usam `@map` para snake_case e a tabela usa `@@map("contas")`

#### Scenario: Unicidade do nome

- **WHEN** o modelo é definido
- **THEN** `name` possui restrição de unicidade no banco, reforçando a regra de negócio de nome único

#### Scenario: Migração versionada

- **WHEN** o modelo muda
- **THEN** existe uma migração SQL correspondente em `apps/backend/prisma/migrations` e o client Prisma é regenerado

### Requirement: Seed de contas de exemplo

A camada de backend SHALL fornecer uma seed que popula contas de exemplo a partir de um arquivo de dados versionado, de forma idempotente (re-execução não duplica registros), integrada ao entrypoint técnico de seed do backend.

#### Scenario: Carga a partir de dados versionados

- **WHEN** a seed do módulo é executada
- **THEN** ela lê os registros de `apps/backend/prisma/seed/data/contas.json` e os insere via client Prisma
- **AND** os tipos do JSON são consistentes com o payload esperado pelo Prisma

#### Scenario: Idempotência

- **WHEN** a seed é executada mais de uma vez
- **THEN** ela não cria contas duplicadas (usa upsert ou checagem por chave única)

### Requirement: Adapter de persistência implementa o ContaRepository

A camada de backend SHALL prover um adapter Prisma (`contas.prisma.ts`) injetável (provider Nest) que implementa o contrato `ContaRepository` de `@arquitetura/contas`. O adapter SHALL isolar o domínio do Prisma por meio de mapeamentos `fromDomain`/`toDomain`/`toDTO`, e SHALL traduzir falhas de banco em `Result.fail`.

#### Scenario: Criar e atualizar

- **WHEN** `create(entity)` ou `update(entity)` é chamado
- **THEN** a entidade é convertida para a linha do banco via `fromDomain` e persistida
- **AND** o resultado é um `Result<void>` de sucesso, ou `Result.fail` se a operação de banco lançar

#### Scenario: Buscar por id existente

- **WHEN** `findById(id)` encontra a linha
- **THEN** a linha é reconstruída em entidade de domínio via `toDomain` (que usa `Conta.tryCreate`) e retornada em `Result` de sucesso

#### Scenario: Buscar por id inexistente

- **WHEN** `findById(id)` não encontra a linha
- **THEN** retorna `Result.fail` com código `ENTITY_NOT_FOUND`

#### Scenario: Participação em transação

- **WHEN** uma operação de escrita recebe um `TransactionContext` opcional
- **THEN** o adapter usa o client da transação quando presente, caindo para o client padrão quando ausente

### Requirement: Queries CQRS de leitura

A camada de backend SHALL implementar as queries de leitura declaradas pelo domínio como objetos com método `execute`, separadas das operações de escrita do repository. SHALL existir uma query de listagem paginada e uma query de verificação de nome em uso.

#### Scenario: Listagem paginada

- **WHEN** a query de listagem é executada com `page` e `pageSize`
- **THEN** retorna `PaginatedResultDTO<ContaDTO>` com os dados da página mapeados via `toDTO` e os metadados `page`, `pageSize`, `total` e `totalPages`
- **AND** registros com soft delete (`deletedAt` não nulo) são excluídos do resultado
- **AND** a contagem total e a busca da página ocorrem na mesma transação de leitura

#### Scenario: Nome em uso ignorando a própria conta

- **WHEN** a query de nome em uso é executada com um `name` e um `ignoreId` opcional
- **THEN** retorna `true` se existir outra conta com o mesmo nome, desconsiderando a conta de `ignoreId` quando informado

### Requirement: Controller HTTP de contas

A camada de backend SHALL expor um controller Nest na rota `contas` que orquestra os casos de uso/queries e traduz o `Result` do domínio em respostas e status HTTP. O controller SHALL separar comandos (escrita) de queries (leitura) e SHALL normalizar parâmetros de paginação. Os endpoints SHALL estar marcados como públicos (estado temporário enquanto não há autenticação no módulo).

#### Scenario: Salvar conta (criar/atualizar)

- **WHEN** `POST /contas` recebe o corpo de entrada
- **THEN** o caso de uso de salvar é executado e, em sucesso, responde `200` sem corpo

#### Scenario: Excluir conta

- **WHEN** `DELETE /contas/:id` é chamado
- **THEN** o caso de uso de excluir é executado e, em sucesso, responde `204` sem corpo

#### Scenario: Consultar por id

- **WHEN** `GET /contas/:id` encontra a conta
- **THEN** responde `200` com o `ContaDTO`
- **AND** se não encontrar, responde `404`

#### Scenario: Consultar paginado com normalização

- **WHEN** `GET /contas` recebe `page`/`pageSize` ausentes ou inválidos
- **THEN** valores são normalizados (page padrão 1, pageSize padrão 10, pageSize limitado a um máximo) antes de chamar a query
- **AND** responde `200` com o `PaginatedResultDTO<ContaDTO>`

#### Scenario: Tradução de falhas em status HTTP

- **WHEN** um `Result` retornado é falha
- **THEN** erros de "não encontrado/vazio" viram `404` (`NotFoundException`) e os demais viram `400` (`BadRequestException`), repassando as mensagens de erro

### Requirement: Wiring do módulo Nest

A camada de backend SHALL registrar um módulo Nest (`ContasModule`) que importa o módulo de banco, declara o controller e o adapter Prisma como provider, e exporta o adapter para reuso por outros módulos. O barrel `index.ts` do módulo SHALL reexportar o módulo.

#### Scenario: Composição do módulo

- **WHEN** `ContasModule` é definido
- **THEN** ele importa o módulo de banco (`DbModule`), registra `ContasController` como controller, `ContasPrisma` como provider e o exporta

### Requirement: Testes de integração da API

A camada de backend SHALL fornecer um arquivo de testes de integração no formato REST Client (`.http`) cobrindo os endpoints do controller, executável manualmente contra o backend em execução, incluindo um fluxo CRUD ponta a ponta re-executável e casos de validação/erro.

#### Scenario: Cobertura dos endpoints

- **WHEN** o arquivo `.http` é usado
- **THEN** ele cobre listagem paginada (incluindo normalização de parâmetros), consulta por id inexistente (404), validações de criação (400), e um fluxo criar → consultar → nome duplicado → atualizar → excluir → excluir novamente (404)

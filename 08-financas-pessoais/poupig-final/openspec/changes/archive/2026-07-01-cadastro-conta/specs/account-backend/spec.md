## ADDED Requirements

### Requirement: Model Account mapeado no Prisma com enum AccountType e FK para User
O sistema SHALL definir o model `Account` no Prisma schema com todos os campos da entidade, o enum `AccountType` e uma relação com o model `User` via `userId`. A migration deve criar a tabela `account`.

#### Scenario: Migration executada com sucesso
- **WHEN** `prisma migrate dev` é executado após a adição do model `Account`
- **THEN** a tabela `account` é criada no banco com todos os campos e a FK para `users`

---

### Requirement: AccountPrismaRepository implementa AccountRepository e FindAccountsByUserIdQuery
O sistema SHALL implementar `AccountPrismaRepository` em `apps/backend/src/modules/account/account.prisma.ts` que implementa `AccountRepository`. A query `findAccountsByUserId: FindAccountsByUserIdQuery` SHALL ser exposta como atributo público tipado, retornando `AccountDTO[]` mapeado do resultado do banco.

#### Scenario: Busca de contas por userId retorna lista correta
- **WHEN** `findAccountsByUserId.execute(userId)` é chamado
- **THEN** são retornadas apenas as contas ativas cujo `userId` corresponde ao parâmetro, mapeadas para `AccountDTO[]`

#### Scenario: Save persiste nova conta
- **WHEN** `save(account)` é chamado com uma entidade Account válida
- **THEN** a conta é inserida ou atualizada no banco (upsert por `id`)

---

### Requirement: AccountController expõe 4 endpoints REST protegidos por JWT
O sistema SHALL implementar `AccountController` em `apps/backend/src/modules/account/account.controller.ts` com os endpoints:
- `POST /accounts` — criar conta
- `GET /accounts` — listar contas do usuário autenticado
- `PUT /accounts/:id` — atualizar conta
- `DELETE /accounts/:id` — excluir conta (soft delete)

Todos os endpoints MUST ser protegidos com `JwtAuthGuard`. O `userId` MUST ser extraído do token JWT, nunca do body da requisição.

#### Scenario: POST /accounts com dados válidos
- **WHEN** usuário autenticado faz POST /accounts com `name` e `type` válidos
- **THEN** conta é criada e 201 Created é retornado

#### Scenario: GET /accounts retorna contas do usuário autenticado
- **WHEN** usuário autenticado faz GET /accounts
- **THEN** apenas as contas do próprio usuário são retornadas com status 200

#### Scenario: PUT /accounts/:id atualiza conta do dono
- **WHEN** usuário autenticado faz PUT /accounts/:id com dados válidos e é dono da conta
- **THEN** conta é atualizada e 200 OK é retornado

#### Scenario: DELETE /accounts/:id exclui conta do dono
- **WHEN** usuário autenticado faz DELETE /accounts/:id e é dono da conta
- **THEN** soft delete é aplicado e 200 OK é retornado

#### Scenario: Endpoints sem token retornam 401
- **WHEN** qualquer endpoint de /accounts é chamado sem token JWT
- **THEN** status 401 Unauthorized é retornado

---

### Requirement: Seed popula banco com 5 contas de exemplo
O sistema SHALL ter um arquivo `apps/backend/prisma/seed/data/accounts.json` com ao menos 5 contas vinculadas ao usuário `usuario@formacao.dev`, distribuindo os tipos de `AccountType`.

#### Scenario: Seed executado com sucesso
- **WHEN** o seed de contas é executado
- **THEN** as 5 contas são inseridas no banco vinculadas ao usuário padrão

---

### Requirement: Testes de integração via Rest Client cobrem todos os endpoints de conta
O sistema SHALL conter arquivo `.http` com requisições para todos os 4 endpoints de conta, seguindo o padrão Rest Client do projeto.

#### Scenario: Arquivo de testes REST existe e cobre os 4 endpoints
- **WHEN** o arquivo `.http` de contas é aberto no VS Code com Rest Client
- **THEN** estão presentes requisições para POST, GET, PUT e DELETE de /accounts

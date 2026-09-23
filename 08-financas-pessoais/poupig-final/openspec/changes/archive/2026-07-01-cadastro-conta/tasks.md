## 1. Negócio — Domínio e Aplicação (subagente isolado)

- [x] 1.1 Criar o agregado `account` sem casos de uso usando a skill `module-aggregate`
- [x] 1.2 Alterar a entidade `Account` com todos os atributos definidos (id, userId, name, description, type, accountNumber, agency, financialInstitution, color, icon, isActive) usando a skill `module-entity`
- [x] 1.3 Criar/Utilizar (procurar em shared) value objects para validar `name` (não vazio) e `color` (formato hexadecimal #RRGGBB)
- [x] 1.4 Criar o enum `AccountType` com os valores `CHECKING`, `SAVINGS`, `CASH`, `INVESTMENT`, `OTHER`
- [x] 1.5 Criar a interface `AccountRepository` com os métodos `save`, `findById` e `delete` usando a skill `module-repository`
- [x] 1.6 Criar o `AccountDTO` em `modules/account/src/account/dto/account.dto.ts` usando a skill `module-dto`
- [x] 1.7 Criar a interface `FindAccountsByUserIdQuery` em `modules/account/src/account/provider/find-accounts-by-user-id.query.ts` usando a skill `module-query-cqrs`
- [x] 1.8 Criar o caso de uso `save-account.use-case` em `modules/account/src/account/use-case` (fluxo criação + edição com validações) usando a skill `module-use-case`
- [x] 1.9 Criar o caso de uso `delete-account.use-case` em `modules/account/src/account/use-case` (busca, autorização, soft delete) usando a skill `module-use-case`

## 2. Backend — Prisma, Repositório, Controller e Seed (subagente isolado)

- [x] 2.1 Mapear o model `Account` no Prisma schema com enum `AccountType` e FK para `User`, usando a skill `backend-prisma-data`
- [x] 2.2 Executar `prisma migrate dev` para criar a tabela `account`
- [x] 2.3 Implementar `AccountPrismaRepository` em `apps/backend/src/modules/account/account.prisma.ts` com `save`, `findById`, `delete` e atributo público `findAccountsByUserId: FindAccountsByUserIdQuery`
- [x] 2.4 Criar o `AccountController` em `apps/backend/src/modules/account/account.controller.ts` com os endpoints POST /accounts, GET /accounts, PUT /accounts/:id, DELETE /accounts/:id — todos protegidos com JwtAuthGuard e userId extraído do token
- [x] 2.5 Registrar o módulo de account no NestJS (module, providers, controllers)
- [x] 2.6 Criar `apps/backend/prisma/seed/data/accounts.json` com 5 contas de exemplo vinculadas ao usuário `usuario@formacao.dev`, distribuindo os tipos de `AccountType`
- [x] 2.7 Executar o seed para popular o banco com as contas de exemplo
- [x] 2.8 Criar arquivo `.http` com testes de integração via Rest Client para os 4 endpoints de conta (POST, GET, PUT, DELETE)

## 3. Frontend — Páginas, Componentes e Data Layer (subagente isolado)

- [x] 3.1 Criar `account-api.client.ts` em `apps/frontend/src/modules/account/data` com funções para criar, listar, atualizar e deletar contas via API
- [x] 3.2 Criar `account.schema.ts` em `apps/frontend/src/modules/account/data` com schema de validação do formulário usando o padrão do projeto (skill: `frontend-form-schema`)
- [x] 3.3 Criar hooks do React necessários em `apps/frontend/src/modules/account/data` para consumir dados e disparar ações (listar, criar, editar, deletar)
- [x] 3.4 Criar `account-list.component.tsx` em `apps/frontend/src/modules/account/components` que recebe `AccountDTO[]` como prop e renderiza cards com nome, tipo, instituição financeira, cor e ícone
- [x] 3.5 Criar `account-form.component.tsx` em `apps/frontend/src/modules/account/components` usando `form-section-layout`, com todos os campos da entidade, select de `type` traduzido para português, color picker/input hex, e campo `isActive` apenas no fluxo de edição
- [x] 3.6 Criar `accounts.page.tsx` em `apps/frontend/src/modules/account/pages` na rota `/accounts` que lista as contas do usuário autenticado usando `AccountListComponent`
- [x] 3.7 Atualizar o menu lateral da área privada adicionando uma seção "Cadastros" com o link para /accounts
- [x] 3.8 Usar o componente `delete-confirmation-dialog` antes de disparar a exclusão, exibindo o nome da conta no dialog
- [x] 3.9 Implementar toaster de sucesso e atualização automática da lista após criação, edição ou exclusão de conta

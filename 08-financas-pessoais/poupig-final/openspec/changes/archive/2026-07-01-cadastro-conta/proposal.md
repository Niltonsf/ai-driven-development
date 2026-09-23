## Why

O aplicativo Poupig precisa permitir que usuários cadastrem e gerenciem suas contas financeiras (corrente, poupança, investimento etc.) para que possam organizar transações por conta e ter visibilidade sobre seu patrimônio. Esta é a funcionalidade central que habilita todos os fluxos futuros de movimentação financeira.

## What Changes

- Criação do módulo `account` com agregado, entidade, value objects, repositório, DTO, query e casos de uso no pacote compartilhado
- Mapeamento da entidade `account` no Prisma com enum `AccountType` e relação com `User`
- Implementação do repositório Prisma e controller REST com 4 endpoints protegidos por JWT
- Seed com 5 contas de exemplo vinculadas ao usuário padrão
- Testes de integração via Rest Client para todos os endpoints
- Página de listagem de contas, formulário de criação/edição e atualização do menu lateral no frontend

## Capabilities

### New Capabilities

- `account-domain`: Agregado, entidade com value objects, repositório, DTO e query do módulo de conta
- `account-use-cases`: Casos de uso `save-account` (criar/editar) e `delete-account` (soft delete)
- `account-backend`: Controller REST, implementação Prisma do repositório, migrations e seed de contas
- `account-frontend`: Página de listagem, componentes de lista e formulário, cliente de API e integração com menu lateral

### Modified Capabilities

<!-- Nenhuma especificação existente tem seus requisitos alterados por esta mudança -->

## Impact

- **Módulo novo**: `modules/account/` — pacote TypeScript com domínio e aplicação
- **Backend**: `apps/backend/src/modules/account/` — controller, repositório Prisma, migration, seed
- **Frontend**: `apps/frontend/src/modules/account/` — páginas, componentes, hooks, schema e cliente de API
- **Prisma schema**: novo model `Account` com enum `AccountType` e FK para `User`
- **Menu lateral**: rota `/accounts` adicionada na área privada
- **Dependências**: nenhuma dependência externa nova; usa JwtGuard já configurado

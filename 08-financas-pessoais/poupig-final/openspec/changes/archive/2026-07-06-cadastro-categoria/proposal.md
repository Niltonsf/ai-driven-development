## Why

O aplicativo Poupig já permite cadastrar contas e cartões de crédito, mas ainda não possui um mecanismo para os usuários classificarem suas transações. Sem categorias e subcategorias, não é possível organizar receitas e despesas por tipo, o que é pré-requisito para relatórios e análises financeiras futuras.

## What Changes

- Criação do agregado `category` (raiz) com entidade filha `subcategory` composta, value objects, repositório, DTO, query e casos de uso no pacote de domínio (`modules/category`)
- `Category` mantém a consistência da lista de `Subcategory` (adicionar, alterar, remover, validar `order` único); `subcategory` não possui repositório, caso de uso ou endpoint próprios
- Reutilização do VO de cor hexadecimal já usado em `account`/`credit-card`; criação de um novo VO de inteiro positivo (ex.: `SubcategoryOrder`) caso não exista um reutilizável equivalente ao padrão `DueDay`/`ClosingDay` do módulo `credit-card`
- Caso de uso único `save-category` que cobre criação e alteração (determinado pela existência do `id` no repositório), incluindo reconciliação da lista de subcategorias (atualizar por `id`, criar sem `id`, remover ausentes)
- Caso de uso `delete-category` com soft delete (`deletedAt`) propagado da raiz para as subcategorias, na mesma transação
- Mapeamento Prisma das tabelas `category` e `subcategory` (FK `categoryId` e `userId`) e migration correspondente
- Implementação do repositório Prisma com persistência transacional (`$transaction`) do agregado completo e query `findCategoriesByUserId` exposta na mesma classe
- Controller REST com 4 endpoints protegidos por JWT (`POST`, `GET`, `PUT`, `DELETE /categories`), com `userId` sempre extraído do token
- Seed com 5 categorias de exemplo (cada uma com ao menos 2 subcategorias) vinculadas ao usuário `usuario@formacao.dev`
- Testes de integração via Rest Client para todos os endpoints, incluindo payloads com subcategorias

## Capabilities

### New Capabilities

- `category-domain`: Agregado `category`/`subcategory`, value objects, repositório, DTO e query do módulo de categoria
- `category-use-cases`: Casos de uso `save-category` (criar/editar com reconciliação de subcategorias) e `delete-category` (soft delete propagado)
- `category-backend`: Controller REST, implementação Prisma do repositório (transacional), migrations, seed e testes de integração

### Modified Capabilities

<!-- Nenhuma especificação existente tem seus requisitos alterados por esta mudança -->

## Impact

- **Módulo novo**: `modules/category/` — pacote TypeScript com domínio e aplicação (já possui scaffold vazio a ser preenchido)
- **Backend**: `apps/backend/src/modules/category/` — controller, repositório Prisma, migration, seed (scaffold já existente a ser implementado)
- **Prisma schema**: novos models `Category` e `Subcategory`, com FK `Subcategory.categoryId → Category` e `Category.userId → User`
- **Dependências**: nenhuma dependência externa nova; usa `JwtGuard` e infraestrutura de transação Prisma já existentes
- **Fora de escopo**: nenhuma alteração de frontend/UI nesta mudança (apenas domínio e backend)

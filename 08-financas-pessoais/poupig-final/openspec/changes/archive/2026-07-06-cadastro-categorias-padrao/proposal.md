## Why

Ao começar a usar o Poupig, o usuário precisa de categorias e subcategorias já cadastradas para conseguir classificar transações — mas hoje só existe o caminho manual, categoria por categoria, via `save-category`. Isso é repetitivo, sujeito a erro e adia o valor do app (relatórios/análises dependem de categorização). É preciso oferecer um cadastro em lote de um conjunto padrão, abrangente, de categorias e subcategorias comuns ao orçamento de uma família média brasileira.

## What Changes

- Criação de um arquivo de constantes (`modules/category/src/category/constants`) com o catálogo de categorias e subcategorias padrão do sistema — cada categoria com `name`, `icon` e `color`, cada subcategoria com `name`, `icon`, `color` e `order`, cobrindo de forma generosa domínios como moradia, alimentação, transporte, saúde, educação, lazer, entre outros comuns ao orçamento familiar brasileiro
- Novo caso de uso que lê esse catálogo de constantes e, para o usuário autenticado, cadastra cada categoria padrão (com suas subcategorias) reutilizando as regras já existentes de `save-category` (incluindo a verificação de nome duplicado por usuário)
- Categorias padrão cujo nome já exista para o usuário são ignoradas silenciosamente (sem erro); apenas as ainda inexistentes são inseridas — a operação é idempotente e pode ser chamada novamente sem duplicar dados
- Novo endpoint de API protegido por JWT para disparar esse caso de uso, extraindo o `userId` do token autenticado (nunca do corpo da requisição)

## Capabilities

### New Capabilities

- `category-default-categories`: catálogo de constantes com categorias/subcategorias padrão, caso de uso de cadastro em lote (idempotente, reaproveitando `save-category`) e endpoint REST protegido por JWT para o usuário autenticado disparar o cadastro

### Modified Capabilities

<!-- Nenhuma especificação existente tem seus requisitos alterados por esta mudança; o caso de uso `save-category` é reutilizado sem alteração de contrato -->

## Impact

- **Módulo `modules/category`**: novo arquivo de constantes em `src/category/constants/` e novo caso de uso em `src/category/use-case/` que depende de `CategoryRepository` (já existente) e reutiliza `SaveCategory`
- **Backend** (`apps/backend/src/modules/category`): novo endpoint no `CategoryController` (ou controller dedicado), protegido pelo `JwtGuard` global já existente, usando `@CurrentUser()` para obter o `userId`
- **Sem alteração de schema Prisma**: reutiliza as tabelas `Category`/`Subcategory` e o repositório já existentes
- **Fora de escopo**: alteração de frontend/UI, criação de endpoint ou regra específica para `subcategory` isolada (continua acessível apenas através da raiz `Category`)

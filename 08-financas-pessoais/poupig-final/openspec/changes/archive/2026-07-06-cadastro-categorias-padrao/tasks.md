## 1. Negócio — Catálogo de constantes

- [x] 1.1 Criar `modules/category/src/category/constants/default-categories.constant.ts` exportando um array tipado `DEFAULT_CATEGORIES` com as categorias e subcategorias padrão do sistema (`name`, `icon`, `color` por categoria; `name`, `icon`, `color`, `order` por subcategoria)
- [x] 1.2 Popular o catálogo cobrindo de forma generosa os domínios do orçamento de uma família média brasileira (moradia, alimentação, transporte, saúde, educação, lazer, entre outros pertinentes), cada categoria com múltiplas subcategorias e `order` sequencial único dentro da categoria
- [x] 1.3 Exportar o catálogo pelo barrel do módulo (`modules/category/src/category/constants/index.ts` e `modules/category/src/category/index.ts`)

## 2. Negócio — Caso de uso

- [x] 2.1 Criar o caso de uso `apply-default-categories.use-case` em `modules/category/src/category/use-case`, recebendo o repositório `category` por parâmetro e o `userId` do usuário autenticado como input, usando a skill `module-use-case`
- [x] 2.2 Implementar a iteração sobre `DEFAULT_CATEGORIES`, chamando `SaveCategory.execute` para cada item (novo `id` gerado, `userId` do input, dados da categoria/subcategorias do catálogo); tratar retorno com erro `CATEGORY_NAME_ALREADY_EXISTS` como "categoria ignorada" (sem propagar como falha), e qualquer outro erro como falha real do item
- [x] 2.3 Retornar `Result<void>` (caso de uso de comando, sem dados de leitura no retorno), seguindo o padrão de `SaveCategory`/`DeleteCategory`
- [x] 2.4 Exportar o novo caso de uso pelo barrel (`modules/category/src/category/use-case/index.ts` e `modules/category/src/category/index.ts`)

## 3. Backend — Endpoint

- [x] 3.1 Adicionar o endpoint `POST /categories/default` em `apps/backend/src/modules/category/category.controller.ts`, usando a skill `backend-controller`: sem body obrigatório, `userId` extraído de `@CurrentUser('id')`, instanciando `ApplyDefaultCategories` com `this.categoryPrisma` e retornando `{ success: true }` (mesmo padrão de `SaveCategory`/`DeleteCategory`)
- [x] 3.2 Garantir que o endpoint é rejeitado sem autenticação (herdado do `JwtGuard` global já configurado em `app.module.ts`, sem necessidade de decorator adicional)

## 4. Testes

- [x] 4.1 Testes do caso de uso `apply-default-categories.use-case` (usando o mock `in-memory-category.repository` existente em `modules/category/test/mock`): aplicação do catálogo para usuário sem categorias (todas criadas, retorno de sucesso), reaplicação idempotente (nada é recriado, retorno de sucesso sem erro), e aplicação parcial (usuário já possui uma categoria do catálogo — apenas as demais são criadas, retorno de sucesso)
- [x] 4.2 Teste de integração com o Rest Client (VS Code) para `POST /categories/default`, cobrindo chamada autenticada (categorias criadas) e nova chamada em seguida (idempotência — tudo ignorado)

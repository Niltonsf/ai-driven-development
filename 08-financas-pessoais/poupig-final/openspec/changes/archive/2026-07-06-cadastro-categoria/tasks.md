> **Importante**: as seções "Negócio" (grupos 1 e 2) e "Backend" (grupos 3 a 6) SHALL ser executadas em subagentes separados, cada um com contexto limpo, conforme instrução do documento de origem (`.docs/prompts/11-cadastro-categoria-01.md`).

## 1. Negócio — Domínio do agregado `category`

- [x] 1.1 Criar o agregado `category` sem nenhum caso de uso, usando a skill `module-aggregate`, em `modules/category`
- [x] 1.2 Alterar a entidade `category` (raiz do agregado) com os atributos `id`, `userId`, `name`, `icon` (opcional), `color` (opcional), `isActive` (padrão `true`) e `subcategories` (lista de `Subcategory` composta), usando a skill `module-entity`; reutilizar o VO `HexColor` de `@poupig/shared` para validar `color` e um VO de texto local (padrão `AccountName`) para validar `name` não-vazio
- [x] 1.3 Criar a entidade `subcategory` (filha, composta em `category`) com os atributos `id`, `name`, `icon` (opcional), `color` (opcional), `isActive` (padrão `true`) e `order` (inteiro maior que zero), usando a skill `module-entity`; reutilizar o VO `PositiveInteger` já existente em `@poupig/shared` (`packages/shared/src/vo/positive-integer.vo.ts`) para validar `order` — não criar um novo VO `SubcategoryOrder`
- [x] 1.4 Implementar na entidade `category` a lógica de consistência da lista de subcategorias (adicionar, alterar, remover, validar `order` único dentro da categoria)
- [x] 1.5 Criar a interface `CategoryRepository` com operações `save`, `findById` e `delete`, documentando explicitamente que `save` persiste `category` e todas as suas `subcategories` como uma única unidade transacional, usando a skill `module-repository`
- [x] 1.6 Criar os DTOs `CategoryDTO` e `SubcategoryDTO` em `modules/category/src/category/dto/category.dto.ts` (`CategoryDTO` contém lista de `SubcategoryDTO`), usando a skill `module-dto`
- [x] 1.7 Criar a interface `FindCategoriesByUserIdQuery` em `modules/category/src/category/provider/find-categories-by-user-id.query.ts` com contrato `execute(userId: string): Promise<Result<CategoryDTO[]>>`, retornando subcategorias ordenadas por `order`, usando a skill `module-query-cqrs`

## 2. Negócio — Casos de uso

- [x] 2.1 Criar o caso de uso `save-category.use-case` em `modules/category/src/category/use-case`, recebendo o repositório `category` por parâmetro; fluxo de criação (categoria não existe para o `id`): validar nome único por usuário, criar `category` com `isActive = true`, criar subcategorias validando `order` único, persistir tudo em uma única chamada ao repositório; fluxo de edição (categoria existe): validar autoria (erro de autorização se não pertencer ao usuário), aplicar alterações na raiz, reconciliar lista de subcategorias recebida com a persistida (atualizar por `id`, criar sem `id`, remover ausentes), persistir tudo em uma única chamada ao repositório; usar a skill `module-use-case`
- [x] 2.2 Criar o caso de uso `delete-category.use-case` em `modules/category/src/category/use-case`, recebendo o repositório `category` por parâmetro: buscar por id (erro se não existir), validar autoria (erro de autorização), aplicar soft delete (`deletedAt`) na raiz propagado às subcategorias, na mesma transação; usar a skill `module-use-case`

## 3. Backend — Prisma e Migration

- [x] 3.1 Mapear as entidades `category` e `subcategory` no Prisma em `apps/backend/prisma/models/category.model.prisma`, com FK `subcategory.categoryId → category` e `category.userId → user`, usando a skill `backend-prisma-data`
- [x] 3.2 Executar as migrations do Prisma para criar as tabelas `category` e `subcategory`

## 4. Backend — Repositório e Controller

- [x] 4.1 Criar `category.prisma.ts` em `apps/backend/src/modules/category/` implementando `CategoryRepository`, com `save` persistindo `category` e todas as suas `subcategories` (inclusões, alterações e remoções) dentro de uma única transação Prisma (`prisma.$transaction`); expor `findCategoriesByUserId: FindCategoriesByUserIdQuery` como atributo público tipado, retornando `CategoryDTO[]` com subcategorias ordenadas por `order`
- [x] 4.2 Criar `category.controller.ts` em `apps/backend/src/modules/category/` com os endpoints `POST /categories` (instanciando `save-category.use-case` sem `id`), `GET /categories` (chamando `FindCategoriesByUserIdQuery` diretamente, sem caso de uso), `PUT /categories/:id` (instanciando `save-category.use-case` com `id`) e `DELETE /categories/:id` (instanciando `delete-category.use-case`); todos protegidos por JWT, extraindo `userId` sempre do token, nunca do body

## 5. Backend — Seed e Testes

- [x] 5.1 Criar `apps/backend/prisma/seed/data/categories.json` com ao menos 5 categorias vinculadas ao usuário `usuario@formacao.dev`, cada uma com ao menos 2 subcategorias com `order` sequencial
- [x] 5.2 Executar o seed para popular o banco com as categorias de exemplo
- [x] 5.3 Criar testes de integração com o Rest Client (VS Code) para todos os endpoints de categoria, incluindo payloads com subcategorias (criação, atualização com reconciliação da lista e remoção)

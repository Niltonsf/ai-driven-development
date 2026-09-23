# category-backend Specification

## Purpose
TBD - created by archiving change cadastro-categoria. Update Purpose after archive.
## Requirements
### Requirement: Models Category e Subcategory mapeados no Prisma com FKs para User e Category
O sistema SHALL definir os models `Category` e `Subcategory` no Prisma schema (`apps/backend/prisma/models/category.model.prisma`). `Category.userId` SHALL ter uma relação com o model `User`. `Subcategory` SHALL ter uma relação (`categoryId`) com `Category`. A migration deve criar as tabelas `category` e `subcategory`.

#### Scenario: Migration executada com sucesso
- **WHEN** `prisma migrate dev` é executado após a adição dos models `Category` e `Subcategory`
- **THEN** as tabelas `category` e `subcategory` são criadas no banco, com a FK de `subcategory` para `category` e a FK de `category` para `user`

---

### Requirement: CategoryPrismaRepository persiste o agregado completo em uma única transação
O sistema SHALL implementar `CategoryPrismaRepository` em `apps/backend/src/modules/category/category.prisma.ts`, implementando `CategoryRepository`. O método `save` SHALL persistir a `Category` e todas as suas `Subcategory` (inclusões, alterações e remoções) dentro de uma única transação Prisma (`prisma.$transaction`), garantindo que o agregado nunca fique parcialmente salvo. A query `findCategoriesByUserId: FindCategoriesByUserIdQuery` SHALL ser exposta como atributo público tipado na mesma classe, retornando `CategoryDTO[]` com as subcategorias ordenadas pelo campo `order`.

#### Scenario: Save persiste categoria e subcategorias atomicamente
- **WHEN** `save(category)` é chamado com uma `Category` contendo subcategorias novas, alteradas e removidas em relação ao estado persistido
- **THEN** todas as operações (upsert da raiz, upsert das subcategorias novas/alteradas, delete das removidas) são executadas dentro da mesma transação

#### Scenario: Falha em qualquer etapa reverte a transação inteira
- **WHEN** qualquer operação dentro de `save` falha (ex.: violação de constraint)
- **THEN** nenhuma alteração é persistida, nem na raiz nem nas subcategorias

#### Scenario: Busca de categorias por userId retorna subcategorias ordenadas
- **WHEN** `findCategoriesByUserId.execute(userId)` é chamado
- **THEN** são retornadas as categorias ativas do usuário, cada uma com `subcategories` ordenadas de forma crescente por `order`, mapeadas para `CategoryDTO[]`

---

### Requirement: CategoryController expõe 4 endpoints REST protegidos por JWT
O sistema SHALL implementar `CategoryController` em `apps/backend/src/modules/category/category.controller.ts` com os endpoints:
- `POST /categories` — cria categoria com sua lista de subcategorias, instanciando `SaveCategoryUseCase` sem `id`
- `GET /categories` — lista categorias do usuário autenticado com subcategorias, chamando `FindCategoriesByUserIdQuery` diretamente no método do controller (sem caso de uso)
- `PUT /categories/:id` — atualiza categoria e reconcilia sua lista de subcategorias, instanciando `SaveCategoryUseCase` com `id`
- `DELETE /categories/:id` — desativa categoria (soft delete propagado às subcategorias), instanciando `DeleteCategoryUseCase`

Todos os endpoints MUST ser protegidos com `JwtAuthGuard`. O `userId` MUST ser extraído do token JWT, nunca do body da requisição.

#### Scenario: POST /categories com dados válidos e subcategorias
- **WHEN** usuário autenticado faz POST /categories com `name` válido e uma lista de subcategorias com `order` únicos
- **THEN** a categoria e suas subcategorias são criadas e 201 Created é retornado

#### Scenario: GET /categories retorna categorias do usuário autenticado com subcategorias
- **WHEN** usuário autenticado faz GET /categories
- **THEN** apenas as categorias do próprio usuário são retornadas com status 200, cada uma com sua lista de subcategorias ordenada por `order`

#### Scenario: PUT /categories/:id reconcilia lista de subcategorias
- **WHEN** usuário autenticado faz PUT /categories/:id, sendo dono da categoria, com uma lista de subcategorias que mistura itens existentes (com `id`), novos (sem `id`) e omite algum item previamente persistido
- **THEN** a categoria é atualizada, as subcategorias existentes são atualizadas, as novas são criadas, as omitidas são removidas, e 200 OK é retornado

#### Scenario: DELETE /categories/:id desativa categoria e subcategorias
- **WHEN** usuário autenticado faz DELETE /categories/:id e é dono da categoria
- **THEN** soft delete é aplicado à categoria e a todas as suas subcategorias, e 200 OK é retornado

#### Scenario: Endpoints sem token retornam 401
- **WHEN** qualquer endpoint de /categories é chamado sem token JWT
- **THEN** status 401 Unauthorized é retornado

---

### Requirement: Seed popula banco com 5 categorias de exemplo com subcategorias
O sistema SHALL ter um arquivo `apps/backend/prisma/seed/data/categories.json` com ao menos 5 categorias vinculadas ao usuário `usuario@formacao.dev`, cada uma com pelo menos 2 subcategorias com `order` sequencial.

#### Scenario: Seed executado com sucesso
- **WHEN** o seed de categorias é executado
- **THEN** as 5 categorias e suas respectivas subcategorias são inseridas no banco vinculadas ao usuário padrão, com `order` sequencial dentro de cada categoria

---

### Requirement: Testes de integração via Rest Client cobrem todos os endpoints de categoria
O sistema SHALL conter arquivo `.http` com requisições para todos os 4 endpoints de categoria, incluindo payloads com subcategorias, seguindo o padrão Rest Client do projeto.

#### Scenario: Arquivo de testes REST existe e cobre os 4 endpoints com subcategorias
- **WHEN** o arquivo `.http` de categorias é aberto no VS Code com Rest Client
- **THEN** estão presentes requisições para POST (criação com subcategorias), GET, PUT (atualização com reconciliação da lista) e DELETE de /categories


# Negócio

- Criar o agregado de `category` sem nenhum caso de uso. (skill: module-aggregate)

- Alterar a entidade `category` (raiz do agregado) para possuir os seguintes atributos:
  - `id` — identificador único da categoria
  - `userId` — id do usuário dono da categoria (relacionamento por ID)
  - `name` — nome da categoria (obrigatório)
  - `icon` — nome ou identificador do ícone (opcional)
  - `color` — cor em hexadecimal, ex: `#FF5733` (opcional)
  - `isActive` — indica se a categoria está ativa; padrão `true`
  - `subcategories` — lista de entidades `Subcategory` compostas na raiz

  Usar objetos de valor para validar os atributos (ex.: validar formato hexadecimal da cor reutilizando o VO já usado nos módulos `account`/`credit-card`, garantir que `name` não seja vazio). (skill: module-entity)

- Criar a entidade `subcategory` (entidade filha do agregado, composta dentro de `category`) com os seguintes atributos:
  - `id` — identificador único da subcategoria
  - `name` — nome da subcategoria (obrigatório)
  - `icon` — nome ou identificador do ícone (opcional)
  - `color` — cor em hexadecimal (opcional)
  - `isActive` — indica se a subcategoria está ativa; padrão `true`
  - `order` — posição de exibição da subcategoria, número inteiro maior que zero (1, 2, 3, ...)

  Verificar se já existe no projeto um objeto de valor reutilizável para validar números inteiros maiores que zero (o módulo `credit-card` já possui exemplos semelhantes de VOs numéricos, como `DueDay`/`ClosingDay`); caso não exista, criar um novo VO (ex.: `SubcategoryOrder`) seguindo esse mesmo padrão, garantindo que o valor seja um inteiro positivo. (skill: module-entity)

  > Importante: `category` e `subcategory` formam um único agregado. A raiz (`category`) é responsável por manter a consistência da lista de subcategorias (adicionar, alterar, remover, validar duplicidade de `order`). A entidade `subcategory` não deve ter repositório, caso de uso ou endpoint próprios — ela só existe dentro do ciclo de vida de uma `category` e é sempre lida e persistida junto com a raiz, na mesma transação.

- Criar a interface `category.repository` para persistir o agregado completo (a raiz `category` e sua lista de `subcategories`), incluindo: salvar (`save`), buscar por id (`findById`) e deletar (`delete`). O contrato deve deixar explícito que `save` persiste `category` e todas as suas `subcategories` como uma única unidade transacional (tudo ou nada). Seguir o padrão de nomenclatura do projeto. (skill: module-repository)

- Criar os DTOs `CategoryDTO` e `SubcategoryDTO` em `modules/category/src/category/dto/category.dto.ts`, sendo que `CategoryDTO` contém uma lista de `SubcategoryDTO`. No primeiro momento podem herdar de `CategoryProps`/`SubcategoryProps` diretamente, caso isso seja apropriado, ou com `Omit` se algum campo não fizer sentido expor ao consumidor. (skill: module-dto)

- Criar a interface de query `FindCategoriesByUserIdQuery` em `modules/category/src/category/provider/find-categories-by-user-id.query.ts` seguindo o contrato `execute(userId: string): Promise<Result<CategoryDTO[]>>`, retornando cada categoria já com sua lista de subcategorias ordenada pelo atributo `order`. (skill: module-query-cqrs)

- Criar o caso de uso `save-category.use-case` dentro de `modules/category/src/category/use-case` que recebe por parâmetro o repositório `category`. O `id` da categoria sempre é informado. Junto com os dados da raiz, o caso de uso recebe a lista completa de subcategorias desejada para aquela categoria (subcategorias existentes vêm com `id`, novas vêm sem `id`). O caso de uso suporta os fluxos de criação e alteração determinados pela busca no repositório:
  - Se a categoria **não existir** para o `id` informado, é um fluxo de criação (verificar se já existe categoria com o mesmo nome para o usuário — pode gerar erro, criar a entidade `category` com `isActive = true` por padrão, criar as subcategorias informadas validando que os valores de `order` sejam únicos dentro da categoria, e persistir tudo em uma única chamada ao repositório).
  - Se a categoria **já existir**, é um fluxo de alteração (verificar se pertence ao usuário autenticado — pode gerar erro de autorização, aplicar as alterações permitidas na raiz, reconciliar a lista de subcategorias recebida com a lista persistida — atualizando as existentes por `id`, criando as novas sem `id` e removendo as que não estiverem mais presentes na lista — e persistir tudo em uma única chamada ao repositório). (skill: module-use-case)

- Criar o caso de uso `delete-category.use-case` dentro de `modules/category/src/category/use-case` que recebe por parâmetro o repositório `category`. O fluxo é: buscar a categoria por id (pode gerar erro caso não exista), verificar se pertence ao usuário autenticado (pode gerar erro de autorização) e deletar via soft delete usando o campo apropriado da entidade (ex.: `deletedAt`), aplicado à raiz e propagado às suas subcategorias, na mesma transação. (skill: module-use-case)

> Os passos dos casos de uso podem gerar erros e parar o processo.

# Backend

- Mapear as entidades `category` e `subcategory` com o Prisma em `apps/backend/prisma/models/category.model.prisma`. `Subcategory` deve ter uma relação (chave estrangeira `categoryId`) com `Category`, e `Category.userId` deve ter uma relação com o model `User`. (skill: backend-prisma-data)
- Executar as migrations do Prisma para criar as tabelas `category` e `subcategory`.

- Criar uma implementação do repositório de `category` usando o Prisma (`apps/backend/src/modules/category/category.prisma.ts`). O método `save` deve persistir a `category` e todas as suas `subcategories` (inclusões, alterações e remoções) dentro de uma única transação do Prisma (`prisma.$transaction`), garantindo que o agregado nunca fique parcialmente salvo. A query também é implementada nessa mesma classe, exposta como um atributo público tipado com a interface correspondente (ex.: `findCategoriesByUserId: FindCategoriesByUserIdQuery`), retornando `CategoryDTO[]` com as subcategorias já ordenadas pelo campo `order`.

- Criar o `category.controller` em `apps/backend/src/modules/category/category.controller.ts` com os seguintes endpoints (todos protegidos por JWT):
  - `POST /categories` — criar categoria (com sua lista de subcategorias), instanciando `save-category.use-case` sem `id`
  - `GET /categories` — listar categorias do usuário autenticado (com subcategorias), chamando `FindCategoriesByUserIdQuery` diretamente no método do controller (sem caso de uso)
  - `PUT /categories/:id` — atualizar categoria e reconciliar sua lista de subcategorias, instanciando `save-category.use-case` com `id`
  - `DELETE /categories/:id` — desativar categoria (exclusão lógica, propagada às subcategorias), instanciando `delete-category.use-case`

  O `userId` deve ser extraído do token JWT em todos os endpoints, nunca vir do body da requisição.

- Criar o seed de banco de dados em `apps/backend/prisma/seed/data/categories.json` com ao menos 5 categorias de exemplo vinculadas ao usuário `usuario@formacao.dev`, cada uma com pelo menos 2 subcategorias com `order` sequencial.
- Executar o seed para popular o banco com as categorias de exemplo.

- Criar os testes de integração (usando o padrão do Rest Client — Plugin do VS Code) para todos os endpoints de categoria, incluindo payloads com subcategorias (criação, atualização com reconciliação da lista e remoção).

> Obs: IMPORTANTE!!! Executar as duas partes (Negócio e Backend) em subagentes separados com contexto limpo em cada um deles

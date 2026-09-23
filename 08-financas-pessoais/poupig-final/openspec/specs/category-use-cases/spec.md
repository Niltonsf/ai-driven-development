# category-use-cases Specification

## Purpose
TBD - created by archiving change cadastro-categoria. Update Purpose after archive.
## Requirements
### Requirement: save-category.use-case suporta criação e edição do agregado com reconciliação de subcategorias
O sistema SHALL implementar `SaveCategoryUseCase` em `modules/category/src/category/use-case/save-category.use-case.ts`, recebendo o repositório `category` por parâmetro. O caso de uso sempre recebe `id` e a lista completa de subcategorias desejada (existentes com `id`, novas sem `id`). O fluxo (criação ou edição) é determinado pela existência da categoria no repositório para o `id` informado.

#### Scenario: Criação de nova categoria com nome único para o usuário
- **WHEN** `SaveCategoryUseCase.execute` é chamado com um `id` inexistente no repositório e o `userId` não possui outra categoria com o mesmo `name`
- **THEN** uma nova categoria é criada com `isActive = true`, as subcategorias informadas são criadas com valores de `order` únicos, e tudo é persistido em uma única chamada ao repositório

#### Scenario: Criação com nome duplicado para o mesmo usuário
- **WHEN** `SaveCategoryUseCase.execute` é chamado com um `id` inexistente mas o `userId` já possui categoria com o mesmo `name`
- **THEN** o caso de uso retorna erro indicando nome de categoria já existente para o usuário, sem persistir nada

#### Scenario: Criação com subcategorias com order duplicado
- **WHEN** `SaveCategoryUseCase.execute` é chamado no fluxo de criação com duas subcategorias possuindo o mesmo `order`
- **THEN** o caso de uso retorna erro de duplicidade de `order`, sem persistir nada

#### Scenario: Edição de categoria existente pelo dono
- **WHEN** `SaveCategoryUseCase.execute` é chamado com `id` de uma categoria existente e o `userId` corresponde ao dono da categoria
- **THEN** os campos alteráveis da raiz são atualizados e a lista de subcategorias é reconciliada com a persistida

#### Scenario: Reconciliação atualiza subcategorias existentes por id
- **WHEN** a lista de subcategorias recebida contém um item com `id` que já existe na categoria persistida
- **THEN** a subcategoria correspondente é atualizada com os novos valores, mantendo seu `id`

#### Scenario: Reconciliação cria novas subcategorias sem id
- **WHEN** a lista de subcategorias recebida contém um item sem `id`
- **THEN** uma nova subcategoria é criada e associada à categoria

#### Scenario: Reconciliação remove subcategorias ausentes da lista recebida
- **WHEN** uma subcategoria persistida não está presente (por `id`) na lista de subcategorias recebida
- **THEN** essa subcategoria é removida da categoria antes da persistência

#### Scenario: Edição de categoria de outro usuário
- **WHEN** `SaveCategoryUseCase.execute` é chamado com `id` de uma categoria cujo `userId` difere do `userId` fornecido
- **THEN** o caso de uso retorna erro de autorização, sem persistir nada

---

### Requirement: delete-category.use-case realiza soft delete propagado às subcategorias
O sistema SHALL implementar `DeleteCategoryUseCase` em `modules/category/src/category/use-case/delete-category.use-case.ts`, recebendo o repositório `category` por parâmetro. O caso de uso busca a categoria por id, valida autoria e realiza soft delete na raiz propagado a todas as suas subcategorias, na mesma transação.

#### Scenario: Exclusão lógica de categoria existente pelo dono
- **WHEN** `DeleteCategoryUseCase.execute` é chamado com `id` de categoria existente e `userId` correspondente ao dono
- **THEN** o campo de soft delete (`deletedAt`) da raiz e de todas as suas subcategorias é preenchido e a categoria é persistida como inativa

#### Scenario: Tentativa de exclusão de categoria inexistente
- **WHEN** `DeleteCategoryUseCase.execute` é chamado com `id` que não existe no repositório
- **THEN** o caso de uso retorna erro indicando categoria não encontrada

#### Scenario: Tentativa de exclusão de categoria de outro usuário
- **WHEN** `DeleteCategoryUseCase.execute` é chamado com `id` de categoria existente mas `userId` diferente do dono
- **THEN** o caso de uso retorna erro de autorização


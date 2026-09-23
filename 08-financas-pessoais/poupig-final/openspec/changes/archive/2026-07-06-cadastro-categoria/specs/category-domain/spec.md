## ADDED Requirements

### Requirement: Agregado Category existe no pacote de domínio
O sistema SHALL expor um agregado `category` no pacote `modules/category`, criado via `module-aggregate`, sem casos de uso iniciais no agregado.

#### Scenario: Módulo category está disponível para importação
- **WHEN** outro módulo importa de `modules/category`
- **THEN** o pacote resolve sem erros e exporta o agregado `Category`

---

### Requirement: Entidade Category possui os atributos obrigatórios e opcionais definidos
A entidade `Category` (raiz do agregado) SHALL conter os campos: `id` (obrigatório), `userId` (obrigatório), `name` (obrigatório), `icon` (opcional), `color` (opcional, hex), `isActive` (obrigatório, padrão `true`), `subcategories` (lista de entidades `Subcategory` compostas na raiz).

#### Scenario: Criação de categoria com campos obrigatórios
- **WHEN** `Category.create` é chamado com `id`, `userId` e `name` válidos
- **THEN** a entidade é criada com `isActive = true`, `subcategories` vazia por padrão e campos opcionais como `undefined`

#### Scenario: Criação de categoria com name vazio
- **WHEN** `Category.create` é chamado com `name` vazio ou em branco
- **THEN** um erro de domínio é retornado indicando que o nome é obrigatório

#### Scenario: Criação de categoria com color em formato inválido
- **WHEN** `Category.create` é chamado com `color` que não segue o padrão hexadecimal
- **THEN** um erro de domínio é retornado indicando formato de cor inválido, reutilizando o VO `HexColor` do pacote compartilhado

#### Scenario: Criação de categoria com color válido
- **WHEN** `Category.create` é chamado com `color: "#FF5733"`
- **THEN** a entidade é criada com `color` armazenado como informado

---

### Requirement: Entidade Subcategory é composta na raiz Category
A entidade `Subcategory` SHALL conter os campos: `id` (obrigatório), `name` (obrigatório), `icon` (opcional), `color` (opcional, hex), `isActive` (obrigatório, padrão `true`), `order` (obrigatório, inteiro maior que zero). `Subcategory` SHALL existir apenas como parte da lista `subcategories` de uma `Category` — sem repositório, caso de uso ou endpoint próprios.

#### Scenario: Criação de subcategoria com campos obrigatórios
- **WHEN** uma subcategoria é criada com `id`, `name` e `order` válidos dentro de uma `Category`
- **THEN** a entidade é criada com `isActive = true` e campos opcionais como `undefined`

#### Scenario: Criação de subcategoria com order inválido
- **WHEN** uma subcategoria é criada com `order` igual a zero, negativo ou não inteiro
- **THEN** um erro de domínio é retornado indicando valor de `order` inválido

#### Scenario: Criação de subcategoria com order válido
- **WHEN** uma subcategoria é criada com `order: 1` (ou outro inteiro positivo)
- **THEN** a entidade é criada com o valor de `order` reutilizando o VO `PositiveInteger` do pacote compartilhado

---

### Requirement: Category garante consistência da lista de subcategorias
A raiz `Category` SHALL ser responsável por adicionar, alterar e remover subcategorias, garantindo que não existam dois `order` iguais dentro da mesma categoria.

#### Scenario: Duas subcategorias com order duplicado são rejeitadas
- **WHEN** a lista de subcategorias de uma `Category` contém duas subcategorias com o mesmo valor de `order`
- **THEN** um erro de domínio é retornado indicando duplicidade de `order`

#### Scenario: Lista de subcategorias com order únicos é aceita
- **WHEN** a lista de subcategorias de uma `Category` contém apenas valores de `order` distintos
- **THEN** a categoria é criada ou atualizada normalmente

---

### Requirement: Interface CategoryRepository define operações de persistência do agregado completo
O sistema SHALL definir a interface `CategoryRepository` com os métodos: `save(category: Category): Promise<Result<void>>`, `findById(id: string): Promise<Result<Category | null>>`, `delete(id: string): Promise<Result<void>>`. O contrato SHALL deixar explícito, em documentação da interface, que `save` persiste a `Category` e todas as suas `Subcategory` como uma única unidade transacional (tudo ou nada).

#### Scenario: Interface exportada do módulo
- **WHEN** o módulo `modules/category` é importado
- **THEN** `CategoryRepository` está disponível como tipo TypeScript

---

### Requirement: CategoryDTO e SubcategoryDTO expõem os dados do agregado para consumidores
O sistema SHALL definir `CategoryDTO` e `SubcategoryDTO` em `modules/category/src/category/dto/category.dto.ts`. `CategoryDTO` SHALL conter uma lista de `SubcategoryDTO`.

#### Scenario: DTO contém todos os campos da entidade
- **WHEN** uma categoria com subcategorias é mapeada para `CategoryDTO`
- **THEN** todos os campos da raiz estão presentes no DTO e cada subcategoria é representada como `SubcategoryDTO`

---

### Requirement: FindCategoriesByUserIdQuery define contrato de consulta por usuário
O sistema SHALL definir a interface `FindCategoriesByUserIdQuery` em `modules/category/src/category/provider/find-categories-by-user-id.query.ts` com o método `execute(userId: string): Promise<Result<CategoryDTO[]>>`, retornando cada categoria com sua lista de subcategorias ordenada pelo atributo `order`.

#### Scenario: Interface de query exportada do módulo
- **WHEN** o módulo `modules/category` é importado
- **THEN** `FindCategoriesByUserIdQuery` está disponível como tipo TypeScript

#### Scenario: Subcategorias retornadas em ordem
- **WHEN** `FindCategoriesByUserIdQuery.execute(userId)` é chamado para um usuário com categorias que possuem subcategorias
- **THEN** a lista de subcategorias de cada categoria retornada está ordenada de forma crescente pelo atributo `order`

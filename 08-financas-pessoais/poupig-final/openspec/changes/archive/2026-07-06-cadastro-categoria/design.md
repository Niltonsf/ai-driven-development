## Context

O monorepo Poupig já implementa dois módulos de domínio completos (`account` e `credit-card`) seguindo um padrão consistente: pacote `modules/<nome>` com entidade + VOs + repositório + DTO + query + casos de uso, e implementação backend em `apps/backend/src/modules/<nome>` com Prisma repository + controller + seed + testes `.http`. O módulo `category` já possui um scaffold vazio em ambos os lados (`modules/category` e `apps/backend/src/modules/category`), criado mas não implementado.

Diferente de `account`/`credit-card`, `category` é o primeiro agregado do projeto com uma entidade filha composta (`subcategory`). Isso exige decisões específicas sobre onde fica a responsabilidade de consistência (raiz vs. filha) e como a persistência transacional do agregado completo é feita.

## Goals / Non-Goals

**Goals:**
- Definir o agregado `category`/`subcategory` com a raiz (`Category`) responsável por toda a consistência da lista de subcategorias
- Garantir que `save` do repositório persista raiz + subcategorias como uma única unidade transacional
- Reutilizar VOs já existentes no `@poupig/shared` (`HexColor`, `PositiveInteger`) em vez de recriar validações
- Um único caso de uso (`save-category`) cobrindo criação e edição, com reconciliação de subcategorias (update/create/delete por diff de `id`)
- Soft delete em cascata (raiz → subcategorias) na mesma transação

**Non-Goals:**
- Nenhuma alteração de frontend/UI nesta mudança
- Nenhum endpoint, repositório ou caso de uso próprio para `subcategory` — ela só é acessada através do agregado `category`
- Não há reordenação automática de `order`; a unicidade é apenas validada, não corrigida pelo sistema

## Decisions

### 1. `Category` é a raiz do agregado; `Subcategory` não tem identidade fora dela
`Subcategory` é modelada como entidade (tem `id` próprio, necessário para o front distinguir itens existentes de novos na reconciliação), mas **composta** dentro de `Category` — sem repositório, query ou caso de uso próprios. Toda leitura/escrita de subcategoria passa pela raiz. Isso segue explicitamente a instrução do documento de origem e o padrão DDD de agregados: a raiz é o único ponto de entrada para garantir invariantes (unicidade de `order`).

**Alternativa considerada**: tratar `subcategory` como módulo/entidade independente com seu próprio repositório. Rejeitada porque quebraria a invariante de unicidade de `order` por categoria (validação ficaria espalhada) e adicionaria complexidade transacional desnecessária (duas transações em vez de uma).

### 2. Reuso de VOs existentes do `@poupig/shared`
- `color` (`category`/`subcategory`): reutiliza `HexColor` (já usado em `account`/`credit-card`), sem criar um VO novo.
- `order` (`subcategory`): o pacote `@poupig/shared` já expõe `PositiveInteger` (`packages/shared/src/vo/positive-integer.vo.ts`), que valida exatamente "inteiro maior que zero" — o mesmo requisito do documento de origem. **Não é necessário criar `SubcategoryOrder`**; o VO existente é usado diretamente. Isso evita duplicar uma validação que já existe e mantém o padrão de reuso do projeto (mesmo espírito de `DueDay`/`ClosingDay`, que são específicos de `credit-card` porque validam uma faixa 1–31, algo que `order` não precisa).
- `name` (`category`/`subcategory`): VO de texto local no módulo (seguindo o padrão `AccountName extends Text`), garantindo não-vazio.

**Alternativa considerada**: criar `SubcategoryOrder` como wrapper fino sobre `PositiveInteger` para dar semântica de domínio ao tipo. Rejeitada por ora (redundante) — pode ser revisitado se `order` precisar de regras adicionais no futuro (ex.: limite máximo).

### 3. Um único caso de uso `save-category` cobre criação e edição
Assim como `save-account`, a existência da categoria no repositório (por `id`) determina o fluxo:
- **Criação** (categoria não encontrada): valida nome único por `userId`, cria `Category` com `isActive = true`, cria todas as subcategorias informadas (sempre sem `id` nesse fluxo) validando `order` único, persiste tudo em uma chamada a `save`.
- **Edição** (categoria encontrada): valida que `category.userId === input.userId` (senão erro de autorização), aplica alterações na raiz, e reconcilia a lista de subcategorias recebida contra a lista persistida:
  - subcategorias com `id` presente na lista recebida E na persistida → atualiza campos
  - subcategorias sem `id` → cria novas
  - subcategorias persistidas cujo `id` não está mais na lista recebida → remove
  - valida unicidade de `order` no resultado final antes de persistir

A reconciliação (diff) é responsabilidade de um método na entidade `Category` (ex.: `replaceSubcategories(desired: SubcategoryInput[])`), não do caso de uso — mantendo a lógica de invariante do agregado dentro do domínio.

**Alternativa considerada**: dois casos de uso separados (`create-category` / `update-category`). Rejeitada para seguir o mesmo padrão já adotado em `account`/`credit-card` (`save-*`) e porque o documento de origem pede explicitamente um único caso de uso.

### 4. Persistência transacional do agregado completo
`CategoryPrismaRepository.save()` usa `prisma.$transaction` para: upsert da raiz `Category`, upsert das subcategorias atualizadas/novas, e delete das subcategorias removidas — tudo dentro da mesma transação, garantindo que o agregado nunca fique parcialmente salvo (falha em qualquer passo reverte tudo). Isso difere do `account.prisma.ts` atual (que usa `upsert` simples sem `$transaction` explícito, pois não há sub-entidades), sendo a primeira vez que o padrão transacional é necessário no projeto.

O soft delete (`delete-category`) também roda em transação: marca `deletedAt` na raiz e em todas as subcategorias associadas.

### 5. Query dedicada para leitura ordenada
`FindCategoriesByUserIdQuery` é implementada na mesma classe `CategoryPrismaRepository` (como atributo público tipado, replicando o padrão de `findAccountsByUserId`), retornando `CategoryDTO[]` com `subcategories` já ordenadas por `order` (`orderBy: { order: 'asc' }` na consulta Prisma).

### 6. Modelagem Prisma
- `Category`: `id`, `userId` (FK → `User`), `name`, `icon?`, `color?`, `isActive`, timestamps + `deletedAt`
- `Subcategory`: `id`, `categoryId` (FK → `Category`, `onDelete: Cascade`), `name`, `icon?`, `color?`, `isActive`, `order` (Int), timestamps + `deletedAt`
- Índice único recomendado em `(categoryId, order)` a nível de aplicação (validado no domínio); não é obrigatório como constraint de banco nesta primeira versão, para não travar a reconciliação transacional em casos intermediários (ex.: troca de `order` entre duas subcategorias exigiria estado intermediário inválido se fosse `unique` no banco).

## Risks / Trade-offs

- **[Risco]** Ausência de constraint `UNIQUE(categoryId, order)` no banco → duas subcategorias da mesma categoria poderiam, em tese, ficar com `order` duplicado se o caminho transacional falhar de forma inesperada. **Mitigação**: validação de unicidade é feita no domínio (`Category`) antes de qualquer persistência, e toda a escrita ocorre em uma única transação Prisma — falha em qualquer parte reverte o conjunto todo.
- **[Trade-off]** Reconciliação de subcategorias (diff completo por `id`) é mais custosa que um simples upsert, mas é necessária para suportar remoção de subcategorias que não sejam informadas na próxima chamada de `save-category` — requisito explícito do documento de origem.
- **[Risco]** Reutilizar `PositiveInteger` genérico (em vez de um VO `SubcategoryOrder` próprio) significa que mensagens de erro de validação não são específicas do domínio de subcategoria. **Mitigação**: aceitável para o escopo atual; o caso de uso/entidade pode envolver o erro genérico em uma mensagem de domínio mais específica ao propagar o `Result` de falha.

## Migration Plan

1. Implementar domínio (`modules/category`): entidade `Category`, entidade `Subcategory`, VOs reutilizados, repositório, DTOs, query, casos de uso `save-category` e `delete-category` — sem tocar em banco de dados.
2. Mapear models Prisma (`category.model.prisma`) e rodar `prisma migrate dev` para criar as tabelas `category` e `subcategory`.
3. Implementar `CategoryPrismaRepository` e `CategoryController`, expondo os 4 endpoints.
4. Popular `apps/backend/prisma/seed/data/categories.json` e rodar o seed.
5. Criar testes `.http` de integração cobrindo os 4 endpoints, incluindo cenários de reconciliação de subcategorias.

Não há rollback de dados necessário: trata-se de tabelas novas, sem impacto em dados existentes. Rollback, se necessário, é reverter a migration Prisma correspondente.

## Open Questions

- Deve haver um limite máximo de subcategorias por categoria? Não especificado no documento de origem — assumido sem limite nesta versão.

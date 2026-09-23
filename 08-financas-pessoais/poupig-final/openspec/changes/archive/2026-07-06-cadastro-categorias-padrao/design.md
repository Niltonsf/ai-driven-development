## Context

O módulo `category` já implementa o agregado `Category`/`Subcategory`, o repositório (`CategoryRepository`/`CategoryPrisma`) e o caso de uso `SaveCategory`, que cria ou edita uma categoria (com suas subcategorias) e já valida nome duplicado por `userId` (`CATEGORY_NAME_ALREADY_EXISTS`). O que falta é uma forma de o usuário autenticado popular, de uma vez, um conjunto grande e padronizado de categorias/subcategorias — sem precisar chamar `POST /categories` dezenas de vezes manualmente.

Esta mudança não é um seed de banco para ambiente de desenvolvimento (isso já existe em `apps/backend/prisma/seed/data/categories.json`, vinculado a um usuário fixo de teste). É uma funcionalidade de produto: qualquer usuário autenticado pode disparar o cadastro do catálogo padrão para a própria conta, quantas vezes quiser, sem duplicar nem falhar por causa de categorias já existentes.

## Goals / Non-Goals

**Goals:**
- Um catálogo de constantes, no domínio (`modules/category`), com categorias e subcategorias padrão cobrindo de forma generosa o orçamento de uma família média brasileira (moradia, alimentação, transporte, saúde, educação, lazer, etc.)
- Um caso de uso que aplica esse catálogo para o `userId` autenticado, reutilizando integralmente as regras de `SaveCategory` (mesma validação de nome duplicado, mesma criação de subcategorias)
- Idempotência: categorias cujo nome já existe para o usuário são ignoradas (não é erro); apenas as inexistentes são criadas. Repetir a chamada não duplica nem falha.
- Endpoint HTTP protegido por JWT que dispara esse caso de uso, obtendo `userId` exclusivamente de `@CurrentUser()` (nunca do body)

**Non-Goals:**
- Não é seleção parcial do catálogo pelo usuário (ex.: escolher quais categorias aplicar) — a operação sempre tenta aplicar o catálogo completo
- Não atualiza/sincroniza categorias já existentes com os valores do catálogo (ex.: se o usuário já tem "Alimentação" com outro ícone, o padrão não sobrescreve — apenas é ignorado)
- Não altera o seed de desenvolvimento (`prisma/seed/data/categories.json`) nem o caso de uso `SaveCategory` existente
- Não inclui UI/frontend para disparar a ação nesta mudança

## Decisions

### 1. Catálogo como constante TypeScript tipada, dentro do domínio
O catálogo fica em `modules/category/src/category/constants/default-categories.constant.ts`, exportando um array tipado (`DEFAULT_CATEGORIES: readonly DefaultCategoryDefinition[]`), não um JSON solto. Cada item de categoria expõe `name`, `icon`, `color` e uma lista `subcategories` (cada uma com `name`, `icon`, `color`, `order`). TypeScript dá checagem de tipos em tempo de build e mantém o dado no mesmo pacote que o consome — diferente do JSON de seed de banco (`prisma/seed/data`), que é infraestrutura de desenvolvimento e vive no backend.

**Alternativa considerada**: JSON importado via `require`/`import ... assert { type: 'json' }`. Rejeitada por não dar tipagem estática amigável dentro do pacote de domínio e por misturar convenção com os dados de seed de banco, que têm propósito diferente (popular um usuário de teste fixo, não uma ação de produto).

### 2. Reuso de `SaveCategory` sem alterar seu contrato; duplicidade tratada como "pular", não como erro
O novo caso de uso (`ApplyDefaultCategories`) itera o catálogo e, para cada categoria padrão, chama `SaveCategory.execute({ id: randomUUID(), userId, name, icon, color, subcategories })`. Como o item ainda não existe, isso sempre cai no fluxo de criação de `SaveCategory`, que já valida nome duplicado por `userId`. Se o resultado falhar com `CATEGORY_NAME_ALREADY_EXISTS`, o caso de uso trata isso como "categoria já existe, pular" (não propaga como falha do lote). Qualquer outra falha retornada por `SaveCategory` (ex.: erro de validação de VO, `DUPLICATE_SUBCATEGORY_ORDER`) é tratada como falha real — indicaria um problema nos dados do catálogo, não uma condição esperada — e é propagada, sem impedir a tentativa das demais categorias do lote.

**Alternativa considerada**: adicionar um novo método/flag em `SaveCategory` (ex.: `skipIfExists`) para não tratar duplicidade como erro. Rejeitada para não alterar o contrato de um caso de uso já existente e testado; a composição no caso de uso novo é suficiente e mantém `SaveCategory` com responsabilidade única (criar/editar uma categoria).

**Alternativa considerada**: verificar existência previamente via `categoryRepository.findByNameAndUserId` antes de chamar `SaveCategory`, evitando depender do erro de duplicidade. Rejeitada por duplicar a mesma consulta que `SaveCategory` já faz internamente (uma chamada extra ao repositório por categoria, sem ganho real) — usar o retorno de erro de `SaveCategory` é mais direto e reaproveita 100% da regra existente, conforme pedido explícito do documento de origem.

### 3. Processamento item a item, sem transação única para o lote inteiro
Cada categoria do catálogo é aplicada com uma chamada independente a `SaveCategory` (que já é transacional internamente, via `CategoryPrisma.save`). O lote como um todo **não** roda em uma única transação de banco: se uma categoria falhar por um motivo inesperado, as demais continuam sendo processadas. Isso é adequado porque o catálogo é grande e heterogêneo — uma falha isolada (ex.: um dado malformado em uma categoria) não deve impedir que o restante do catálogo seja aplicado.

**Alternativa considerada**: envolver todo o lote em uma transação Prisma única (tudo ou nada). Rejeitada porque uma falha pontual (improvável, já que o catálogo é estático e validado em build) reverteria categorias válidas já processadas, piorando a experiência sem benefício real — não há requisito de atomicidade entre categorias distintas.

### 4. Caso de uso de comando retorna `void`, seguindo o padrão da arquitetura
`ApplyDefaultCategories.execute` retorna `Result<void>`, assim como todo caso de uso de comando do projeto (ex.: `SaveCategory`, `DeleteCategory`) — casos de uso de comando não retornam dados de leitura, apenas sucesso ou falha. Categorias ignoradas por já existirem para o usuário não geram falha (o `Result` final é sucesso). Uma falha "real" (não relacionada a duplicidade) em qualquer item do catálogo faz o `Result` final falhar, listando os erros acumulados, mas sem desfazer as categorias já criadas nas iterações anteriores. Se o chamador precisar saber quais categorias existem para o usuário após a operação, deve consultar `FindCategoriesByUserIdQuery` (já existente), como já é feito após `SaveCategory`.

**Alternativa considerada**: retornar `Result<ApplyDefaultCategoriesOutput>` com `createdNames`/`skippedNames`. Rejeitada por quebrar o padrão de arquitetura já estabelecido (casos de uso de comando retornam `void`) sem necessidade real — a consulta já existente (`FindCategoriesByUserIdQuery`) cobre qualquer necessidade de leitura pós-operação.

### 5. Endpoint dedicado, fora do CRUD padrão de `categories`
Novo endpoint `POST /categories/default` (ou `/categories/defaults`) no `CategoryController` existente, protegido pelo `JwtGuard` global já configurado (`APP_GUARD` em `app.module.ts`) — não requer decorator adicional. `userId` vem de `@CurrentUser('id')`, nunca do corpo da requisição (que, aliás, não é necessário para este endpoint). Como o caso de uso retorna `void`, a resposta segue o mesmo padrão já usado para `SaveCategory`/`DeleteCategory` no controller (`{ success: true }` em caso de sucesso), sem listar categorias criadas/ignoradas.

**Alternativa considerada**: expor como parte do `POST /categories` existente (ex.: um body especial). Rejeitada por misturar semânticas diferentes (criar uma categoria vs. aplicar um catálogo inteiro) no mesmo endpoint, dificultando o contrato da API.

## Risks / Trade-offs

- **[Risco]** Falha isolada em uma categoria do catálogo interrompe apenas aquele item, mas o `Result` final do lote fica "failure" mesmo com a maioria das categorias aplicadas com sucesso, e como o caso de uso retorna `void`, o chamador não recebe automaticamente a lista do que foi de fato criado. **Mitigação**: os erros acumulados no `Result` de falha identificam os itens do catálogo que falharam por motivo real (não duplicidade); as categorias efetivamente criadas podem ser confirmadas, se necessário, consultando `FindCategoriesByUserIdQuery` (já existente).
- **[Trade-off]** Chamar `SaveCategory.execute` por categoria (N chamadas ao repositório) é menos eficiente que um `insert` em lote direto no banco, mas garante 100% de reuso das regras de domínio já validadas (nome único, criação de subcategorias, VOs) — coerente com o pedido explícito do documento de origem de reaproveitar `save-category`.
- **[Risco]** O catálogo estático pode ficar desatualizado ou incompleto em relação às necessidades reais dos usuários. **Mitigação**: fora de escopo desta mudança; o catálogo pode ser revisado/ampliado em mudanças futuras sem impacto no caso de uso ou no endpoint.

## Migration Plan

1. Criar o catálogo de constantes (`modules/category/src/category/constants/default-categories.constant.ts`) com todas as categorias e subcategorias padrão.
2. Criar o caso de uso `ApplyDefaultCategories` em `modules/category/src/category/use-case/`, consumindo o catálogo e `CategoryRepository` (via `SaveCategory`).
3. Exportar o novo caso de uso pelo barrel (`modules/category/src/category/use-case/index.ts` e `modules/category/src/category/index.ts`).
4. Adicionar o endpoint `POST /categories/default` no `CategoryController` existente, instanciando `ApplyDefaultCategories` com `CategoryPrisma` (já injetado no controller).
5. Testes: caso de uso (catálogo aplicado do zero, catálogo reaplicado com tudo já existente — todos ignorados, catálogo aplicado parcialmente com o usuário já tendo algumas categorias) e teste de integração `.http` do endpoint.

Não há migration de banco (schema já existente é reutilizado) nem necessidade de rollback de dados — trata-se apenas de inserir categorias para o usuário que disparar a ação, dado já removível manualmente pelos endpoints existentes (`DELETE /categories/:id`) caso necessário.

## Open Questions

- O nome exato do endpoint (`/categories/default` vs. `/categories/defaults` vs. `/categories/apply-defaults`) pode ser ajustado na implementação sem impacto no restante do design.

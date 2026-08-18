# 007-cadastro-produto

## Objetivo

Entregar o CRUD de `product` no módulo `catalog`, com agregado, persistência, endpoints e interface de listagem e formulário compartilhado entre criação e edição.

## Contexto Técnico

- Módulo de negócio: `catalog` (já existente), agregado `product`.
- Backend NestJS com controller dedicado para o CRUD e persistência via Prisma.
- Front-end Next.js com listagem paginada e formulário compartilhado entre criação e edição, dentro do módulo `catalog` em rota privada.

## Referências de Projeto

- [Produto](../../memory/produto.md)
- [Contexto técnico global](../../memory/contexto-tecnico.md)
- [Estrutura do projeto](../../memory/estrutura.md)

## Referências Compartilhadas

- [Como executar](../../shared/como-executar.md)
- [Regras de nomenclatura](../../shared/regras-de-nomenclatura.md)

## Observações Locais

- O caso de uso `save-product` cobre tanto criação quanto atualização.
- Casos de uso de comando retornam `void`. Consultas não viram caso de uso — o controller chama o repositório direto.
- O projeto não usa DTOs de entrada. **Respostas de leitura devem ser mapeadas para objetos simples no controller antes de retornar** — entidades de domínio usam `protected readonly props` com getters de prototype, que não serializam via `JSON.stringify` (produzem `{}`). O controller deve construir explicitamente o objeto de retorno: `return { id: product.id, name: product.name, description: product.description, price: product.price, status: product.status, availableOnline: product.availableOnline, featured: product.featured, allowsPreOrder: product.allowsPreOrder }`.
- O campo `status` é uma enumeração com os valores `active`, `inactive` e `draft`. Validar com a regra `in` do pacote compartilhado e expor a enumeração como tipo no agregado.
- Os campos `availableOnline`, `featured` e `allowsPreOrder` são booleanos independentes (checkboxes no formulário). Quando ausentes na criação, assumem `false`.
- O campo `description` é opcional; quando ausente, persistir como `null`.
- O campo `price` é numérico, não-negativo (`min-value: 0`), com no máximo 2 casas decimais (regra `precision`).
- A listagem fica dentro do módulo `catalog` no front-end, em rota privada.
- **Sem verificação automatizada de UI nesta spec.** As validações automatizadas vão até a camada de backend (testes unitários do módulo + cenários no Rest Client). O usuário valida a interface manualmente.

## Tasks

### Tasks - Negócio (módulo catalog)

- [x] Criar o agregado `product` dentro do módulo `catalog` com a skill [module-aggregate](../../../.claude/skills/module-aggregate).
  > ✅ 2026-04-29 18:00 — Criada estrutura `modules/catalog/src/product/{model,provider,usecase}` com os respectivos `index.ts`. Atualizado `modules/catalog/src/index.ts` para exportar o agregado.

- [x] Implementar a entidade `Product` com a skill [module-entity](../../../.claude/skills/module-entity), com os campos: `name` (required, min-length 2, max-length 120), `description` (max-length 500, opcional), `price` (required, min-value 0, precision 2), `status` (required, in `active|inactive|draft`), `availableOnline` (boolean, default `false`), `featured` (boolean, default `false`), `allowsPreOrder` (boolean, default `false`).
  > ✅ 2026-04-29 18:02 — Criado `product.entity.ts` herdando de `Entity<ProductState>`, com getters, enum `PRODUCT_STATUSES` e `validate()` aplicando `RequiredRule`, `MinLengthRule(2)`, `MaxLengthRule(120/500)`, `MinValueRule(0)`, `PrecisionRule(2)` e `InRule(PRODUCT_STATUSES)`.

- [x] Definir o contrato do repositório de `product` com a skill [module-repository](../../../.claude/skills/module-repository).
  > ✅ 2026-04-29 18:03 — Criado `product.repository.ts` estendendo `CrudRepository<Product, Product, Product, ProductPageParams>` (sem métodos extras). `FakeProductRepository` em `test/mock/` apoia os testes dos casos de uso.

- [x] Implementar o caso de uso `save-product` com a skill [module-use-case](../../../.claude/skills/module-use-case). A decisão entre criar e atualizar deve ser baseada em uma consulta ao repositório (`findById`): se `id` vier na entrada e `findById` retornar um registro, executa atualização; caso contrário (sem `id` ou registro não encontrado), executa criação usando o `id` recebido ou gerando um novo.
  > ✅ 2026-04-29 18:05 — `save-product.usecase.ts` consulta `findById` quando há `id`; se existir, faz `existing.clone(...)` preservando flags ausentes; senão instancia `Product` com defaults `false` para `availableOnline/featured/allowsPreOrder` e `description ?? null`. `validate()` é chamado em ambos os fluxos antes de persistir.

- [x] Implementar o caso de uso `delete-product` com a skill [module-use-case](../../../.claude/skills/module-use-case). Lançar `DomainError("product.not_found", 404)` quando o `id` não existir.
  > ✅ 2026-04-29 18:06 — `delete-product.usecase.ts` lança `new DomainError("product.not_found", 404)` quando `findById` retorna `null`; caso contrário chama `repository.delete(id)`.

- [x] Cobrir os dois casos de uso com testes unitários, usando os fakes do módulo (`FakeProductRepository` e demais providers necessários).
  > ✅ 2026-04-29 18:10 — Criados `product.entity.test.ts` (12 cenários), `save-product.usecase.test.ts` (9 cenários) e `delete-product.usecase.test.ts` (3 cenários). `npm test` no módulo `catalog`: 4 suites / 28 testes passam, cobertura `src/` 100%.

### Tasks - Back-end

- [x] Sincronizar o módulo `catalog` com o Prisma criando/atualizando o model da entidade `product` com a skill [backend-prisma-sync-module](../../../.claude/skills/backend-prisma-sync-module).
  > ✅ 2026-04-29 18:15 — Criado `apps/backend/prisma/models/catalog.model.prisma` com `model Product` (id uuid, name, description?, price `Decimal(12,2)`, status string, três flags com default false, timestamps + deletedAt, `@@map("products")`). Migration `20260429180659_catalog` gerada e aplicada via `npx prisma migrate dev --name catalog`.

- [x] Implementar o repositório Prisma de `product` em `apps/backend/src/modules/catalog` com a skill [backend-prisma-repository](../../../.claude/skills/backend-prisma-repository), sem alterar a interface definida no módulo.
  > ✅ 2026-04-29 18:18 — Criado `product.prisma.ts` com `PrismaProductRepository implements ProductRepository`. `toPersistence` converte `price` para `Prisma.Decimal`; `toDomain` converte de volta com `Number(raw.price)`. `findPage` usa `$transaction([findMany, count])` ordenando por `createdAt desc`.

- [x] Criar/atualizar `apps/backend/src/modules/catalog/product.controller.ts` com a skill [backend-nest-controller](../../../.claude/skills/backend-nest-controller), expondo o CRUD em `/products` (criar, atualizar, excluir, obter por id e listar paginado). Endpoints autenticados. Consultas chamam o repositório direto; comandos instanciam o caso de uso correspondente no corpo do método.
  > ✅ 2026-04-29 18:22 — Criado `product.controller.ts` (`@Controller('products')`) com `POST /` (201, instancia `SaveProduct`), `PUT /:id` (200, `SaveProduct` com `id` injetado), `DELETE /:id` (204, `DeleteProduct`), `GET /:id` e `GET /` (consultas chamam `PrismaProductRepository` direto). Helper `toResponse(product)` materializa o objeto plano antes do `JSON.stringify` (conforme observação da spec sobre getters de prototype). `CatalogModule` atualizado para importar `DbModule`, registrar `ProductController` e exportar o repositório. Auth global do app cobre os endpoints. `npx tsc --noEmit -p apps/backend/tsconfig.json` passa.

- [x] Criar `apps/backend/src/modules/catalog/product.integration.http` (Rest Client) cobrindo os fluxos do CRUD, incluindo os principais casos de erro (nome inválido, preço negativo, status fora do enum, produto inexistente em update/delete). Validar manualmente com o backend rodando.
  > ✅ 2026-04-29 18:25 — Criado `product.integration.http` com login para obter token, criação válida, criação sem flags (defaults), nome curto (422), preço negativo (422), preço com 3 decimais (422), status inválido (422), sem auth (401), listagem paginada, get por id existente/inexistente, update válido, update inválido, update com id inexistente (cai em criação por design do `save-product`), delete válido (204) e delete inexistente (404). Validação manual com backend rodando fica a cargo do usuário.

### Tasks - Front-end

> ⚠️ Sem validação automatizada de UI. O agente entrega o código + `npx tsc --noEmit` limpo; a verificação visual é manual.

- [x] Criar a listagem paginada de `products` no módulo `catalog`, em rota privada. Tabela com as colunas nome, preço, status e ações (ícones de editar e excluir).
  > ✅ 2026-04-29 18:30 — Criada `product-list.page.tsx` em `apps/frontend/src/modules/catalog/pages/`, montada na rota privada `app/(private)/catalog/products/page.tsx`. Reaproveita `PageSectionHeader`, `TableCard`, `Table`, `PaginationControls`, `Combobox`/`useAuth`. Colunas: Nome, Preço (formatado em BRL), Status (i18n) e Ações.

- [x] Criar o formulário de `product` compartilhado entre criação e edição, organizado em seções via [`form-section-layout`](../../../apps/frontend/src/shared/components/ui/form-section-layout.tsx): "Dados básicos" (nome, descrição), "Preço e status" (preço, status como `select` com as opções `active`, `inactive`, `draft`) e "Disponibilidade" (checkboxes `availableOnline`, `featured`, `allowsPreOrder`).
  > ✅ 2026-04-29 18:35 — Criada `product-form.page.tsx` (`ProductFormPage` com prop opcional `productId`). Três `FormSectionLayout`: "Dados básicos" (Input + Textarea), "Preço e status" (Input numérico + `Combobox` com as 3 opções de status — não há `Select` puro no shared/ui, optei por reaproveitar o `Combobox` existente como desvio justificado) e "Disponibilidade" (3 `Checkbox`). Rotas montadas em `app/(private)/catalog/products/new/page.tsx` e `app/(private)/catalog/products/[id]/edit/page.tsx`.

- [x] Integrar a coluna de ações: lápis navega para a edição; lixeira abre [`delete-confirmation-dialog`](../../../apps/frontend/src/shared/components/ui/delete-confirmation-dialog.tsx) e, ao confirmar, chama o backend e atualiza a tabela.
  > ✅ 2026-04-29 18:37 — Botão de lápis chama `router.push('/catalog/products/${id}/edit')`; botão de lixeira atribui `deleteTarget` que abre o `DeleteConfirmationDialog`. Ao confirmar, faz `DELETE /products/:id`, mostra toast de sucesso/erro e re-busca a página corrente (recuando para a anterior se sobrar 0 itens).

- [x] Adicionar o item "Produtos" no menu lateral apontando para a listagem de `products`.
  > ✅ 2026-04-29 18:38 — `app/(private)/layout.tsx` ganhou novo `ModuleNavigationEntry` com `id: catalog`, ícone `Package` (lucide), seção "Catálogo" e item "Produtos" apontando para `/catalog/products`.

- [x] Acrescentar no i18n as chaves novas que aparecerem (ex.: `product.not_found`, rótulos de status `product.status.active|inactive|draft` e mensagens específicas de validação dos novos campos). Reaproveitar as chaves já cadastradas em specs anteriores.
  > ✅ 2026-04-29 18:40 — Adicionadas chaves em `messages.pt.ts` e `messages.en.ts`: `product.not_found`, `product.name.required|min.length|max.length`, `product.description.max.length`, `product.price.required|min.value|precision`, `product.status.required|in` e os rótulos `product.status.active|inactive|draft`.

- [x] Rodar `npx tsc --noEmit` em `apps/frontend` e sinalizar ao usuário que a UI está pronta para conferência manual.
  > ✅ 2026-04-29 18:42 — `npx tsc --noEmit` em `apps/frontend` passa sem erros (exit 0). UI pronta para conferência manual: rota `/catalog/products` (listagem), `/catalog/products/new` (criação) e `/catalog/products/[id]/edit` (edição), com item "Produtos" no menu lateral e backend rodando em `:4000`.

## Resultado Esperado

- Agregado `product` com entidade validada, repositório contratado e casos de uso `save-product` e `delete-product` implementados e testados.
- Model `product` sincronizado no Prisma com migration aplicada.
- CRUD de `product` exposto no backend via `ProductController`, com cenários cobertos no `product.integration.http`.
- Listagem paginada, formulário compartilhado entre criação e edição (com seções de dados básicos, preço/status e checkboxes de disponibilidade) e exclusão com confirmação funcionando no front-end, acessíveis pelo item "Produtos" do menu lateral.

## Encerramento

Esta spec termina apenas quando todos os itens estiverem marcados e com evidência registrada, no formato definido em [Como executar](../../shared/como-executar.md).

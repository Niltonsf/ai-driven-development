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

- [ ] Criar o agregado `product` dentro do módulo `catalog` com a skill [module-aggregate](../../../.claude/skills/module-aggregate).

- [ ] Implementar a entidade `Product` com a skill [module-entity](../../../.claude/skills/module-entity), com os campos: `name` (required, min-length 2, max-length 120), `description` (max-length 500, opcional), `price` (required, min-value 0, precision 2), `status` (required, in `active|inactive|draft`), `availableOnline` (boolean, default `false`), `featured` (boolean, default `false`), `allowsPreOrder` (boolean, default `false`).

- [ ] Definir o contrato do repositório de `product` com a skill [module-repository](../../../.claude/skills/module-repository).

- [ ] Implementar o caso de uso `save-product` com a skill [module-use-case](../../../.claude/skills/module-use-case). A decisão entre criar e atualizar deve ser baseada em uma consulta ao repositório (`findById`): se `id` vier na entrada e `findById` retornar um registro, executa atualização; caso contrário (sem `id` ou registro não encontrado), executa criação usando o `id` recebido ou gerando um novo.

- [ ] Implementar o caso de uso `delete-product` com a skill [module-use-case](../../../.claude/skills/module-use-case). Lançar `DomainError("product.not_found", 404)` quando o `id` não existir.

- [ ] Cobrir os dois casos de uso com testes unitários, usando os fakes do módulo (`FakeProductRepository` e demais providers necessários).

### Tasks - Back-end

- [ ] Sincronizar o módulo `catalog` com o Prisma criando/atualizando o model da entidade `product` com a skill [backend-prisma-sync-module](../../../.claude/skills/backend-prisma-sync-module).

- [ ] Implementar o repositório Prisma de `product` em `apps/backend/src/modules/catalog` com a skill [backend-prisma-repository](../../../.claude/skills/backend-prisma-repository), sem alterar a interface definida no módulo.

- [ ] Criar/atualizar `apps/backend/src/modules/catalog/product.controller.ts` com a skill [backend-nest-controller](../../../.claude/skills/backend-nest-controller), expondo o CRUD em `/products` (criar, atualizar, excluir, obter por id e listar paginado). Endpoints autenticados. Consultas chamam o repositório direto; comandos instanciam o caso de uso correspondente no corpo do método.

- [ ] Criar `apps/backend/src/modules/catalog/product.integration.http` (Rest Client) cobrindo os fluxos do CRUD, incluindo os principais casos de erro (nome inválido, preço negativo, status fora do enum, produto inexistente em update/delete). Validar manualmente com o backend rodando.

### Tasks - Front-end

> ⚠️ Sem validação automatizada de UI. O agente entrega o código + `npx tsc --noEmit` limpo; a verificação visual é manual.

- [ ] Criar a listagem paginada de `products` no módulo `catalog`, em rota privada. Tabela com as colunas nome, preço, status e ações (ícones de editar e excluir).

- [ ] Criar o formulário de `product` compartilhado entre criação e edição, organizado em seções via [`form-section-layout`](../../../apps/frontend/src/shared/components/ui/form-section-layout.tsx): "Dados básicos" (nome, descrição), "Preço e status" (preço, status como `select` com as opções `active`, `inactive`, `draft`) e "Disponibilidade" (checkboxes `availableOnline`, `featured`, `allowsPreOrder`).

- [ ] Integrar a coluna de ações: lápis navega para a edição; lixeira abre [`delete-confirmation-dialog`](../../../apps/frontend/src/shared/components/ui/delete-confirmation-dialog.tsx) e, ao confirmar, chama o backend e atualiza a tabela.

- [ ] Adicionar o item "Produtos" no menu lateral apontando para a listagem de `products`.

- [ ] Acrescentar no i18n as chaves novas que aparecerem (ex.: `product.not_found`, rótulos de status `product.status.active|inactive|draft` e mensagens específicas de validação dos novos campos). Reaproveitar as chaves já cadastradas em specs anteriores.

- [ ] Rodar `npx tsc --noEmit` em `apps/frontend` e sinalizar ao usuário que a UI está pronta para conferência manual.

## Resultado Esperado

- Agregado `product` com entidade validada, repositório contratado e casos de uso `save-product` e `delete-product` implementados e testados.
- Model `product` sincronizado no Prisma com migration aplicada.
- CRUD de `product` exposto no backend via `ProductController`, com cenários cobertos no `product.integration.http`.
- Listagem paginada, formulário compartilhado entre criação e edição (com seções de dados básicos, preço/status e checkboxes de disponibilidade) e exclusão com confirmação funcionando no front-end, acessíveis pelo item "Produtos" do menu lateral.

## Encerramento

Esta spec termina apenas quando todos os itens estiverem marcados e com evidência registrada, no formato definido em [Como executar](../../shared/como-executar.md).

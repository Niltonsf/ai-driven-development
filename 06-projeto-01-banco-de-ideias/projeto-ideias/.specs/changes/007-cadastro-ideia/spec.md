# 007-cadastro-ideia

## Objetivo

Entregar o cadastro (CRUD) do **cabeçalho da Ideia** dentro do módulo `ideas` (já criado pela spec 005), com agregado `idea` referenciando o agregado `idea-type` por id, persistência via Prisma, endpoints REST autenticados e interface de listagem + formulário compartilhado entre criação e edição. Esta spec ainda **não** entrega Recursos, Processamento por IA nem Resultado — apenas os dados base (`id`, `name`, `description`, `objective`, `ideaTypeId`, `userId`) e o vínculo com o Tipo de Ideia (cujo prompt será consumido pelo caso de uso de processamento em spec futura).

## Contexto Técnico

- Módulo de negócio: `ideas` — **já existe** (criado pela [spec 005](../005-cadastro-tipo-de-ideia/spec.md) junto com o agregado `idea-type`). Esta spec **não** roda `config-new-module`.
- Agregado novo: `idea`. Campos do MVP do cabeçalho: `id`, `name`, `description`, `objective`, `ideaTypeId` (FK para `idea-type`), `userId`.
- O **Tipo de Ideia** é um **agregado separado** dentro do mesmo módulo `ideas` (decisão da spec 005). A Ideia carrega apenas o `ideaTypeId`; o prompt especializado pertence ao agregado `idea-type` e será usado pelo caso de uso de processamento em spec futura (ver [Processamento com IA](../../memory/processamento-ia.md) e [Roadmap](../../memory/roadmap.md)).
- Backend NestJS com `IdeaController` em `apps/backend/src/modules/ideas`, persistência via Prisma. Endpoints autenticados (mesmo padrão do `auth.controller.ts` da spec 003 — JWT validado por guard global, exceções marcadas com `@Public()`).
- Front-end Next.js com listagem paginada e formulário compartilhado entre criação e edição, dentro do módulo `ideas` em rota privada (grupo `(private)`). O select de Tipo de Ideia é populado consumindo `GET /idea-types` (endpoint entregue pela spec 005).
- A linguagem do código segue [Contexto Técnico Global](../../memory/contexto-tecnico.md): identificadores em inglês (`Idea`, `SaveIdea`, `DeleteIdea`, `ideaTypeId`); conceito do domínio em português ("Ideia", "Tipo de Ideia") apenas em telas, mensagens e documentação.

## Referências Compartilhadas

- [Como executar](../../shared/como-executar.md)
- [Regras de nomenclatura](../../shared/regras-de-nomenclatura.md)

## Observações Locais

- O caso de uso `save-idea` cobre tanto criação quanto atualização. Casos de uso de comando retornam `void`. Consultas (`findById`, `findPage`) **não viram caso de uso**: o controller chama o repositório direto.
- O projeto **não usa DTOs de entrada**. **Respostas de leitura devem ser mapeadas para objetos simples no controller** antes de retornar — entidades de domínio usam `protected readonly props` com getters de prototype, que não serializam via `JSON.stringify` (produzem `{}`). O controller deve construir explicitamente o objeto de retorno (`{ id, name, description, objective, ideaTypeId }`).
- **Validação do `ideaTypeId`**: a entidade `Idea` valida apenas que o campo é uma string `uuid` obrigatória. A verificação de **existência** do Tipo de Ideia (e de que ele pertence ao mesmo `userId`) acontece no caso de uso `save-idea`, consultando o `IdeaTypeRepository` injetado. A interface entregue na spec 005 expõe `findById(id: string)` (sem filtro por `userId` — a checagem de propriedade é feita no caso de uso). Se `findById(input.ideaTypeId)` retornar `null` **ou** se `entity.userId !== input.userId`, lançar `DomainError("idea.ideaType.invalid", 422)`.
- Usuário dono: por simetria com [Domínio](../../memory/dominio.md) e com o que está adotado em `auth/user` e `ideas/idea-type` (spec 005), toda Ideia pertence a um usuário. O backend grava `userId` (extraído do JWT autenticado) em `create` e usa como filtro padrão em `findPage` / `findById`. O front-end consome apenas as Ideias do usuário logado.
- A listagem fica dentro do módulo `ideas` no front-end, em rota privada (`/ideas` no grupo `(private)`). O grupo `(private)` já é protegido por `AuthGuard` (spec 003).
- **Sem verificação automatizada de UI nesta spec.** As validações automatizadas vão até a camada de backend (testes unitários do módulo + cenários no Rest Client). O usuário valida a interface manualmente.
- Esta spec **não** chama o provedor de IA, **não** processa Ideia e **não** entrega Recursos nem Resultado. Esses passos ficam para specs posteriores (ver [Roadmap](../../memory/roadmap.md)).

## Tasks

### Tasks - Negócio (módulo `ideas`)

- [ ] Criar o agregado `idea` dentro do módulo `ideas` com a skill [module-aggregate](../../../.claude/skills/module-aggregate). O módulo já existe (spec 005); esta task adiciona o segundo agregado.

- [ ] Implementar a entidade `Idea` com a skill [module-entity](../../../.claude/skills/module-entity), com os campos:
  - `id` (rule: required + uuid)
  - `name` (rule: required + min length 3 + max length 120)
  - `description` (rule: required + min length 10 + max length 2000)
  - `objective` (rule: required + min length 10 + max length 1000)
  - `ideaTypeId` (rule: required + uuid) — referência para o agregado `idea-type` (spec 005). A verificação de existência fica no caso de uso, não na entidade.
  - `userId` (rule: required + uuid) — vincula a Ideia ao usuário dono.
    Se alguma regra ainda não existir em `packages/shared`, criar com a skill [shared-validation-rule](../../../.claude/skills/shared-validation-rule) e reaproveitar.

- [ ] Definir o contrato do repositório de `idea` com a skill [module-repository](../../../.claude/skills/module-repository). Métodos mínimos: `create`, `update`, `delete`, `findById`, `findPage`. As consultas (`findById` e `findPage`) devem aceitar `userId` para filtrar pelas Ideias do usuário dono. Gerar também o `FakeIdeaRepository` em memória para testes do módulo.

- [ ] Implementar o caso de uso `save-idea` com a skill [module-use-case](../../../.claude/skills/module-use-case). Receber `IdeaTypeRepository` no construtor (além de `IdeaRepository`). Fluxo:
  1. Validar dados de entrada via `Validator.validate` na entidade `Idea`.
  2. Consultar `ideaTypeRepository.findById(input.ideaTypeId)` — se retornar `null` **ou** se `entity.userId !== input.userId`, lançar `DomainError("idea.ideaType.invalid", 422)`. (A interface da spec 005 não filtra por `userId`; a propriedade é verificada aqui.)
  3. Decidir entre criar e atualizar via `ideaRepository.findById`: se `id` vier na entrada e retornar registro **do mesmo `userId`**, atualiza; caso contrário (sem `id`, registro não encontrado, ou pertencente a outro usuário) cria usando o `id` recebido ou gerando um novo.
  4. Lançar `DomainError("idea.forbidden", 403)` se for atualização e o registro encontrado pertencer a outro usuário.

- [ ] Implementar o caso de uso `delete-idea` com a skill [module-use-case](../../../.claude/skills/module-use-case). Lançar `DomainError("idea.not_found", 404)` quando o `id` não existir e `DomainError("idea.forbidden", 403)` quando o registro pertencer a outro usuário.

- [ ] Cobrir os dois casos de uso com testes unitários, usando os fakes do módulo (`FakeIdeaRepository` e `FakeIdeaTypeRepository` da spec 005). Cenários mínimos por caso de uso: caminho feliz (criação e atualização para `save-idea`; exclusão para `delete-idea`), validação de cada campo obrigatório, `ideaTypeId` inexistente (422), `ideaTypeId` pertencente a outro usuário (422), tentativa de atualizar/excluir Ideia de outro usuário (403), tentativa de excluir Ideia inexistente (404). Coverage 100% nos arquivos dos casos de uso.

### Tasks - Back-end

- [ ] Sincronizar o agregado `idea` com o Prisma adicionando o model ao módulo `ideas` com a skill [backend-prisma-sync-module](../../../.claude/skills/backend-prisma-sync-module). O model deve incluir `id` (uuid PK), `name`, `description`, `objective`, `ideaTypeId` (FK para `idea_types.id`, `onDelete: Restrict`), `userId` (FK para `users.id`), `createdAt`, `updatedAt`, `deletedAt` nullable, `@@map("ideas")`. Adicionar a relação inversa em `IdeaType` (`ideas Idea[]`). Adicionar também a relação inversa em `User` (`ideas Idea[]`) para fechar a FK de `userId`. Aplicar a migration nomeada `ideas`.

- [ ] Implementar o repositório Prisma de `idea` em `apps/backend/src/modules/ideas` com a skill [backend-prisma-repository](../../../.claude/skills/backend-prisma-repository), sem alterar a interface definida no módulo. Implementar `create`, `update`, `delete`, `findById`, `findPage` respeitando o filtro por `userId`. Mapeamento entrada/saída entre `Idea` (entidade de domínio) e linha Prisma feito por métodos privados (`toRow` / `toEntity`), seguindo o padrão de `user.prisma.ts` da spec 002 e de `idea-type.prisma.ts` da spec 005.

- [ ] Criar `apps/backend/src/modules/ideas/idea.controller.ts` com a skill [backend-nest-controller](../../../.claude/skills/backend-nest-controller), expondo o CRUD em `/ideas`:
  - `POST /ideas` (criar) e `PUT /ideas/:id` (atualizar) → ambos instanciam `SaveIdea` no corpo do método (passando `IdeaRepository` e `IdeaTypeRepository` injetados no controller) e injetam o `userId` do usuário autenticado.
  - `DELETE /ideas/:id` → instancia `DeleteIdea` no corpo do método.
  - `GET /ideas/:id` e `GET /ideas` (paginado, query `page` e `pageSize`) → chamam o repositório direto, sempre filtrando por `userId` do usuário autenticado, e mapeiam manualmente para `{ id, name, description, objective, ideaTypeId, updatedAt }` antes de retornar (sem expor `userId` no payload de resposta). O `updatedAt` é incluído para alimentar a coluna **Atualizado em** da listagem do front-end — serializar como ISO 8601 (`entity.updatedAt.toISOString()`).
  - Todos os endpoints autenticados (sem `@Public()`).

- [ ] Criar `apps/backend/src/modules/ideas/idea.integration.http` (Rest Client) cobrindo os fluxos do CRUD com as principais variações de erro: criação válida, criação com `ideaTypeId` inexistente (422), criação com campos faltando (422), atualização válida, atualização de id pertencente a outro usuário (403), exclusão válida, exclusão inexistente (404), listagem paginada e busca por id. Validar manualmente com o backend rodando, criando antes pelo menos um Tipo de Ideia via `/idea-types` para usar nos cenários.

- [ ] Adicionar no i18n do front-end (`apps/frontend/src/shared/i18n/messages.pt.ts` e `messages.en.ts`) todas as novas chaves de erro produzidas por `/ideas`. O `Validator` concatena `${field.code}.${errorCode}` usando o nome literal do atributo da entidade, então as chaves seguem **camelCase** (mesmo padrão da spec 005 com `idea-type.userId.*`): `idea.name.required`, `idea.name.min.length`, `idea.name.max.length`, `idea.description.required`, `idea.description.min.length`, `idea.description.max.length`, `idea.objective.required`, `idea.objective.min.length`, `idea.objective.max.length`, `idea.ideaTypeId.required`, `idea.ideaTypeId.uuid`, `idea.userId.required`, `idea.userId.uuid`, `idea.ideaType.invalid`, `idea.not_found`, `idea.forbidden`. Reaproveitar as chaves genéricas já cadastradas em specs anteriores quando houver equivalência.

### Tasks - Front-end

> ⚠️ Sem validação automatizada de UI. O agente entrega o código + `npx tsc --noEmit` limpo; a verificação visual é manual.

- [ ] Criar a listagem paginada de `ideas` no módulo `ideas` (rota privada `/ideas`). Tabela com as colunas **Nome**, **Tipo de Ideia** (rótulo do `IdeaType` correspondente, obtido a partir do `ideaTypeId` — fazer um lookup local com a lista vinda de `GET /idea-types` ou aceitar que o backend envie um campo derivado `ideaTypeName` no payload, escolha que melhor se encaixe no controller — registrar a decisão na evidência) e **Atualizado em** (formatar o `updatedAt` ISO devolvido pelo backend usando `Intl.DateTimeFormat` ou helper equivalente do shared kit), mais a coluna de ações (ícones de editar e excluir). A paginação deve consumir `GET /ideas?page=&pageSize=`.

- [ ] Criar o formulário de `idea` compartilhado entre criação e edição (`/ideas/new` e `/ideas/[id]/edit`), organizado em seções via [`form-section-layout`](../../../apps/frontend/src/shared/components/ui/form-section-layout.tsx):
  - Seção "Identificação" — `name` (input texto).
  - Seção "Detalhes" — `description` (textarea), `objective` (textarea).
  - Seção "Classificação" — `ideaTypeId` (select populado por `GET /idea-types`; rótulo exibido = `name` do Tipo de Ideia). Se a lista vier vazia, exibir um estado de "Nenhum Tipo de Ideia cadastrado" com link/botão para `/idea-types/new`.
    Submissão chama `POST /ideas` na criação e `PUT /ideas/:id` na edição. Os erros do backend (`ApiErrorResponse.errors[]`) seguem o mesmo padrão das specs 002/003: um `toast.error(getMessage(code))` por item.

- [ ] Integrar a coluna de ações da listagem: lápis navega para `/ideas/[id]/edit`; lixeira abre [`delete-confirmation-dialog`](../../../apps/frontend/src/shared/components/ui/delete-confirmation-dialog.tsx) e, ao confirmar, chama `DELETE /ideas/:id` e atualiza a tabela.

- [ ] Adicionar o item **"Ideias"** no menu lateral plano (entregue pela spec 004) apontando para `/ideas`, posicionado logo abaixo do item **"Tipos de Ideia"** entregue na spec 005. Em `apps/frontend/src/app/(private)/layout.tsx`, manter `match: 'prefix'` para destacar também `/ideas/new` e `/ideas/[id]/edit`.

- [ ] Rodar `npx tsc --noEmit` em `apps/frontend` e sinalizar ao usuário que a UI está pronta para conferência manual.

## Resultado Esperado

- Agregado `idea` adicionado ao módulo `ideas` com entidade validada, repositório contratado e casos de uso `save-idea` e `delete-idea` implementados e testados, incluindo a verificação cruzada de `ideaTypeId` contra o `IdeaTypeRepository`.
- Model `Idea` sincronizado no Prisma com migration aplicada (`ideas`) e relação com `IdeaType`.
- CRUD de `idea` exposto no backend via `IdeaController` em `/ideas`, autenticado, com filtro por `userId` em todas as consultas, payload de leitura incluindo `updatedAt` (ISO 8601) e cenários cobertos no `idea.integration.http`.
- Listagem paginada, formulário compartilhado entre criação e edição (com select de Tipo de Ideia populado por `GET /idea-types`) e exclusão com confirmação funcionando no front-end, acessíveis pelo item **"Ideias"** do menu lateral.
- Todas as novas chaves de erro de `/ideas` mapeadas em `messages.pt.ts` e `messages.en.ts`.
- Sem erros de TypeScript ou de build após as alterações.

## Encerramento

Esta spec termina apenas quando todos os itens estiverem marcados e com evidência registrada, no formato definido em [Como executar](../../shared/como-executar.md).

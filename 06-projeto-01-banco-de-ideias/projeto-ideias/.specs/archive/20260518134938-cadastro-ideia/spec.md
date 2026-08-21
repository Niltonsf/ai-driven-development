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

- [x] Criar o agregado `idea` dentro do módulo `ideas` com a skill [module-aggregate](../../../.claude/skills/module-aggregate). O módulo já existe (spec 005); esta task adiciona o segundo agregado.

  > ✅ 2026-05-18 12:40 — Executado `scripts/create-aggregate.js --module ideas --aggregate idea --mode crud` (modo `crud` escolhido por ser CRUD; sem pergunta interativa por instrução de não pausar). Scaffold gerou usecases CRUD genéricos; ajustados ao padrão do agregado `idea-type` (desvio registrado nas tasks de usecase). `modules/ideas/src/index.ts` passou a exportar `./idea` sem remover o export de `./idea-type`.

- [x] Implementar a entidade `Idea` com a skill [module-entity](../../../.claude/skills/module-entity), com os campos:
  - `id` (rule: required + uuid)
  - `name` (rule: required + min length 3 + max length 120)
  - `description` (rule: required + min length 10 + max length 2000)
  - `objective` (rule: required + min length 10 + max length 1000)
  - `ideaTypeId` (rule: required + uuid) — referência para o agregado `idea-type` (spec 005). A verificação de existência fica no caso de uso, não na entidade.
  - `userId` (rule: required + uuid) — vincula a Ideia ao usuário dono.
    Se alguma regra ainda não existir em `packages/shared`, criar com a skill [shared-validation-rule](../../../.claude/skills/shared-validation-rule) e reaproveitar.
    > ✅ 2026-05-18 12:40 — `modules/ideas/src/idea/model/idea.entity.ts` implementada herdando `Entity<IdeaState>` com getters e `validate()` via `Validator.validate`: `idea.name` (Required+Min3+Max120), `idea.description` (Required+Min10+Max2000), `idea.objective` (Required+Min10+Max1000), `idea.ideaTypeId` (Required+Uuid), `idea.userId` (Required+Uuid). Todas as rules já existiam em `packages/shared` (`RequiredRule`, `MinLengthRule`, `MaxLengthRule`, `UuidRule`); não foi necessário criar regra nova com `shared-validation-rule`.

- [x] Definir o contrato do repositório de `idea` com a skill [module-repository](../../../.claude/skills/module-repository). Métodos mínimos: `create`, `update`, `delete`, `findById`, `findPage`. As consultas (`findById` e `findPage`) devem aceitar `userId` para filtrar pelas Ideias do usuário dono. Gerar também o `FakeIdeaRepository` em memória para testes do módulo.

  > ✅ 2026-05-18 12:40 — `idea.repository.ts` define `IdeaRepository extends CrudRepository<Idea,Idea,Idea,IdeaPageParams>` e `IdeaPageParams { userId, page, perPage }`. `FakeIdeaRepository` criado filtrando `findPage` por `userId`. Desvio registrado: a interface compartilhada `FindByIdRepository`/`CrudRepository` define `findById(id)` sem `userId` — manter a assinatura preserva o contrato comum; a posse é verificada no chamador (caso de uso `save-idea` e controller), exatamente como o agregado `idea-type` da spec 005. `findPage` filtra por `userId` conforme pedido.

- [x] Implementar o caso de uso `save-idea` com a skill [module-use-case](../../../.claude/skills/module-use-case). Receber `IdeaTypeRepository` no construtor (além de `IdeaRepository`). Fluxo:
  1. Validar dados de entrada via `Validator.validate` na entidade `Idea`.
  2. Consultar `ideaTypeRepository.findById(input.ideaTypeId)` — se retornar `null` **ou** se `entity.userId !== input.userId`, lançar `DomainError("idea.ideaType.invalid", 422)`. (A interface da spec 005 não filtra por `userId`; a propriedade é verificada aqui.)
  3. Decidir entre criar e atualizar via `ideaRepository.findById`: se `id` vier na entrada e retornar registro **do mesmo `userId`**, atualiza; caso contrário (sem `id`, registro não encontrado, ou pertencente a outro usuário) cria usando o `id` recebido ou gerando um novo.
  4. Lançar `DomainError("idea.forbidden", 403)` se for atualização e o registro encontrado pertencer a outro usuário.
     > ✅ 2026-05-18 12:40 — `save-idea.usecase.ts` recebe `IdeaRepository` e `IdeaTypeRepository`. Fluxo conforme spec: (1) `new Idea(...).validate()`; (2) `ideaTypeRepository.findById(input.ideaTypeId)` → `idea.ideaType.invalid` (422) se `null` ou `ideaType.userId !== input.userId`; (3) `ideaRepository.findById` decide update (mesmo `userId`, via `clone`) vs create (sem id / não encontrado); (4) `idea.forbidden` (403) quando o registro existente pertence a outro usuário. Esqueleto base via scaffold do agregado, reescrito ao padrão do `save-idea-type.usecase.ts`.

- [x] Implementar o caso de uso `delete-idea` com a skill [module-use-case](../../../.claude/skills/module-use-case). Lançar `DomainError("idea.not_found", 404)` quando o `id` não existir e `DomainError("idea.forbidden", 403)` quando o registro pertencer a outro usuário.

  > ✅ 2026-05-18 12:40 — `delete-idea.usecase.ts` consulta `ideaRepository.findById(input.id)`: `idea.not_found` (404) se ausente, `idea.forbidden` (403) se `existing.userId !== input.userId`, senão `delete`. Padrão idêntico ao `delete-idea-type.usecase.ts`.

- [x] Cobrir os dois casos de uso com testes unitários, usando os fakes do módulo (`FakeIdeaRepository` e `FakeIdeaTypeRepository` da spec 005). Cenários mínimos por caso de uso: caminho feliz (criação e atualização para `save-idea`; exclusão para `delete-idea`), validação de cada campo obrigatório, `ideaTypeId` inexistente (422), `ideaTypeId` pertencente a outro usuário (422), tentativa de atualizar/excluir Ideia de outro usuário (403), tentativa de excluir Ideia inexistente (404). Coverage 100% nos arquivos dos casos de uso.
  > ✅ 2026-05-18 12:40 — Testes em `test/idea/usecase/save-idea.usecase.test.ts` (11 casos: create sem id, create com id, update mesmo user, 422 tipo inexistente, 422 tipo de outro user, 403 update cross-user, e validação de name/description/objective/ideaTypeId/userId) e `delete-idea.usecase.test.ts` (delete ok, 404, 403). `npx jest --coverage --collectCoverageFrom='src/idea/usecase/**/*.ts'`: **100%** stmts/branch/funcs/lines em `save-idea.usecase.ts` e `delete-idea.usecase.ts`. Suíte total do módulo: 7 suites / 45 testes verdes.

### Tasks - Back-end

- [x] Sincronizar o agregado `idea` com o Prisma adicionando o model ao módulo `ideas` com a skill [backend-prisma-sync-module](../../../.claude/skills/backend-prisma-sync-module). O model deve incluir `id` (uuid PK), `name`, `description`, `objective`, `ideaTypeId` (FK para `idea_types.id`, `onDelete: Restrict`), `userId` (FK para `users.id`), `createdAt`, `updatedAt`, `deletedAt` nullable, `@@map("ideas")`. Adicionar a relação inversa em `IdeaType` (`ideas Idea[]`). Adicionar também a relação inversa em `User` (`ideas Idea[]`) para fechar a FK de `userId`. Aplicar a migration nomeada `ideas`.

  > ✅ 2026-05-18 12:40 — `prisma/models/ideas.model.prisma`: model `Idea` (`@@map("ideas")`) com `description`/`objective` em `@db.Text`, FK `ideaType` `onDelete: Restrict` e FK `user` `onDelete: Cascade`; relação inversa `ideas Idea[]` adicionada em `IdeaType` e em `User` (`auth.model.prisma`). Banco subido via `npm run db:start`; `npm run prisma:migrate:dev -- --name ideas` aplicou `20260518153032_ideas` (CREATE TABLE ideas + 2 FKs, conforme SQL revisado) e `prisma:generate` regenerou o client.

- [x] Implementar o repositório Prisma de `idea` em `apps/backend/src/modules/ideas` com a skill [backend-prisma-repository](../../../.claude/skills/backend-prisma-repository), sem alterar a interface definida no módulo. Implementar `create`, `update`, `delete`, `findById`, `findPage` respeitando o filtro por `userId`. Mapeamento entrada/saída entre `Idea` (entidade de domínio) e linha Prisma feito por métodos privados (`toRow` / `toEntity`), seguindo o padrão de `user.prisma.ts` da spec 002 e de `idea-type.prisma.ts` da spec 005.

  > ✅ 2026-05-18 12:40 — `apps/backend/src/modules/ideas/idea.prisma.ts`: `IdeaPrismaRepository implements IdeaRepository` (interface do módulo intacta), `findPage` filtra `where: { userId }` com `orderBy updatedAt desc`, métodos privados `toRow`/`toEntity`. Registrado como provider em `ideas.module.ts`. `npm run build` (nest build) limpo.

- [x] Criar `apps/backend/src/modules/ideas/idea.controller.ts` com a skill [backend-nest-controller](../../../.claude/skills/backend-nest-controller), expondo o CRUD em `/ideas`:
  - `POST /ideas` (criar) e `PUT /ideas/:id` (atualizar) → ambos instanciam `SaveIdea` no corpo do método (passando `IdeaRepository` e `IdeaTypeRepository` injetados no controller) e injetam o `userId` do usuário autenticado.
  - `DELETE /ideas/:id` → instancia `DeleteIdea` no corpo do método.
  - `GET /ideas/:id` e `GET /ideas` (paginado, query `page` e `pageSize`) → chamam o repositório direto, sempre filtrando por `userId` do usuário autenticado, e mapeiam manualmente para `{ id, name, description, objective, ideaTypeId, updatedAt }` antes de retornar (sem expor `userId` no payload de resposta). O `updatedAt` é incluído para alimentar a coluna **Atualizado em** da listagem do front-end — serializar como ISO 8601 (`entity.updatedAt.toISOString()`).
  - Todos os endpoints autenticados (sem `@Public()`).
    > ✅ 2026-05-18 12:40 — `idea.controller.ts` `@Controller('ideas')`: `POST` (201) e `PUT /:id` (204) instanciam `SaveIdea(ideaRepository, ideaTypeRepository)` com `userId` do `@CurrentUser()`; `DELETE /:id` (204) instancia `DeleteIdea`; `GET /:id` (404 `idea.not_found` se ausente ou de outro user) e `GET /` paginado filtram por `userId` e mapeiam manualmente para `{ id, name, description, objective, ideaTypeId, updatedAt }` com `updatedAt` em ISO 8601 (`entity.updatedAt.toISOString()`), sem expor `userId`. Sem `@Public()` (guard JWT global). **Decisão sobre o rótulo do Tipo de Ideia**: o controller NÃO envia `ideaTypeName`; o payload segue exatamente o mapeamento pedido na task e o front faz lookup local com `GET /idea-types` (mantém o controller simples e sem join). **Desvio**: o `IdeasController` placeholder (stub `{message:'Ideas endpoint'}` do scaffold) foi removido por colidir com `GET /ideas` do novo controller; `ideas.module.ts` agora registra apenas `IdeaTypeController` e `IdeaController`.

- [x] Criar `apps/backend/src/modules/ideas/idea.integration.http` (Rest Client) cobrindo os fluxos do CRUD com as principais variações de erro: criação válida, criação com `ideaTypeId` inexistente (422), criação com campos faltando (422), atualização válida, atualização de id pertencente a outro usuário (403), exclusão válida, exclusão inexistente (404), listagem paginada e busca por id. Validar manualmente com o backend rodando, criando antes pelo menos um Tipo de Ideia via `/idea-types` para usar nos cenários.

  > ✅ 2026-05-18 12:40 — `idea.integration.http` criado com todos os cenários. Validado manualmente via `curl` contra o backend rebuilt em `localhost:4000` (após registrar dois usuários + um Tipo de Ideia por usuário). Resultados: criar válido **201**; `ideaTypeId` inexistente **422 `idea.ideaType.invalid`**; campos faltando **422 `[idea.name.required, idea.description.required, idea.objective.required, idea.ideaTypeId.required]`**; tipo de outro usuário **422 `idea.ideaType.invalid`**; listar paginado **200** (`updatedAt` ISO); buscar id válido **200**; buscar id de outro usuário **404 `idea.not_found`**; update válido **204**; update cross-user **403 `idea.forbidden`**; delete inexistente **404 `idea.not_found`**; delete cross-user **403 `idea.forbidden`**; delete válido **204**. **Observação importante registrada no `.http`**: pela ordem do fluxo `save-idea` (checagem de posse do Tipo de Ideia antes da posse da Ideia), o cenário de update 403 só retorna `idea.forbidden` se o atacante enviar um `ideaTypeId` que ele mesmo possui; usar o tipo do dono produz `422 idea.ideaType.invalid`. O `.http` ganhou um passo de pré-requisito e a variável `@ideaTypeIdOther` para isolar o 403 — comportamento correto conforme as Observações Locais da spec.

- [x] Adicionar no i18n do front-end (`apps/frontend/src/shared/i18n/messages.pt.ts` e `messages.en.ts`) todas as novas chaves de erro produzidas por `/ideas`. O `Validator` concatena `${field.code}.${errorCode}` usando o nome literal do atributo da entidade, então as chaves seguem **camelCase** (mesmo padrão da spec 005 com `idea-type.userId.*`): `idea.name.required`, `idea.name.min.length`, `idea.name.max.length`, `idea.description.required`, `idea.description.min.length`, `idea.description.max.length`, `idea.objective.required`, `idea.objective.min.length`, `idea.objective.max.length`, `idea.ideaTypeId.required`, `idea.ideaTypeId.uuid`, `idea.userId.required`, `idea.userId.uuid`, `idea.ideaType.invalid`, `idea.not_found`, `idea.forbidden`. Reaproveitar as chaves genéricas já cadastradas em specs anteriores quando houver equivalência.
  > ✅ 2026-05-18 12:40 — As 16 chaves `idea.*` adicionadas em `messages.pt.ts` (objeto `as const`) e `messages.en.ts` (tipado por `ErrorMessages`, mantendo paridade de chaves). Mensagens seguem o estilo das chaves `idea-type.*` existentes; limites refletem a entidade (description max 2000, objective max 1000). `tsc` do frontend valida que ambos os mapas têm exatamente o mesmo conjunto de chaves.

### Tasks - Front-end

> ⚠️ Sem validação automatizada de UI. O agente entrega o código + `npx tsc --noEmit` limpo; a verificação visual é manual.

- [x] Criar a listagem paginada de `ideas` no módulo `ideas` (rota privada `/ideas`). Tabela com as colunas **Nome**, **Tipo de Ideia** (rótulo do `IdeaType` correspondente, obtido a partir do `ideaTypeId` — fazer um lookup local com a lista vinda de `GET /idea-types` ou aceitar que o backend envie um campo derivado `ideaTypeName` no payload, escolha que melhor se encaixe no controller — registrar a decisão na evidência) e **Atualizado em** (formatar o `updatedAt` ISO devolvido pelo backend usando `Intl.DateTimeFormat` ou helper equivalente do shared kit), mais a coluna de ações (ícones de editar e excluir). A paginação deve consumir `GET /ideas?page=&pageSize=`.

  > ✅ 2026-05-18 12:40 — `idea-list.component.tsx` + `idea-list.page.tsx`; rota `app/(private)/ideas/page.tsx` repontada para `IdeaListPage` (stubs de scaffold `ideas.page.tsx`/`ideas.component.tsx` removidos — desvio registrado). Tabela com **Nome**, **Tipo de Ideia**, **Atualizado em** e **Ações**. **Decisão registrada**: rótulo do Tipo de Ideia resolvido por **lookup local** — o componente busca `GET /idea-types?page=1&pageSize=100` e monta `Record<id,name>` (`ideaTypeNames[item.ideaTypeId] ?? '—'`), já que o controller não envia `ideaTypeName`. **Atualizado em** formatado com `new Intl.DateTimeFormat('pt-BR', …)` sobre o `updatedAt` ISO. Paginação consome `GET /ideas?page=&pageSize=10` (botões Anterior/Próxima). Estado vazio com `EmptyListState` e CTA para `/ideas/new`.

- [x] Criar o formulário de `idea` compartilhado entre criação e edição (`/ideas/new` e `/ideas/[id]/edit`), organizado em seções via [`form-section-layout`](../../../apps/frontend/src/shared/components/ui/form-section-layout.tsx):
  - Seção "Identificação" — `name` (input texto).
  - Seção "Detalhes" — `description` (textarea), `objective` (textarea).
  - Seção "Classificação" — `ideaTypeId` (select populado por `GET /idea-types`; rótulo exibido = `name` do Tipo de Ideia). Se a lista vier vazia, exibir um estado de "Nenhum Tipo de Ideia cadastrado" com link/botão para `/idea-types/new`.
    Submissão chama `POST /ideas` na criação e `PUT /ideas/:id` na edição. Os erros do backend (`ApiErrorResponse.errors[]`) seguem o mesmo padrão das specs 002/003: um `toast.error(getMessage(code))` por item.
    > ✅ 2026-05-18 12:40 — `idea-form.component.tsx` + `idea-form.page.tsx`; rotas `app/(private)/ideas/new/page.tsx` e `app/(private)/ideas/[id]/edit/page.tsx` (esta com `params: Promise<{id}>` `await`-ado, padrão Next desta versão, igual ao idea-type). Seções via `FormSectionLayout`: **Identificação** (`name` Input), **Detalhes** (`description` e `objective` Textarea), **Classificação** (`ideaTypeId` via `Combobox` — não existe `select.tsx` no shared kit; `Combobox` é o equivalente já usado no projeto). Select populado por `listIdeaTypes({page:1,pageSize:100})` exibindo `name`. Lista vazia → bloco "Nenhum Tipo de Ideia cadastrado" com botão para `/idea-types/new` e submit desabilitado. Submissão: `createIdea`/`updateIdea`; erros do backend via `IdeaApiError.codes.forEach(c => toast.error(getMessage(c)))`. Novo `idea-api.util.ts` espelha `idea-type-api.util.ts`.

- [x] Integrar a coluna de ações da listagem: lápis navega para `/ideas/[id]/edit`; lixeira abre [`delete-confirmation-dialog`](../../../apps/frontend/src/shared/components/ui/delete-confirmation-dialog.tsx) e, ao confirmar, chama `DELETE /ideas/:id` e atualiza a tabela.

  > ✅ 2026-05-18 12:40 — Ícone `Pencil` faz `router.push('/ideas/{id}/edit')`; `Trash2` define `pendingDelete` e abre `DeleteConfirmationDialog`; ao confirmar, `deleteIdea(id)` + `toast.success` + `fetchPage(page)` para recarregar a tabela. Mesmo padrão do `idea-type-list.component.tsx`.

- [x] Adicionar o item **"Ideias"** no menu lateral plano (entregue pela spec 004) apontando para `/ideas`, posicionado logo abaixo do item **"Tipos de Ideia"** entregue na spec 005. Em `apps/frontend/src/app/(private)/layout.tsx`, manter `match: 'prefix'` para destacar também `/ideas/new` e `/ideas/[id]/edit`.

  > ✅ 2026-05-18 12:40 — Item `{ id:'ideas', label:'Ideias', href:'/ideas', icon: Lightbulb, match:'prefix' }` adicionado em `SIDEBAR_SECTIONS` logo após `idea-types` (TODO `spec-007` removido). Ícone `Lightbulb` importado de `lucide-react`. `match:'prefix'` mantém o item ativo em `/ideas/new` e `/ideas/[id]/edit`.

- [x] Rodar `npx tsc --noEmit` em `apps/frontend` e sinalizar ao usuário que a UI está pronta para conferência manual.
  > ✅ 2026-05-18 12:40 — `npx tsc --noEmit` em `apps/frontend` **sem erros**. Backend recompilado (`nest build`) e rodando em `localhost:4000` com a migration `ideas` aplicada; banco ativo via Docker. **Sem verificação automatizada de UI nesta spec** (conforme Observações Locais) — a interface (`/ideas`, `/ideas/new`, `/ideas/[id]/edit`, item de menu "Ideias") está pronta para conferência manual pelo usuário.

## Resultado Esperado

- Agregado `idea` adicionado ao módulo `ideas` com entidade validada, repositório contratado e casos de uso `save-idea` e `delete-idea` implementados e testados, incluindo a verificação cruzada de `ideaTypeId` contra o `IdeaTypeRepository`.
- Model `Idea` sincronizado no Prisma com migration aplicada (`ideas`) e relação com `IdeaType`.
- CRUD de `idea` exposto no backend via `IdeaController` em `/ideas`, autenticado, com filtro por `userId` em todas as consultas, payload de leitura incluindo `updatedAt` (ISO 8601) e cenários cobertos no `idea.integration.http`.
- Listagem paginada, formulário compartilhado entre criação e edição (com select de Tipo de Ideia populado por `GET /idea-types`) e exclusão com confirmação funcionando no front-end, acessíveis pelo item **"Ideias"** do menu lateral.
- Todas as novas chaves de erro de `/ideas` mapeadas em `messages.pt.ts` e `messages.en.ts`.
- Sem erros de TypeScript ou de build após as alterações.

## Encerramento

Esta spec termina apenas quando todos os itens estiverem marcados e com evidência registrada, no formato definido em [Como executar](../../shared/como-executar.md).

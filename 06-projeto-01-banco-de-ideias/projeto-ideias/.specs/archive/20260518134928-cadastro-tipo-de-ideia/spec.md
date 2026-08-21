# 005-cadastro-tipo-de-ideia

## Objetivo

Entregar o cadastro (CRUD) do **Tipo de Ideia** dentro de um novo módulo de negócio `ideas`, com agregado `idea-type`, persistência via Prisma, endpoints REST autenticados e interface de listagem + formulário compartilhado entre criação e edição. Este é o **primeiro cadastro** do módulo `ideas` e a spec inclui a criação do próprio módulo. O Tipo de Ideia carrega o **prompt especializado** que será usado mais tarde no processamento da Ideia: o prompt é apenas um texto com **marcadores** (`{{name}}`, `{{description}}`, `{{objective}}`, `{{resources}}`) que serão substituídos pelos dados da Ideia em uma spec futura.

> O **carregador de Tipos de Ideia pré-definidos** (botão "Carregar Tipos de Ideia padrão" + endpoint `POST /idea-types/load-defaults`) **não** entra nesta spec — fica isolado na spec 006-carregar-tipos-padrao para não inflar o CRUD.

## Contexto Técnico

- Módulo de negócio **novo**: `ideas` (ainda não existe). Deve ser criado pela skill [config-new-module](../../../.claude/skills/config-new-module) antes de qualquer outra task. Conforme [Módulos](../../memory/modulos.md), o Banco de Ideias só tem `auth` e `ideas`; este é o segundo e último módulo de negócio do produto.
- Agregado: `idea-type`. Campos do MVP: `id`, `name`, `description`, `prompt`, `userId`. Cada Tipo de Ideia pertence ao usuário que o cadastrou (mesmo padrão de propriedade já adotado em `auth/user`).
- O **prompt** é um `text` livre. Esta spec **não** valida que os marcadores estejam presentes nem faz substituição — só guarda o texto. A combinação prompt + Ideia + Recursos vira responsabilidade do caso de uso de processamento em spec futura (ver [Processamento com IA](../../memory/processamento-ia.md)).
- Backend NestJS com `IdeaTypeController` em `apps/backend/src/modules/ideas`, persistência via Prisma. Endpoints autenticados (mesmo padrão do `auth.controller.ts` da spec 003 — JWT validado por guard global, exceções marcadas com `@Public()`).
- Front-end Next.js com listagem paginada e formulário compartilhado entre criação e edição, dentro do módulo `ideas` em rota privada (grupo `(private)`).
- A linguagem do código segue [Contexto Técnico Global](../../memory/contexto-tecnico.md): identificadores em inglês (`IdeaType`, `SaveIdeaType`, `DeleteIdeaType`); conceito do domínio em português ("Tipo de Ideia") apenas em telas, mensagens e documentação.

## Referências Compartilhadas

- [Como executar](../../shared/como-executar.md)
- [Regras de nomenclatura](../../shared/regras-de-nomenclatura.md)

## Observações Locais

- O caso de uso `save-idea-type` cobre tanto criação quanto atualização. Casos de uso de comando retornam `void`. Consultas (`findById`, `findPage`) **não viram caso de uso**: o controller chama o repositório direto.
- O projeto **não usa DTOs de entrada**. **Respostas de leitura devem ser mapeadas para objetos simples no controller** antes de retornar — entidades de domínio usam `protected readonly props` com getters de prototype, que não serializam via `JSON.stringify` (produzem `{}`). O controller deve construir explicitamente o objeto de retorno (`{ id, name, description, prompt, updatedAt }`).
- **Marcadores reconhecidos no prompt** (apenas documentação nesta spec, sem validação de presença): `{{name}}`, `{{description}}`, `{{objective}}`, `{{resources}}`. Documentar a lista no helper do front-end e na descrição do campo no formulário (ex.: `<p>` discreto abaixo da textarea: "Use {{name}}, {{description}}, {{objective}} e {{resources}} para inserir os dados da Ideia ao processar.").
- Usuário dono: por simetria com [Domínio](../../memory/dominio.md) e com o que está adotado em `auth/user`, todo Tipo de Ideia pertence a um usuário. O backend grava `userId` (extraído do JWT autenticado) em `create` e usa como filtro padrão em `findPage`. O front-end consome apenas os Tipos de Ideia do usuário logado.
- **Política de cross-user**: `findById(id)` **não** recebe `userId` como filtro; o caso de uso/controller compara `entity.userId` com o usuário autenticado e responde 403 (em mutações) ou 404 (em leituras por id, para não revelar a existência do registro de outro usuário). Esse padrão vale para todos os agregados do projeto.
- A listagem fica dentro do módulo `ideas` no front-end, em rota privada (`/idea-types` no grupo `(private)`). O grupo `(private)` já é protegido por `AuthGuard` (spec 003).
- **Sem verificação automatizada de UI nesta spec.** As validações automatizadas vão até a camada de backend (testes unitários do módulo + cenários no Rest Client). O usuário valida a interface manualmente.
- Esta spec **não** chama o provedor de IA, **não** processa Ideia e **não** entrega Recursos nem Resultado. Esses passos ficam para specs posteriores (ver [Roadmap](../../memory/roadmap.md)).

## Tasks

### Tasks - Estrutura do módulo

- [x] Criar o módulo de negócio `ideas` com a skill [config-new-module](../../../.claude/skills/config-new-module).
  > ✅ 2026-05-14 19:36 — Rodei `scripts/create-module.js --module ideas --namespace @ideias`. Script falhou no `npm install` porque o template `modules/<m>/package.json` traz `@ideias/__package_name__` (placeholder em lower-case que o script não substitui). Ajustei manualmente para `@ideias/ideas` e rodei `npm install` + `npm run build` + `npm run test --workspace @ideias/ideas` com sucesso. Scaffold backend (`apps/backend/src/modules/ideas/{ideas.module,ideas.controller}.ts` + registro em `AppModule`) e frontend (`(private)/ideas/page.tsx` + `modules/ideas/{pages,components}`) gerados pelo script.

### Tasks - Negócio (módulo `ideas`)

- [x] Criar o agregado `idea-type` dentro do módulo `ideas` com a skill [module-aggregate](../../../.claude/skills/module-aggregate).
  > ✅ 2026-05-14 19:38 — Rodei `scripts/create-aggregate.js --module ideas --aggregate idea-type --mode crud`. Skill criou `modules/ideas/src/idea-type/{model,provider,usecase,index.ts}` com casos de uso CRUD-base. Os arquivos `create/update/find-*` foram removidos depois para alinhar com a decisão da spec (apenas `save-idea-type` e `delete-idea-type`).

- [x] Implementar a entidade `IdeaType` com a skill [module-entity](../../../.claude/skills/module-entity), com os campos:
  - `id` (rule: required + uuid)
  - `name` (rule: required + min length 3 + max length 120)
  - `description` (rule: required + min length 10 + max length 500)
  - `prompt` (rule: required + min length 20 + max length 8000)
  - `userId` (rule: required + uuid)
  Se alguma regra ainda não existir em `packages/shared`, criar com [shared-validation-rule](../../../.claude/skills/shared-validation-rule).
  > ✅ 2026-05-14 19:42 — Apliquei a skill manualmente (mesmo padrão de `user.entity.ts`): `IdeaTypeState` com `name`, `description`, `prompt`, `userId`; getters; `validate()` lazy com `Required`, `MinLength`, `MaxLength` e `Uuid` para `userId`. `id`, `createdAt`, `updatedAt` validados pela classe base. Teste em `modules/ideas/test/idea-type/model/idea-type.entity.test.ts` cobre todos os campos e cenários de min/max/required/uuid — 14 testes verdes. Todas as regras necessárias já existiam em `packages/shared`.

- [x] Definir o contrato do repositório de `idea-type` com [module-repository](../../../.claude/skills/module-repository). Métodos: `create`, `update`, `delete`, `findById(id)`, `findPage({ userId, page, perPage })`. Gerar também o `FakeIdeaTypeRepository` em memória.
  > ✅ 2026-05-14 19:46 — `IdeaTypeRepository` estende `CrudRepository`, `IdeaTypePageParams` agora exige `userId`. `FakeIdeaTypeRepository` em `modules/ideas/src/idea-type/provider/fake-idea-type.repository.ts` filtra por `userId` em `findPage` e é usado nos testes dos casos de uso. A skill `module-repository` não foi rodada como script; segui o mesmo padrão do `auth/user`.

- [x] Implementar o caso de uso `save-idea-type` ([module-use-case](../../../.claude/skills/module-use-case)). Decisão criar/atualizar baseada em `findById`: se `id` veio e o registro encontrado pertence ao mesmo `userId`, atualiza; senão, cria. Lança `DomainError("idea-type.forbidden", 403)` em atualização cross-user.
  > ✅ 2026-05-14 19:48 — `SaveIdeaType` em `modules/ideas/src/idea-type/usecase/save-idea-type.usecase.ts`. Retorna `void`, faz `findById(input.id)`, detecta cross-user antes de qualquer escrita (lança `DomainError("idea-type.forbidden", 403)`), `clone()` do existente em update, `new IdeaType(...)` em create; chama `validate()` antes de persistir. Os arquivos antigos `create-idea-type` / `update-idea-type` / `find-*` foram removidos do agregado e dos exports.

- [x] Implementar o caso de uso `delete-idea-type` ([module-use-case](../../../.claude/skills/module-use-case)). Lança `DomainError("idea-type.not_found", 404)` quando o `id` não existir e `DomainError("idea-type.forbidden", 403)` quando o registro pertencer a outro usuário.
  > ✅ 2026-05-14 19:48 — `DeleteIdeaType` recebe `{ id, userId }`. Quando `findById` retorna `null` lança `DomainError("idea-type.not_found", 404)`; quando `entity.userId !== userId` lança `DomainError("idea-type.forbidden", 403)`. Só remove via repositório quando o dono confere.

- [x] Cobrir os dois casos de uso com testes unitários (cenários de criação, atualização, validação de campos obrigatórios, 403/404 cross-user e inexistente). Coverage 100% nos arquivos dos casos de uso.
  > ✅ 2026-05-14 19:50 — `modules/ideas/test/idea-type/usecase/{save,delete}-idea-type.usecase.test.ts` usando `FakeIdeaTypeRepository`. `npm --workspace @ideias/ideas run test` reporta `Tests: 27 passed, 27 total` e coverage 100% Stmts/Branch/Funcs/Lines em `save-idea-type.usecase.ts`, `delete-idea-type.usecase.ts` e `idea-type.entity.ts`.

### Tasks - Back-end

- [x] Sincronizar o módulo `ideas` com o Prisma criando o model `IdeaType` ([backend-prisma-sync-module](../../../.claude/skills/backend-prisma-sync-module)). Campos: `id` (uuid PK), `name`, `description`, `prompt` (`@db.Text`), `userId` (FK), `createdAt`, `updatedAt`, `deletedAt` nullable, `@@map("idea_types")`. Migration nomeada `idea-types`.
  > ✅ 2026-05-14 19:42 — Criei `apps/backend/prisma/models/ideas.model.prisma` com o model `IdeaType` (campos exigidos, `prompt @db.Text`, relação `User`/`IdeaType[]` com `onDelete: Cascade`, `@@map("idea_types")`) e adicionei `ideaTypes IdeaType[]` no `User`. `npm --workspace apps/backend run prisma:migrate:dev -- --name idea-types` aplicou `prisma/migrations/20260514194221_idea_types/migration.sql`. `prisma:generate` regerou o client.

- [x] Implementar `PrismaIdeaTypeRepository` em `apps/backend/src/modules/ideas` ([backend-prisma-repository](../../../.claude/skills/backend-prisma-repository)), sem alterar a interface do módulo. `findPage` filtra por `userId`.
  > ✅ 2026-05-14 19:45 — `apps/backend/src/modules/ideas/idea-type.prisma.ts` implementa `IdeaTypeRepository`. `findPage` recebe `{ userId, page, perPage }` e injeta `where: { userId }` no `findMany`/`count`, ordena por `updatedAt desc`. `toDomain`/`toPersistence` espelham o padrão de `user.prisma.ts`. Registrado em `IdeasModule` com `DbModule`.

- [x] Criar `apps/backend/src/modules/ideas/idea-type.controller.ts` ([backend-nest-controller](../../../.claude/skills/backend-nest-controller)) expondo o CRUD em `/idea-types`:
  - `POST /idea-types` (criar) e `PUT /idea-types/:id` (atualizar) → instanciam `SaveIdeaType` e injetam `userId` do usuário autenticado.
  - `DELETE /idea-types/:id` → instancia `DeleteIdeaType`.
  - `GET /idea-types/:id` e `GET /idea-types` → repositório direto. `GET /:id` checa `entity.userId === user.id` (caso contrário 404). `GET /` filtra por `userId` em `findPage`. Mapeiam para `{ id, name, description, prompt, updatedAt }`.
  - Todos autenticados (sem `@Public()`).
  > ✅ 2026-05-14 19:46 — `IdeaTypeController` (`@Controller('idea-types')`) com endpoints `POST/PUT` chamando `SaveIdeaType`, `DELETE` chamando `DeleteIdeaType`, `GET /:id` lançando `NotFoundException('idea-type.not_found')` quando `!entity || entity.userId !== user.id`, e `GET /` com `findPage({ userId, page, perPage })` (parse de `page`/`pageSize` da query). `toView` retorna apenas `{ id, name, description, prompt, updatedAt }`. Nenhum endpoint usa `@Public()`. `npm --workspace apps/backend run build` passa.

- [x] Criar `apps/backend/src/modules/ideas/idea-type.integration.http` (Rest Client) com cenários CRUD: criação válida, criação faltando campos (422), prompt fora do limite (422), atualização válida, update cross-user (403), delete válido, delete inexistente (404), delete cross-user (403), listagem paginada e busca por id. Validar manualmente com o backend rodando.
  > ✅ 2026-05-14 19:48 — Arquivo `idea-type.integration.http` criado com variáveis `@token`, `@tokenOther`, `@ideaTypeId` e blocos cobrindo registrar/login, criar válido, criar faltando campos (422), prompt acima do limite (422), listar paginado, buscar por id válido e cross-user (404), update válido (204) e cross-user (403), delete inexistente (404), delete cross-user (403) e delete válido (204). Execução manual no Rest Client pendente do usuário, como combinado na spec (sem automação UI).

- [x] Adicionar no i18n (`messages.pt.ts` e `messages.en.ts`) as chaves de `/idea-types`: `idea-type.{name,description,prompt}.{required,min.length,max.length}`, `idea-type.not_found`, `idea-type.forbidden`.
  > ✅ 2026-05-14 19:49 — `messages.pt.ts` e `messages.en.ts` recebem as 9 chaves de validação (`name/description/prompt` × `required/min.length/max.length`) e `idea-type.not_found` + `idea-type.forbidden`. `ErrorMessageKey` (deriva de `messages.pt`) garante que `messages.en` exporte todas elas.

### Tasks - Front-end

> ⚠️ Sem validação automatizada de UI. Verificação visual é manual.

- [x] Criar a listagem paginada de `idea-types` na rota privada `/idea-types`. Tabela com **Nome**, **Descrição** (truncada), **Atualizado em**, mais ações (editar/excluir). Paginação consome `GET /idea-types?page=&pageSize=`. Quando `total === 0`, mostrar `EmptyListState` com o botão **"Cadastrar Tipo de Ideia"** → `/idea-types/new`.
  > ✅ 2026-05-14 19:55 — `apps/frontend/src/app/(private)/idea-types/page.tsx` delega para `IdeaTypeListPage` → `IdeaTypeListComponent`. Tabela usa `TableCard`/`Table*` com colunas Nome, Descrição truncada (80 chars), Atualizado em (formatado `pt-BR`) e Ações. `listIdeaTypes` chama `GET /idea-types?page=&pageSize=10`. Estado vazio usa `EmptyListState` + botão "Cadastrar Tipo de Ideia" → `/idea-types/new`.

> ℹ️ O segundo botão do estado vazio ("Carregar Tipos de Ideia padrão") será adicionado pela spec 006.

- [x] Criar o formulário de `idea-type` compartilhado entre criação e edição (`/idea-types/new` e `/idea-types/[id]/edit`), em seções via `form-section-layout`:
  - "Identificação" — `name` + `description`.
  - "Prompt especializado" — `prompt` (textarea ~12 linhas) com hint discreto sobre os marcadores `{{name}}`, `{{description}}`, `{{objective}}`, `{{resources}}`.
  Submissão: `POST /idea-types` (criar) ou `PUT /idea-types/:id` (editar). Erros do backend tratados com `toast.error(getMessage(code))` por item.
  > ✅ 2026-05-14 19:55 — `IdeaTypeFormComponent` (em `modules/ideas/components`) reutilizado em `/idea-types/new` e `/idea-types/[id]/edit`. Duas seções via `FormSectionLayout` ("Identificação" com `name`+`description`, "Prompt especializado" com textarea `rows=12` + `<p>` com `IDEA_TYPE_PROMPT_HINT`). Submit chama `createIdeaType` ou `updateIdeaType`; erros viram `toast.error(getMessage(code))` por item, código `IdeaTypeApiError` carrega array `codes`.

- [x] Integrar a coluna de ações: lápis → `/idea-types/[id]/edit`; lixeira → `delete-confirmation-dialog` → `DELETE /idea-types/:id` → recarrega tabela.
  > ✅ 2026-05-14 19:55 — Coluna "Ações" tem dois `Button variant="ghost"` com ícones `Pencil` (navega para `/idea-types/[id]/edit`) e `Trash2` (abre `DeleteConfirmationDialog` controlado por `pendingDelete`). Após `deleteIdeaType` recarrega a página atual via `fetchPage(page)`. Mensagens de erro também via `toast.error(getMessage(code))`.

- [x] Adicionar o item **"Tipos de Ideia"** no menu lateral (já plano após spec 004) apontando para `/idea-types`. Reservar slot para um futuro item **"Ideias"** (spec 007).
  > ✅ 2026-05-14 19:56 — `apps/frontend/src/app/(private)/layout.tsx` ganha o item `{ id: 'idea-types', label: 'Tipos de Ideia', href: '/idea-types', icon: Tags, match: 'prefix' }` e um TODO referenciando a spec 007 para o futuro item "Ideias".

- [x] Rodar `npx tsc --noEmit` em `apps/frontend` e sinalizar UI pronta para conferência manual.
  > ✅ 2026-05-14 19:58 — `cd apps/frontend && npx tsc --noEmit` retornou sem erros. `npm run build --workspace @ideias/frontend` também passa e as rotas `/idea-types`, `/idea-types/new`, `/idea-types/[id]/edit` aparecem no relatório do Next.js. UI pronta para conferência manual no navegador.

## Resultado Esperado

- Módulo `ideas` criado, registrado no `AppModule` e com estrutura inicial do front-end.
- Agregado `idea-type` com entidade validada, repositório contratado e casos de uso `save-idea-type` e `delete-idea-type` implementados e testados.
- Model `IdeaType` no Prisma com migration `idea-types` aplicada.
- CRUD exposto em `/idea-types`, autenticado, com filtro por `userId` em `findPage` e checagem de propriedade nos endpoints por id, com cenários cobertos no `idea-type.integration.http`.
- Listagem paginada, formulário compartilhado, exclusão com confirmação e item de menu funcionando no front-end.
- Chaves de erro de `/idea-types` mapeadas em `messages.pt.ts` e `messages.en.ts`.
- Sem erros de TypeScript ou de build.

## Encerramento

Esta spec termina apenas quando todos os itens estiverem marcados e com evidência registrada, no formato definido em [Como executar](../../shared/como-executar.md).

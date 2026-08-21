# 009-recursos-da-ideia

## Objetivo

Acrescentar a entidade **Recurso** (`Resource`) ao agregado `idea` do módulo `ideas`, permitindo que cada Ideia carregue uma lista de recursos contextuais que serão futuramente combinados pelo caso de uso de Processamento ([Processamento com IA](../../memory/processamento-ia.md)). O relacionamento é **mestre–detalhe**: a coleção de Recursos pertence à Ideia e é persistida atomicamente com ela (criar/atualizar/excluir a Ideia também cuida dos seus Recursos). Esta spec cobre **apenas o tipo `text`** como conteúdo suportado, mas modela `type` e `content` de forma a aceitar tipos adicionais (`image`, `document`, `audio`, `video-url`, etc.) em specs futuras sem quebra de compatibilidade. No frontend, o formulário de Ideia ganha uma seção **Recursos** com um componente próprio para adicionar, editar e remover itens da lista antes de submeter; a listagem da Ideia não muda. Esta spec **não** entrega processamento por IA, nem novos tipos de recurso além de texto, nem endpoints REST dedicados a recursos (a manipulação acontece via o próprio recurso já existente do CRUD de Ideia).

## Contexto Técnico

- Módulo de negócio: `ideas` (já existe). Agregado afetado: `idea` (criado pela [spec 007](../007-cadastro-ideia/spec.md)). Esta spec **não** cria módulo nem agregado novo — apenas estende o agregado existente com a entidade interna `Resource`.
- Decisão arquitetural: **`Resource` é uma entidade interna do agregado `idea`**, não um agregado separado. A consequência prática é que o `IdeaRepository` continua sendo a fronteira de persistência: ele recebe e devolve `Idea` com a coleção de recursos materializada e cuida da gravação/leitura em transação. Não criar `ResourceRepository`, `SaveResource`/`DeleteResource` nem controller dedicado em `/resources`. Essa decisão segue o que o [Domínio](../../memory/dominio.md) descreve para o conceito de Recurso ("uma Ideia pode ter zero ou muitos Recursos") e mantém o módulo `ideas` enxuto.
- Modelagem de extensibilidade do tipo: a entidade tem um campo `type: ResourceType` (string union) e um campo `content: string`. No MVP, `type` aceita **apenas** `'text'` e `content` carrega o texto bruto. A validação rejeita qualquer outro valor de `type` para que a expansão futura seja consciente: cada novo tipo entra em uma spec própria que estende o union, ajusta a validação e o componente de UI. Sem JSON polimórfico, sem subclasses; apenas dois campos planos persistidos. Documentar essa decisão em [Domínio](../../memory/dominio.md) ao final da spec.
- API: o payload de `Idea` ganha o array `resources` em **leitura** (`GET /ideas/:id`) e em **escrita** (`POST /ideas`, `PUT /ideas/:id`). A coleção é tratada como **substituição completa** em update — o cliente envia o estado final dos recursos da Ideia e o backend reconcilia (apaga o que não veio, insere o que tem `id` novo, atualiza o que já existia). A listagem `GET /ideas` **não** envia `resources` para manter o payload pequeno; quando precisar do detalhe, o cliente faz `GET /ideas/:id`.
- Persistência: novo model Prisma `Resource` com FK para `Idea` (`onDelete: Cascade`). As operações `IdeaRepository.create`/`update`/`delete` são atômicas — usar `prisma.$transaction` para garantir consistência entre `Idea` e sua coleção de `Resource`. `IdeaRepository.findById` carrega os recursos junto (include); `IdeaRepository.findPage` continua sem recursos.
- Frontend: nova seção **Recursos** no formulário de Ideia (`apps/frontend/src/modules/ideas/components/idea-form.component.tsx`), abaixo de **Classificação**. A seção contém um componente reutilizável dentro do módulo `ideas` (`idea-resources-input.component.tsx`) que lista os recursos atuais, permite adicionar um novo (campo de texto longo), editar inline e remover. A coleção fica em estado local até o submit, quando segue junto no payload de `POST /ideas` ou `PUT /ideas/:id`. Sem endpoints REST específicos para recursos no frontend.
- A linguagem do código segue [Contexto Técnico Global](../../memory/contexto-tecnico.md): identificadores em inglês (`Resource`, `ResourceType`, `IdeaResourcesInput`); rótulos visíveis em português ("Recursos", "Adicionar recurso", "Texto").
- Sem verificação automatizada de UI nesta spec. As validações automatizadas vão até a camada de backend (testes unitários do módulo + cenários no Rest Client). O usuário valida a interface manualmente.

## Referências Compartilhadas

- [Como executar](../../shared/como-executar.md)
- [Regras de nomenclatura](../../shared/regras-de-nomenclatura.md)

## Observações Locais

- **Mestre–detalhe, não agregado separado.** Toda manipulação dos recursos passa pelo agregado `idea`. Não há `ResourceRepository`, não há controller `/resources`, não há use case `save-resource`/`delete-resource`. Quem quiser modificar um recurso modifica a Ideia inteira pelo CRUD existente, enviando a coleção atualizada.
- **Substituição (replace-all) na atualização.** O backend recebe o array final de recursos no `PUT /ideas/:id`. Reconciliação: para cada item recebido com `id` que ainda existe na base do mesmo `ideaId`, faz `update`; para itens recebidos sem `id` ou com `id` que não existe, faz `create` (gerando o `id` quando vazio); todos os recursos atuais da Ideia que **não** foram referenciados no array recebido são **excluídos**. A reconciliação acontece dentro de uma transação Prisma com a atualização da Ideia.
- **Limite por Ideia.** No MVP, máximo de **20 recursos por Ideia**. Estouro retorna `DomainError("idea.resources.too_many", 422)`. Validação dentro da entidade `Idea` (no `validate()`), porque é uma regra do agregado, não do recurso isolado.
- **Validação do recurso.** A entidade `Resource` valida: `id` (uuid, herdado de `Entity`), `type` (required + valor pertencente ao union — apenas `'text'` no MVP), `content` (required + min length 1 + max length 20000), `position` (required + inteiro `>= 0`). `Resource` herda de `Entity<ResourceState>`. A validação roda como parte de `Idea.validate()`: o `Idea` itera `resources` e chama `resource.validate()` em cada item.
- **Posição.** Cada Resource tem `position: number` para preservar a ordem definida pelo usuário (drag manual fica para evolução futura — no MVP a ordem é a de inserção, com botões para mover/excluir). O backend persiste a posição como recebida; ao ler, ordena por `position ASC, createdAt ASC`.
- **Sem userId no Resource.** O `Resource` não carrega `userId` próprio porque pertence sempre a uma Ideia, e a Ideia é quem tem dono. A propriedade é verificada uma única vez no caso de uso `save-idea` (já implementado pela spec 007).
- **Tipos suportados no MVP.** Apenas `'text'`. O union `ResourceType` é literalmente `'text'` neste momento; specs futuras estendem para `'image' | 'document' | 'audio' | 'video-url'`. Quando o `type` recebido na entrada não é suportado, lançar `DomainError("idea.resource.type.unsupported", 422)` no caso de uso `save-idea` (antes da validação da entidade). Esse erro é distinto de `idea.resource.type.required` para deixar claro o cenário.
- **Sem DTO de entrada no backend.** Mantido o padrão das specs 005/007: o controller recebe `Body` cru, monta o input do caso de uso `save-idea` incluindo o array de recursos. Resposta de leitura mapeia explicitamente o objeto, incluindo `resources` em `GET /ideas/:id` e omitindo em `GET /ideas`.
- **Frontend — componente próprio.** Criar `apps/frontend/src/modules/ideas/components/idea-resources-input.component.tsx`. O componente recebe `value: SaveResourceInput[]` e `onChange(next)`. Cada linha exibe o tipo (badge "Texto" — único no MVP), um `Textarea` para o conteúdo (rows=4) e botões: lápis para focar/editar, lixeira para remover, setas ↑/↓ para reordenar localmente (atualiza `position`). Botão "Adicionar recurso" no final da seção. Sem chamada de API direta — toda alteração afeta o estado local até o submit.
- **Frontend — listagem da Ideia.** A tabela atual de `/ideas` continua igual (Nome, Tipo de Ideia, Atualizado em, Ações). Não acrescentar coluna de contagem de recursos nesta spec — evolução futura.
- **Sem mudanças no menu lateral, nas rotas ou nos formulários do Tipo de Ideia.** Apenas o formulário de Ideia ganha a seção **Recursos**.
- Esta spec **não** chama o provedor de IA, **não** processa Ideia e **não** entrega Resultado. Esses passos ficam para specs posteriores (ver [Roadmap](../../memory/roadmap.md)).

## Tasks

### Tasks - Negócio (módulo `ideas`)

- [x] Criar a entidade `Resource` em `modules/ideas/src/idea/model/resource.entity.ts` com a skill [module-entity](../../../.claude/skills/module-entity). Estado:
  - `type: ResourceType` (string union, MVP literalmente `'text'`)
  - `content: string`
  - `position: number`
    Adicionar o tipo `ResourceType` exportado do mesmo arquivo (ou do `model/index.ts`). Validação:
  - `idea.resource.type` (required + valor presente em `RESOURCE_TYPES`, lista exportada como `const`)
  - `idea.resource.content` (required + min length 1 + max length 20000)
  - `idea.resource.position` (required + inteiro `>= 0`)
    Se a regra `IntegerMinRule` (ou equivalente para inteiro `>= n`) ainda não existir em `packages/shared`, criar com a skill [shared-validation-rule](../../../.claude/skills/shared-validation-rule) e reaproveitar.
    > ✅ 2026-05-18 14:15 — Criados `Resource`, `ResourceType` e a const `RESOURCE_TYPES = ["text"]` em `modules/ideas/src/idea/model/resource.entity.ts` (exportados via `model/index.ts`), seguindo o padrão de `idea-type.entity.ts` da skill module-entity. Validação: `idea.resource.type` (RequiredRule + InRule(RESOURCE_TYPES)); `idea.resource.content` (RequiredRule + MinLengthRule(1) + MaxLengthRule(20000)); `idea.resource.position` (RequiredRule + IntegerRule + MinValueRule(0)). Desvio: `IntegerMinRule` não foi criada — `packages/shared` já expõe `IntegerRule` + `MinValueRule(0)`, reaproveitadas (códigos `idea.resource.position.integer` e `.min.value`), evitando regra redundante.

- [x] Estender o estado da entidade `Idea` (`modules/ideas/src/idea/model/idea.entity.ts`) com o campo `resources: Resource[]` (default `[]` quando o construtor recebe `undefined`). Adicionar getter `resources`. Atualizar `Idea.validate()` para:
  - validar o tamanho da coleção: máximo de 20 itens → `DomainError("idea.resources.too_many", 422)` (lançado direto no `validate`, sem passar pelo `Validator`).
  - iterar `resources` chamando `resource.validate()` em cada item. Cada `Resource` deve passar pelo seu próprio `Validator.validate`. Não duplicar regras na entidade `Idea`.
  - garantir unicidade implícita dos `id`s informados: se houver `id` repetido entre os recursos, lançar `DomainError("idea.resources.duplicate_id", 422)`.
    > ✅ 2026-05-18 14:15 — `IdeaState` ganhou `resources?: Resource[]`; o construtor normaliza para `[]` (`super({ ...props, resources: props.resources ?? [] })`) e o getter retorna a coleção materializada. `validate()` lança `idea.resources.too_many` (422) acima de 20 itens e `idea.resources.duplicate_id` (422) com `id` repetido (ambos direto, sem `Validator`), valida os campos da Ideia e itera `resources` chamando `resource.validate()` (sem duplicar regras).

- [x] Atualizar a interface do repositório `IdeaRepository` (`modules/ideas/src/idea/provider/idea.repository.ts`):
  - `create(entity: Idea): Promise<Idea>` continua a assinatura, mas agora **persiste também os recursos** que vierem em `entity.resources`.
  - `update(entity: Idea): Promise<Idea>` recebe a Ideia com a coleção final de recursos e o repositório fica responsável por reconciliar (replace-all dentro de transação, conforme descrito em "Observações Locais").
  - `delete(id: string): Promise<void>` continua a assinatura — a remoção em cascata fica no banco (FK `onDelete: Cascade`).
  - `findById(id: string): Promise<Idea | null>` passa a carregar os recursos da Ideia (ordenados por `position ASC, createdAt ASC`).
  - `findPage` permanece **sem** recursos (campo retornado vazio ou ausente; documentar a escolha no comentário do método).
    Atualizar `FakeIdeaRepository` (em `modules/ideas/test/mock/fake-idea.repository.ts`) com a mesma semântica em memória, incluindo a reconciliação no `update`.
    > ✅ 2026-05-18 14:15 — Interface documentada com comentário explicando create/update (replace-all em transação)/delete (cascata na FK)/findById (ordenado por position ASC, createdAt ASC)/findPage (sem recursos). `FakeIdeaRepository` atualizado: `update` substitui a Idea inteira (replace-all em memória), `findById` devolve clone com recursos ordenados, `findPage` devolve clones com `resources: []` preservando `updatedAt`. Desvio de caminho: o fake do projeto vive em `modules/ideas/src/idea/provider/fake-idea.repository.ts` (não em `test/mock/`); atualizado nesse local real.

- [x] Atualizar o caso de uso `save-idea` (`modules/ideas/src/idea/usecase/save-idea.usecase.ts`):
  - `SaveIdeaIn` ganha o campo `resources: SaveResourceIn[]` onde `SaveResourceIn = { id?: string; type: string; content: string; position: number }`.
  - Antes de criar/atualizar a `Idea`, validar cada `resource.type` contra `RESOURCE_TYPES`. Se algum não bater, lançar `DomainError("idea.resource.type.unsupported", 422)` (antes de instanciar a entidade, para distinguir de "type ausente").
  - Construir as instâncias `Resource` (gerando `id` quando vazio) e atribuir a `Idea.resources` antes do `validate()`.
  - Atualização: o `Idea` já clonado deve receber a nova coleção integral de recursos (substituição). O repositório encarrega-se da reconciliação ao chamar `update`.
  - Manter as regras existentes (validação cruzada do `ideaTypeId`, `idea.forbidden` em cross-user).
    > ✅ 2026-05-18 14:15 — `SaveIdeaIn` ganhou `resources?: SaveResourceIn[]` (`{ id?; type; content; position }`). `buildResources` lança `idea.resource.type.unsupported` (422) quando há `type` informado fora de `RESOURCE_TYPES` (antes de instanciar a entidade; `type` vazio segue para `idea.resource.type.required` da entidade) e gera `id` quando ausente. A coleção é atribuída tanto na validação prévia quanto no `clone` (update = substituição) e no `new Idea` (create). Mantida a estrutura original (validação prévia da entidade → checagem cruzada do `ideaType` → `idea.forbidden`); regras de regressão preservadas e cobertas por teste.

- [x] Atualizar o caso de uso `delete-idea` (`modules/ideas/src/idea/usecase/delete-idea.usecase.ts`):
  - Nenhuma mudança lógica — a cascata fica na FK do banco. Adicionar apenas comentário/teste cobrindo que `delete-idea` em uma Ideia com recursos remove os recursos junto.
    > ✅ 2026-05-18 14:15 — Sem mudança lógica; adicionado comentário explicando que a cascata é garantida pela FK (`onDelete: Cascade`). Novo teste "remove a Ideia junto com seus recursos (cascata)" cobre o caminho feliz com recursos (o fake reflete a remoção conjunta).

- [x] Cobrir as mudanças com testes unitários, usando os fakes do módulo. Cenários mínimos:
  - `Resource.validate()`: required/min/max de `content`, `type` inválido (string fora do union), `position` negativa, `position` não inteira.
  - `Idea.validate()`: lista vazia OK; lista com 21 itens lança `idea.resources.too_many`; lista com `id` duplicado lança `idea.resources.duplicate_id`; cada item inválido propaga o erro do `Validator`.
  - `save-idea`: criação de Ideia com 0, 1 e N recursos; atualização que adiciona, modifica e remove recursos no mesmo PUT (replace-all); `type` não suportado → 422 `idea.resource.type.unsupported`; cross-user e ideaType inexistente continuam protegidos (regressão).
  - `delete-idea`: caminho feliz com Ideia que tem recursos (o fake deve refletir a remoção dos recursos junto).
    Coverage 100% nos arquivos novos/alterados (`resource.entity.ts`, `idea.entity.ts`, `save-idea.usecase.ts`, `delete-idea.usecase.ts`).
    > ✅ 2026-05-18 14:15 — Criados `test/idea/model/resource.entity.test.ts` e `test/idea/model/idea.entity.test.ts`; ampliados `save-idea.usecase.test.ts` (0/1/N recursos, replace-all, type não suportado, content vazio, too_many) e `delete-idea.usecase.test.ts` (cascata). `npx jest`: 9 suites / 82 testes verdes. Cobertura nos 4 arquivos-alvo: 100% statements/branches/functions/lines (removido o ramo morto `?? []` do getter `resources`, já garantido pelo construtor).

### Tasks - Back-end

- [x] Sincronizar o agregado `idea` com o Prisma adicionando o model `Resource` ao módulo `ideas` com a skill [backend-prisma-sync-module](../../../.claude/skills/backend-prisma-sync-module). O model deve incluir: `id` (uuid PK), `ideaId` (FK para `ideas.id`, `onDelete: Cascade`), `type` (string), `content` (`@db.Text`), `position` (Int), `createdAt`, `updatedAt`, `@@index([ideaId, position])`, `@@map("resources")`. Adicionar a relação inversa em `Idea` (`resources Resource[]`). Aplicar a migration nomeada `resources`.

  > ✅ 2026-05-18 14:15 — Model `Resource` adicionado a `apps/backend/prisma/models/ideas.model.prisma` com todos os campos exigidos, `@@index([ideaId, position])`, `@@map("resources")` e FK `idea` com `onDelete: Cascade`; relação inversa `resources Resource[]` em `Idea`. Migration aplicada: `prisma/migrations/20260518170526_resources/migration.sql` (cria tabela `resources`, índice e FK em cascata); `prisma generate` rodado. Banco sincronizado (Postgres `ideias-projeto-ideias-postgres`).

- [x] Atualizar o repositório Prisma `PrismaIdeaRepository` em `apps/backend/src/modules/ideas/idea.prisma.ts` para:
  - `create(entity)`: criar a Idea e os recursos dentro de `prisma.$transaction([...])`. Mapear cada `Resource` para a linha com `ideaId = entity.id`.
  - `update(entity)`: dentro de uma transação, atualizar os campos da Idea, calcular o conjunto de recursos a remover (existentes na base mas ausentes em `entity.resources`), atualizar os que ainda existem por `id`, criar os que vierem com `id` que não existe na base. Garantir que recursos de **outras** Ideias nunca sejam tocados (todos os predicados incluem `ideaId = entity.id`).
  - `findById(id)`: usar `include: { resources: { orderBy: [{ position: 'asc' }, { createdAt: 'asc' }] } }` e materializar `Resource` com `toResource(row)`.
  - `findPage`: mantém sem recursos (passa `resources: []` ao construir a entidade ou usa um construtor que aceita ausência sem custo). Adicionar comentário curto na função explicando.
  - `delete(id)`: continua via `prisma.idea.delete({ where: { id } })` — a FK `onDelete: Cascade` cuida dos recursos.
    Métodos privados `toResourceRow`/`toResource` espelhando o padrão de `toRow`/`toEntity` já existente.
    > ✅ 2026-05-18 14:15 — `create` usa `prisma.$transaction([idea.create, resource.createMany])`; `update` usa transação interativa que atualiza a Idea, calcula os ids atuais (`findMany` filtrando por `ideaId`), faz `deleteMany` dos ausentes (`id notIn` incoming, sempre com `ideaId = entity.id`), `update` dos existentes e `create` dos novos — recursos de outras Ideias nunca são tocados. `findById` usa `include` com `orderBy [position asc, createdAt asc]`; `findPage` materializa `resources: []` (comentário explicando o payload enxuto); `delete` permanece via `idea.delete` (cascata na FK). Criados `toResourceRow`/`toResource` espelhando `toRow`/`toEntity`. Pacote `@ideias/ideas` rebuildado para expor `Resource`.

- [x] Atualizar `apps/backend/src/modules/ideas/idea.controller.ts`:
  - `SaveIdeaBody` ganha `resources: { id?: string; type: string; content: string; position: number }[]` (opcional — quando ausente, tratar como `[]`).
  - `POST /ideas` e `PUT /ideas/:id` repassam `resources` ao `SaveIdea.execute(...)`.
  - `IdeaResponse` para `GET /ideas/:id` ganha `resources: ResourceResponse[]` onde `ResourceResponse = { id: string; type: string; content: string; position: number }`. **Não** incluir `createdAt`/`updatedAt` do recurso no payload (não é necessário no MVP).
  - `GET /ideas` (paginado) **não** inclui `resources` no payload — manter o array `items` igual ao formato atual. Documentar no comentário do método.
  - `toResponse(entity)` permanece como helper para a listagem (sem recursos). Criar um helper separado `toDetailResponse(entity)` para `GET /:id` que inclui recursos.
    > ✅ 2026-05-18 14:15 — `SaveIdeaBody` ganhou `resources?: SaveResourceBody[]`; `POST`/`PUT` repassam `body.resources ?? []` ao `SaveIdea`. `GET /ideas/:id` retorna `IdeaDetailResponse` com `resources: ResourceResponse[]` (`{ id, type, content, position }` — sem `createdAt`/`updatedAt`). `GET /ideas` mantém `IdeaResponse` sem recursos (comentário documentando). Renomeado o antigo `toView` → `toResponse` (helper da listagem) e criado `toDetailResponse` para o `/:id`. Backend compila (`nest build` limpo).

- [x] Atualizar `apps/backend/src/modules/ideas/idea.integration.http` cobrindo os fluxos novos:
  - criação de Ideia com 0, 1 e 3 recursos.
  - atualização que muda 1 recurso, adiciona 1, remove 1 (replace-all).
  - criação com `type` não suportado → 422 `idea.resource.type.unsupported`.
  - criação com 21 recursos → 422 `idea.resources.too_many`.
  - criação com `content` vazio em um dos recursos → 422 `idea.resource.content.required`.
  - `GET /ideas/:id` retorna a coleção ordenada por `position`.
  - `GET /ideas` continua sem `resources` no payload.
  - `DELETE /ideas/:id` em Ideia com recursos remove tudo junto (verificar com `GET /:id` em seguida → 404).
    Validar manualmente com o backend rodando.
    > ✅ 2026-05-18 14:15 — Adicionada a seção "Recursos da Ideia (spec 009)" no `idea.integration.http` com todos os cenários (0/1/3 recursos, replace-all, type não suportado, content vazio, 21 recursos, GET ordenado, GET listagem sem recursos, cascata DELETE→GET 404). Validação manual executada via curl contra um build fresco em `PORT=4100` (a porta 4000 já tinha um processo antigo do projeto rodando — não interferi nele): create 3 recursos → 201; listagem sem `resources`; `GET /:id` ordenado `[0,1,2]`; replace-all (mantém id+modifica, adiciona, remove) → 204 e estado final correto; type `image` → 422 `idea.resource.type.unsupported`; content vazio → 422 `idea.resource.content.required`; 21 recursos → 422 `idea.resources.too_many`; DELETE → 204 e `GET /:id` → 404, com `SELECT count(*) FROM resources` confirmando a cascata. Backend de teste encerrado ao final.

- [x] Adicionar no i18n do front-end (`apps/frontend/src/shared/i18n/messages.pt.ts` e `messages.en.ts`) as novas chaves de erro:
  - `idea.resource.type.required`
  - `idea.resource.type.unsupported`
  - `idea.resource.content.required`
  - `idea.resource.content.min.length`
  - `idea.resource.content.max.length`
  - `idea.resource.position.required`
  - `idea.resource.position.integer.min` (ou equivalente, conforme a regra criada)
  - `idea.resources.too_many`
  - `idea.resources.duplicate_id`
    Reaproveitar chaves genéricas já existentes quando houver equivalência exata.
    > ✅ 2026-05-18 14:15 — Adicionadas em `messages.pt.ts` e `messages.en.ts` (mesma ordem/tipo): `idea.resource.type.required`, `idea.resource.type.unsupported`, `idea.resource.content.required`, `idea.resource.content.min.length`, `idea.resource.content.max.length`, `idea.resource.position.required`, `idea.resources.too_many`, `idea.resources.duplicate_id`. Desvio sobre a chave de posição: como foram reaproveitadas `IntegerRule` + `MinValueRule`, em vez de `idea.resource.position.integer.min` foram mapeadas as chaves reais produzidas — `idea.resource.position.integer` e `idea.resource.position.min.value`. Acrescentada também `idea.resource.type.in` (código do `InRule`, caso o tipo inválido escape do `unsupported`).

### Tasks - Front-end

> ⚠️ Sem validação automatizada de UI. O agente entrega o código + `npx tsc --noEmit` limpo; a verificação visual é manual.

- [x] Estender o tipo `SaveIdeaInput` (`apps/frontend/src/modules/ideas/types/idea.type.ts`) com `resources: SaveResourceInput[]` e definir `SaveResourceInput = { id?: string; type: 'text'; content: string; position: number }`. Adicionar também o tipo de leitura `ResourceView = { id: string; type: 'text'; content: string; position: number }` e estender o tipo de detalhe da Ideia com `resources: ResourceView[]` (apenas no payload de detalhe; o tipo da listagem permanece sem recursos).

  > ✅ 2026-05-18 14:15 — Desvio de caminho: o frontend do projeto não usa `types/idea.type.ts` nem `api/idea.api.ts`; os tipos e o wrapper de API da Ideia vivem em `apps/frontend/src/modules/ideas/util/idea-api.util.ts`. Nele foram definidos `SaveResourceInput = { id?; type: 'text'; content; position }`, `ResourceView = { id; type: 'text'; content; position }` e `IdeaDetailView extends IdeaView { resources: ResourceView[] }`; `SaveIdeaPayload` ganhou `resources: SaveResourceInput[]`. O tipo da listagem (`IdeaView`/`IdeaPage`) permanece sem recursos.

- [x] Atualizar o wrapper de API `apps/frontend/src/modules/ideas/api/idea.api.ts`:
  - `createIdea(token, input)` e `updateIdea(token, id, input)` enviam `resources` no body (default `[]`).
  - `getIdea(token, id)` passa a deserializar `resources` no retorno.
  - `listIdeas(token, query)` mantém o formato atual (sem recursos).
    > ✅ 2026-05-18 14:15 — Aplicado no wrapper real `util/idea-api.util.ts` (o projeto autentica via cookie, não por token passado por parâmetro): `createIdea`/`updateIdea` enviam `{ ...payload, resources: payload.resources ?? [] }`; `getIdea` retorna `IdeaDetailView` com `resources` normalizado para `[]` quando ausente; `listIdeas` mantém o formato atual sem recursos.

- [x] Criar o componente `apps/frontend/src/modules/ideas/components/idea-resources-input.component.tsx`. Responsabilidades:
  - Receber `value: SaveResourceInput[]` e `onChange(next: SaveResourceInput[])`.
  - Renderizar cada item como linha com: badge de tipo ("Texto"), `Textarea` (rows=4) para `content` (autoresizable opcional), botão lixeira (remover), botões ↑/↓ (reordenar — recalcular `position` sequencial 0..n-1 a cada mudança).
  - Botão "Adicionar recurso" no final da seção. Ao clicar, gera um item novo com `id` ausente, `type: 'text'`, `content: ''` e `position` igual ao tamanho atual.
  - Quando `value.length === 0`, exibir um estado vazio discreto ("Nenhum recurso adicionado.") com o mesmo botão de "Adicionar recurso".
  - Sem chamadas de API: o componente é puramente controlado.
  - Acessibilidade: cada `Textarea` recebe `aria-label="Conteúdo do recurso N"` (N = posição 1-based). Botões com `aria-label` descritivo ("Mover para cima", "Mover para baixo", "Remover recurso").
    > ✅ 2026-05-18 14:15 — Componente controlado criado: `value: SaveResourceInput[]` + `onChange`. Cada linha tem `Badge` "Texto", `Textarea` rows=4 com `aria-label="Conteúdo do recurso N"` (1-based), botões ↑/↓ (`aria-label` "Mover para cima/baixo", desabilitados nas extremidades) e lixeira ("Remover recurso"); reordenar/remover recalcula `position` sequencial 0..n-1. Botão "Adicionar recurso" (cria item `{ type:'text', content:'', position:length }`, sem `id`). Estado vazio discreto "Nenhum recurso adicionado." com o mesmo botão. Sem chamadas de API.

- [x] Atualizar `apps/frontend/src/modules/ideas/components/idea-form.component.tsx`:
  - Acrescentar `resources: SaveResourceInput[]` no estado `values` e em `EMPTY_INPUT` (default `[]`).
  - No modo `edit`, hidratar `resources` a partir de `getIdea(...)`.
  - Adicionar a seção `FormSectionLayout` "Recursos" abaixo de "Classificação", com título "Recursos" e descrição curta ("Acrescente fontes de contexto que serão consideradas no processamento por IA. No momento apenas conteúdo de texto é suportado."). Renderizar `IdeaResourcesInput` controlado pelo estado.
  - Submeter `values` (já contendo `resources`) para `createIdea`/`updateIdea`. Erros do backend continuam tratados via `showApiErrorToasts` (i18n).
    > ✅ 2026-05-18 14:15 — O formulário usa estados separados (não um objeto `values`/`EMPTY_INPUT`): adicionado `const [resources, setResources] = useState<SaveResourceInput[]>([])` (default `[]`). No modo edição, `setResources(idea.resources ?? [])` hidrata a partir do `getIdea`. Nova `FormSectionLayout` "Recursos" abaixo de "Classificação" (descrição conforme a spec, `showDivider={false}`; "Classificação" voltou a exibir o divisor) renderizando `IdeaResourcesInput` controlado. O `payload` de submit passou a incluir `resources`; o tratamento de erros via `IdeaApiError` + `getMessage` (i18n) foi mantido.

- [x] Rodar `npx tsc --noEmit` em `apps/frontend` e sinalizar ao usuário que a UI está pronta para conferência manual.
  > ✅ 2026-05-18 14:15 — `npx tsc --noEmit` em `apps/frontend` executado sem erros (saída vazia, exit 0). A UI (seção "Recursos" no formulário de Ideia + componente `IdeaResourcesInput`) está pronta para conferência visual manual — não há verificação automatizada de UI nesta spec.

### Tasks - Documentação de domínio

- [x] Atualizar `.spec/memory/dominio.md` registrando que o conceito Recurso, no modelo, é uma entidade interna do agregado `idea` com campos `type` (union, MVP `'text'`), `content` e `position`, e que tipos adicionais entram em specs futuras estendendo o union sem mudar a estrutura plana.
  > ✅ 2026-05-18 14:15 — Desvio: o arquivo não existia (a pasta `.specs/memory/` só tinha `contexto-tecnico.md` e `processamento-ia.md`; o caminho citado `.spec/memory` também não existe). Criado `.specs/memory/dominio.md` (caminho real referenciado pela própria spec) seguindo o estilo dos memos das specs 008, registrando: `Resource` como entidade interna do agregado `idea`; estrutura plana `type` (union, MVP `'text'`, lista `RESOURCE_TYPES`) + `content` + `position`; tipos adicionais entram em specs futuras só estendendo o union; limite de 20, ids únicos, sem `userId` próprio e reconciliação replace-all.

## Resultado Esperado

- Entidade `Resource` adicionada ao agregado `idea` com validação própria, e `Idea` validando coleção (limite, ids únicos, delegação por item).
- `IdeaRepository` (interface, fake e implementação Prisma) persistindo a Ideia e seus recursos atomicamente, com reconciliação replace-all em `update` e include/orderBy em `findById`.
- Casos de uso `save-idea` (atualizado) e `delete-idea` (regressão) cobertos por testes unitários, com 100% de cobertura nos arquivos alterados.
- Migration `resources` aplicada, com FK em cascata para `ideas` e índice por `(ideaId, position)`.
- `IdeaController` aceitando `resources` em `POST`/`PUT`, retornando `resources` ordenados em `GET /:id` e mantendo `GET /ideas` enxuto.
- Cenários do `idea.integration.http` cobrindo criação, atualização (replace-all), erros (`type` não suportado, `too_many`, `content` vazio) e cascata na exclusão, validados manualmente.
- Formulário de Ideia no frontend com a nova seção **Recursos**, alimentando `createIdea`/`updateIdea` com a coleção atualizada; componente `IdeaResourcesInput` reutilizável.
- Novas chaves de erro do agregado mapeadas em `messages.pt.ts` e `messages.en.ts`.
- Sem erros de TypeScript ou de build após as alterações.

## Encerramento

Esta spec termina apenas quando todos os itens estiverem marcados e com evidência registrada, no formato definido em [Como executar](../../shared/como-executar.md).

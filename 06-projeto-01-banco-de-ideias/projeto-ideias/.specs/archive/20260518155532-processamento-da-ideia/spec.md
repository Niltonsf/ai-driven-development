# 011-processamento-da-ideia

## Objetivo

Entregar o **Processamento da Ideia** como agregado próprio dentro do módulo `ideas`, separado da entidade `Idea`. O usuário acessa um menu **"Processamentos"**, cria um novo Processamento selecionando uma Ideia via busca (combobox com pesquisa por nome da Ideia e do Tipo), o backend gera o primeiro Resultado a partir do snapshot da Ideia + Recursos + Prompt do Tipo, e o usuário entra na tela do Processamento onde pode **reprocessar com refinamentos sucessivos**, gerando novas iterações que somam ao histórico. A mesma Ideia pode dar origem a vários Processamentos, cada um com sua própria trilha de iterações. Esta spec cobre o caso de uso `process-idea` previsto em [Processamento com IA](../../memory/processamento-ia.md), reusando o `AiProvider` entregue pela spec 008.

## Contexto Técnico

- Módulo de negócio: `ideas` (já existe). Agregado novo: `processing` — terceiro agregado do módulo, ao lado de `idea-type` (spec 005) e `idea` (spec 007). Não criar módulo novo.
- A Ideia **não** ganha campo de resultado. O Processamento vive fora da Ideia e referencia o `ideaId`, mas guarda **snapshot** dos dados que importam para a geração (`name`, `description`, `objective`, `ideaTypeId`, `ideaTypeName`, `prompt`, `resources`). Ideias podem ser editadas depois sem afetar Processamentos antigos.
- **Iteração de Processamento** é entidade interna do agregado `processing` — mesmo padrão de `Resource` na spec 009 (sem repositório, controller ou caso de uso próprios). Cada Iteração guarda `refinement` (vazio na primeira, texto curto nas subsequentes) e `result` (texto gerado pela IA), com `position` para ordenação.
- A primeira Iteração é criada automaticamente quando o Processamento é criado (ou seja, criar Processamento já dispara a primeira chamada à IA). Iterações subsequentes são criadas pelo endpoint dedicado de "refinar".
- O **prompt do refinamento** inclui todas as iterações anteriores como histórico, para que o modelo entenda a evolução. Limite hard de **50 iterações por Processamento** (estouro retorna 422).
- Falhas do `AiProvider` não derrubam o agregado: na criação, o Processamento simplesmente não é persistido (transação reverte); no refinamento, as iterações anteriores são preservadas e a nova não é criada.
- Reuso direto do `AiProvider` da spec 008 (sem passar por `/ai/generate`). A composição do prompt acontece dentro do caso de uso, no backend.
- Busca de Ideia (combobox): endpoint dedicado com `ILIKE` simples sobre `idea.name` e `idea_type.name`, filtrado por `userId`. Full-text search com `tsvector` fica para evolução futura (registrar em [Roadmap](../../memory/roadmap.md)).
- Sem streaming da resposta — geração síncrona, igual ao `/ai/generate`. Streaming continua como evolução futura.
- A linguagem do código segue [Contexto Técnico Global](../../memory/contexto-tecnico.md): identificadores em inglês (`Processing`, `ProcessingIteration`, `StartProcessing`, `RefineProcessing`, `IdeaSearchCombobox`); rótulos em português ("Processamentos", "Reprocessar", "Refinamento").
- Sem verificação automatizada de UI nesta spec. Validação automatizada vai até o backend (testes unitários + Rest Client com a chave real da OpenAI). A interface é validada manualmente.

## Referências Compartilhadas

- [Como executar](../../shared/como-executar.md)
- [Regras de nomenclatura](../../shared/regras-de-nomenclatura.md)

## Observações Locais

- **Snapshot da Ideia, não referência viva.** Ao criar um Processamento, copiar para o próprio agregado: `ideaName`, `ideaDescription`, `ideaObjective`, `ideaTypeId`, `ideaTypeName`, `promptTemplate` (o `prompt` do Tipo no momento da criação) e `resources` (array de `{ type, content, position }` — sem `id` próprio do `Resource`, já que aqui é cópia). Edições posteriores na Ideia ou no Tipo **não** alteram Processamentos existentes. O `ideaId` é mantido como referência fraca (FK `onDelete: Restrict` — não dá para apagar Ideia com Processamentos; usuário precisa apagar Processamentos primeiro).
- **Composição do prompt na primeira iteração:**
  - `system`: `promptTemplate` do snapshot, com substituição literal dos marcadores `{{name}}`, `{{description}}`, `{{objective}}` e `{{resources}}` pelos valores correspondentes. `{{resources}}` é renderizado como lista numerada com o `content` de cada recurso (apenas `type === 'text'` no MVP — a spec 009 garante que essa é a única opção). Marcadores não usados ficam vazios. Marcadores desconhecidos ficam literais.
  - `user`: `"Gere o primeiro resultado para esta Ideia."`
- **Composição do prompt nas iterações de refinamento (a partir da 2ª):**
  - `system`: o mesmo `promptTemplate` resolvido (com os marcadores substituídos pelo snapshot). Não muda entre iterações.
  - `user`: histórico das iterações anteriores no formato:

    ```
    Histórico de iterações anteriores:
    [Iteração 1] (primeira geração)
    Resultado:
    """
    <result>
    """

    [Iteração 2] Refinamento aplicado: <refinement>
    Resultado:
    """
    <result>
    """
    ...
    Refinamento solicitado agora: <refinement_atual>
    Gere um novo resultado aplicando esse refinamento sobre a versão mais recente, preservando o que já estava bom.
    ```

- **Limite de iterações por Processamento**: 50 no MVP. Tentar refinar além disso retorna `DomainError("processing.iterations.too_many", 422)`.
- **Validação de entrada do refinamento**: `refinement` obrigatório, `min length 3`, `max length 2000`. Códigos: `processing.refinement.required`, `processing.refinement.min.length`, `processing.refinement.max.length`.
- **Propriedade**: `Processing.userId` registrado a partir do JWT. Toda consulta filtra por `userId`. Tentativa de acessar Processamento de outro usuário retorna `processing.not_found` (404) — não vazar existência cross-user via 403.
- **Reuso do `IdeaRepository` e `IdeaTypeRepository`** no caso de uso `start-processing` para validar que a Ideia existe e pertence ao usuário, e para carregar o Tipo (com `prompt`) na hora de montar o snapshot. Cross-aggregate cleanup: se a Ideia não existir ou pertencer a outro usuário, lançar `DomainError("processing.idea.invalid", 422)`.
- **Sem caso de uso `update-processing`**: o Processamento, depois de criado, só evolui por refinamento (append de iteração) ou exclusão. Snapshot e ideiaId não são editáveis.
- **Exclusão**: `delete-processing` entregue no MVP. Apaga o Processamento e suas Iterações (FK em cascata no banco). Endpoint `DELETE /processings/:id`. Sem confirmação especial além do `delete-confirmation-dialog` já compartilhado.
- **Sem exclusão de iteração isolada**: a unidade de manipulação é o Processamento inteiro. Apagar iterações isoladas fica como evolução futura (registrar em [Roadmap](../../memory/roadmap.md)).
- **Busca de Ideia (combobox)**: endpoint `GET /processings/idea-search?term=...` autenticado. Recebe `term` (string, mín. 1, máx. 100 caracteres). Aplica `ILIKE '%term%'` em `idea.name` **e** em `idea_type.name`, juntando com `OR`, filtrando sempre por `idea.userId = currentUser.id`. Retorna até **20** itens ordenados por `idea.updatedAt DESC`, com payload `[{ id, name, ideaTypeId, ideaTypeName }]`. Se `term` vier vazio, devolve as 20 Ideias mais recentes do usuário (suporte ao caso de "abriu o combobox sem digitar nada").
- **Sem cache de gerações**: cada chamada faz uma nova chamada ao `AiProvider`. Continua valendo o tratamento de erro padronizado da spec 008 (`ai.generate.failed` 502, `ai.generate.empty` 502) — front mostra `toast.error(getMessage(code))`.
- **Snapshot dos recursos**: copiar `{ type, content, position }` ordenado por `position`. Não copiar `id`s nem datas — são dados de leitura do Processamento. No payload do detalhe (`GET /processings/:id`), expor `resources` no mesmo formato.
- **Frontend — listagem de Processamentos**: nova rota privada `/processings` com tabela: **Ideia** (`ideaName` do snapshot), **Tipo** (`ideaTypeName` do snapshot), **Iterações** (contagem), **Criado em**, ações (ver, excluir). Sem botão "Cadastrar Processamento" no header — usar botão "Novo Processamento" que abre a tela `/processings/new`.
- **Frontend — `/processings/new`**: tela enxuta com um único componente `IdeaSearchCombobox` (campo de busca com debounce de 300ms consumindo `GET /processings/idea-search?term=`), mostrando os resultados como lista clicável. Ao selecionar a Ideia e clicar "Processar", chama `POST /processings` (passando `ideaId`), mostra `Loader2` durante a chamada (pode demorar — é uma chamada à OpenAI) e em sucesso redireciona para `/processings/[id]`. Em erro, dispara `toast.error(getMessage(code))` e fica na própria tela.
- **Frontend — `/processings/[id]`**: tela com três regiões:
  1. **Cabeçalho fixo** com `ideaName`, `ideaTypeName` (badge), `objective` curto e link "Ver Ideia original" (`/ideas/[ideaId]/edit`).
  2. **Timeline de iterações** (lista vertical, mais recente embaixo). Cada bloco mostra: badge "Iteração N", `refinement` (apenas a partir da 2ª, em itálico discreto), `result` **renderizado como Markdown** (via `react-markdown` + `remark-gfm`) dentro de um container com as classes `prose` do plugin **Tailwind Typography** (tema escuro `prose-invert`), e timestamp. A renderização Markdown deve cobrir títulos, listas, negrito/itálico, blocos de código, tabelas e strikethrough, dando ao resultado da IA a aparência tipográfica padrão de leitura.
  3. **Rodapé fixo** com um `Textarea` para o refinamento (label "Refinamento adicional") e botão "Reprocessar". Submit chama `POST /processings/:id/iterations` e em sucesso adiciona o novo bloco no fim da timeline (faz scroll até o novo bloco). Botão mostra `Loader2` e fica desabilitado durante a chamada.
- **Menu lateral**: adicionar item **"Processamentos"** na seção "Cadastros" do módulo "Banco de Ideias", logo abaixo de **"Ideias"**. Ícone sugerido: `Workflow` ou `Sparkles` do lucide-react (decisão final no momento da implementação).
- **Sem `AiTextField` no campo de refinamento**: por enquanto o refinamento é um `Textarea` puro. A IA já está sendo invocada no submit; injetar IA dentro do próprio campo seria recursão desnecessária no MVP.

## Tasks

### Tasks - Negócio (módulo `ideas`)

- [x] Criar o agregado `processing` dentro do módulo `ideas` com a skill [module-aggregate](../../../.claude/skills/module-aggregate). Estrutura padrão `model`/`provider`/`usecase` + `index.ts` re-exportando o agregado em `modules/ideas/src/index.ts`.
  > ✅ 2026-05-18 15:35 — Executado o script `create-aggregate.js` da skill module-aggregate (`--module ideas --aggregate processing --mode crud`). Estrutura `model/provider/usecase` + `index.ts` criada; `modules/ideas/src/index.ts` re-exporta `./processing` preservando os exports de `idea-type` e `idea`. Os usecases CRUD do scaffold foram substituídos pelos casos de uso específicos da spec (start/refine/delete).

- [x] Criar a entidade `Processing` em `modules/ideas/src/processing/model/processing.entity.ts` com a skill [module-entity](../../../.claude/skills/module-entity). Estado:
  > ✅ 2026-05-18 15:35 — Entidade `Processing` criada com todos os campos do snapshot e validações exatas (uuid/min/max). `resources`/`iterations` default `[]`. `validate()`: `processing.iterations.too_many` (>50, 422), validação dos campos, `validateProcessingResource` por recurso, delega `iteration.validate()`, e `processing.iterations.required` (422) quando 0 iterações. `ProcessingResource` modelado como estrutura plana (não-entidade) reaproveitando as regras do `Resource` (`RESOURCE_TYPES`, content 1..20000, position int ≥0). Padrão de `Validator` do projeto seguido (skill module-entity é guia de padrão; script não aplicável a entidade com regras compostas — desvio registrado).
  - `id` (uuid, herdado de `Entity`)
  - `userId` (required + uuid)
  - `ideaId` (required + uuid)
  - `ideaName` (required + min length 3 + max length 120) — snapshot
  - `ideaDescription` (required + min length 10 + max length 2000) — snapshot
  - `ideaObjective` (required + min length 10 + max length 1000) — snapshot
  - `ideaTypeId` (required + uuid) — snapshot
  - `ideaTypeName` (required + min length 3 + max length 120) — snapshot
  - `promptTemplate` (required + min length 10 + max length 8000) — snapshot
  - `resources: ProcessingResource[]` (default `[]`) — snapshot da coleção. Não é entidade — apenas uma estrutura `{ type: 'text'; content: string; position: number }` validada no `validate()` da `Processing`.
  - `iterations: ProcessingIteration[]` (default `[]`) — coleção de iterações.
    Validação adicional no `Processing.validate()`:
  - máximo de 50 iterações → `DomainError("processing.iterations.too_many", 422)`.
  - pelo menos 1 iteração ao final do `validate()` (uma instância sem iteração é inválida — a primeira é criada junto). Código: `processing.iterations.required`.
  - delegar `iteration.validate()` para cada item.
  - validar cada `ProcessingResource` (type ∈ `RESOURCE_TYPES`, content 1..20000, position inteiro `>= 0`). Reaproveitar regras do `Resource` se possível.

- [x] Criar a entidade interna `ProcessingIteration` em `modules/ideas/src/processing/model/processing-iteration.entity.ts`. Estado:
  > ✅ 2026-05-18 15:35 — `ProcessingIteration` criada: `refinement: string | null` (regra min 3/max 2000 só quando `!== null`, deixando o "obrigatório a partir da 2ª" para o caso de uso), `result` (required, 1..50000), `position` (required, inteiro ≥0). Códigos `processing.refinement.*` e `processing.iteration.*`.
  - `id` (uuid)
  - `refinement: string | null` — `null` na primeira iteração, obrigatório (min 3, max 2000) nas subsequentes. Como a entidade não sabe se é a primeira, o caso de uso valida; aqui a regra é: se `refinement !== null`, aplicar min 3 / max 2000.
  - `result` (required + min length 1 + max length 50000)
  - `position` (required + inteiro `>= 0`)

- [x] Definir o contrato `ProcessingRepository` em `modules/ideas/src/processing/provider/processing.repository.ts` com a skill [module-repository](../../../.claude/skills/module-repository). Métodos:
  > ✅ 2026-05-18 15:35 — Contrato `ProcessingRepository` definido (não estende `CrudRepository` — ciclo de vida só append/delete): `create`, `appendIteration`, `delete`, `findById`, `findPage` (retorna `PageResult<ProcessingSummary>` — tipo de leitura dedicado com `iterationsCount`, decisão documentada no comentário), `searchIdeas` (`IdeaSearchResult[]`, limite 20). `FakeProcessingRepository` em memória gerado com `ideaSearchSeed` para testar a busca. Skill module-repository usada como padrão; desvio do template CRUD registrado.
  - `create(entity: Processing): Promise<Processing>` — persiste agregado completo (incluindo iterações e snapshot de recursos) atomicamente.
  - `appendIteration(processingId: string, iteration: ProcessingIteration): Promise<void>` — anexa uma nova iteração ao Processamento existente (não substitui as anteriores).
  - `delete(id: string): Promise<void>` — apaga Processamento e suas iterações (cascata no banco).
  - `findById(id: string): Promise<Processing | null>` — carrega Processamento com todas as iterações ordenadas por `position ASC` e o snapshot de recursos. Sem filtro por `userId` (filtro no caso de uso/controller, mesmo padrão da spec 007).
  - `findPage({ userId, page, perPage }): Promise<Page<Processing>>` — listagem paginada. Iterações **não** vêm completas: incluir apenas a contagem (`iterationsCount`) e o snapshot básico necessário para a tabela. Decidir na implementação se o repositório retorna `Processing` com `iterations: []` + um campo derivado `iterationsCount`, ou um tipo de leitura separado `ProcessingSummary`. Documentar no comentário.
  - `searchIdeas({ userId, term }): Promise<IdeaSearchResult[]>` — busca para o combobox, retornando `[{ id, name, ideaTypeId, ideaTypeName }]`. Sem paginação (limite fixo 20).
    Gerar também o `FakeProcessingRepository` em memória para testes.

- [x] Implementar o caso de uso `start-processing` em `modules/ideas/src/processing/usecase/start-processing.usecase.ts` com a skill [module-use-case](../../../.claude/skills/module-use-case). Construtor recebe `ProcessingRepository`, `IdeaRepository`, `IdeaTypeRepository` e `AiProvider` (interface a ser exposta pelo módulo — ver task de contrato a seguir). Fluxo:
  > ✅ 2026-05-18 15:35 — `StartProcessing` implementado seguindo o fluxo: valida Ideia (null/cross-user → 422 `processing.idea.invalid`), valida Tipo (null → 422), monta snapshot (recursos copiados como objetos planos `{type,content,position}` ordenados por position), resolve `systemPrompt` via `prompt-composer`, chama `aiProvider.generate` com a user message fixa, monta 1ª `ProcessingIteration` (refinement null, position 0), valida e persiste. Falha do provider propaga (502). Validado ao vivo: criação retornou 201 em ~13s com result em Markdown.
  1. `ideaRepository.findById(input.ideaId)` → se `null` ou `entity.userId !== input.userId`, lançar `DomainError("processing.idea.invalid", 422)`.
  2. `ideaTypeRepository.findById(idea.ideaTypeId)` → se `null` (defesa em profundidade), `DomainError("processing.idea.invalid", 422)`.
  3. Construir o snapshot: `ideaName`, `ideaDescription`, `ideaObjective`, `ideaTypeId`, `ideaTypeName`, `promptTemplate` (o `prompt` do `IdeaType`), `resources` (cópia dos recursos da Ideia, mapeados para `{ type, content, position }`).
  4. Resolver o `systemPrompt`: substituir `{{name}}`, `{{description}}`, `{{objective}}` e `{{resources}}` no `promptTemplate`. `{{resources}}` vira lista numerada `1. <content>\n2. <content>\n...` (string vazia se não houver recursos).
  5. Chamar `aiProvider.generate({ systemPrompt, userMessage: "Gere o primeiro resultado para esta Ideia." })`.
  6. Montar `ProcessingIteration` (`refinement: null`, `result`, `position: 0`) e `Processing` com a iteração já dentro.
  7. `processing.validate()`.
  8. `processingRepository.create(processing)` → retorna o agregado.
     Falha do `AiProvider` propaga `DomainError("ai.generate.failed", 502)` (já tratada pelo provider).

- [x] Implementar o caso de uso `refine-processing` em `modules/ideas/src/processing/usecase/refine-processing.usecase.ts` com a skill [module-use-case](../../../.claude/skills/module-use-case). Construtor recebe `ProcessingRepository` e `AiProvider`. Fluxo:
  > ✅ 2026-05-18 15:35 — `RefineProcessing` implementado: `findById` (null/cross-user → 404 `processing.not_found`), valida `refinement` (required/min3/max2000 via `Validator`), `>= 50` → 422 `processing.iterations.too_many`, reconstrói `systemPrompt` e monta `userMessage` com histórico via `composeRefinementUserMessage` (helper compartilhado em `model/prompt-composer.ts`, coberto por teste isolado), gera, monta iteração com `position = iterations.length` e faz `appendIteration`. Validado ao vivo: 2ª iteração 201 em ~8,7s.
  1. `processingRepository.findById(input.processingId)` → `null` ⇒ `DomainError("processing.not_found", 404)`; `userId` diferente ⇒ **também** `processing.not_found` (não vazar existência).
  2. Validar `refinement` (required, min 3, max 2000) → códigos `processing.refinement.required`, `processing.refinement.min.length`, `processing.refinement.max.length`.
  3. Se `iterations.length >= 50`, lançar `DomainError("processing.iterations.too_many", 422)`.
  4. Reconstruir `systemPrompt` a partir do snapshot (mesma lógica do `start-processing` — extrair helper privado/compartilhado `resolveSystemPrompt(snapshot)` em `processing/model/prompt-composer.ts` para reaproveitar entre os dois casos de uso e cobrir com teste isolado).
  5. Montar `userMessage` com histórico das iterações anteriores no formato descrito em **Observações Locais**, terminando com o refinamento atual.
  6. Chamar `aiProvider.generate({ systemPrompt, userMessage })`.
  7. Montar nova `ProcessingIteration` (`refinement`, `result`, `position: iterations.length`).
  8. `processingRepository.appendIteration(processingId, iteration)`.
  9. Retornar a iteração criada.

- [x] Implementar o caso de uso `delete-processing` em `modules/ideas/src/processing/usecase/delete-processing.usecase.ts`. Fluxo: `findById` → `null` ⇒ `processing.not_found` (404); `userId` diferente ⇒ **também** `processing.not_found`; senão `delete(id)`.
  > ✅ 2026-05-18 15:35 — `DeleteProcessing` implementado exatamente como descrito. Validado ao vivo: cross-user → 404, owner → 204, GET seguinte → 404.

- [x] Definir o contrato `AiProvider` (token + interface) no módulo `ideas` em `modules/ideas/src/processing/provider/ai-provider.ts`. Razão: o módulo de negócio precisa depender de uma abstração, não da implementação concreta do backend. Interface mínima: `generate(input: { systemPrompt: string; userMessage: string }): Promise<string>`. Exportar do `index.ts` do módulo. A implementação concreta no backend (`OpenAiProvider` da spec 008) será adaptada na task de back-end para satisfazer esse contrato.
  > ✅ 2026-05-18 15:35 — `AiProvider` definido como classe abstrata (dupla função de contrato + token de DI no Nest) com `generate(input)`. Exportado via `processing/provider/index.ts` → `processing/index.ts` → `@ideias/ideas`.

- [x] Cobrir os casos de uso com testes unitários usando os fakes do módulo (`FakeProcessingRepository`, `FakeIdeaRepository`, `FakeIdeaTypeRepository`) e um fake de `AiProvider` que devolve string fixa. Cenários mínimos:
  > ✅ 2026-05-18 15:35 — 13 suites novas em `modules/ideas/test/processing/` cobrindo todos os cenários listados (start/refine/delete, prompt-composer, entidades, fake repo). `jest --coverage --collectCoverageFrom='src/processing/**/*.ts'`: **100% stmts/branch/funcs/lines** nos arquivos novos. Total do módulo: 16 suites, 129 testes, todos verdes. Fake de `AiProvider` com variante de sucesso e variante que propaga `ai.generate.failed` 502.
  - `start-processing`: caminho feliz com Ideia sem recursos / com 3 recursos; Ideia inexistente → 422 `processing.idea.invalid`; Ideia de outro usuário → 422 `processing.idea.invalid`; falha do `AiProvider` propaga 502; verificação de que o snapshot é cópia (modificar `Idea` original depois não afeta o `Processing` criado); verificação de que `{{name}}`, `{{description}}`, `{{objective}}`, `{{resources}}` são substituídos corretamente; marcador desconhecido permanece literal.
  - `refine-processing`: caminho feliz adicionando 2ª e 3ª iterações; `refinement` vazio → 422; `refinement` com 1 caractere → 422 (min); `refinement` com 2001 caracteres → 422 (max); Processamento inexistente → 404 `processing.not_found`; Processamento de outro usuário → 404 `processing.not_found`; estouro de 50 iterações → 422 `processing.iterations.too_many`; falha do `AiProvider` propaga 502.
  - `delete-processing`: caminho feliz; inexistente → 404; cross-user → 404.
  - `prompt-composer.test.ts` (helper extraído): substituição correta dos 4 marcadores; `{{resources}}` vazio quando lista vazia; marcador desconhecido literal; lista de recursos numerada e separada por newlines.
    Coverage 100% nos arquivos novos.

### Tasks - Back-end

- [x] Sincronizar o agregado `processing` com o Prisma adicionando dois novos models ao arquivo `apps/backend/prisma/models/ideas.model.prisma` com a skill [backend-prisma-sync-module](../../../.claude/skills/backend-prisma-sync-module):
  > ✅ 2026-05-18 15:35 — Três models adicionados a `ideas.model.prisma` (`Processing` com FK `idea` Restrict + `user` Cascade e índices `@@index([userId])`/`@@index([ideaId])`; `ProcessingIteration` Cascade + `@@index([processingId, position])`; `ProcessingResource` Cascade — tabela do snapshot). Relações inversas `processings Processing[]` adicionadas em `Idea` e `User`. Migration `20260518181747_processings` criada e aplicada via `prisma migrate dev --name processings`; `prisma generate` regenerou o client.
  - `Processing` (`id`, `userId`, `ideaId`, `ideaName`, `ideaDescription @db.Text`, `ideaObjective @db.Text`, `ideaTypeId`, `ideaTypeName`, `promptTemplate @db.Text`, `createdAt`, `updatedAt`, FK `idea Idea @relation(...) onDelete: Restrict`, FK `user User @relation(...) onDelete: Cascade`, índices `@@index([userId])` e `@@index([ideaId])`, `@@map("processings")`).
  - `ProcessingIteration` (`id`, `processingId`, `refinement String? @db.Text`, `result @db.Text`, `position Int`, `createdAt`, FK `processing Processing @relation(...) onDelete: Cascade`, índice `@@index([processingId, position])`, `@@map("processing_iterations")`).
  - `ProcessingResource` (`id`, `processingId`, `type`, `content @db.Text`, `position Int`, FK `processing Processing @relation(...) onDelete: Cascade`, índice `@@index([processingId, position])`, `@@map("processing_resources")`). Esta é a tabela do snapshot dos recursos.
    Adicionar relações inversas: `processings Processing[]` em `Idea`, em `User`. Aplicar migration nomeada `processings`.

- [x] Implementar o repositório Prisma `PrismaProcessingRepository` em `apps/backend/src/modules/ideas/processing.prisma.ts` com a skill [backend-prisma-repository](../../../.claude/skills/backend-prisma-repository). Implementar:
  > ✅ 2026-05-18 15:35 — `ProcessingPrismaRepository` (classe `ProcessingPrismaRepository`) implementado: `create` em `$transaction([...])` (processing + iterations + resources), `appendIteration` (insert único), `delete` (cascata via FK), `findById` com `include` ordenado por position asc, `findPage` com `_count.iterations` → `ProcessingSummary` ordenado por `updatedAt desc`, `searchIdeas` com `OR` `contains insensitive` em `idea.name`/`ideaType.name` (omite `OR` quando termo vazio), `take: 20`, `orderBy updatedAt desc`. Métodos privados `toProcessingRow/toIterationRow/toResourceRow/toEntity/toIteration/toResource`.
  - `create(entity)`: dentro de `prisma.$transaction([...])`, cria o `Processing`, todas as `ProcessingIteration`s e todos os `ProcessingResource`s do snapshot.
  - `appendIteration(processingId, iteration)`: insere uma linha em `processing_iterations`. Sem transação (operação atômica única).
  - `delete(id)`: `prisma.processing.delete({ where: { id } })` — cascata cuida do resto.
  - `findById(id)`: `include: { iterations: { orderBy: { position: 'asc' } }, resources: { orderBy: { position: 'asc' } } }`. Materializar `Processing` com `toEntity`.
  - `findPage({ userId, page, perPage })`: `findMany` filtrando por `userId`, com `include: { _count: { select: { iterations: true } } }`, ordenando por `updatedAt desc`. Retornar `Processing` com `iterations: []` e expor `iterationsCount` separado (decidir formato com base no que o repositório do módulo aceita — pode ser via campo extra no `Page` ou via objeto de leitura dedicado).
  - `searchIdeas({ userId, term })`: query `prisma.idea.findMany({ where: { userId, OR: [{ name: { contains: term, mode: 'insensitive' } }, { ideaType: { is: { name: { contains: term, mode: 'insensitive' } } } }] }, include: { ideaType: true }, take: 20, orderBy: { updatedAt: 'desc' } })`. Se `term` vier vazio/null, omitir o `OR` (lista pelas 20 mais recentes). Retornar `[{ id, name, ideaTypeId, ideaTypeName }]`.
    Métodos privados `toProcessingRow`, `toIterationRow`, `toResourceRow`, `toEntity`, `toIteration`, `toResource`.

- [x] Garantir que o `OpenAiProvider` (spec 008) satisfaz a interface `AiProvider` exportada pelo módulo `ideas`. Como o backend tem seu próprio `AiProvider` (classe abstrata em `apps/backend/src/modules/ai/ai.provider.ts`), criar um **adapter** simples em `apps/backend/src/modules/ideas/ai-provider.adapter.ts` (`@Injectable`) que implementa o `AiProvider` do módulo e delega para o `AiProvider` do backend. Registrar esse adapter no `IdeasModule` sob o token do `AiProvider` do módulo `ideas`. Importar o `AiModule` no `IdeasModule` para resolver a dependência.
  > ✅ 2026-05-18 15:35 — `ModuleAiProviderAdapter` (`@Injectable`, `ai-provider.adapter.ts`) estende o `AiProvider` de `@ideias/ideas` e delega `generate` para o `AiProvider` do backend (importado com alias). `IdeasModule` agora importa `AiModule` e registra `{ provide: AiProvider, useClass: ModuleAiProviderAdapter }`. Validado ao vivo: chamadas reais à OpenAI via `OPENAI_API_KEY` funcionando.

- [x] Criar `apps/backend/src/modules/ideas/processing.controller.ts` com a skill [backend-nest-controller](../../../.claude/skills/backend-nest-controller). Endpoints autenticados (sem `@Public()`):
  > ✅ 2026-05-18 15:35 — `ProcessingController` criado com `POST /processings`, `POST /processings/:id/iterations`, `DELETE /processings/:id`, `GET /processings/idea-search` (declarado **antes** de `:id` para a rota estática não ser capturada pelo param), `GET /processings/:id` (404 `processing.not_found` se cross-user), `GET /processings` paginado. `toDetailResponse` **não** expõe `userId` nem `promptTemplate` (confirmado ao vivo: `hasUserId=false`, `hasPromptTemplate=false`). Casos de uso instanciados por requisição com `userId` do JWT. `term` da busca limitado defensivamente a 100 chars.
  - `POST /processings` (body `{ ideaId }`) → instancia `StartProcessing` no método, injeta `userId` do JWT. Retorna `toDetailResponse(processing)` (mesmo formato do `GET /:id`).
  - `POST /processings/:id/iterations` (body `{ refinement }`) → instancia `RefineProcessing`. Retorna a iteração criada `{ id, refinement, result, position, createdAt }`.
  - `DELETE /processings/:id` → instancia `DeleteProcessing`. Retorna 204.
  - `GET /processings/:id` → carrega via repositório, filtra por `userId === user.id` (senão lança `ProcessingNotFoundError`). Retorna `toDetailResponse`.
  - `GET /processings?page=&pageSize=` → `repository.findPage({ userId, page, perPage })`. Mapeia para `{ id, ideaId, ideaName, ideaTypeName, iterationsCount, createdAt, updatedAt }` (sem iterações nem recursos).
  - `GET /processings/idea-search?term=` → `repository.searchIdeas({ userId, term })`. Devolve `[{ id, name, ideaTypeId, ideaTypeName }]`.
    `toDetailResponse` inclui: `id`, `ideaId`, `ideaName`, `ideaDescription`, `ideaObjective`, `ideaTypeId`, `ideaTypeName`, `resources: [{ type, content, position }]`, `iterations: [{ id, refinement, result, position, createdAt }]`, `createdAt`, `updatedAt`. **Não** expõe `userId` nem `promptTemplate` (o prompt é detalhe interno).

- [x] Criar `apps/backend/src/modules/ideas/processing.integration.http` (Rest Client) com cenários:
  > ✅ 2026-05-18 15:35 — `processing.integration.http` criado com todos os cenários (owner + second user, pré-condição Tipo+Ideia com 2 recursos, criação, erros 422, refino, leitura, listagem, idea-search com/sem termo, exclusão, FK Restrict). **Validação automatizada ao vivo** com backend rodando e `OPENAI_API_KEY` real (chave NÃO incluída aqui):
  >   - `POST /processings` → **201 em ~13,0s**; 1 iteração; result em Markdown. Trecho: *"Avaliação da ideia do App de Receitas: ### 1. Oportunidade de Mercado - **Demanda**: Com 70% das pessoas cozinhando em casa quatro vezes por semana..."*
  >   - `POST /processings` ideaId inexistente → 422 `processing.idea.invalid`; ideia de outro usuário → 422 `processing.idea.invalid`.
  >   - `POST /processings/:id/iterations` válido → **201 em ~8,7s**, nova iteração `position=1`; refinement vazio → 422 `processing.refinement.required`; 2001 chars → 422 `processing.refinement.max.length`.
  >   - `GET /:id` owner → 200, iterações ordenadas `[0,1]`, sem `userId`/`promptTemplate`; outro usuário → 404 `processing.not_found`.
  >   - `GET /processings?page=1&pageSize=10` → 200, itens enxutos (`id,ideaId,ideaName,ideaTypeName,iterationsCount,createdAt,updatedAt`, sem iterations/resources).
  >   - `GET /idea-search?term=Receitas` → 200, 1 item filtrado com payload `{id,name,ideaTypeId,ideaTypeName}`; `term=` → 200, mais recentes.
  >   - `DELETE /:id` outro usuário → 404; owner → 204; `GET /:id` em seguida → 404 `processing.not_found`.
  >   - FK Restrict: recriado um Processamento, `DELETE /ideas/:id` → **422 `idea.has_processings`** (ver task extra abaixo).
  - Registro/login do owner e de um second user (mesmo padrão dos `*.integration.http` anteriores).
  - Pré-condição: criar `IdeaType` + `Idea` (com 2 recursos) para o owner.
  - `POST /processings` válido → 201, payload de detalhe com 1 iteração e `result` não vazio. **Anotar tempo médio da chamada e trecho do resultado** na evidência.
  - `POST /processings` com `ideaId` inexistente → 422 `processing.idea.invalid`.
  - `POST /processings` com `ideaId` de outro usuário → 422 `processing.idea.invalid`.
  - `POST /processings/:id/iterations` válido → 201, retorna nova iteração. Anotar tempo.
  - `POST /processings/:id/iterations` com `refinement` vazio → 422 `processing.refinement.required`.
  - `POST /processings/:id/iterations` com `refinement` de 2001 caracteres → 422 `processing.refinement.max.length`.
  - `GET /processings/:id` (owner) → 200 com iterações ordenadas por `position`.
  - `GET /processings/:id` (outro usuário) → 404 `processing.not_found`.
  - `GET /processings?page=1&pageSize=10` → 200 com `items` enxutos (sem iterações).
  - `GET /processings/idea-search?term=<parte-do-nome>` → 200, lista filtrada.
  - `GET /processings/idea-search?term=` → 200, lista das mais recentes.
  - `DELETE /processings/:id` (outro usuário) → 404.
  - `DELETE /processings/:id` (owner) → 204; `GET /:id` em seguida → 404.
    Validar manualmente com backend rodando e `OPENAI_API_KEY` real. **A chave não vai para a evidência.**

- [x] Adicionar no i18n do front-end (`apps/frontend/src/shared/i18n/messages.pt.ts` e `messages.en.ts`) as novas chaves de erro:
  > ✅ 2026-05-18 15:35 — Adicionadas em PT e EN: `processing.idea.invalid`, `processing.not_found`, `processing.iterations.required`, `processing.iterations.too_many`, `processing.refinement.{required,min.length,max.length}` + bloco defensivo dos campos de snapshot/iteração/recurso (`processing.ideaName.*`, `processing.ideaDescription.*`, `processing.promptTemplate.*`, `processing.resource.*`, `processing.iteration.*`, etc.). `ai.generate.failed`/`ai.generate.empty` reaproveitadas.
  > **TASK EXTRA (tratamento de erro de FK Restrict)** — A verificação do checklist revelou a necessidade prevista na spec: apagar uma Ideia com Processamentos viola a FK `processings.ideaId` (Prisma `P2003`), que sem tratamento viraria 500. Implementado em `apps/backend/src/modules/ideas/idea.prisma.ts`: `delete()` captura `Prisma.PrismaClientKnownRequestError` `P2003` e lança `DomainError('idea.has_processings', 422)`. Chave i18n `idea.has_processings` adicionada em PT e EN. Validado ao vivo: `DELETE /ideas/:id` com Processamento → 422 `idea.has_processings`.
  - `processing.idea.invalid`
  - `processing.not_found`
  - `processing.iterations.required`
  - `processing.iterations.too_many`
  - `processing.refinement.required`
  - `processing.refinement.min.length`
  - `processing.refinement.max.length`
  - Demais chaves de validação dos campos de snapshot que possam vazar (`processing.ideaName.required`, etc.) — incluir defensivamente.
    Reaproveitar `ai.generate.failed` e `ai.generate.empty` já existentes para falhas do provider.

### Tasks - Front-end

> ⚠️ Sem validação automatizada de UI. O agente entrega o código + `npx tsc --noEmit` limpo; a verificação visual é manual.

- [x] Criar tipos em `apps/frontend/src/modules/ideas/types/processing.type.ts`:
  > ✅ 2026-05-18 15:35 — Criado `types/processing.type.ts` com `Page<T>`, `ProcessingSummary`, `ProcessingIterationView`, `ProcessingResourceView`, `ProcessingDetail`, `IdeaSearchResult`, `StartProcessingInput`, `RefineProcessingInput`.
  - `ProcessingSummary = { id; ideaId; ideaName; ideaTypeName; iterationsCount; createdAt; updatedAt }`
  - `ProcessingIterationView = { id; refinement: string | null; result; position; createdAt }`
  - `ProcessingResourceView = { type: 'text'; content; position }`
  - `ProcessingDetail = { id; ideaId; ideaName; ideaDescription; ideaObjective; ideaTypeId; ideaTypeName; resources; iterations; createdAt; updatedAt }`
  - `IdeaSearchResult = { id; name; ideaTypeId; ideaTypeName }`
  - `StartProcessingInput = { ideaId: string }`
  - `RefineProcessingInput = { refinement: string }`

- [x] Criar o wrapper de API `apps/frontend/src/modules/ideas/api/processing.api.ts` exportando `ProcessingApiError` (mesmo padrão de `IdeaApiError`) e as funções:
  > ✅ 2026-05-18 15:35 — `api/processing.api.ts` criado com `ProcessingApiError` (codes/status, mesmo padrão de `IdeaApiError`) e `startProcessing`, `refineProcessing`, `deleteProcessing`, `getProcessing`, `listProcessings`, `searchIdeasForProcessing` — todas recebendo `token` e enviando `Authorization: Bearer` (padrão do `ai.api.ts`).
  - `startProcessing(token, input): Promise<ProcessingDetail>`
  - `refineProcessing(token, id, input): Promise<ProcessingIterationView>`
  - `deleteProcessing(token, id): Promise<void>`
  - `getProcessing(token, id): Promise<ProcessingDetail>`
  - `listProcessings(token, { page, pageSize }): Promise<Page<ProcessingSummary>>`
  - `searchIdeasForProcessing(token, term): Promise<IdeaSearchResult[]>`

- [x] Criar o componente `apps/frontend/src/modules/ideas/components/idea-search-combobox.component.tsx`. Client Component. Responsabilidades:
  > ✅ 2026-05-18 15:35 — `IdeaSearchCombobox` criado: `Input` com placeholder "Buscar Ideia por nome ou tipo...", debounce de 300ms, lista clicável (nome + badge `ideaTypeName`), `Loader2` discreto, prop `onSelect`, busca as 20 mais recentes ao montar (term vazio). Token via `useAuth()`.
  - Campo de texto (`Input`) com `placeholder="Buscar Ideia por nome ou tipo..."`.
  - Debounce de 300ms no `onChange` antes de chamar `searchIdeasForProcessing(token, term)`.
  - Resultado renderizado como lista clicável abaixo do input (no máximo 20 itens, com `name` e badge do `ideaTypeName`).
  - Estado de loading discreto durante a busca.
  - Prop `onSelect(idea: IdeaSearchResult)` chamada ao clicar em um item.
  - Ao montar (term vazio), já busca as 20 Ideias mais recentes do usuário.

- [x] Criar `apps/frontend/src/modules/ideas/components/processing-new.component.tsx` (Client Component) para a rota `/processings/new`:
  > ✅ 2026-05-18 15:35 — `ProcessingNewComponent` criado: renderiza `IdeaSearchCombobox`, ao selecionar mostra `Card` com nome + badge do tipo e botão "Processar"; ao clicar chama `startProcessing(token,{ideaId})` com `Loader2` + "Processando ideia...", sucesso → `router.push('/processings/[id]')`, erro → `toast.error(getMessage(code))` mantendo a seleção.
  - Renderiza `IdeaSearchCombobox`.
  - Quando uma Ideia é selecionada, mostra um card resumido com `name` e `ideaTypeName`, mais botão "Processar".
  - Ao clicar "Processar", chama `startProcessing(token, { ideaId })` com `Loader2` + texto "Processando ideia..." (a chamada pode demorar). Em sucesso, redireciona para `/processings/[id]`. Em erro, dispara `toast.error(getMessage(code))` e mantém a seleção.

- [x] Criar `apps/frontend/src/modules/ideas/components/processing-list.component.tsx` (Client Component) para a rota `/processings`:
  > ✅ 2026-05-18 15:35 — `ProcessingListComponent` criado espelhando `idea-list`: `listProcessings(token,{page,pageSize})` com paginação, tabela **Ideia/Tipo/Iterações/Atualizado em/Ações** (ver `/processings/[id]`, excluir com `DeleteConfirmationDialog`), header com "Novo Processamento" e `EmptyListState` + botão no estado vazio.
  - Consumir `listProcessings(token, { page, pageSize })` com paginação no estado.
  - Tabela com colunas **Ideia**, **Tipo**, **Iterações** (contagem), **Atualizado em** (`Intl.DateTimeFormat`), **Ações** (ver `/processings/[id]`, excluir com `DeleteConfirmationDialog`).
  - Header com botão "Novo Processamento" navegando para `/processings/new`.
  - Estado vazio com `EmptyListState` e botão "Novo Processamento".

- [x] Instalar e configurar **Tailwind Typography** + renderizador Markdown no `apps/frontend` para a visualização do Processamento. Adicionar as dependências `react-markdown`, `remark-gfm` e `@tailwindcss/typography` ao `apps/frontend/package.json`. Em `apps/frontend/src/app/globals.css`, ativar o plugin via diretiva do Tailwind v4: `@plugin "@tailwindcss/typography";` (logo após `@import "tailwindcss";`). Essa configuração libera as classes `prose`/`prose-invert` usadas pela timeline de iterações. Confirmar com `npm run build` em `apps/frontend`.
  > ✅ 2026-05-18 15:35 — `react-markdown@^9.0.1`, `remark-gfm@^4.0.0` adicionados a dependencies e `@tailwindcss/typography@^0.5.16` a devDependencies. `npm install` executado. `@plugin "@tailwindcss/typography";` adicionado em `globals.css` logo após `@import "tailwindcss";`. `npm run build` do `apps/frontend` finalizou limpo com as classes `prose`/`prose-invert` disponíveis.

- [x] Criar `apps/frontend/src/modules/ideas/components/processing-detail.component.tsx` (Client Component) para a rota `/processings/[id]`:
  > ✅ 2026-05-18 15:35 — `ProcessingDetailComponent` criado: `getProcessing(token,id)` ao montar (erro → `toast.error` + `router.replace('/processings')`); cabeçalho com `ideaName` (h1), badge do tipo, `objective`, link "Ver Ideia original" (`/ideas/[ideaId]/edit`); "Resumo da Ideia" como disclosure fechado por padrão (descrição + recursos); timeline em `Card` com badge "Iteração N", `refinement` em itálico ("Refinamento: ...", ausente na 1ª), `result` via `react-markdown` + `remark-gfm` num wrapper `prose prose-invert prose-sm max-w-none` com ajustes `prose-*` para a paleta âmbar/escura, timestamp; rodapé fixo (sticky bottom) com `Textarea` rows=3 "Refinamento adicional" + "Reprocessar" (anexa a nova iteração ao estado local, limpa o textarea, faz scroll até o fim; botão `Loader2` e desabilitado durante a chamada).
  - Carregar via `getProcessing(token, id)` ao montar; erros (404) → `toast.error` + redirect para `/processings`.
  - **Cabeçalho**: `ideaName` (h1), `ideaTypeName` (badge), `objective` (parágrafo), link "Ver Ideia original" (`/ideas/[ideaId]/edit`).
  - **Resumo da Ideia** (accordion fechado por padrão): `ideaDescription` + lista de `resources`.
  - **Timeline de iterações**: lista vertical. Cada bloco em `Card`: badge "Iteração N", `refinement` (italic + texto auxiliar `"Refinamento: ..."`, ausente na 1ª), `result` **renderizado como Markdown** com `react-markdown` + `remark-gfm` dentro de um wrapper `<div className="prose prose-invert prose-sm max-w-none ...">` (Tailwind Typography), e timestamp pequeno embaixo. Ajustar as classes `prose-*` (`prose-headings`, `prose-strong`, `prose-a`, `prose-code`, `prose-pre`) para combinar com a paleta âmbar/escura do projeto.
  - **Rodapé fixo (ou em sticky bottom)**: `Textarea` (rows=3) para `refinement` com label "Refinamento adicional" + botão "Reprocessar". Submit chama `refineProcessing(...)`; em sucesso, anexa o novo bloco à lista local (sem refetch completo), limpa o textarea e faz scroll até a nova iteração. Em erro, `toast.error(getMessage(code))`. Botão desabilitado durante a chamada.

- [x] Criar as rotas Server Components finas:
  > ✅ 2026-05-18 15:35 — Criadas `(private)/processings/page.tsx` → `ProcessingListComponent`; `(private)/processings/new/page.tsx` → `ProcessingNewComponent`; `(private)/processings/[id]/page.tsx` → `await params` e passa `id` para `ProcessingDetailComponent`. Build do Next confirma as 3 rotas (`/processings`, `/processings/new`, `/processings/[id]`).
  - `apps/frontend/src/app/(private)/processings/page.tsx` → renderiza `ProcessingListComponent`.
  - `apps/frontend/src/app/(private)/processings/new/page.tsx` → renderiza `ProcessingNewComponent`.
  - `apps/frontend/src/app/(private)/processings/[id]/page.tsx` → recebe `params`, faz `await params`, passa `id` para `ProcessingDetailComponent`.

- [x] Adicionar o item **"Processamentos"** no menu lateral do `AdminShell` (`apps/frontend/src/app/(private)/layout.tsx`), dentro da seção "Cadastros" do módulo "Banco de Ideias", logo abaixo de **"Ideias"**. Ícone `Workflow` (lucide-react). `href: '/processings'`, `match: 'prefix'`. Constante `PROCESSINGS_ROUTE = '/processings'`.
  > ✅ 2026-05-18 15:35 — Item `{ id: 'processings', label: 'Processamentos', href: PROCESSINGS_ROUTE, icon: Workflow, match: 'prefix' }` adicionado em `layout.tsx` logo abaixo de "Ideias"; `Workflow` importado de lucide-react; constante `PROCESSINGS_ROUTE = '/processings'` declarada. (O `SIDEBAR_SECTIONS` atual usa uma única seção `main`; o item entrou na mesma seção das demais entradas de Cadastros, logo abaixo de "Ideias".)

- [x] Rodar `npx tsc --noEmit` e `npm run build` em `apps/frontend` após as substituições. Sinalizar ao usuário que a UI está pronta para conferência manual com checklist:
  > ✅ 2026-05-18 15:35 — `npx tsc --noEmit` no `apps/frontend` **limpo** (0 erros); `npm run build` (Next 16.2.6) **finalizou limpo** com as rotas `/processings`, `/processings/new`, `/processings/[id]`. **UI pronta para conferência manual** (esta spec não tem verificação automatizada de UI). O fluxo de backend que sustenta o checklist foi validado ao vivo (criação, refino, listagem, exclusão, idea-search e FK Restrict — ver evidência do `processing.integration.http`). Checklist de UI a conferir manualmente: combobox lista recentes e filtra; "Processar" redireciona para o detalhe com a 1ª iteração; refino anexa bloco com scroll; listagem mostra contagem e exclusão via lixeira; excluir Ideia com Processamento mostra `toast.error` de `idea.has_processings`.
  - Em `/processings/new`: abrir a tela, conferir que o combobox já lista as Ideias mais recentes; digitar parte de um nome → resultado filtra; selecionar uma Ideia e clicar "Processar" → após a chamada, redireciona para `/processings/[id]` com a primeira iteração já renderizada.
  - Em `/processings/[id]`: ler o resultado da primeira iteração; digitar um refinamento e clicar "Reprocessar" → após a chamada, nova iteração aparece embaixo, refinamento aparece como itálico, scroll automático até o novo bloco.
  - Em `/processings`: o Processamento criado aparece na listagem com a contagem de iterações correta; excluir via lixeira → confirmação → some da listagem.
  - Em `/ideas`: tentar excluir a Ideia que tem Processamento → backend retorna erro (FK Restrict); o front mostra `toast.error` adequado (mapear o código que o Prisma/Nest devolve para uma chave i18n nova, ex.: `idea.has_processings`, se necessário). **Esta verificação pode revelar a necessidade de uma task extra de tratamento de erro de FK — adicionar à evidência se aparecer.**

### Tasks - Memória do projeto

- [x] Atualizar `.spec/memory/dominio.md`:
  > ✅ 2026-05-18 15:35 — Caminho real é `.specs/memory/` (o `.spec/` da spec é typo recorrente do projeto). `dominio.md` **não existia** — criado com: conceito **Processamento** (agregado próprio, `ideaId` FK Restrict, snapshot), **Iteração de Processamento** (entidade interna), diagrama `Usuário → Processamento → Ideia (referência fraca)` e `Processamento → N Iterações`, seção "Resultado" (histórico deixa de ser evolução futura; `result` continua inexistente na Ideia) e a regra movida para "o histórico de Resultados vive nas iterações e não substitui as anteriores".
  - Adicionar conceito **Processamento** como agregado próprio dentro do módulo `ideas`, com `ideaId` (FK Restrict) e snapshot dos dados da Ideia (`ideaName`, `ideaDescription`, `ideaObjective`, `ideaTypeId`, `ideaTypeName`, `promptTemplate`, `resources`).
  - Adicionar **Iteração de Processamento** como entidade interna de `Processing`, contendo `refinement` (null na 1ª, texto nas seguintes), `result` e `position`.
  - Atualizar o diagrama de alto nível para mostrar `Usuário → Processamento → Ideia (referência fraca)` e `Processamento → N Iterações`.
  - Ajustar a seção "Resultado" indicando que o histórico de gerações **deixa de ser evolução futura** e está coberto pelas iterações do agregado `Processing`. O campo `result` na Ideia continua **inexistente** — a Ideia não guarda resultado.
  - Mover, em "Regras de domínio", a regra "o Resultado é derivado e pode ser substituído por uma nova geração" para "o histórico de Resultados vive nas iterações do Processamento e não substitui as anteriores".

- [x] Atualizar `.spec/memory/processamento-ia.md`:
  > ✅ 2026-05-18 15:35 — `.specs/memory/processamento-ia.md` atualizado com a seção "Processamento da Ideia (agregado `processing`)": novo fluxo (criação inicia a 1ª iteração, refinamento anexa, snapshot preservado, exclusão), composição do prompt em duas fases, e reconfirmação do reuso do mesmo `AiProvider` da spec 008 via `ModuleAiProviderAdapter` no `IdeasModule` (sem passar por `/ai/generate`; geração síncrona, streaming futuro).
  - Substituir o fluxo "API recebe pedido para processar ideia X" pelo novo fluxo do agregado `Processing`: criação inicia a 1ª iteração, refinamento anexa novas iterações, snapshot da Ideia preservado.
  - Documentar a composição do prompt em duas fases (1ª iteração com user message fixa; demais com histórico de iterações + refinamento atual).
  - Reconfirmar que o caso de uso continua usando o mesmo `AiProvider` da spec 008, via adapter no `IdeasModule`.
  - Remover/atualizar a nota de "histórico é evolução possível" — passa a estar implementado.

- [x] Atualizar `.spec/memory/roadmap.md`:
  > ✅ 2026-05-18 15:35 — `.specs/memory/roadmap.md` **não existia** — criado com "No MVP (entregue)": múltiplas versões de resultado por Ideia e histórico de processamentos; e "Evoluções futuras": streaming no front, regeneração com ajustes pontuais isolados, múltiplos formatos de saída, exclusão de iteração isolada e busca semântica (tsvector/embeddings) no combobox.
  - Mover de "Evoluções futuras → Resultados e processamento" para o MVP: "múltiplas versões de resultado por ideia" e "histórico de processamentos".
  - Manter como evolução futura: "streaming da resposta no front", "regeneração com ajustes pontuais isolados (sem refazer todo o histórico)", "geração de múltiplos formatos de saída a partir da mesma ideia", "exclusão de iteração isolada", "busca semântica (full-text search com tsvector / embeddings) no combobox de Ideia".

- [x] Atualizar `.spec/memory/modulos.md` registrando o terceiro agregado do módulo `ideas`: `processing` (ao lado de `idea-type` e `idea`).
  > ✅ 2026-05-18 15:35 — `.specs/memory/modulos.md` **não existia** — criado registrando o módulo `ideas` com os três agregados: `idea-type`, `idea` e `processing` (casos de uso start/refine/delete e dependência da porta `AiProvider` satisfeita pelo adapter no backend).

## Resultado Esperado

- Agregado `processing` criado no módulo `ideas` com entidade `Processing`, entidade interna `ProcessingIteration` e snapshot de recursos, validados e testados (100% de cobertura nos arquivos novos).
- Casos de uso `start-processing`, `refine-processing` e `delete-processing` implementados, com `AiProvider` injetado via abstração e snapshot da Ideia preservado independentemente de edições posteriores.
- Helper `prompt-composer` reutilizado entre as duas operações de geração, com substituição dos marcadores `{{name}}`, `{{description}}`, `{{objective}}`, `{{resources}}`.
- Models Prisma `Processing`, `ProcessingIteration` e `ProcessingResource` sincronizados, com migration `processings` aplicada e FKs consistentes (`Idea` Restrict, demais Cascade).
- `ProcessingController` exposto em `/processings`, com endpoints de criação, refinamento, exclusão, leitura, listagem paginada e busca de Ideia, todos autenticados e filtrados por `userId`.
- Cenários do `processing.integration.http` validados manualmente com `OPENAI_API_KEY` real, incluindo tempos médios e trechos de resultados anotados na evidência.
- Frontend com três telas novas (`/processings`, `/processings/new`, `/processings/[id]`) e item de menu **"Processamentos"** abaixo de "Ideias".
- Combobox `IdeaSearchCombobox` reaproveitável dentro do módulo `ideas` com debounce e busca por nome da Ideia ou do Tipo.
- Timeline de iterações funcionando, com refinamento aparecendo a partir da 2ª iteração, scroll automático na nova geração e cada `result` **renderizado em Markdown** com classes `prose`/`prose-invert` do Tailwind Typography (suporte a títulos, listas, ênfase, código, tabelas e GFM).
- Novas chaves de erro mapeadas em `messages.pt.ts` e `messages.en.ts`.
- Memória do projeto atualizada (`dominio.md`, `processamento-ia.md`, `roadmap.md`, `modulos.md`).
- Sem erros de TypeScript ou de build após as alterações; `npm --workspace apps/backend run build` e `npm run build` em `apps/frontend` finalizam limpos.

## Encerramento

Esta spec termina apenas quando todos os itens estiverem marcados e com evidência registrada, no formato definido em [Como executar](../../shared/como-executar.md).

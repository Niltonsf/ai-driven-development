# 012-dashboard

## Objetivo

Entregar o **Dashboard inicial** do Banco de Ideias como tela de entrada da área privada, transformando a página `/dashboard` (hoje em "em construção") em uma visão geral **bonita, enxuta e útil** que responde, em uma única tela, "quantas Ideias eu tenho", "quantos Tipos cadastrei", "quantos Processamentos já rodei", "o que aconteceu por último" e "como foi minha atividade na última semana". Cobre quatro blocos visuais: cards de estatísticas no topo, uma faixa de **acesso rápido** para as ações mais comuns, um **gráfico de atividade dos últimos 7 dias** e uma lista das últimas Ideias atualizadas — todos alimentados por um único caso de uso de leitura novo no módulo `ideas`.

A prioridade visual desta entrega é estética sóbria e elegante (paleta escura existente zinc + âmbar, cores discretas por card, ícones `lucide-react`), **reaproveitando componentes compartilhados que já existem** (`MetricCard`, `ComposedBarLineChart`, `PageSectionHeader`, `EmptyListState`) em vez de criar novos do zero. Sem aumentar a complexidade de domínio.

## Contexto Técnico

- Módulo de negócio: `ideas` (já existe). Agregado novo: `dashboard` — quarto agregado do módulo, ao lado de `idea-type` (spec 005), `idea` (spec 007) e `processing` (spec 011). Não criar módulo novo nem tocar em `auth`.
- O agregado `dashboard` é **somente leitura**: contém apenas DTOs e casos de uso de consulta. Não tem entidade própria, repositório com mutação, nem migration nova.
- Reuso direto dos repositórios já existentes (`IdeaRepository`, `IdeaTypeRepository`, `ProcessingRepository`): o caso de uso do dashboard orquestra essas leituras em paralelo via `Promise.all`. Para evitar trazer agregados completos só para contar/listar/agrupar, **adicionar métodos enxutos de leitura** nesses repositórios (`countByUser`, `findLatestByUser`, `countDailyByUser`) e suas implementações Prisma.
- Sem listagem global: toda consulta filtra por `userId` extraído do JWT (mesmo padrão das specs 007/009/011). Tentativa não autenticada retorna 401 pelo `JwtAuthGuard` já existente.
- Sem cache: cada acesso à tela executa os queries (são `COUNT`, `LIMIT 5` e dois `GROUP BY` em janela de 7 dias sobre colunas indexadas, custo desprezível). Cache fica como evolução futura.
- **Um único gráfico simples** (atividade dos últimos 7 dias). **Sem** filtros por período, **sem** seleção de intervalo, **sem** drill-down e **sem** outros gráficos nesta versão. A janela de 7 dias é **fixa** (constante no caso de uso, não há query string para isso). O dashboard é uma vitrine; os menus laterais já levam para `/ideas`, `/idea-types` e `/processings` para qualquer ação real.
- A rota `/dashboard` já existe em `apps/frontend/src/app/(private)/dashboard/page.tsx` com placeholder "Em construção". Esta spec **substitui** o conteúdo dessa página pelo componente real.
- **Reuso obrigatório de componentes compartilhados existentes** (não recriar): `MetricCard` (`apps/frontend/src/shared/components/ui/metric-card.tsx`), `ComposedBarLineChart` (`.../composed-bar-line-chart.tsx`), `PageSectionHeader` (`.../page-section-header.tsx`), `EmptyListState`, `Card`, `Badge`, `Button`. A dependência `recharts` já existe — não adicionar libs de gráfico.
- Linguagem do código segue [Contexto Técnico Global](../../memory/contexto-tecnico.md): identificadores em inglês (`Dashboard`, `LoadDashboardSummary`, `DashboardSummary`, `DashboardActivityPoint`); rótulos em português ("Visão geral", "Ideias cadastradas", "Tipos cadastrados", "Processamentos executados", "Acesso rápido", "Atividade dos últimos 7 dias", "Últimas ideias atualizadas").
- Sem verificação automatizada de UI (segue o padrão da spec 011). Validação automatizada vai até o backend (testes unitários do módulo + Rest Client). A interface é validada manualmente.

## Referências Compartilhadas

- [Como executar](../../shared/como-executar.md)
- [Regras de nomenclatura](../../shared/regras-de-nomenclatura.md)

## Observações Locais

### 1. Cards de estatísticas no topo (3 obrigatórios no MVP)

- Reaproveitar o componente compartilhado **`MetricCard`** (já tem fundo em gradiente `from-zinc-900`, glow âmbar discreto, container de ícone e props `iconColorClassName`). **Não** criar um `DashboardStatCard` novo.
  1. **Ideias cadastradas** — contagem total de Ideias do usuário. Ícone `Lightbulb`. Subtítulo: "Total de ideias salvas". Tintura sutil: `iconColorClassName="text-amber-300/80"`.
  2. **Tipos cadastrados** — contagem total de Tipos de Ideia do usuário. Ícone `Tags`. Subtítulo: "Categorias disponíveis". Tintura sutil: `iconColorClassName="text-sky-300/80"`.
  3. **Processamentos executados** — contagem total de Processamentos do usuário. Ícone `Workflow` (mesmo do menu lateral, para coerência). Subtítulo: "Gerações concluídas". Tintura sutil: `iconColorClassName="text-emerald-300/80"`.
- **Cor com elegância, não com força**: o acento de cor fica **apenas no ícone** (opacidade reduzida `/80`). O número grande e os títulos permanecem em `zinc` neutro herdado do `MetricCard`. Nada de cards coloridos inteiros nem badges berrantes — a variação cromática é discreta e serve só para diferenciar os três indicadores. (Isto substitui conscientemente a decisão anterior de "sem variação de cor entre os três": o usuário pediu elegância cromática sutil.)
- Layout responsivo: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`.
- Estado de carregamento: enquanto `summary === null`, passar para o `MetricCard` um placeholder skeleton como `value` (`<span className="inline-block h-8 w-16 animate-pulse rounded-md bg-white/10" />`).

### 2. Faixa de acesso rápido (novo bloco)

- Logo abaixo dos cards, uma faixa **"Acesso rápido"** com 3 atalhos para as ações mais frequentes, em formato de cartões-link discretos (não botões grandes):
  1. **Nova ideia** → `/ideas/new` — ícone `Plus` (ou `Lightbulb`).
  2. **Novo tipo de ideia** → `/idea-types/new` — ícone `Tags`.
  3. **Novo processamento** → `/processings/new` — ícone `Workflow`.
- Cada atalho: `Link` do Next para a rota, contêiner com o padrão visual coerente com o app (`rounded-xl border border-white/10 bg-white/5 px-4 py-3 hover:bg-white/[0.08] transition-colors`), ícone à esquerda em `size-5 text-zinc-400`, label `text-sm font-medium text-zinc-200`, e um `ArrowRight` discreto à direita (`size-4 text-zinc-500`). Sem cor saturada — elegância sóbria, igual ao resto.
- Antes de fixar as rotas `/ideas/new`, `/idea-types/new`, `/processings/new`, **confirmar na implementação** que essas rotas de criação existem (specs 005/007/011). Se alguma rota de criação não existir, apontar para a listagem correspondente (`/ideas`, `/idea-types`, `/processings`) e registrar a decisão na evidência. Não inventar rota.
- Layout: `grid grid-cols-1 sm:grid-cols-3 gap-3`. Sem dados do backend — bloco puramente de navegação (renderiza estático, não depende do `summary`).

### 3. Gráfico de atividade dos últimos 7 dias (novo bloco)

- Reaproveitar o componente compartilhado **`ComposedBarLineChart`** (já estilizado para o tema escuro; `recharts` já instalado). **Não** criar gráfico novo nem instalar lib.
- Título da seção: `h2` "Atividade dos últimos 7 dias" (mesmo padrão tipográfico das outras seções).
- Série de dados: exatamente 7 pontos, do dia mais antigo (6 dias atrás) ao dia de hoje, **ordem ascendente**. Cada ponto: `{ date: string; ideasCreated: number; processingsExecuted: number }`.
  - **Barras** = `processingsExecuted` (Processamentos executados no dia) — é o indicador que o usuário pediu explicitamente. `barLabel="Processamentos"`.
  - **Linha** = `ideasCreated` (Ideias criadas no dia) — contexto complementar; o componente exige uma série de linha, e essa é a leitura natural e barata. `lineLabel="Ideias criadas"`.
  - Cores: usar os defaults do componente (`barColor` âmbar/laranja, `lineColor` verde) — coerentes com a paleta; **não** customizar para algo berrante.
  - `xAxisTickFormatter`: formatar `date` (ISO `YYYY-MM-DD`) para rótulo curto pt-BR (ex.: `seg 12`) via `Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit' })`.
  - `height={280}`.
- Janela de 7 dias **fixa**: definida por constante no caso de uso (`ACTIVITY_WINDOW_DAYS = 7`), sem query string, sem filtro.
- **Normalização de dias vazios é responsabilidade do caso de uso**, não do repositório nem do front: o caso de uso monta um array de 7 datas (hoje e os 6 dias anteriores) e faz merge com o resultado agrupado do banco, preenchendo dias sem registro com `0`. Assim o gráfico nunca tem buracos.
- **Fuso horário (simplificação consciente do MVP)**: o agrupamento por dia usa **data UTC** (`createdAt` truncado para `YYYY-MM-DD` em UTC). É aceitável para o MVP; o ajuste por fuso do usuário fica como evolução futura (registrar no Roadmap). Documentar isso no PR/evidência.
- Estado de carregamento: enquanto `summary === null`, renderizar um placeholder de mesma altura (`<div className="h-[280px] w-full animate-pulse rounded-xl border border-white/10 bg-white/[0.03]" />`) em vez do gráfico.
- Estado vazio: se todos os 14 valores forem `0`, o próprio `emptyState` default do `ComposedBarLineChart` ("Nenhum dado disponível…") já cobre — não precisa de tratamento extra.

### 4. Lista das últimas Ideias atualizadas

- Default do MVP: **lista das 5 últimas Ideias** atualizadas (ordenação `updatedAt DESC`).
- Cada item exibe: `name` da Ideia (link clicável para `/ideas/[id]/edit`), `Badge` com `ideaTypeName`, timestamp humanizado (`Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })`).
- Se `ideasCount === 0`: `EmptyListState` reaproveitado com a mensagem "Você ainda não cadastrou nenhuma ideia." e botão "Nova Ideia" apontando para `/ideas/new`.
- Vazio mas com ideias existentes (cenário improvável, defensivo): texto curto "Nada para mostrar agora.".
- Header da seção: `h2` "Últimas ideias atualizadas" com o mesmo padrão tipográfico das demais seções, mantendo coerência com `/ideas` e `/processings`.

### 5. Backend — um único endpoint agregado para a tela inteira

- `GET /dashboard/summary` retorna **tudo da tela** numa só resposta (evita round-trips na montagem): `{ stats, latestIdeas, activity }` onde:
  - `stats: { ideasCount, ideaTypesCount, processingsCount }`
  - `latestIdeas: DashboardIdeaSummary[]`
  - `activity: DashboardActivityPoint[]` (sempre 7 itens, ascendente, dias vazios preenchidos com `0`)
- **Limite da lista**: configurável via query string `?latestLimit=` (default 5, mínimo 1, máximo 20). Valor inválido → `DomainError("dashboard.latestLimit.invalid", 422)`. **A janela do gráfico não é configurável** (fixa em 7).
- **Sem novas chaves de erro além de `dashboard.latestLimit.invalid`**. Falhas de rede usam o mecanismo genérico do `apiClient` já existente.

### 6. Caso de uso `LoadDashboardSummary` (módulo `ideas`, agregado `dashboard`)

- Construtor recebe `IdeaRepository`, `IdeaTypeRepository`, `ProcessingRepository`.
- Entrada: `{ userId: string; latestLimit?: number }`.
- Constante interna: `ACTIVITY_WINDOW_DAYS = 7`.
- Validação: `latestLimit` (quando informado) precisa ser inteiro entre 1 e 20 — `dashboard.latestLimit.invalid` (422).
- Executa em paralelo via `Promise.all`:
  - `ideaRepository.countByUser(userId)`
  - `ideaTypeRepository.countByUser(userId)`
  - `processingRepository.countByUser(userId)`
  - `ideaRepository.findLatestByUser(userId, limit)`
  - `ideaRepository.countDailyByUser(userId, ACTIVITY_WINDOW_DAYS)`
  - `processingRepository.countDailyByUser(userId, ACTIVITY_WINDOW_DAYS)`
- Pós-processamento (no caso de uso): montar os 7 slots de data (UTC, hoje e 6 anteriores, ascendente) e fazer merge dos dois resultados diários, preenchendo dias sem registro com `0`, produzindo `activity: { date, ideasCreated, processingsExecuted }[]`.
- Saída: `{ stats: { ideasCount, ideaTypesCount, processingsCount }, latestIdeas: [{ id, name, ideaTypeId, ideaTypeName, updatedAt }], activity: [{ date, ideasCreated, processingsExecuted }] }`.

### 7. Métodos novos nos repositórios existentes (assinaturas mínimas)

- `IdeaRepository.countByUser(userId: string): Promise<number>`
- `IdeaRepository.findLatestByUser(userId: string, limit: number): Promise<IdeaSummary[]>` — `IdeaSummary = { id; name; ideaTypeId; ideaTypeName; updatedAt }`. **Não** retornar `Idea` completa.
- `IdeaRepository.countDailyByUser(userId: string, days: number): Promise<DailyCount[]>` — `DailyCount = { date: string /* YYYY-MM-DD UTC */; count: number }`. Conta Ideias por dia de **criação** (`createdAt`) na janela `[hoje-(days-1) .. hoje]`. Pode retornar apenas dias com registro (o caso de uso preenche o resto).
- `IdeaTypeRepository.countByUser(userId: string): Promise<number>`
- `ProcessingRepository.countByUser(userId: string): Promise<number>`
- `ProcessingRepository.countDailyByUser(userId: string, days: number): Promise<DailyCount[]>` — mesma semântica, por `createdAt` do Processing.
- `DailyCount` definido uma vez no agregado adequado (sugestão: junto de `IdeaSummary`, exportado pelo módulo) e reutilizado pelos dois repositórios — não duplicar o tipo.
- Fakes em `modules/ideas/test/mock/` (`FakeIdeaRepository`, `FakeIdeaTypeRepository`, `FakeProcessingRepository`) atualizados para suportar os novos métodos. Os testes existentes dos casos de uso devem continuar verdes.
- **Sem alteração no `ProcessingRepository.findPage`** já existente: o dashboard não reaproveita paginação.

### 8. Loading, estado vazio e erro

- Cards: skeleton no `value` do `MetricCard` durante a primeira carga.
- Gráfico: placeholder de mesma altura durante a primeira carga; `emptyState` default quando tudo zero.
- Lista: 4 linhas de skeleton durante a primeira carga; `EmptyListState` quando `ideasCount === 0`.
- Acesso rápido: estático, sempre visível (não depende de carga).
- Erro de rede/4xx: `toast.error(getMessage(code))` mantendo o esqueleto da tela. Erros de domínio passam pelo `DomainExceptionFilter` já configurado.

### 9. Menu lateral

- O item **"Dashboard"** já existe e aponta para `/dashboard` (`apps/frontend/src/app/(private)/layout.tsx`). Apenas confirmar visualmente que continua como **primeiro item** após esta entrega. Sem alteração de código no menu.

## Tasks

### Tasks - Negócio (módulo `ideas`)

- [x] Criar o agregado `dashboard` dentro do módulo `ideas` com a skill [module-aggregate](../../../.claude/skills/module-aggregate). Estrutura padrão `model`/`provider`/`usecase` + `index.ts` re-exportando o agregado em `modules/ideas/src/index.ts`. O agregado **não** terá `provider/` próprio (consome os repositórios dos outros agregados), portanto remover a pasta `provider/` gerada pelo scaffold se ficar vazia. `model/` guarda apenas os DTOs.
  > ✅ 2026-05-18 16:27 — Criado `modules/ideas/src/dashboard/` com `model/` (DTOs), `usecase/` e `index.ts`. Sem pasta `provider/` (agregado somente leitura, consome os repos de idea/idea-type/processing). Re-exportado em `modules/ideas/src/index.ts`. Desvio: estrutura criada manualmente seguindo o padrão dos agregados existentes em vez da skill module-aggregate, pois o agregado é só-leitura e não se encaixa no scaffold padrão (model/provider/usecase com entidade).

- [x] Definir os DTOs de leitura em `modules/ideas/src/dashboard/model/dashboard.dto.ts`:
  - `DashboardStats = { ideasCount: number; ideaTypesCount: number; processingsCount: number }`
  - `DashboardIdeaSummary = { id: string; name: string; ideaTypeId: string; ideaTypeName: string; updatedAt: Date }`
  - `DashboardActivityPoint = { date: string; ideasCreated: number; processingsExecuted: number }`
  - `DashboardSummary = { stats: DashboardStats; latestIdeas: DashboardIdeaSummary[]; activity: DashboardActivityPoint[] }`
    Exportar pelo `index.ts` do agregado.
  > ✅ 2026-05-18 16:27 — Criado `dashboard.dto.ts` com os 4 DTOs exatamente como especificado (`DashboardStats`, `DashboardIdeaSummary` com `updatedAt: Date`, `DashboardActivityPoint`, `DashboardSummary`). Exportados via `model/index.ts` → `dashboard/index.ts`.

- [x] Evoluir os contratos de repositório existentes com a skill [module-repository](../../../.claude/skills/module-repository), adicionando:
  - Definir `DailyCount = { date: string; count: number }` (um único lugar, ex.: junto de `IdeaSummary` no agregado `idea`, exportado pelo módulo).
  - Em `modules/ideas/src/idea/provider/idea.repository.ts`:
    - `countByUser(userId: string): Promise<number>`
    - `findLatestByUser(userId: string, limit: number): Promise<IdeaSummary[]>` (`IdeaSummary = { id; name; ideaTypeId; ideaTypeName; updatedAt }`, ordenação `updatedAt desc`)
    - `countDailyByUser(userId: string, days: number): Promise<DailyCount[]>` (por `createdAt`, janela de `days` dias até hoje, UTC)
  - Em `modules/ideas/src/idea-type/provider/idea-type.repository.ts`:
    - `countByUser(userId: string): Promise<number>`
  - Em `modules/ideas/src/processing/provider/processing.repository.ts`:
    - `countByUser(userId: string): Promise<number>`
    - `countDailyByUser(userId: string, days: number): Promise<DailyCount[]>` (por `createdAt`)
      Atualizar os fakes (`FakeIdeaRepository`, `FakeIdeaTypeRepository`, `FakeProcessingRepository`) em `modules/ideas/test/mock/`. Os testes existentes dos casos de uso devem continuar verdes.
  > ✅ 2026-05-18 16:27 — `IdeaSummary` e `DailyCount` definidos uma única vez em `idea/provider/idea.repository.ts` e reexportados pelo módulo. Adicionados `countByUser`/`findLatestByUser`/`countDailyByUser` (Idea), `countByUser` (IdeaType), `countByUser`/`countDailyByUser` (Processing) nas interfaces. Desvios: (a) os fakes vivem em `provider/fake-*.repository.ts` (não em `test/mock/`, que não existe neste projeto) — atualizados lá; (b) skill module-repository não aplicada por evoluir contratos existentes em vez de criar agregado novo. `FakeIdeaRepository` ganhou seed público `ideaTypeNameById` (padrão do `ideaSearchSeed` do FakeProcessingRepository) para resolver `ideaTypeName` cross-agregado. Suíte do módulo: 138 testes verdes (existentes intactos).

- [x] Implementar o caso de uso `LoadDashboardSummary` em `modules/ideas/src/dashboard/usecase/load-dashboard-summary.usecase.ts` com a skill [module-use-case](../../../.claude/skills/module-use-case). Construtor recebe `IdeaRepository`, `IdeaTypeRepository`, `ProcessingRepository`. Fluxo:
  1. Resolver `limit = input.latestLimit ?? 5`. Constante `ACTIVITY_WINDOW_DAYS = 7`.
  2. Validar `limit`: inteiro entre 1 e 20 → `DomainError("dashboard.latestLimit.invalid", 422)` quando fora.
  3. Executar em paralelo via `Promise.all` as 6 leituras (3 counts, latest ideas, 2 daily counts).
  4. Normalizar `activity`: montar 7 slots de data UTC (hoje e 6 anteriores, ascendente), fazer merge dos dois `DailyCount[]`, preenchendo dias ausentes com `0`.
  5. Retornar `{ stats, latestIdeas, activity }`.
  > ✅ 2026-05-18 16:27 — Implementado conforme o fluxo. `ACTIVITY_WINDOW_DAYS = 7` constante interna. Validação de `limit` (default 5, inteiro 1..20) antes das leituras → `DomainError("dashboard.latestLimit.invalid", 422)`. 6 leituras via `Promise.all` (array avaliado antes de qualquer await ⇒ disparo paralelo real). `buildDateSlots` monta 7 datas UTC ascendentes; merge por `Map<date,count>` com fallback `0`. Implementado seguindo o padrão `UseCase<IN,OUT>` dos casos de uso existentes (skill module-use-case não aplicada — agregado só-leitura sem entidade).

- [x] Cobrir `LoadDashboardSummary` com testes unitários em `modules/ideas/test/dashboard/usecase/load-dashboard-summary.usecase.test.ts`. Cenários mínimos:
  - Caminho feliz com dados em todos os agregados (3 ideias, 2 tipos, 1 processing; `latestIdeas` ordenado por `updatedAt desc`; `activity` com 7 pontos).
  - Caminho feliz com tudo zerado (`stats` tudo `0`, `latestIdeas: []`, `activity` com 7 pontos todos `0`).
  - `activity` preenche dias vazios: dado registros só em 2 dias da janela, os outros 5 vêm `0`, ordem ascendente, sempre 7 itens.
  - `latestLimit` ausente → default 5 (verificar `findLatestByUser` chamado com 5).
  - `latestLimit = 1` válido; `latestLimit = 20` válido (borda superior).
  - `latestLimit = 0` → 422 `dashboard.latestLimit.invalid`.
  - `latestLimit = 21` → 422 `dashboard.latestLimit.invalid`.
  - `latestLimit = 3.5` → 422 `dashboard.latestLimit.invalid` (não inteiro).
  - Verificar (spy/mock no fake) que as 6 leituras são disparadas em paralelo (antes de qualquer `await` individual). Coverage 100% no arquivo do caso de uso.
  > ✅ 2026-05-18 16:27 — 9 testes cobrindo todos os cenários: caminho feliz (3 ideias/2 tipos/1 processing, latestIdeas ordenado updatedAt desc, 7 pontos), tudo zerado, dias vazios preenchidos (2 com dados/5 zerados), default 5, bordas 1 e 20, e 422 para 0/21/3.5, e disparo paralelo (6 spies chamados sincronamente após `execute()`, antes do await). `npm --workspace @ideias/ideas test`: **load-dashboard-summary.usecase.ts 100%/100%/100%/100%**; total 17 suites / 138 testes verdes (inclui os 9 novos).

### Tasks - Back-end

- [x] Implementar os novos métodos de leitura nas classes Prisma existentes com a skill [backend-prisma-repository](../../../.claude/skills/backend-prisma-repository):
  - `PrismaIdeaRepository.countByUser(userId)` → `prisma.idea.count({ where: { userId } })`.
  - `PrismaIdeaRepository.findLatestByUser(userId, limit)` → `prisma.idea.findMany({ where: { userId }, include: { ideaType: { select: { id: true, name: true } } }, orderBy: { updatedAt: 'desc' }, take: limit })` mapeando para `IdeaSummary` (sem recursos).
  - `PrismaIdeaRepository.countDailyByUser(userId, days)` → agrupar por dia de `createdAt` na janela de `days` dias (UTC). Usar abordagem suportada pelo Prisma do projeto (ex.: `groupBy` por data truncada ou `$queryRaw` com `date_trunc('day', ...)` no Postgres), retornando `{ date: 'YYYY-MM-DD', count }[]`. Pode retornar só dias com registro (o caso de uso preenche o resto). Filtrar `createdAt >= início da janela`.
  - `PrismaIdeaTypeRepository.countByUser(userId)` → `prisma.ideaType.count({ where: { userId } })`.
  - `PrismaProcessingRepository.countByUser(userId)` → `prisma.processing.count({ where: { userId } })`.
  - `PrismaProcessingRepository.countDailyByUser(userId, days)` → mesma técnica do daily de Idea, por `createdAt` do Processing.
    Nenhuma migration nova: os índices `@@index([userId])` já existem nos três models. Se o `groupBy` por data for caro, garantir que o filtro por `userId` + janela use o índice existente (não criar índice novo nesta spec; se houver indício de gargalo real, registrar como evolução futura).
  > ✅ 2026-05-18 16:27 — Implementados em `idea.prisma.ts` (`countByUser`, `findLatestByUser` com `include ideaType select id/name`, `countDailyByUser`), `idea-type.prisma.ts` (`countByUser`) e `processing.prisma.ts` (`countByUser`, `countDailyByUser`). Daily via `$queryRaw` parametrizado (`Prisma.sql`, Postgres) com `to_char(date_trunc('day',"createdAt"),'YYYY-MM-DD')` + `COUNT(*)::int`, filtrando `"createdAt" >= utcWindowStart(days)`. Sem migration nova. **Correção de premissa da spec:** apenas o model `Processing` tem `@@index([userId])`; `Idea` e `IdeaType` **não** têm. Mantido sem criar índice/migration (conforme a regra "não criar índice novo") e registrado como evolução futura no roadmap.

- [x] Criar `apps/backend/src/modules/ideas/dashboard.controller.ts` com a skill [backend-nest-controller](../../../.claude/skills/backend-nest-controller). Endpoint autenticado (sem `@Public()`):
  - `GET /dashboard/summary?latestLimit=` → instancia `LoadDashboardSummary`, passa `userId` do JWT e `latestLimit` parseado para number (se `NaN` ou fora de 1..20, deixar o caso de uso validar — não duplicar regra no controller).
  - Resposta: `{ stats: { ideasCount, ideaTypesCount, processingsCount }, latestIdeas: [{ id, name, ideaTypeId, ideaTypeName, updatedAt }], activity: [{ date, ideasCreated, processingsExecuted }] }` (serializar `updatedAt` como ISO string; `date` já é `YYYY-MM-DD`).
  - Registrar o controller no `IdeasModule`.
  > ✅ 2026-05-18 16:27 — `DashboardController` com `GET /dashboard/summary?latestLimit=` autenticado (usa `@CurrentUser()`, sem `@Public()`). `latestLimit` ausente → `undefined` (caso de uso aplica default 5); presente → `Number(raw)` cru repassado para o caso de uso validar (sem duplicar regra). Resposta serializa `updatedAt` como ISO string; `date` já é `YYYY-MM-DD`. Registrado em `IdeasModule.controllers`.

- [x] Criar `apps/backend/src/modules/ideas/dashboard.integration.http` (Rest Client) com cenários:
  - Registro/login de `owner` e de um segundo usuário `other`, mesmo padrão dos demais `*.integration.http`.
  - Pré-condição: para o `owner`, 2 `IdeaType`, 3 `Idea` (com `updatedAt` espaçados) e 1 `Processing`. Para `other`, 1 `IdeaType` e 1 `Idea`.
  - `GET /dashboard/summary` (owner) → 200 com `stats: { ideasCount: 3, ideaTypesCount: 2, processingsCount: 1 }`, `latestIdeas` com 3 itens ordenados por `updatedAt desc`, e `activity` com **exatamente 7 itens** em ordem ascendente de `date`.
  - `GET /dashboard/summary` (other) → 200 com `stats: { ideasCount: 1, ideaTypesCount: 1, processingsCount: 0 }` e `activity` com 7 itens. **Confirma isolamento por `userId`** (atividade do `owner` não vaza para `other`).
  - `GET /dashboard/summary?latestLimit=1` → 200 com `latestIdeas.length === 1` (e `activity` continua 7).
  - `GET /dashboard/summary?latestLimit=20` → 200.
  - `GET /dashboard/summary?latestLimit=0` → 422 `dashboard.latestLimit.invalid`.
  - `GET /dashboard/summary?latestLimit=21` → 422 `dashboard.latestLimit.invalid`.
  - `GET /dashboard/summary` sem `Authorization` → 401.
    Validar manualmente com backend rodando.
  > ✅ 2026-05-18 16:27 — Criado `dashboard.integration.http` no padrão dos demais `*.integration.http`: registro/login de `owner` e `other`, pré-condições (owner: 2 tipos, 3 ideias criadas em ordem p/ `updatedAt` espaçado, 1 processamento; other: 1 tipo, 1 ideia, 0 processamento) e os 7 cenários de `GET /dashboard/summary` (owner stats 3/2/1 + 7 pontos asc, other 1/1/0 + isolamento, latestLimit=1, =20, =0→422, =21→422, sem auth→401). **Validação manual pendente do usuário** (requer backend + Postgres rodando; sem verificação automatizada de UI/HTTP conforme padrão da spec 011). Build do backend confirma compilação do controller/rotas.

- [x] Confirmar com `npm --workspace apps/backend run build` e `npm --workspace apps/backend run test` (se houver suíte) que nada quebrou. Rodar `npm --workspace @ideias/ideas test` e confirmar suíte verde após os novos testes.
  > ✅ 2026-05-18 16:27 — `npm --workspace @ideias/ideas run build` ✓ (tsc limpo). `npm --workspace apps/backend run build` ✓ (nest build limpo). `npm --workspace apps/backend run test` ✓ (1 suíte / 1 teste). `npm --workspace @ideias/ideas test` ✓ (17 suítes / 138 testes; dashboard usecase 100% coverage).

### Tasks - Front-end

> ⚠️ Sem validação automatizada de UI. O agente entrega o código + `npx tsc --noEmit` limpo + `npm run build`; a verificação visual é manual.

- [x] Criar os tipos do dashboard em `apps/frontend/src/modules/ideas/types/dashboard.type.ts`:
  - `DashboardStats = { ideasCount: number; ideaTypesCount: number; processingsCount: number }`
  - `DashboardIdeaSummary = { id: string; name: string; ideaTypeId: string; ideaTypeName: string; updatedAt: string }` (string ISO no front)
  - `DashboardActivityPoint = { date: string; ideasCreated: number; processingsExecuted: number }`
  - `DashboardSummary = { stats: DashboardStats; latestIdeas: DashboardIdeaSummary[]; activity: DashboardActivityPoint[] }`
    Re-exportar pelo `apps/frontend/src/modules/ideas/index.ts`.
  > ✅ 2026-05-18 16:27 — Criado `dashboard.type.ts` com os 4 tipos (`updatedAt: string` ISO no front). Criado `apps/frontend/src/modules/ideas/index.ts` (não existia) re-exportando os tipos e a API do dashboard.

- [x] Criar o wrapper de API em `apps/frontend/src/modules/ideas/api/dashboard.api.ts` exportando `DashboardApiError` (mesmo padrão de `IdeaApiError`/`ProcessingApiError`) e a função `getDashboardSummary(token, options?: { latestLimit?: number }): Promise<DashboardSummary>` (monta `GET /dashboard/summary` com query opcional `latestLimit`). Re-exportar pelo `index.ts` do módulo.
  > ✅ 2026-05-18 16:27 — Criado `dashboard.api.ts` com `DashboardApiError` (codes/status, mesmo padrão de `ProcessingApiError`) e `getDashboardSummary(token, { latestLimit? })` montando a query opcional. Re-exportado pelo `index.ts` do módulo.

- [x] Criar `apps/frontend/src/modules/ideas/components/dashboard-quick-actions.component.tsx` (pode ser Server Component, é estático). Renderiza a faixa "Acesso rápido": `h2` + grid `grid-cols-1 sm:grid-cols-3 gap-3` com 3 cartões-link (`Link` do Next) para `/ideas/new`, `/idea-types/new`, `/processings/new`, ícones `lucide-react` (`Plus`/`Lightbulb`, `Tags`, `Workflow`) e `ArrowRight` discreto à direita. Visual sóbrio conforme Observação 2. Confirmar existência das rotas de criação; se faltar alguma, apontar para a listagem e anotar na evidência.
  > ✅ 2026-05-18 16:27 — Server Component estático. **Confirmado que as 3 rotas de criação existem** (`apps/frontend/src/app/(private)/ideas/new`, `/idea-types/new`, `/processings/new`) — nenhum fallback para listagem necessário. Ícones `Lightbulb`/`Tags`/`Workflow` + `ArrowRight` discreto; visual sóbrio (`rounded-xl border-white/10 bg-white/5 hover:bg-white/[0.08]`).

- [x] Criar `apps/frontend/src/modules/ideas/components/dashboard-activity-chart.component.tsx` (Client Component — usa `recharts` via `ComposedBarLineChart`). Props: `{ data: DashboardActivityPoint[]; isLoading: boolean }`. Loading → placeholder `h-[280px]` animado. Caso contrário, renderiza `ComposedBarLineChart` com `xKey="date"`, `barKey="processingsExecuted"`, `lineKey="ideasCreated"`, `barLabel="Processamentos"`, `lineLabel="Ideias criadas"`, `height={280}` e `xAxisTickFormatter` formatando `YYYY-MM-DD` → rótulo curto pt-BR. Cabeçalho `h2` "Atividade dos últimos 7 dias".
  > ✅ 2026-05-18 16:27 — Client Component conforme spec. `xAxisTickFormatter` e `tooltipLabelFormatter` formatam `YYYY-MM-DD` → `Intl.DateTimeFormat('pt-BR',{weekday:'short',day:'2-digit',timeZone:'UTC'})` (timeZone UTC p/ casar com o agrupamento UTC do backend e evitar deslocamento de dia). Cores default do componente (não customizadas). Estado vazio coberto pelo `emptyState` default do `ComposedBarLineChart`.

- [x] Criar `apps/frontend/src/modules/ideas/components/dashboard-latest-ideas.component.tsx` (Client Component). Props: `{ items: DashboardIdeaSummary[]; isLoading: boolean; hasAnyIdea: boolean }`. Cabeçalho `h2` "Últimas ideias atualizadas". Loading → 4 linhas de skeleton. `!hasAnyIdea` → `EmptyListState` "Você ainda não cadastrou nenhuma ideia." + botão "Nova Ideia" → `/ideas/new`. Vazio defensivo → "Nada para mostrar agora.". Lista → cada item linha clicável com `Link` para `/ideas/[id]/edit`, `name` (font-medium), `Badge` com `ideaTypeName`, timestamp `Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })`.
  > ✅ 2026-05-18 16:27 — Client Component conforme spec. Desvio menor: `EmptyListState` não aceita prop de botão (componente compartilhado só `title`/`subtitle`), então o botão "Nova Ideia" → `/ideas/new` é renderizado ao lado, dentro do mesmo bloco — mesmo padrão já usado em `processing-list.component.tsx`. 4 skeletons no loading; vazio defensivo "Nada para mostrar agora."; itens com `Link` p/ `/ideas/[id]/edit`, `Badge` de `ideaTypeName` e timestamp pt-BR short/short.

- [x] Criar o componente principal `apps/frontend/src/modules/ideas/components/dashboard-summary.component.tsx` (Client Component). Responsabilidades:
  - Estado: `summary: DashboardSummary | null`, `isLoading: boolean`, `errorCode: string | null`.
  - Ao montar, chama `getDashboardSummary(token)` (token do contexto de auth existente). Em erro, `toast.error(getMessage(code))` e mantém o esqueleto.
  - Renderiza, nesta ordem, com `space-y-8`:
    1. `PageSectionHeader` com `badge="Visão geral"`, `title="Dashboard"`, `subtitle="Resumo das suas ideias e processamentos."`.
    2. Grade de 3 `MetricCard` (reuso, **não** criar componente novo): **Ideias cadastradas** (`Lightbulb`, `iconColorClassName="text-amber-300/80"`), **Tipos cadastrados** (`Tags`, `text-sky-300/80`), **Processamentos executados** (`Workflow`, `text-emerald-300/80`). `value` lê de `summary.stats` quando carregado; placeholder skeleton enquanto carrega. Grade `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`.
    3. `DashboardQuickActions` (estático).
    4. `DashboardActivityChart` com `data={summary?.activity ?? []}` e `isLoading`.
    5. `DashboardLatestIdeas` com `items={summary?.latestIdeas ?? []}`, `isLoading`, `hasAnyIdea={(summary?.stats.ideasCount ?? 0) > 0}`.
  > ✅ 2026-05-18 16:27 — Client Component com estado `summary`/`isLoading`/`errorCode`. Busca via `getDashboardSummary(token)` (token do `useAuth()`); em erro `toast.error(getMessage(code))` mantendo o esqueleto. Renderiza na ordem com `space-y-8`: `PageSectionHeader` ("Visão geral"/"Dashboard"/subtítulo), grade de 3 `MetricCard` reutilizados (skeleton no `value` enquanto `summary===null`, ícones com tintura `text-amber-300/80`/`text-sky-300/80`/`text-emerald-300/80`), `DashboardQuickActions`, `DashboardActivityChart`, `DashboardLatestIdeas`.

- [x] Substituir o conteúdo de `apps/frontend/src/app/(private)/dashboard/page.tsx`: a página passa a renderizar apenas `<DashboardSummaryComponent />`. Remover o placeholder atual (`LayoutDashboard` icon + texto "Em construção."). Manter `export default function DashboardPage()` como Server Component fino — toda a lógica de dados fica no Client Component.
  > ✅ 2026-05-18 16:27 — `page.tsx` agora é Server Component fino que só renderiza `<DashboardSummaryComponent />`. Placeholder "Em construção" removido.

- [x] Rodar `cd apps/frontend && npx tsc --noEmit` e `npm run build`. Sinalizar ao usuário que a UI está pronta para conferência manual com checklist:
  - `/dashboard` autenticado → cards com skeleton na primeira carga, depois números corretos; ícones com tintura sutil (âmbar/azul/verde discretos), sem cor berrante.
  - Os números batem com `/ideas`, `/idea-types` e `/processings`.
  - Faixa "Acesso rápido" → 3 atalhos, cada um navega para a rota de criação correta.
  - Gráfico "Atividade dos últimos 7 dias" → 7 dias no eixo X, barras = processamentos, linha = ideias criadas; tooltip e legenda legíveis no tema escuro; placeholder durante a carga.
  - Lista das últimas ideias mostra até 5 itens com `updatedAt` decrescente; clicar navega para `/ideas/[id]/edit`.
  - Apagar todas as ideias → seção da lista vira `EmptyListState` "Você ainda não cadastrou nenhuma ideia." com botão "Nova Ideia" funcionando; gráfico cai no `emptyState` default.
  - `/dashboard` deslogado → redirecionamento padrão do `(private)` layout para `/login` (só confirmar que continua funcionando).
  > ✅ 2026-05-18 16:27 — `npx tsc --noEmit` ✓ limpo. `npm run build` ✓ (TypeScript ok, 13 rotas geradas, `/dashboard` incluída). Adicionada a chave i18n `dashboard.latestLimit.invalid` em `messages.pt.ts` e `messages.en.ts` (necessária para o `toast.error(getMessage(code))` do 422). **Sem verificação automatizada de UI** (padrão da spec 011): a UI está pronta para conferência manual do usuário — checklist acima a validar com backend + Postgres rodando e usuário autenticado.

### Tasks - Memória do projeto

- [x] Atualizar `.spec/memory/modulos.md` registrando o quarto agregado do módulo `ideas`: `dashboard` (somente leitura, sem persistência própria), ao lado de `idea-type`, `idea` e `processing`.
  > ✅ 2026-05-18 16:27 — Desvio: o arquivo não existia (diretório `.specs/memory/` estava vazio; caminho real é `.specs/memory/`, não `.spec/memory/`). Criado `.specs/memory/modulos.md` documentando o módulo `ideas` com os 4 agregados, marcando `dashboard` como somente leitura sem persistência própria, ao lado de `idea-type`, `idea` e `processing`.

- [x] Atualizar `.spec/memory/roadmap.md`:
  - Mover de "Evoluções futuras" para o MVP: "tela inicial com visão geral das ideias", "faixa de acesso rápido no dashboard" e "gráfico de atividade dos últimos 7 dias (janela fixa)".
  - Manter/registrar como evoluções futuras explícitas: "lista das últimas Processings no dashboard", "filtros por período e janela configurável no gráfico", "ajuste de fuso horário do usuário no agrupamento diário (hoje é UTC)", "cache de leitura do summary com invalidação por evento".
  > ✅ 2026-05-18 16:27 — Desvio: o arquivo não existia. Criado `.specs/memory/roadmap.md` com os 3 itens já no MVP (visão geral, acesso rápido, gráfico 7 dias janela fixa) e as evoluções futuras explícitas (lista de Processings, filtros/janela configurável, fuso do usuário no agrupamento diário, cache do summary). Adicionado também o item de evolução futura "índice `@@index([userId])` em `ideas`/`idea_types` se virar gargalo" (premissa da spec corrigida — só `processings` tem o índice hoje).

## Resultado Esperado

- Agregado `dashboard` criado no módulo `ideas`, contendo apenas DTOs e o caso de uso `LoadDashboardSummary` (com normalização da série de 7 dias), 100% de coverage no novo arquivo.
- Repositórios `IdeaRepository`, `IdeaTypeRepository` e `ProcessingRepository` expandidos com `countByUser`, `findLatestByUser` (Idea) e `countDailyByUser` (Idea e Processing), com fakes em memória atualizados e suíte do módulo verde.
- Implementações Prisma dos novos métodos entregues nas classes existentes, sem migration nova.
- Endpoint `GET /dashboard/summary` autenticado, isolado por `userId`, retornando `stats`, `latestIdeas` e `activity` (7 pontos), validado via `dashboard.integration.http` (incluindo isolamento de atividade e bordas do `latestLimit`).
- Página `/dashboard` no frontend transformada em visão geral real, **reutilizando** `MetricCard`, `ComposedBarLineChart`, `PageSectionHeader` e `EmptyListState`: três cards com cor sutil por ícone, faixa de acesso rápido, gráfico de atividade dos últimos 7 dias e lista das últimas ideias, com loading via skeletons e estado vazio com chamada para `/ideas/new`. Visual elegante e sóbrio, coerente com o restante do app.
- Item de menu "Dashboard" continua como primeira entrada do menu lateral.
- Memória do projeto atualizada (`modulos.md`, `roadmap.md`).
- `npm --workspace @ideias/ideas test`, `npm --workspace apps/backend run build` e (em `apps/frontend`) `npx tsc --noEmit` + `npm run build` finalizam limpos.

## Encerramento

Esta spec termina apenas quando todos os itens estiverem marcados e com evidência registrada, no formato definido em [Como executar](../../shared/como-executar.md).

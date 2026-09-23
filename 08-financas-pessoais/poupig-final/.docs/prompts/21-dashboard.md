# Lista de Tarefas

**Dashboard do mês**: a primeira tela depois do login deixa de ser o placeholder "Métrica A/B/C" e passa a mostrar o mês selecionado no cabeçalho — quanto entra, quanto sai, quanto já foi efetivado, o que está atrasado ou por vir, para onde vão as saídas (gráficos de rosca por categoria e por conta) e atalhos para as telas do dia a dia. Para quem acabou de criar a conta e ainda não tem base cadastrada, a mesma tela vira um guia de primeiros passos. De carona, **todas as telas da área privada passam a ocupar a largura inteira** do corpo do shell. É uma mudança **só de frontend**, que lê o mês inteiro pelo `GET /statement` (criado no prompt 16 e completado com as ocorrências de série no prompt 19).

## Funcionalidade

- Nome: dashboard do mês (tela inicial da área privada)
- Arquivos tocados: `apps/frontend/src/modules/transaction` (página, componentes e funções de apresentação), `apps/frontend/src/app/(private)/dashboard/page.tsx` e **só a classe do contêiner** das páginas de `account`, `credit-card`, `category` e `dev`. **Nada** em `shared/`, `modules/*`, `packages/*` ou `apps/backend/*`
- **O dashboard mora no módulo `transaction` do frontend**: ele é a leitura do movimento do mês — a mesma fonte do extrato —, e não um agrupamento por uma dimensão de cadastro. As informações de outros módulos (existência de conta e de categoria) só alimentam o guia de primeiros passos, pelos clientes HTTP que esses módulos já têm
- Blocos, nesta ordem:
  1. **Primeiros passos**, só quando falta base: criar a primeira conta, aplicar as categorias padrão e registrar a primeira transação, numerados e com `N de 3 concluídos`
  2. **Indicadores**: `Resultado previsto` (com a faixa `Resultado efetivado`), `Entradas` e `Saídas` (previsto + barra do efetivado) e `Efetivação` (anel com % e `12 de 20`)
  3. **Painéis do mês**: roscas `Gastos por categoria` e `Saídas por conta` (5 fatias + `Outras`) e `Pendências` (`Atrasadas` e `Próximas`, com atalho para o extrato)
  4. **Atalhos**: `Extrato Mensal`, `Contas`, `Cartões` e `Categorias`
  5. **Aviso de corte**, só quando o mês chega a 500 entradas
- A **referência é o mês selecionado** no `MonthPicker` do cabeçalho: trocar o mês no topo refaz o dashboard. A tela **não** tem seletor de mês próprio
- **Não há backend novo**: o `GET /statement` devolve o mês inteiro em uma resposta, então as somas no cliente são corretas — ao contrário do prompt 16, quando a lista ainda era paginada
- O item de menu `Dashboard` já é o primeiro do `NAVIGATION_SECTIONS` e a rota `/dashboard` já é o destino do login: **menu e rota não mudam**

## Contexto Atual (verificado no código)

> Estado real do repositório na abertura desta mudança — usar como ponto de partida, não repetir o que já existe.

- **Pré-requisito: os prompts 15 a 19 precisam estar concluídos.** O que eles entregam e esta mudança reaproveita:
  - Prompt 16: `useSelectedMonth()` (`selectedMonth`, `monthStart`/`monthEnd` em `YYYY-MM-DD`, `monthLabel`, `isCurrentMonth`), o `MonthPicker` no cabeçalho, `shared/util/month.util.ts` e o `NAVIGATION_SECTIONS` com a seção `main` sem label (`Dashboard` em `/dashboard` com `LayoutDashboard`, e `Extrato Mensal` em `/transactions` com `ReceiptText`) e a seção `registrations` (`Contas` em `/accounts` com `Wallet`, `Cartões` em `/cards` com `CreditCard`, `Categorias` em `/categories` com `Tags`) e, por último, a seção `extras` (`Desenvolvimento` em `/dev`), incluída só quando `DEV_TOOLS_ENABLED` é verdadeiro (prompt 17)
  - Prompt 19 — **a fonte desta tela**: `GET /statement` com `from`/`to` obrigatórios e filtros opcionais, devolvendo `PaginatedResultDTO<StatementEntryDTO>` com o mês inteiro (`page: 1`, `totalPages: 1`, `pageSize` igual a `STATEMENT_MAX_ENTRIES = 500`): transações avulsas, ocorrências de série gravadas e ocorrências geradas em memória, ordenadas por `expectedOn` desc. `StatementEntryDTO` traz `id`, `kind` (`TRANSACTION`/`SCHEDULED`), `name`, `value` (reais, positivo), `direction` (`IN`/`OUT`), `accountName`, `creditCardName`, `subcategoryName`, `categoryName`, `status` (`PENDING`/`SETTLED`/`CANCELED`), `expectedOn`, `settledOn` e o bloco da série (`seriesName`, `seriesKind`, `occurrenceIndex`, `installments`). Ocorrência gerada é sempre `PENDING`. `STATEMENT_MAX_ENTRIES` é exportado por `@poupig/transaction`
  - Prompt 19, no frontend do módulo `transaction`: `data/statement-api.client.ts` (`listStatement`), `data/use-statement.ts` (`useStatement(params: ListStatementParams)` → `{ entries, total, isLoading, error, refresh }`, sem `any` e sem `setState` síncrono em `useEffect`), `data/statement-format.ts` (`formatDateOnly` em `dd/MM/yyyy` e `formatDayLabel`, montados **sem fuso**), `data/transaction.labels.ts` (`DIRECTION_LABELS`, `TRANSACTION_STATUS_LABELS`), `data/group-statement-entries.ts` (função pura de apresentação, com `UNCLASSIFIED_GROUP_LABEL = 'Sem classificação'`), `components/statement-item-parts.component.tsx` (`TransactionAmount` — valor com sinal e cor pela direção via `formatCurrency` — e `RecurrenceSign` — `Repeat` com a série no tooltip e `3/12` em `CLOSED`) e `pages/monthly-statement.page.tsx`. O extrato abre em `/transactions`, com lista e formulários como **modos da mesma página** — nenhum registro é endereçável por URL
  - Prompt 15: `shared/components/ui/money-input.tsx` (`formatCurrency`) e o helper **privado** `getTodayDateOnly()` (data local em `YYYY-MM-DD`), repetido em `components/transaction-form.component.tsx` e `components/transaction-series-form.component.tsx`
- **Armadilha do `useStatement`**: `params` está nas dependências do `useEffect` do hook. Um objeto literal novo a cada render (`useStatement({ from, to })`) refaz a requisição a cada render e entra em loop infinito (resposta → `setState` → render → objeto novo → nova requisição). O extrato evita isso montando os parâmetros em `useMemo` (`monthly-statement.page.tsx`)
- Verificado no código atual:
  - **`/dashboard` é a tela inicial da área privada**: `modules/auth/components/auth-form.component.tsx` faz `router.push('/dashboard')` depois do login, `HOME_ROUTE = '/dashboard'` alimenta o logo e o início do `SidebarMenu` em `app/(private)/layout.tsx`, o `AdminShell` tem `logoHref = '/dashboard'` por padrão e a landing (`app/page.tsx`) aponta para lá
  - `app/(private)/dashboard/page.tsx` é um placeholder com conteúdo inline (não delega para módulo): título `Dashboard`, subtítulo "Visão geral da aplicação." e três `Card` (`Métrica A/B/C`) com `—`, mais o comentário "Substitua os cards por widgets reais"
  - `shared/components/ui` tem `metric-card.tsx` e `navigation-link-card.tsx` (visual fixo: cartão alto e centralizado, sem espaço para medidor, anel ou layout horizontal), `pie-breakdown-chart.tsx` (paleta cíclica de verdes, legenda do `recharts` sem valores, raios fixos), `page-section-header.tsx`, `section-header.tsx` (`SectionHeader`: `badge?`, `title`, `subtitle?`, `aside?`, `divider?`), `card.tsx` (`Card`, `CardHeader`, `CardTitle`, `CardContent`, `CardFooter`), `badge.tsx` (variantes só `default`, `secondary` e `outline` — **não há** variante de alerta; tom de alerta vem por `className`, como o `STATUS_BADGE_CLASSES` de `statement-item-parts.component.tsx`), `button.tsx`, `empty-list-state.tsx` e `form-skeleton.tsx`, e `lucide-react` tem os ícones do menu
  - `recharts` 3.9 já está instalado; `shared/util/month.util.ts` exporta `MONTH_SHORT_LABELS` (`jan` … `dez`). O app é só escuro (`--background` ≈ `#020817`, cards `zinc-900` ≈ `#18181b`)
  - **Layout em caixa**: o `<main>` do `AdminShell` já tem `p-4 md:p-6` e nenhuma largura máxima, mas cada página privada repete `mx-auto max-w-{3xl|4xl|6xl} px-4 py-6` (margem dupla e larguras diferentes). Todos os formulários usam `FormSectionLayout`, que limita os campos a `max-w-2xl`
  - `useAuth` (com `token`) é exportado por `modules/auth/data/auth.context.tsx` — `modules/auth/data/use-auth.ts` só tem o `useRegister`
  - Também existem, vindos do scaffold e **sem nenhum consumidor**: `dashboard-breakdown-card.tsx` e `dashboard-ranking-list-card.tsx` (contrato de **janela de meses** — `selectedMonths`, botão `onRefresh` e seletor de limite) e `shared/constants/dashboard.constants.ts` (`DASHBOARD_PERIOD_OPTIONS` "Últimos N meses", `DASHBOARD_RANKING_LIMIT_OPTIONS`)
  - Clientes dos cadastros: `listAccounts(token, page, pageSize)` em `modules/account/data/account-api.client.ts` (resposta com `total`) e `listCategories(token)` em `modules/category/data/category-api.client.ts` (lista completa, com `isActive`). As categorias padrão são aplicadas pelo botão "Aplicar categorias padrão" da tela `/categories`
  - Lint: o frontend **já falha com 88 erros** e o backend **com 58 erros e 1 aviso** antes desta mudança; o script `lint` do backend roda `--fix`. A verificação usa `npx eslint` **sem `--fix`**, só nos arquivos tocados. O frontend não tem suíte de testes
  - O monorepo usa **npm** + Turbo, não pnpm

## Decisões (fechar antes de codar, para não abrir discussão no meio)

- **Por que esta mudança vem depois dos prompts 19 e 20**: o 19 é o ponto mais cedo em que um dashboard do mês fica correto sem ser refeito. Antes do prompt 16 não existe mês selecionado; entre o 16 e o 19 a única fonte é o `GET /transactions`, paginado — somar no cliente daria número errado, e um endpoint de resumo criado ali teria de ser reescrito no 19 para incluir as ocorrências de série. Depois do 19, o `GET /statement` já responde o mês inteiro com tudo, e o dashboard sai sem nenhuma linha de backend. E, vindo depois do gerador de massa de dados (prompts 17 e 20), ele já nasce sobre meses de transações avulsas e de ocorrências gravadas — e antes dos relatórios (prompts 22 a 24)
- **O dashboard é do mês selecionado**, e não uma janela de "últimos N meses": evolução ao longo do tempo é assunto dos relatórios. É também por isso que os componentes `DashboardBreakdownCard`/`DashboardRankingListCard` e o `dashboard.constants.ts` do scaffold **não** são reaproveitados — o contrato deles é de janela de meses com botão de atualizar — e continuam como estão
- **Fonte única: `useStatement` sobre o mês**. Os números do dashboard são exatamente os do extrato daquele mês, inclusive as ocorrências de série ainda não gravadas. Nenhuma requisição nova para os indicadores
- **Previsto e efetivado são dois números, e os dois aparecem**: *previsto* soma `PENDING` + `SETTLED`; *efetivado* soma só `SETTLED`. `CANCELED` fica fora de **toda** soma, lista e contagem. Os rótulos dizem qual é qual — é o que evita o usuário comparar o dashboard (que inclui o previsto) com um relatório (que só soma o que está gravado) e achar um erro
- **As somas no cliente são corretas, com uma ressalva visível**: a resposta é o mês inteiro, limitado a `STATEMENT_MAX_ENTRIES`. Quando `entries.length` chega ao teto, um aviso discreto diz que os indicadores consideram as primeiras 500 transações do mês — nada é somado em silêncio sobre um conjunto cortado
- **"Hoje" é a data local do navegador em `YYYY-MM-DD`**, o mesmo critério do `expectedOn` padrão do formulário de transação: o dashboard é a visão do usuário, no dia dele. `Atrasadas` são as `PENDING` com `expectedOn` antes de hoje; `Próximas` são as `PENDING` de hoje em diante. Num mês passado tudo o que está pendente é atrasado; num mês futuro, tudo é próximo — e está certo assim
- **Pendências mostram poucas linhas e apontam para o extrato**: até 5 por grupo, em ordem de `expectedOn` crescente (a mais urgente primeiro), com a contagem do restante. Clicar em uma pendência leva ao extrato (`/transactions`), já no mesmo mês, porque o extrato não tem endereço por registro; abrir o formulário da transação direto do dashboard fica fora de escopo
- **Saídas em roscas, por categoria e por conta**: parte do todo de um mês, com no máximo 6 fatias — as 5 maiores com nome e o resto somado em `Outras` (sempre a última), para as fatias fecharem 100% do total do centro. Sem categoria vira `Sem classificação` (o `UNCLASSIFIED_GROUP_LABEL` do extrato). A efetivação **não** é pizza de duas fatias: é um anel de valor único
- **Cores validadas, não escolhidas no olho**: ordem fixa por posição `#3987e5`, `#d95926`, `#199e70`, `#c98500`, `#d55181` e o neutro `#475569` em `Outras` — validadas como anel contra o fundo escuro (vizinhas distinguíveis com daltonismo). A legenda sempre nomeia cada fatia com valor e percentual, então a cor nunca é a única pista. A cor cadastrada da categoria fica de fora (o DTO não a traz) e é assunto dos relatórios
- **Cards próprios com uma superfície comum**: `MetricCard` e `NavigationLinkCard` não comportam medidor, anel nem card horizontal, e o `PieBreakdownChart` não tem paleta validada nem destaque sincronizado; nenhum deles é alterado. Todos os cards do dashboard usam o mesmo gradiente escuro do `MetricCard` por uma constante do módulo
- **Largura total em toda a área privada**: o contêiner raiz de cada página vira `w-full` e o espaçamento fica só no `<main>` do shell, alinhando todas as telas. Os campos seguem limitados pelo `FormSectionLayout`. Landing e login não mudam
- **Primeiros passos aparecem só quando falta base**, e somem sozinhos quando ela existe: sem conta cadastrada; sem nenhuma categoria ativa; ou mês sem nenhuma transação. Cada passo é um link para a tela que resolve (`/accounts`, `/categories`, `/transactions`) e mostra se já está feito. A contagem vem dos clientes que os módulos `account` e `category` já têm; se essa leitura falhar — ou se o extrato ainda carrega ou falhou, já que o terceiro passo depende dele —, o guia simplesmente não aparece: ele é ajuda, não bloqueio. Não há "dispensar" gravado no navegador
- **Toda conta sai de funções puras**, em um arquivo de apresentação do módulo: nenhum componente soma, filtra, agrupa ou ordena. É o mesmo desenho do `group-statement-entries.ts` do extrato
- **"Hoje" fica no arquivo de apresentação do dashboard**: o helper equivalente já existe duas vezes, privado, nos formulários de transação e de série. Como esta mudança não sai de `apps/frontend/src/modules/transaction` e não altera os formulários, o `todayDateOnly()` exportado nasce em `dashboard-summary.ts`, com o mesmo algoritmo. Unificar os três num utilitário compartilhado fica fora de escopo
- **A tela é de leitura**: nenhum dado é criado ou alterado a partir do dashboard
- **Menu e rota não mudam**: `Dashboard` já é o primeiro item e `/dashboard` já é o destino do login e do logo. A rota passa a só delegar para a página do módulo, como as outras rotas do grupo

## Frontend

> Executar na ordem. Cada passo só depende dos anteriores.

1. **Funções de apresentação** (`modules/transaction/data/dashboard-summary.ts`), puras, sem React:
   - `DASHBOARD_PENDING_LIMIT = 5`, `DASHBOARD_BREAKDOWN_LIMIT = 5` e `OTHERS_SLICE_LABEL = 'Outras'`, documentados
   - `todayDateOnly(): string` — data local do navegador em `YYYY-MM-DD`, montada a partir de ano/mês/dia com padding (nunca `toISOString()` sobre um `Date` local)
   - `summarizeMonth(entries: StatementEntryDTO[]): MonthSummary` — `inflow`, `outflow` e `expectedResult` (previsto: `PENDING` + `SETTLED`), `settledInflow`, `settledOutflow` e `settledResult` (só `SETTLED`), `settledCount` e `activeCount` (todas as não canceladas). `CANCELED` fora de tudo
   - `splitPending(entries, today): { overdue: PendingGroup; upcoming: PendingGroup }` — `PendingGroup = { items: StatementEntryDTO[]; remaining: number }`, só `PENDING`, `overdue` com `expectedOn < today` e `upcoming` com `expectedOn >= today`, cada grupo em ordem de `expectedOn` crescente (desempate por nome) e cortado em `DASHBOARD_PENDING_LIMIT`
   - `breakdownOutflow(entries, dimension: 'category' | 'account', limit): { slices: OutflowSlice[]; totalOutflow }` — `OutflowSlice = { key; label; total; share; isOthers }`, somando `OUT` não canceladas por `categoryName ?? UNCLASSIFIED_GROUP_LABEL` ou por `accountName`, ordenado por `total` decrescente (desempate por rótulo); os primeiros `limit` com nome e o resto numa fatia `Outras`, só quando soma mais que zero
   - `shareOf(part, whole)` — fração limitada a 1 e `0` sem total, usada por fatias, medidores e anel
   - `isStatementTruncated(entries): boolean` — `entries.length >= STATEMENT_MAX_ENTRIES` (importado de `@poupig/transaction`)
2. **Guia de primeiros passos** (`modules/transaction/data/use-dashboard-onboarding.ts`): carrega uma vez, com o token do `useAuth` (`modules/auth/data/auth.context`), `listAccounts(token, 1, 1)` (usa o `total`) e `listCategories(token)` (conta as ativas), sem `any` e sem `setState` síncrono em `useEffect` (estado gravado só no retorno da promessa). Expõe `{ status: 'loading' | 'ready' | 'unavailable'; hasAccounts; hasActiveCategories }`; qualquer falha vira `unavailable`, sem mensagem de erro na tela. Não altera nenhum arquivo dos módulos `account` e `category`
3. **Superfície** (`components/dashboard-card.styles.ts`): `DASHBOARD_CARD_CLASSES` com o gradiente, borda e brilho interno do `MetricCard`, usado por todos os cards abaixo
4. **Indicadores** (`components/dashboard-summary.component.tsx`): grade `sm:grid-cols-2 xl:grid-cols-4` com um card interno (título, ícone tingido e brilho por tom verde/vermelho/azul) — `Resultado previsto` colorido pelo sinal com a faixa `Resultado efetivado`; `Entradas` e `Saídas` com o previsto, `previsto no mês` e um medidor (`role="meter"`) com `Efetivado R$ …` e % via `shareOf`; `Efetivação` com anel em SVG (`strokeDashoffset`, `role="progressbar"`, % no centro) e `N de M transações efetivadas`
5. **Pendências** (`components/dashboard-pending.component.tsx`): card `Pendências` com `TooltipProvider` e grupos lado a lado a partir de `@2xl` (`@container`); cabeçalho de grupo com ícone e contagem em pílula (vermelha em `Atrasadas` > 0); linha como `Link` para `/transactions` com selo de dia e mês (`split('-')` + `MONTH_SHORT_LABELS`, sem fuso), nome, conta, `TransactionAmount` e `RecurrenceSign`; `e mais N`; grupo vazio com texto curto (`Nada atrasado neste mês` / `Nada por vir neste mês`); rodapé `Ver no extrato`
6. **Rosca** (`components/dashboard-breakdown-chart.component.tsx`): `title`, `description`, `slices`, `totalOutflow`, `emptyText`, `icon`. `PieChart` do `recharts` em 208px (`innerRadius="68%"`, `paddingAngle` 2, `cornerRadius` 4) com as cores da decisão; centro com `Total` ou rótulo, valor e `N% das saídas` da fatia ativa; legenda HTML (cor, rótulo, valor, %) com hover/foco sincronizado com o hover da fatia (demais a 35%); gráfico e legenda lado a lado a partir de `@md`; sem fatias, `emptyText`
7. **Atalhos e primeiros passos**: `dashboard-shortcuts.component.tsx` com a seção `Atalhos` em quatro cards horizontais (ícone do menu em quadrado tingido, título, descrição de uma linha e seta) para `/transactions`, `/accounts`, `/cards` e `/categories`; `dashboard-onboarding.component.tsx` com `Primeiros passos`, `N de 3 concluídos` e passos em `md:grid-cols-3` com título e descrição — pendente é `Link` numerado, feito tem check e título riscado; devolve `null` com os três feitos
8. **Página** (`modules/transaction/pages/month-dashboard.page.tsx`, `MonthDashboardPage`):
   - `PageSectionHeader` com badge `Dashboard`, título com o `monthLabel` e subtítulo curto ("Visão geral do mês selecionado")
   - busca pelo `useStatement(params)`, sem filtros, com `params` montado em `useMemo(() => ({ from: monthStart, to: monthEnd }), [monthStart, monthEnd])` — **nunca** um objeto literal na chamada (ver a armadilha em Contexto Atual); as funções do passo 1 recebem as entradas e `todayDateOnly()` em `useMemo`
   - ordem do corpo: primeiros passos (quando houver) → indicadores → painéis em `xl:grid-cols-12` (roscas `Gastos por categoria` e `Saídas por conta` em `xl:col-span-6 2xl:col-span-4`, pendências em `xl:col-span-12 2xl:col-span-4`, cada um com `min-h-96`) → atalhos → aviso de corte (só quando `isStatementTruncated`)
   - carregando: esqueleto com as mesmas grades e alturas, **sem** trocar a altura da tela a cada troca de mês; erro: `Não foi possível carregar o mês.`, a mensagem em cor legível (`text-rose-300`, não `destructive`) e `Tentar de novo` (`refresh`), mantendo os atalhos; o guia só aparece com o extrato carregado sem erro
   - mês sem nenhuma transação: indicadores zerados, anel em `0%`, roscas com seus textos de mês sem saídas, grupos de pendência com seus textos curtos e o passo `Registrar a primeira transação` pendente — nunca uma tela vazia
9. **Rota** (`apps/frontend/src/app/(private)/dashboard/page.tsx`): substituir o placeholder inline por uma rota que só delega para a `MonthDashboardPage`, como `app/(private)/cards/page.tsx` faz. Sem guard na página: a proteção já está no layout do grupo `(private)`
10. **Barris**: exportar os arquivos novos em `modules/transaction/data/index.ts` e `modules/transaction/index.ts`
11. **Largura total**: trocar o contêiner raiz `mx-auto max-w-* px-4 py-6` por `w-full` (mantendo `space-y-6` onde houver) no dashboard, nos cinco modos de `monthly-statement.page.tsx`, em `accounts.page.tsx`, `credit-cards.page.tsx`, `categories.page.tsx` (lista e formulário) e `data-generator.page.tsx`
12. **Fechar a mudança**:
    - `npm run build` verde no workspace
    - `npx eslint` **sem `--fix`** nos arquivos criados sem nenhum erro — os pré-existentes continuam (inclusive o `any` de `accounts.page.tsx`)
    - Diff limitado a `apps/frontend/src/modules/transaction`, `apps/frontend/src/app/(private)/dashboard/page.tsx` e à classe do contêiner das páginas do passo 11

## Fora de Escopo

- Qualquer alteração de backend, domínio, banco, menu ou rota
- Evolução ao longo do tempo (linhas e barras por mês) e cor cadastrada da categoria nos gráficos: são os relatórios dos prompts 22 a 24
- Janela de "últimos N meses", seletor de período próprio e comparação com o mês anterior
- Saldo de conta, saldo acumulado, fatura e limite de cartão, metas e orçamento por categoria
- Abrir o formulário de uma transação ou de uma ocorrência direto do dashboard (o extrato não tem endereço por registro), e efetivar pendências a partir do dashboard
- Widgets configuráveis, arrastáveis ou escondidos pelo usuário, e gravar qualquer preferência do dashboard no navegador
- Dispensar o guia de primeiros passos manualmente
- Reaproveitar, alterar ou remover `MetricCard`, `NavigationLinkCard`, `PieBreakdownChart`, `DashboardBreakdownCard`, `DashboardRankingListCard` e `dashboard.constants.ts`, e mudar a largura das telas públicas (`/`, `/join`)
- Os dashboards de scaffold dos módulos (`/account`, `/category`, `/credit-card`, `/auth`)
- Notificações, lembretes de vencimento e alertas por e-mail
- Corrigir os erros de lint pré-existentes
- Unificar o helper de data de hoje dos formulários de transação e de série com o do dashboard

## Pasta do Módulo

- Rota: `apps/frontend/src/app/(private)/dashboard/page.tsx`
- Página: `apps/frontend/src/modules/transaction/pages/month-dashboard.page.tsx`
- Componentes: `apps/frontend/src/modules/transaction/components` (`dashboard-card.styles.ts`, `dashboard-summary.component.tsx`, `dashboard-breakdown-chart.component.tsx`, `dashboard-pending.component.tsx`, `dashboard-shortcuts.component.tsx`, `dashboard-onboarding.component.tsx`)
- Ger. de Estado e apresentação: `apps/frontend/src/modules/transaction/data` (`dashboard-summary.ts`, `use-dashboard-onboarding.ts`)

## Instruções

- O código deverá ser escrito em inglês, usando os termos da linguagem ubíqua (`Direction` `IN`/`OUT`, `TransactionStatus` `PENDING`/`SETTLED`/`CANCELED`, `ScheduledTransaction`, `TransactionSeries`)
- A especificação deverá ser escrita em português do brasil
- Concluir antes os prompts 15 a 19
- Reaproveitar o que já existe (`useSelectedMonth`, `useStatement`, `STATEMENT_MAX_ENTRIES`, `statement-format.ts`, `transaction.labels.ts`, `UNCLASSIFIED_GROUP_LABEL`, `TransactionAmount`, `RecurrenceSign`, `MONTH_SHORT_LABELS`, `formatCurrency`, `useAuth`, `listAccounts`, `listCategories`, `recharts`, `PageSectionHeader`, `Card`, `Button`, `FormSectionLayout`), sem duplicar e sem criar caminho paralelo
- Não criar endpoint, consulta, hook de mês nem cliente HTTP novos: tudo o que o dashboard precisa já existe
- Nada de aritmética de data com fuso: datas comparadas e lidas como `YYYY-MM-DD` e formatadas pelo `statement-format.ts`
- Paleta dos gráficos validada (vizinhas distinguíveis com daltonismo), nunca escolhida no olho
- Nada de `setState` síncrono em `useEffect` e nada de `any`
- Executar a mudança em um único sub agente (é só frontend)
- Garantir no final o build do projeto funcionando e nenhum erro de lint novo nos arquivos tocados (o frontend não tem suíte de testes)
- Não executar teste via Web Browser (farei testes manuais)

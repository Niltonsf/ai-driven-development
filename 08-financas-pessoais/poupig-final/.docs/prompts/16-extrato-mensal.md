# Lista de Tarefas

Transformar a tela de transações em **extrato mensal**, já na forma final: criar o estado global de **mês selecionado** (com o seletor no cabeçalho do shell), reorganizar o menu e entregar a tela do extrato com uma identidade só no topo, lista sem card em volta, filtros em pílulas num painel que abre e fecha (inclusive por cartão), agrupamento configurável, duas visualizações (tabela e cards), efetivação em um clique na própria linha e as escolhas guardadas no navegador. O mês global nasce aqui com o extrato como primeiro consumidor, e depois alimenta o dashboard e os relatórios (prompts 21 a 24).

## Funcionalidade

- Nome: extrato mensal + seleção global de mês — quase toda frontend, com **dois filtros de cartão** e **teto de página 100** no endpoint de listagem
- Arquivos tocados: `apps/frontend/src/shared` (utilitário de mês, contexto, hook, seletor, slot do shell, pílula de filtro e i18n), `apps/frontend/src/modules/transaction` (tela do extrato, o grosso), `app/(private)/layout.tsx` e `app/(private)/transactions/page.tsx`, `modules/transaction/src/transaction/provider` (dois campos opcionais no `ListTransactionsInput`) e `apps/backend/src/modules/transaction` (query params, `where` e teto de página)
- Entregas, em duas partes e nesta ordem:
  - **Parte A — mês global e menu**
    1. **Mês selecionado como estado global** da aplicação: um contexto no grupo `(private)` que guarda ano + mês e deriva o período (`YYYY-MM-DD` inicial e final) que os consumidores usam como filtro
    2. **Seletor de mês** no cabeçalho do shell, ao lado do botão de colapsar o menu: dropdown customizado com escolha rápida de mês e ano e atalho para o mês atual
    3. **Reorganização do menu**, com a estrutura final `Dashboard` · `Extrato Mensal` · label `Cadastros` (`Contas`, `Cartões`, `Categorias`)
  - **Parte B — tela do extrato**
    4. **Extrato do mês**: a tela de transações mostra sempre o mês selecionado, sem filtro de período na tela
    5. **Uma identidade só**: um cabeçalho (badge `Extrato Mensal` + mês), linhas direto na página, sem `TableCard` em volta
    6. **Painel de filtros retrátil com pílulas** (nada de combo box): **Direção**, **Situação**, **Conta** e **Cartão**, aberto e fechado por um botão `Filtros` que mostra quantos estão ativos
    7. **Agrupamento configurável**: por data (padrão), conta, categoria ou subcategoria
    8. **Duas visualizações**: linha de tabela (densa, para desktop) e card (maior, pensado para o mobile)
    9. **Linha clicável e efetivação em um clique**: clicar na linha/card abre o formulário daquela transação — as ações saem da lista — e um check no início da linha marca a transação como **efetivada** (`SETTLED`)
    10. **Preferências no navegador**: visualização, agrupamento, filtros aplicados e painel aberto/fechado voltam como o usuário deixou
- A **rota continua `/transactions`** (lista e formulário na mesma página, como no prompt 15): muda o rótulo do menu, o título da tela e a apresentação — não a URL
- Saem do menu os itens `Autenticação` (`/auth`) e `Categorias` do grupo principal (`/category`, dashboard de scaffold do módulo). As rotas e páginas **continuam existindo**: esta mudança só desliga os atalhos. O item `Transações` **não** vira um segundo item: é substituído pelo `Extrato Mensal`, que aponta para a mesma rota
- O trabalho de backend é só: filtro por cartão (o endpoint não sabe filtrar por `creditCardId` nem por "só o que passou em cartão", e filtrar no cliente daria resposta errada numa lista paginada) e teto de `pageSize` 100 **só** no `TransactionController`. Nada de endpoint novo, entidade nova ou migração
- **Efetivar não ganha endpoint próprio**: `PUT /transactions/:id` já atualiza, e o `TransactionDTO` da linha carrega todos os campos do `SaveTransactionInput`
- Vocabulário da tela alinhado à linguagem ubíqua e aos rótulos de `transaction.labels.ts`: o filtro de `direction` se chama **Direção** (Entrada/Saída) e o de `status` se chama **Situação** (Pendente/Efetivada/Cancelada)

## Contexto Atual (verificado no código)

> Estado real do repositório na abertura desta mudança — usar como ponto de partida, não repetir o que já existe.

- **Pré-requisito: o prompt `15-transacao-base-crud.md` precisa estar concluído.** Esta mudança **adapta** a tela e o endpoint que ele entrega, não os reescreve:
  - `modules/transaction/src/transaction/provider`: `ListTransactionsQuery` com `ListTransactionsInput extends PaginatedInputDTO` (`userId`, `search?`, `direction?`, `status?`, `accountId?`, `expectedFrom?`, `expectedTo?`)
  - `apps/backend/src/modules/transaction/transaction.prisma.ts`: `listTransactions` monta o `where` filtro a filtro ("ausente é sem filtro"), sempre com `userId` e `deletedAt: null`, ordena por `expectedOn` desc e `createdAt` desc, e roda `findMany` + `count` em `Promise.all`
  - `apps/backend/src/modules/transaction/transaction.controller.ts`: `GET /transactions` com `page` (mínimo 1), `pageSize` (padrão `10`, teto `50`), `search`, `direction`, `status`, `accountId`, `expectedFrom` e `expectedTo`; `PUT /transactions/:id` atualiza pelo `SaveTransaction` (respondendo `{ id }`); `DELETE /transactions/:id` exclui logicamente. **Não** aceita nada de cartão. Existe `transaction.integration.http`
  - `data/transaction-api.client.ts`: `listTransactions(token, params)` com `ListTransactionsParams` (página + `search`, `direction`, `status`, `accountId`, `expectedFrom`, `expectedTo`; só coloca na query string o filtro informado) e resposta `PaginatedResultDTO` (`{ data, meta }`), `createTransaction`, `updateTransaction(token, id, input)`, `deleteTransaction`, `SaveTransactionInput` e `TransactionDTO` com `name`, `note`, `value`, `direction`, `accountId`/`accountName`, `creditCardId`/`creditCardName`, `subcategoryId`/`subcategoryName`, `categoryName`, `status`, `expectedOn` e `settledOn` — o agrupamento e a efetivação **não precisam de nenhum campo novo**
  - `data/use-transactions.ts`: `useTransactions(page, pageSize, filters)` (estado gravado só no retorno da promessa, resposta obsoleta descartada, recarga por contador), `useSaveTransaction`, `useDeleteTransaction` e `useTransactionOptions` (contas e cartões ativos numa página de 50, subcategorias agrupadas pela categoria). É a fonte das pílulas de conta e de cartão — **não** criar outro carregamento
  - `data/transaction.labels.ts`: `DIRECTION_LABELS` (`Entrada`/`Saída`) e `TRANSACTION_STATUS_LABELS` (`Pendente`/`Efetivada`/`Cancelada`)
  - `pages/transactions.page.tsx` (`TransactionsPage`): alterna `mode: 'list' | 'form'`, com barra de filtros em estado local (busca, direção, status, conta e período), `PAGE_SIZE = 10`, `PaginationControls`, volta para a página 1 ao trocar filtro e o fluxo de exclusão com `DeleteConfirmationDialog`; no modo formulário, o `TransactionFormComponent` cria ou edita
  - `components/transaction-list.component.tsx`: `TableCard` + `Table`, data `dd/MM/yyyy` montada a partir da string `YYYY-MM-DD` **sem fuso**, valor com `formatCurrency` (sinal e cor por direção), status em `Badge`, ações de editar e excluir, `EmptyListState`
  - `components/transaction-form.component.tsx` (`TransactionFormComponent`): criar/editar, com `expectedOn` no dia de hoje ao criar. **Não tem exclusão**: hoje o único caminho para excluir é o botão da lista, então tirar as ações da lista exige mover a exclusão
  - `app/(private)/transactions/page.tsx` só delega para `TransactionsPage`; `shared/components/ui/money-input.tsx` exporta `formatCurrency`
- **Não existem** `usePaginatedList`, `routes.ts`, as rotas `/transactions/novo` e `/transactions/[id]`, pílula de filtro nem grupo de botões segmentado
- `shared/context/shell.context.tsx` + `shared/hooks/shell.hook.ts` são o **padrão de contexto global**: provider `'use client'`, contexto `null` por padrão, `useCallback` nas ações, `useMemo` no value, `useShellContext` lançando com `getMessage('SHELL_CONTEXT_PROVIDER_REQUIRED')` e um hook fino (`useShell`) reexportando. `ShellProvider.isMobile` começa `false` e só é resolvido em `useEffect` (breakpoint `1024`, constante `MOBILE_BREAKPOINT` não exportada): **não** serve para decidir um padrão no primeiro render
- `getMessage(key, { locale?, params? })` vem de `shared/i18n`; a chave `SHELL_CONTEXT_PROVIDER_REQUIRED` existe em `messages.pt.ts` e `messages.en.ts`
- `shared/template/admin-shell.component.tsx` tem o cabeçalho `sticky top-0 h-16` com o botão de colapsar (`Button variant="ghost" size="icon"`, ícone `Menu`, `aria-label="Alternar menu lateral"`) dentro de `flex min-w-0 items-center gap-3` à esquerda e o dropdown do usuário à direita. As props são `sidebar`, `children`, `logoIcon`, `logoText`, `logoHref`, `userName`, `userEmail`, `userAvatarUrl`, `profileHref` e `onLogout`: **não** existe slot para conteúdo extra no cabeçalho
- `shared/components/ui/sidebar-menu.component.tsx`: `SidebarMenuSection` tem `label` opcional, e o label **some quando o menu está colapsado**. Nada a mudar nele: a reorganização é dado, não código
- `app/(private)/layout.tsx` é `'use client'` e monta `AuthGuard` → `ShellProvider defaultOpen` → `AdminShell` com `sidebar={<SidebarMenu sections={NAVIGATION_SECTIONS} homeHref={HOME_ROUTE} />}`. O `AuthProvider` fica no layout raiz (`app/layout.tsx`). `NAVIGATION_SECTIONS` tem hoje:
  - seção `main` (label `Navegação`): `dashboard` (`/dashboard`, `LayoutDashboard`), `auth` (`/auth`, `Fingerprint`), `category` (`/category`, `Tags`) e `transaction` (`/transactions` depois do prompt 15, `ArrowRightLeft`)
  - seção `registrations` (label `Cadastros`): `accounts` (`/accounts`, `Wallet`), `cards` (`/cards`, `CreditCard`) e `categories` (`/categories`, `Tags`)
  - O comentário do arquivo registra que **caminho de navegação é estado da aplicação e vive no layout, não em `shared/`**
- O `AuthGuard` devolve `null` enquanto não há usuário, e o estado de autenticação é lido por inicializador lazy do `useState` (`readAuthFromCookies`). O shell e as rotas privadas só renderizam no cliente com usuário resolvido
- `shared/hooks/use-local-storage.hook.ts`: `useLocalStorage(key, initialValue, { serialize?, deserialize? })` devolve `[value, setValue, removeValue]`, lê o `localStorage` **de forma síncrona** no inicializador lazy do `useState`, devolve `initialValue` fora do navegador ou quando a leitura/`deserialize` falha e ignora falha de escrita. Como o grupo `(private)` só renderiza no cliente, as preferências já estão disponíveis no primeiro render — **não** há risco de hidratação nem necessidade de `isReady`
- `shared/components/ui/popover.tsx` exporta `Popover`, `PopoverTrigger`, `PopoverContent` e `PopoverArrow`, e é o que o `date-picker-input.tsx` usa (`open`/`onOpenChange` controlados, `PopoverTrigger asChild`). É a base do seletor de mês — **não** usar `Combobox` (lista com busca) nem `Calendar` (seleção de dia)
- `date-fns` (`^4.4.0`) com o locale `ptBR` já é usado no `date-picker-input` (`format`, `parseISO`). `lucide-react` (`^1.21.0`) tem `ReceiptText`, `SlidersHorizontal`, `List`, `LayoutGrid`, `Check`, `CircleCheck` e `Trash2`
- `shared/components/ui` tem `table.tsx` (`Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`), `page-section-header.tsx` (`PageSectionHeader` com `badge`, `title`, `subtitle?`, `aside?`), `tooltip.tsx` (`Tooltip`, `TooltipTrigger`, `TooltipContent` e `TooltipProvider` — o tooltip precisa de um `TooltipProvider` acima; o `SidebarMenu` monta o seu próprio), `button`, `badge`, `card`, `checkbox`, `separator`, `input`, `combobox`, `tabs`, `pagination-controls`, `empty-list-state`, `delete-confirmation-dialog` e `form-error-message`. `toast` vem de `sonner`
- `shared/util/` tem só `color.util.ts`; o `cn` está em `shared/lib/class-name.util.ts`
- `app/(private)/dashboard/page.tsx` é placeholder (três cards com `—`) e **não** consome período
- O frontend **não tem suíte de testes** (scripts `dev`, `build`, `start`, `lint`). O `npx eslint .` do frontend **já falha com 88 erros pré-existentes**: 78 `no-explicit-any` em `shared/components/form/validator/*`, e `no-explicit-any`/`react-hooks/set-state-in-effect` em `use-accounts.ts`, `use-credit-cards.ts`, `use-categories.ts` e `accounts.page.tsx`. As regras `react-hooks/set-state-in-effect` e `@typescript-eslint/no-explicit-any` reprovam `setState` síncrono dentro de `useEffect` e `any`. O backend **já falha com 58 erros e 1 aviso** no `npx eslint "src/**/*.ts"`, e o script `lint` dele roda com `--fix`. O backend e o domínio têm testes e continuam valendo
- O monorepo usa **npm** + Turbo, não pnpm

## Decisões (fechar antes de codar, para não abrir discussão no meio)

- **Um prompt só para o mês global e para a tela do extrato**: a tela nasce na forma final, sem uma versão intermediária (card em volta, filtros em combo box, agrupamento fixo por dia, página de 25) que seria desmontada logo depois. O mês global entra junto porque o extrato é o primeiro consumidor dele — sozinho, seria um seletor sem nenhuma tela para testar
- **O mês selecionado é um único ponto de verdade**: nenhuma tela guarda cópia do mês nem recalcula o período — todas leem `useSelectedMonth()`. O mês **não** vai para o `localStorage`: recarregar a página volta para o mês atual, que é o comportamento esperado de um extrato
- **O período é consequência do estado global**: os campos `De`/`Até` saem da tela e nenhuma preferência gravada escreve `expectedFrom`/`expectedTo`
- **Uma identidade só**: fica o `PageSectionHeader` (badge `Extrato Mensal` + título com o mês, sem subtítulo); não há `TableCard` em volta do extrato. A contagem do mês (`meta.total`) vira texto discreto na barra de ferramentas, e a paginação fica abaixo da lista, sem moldura
- **Efetivar é mudar a situação**: `SETTLED` é a transação efetivada e `PENDING` a não efetivada. Um grupo único `Situação` com três pílulas (`Pendente`, `Efetivada`, `Cancelada`) atende o filtro — um filtro separado de efetivação seria dois controles para o mesmo dado
- **Pílula é seleção única por grupo**: cada grupo abre com uma pílula neutra (`Todas` / `Todas as contas` / `Todos os cartões`) e clicar na pílula ativa também limpa o grupo. Seleção múltipla exigiria `IN` no backend e não está em jogo aqui
- **Grupo Cartão**: pílula neutra, uma pílula `Somente cartão` (qualquer cartão) e uma pílula por cartão ativo. Os dois filtros nunca vão juntos na query
- **Página de 100**: o teto do `GET /transactions` sobe de 50 para 100 e o extrato pede 100 por página. Agrupar por conta ou categoria em páginas pequenas quebraria os grupos entre páginas na maioria dos meses; com 100, o mês inteiro cabe em uma página em praticamente todos os casos. Os outros cadastros continuam com teto 50
- **Trocar de mês ou de filtro volta para a página 1** sem disparar uma requisição com a página antiga e **sem** `setPage` dentro de `useEffect`: a página é guardada junto da chave (mês + filtros) em que foi escolhida, e página de outra chave é tratada como `1`
- **Agrupamento é apresentação**, calculado no cliente sobre a página em exibição, sem tocar na ordenação do backend (`expectedOn` desc, `createdAt` desc). Com mais de uma página, um grupo pode reaparecer na página seguinte — é o compromisso aceito enquanto o extrato é paginado
- **Cabeçalho de grupo mostra rótulo + contagem, nunca soma em dinheiro**: somar só a página daria total errado e somar o mês exige endpoint de agregação, que continua fora de escopo
- **Ações saem da lista**: clicar na linha/card abre o modo formulário com aquela transação. A exclusão fica no modo formulário de edição (botão no cabeçalho + `DeleteConfirmationDialog`), onde o usuário já está olhando a transação inteira antes de apagá-la
- **Efetivar usa o endpoint que já existe**: `updateTransaction` (`PUT /transactions/:id`) com o `SaveTransactionInput` montado a partir do `TransactionDTO` da linha, trocando `status` para `SETTLED` e `settledOn` para o **próprio `expectedOn`** (efetivação rápida é "aconteceu como previsto"; outra data se resolve no formulário). Desmarcar volta para `PENDING` com `settledOn: null`
- **Transação cancelada não é efetivada pelo check**: o botão aparece desabilitado, com tooltip explicando que a situação muda pelo formulário
- **Preferência do usuário é conveniência, não regra**: só visualização, agrupamento, painel aberto/fechado e filtros (direção, situação, conta e cartão) são gravados; a busca por nome e o mês **não**. Preferência ausente, corrompida ou de versão antiga cai no padrão sem quebrar a tela
- **Menu**: a seção `extras` ainda não existe aqui (nasce no prompt 17 e fica sempre por último)

## Negócio

- Acrescentar dois filtros opcionais ao `ListTransactionsInput` em `modules/transaction/src/transaction/provider`, documentando cada um (skill: module-query-cqrs):
  - `creditCardId?: string` — transações de um cartão específico
  - `onlyCreditCard?: boolean` — apenas transações vinculadas a **algum** cartão; ignorado quando `creditCardId` vier junto
- Não há entidade, VO, caso de uso, erro nem regra nova: é só o contrato de leitura ganhando dois campos. Nenhum outro arquivo de `modules/*` muda

## Backend

- Aplicar os dois filtros no `where` de `TransactionPrisma.listTransactions` (skill: backend-prisma-data), mantendo o estilo "ausente é sem filtro": `creditCardId` filtra pelo id; senão, `onlyCreditCard` vira `creditCardId: { not: null }`. O id específico tem precedência sobre o booleano, e o escopo por `userId` e `deletedAt: null` continua valendo
- Aceitar `creditCardId` e `onlyCreditCard` como query params no `GET /transactions` (skill: backend-controller): `creditCardId` com `trim`, e vazio é "sem filtro"; `onlyCreditCard` só é verdadeiro para `'true'` ou `'1'` — qualquer outro valor é "sem filtro", porque um booleano malformado não deve estreitar a listagem silenciosamente. A conversão fica num helper privado do controller
- Subir o teto de `pageSize` do `GET /transactions` de `50` para `100`, mantendo o padrão `10` e o mínimo `1`. Não alterar os controllers dos outros módulos
- Acrescentar ao `transaction.integration.http`: listar por `creditCardId`, listar com `onlyCreditCard=true`, os dois combinados com o mês (`expectedFrom`/`expectedTo`), filtro de cartão sem vazar transação de outro usuário, e `pageSize=100` aceito e `pageSize=101` limitado a `100` no `meta`
- Garantir os testes do backend e do domínio verdes ao final desta seção

## Frontend

> Executar na ordem. Cada passo só depende dos anteriores.

### Parte A — mês global e menu

1. **Criar o utilitário de mês** em `apps/frontend/src/shared/util/month.util.ts`, para que nem o contexto nem o seletor nem a tela façam aritmética de data na mão:
   - Tipo `SelectedMonth = { year: number; month: number }`, com `month` de **1 a 12** (mês humano, não o índice do `Date`) — documentar isso no arquivo, é a maior fonte de erro por aqui
   - `currentMonth(): SelectedMonth` — mês corrente do navegador
   - `monthRange(month: SelectedMonth): { from: string; to: string }` — primeiro e último dia do mês em `YYYY-MM-DD`, prontos para virar `expectedFrom`/`expectedTo`
   - `monthKey(month: SelectedMonth): string` — `YYYY-MM`, para a tela saber quando o mês mudou
   - `shiftMonth(month: SelectedMonth, delta: number): SelectedMonth` — mês anterior/seguinte, virando o ano corretamente (dezembro → janeiro)
   - `isSameMonth(a: SelectedMonth, b: SelectedMonth): boolean`
   - `formatMonthLabel(month: SelectedMonth): string` — rótulo longo com a primeira letra maiúscula (`Setembro 2026`)
   - `formatShortMonthLabel(month: SelectedMonth): string` — rótulo curto para telas pequenas (`set/2026`)
   - `MONTH_SHORT_LABELS: readonly string[]` — os 12 rótulos curtos da grade do seletor, derivados do `ptBR` do `date-fns`, não digitados um a um
   - **Atenção ao fuso**: nunca formatar data com `toISOString()` sobre um `Date` local (volta um dia). Montar a string `YYYY-MM-DD` a partir de ano/mês/dia com padding, ou usar o `format` do `date-fns` (que trabalha em horário local). O último dia do mês sai de `new Date(year, month, 0).getDate()` — mês humano já é o índice do mês seguinte
2. **Criar o contexto global do mês** em `apps/frontend/src/shared/context/selected-month.context.tsx`, espelhando o `shell.context.tsx` (provider `'use client'`, contexto `null` por padrão, `useCallback` nas ações, `useMemo` no value):
   - Value: `{ selectedMonth, monthStart, monthEnd, monthLabel, shortMonthLabel, isCurrentMonth, selectMonth(next), goToPreviousMonth(), goToNextMonth(), goToCurrentMonth() }`
   - `monthStart`/`monthEnd` são o `monthRange` do mês selecionado, já derivados no value: **nenhum consumidor recalcula período**
   - `SelectedMonthProvider` aceita `defaultMonth?: SelectedMonth`; sem ele, começa no mês corrente usando inicializador lazy (`useState(() => defaultMonth ?? currentMonth())`) — **sem** `useEffect` de montagem. Não há risco de hidratação: o provider fica debaixo do `AuthGuard`, que só renderiza no cliente com usuário
   - `useSelectedMonthContext()` lança com `getMessage('SELECTED_MONTH_CONTEXT_PROVIDER_REQUIRED')` quando usado fora do provider, e a chave entra em `messages.pt.ts` e `messages.en.ts` (mesmo texto-modelo do `SHELL_CONTEXT_PROVIDER_REQUIRED`)
3. **Criar o hook fino** `apps/frontend/src/shared/hooks/selected-month.hook.ts` exportando `useSelectedMonth()` a partir do `useSelectedMonthContext`, exatamente como o `shell.hook.ts` faz. Todo consumidor importa o hook, nunca o contexto
4. **Montar o provider no grupo `(private)`** em `app/(private)/layout.tsx`, dentro do `AuthGuard` e envolvendo o `ShellProvider`/`AdminShell` — o seletor mora no cabeçalho do shell e o extrato é uma rota filha, então os dois precisam estar debaixo dele. O grupo `(public)` **não** recebe o provider
5. **Criar o seletor de mês** em `apps/frontend/src/shared/components/ui/month-picker.component.tsx` — dropdown **customizado**, montado com o `Popover` que já existe (mesmo esqueleto do `date-picker-input`), consumindo `useSelectedMonth()`:
   - Controle com três partes numa linha: seta `‹` (mês anterior), gatilho central com o rótulo do mês (`ChevronDown` indicando que abre) e seta `›` (mês seguinte). As setas são o caminho rápido para meses vizinhos, sem abrir o painel
   - O gatilho mostra `formatMonthLabel` a partir de `sm` e `formatShortMonthLabel` abaixo disso (o cabeçalho tem `h-16` e divide espaço com o menu do usuário)
   - Painel: linha de navegação de ano (`‹ 2026 ›`, sem `Combobox` de ano) e grade de meses `grid-cols-3` com os 12 rótulos curtos; clicar em um mês seleciona e **fecha** o painel
   - Destaques na grade: o mês selecionado com o estado ativo (mesma linguagem visual do item ativo do menu) e o mês corrente com uma marca discreta (borda/ponto), para o usuário se localizar quando estiver navegando em outro ano
   - Botão **"Mês atual"** no rodapé do painel, renderizado **só quando `isCurrentMonth` é falso**; ao clicar, volta ao mês corrente e fecha o painel
   - O ano da grade é estado local do painel: começa no ano do mês selecionado e é redefinido no `onOpenChange` ao abrir (no handler, não em `useEffect`). Navegar de ano **não** troca o mês selecionado, só o que a grade mostra
   - Acessibilidade: `aria-label` nas duas setas ("Mês anterior"/"Mês seguinte"), `aria-label` no gatilho com o mês exibido, `aria-pressed` no mês selecionado da grade e fechamento por `Escape`/clique fora (já vem do `Popover`)
   - O componente é apresentação + consumo do contexto: nenhuma regra de negócio, nenhum `fetch`, nenhuma rota
6. **Abrir um slot no cabeçalho do `AdminShell`** (`shared/template/admin-shell.component.tsx`): nova prop opcional `headerLeading?: ReactNode`, renderizada no bloco da esquerda **imediatamente depois** do botão de colapsar o menu (mesmo `flex min-w-0 items-center gap-3`, preservando o `min-w-0` para o truncamento continuar funcionando). O `AdminShell` **não** importa o seletor nem o contexto do mês: quem decide o que vai ali é o layout, como já acontece com o `sidebar`
7. **Passar o seletor no layout privado**: `headerLeading={<MonthPicker />}` no `AdminShell` de `app/(private)/layout.tsx`. Conferir no mobile que o cabeçalho não estoura com o dropdown do usuário (o rótulo curto e o `truncate` do nome/e-mail devem bastar)
8. **Reorganizar o `NAVIGATION_SECTIONS`** no mesmo layout, sem tocar no `SidebarMenu`:
   - Seção `main` **sem label**: `dashboard` (`Dashboard`, `/dashboard`, `LayoutDashboard`) e `transactions` (`Extrato Mensal`, `/transactions`, `ReceiptText`), ambos com `match: 'prefix'`
   - Seção `registrations` continua com `label: 'Cadastros'` e os itens `accounts` (`/accounts`), `cards` (`/cards`) e `categories` (`/categories`), nesta ordem e sem mudança
   - Remover os itens `auth`, `category` e `transaction` da seção `main`, além dos imports de ícone que ficarem sem uso (`Fingerprint` e `ArrowRightLeft`; o `Tags` continua usado em `Categorias`)

### Parte B — tela do extrato

9. **Levar os dois filtros de cartão até o cliente HTTP**: acrescentar `creditCardId?: string` e `onlyCreditCard?: boolean` ao `ListTransactionsParams` de `data/transaction-api.client.ts` e colocá-los na query string só quando informados (`onlyCreditCard` só entra quando for `true`, e nunca junto com `creditCardId`)
10. **Criar os tipos e rótulos de apresentação do extrato** em `data/statement-view.ts`:
    - `StatementView = 'table' | 'cards'` e `StatementGrouping = 'date' | 'account' | 'category' | 'subcategory'`, com os rótulos em pt-BR (`Tabela`/`Cards`; `Data`, `Conta`, `Categoria`, `Subcategoria`) em `Record` tipados pelas uniões — um valor novo na união quebra o build aqui, em vez de renderizar o código cru
    - `StatementFilters = { direction?: Direction; status?: TransactionStatus; accountId?: string; creditCardId?: string; onlyCreditCard?: boolean }`, com `Direction`/`TransactionStatus` importados de `@poupig/transaction`
    - `StatementPreferences = { version: 1; view: StatementView; grouping: StatementGrouping; filtersOpen: boolean; filters: StatementFilters }`
11. **Criar o hook de preferências** `useStatementPreferences` em `data/use-statement-preferences.ts`, sobre o `useLocalStorage` que já existe, com a chave `poupig:statement-preferences`:
    - Leitura síncrona (já vem do `useLocalStorage`), para a primeira requisição do extrato já sair com os filtros gravados
    - `deserialize` validando o formato: `version` diferente de `1`, JSON inválido, `view`/`grouping` fora das uniões ou `direction`/`status` que não passam em `isDirection`/`isTransactionStatus` (de `@poupig/transaction`) caem nos padrões
    - Padrão quando **não há nada gravado**: `grouping: 'date'`, `filtersOpen: false`, `filters: {}` e `view` igual a `cards` quando `window.innerWidth < 1024` (mesmo breakpoint do `ShellProvider`) e `table` caso contrário, calculado uma vez no valor inicial. Depois da primeira escolha do usuário, vale sempre o que ele escolheu
    - Expor `preferences` e um setter por preferência: `setView`, `setGrouping`, `toggleFilters`, `setFilter(name, value)` e `clearFilters`. Sem `isReady` e sem `useEffect`
12. **Transformar a página em extrato** — renomear `pages/transactions.page.tsx` → `pages/monthly-statement.page.tsx` (`TransactionsPage` → `MonthlyStatementPage`), ajustando `app/(private)/transactions/page.tsx` e os exports de `modules/transaction/index.ts`. `useTransactions` e o cliente de API mantêm os nomes:
    - A página chama `useSelectedMonth()` e `useStatementPreferences()` e monta os filtros de `useTransactions` num `useMemo`: `preferences.filters` + busca (estado local) + `expectedFrom: monthStart` e `expectedTo: monthEnd` — a primeira requisição já sai no mês e com os filtros gravados
    - **Remover** os campos de período (`De`/`Até`), o estado de período e a barra de filtros com combo box da página
    - A página é guardada junto da chave (mês + filtros) em que foi escolhida, e página de outra chave é tratada como `1` (ver Decisões)
    - `hasFilters` conta busca, direção, situação, conta e cartão (`creditCardId`/`onlyCreditCard`), e **não** conta o período
    - `PAGE_SIZE` passa de `10` para `100`
    - **Remover** do modo lista todo o fluxo de exclusão (estado da transação a excluir, `DeleteConfirmationDialog`, handlers) — ele vai para o modo formulário no passo 20
13. **Implementar a efetivação em um clique** em `data/use-transactions.ts`, num hook `useToggleTransactionSettled` que expõe `toggleSettled(transaction)` e `togglingId`:
    - Monta o `SaveTransactionInput` a partir do `TransactionDTO` da linha (todos os campos, incluindo `note`, `creditCardId` e `subcategoryId`), trocando só `status` e `settledOn` conforme as Decisões, e chama `updateTransaction`
    - Enquanto a chamada está em voo, o check daquela linha fica desabilitado (`togglingId`); erro vira `toast.error(getErrorMessage(err))` e **nenhuma** mudança visual
    - Sucesso **sem filtro de situação ativo**: a página aplica a transação alterada numa sobreposição local (`Record<id, TransactionDTO>`) fundida sobre os itens na leitura, evitando o piscar de recarregar a lista a cada check. A sobreposição fica associada à resposta sobre a qual foi aplicada (guardar junto a referência do array `data` daquela resposta) e é ignorada quando chega uma resposta nova — **sem** `useEffect` para limpá-la
    - Sucesso **com filtro de situação ativo**: disparar a recarga de `useTransactions`, porque a linha deixou de casar com o filtro e precisa sumir
14. **Criar a pílula de filtro** (`FilterPill`) em `apps/frontend/src/shared/components/ui/filter-pill.tsx` — apresentação pura, sem regra de negócio: `button` com `type="button"`, arredondado (`rounded-full`), estado ativo com a mesma linguagem visual do item ativo do menu, estado inativo discreto, `aria-pressed`, `disabled` e um `count` opcional à direita. Ela vive em `shared` porque os relatórios vão querer a mesma coisa
15. **Criar o painel de filtros** em `components/statement-filters-panel.component.tsx`:
    - Um grupo por linha, com rótulo curto à esquerda e as pílulas correndo à direita (`flex flex-wrap gap-2`), na ordem: `Direção` (`Entrada`/`Saída`), `Situação` (`Pendente`/`Efetivada`/`Cancelada`), `Conta` (uma por conta ativa) e `Cartão` (`Somente cartão` + uma por cartão ativo). Rótulos de direção e situação vêm de `transaction.labels.ts`
    - Cada grupo começa com a pílula neutra; clicar na pílula já ativa também limpa o grupo
    - Contas e cartões vêm do `useTransactionOptions` que já existe — nenhum carregamento novo. Grupo sem opção nenhuma (usuário sem cartão) não é renderizado
    - Um botão discreto `Limpar filtros`, visível só quando há filtro ativo
    - O painel é montado/desmontado pelo botão da barra de ferramentas; nasce fechado e reabre como o usuário deixou
16. **Criar a barra de ferramentas** em `components/statement-toolbar.component.tsx`, uma faixa só, que quebra em duas no mobile:
    - À esquerda: busca por nome
    - À direita: botão `Filtros` (ícone `SlidersHorizontal`, com o número de filtros ativos quando houver), seletor de agrupamento, alternador de visualização (dois botões com `List` e `LayoutGrid`, `aria-pressed` no ativo e `aria-label` com o rótulo) e o botão `Nova transação`
    - O agrupamento pode ser pílulas (`Data`, `Conta`, `Categoria`, `Subcategoria`) quando couber e um `Combobox` compacto no mobile — o que não pode é competir em peso visual com os filtros
    - A contagem do mês (`meta.total`) aparece aqui, em texto pequeno e discreto
17. **Criar a formatação e o agrupamento**, funções puras em `data/`:
    - `data/statement-format.ts`: **mover** para cá a formatação de data `dd/MM/yyyy` sem fuso que hoje está em `transaction-list.component.tsx` (sem reescrever a lógica) e acrescentar o rótulo do dia em pt-BR (`12 de setembro · sábado`), também sem fuso (`parseISO` + `format` do `date-fns`, ou a string `YYYY-MM-DD` partida — nunca `new Date(value).toLocaleDateString()` sobre a string crua)
    - `data/group-transactions.ts`: recebe as transações da página e o `StatementGrouping` e devolve `{ key, label, items }[]`. `date` mantém a ordem que veio (os dias já chegam contíguos) e usa o rótulo do dia; `account` agrupa por `accountName` (conta é obrigatória), `category` por `categoryName` e `subcategory` pelo par `Categoria › Subcategoria`; sem categoria/subcategoria vira o grupo `Sem classificação`, sempre por último. Fora de `date`, os grupos saem em ordem alfabética (`localeCompare` em pt-BR) e as linhas dentro do grupo mantêm a data decrescente
18. **Transformar a lista em tabela enxuta** — renomear `components/transaction-list.component.tsx` → `components/transaction-table.component.tsx` (componente e exports no mesmo movimento), já que a lista passa a ter duas visualizações:
    - Sai a coluna de ações e sai o `TableCard`: a tabela desenha só linhas separadoras, com padding horizontal alinhado ao resto da página
    - Entra, como primeira coluna estreita, o **botão de efetivar**: check circular (`Check` num botão `ghost` arredondado), preenchido quando `SETTLED`, contornado quando `PENDING`, desabilitado com tooltip quando `CANCELED` ou quando é o `togglingId`. `aria-pressed` e `aria-label` com o nome da transação (`Marcar "<nome>" como efetivada`), e `event.stopPropagation()` no clique para não abrir o formulário junto
    - A linha inteira vira clicável: `onClick` chamando `onOpen(transaction)` (a página troca para o modo formulário), mais `role="button"`, `tabIndex={0}`, `Enter`/`Espaço` e `cursor-pointer` com realce de hover — o mouse não pode ser a única forma de chegar lá
    - Cabeçalho de grupo (`TableRow` com uma única `TableCell` e `colSpan` de todas as colunas) vindo do passo 17, com rótulo + contagem, em tom discreto e fundo levemente destacado
    - Colunas finais: check, `Data` (some quando o agrupamento é por data, porque o cabeçalho do grupo já diz o dia), `Nome` (com o cartão embaixo, quando houver), `Conta` (`hidden md:table-cell`), `Classificação` (`hidden lg:table-cell`), `Valor` (sinal e cor por direção, `formatCurrency`) e `Situação` (`Badge`)
19. **Criar a visualização em cards** em `components/transaction-card.component.tsx` (mais lista de cards do que grade), com os mesmos grupos do passo 17: um card por transação, uma coluna no mobile e duas a partir de `lg`, com alvo de toque generoso:
    - Linha de cima: check de efetivar à esquerda, nome da transação (em destaque, truncado) e valor com sinal e cor à direita
    - Linha de baixo: data, conta, cartão (quando houver) e classificação em texto secundário, mais o `Badge` de situação
    - Card inteiro clicável para abrir o formulário, com os mesmos cuidados de teclado e de `stopPropagation` do check
20. **Compor o modo lista e mover a exclusão** em `pages/monthly-statement.page.tsx`:
    - Modo lista: `PageSectionHeader` (badge `Extrato Mensal`, título com o `monthLabel`, sem subtítulo) → barra de ferramentas → painel de filtros (quando aberto) → tabela ou cards → paginação, tudo em `space-y`, **sem** `TableCard`, dentro de um `TooltipProvider` para o tooltip do check
    - `PaginationControls` só quando `meta.totalPages > 1`
    - Estado vazio referenciando o mês (`Nenhuma transação em setembro de 2026`): com filtros, o texto de ajuste e um atalho `Limpar filtros`; sem filtros, o convite para registrar a primeira transação do mês
    - Modo formulário de **edição**: botão `Excluir` discreto (ícone `Trash2`) no cabeçalho, abrindo o `DeleteConfirmationDialog`; ao confirmar, `useDeleteTransaction`, `toast` de sucesso, volta para o modo lista e recarrega. No modo de criação o botão não aparece. O `transaction-form.component.tsx` não muda
21. **Fechar a mudança**:
    - `npm run build` verde no workspace e testes do backend e do domínio verdes
    - `npx eslint` **sem `--fix`** nos arquivos criados ou alterados, de frontend e de backend, sem nenhum erro — os erros pré-existentes (88 no frontend, 58 no backend) continuam como estão. **Não** rodar `npm run lint` no backend, que aplica `--fix` em todos os arquivos
    - Diff limitado a `modules/transaction/src/transaction/provider`, `apps/backend/src/modules/transaction/*`, `apps/frontend/src/modules/transaction/*`, `apps/frontend/src/shared` (utilitário de mês, contexto, hook, seletor, slot do shell, pílula de filtro e i18n), `app/(private)/layout.tsx` e `app/(private)/transactions/page.tsx`

## Fora de Escopo

- Totais do mês ou por grupo (entradas, saídas, saldo): somar a página daria número errado e somar o mês exige endpoint de agregação
- Saldo acumulado, saldo inicial/final do mês, previsto x realizado e projeção
- Parcelas de `TransactionSeries`/`ScheduledTransaction` no extrato — prompt 19
- Consumir o mês global no dashboard ou em qualquer outra tela: esta mudança **cria** o estado global e tem o extrato como primeiro consumidor
- Persistir o mês selecionado (`localStorage`, cookie ou query string) e refletir mês, filtros, agrupamento ou visualização na URL
- Seleção de período livre, intervalo de vários meses, semana, trimestre ou ano no seletor
- Seleção múltipla dentro de um grupo de filtros (vários status, várias contas), seleção em massa de linhas e efetivação em lote
- Endpoint dedicado de efetivação (`PATCH /transactions/:id/settle`) e qualquer regra nova de status no domínio
- Edição inline na linha, arrastar para efetivar/excluir e menu de contexto
- Ordenação configurável pelo usuário: a ordem continua sendo data prevista decrescente
- Trocar a paginação por scroll infinito, ou carregar o mês inteiro sem paginação
- Exportar o extrato (CSV/PDF), imprimir e anexos
- Remover as rotas `/auth` e `/category` ou as páginas de scaffold dos módulos (só os itens de menu saem)
- Renomear a rota `/transactions`, o pacote `@poupig/transaction` ou a pasta `modules/transaction`; rotas próprias para o formulário
- Criar hook genérico de paginação, mexer no `SidebarMenu` ou em componentes de `shared/components/ui` além do seletor, do slot do `AdminShell` e da pílula de filtro
- Mudar o teto de página de outros módulos, o `transaction-form.component.tsx` (fora o botão de excluir no cabeçalho da página) e o dashboard
- Pré-preencher `expectedOn` do formulário com o mês selecionado
- Corrigir os erros de lint pré-existentes
- Tema, responsividade geral do shell e qualquer redesign fora do cabeçalho e da tela do extrato

## Pasta do Módulo

- Consulta de leitura (dois filtros novos): `modules/transaction/src/transaction/provider`
- Backend do módulo: `apps/backend/src/modules/transaction/transaction.controller.ts` e `transaction.prisma.ts`
- Testes de integração: `apps/backend/src/modules/transaction/transaction.integration.http`
- Utilitário de mês: `apps/frontend/src/shared/util/month.util.ts`
- Contexto global: `apps/frontend/src/shared/context/selected-month.context.tsx`
- Hook do contexto: `apps/frontend/src/shared/hooks/selected-month.hook.ts`
- Seletor de mês: `apps/frontend/src/shared/components/ui/month-picker.component.tsx`
- Pílula de filtro (compartilhada): `apps/frontend/src/shared/components/ui/filter-pill.tsx`
- Shell (slot novo no cabeçalho): `apps/frontend/src/shared/template/admin-shell.component.tsx`
- Mensagens do contexto: `apps/frontend/src/shared/i18n/messages.pt.ts` e `messages.en.ts`
- Layout e menu: `apps/frontend/src/app/(private)/layout.tsx`
- Rota do extrato: `apps/frontend/src/app/(private)/transactions/page.tsx`
- Página do extrato (lista, formulário e exclusão): `apps/frontend/src/modules/transaction/pages/monthly-statement.page.tsx`
- Componentes do extrato: `apps/frontend/src/modules/transaction/components` (`statement-toolbar.component.tsx`, `statement-filters-panel.component.tsx`, `transaction-table.component.tsx`, `transaction-card.component.tsx`)
- Ger. de Estado e apresentação: `apps/frontend/src/modules/transaction/data` (`transaction-api.client.ts`, `use-transactions.ts`, `use-statement-preferences.ts`, `statement-view.ts`, `statement-format.ts`, `group-transactions.ts`)

## Instruções

- O código deverá ser escrito em inglês, usando os termos da linguagem ubíqua (`Direction`, `TransactionStatus`, `SETTLED`)
- A especificação deverá ser escrita em português do brasil
- Concluir antes o prompt `15-transacao-base-crud.md`: esta mudança adapta a tela e o endpoint que ele entrega
- Use as skills mencionadas (`module-query-cqrs`, `backend-prisma-data`, `backend-controller`)
- Reaproveitar o que já existe (`Popover`, `Button`, `date-fns` + locale `ptBR`, `useTransactions`, `useTransactionOptions`, `useDeleteTransaction`, `listTransactions`, `updateTransaction`, `useLocalStorage`, `PageSectionHeader`, `Table`, `Badge`, `Card`, `Tooltip`, `PaginationControls`, `EmptyListState`, `DeleteConfirmationDialog`, `formatCurrency`, padrão de contexto do `ShellProvider`, dicionário `shared/i18n`), sem duplicar e sem criar caminho paralelo
- Não criar hook de paginação, cliente HTTP, endpoint de efetivação nem carregamento de opções novo: tudo isso já existe
- O mês selecionado é **um único ponto de verdade**: nenhuma tela guarda cópia do mês nem recalcula o período, e nenhuma preferência gravada escreve `expectedFrom`/`expectedTo`
- Caminho de navegação continua sendo estado da aplicação: menu e slot do cabeçalho são preenchidos no layout, nunca dentro de `shared/`
- Nada de aritmética de data com fuso, nada de `setState` síncrono em `useEffect` e nada de `any`
- Executar a mudança em três sub agentes sequenciais: (1) negócio + backend (filtros de cartão e teto de página), (2) frontend parte A (mês global, seletor e menu), (3) frontend parte B (tela do extrato)
- Garantir no final o build do projeto funcionando, os testes de backend/domínio verdes e nenhum erro de lint novo nos arquivos tocados (o frontend não tem suíte de testes)
- Não executar teste via Web Browser (farei testes manuais)

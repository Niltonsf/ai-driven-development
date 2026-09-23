# Lista de Tarefas

Gerador de **massa de dados — parte 1: transações avulsas**. Cria o módulo `dev` e uma tela em `Extras › Desenvolvimento` com um checklist do que se quer criar — contas, cartões de crédito e transações avulsas —, a quantidade de cada coisa, o período em meses e uma semente. Todo o **conteúdo** dos registros (nomes de contas, bandeiras e nomes de cartões, nomes e faixas de valor das transações) vem de um **catálogo estático em `.ts`** dentro do módulo de domínio — **nenhuma inteligência artificial em runtime**, nenhuma chamada externa. O backend grava tudo **para o usuário autenticado**, pelos casos de uso de escrita que já existem: as transações de dias anteriores a hoje nascem **efetivadas** e as de hoje até o fim do mês atual nascem **pendentes**. A mudança vem logo depois do extrato mensal (prompt 16): os dados gerados já aparecem numa tela que navega por mês, filtra, agrupa e efetiva, e as séries (18 e 19), o dashboard (21) e os relatórios (22 a 24) passam a ser construídos e testados sobre meses de dados realistas. A parte 2 (prompt 20) acrescenta séries e ocorrências à mesma tela. É uma funcionalidade de desenvolvimento, atrás de uma chave de ambiente no backend (as rotas) e de outra no frontend (o menu e a tela), e não altera o comportamento de nenhum módulo existente.

## Funcionalidade

- O módulo `dev` **não existe**: o primeiro passo é criá-lo com a skill `config-new-module` (`@poupig/dev`: pacote `modules/dev`, módulo Nest `apps/backend/src/modules/dev`, módulo web `apps/frontend/src/modules/dev` e rota `/dev` no grupo `(private)`). Esta mudança cria o scaffold e em seguida o **preenche**
- Rota da tela: `/dev`. O item de menu fica numa seção nova `Extras`, a última do `NAVIGATION_SECTIONS`, **condicionada** à chave de ambiente do frontend
- Endpoints: `GET /dev/data-generator/status` (a tela pergunta se o recurso está ligado) e `POST /dev/data-generator/transactions` (executa o checklist desta parte)
- **Nenhuma entidade nova, nenhum modelo Prisma novo, nenhuma migração**: o gerador escreve nas tabelas que já existem, pelos casos de uso que já existem
- Itens do checklist, cada um com uma caixa de seleção e uma quantidade:
  - `Contas` (1..10)
  - `Cartões de crédito` (1..10)
  - `Transações avulsas` (1..500) — revisão do carro, pagamento do seguro, mercado, farmácia, presente de aniversário, salário extra, freelance…
- Opções: `Período` (1..12 meses, contando o mês atual **inteiro**) e `Semente` (inteiro opcional, para reproduzir a mesma execução)
- Resposta da execução: um resumo por tipo (`solicitados`, `criados`, `ignorados`, `erros`) e a semente usada, exibidos na própria tela
- **Parte 2 (prompt 20)**: recorrências e parcelamentos, com as ocorrências gravadas no banco, entram depois de a transação agendada existir, no mesmo módulo, na mesma tela e reaproveitando catálogo, gerador pseudoaleatório, limites, erros e chaves de ambiente desta parte

## Contexto Atual (verificado no código)

> Estado real do repositório na abertura desta mudança — usar como ponto de partida, não repetir o que já existe.

- **Pré-requisito: os prompts 15 e 16 precisam estar concluídos.** O que eles entregam e o gerador vai alimentar ou precisa respeitar:
  - Núcleo `movement` (15): `Direction` (`IN`, `OUT`), `TransactionStatus` (`PENDING`, `SETTLED`, `CANCELED`), `MovementName` (2..100 caracteres) e a **`MovementReferencesQuery`** (`accountBelongsToUser`, `creditCardBelongsToUser`, `subcategoryBelongsToUser`, cada uma `Promise<Result<boolean>>`), implementada no backend por `TransactionPrisma.movementReferences`
  - `SaveTransaction` (15): recebe `TransactionRepository` e `MovementReferencesQuery`; entrada **sem `id`** cria e devolve `Result<{ id: string }>`; campos `userId`, `name`, `note?`, `value` (reais, positivo), `direction`, `accountId`, `creditCardId?`, `subcategoryId?`, `status?`, `expectedOn`, `settledOn?`. Invariante: `SETTLED` exige `settledOn`; `PENDING`/`CANCELED` descartam a data
  - Backend (15): `TransactionModule` provê e exporta `TransactionPrisma`; `GET /transactions` lista com filtros de período; os controllers montam os casos de uso **à mão dentro do método** com os adapters injetados
  - Frontend (15 e 16): `/transactions` é o extrato mensal (`monthly-statement.page.tsx`, lista e formulário como modos da mesma página, mês global no `MonthPicker` do cabeçalho, filtros de direção, situação, conta e cartão, agrupamento e visualização em tabela ou cards) — é onde os dados gerados são conferidos. O `GET /transactions` aceita `pageSize` até 100 e os filtros de cartão; cliente `*-api.client.ts` (`headers(token)`, `handleError`, `XApiError`), token via `useAuth`, erros por `getErrorMessage` com o dicionário `shared/i18n`, hooks sem `any` e sem `setState` síncrono em `useEffect`
- Verificado no código atual:
  - **O módulo `dev` não existe** em `modules/`, `apps/backend/src/modules`, `apps/frontend/src/modules` nem em `app/(private)`. A skill `config-new-module` (`node .claude/skills/config-new-module/scripts/create-module.mjs dev`) gera: `modules/dev` (`package.json`, `tsconfig.json`, `jest.config.ts`, `src/index.ts` com `getModuleName`, `test/index.test.ts`), `apps/backend/src/modules/dev` (`dev.module.ts`, `dev.controller.ts` com rota de exemplo, `dev.prisma.ts`, `index.ts`), `apps/backend/prisma/models/dev.model.prisma`, o registro do `DevModule` no `app.module.ts`, `apps/frontend/src/modules/dev` (`components/dev-dashboard.component.tsx` com `EmptyDashboardState`, `data/index.ts`, `pages/dashboard.page.tsx`, `index.ts`), `app/(private)/dev/page.tsx`, a dependência `@poupig/dev` nos `package.json` das duas apps e um item de menu anexado à **primeira** seção do `NAVIGATION_SECTIONS`
  - Todos os módulos de domínio (`@poupig/account`, `auth`, `category`, `credit-card`, `transaction`) dependem **só** de `@poupig/shared` — nenhum módulo de domínio importa outro. Todos mantêm `getModuleName()` no `src/index.ts`
  - `SaveAccount` (`@poupig/account`): entrada `id` (**obrigatório** — o controller gera `randomUUID()` na criação), `userId`, `name`, `type` (`AccountType`: `CHECKING`, `SAVINGS`, `CASH`, `INVESTMENT`, `OTHER`), `description?`, `accountNumber?`, `agency?`, `financialInstitution?`, `color?`, `icon?`, `isActive?`; falha com `ACCOUNT_NAME_ALREADY_EXISTS` quando o usuário já tem conta com o nome (checagem do caso de uso, não do banco)
  - `SaveCreditCard` (`@poupig/credit-card`): entrada `id` (obrigatório, mesmo padrão), `userId`, `name`, `brand` (`CardBrand`: `VISA`, `MASTERCARD`, `ELO`, `AMEX`, `HIPERCARD`, `DINERS`, `OTHER`), `closingDay` e `dueDay` (1..31), `description?`, `lastFourDigits?` (4 dígitos), `limit?` (**inteiro em centavos** — é como o frontend do cartão envia e o Prisma grava `Int?`), `color?`, `icon?`, `isActive?`; falha com `CREDIT_CARD_NAME_ALREADY_EXISTS`
  - Consultas de listagem existentes: `accountPrisma.findAccountsByUserId.execute(userId, page, pageSize)` e `creditCardPrisma.findCreditCardsByUserId.execute(userId, page, pageSize)` devolvem `Result` com `{ items, total, page, pageSize }` (sem `totalPages`), já filtrando excluídos; `categoryPrisma.findCategoriesByUserId.execute(userId)` devolve `Result<CategoryDTO[]>` com `subcategories` (`id`, `name`, `isActive`...). `AccountModule`, `CreditCardModule` e `CategoryModule` exportam os seus adapters
  - Categorias padrão (`ApplyDefaultCategories`, `default-categories.constant.ts`): subcategorias como `Energia Elétrica`, `Água e Esgoto`, `Internet e TV`, `Condomínio`, `Aluguel ou Financiamento`, `Supermercado`, `Restaurantes e Delivery`, `Padaria`, `Combustível`, `Aplicativos de Transporte`, `Manutenção do Veículo`, `Seguro do Veículo`, `Plano de Saúde`, `Farmácia`, `Academia e Bem-estar`, `Mensalidade Escolar`, `Cursos e Idiomas`, `Creche e Babá`, `Cinema e Streaming`, `Assinaturas Digitais`, `Viagens`, `Presentes`, `IPVA`, `IPTU`, `Telefone Celular`. **Não há** categoria de entrada (salário, freelance)
  - Backend: `main.ts` carrega `dotenv/config`; o `SharedModule` registra `ConfigModule.forRoot({ isGlobal: true })`, então o `ConfigService` pode ser injetado em qualquer módulo. O `JwtGuard` é global (`APP_GUARD` no `AppModule`): toda rota é privada e o dono vem do `@CurrentUser()`
  - `apps/backend/.env.example` (`DATABASE_URL`, `PORT`, `JWT_SECRET`, valores entre aspas) é versionado. `apps/frontend/.env.example` (`NEXT_PUBLIC_API_URL`, `PORT`) **não é versionado**: o `.gitignore` do frontend tem `.env*`, que o ignora. Localmente existem `apps/frontend/.env` e `.env.local`
  - Frontend: `NAVIGATION_SECTIONS` em `app/(private)/layout.tsx` (arquivo `'use client'`) tem, depois da reorganização do prompt 16, a seção `main` sem label (`Dashboard` em `/dashboard` e `Extrato Mensal` em `/transactions`) e a seção `registrations` (label `Cadastros`: `Contas`, `Cartões`, `Categorias`); **não existe** seção `extras`. Next.js só expõe ao navegador variáveis com prefixo `NEXT_PUBLIC_`, embutidas **no build** por comparação literal (`process.env.NEXT_PUBLIC_X === 'true'`)
  - `shared/components/ui` tem `checkbox`, `input`, `button`, `card`, `form-section-layout`, `form-error-message`, `page-section-header`, `badge`, `table`, `empty-list-state`, `empty-dashboard-state`, `toaster` (`sonner`) e `tooltip`. O validador de formulário é o `v` (valida por VO, com refinamentos). `lucide-react` tem `CodeXml`
  - **Não existem** `authenticatedRequest`, `routes.ts`, mapas `*-error.ts` nem `usePaginatedList`; o precedente de dados estáticos de domínio é a pasta `constants/` do módulo `category` (`default-categories.constant.ts`), e o de objeto de erros compartilhado sem entidade é o `movement.errors.ts` do prompt 15
  - Lint: o frontend **já falha com 88 erros** e o backend **com 58 erros e 1 aviso** antes desta mudança. O script `lint` do backend roda `--fix`: a verificação usa `npx eslint` **sem `--fix`**, só nos arquivos tocados. O frontend não tem suíte de testes
  - **Não há nenhuma dependência de IA no projeto**, e esta mudança **não acrescenta nenhuma**
  - O monorepo usa **npm** + Turbo, não pnpm

## Decisões (fechar antes de codar, para não abrir discussão no meio)

- **Por que esta mudança vem logo depois do prompt 16**: com o extrato mensal pronto, a massa de dados é conferida numa tela que navega por mês, filtra por conta e cartão, agrupa e efetiva — e a própria geração já exercita essa tela com volume. Tudo o que vem depois — séries e agendadas (18 e 19), dashboard (21) e relatórios (22 a 24) — passa a ser construído e testado sobre meses de dados realistas, em vez de três lançamentos digitados à mão
- **A geração é dividida em duas partes**: esta (cadastros de apoio + transações avulsas) e a parte 2 (prompt 20: recorrências, parcelamentos e ocorrências gravadas), porque série e transação agendada só existem depois do prompt 19. As duas partes vivem no **mesmo módulo, na mesma tela e atrás das mesmas chaves de ambiente**, e a parte 2 **estende** o catálogo, o planejador, os limites e o gravador desta — nada é duplicado
- **Contas e cartões ficam nesta parte**: `accountId` é obrigatório em toda transação, e o extrato, os filtros por cartão e os relatórios por conta só ficam interessantes com mais de uma conta e de um cartão
- **O módulo nasce pela skill e é aditivo**: `config-new-module` cria o scaffold (inclusive o registro no `app.module.ts` e as dependências `@poupig/dev` nos `package.json`). Depois disso, fora de `modules/dev`, `apps/backend/src/modules/dev` e `apps/frontend/src/modules/dev`, as únicas alterações são: o `.env.example` do backend, o `.env.example` do frontend (com a exceção no `.gitignore` para ele passar a ser versionado), as chaves de i18n e a **seção `extras` condicionada** no `layout.tsx`. Nenhum arquivo de outro módulo muda e **não há migração**
- **O scaffold vazio do `dev` é substituído, não acumulado**: remover `dev.prisma.ts`, `dev.model.prisma` (o módulo não tem tabela própria), a rota de exemplo do controller, o `dev-dashboard.component.tsx`/`dashboard.page.tsx` do frontend, e tirar da primeira seção do menu o item que a skill anexou. O `getModuleName()` do pacote fica, como em todos os outros módulos
- **Sem IA, sem rede: o conteúdo é um catálogo estático.** Arquivos `.ts` de dados dentro do módulo de domínio com nomes que pareçam registros de verdade em português do Brasil: contas (`Conta Corrente Itaú`, `Poupança Caixa`, `Carteira`, `Nubank`), cartões (`Visa Gold`, `Mastercard Platinum`, `Elo Nanquim`) e transações avulsas (`Revisão do carro`, `Pagamento do seguro`, `Mercado`, `Farmácia`, `Presente de aniversário`, `Restaurante`, `Uber`, `Freelance`, `Venda de item usado`). Cada transação carrega direção, faixa de valor em reais, peso de sorteio e uma **dica de categoria** com o nome exato de uma subcategoria padrão, ou `null` para as entradas, que não têm categoria padrão
- **Categorias não são geradas.** O gerador só **consome** as subcategorias ativas que o usuário já tem (normalmente vindas do `Aplicar categorias padrão`): casa a dica pelo nome (sem acento e sem caixa), sorteia uma subcategoria de saída quando a dica não casa, e deixa `subcategoryId` nulo quando a dica é `null` ou o usuário não tem categoria nenhuma
- **O módulo de domínio `dev` não depende de nenhum outro módulo de domínio.** Ele só *descreve* o que deve ser criado: produz **blueprints** — objetos planos com a forma das entradas dos casos de uso, sem `id`, sem `userId` e com valores de enum como **literais de string** (`'IN'`, `'SETTLED'`, `'CHECKING'`, `'VISA'`). Quem casa blueprint com caso de uso é o backend, a camada de composição. Se um literal não bater com o enum do módulo dono, o caso de uso reprova e o erro aparece no resumo
- **O período vai de N meses atrás até o último dia do mês atual.** `months` (1..12) é o mês atual **inteiro** mais os `months - 1` anteriores; "hoje" é a data do servidor em UTC (`YYYY-MM-DD`), não o mês selecionado no cabeçalho. O mês atual entra inteiro para o extrato do mês corrente já mostrar o que foi efetivado e o que ainda vence
- **Antes de hoje, efetivada; de hoje até o fim do mês, pendente.** Transação com `expectedOn < hoje` é gravada `SETTLED` com `settledOn = expectedOn`; com `expectedOn >= hoje`, `PENDING`. Não há sorteio de `CANCELED` nem de pendência atrasada
- **A execução é síncrona, limitada e reprodutível**: um `POST` que devolve o resumo quando termina. Os tetos (10/10/500) mantêm a requisição em segundos e o banco de desenvolvimento utilizável. A `seed` opcional alimenta um gerador pseudoaleatório próprio (`mulberry32`, dentro do módulo) — **nada de `Math.random()` solto**, senão um bug encontrado não volta. Sem `seed`, o servidor sorteia uma e a devolve no resumo
- **A gravação é parcial e reportada, não transacional.** Cada registro é gravado pelo seu caso de uso; a falha de um não derruba os outros, é contada em `skipped` e o código de erro entra no resumo
- **A ordem de execução é a ordem das dependências**: contas → cartões → transações. As transações se ligam ao conjunto de contas, cartões e subcategorias **que existiam antes mais o que esta execução acabou de criar** — por isso as listas são recarregadas depois das duas primeiras etapas, e um pedido só de transações funciona em cima do que o usuário já tem
- **Sem conta não há transação**: pedido de transações sem nenhuma conta existente e sem marcar `Contas` é recusado com `DEV_DATA_ACCOUNT_REQUIRED`
- **Cartão é opcional e proporcional**: uma fração das transações de saída recebe cartão quando o usuário tem algum; entradas nunca vão em cartão
- **A `MovementReferencesQuery` é servida de memória durante a execução.** O gravador carrega uma vez as contas, os cartões e as subcategorias do usuário e passa ao `SaveTransaction` uma implementação em memória do contrato que já existe, atualizada com o que acabou de ser criado. São três consultas por gravação vezes centenas de gravações que deixam de acontecer, e nada do módulo `transaction` muda
- **O recurso é desligado por padrão e por duas portas independentes**: o backend só responde quando `DEV_TOOLS_ENABLED === 'true'` (fora disso, `404` nas rotas do gerador, como se não existissem) e o frontend só mostra a seção `Extras` do menu e o conteúdo de `/dev` quando `NEXT_PUBLIC_DEV_TOOLS_ENABLED === 'true'`. Os dois `.env.example` trazem as chaves com `true` porque são arquivos de desenvolvimento; produção não define as variáveis. Esconder o menu não é proteção — a proteção é a do servidor. Quando o frontend está ligado e o backend desligado, a tela mostra "recurso indisponível" a partir do `status`
- **O `.env.example` do frontend passa a ser versionado**, com a exceção `!.env.example` no `apps/frontend/.gitignore`: sem isso, a chave nova nunca chegaria a quem clona o projeto
- **A leitura da chave do frontend fica em um único lugar**: `modules/dev/data/dev-tools.env.ts` exporta `DEV_TOOLS_ENABLED = process.env.NEXT_PUBLIC_DEV_TOOLS_ENABLED === 'true'`. O `layout.tsx` e a página importam a constante
- **Limites e erros ficam onde as duas partes os alcançam**: os tetos em `constants/` (como o `default-categories.constant.ts`), porque o frontend também os lê; os códigos de erro em `data-generator/dev-data.errors.ts`, compartilhados pelos casos de uso das duas partes, no desenho do `movement.errors.ts`
- **A seção `Extras` é sempre a última do menu**: o prompt seguinte que mexe no `NAVIGATION_SECTIONS` (a seção de relatórios, no prompt 22) insere a sua seção antes dela e preserva a condição de ambiente
- **A tela não é um cadastro**: não tem listagem, não tem edição e não guarda nada. É uma página com **um card por gerador** — esta parte cria o de transações avulsas; a parte 2 acrescenta o de séries logo abaixo

## Negócio

- Criar o módulo com a skill `config-new-module`: `node .claude/skills/config-new-module/scripts/create-module.mjs dev`, conferindo a estrutura gerada e o namespace `@poupig`
- Organizar o conteúdo em `modules/dev/src/data-generator` e exportá-lo em `modules/dev/src/index.ts`, mantendo o `getModuleName()` e o teste do scaffold
- Criar `data-generator/constants/dev-data-limits.constant.ts` (+ `constants/index.ts`) com `DEV_DATA_LIMITS` (`maxAccounts: 10`, `maxCreditCards: 10`, `maxTransactions: 500`, `maxMonths: 12`), documentando que os tetos mantêm a execução síncrona e o banco de desenvolvimento utilizável e que a parte 2 acrescenta os seus
- Criar `data-generator/dev-data.errors.ts` com `DevDataErrors` (`as const`): `INVALID_DEV_DATA_REQUEST` (nada marcado), `INVALID_DEV_DATA_QUANTITY` (fora da faixa), `INVALID_DEV_DATA_PERIOD`, `INVALID_DEV_DATA_SEED`, `DEV_DATA_ACCOUNT_REQUIRED` e `DEV_DATA_DISABLED` (usado pelo controller e traduzido no front)
- Criar o catálogo estático em `data-generator/catalog/` — um arquivo por tema, todos `as const`, só dados, sem lógica:
  - `accounts.catalog.ts`: nomes de conta com `type` (literal de `AccountType`), `financialInstitution`, `icon` (chave do `lucide-react`) e `color` (`#RRGGBB`)
  - `credit-cards.catalog.ts`: nomes com `brand` (literal de `CardBrand`), `color`, faixa de limite **em reais** (o planejador converte para centavos) e pares plausíveis de `closingDay`/`dueDay`
  - `one-off.catalog.ts`: avulsos de saída (`Revisão do carro`, `Pagamento do seguro`, `Mercado`, `Farmácia`, `Restaurante`, `Uber`, `Presente de aniversário`, `Padaria`, `Combustível`…) e de entrada (`Freelance`, `Venda de item usado`, `Reembolso`), com `direction` (`'IN'`/`'OUT'`), faixa de valor, peso de sorteio (mercado aparece mais que revisão do carro) e `categoryHint`
  - Documentar em cada arquivo que os nomes respeitam 2..100 caracteres (limites do `MovementName`, do `AccountName` e do nome de cartão), que as dicas de categoria são nomes **exatos** de subcategorias padrão (listados em Contexto Atual) e que o módulo não importa `@poupig/category`
- Criar os DTOs em `data-generator/dto/` (skill: module-dto):
  - `DevDataPeriodDTO`: `from` e `to` (`YYYY-MM-DD`, primeiro dia do mês mais antigo e último dia do mês atual) e `today`
  - `DevDataItemSummaryDTO`: `{ requested, created, skipped, errors: string[] }` — compartilhado pelos resumos das duas partes
  - `TransactionDataRequestDTO`: `accounts`, `creditCards`, `transactions` (cada um `number` — `0` significa "não marcado"), `months` e `seed?`
  - Blueprints com a forma da entrada do caso de uso correspondente **sem** `id` e **sem** `userId`, e enums como literais de string: `AccountBlueprint` (`name`, `type`, `financialInstitution`, `icon`, `color`), `CreditCardBlueprint` (`name`, `brand`, `closingDay`, `dueDay`, `lastFourDigits`, `limit` em centavos, `color`) e `TransactionBlueprint` (`name`, `value`, `direction`, `expectedOn`, `status`, `settledOn`, `note`, `categoryHint: string | null`, `accountIndex`, `creditCardIndex: number | null`). As **posições** substituem ids: o gravador as resolve contra as listas que ele mesmo carregou. Documentar que a semelhança com as entradas é proposital e que quem preenche `userId` e os ids é o backend
  - `TransactionDataPlanDTO`: `accounts`, `creditCards`, `transactions`, `seed` e `period`
  - `TransactionDataSummaryDTO`: `accounts`, `creditCards` e `transactions` (cada um `DevDataItemSummaryDTO`) e `seed`
- Criar `data-generator/model/pseudo-random.ts` — `createRandom(seed: number)` (`mulberry32`), devolvendo `int(min, max)`, `pick(list)`, `weightedPick(list, weight)` e `chance(probability)`. Documentar que a semente é o que torna a execução reprodutível e que `Math.random()` não aparece em lugar nenhum do módulo
- Criar `data-generator/model/dev-data-planner.service.ts` (skill: module-domain-service): classe `DevDataPlanner` com métodos estáticos puros, como os serviços de domínio do projeto:
  - `periodOf(months, today): DevDataPeriodDTO` — aritmética em UTC sobre `YYYY-MM-DD`; reaproveitado pela parte 2
  - `planAccounts(quantity, random)` e `planCreditCards(quantity, random)` — sorteiam do catálogo sem repetir nome **dentro do plano**, sorteiam `lastFourDigits`, o limite na faixa (convertido para centavos) e o par `closingDay`/`dueDay`
  - `planTransactions(quantity, period, links, random)` — distribui as datas por todo o período (mês atual inteiro), sorteia o molde por peso, o valor dentro da faixa (duas casas) e a conta/cartão por posição entre os vínculos disponíveis (cartão só em saída), aplica a regra `status`/`settledOn` das Decisões e mantém uma proporção de saída bem maior que a de entrada
  - `links` é um objeto plano (`accountCount`, `creditCardCount`) — o planejador **não** conhece DTO de outro módulo e trabalha com contagens, nunca com ids nem nomes de categoria
- Criar `data-generator/use-case/plan-transaction-data.use-case.ts` (skill: module-use-case) com `PlanTransactionData`: recebe o `TransactionDataRequestDTO`, `today` e `links`; valida (ao menos um item marcado, quantidades inteiras dentro dos tetos, período válido, semente inteira, e `DEV_DATA_ACCOUNT_REQUIRED` quando o pedido tem transação sem conta existente nem conta a criar), sorteia a semente quando ausente, chama o planejador e devolve `Result<TransactionDataPlanDTO>`. **Não persiste nada** — o plano é o produto
- Criar os testes em `modules/dev/test/data-generator/` (skills: module-domain-service, module-use-case), com semente fixa, cobrindo: pedido vazio recusado; quantidade acima do teto e fracionária recusadas; transação sem conta recusada; mesma semente produzindo o mesmo plano; `periodOf` na virada de ano e com 1 e 12 meses; datas sempre dentro do período e cobrindo o mês atual; tudo antes de `today` como `SETTLED` com `settledOn = expectedOn` e tudo de `today` em diante como `PENDING` sem `settledOn`; entradas nunca com cartão; nomes do catálogo sempre dentro de 2..100; limite de cartão em centavos inteiros; e dicas de categoria do catálogo pertencentes à lista de subcategorias padrão (lista copiada no teste, sem importar `@poupig/category`)

## Backend

- Acrescentar em `apps/backend/.env.example` (e no `.env` local) `DEV_TOOLS_ENABLED="true"`, com um comentário de que produção não define a variável
- Remover do scaffold: `apps/backend/src/modules/dev/dev.prisma.ts`, `apps/backend/prisma/models/dev.model.prisma` e a rota de exemplo do controller
- Criar `apps/backend/src/modules/dev/dev.config.ts` com `DevConfig` (`@Injectable()`): lê `DEV_TOOLS_ENABLED` pelo `ConfigService` e expõe `isEnabled`
- Criar `apps/backend/src/modules/dev/in-memory-movement-references.ts` — implementação em memória da `MovementReferencesQuery` (de `@poupig/transaction`), montada a partir dos ids carregados pelo gravador e com métodos para acrescentar os ids criados na execução. Não altera nada no módulo `transaction`
- Criar `apps/backend/src/modules/dev/data-generator.writer.ts` com `DataGeneratorWriter` (`@Injectable()`) — a camada de composição, e o único lugar que conhece os dois lados:
  - injeta `AccountPrisma`, `CreditCardPrisma`, `CategoryPrisma` e `TransactionPrisma` (a parte 2 acrescenta os adapters de série e de agendada)
  - `loadLinks(userId)`: carrega contas e cartões percorrendo as páginas de `findAccountsByUserId`/`findCreditCardsByUserId` até alcançar o `total`, e as categorias com `findCategoriesByUserId`, guardando as subcategorias **ativas** de categorias ativas. Devolve as contagens para o planejador e mantém as listas para a gravação
  - `resolveLinks(...)`: resolve `accountIndex`/`creditCardIndex` em ids (índice sobre a lista recarregada) e `categoryHint` em `subcategoryId` (sem acento e sem caixa; sem casamento, sorteio de uma subcategoria de saída pela semente do plano; dica `null` ou usuário sem subcategoria, `null`) — reaproveitado pela parte 2
  - `writeTransactionData(userId, plan)`: grava na ordem contas → cartões → transações, montando os casos de uso à mão:
    - contas: `new SaveAccount(accountPrisma)` com `id: randomUUID()`; em `ACCOUNT_NAME_ALREADY_EXISTS`, acrescenta um sufixo numérico ao nome e tenta **uma** vez; persistindo, conta em `skipped`
    - cartões: `new SaveCreditCard(creditCardPrisma)` com `id: randomUUID()`, mesma regra de colisão com `CREDIT_CARD_NAME_ALREADY_EXISTS`
    - recarrega contas e cartões **depois** das duas primeiras etapas e atualiza a referência em memória
    - transações: `new SaveTransaction(transactionPrisma, references)` **sem** `id`
    - acumula o `TransactionDataSummaryDTO`: uma falha de registro nunca interrompe a execução
- Reescrever `apps/backend/src/modules/dev/dev.controller.ts` como `@Controller('dev/data-generator')` (skill: backend-controller):
  - `GET status` → `{ enabled }`; `POST transactions` → `TransactionDataSummaryDTO`
  - a **primeira** coisa de cada método é a checagem do ambiente: desligado lança `NotFoundException([DevDataErrors.DEV_DATA_DISABLED])`
  - o dono vem sempre do `@CurrentUser()`; o corpo **não** aceita `userId`. Quantidades, `months` e `seed` podem chegar como string: converter num helper privado e deixar o valor não numérico virar erro de validação do domínio, nunca `NaN` silencioso
  - calcula `today` (UTC, `YYYY-MM-DD`), chama `writer.loadLinks(userId)`, executa o `PlanTransactionData` e entrega o plano ao `writer.writeTransactionData(userId, plan)`
  - mapeia falha: `BadRequestException` com a lista de códigos para os erros de validação e para `DEV_DATA_ACCOUNT_REQUIRED`
- Reescrever `apps/backend/src/modules/dev/dev.module.ts` importando `AccountModule`, `CreditCardModule`, `CategoryModule` e `TransactionModule` (todos exportam seus adapters) e registrando o controller, o `DataGeneratorWriter` e o `DevConfig`. Sem `DbModule` direto: o módulo não tem adapter próprio
- Criar `apps/backend/src/modules/dev/data-generator.integration.http` no formato Rest Client, cobrindo: `GET status` com o recurso ligado e desligado (404); execução só de contas; execução completa, conferindo depois no `GET /transactions` que os dias passados vêm `SETTLED` e os de hoje em diante do mês atual vêm `PENDING`; transações sem nenhuma conta (400); quantidade acima do teto (400); pedido sem nada marcado (400); duas execuções com a mesma `seed` (mesmos nomes, com sufixo de colisão na segunda); e acesso sem token (401)
- Garantir os testes do backend e do domínio verdes ao final desta seção

## Frontend

> Executar na ordem. Cada passo só depende dos anteriores.

1. **Ambiente e chave**:
   - acrescentar `!.env.example` ao `apps/frontend/.gitignore`, logo depois da regra `.env*`, para o arquivo de exemplo passar a ser versionado
   - acrescentar em `apps/frontend/.env.example` (e no `.env.local`) `NEXT_PUBLIC_DEV_TOOLS_ENABLED=true`, com um comentário de que o valor é embutido no build e de que produção não define a variável
   - criar `modules/dev/data/dev-tools.env.ts` com `DEV_TOOLS_ENABLED = process.env.NEXT_PUBLIC_DEV_TOOLS_ENABLED === 'true'`
2. **Cliente HTTP** (`data/data-generator-api.client.ts`), no formato dos outros módulos: `DataGeneratorApiError`, `fetchDataGeneratorStatus(token)` e `generateTransactionData(token, payload)`, com os DTOs importados de `@poupig/dev`
3. **Dicionário de erros**: acrescentar `INVALID_DEV_DATA_REQUEST`, `INVALID_DEV_DATA_QUANTITY`, `INVALID_DEV_DATA_PERIOD`, `INVALID_DEV_DATA_SEED`, `DEV_DATA_ACCOUNT_REQUIRED` e `DEV_DATA_DISABLED` em `shared/i18n/messages.pt.ts` **e** `messages.en.ts`, verificando que os códigos que o resumo pode trazer dos outros módulos (`ACCOUNT_NAME_ALREADY_EXISTS`, `CREDIT_CARD_NAME_ALREADY_EXISTS`, `MOVEMENT_*`, `TRANSACTION_*`...) já têm tradução
4. **Schema do formulário** (`data/transaction-data.schema.ts`, skill: frontend-form-schema): quantidades, `months` e `seed` validados contra o `DEV_DATA_LIMITS` importado de `@poupig/dev` (nada de repetir os números no front), com refinamento exigindo ao menos um item marcado. As caixas de seleção ficam fora do schema, como o `isActive` dos cadastros
5. **Hooks** (`data/use-data-generator.ts`): `useDataGeneratorStatus()` (lê o status uma vez, estado gravado só no retorno da promessa) e `useGenerateTransactionData()` (`generate`, `isSubmitting`, `summary`, `error` traduzido por `getErrorMessage`). Sem `any`
6. **Componentes reaproveitáveis pelas duas partes**:
   - `components/data-generator-quantity-row.component.tsx`: `Checkbox` + `Input` numérico de quantidade, com o campo desabilitado enquanto a caixa está desmarcada e o teto exibido ao lado
   - `components/data-generator-result.component.tsx`: tabela com uma linha por item de resumo (`rótulo`, `solicitados`, `criados`, `ignorados`), a semente em um `Badge` e a lista de códigos de erro traduzidos quando houver; antes da primeira execução, `EmptyListState`
7. **Gerador desta parte** (`components/transaction-data-generator.component.tsx`), com `react-hook-form` + `v.resolver`, num `Card` com título `Transações avulsas`: `FormSectionLayout` `Cadastros de apoio` (contas, cartões), `Transações` (transações avulsas) e `Opções` (período, semente), o botão de gerar e o `DataGeneratorResult` logo abaixo. Ao terminar, `toast` com o total criado
8. **Tela** (`pages/data-generator.page.tsx`): `PageSectionHeader` com badge `Desenvolvimento` e título `Gerador de Massa de Dados`, um aviso curto de que os dados são gravados na conta do usuário logado, que os dias anteriores a hoje nascem efetivados e que as categorias padrão devem estar aplicadas para as transações ganharem categoria; em seguida, a lista de geradores (nesta parte, só o `TransactionDataGenerator`; a parte 2 acrescenta o de séries abaixo). Quando `DEV_TOOLS_ENABLED` for falso ou o `status` responder desligado, a página mostra só a mensagem de recurso indisponível. Sem guard na página: a proteção já está no layout do grupo `(private)`
9. **Substituir o scaffold**: remover `components/dev-dashboard.component.tsx` e `pages/dashboard.page.tsx`; fazer `app/(private)/dev/page.tsx` renderizar a `DataGeneratorPage`
10. **Menu** (`app/(private)/layout.tsx`): remover da primeira seção o item que a skill anexou e acrescentar, **no fim do array**, a seção `{ id: 'extras', label: 'Extras', items: [{ id: 'dev', label: 'Desenvolvimento', href: '/dev', icon: CodeXml, match: 'prefix' }] }`, incluída por espalhamento condicionado à constante importada de `@/modules/dev/data/dev-tools.env` (`...(DEV_TOOLS_ENABLED ? [EXTRAS_SECTION] : [])`), sem reordenar as outras seções e sem outro `process.env` no arquivo. Remover o import de ícone que a skill tenha acrescentado e ficado sem uso
11. **Barris**: `modules/dev/data/index.ts` e `modules/dev/index.ts`
12. **Fechar a mudança**:
    - `npm run build` verde no workspace e testes do domínio e do backend verdes
    - `npx eslint` **sem `--fix`** nos arquivos criados ou alterados, de frontend e de backend, sem nenhum erro — os erros pré-existentes continuam como estão. **Não** rodar `npm run lint` no backend
    - Diff limitado ao que a skill gera (`modules/dev`, `apps/backend/src/modules/dev`, `app.module.ts`, os dois `package.json` e o `package-lock.json`), ao conteúdo desta mudança em `apps/backend/src/modules/dev` e `apps/frontend/src/modules/dev`, a `app/(private)/dev/page.tsx`, à seção `extras` do `layout.tsx`, ao `shared/i18n`, aos dois `.env.example` e ao `apps/frontend/.gitignore`, e à remoção do `dev.model.prisma`

## Fora de Escopo

- Recorrências, parcelamentos e ocorrências de série: são a parte 2 (prompt 20), depois de a transação agendada existir
- **Apagar dados**: nem "limpar tudo do usuário", nem desfazer uma execução, nem marcar registro como gerado para removê-lo depois. O que é criado é dado comum do usuário, indistinguível do que ele digitou
- Gerar categorias e subcategorias, ou aplicar as categorias padrão automaticamente
- Qualquer uso de IA, chamada externa ou dependência nova — o conteúdo é o catálogo estático e ponto
- Criar usuários, criar dados para outro usuário que não o autenticado, e qualquer rota administrativa
- Transações `CANCELED`, pendências atrasadas e datas depois do fim do mês atual
- Execução assíncrona, fila, barra de progresso, streaming da resposta e cancelamento no meio
- Perfis salvos de geração, histórico de execuções e reexecução a partir do histórico
- Importar dados de arquivo (CSV, OFX, extrato de banco) e exportar o que foi gerado
- Distribuição estatística configurável (média, desvio, sazonalidade) dos valores gerados
- Ler variáveis de ambiente no navegador por outro caminho (endpoint de configuração, `cookie`, `localStorage`)
- Testes automatizados do frontend (o projeto não tem suíte) e teste via navegador
- Qualquer alteração de comportamento nos módulos `account`, `category`, `credit-card`, `transaction` e `auth`
- Corrigir os erros de lint pré-existentes

## Pasta do Módulo

- Domínio: `modules/dev/src/data-generator` (`constants/`, `catalog/`, `dto/`, `model/`, `use-case/`, `dev-data.errors.ts`), com `modules/dev/src/index.ts` como barril
- Testes do domínio: `modules/dev/test/data-generator`
- Backend do módulo: `apps/backend/src/modules/dev` (`dev.controller.ts`, `dev.module.ts`, `dev.config.ts`, `data-generator.writer.ts`, `in-memory-movement-references.ts`, `index.ts`)
- Testes de integração: `apps/backend/src/modules/dev/data-generator.integration.http`
- Ambiente: `apps/backend/.env.example`, `apps/frontend/.env.example` e `apps/frontend/.gitignore`
- Menu: `apps/frontend/src/app/(private)/layout.tsx` (só a seção `extras` e a retirada do item anexado pela skill)
- Rota: `apps/frontend/src/app/(private)/dev/page.tsx` (gerada pela skill; passa a renderizar a tela do gerador)
- Página: `apps/frontend/src/modules/dev/pages/data-generator.page.tsx`
- Componentes: `apps/frontend/src/modules/dev/components` (`data-generator-quantity-row.component.tsx`, `data-generator-result.component.tsx`, `transaction-data-generator.component.tsx`)
- Ger. de Estado: `apps/frontend/src/modules/dev/data` (`dev-tools.env.ts`, `data-generator-api.client.ts`, `transaction-data.schema.ts`, `use-data-generator.ts`)
- Dicionário de erros: `apps/frontend/src/shared/i18n/messages.pt.ts` e `messages.en.ts`
- **Sem modelo do Prisma e sem migração** (o `dev.model.prisma` do scaffold é removido)

## Instruções

- O código deverá ser escrito em inglês, usando os termos da linguagem ubíqua (`Direction` `IN`/`OUT`, `TransactionStatus` `SETTLED`/`PENDING`); os **dados do catálogo** (nomes de contas, cartões e transações) são em português do Brasil, porque são o que o usuário vê na tela
- A especificação deverá ser escrita em português do brasil
- Concluir antes os prompts 15 e 16
- Use as skills mencionadas (`config-new-module`, `module-dto`, `module-domain-service`, `module-use-case`, `backend-controller`, `frontend-form-schema`)
- Seguir os padrões que o projeto já tem: serviços de domínio como classes com métodos estáticos, erros `as const`, `JwtGuard` global com o dono vindo de `@CurrentUser()` (sem `@UseGuards` nem `@Public()`), e o módulo `dev` **sem repositório, sem entidade e sem modelo Prisma**
- Desenhar catálogo, planejador, DTOs de resumo, gravador e componentes para a parte 2 **estender** sem duplicar (período, resolução de vínculos, linha de quantidade e tabela de resultado são compartilhados)
- Reaproveitar o que já existe (`Result` do `@poupig/shared`, `SaveAccount`/`SaveCreditCard`/`SaveTransaction`, os adapters Prisma exportados pelos módulos, a `MovementReferencesQuery`, `useAuth`, `getErrorMessage`, o validador `v` e os componentes de `shared/components/ui`), sem duplicar
- Não criar nenhum VO novo, nenhuma entidade nova e nenhuma tabela nova
- Nada de aritmética de data com fuso: as datas são calculadas em UTC e trafegam como `YYYY-MM-DD`
- Nada de `setState` síncrono em `useEffect` e nada de `any`
- Nenhuma dependência nova em nenhum `package.json` além do `@poupig/dev` que a skill registra
- Executar a seção de negócio, backend e frontend em sub agentes separados, mas de forma sequencial
- Garantir no final o build do projeto funcionando (`npm run build`), os testes de domínio/backend verdes (`npm test`) e nenhum erro de lint novo nos arquivos tocados (`npx eslint` sem `--fix`) — o frontend não tem suíte de testes
- Não executar teste via Web Browser (farei testes manuais)

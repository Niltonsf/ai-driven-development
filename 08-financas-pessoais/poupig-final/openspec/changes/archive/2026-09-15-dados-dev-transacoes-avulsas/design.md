## Context

Ver `proposal.md` — Why. Requisitos em `specs/`. Restrições do estado atual que moldam a abordagem:

- Os prompts 15 (`transacao-base-crud`) e 16 (`extrato-mensal`) estão arquivados. `SaveTransaction(transactionRepository, movementReferences)` cria quando a entrada não tem `id` e devolve `Result<{ id }>`; a `MovementReferencesQuery` (`accountBelongsToUser`, `creditCardBelongsToUser`, `subcategoryBelongsToUser`, cada uma `Promise<Result<boolean>>`) é implementada por `TransactionPrisma.movementReferences`.
- `SaveAccount(accountPrisma)` e `SaveCreditCard(creditCardPrisma)` exigem `id` (o controller gera `randomUUID()`) e devolvem `Result<void>`; recusam nome repetido do usuário com `ACCOUNT_NAME_ALREADY_EXISTS`/`CREDIT_CARD_NAME_ALREADY_EXISTS`, verificado pelo caso de uso. O `limit` do cartão é inteiro em centavos.
- `findAccountsByUserId`/`findCreditCardsByUserId` (`execute(userId, page, pageSize)`) paginam com `{ items, total, page, pageSize }`; `findCategoriesByUserId.execute(userId)` devolve as categorias com `subcategories`. `AccountModule`, `CreditCardModule`, `CategoryModule` e `TransactionModule` exportam os adapters Prisma.
- **Categoria e subcategoria não têm direção** no modelo: as categorias padrão são todas de despesa e não existe categoria de entrada. "Subcategoria de saída" significa, na prática, qualquer subcategoria ativa de categoria ativa.
- Todo módulo de domínio depende só de `@poupig/shared`. Dados estáticos de domínio seguem o precedente `constants/default-categories.constant.ts`; objeto de erros sem entidade segue `movement.errors.ts`. Serviços de domínio são classes com métodos estáticos.
- Backend: `ConfigModule.forRoot({ isGlobal: true })` no `SharedModule`, `JwtGuard` global via `APP_GUARD`, dono via `@CurrentUser()`. Os controllers montam casos de uso à mão dentro do método e declaram `@HttpCode` explicitamente nos `POST`.
- Frontend: `NAVIGATION_SECTIONS` em `app/(private)/layout.tsx` (`'use client'`) com `main` e `registrations`; Next.js embute `NEXT_PUBLIC_*` no build por comparação literal. `apps/frontend/.gitignore` ignora `.env*`, então o `.env.example` do frontend nunca foi versionado. Não há suíte de testes no frontend.
- A skill `config-new-module` gera scaffold com adapter Prisma, `dev.model.prisma`, rota de exemplo, dashboard vazio e um item de menu na **primeira** seção — tudo isso precisa ser desfeito.
- Lint pré-existente: 88 erros no frontend, 58 erros e 1 aviso no backend; o `npm run lint` do backend aplica `--fix`.
- A implementação roda em **três sub-agentes sequenciais** — (1) negócio, (2) backend, (3) frontend — e cada grupo fecha com a própria verificação. Sem teste via navegador.

## Goals / Non-Goals

**Goals:**

- Domínio que só **descreve** (plano puro, testável com semente fixa) e backend que só **compõe** (casa plano com casos de uso existentes).
- Reprodutibilidade total do plano a partir de `seed` + pedido + `today` + contagens existentes.
- Pontos de extensão explícitos para a parte 2 (prompt 20): período, gerador pseudoaleatório, limites, erros, resumo por item, resolução de vínculos, gravador, linha de quantidade e tabela de resultado.
- Nenhuma alteração em arquivo de outro módulo; zero `any`, zero `setState` síncrono em efeito, zero `Math.random()` no módulo.

**Non-Goals:**

- Não otimizar a gravação em lote (`createMany`) nem abrir transação de banco — cada registro passa pelo seu caso de uso.
- Não criar endpoint de configuração pública nem ler a chave do backend no frontend por outro caminho que o `status`.
- Não generalizar um "framework de geradores" antes da parte 2 existir; só separar o que a parte 2 comprovadamente reaproveita.

## Decisions

### 1. Scaffold pela skill, depois substituído

Rodar `node .claude/skills/config-new-module/scripts/create-module.mjs dev`, conferir o namespace `@poupig` e, em seguida, remover `dev.prisma.ts`, `apps/backend/prisma/models/dev.model.prisma`, a rota de exemplo do controller, `dev-dashboard.component.tsx`, `dashboard.page.tsx` e o item anexado à primeira seção do menu (com o import de ícone que sobrar). `getModuleName()` e o teste do scaffold ficam. Rodar `npx prisma generate` depois de remover o `.model.prisma` só se o build acusar diferença — não há migração.

Alternativa: criar o módulo à mão sem scaffold — rejeitada, a skill registra `DevModule` no `app.module.ts` e as dependências `@poupig/dev` de forma determinística.

### 2. Blueprints com literais de string e posições no lugar de ids

`AccountBlueprint`, `CreditCardBlueprint` e `TransactionBlueprint` têm a forma das entradas de `SaveAccount`/`SaveCreditCard`/`SaveTransaction` **sem** `id` e `userId`, com enums como literais (`'CHECKING'`, `'VISA'`, `'OUT'`, `'SETTLED'`). A transação carrega `accountIndex`, `creditCardIndex: number | null` e `categoryHint: string | null` em vez de ids. O backend é o único que conhece os dois lados: completa `userId`, gera ids e resolve posições e dicas. JSDoc em cada blueprint registra que a semelhança com as entradas é proposital.

Alternativas: importar `@poupig/account`/`credit-card`/`transaction` no domínio `dev` para tipar com os enums reais — rejeitada, quebra a regra de que módulo de domínio não importa outro; o planejador receber listas de ids — rejeitada, amarraria o plano ao estado do banco e tornaria os testes dependentes de fixtures de outros módulos. O risco de literal divergente é aceito: o caso de uso dono reprova e o código aparece no resumo.

### 3. Catálogo estático `as const`, um arquivo por tema

`catalog/accounts.catalog.ts` (≥ 10 entradas: `name`, `type`, `financialInstitution`, `icon` do `lucide-react`, `color`), `catalog/credit-cards.catalog.ts` (≥ 10: `name`, `brand`, `color`, `limitRange` em reais, `billingDays` com pares `closingDay`/`dueDay`) e `catalog/one-off.catalog.ts` (moldes com `name`, `direction`, `valueRange` em reais, `weight`, `categoryHint`). Só dados, sem lógica, com um cabeçalho documentando: nomes em 2..100 caracteres, dicas como nomes **exatos** de subcategorias padrão, entradas com dica `null` e ausência de import de `@poupig/category`. O teste copia a lista de subcategorias padrão e confere todas as dicas.

### 4. Gerador pseudoaleatório `mulberry32` e semente vinda de fora

`model/pseudo-random.ts` exporta `createRandom(seed)` com `next()` em `[0, 1)`, `int(min, max)` (inclusivo), `pick(list)`, `weightedPick(list, weight)`, `chance(probability)` e `shuffle(list)` (Fisher–Yates, sem mutar a entrada). A semente é normalizada com `>>> 0`.

A semente ausente é sorteada **fora do domínio**: `PlanTransactionData` recebe no construtor um `SeedSource` (`() => number`). O backend injeta `() => randomInt(0, 2 ** 31)` de `node:crypto`; os testes injetam uma função fixa. Assim `Math.random()` não aparece no módulo e o caminho "sem semente" também é testável.

Alternativas: `Math.random()` dentro do caso de uso — rejeitada pela regra de reprodutibilidade; derivar de `Date.now()` — rejeitada, é aleatoriedade escondida e torna o teste dependente do relógio.

### 5. `DevDataPlanner` com métodos estáticos puros

- `periodOf(months, today)`: separa `YYYY-MM-DD` em números e usa `Date.UTC(year, monthIndex - (months - 1), 1)` para o início e `Date.UTC(year, monthIndex + 1, 0)` para o fim, formatando com `getUTC*` e padding manual. `Date.UTC` normaliza mês negativo, cobrindo a virada de ano sem `if`. Também exporta `monthsOf(period)` (lista `{ year, month, lastDay }`), reaproveitado pela parte 2.
- `planAccounts(quantity, random)`/`planCreditCards(quantity, random)`: `shuffle` do catálogo e `slice(0, quantity)` — sem repetição por construção. Cartão: `lastFourDigits` com `int(0, 9999)` e padding; `limit = int(min, max)` em reais × 100 (sempre inteiro); par de dias por `pick`.
- `planTransactions(quantity, period, links, random)`:
  1. `inCount = Math.floor(quantity * 0.15)` (≤ 20% exigido no spec); direções `[IN × inCount, OUT × resto]` embaralhadas.
  2. Meses do período em ordem **do atual para o mais antigo**; a transação `i` cai no mês `i % months` — garante o mês atual com uma transação e todos os meses quando `quantity >= months`. Dia por `int(1, lastDay)`.
  3. Molde por `weightedPick` entre os da direção; `value = int(min * 100, max * 100) / 100`.
  4. `accountIndex = int(0, accountCount - 1)`; cartão só em `OUT` com `creditCardCount > 0` e `chance(0.35)`.
  5. `status`/`settledOn` pela comparação de strings `expectedOn < today` (lexicográfica é válida para `YYYY-MM-DD`); `note: null`.
  6. Ordenação estável por `expectedOn`.
- `links` é `{ accountCount, creditCardCount }` — contagens, nunca ids nem nomes.

### 6. `PlanTransactionData` valida, soma vínculos e planeja

Entrada `{ request: TransactionDataRequestDTO, today, links }`. Validação em duas fases: (a) regras de formato acumuladas sem repetição — `INVALID_DEV_DATA_REQUEST` (nenhuma quantidade > 0), `INVALID_DEV_DATA_QUANTITY` (`Number.isInteger` e `0..teto`, `NaN` incluso), `INVALID_DEV_DATA_PERIOD` (`Number.isInteger` e `1..maxMonths`), `INVALID_DEV_DATA_SEED` (`Number.isSafeInteger` quando presente); (b) só se (a) passou, `DEV_DATA_ACCOUNT_REQUIRED`. Depois resolve a semente (`request.seed ?? seedSource()`), cria **um** `random` e chama, nesta ordem fixa, `periodOf`, `planAccounts`, `planCreditCards` e `planTransactions` com `links` somados às quantidades planejadas (`accountCount + accounts`, `creditCardCount + creditCards`). Devolve `Result<TransactionDataPlanDTO>` e não persiste nada.

A ordem fixa de consumo do `random` é parte do contrato de reprodutibilidade: mudar a ordem muda o plano de uma semente já compartilhada, e o teste "mesma semente, mesmo plano" não pega isso — registrar em comentário.

### 7. Limites em `constants/`, erros ao lado do caso de uso

`data-generator/constants/dev-data-limits.constant.ts` com `DEV_DATA_LIMITS` (`as const`) — o frontend importa para o schema. `data-generator/dev-data.errors.ts` com `DevDataErrors` (`as const`) — compartilhado com a parte 2. Os dois exportados pelo barril `modules/dev/src/index.ts`.

### 8. Chave de ambiente no backend: `DevConfig` e checagem como primeira linha

`DevConfig` (`@Injectable()`) lê `DEV_TOOLS_ENABLED` pelo `ConfigService` e expõe `get isEnabled(): boolean` (`=== 'true'`). Cada método do controller começa com `this.assertEnabled()`, que lança `NotFoundException([DevDataErrors.DEV_DATA_DISABLED])`. O corpo chega como `Record<string, unknown>` e só é lido depois da checagem.

Alternativas: não registrar o controller quando desligado (módulo dinâmico) — rejeitada, o `404` genérico perde o código que o frontend traduz e a leitura acontece no boot, dificultando alternar em teste; guard dedicado — rejeitada, o `JwtGuard` global roda antes e a checagem é uma linha por método.

### 9. Controller fino com conversão explícita

`@Controller('dev/data-generator')`; `@Get('status')` → `{ enabled: true }`; `@Post('transactions')` com `@HttpCode(HttpStatus.OK)` (é uma execução que devolve resumo, não um recurso criado — mesmo critério do login). Helper privado `toNumber(value: unknown): number | undefined`: `undefined`/`null`/`''` → `undefined`; `number` → ele mesmo; string → `Number(value.trim())`, que dá `NaN` para texto e cai na validação do domínio com o código do campo; qualquer outro tipo → `NaN`. Quantidades `undefined` viram `0`, `months` e `seed` seguem `undefined`. `today = new Date().toISOString().slice(0, 10)` — aqui UTC **é** a definição de hoje (ao contrário do extrato, que trabalha com data local). Fluxo: `writer.loadLinks(userId)` → `new PlanTransactionData(seedSource).execute(...)` → falha vira `BadRequestException(codes)` → `writer.writeTransactionData(userId, plan, links)`.

### 10. `DataGeneratorWriter`: composição, vínculos e gravação parcial

- `loadLinks(userId)`: pagina `findAccountsByUserId`/`findCreditCardsByUserId` com `pageSize = 100` até `items` acumulados alcançarem `total` (ou página vazia), filtra ativos, e lê `findCategoriesByUserId` guardando subcategorias ativas de categorias ativas. Devolve `DataGeneratorLinks` com as listas (`{ id, name }`) e as contagens para o planejador. Falha de leitura propaga como erro `500` — sem vínculos não há como gravar.
- `resolveLinks(blueprint, links, random)`: `accountId = accounts[accountIndex % accounts.length]`, `creditCardId` idem quando não nulo e houver cartões; `subcategoryId` por nome normalizado (`normalize('NFD')`, remoção de diacríticos, `toLowerCase()`, `trim()`); sem casamento, `random.pick(subcategories)`; dica `null` ou lista vazia, `null`. O `random` da resolução é um `createRandom(plan.seed)` **separado** do do plano, para a resolução não alterar o plano.
- O **módulo** (`%`) cobre o caso de uma conta ou cartão do plano ter sido ignorado: a lista recarregada fica menor que a contagem planejada e a posição ainda resolve para um registro real.
- `writeTransactionData(userId, plan, links)`: laço **sequencial** (sem `Promise.all`, para a checagem de nome do caso de uso não disputar consigo mesma):
  1. contas: `new SaveAccount(accountPrisma).execute({ ...blueprint, id: randomUUID(), userId })`; em `ACCOUNT_NAME_ALREADY_EXISTS`, `nextAvailableName(name, knownNames)` escolhe o menor `n ≥ 2` com `${name} ${n}` fora dos nomes conhecidos e tenta uma vez; nome gravado entra em `knownNames`.
  2. cartões: mesma regra com `SaveCreditCard` e `CREDIT_CARD_NAME_ALREADY_EXISTS`.
  3. recarrega contas e cartões e atualiza o `InMemoryMovementReferences`.
  4. transações: `new SaveTransaction(transactionPrisma, references).execute({ ...resolved, userId })`, sem `id`.
  5. acumula `DevDataItemSummaryDTO` por item (`errors` com `Set` preservando ordem). Toda falha devolvida como `Result` pelos casos de uso conta em `skipped` com os seus códigos, sem interromper o laço. Exceção lançada (banco fora do ar, bug de infraestrutura) **não** é capturada: propaga como `500`, porque continuar gravando sobre uma infraestrutura quebrada só multiplicaria o erro e não existe código de domínio para traduzir.

Alternativas: `prisma.$transaction` envolvendo tudo — rejeitada, a decisão de produto é gravação parcial e reportada; `createMany` — rejeitada, pularia as validações dos casos de uso.

### 11. `MovementReferencesQuery` em memória

`InMemoryMovementReferences implements MovementReferencesQuery` guarda três `Set<string>` (contas, cartões, subcategorias) do próprio usuário e responde `ok(set.has(id))` ignorando o `userId` (os conjuntos já são do usuário). Tem `replaceAccounts(ids)`, `replaceCreditCards(ids)` e `setSubcategories(ids)`. Evita três consultas por transação (até 1500 consultas por execução) sem mudar nada no módulo `transaction`.

Alternativa: `transactionPrisma.movementReferences` direto — rejeitada pelo custo; cache dentro do adapter — rejeitada, alteraria o módulo `transaction`.

### 12. `DevModule` sem adapter próprio

`imports: [AccountModule, CreditCardModule, CategoryModule, TransactionModule]`, `controllers: [DevController]`, `providers: [DataGeneratorWriter, DevConfig]`. Sem `DbModule` direto e sem `exports`. O `index.ts` do backend exporta o módulo.

### 13. Frontend: chave, cliente e hooks

- `data/dev-tools.env.ts`: `export const DEV_TOOLS_ENABLED = process.env.NEXT_PUBLIC_DEV_TOOLS_ENABLED === 'true';` — único `process.env` do recurso; layout e página importam a constante.
- `data/data-generator-api.client.ts`: `DataGeneratorApiError` com `status` e `codes`, `fetchDataGeneratorStatus(token)` e `generateTransactionData(token, payload)`, no formato dos clientes existentes (`headers(token)`, `handleError`), DTOs de `@poupig/dev`.
- `data/use-data-generator.ts`:
  - `useDataGeneratorStatus()`: estado `'loading' | 'enabled' | 'disabled' | 'error'`. Com `DEV_TOOLS_ENABLED` falso o hook devolve `'disabled'` **calculado**, sem efeito nem requisição. Ligado, um `useEffect` dispara a promessa e só grava estado no `then`/`catch` (`404` → `'disabled'`), com flag de cancelamento na limpeza.
  - `useGenerateTransactionData()`: `generate(payload)`, `isSubmitting`, `summary`, `error` (`getErrorMessage`), estado gravado só nos handlers.

### 14. Schema com as caixas de seleção fora dele

`data/transaction-data.schema.ts` exporta `createTransactionDataSchema(selection)`, em que `selection = { accounts, creditCards, transactions }` são booleanos vindos de `useState` no componente (como o `isActive` dos cadastros). Cada quantidade é validada contra `DEV_DATA_LIMITS` só quando o item está marcado; `months` sempre (1..`maxMonths`); `seed` vazio ou inteiro; refinamento exige ao menos um item marcado. O componente memoriza o schema/resolver por `selection` e monta o payload com `0` para item desmarcado e sem `seed` quando vazio.

Alternativa: caixas dentro do schema — rejeitada pela convenção dos cadastros e porque o valor "desmarcado" não é um dado a enviar; quantidade `0` no próprio campo — rejeitada, perde o valor digitado ao remarcar.

### 15. Componentes compartilháveis pela parte 2

- `DataGeneratorQuantityRow`: `Checkbox` + `Input` numérico + `máx. N`, props `label`, `checked`, `onCheckedChange`, `max` e o registro do campo; desabilita o input quando desmarcado.
- `DataGeneratorResult`: recebe `rows: { label; summary: DevDataItemSummaryDTO }[]` e `seed`; tabela (`rótulo`, `solicitados`, `criados`, `ignorados`), `Badge` com a semente e lista de erros traduzidos e deduplicados entre as linhas; `EmptyListState` quando `rows` não existe. A parte 2 só passa outras linhas.
- `TransactionDataGenerator`: `Card` `Transações avulsas`, `FormSectionLayout` (`Cadastros de apoio`, `Transações`, `Opções`), valores iniciais 3/2/150 e período 3, botão com estado de envio, `toast.success` com `created` somado.
- `DataGeneratorPage`: com status `'loading'`, esqueleto simples; `'disabled'`, `EmptyListState` "Recurso indisponível"; `'error'`, `FormErrorMessage`; `'enabled'`, `PageSectionHeader` (badge `Desenvolvimento`, título `Gerador de Massa de Dados`), aviso e a lista de geradores.

### 16. Menu: seção `Extras` por espalhamento condicionado

`const EXTRAS_SECTION: SidebarMenuSection = { id: 'extras', label: 'Extras', items: [{ id: 'dev', label: 'Desenvolvimento', href: '/dev', icon: CodeXml, match: 'prefix' }] }` e `...(DEV_TOOLS_ENABLED ? [EXTRAS_SECTION] : [])` no **fim** do `NAVIGATION_SECTIONS`. Comentário no layout: seções novas entram antes desta. Nenhum outro `process.env` no arquivo.

### 17. Ambiente e versionamento

`apps/backend/.env.example` (e `.env` local): `DEV_TOOLS_ENABLED="true"` com comentário. `apps/frontend/.gitignore`: `!.env.example` logo após `.env*`. `apps/frontend/.env.example` (e `.env.local`): `NEXT_PUBLIC_DEV_TOOLS_ENABLED=true` com comentário de que o valor é embutido no build. Conferir antes que o `.env.example` local do frontend não contém segredo, já que passa a ser versionado.

## Risks / Trade-offs

- [Plano reprodutível, execução nem sempre] → a gravação depende do estado do banco (nomes existentes, contas ignoradas, subcategorias do usuário). A mesma semente reproduz nomes, valores e datas; sufixos de colisão e vínculos podem variar. Documentado no spec do backend.
- [Posição de conta/cartão fora da lista recarregada quando algo foi ignorado] → resolução por módulo; a transação se liga a um registro real e o motivo do ignorado aparece no resumo.
- ["Hoje" em UTC] → entre 21h e 24h em UTC−3 o servidor já está no dia seguinte e as transações de "hoje local" podem nascer efetivadas. Aceito: é recurso de desenvolvimento e a regra está explícita.
- [Chave do frontend embutida no build] → mudar `NEXT_PUBLIC_DEV_TOOLS_ENABLED` exige reiniciar o `next dev` ou refazer o build. Registrado no comentário do `.env.example`.
- [Menu escondido não protege] → a proteção é o `404` do backend; a tela ainda confere o `status`.
- [Dica de categoria desatualizada se as categorias padrão forem renomeadas] → teste do catálogo com a lista copiada falha; em runtime, cai no sorteio de subcategoria.
- [Literal de enum divergente do módulo dono] → o caso de uso reprova, o código aparece no resumo e o teste de domínio fixa os literais esperados.
- [Execução de 500 transações] → ~500 inserts sequenciais com referências em memória, segundos em banco local. Os tetos existem para isso.
- [Dados gerados sem marca] → não há como desfazer uma execução; fora de escopo por decisão de produto. O aviso da tela diz que os dados vão para a conta logada.
- [`.env.example` do frontend passando a ser versionado] → revisar o conteúdo antes do commit.
- [Lint pré-existente e `--fix` do backend] → `npx eslint <arquivos tocados>` sem `--fix`; nunca `npm run lint` no backend.
- [Next.js com convenções próprias] → o sub-agente de frontend consulta `node_modules/next/dist/docs/` antes de mexer em rota/layout, como pede o `AGENTS.md` do frontend.

## Migration Plan

Sem migração de banco. Produção não define `DEV_TOOLS_ENABLED` nem `NEXT_PUBLIC_DEV_TOOLS_ENABLED`, então publicar backend e frontend em qualquer ordem não expõe nada. Em desenvolvimento, copiar as chaves dos `.env.example` e reiniciar os dois servidores.

Rollback: reverter o módulo `dev`, a seção do menu e as chaves de i18n. Os registros já gerados continuam como dados comuns do usuário.

## Open Questions

- Proporção de saídas com cartão (`0.35`) e de entradas (`0.15`) são ajustes de realismo que podem mudar depois sem alterar spec nem tarefas, desde que respeitem o teto de 20% de entradas.

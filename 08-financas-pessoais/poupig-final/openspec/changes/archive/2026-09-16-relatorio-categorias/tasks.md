## 1. Sub-agente de negócio — Leitura do contexto

- [x] 1.1 Ler `proposal.md`, `design.md` e o spec `category-spending-report-domain` desta mudança
- [x] 1.2 Ler as peças reaproveitadas, sem alterá-las:
  - `modules/transaction/src/report` inteiro (em especial `use-case/summarize-monthly-cash-flow.use-case.ts`, `model/cash-flow-accumulator.service.ts` e os barris)
  - `modules/transaction/src/scheduled-transaction/model/scheduled-transaction-generator.service.ts` e `provider/list-materialized-occurrence-keys.query.ts`
  - `modules/transaction/src/transaction-series/provider/list-active-transaction-series.query.ts` e `dto/transaction-series.dto.ts`
  - `modules/transaction/test/report/summarize-monthly-cash-flow.use-case.test.ts` e `test/mock/transaction-series-dto.fixture.ts`
  - `modules/category/src` (barris, `category/provider/find-categories-by-user-id.query.ts`), `modules/category/test` e `DateOnly`/`Result`/`UseCase` do `@poupig/shared`

## 2. Negócio — dependência e modelo de leitura `report`

- [x] 2.1 Acrescentar `"@poupig/transaction": "*"` às `dependencies` de `modules/category/package.json` e rodar `npm install` na raiz; conferir que o diff do `package-lock.json` se limita ao bloco de `modules/category`
- [x] 2.2 Criar `src/report/dto/category-spending.dto.ts` (skill `module-dto`) com `CategorySpendingSliceDTO`:
  - `categoryId`, `categoryName`, `categoryColor`, `categoryIcon`, `subcategoryId`, `subcategoryName`, `subcategoryColor`, `subcategoryIcon` como `string | null` e `total: number`
  - documentar campo a campo: `total` positivo com duas casas (avulsas + gravadas + geradas); identidade toda `null` só no balde sem classificação e sempre preenchida fora dele; cor e ícone como gravados; só quem teve gasto; ordem por total desc, nome da categoria, nome da subcategoria e balde sem classificação por último no empate
- [x] 2.3 Criar `src/report/model/category-spending-period.ts`:
  - `CATEGORY_SPENDING_MAX_DAYS = 366`, com comentário do porquê do teto (varredura do SQL e geração) e do valor (ano bissexto inteiro)
  - `isValidCategorySpendingPeriod(from: unknown, to: unknown): boolean`: strings, `DateOnly.tryCreate` com valor normalizado igual à entrada, `from <= to` e dias contados com `Date.UTC` sobre as partes (`+ 1`) `<= CATEGORY_SPENDING_MAX_DAYS`
- [x] 2.4 Criar `src/report/provider/summarize-stored-category-spending.query.ts` (skill `module-query-cqrs`):
  - `StoredSubcategorySpending { subcategoryId: string | null; total: number }`
  - `SummarizeStoredCategorySpendingInput { userId; from; to }`
  - `SummarizeStoredCategorySpendingQuery` com `execute` devolvendo `Promise<Result<StoredSubcategorySpending[]>>`
  - documentar: só `OUT`, sem `CANCELED`, `Transaction` não excluídas, `ScheduledTransaction` de séries não excluídas, por `expectedOn` no período inclusivo, uma linha `null` para as sem subcategoria, total positivo com duas casas, sem ordem, **sem** ocorrências geradas
- [x] 2.5 Criar `src/report/provider/find-subcategory-appearances.query.ts` (skill `module-query-cqrs`):
  - `SubcategoryAppearance` (ids e nomes `string`, cores e ícones `string | null`)
  - `FindSubcategoryAppearancesInput { userId: string; subcategoryIds: string[] }`
  - `FindSubcategoryAppearancesQuery` com `execute` devolvendo `Promise<Result<SubcategoryAppearance[]>>`
  - documentar: só subcategorias cuja categoria é do usuário, incluindo inativas e excluídas logicamente; id inexistente ou de outro usuário não volta; lista vazia devolve `[]` sem consultar
- [x] 2.6 Criar `src/report/use-case/summarize-category-spending.use-case.ts` (skill `module-use-case`):
  - `SummarizeCategorySpendingErrors` (`as const`) com `INVALID_CATEGORY_REPORT_PERIOD`
  - `SummarizeCategorySpendingInput { userId: string; from: string; to: string }` (entrada crua)
  - `SummarizeCategorySpending implements UseCase<SummarizeCategorySpendingInput, CategorySpendingSliceDTO[]>` com as quatro consultas no construtor, na ordem do `design.md` (decisão 1)
  - fluxo da decisão 1: validação sem consulta; `Promise.all` + `Result.combine`; `Set` de chaves suprimidas; `Map` em centavos (`Math.round(value * 100)`); séries `OUT` com `ScheduledTransactionGenerator.generateForPeriod`; aparência dos ids não nulos (sem chamar quando vazio); ids sem aparência no balde `null`; conversão para reais e ordenação com `localeCompare('pt-BR')`
  - documentar no arquivo o que o relatório enxerga e por que a supressão vale para qualquer situação
- [x] 2.7 Criar os barris `src/report/dto/index.ts`, `model/index.ts`, `provider/index.ts`, `use-case/index.ts` e `src/report/index.ts`, e exportar `./report` em `src/index.ts` depois de `./category`

## 3. Negócio — testes

- [x] 3.1 Criar `test/mock/transaction-series-dto.fixture.ts` com um construtor de `TransactionSeriesDTO` válido (mensal, `OUT`, com `subcategoryId`) aceitando sobrescritas, importando tipos e enums de `@poupig/transaction`
- [x] 3.2 Criar `test/report/category-spending-period.test.ts`:
  - aceitos: mês comum; `from === to`; `2027-01-01`–`2028-01-01` e `2028-01-01`–`2028-12-31` (366 dias)
  - recusados: `2028-01-01`–`2029-01-01` (367 dias); invertido; `2026-13-01`; `2026-02-30`; `""`; `undefined`; `2026-9-1`
- [x] 3.3 Criar `test/report/summarize-category-spending.use-case.test.ts` com stubs em memória das quatro consultas, cobrindo:
  - período inválido devolve `INVALID_CATEGORY_REPORT_PERIOD` sem chamar nenhuma consulta
  - série de saída sem nada gravado somando na subcategoria dela
  - gravado `0.10` + gerado `0.20` na mesma subcategoria dando exatamente `0.3`
  - série `IN` não gera nada
  - chave gravada suprime a geração, inclusive quando a ocorrência gravada é `CANCELED` (a soma gravada não a traz)
  - série e linha gravada sem subcategoria somando numa única linha `null`
  - subcategoria sem aparência devolvida somando na linha `null`
  - subcategoria só com gasto gerado aparecendo com a aparência
  - aparência não consultada quando não há id não nulo
  - ordem por total, desempate por categoria e subcategoria, linha `null` por último no empate
  - período sem nada devolvendo `[]`
  - falha de cada uma das quatro consultas propagada
- [x] 3.4 Rodar `npm run build` na raiz (o Jest resolve `@poupig/transaction` pelo `dist`) e os testes de `@poupig/category`, todos verdes

## 4. Sub-agente de backend — Adapter, controller e roteiro

- [x] 4.1 Ler `proposal.md`, `design.md`, o spec `category-spending-report-backend` e as peças: `transaction-report.prisma.ts`, `transaction-report.controller.ts`, `transaction-report.integration.http`, `transaction.module.ts`, os roteiros `.http` de `transaction`, `transaction-series` e `scheduled-transaction`, `category.controller.ts`, `category.module.ts` e os models Prisma de `transaction` e `category`
- [x] 4.2 Criar `apps/backend/src/modules/category/category-report.prisma.ts` (skill `backend-prisma-data`) com `CategoryReportPrisma` (`@Injectable()`, `constructor(private readonly prisma: PrismaService)`):
  - `StoredSubcategorySpendingRow { subcategoryId: string | null; total: unknown }`, `hasToNumber` e `toAmount` locais e documentados, no desenho do `TransactionReportPrisma`
  - `readonly summarizeStoredCategorySpending: SummarizeStoredCategorySpendingQuery` com o `$queryRaw` da decisão 3 do `design.md`: nomes mapeados entre aspas, aliases em toda coluna, literais de enum sem tipo, `::date` nos parâmetros, `GROUP BY` do `subcategory_id`, sem `JOIN` de categoria e sem ordem; conferir cada nome de coluna nos models antes de escrever
  - `readonly findSubcategoryAppearances: FindSubcategoryAppearancesQuery` com `subcategory.findMany` (`id in`, `category: { userId }`, sem filtro de `deletedAt`/`isActive`), `[]` sem consulta para lista vazia e mapeamento para `SubcategoryAppearance`
  - documentar que o período chega validado pelo caso de uso e que o dono da aparência é filtrado pela categoria
- [x] 4.3 Criar `category-report.controller.ts` (skill `backend-controller`) com `CategoryReportController` (`@Controller('reports')`, `@Get('categories')`):
  - injeta `CategoryReportPrisma`, `ScheduledTransactionPrisma` e `TransactionSeriesPrisma` (de `../transaction/*.prisma`)
  - monta `new SummarizeCategorySpending(...)` no método com `@CurrentUser()` e `from`/`to` crus (`as string`)
  - falha → `BadRequestException(result.errors)`; sucesso → `result.instance`
  - comentário do método explicando a resposta sem paginação e a validação no domínio
- [x] 4.4 Em `category.module.ts`: `imports: [DbModule, TransactionModule]`, `controllers` com `CategoryReportController` e `providers` com `CategoryReportPrisma`; `exports` sem mudança
- [x] 4.5 Criar `category-report.integration.http` no formato de `transaction-report.integration.http` (`@baseUrl`/`@password`, usuários com `{{$guid}}`, cabeçalho explicando a rota e o formato de erro, status e corpo esperados comentados), cobrindo todos os casos do requisito "Testes de integração via Rest Client" do spec de backend
- [x] 4.6 Rodar `npm run build` e os testes do backend e do domínio, todos verdes

## 5. Sub-agente de frontend — Dados

- [x] 5.1 Ler `proposal.md`, `design.md`, os specs `category-spending-report-frontend` e `sidebar-navigation` e as peças: `use-cash-flow-report.ts`, `cash-flow-report-api.client.ts`, `cash-flow-window.ts`, `cash-flow-report.page.tsx`, `pie-breakdown-chart.tsx`, `dashboard-breakdown-card.tsx`, `metric-card.tsx`, `filter-pill.tsx`, `lucide-icon-by-key.tsx`, `color.util.ts`, `month.util.ts`, `selected-month.hook.ts`, `use-local-storage.hook.ts`, os dicionários do i18n, `modules/category/data/*` e `app/(private)/layout.tsx`
- [x] 5.2 Criar `modules/category/data/category-report-api.client.ts`: `CategoryReportApiError` e `fetchCategorySpending(token, { from, to }): Promise<CategorySpendingSliceDTO[]>` com `URL.searchParams`; `headers`, `extractMessages` e `handleError` locais e não exportados
- [x] 5.3 Acrescentar `INVALID_CATEGORY_REPORT_PERIOD` em `shared/i18n/messages.pt.ts` e `messages.en.ts`
- [x] 5.4 Criar `modules/category/data/category-spending-slices.ts` (puro, sem React):
  - `CategorySpendingGrain`, `isCategorySpendingGrain`, `CATEGORY_SPENDING_GRAIN_LABELS`, `DEFAULT_CATEGORY_SPENDING_GRAIN = 'category'`, `CategorySpendingPreferences { version: 1; grain }` e `CATEGORY_SPENDING_PREFERENCES_STORAGE_KEY = 'poupig:category-spending-report'`
  - `NEUTRAL_SLICE_COLOR = '#64748B'`, `UNCLASSIFIED_SLICE_ID = 'unclassified'` e `UNCLASSIFIED_SLICE_LABEL = 'Sem classificação'`, documentados
  - `SpendingSlice { id; label; parentLabel; icon; color; total }`
  - `toSpendingSlices(rows, grain)` com a soma em centavos, a ordem e a regra de tons da decisão 6 do `design.md` (via `mixHexColors`)
  - `summarizeSpending(slices, hiddenIds)` → `{ total, visibleTotal, hiddenCount, largest, unclassified }` e `shareOf(value, whole)` (fração 0–1)
  - `formatMonthSentence(selectedMonth)` local com `date-fns` (`MMMM 'de' yyyy`, `ptBR`)
- [x] 5.5 Criar `modules/category/data/use-category-spending-report.ts` no desenho da decisão 7:
  - `RequestState` por chave com `[token, monthStart, monthEnd, reloadCount]`, `isCurrent`, `toErrorMessage` local e `refresh`
  - granularidade no `useLocalStorage` com `deserialize` que lança no inválido, sem `isReady`
  - fatias ocultas guardadas com a chave `monthKey|grain`, tratadas como vazias quando a chave muda, sem `useEffect`; comentário da decisão
  - `slices` (com `isHidden`), `visibleSlices` e `totals` em `useMemo`; `toggleSlice`, `showAllSlices`, `highlightedId`/`setHighlightedId`
  - expõe também `grain`, `setGrain`, `monthSentence`, `isLoading`, `error` e `refresh`; sem `any` e sem `setState` síncrono em `useEffect`
- [x] 5.6 Estender `shared/components/ui/pie-breakdown-chart.tsx` com as props opcionais da decisão 8 (`id`, `onSliceClick`, `onSliceHover`, `highlightedId`, `centerContent`), mantendo legenda, tooltip, estado vazio, raios e cores atuais; confirmar que `dashboard-breakdown-card.tsx` compila sem mudança

## 6. Frontend — Componentes, página, rota e menu

- [x] 6.1 Criar `components/category-grain-selector.component.tsx`: dois `FilterPill` em `role="group"` com `aria-label`, `active` na granularidade corrente e `aria-label` descritivo por opção
- [x] 6.2 Criar `components/category-spending-legend.component.tsx`:
  - botão por fatia com `aria-pressed` (ligada), `LucideIconByKey` com `backgroundColor` e `pickSmartIconColor` ou bolinha na cor, rótulo, `formatCurrency` e percentual do visível
  - fatia desligada apagada e sem percentual
  - na visão por subcategoria, cabeçalho discreto por `parentLabel`, na ordem das fatias
  - `onMouseEnter`/`onFocus` realçam e `onMouseLeave`/`onBlur` limpam; item marcado quando `highlightedId` coincide
  - `Mostrar todas (N)` no topo só com fatia oculta; sem `FilterPill`
- [x] 6.3 Criar `components/category-spending-chart.component.tsx`:
  - `Card` com título e subtítulo; `grid lg:grid-cols-[minmax(0,1fr)_20rem]`, lista com altura limitada e rolagem
  - `PieBreakdownChart` com as fatias visíveis (`id`, `label`, `value`, `color`), `showLegend={false}`, `valueFormatter={formatCurrency}`, clique desligando, hover sincronizado e `centerContent` com o total visível e `Total do mês`/`Total visível`
  - linha com o total do mês e a quantidade de fatias fora quando há oculta
  - `emptyState` com o texto de mês sem saídas
- [x] 6.4 Criar `components/category-spending-summary.component.tsx`: grade de três `MetricCard` (`Total gasto no mês`, `Maior gasto`, `Sem classificação` com percentual sobre o total do mês ou traço), só formatando o que recebe
- [x] 6.5 Criar `pages/category-spending-report.page.tsx`:
  - `w-full space-y-6`; `PageSectionHeader` com badge `Relatórios`, título `Gastos por Categoria`, subtítulo `Distribuição das saídas de <mês>` e o seletor no `aside`
  - corpo: totais → card do gráfico → nota de rodapé (`text-xs text-muted-foreground`) dizendo que soma saídas pendentes e efetivadas pela data prevista, com as ocorrências previstas das séries e sem canceladas
  - esqueleto com as alturas finais; erro em `Card role="alert"` com `Tentar de novo` chamando `refresh`
- [x] 6.6 Criar `app/(private)/reports/categories/page.tsx` só delegando para a página do módulo
- [x] 6.7 Em `app/(private)/layout.tsx`, acrescentar à seção `reports`, depois de `cash-flow`, `{ id: 'category-spending', label: 'Gastos por Categoria', href: '/reports/categories', icon: ChartPie, match: 'prefix' }`, importando `ChartPie`; não mexer no `SidebarMenu` nem na posição do `EXTRAS_SECTION`
- [x] 6.8 Atualizar `modules/category/data/index.ts` e `modules/category/index.ts` com os arquivos novos, conferindo que nenhum nome exportado colide dentro do módulo

## 7. Fechamento

- [x] 7.1 Rodar `npm run build` no workspace e `npm test`, com domínio e backend verdes
- [x] 7.2 Rodar `npx eslint` sem `--fix` em todos os arquivos criados ou alterados, de frontend e backend, sem nenhum erro (os 88 erros do frontend e os 58 do backend pré-existentes continuam iguais); não rodar `npm run lint` no backend
- [x] 7.3 Conferir que o diff se limita a:
  - `modules/category/package.json` e `package-lock.json`
  - `modules/category/src/report`, `modules/category/src/index.ts`, `modules/category/test/report` e `modules/category/test/mock`
  - `apps/backend/src/modules/category` (arquivos novos e `category.module.ts`)
  - `apps/frontend/src/modules/category`, `apps/frontend/src/shared/components/ui/pie-breakdown-chart.tsx` e `apps/frontend/src/shared/i18n`
  - `app/(private)`: layout e rota nova

  O working tree já tem mudanças não commitadas de prompts anteriores: comparar só os arquivos tocados. Não testar via navegador (teste manual do usuário)

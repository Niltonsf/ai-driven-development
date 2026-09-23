## Context

Ver `proposal.md` — Why. Requisitos em `specs/category-spending-report-domain`, `specs/category-spending-report-backend`, `specs/category-spending-report-frontend` e `specs/sidebar-navigation`. Restrições do estado atual que moldam a abordagem:

- **Molde de relatório** (prompt 22, módulo `transaction`):
  - `src/report` com `dto/`, `model/`, `provider/` e `use-case/`; `SummarizeMonthlyCashFlow` recebe as consultas no construtor, valida a entrada crua, roda as leituras em `Promise.all` + `Result.combine`, suprime a geração com um `Set` de `` `${seriesId}:${occurrenceIndex}` `` e soma em centavos no `CashFlowAccumulator`; os erros ficam `as const` no arquivo do caso de uso
  - `TransactionReportPrisma.summarizeStoredCashFlow` é o único `$queryRaw` do projeto: aliases qualificando toda coluna, literais de enum sem tipo, `::date` nos parâmetros e `hasToNumber`/`toAmount` locais
  - `TransactionReportController` (`@Controller('reports')`) monta o caso de uso dentro do método, repassa a query string crua com `as string` e mapeia falha para `BadRequestException(result.errors)`
- **Peças de `@poupig/transaction` reaproveitadas**: `ScheduledTransactionGenerator.generateForPeriod(series, { from, to }, isMaterialized)` (ocorrências `PENDING` com `expectedOn = occurrenceOn`, valor, direção e `subcategoryId` da série), `ListActiveTransactionSeriesQuery` (séries não excluídas das duas direções) e `ListMaterializedOccurrenceKeysQuery` (chaves por `occurrenceOn`, qualquer situação). No backend, `TransactionModule` exporta `TransactionSeriesPrisma` e `ScheduledTransactionPrisma` e só importa `DbModule`.
- **Módulos de negócio**: todos dependem só de `@poupig/shared`; `@poupig/transaction` não conhece `category`. O Jest de cada módulo resolve os pacotes irmãos pelo `dist` (`main: dist/index.js`), e a tarefa `test` do Turbo não depende de `build`.
- **Categoria no banco**:
  - `category` e `subcategory` com `deleted_at` e `is_active`; o vínculo de `transaction`, `transaction_series` e `scheduled_transaction` com `subcategory` é `onDelete: SetNull`
  - `DELETE /categories/:id` é exclusão lógica da categoria e das subcategorias; remover subcategoria no `PUT /categories/:id` é exclusão física (`deleteMany` no `CategoryPrisma.save`)
  - a gravação de transação valida que a subcategoria não está excluída e é do usuário
- **Cores**: `DEFAULT_CATEGORIES` grava em toda subcategoria a mesma cor da categoria. `shared/util/color.util.ts` tem `mixHexColors(base, mix, weight)`.
- **Frontend**:
  - `use-cash-flow-report.ts` é o molde de hook de leitura: `RequestState { key, data, error }`, `requestKey` com os parâmetros e um contador, `isLoading` derivado, `isCurrent` para descartar resposta obsoleta, `toErrorMessage` local e `refresh`; a preferência usa `useLocalStorage` com `deserialize` que lança no inválido
  - `PieBreakdownChart` (`shared/components/ui`) só é usado pelo `DashboardBreakdownCard`, que não tem consumidor; não tem `id`, clique, realce nem centro
  - a rosca do dashboard (`DashboardBreakdownChartComponent`) mora no módulo `transaction` do front, com paleta fixa e corte em `Outras`; `formatMonthInSentence` e `DASHBOARD_CARD_CLASSES` também moram lá. `MetricCard` tem a mesma superfície escura desses cards
  - `data/index.ts` de cada módulo reexporta tudo, então nomes repetidos entre arquivos do mesmo módulo colidem
- **Qualidade**: frontend sem testes e com 88 erros de lint; backend com 58 erros e 1 aviso; o `lint` do backend roda `--fix`, então a verificação é `npx eslint` sem `--fix` nos arquivos tocados; sem teste via navegador.

## Goals / Non-Goals

**Goals:**

- Total do relatório igual às saídas previstas do extrato e da rosca do dashboard do mesmo mês, por construção: a mesma regra de geração e de supressão, sem reescrever regra de recorrência.
- Uma requisição por mês servindo as duas granularidades; alternar granularidade e ligar/desligar fatias sem rede.
- Regra de período, junção, balde sem classificação, ordenação, cores e totais em código puro e testável, fora de React e fora do adapter.
- Soma das linhas gravadas independente do fuso do servidor e da sessão do banco.
- Leitura de aparência sem expor subcategoria de outro usuário.

**Non-Goals:**

- Não alterar `@poupig/transaction` (nenhuma consulta, gerador ou contrato novo lá), nem `TransactionModule`, `FindMonthlyStatement` ou `SummarizeMonthlyCashFlow`.
- Não alterar o agregado `src/category`, o `CategoryPrisma` ou o CRUD de categorias.
- Não extrair utilitários comuns entre os dois relatórios (`toAmount`, chave de ocorrência, acumulador em centavos, formatação do mês).
- Não alterar o dashboard, `MetricCard`, `FilterPill`, `SidebarMenu` ou o `DashboardBreakdownCard`.

## Decisions

### 1. Caso de uso no módulo `category` dependendo de `@poupig/transaction`

`SummarizeCategorySpending` em `modules/category/src/report/use-case`, com quatro consultas no construtor:

- `SummarizeStoredCategorySpendingQuery` (do próprio módulo): soma gravada por `subcategoryId`
- `ListMaterializedOccurrenceKeysQuery` e `ListActiveTransactionSeriesQuery` (de `@poupig/transaction`)
- `FindSubcategoryAppearancesQuery` (do próprio módulo): aparência dos ids com gasto

Fluxo:
1. `isValidCategorySpendingPeriod(from, to)` ou `INVALID_CATEGORY_REPORT_PERIOD`, sem consultar.
2. As três primeiras consultas em `Promise.all` + `Result.combine`.
3. `Set` de chaves suprimidas.
4. `Map<subcategoryId | null, cents>` com as linhas gravadas.
5. Para cada série com `direction === OUT`, `generateForPeriod` e soma de cada ocorrência no `subcategoryId` dela.
6. `FindSubcategoryAppearancesQuery` com os ids não nulos (pulada quando não há nenhum).
7. Um DTO por id com aparência; o `null` e os ids sem aparência somam no balde sem classificação.
8. Centavos → reais e ordenação (total desc, `categoryName`, `subcategoryName` com `localeCompare('pt-BR')`, balde sem classificação por último no empate).

`@poupig/category` ganha `"@poupig/transaction": "*"` em `dependencies`; só `src/report` importa de lá.

**Alternativas:**
- *Somar só o gravado, sem caso de uso*: rejeitado; séries salvas pelo formulário sumiriam e o total divergiria do dashboard.
- *Relatório no módulo `transaction`*: rejeitado; os relatórios agrupados por dimensão moram no módulo da dimensão.
- *Gerar ocorrências no adapter do backend*: levaria regra de domínio (supressão, recorrência) para a infraestrutura e sem teste unitário.
- *Copiar o gerador para `category`*: duplicaria a regra mais delicada do sistema.
- *Consulta nova em `@poupig/transaction` já agregando por subcategoria*: mexeria em módulo que esta mudança não deveria tocar e continuaria precisando do gerador.

Não há ciclo: `transaction` não depende de `category`, e no Nest o `TransactionModule` não importa módulo de negócio.

### 2. Validação do período em função pura do `model/`

`model/category-spending-period.ts` exporta `CATEGORY_SPENDING_MAX_DAYS = 366` e `isValidCategorySpendingPeriod(from: unknown, to: unknown): boolean`:
- cada ponta é `string`, passa em `DateOnly.tryCreate` e o valor normalizado é igual à entrada (recusa formatos que o `DateOnly` aceitaria mas não são `YYYY-MM-DD`);
- `from <= to` por comparação de texto (válida no formato fixo);
- dias = `(Date.UTC(ano, mês-1, dia) de to − de from) / 86_400_000 + 1 <= 366`, com as partes lidas da string.

O caso de uso devolve o erro; o controller não valida nada.

**Alternativa**: validar no controller com uma função exportada do provider — rejeitada para seguir o desenho do prompt 22, em que a entrada crua é problema do domínio e o teste de caso de uso cobre o erro.

### 3. SQL só soma; aparência em consulta separada pela API do Prisma

`CategoryReportPrisma.summarizeStoredCategorySpending` faz um `$queryRaw`:

```sql
SELECT m."subcategory_id" AS "subcategoryId", SUM(m."value") AS "total"
FROM (
  SELECT t."subcategory_id" AS "subcategory_id", t."value" AS "value"
  FROM "transaction" t
  WHERE t."user_id" = ${userId} AND t."deleted_at" IS NULL
    AND t."direction" = 'OUT' AND t."status" <> 'CANCELED'
    AND t."expected_on" BETWEEN ${from}::date AND ${to}::date
  UNION ALL
  SELECT st."subcategory_id" AS "subcategory_id", st."value" AS "value"
  FROM "scheduled_transaction" st
  JOIN "transaction_series" s ON s."id" = st."series_id"
  WHERE st."user_id" = ${userId} AND s."deleted_at" IS NULL
    AND st."direction" = 'OUT' AND st."status" <> 'CANCELED'
    AND st."expected_on" BETWEEN ${from}::date AND ${to}::date
) m
GROUP BY m."subcategory_id"
```

`findSubcategoryAppearances` usa `subcategory.findMany({ where: { id: { in: ids }, category: { userId } }, select: { id, name, color, icon, category: { select: { id, name, color, icon } } } })`, sem filtro de `deletedAt`/`isActive`, e devolve `[]` sem consultar quando `ids` está vazio.

**Por quê**: a subcategoria de uma ocorrência gerada não passa pelo SQL; com a aparência no `JOIN`, uma subcategoria só com gasto gerado ficaria sem nome. A consulta separada também resolve o dono pela categoria, em vez de um `LEFT JOIN` sem filtro de usuário. `groupBy` do Prisma não faz `UNION`, por isso a soma é SQL cru; `$queryRawUnsafe` é proibido.

**Alternativa**: `JOIN` de aparência no SQL + segunda consulta só para ids que faltarem — dois caminhos para o mesmo dado, rejeitado.

### 4. Conversão de valores local ao adapter

`hasToNumber`/`toAmount` copiados do `TransactionReportPrisma` para o `category-report.prisma.ts`, com a mesma documentação. A linha crua é `StoredSubcategorySpendingRow { subcategoryId: string | null; total: unknown }`.

**Alternativa**: exportar do módulo de backend `transaction` — acoplaria dois módulos do backend por poucas linhas.

### 5. Controller e módulo Nest

`CategoryReportController` (`@Controller('reports')`, `@Get('categories')`) injeta `CategoryReportPrisma`, `ScheduledTransactionPrisma` e `TransactionSeriesPrisma` (importados de `../transaction/*.prisma`), monta o caso de uso no método e devolve `result.instance` ou `BadRequestException(result.errors)`. `CategoryModule` passa a `imports: [DbModule, TransactionModule]`, `controllers: [CategoryController, CategoryReportController]` e `providers: [CategoryPrisma, CategoryReportPrisma]`.

O prefixo `reports` repetido em dois controllers é válido: as rotas finais são distintas.

### 6. Apresentação das fatias em funções puras

`data/category-spending-slices.ts`:
- `toSpendingSlices(rows, grain)`:
  - `category`: agrupa por `categoryId` em centavos, cor `categoryColor ?? NEUTRAL_SLICE_COLOR`, ordena por total desc e rótulo;
  - `subcategory`: calcula o total de cada categoria, ordena os grupos por esse total (desempate por nome) e as subcategorias dentro do grupo por total (desempate por nome); a linha nula é um grupo próprio com uma fatia só.
- `id` da fatia: `categoryId` ou `subcategoryId`; `UNCLASSIFIED_SLICE_ID = 'unclassified'` para o balde.
- `summarizeSpending(slices, hiddenIds)` e `shareOf(value, whole)` (fração 0–1, `0` sem todo), usados pelos componentes sem nenhuma soma inline.

**Tons**: dentro de um grupo de subcategorias, guarda-se quantas vezes cada cor-base (normalizada) já apareceu. A ocorrência `n = 0` usa a cor-base; as seguintes usam `mixHexColors(base, n ímpar ? '#ffffff' : '#000000', peso)` com `peso = min(0.18 * ceil(n / 2), 0.54)`. A regra é determinística (a mesma fatia recebe sempre o mesmo tom para a mesma resposta), mantém a identidade da categoria e evita os extremos.

**Alternativas**:
- *Paleta categórica fixa como no dashboard*: descartaria as cores que o usuário escolheu, que são a forma dele reconhecer as categorias.
- *Ordem global por total na visão por subcategoria*: separaria tons da mesma categoria e desalinharia gráfico e lista agrupada.

### 7. Hook com linhas em memória e fatias ocultas por chave

`use-category-spending-report.ts` segue o `use-cash-flow-report.ts`:
- `requestKey = JSON.stringify([token, monthStart, monthEnd, reloadCount])`; a granularidade **não** entra na chave, porque não muda a requisição.
- granularidade: `useLocalStorage('poupig:category-spending-report', { version: 1, grain: 'category' }, { deserialize })`.
- fatias ocultas: `useState<{ key: string; ids: ReadonlySet<string> }>`, com ``hiddenKey = `${monthKey(selectedMonth)}|${grain}` ``; se `state.key !== hiddenKey`, o conjunto efetivo é vazio e `toggleSlice` grava já com a chave nova. Assim trocar mês ou granularidade religa tudo sem `useEffect`.
- `slices`, `visibleSlices` e `totals` em `useMemo` a partir das linhas da resposta corrente.
- `highlightedId` em `useState` simples.

**Alternativa**: `useEffect` zerando o conjunto ao mudar o mês — gera render intermediário com fatias do mês anterior ocultas e viola a regra de lint `set-state-in-effect`.

### 8. Extensão opcional do `PieBreakdownChart`

Props novas: `id?` no dado, `onSliceClick?`, `onSliceHover?`, `highlightedId?` e `centerContent?`.
- `Cell` com ``key={item.id ?? `${item.label}-${index}`}``; opacidade reduzida nas fatias diferentes da realçada quando `highlightedId` não é nulo; `cursor-pointer` só com `onSliceClick`.
- `Pie` com `onClick`/`onMouseEnter`/`onMouseLeave` só repassando o `id` quando a fatia tem `id`.
- `centerContent` num `div` absoluto `pointer-events-none` sobre o `ResponsiveContainer`, centralizado; os raios `72`/`108` não mudam.

**Alternativas**:
- *Reusar o `DashboardBreakdownChartComponent`*: mora no módulo `transaction` do front e embute paleta e corte em `Outras`.
- *Componente novo de rosca em `category`*: duplicaria o gráfico compartilhado existente.

### 9. Tela no módulo `category` do front, sem importar de `transaction`

- Faixa de totais com `MetricCard`, que tem a mesma superfície dos cards do dashboard.
- Subtítulo com `format(new Date(year, month - 1, 1), "MMMM 'de' yyyy", { locale: ptBR })` local (mesma saída do `formatMonthInSentence`).
- `UNCLASSIFIED_SLICE_LABEL = 'Sem classificação'` local, com o mesmo texto do extrato.
- Página com `PageSectionHeader` (`aside` = alternador), `space-y-6`, esqueleto com as alturas finais, erro em `Card role="alert"` com `Button` `Tentar de novo`.
- Rota `app/(private)/reports/categories/page.tsx` só delega; item `{ id: 'category-spending', label: 'Gastos por Categoria', href: '/reports/categories', icon: ChartPie, match: 'prefix' }` na seção `reports` do `layout.tsx`.

**Alternativa**: importar `formatMonthInSentence`, `UNCLASSIFIED_GROUP_LABEL` e `DASHBOARD_CARD_CLASSES` do módulo `transaction` — acoplaria dois módulos de tela por constantes.

## Risks / Trade-offs

- [Jest de `@poupig/category` falha ao resolver `@poupig/transaction` sem `dist`] → as tarefas rodam `npm run build` antes dos testes do domínio; documentado na seção de negócio.
- [`npm install` altera o `package-lock.json` além do esperado] → rodar só na raiz, depois de editar o `package.json`, e conferir que o diff do lock se limita ao bloco de `modules/category`.
- [Dependência entre módulos de negócio vira precedente] → restrita a `src/report`; o agregado de categoria continua sem importar `transaction`, e a direção é única.
- [Custo de geração em memória para períodos longos] → teto de 366 dias e séries limitadas às ativas do usuário; a tela só pede um mês.
- [Subcategoria removida no formulário "perde" o histórico e vai para `Sem classificação`] → comportamento do banco (`SetNull`) já visível no extrato; documentado na nota do spec e fora do escopo mudar.
- [Muitas subcategorias da mesma cor produzem tons próximos] → peso crescente até `0.54`, alternando claro e escuro; a lista agrupada por categoria e o realce sincronizado desambiguam.
- [Duas cópias de `toAmount` e da formatação do mês] → aceitas para não acoplar módulos; extração comum fica para quando houver o terceiro relatório.
- [Divergência com o dashboard em mês com mais de 500 entradas] → mesma diferença aceita no prompt 22; o dashboard já avisa quando corta.

## Migration Plan

Sem migração de banco. Deploy normal: build do workspace (o Turbo compila `transaction` antes de `category` pela dependência declarada). Rollback é reverter o commit; nenhuma rota ou dado existente muda.

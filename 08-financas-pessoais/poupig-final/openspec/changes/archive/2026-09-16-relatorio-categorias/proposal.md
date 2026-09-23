## Why

O dashboard do mês mostra uma rosca de saídas por categoria, mas limitada a cinco fatias mais `Outras`, sem as cores das categorias e sem descer para subcategoria. Não existe tela que responda "para onde foi meu dinheiro neste mês" com todas as categorias e subcategorias, nem que permita tirar uma fatia grande (o aluguel, por exemplo) para enxergar o resto.

A base já existe: o grupo `Relatórios` do menu foi aberto pelo relatório de entradas x saídas, o domínio gera em memória as ocorrências das séries e o mês selecionado é global. Somar só o que está gravado não serve: salvar uma série pelo formulário não grava ocorrência, então aluguéis e parcelamentos sumiriam do relatório e o total não bateria com o dashboard. Por isso o relatório enxerga o mês como o extrato, o dashboard e o relatório de entradas x saídas enxergam.

## What Changes

- **Relatório `Gastos por Categoria` em `/reports/categories`**: a distribuição das saídas do mês selecionado no cabeçalho, em um gráfico de rosca interativo. Não tem seletor de mês próprio; trocar o mês no topo refaz o relatório
- **O que o relatório soma**: só saídas, pendentes e efetivadas, sem canceladas, pela data prevista — transações avulsas não excluídas, ocorrências gravadas de séries não excluídas e ocorrências **geradas** das séries ativas que ainda não foram gravadas
  - uma ocorrência gravada nunca conta duas vezes: ela suprime a geração do mesmo índice, inclusive quando foi cancelada
  - critério de aceite: a soma das fatias é igual às saídas não canceladas do extrato e da rosca de saídas por categoria do dashboard no mesmo mês, com a mesma única diferença aceita no relatório de entradas x saídas (o relatório não tem o teto de 500 entradas do extrato)
- **Categorias no relatório**:
  - só aparece quem teve gasto no período
  - categoria ou subcategoria inativa ou excluída com gasto aparece com o próprio nome
  - saída sem subcategoria vira a fatia `Sem classificação`, para a soma das fatias sempre bater com o total
- **Endpoint `GET /reports/categories?from=YYYY-MM-DD&to=YYYY-MM-DD`**: uma linha por subcategoria com gasto, com total e nome, cor e ícone da subcategoria e da categoria, ordenada por total decrescente. Período ausente, malformado, impossível, invertido ou maior que 366 dias responde `400` com `INVALID_CATEGORY_REPORT_PERIOD`
- **Leitura nova no domínio de categoria**: caso de uso que junta a soma por subcategoria das linhas gravadas (uma consulta SQL), as ocorrências geradas das séries de saída e a aparência das subcategorias que tiveram gasto. Soma em centavos inteiros
- **Tela**:
  - cabeçalho com badge `Relatórios`, título `Gastos por Categoria`, subtítulo com o mês e o alternador `Categorias` / `Subcategorias`
  - faixa de totais: `Total gasto no mês`, `Maior gasto` e `Sem classificação`
  - card com a rosca e uma lista lateral que liga e desliga cada fatia; clicar na fatia a desliga, a lista a religa, e passar o mouse realça fatia e item juntos
  - centro da rosca com o total visível; percentuais sempre sobre o visível, com aviso do total do mês e de quantas fatias estão fora quando há fatia oculta
  - cores das categorias escolhidas no cadastro, com tons dentro da mesma categoria na visão por subcategoria
  - nota de rodapé dizendo o que o relatório soma
  - estados de carregamento sem a tela pular, erro com `Tentar de novo` e mês sem saídas em estado vazio
- **A granularidade escolhida é lembrada no navegador**; as fatias ocultas não, e voltam a aparecer ao trocar de mês ou de granularidade. Alternar granularidade e ligar/desligar fatia não fazem nova requisição
- **Menu**: item `Gastos por Categoria` na seção `Relatórios`, depois de `Entradas x Saídas`
- **Gráfico de pizza compartilhado estendido** com identificador por fatia, clique, realce e conteúdo no centro, todos opcionais e sem mudar o uso atual
- A tela é **só de leitura**. **Sem** migração, índice ou tabela nova, e **sem** mudança em nenhum contrato HTTP existente

## Capabilities

### New Capabilities

- `category-spending-report-domain`: a leitura dos gastos por categoria no módulo `category`:
  - validação do período (datas `YYYY-MM-DD`, ordem e teto de 366 dias)
  - junção das linhas gravadas com as ocorrências geradas e a regra de supressão
  - contratos da soma gravada por subcategoria e da aparência das subcategorias
  - balde sem classificação, soma sem erro de arredondamento, ordenação e código de erro
- `category-spending-report-backend`: a rota `GET /reports/categories` protegida, a soma das linhas gravadas no banco sem dependência de fuso, a aparência das subcategorias restrita ao dono, as respostas `400` e os testes de integração via Rest Client
- `category-spending-report-frontend`: a tela `/reports/categories`:
  - alternador de granularidade lembrado no navegador
  - faixa de totais, rosca interativa e lista de liga-desliga
  - regra de cor e ordem das fatias
  - nota de rodapé e estados de carregamento, erro e mês vazio

### Modified Capabilities

- `sidebar-navigation`: a seção `Relatórios` passa a ter também o item `Gastos por Categoria`, depois de `Entradas x Saídas`

## Impact

- **Domínio** (`modules/category`):
  - `package.json` passa a depender de `@poupig/transaction` (só a pasta de leitura usa; o agregado de categoria continua independente)
  - pasta nova `src/report` com `dto/`, `model/` (período), `provider/` (soma gravada e aparência) e `use-case/` (`SummarizeCategorySpending`), exportada no barril `src/index.ts`
  - testes em `test/report` e fixture de série em `test/mock`
- **Backend** (`apps/backend/src/modules/category`):
  - `category-report.prisma.ts` com a soma em `$queryRaw` (só bind parameters) e a aparência pela API do Prisma
  - `category-report.controller.ts` com `GET /reports/categories`
  - `category.module.ts` importando o `TransactionModule` e registrando as peças novas
  - `category-report.integration.http`
- **Frontend**:
  - `apps/frontend/src/modules/category`: cliente HTTP, funções puras das fatias, hook da tela, quatro componentes, página e barris
  - `apps/frontend/src/shared`: props opcionais no `pie-breakdown-chart.tsx` e a chave `INVALID_CATEGORY_REPORT_PERIOD` nos dicionários pt e en
  - `apps/frontend/src/app/(private)`: item no `layout.tsx` e rota `reports/categories/page.tsx`
- **Reaproveitado sem alteração**:
  - domínio e backend: `ScheduledTransactionGenerator`, `ListActiveTransactionSeriesQuery`, `ListMaterializedOccurrenceKeysQuery`, `TransactionSeriesPrisma`, `ScheduledTransactionPrisma`, `DateOnly` e `PrismaService`
  - frontend: `useSelectedMonth`, `useLocalStorage`, `useAuth`, `getErrorMessage`, `formatCurrency`, `mixHexColors`, `MetricCard`, `FilterPill`, `LucideIconByKey`, `Card`, `Button` e `PageSectionHeader`
- **Não muda**:
  - o dashboard (inclusive a rosca de saídas por categoria), o extrato e o relatório de entradas x saídas
  - o CRUD de categorias, inclusive a exclusão física de subcategoria removida no formulário
  - `SidebarMenu`, `MonthPicker`, contexto de mês e os módulos `account`, `credit-card`, `transaction`, `auth` e `dev`
  - o schema do banco
- **API REST**: rota nova `GET /reports/categories`; nenhuma rota existente muda
- **Dependências**: nenhuma externa nova — só a dependência interna `@poupig/category` → `@poupig/transaction`, sem ciclo; o `recharts` já instalado desenha o gráfico
- **Qualidade**:
  - `npm run build` verde e testes de domínio e backend verdes
  - `npx eslint` sem `--fix` limpo nos arquivos tocados; os erros pré-existentes (88 no frontend, 58 no backend) continuam iguais
  - o frontend não tem suíte de testes e não há teste via navegador: o usuário testa manualmente
- **Fora de escopo**:
  - relatório de entradas por categoria ou pizza que misture entrada e saída
  - separar realizado de previsto
  - comparação entre meses, metas, evolução de categoria e projeção
  - filtros no relatório e período livre
  - detalhar a fatia, navegar para o extrato filtrado ou listar as transações da fatia
  - mudar cores do cadastro ou das categorias padrão
  - exportar, imprimir ou agendar envio
  - gravar fatias ocultas ou refletir o estado na URL
  - outros tipos de gráfico ou anéis concêntricos
  - cache, view materializada, índice ou migração
  - corrigir lint pré-existente

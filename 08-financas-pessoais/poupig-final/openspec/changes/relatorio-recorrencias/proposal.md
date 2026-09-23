## Why

O usuário cadastra as recorrências (salário, aluguel, internet, assinaturas) como séries abertas, mas não existe tela que mostre quanto elas somam mês a mês nem quanto das entradas fixas as contas fixas consomem. O extrato mostra um mês de cada vez e mistura recorrências com avulsas e parcelamentos; o relatório de entradas x saídas soma tudo junto.

A base já existe: o grupo `Relatórios` do menu, a janela fechada de 6/12/18/24 meses, o calendário e os códigos de erro do relatório de entradas x saídas, a geração das ocorrências em memória e o mês selecionado global. Somar só o que está gravado não serve: salvar uma série não grava ocorrência, então as recorrências sumiriam do relatório. Por isso ele enxerga cada mês como o extrato enxerga.

## What Changes

- **Relatório `Recorrências` em `/reports/recurrences`**: a evolução mês a mês de cada recorrência cadastrada, numa janela de 6, 12, 18 ou 24 meses que termina no mês selecionado no cabeçalho. Não tem seletor de mês próprio; trocar o mês no topo refaz o relatório
- **O que é recorrência**: série de transações do tipo aberto (`OPEN`), não excluída. Parcelamentos (`CLOSED`) e transações avulsas **não** entram
- **O que o relatório soma, por recorrência e por mês, pela data prevista**: ocorrências gravadas pendentes e efetivadas (sem canceladas) e ocorrências **geradas** ainda não gravadas, com o valor atual da série
  - uma ocorrência gravada nunca conta duas vezes: ela suprime a geração do mesmo índice, inclusive quando foi cancelada
  - critério de aceite: num mês, a soma das recorrências é igual à soma das ocorrências de séries abertas não canceladas do extrato daquele mês
- **Quais recorrências aparecem**:
  - toda recorrência vigente na janela, mesmo zerada em todos os meses (por exemplo, uma anual cujo mês não caiu na janela)
  - a recorrência já encerrada que tem ocorrência gravada adiada para dentro da janela, para o relatório não divergir do extrato
  - série excluída não aparece
- **Endpoint `GET /reports/recurrences?reference=YYYY-MM&months=N`**: uma linha por recorrência com nome, direção, valor atual, regra de recorrência, conta, categoria, início, fim, total do período e exatamente `N` meses em ordem crescente, com zero no mês sem ocorrência; entradas antes de saídas e, dentro da direção, por nome. Referência inválida responde `400` com `INVALID_REPORT_REFERENCE` e janela fora do conjunto responde `400` com `INVALID_REPORT_WINDOW` — os mesmos códigos, já traduzidos, do relatório de entradas x saídas
- **Leitura nova no domínio de transação**: caso de uso que junta a soma gravada por série e por mês (uma consulta SQL), as ocorrências geradas das séries abertas e a busca das séries que só aparecem pela soma gravada. Soma em centavos inteiros
- **Tela**:
  - cabeçalho com badge `Relatórios`, título `Recorrências`, subtítulo com a janela e o mês e o seletor de janela do relatório de entradas x saídas
  - faixa de totais: `Entradas recorrentes`, `Saídas recorrentes` e `Resultado recorrente` (total do período e média mensal) e `Comprometimento` (quanto das entradas recorrentes vai para as saídas recorrentes)
  - gráfico de linhas `Evolução das recorrências`: uma linha por recorrência visível e as linhas de total `Entradas recorrentes`, `Saídas recorrentes` e `Total geral` (entradas − saídas), com linha no zero
  - legenda ao lado do gráfico que é o controle das linhas, em três grupos (`Totais`, `Entradas recorrentes`, `Saídas recorrentes`): clicar num item esconde ou mostra a linha, clicar no título do grupo esconde ou mostra o grupo inteiro, `Mostrar todas (N)` religa tudo e passar o mouse destaca a linha
  - caixa única `Descontar dos totais as recorrências ocultas` no card do gráfico, desligada por padrão
  - tabela mês a mês com os grupos `Entradas recorrentes` e `Saídas recorrentes`, uma caixa de visibilidade por recorrência, uma caixa tri-estado por grupo, subtotal por grupo, linha de resultado recorrente e coluna de total
  - nota de rodapé dizendo o que o relatório soma
  - estados de carregamento sem a tela pular, erro com `Tentar de novo` e estado vazio apontando para o `Extrato Mensal`
- **Esconder e descontar são coisas separadas**:
  - esconder uma recorrência (pela legenda ou pela caixa da tabela, que refletem o mesmo estado) só tira a linha dela do gráfico, para limpar a análise — por padrão os cards, os subtotais, o resultado e as linhas de total continuam somando **todas** as recorrências
  - uma **opção única** para o relatório inteiro, `Descontar dos totais as recorrências ocultas`, faz as recorrências escondidas saírem dessas somas; não há escolha por recorrência
  - esconder uma linha de total nunca muda soma
  - tudo recalcula na hora, sem nova requisição; tudo começa visível e com a opção desligada; o que foi escondido e a opção sobrevivem à troca de mês e de janela na sessão, não são gravados no navegador e há sempre um `Mostrar todas (N)` para voltar. A recorrência escondida continua na tabela, apagada
- **A janela escolhida é lembrada no navegador**, numa chave própria do relatório
- **Menu**: item `Recorrências` na seção `Relatórios`, depois de `Gastos por Categoria`
- **Caixa de marcação compartilhada** passa a desenhar o estado indeterminado, sem mudar o marcado e o desmarcado
- A tela é **só de leitura**. **Sem** migração, índice ou tabela nova, e **sem** mudança em nenhum contrato HTTP existente

## Capabilities

### New Capabilities

- `recurrence-report-domain`: a leitura das recorrências no módulo `transaction`:
  - validação da referência e da janela reaproveitando o relatório de entradas x saídas
  - junção das ocorrências gravadas com as geradas e a regra de supressão, só para séries abertas
  - regra de quais recorrências aparecem, inclusive a série encerrada com ocorrência adiada
  - contrato da soma gravada por série e por mês, baldes completos, soma sem erro de arredondamento e ordenação
- `recurrence-report-backend`: a rota `GET /reports/recurrences` protegida, a soma das ocorrências gravadas no banco sem dependência de fuso, as respostas `400` e os testes de integração via Rest Client
- `recurrence-report-frontend`: a tela `/reports/recurrences`:
  - seletor de janela lembrado no navegador
  - faixa de totais, gráfico de linhas com legenda liga-desliga por linha e por grupo, opção única de descontar as ocultas dos totais e tabela mês a mês com visibilidade por recorrência e por grupo
  - descrição da frequência, nota de rodapé e estados de carregamento, erro e vazio

### Modified Capabilities

- `sidebar-navigation`: a seção `Relatórios` passa a ter também o item `Recorrências`, depois de `Gastos por Categoria`

## Impact

- **Domínio** (`modules/transaction/src/report`):
  - `dto/recurrence-report.dto.ts`, `model/recurrence-accumulator.service.ts`, `provider/summarize-stored-recurrence-occurrences.query.ts` e `use-case/summarize-recurrences.use-case.ts`, exportados nos barris existentes
  - testes em `test/report`, usando a fixture de série que já existe
- **Backend** (`apps/backend/src/modules/transaction`):
  - `transaction-report.prisma.ts` ganha a soma gravada em `$queryRaw` (só bind parameters)
  - `transaction-report.controller.ts` ganha `GET /reports/recurrences`
  - `recurrence-report.integration.http`
  - `transaction.module.ts` não muda
- **Frontend**:
  - `apps/frontend/src/modules/transaction`: cliente HTTP, funções puras do relatório e do gráfico, hook da tela, `formatRecurrenceFrequency` em `transaction-series.labels.ts`, quatro componentes (totais, gráfico, legenda e tabela), página e barris
  - `apps/frontend/src/shared/components/ui/multi-line-chart.tsx`: gráfico de N linhas novo, só de apresentação
  - `apps/frontend/src/shared/components/ui/checkbox.tsx`: estado indeterminado
  - `apps/frontend/src/app/(private)`: item no `layout.tsx` e rota `reports/recurrences/page.tsx`
- **Reaproveitado sem alteração**:
  - domínio e backend: `CASH_FLOW_WINDOWS`/`isCashFlowWindow`, `CashFlowCalendar`, `SummarizeMonthlyCashFlowErrors`, `ScheduledTransactionGenerator`, `ListActiveTransactionSeriesQuery`, `ListMaterializedOccurrenceKeysQuery`, `FindTransactionSeriesByIdQuery`, `toAmount` e `PrismaService`
  - frontend: `CashFlowWindowSelectorComponent`, `CASH_FLOW_WINDOW_OPTIONS`, `CASH_FLOW_COLORS`, `Table`, `Card`, `PageSectionHeader`, `Button`, `useSelectedMonth`, `useLocalStorage`, `useAuth`, `getErrorMessage`, `formatCurrency`, `formatMonthInSentence` e os dicionários de erro
- **Não muda**:
  - o relatório de entradas x saídas (nomes e comportamento), o relatório de gastos por categoria, o dashboard e o extrato
  - `SidebarMenu`, `MonthPicker`, contexto de mês, os gráficos compartilhados existentes e os módulos `account`, `category`, `credit-card`, `auth` e `dev`
  - o schema do banco
- **API REST**: rota nova `GET /reports/recurrences`; nenhuma rota existente muda
- **Dependências**: nenhuma nova
- **Qualidade**:
  - `npm run build` verde e testes de domínio e backend verdes
  - `npx eslint` sem `--fix` limpo nos arquivos tocados; os erros pré-existentes continuam iguais
  - o frontend não tem suíte de testes e não há teste via navegador: o usuário testa manualmente
- **Fora de escopo**:
  - parcelamentos e transações avulsas
  - criar, editar, excluir ou encerrar recorrência pela tela, ou navegar para o formulário da série
  - separar realizado de previsto e contar ocorrências por mês
  - projeção além da referência, média móvel e comparação com o ano anterior
  - agrupar por categoria ou conta, filtros e período livre
  - gravar a marcação ou refletir o estado na URL
  - um gráfico por recorrência, barras ou área empilhada
  - gravar no navegador as linhas escondidas
  - exportar, imprimir ou agendar envio
  - renomear as peças do relatório de entradas x saídas para nomes genéricos
  - cache, view materializada, índice ou migração
  - corrigir lint pré-existente

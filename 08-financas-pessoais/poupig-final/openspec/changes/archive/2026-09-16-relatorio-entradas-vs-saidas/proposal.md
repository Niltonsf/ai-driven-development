## Why

O extrato e o dashboard mostram um mês por vez. Não existe nenhuma tela que responda "como minhas entradas e saídas evoluíram nos últimos meses" ou "em quais meses gastei mais do que entrou". Quem quer essa leitura tem que trocar o mês no cabeçalho várias vezes e anotar os totais.

Agora a base existe para isso. O domínio já gera em memória as ocorrências das séries (`ScheduledTransactionGenerator`) e o extrato já junta avulsas, ocorrências gravadas e geradas. O mês selecionado é global e o gerador de massa de dados cria meses de movimento para exercitar a tela.

Somar só o que está gravado não serve: salvar uma série pelo formulário não grava nenhuma ocorrência, então salários, aluguéis e parcelamentos criados na tela sumiriam do relatório. Por isso o relatório enxerga cada mês exatamente como o extrato e o dashboard enxergam. Este é o primeiro relatório do projeto e abre o grupo `Relatórios` do menu que os relatórios por categoria e por conta vão reaproveitar.

## What Changes

- **Relatório `Entradas x Saídas` em `/reports/cash-flow`**: uma linha do tempo com as entradas, as saídas e o saldo de cada mês de uma janela de **6, 12, 18 ou 24 meses** que termina no mês selecionado no cabeçalho, incluindo esse mês. Não tem seletor de mês próprio; trocar o mês no topo refaz o relatório
- **O que cada mês soma**: transações avulsas não excluídas, ocorrências gravadas de séries não excluídas e ocorrências **geradas** das séries ativas que ainda não foram gravadas, sempre pela data prevista, com pendentes e efetivadas e sem canceladas
  - uma ocorrência gravada nunca conta duas vezes: ela suprime a geração do mesmo índice, inclusive quando foi cancelada ou teve a data prevista movida para outro mês
  - critério de aceite: o balde de cada mês é igual às entradas e saídas previstas do extrato e do dashboard daquele mês. A única diferença aceita é que o relatório não tem o teto de 500 entradas do extrato
- **Endpoint `GET /reports/cash-flow?reference=YYYY-MM&months=N`**: devolve exatamente `N` meses em ordem cronológica, com `month`, `inflow`, `outflow` e `balance` já somados e com zeros nos meses sem movimento. Referência ou janela inválida responde `400` com `INVALID_REPORT_REFERENCE` ou `INVALID_REPORT_WINDOW`
- **Leitura nova no domínio**: caso de uso que junta a soma por mês das linhas gravadas (uma consulta SQL), as chaves das ocorrências gravadas na janela e as séries ativas, e gera as ocorrências faltantes em memória. Soma em centavos inteiros
- **Consulta leve nova no agregado `scheduled-transaction`**: devolve só a série e o índice das ocorrências gravadas cuja data da ocorrência cai no período, com qualquer situação, para suprimir a geração sem carregar o DTO completo
- **Tela**:
  - cabeçalho com badge `Relatórios`, título `Entradas x Saídas`, subtítulo com a janela e o mês de referência e o seletor de janela em pílulas
  - faixa de totais: `Entradas`, `Saídas`, `Saldo do período` e `Média mensal`
  - gráfico de comparação com barras agrupadas de entradas e saídas por mês
  - gráfico de saldo com a barra do saldo de cada mês e a linha do acumulado dentro da janela
  - nota de rodapé dizendo o que o relatório soma e que meses futuros são previsão
  - estados de carregamento sem a tela pular, erro com `Tentar de novo` e janela sem movimento com totais zerados e gráficos em estado vazio
  - visual do dashboard do mês: mesma superfície de card e mesmos tons de entrada, saída e saldo
- **A janela escolhida é lembrada no navegador**; o mês de referência não
- **Menu**: seção nova `Relatórios` com o item `Entradas x Saídas`, entre `Cadastros` e `Extras`
- **Componente compartilhado novo**: gráfico de barras agrupadas, no mesmo desenho do gráfico de barra e linha que já existe
- A tela é **só de leitura**. **Sem** migração, índice ou tabela nova, e **sem** mudança em `GET /statement`, `GET /transactions` ou qualquer contrato existente

## Capabilities

### New Capabilities

- `cash-flow-report-domain`: a leitura do fluxo de caixa mensal no módulo `transaction`:
  - janela fechada (6, 12, 18, 24) e validação da referência
  - período de meses inteiros derivado da referência e do tamanho da janela
  - junção das linhas gravadas com as ocorrências geradas e a regra de supressão
  - contrato da soma das linhas gravadas
  - baldes completos em ordem crescente, soma sem erro de arredondamento e códigos de erro
- `cash-flow-report-backend`: a rota `GET /reports/cash-flow` protegida, a soma das linhas gravadas no banco sem dependência de fuso, as respostas `400` e os testes de integração via Rest Client
- `cash-flow-report-frontend`: a tela `/reports/cash-flow`:
  - seletor de janela lembrado no navegador
  - faixa de totais e gráficos de comparação e de saldo
  - nota de rodapé
  - estados de carregamento, erro e janela vazia

### Modified Capabilities

- `sidebar-navigation`: o menu ganha a seção `Relatórios` com o item `Entradas x Saídas` entre `Cadastros` e `Extras`, e a ordem esperada com o recurso de desenvolvimento ligado passa a incluí-la
- `scheduled-transaction-domain`: o agregado ganha a consulta das chaves das ocorrências gravadas no período (por data da ocorrência, qualquer situação, ignorando série excluída)

## Impact

- **Domínio** (`modules/transaction`):
  - pasta nova `src/report` com `dto/`, `model/` (janela, calendário da janela e acumulador), `provider/` (soma das linhas gravadas) e `use-case/` (`SummarizeMonthlyCashFlow`), exportada no barril `src/index.ts`
  - `src/scheduled-transaction/provider` com a consulta das chaves gravadas
  - testes em `test/report` e ajuste do repositório em memória de ocorrências (`test/mock`) e do teste dele
- **Backend** (`apps/backend/src/modules/transaction`):
  - `transaction-report.prisma.ts` com a primeira consulta `$queryRaw` do projeto, só com bind parameters
  - `transaction-report.controller.ts` com `GET /reports/cash-flow`
  - `scheduled-transaction.prisma.ts` com a consulta das chaves
  - registro no `transaction.module.ts` e `transaction-report.integration.http`
- **Frontend**:
  - `apps/frontend/src/modules/transaction`: cliente HTTP, janela e cores, funções puras da série e dos totais, hook da tela, quatro componentes, página e barris
  - `apps/frontend/src/shared`: `grouped-bar-chart.tsx` e o barril, `parseMonthKey` em `month.util.ts` e as chaves `INVALID_REPORT_REFERENCE`/`INVALID_REPORT_WINDOW` nos dicionários pt e en
  - `apps/frontend/src/app/(private)`: seção `Relatórios` no `layout.tsx` e rota `reports/cash-flow/page.tsx`
- **Reaproveitado sem alteração**:
  - domínio e backend: `ScheduledTransactionGenerator`, `ListActiveTransactionSeriesQuery`, `DateOnly`, `PrismaService` e `toDbDate`
  - frontend: `useSelectedMonth`, `useLocalStorage`, `useAuth`, `getErrorMessage`, `formatMonthInSentence` e `formatCurrency`
  - componentes: `ComposedBarLineChart`, `FilterPill`, `Card`, `Button`, `PageSectionHeader` e `DASHBOARD_CARD_CLASSES`
- **Não muda**:
  - regras de domínio: `FindMonthlyStatement`, `SaveTransactionSeries`, `ListScheduledTransactionsInPeriodQuery` e `ScheduledTransactionGenerator`
  - telas: o dashboard do mês e o extrato
  - componentes e estado compartilhados: `MetricCard`, `ComposedBarLineChart`, `SidebarMenu`, `MonthPicker` e o contexto de mês
  - módulos `account`, `category`, `credit-card`, `auth` e `dev`, e o schema do banco
- **API REST**: rota nova `GET /reports/cash-flow`; nenhuma rota existente muda
- **Dependências**: nenhuma nova — o `recharts` já instalado desenha os gráficos
- **Qualidade**:
  - `npm run build` verde e testes de domínio e backend verdes
  - `npx eslint` sem `--fix` limpo nos arquivos tocados; os erros pré-existentes (88 no frontend, 58 no backend) continuam iguais
  - o frontend não tem suíte de testes e não há teste via navegador: o usuário testa manualmente
- **Fora de escopo**:
  - materializar ocorrências ao salvar uma série
  - separar realizado de previsto ou destacar meses futuros no gráfico
  - relatórios por categoria, conta ou cartão (próximos prompts, nos módulos de cada dimensão), previsto x realizado e evolução de saldo por conta
  - filtros no relatório, detalhe do mês ao clicar, navegação para o extrato filtrado
  - exportar, imprimir ou agendar envio
  - comparação com o ano anterior, média móvel, metas e alertas
  - janela livre por datas, trimestre ou ano
  - cache, view materializada, índice ou migração
  - corrigir lint pré-existente

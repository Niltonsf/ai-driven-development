## Why

A primeira tela depois do login (`/dashboard`) ainda é o placeholder do scaffold, com três cards "Métrica A/B/C" e `—`. Quem entra no app não vê nada do próprio mês, e quem acabou de criar a conta não tem nenhuma pista do que fazer primeiro. Agora dá para resolver isso sem backend: o `GET /statement` devolve o mês inteiro em uma resposta, com transações avulsas, ocorrências gravadas e ocorrências geradas das séries. Com isso as somas feitas no cliente ficam corretas. O mês selecionado no cabeçalho também já existe, e o gerador de massa de dados (prompts 17 e 20) já cria meses de movimento para exercitar a tela. Vir antes dos relatórios (prompts 22 a 24) mantém o dashboard como "o mês de hoje" e deixa a evolução no tempo para eles.

Ao mesmo tempo, todas as telas da área privada ficavam presas numa caixa centralizada de largura máxima, deixando faixas vazias em monitores largos. Um dashboard com gráficos é onde isso mais aparece, então a mudança libera a largura total em toda a área privada de uma vez, para as telas continuarem alinhadas entre si.

## What Changes

- **`/dashboard` passa a ser o dashboard do mês selecionado** no `MonthPicker` do cabeçalho: trocar o mês no topo refaz a tela, que não tem seletor de mês próprio. A rota passa a só delegar para uma página do módulo `transaction` do frontend
- Blocos, nesta ordem:
  1. **Primeiros passos**, só quando falta base: três passos numerados lado a lado (cadastrar a primeira conta, aplicar as categorias padrão, registrar a primeira transação) com contador `N de 3 concluídos`. Somem sozinhos quando a base existe e não aparecem se a leitura dos cadastros ou do extrato falhar
  2. **Indicadores**: quatro cards com ícone e brilho no tom do card
     - `Resultado previsto` em destaque, com a faixa `Resultado efetivado`
     - `Entradas` e `Saídas` com o previsto e uma barra da fração já efetivada
     - `Efetivação` com anel de progresso e `N de M` transações efetivadas
     - *Previsto* soma `PENDING` + `SETTLED`; *efetivado* soma só `SETTLED`; `CANCELED` fica fora de toda soma, gráfico, lista e contagem
  3. **Painéis do mês**:
     - **gráficos de rosca** `Gastos por categoria` e `Saídas por conta`: as cinco maiores fatias com nome e o resto em `Outras`, com legenda (valor e percentual) e destaque ao passar o mouse com os números no centro. Sem categoria vira `Sem classificação`, o mesmo rótulo do extrato
     - **`Pendências`**: `Atrasadas` e `Próximas`, até 5 por grupo em ordem de urgência, com selo de dia e mês, `e mais N` e link para o extrato
  4. **Atalhos**: cards horizontais para `Extrato Mensal`, `Contas`, `Cartões` e `Categorias`, com os ícones do menu em destaque colorido
  5. **Aviso de corte** quando o mês chega a `STATEMENT_MAX_ENTRIES` (500) entradas
- Estados:
  - carregando: esqueleto com a organização final, sem a tela pular a cada troca de mês
  - erro: mensagem legível e `Tentar de novo`, mantendo os atalhos
  - mês vazio: indicadores zerados e textos curtos, nunca uma tela vazia
- "Hoje" é a data local do navegador em `YYYY-MM-DD`; todas as datas são comparadas e lidas como string, sem fuso
- **Largura total na área privada**: dashboard, extrato mensal e seus formulários, contas, cartões, categorias e a tela de desenvolvimento deixam a caixa centralizada e ocupam o corpo do shell inteiro, com o espaçamento vindo só do shell. Os campos dos formulários mantêm largura máxima por seção. Landing e login não mudam
- A tela é **só de leitura**. **Sem** endpoint, consulta, cliente HTTP ou hook de mês novos, e **sem** mudança em backend, domínio, banco, menu ou rota

## Capabilities

### New Capabilities

- `month-dashboard`: a tela inicial da área privada como visão do mês selecionado:
  - fonte única no extrato e indicadores previsto × efetivado
  - anel de efetivação
  - gráficos de rosca de saídas por categoria e por conta
  - pendências atrasadas e próximas
  - atalhos, guia de primeiros passos e aviso de corte
  - estados de carregamento, erro e mês vazio
- `private-area-layout`: as telas da área privada ocupam a largura inteira do corpo do shell, alinhadas pelas mesmas bordas, com campos de formulário de largura limitada

### Modified Capabilities

(nenhuma — menu, rota de login, regras do extrato e dos cadastros não mudam de requisito; a largura das telas não era requisito de nenhuma capability existente)

## Impact

- **Frontend do módulo `transaction`** (`apps/frontend/src/modules/transaction`):
  - `data/dashboard-summary.ts`, com as funções puras `summarizeMonth`, `splitPending`, `breakdownOutflow`, `shareOf`, `isStatementTruncated` e `todayDateOnly`, e as constantes de limite e do rótulo `Outras`
  - `data/use-dashboard-onboarding.ts`
  - componentes `dashboard-summary`, `dashboard-breakdown-chart`, `dashboard-pending`, `dashboard-shortcuts` e `dashboard-onboarding`, mais `dashboard-card.styles.ts`
  - `pages/month-dashboard.page.tsx` e os barris
- **Rota**: `apps/frontend/src/app/(private)/dashboard/page.tsx` troca o placeholder inline por uma delegação à `MonthDashboardPage`
- **Largura total**: contêineres das páginas `monthly-statement.page.tsx`, `accounts.page.tsx`, `credit-cards.page.tsx`, `categories.page.tsx` e `data-generator.page.tsx` (só a classe do contêiner; nenhuma regra muda)
- **Reaproveitado sem alteração**:
  - `useSelectedMonth`, `useStatement` e `STATEMENT_MAX_ENTRIES`
  - `statement-format.ts`, `UNCLASSIFIED_GROUP_LABEL`, `TransactionAmount` e `RecurrenceSign`
  - `MONTH_SHORT_LABELS`, `formatCurrency`, `useAuth`, `listAccounts` e `listCategories`
  - `PageSectionHeader`, `Card`, `Button`, `Tooltip` e `FormSectionLayout`
- **Não muda**: `modules/*`, `packages/*`, `apps/backend/*`, `shared/`, os componentes dos módulos `account`, `category` e `credit-card`, `MetricCard`, `NavigationLinkCard`, `PieBreakdownChart`, `DashboardBreakdownCard`, `DashboardRankingListCard`, `dashboard.constants.ts` e os dashboards de scaffold de `/account`, `/category`, `/credit-card` e `/auth`
- **API REST**: nenhuma mudança. A tela faz uma chamada a `GET /statement` por mês e uma única leitura de `GET /accounts?page=1&pageSize=1` e `GET /categories`
- **Dependências**: nenhuma nova — o `recharts` já instalado desenha as roscas
- **Qualidade**: `npm run build` verde e `npx eslint` sem `--fix` limpo nos arquivos criados. Nos arquivos só ajustados (contêineres de página), fica 1 erro pré-existente de `any` em `accounts.page.tsx`, que não é tocado; o total do frontend continua em 88 erros. O frontend não tem suíte de testes e não há teste via navegador: o usuário testa manualmente
- **Fora de escopo**:
  - evolução no tempo (linhas, barras por mês), janela de "últimos N meses" e comparação com o mês anterior
  - cor própria da categoria no gráfico (o `StatementEntryDTO` não a traz)
  - saldos, fatura, limite, metas e orçamento
  - abrir formulário ou efetivar a partir do dashboard
  - widgets configuráveis e preferências gravadas
  - dispensar o guia manualmente
  - reaproveitar ou alterar os componentes de dashboard e gráfico do scaffold
  - notificações
  - unificar o helper de data de hoje com o dos formulários
  - largura das telas públicas
  - corrigir lint pré-existente

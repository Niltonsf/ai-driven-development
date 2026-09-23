## Why

A tela `/transactions` entregue no prompt 15 é um CRUD genérico: lista em `TableCard`, filtros em combo box, período digitado à mão (`De`/`Até`), páginas de 10 e ações de editar/excluir em cada linha. O uso real de um app de finanças pessoais é olhar **um mês de cada vez**, conferir o que já aconteceu e marcar o que foi pago — e hoje isso exige preencher datas, abrir o formulário e trocar a situação campo a campo. Ao mesmo tempo, o dashboard e os relatórios (prompts 21 a 24) vão precisar do mesmo "mês em foco", e sem um estado global cada tela guardaria e recalcularia o seu próprio período. O extrato é o primeiro consumidor natural desse estado, então os dois nascem juntos e já na forma final.

## What Changes

- Novo **estado global de mês selecionado** na área privada (ano + mês, período derivado em `YYYY-MM-DD`), começando sempre no mês corrente e **não** persistido: recarregar a página volta para o mês atual
- Novo **seletor de mês** no cabeçalho do shell, ao lado do botão de colapsar o menu: setas de mês anterior/seguinte, painel com navegação de ano, grade dos 12 meses, destaque do mês selecionado e do mês corrente e atalho "Mês atual"
- O cabeçalho do shell ganha um espaço para conteúdo extra à esquerda, preenchido pelo layout privado (o shell continua sem conhecer o mês)
- **Menu reorganizado**: grupo principal sem rótulo com `Dashboard` e `Extrato Mensal` (`/transactions`), seguido do grupo `Cadastros` inalterado. Saem os atalhos `Autenticação` (`/auth`), `Categorias` do grupo principal (`/category`) e `Transações` — as rotas `/auth` e `/category` continuam existindo
- **Tela `/transactions` vira o Extrato Mensal** (a URL não muda):
  - mostra sempre o mês selecionado; os campos de período saem da tela
  - uma identidade só no topo (badge `Extrato Mensal` + mês), lista direto na página, sem card em volta, com a contagem do mês discreta na barra de ferramentas
  - painel retrátil de filtros em pílulas de seleção única — `Direção`, `Situação`, `Conta` e `Cartão` (`Somente cartão` ou um cartão específico) — aberto por um botão `Filtros` com a contagem de ativos
  - agrupamento configurável por data (padrão), conta, categoria ou subcategoria, com cabeçalho de grupo mostrando rótulo e contagem (nunca soma em dinheiro)
  - duas visualizações: tabela densa e cards pensados para o mobile
  - linha/card clicável abre o formulário da transação; um check no início da linha marca como efetivada (`SETTLED`) ou volta para pendente, usando o `PUT /transactions/:id` existente
  - visualização, agrupamento, filtros e painel aberto/fechado guardados no navegador; busca por nome e mês **não**
  - páginas de 100 transações; trocar mês ou filtro volta para a página 1
- **BREAKING** (comportamento da tela): as ações de editar e excluir saem da lista. Editar passa a ser o clique na linha e **excluir passa a ficar no formulário de edição**, com confirmação
- **Backend**: `GET /transactions` aceita os filtros `creditCardId` e `onlyCreditCard` e o teto de `pageSize` sobe de 50 para 100 (só neste endpoint). Sem endpoint novo, entidade, regra de domínio ou migração
- **Domínio**: a entrada da listagem de transações ganha os dois filtros opcionais de cartão

## Capabilities

### New Capabilities

- `selected-month`: mês selecionado como estado global da área privada — valor inicial, período derivado, navegação entre meses, ausência de persistência e o seletor de mês no cabeçalho do shell

### Modified Capabilities

- `transaction-frontend`: a tela `/transactions` passa a ser o extrato do mês selecionado — lista sem período manual e com página de 100, filtros em pílulas (inclusive por cartão), agrupamento, duas visualizações, efetivação em um clique, abertura do formulário pela linha, exclusão movida para o formulário de edição e preferências guardadas no navegador
- `transaction-backend`: `GET /transactions` ganha os filtros `creditCardId`/`onlyCreditCard` e teto de `pageSize` 100; o roteiro `.http` cobre os novos cenários
- `transaction-domain`: a entrada de `ListTransactionsQuery` ganha os filtros opcionais `creditCardId` e `onlyCreditCard`
- `sidebar-navigation`: o grupo principal passa a ter só `Dashboard` e `Extrato Mensal`, sem rótulo; o item `Transações` é substituído e os atalhos de scaffold saem

## Impact

- **Domínio** (`modules/transaction/src/transaction/provider`): dois campos opcionais no `ListTransactionsInput`. Nenhum outro arquivo de `modules/*` muda
- **Backend** (`apps/backend/src/modules/transaction`): `transaction.controller.ts` (query params, conversão do booleano, teto 100), `transaction.prisma.ts` (`where` de cartão) e `transaction.integration.http`. Controllers de outros módulos continuam com teto 50
- **API REST**: `GET /transactions` aceita `creditCardId` e `onlyCreditCard` e `pageSize` até 100. Mudança compatível: clientes que não enviam os novos parâmetros recebem o mesmo resultado
- **Frontend compartilhado** (`apps/frontend/src/shared`): utilitário de mês, contexto + hook do mês selecionado, seletor de mês, pílula de filtro, slot no cabeçalho do `AdminShell` e a chave `SELECTED_MONTH_CONTEXT_PROVIDER_REQUIRED` em `messages.pt.ts`/`messages.en.ts`
- **Frontend do módulo** (`apps/frontend/src/modules/transaction`): página renomeada para `monthly-statement.page.tsx`, lista renomeada para `transaction-table.component.tsx`, novos componentes de cards, barra de ferramentas e painel de filtros, e novos arquivos de dados (preferências, tipos de visualização, formatação e agrupamento). `transaction-form.component.tsx` não muda
- **Rotas e layout**: `app/(private)/layout.tsx` (provider do mês, seletor no cabeçalho e `NAVIGATION_SECTIONS`) e `app/(private)/transactions/page.tsx` (novo nome da página)
- **Dependências**: nenhuma nova — `date-fns` com `ptBR`, `lucide-react` e os componentes de UI existentes atendem
- **Qualidade**: `npm run build` verde, testes de backend e domínio verdes e `npx eslint` sem `--fix` limpo nos arquivos tocados (os 88 erros pré-existentes do frontend e 58 do backend ficam como estão); sem teste via navegador — o usuário faz o teste manual
- **Fora de escopo**: totais e saldos do mês ou por grupo; parcelas de série/agendamento; consumir o mês no dashboard; persistir o mês ou refletir estado na URL; período livre; seleção múltipla e ações em lote; endpoint de efetivação; ordenação configurável; scroll infinito; exportação; remover `/auth` e `/category`; pré-preencher `expectedOn` com o mês selecionado; corrigir lint pré-existente

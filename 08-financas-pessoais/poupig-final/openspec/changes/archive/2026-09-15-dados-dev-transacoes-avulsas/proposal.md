## Why

O extrato mensal (prompt 16) e tudo o que vem depois dele — séries e transações agendadas (18 e 19), dashboard (21) e relatórios (22 a 24) — hoje só podem ser construídos e testados sobre meia dúzia de lançamentos digitados à mão. Não há como encher um usuário de desenvolvimento com meses de contas, cartões e transações plausíveis, nem reproduzir exatamente a mesma massa quando um bug aparece. Esta mudança cria a **parte 1** de um gerador de massa de dados determinístico, sem IA e desligado por padrão, que grava cadastros de apoio e transações avulsas pelos casos de uso que já existem; a parte 2 (prompt 20) estende o mesmo módulo e a mesma tela com séries e ocorrências.

## What Changes

- **Novo módulo `dev`** (`@poupig/dev`), criado pela skill `config-new-module` e preenchido em seguida. O scaffold vazio é substituído, não acumulado: saem o adapter Prisma, o `dev.model.prisma`, a rota de exemplo do controller, o dashboard vazio do frontend e o item de menu que a skill anexa à primeira seção
- **Domínio (`modules/dev`)**: catálogo estático em `.ts` com contas, cartões e transações avulsas em português do Brasil (direção, faixa de valor, peso de sorteio e dica de categoria); limites `DEV_DATA_LIMITS` (10 contas, 10 cartões, 500 transações, 12 meses); códigos `DevDataErrors`; gerador pseudoaleatório com semente; planejador puro; e o caso de uso `PlanTransactionData`, que valida o pedido e devolve um **plano** de blueprints sem persistir nada
- **Regras do plano**: o período é o mês atual **inteiro** mais os `months - 1` anteriores, em UTC e `YYYY-MM-DD`; transação antes de hoje nasce `SETTLED` com `settledOn = expectedOn`, de hoje em diante nasce `PENDING`; entradas nunca vão em cartão; a mesma semente produz o mesmo plano
- **Backend**: `GET /dev/data-generator/status` e `POST /dev/data-generator/transactions`, que respondem `404` quando `DEV_TOOLS_ENABLED` não é `'true'`. A execução grava **para o usuário autenticado** por `SaveAccount`, `SaveCreditCard` e `SaveTransaction`, na ordem contas → cartões → transações, de forma parcial (a falha de um registro não derruba os outros) e devolve um resumo por tipo (`requested`, `created`, `skipped`, `errors`) com a semente usada. Colisão de nome ganha **uma** nova tentativa com sufixo numérico
- **Frontend**: tela `/dev` (`Gerador de Massa de Dados`) com um card por gerador — nesta parte, `Transações avulsas` — com checklist de quantidades, período, semente, botão de gerar e tabela de resultado. A tela mostra só "recurso indisponível" quando a chave do frontend está desligada ou o backend responde desligado
- **Menu**: nova seção `Extras` com o item `Desenvolvimento` (`/dev`), sempre a última do menu e presente só quando `NEXT_PUBLIC_DEV_TOOLS_ENABLED` é `true` no build
- **Ambiente**: `DEV_TOOLS_ENABLED="true"` no `.env.example` do backend; `NEXT_PUBLIC_DEV_TOOLS_ENABLED=true` no `.env.example` do frontend, que passa a ser versionado (`!.env.example` no `.gitignore`)
- **Mensagens**: os códigos `INVALID_DEV_DATA_REQUEST`, `INVALID_DEV_DATA_QUANTITY`, `INVALID_DEV_DATA_PERIOD`, `INVALID_DEV_DATA_SEED`, `DEV_DATA_ACCOUNT_REQUIRED` e `DEV_DATA_DISABLED` ganham tradução em pt e en
- Nenhuma entidade, VO, modelo Prisma, migração ou dependência nova. Nenhum comportamento de `account`, `category`, `credit-card`, `transaction` ou `auth` muda

## Capabilities

### New Capabilities

- `dev-data-generator-domain`: validação do pedido de geração, cálculo do período, regra de situação pela data, catálogo estático e plano reprodutível de contas, cartões e transações avulsas, com limites e códigos de erro compartilhados
- `dev-data-generator-backend`: rotas de status e de execução atrás da chave de ambiente, gravação parcial para o usuário autenticado pelos casos de uso existentes, resolução de vínculos (conta, cartão e subcategoria), tratamento de colisão de nome e resumo da execução
- `dev-data-generator-frontend`: tela `/dev` com disponibilidade condicionada às duas chaves, formulário do gerador de transações avulsas validado pelos limites compartilhados, exibição do resumo e tradução dos códigos de erro

### Modified Capabilities

- `sidebar-navigation`: acrescenta a seção `Extras` (item `Desenvolvimento`), condicionada à chave de ambiente do frontend e sempre a última do menu

## Impact

- **Domínio** (`modules/dev`): pacote novo gerado pela skill, com `src/data-generator` (`constants/`, `catalog/`, `dto/`, `model/`, `use-case/`, `dev-data.errors.ts`) e testes em `test/data-generator`. Depende só de `@poupig/shared`; não importa nenhum outro módulo de domínio
- **Backend** (`apps/backend/src/modules/dev`): `dev.controller.ts`, `dev.module.ts`, `dev.config.ts`, `data-generator.writer.ts`, `in-memory-movement-references.ts`, `index.ts` e `data-generator.integration.http`. Registro do `DevModule` no `app.module.ts` (feito pela skill). Remoção de `dev.prisma.ts` e de `apps/backend/prisma/models/dev.model.prisma`
- **API REST**: duas rotas novas, privadas e desligadas por padrão. Nenhuma rota existente muda
- **Frontend** (`apps/frontend/src/modules/dev`): página, três componentes e quatro arquivos de dados; `app/(private)/dev/page.tsx`; seção `extras` em `app/(private)/layout.tsx`; chaves em `shared/i18n/messages.pt.ts` e `messages.en.ts`
- **Ambiente e versionamento**: `apps/backend/.env.example`, `apps/frontend/.env.example` (passa a ser versionado) e `apps/frontend/.gitignore`
- **Dependências**: só `@poupig/dev` nos `package.json` das duas apps (registrada pela skill) e o `package-lock.json`
- **Dados**: o que é gerado é dado comum do usuário autenticado, indistinguível do que ele digitou; não há como desfazer uma execução
- **Qualidade**: `npm run build` verde, testes de domínio e backend verdes e `npx eslint` sem `--fix` limpo nos arquivos tocados (os 88 erros pré-existentes do frontend e os 58 do backend ficam como estão); sem teste via navegador — o usuário faz o teste manual
- **Fora de escopo**: recorrências, parcelamentos e ocorrências (parte 2, prompt 20); apagar ou desfazer dados gerados; gerar categorias ou aplicar as padrão; IA, rede ou dependência nova; outro usuário que não o autenticado; transações `CANCELED`, pendências atrasadas e datas depois do mês atual; execução assíncrona, progresso ou cancelamento; perfis e histórico de execuções; importação/exportação; distribuição estatística configurável; testes automatizados do frontend; corrigir lint pré-existente

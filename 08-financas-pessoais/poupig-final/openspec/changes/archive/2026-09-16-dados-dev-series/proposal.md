## Why

A parte 1 do gerador de massa de dados (prompt 17) enche um usuário de desenvolvimento com contas, cartões e transações avulsas, mas nenhuma série: o extrato, o dashboard (prompt 21) e os relatórios (prompts 22 a 24) continuam sem parcelas e recorrências para exercitar — e os relatórios, que só somam o que está gravado, nem enxergariam séries cujas ocorrências vivem apenas em memória. Com o prompt 19 é possível, pela primeira vez, gravar uma ocorrência de série no banco; esta mudança cria a **parte 2** do gerador, que grava recorrências, parcelamentos e as ocorrências já vencidas ou do mês atual, antes que o dashboard e os relatórios sejam construídos.

## What Changes

- **Domínio (`modules/dev`)**: novos tetos em `DEV_DATA_LIMITS` (`20` recorrências, `20` parcelamentos, parcelas planejadas entre `2` e `24`); catálogo estático em pt-BR de recorrências (`Conta de energia`, `Escola das crianças`, `Balé da Fernanda`, `Salário`…) e de parcelamentos (`Geladeira`, `Curso de inglês`, `IPVA`…); DTOs do pedido, do blueprint de série, do plano e do resumo; método `planTransactionSeries` no planejador; e o caso de uso `PlanSeriesData`, que valida o pedido e devolve o plano sem persistir nada, com os mesmos códigos de erro, período e reprodutibilidade por semente da parte 1
- **Regras do plano**: recorrências são séries `OPEN` sem fim, com unidade sorteada por peso (`MONTH` na maioria, `WEEK` em poucas, `YEAR` raro) e intervalo `1`; parcelamentos são séries `CLOSED` mensais com a parcela igual ao total ÷ parcelas (duas casas); início sempre entre o começo do período e hoje; entradas nunca em cartão
- **Backend**: `POST /dev/data-generator/series`, atrás da mesma chave `DEV_TOOLS_ENABLED`. Grava cada série pelo caso de uso de série e, em seguida, **cada ocorrência até o último dia do mês atual** pelo caso de uso que materializa ocorrências: antes de hoje `SETTLED` com `settledOn` igual à data, de hoje até o fim do mês `PENDING`. Ocorrências de meses futuros não são gravadas. Pedido de usuário sem nenhuma conta é recusado com `DEV_DATA_ACCOUNT_REQUIRED`. Gravação parcial e resumo com `recurrences`, `installmentPlans`, `occurrences` (`settled`, `pending`, `skipped`, `errors`) e `seed`
- **Exceção deliberada e só de desenvolvimento** à regra do prompt 19 de que uma ocorrência só vira linha quando o usuário a altera: as ocorrências gravadas mantêm os valores da série no momento da geração, e editar a série depois só alcança as ainda não gravadas
- **Ligação do Nest**: `ScheduledTransactionPrisma` passa a ser exportado pelo `TransactionModule`, a única linha fora do módulo `dev`; nenhuma regra, rota ou caso de uso do módulo `transaction` muda
- **Frontend**: card `Séries e parcelas` na tela `/dev`, logo abaixo de `Transações avulsas`, com os itens `Recorrências` e `Parcelamentos`, período, semente, aviso sobre a gravação das ocorrências e resultado com as linhas `Recorrências`, `Parcelamentos` e `Ocorrências` e o detalhe de efetivadas e pendentes
- Nenhuma entidade, VO, modelo Prisma, migração, código de erro ou dependência nova

## Capabilities

### New Capabilities

_Nenhuma._

### Modified Capabilities

- `dev-data-generator-domain`: acrescenta os limites de séries, a validação do pedido de séries, o plano reprodutível de recorrências e parcelamentos e o catálogo estático de séries
- `dev-data-generator-backend`: a chave de ambiente passa a cobrir a nova rota; acrescenta a validação e a execução de `POST /dev/data-generator/series`, a gravação das séries e das ocorrências até o fim do mês atual, o resumo da execução e os novos casos do roteiro de integração
- `dev-data-generator-frontend`: a tela passa a listar dois geradores; acrescenta o formulário e o resumo do gerador de séries e a tradução dos códigos que o resumo pode trazer dos casos de uso de série e de ocorrência

## Impact

- **Domínio** (`modules/dev/src/data-generator`): `constants/dev-data-limits.constant.ts`, `catalog/recurrences.catalog.ts`, `catalog/installment-plans.catalog.ts`, novos DTOs em `dto/`, `model/dev-data-planner.service.ts` e `use-case/plan-series-data.use-case.ts`, com os barris; testes em `modules/dev/test/data-generator` (um arquivo novo, dois estendidos)
- **Backend** (`apps/backend/src/modules/dev`): `data-generator.writer.ts`, `dev.controller.ts` e `data-generator.integration.http`; `apps/backend/src/modules/transaction/transaction.module.ts` (só o `exports`). `dev.module.ts` não muda
- **API REST**: uma rota nova, privada e desligada por padrão. Nenhuma rota existente muda
- **Frontend** (`apps/frontend/src/modules/dev`): `data/data-generator-api.client.ts`, `data/series-data.schema.ts`, `data/use-data-generator.ts`, `components/series-data-generator.component.tsx`, `pages/data-generator.page.tsx` e os barris. Sem mudança em menu, ambiente ou `shared/i18n`
- **Dados**: séries e ocorrências gravadas são dados comuns do usuário autenticado; não há como desfazer uma execução. No pior caso (12 meses, 20 + 20 séries) a execução grava na casa de mil e poucas ocorrências, sequencialmente
- **Qualidade**: `npm run build` verde, testes de domínio e backend verdes e `npx eslint` sem `--fix` limpo nos arquivos tocados (os 88 erros do frontend e os 58 erros e 1 aviso do backend pré-existentes ficam como estão); sem teste via navegador — o usuário faz o teste manual
- **Fora de escopo**: gravar ocorrências de meses futuros; criar contas, cartões, transações avulsas ou categorias nesta parte; ocorrências `CANCELED`, atrasadas ou com valor/data diferentes da série; `endDate` em recorrência; editar, excluir ou apagar dados gerados; IA, rede ou dependência nova; execução assíncrona; mudar a tabela do resultado, o gerador de transações avulsas, o cabeçalho ou o aviso geral da tela; corrigir lint pré-existente

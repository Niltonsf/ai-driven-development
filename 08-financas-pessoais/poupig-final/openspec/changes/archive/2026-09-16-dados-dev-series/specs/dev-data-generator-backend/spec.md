## MODIFIED Requirements

### Requirement: Recurso desligado por padrão atrás da chave de ambiente
As rotas `GET /dev/data-generator/status`, `POST /dev/data-generator/transactions` e `POST /dev/data-generator/series` SHALL funcionar somente quando a variável de ambiente `DEV_TOOLS_ENABLED` do backend for exatamente `true`. Com a variável ausente ou qualquer outro valor, as três rotas SHALL responder `404` com o código `DEV_DATA_DISABLED`, antes de qualquer validação do corpo, leitura ou gravação. O `.env.example` do backend SHALL trazer `DEV_TOOLS_ENABLED="true"` com um comentário de que produção não define a variável.

#### Scenario: Recurso desligado
- **WHEN** o backend roda sem `DEV_TOOLS_ENABLED` e um usuário autenticado chama `GET /dev/data-generator/status`
- **THEN** a resposta é `404` com `DEV_DATA_DISABLED`

#### Scenario: Desligado ignora o corpo
- **WHEN** o backend roda com `DEV_TOOLS_ENABLED="false"` e `POST /dev/data-generator/transactions` é chamado com um corpo inválido
- **THEN** a resposta é `404` com `DEV_DATA_DISABLED` e nada é gravado

#### Scenario: Gerador de séries desligado
- **WHEN** o backend roda sem `DEV_TOOLS_ENABLED` e um usuário autenticado chama `POST /dev/data-generator/series` com um corpo válido
- **THEN** a resposta é `404` com `DEV_DATA_DISABLED` e nenhuma série nem ocorrência é gravada

#### Scenario: Valor diferente de true
- **WHEN** o backend roda com `DEV_TOOLS_ENABLED="1"`
- **THEN** as três rotas respondem `404` com `DEV_DATA_DISABLED`

---

### Requirement: Testes de integração via Rest Client cobrem o gerador
O módulo SHALL ter um arquivo `.http` no formato do Rest Client cobrindo: `GET status` com o recurso ligado e desligado (`404`); execução só de contas; execução completa, conferindo depois em `GET /transactions` que os dias passados vêm `SETTLED` e os de hoje em diante do mês atual vêm `PENDING`; transações sem nenhuma conta (`400`); quantidade acima do limite (`400`); pedido sem nada marcado (`400`); duas execuções com a mesma `seed` (mesmos nomes, com sufixo de colisão na segunda); e acesso sem token (`401`). Para o gerador de séries, o arquivo SHALL cobrir ainda: séries para usuário sem nenhuma conta (`400`); quantidade de séries acima do limite (`400`); pedido de séries sem nada marcado (`400`); geração só de recorrências; geração só de parcelamentos; geração dos dois conferida em `GET /statement` — no mês atual, ocorrências anteriores a hoje `SETTLED` e de hoje em diante `PENDING`; num mês futuro, ocorrências ainda presentes (geradas, não gravadas); num mês passado, cada ocorrência uma única vez —; `POST series` sem token (`401`); e `POST series` com o recurso desligado (`404`). As requisições que exigem o recurso desligado SHALL ficar juntas na seção final do arquivo.

#### Scenario: Roteiro de integração executável
- **WHEN** as requisições do arquivo `.http` são executadas em ordem contra o backend com banco migrado e o recurso ligado (ou desligado, nas requisições marcadas para isso)
- **THEN** cada resposta tem o status e o conteúdo esperados descritos na própria requisição

## ADDED Requirements

### Requirement: POST /dev/data-generator/series valida e executa o pedido
O corpo SHALL aceitar `recurrences`, `installmentPlans`, `months` e `seed`, cada um como número ou como string numérica. Quantidade ausente, nula ou vazia SHALL valer `0`; `months` ausente SHALL ser recusado pela validação do período; `seed` ausente, nula ou vazia SHALL fazer o servidor sortear a semente. Valor não numérico SHALL chegar à validação do domínio como inválido e resultar no código do seu campo, nunca ser tratado como zero ou ignorado. A data de hoje SHALL ser a data do servidor em UTC (`YYYY-MM-DD`). As contas consideradas SHALL ser as contas ativas que o usuário tem no momento da chamada. Pedido recusado pela validação — inclusive `DEV_DATA_ACCOUNT_REQUIRED` — SHALL responder `400` com a lista de códigos e SHALL NOT gravar nada. Pedido aceito SHALL responder `200` com o resumo da execução.

#### Scenario: Quantidades como string
- **WHEN** um usuário com contas chama `POST /dev/data-generator/series` com `{ "recurrences": "2", "months": "1" }`
- **THEN** a resposta é `200` e o resumo mostra `requested: 2` para recorrências e `requested: 0` para parcelamentos

#### Scenario: Quantidade não numérica
- **WHEN** `POST /dev/data-generator/series` é chamado com `{ "installmentPlans": "abc", "months": 1 }`
- **THEN** a resposta é `400` contendo `INVALID_DEV_DATA_QUANTITY`

#### Scenario: Pedido sem nada marcado
- **WHEN** `POST /dev/data-generator/series` é chamado com `recurrences: 0`, `installmentPlans: 0` e `months: 3`
- **THEN** a resposta é `400` contendo `INVALID_DEV_DATA_REQUEST`

#### Scenario: Quantidade acima do limite
- **WHEN** `POST /dev/data-generator/series` é chamado com `installmentPlans: 21` e `months: 3`
- **THEN** a resposta é `400` contendo `INVALID_DEV_DATA_QUANTITY`

#### Scenario: Usuário sem conta
- **WHEN** um usuário sem contas chama `POST /dev/data-generator/series` com `recurrences: 5` e `months: 3`
- **THEN** a resposta é `400` contendo `DEV_DATA_ACCOUNT_REQUIRED` e nenhuma série é criada

#### Scenario: userId no corpo ignorado
- **WHEN** `POST /dev/data-generator/series` é chamado com o `userId` de outro usuário no corpo
- **THEN** todas as séries e ocorrências criadas pertencem ao usuário autenticado

---

### Requirement: Gravação das séries pelo caso de uso de série
A execução SHALL gravar cada série do plano pelo caso de uso de escrita de séries, criando uma série nova, com as mesmas validações e regras que a criação manual — inclusive o cálculo da data de fim dos parcelamentos. As séries SHALL se ligar às contas e aos cartões ativos que o usuário já tem, e à subcategoria pela mesma regra da parte 1: dica que casa com uma subcategoria ativa de categoria ativa, sem diferenciar acentos nem maiúsculas; sem casamento, uma subcategoria sorteada pela semente; dica nula ou usuário sem subcategoria ativa, sem subcategoria. Entradas SHALL NOT ter cartão. A execução SHALL NOT criar contas, cartões, transações avulsas nem categorias, SHALL NOT criar tabela, entidade ou regra nova e SHALL NOT alterar o comportamento de nenhum outro módulo. As séries criadas SHALL ser dados comuns do usuário, visíveis na listagem de séries e editáveis pela tela da série.

#### Scenario: Séries visíveis na listagem
- **WHEN** um usuário com 2 contas executa o gerador com `recurrences: 4`, `installmentPlans: 2` e `months: 3`
- **THEN** o resumo mostra 4 recorrências e 2 parcelamentos criados, `GET /transaction-series` lista as 6 séries novas e toda série usa uma dessas 2 contas

#### Scenario: Parcelamento com data de fim calculada
- **WHEN** um parcelamento de 10 parcelas é criado pelo gerador
- **THEN** a série gravada tem `kind: CLOSED`, `installments: 10` e a data de fim igual à data da décima parcela

#### Scenario: Subcategoria casada pela dica
- **WHEN** o usuário aplicou as categorias padrão e uma série gerada tem a dica `Energia Elétrica`
- **THEN** a série é gravada com a subcategoria `Energia Elétrica` do usuário

---

### Requirement: Ocorrências gravadas até o fim do mês atual
Para cada série criada, a execução SHALL gravar, pelo caso de uso que grava ocorrências de série, toda ocorrência cuja data vai da primeira ocorrência da série até o último dia do mês atual, respeitando a quantidade de parcelas e a data de fim da série gravada. Cada ocorrência SHALL ser gravada com o nome, a nota, o valor, a direção, a conta, o cartão e a subcategoria da série gravada e com a data prevista igual à data da ocorrência. Ocorrência com data anterior a hoje SHALL ser gravada `SETTLED` com data de efetivação igual à sua data; ocorrência com data igual ou posterior a hoje SHALL ser gravada `PENDING` sem data de efetivação. Ocorrências de meses posteriores ao atual SHALL NOT ser gravadas e SHALL continuar aparecendo no extrato como geradas. Nenhuma ocorrência SHALL ser gravada sem passar pelo caso de uso, nem `CANCELED`. As ocorrências gravadas SHALL ser indistinguíveis de ocorrências alteradas pelo usuário: editar a série depois SHALL NOT alterá-las.

#### Scenario: Passado efetivado, presente e resto do mês pendentes
- **WHEN** a execução termina com hoje `2026-09-16` e `GET /statement?from=2026-09-01&to=2026-09-30` é chamado
- **THEN** toda ocorrência gerada de data até `2026-09-15` aparece `SETTLED` com data de efetivação igual à data, e toda ocorrência de `2026-09-16` a `2026-09-30` aparece `PENDING`

#### Scenario: Mês futuro não gravado
- **WHEN** a execução termina e o extrato do mês seguinte ao atual é consultado
- **THEN** as ocorrências das recorrências e dos parcelamentos ainda não encerrados aparecem `PENDING` como geradas, e nenhuma delas está gravada

#### Scenario: Ocorrência não duplicada no extrato
- **WHEN** a execução termina e o extrato de um mês passado do período é consultado
- **THEN** cada ocorrência das séries geradas aparece uma única vez

#### Scenario: Parcelamento encerrado antes do fim do mês
- **WHEN** um parcelamento de 2 parcelas começa no primeiro mês de um período de 6 meses
- **THEN** são gravadas no máximo 2 ocorrências dessa série, ambas efetivadas

#### Scenario: Série editada depois
- **WHEN** o usuário altera o valor de uma série gerada
- **THEN** as ocorrências já gravadas mantêm o valor antigo e as ocorrências de meses futuros usam o valor novo

---

### Requirement: Gravação parcial das séries e ocorrências
A falha devolvida pelo caso de uso na gravação de uma série SHALL contar a série como ignorada, com o código no resumo, SHALL NOT gravar ocorrências dessa série e SHALL NOT interromper as demais séries. A falha na gravação de uma ocorrência, ou na leitura da série gravada da qual as ocorrências dependem, SHALL contar como ocorrência ignorada, com o código no resumo, e SHALL NOT impedir as demais ocorrências da mesma série nem das outras. Nenhuma gravação já feita SHALL ser desfeita.

#### Scenario: Série recusada
- **WHEN** a gravação de uma das séries do plano é recusada pelo caso de uso
- **THEN** as demais séries e suas ocorrências são gravadas, e o resumo conta a recusada em `skipped` do seu item e traz o código em `errors`

#### Scenario: Ocorrência recusada
- **WHEN** a gravação de uma ocorrência é recusada pelo caso de uso
- **THEN** as demais ocorrências são gravadas e o resumo conta a recusada em `occurrences.skipped` com o código em `occurrences.errors`

---

### Requirement: Resumo da execução de séries
A resposta da execução de séries SHALL ser `{ recurrences, installmentPlans, occurrences, seed }`. `recurrences` e `installmentPlans` SHALL ser `{ requested, created, skipped, errors }`, com `requested` igual à quantidade pedida e igual a `created + skipped`. `occurrences` SHALL ser `{ settled, pending, skipped, errors }`: `settled` e `pending` contam as ocorrências gravadas em cada situação, e `skipped` as ocorrências das séries criadas que deveriam ser gravadas e não foram. Toda lista `errors` SHALL trazer os códigos das falhas daquele item, sem repetição, na ordem da primeira ocorrência. `seed` SHALL ser a semente usada, informada ou sorteada. O backend SHALL NOT traduzir códigos de erro.

#### Scenario: Contagens consistentes
- **WHEN** uma execução com `recurrences: 20` e `installmentPlans: 20` termina
- **THEN** cada item tem `requested: 20` e `created + skipped` igual a 20

#### Scenario: Ocorrências contadas por situação
- **WHEN** uma execução termina sem nenhuma falha
- **THEN** `occurrences.skipped` é `0`, `occurrences.errors` é vazia, e `settled + pending` é igual à quantidade de ocorrências das séries criadas com data até o último dia do mês atual

#### Scenario: Semente sorteada no resumo
- **WHEN** a execução de séries é chamada sem `seed`
- **THEN** o resumo traz um `seed` inteiro, e repetir o pedido com esse `seed` sobre o mesmo estado de dados produz séries com os mesmos nomes, valores, regras e datas de início

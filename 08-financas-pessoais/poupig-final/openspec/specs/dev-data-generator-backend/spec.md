# dev-data-generator-backend Specification

## Purpose
Expor ao usuário autenticado, apenas em ambiente de desenvolvimento, a execução do gerador de massa de dados: gravar contas, cartões de crédito e transações avulsas pelos casos de uso existentes e devolver um resumo da execução.
## Requirements
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

### Requirement: Rotas privadas e escopadas pelo usuário autenticado
As rotas do gerador SHALL exigir autenticação JWT e SHALL gravar sempre para o usuário autenticado. Um `userId` enviado no corpo SHALL ser ignorado. Não SHALL existir rota para gerar dados para outro usuário.

#### Scenario: Acesso sem token
- **WHEN** qualquer rota do gerador é chamada sem token com o recurso ligado
- **THEN** a resposta é `401`

#### Scenario: userId no corpo ignorado
- **WHEN** `POST /dev/data-generator/transactions` é chamado com o `userId` de outro usuário no corpo
- **THEN** todos os registros criados pertencem ao usuário autenticado

---

### Requirement: GET /dev/data-generator/status informa que o recurso está ligado
Com o recurso ligado, `GET /dev/data-generator/status` SHALL responder `200` com `{ "enabled": true }`.

#### Scenario: Recurso ligado
- **WHEN** o backend roda com `DEV_TOOLS_ENABLED="true"` e um usuário autenticado chama `GET /dev/data-generator/status`
- **THEN** a resposta é `200` com `{ "enabled": true }`

---

### Requirement: POST /dev/data-generator/transactions valida e executa o pedido
O corpo SHALL aceitar `accounts`, `creditCards`, `transactions`, `months` e `seed`, cada um como número ou como string numérica. Quantidade ausente, nula ou vazia SHALL valer `0`; `months` ausente SHALL ser recusado pela validação do período; `seed` ausente, nula ou vazia SHALL fazer o servidor sortear a semente. Valor não numérico SHALL chegar à validação do domínio como inválido e resultar no código do seu campo, nunca ser tratado como zero ou ignorado. A data de hoje SHALL ser a data do servidor em UTC (`YYYY-MM-DD`), independentemente do mês selecionado no frontend. Pedido recusado pela validação — inclusive `DEV_DATA_ACCOUNT_REQUIRED` — SHALL responder `400` com a lista de códigos e SHALL NOT gravar nada. Pedido aceito SHALL responder `200` com o resumo da execução.

#### Scenario: Quantidades como string
- **WHEN** `POST /dev/data-generator/transactions` é chamado com `{ "accounts": "2", "months": "1" }`
- **THEN** a resposta é `200` e o resumo mostra `requested: 2` para contas

#### Scenario: Quantidade não numérica
- **WHEN** `POST /dev/data-generator/transactions` é chamado com `{ "accounts": "abc", "months": 1 }`
- **THEN** a resposta é `400` contendo `INVALID_DEV_DATA_QUANTITY`

#### Scenario: Pedido sem nada marcado
- **WHEN** `POST /dev/data-generator/transactions` é chamado com todas as quantidades `0` e `months: 3`
- **THEN** a resposta é `400` contendo `INVALID_DEV_DATA_REQUEST`

#### Scenario: Quantidade acima do limite
- **WHEN** `POST /dev/data-generator/transactions` é chamado com `transactions: 501`
- **THEN** a resposta é `400` contendo `INVALID_DEV_DATA_QUANTITY`

#### Scenario: Transações sem conta
- **WHEN** um usuário sem contas chama `POST /dev/data-generator/transactions` com `accounts: 0`, `transactions: 10` e `months: 1`
- **THEN** a resposta é `400` contendo `DEV_DATA_ACCOUNT_REQUIRED` e nenhum registro é criado

---

### Requirement: Gravação na ordem das dependências pelos casos de uso existentes
A execução SHALL gravar, nesta ordem, as contas, os cartões de crédito e as transações avulsas do plano, cada registro pelo caso de uso de escrita do seu módulo, com as mesmas validações e regras que a criação manual. Contas e cartões SHALL receber identificador novo; transações SHALL ser criadas sem identificador. A execução SHALL NOT criar tabela, entidade ou regra nova, SHALL NOT criar categorias e SHALL NOT alterar o comportamento de nenhum outro módulo. Os registros criados SHALL ser dados comuns do usuário, visíveis nas listagens de contas, cartões e transações.

#### Scenario: Execução só de contas
- **WHEN** `POST /dev/data-generator/transactions` é chamado com `accounts: 3`, `creditCards: 0`, `transactions: 0` e `months: 1`
- **THEN** o resumo mostra 3 contas criadas, `requested: 0` para cartões e transações, e `GET /accounts` lista as 3 contas novas

#### Scenario: Transações visíveis no extrato
- **WHEN** uma execução completa termina e `GET /transactions` é chamado com o período do mês atual
- **THEN** as transações geradas do mês aparecem, as de dias anteriores a hoje como `SETTLED` e as de hoje em diante como `PENDING`

---

### Requirement: Vínculos das transações com contas, cartões e subcategorias
As transações SHALL se ligar ao conjunto de contas e cartões ativos do usuário que existiam antes da execução somado ao que a própria execução criou. Entradas SHALL NOT ter cartão. A subcategoria SHALL ser escolhida entre as subcategorias ativas de categorias ativas do usuário: quando a dica de categoria casa com o nome de uma delas, sem diferenciar acentos nem maiúsculas, essa subcategoria SHALL ser usada; quando a dica não casa com nenhuma, uma delas SHALL ser sorteada pela semente da execução; quando a dica é nula ou o usuário não tem subcategoria ativa, a transação SHALL ficar sem subcategoria. Falha na criação de uma conta ou cartão do plano SHALL NOT impedir a gravação das transações, que se ligam aos registros disponíveis.

#### Scenario: Pedido só de transações sobre dados existentes
- **WHEN** um usuário com 2 contas e 1 cartão chama a execução com `accounts: 0`, `creditCards: 0`, `transactions: 30` e `months: 2`
- **THEN** as 30 transações são criadas e toda transação usa uma dessas 2 contas e, quando tem cartão, esse cartão

#### Scenario: Subcategoria casada pela dica
- **WHEN** o usuário aplicou as categorias padrão e uma transação gerada tem a dica `Supermercado`
- **THEN** a transação é gravada com a subcategoria `Supermercado` do usuário

#### Scenario: Usuário sem categorias
- **WHEN** um usuário sem nenhuma categoria executa o gerador com transações
- **THEN** as transações são criadas sem subcategoria

---

### Requirement: Gravação parcial com colisão de nome tratada
A falha na gravação de um registro SHALL NOT interromper a execução nem desfazer os registros já gravados. Quando a criação de uma conta falha com `ACCOUNT_NAME_ALREADY_EXISTS`, ou a de um cartão com `CREDIT_CARD_NAME_ALREADY_EXISTS`, a execução SHALL tentar **uma** única vez de novo com um sufixo numérico no nome (por exemplo `Nubank 2`), escolhido para não repetir um nome que o usuário já tem. Se a nova tentativa ou qualquer outra gravação falhar, o registro SHALL ser contado como ignorado e o código de erro SHALL entrar no resumo.

#### Scenario: Mesma semente executada duas vezes
- **WHEN** a mesma execução com `accounts: 2`, `creditCards: 2` e `seed: 7` é feita duas vezes pelo mesmo usuário
- **THEN** a segunda execução cria contas e cartões com os mesmos nomes da primeira acrescidos de sufixo numérico, e os dois resumos trazem `seed: 7`

#### Scenario: Falha isolada
- **WHEN** a gravação de uma das transações do plano é recusada pelo caso de uso
- **THEN** as demais transações são gravadas, o resumo de transações conta a recusada em `skipped` e traz o código em `errors`

---

### Requirement: Resumo da execução
A resposta da execução SHALL ser `{ accounts, creditCards, transactions, seed }`, em que cada item é `{ requested, created, skipped, errors }`: `requested` é a quantidade pedida, `created` a quantidade gravada, `skipped` a quantidade não gravada, com `requested` igual a `created + skipped`, e `errors` a lista de códigos de erro das falhas daquele item, sem repetição, na ordem da primeira ocorrência. `seed` SHALL ser a semente usada, informada ou sorteada. O backend SHALL NOT traduzir códigos de erro.

#### Scenario: Semente sorteada no resumo
- **WHEN** a execução é chamada sem `seed`
- **THEN** o resumo traz um `seed` inteiro, e repetir o pedido com esse `seed` sobre o mesmo estado de dados produz os mesmos nomes, valores e datas

#### Scenario: Contagens consistentes
- **WHEN** uma execução com `transactions: 100` termina
- **THEN** o resumo de transações tem `requested: 100` e `created + skipped` igual a 100

---

### Requirement: Testes de integração via Rest Client cobrem o gerador
O módulo SHALL ter um arquivo `.http` no formato do Rest Client cobrindo: `GET status` com o recurso ligado e desligado (`404`); execução só de contas; execução completa, conferindo depois em `GET /transactions` que os dias passados vêm `SETTLED` e os de hoje em diante do mês atual vêm `PENDING`; transações sem nenhuma conta (`400`); quantidade acima do limite (`400`); pedido sem nada marcado (`400`); duas execuções com a mesma `seed` (mesmos nomes, com sufixo de colisão na segunda); e acesso sem token (`401`). Para o gerador de séries, o arquivo SHALL cobrir ainda: séries para usuário sem nenhuma conta (`400`); quantidade de séries acima do limite (`400`); pedido de séries sem nada marcado (`400`); geração só de recorrências; geração só de parcelamentos; geração dos dois conferida em `GET /statement` — no mês atual, ocorrências anteriores a hoje `SETTLED` e de hoje em diante `PENDING`; num mês futuro, ocorrências ainda presentes (geradas, não gravadas); num mês passado, cada ocorrência uma única vez —; `POST series` sem token (`401`); e `POST series` com o recurso desligado (`404`). As requisições que exigem o recurso desligado SHALL ficar juntas na seção final do arquivo.

#### Scenario: Roteiro de integração executável
- **WHEN** as requisições do arquivo `.http` são executadas em ordem contra o backend com banco migrado e o recurso ligado (ou desligado, nas requisições marcadas para isso)
- **THEN** cada resposta tem o status e o conteúdo esperados descritos na própria requisição

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


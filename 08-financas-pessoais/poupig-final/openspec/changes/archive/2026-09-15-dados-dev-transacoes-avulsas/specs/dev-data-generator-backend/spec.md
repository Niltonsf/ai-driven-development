## Purpose

Expor ao usuário autenticado, apenas em ambiente de desenvolvimento, a execução do gerador de massa de dados: gravar contas, cartões de crédito e transações avulsas pelos casos de uso existentes e devolver um resumo da execução.

## ADDED Requirements

### Requirement: Recurso desligado por padrão atrás da chave de ambiente
As rotas `GET /dev/data-generator/status` e `POST /dev/data-generator/transactions` SHALL funcionar somente quando a variável de ambiente `DEV_TOOLS_ENABLED` do backend for exatamente `true`. Com a variável ausente ou qualquer outro valor, as duas rotas SHALL responder `404` com o código `DEV_DATA_DISABLED`, antes de qualquer validação do corpo, leitura ou gravação. O `.env.example` do backend SHALL trazer `DEV_TOOLS_ENABLED="true"` com um comentário de que produção não define a variável.

#### Scenario: Recurso desligado
- **WHEN** o backend roda sem `DEV_TOOLS_ENABLED` e um usuário autenticado chama `GET /dev/data-generator/status`
- **THEN** a resposta é `404` com `DEV_DATA_DISABLED`

#### Scenario: Desligado ignora o corpo
- **WHEN** o backend roda com `DEV_TOOLS_ENABLED="false"` e `POST /dev/data-generator/transactions` é chamado com um corpo inválido
- **THEN** a resposta é `404` com `DEV_DATA_DISABLED` e nada é gravado

#### Scenario: Valor diferente de true
- **WHEN** o backend roda com `DEV_TOOLS_ENABLED="1"`
- **THEN** as duas rotas respondem `404` com `DEV_DATA_DISABLED`

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
O módulo SHALL ter um arquivo `.http` no formato do Rest Client cobrindo: `GET status` com o recurso ligado e desligado (`404`); execução só de contas; execução completa, conferindo depois em `GET /transactions` que os dias passados vêm `SETTLED` e os de hoje em diante do mês atual vêm `PENDING`; transações sem nenhuma conta (`400`); quantidade acima do limite (`400`); pedido sem nada marcado (`400`); duas execuções com a mesma `seed` (mesmos nomes, com sufixo de colisão na segunda); e acesso sem token (`401`).

#### Scenario: Roteiro de integração executável
- **WHEN** as requisições do arquivo `.http` são executadas em ordem contra o backend com banco migrado e o recurso ligado (ou desligado, nas requisições marcadas para isso)
- **THEN** cada resposta tem o status e o conteúdo esperados descritos na própria requisição

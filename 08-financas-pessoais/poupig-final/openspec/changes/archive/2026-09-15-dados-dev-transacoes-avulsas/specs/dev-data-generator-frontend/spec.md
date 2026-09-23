## Purpose

Oferecer, na área privada e apenas em ambiente de desenvolvimento, a tela `/dev` do gerador de massa de dados: escolher o que criar, disparar a execução no backend e conferir o resumo, com uma seção por gerador.

## ADDED Requirements

### Requirement: Chave de ambiente do frontend versionada e lida em um só lugar
O frontend SHALL considerar o recurso ligado somente quando `NEXT_PUBLIC_DEV_TOOLS_ENABLED` for exatamente `true` no momento do build. O `.env.example` do frontend SHALL ser versionado e SHALL trazer `NEXT_PUBLIC_DEV_TOOLS_ENABLED=true`, com um comentário de que o valor é embutido no build e de que produção não define a variável. A leitura da variável SHALL acontecer em um único ponto do módulo, consumido pelo menu e pela tela.

#### Scenario: Arquivo de exemplo versionado
- **WHEN** o repositório é clonado
- **THEN** `apps/frontend/.env.example` está presente e contém `NEXT_PUBLIC_DEV_TOOLS_ENABLED=true`

#### Scenario: Variável ausente no build
- **WHEN** o frontend é construído sem `NEXT_PUBLIC_DEV_TOOLS_ENABLED`
- **THEN** o recurso é considerado desligado

---

### Requirement: Disponibilidade da tela /dev
A rota `/dev` SHALL ficar no grupo privado, protegida como as demais rotas autenticadas. Com a chave do frontend desligada, a tela SHALL mostrar apenas uma mensagem de recurso indisponível e SHALL NOT consultar o backend. Com a chave ligada, a tela SHALL consultar `GET /dev/data-generator/status` uma vez ao abrir, mostrar um estado de carregamento enquanto aguarda, mostrar o conteúdo do gerador quando a resposta indicar `enabled: true`, e mostrar apenas a mensagem de recurso indisponível quando a resposta for `404` ou indicar `enabled: false`. Qualquer outra falha na consulta SHALL mostrar a mensagem de erro traduzida.

#### Scenario: Frontend desligado
- **WHEN** o frontend foi construído sem a chave e o usuário acessa `/dev` pela URL
- **THEN** a tela mostra só a mensagem de recurso indisponível e nenhuma requisição ao gerador é feita

#### Scenario: Frontend ligado e backend desligado
- **WHEN** a chave do frontend está ligada e o backend responde `404` ao status
- **THEN** a tela mostra só a mensagem de recurso indisponível, sem formulário

#### Scenario: Os dois ligados
- **WHEN** a chave do frontend está ligada e o status responde `{ "enabled": true }`
- **THEN** a tela mostra o cabeçalho, o aviso e o gerador de transações avulsas

---

### Requirement: Cabeçalho e aviso da tela
A tela SHALL exibir o cabeçalho com o selo `Desenvolvimento` e o título `Gerador de Massa de Dados`, seguido de um aviso curto informando que os dados são gravados na conta do usuário logado, que as transações de dias anteriores a hoje nascem efetivadas e que as categorias padrão devem estar aplicadas para as transações ganharem categoria. Abaixo do aviso SHALL vir a lista de geradores, um cartão por gerador; nesta versão, apenas o de transações avulsas. A tela SHALL NOT ter listagem, edição nem preferências guardadas.

#### Scenario: Estrutura da tela
- **WHEN** o usuário abre `/dev` com o recurso disponível
- **THEN** vê o selo `Desenvolvimento`, o título `Gerador de Massa de Dados`, o aviso e o cartão `Transações avulsas`

---

### Requirement: Formulário do gerador de transações avulsas
O cartão `Transações avulsas` SHALL conter as seções `Cadastros de apoio` (itens `Contas` e `Cartões de crédito`), `Transações` (item `Transações avulsas`) e `Opções` (`Período` em meses e `Semente`), o botão de gerar e, logo abaixo, o resultado. Cada item SHALL ter uma caixa de seleção e um campo de quantidade que fica desabilitado enquanto a caixa está desmarcada, com o limite do item exibido ao lado. Ao abrir, os itens SHALL vir marcados com `3` contas, `2` cartões e `150` transações, `Período` com `3` e `Semente` vazia. Os limites SHALL ser os exportados por `@poupig/dev`. Antes de enviar, o formulário SHALL exigir ao menos um item marcado, quantidade inteira entre `1` e o limite em cada item marcado, período inteiro entre `1` e `12` e semente vazia ou inteira, mostrando o erro junto do campo e sem chamar o backend. Item desmarcado SHALL ser enviado com quantidade `0` e SHALL NOT ter sua quantidade validada; semente vazia SHALL NOT ser enviada.

#### Scenario: Valores iniciais
- **WHEN** o usuário abre o gerador
- **THEN** `Contas` está marcado com 3, `Cartões de crédito` com 2, `Transações avulsas` com 150, `Período` é 3 e `Semente` está vazia

#### Scenario: Caixa desmarcada desabilita a quantidade
- **WHEN** o usuário desmarca `Cartões de crédito`
- **THEN** o campo de quantidade de cartões fica desabilitado e o envio usa `creditCards: 0`

#### Scenario: Nada marcado
- **WHEN** o usuário desmarca os três itens e clica em gerar
- **THEN** o formulário mostra o erro de nenhum item marcado e nenhuma requisição é feita

#### Scenario: Quantidade acima do limite
- **WHEN** o usuário informa 600 em `Transações avulsas` e clica em gerar
- **THEN** o campo mostra erro de limite e nenhuma requisição é feita

---

### Requirement: Execução e exibição do resumo
Ao gerar, a tela SHALL chamar `POST /dev/data-generator/transactions`, desabilitar o botão e indicar processamento até a resposta. Antes da primeira execução, a área de resultado SHALL mostrar um estado vazio. Com sucesso, a área de resultado SHALL mostrar uma tabela com uma linha por item (`Contas`, `Cartões de crédito`, `Transações avulsas`) e as colunas de solicitados, criados e ignorados, a semente usada em destaque e, quando houver, a lista dos códigos de erro traduzidos; e SHALL exibir uma notificação com o total de registros criados. Com falha, a tela SHALL mostrar a mensagem traduzida do erro e manter os valores do formulário.

#### Scenario: Estado antes da primeira execução
- **WHEN** o usuário abre o gerador e ainda não gerou nada
- **THEN** a área de resultado mostra o estado vazio

#### Scenario: Execução bem-sucedida
- **WHEN** a execução responde com 3 contas, 2 cartões e 150 transações criados e `seed: 123`
- **THEN** a tabela mostra as três linhas com as contagens, a semente `123` é exibida e uma notificação informa 155 registros criados

#### Scenario: Erros no resumo
- **WHEN** o resumo de contas traz `errors: ["ACCOUNT_NAME_ALREADY_EXISTS"]`
- **THEN** a tela mostra a mensagem traduzida desse código abaixo da tabela

#### Scenario: Falha de validação no backend
- **WHEN** a execução responde `400` com `DEV_DATA_ACCOUNT_REQUIRED`
- **THEN** a tela mostra a mensagem traduzida e o formulário mantém os valores digitados

---

### Requirement: Mensagens traduzidas dos códigos do gerador
O dicionário de mensagens SHALL ter tradução em português e em inglês para `INVALID_DEV_DATA_REQUEST`, `INVALID_DEV_DATA_QUANTITY`, `INVALID_DEV_DATA_PERIOD`, `INVALID_DEV_DATA_SEED`, `DEV_DATA_ACCOUNT_REQUIRED` e `DEV_DATA_DISABLED`. Os códigos que o resumo pode trazer dos casos de uso de conta, cartão e transação SHALL ter tradução nos dois idiomas.

#### Scenario: Código do gerador traduzido
- **WHEN** a tela recebe o código `DEV_DATA_ACCOUNT_REQUIRED` com o idioma português
- **THEN** exibe uma mensagem em português, nunca o código cru

#### Scenario: Código de outro módulo traduzido
- **WHEN** o resumo traz `CREDIT_CARD_NAME_ALREADY_EXISTS`
- **THEN** a tela exibe a mensagem traduzida desse código

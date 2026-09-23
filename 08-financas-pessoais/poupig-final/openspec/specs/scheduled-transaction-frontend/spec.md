# scheduled-transaction-frontend Specification

## Purpose
Permitir que o usuário autenticado reconheça, abra, ajuste, efetive e reverta as ocorrências de séries no extrato mensal, e chegue à edição da série a partir delas, com mensagens de erro traduzidas.
## Requirements
### Requirement: Sinal discreto de recorrência na lista
Cada entrada de ocorrência de série SHALL exibir, na tabela e no card, um ícone discreto de recorrência junto ao nome, com uma dica que mostra o nome da série. Quando a série for um parcelamento, SHALL exibir também o texto `N/T` ao lado do nome, onde `N` é o índice da ocorrência mais 1 e `T` é a quantidade de parcelas. Esse SHALL ser o único sinal visual que diferencia a ocorrência da transação avulsa: SHALL NOT existir coluna nova, cor diferente ou badge próprio. Transações avulsas SHALL NOT exibir o ícone.

#### Scenario: Parcela de um parcelamento
- **WHEN** o extrato exibe a ocorrência de índice 2 do parcelamento "Notebook" de 12 parcelas
- **THEN** a linha mostra o ícone de recorrência e o texto `3/12` ao lado do nome, e a dica do ícone mostra `Notebook`

#### Scenario: Ocorrência de recorrência
- **WHEN** o extrato exibe uma ocorrência da recorrência "Aluguel"
- **THEN** a linha mostra o ícone de recorrência sem texto `N/T`

#### Scenario: Transação avulsa
- **WHEN** o extrato exibe uma transação avulsa
- **THEN** nenhum ícone de recorrência é exibido

---

### Requirement: Formulário da ocorrência na página do extrato
Clicar em uma entrada de ocorrência SHALL abrir, na mesma página do extrato, sem modal e sem rota nova, o formulário da ocorrência com o badge `Extrato Mensal` e o título `Transação da série`. O formulário SHALL ser o mesmo da transação avulsa, com as mesmas seções, campos, validações e mensagens, acrescido de um bloco somente leitura no topo com o nome da série, o tipo da série (`Parcelamento` ou `Recorrência`), `Parcela N de T` quando a série for um parcelamento e a data original da ocorrência quando a data prevista já tiver sido movida. O formulário SHALL ser sempre de edição, mesmo quando a ocorrência ainda não foi gravada, e SHALL vir preenchido com a ocorrência carregada da API — a gravada, ou a gerada a partir da série. Enquanto carrega, SHALL exibir o esqueleto de formulário. Se a ocorrência não existir mais (série excluída ou índice fora da série), SHALL exibir toaster de erro com a mensagem traduzida e voltar para o extrato.

#### Scenario: Abrir ocorrência ainda não gravada
- **WHEN** o usuário clica na parcela 3 do parcelamento "Notebook", ainda não gravada
- **THEN** o formulário `Transação da série` abre preenchido com nome, valor, conta e data prevista da ocorrência gerada, e o bloco da série mostra `Notebook`, `Parcelamento` e `Parcela 3 de 12`

#### Scenario: Ocorrência com data movida
- **WHEN** o usuário abre uma ocorrência gravada com `occurrenceOn: "2026-10-10"` e `expectedOn: "2026-10-15"`
- **THEN** o bloco da série mostra a data original `10/10/2026`

#### Scenario: Ocorrência sem data movida
- **WHEN** o usuário abre uma ocorrência com `expectedOn` igual a `occurrenceOn`
- **THEN** o bloco da série não mostra a data original

#### Scenario: Série excluída em outra aba
- **WHEN** o usuário abre uma ocorrência cuja série foi excluída depois do carregamento do extrato
- **THEN** um toaster de erro exibe a mensagem traduzida e a tela volta para o extrato

---

### Requirement: Salvar a ocorrência grava na primeira vez e altera nas seguintes
Salvar o formulário da ocorrência SHALL gravar a ocorrência pelo par série e índice, enviando o `id` da ocorrência aberta e os campos editáveis, e SHALL NOT enviar `occurrenceOn` nem `userId`. Ao salvar com sucesso, a tela SHALL exibir toaster de sucesso, voltar para o extrato e recarregá-lo. Falhas SHALL exibir toaster de erro com a mensagem traduzida, mantendo o formulário aberto.

#### Scenario: Primeira alteração de uma ocorrência
- **WHEN** o usuário altera o valor de uma ocorrência ainda não gravada para R$ 300,00 e salva
- **THEN** um toaster de sucesso aparece, a tela volta ao extrato recarregado e a ocorrência aparece uma única vez com R$ 300,00

#### Scenario: Mover a ocorrência para o mês seguinte
- **WHEN** o usuário muda a data prevista de uma ocorrência de outubro para `2026-11-02` e salva
- **THEN** a ocorrência deixa de aparecer no extrato de outubro e aparece no de novembro

#### Scenario: Corpo enviado
- **WHEN** o usuário salva uma ocorrência
- **THEN** o corpo enviado contém `id` e os campos editáveis, e não contém `occurrenceOn` nem `userId`

---

### Requirement: Reverter para a série
O cabeçalho do formulário da ocorrência SHALL exibir o botão `Reverter para a série` somente quando a ocorrência estiver gravada, e SHALL NOT exibir botão `Excluir`. Clicar no botão SHALL abrir uma confirmação com o título `Reverter para a série`, uma descrição explicando que as alterações desta ocorrência serão descartadas e que ela voltará a seguir a série, a palavra de confirmação `reverter` e o botão `Reverter`. Confirmada a reversão, a tela SHALL exibir toaster de sucesso, voltar para o extrato e recarregá-lo. Falhas SHALL exibir toaster de erro com a mensagem traduzida.

#### Scenario: Ocorrência não gravada
- **WHEN** o usuário abre uma ocorrência ainda não gravada
- **THEN** o botão `Reverter para a série` não é exibido

#### Scenario: Reversão confirmada
- **WHEN** o usuário abre uma ocorrência gravada com R$ 300,00, clica em `Reverter para a série`, digita `reverter` e confirma
- **THEN** um toaster de sucesso aparece, a tela volta ao extrato recarregado e a ocorrência aparece com o valor da série

#### Scenario: Reversão cancelada
- **WHEN** o usuário clica em `Reverter para a série` e fecha a confirmação sem confirmar
- **THEN** nenhuma requisição é enviada e o formulário continua aberto

---

### Requirement: Editar série a partir da ocorrência
O cabeçalho do formulário da ocorrência SHALL exibir sempre o botão `Editar série`, com a ocorrência gravada ou não. Clicar no botão SHALL abrir a tela de edição da série de origem. Essa SHALL ser a única entrada da edição de série na interface.

#### Scenario: Botão visível em ocorrência não gravada
- **WHEN** o usuário abre uma ocorrência ainda não gravada
- **THEN** o botão `Editar série` é exibido

#### Scenario: Abrir a edição da série
- **WHEN** o usuário clica em `Editar série` na parcela 3 do parcelamento "Notebook"
- **THEN** a tela de edição da série "Notebook" é aberta

---

### Requirement: Dicionário de erros atualizado para ocorrência e extrato
Os dicionários pt e en SHALL conter traduções para `SCHEDULED_TRANSACTION_NOT_FOUND`, `SCHEDULED_TRANSACTION_SETTLED_ON_REQUIRED`, `SCHEDULED_TRANSACTION_SERIES_NOT_FOUND`, `SCHEDULED_TRANSACTION_OCCURRENCE_NOT_FOUND`, `SCHEDULED_TRANSACTION_ACCOUNT_NOT_FOUND`, `SCHEDULED_TRANSACTION_CREDIT_CARD_NOT_FOUND`, `SCHEDULED_TRANSACTION_SUBCATEGORY_NOT_FOUND`, `INVALID_SCHEDULED_TRANSACTION_SERIES_ID`, `INVALID_SCHEDULED_TRANSACTION_OCCURRENCE_INDEX`, `INVALID_SCHEDULED_TRANSACTION_ACCOUNT_ID`, `INVALID_SCHEDULED_TRANSACTION_CREDIT_CARD_ID`, `INVALID_SCHEDULED_TRANSACTION_SUBCATEGORY_ID`, `INVALID_SCHEDULED_TRANSACTION_OCCURRENCE_ON`, `INVALID_SCHEDULED_TRANSACTION_EXPECTED_ON`, `INVALID_SCHEDULED_TRANSACTION_SETTLED_ON` e `INVALID_STATEMENT_PERIOD`, mantendo as já existentes. Nenhum código de erro SHALL aparecer cru na tela.

#### Scenario: Novos códigos traduzidos nos dois idiomas
- **WHEN** qualquer um dos novos códigos é traduzido em pt e em en
- **THEN** a mensagem correspondente ao idioma é devolvida, e não o código cru


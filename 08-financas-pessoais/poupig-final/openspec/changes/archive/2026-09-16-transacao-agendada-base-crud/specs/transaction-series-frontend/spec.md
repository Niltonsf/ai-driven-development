## MODIFIED Requirements

### Requirement: Criação da série no próprio extrato
A opção `Série parcelada ou recorrente` do menu "Nova transação" SHALL abrir o formulário de série na mesma página do extrato, sem modal e sem rota própria, com o badge `Extrato Mensal` e o título `Nova série de transações`. A interface SHALL oferecer a criação de séries pelo menu do extrato e a edição e a exclusão de séries somente a partir de uma ocorrência da série no extrato: SHALL NOT existir listagem de séries, item de menu lateral nem rota nova para séries.

#### Scenario: Abrir o formulário de série
- **WHEN** o usuário clica em "Nova transação" e escolhe `Série parcelada ou recorrente`
- **THEN** o formulário de série é exibido na página do extrato com o badge `Extrato Mensal` e o título `Nova série de transações`

#### Scenario: Cancelar
- **WHEN** o usuário cancela o formulário de criação de série
- **THEN** a tela volta para o extrato sem salvar e sem pedir nova listagem

#### Scenario: Sem rota própria
- **WHEN** o usuário acessa `/transaction-series`
- **THEN** nenhuma tela de séries é exibida

---

### Requirement: Padrões e âncora derivada da data de início
Ao abrir para criar, o formulário SHALL vir com direção `Saída`, tipo `Parcelamento`, frequência `Mensal`, intervalo `1`, data de início igual ao dia de hoje no fuso local e âncora derivada da data de início (dia do mês para `Mensal`, dia da semana para `Semanal`, mês e dia para `Anual`). Enquanto o usuário não alterar a âncora manualmente, trocar a data de início ou a frequência SHALL recalcular a âncora a partir da data de início. Depois de uma alteração manual da âncora, SHALL NOT recalculá-la. Ao abrir para editar uma série existente, a âncora SHALL ser tratada como já escolhida: trocar a data de início SHALL NOT recalculá-la.

#### Scenario: Padrões ao abrir
- **WHEN** o formulário de criação de série é aberto em 15/09/2026
- **THEN** a direção é `Saída`, o tipo é `Parcelamento`, a frequência é `Mensal`, o intervalo é `1`, a data de início é 15/09/2026 e o dia do mês é `15`

#### Scenario: Trocar a data de início atualiza a âncora
- **WHEN** a âncora não foi alterada manualmente e o usuário troca a data de início para 03/10/2026
- **THEN** o dia do mês passa a ser `3`

#### Scenario: Trocar para semanal deriva o dia da semana
- **WHEN** a data de início é 15/09/2026, a âncora não foi alterada manualmente e o usuário troca a frequência para `Semanal`
- **THEN** o dia da semana é `Terça-feira`

#### Scenario: Âncora manual preservada
- **WHEN** o usuário altera o dia do mês para `5` e depois troca a data de início para 20/10/2026
- **THEN** o dia do mês continua `5`

#### Scenario: Âncora preservada na edição
- **WHEN** o usuário edita uma série mensal no dia 10 e troca a data de início para 20/10/2026
- **THEN** o dia do mês continua `10`

---

### Requirement: Envio da série e retorno ao extrato
O envio SHALL mandar a regra achatada (`unit`, `interval`, `weekDay`, `dayOfMonth`, `month`) com somente as âncoras da frequência escolhida e as demais como `null`, `installments` somente em `Parcelamento`, `endDate` somente em `Recorrência`, opcionais vazios como `null` e SHALL NOT mandar `userId`. Ao criar ou alterar a série com sucesso, a tela SHALL exibir toaster de sucesso, voltar para o extrato e recarregá-lo, porque as ocorrências geradas pela série podem ter surgido ou mudado de valor, de data ou de quantidade. A série em si SHALL NOT aparecer como entrada no extrato. Falhas SHALL exibir toaster de erro com a mensagem traduzida, inclusive para `TRANSACTION_SERIES_ACCOUNT_NOT_FOUND`, `TRANSACTION_SERIES_CREDIT_CARD_NOT_FOUND`, `TRANSACTION_SERIES_SUBCATEGORY_NOT_FOUND` e `TRANSACTION_SERIES_NOT_FOUND`, mantendo o formulário aberto.

#### Scenario: Criação bem-sucedida
- **WHEN** o usuário preenche o formulário de série com dados válidos e salva
- **THEN** um toaster de sucesso aparece, a tela volta ao extrato e o extrato é recarregado, trazendo as ocorrências da série que caem no mês selecionado

#### Scenario: Payload de uma regra semanal
- **WHEN** o usuário salva uma recorrência semanal a cada 2 na sexta-feira, depois de ter passado pela frequência `Anual`
- **THEN** o corpo enviado tem `unit: "WEEK"`, `interval: 2`, `weekDay: 5`, `dayOfMonth: null`, `month: null` e `installments: null`, e não tem `userId`

#### Scenario: Erro de vínculo vindo da API
- **WHEN** a API responde `400` com `TRANSACTION_SERIES_ACCOUNT_NOT_FOUND`
- **THEN** um toaster de erro exibe a mensagem traduzida, o código não aparece cru e o formulário continua aberto

## ADDED Requirements

### Requirement: Edição da série aberta a partir de uma ocorrência
A tela de edição da série SHALL ser aberta somente pelo botão `Editar série` de uma ocorrência, na mesma página do extrato. SHALL exibir o badge `Extrato Mensal`, o título `Editar série` e um subtítulo com o tipo da série (`Parcelamento` ou `Recorrência`). SHALL usar o mesmo formulário da criação, preenchido com a série carregada da API (inclusive regra, parcelas e data fim), mudando apenas título, texto do botão e um aviso exibido acima da seção `Recorrência` informando que as alterações valem para as ocorrências ainda não gravadas e que as ocorrências já alteradas, efetivadas ou canceladas mantêm os próprios valores e podem ser revertidas uma a uma. Enquanto carrega, SHALL exibir o esqueleto de formulário. Série inexistente, excluída ou de outro usuário SHALL exibir toaster de erro com a mensagem traduzida e voltar para o extrato. Cancelar SHALL voltar para o formulário da ocorrência de origem. Salvar SHALL alterar a série existente.

#### Scenario: Abrir a edição preenchida
- **WHEN** o usuário clica em `Editar série` em uma ocorrência do parcelamento mensal "Notebook" de 12 parcelas no dia 10
- **THEN** a tela `Editar série` abre com o subtítulo `Parcelamento`, o nome `Notebook`, frequência `Mensal`, dia do mês `10`, 12 parcelas e o aviso sobre o alcance da edição

#### Scenario: Cancelar volta para a ocorrência
- **WHEN** o usuário abre `Editar série` a partir da parcela 3 e cancela
- **THEN** o formulário da parcela 3 é exibido de novo

#### Scenario: Alterar o valor da série
- **WHEN** o usuário altera o valor da série para R$ 280,00 e salva
- **THEN** um toaster de sucesso aparece, a tela volta ao extrato recarregado, as ocorrências não gravadas aparecem com R$ 280,00 e as gravadas mantêm o próprio valor

#### Scenario: Série excluída em outra aba
- **WHEN** o usuário clica em `Editar série` e a série já foi excluída
- **THEN** um toaster de erro exibe a mensagem traduzida e a tela volta para o extrato

---

### Requirement: Exclusão da série na tela de edição
A tela de edição da série SHALL exibir no cabeçalho o botão `Excluir série`, e a tela de criação SHALL NOT exibi-lo. Clicar no botão SHALL abrir uma confirmação com o título `Excluir série` e uma descrição que diga explicitamente que a série deixará de gerar ocorrências **e** que as ocorrências dela já alteradas ou efetivadas deixarão de aparecer no extrato e nos relatórios. Confirmada a exclusão, a tela SHALL exibir toaster de sucesso, voltar para o extrato e recarregá-lo. Falhas SHALL exibir toaster de erro com a mensagem traduzida.

#### Scenario: Excluir não aparece na criação
- **WHEN** o usuário abre o formulário por "Nova transação" › `Série parcelada ou recorrente`
- **THEN** o botão `Excluir série` não é exibido

#### Scenario: Exclusão confirmada
- **WHEN** o usuário clica em `Excluir série`, digita a palavra de confirmação e confirma
- **THEN** um toaster de sucesso aparece, a tela volta ao extrato recarregado e nenhuma ocorrência da série aparece mais

#### Scenario: Consequência explícita
- **WHEN** a confirmação de `Excluir série` é exibida
- **THEN** a descrição informa que a série deixará de gerar ocorrências e que as ocorrências já alteradas ou efetivadas deixarão de aparecer no extrato e nos relatórios

#### Scenario: Exclusão cancelada
- **WHEN** o usuário clica em `Excluir série` e fecha a confirmação sem confirmar
- **THEN** nenhuma requisição de exclusão é enviada e a tela de edição continua aberta

# transaction-series-frontend Specification

## Purpose
Permitir que o usuário autenticado cadastre, a partir do extrato mensal, um parcelamento ou uma recorrência, vendo antes de salvar as datas que a série vai ter, com mensagens de erro traduzidas.
## Requirements
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

### Requirement: Formulário organizado em quatro seções
O formulário SHALL ter quatro seções com título e descrição:
- `Lançamento`: nome, valor no campo monetário compartilhado e direção com as opções exclusivas `Entrada`/`Saída`
- `Vínculos`: conta, cartão e subcategoria em seleção com busca, com as mesmas opções do formulário de transação (itens ativos, subcategoria como `Categoria › Subcategoria`), sem nenhum carregamento novo
- `Recorrência`: opções exclusivas `Parcelamento`/`Recorrência`; data de início em seletor de data; frequência em seleção (`Semanal`, `Mensal`, `Anual`); intervalo numérico acompanhado de uma frase natural; o campo de âncora que a frequência pede (dia da semana em seleção de `Segunda-feira` a `Domingo` para `Semanal`; número do dia do mês para `Mensal`; mês em seleção de `Janeiro` a `Dezembro` e número do dia para `Anual`); em `Parcelamento`, a quantidade de parcelas e a data fim calculada em campo somente leitura; em `Recorrência`, data fim opcional em seletor de data
- `Observação`: área de texto

A frase do intervalo SHALL ser `toda semana`, `todo mês` ou `todo ano` para intervalo 1, e `a cada N semanas`, `a cada N meses` ou `a cada N anos` para intervalo maior.

#### Scenario: Âncora mensal
- **WHEN** a frequência é `Mensal`
- **THEN** o formulário exibe apenas o número do dia do mês como âncora

#### Scenario: Âncora anual
- **WHEN** a frequência é `Anual`
- **THEN** o formulário exibe a seleção de mês e o número do dia como âncora

#### Scenario: Âncora semanal
- **WHEN** a frequência é `Semanal`
- **THEN** o formulário exibe apenas a seleção de dia da semana como âncora

#### Scenario: Frase natural do intervalo
- **WHEN** a frequência é `Mensal` e o intervalo é `3`
- **THEN** a frase ao lado do intervalo é `a cada 3 meses`

#### Scenario: Campos do parcelamento
- **WHEN** o tipo é `Parcelamento`
- **THEN** o formulário exibe a quantidade de parcelas e a data fim somente leitura, e não exibe o seletor de data fim

#### Scenario: Campos da recorrência
- **WHEN** o tipo é `Recorrência`
- **THEN** o formulário exibe o seletor opcional de data fim e não exibe a quantidade de parcelas

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

### Requirement: Troca de frequência e de tipo preserva o que ainda vale
Trocar a frequência SHALL trocar o campo de âncora exibido sem apagar os demais campos do formulário. Trocar o tipo SHALL esconder e limpar o campo que deixou de valer: de `Parcelamento` para `Recorrência`, a quantidade de parcelas; de `Recorrência` para `Parcelamento`, a data fim.

#### Scenario: Trocar frequência não apaga o formulário
- **WHEN** o usuário preencheu nome, valor, conta e parcelas e troca a frequência de `Mensal` para `Anual`
- **THEN** nome, valor, conta e parcelas continuam preenchidos

#### Scenario: Parcelamento para recorrência limpa as parcelas
- **WHEN** o usuário informou 12 parcelas e troca o tipo para `Recorrência` e de volta para `Parcelamento`
- **THEN** a quantidade de parcelas está vazia

#### Scenario: Recorrência para parcelamento limpa a data fim
- **WHEN** o usuário informou a data fim em `Recorrência` e troca o tipo para `Parcelamento` e de volta para `Recorrência`
- **THEN** a data fim está vazia

---

### Requirement: Prévia da agenda igual à que será gravada
A seção `Recorrência` SHALL exibir, como texto de apoio, as três primeiras ocorrências da série no formato `dd/MM/yyyy` e, em `Parcelamento`, a data da última parcela, calculadas pelas mesmas regras do domínio a partir dos valores atuais do formulário e atualizadas a cada alteração. Um parcelamento com menos de três parcelas SHALL exibir somente as ocorrências existentes. Com data de início ou regra incompleta ou inválida, a prévia SHALL NOT exibir datas. A data fim somente leitura do `Parcelamento` SHALL ser igual à data da última parcela e à `endDate` que o backend grava.

#### Scenario: Prévia de um parcelamento mensal
- **WHEN** o formulário tem início 15/09/2026, frequência `Mensal` a cada 1 no dia 15, tipo `Parcelamento` e 12 parcelas
- **THEN** a prévia mostra 15/09/2026, 15/10/2026 e 15/11/2026 e a última parcela em 15/08/2027, e a data fim somente leitura é 15/08/2027

#### Scenario: Prévia com dia grampeado
- **WHEN** o formulário tem início 31/01/2026 e frequência `Mensal` no dia 31
- **THEN** a prévia mostra 31/01/2026, 28/02/2026 e 31/03/2026

#### Scenario: Parcelamento com duas parcelas
- **WHEN** o tipo é `Parcelamento` com 2 parcelas
- **THEN** a prévia mostra somente duas datas

#### Scenario: Regra incompleta
- **WHEN** a frequência é `Mensal` e o dia do mês está vazio
- **THEN** a prévia não exibe datas

#### Scenario: Data gravada igual à prévia
- **WHEN** o usuário salva um parcelamento cuja prévia mostra a última parcela em 15/08/2027
- **THEN** a série gravada tem `endDate` igual a `2027-08-15`

---

### Requirement: Validação do formulário alinhada ao domínio
O formulário SHALL validar com as mesmas regras do domínio, sem reescrevê-las: nome com os limites de `MovementName`, valor monetário positivo, conta obrigatória, data de início válida, observação com os limites de `MovementNote`, cartão e subcategoria opcionais, a regra de recorrência pela validação do domínio (com a mensagem no campo de intervalo ou de âncora correspondente), parcelas obrigatórias e de 1 a 480 em `Parcelamento` e data fim de `Recorrência` não anterior à primeira ocorrência. Toda mensagem de erro SHALL ser exibida traduzida, e nenhum código de erro SHALL aparecer cru. Campos escondidos pela frequência ou pelo tipo SHALL NOT bloquear o envio.

#### Scenario: Intervalo fora do limite
- **WHEN** o usuário informa intervalo `0` ou `100` e tenta salvar
- **THEN** o envio é bloqueado com a mensagem traduzida de `INVALID_RECURRENCE_INTERVAL` no campo de intervalo

#### Scenario: Dia do mês vazio
- **WHEN** a frequência é `Mensal`, o dia do mês está vazio e o usuário tenta salvar
- **THEN** o envio é bloqueado com a mensagem traduzida de `INVALID_RECURRENCE_DAY_OF_MONTH` no campo de dia

#### Scenario: Parcelamento sem parcelas
- **WHEN** o tipo é `Parcelamento`, as parcelas estão vazias e o usuário tenta salvar
- **THEN** o envio é bloqueado com a mensagem traduzida de `TRANSACTION_SERIES_INSTALLMENTS_REQUIRED`

#### Scenario: Parcelas acima do teto
- **WHEN** o usuário informa 481 parcelas e tenta salvar
- **THEN** o envio é bloqueado com a mensagem traduzida de `INVALID_TRANSACTION_SERIES_INSTALLMENTS`

#### Scenario: Data fim anterior à primeira ocorrência
- **WHEN** o tipo é `Recorrência`, a primeira ocorrência é 15/02/2026 e o usuário informa data fim 01/02/2026
- **THEN** o envio é bloqueado com a mensagem traduzida de `TRANSACTION_SERIES_END_DATE_BEFORE_START`

#### Scenario: Âncora de outra frequência não bloqueia
- **WHEN** o usuário apaga o dia do mês em `Mensal`, troca a frequência para `Semanal` com um dia da semana escolhido e salva com os demais campos válidos
- **THEN** o envio acontece

#### Scenario: Conta não escolhida
- **WHEN** o usuário tenta salvar sem escolher conta
- **THEN** o envio é bloqueado e uma mensagem traduzida é exibida no campo conta

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

### Requirement: Rótulos em português tipados pelos conjuntos do domínio
A interface SHALL exibir `Parcelamento` para `CLOSED` e `Recorrência` para `OPEN`; `Semanal`, `Mensal` e `Anual` para `WEEK`, `MONTH` e `YEAR`; `Segunda-feira` a `Domingo` para os dias 1 a 7; e `Janeiro` a `Dezembro` para os meses 1 a 12. Os rótulos de `SeriesKind`, `FrequencyUnit` e `DayOfWeek` SHALL ser declarados de forma exaustiva sobre os conjuntos do domínio, de modo que um valor novo em um desses conjuntos quebre o build até ganhar rótulo.

#### Scenario: Rótulos exibidos
- **WHEN** o formulário exibe tipo `CLOSED`, frequência `YEAR`, mês `3` e, em outra configuração, dia da semana `7`
- **THEN** aparecem `Parcelamento`, `Anual`, `Março` e `Domingo`, sem nenhum código cru

---

### Requirement: Dicionário de erros atualizado para série e regra de recorrência
Os dicionários pt e en SHALL conter traduções para `INVALID_SERIES_KIND`, `INVALID_TRANSACTION_SERIES_INSTALLMENTS`, `INVALID_TRANSACTION_SERIES_ACCOUNT_ID`, `INVALID_TRANSACTION_SERIES_CREDIT_CARD_ID`, `INVALID_TRANSACTION_SERIES_SUBCATEGORY_ID`, `INVALID_TRANSACTION_SERIES_START_DATE`, `INVALID_TRANSACTION_SERIES_END_DATE`, `TRANSACTION_SERIES_INSTALLMENTS_REQUIRED`, `TRANSACTION_SERIES_END_DATE_BEFORE_START`, `TRANSACTION_SERIES_NOT_FOUND`, `TRANSACTION_SERIES_ACCOUNT_NOT_FOUND`, `TRANSACTION_SERIES_CREDIT_CARD_NOT_FOUND`, `TRANSACTION_SERIES_SUBCATEGORY_NOT_FOUND`, `INVALID_RECURRENCE_FREQUENCY_UNIT`, `INVALID_RECURRENCE_INTERVAL`, `INVALID_RECURRENCE_WEEK_DAY`, `INVALID_RECURRENCE_DAY_OF_MONTH` e `INVALID_RECURRENCE_MONTH`, mantendo as já existentes (`MOVEMENT_*`, `INVALID_DIRECTION`, `INVALID_MONEY_AMOUNT`, `INVALID_DATE_ONLY`, `REQUIRED_FIELD`).

#### Scenario: Novos códigos traduzidos nos dois idiomas
- **WHEN** qualquer um dos novos códigos é traduzido em pt e em en
- **THEN** a mensagem correspondente ao idioma é devolvida, e não o código cru

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


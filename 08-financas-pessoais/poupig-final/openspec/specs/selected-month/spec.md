# selected-month Specification

## Purpose
Manter, na área privada, um único mês em foco (ano + mês) compartilhado por todas as telas que filtram por período, com o seletor no cabeçalho do shell como forma de trocá-lo.
## Requirements
### Requirement: Mês selecionado é um estado global da área privada
A área privada SHALL manter um único mês selecionado, composto por ano e mês (1 a 12), disponível para todas as rotas do grupo privado e para o cabeçalho do shell. Ao entrar na área privada, o mês selecionado SHALL ser o mês corrente do navegador. A partir do mês selecionado, SHALL ser derivado o período do mês: primeiro e último dia no formato `YYYY-MM-DD`, calculados sem deslocamento pelo fuso do navegador. Nenhuma tela SHALL manter cópia própria do mês nem recalcular o período. A área pública SHALL NOT receber esse estado.

#### Scenario: Mês inicial
- **WHEN** o usuário autenticado entra na área privada em 15 de setembro de 2026
- **THEN** o mês selecionado é setembro de 2026 e o período é de `2026-09-01` a `2026-09-30`

#### Scenario: Último dia de fevereiro em ano bissexto
- **WHEN** o mês selecionado é fevereiro de 2028
- **THEN** o período é de `2028-02-01` a `2028-02-29`

#### Scenario: Período sem deslocamento de fuso
- **WHEN** o mês selecionado é outubro de 2026 em um navegador com fuso UTC-3, às 23h
- **THEN** o período é de `2026-10-01` a `2026-10-31`, sem virar para o dia anterior ou seguinte

#### Scenario: Troca de mês reflete na tela aberta
- **WHEN** o usuário está no extrato e troca o mês no seletor do cabeçalho
- **THEN** o extrato passa a exibir o novo mês sem recarregar a página

---

### Requirement: Mês selecionado não é persistido
O mês selecionado SHALL NOT ser gravado no navegador, em cookie ou na URL. Recarregar a página ou abrir a aplicação de novo SHALL voltar para o mês corrente.

#### Scenario: Recarregar volta para o mês corrente
- **WHEN** o mês corrente é setembro de 2026, o usuário seleciona março de 2026 e recarrega a página
- **THEN** o mês selecionado volta a ser setembro de 2026

---

### Requirement: Seletor de mês no cabeçalho do shell
O cabeçalho da área privada SHALL exibir o seletor de mês imediatamente depois do botão de colapsar o menu lateral. O seletor SHALL ter três partes em linha: botão de mês anterior, gatilho central com o rótulo do mês e indicação de que abre um painel, e botão de mês seguinte. O rótulo SHALL ser longo (`Setembro 2026`) a partir de telas pequenas-médias e curto (`set/2026`) abaixo disso. O cabeçalho SHALL continuar sem estourar a largura no mobile, convivendo com o menu do usuário.

#### Scenario: Rótulo longo e curto
- **WHEN** o mês selecionado é setembro de 2026
- **THEN** o gatilho mostra `Setembro 2026` em telas largas e `set/2026` em telas estreitas

#### Scenario: Setas navegam entre meses vizinhos
- **WHEN** o mês selecionado é setembro de 2026 e o usuário clica no botão de mês seguinte
- **THEN** o mês selecionado passa a ser outubro de 2026, sem abrir o painel

#### Scenario: Virada de ano para frente
- **WHEN** o mês selecionado é dezembro de 2026 e o usuário clica no botão de mês seguinte
- **THEN** o mês selecionado passa a ser janeiro de 2027

#### Scenario: Virada de ano para trás
- **WHEN** o mês selecionado é janeiro de 2026 e o usuário clica no botão de mês anterior
- **THEN** o mês selecionado passa a ser dezembro de 2025

---

### Requirement: Painel do seletor com ano e grade de meses
O gatilho SHALL abrir um painel com uma linha de navegação de ano (anterior, ano exibido, seguinte) e uma grade de três colunas com os 12 meses em rótulo curto em pt-BR. Ao abrir, o painel SHALL exibir o ano do mês selecionado. Navegar de ano SHALL mudar apenas os meses exibidos, sem trocar o mês selecionado. Clicar em um mês SHALL selecioná-lo e fechar o painel. Na grade, o mês selecionado SHALL aparecer com destaque de ativo e o mês corrente SHALL ter uma marca discreta própria. O painel SHALL exibir o botão "Mês atual" somente quando o mês selecionado não for o mês corrente; clicar nele SHALL selecionar o mês corrente e fechar o painel.

#### Scenario: Selecionar mês em outro ano
- **WHEN** o mês selecionado é setembro de 2026, o usuário abre o painel, avança para 2027 e clica em `mar`
- **THEN** o mês selecionado passa a ser março de 2027 e o painel fecha

#### Scenario: Navegar de ano não troca o mês
- **WHEN** o usuário abre o painel e avança o ano sem clicar em nenhum mês
- **THEN** o mês selecionado continua o mesmo

#### Scenario: Painel reabre no ano do mês selecionado
- **WHEN** o mês selecionado é setembro de 2026, o usuário abre o painel, avança para 2028 e fecha sem escolher
- **THEN** ao reabrir, o painel exibe 2026

#### Scenario: Botão Mês atual oculto no mês corrente
- **WHEN** o mês selecionado é o mês corrente e o usuário abre o painel
- **THEN** o botão "Mês atual" não aparece

#### Scenario: Voltar para o mês atual
- **WHEN** o mês corrente é setembro de 2026, o mês selecionado é janeiro de 2025 e o usuário clica em "Mês atual"
- **THEN** o mês selecionado passa a ser setembro de 2026 e o painel fecha

---

### Requirement: Seletor de mês acessível
Os botões de mês anterior e seguinte SHALL ter rótulos acessíveis "Mês anterior" e "Mês seguinte"; o gatilho SHALL ter rótulo acessível contendo o mês exibido; o mês selecionado na grade SHALL ser anunciado como pressionado. O painel SHALL fechar com `Escape` e com clique fora dele.

#### Scenario: Fechar com Escape
- **WHEN** o painel está aberto e o usuário pressiona `Escape`
- **THEN** o painel fecha sem alterar o mês selecionado

#### Scenario: Mês selecionado anunciado
- **WHEN** um leitor de tela percorre a grade de meses
- **THEN** somente o mês selecionado é anunciado como pressionado

---

### Requirement: Uso fora da área privada falha com mensagem traduzida
Consumir o mês selecionado fora da área privada SHALL falhar com a mensagem da chave `SELECTED_MONTH_CONTEXT_PROVIDER_REQUIRED`, presente nos dicionários pt e en.

#### Scenario: Consumo fora do provedor
- **WHEN** um componente fora da área privada tenta ler o mês selecionado
- **THEN** é lançado um erro com a mensagem traduzida de `SELECTED_MONTH_CONTEXT_PROVIDER_REQUIRED`


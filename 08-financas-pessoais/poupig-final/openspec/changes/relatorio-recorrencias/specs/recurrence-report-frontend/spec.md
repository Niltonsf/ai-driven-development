## Purpose

Mostrar ao usuário autenticado, em `/reports/recurrences`, a evolução mês a mês das entradas e saídas recorrentes numa janela que termina no mês selecionado no cabeçalho, num gráfico de linhas com uma linha por recorrência e as linhas de total, permitindo esconder recorrências e grupos pela legenda ou pela tabela para limpar o gráfico e, com uma opção única, descontar as escondidas dos totais.

## ADDED Requirements

### Requirement: Relatório Recorrências em /reports/recurrences
A área privada SHALL servir em `/reports/recurrences` o relatório de recorrências. A tela SHALL ter no topo o badge `Relatórios`, o título `Recorrências` e um subtítulo com a janela e o mês de referência por extenso (por exemplo `Últimos 12 meses, até setembro de 2026`), com o seletor de janela ao lado. O mês de referência SHALL ser o mês selecionado no seletor do cabeçalho, e trocá-lo SHALL refazer o relatório. A tela SHALL NOT ter seletor de mês próprio e SHALL NOT implementar proteção própria, dependendo da proteção do grupo de rotas privadas. Os blocos SHALL aparecer nesta ordem: faixa de totais, gráfico, tabela e nota de rodapé. A tela SHALL ser só de leitura: nenhuma série SHALL ser criada, alterada ou excluída a partir dela, e nenhuma linha ou ponto do gráfico SHALL navegar para outra tela.

#### Scenario: Abertura do relatório
- **WHEN** o usuário autenticado acessa `/reports/recurrences` com setembro de 2026 selecionado e sem janela gravada
- **THEN** a tela mostra o badge `Relatórios`, o título `Recorrências`, o subtítulo `Últimos 12 meses, até setembro de 2026` e os blocos na ordem definida

#### Scenario: Troca de mês no cabeçalho
- **WHEN** o usuário está no relatório de setembro de 2026 e escolhe março de 2026 no cabeçalho
- **THEN** o subtítulo passa a citar março de 2026, e o gráfico e a tabela passam a terminar em `mar/2026`

---

### Requirement: Seletor de janela lembrado no navegador
A tela SHALL exibir as janelas `6 meses`, `12 meses`, `18 meses` e `24 meses` como as mesmas pílulas do relatório de entradas x saídas, com a janela corrente anunciada como pressionada. A janela padrão SHALL ser `12 meses`. Escolher uma janela SHALL refazer o relatório e SHALL ser gravado no navegador numa chave própria deste relatório, independente da janela do relatório de entradas x saídas, sendo restaurado ao voltar à tela ou recarregar a página. Um valor gravado ausente, de outra versão ou fora do conjunto SHALL ser ignorado em favor do padrão. O mês de referência e a marcação SHALL NOT ser gravados.

#### Scenario: Escolher janela
- **WHEN** o usuário clica em `24 meses`
- **THEN** a pílula `24 meses` fica pressionada, o subtítulo passa a `Últimos 24 meses, até ...` e o gráfico e a tabela mostram 24 meses

#### Scenario: Janelas independentes
- **WHEN** o usuário escolhe `6 meses` no relatório de recorrências e depois abre o relatório de entradas x saídas com `12 meses` gravado
- **THEN** o relatório de entradas x saídas continua em `12 meses`, e o de recorrências continua em `6 meses` ao voltar

#### Scenario: Valor gravado inválido
- **WHEN** o navegador tem gravada a janela `7` para o relatório de recorrências
- **THEN** a tela abre com `12 meses`

#### Scenario: Troca rápida de janela
- **WHEN** o usuário clica em `6 meses` e logo em seguida em `24 meses`, antes da primeira resposta chegar
- **THEN** a tela termina mostrando 24 meses, nunca a resposta de 6

---

### Requirement: Esconder recorrências do gráfico
Toda recorrência da resposta SHALL começar visível. O usuário SHALL poder esconder e mostrar cada recorrência e cada grupo inteiro, tanto pela legenda do gráfico quanto pelas caixas da tabela — os dois controles SHALL refletir o mesmo estado (caixa marcada = recorrência visível) —, **imediatamente** e sem nova requisição ao servidor. Esconder uma recorrência SHALL tirar a linha dela do gráfico; se isso também muda os totais depende só da opção `Descontar dos totais as recorrências ocultas` (requisito "Opção única para descontar as ocultas dos totais"). As recorrências escondidas SHALL continuar escondidas ao trocar de mês ou de janela durante a sessão; uma recorrência que só aparece depois SHALL entrar visível; uma recorrência escondida que não está na resposta corrente SHALL ser ignorada. O estado SHALL NOT ser gravado no navegador e SHALL voltar a tudo visível ao recarregar a página.

#### Scenario: Esconder uma conta sem descontar
- **WHEN** a opção de descontar está desligada e o usuário esconde a saída "Aluguel" de `R$ 1.500,00` por mês
- **THEN** sem nova requisição, a linha de "Aluguel" some do gráfico, e as linhas de total, os cards, os subtotais e o resultado da tabela continuam iguais

#### Scenario: Legenda e tabela sincronizadas
- **WHEN** o usuário esconde "Aluguel" clicando no item dela na legenda do gráfico
- **THEN** a caixa de "Aluguel" na tabela aparece desmarcada, e marcar a caixa de novo mostra a linha e reabilita o item na legenda

#### Scenario: Estado sobrevive à troca de janela
- **WHEN** o usuário esconde "Aluguel" e troca a janela de `12 meses` para `6 meses`
- **THEN** "Aluguel" continua escondida

#### Scenario: Recorrência nova entra visível
- **WHEN** o usuário troca para um mês em que aparece uma recorrência que não estava na resposta anterior
- **THEN** essa recorrência aparece visível

#### Scenario: Recarregar a página
- **WHEN** o usuário esconde recorrências e recarrega a página
- **THEN** todas as recorrências aparecem visíveis

---

### Requirement: Opção única para descontar as ocultas dos totais
O card do gráfico SHALL exibir uma única caixa de marcação com o rótulo `Descontar dos totais as recorrências ocultas`, que vale para o relatório inteiro — não há escolha por recorrência. A opção SHALL começar desligada.
- **Desligada**: a faixa de totais, os subtotais e o resultado da tabela e as linhas `Entradas recorrentes`, `Saídas recorrentes` e `Total geral` SHALL somar **todas** as recorrências, visíveis ou escondidas.
- **Ligada**: essas mesmas somas SHALL considerar só as recorrências visíveis.

Ligar ou desligar a opção SHALL recalcular tudo na hora, sem nova requisição. Esconder uma linha de total SHALL NOT mudar nenhuma soma, com a opção ligada ou desligada. A opção SHALL continuar como está ao trocar de mês ou de janela durante a sessão, SHALL NOT ser gravada no navegador e SHALL voltar desligada ao recarregar a página, para o relatório nunca abrir com valores fora dos totais sem o usuário perceber.

#### Scenario: Só o total geral de tudo
- **WHEN** a opção está desligada e o usuário esconde os grupos `Entradas recorrentes` e `Saídas recorrentes` e as linhas de total de entradas e de saídas
- **THEN** o gráfico mostra só a linha `Total geral`, somando todas as recorrências

#### Scenario: Ligar a opção
- **WHEN** "Aluguel" de `R$ 1.500,00` por mês está escondida e o usuário liga a opção
- **THEN** cada mês da linha `Saídas recorrentes` e do subtotal de saídas cai `R$ 1.500,00`, a linha `Total geral` e o resultado sobem `R$ 1.500,00` e os cards de saídas, resultado e comprometimento mudam na hora

#### Scenario: Desligar a opção
- **WHEN** a opção está ligada com recorrências escondidas e o usuário a desliga
- **THEN** as somas voltam a considerar todas as recorrências, e as recorrências continuam escondidas do gráfico

#### Scenario: Opção não é lembrada
- **WHEN** o usuário liga a opção e recarrega a página
- **THEN** a opção aparece desligada

---

### Requirement: Faixa de totais das recorrências
A tela SHALL exibir quatro cards com título e ícone, calculados sobre as recorrências consideradas pela opção de descontar (todas, ou só as visíveis com a opção ligada): `Entradas recorrentes` e `Saídas recorrentes` (soma do período), `Resultado recorrente` (entradas menos saídas do período) e `Comprometimento` (saídas recorrentes divididas pelas entradas recorrentes do período, em percentual sem casas). Os três primeiros SHALL mostrar como legenda a média mensal, dividida pela quantidade de meses da janela. O resultado SHALL ser colorido pelo sinal. Quando não há entrada recorrente considerada com valor, o comprometimento SHALL mostrar um traço, nunca `NaN` nem infinito. Os cards SHALL usar a mesma superfície e os mesmos tons de entrada, saída e resultado do relatório de entradas x saídas, em uma coluna no mobile, duas em telas médias e quatro em telas largas.

#### Scenario: Totais de uma janela de 12 meses
- **WHEN** as recorrências consideradas somam R$ 96.000,00 de entradas e R$ 36.000,00 de saídas em 12 meses
- **THEN** os cards mostram `R$ 96.000,00` com média `R$ 8.000,00`, `R$ 36.000,00` com média `R$ 3.000,00`, `R$ 60.000,00` com média `R$ 5.000,00` e comprometimento `38%`

#### Scenario: Sem entrada considerada
- **WHEN** a opção de descontar está ligada e o usuário esconde o grupo de entradas recorrentes
- **THEN** `Entradas recorrentes` mostra `R$ 0,00`, o resultado fica negativo na cor de saída e o comprometimento mostra um traço

---

### Requirement: Gráfico de linhas das recorrências
A tela SHALL exibir um card `Evolução das recorrências` com um gráfico de linhas sobre os meses da janela, com o eixo horizontal no rótulo curto do mês (`set/2026`), o eixo vertical e o tooltip em reais pt-BR e uma linha de referência no zero. O gráfico SHALL desenhar só as linhas habilitadas:
- uma linha por recorrência visível, com os valores mensais da própria recorrência;
- a linha `Entradas recorrentes`, com a soma mensal das entradas consideradas, na cor de entrada do relatório de entradas x saídas;
- a linha `Saídas recorrentes`, com a soma mensal das saídas consideradas, na cor de saída;
- a linha `Total geral`, com entradas consideradas menos saídas consideradas de cada mês, que pode ficar negativa.

"Consideradas" são todas as recorrências com a opção de descontar desligada, e só as visíveis com ela ligada. As três linhas de total SHALL ser mais grossas que as linhas de recorrência, e a linha `Total geral` SHALL ser tracejada. A cor de cada recorrência SHALL vir de uma paleta fixa pela posição dela dentro da direção, na ordem da resposta — tons frios para entradas e quentes para saídas, nenhum igual às cores das linhas de total —, para a mesma recorrência manter a cor ao trocar de mês ou de janela. O tooltip SHALL listar as linhas do mês do maior para o menor valor. Quando nenhuma linha está habilitada, o card SHALL mostrar um estado vazio pedindo para habilitar ao menos uma linha na legenda. O gráfico SHALL ser só de leitura: nenhum ponto SHALL ser clicável.

#### Scenario: Linhas de uma janela
- **WHEN** o usuário tem a entrada "Salário" de `R$ 8.000,00` e as saídas "Água" de `R$ 100,00` e "Internet" de `R$ 150,00` mensais
- **THEN** o gráfico mostra as linhas de "Salário", "Água" e "Internet", a linha `Entradas recorrentes` em `R$ 8.000,00`, a linha `Saídas recorrentes` em `R$ 250,00` e a linha `Total geral` em `R$ 7.750,00` em todos os meses

#### Scenario: Tooltip do mês
- **WHEN** o usuário passa o mouse sobre março de 2026
- **THEN** o tooltip mostra o mês e o valor em reais de cada linha habilitada, do maior para o menor

#### Scenario: Nada habilitado
- **WHEN** o usuário desabilita todas as linhas pela legenda
- **THEN** o gráfico mostra o estado vazio

---

### Requirement: Legenda do gráfico liga e desliga linhas e grupos
Ao lado do gráfico (abaixo dele em telas estreitas), a tela SHALL exibir a legenda, que é também o controle das linhas, em três grupos nesta ordem: `Totais` (`Entradas recorrentes`, `Saídas recorrentes` e `Total geral`), `Entradas recorrentes` e `Saídas recorrentes` (as recorrências da direção, na ordem da resposta). Um grupo sem nenhuma recorrência SHALL NOT aparecer. Cada item SHALL ser um botão anunciado como pressionado quando a linha está habilitada e SHALL mostrar a amostra da linha (cor, espessura e tracejado), o nome, uma descrição curta e o total do período em reais, com o `Total geral` colorido pelo sinal. A descrição SHALL ser a frequência, para uma recorrência, e o que a linha soma, para uma linha de total (`soma de todas as entradas` / `soma de todas as saídas` com a opção de descontar desligada, `soma das entradas visíveis` / `soma das saídas visíveis` com ela ligada, e `entradas − saídas`). A cor da amostra SHALL ser a cor da linha no gráfico.

- Clicar no item de uma **recorrência** SHALL esconder ou mostrar a recorrência, com o mesmo efeito da caixa dela na tabela.
- Clicar no item de uma **linha de total** SHALL só esconder ou mostrar essa linha.
- Clicar no **título de um grupo** SHALL desabilitar todas as linhas do grupo ou, quando o grupo inteiro já está desabilitado, habilitar todas. O título SHALL mostrar quantas linhas do grupo estão habilitadas sobre o total (`3/20`) e SHALL ser anunciado como pressionado, não pressionado ou parcialmente pressionado. Nos grupos de entradas e de saídas, o efeito SHALL ser o mesmo da caixa do grupo na tabela; no grupo `Totais`, SHALL só esconder ou mostrar as três linhas de total.
- Nenhum clique na legenda SHALL mudar soma por si só: o efeito nos totais é decidido pela opção de descontar.
- Um item desabilitado SHALL continuar na legenda, apagado e com o nome riscado, como caminho de volta.
- Quando há linha desabilitada, a legenda SHALL exibir o botão `Mostrar todas (N)`, com `N` igual à quantidade de linhas desabilitadas (recorrências escondidas mais linhas de total escondidas), que habilita todas.
- Passar o mouse ou o foco sobre um item habilitado SHALL destacar a linha correspondente e apagar as demais.
- As linhas de total escondidas SHALL continuar escondidas ao trocar de mês ou de janela durante a sessão e SHALL NOT ser gravadas no navegador.

#### Scenario: Desabilitar um grupo inteiro
- **WHEN** a opção de descontar está desligada, o usuário tem 20 saídas recorrentes habilitadas e clica no título `Saídas recorrentes` da legenda
- **THEN** as 20 linhas de saída somem do gráfico, o título mostra `0/20`, a caixa do grupo de saídas na tabela fica desmarcada, o botão `Mostrar todas (20)` aparece e a linha `Saídas recorrentes` e os cards continuam com o valor de todas as saídas

#### Scenario: Grupo parcialmente habilitado
- **WHEN** 3 das 20 saídas estão desabilitadas e o usuário clica no título `Saídas recorrentes`
- **THEN** todas as 20 saídas ficam desabilitadas

#### Scenario: Reabilitar o grupo
- **WHEN** todas as saídas estão desabilitadas e o usuário clica no título `Saídas recorrentes`
- **THEN** todas as 20 saídas voltam a ficar habilitadas

#### Scenario: Esconder os totais
- **WHEN** o usuário clica no título `Totais`
- **THEN** as linhas `Entradas recorrentes`, `Saídas recorrentes` e `Total geral` somem do gráfico, as linhas das recorrências continuam, e a faixa de totais e a tabela não mudam

#### Scenario: Esconder uma linha de total
- **WHEN** o usuário clica no item `Total geral` da legenda
- **THEN** só a linha `Total geral` some do gráfico, o item fica apagado e riscado e nenhuma soma muda

#### Scenario: Mostrar todas
- **WHEN** há recorrências e linhas de total escondidas e o usuário clica em `Mostrar todas`
- **THEN** todas as recorrências ficam visíveis, as três linhas de total aparecem e o botão some

#### Scenario: Destaque pelo hover
- **WHEN** o usuário passa o mouse sobre o item "Internet"
- **THEN** a linha de "Internet" fica em destaque e as outras linhas ficam apagadas até o mouse sair

---

### Requirement: Tabela mês a mês com grupos
A tela SHALL exibir um card `Recorrências` com uma tabela que rola na horizontal quando não cabe, com:
- a primeira coluna fixa à esquerda, contendo a caixa de visibilidade, o nome da recorrência, a frequência e um detalhe com categoria e subcategoria (ou `Sem classificação`), conta e, quando houver fim, `até` seguido do mês curto do fim;
- uma coluna por mês da janela, em ordem crescente, com o rótulo curto do mês;
- a coluna `Total` com o total do período.

O subtítulo do card SHALL dizer que desmarcar uma recorrência a esconde do gráfico e, com a opção de descontar ligada, também a desconta dos totais. Quando há recorrência escondida, o card SHALL exibir o botão `Mostrar todas (N)`, com `N` igual à quantidade escondida, que mostra todas as recorrências.

As linhas SHALL estar em dois grupos, nesta ordem: `Entradas recorrentes` e `Saídas recorrentes`, com as recorrências na ordem da resposta. Cada grupo SHALL ter um cabeçalho com uma caixa tri-estado (marcada quando todas estão visíveis, indeterminada quando só algumas, desmarcada quando nenhuma) que mostra ou esconde o grupo inteiro, o nome do grupo e o texto `N de M visíveis`; e SHALL terminar numa linha de subtotal (`Total de entradas` / `Total de saídas`) com a soma por mês e do período das recorrências consideradas pela opção de descontar. Grupo sem recorrência SHALL mostrar uma linha única dizendo que não há entrada (ou saída) recorrente no período. A tabela SHALL terminar na linha `Resultado recorrente`, com entradas consideradas menos saídas consideradas por mês e no período, colorida pelo sinal. Cada linha de recorrência SHALL mostrar sempre os próprios valores; a linha escondida SHALL continuar na tabela, apagada. Valores SHALL estar em reais pt-BR alinhados à direita, e o mês sem valor SHALL aparecer como traço discreto. As caixas SHALL ter rótulo acessível com o nome da recorrência ou do grupo.

A frequência SHALL ser `Semanal`, `Mensal` ou `Anual` quando o intervalo é 1 e `A cada N semanas`, `A cada N meses` ou `A cada N anos` quando é maior.

#### Scenario: Grupos e subtotais
- **WHEN** o usuário tem a entrada "Salário" de `R$ 8.000,00` e as saídas "Água" de `R$ 100,00` e "Internet" de `R$ 150,00` mensais
- **THEN** a tabela mostra `Entradas recorrentes` com "Salário" e subtotal `R$ 8.000,00` por mês, `Saídas recorrentes` com "Água" e "Internet" e subtotal `R$ 250,00` por mês, e `Resultado recorrente` com `R$ 7.750,00` por mês

#### Scenario: Caixa do grupo indeterminada
- **WHEN** o usuário esconde só "Água"
- **THEN** a caixa do grupo de saídas fica indeterminada, o texto mostra `1 de 2 visíveis` e a linha de "Água" fica apagada com os valores visíveis; o subtotal de saídas continua `R$ 250,00` por mês com a opção de descontar desligada e passa a `R$ 150,00` com ela ligada

#### Scenario: Caixa do grupo mostra e esconde todas
- **WHEN** o usuário clica na caixa indeterminada do grupo de saídas e depois clica nela de novo
- **THEN** o primeiro clique mostra todas as saídas, e o segundo esconde todas

#### Scenario: Frequência e detalhe
- **WHEN** uma recorrência é a cada 2 meses, na subcategoria "Condomínio" da categoria "Moradia", na conta "Nubank", com fim em dezembro de 2026
- **THEN** a linha mostra `A cada 2 meses` e o detalhe com `Moradia`, `Condomínio`, `Nubank` e `até dez/2026`

#### Scenario: Janela de 24 meses no mobile
- **WHEN** o usuário vê a janela de 24 meses numa tela estreita
- **THEN** a tabela rola na horizontal com a coluna do nome fixa, e a página não rola na horizontal

---

### Requirement: Caixa de marcação compartilhada com estado indeterminado
A caixa de marcação compartilhada da aplicação SHALL exibir um traço horizontal, com o mesmo destaque visual do estado marcado, quando estiver no estado indeterminado. Os estados marcado e desmarcado SHALL continuar com a aparência atual.

#### Scenario: Estado indeterminado
- **WHEN** a caixa recebe o estado indeterminado
- **THEN** ela mostra o traço horizontal com o fundo do estado marcado e é anunciada como parcialmente marcada

---

### Requirement: Nota de rodapé sobre o que o relatório soma
A tela SHALL exibir ao final uma nota discreta explicando que o relatório soma as ocorrências pendentes e efetivadas das recorrências pela data prevista, incluindo as que ainda não foram abertas (com o valor atual da série) e sem as canceladas; que parcelamentos e transações avulsas não entram; e que esconder uma recorrência só a tira do gráfico, com os totais continuando a considerar todas, a não ser com a opção de descontar as ocultas ligada.

#### Scenario: Nota visível
- **WHEN** o relatório é exibido com dados
- **THEN** a nota aparece abaixo da tabela

---

### Requirement: Estados de carregamento, erro e sem recorrência
Enquanto o relatório carrega, a faixa de totais, o gráfico e a tabela SHALL exibir esqueletos com a mesma organização e altura aproximada do conteúdo final, sem a altura da tela mudar bruscamente ao trocar de mês ou de janela. Em caso de erro, a tela SHALL exibir no lugar dos blocos um card com mensagem legível traduzida e o botão `Tentar de novo`, que refaz a leitura; os códigos `INVALID_REPORT_REFERENCE` e `INVALID_REPORT_WINDOW` SHALL usar as mensagens que já existem nos dicionários pt e en. Quando a resposta não tem nenhuma recorrência, a tela SHALL exibir, no lugar dos totais, do gráfico e da tabela, um card de estado vazio dizendo que não há recorrência cadastrada no período e apontando para o `Extrato Mensal` (`/transactions`), onde as recorrências são criadas.

#### Scenario: Carregando
- **WHEN** a leitura do relatório ainda não respondeu
- **THEN** os esqueletos aparecem no lugar dos totais, do gráfico e da tabela

#### Scenario: Erro na leitura
- **WHEN** a leitura falha
- **THEN** a tela mostra a mensagem de erro e o botão `Tentar de novo`, e clicar nele refaz a leitura

#### Scenario: Sem recorrência
- **WHEN** o usuário não tem nenhuma recorrência vigente na janela
- **THEN** a tela mostra o estado vazio com o caminho para o `Extrato Mensal`

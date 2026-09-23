## Purpose

Definir como o conteúdo das telas da área privada ocupa o corpo do shell administrativo, para que todas aproveitem a largura disponível da mesma forma.

## ADDED Requirements

### Requirement: Telas privadas em largura total
As telas da área privada SHALL ocupar toda a largura do corpo do shell, sem caixa centralizada de largura máxima. Isso vale para o dashboard, o extrato mensal e seus formulários (transação, série e ocorrência de série), as listas e formulários de contas, cartões e categorias, e a tela de desenvolvimento. O espaçamento entre o conteúdo e as bordas SHALL vir só do corpo do shell, sem margem interna adicional de cada tela, de modo que todas alinhem pelas mesmas bordas. Nos formulários, os campos SHALL manter largura máxima própria dentro de cada seção, para não esticarem em telas largas. A landing page e a tela de login, fora da área privada, SHALL continuar centralizadas.

#### Scenario: Lista em tela larga
- **WHEN** o usuário abre `/accounts` em uma tela de 1920px de largura
- **THEN** o cabeçalho e a lista de contas se estendem até as bordas do corpo do shell, sem faixa vazia centralizando o conteúdo

#### Scenario: Mesmo alinhamento entre telas
- **WHEN** o usuário navega do dashboard para o extrato mensal
- **THEN** o conteúdo das duas telas começa e termina nas mesmas bordas horizontais

#### Scenario: Formulário em tela larga
- **WHEN** o usuário abre o formulário de nova transação em uma tela de 1920px de largura
- **THEN** as seções do formulário ocupam a largura do corpo, mas os campos de cada seção mantêm largura máxima e não esticam até a borda

#### Scenario: Telas públicas inalteradas
- **WHEN** o usuário acessa `/` ou `/join`
- **THEN** o conteúdo continua centralizado como antes

# modulo-frontend-cartao

## Purpose

Definir a camada de frontend do cadastro de cartões em `apps/web/src/modules/cartao`, com separação entre transporte/estado (`data/`), apresentação (`components/`) e composição/navegação (`pages/`), reusando contratos e Value Objects compartilhados do domínio.

## Requirements

### Requirement: Organização do módulo de frontend

A camada de frontend SHALL organizar o cadastro em `apps/web/src/modules/cartao` com três responsabilidades separadas: `data/` (transporte + estado), `components/` (apresentação) e `pages/` (composição + navegação). A UI SHALL nunca chamar `fetch` diretamente nem conhecer URLs do backend — todo acesso passa pela `data/`. O módulo SHALL ter um barrel `index.ts` reexportando seus artefatos.

#### Scenario: Direção das dependências

- **WHEN** um componente precisa de dados ou de uma ação remota
- **THEN** ele consome um hook de `data/`, que por sua vez chama o cliente de API do módulo
- **AND** nenhum componente ou página importa `fetch`/transporte diretamente

#### Scenario: Sem estado global prematuro

- **WHEN** o estado é consumido em uma única cadeia página → componente → hook
- **THEN** não se introduz React Context; ele só entra quando o estado precisar ser compartilhado entre componentes irmãos

### Requirement: Cliente de API do módulo

A camada de frontend SHALL expor um cliente de API por módulo (`data/cartoes.client.ts`) que é a única fronteira de transporte: traduz parâmetros de domínio em chamadas HTTP sobre o `apiRequest` compartilhado e devolve os contratos compartilhados (`CartaoDTO`, `PaginatedResultDTO`). SHALL reutilizar a infraestrutura de transporte existente, sem recriar `fetch`.

#### Scenario: Operações cobertas

- **WHEN** o cliente é definido
- **THEN** ele expõe listagem paginada (`GET /cartoes`), consulta por id (`GET /cartoes/:id`), salvar (`POST /cartoes`, retorna vazio) e excluir (`DELETE /cartoes/:id`, retorna vazio)
- **AND** cada função aceita um `AbortSignal` opcional repassado ao `apiRequest`

#### Scenario: Tipos reaproveitados

- **WHEN** entradas e saídas são tipadas
- **THEN** usa os contratos compartilhados (`CartaoDTO`, `SalvarCartaoIn`, `PaginatedInputDTO/ResultDTO`) via `import type` (sem duplicar tipos de domínio)

### Requirement: Schema de formulário reusando os Value Objects do domínio

A camada de frontend SHALL definir o schema de validação do formulário (`data/cartao-form.schema.ts`) com o validator `v` compartilhado, reusando os Value Objects do domínio como fonte única de regras (mesmos limites/mensagens do backend, sem duplicação). O schema SHALL ser agnóstico de operação (descreve a FORMA do cartão), com campos opcionais marcados como tal. O tipo do formulário SHALL ser inferido do schema.

#### Scenario: Reuso dos VOs textuais e opcionais

- **WHEN** o schema é definido
- **THEN** `name` usa `NomeCartao` (obrigatório) e os textuais opcionais usam os VOs correspondentes do domínio (`DescricaoCartao`, `BandeiraCartao`, `UltimosDigitosCartao`, `IconeCartao`), declarados como opcionais
- **AND** `color` reusa o VO compartilhado `HexColor` e o booleano `active` é adaptado ao contrato mínimo de VO para atravessar o resolver

#### Scenario: Reuso dos VOs numéricos

- **WHEN** os campos numéricos opcionais são definidos
- **THEN** `limit` usa o VO compartilhado `NonNegative` e `closingDay`/`dueDay` usam `DayOfMonth`, herdando suas regras e mensagens
- **AND** os valores vindos dos inputs são convertidos para número na fronteira do form, com entrada vazia tratada como campo ausente (sem `NaN` no payload)

#### Scenario: Helpers de defaults e payload

- **WHEN** o formulário precisa de valores iniciais ou de montar o payload
- **THEN** existe um helper que deriva os `defaultValues` do DTO (ausente ⇒ criação em branco; presente ⇒ edição pré-preenchida)
- **AND** existe um helper que monta o payload de salvar, incluindo `id` apenas quando há cartão existente (ausência ⇒ criação; presença ⇒ atualização) e omitindo opcionais vazios

### Requirement: Hooks de dados concentram estado e transporte

A camada de frontend SHALL prover hooks em `data/` que concentram todo o estado de consulta/mutação e a orquestração das chamadas, deixando os componentes puramente apresentacionais. Consultas SHALL cancelar requisições obsoletas com `AbortController` e expor `loading`, `error` e `refetch`.

#### Scenario: Listagem paginada

- **WHEN** o hook de lista é usado
- **THEN** ele mantém `data`, `meta`, `page`, `loading`, `error` e expõe `goToPage` e `refetch`, recarregando quando a página muda

#### Scenario: Registro único para edição

- **WHEN** o hook de consulta por id é usado
- **THEN** ele carrega o `CartaoDTO` selecionado com `loading`/`error`/`refetch`, espelhando o hook de lista

#### Scenario: Formulário create/edit

- **WHEN** o hook de formulário é usado
- **THEN** ele detém o React Hook Form (com `resolver` do schema e `defaultValues` derivados do DTO), executa a chamada de salvar e expõe o estado de submissão (`idle`/`submitting`/`error`/`success`) com erro já traduzido
- **AND** decide criação vs. edição pela presença do DTO (`isEdit`)

#### Scenario: Exclusão desacoplada da lista

- **WHEN** o hook de exclusão é usado
- **THEN** ele executa a mutação, expõe `loading`/`error`/`reset` e retorna sucesso/falha, deixando o chamador decidir o efeito (fechar diálogo, recarregar a lista)

#### Scenario: Tradução de erros de negócio

- **WHEN** uma chamada falha com erro de API
- **THEN** o hook traduz os códigos de erro do backend (ex.: `CARTAO_NAME_ALREADY_IN_USE`) em mensagem amigável via a infraestrutura de i18n compartilhada

### Requirement: Componentes de apresentação

A camada de frontend SHALL prover componentes "burros" que consomem os hooks e renderizam explicitamente os estados de carregando, erro, vazio e dados, usando os componentes de UI compartilhados. Os componentes SHALL não conhecer transporte nem URLs.

#### Scenario: Lista com paginação e exclusão

- **WHEN** o componente de lista é renderizado
- **THEN** ele exibe a tabela paginada com os estados loading/erro/vazio/dados e oferece ações de criar (navegação), editar (navegação) e excluir (diálogo de confirmação delegando ao hook de exclusão)
- **AND** após excluir o último item da página, recua uma página; caso contrário recarrega a lista

#### Scenario: Formulário agnóstico de operação

- **WHEN** o componente de formulário recebe o DTO como prop opcional
- **THEN** sem DTO opera em modo criação (campos vazios) e com DTO opera em modo edição (pré-preenchido), sem lógica duplicada
- **AND** usa binding direto para inputs nativos (texto/numérico), componentes controlados para campos de UID customizada (cor, ícone, checkbox `active`), exibindo erros de campo e de submissão de forma padronizada

### Requirement: Páginas e rotas

A camada de frontend SHALL prover páginas responsáveis apenas pela composição (cabeçalho de seção + componente) e que detêm a navegação (a navegação é estado da aplicação, não vive em `shared/` nem no formulário). As rotas SHALL ficar no grupo privado do Next e renderizar as páginas do módulo.

#### Scenario: Composição e navegação na página

- **WHEN** uma página é renderizada
- **THEN** ela compõe o cabeçalho da seção com o componente e passa callbacks de navegação (`onSuccess`/`onCancel`) — o componente não decide rota

#### Scenario: Página de edição monta o formulário após carregar

- **WHEN** a página de edição é aberta
- **THEN** ela carrega o cartão pelo hook de registro único e só monta o formulário (em modo edição) após o cartão estar disponível, garantindo o pré-preenchimento sem efeitos extras

#### Scenario: Rotas do grupo privado

- **WHEN** as rotas são definidas
- **THEN** existem rotas para listar, criar e editar sob o grupo privado, cada uma renderizando a página correspondente do módulo

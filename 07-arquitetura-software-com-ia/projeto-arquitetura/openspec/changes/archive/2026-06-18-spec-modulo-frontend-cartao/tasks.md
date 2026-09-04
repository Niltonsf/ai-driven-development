> Esta mudança só deve ser executada **após** a conclusão das camadas de negócio (`spec-modulo-negocio-cartao`) e backend (`spec-modulo-backend-cartao`), pois o frontend consome `@arquitetura/cartao` e o endpoint HTTP do backend. Cada tarefa deve ser executada usando a skill indicada em `.claude/skills`, que descreve em detalhe o padrão do projeto. A spec define o **quê** (contratos da camada de frontend de Cartão); a skill define o **como**. As camadas de negócio (`@arquitetura/cartao`) e backend já existem e são apenas consumidas. Onde não há skill dedicada, seguir o padrão de módulo CRUD do web já estabelecido (`apps/web/src/modules/contas` como referência).

## 1. Estrutura do módulo e rotas

- [x] 1.1 Garantir a estrutura `data/`/`components/`/`pages/` do módulo `apps/web/src/modules/cartao` e as rotas do grupo privado (listar/criar/editar) com a skill **config-shared-frontend**, mantendo a navegação no layout/páginas (não em `shared/`)

## 2. Camada de dados (`data/`)

- [x] 2.1 Criar o cliente de API do módulo (`cartoes.client.ts`) sobre o `apiRequest` compartilhado: listar (`GET /cartoes`), consultar por id (`GET /cartoes/:id`), salvar (`POST /cartoes`) e excluir (`DELETE /cartoes/:id`) — seguindo o padrão de módulo CRUD do web (sem recriar `fetch`)
- [x] 2.2 Criar o schema do formulário (`cartao-form.schema.ts`) reusando os Value Objects do domínio: textuais (`NomeCartao`, `DescricaoCartao`, `BandeiraCartao`, `UltimosDigitosCartao`, `IconeCartao`), `HexColor` para `color` e os numéricos `NonNegative` (`limit`) e `DayOfMonth` (`closingDay`/`dueDay`), com opcionais, conversão string→número na fronteira e helpers de `defaults`/payload, usando a skill **frontend-form-schema**
- [x] 2.3 Criar os hooks de dados (lista paginada, registro único, exclusão) com `AbortController`, `loading`/`error`/`refetch` e tradução de erro (incl. `CARTAO_NAME_ALREADY_IN_USE`) — seguindo o padrão de módulo CRUD do web
- [x] 2.4 Criar o hook do formulário (RHF + `resolver` do schema + chamada de salvar + status de submissão), decidindo create/edit pela presença do DTO, com a skill **frontend-form-schema**

## 3. Componentes de apresentação (`components/`)

- [x] 3.1 Criar o componente de lista paginada (estados loading/erro/vazio/dados + ações criar/editar/excluir com diálogo de confirmação) consumindo os hooks — padrão de módulo CRUD do web
- [x] 3.2 Criar o componente de formulário agnóstico de operação (recebe `CartaoDTO?`, modo criação/edição) consumindo o hook do formulário, com binding direto para campos de texto/numéricos e controlados para cor/ícone/checkbox, usando a skill **frontend-form-schema**

## 4. Páginas (`pages/`)

- [x] 4.1 Criar as páginas de listar, criar e editar (composição + navegação via callbacks), com a página de edição montando o formulário só após o cartão carregar, usando a skill **config-shared-frontend**

## 5. Verificação

- [x] 5.1 Conferir que cada cenário da spec é satisfeito (form create/edit pelo DTO, schema reusando VOs textuais e numéricos, paginação/exclusão, edição pré-preenchida)
- [x] 5.2 Conferir que a UI nunca chama `fetch` direto, que tipos do domínio não são duplicados, que os campos numéricos não enviam `NaN` e que a navegação vive nas páginas

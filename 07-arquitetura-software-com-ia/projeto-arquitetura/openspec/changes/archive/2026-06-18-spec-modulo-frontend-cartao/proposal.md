## Why

O cadastro de Cartão já terá suas camadas de **negócio** (`spec-modulo-negocio-cartao` → `@arquitetura/cartao`) e de **backend** (`spec-modulo-backend-cartao` → `apps/backend/src/modules/cartao`) especificadas e implementadas, mas falta a **camada de frontend** em `apps/web/src/modules/cartao` (hoje apenas um scaffold com dashboard). Precisamos de uma especificação escrita "à mão", no nível de um dev experiente, modelada sobre a camada de frontend de Conta (`spec-modulo-frontend-conta`, já validada e arquivada), para servir de molde ao plugar o cadastro de Cartão no web.

## What Changes

- Criar uma especificação da **camada de frontend** do cadastro de Cartão, aplicando o padrão validado em `modulo-frontend-conta` aos atributos e regras de cartão.
- A spec cobre apenas o que vive em `apps/web/src/modules/cartao`: cliente de API do módulo, schema de formulário, hooks de dados, componentes de apresentação, páginas (composição) e as rotas do grupo privado.
- A spec descreve **passos detalhados** de construção (o que criar e por quê), em nível de responsabilidade e contrato — sem reproduzir o código linha a linha.
- Adapta os dados para o domínio de Cartão: `name` (obrigatório), `description?`, `limit?`, `closingDay?`, `dueDay?`, `flag?`, `lastDigits?`, `active?` (default `true`), `color?` e `icon?` — espelhando as props do agregado de Cartão; preserva formulário agnóstico de operação, schema reusando os Value Objects do domínio (inclusive os numéricos `NonNegative`/`DayOfMonth`), fluxos de lista paginada/criação/edição/exclusão, cancelamento com `AbortController` e tradução de erros via i18n.
- **Dependência de ordem**: esta spec só será executada **após** a conclusão das camadas de negócio (`spec-modulo-negocio-cartao`) e backend (`spec-modulo-backend-cartao`), pois o frontend consome `@arquitetura/cartao` e o endpoint HTTP exposto pelo backend.
- Explicitamente **fora de escopo**: a camada de negócio (`@arquitetura/cartao`), o backend e a infraestrutura compartilhada do web (`@/shared/*`, api-client, componentes de UI, i18n). A spec referencia essas fronteiras mas não as especifica.

## Capabilities

### New Capabilities
- `modulo-frontend-cartao`: Especificação reaproveitável da camada de frontend do cadastro de Cartão — módulo organizado em `data`/`components`/`pages`, cliente de API sobre o `apiRequest` compartilhado, schema de formulário reusando os Value Objects do domínio (textuais via `Text` e numéricos via `NonNegative`/`DayOfMonth`), hooks que concentram estado/transporte (lista paginada, registro único, formulário create/edit, exclusão), componentes de apresentação para os estados de loading/erro/vazio/dados e páginas que compõem a UI e detêm a navegação.

### Modified Capabilities
<!-- Nenhuma. Negócio e backend têm specs próprias e não mudam aqui. -->

## Impact

- Novo artefato de especificação em `openspec/changes/spec-modulo-frontend-cartao/specs/modulo-frontend-cartao/spec.md`.
- Nenhuma alteração de código de produção nesta mudança — é um trabalho de especificação que guiará a implementação posterior em `apps/web/src/modules/cartao` (hoje apenas scaffold com dashboard).
- Fonte de verdade do padrão: `apps/web/src/modules/contas` (referência já implementada) e a spec arquivada `spec-modulo-frontend-conta`.
- Contratos consumidos (somente como fronteira): `@arquitetura/cartao` (`CartaoDTO`, `SalvarCartaoIn`, Value Objects `NomeCartao`/`DescricaoCartao`/`BandeiraCartao`/`UltimosDigitosCartao`/`IconeCartao`) e `@arquitetura/shared` (`PaginatedInputDTO/ResultDTO`, `PaginationMetaDTO`, `HexColor`, `NonNegative`, `DayOfMonth`); infraestrutura web compartilhada (`apiRequest`/`ApiError`, validator `v`, `getErrorMessage`, componentes de UI).
- Skills do projeto usadas como base do "como": **frontend-form-schema** e **config-shared-frontend**.

## Why

A camada de **frontend** do cadastro de Conta (`apps/web/src/modules/contas`) já está implementada e funcional, mas o conhecimento de **como** ela foi construída (organização em `data`/`components`/`pages`, separação transporte/estado/UI, formulário agnóstico de operação, fluxos de listagem/criação/edição/exclusão) está implícito no código. Precisamos de uma especificação escrita "à mão", no nível de um dev experiente, que descreva essa camada de forma reaproveitável — para servir de molde ao construir o frontend dos próximos cadastros.

## What Changes

- Criar uma especificação da **camada de frontend** do cadastro de Conta, obtida por engenharia reversa do código atual.
- A spec cobre apenas o que vive em `apps/web/src/modules/contas`: cliente de API do módulo, schema de formulário, hooks de dados, componentes de apresentação, páginas (composição) e as rotas do grupo privado.
- A spec descreve **passos detalhados** de construção (o que criar e por quê), em nível de responsabilidade e contrato — sem reproduzir o código linha a linha.
- Explicitamente **fora de escopo**: a camada de negócio (`@arquitetura/contas`), o backend e a infraestrutura compartilhada do web (`@/shared/*`, api-client, componentes de UI, i18n). A spec referencia essas fronteiras mas não as especifica.

## Capabilities

### New Capabilities
- `modulo-frontend-conta`: Especificação reaproveitável da camada de frontend de um cadastro (modelada sobre Conta) — módulo organizado em `data`/`components`/`pages`, cliente de API sobre o `apiRequest` compartilhado, schema de formulário reusando os Value Objects do domínio, hooks que concentram estado/transporte (lista paginada, registro único, formulário create/edit, exclusão), componentes de apresentação para os estados de loading/erro/vazio/dados e páginas que compõem a UI e detêm a navegação.

### Modified Capabilities
<!-- Nenhuma. Backend e negócio têm specs próprias e não mudam aqui. -->

## Impact

- Novo artefato de especificação em `openspec/changes/spec-modulo-frontend-conta/specs/modulo-frontend-conta/spec.md`.
- Nenhuma alteração de código de produção — é um trabalho de documentação/engenharia reversa.
- Fonte de verdade da engenharia reversa: `apps/web/src/modules/contas` e a seção "Frontend" de `.docs/sequencia.md`.
- Contratos consumidos (somente como fronteira): `@arquitetura/contas` (`ContaDTO`, `SalvarContaIn`, Value Objects) e `@arquitetura/shared` (`PaginatedInputDTO/ResultDTO`, `PaginationMetaDTO`, `HexColor`); infraestrutura web compartilhada (`apiRequest`/`ApiError`, validator `v`, `getErrorMessage`, componentes de UI).
- Skills do projeto usadas como base do "como": **frontend-form-schema** e **config-shared-frontend**.

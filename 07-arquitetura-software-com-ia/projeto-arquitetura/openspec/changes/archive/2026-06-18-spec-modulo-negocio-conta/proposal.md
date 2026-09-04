## Why

O módulo de negócio de Contas (`modules/contas/src/conta`) já está implementado e funcional, mas o conhecimento de **como** ele foi construído (decisões de modelagem, regras das entidades/objetos de valor, contratos dos casos de uso) está implícito no código. Precisamos de uma especificação escrita "à mão", no nível de um dev experiente, que descreva esse núcleo de negócio de forma reaproveitável — para servir de referência ao construir os próximos cadastros do projeto.

## What Changes

- Criar uma especificação da **camada de negócio** do cadastro de Conta, obtida por engenharia reversa do código atual.
- A spec cobre apenas o núcleo de domínio em `modules/contas/src/conta`: agregado/entidade, objetos de valor, DTO, contratos de provider (repository + queries) e casos de uso (salvar e excluir).
- A spec descreve **passos detalhados** de construção (o que criar e por quê), mas sem entrar em detalhes de implementação linha a linha — fica no nível de contrato e regra de negócio.
- Explicitamente **fora de escopo**: backend (Prisma/API), frontend e configuração de módulo. A spec referencia esses limites mas não os especifica.

## Capabilities

### New Capabilities
- `modulo-negocio-conta`: Especificação reaproveitável da camada de negócio de um cadastro (modelada sobre Conta) — entidade no padrão `create`/`tryCreate`, objetos de valor baseados em `Text`, DTO espelhando as props, contratos de persistência/consulta e casos de uso de salvar e excluir.

### Modified Capabilities
<!-- Nenhuma. Não há specs existentes; este é o primeiro spec do projeto. -->

## Impact

- Novo artefato de especificação em `openspec/changes/spec-modulo-negocio-conta/specs/modulo-negocio-conta/spec.md`.
- Nenhuma alteração de código de produção — é um trabalho de documentação/engenharia reversa.
- Fonte de verdade da engenharia reversa: `modules/contas/src/conta` e a seção "Negócio" de `.docs/sequencia.md`.
- Primitivos compartilhados referenciados (somente como contrato): `Entity`, `Result`, `Text`, `optional`, `Id`, `HexColor`, `CrudRepository`, `UseCase`, `PaginatedInputDTO/ResultDTO` de `@arquitetura/shared`.

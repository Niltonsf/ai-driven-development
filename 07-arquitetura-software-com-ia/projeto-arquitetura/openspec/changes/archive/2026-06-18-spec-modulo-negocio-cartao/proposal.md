## Why

O cadastro de Conta já tem sua camada de negócio especificada (`modulo-negocio-conta`) e serve de molde para os próximos cadastros do projeto. O próximo cadastro a ganhar núcleo de domínio é o de **Cartão** (`modules/cartao`), hoje apenas com scaffold. Precisamos de uma especificação escrita "à mão", no nível de um dev experiente, que descreva o núcleo de negócio do cadastro de Cartão de forma reaproveitável — aplicando o mesmo padrão da spec de Conta, mas com as regras e atributos próprios de um cartão.

## What Changes

- Criar uma especificação da **camada de negócio** do cadastro de Cartão, modelada sobre o padrão validado em `modulo-negocio-conta`.
- A spec cobre apenas o núcleo de domínio em `modules/cartao/src/cartao`: agregado/entidade, objetos de valor, DTO, contratos de provider (repository + queries) e casos de uso (salvar e excluir).
- A spec descreve **passos detalhados** de construção (o que criar e por quê), no nível de contrato e regra de negócio — sem implementação linha a linha.
- Adapta os atributos para o domínio de cartão: nome, descrição, limite, dia de fechamento, dia de vencimento, bandeira, últimos dígitos, situação (ativo), cor e ícone — reutilizando VOs compartilhados (`HexColor`, `DayOfMonth`, `NonNegative`).
- Explicitamente **fora de escopo**: backend (Prisma/API), frontend e configuração de módulo. A spec referencia esses limites mas não os especifica.

## Capabilities

### New Capabilities
- `modulo-negocio-cartao`: Especificação reaproveitável da camada de negócio do cadastro de Cartão — entidade no padrão `create`/`tryCreate`, objetos de valor textuais baseados em `Text`, atributos numéricos via VOs compartilhados (`DayOfMonth`, `NonNegative`), DTO espelhando as props, contratos de persistência/consulta e casos de uso de salvar e excluir.

### Modified Capabilities
<!-- Nenhuma. A capability de Conta (modulo-negocio-conta) permanece como referência e não é alterada. -->

## Impact

- Novo artefato de especificação em `openspec/changes/spec-modulo-negocio-cartao/specs/modulo-negocio-cartao/spec.md`.
- Nenhuma alteração de código de produção — é trabalho de documentação/especificação que guiará a implementação posterior em `modules/cartao`.
- Referência de padrão: a capability `modulo-negocio-conta` (arquivada em `openspec/changes/archive/2026-06-18-spec-modulo-negocio-conta`) e o código de `modules/contas/src/conta`.
- Primitivos compartilhados referenciados (somente como contrato): `Entity`, `Result`, `Text`, `optional`, `Id`, `HexColor`, `DayOfMonth`, `NonNegative`, `CrudRepository`, `UseCase`, `PaginatedInputDTO/ResultDTO` de `@arquitetura/shared`.

## Why

A camada de **negócio** do cadastro de Cartão está sendo especificada em `spec-modulo-negocio-cartao` e, uma vez implementada em `modules/cartao`, exporá a entidade, o DTO, os contratos de repository/query e os casos de uso por `@arquitetura/cartao`. Falta a especificação da **camada de backend** desse cadastro — como `apps/backend/src/modules/cartao` conecta esse núcleo de negócio ao banco (Prisma) e ao HTTP. Precisamos de uma spec escrita "à mão", no nível de um dev experiente, modelada sobre a camada de backend de Conta (`spec-modulo-backend-conta`, já validada), para servir de molde ao plugar o cadastro de Cartão no backend.

## What Changes

- Criar uma especificação da **camada de backend** do cadastro de Cartão, aplicando o padrão validado em `modulo-backend-conta` aos atributos e regras de cartão.
- A spec cobre apenas o que vive em `apps/backend`: modelo Prisma + migração, seed, adapter de persistência/consulta (`cartao.prisma.ts`), controller HTTP, módulo Nest e testes de integração (REST Client `.http`).
- A spec descreve **passos detalhados** de construção (o que criar e por quê), em nível de contrato e responsabilidade — sem reproduzir o código linha a linha.
- Adapta os dados para o domínio de cartão: `name`, `description`, `limit`, `closingDay`, `dueDay`, `brand`, `lastDigits`, `active`, `color`, `icon` — espelhando as props do agregado de Cartão; preserva soft delete, unicidade de nome, CQRS de leitura, mapeamento `fromDomain`/`toDomain`/`toDTO` e tradução de `Result` em status HTTP.
- **Dependência de ordem**: esta spec só será executada **após** a conclusão da camada de negócio (`spec-modulo-negocio-cartao`), pois o backend consome `@arquitetura/cartao`.
- Explicitamente **fora de escopo**: a camada de negócio (`modules/cartao/src/cartao`, coberta por `spec-modulo-negocio-cartao`), o frontend e o setup base do projeto/Prisma. A spec referencia essas fronteiras mas não as especifica.

## Capabilities

### New Capabilities
- `modulo-backend-cartao`: Especificação reaproveitável da camada de backend do cadastro de Cartão — modelo Prisma com soft delete e unicidade de nome, seed idempotente, adapter que implementa o `CartaoRepository` e as queries CQRS com mapeamento `toDomain`/`fromDomain`/`toDTO`, controller HTTP traduzindo `Result` em status code, módulo Nest e testes de integração `.http`.

### Modified Capabilities
<!-- Nenhuma. A camada de negócio é coberta por spec-modulo-negocio-cartao e não muda aqui. -->

## Impact

- Novo artefato de especificação em `openspec/changes/spec-modulo-backend-cartao/specs/modulo-backend-cartao/spec.md`.
- Nenhuma alteração de código de produção nesta mudança — é um trabalho de especificação que guiará a implementação posterior em `apps/backend/src/modules/cartao` (hoje apenas scaffold).
- Padrão de referência: a capability `modulo-backend-conta` (arquivada em `openspec/changes/archive/2026-06-18-spec-modulo-backend-conta`) e o código de `apps/backend/src/modules/contas` + `apps/backend/prisma`.
- Contratos consumidos (somente como fronteira): `@arquitetura/cartao` (`Cartao`, `CartaoDTO`, casos de uso de salvar/excluir, contratos de repository/query) e `@arquitetura/shared` (`Result`, `PaginatedInputDTO/ResultDTO`, `TransactionContext`).
- Skills do projeto usadas como base do "como": **backend-prisma-data**, **backend-controller** e **config-prisma**.

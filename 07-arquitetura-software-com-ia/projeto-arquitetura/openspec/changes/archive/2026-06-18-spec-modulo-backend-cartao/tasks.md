> Pré-requisito: a camada de negócio de Cartão (`spec-modulo-negocio-cartao`) deve estar concluída e publicada em `@arquitetura/cartao` antes de iniciar estas tarefas — o backend apenas consome esses contratos. Cada tarefa deve ser executada usando a skill indicada em `.claude/skills`, que descreve em detalhe o padrão do projeto. A spec define o **quê** (contratos da camada de backend de Cartão); a skill define o **como**.

## 1. Persistência (Prisma)

- [x] 1.1 Criar o modelo Prisma `Cartao` em `apps/backend/prisma/models/cartao.model.prisma` com a skill **backend-prisma-data**, aplicando os campos/tipos da spec (`name`, `description`, `brand`, `lastDigits`, `color`, `icon` textuais; `limit`, `closingDay`, `dueDay` numéricos; `active` default `true`), `name` único, soft delete (`deletedAt`) e `@map`/`@@map("cartao")`
- [x] 1.2 Gerar a migração e regenerar o client com a skill **config-prisma**

## 2. Seed

- [x] 2.1 Criar a seed do módulo a partir de `seed/data/cartao.json`, idempotente e plugada no entrypoint técnico de seed, com a skill **config-prisma** (apoiando-se em **backend-prisma-data** para o payload Prisma, com valores numéricos para `limit`/`closingDay`/`dueDay`)

## 3. Adapter de dados (`cartao.prisma.ts`)

- [x] 3.1 Implementar o `CartaoRepository` (`create`/`update`/`findById`/`delete`, suporte a `TransactionContext`, `ENTITY_NOT_FOUND`) e os mapeamentos `fromDomain`/`toDomain`/`toDTO` com a skill **backend-prisma-data**
- [x] 3.2 Implementar as queries CQRS de listagem paginada (filtro `deletedAt = null` + metadados) e de nome em uso (`ignoreId`) com a skill **backend-prisma-data**

## 4. Controller HTTP (`cartao.controller.ts`)

- [x] 4.1 Substituir o controller de scaffold pelo `CartaoController` (rota `cartao`) com a skill **backend-controller**: comandos `salvar` (POST 200) e `excluir` (DELETE 204), queries `consultarPorId` e `consultarPaginado`, normalização de paginação e tradução de `Result` em 404/400; endpoints `@Public()` por ora

## 5. Wiring do módulo

- [x] 5.1 Ajustar o `CartaoModule` (importa `DbModule`, declara controller/provider, exporta `CartaoPrisma`) e confirmar o reexport no `index.ts`, seguindo o padrão indicado por **backend-controller**/**backend-prisma-data**

## 6. Testes de integração

- [x] 6.1 Criar `cartao.integration.http` (REST Client) cobrindo paginação/normalização, 404 por id inexistente, validações de criação e o fluxo CRUD re-executável (criar → consultar → nome duplicado → atualizar → excluir → excluir novamente)

## 7. Verificação

- [x] 7.1 Conferir que cada cenário da spec é satisfeito (soft delete na leitura, unicidade de nome, status HTTP corretos, paginação normalizada, campos numéricos persistidos corretamente)
- [x] 7.2 Conferir que o backend só consome `@arquitetura/cartao` e `@arquitetura/shared` e que o Prisma fica isolado dentro do adapter

> Cada tarefa deve ser executada usando a skill indicada em `.claude/skills`, que descreve em detalhe o padrão do projeto. A spec define o **quê** (contratos da camada de backend de Conta); a skill define o **como**. A camada de negócio (`@arquitetura/contas`) já existe e é apenas consumida.

## 1. Persistência (Prisma)

- [ ] 1.1 Criar o modelo Prisma `Conta` em `apps/backend/prisma/models/contas.model.prisma` com a skill **backend-prisma-data**, aplicando os campos/limites da spec, `name` único, soft delete (`deletedAt`) e `@map`/`@@map("contas")`
- [ ] 1.2 Gerar a migração e regenerar o client com a skill **config-prisma**

## 2. Seed

- [ ] 2.1 Criar a seed do módulo a partir de `seed/data/contas.json`, idempotente e plugada no entrypoint técnico de seed, com a skill **config-prisma** (apoiando-se em **backend-prisma-data** para o payload Prisma)

## 3. Adapter de dados (`contas.prisma.ts`)

- [ ] 3.1 Implementar o `ContaRepository` (`create`/`update`/`findById`/`delete`, suporte a `TransactionContext`, `ENTITY_NOT_FOUND`) e os mapeamentos `fromDomain`/`toDomain`/`toDTO` com a skill **backend-prisma-data**
- [ ] 3.2 Implementar as queries CQRS `contasPaginadasQuery` (filtro `deletedAt = null` + metadados) e `nomeContaEmUsoQuery` (`ignoreId`) com a skill **backend-prisma-data**

## 4. Controller HTTP (`contas.controller.ts`)

- [ ] 4.1 Criar o `ContasController` (rota `contas`) com a skill **backend-controller**: comandos `salvar` (POST 200) e `excluir` (DELETE 204), queries `consultarPorId` e `consultarPaginado`, normalização de paginação e tradução de `Result` em 404/400; endpoints `@Public()` por ora

## 5. Wiring do módulo

- [ ] 5.1 Criar o `ContasModule` (importa `DbModule`, declara controller/provider, exporta `ContasPrisma`) e reexportar no `index.ts`, seguindo o padrão indicado por **backend-controller**/**backend-prisma-data**

## 6. Testes de integração

- [ ] 6.1 Criar `contas.integration.http` (REST Client) cobrindo paginação/normalização, 404 por id inexistente, validações de criação e o fluxo CRUD re-executável (criar → consultar → nome duplicado → atualizar → excluir → excluir novamente)

## 7. Verificação

- [ ] 7.1 Conferir que cada cenário da spec é satisfeito (soft delete na leitura, unicidade de nome, status HTTP corretos, paginação normalizada)
- [ ] 7.2 Conferir que o backend só consome `@arquitetura/contas` e `@arquitetura/shared` e que o Prisma fica isolado dentro do adapter

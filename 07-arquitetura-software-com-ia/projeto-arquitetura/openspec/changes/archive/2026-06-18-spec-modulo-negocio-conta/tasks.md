> Cada tarefa deve ser executada usando a skill indicada em `.claude/skills`, que descreve em detalhe o padrão do projeto. A spec define o **quê** (regras e contratos de Conta); a skill define o **como**.

## 1. Estrutura do agregado

- [ ] 1.1 Gerar o scaffold do agregado `conta` em `modules/contas` (pastas `model`/`dto`/`provider`/`use-case` + `index.ts`) usando a skill **module-aggregate**

## 2. Objetos de valor (model)

- [ ] 2.1 Criar os VOs de Conta com a skill **module-value-object**, aplicando os limites/erros da spec: `NomeConta` (3–80), `DescricaoConta` (8–256), `NumeroConta` (1–30), `AgenciaConta` (1–20), `InstituicaoConta` (2–120), `IconeConta` (1–60); cor reutiliza `HexColor`

## 3. Entidade Conta (model)

- [ ] 3.1 Criar a entidade `Conta` com a skill **module-entity**: props da spec, padrão `create`/`tryCreate`, default `active = true` e comportamentos `activate()`/`deactivate()`

## 4. DTO (dto)

- [ ] 4.1 Criar `ContaDTO` (espelho de `ContaProps`) com a skill **module-dto**

## 5. Contratos de provider (provider)

- [ ] 5.1 Criar o contrato `ContaRepository` (CRUD) com a skill **module-repository**
- [ ] 5.2 Criar as queries `ContasPaginadasQuery` e `NomeContaEmUsoQuery` com a skill **module-query-cqrs**

## 6. Casos de uso (use-case)

- [ ] 6.1 Criar `SalvarContaUseCase` (criação/atualização unificadas + unicidade de nome) com a skill **module-use-case**
- [ ] 6.2 Criar `ExcluirContaUseCase` (validação de não encontrado) com a skill **module-use-case**

## 7. Verificação

- [ ] 7.1 Conferir que cada cenário da spec é satisfeito (limites dos VOs, default `active`, unicidade de nome, `CONTA_NOT_FOUND`)
- [ ] 7.2 Conferir que a camada importa apenas de `@arquitetura/shared` e do próprio agregado (sem Prisma/Nest/React)

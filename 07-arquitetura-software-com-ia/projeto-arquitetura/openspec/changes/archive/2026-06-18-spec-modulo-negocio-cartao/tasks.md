> Cada tarefa deve ser executada usando a skill indicada em `.claude/skills`, que descreve em detalhe o padrão do projeto. A spec define o **quê** (regras e contratos de Cartão); a skill define o **como**.

## 1. Estrutura do agregado

- [x] 1.1 Gerar o scaffold do agregado `cartao` em `modules/cartao` (pastas `model`/`dto`/`provider`/`use-case` + `index.ts`) usando a skill **module-aggregate**

## 2. Objetos de valor (model)

- [x] 2.1 Criar os VOs textuais de Cartão com a skill **module-value-object**, aplicando os limites/erros da spec: `NomeCartao` (3–80), `DescricaoCartao` (8–256), `BandeiraCartao` (2–40), `UltimosDigitosCartao` (1–4), `IconeCartao` (1–60); cor reutiliza `HexColor`
- [x] 2.2 Confirmar o reuso dos VOs numéricos compartilhados de `@arquitetura/shared`: `DayOfMonth` para `closingDay`/`dueDay` (1–31) e `NonNegative` para `limit` (sem criar VOs próprios)

## 3. Entidade Cartão (model)

- [x] 3.1 Criar a entidade `Cartao` com a skill **module-entity**: props da spec (`name`, `description?`, `limit?`, `closingDay?`, `dueDay?`, `flag?`, `lastDigits?`, `active?`, `color?`, `icon?`), padrão `create`/`tryCreate`, validação dos opcionais via `optional` (incluindo `DayOfMonth`/`NonNegative`), default `active = true` e comportamentos `activate()`/`deactivate()`

## 4. DTO (dto)

- [x] 4.1 Criar `CartaoDTO` (espelho de `CartaoProps`) com a skill **module-dto**

## 5. Contratos de provider (provider)

- [x] 5.1 Criar o contrato `CartaoRepository` (CRUD) com a skill **module-repository**
- [x] 5.2 Criar as queries `CartoesPaginadosQuery` e `NomeCartaoEmUsoQuery` com a skill **module-query-cqrs**

## 6. Casos de uso (use-case)

- [x] 6.1 Criar `SalvarCartaoUseCase` (criação/atualização unificadas + unicidade de nome, `CARTAO_NAME_ALREADY_IN_USE`) com a skill **module-use-case**
- [x] 6.2 Criar `ExcluirCartaoUseCase` (validação de não encontrado, `CARTAO_NOT_FOUND`) com a skill **module-use-case**

## 7. Verificação

- [x] 7.1 Conferir que cada cenário da spec é satisfeito (limites dos VOs textuais, faixas de `DayOfMonth`/`NonNegative`, default `active`, unicidade de nome, `CARTAO_NOT_FOUND`)
- [x] 7.2 Conferir que a camada importa apenas de `@arquitetura/shared` e do próprio agregado (sem Prisma/Nest/React)

## Context

A camada de backend do cadastro de Conta já existe e está concluída na seção "Backend" de `.docs/sequencia.md`: modelo Prisma, migração, seed, adapter `contas.prisma.ts`, controller HTTP e testes `.http`. Esta mudança não escreve código novo — faz engenharia reversa dessa camada para produzir uma especificação reaproveitável, que será o molde ao plugar os próximos cadastros no backend.

A camada de negócio (`modules/contas/src/conta`) já tem sua própria spec (`spec-modulo-negocio-conta`) e é tratada aqui apenas como fronteira: o backend **consome** `@arquitetura/contas` (entidade, DTO, casos de uso, contratos de repository/query) e **não** redefine regras de domínio.

Restrição central: a spec deve soar como escrita à mão por um dev experiente — passos em nível de contrato e responsabilidade, sem reproduzir o código linha a linha. As tarefas devem se apoiar nas skills do projeto (**backend-prisma-data**, **backend-controller**, **config-prisma**), que descrevem o "como".

## Goals / Non-Goals

**Goals:**
- Capturar o padrão da camada de backend (Prisma model/migração/seed, adapter de persistência+queries, controller, módulo Nest, testes `.http`) como molde para outros cadastros.
- Preservar fielmente as decisões de Conta: soft delete, unicidade de nome, separação comando/query (CQRS de leitura), mapeamento `fromDomain`/`toDomain`/`toDTO`, tradução de `Result` em status HTTP e normalização de paginação.
- Deixar explícita a fronteira com o domínio (consome `@arquitetura/contas` e `@arquitetura/shared`) e o isolamento do Prisma dentro do adapter.

**Non-Goals:**
- Especificar a camada de negócio, o frontend ou o setup base do monorepo/Prisma.
- Prescrever assinaturas exatas de métodos das libs compartilhadas.
- Definir autenticação/permissões do módulo — os endpoints estão `@Public()` como estado temporário e a spec apenas registra esse fato.

## Decisions

- **Uma capability (`modulo-backend-conta`), ancorada em Conta.** Os valores concretos (campos, max de página, códigos de erro) entram como dados na spec. Generalizar para um `modulo-backend-base` abstrato fica adiado até existir um segundo cadastro que valide o que é realmente comum.
- **Adapter único concentra repository + queries.** O `ContasPrisma` implementa o `ContaRepository` (comandos) e expõe as queries CQRS (`contasPaginadasQuery`, `nomeContaEmUsoQuery`) como objetos `execute`. Decisão registrada porque é o ponto onde Prisma é isolado do domínio; alternativa descartada: classes separadas por query — overhead sem ganho neste tamanho.
- **Controller traduz `Result`, não regra.** O controller normaliza paginação e mapeia falha→HTTP (`NOT_FOUND/EMPTY` → 404, demais → 400). Mantém o domínio agnóstico de HTTP. Segue a skill **backend-controller**.
- **Soft delete na leitura.** A listagem filtra `deletedAt = null`; a spec registra isso como requisito de leitura para que outros cadastros repliquem o comportamento.
- **Testes via REST Client (`.http`).** Execução manual, fluxo CRUD re-executável (o DELETE limpa o registro). Registrado como o padrão de teste de integração do backend neste projeto.

## Risks / Trade-offs

- [Spec ancorada em Conta copiada literalmente para outro cadastro] → Os requisitos separam o padrão (texto normativo) dos dados de Conta (campos/códigos); ao reutilizar, troca-se apenas os dados.
- [Engenharia reversa diverge do código se ele mudar] → A spec registra a fonte de verdade (`apps/backend/src/modules/contas` e `apps/backend/prisma`) para reconciliação futura.
- [Endpoints públicos por ora] → Documentado como temporário; quando entrar auth, a skill **backend-controller** cobre `@UseGuards`/`@RequirePermission` e a spec deve ser revisada.

## Migration Plan

Não se aplica — artefato de documentação, sem deploy nem rollback. O "rollback" é descartar o diretório da mudança.

## Open Questions

- Quando surgir o segundo cadastro no backend, vale extrair um `modulo-backend-base` com o padrão comum (adapter, controller, paginação, soft delete) e deixar specs por cadastro só com os dados específicos? Decidir após o primeiro reuso real.

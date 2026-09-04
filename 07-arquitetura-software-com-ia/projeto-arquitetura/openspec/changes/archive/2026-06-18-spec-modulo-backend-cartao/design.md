## Context

A camada de backend do cadastro de Conta já existe e está especificada (`modulo-backend-conta`): modelo Prisma, migração, seed, adapter `contas.prisma.ts`, controller HTTP e testes `.http`. O cadastro de Cartão (`apps/backend/src/modules/cartao`) hoje é só scaffold (controller de exemplo, adapter vazio, módulo). Esta mudança não escreve código de produção — produz a especificação reaproveitável da camada de backend de Cartão, aplicando o padrão de Conta aos atributos e regras de cartão, para guiar a implementação posterior.

A camada de negócio de Cartão é tratada aqui apenas como fronteira: o backend **consumirá** `@arquitetura/cartao` (entidade, DTO, casos de uso, contratos de repository/query) e **não** redefine regras de domínio. Por isso há uma **dependência de ordem**: esta spec só será executada após a conclusão de `spec-modulo-negocio-cartao`, que é quem cria esses contratos.

Restrição central, herdada da spec de referência: a spec deve soar como escrita à mão por um dev experiente — passos em nível de contrato e responsabilidade, sem reproduzir o código linha a linha. As tarefas devem se apoiar nas skills do projeto (**backend-prisma-data**, **backend-controller**, **config-prisma**), que descrevem o "como".

## Goals / Non-Goals

**Goals:**
- Aplicar o padrão da camada de backend (Prisma model/migração/seed, adapter de persistência+queries, controller, módulo Nest, testes `.http`) já validado em Conta ao cadastro de Cartão.
- Preservar fielmente as decisões do padrão: soft delete, unicidade de nome, separação comando/query (CQRS de leitura), mapeamento `fromDomain`/`toDomain`/`toDTO`, tradução de `Result` em status HTTP e normalização de paginação.
- Adaptar os **dados** para cartão: campos `name`, `description`, `limit`, `closingDay`, `dueDay`, `brand`, `lastDigits`, `active`, `color`, `icon`; rota `cartao`; tabela `cartao`; queries `cartoesPaginadasQuery` e `nomeCartaoEmUsoQuery` (nomes finais conforme o domínio expor).
- Deixar explícita a fronteira com o domínio (consome `@arquitetura/cartao` e `@arquitetura/shared`) e o isolamento do Prisma dentro do adapter.

**Non-Goals:**
- Especificar a camada de negócio, o frontend ou o setup base do monorepo/Prisma.
- Prescrever assinaturas exatas de métodos das libs compartilhadas ou os nomes/códigos internos dos VOs de cartão (vêm do domínio).
- Definir autenticação/permissões do módulo — os endpoints ficam `@Public()` como estado temporário e a spec apenas registra esse fato.

## Decisions

- **Uma capability (`modulo-backend-cartao`), ancorada em Cartão.** Os valores concretos (campos, max de página, códigos de erro) entram como dados na spec. A extração de um `modulo-backend-base` abstrato segue adiada (Open Question da spec de Conta) até haver evidência do que é realmente comum entre os dois cadastros.
- **Adapter único concentra repository + queries.** O `CartaoPrisma` implementa o `CartaoRepository` (comandos) e expõe as queries CQRS (`cartoesPaginadasQuery`, `nomeCartaoEmUsoQuery`) como objetos `execute`. Decisão registrada porque é o ponto onde Prisma é isolado do domínio; alternativa descartada: classes separadas por query — overhead sem ganho neste tamanho.
- **Atributos numéricos no banco.** `limit`, `closingDay` e `dueDay` são persistidos como numéricos (não texto), mantendo coerência com os VOs de domínio (`NonNegative`, `DayOfMonth`); o mapeamento `toDomain` os repassa para `Cartao.tryCreate`, que revalida. Diferença concreta em relação a Conta, que não tem campos numéricos.
- **Controller traduz `Result`, não regra.** O controller normaliza paginação e mapeia falha→HTTP (`NOT_FOUND/EMPTY` → 404, demais → 400). Mantém o domínio agnóstico de HTTP. Segue a skill **backend-controller**.
- **Soft delete na leitura.** A listagem filtra `deletedAt = null`; a spec registra isso como requisito de leitura para que o comportamento seja replicado.
- **Testes via REST Client (`.http`).** Execução manual, fluxo CRUD re-executável (o DELETE limpa o registro). Registrado como o padrão de teste de integração do backend neste projeto.

## Risks / Trade-offs

- [Spec ancorada em Cartão copiada literalmente de Conta pode esconder os campos numéricos] → Os requisitos separam o padrão (texto normativo) dos dados de Cartão (campos/tipos/códigos); a revisão deve conferir que `limit`/`closingDay`/`dueDay` são numéricos e opcionais.
- [Backend implementado antes da camada de negócio quebraria a compilação] → A dependência de ordem está registrada (proposal + design): esta spec só é executada após `spec-modulo-negocio-cartao` publicar `@arquitetura/cartao`.
- [Engenharia do padrão diverge do código de Conta se este mudar] → A spec registra a fonte do padrão (`modulo-backend-conta` e `apps/backend/src/modules/contas`) para reconciliação futura.
- [Endpoints públicos por ora] → Documentado como temporário; quando entrar auth, a skill **backend-controller** cobre `@UseGuards`/`@RequirePermission` e a spec deve ser revisada.

## Migration Plan

Não se aplica — artefato de documentação, sem deploy nem rollback. O "rollback" é descartar o diretório da mudança. A implementação posterior em `apps/backend/src/modules/cartao` seguirá as skills do projeto, com a spec como contrato, e depende de `@arquitetura/cartao` já publicado.

## Open Questions

- Com o segundo cadastro chegando ao backend, vale agora extrair um `modulo-backend-base` com o padrão comum (adapter, controller, paginação, soft delete), deixando as specs por cadastro só com os dados específicos? Reavaliar após implementar o backend de Cartão.

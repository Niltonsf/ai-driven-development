## Context

O cadastro de Cartão terá, antes desta mudança, suas camadas de negócio (`spec-modulo-negocio-cartao` → `@arquitetura/cartao`) e backend (`spec-modulo-backend-cartao` → `apps/backend/src/modules/cartao`) concluídas. Falta a camada de frontend: hoje `apps/web/src/modules/cartao` é apenas um scaffold (`data/`, `components/cartao-dashboard.component.tsx`, `pages/dashboard.page.tsx`, `index.ts`). Esta mudança não escreve código novo de produção — produz uma especificação reaproveitável da camada de frontend, modelada sobre a de Conta (`spec-modulo-frontend-conta`, arquivada) e sobre o código de referência já implementado em `apps/web/src/modules/contas`.

As camadas de negócio e backend são tratadas aqui apenas como fronteira: o frontend **consome** `@arquitetura/cartao` (`CartaoDTO`, `SalvarCartaoIn`, Value Objects) e `@arquitetura/shared` (contratos de paginação, `HexColor`, `NonNegative`, `DayOfMonth`), além da infraestrutura web compartilhada (`apiRequest`/`ApiError`, validator `v`, `getErrorMessage`, componentes de UI), sem redefini-los.

Restrição central: a spec deve soar como escrita à mão por um dev experiente — passos em nível de responsabilidade e contrato, sem reproduzir o código linha a linha. As tarefas devem se apoiar nas skills do projeto (**frontend-form-schema** para o form/schema, **config-shared-frontend** para estrutura compartilhada e rotas) e, onde não há skill dedicada, no padrão de módulo CRUD do web (`apps/web/src/modules/contas`).

## Goals / Non-Goals

**Goals:**
- Capturar o padrão de módulo frontend (separação `data`/`components`/`pages`, cliente sobre `apiRequest`, hooks que detêm estado/transporte, componentes apresentacionais, páginas que detêm navegação) aplicado ao cadastro de Cartão.
- Preservar fielmente as decisões já validadas em Conta: formulário agnóstico de operação (DTO opcional dirige create/edit), schema reusando os VOs do domínio como fonte única de regras, fluxos de lista paginada/criação/edição/exclusão, cancelamento com `AbortController` e tradução de erros via i18n.
- Adaptar aos atributos próprios de Cartão, em especial os **campos numéricos opcionais** (`limit` via `NonNegative`; `closingDay`/`dueDay` via `DayOfMonth`) — novidade em relação a Conta, que só tinha campos textuais + booleano.
- Deixar explícita a fronteira: consome domínio + infraestrutura compartilhada, sem duplicar tipos nem recriar transporte.

**Non-Goals:**
- Especificar a camada de negócio, o backend ou a infraestrutura compartilhada do web (api-client, componentes de UI, i18n, layout do grupo privado).
- Prescrever JSX/markup ou assinaturas exatas de hooks/utilitários compartilhados.
- Definir testes automatizados de UI.

## Decisions

- **Uma capability (`modulo-frontend-cartao`), ancorada em Cartão.** Os detalhes concretos (campos do form, operações do cliente, estados dos hooks) entram como dados na spec. Não se extrai um `modulo-frontend-base` abstrato agora; isso permanece como questão em aberto comum às specs de Conta e Cartão. **Alternativa considerada:** generalizar já um molde abstrato — adiada por ainda não haver sinal suficiente do que é realmente comum versus específico.
- **Formulário agnóstico de operação dirigido pelo DTO.** Um único `CartaoForm` + `useCartaoForm` + `salvarCartao` servem criação e edição: a presença do DTO/`id` decide defaults e payload. Evita forks create-vs-edit. Segue a skill **frontend-form-schema**.
- **Schema reusa os Value Objects do domínio, inclusive numéricos.** Mesmas regras do backend, sem duplicar limites/mensagens. Campos textuais usam os VOs `Text` (`NomeCartao`, `DescricaoCartao`, `BandeiraCartao`, `UltimosDigitosCartao`, `IconeCartao`); `color` usa `HexColor`; os numéricos opcionais usam `NonNegative` (`limit`) e `DayOfMonth` (`closingDay`, `dueDay`). O booleano `active` é adaptado ao contrato mínimo de VO para atravessar o resolver. **Alternativa considerada:** validar números com regras locais no schema — rejeitada por duplicar regra que já vive no domínio compartilhado.
- **Inputs numéricos controlados convertidos na fronteira do form.** Inputs HTML entregam string; o schema/helpers convertem string vazia em campo omitido e string numérica no número esperado pelos VOs, mantendo os inputs controlados (sem `undefined` no estado do RHF). Registrado por ser o ponto que mais diverge de Conta.
- **Hooks concentram estado e transporte; componentes são apresentacionais.** Cadeia única página → componente → hook ⇒ sem React Context. Consultas usam `AbortController`. Decisão registrada para que o cadastro não vaze `fetch` na UI nem introduza Context prematuro.
- **Navegação vive nas páginas, não no formulário/shared.** Páginas passam callbacks (`onSuccess`/`onCancel`); a página de edição só monta o form após carregar o cartão (RHF aplica `defaultValues` na montagem). Estrutura de rotas/grupo privado segue **config-shared-frontend**.

## Risks / Trade-offs

- [Spec ancorada em Cartão copiada literalmente para outro cadastro] → Os requisitos separam o padrão (texto normativo) dos dados de Cartão (campos/operações); ao reutilizar, troca-se apenas os dados.
- [Campos numéricos opcionais divergirem do contrato de VO numérico do domínio] → A spec fixa o reuso de `NonNegative`/`DayOfMonth` e a conversão string→número/omissão na fronteira do form, evitando regra duplicada e `NaN` no payload.
- [Skill `frontend-form-schema` cita `@namespace`/`apps/frontend`] → Neste projeto o validator é importado de `@/shared/components/form/validator` e o módulo vive em `apps/web/src/modules/cartao`; a spec/tarefas usam a skill pelo padrão (RHF + `v` + `v.infer`), não pelos paths literais.
- [Dependência de ordem com negócio/backend] → A spec declara explicitamente que só é executada após `spec-modulo-negocio-cartao` e `spec-modulo-backend-cartao`, pois consome `@arquitetura/cartao` e o endpoint HTTP.
- [Engenharia reversa do padrão diverge se o código de Conta mudar] → A spec registra a fonte de verdade (`apps/web/src/modules/contas`) para reconciliação futura.

## Migration Plan

Não se aplica — artefato de documentação, sem deploy nem rollback. O "rollback" é descartar o diretório da mudança. A implementação posterior em `apps/web/src/modules/cartao` ocorre quando negócio e backend de Cartão já estiverem prontos.

## Open Questions

- Após o frontend de Cartão (segundo cadastro real no web), vale extrair um `modulo-frontend-base` com o padrão comum (cliente, hooks de lista/registro/form/exclusão, componentes de estado, composição de páginas) e deixar specs por cadastro só com os dados específicos? Decidir após este reuso.
- Confirmar, na implementação, o nome do atributo de bandeira exposto por `@arquitetura/cartao` (`flag` na spec de negócio) e garantir que o schema/cliente do frontend usem exatamente o nome do DTO publicado.

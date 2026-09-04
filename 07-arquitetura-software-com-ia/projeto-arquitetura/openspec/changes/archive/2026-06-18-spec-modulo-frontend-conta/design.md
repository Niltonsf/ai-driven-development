## Context

A camada de frontend do cadastro de Conta já existe e está concluída na seção "Frontend" de `.docs/sequencia.md`: módulo `apps/web/src/modules/contas` com `data/`, `components/`, `pages/` e as rotas no grupo privado. Esta mudança não escreve código novo — faz engenharia reversa dessa camada para produzir uma especificação reaproveitável, que será o molde ao construir o frontend dos próximos cadastros.

As camadas de negócio (`spec-modulo-negocio-conta`) e backend (`spec-modulo-backend-conta`) já têm suas specs e são tratadas aqui apenas como fronteira: o frontend **consome** `@arquitetura/contas`/`@arquitetura/shared` (DTO, `SalvarContaIn`, Value Objects, contratos de paginação) e a infraestrutura web compartilhada (`apiRequest`/`ApiError`, validator `v`, `getErrorMessage`, componentes de UI), sem redefini-los.

Restrição central: a spec deve soar como escrita à mão por um dev experiente — passos em nível de responsabilidade e contrato, sem reproduzir o código linha a linha. As tarefas devem se apoiar nas skills do projeto (**frontend-form-schema** para o form/schema, **config-shared-frontend** para estrutura compartilhada e rotas).

## Goals / Non-Goals

**Goals:**
- Capturar o padrão de módulo frontend (separação `data`/`components`/`pages`, cliente sobre `apiRequest`, hooks que detêm estado/transporte, componentes apresentacionais, páginas que detêm navegação) como molde para outros cadastros.
- Preservar fielmente as decisões de Conta: formulário agnóstico de operação (DTO opcional dirige create/edit), schema reusando os VOs do domínio, fluxos de lista paginada/criação/edição/exclusão, cancelamento com `AbortController` e tradução de erros via i18n.
- Deixar explícita a fronteira: consome domínio + infraestrutura compartilhada, sem duplicar tipos nem recriar transporte.

**Non-Goals:**
- Especificar a camada de negócio, o backend ou a infraestrutura compartilhada do web (api-client, componentes de UI, i18n, layout do grupo privado).
- Prescrever JSX/markup ou assinaturas exatas de hooks/utilitários compartilhados.
- Definir testes automatizados de UI.

## Decisions

- **Uma capability (`modulo-frontend-conta`), ancorada em Conta.** Os detalhes concretos (campos do form, operações do cliente, estados dos hooks) entram como dados na spec. Generalizar para um `modulo-frontend-base` abstrato fica adiado até existir um segundo cadastro que valide o que é comum.
- **Formulário agnóstico de operação dirigido pelo DTO.** Um único `ContaForm` + `useContaForm` + `salvarConta` servem criação e edição: a presença do DTO/`id` decide defaults e payload. Evita forks create-vs-edit. Segue a skill **frontend-form-schema**.
- **Schema reusa os Value Objects do domínio.** Mesmas regras do backend, sem duplicar limites/mensagens. O booleano `active` é adaptado ao contrato mínimo de VO para atravessar o resolver. Registrado por ser o ponto mais fácil de divergir.
- **Hooks concentram estado e transporte; componentes são apresentacionais.** Cadeia única página → componente → hook ⇒ sem React Context. Consultas usam `AbortController`. Decisão registrada para que outros cadastros não vazem `fetch` na UI nem introduzam Context prematuro.
- **Navegação vive nas páginas, não no formulário/shared.** Páginas passam callbacks (`onSuccess`/`onCancel`); a página de edição só monta o form após carregar a conta (RHF aplica `defaultValues` na montagem). Estrutura de rotas/grupo privado segue **config-shared-frontend**.

## Risks / Trade-offs

- [Spec ancorada em Conta copiada literalmente para outro cadastro] → Os requisitos separam o padrão (texto normativo) dos dados de Conta (campos/operações); ao reutilizar, troca-se apenas os dados.
- [Skill `frontend-form-schema` cita `@namespace`/`apps/frontend`] → Neste projeto o validator é importado de `@/shared/components/form/validator` e o módulo vive em `apps/web`; a spec/tarefas usam a skill pelo padrão (RHF + `v` + `v.infer`), não pelos paths literais.
- [Engenharia reversa diverge do código se ele mudar] → A spec registra a fonte de verdade (`apps/web/src/modules/contas`) para reconciliação futura.

## Migration Plan

Não se aplica — artefato de documentação, sem deploy nem rollback. O "rollback" é descartar o diretório da mudança.

## Open Questions

- Quando surgir o segundo cadastro no frontend, vale extrair um `modulo-frontend-base` com o padrão comum (cliente, hooks de lista/registro/form/exclusão, componentes de estado, composição de páginas) e deixar specs por cadastro só com os dados específicos? Decidir após o primeiro reuso real.

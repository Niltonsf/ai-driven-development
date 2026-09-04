## Context

O cadastro de Conta já tem sua camada de negócio implementada em `modules/contas/src/conta` e marcada como concluída na seção "Negócio" de `.docs/sequencia.md`. Esta mudança não escreve código novo: ela faz engenharia reversa desse núcleo para produzir uma especificação reaproveitável. A spec resultante será a referência usada ao construir a camada de negócio dos próximos cadastros, então as decisões abaixo registram **quais padrões generalizar** e **quais detalhes manter específicos de Conta**.

Restrição central: a spec deve soar como escrita à mão por um dev experiente — passos detalhados em nível de contrato e regra, sem reproduzir o código linha a linha.

## Goals / Non-Goals

**Goals:**
- Capturar o padrão da camada de negócio (model, dto, provider, use-case) de forma que sirva de molde para outros cadastros.
- Preservar fielmente as regras de Conta: limites dos VOs, padrão `create`/`tryCreate`, default `active = true`, unicidade de nome, e os dois casos de uso (salvar e excluir).
- Deixar explícito o isolamento de dependências (só `@arquitetura/shared`).

**Non-Goals:**
- Especificar backend (Prisma/API), frontend ou configuração de módulo — apenas referenciados como fronteiras.
- Definir testes, seeds ou contratos HTTP.
- Prescrever assinaturas exatas de métodos de `@arquitetura/shared` (são contratos, não detalhes a copiar).

## Decisions

- **Uma única capability (`modulo-negocio-conta`), não uma genérica abstrata.** A spec é ancorada em Conta com valores concretos (limites, nomes). Generalizar cedo demais perderia as regras reais. Alternativa descartada: escrever um `modulo-negocio-base` abstrato — adiado para quando houver um segundo cadastro que valide o que é realmente comum.
- **Spec descreve contratos e regras, não implementação.** Cada requisito cita o quê (ex.: "validar opcionais com `optional`") e o porquê, sem reproduzir o corpo das funções. Mantém a spec legível e reaproveitável. Alternativa descartada: pseudo-código por método — vira duplicação frágil do código.
- **Os limites dos VOs e os códigos de erro entram como dados na spec.** São a parte mais específica e mais fácil de errar ao replicar; deixá-los implícitos quebraria o objetivo de reconstrução.
- **Casos de uso documentados pelo fluxo numerado + cenários WHEN/THEN.** O fluxo dá o passo a passo; os cenários tornam cada regra testável. Cobre criação/atualização unificadas e os caminhos de falha (nome em uso, não encontrado, inválido).

## Risks / Trade-offs

- [Spec ancorada em Conta pode ser copiada literalmente para outro cadastro] → Os requisitos separam o padrão (texto normativo) dos dados de Conta (listas de limites/códigos); ao reutilizar, troca-se apenas os dados.
- [Engenharia reversa pode divergir do código se ele mudar] → A spec registra a fonte de verdade (`modules/contas/src/conta`) para reconciliação futura; divergência deve ser tratada revisando a spec.
- [Risco de excesso de detalhe técnico contrariando o pedido] → Decisão explícita de manter nível de contrato; primitivos de `@arquitetura/shared` são citados por nome/papel, não detalhados.

## Migration Plan

Não se aplica — artefato de documentação, sem deploy nem rollback. O "rollback" é descartar o diretório da mudança.

## Open Questions

- Quando surgir o segundo cadastro, vale extrair um `modulo-negocio-base` com o padrão comum e deixar specs por cadastro só com os dados específicos? Decidir após o primeiro reuso real.

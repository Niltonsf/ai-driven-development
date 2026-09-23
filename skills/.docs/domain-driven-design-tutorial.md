# Domain-Driven Design — end-to-end

As 13 skills do pack, na ordem em que uma decisão puxa a outra.
Cada linha diz quando rodar aquela skill.

## Parte 1 — estratégico: onde ficam as fronteiras

1. **`ddd-subdomains`** — rode quando quero validar **se algo é core, supporting
   ou generic**. Tudo depois depende desta resposta.
2. **`ddd-ubiquitous-language`** — rode quando quero validar **se os nomes são
   os do negócio**, sem sinônimo e sem ambiguidade.
3. **`ddd-bounded-contexts`** — rode quando quero validar **onde um modelo
   termina e outro começa**, e de quem é o dono.
4. **`ddd-integration-patterns`** — rode quando quero validar **como dois
   contextos conversam**: qual dos seis padrões, e por quê.
5. **`ddd-eventstorming`** — rode quando **falta conhecimento do domínio**, não
   quando falta decisão. É descoberta, não desenho.

## Parte 2 — tático: como implementar dentro da fronteira

6. **`ddd-design-heuristics`** — **o roteador, rode primeiro.** Escolhe o padrão
   de lógica, a arquitetura e a estratégia de teste. Não decide fronteira.
7. **`ddd-simple-business-logic`** — rode quando o roteador apontou
   **transaction script ou active record**.
8. **`ddd-domain-model`** — rode quando quero validar **fronteira de agregado,
   raiz, value object e domain service**. É aqui que agregado se decide.
9. **`ddd-event-sourced-domain-model`** — rode quando o negócio exige
   **histórico auditável** ou rastreio de dinheiro. Caro; só quando pedir.
10. **`ddd-architectural-patterns`** — rode quando quero validar **layered,
    ports & adapters ou CQRS** para o padrão já escolhido.
11. **`ddd-communication-patterns`** — rode quando quero validar **outbox, saga
    ou process manager**, e como o evento atravessa a fronteira.

## Parte 3 — o sistema mudando

12. **`ddd-evolving-design-decisions`** — rode quando algo **mudou de tipo** ou
    quando preciso modernizar código legado (strangler).
13. **`ddd-microservice-boundaries`** — rode quando quero validar **o tamanho de
    um serviço**, nem grande demais nem pequeno demais.

## Os comandos

- **`/ddd-analyze`** — rode para a análise estratégica inteira: passos 1 a 4 de
  uma vez.
- **`/ddd-decide`** — rode para decidir **um componente só**, pela árvore tática.
- **`/ddd-audit`** — rode para passar o checklist num codebase ou num desenho.
- **`/ddd-review`** — o mesmo, limitado a um diff ou PR.
- **`/ddd-evolve`** — rode para planejar migração e modernização.
- **`/ddd-explain`** — rode para um termo só: uma página, um grau.
- **`/ddd-exercise`** — o teste de regressão do pack, contra o gabarito do livro.

## Quando ela para

- **Falta um fato do negócio** — HALT `REQUIRES_BUSINESS_INPUT`. A skill diz a
  quem perguntar. Isso é resultado, não erro.
- **Falta um fato do time** — HALT `REQUIRES_ORG_INPUT`. Idem.
- **O livro não cobre** — HALT `OUT_OF_SCOPE`. Sem palpite disfarçado de regra.

## O caminho curto

- **Feature nova num módulo que já existe** — 6 → a skill que ele apontar.
- **Módulo novo do zero** — 1 → 3 → 6, e segue o roteador.
- **Não sei onde dói** — `/ddd-analyze` e leia os HALTs: eles são a lista de
  perguntas para levar ao negócio.

## Duas armadilhas

- **Responder pelo roteador sozinho** — `ddd-design-heuristics` não decide
  agregado nem contexto. Já custou uma resposta errada aqui.
- **Auditoria não é event sourcing** — "guardar histórico" quase sempre é uma
  tabela append-only, não o agregado inteiro em eventos.

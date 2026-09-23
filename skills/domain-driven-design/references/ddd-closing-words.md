# DDD closing words

PDF pages 293-297. The book's own summary, one restated table, one figure, and
the further-reading list.

Two pages here matter to the pack: p.293, which restates Table 1-1 as Table E-1
and is **pack-shared**, and pp.295-297, which is the evidence that a topic was
deferred to another book rather than absent.

## The frame, p.293

- To provide a software solution, we first have to understand the problem: what is the business domain, what are the business goals, and what is the strategy for achieving them [DDD closing p.293] `RULE`
- The ubiquitous language is used to gain a deep understanding of the business domain and its logic [DDD closing p.293] `RULE`
- Manage the complexity of the business problem by breaking it apart into bounded contexts [DDD closing p.293] `RULE`
- Each bounded context implements a single model of the business domain, aimed at solving a specific problem [DDD closing p.293] `RULE`

## Table E-1, p.293 — pack-shared

The same 3x5 matrix as Table 1-1 on p.37, restated. Any skill may cite it.

| Subdomain type | Competitive advantage | Complexity | Volatility | Implementation | Problem | Citation |
|---|---|---|---|---|---|---|
| Core | Yes | High | High | In-house | Interesting | [DDD closing p.293] `RULE` |
| Generic | No | High | Low | Buy/adopt | Solved | [DDD closing p.293] `RULE` |
| Supporting | No | Low | Low | In-house/outsource | Obvious | [DDD closing p.293] `RULE` |
| anything else | — | — | — | — | — | HALT (`OUT_OF_SCOPE`) |

Two pages, one table, identical rows. A citation to either resolves.

## The solution summary, p.294

- Four business logic implementation patterns: transaction script, active record, domain model, and event sourced domain model [DDD closing p.294] `RULE`
- Three architectural patterns provide the required scaffolding for the implementation of business logic: layered architecture, ports & adapters, and CQRS [DDD closing p.294] `RULE`
- Figure E-1 summarizes the heuristics for tactical decision-making using these patterns [DDD closing p.294] `HEURISTIC`

Figure E-1 on p.294 is caption-only: the extractor returns its caption and
nothing else. It is the same tree as Figure 10-7 on p.192. Cite the prose of
pp.187-192 for the tree's content, never this page. See
`ddd-decision-artifacts.md`.

## The implementation summary, p.295

- Part III covered how to build a ubiquitous language by facilitating an EventStorming session, how to keep the design in shape as the business domain evolves, and how to start using domain-driven design in brownfield projects [DDD closing p.295] `RULE`
- Part IV discussed the interplay between domain-driven design and microservices, event-driven architecture, and data mesh, which complement each other [DDD closing p.295] `RULE`

## Further reading, pp.295-297 — the deferral evidence

The bibliography and this list are the only place the pack may point outside the
book, and only to say a topic was deferred, never to import a rule.

| Topic the book defers | Where it defers it | Citation |
|---|---|---|
| Advanced domain-driven design, and the original methodology | Evans, *Domain-Driven Design: Tackling Complexity in the Heart of Software* | [DDD closing p.295] `RULE` |
| In-depth discussion of the strategic and tactical toolset | Vernon, *Implementing Domain-Driven Design* | [DDD closing p.295] `RULE` |
| Evolving an event-sourced system, and versioning its events | Young, *Versioning in an Event Sourced System* | [DDD closing p.295] `RULE` |
| Knowledge sharing, documentation and testing | Martraire, *Living Documentation* | [DDD closing p.295] `RULE` |
| Implementing the data mesh architecture in practice | Dehghani, *Data Mesh* | [DDD closing p.296] `RULE` |
| The origin of transaction script, active record and domain model | Fowler, *Patterns of Enterprise Application Architecture* | [DDD closing p.296] `RULE` |
| More component integration patterns | Hohpe and Woolf, *Enterprise Integration Patterns* | [DDD closing p.296] `RULE` |
| Detailed examples of saga, process manager and outbox | Richardson, *Microservice Patterns* | [DDD closing p.296] `RULE` |
| Modernizing legacy architecture | Kaiser; Tune; Vernon and Jaskula | [DDD closing pp.296-297] `RULE` |
| The EventStorming process and rationale in detail | Brandolini, *Introducing EventStorming*; Rayner, *The EventStorming Handbook* | [DDD closing p.297] `RULE` |
| anything else | — | HALT (`OUT_OF_SCOPE`) |

A halt may name the row above as `Nearest in-book material`. It may not quote,
paraphrase or apply the deferred book. That is a separate, non-book-locked task.

## The book's own closing instruction, p.297

- What I hope you take away from this book are the logic and the principles behind domain-driven design tools [DDD closing p.297] `RULE`
- Don't follow domain-driven design blindly as a dogma, but rather understand the reasoning it is based on [DDD closing p.297] `RULE`
- Understanding the philosophy of domain-driven design is the key to incorporating the methodology's concepts individually, especially in brownfield projects [DDD closing p.297] `RULE`
- Finally, always watch your ubiquitous language, and when in doubt, do EventStorming [DDD closing p.297] `RULE`

## See also

`ddd-part-1-strategic-design.md`, `ddd-part-3-in-practice.md`,
`ddd-decision-artifacts.md`, `../rules/ddd-source-of-truth.md`.

---
name: ddd-integration-patterns
description: Selects or audits the integration pattern between two bounded contexts, from the collaboration between their teams. Invoke when the request asks how two contexts or services should talk to each other, mentions partnership, shared kernel, conformist, anticorruption layer, open-host service, published language, separate ways, or asks what a context map shows.
---

# DDD Integration Patterns

## Source

Page scope: `[DDD ch.4 pp.75-86]`. This skill may cite no other page, except
the pack-shared ranges in `../../rules/ddd-source-of-truth.md`.

## Rules

1. There will always be touchpoints between bounded contexts; these are called contracts [DDD ch.4 p.75] `RULE`
2. The patterns are divided into three groups, each representing a type of team collaboration: cooperation, customer-supplier, and separate ways [DDD ch.4 p.75] `RULE`
3. Cooperation patterns relate to bounded contexts implemented by teams with well-established communication [DDD ch.4 p.76] `RULE`
4. In the partnership model, the integration between bounded contexts is coordinated in an ad hoc manner, and the coordination is two-way [DDD ch.4 p.76] `RULE`
5. Well-established collaboration practices, high levels of commitment, and frequent synchronizations between teams are required for successful integration in this manner [DDD ch.4 p.76] `RULE`
6. The partnership pattern might not be a good fit for geographically distributed teams [DDD ch.4 p.76] `RULE`
7. The shared model is designed according to the needs of all of the bounded contexts, and has to be consistent across all of them [DDD ch.4 p.77] `RULE`
8. The overlapping model should be limited, exposing only that part of the model that has to be implemented by both bounded contexts [DDD ch.4 p.77] `HEURISTIC`
9. Each change to the shared kernel must trigger integration tests for all the affected bounded contexts [DDD ch.4 p.77] `RULE`
10. The overarching applicability criterion for the shared kernel pattern is the cost of duplication versus the cost of coordination [DDD ch.4 p.78] `RULE`
11. The shared kernel should be applied only when the cost of duplication is higher than the cost of coordination [DDD ch.4 p.78] `HEURISTIC`
12. The shared kernel will naturally be applied for the subdomains that change the most: the core subdomains [DDD ch.4 p.78] `RULE`
13. The service provider is upstream and the customer or consumer is downstream [DDD ch.4 p.79] `RULE`
14. Both upstream and downstream teams can succeed independently, which produces an imbalance of power [DDD ch.4 p.79] `RULE`
15. The downstream conforms to the upstream bounded context's model in the conformist relationship [DDD ch.4 p.79] `RULE`
16. In an anticorruption layer the downstream translates the upstream model into a model tailored to its own needs [DDD ch.4 p.80] `RULE`
17. In an open-host service the upstream supplier decouples the implementation model from the public interface [DDD ch.4 p.81] `RULE`
18. The supplier's public protocol is called the published language [DDD ch.4 p.81] `RULE`
19. The open-host service pattern is a reversal of the anticorruption layer pattern: the supplier implements the translation of its internal model [DDD ch.4 p.81] `RULE`
20. The upstream bounded context can simultaneously expose multiple versions of the published language, allowing the consumer to migrate gradually [DDD ch.4 p.81] `RULE`
21. The separate ways pattern should be avoided when integrating core subdomains [DDD ch.4 p.83] `HEURISTIC`
22. The context map is a visual representation of the system's bounded contexts and the integrations between them [DDD ch.4 p.83] `RULE`
23. The maintenance of the context map is a shared effort: each team is responsible for updating its own integrations [DDD ch.4 p.84] `RULE`
24. When a system's bounded contexts encompass multiple subdomains, there can be multiple integration patterns at play [DDD ch.4 p.84] `RULE`

## Inputs

The collaboration between teams, not the code, selects the pattern.

| Input | Reason code | Who can supply it | Citation |
|---|---|---|---|
| The quality of the teams' communication and collaboration | `REQUIRES_ORG_INPUT` | team lead | [DDD ch.4 p.76] `RULE` |
| Whether the teams have dependent goals, where one team's success depends on the other's | `REQUIRES_ORG_INPUT` | team lead | [DDD ch.4 p.76] `RULE` |
| Whether the teams are geographically distributed | `REQUIRES_ORG_INPUT` | team lead | [DDD ch.4 p.76] `RULE` |
| Whether geographical constraints or organizational politics prevent a partnership | `REQUIRES_ORG_INPUT` | team lead | [DDD ch.4 p.78] `RULE` |
| The cost of duplication and the cost of coordination | `REQUIRES_ORG_INPUT` | team lead | [DDD ch.4 p.78] `RULE` |
| Which team can dictate the integration contract | `REQUIRES_ORG_INPUT` | team lead | [DDD ch.4 p.79] `RULE` |
| Whether the downstream team can accept the upstream team's model | `REQUIRES_ORG_INPUT` | team lead | [DDD ch.4 p.79] `RULE` |
| Whether either context implements a core subdomain | `REQUIRES_BUSINESS_INPUT` | business | [DDD ch.4 p.83] `RULE` |
| anything else | `OUT_OF_SCOPE` | n/a | HALT |

The book names both costs of rule 10 and supplies neither. Where both are
unknown, the shared kernel question halts.

## Procedure

1. Name the two bounded contexts, their subdomain types and the teams that own them, per `../../rules/ddd-required-inputs.md`
2. Place the relationship in one of the three groups, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| The teams have well-established communication, or one team implements both contexts, or the teams have dependent goals | Cooperation group [DDD ch.4 p.76] `RULE` |
| Both teams can succeed independently, with an imbalance of power between them | Customer-supplier group [DDD ch.4 p.79] `RULE` |
| The teams are unwilling or unable to collaborate | Separate ways group [DDD ch.4 p.82] `RULE` |
| The collaboration quality is unknown | HALT (`REQUIRES_ORG_INPUT`) |
| anything else | HALT (`OUT_OF_SCOPE`) |

3. Inside the cooperation group, apply the shared kernel cost rule, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| The cost of duplication is higher than the cost of coordination | Shared kernel, applied only under that condition [DDD ch.4 p.78] `HEURISTIC` |
| Communication or collaboration issues prevent implementing the partnership pattern, for example because of geographical constraints or organizational politics | Shared kernel is justified [DDD ch.4 p.78] `RULE` |
| The system is being gradually modernized from a legacy codebase | Shared kernel is justified as a temporary intermediate solution [DDD ch.4 p.78] `RULE` |
| The two bounded contexts are owned and implemented by the same team | Shared kernel is justified, to define the integration contracts explicitly [DDD ch.4 p.78] `RULE` |
| Neither cost is known | HALT (`AMBIGUOUS_IN_BOOK`), the book supplies neither cost |
| anything else | Partnership: the integration is coordinated in an ad hoc manner, two-way [DDD ch.4 p.76] `RULE` |

4. Inside the customer-supplier group, apply the power table, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| The balance of power favors the upstream team, and the downstream team can accept the upstream team's model | Conformist: the downstream conforms to the upstream bounded context's model [DDD ch.4 p.79] `RULE` |
| The balance of power favors the upstream team, and the downstream bounded context is not willing to conform | Anticorruption layer: the downstream translates the upstream model into a model tailored to its own needs [DDD ch.4 p.80] `RULE` |
| The power is skewed toward the consumers | Open-host service: the supplier decouples the implementation model from the public interface [DDD ch.4 p.81] `RULE` |
| The balance of power is unknown | HALT (`REQUIRES_ORG_INPUT`) |
| anything else | HALT (`OUT_OF_SCOPE`) |

5. Confirm an anticorruption layer against the three criteria p.80 prints, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| The downstream bounded context contains a core subdomain | Anticorruption layer: a core subdomain's model requires extra attention [DDD ch.4 p.80] `RULE` |
| The upstream model is inefficient or inconvenient for the consumer's needs | Anticorruption layer: if a bounded context conforms to a mess, it risks becoming a mess itself [DDD ch.4 p.80] `RULE` |
| The supplier's contract changes often | Anticorruption layer: the changes in the supplier's model only affect the translation mechanism [DDD ch.4 p.80] `RULE` |
| None of the three holds | Conformist stands: the downstream team's decision to give up some of its autonomy can be justified [DDD ch.4 p.80] `RULE` |
| anything else | HALT (`OUT_OF_SCOPE`) |

6. Inside the separate ways group, apply the three reasons and the one exclusion, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| Either side is a core subdomain | The separate ways pattern should be avoided when integrating core subdomains [DDD ch.4 p.83] `HEURISTIC` |
| Communication difficulties are driven by the organization's size or internal politics | Separate ways: it may be more cost-effective to duplicate functionality in multiple bounded contexts [DDD ch.4 p.82] `RULE` |
| The subdomain in question is generic and the generic solution is easy to integrate | Separate ways: integrate it locally in each bounded context [DDD ch.4 p.82] `RULE` |
| The models are so different that a conformist relationship is impossible and an anticorruption layer would be more expensive than duplicating the functionality | Separate ways [DDD ch.4 pp.82-83] `RULE` |
| anything else | HALT (`OUT_OF_SCOPE`) |

7. Plot the result on the context map and read its three levels of insight, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| The question is about the system's components and the models they implement | High-level design: a context map provides an overview of the system's components [DDD ch.4 p.83] `RULE` |
| The question is about which teams are collaborating | Communication patterns: the map depicts the communication patterns among teams [DDD ch.4 p.83] `RULE` |
| The question is about an upstream team whose consumers all resort to the same protective pattern | Organizational issues: a context map can give insight into organizational issues [DDD ch.4 p.83] `RULE` |
| The question asks for a notation, arrow semantics or markers | HALT (`UNDEFINED_IN_BOOK`) |
| anything else | HALT (`OUT_OF_SCOPE`) |

8. Emit the output template below, with a citation and a status token on every claim line, writing the filled slots in Portuguese per `../../rules/ddd-language.md`

## Halt conditions

| Trigger | Code |
|---|---|
| The collaboration quality, the balance of power or the politics between the teams is unknown | `REQUIRES_ORG_INPUT` |
| Neither the cost of duplication nor the cost of coordination is known | `AMBIGUOUS_IN_BOOK` |
| Several integration patterns already operate between the same two contexts and one has to be picked | `AMBIGUOUS_IN_BOOK` |
| The request asks for a context map notation, arrow semantics or upstream and downstream markers | `UNDEFINED_IN_BOOK` |
| The request asks how the translation is implemented in code | `OUT_OF_SCOPE`, and the answer routes to `ddd-communication-patterns` |
| The request asks how the pattern changes as the organization changes | `OUT_OF_SCOPE`, and the answer routes to `ddd-evolving-design-decisions` |
| The two contexts are core subdomains integrated by separate ways and the duplication cannot be removed | `CONFLICT_WITH_PROJECT` |
| The needed claim cannot be pinned to a page in pp.75-86 | `CITATION_UNVERIFIED` |
| anything else | `OUT_OF_SCOPE` |

## Output template

```ddd-output
## DDD Integration — <upstream context> to <downstream context>

- Collaboration group: <cooperation | customer-supplier | separate ways> [DDD ch.4 p.75] `RULE`
- Upstream subdomain type: <core | supporting | generic>
- Downstream subdomain type: <core | supporting | generic>
- Pattern: <partnership | shared kernel | conformist | anticorruption layer | open-host service | separate ways> [DDD ch.4 p.85] `RULE`
- Basis: <the matching condition, one line>
- Shared kernel justification: <cost of duplication higher than cost of coordination | collaboration issues | gradual modernization | same team | not applicable> [DDD ch.4 p.78] `HEURISTIC`
- Anticorruption layer criterion: <core subdomain downstream | inefficient upstream model | contract changes often | not applicable> [DDD ch.4 p.80] `RULE`
- Published language exposed: <yes | no> — the supplier's public protocol is called the published language [DDD ch.4 p.81] `RULE`
- Core subdomain exclusion: <respected | violated> — separate ways should be avoided when integrating core subdomains [DDD ch.4 p.83] `HEURISTIC`
- Context map insight: <high-level design | communication patterns | organizational issues> [DDD ch.4 p.83] `RULE`
- Who supplied the collaboration facts: <team lead>
- Interop: <filled by the interop rule>
```

## References

`../../references/ddd-part-1-strategic-design.md`,
`../../references/ddd-vocabulary.md`,
`../../references/ddd-not-in-this-book.md`,
`../../references/ddd-exercise-answers.md`,
`../../rules/ddd-source-of-truth.md`, `../../rules/ddd-citation.md`,
`../../rules/ddd-heuristic-status.md`, `../../rules/ddd-halt-protocol.md`,
`../../rules/ddd-required-inputs.md`, `../../rules/ddd-determinism.md`,
`../../rules/ddd-interop.md`, `../../rules/ddd-language.md`,
`../../rules/ddd-answer-contract.md`.

---
name: ddd-evolving-design-decisions
description: Evolves an existing design as the business, the organization, the domain knowledge or the system grows, including brownfield strategic analysis, the strangler pattern and the ordered refactoring sequence. Invoke when the request mentions a subdomain changing type, migrating from active record to a domain model, migrating existing history into events, a legacy system, modernization, a strangler migration, growth turning a component into a big ball of mud, or a design that no longer fits the business.
---

# DDD Evolving Design Decisions

## Source

Page scope: `[DDD ch.11 pp.195-210]` and `[DDD ch.13 pp.227-240]`. This skill
may cite no other page, except the pack-shared ranges in
`../../rules/ddd-source-of-truth.md`.

## Rules

1. The four most common vectors of change are business domain, organizational structure, domain knowledge, and growth [DDD ch.11 p.195] `RULE`
2. It is equally important to be alert to the evolution of the subdomains [DDD ch.11 p.196] `RULE`
3. The typical symptom of a supporting subdomain becoming core is the increasing complexity of its business logic [DDD ch.11 p.197] `RULE`
4. If the additional complexity doesn't affect the company's profits, that's accidental business complexity [DDD ch.11 p.197] `RULE`
5. If it enhances the company's profitability, it's a sign of a supporting subdomain becoming a core subdomain [DDD ch.11 p.197] `RULE`
6. The core subdomains have to protect their models by using anticorruption layers, and have to protect consumers from frequent changes in the implementation models by using published languages [DDD ch.11 p.198] `RULE`
7. If the subdomain morphs into a core subdomain, duplicating its functionality by multiple teams is no longer acceptable [DDD ch.11 p.199] `RULE`
8. Core subdomains must be implemented in-house, as close as possible to the sources of domain knowledge [DDD ch.11 p.199] `RULE`
9. When a supporting subdomain turns into a core subdomain, its implementation should be moved in-house [DDD ch.11 p.199] `HEURISTIC`
10. The main indicator of a change in a subdomain's type is the inability of the existing technical design to support current business needs [DDD ch.11 p.199] `RULE`
11. This pain is an important signal: use it as a call to reassess the business domain and design choices [DDD ch.11 p.199] `RULE`
12. When working with data becomes challenging in a transaction script, refactor it into the active record pattern [DDD ch.11 p.200] `RULE`
13. If the business logic that manipulates active records becomes complex and you notice inconsistencies and duplications, refactor the implementation to the domain model pattern [DDD ch.11 p.200] `RULE`
14. Make all of the active records' setters private so that they can only be modified from inside the active record itself [DDD ch.11 p.200] `RULE`
15. The most challenging aspect of refactoring a domain model into an event-sourced domain model is the history of the existing aggregates [DDD ch.11 p.202] `RULE`
16. Since the fine-grained data representing all the past state changes is not there, you have to either generate past events on a best-effort basis or model migration events [DDD ch.11 p.202] `RULE`
17. Changes in the organization's structure can affect teams' communication and collaboration levels and, as a result, the ways the bounded contexts should be integrated [DDD ch.11 p.204] `HEURISTIC`
18. Since a bounded context can be implemented by only one team, adding new development teams can cause the existing wider bounded context boundaries to split into smaller ones [DDD ch.11 p.204] `RULE`
19. From a strategic design standpoint, it's a useful heuristic to design the bounded contexts' boundaries according to the level of domain knowledge [DDD ch.11 p.205] `HEURISTIC`
20. When the domain logic is unclear and changes often, it makes sense to design the bounded contexts with broader boundaries [DDD ch.11 p.205] `RULE`
21. The guiding principle for dealing with growth-driven complexity is to identify and eliminate accidental complexity: the complexity caused by outdated design decisions [DDD ch.11 p.206] `RULE`
22. Instead of striving for boundaries that are perfect, we must strive for boundaries that are useful [DDD ch.11 p.206] `RULE`
23. Revisit the identified subdomains and follow the heuristic of coherent use cases to try to identify where to split a subdomain [DDD ch.11 p.207] `HEURISTIC`
24. Always look for opportunities to simplify the models by extracting bounded contexts that are laser focused at solving specific problems [DDD ch.11 p.207] `RULE`
25. Bounded contexts that become increasingly chatty over time can be a strong signal of an ineffective model and should be addressed by redesigning the boundaries [DDD ch.11 p.207] `HEURISTIC`
26. If an aggregate grows to include data that is not needed to be strongly consistent by all of its business logic, that's accidental complexity that has to be eliminated [DDD ch.11 p.208] `RULE`
27. The projects that can benefit from DDD the most are the brownfield projects [DDD ch.13 p.227] `RULE`
28. Domain-driven design is not an all-or-nothing proposition; you don't have to apply all of the patterns and practices to gain value from it [DDD ch.13 p.227] `RULE`
29. The best starting point for introducing DDD in an organization is to invest time in understanding the organization's business strategy and the current state of its systems' architecture [DDD ch.13 p.228] `RULE`
30. A good initial heuristic is the company's org chart: its departments and other organizational units [DDD ch.13 p.228] `HEURISTIC`
31. The competitive advantage, and thus the core subdomains, are not necessarily technical [DDD ch.13 p.228] `RULE`
32. Another powerful yet unfortunate heuristic for core subdomains is identifying the worst-designed software components that the business is unwilling to rewrite from scratch [DDD ch.13 p.229] `HEURISTIC`
33. The characteristic property to look for in high-level components is their decoupled lifecycles [DDD ch.13 p.229] `RULE`
34. Chart the current design's context map as though these high-level components were bounded contexts [DDD ch.13 p.230] `RULE`
35. The big rewrite endeavors are rarely successful, and even more rarely does management support such architectural makeovers [DDD ch.13 p.230] `RULE`
36. A safer approach is to think big but start small [DDD ch.13 p.231] `RULE`
37. Start by ensuring that at least the logical boundaries are aligned with the subdomains' boundaries [DDD ch.13 p.231] `RULE`
38. Adjusting the system's modules is a relatively safe form of refactoring: you are not modifying the business logic, just repositioning the types [DDD ch.13 p.231] `RULE`
39. It can be risky to prematurely decompose the system into the smallest bounded contexts possible [DDD ch.13 p.231] `RULE`
40. The idea of the strangler is to create a new bounded context, use it to implement new requirements, and gradually migrate the legacy context's functionality into it [DDD ch.13 p.234] `RULE`
41. Except for hotfixes and other emergencies, the evolution and development of the legacy bounded context stops [DDD ch.13 p.234] `RULE`
42. The strangler pattern is used in tandem with the façade pattern, a thin abstraction layer that forwards the requests [DDD ch.13 p.234] `RULE`
43. Contrary to the principle that each bounded context is a separate subsystem, the rule can be relaxed when implementing the strangler pattern [DDD ch.13 p.235] `RULE`
44. The condition for bending the one-database-per-bounded-context rule is that eventually the legacy context will be retired, and the database will be used exclusively by the new implementation [DDD ch.13 p.235] `RULE`
45. Small incremental steps are safer than a big rewrite, so don't refactor a transaction script or active record straight to an event-sourced domain model [DDD ch.13 p.236] `RULE`
46. Only after a thorough analysis of the transactional requirements should you design the aggregate's boundaries [DDD ch.13 p.236] `HEURISTIC`
47. Domain-driven design is about letting your business domain drive software design decisions [DDD ch.13 p.237] `RULE`

## Inputs

| Input | Reason code | Who can supply it | Citation |
|---|---|---|---|
| Whether the additional complexity enhances the company's profitability | `REQUIRES_BUSINESS_INPUT` | business | [DDD ch.11 p.197] `RULE` |
| Whether an off-the-shelf product has become available for the functionality | `REQUIRES_BUSINESS_INPUT` | business | [DDD ch.11 p.196] `RULE` |
| Whether the organization's development centers are growing | `REQUIRES_ORG_INPUT` | team lead | [DDD ch.11 p.204] `RULE` |
| Whether work on a bounded context is moved to a distant development center | `REQUIRES_ORG_INPUT` | team lead | [DDD ch.11 p.205] `RULE` |
| Whether multiple teams are working on the same codebase | `REQUIRES_ORG_INPUT` | team lead | [DDD ch.13 p.232] `RULE` |
| Whether the teams have shared goals and adequate collaboration levels | `REQUIRES_ORG_INPUT` | team lead | [DDD ch.13 p.232] `RULE` |
| That the legacy context will be retired and the database used exclusively by the new implementation | `REQUIRES_BUSINESS_INPUT` | business | [DDD ch.13 p.235] `RULE` |
| anything else | `OUT_OF_SCOPE` | n/a | HALT |

## Procedure

1. Name the vector of change: business domain, organizational structure, domain knowledge, or growth [DDD ch.11 p.195] `RULE`
2. Where the vector is the business domain, apply the six-transition table, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| An off-the-shelf product became available for what was built in-house | Core to generic: the optimal solution becomes available to all competitors [DDD ch.11 p.196] `RULE` |
| The company replaces an off-the-shelf solution with its own implementation to gain an advantage | Generic to core [DDD ch.11 p.197] `RULE` |
| An open source or commercial solution implements the same functionality with more advanced features | Supporting to generic [DDD ch.11 p.197] `RULE` |
| The company finds a way to optimize the supporting logic so that it reduces costs or generates additional profits | Supporting to core [DDD ch.11 p.197] `RULE` |
| The subdomain's complexity isn't justified, so the organization cuts the extraneous complexity | Core to supporting [DDD ch.11 p.198] `RULE` |
| The complexity of integrating the solution doesn't justify the benefits, and the company resorts back to the in-house system | Generic to supporting [DDD ch.11 p.198] `RULE` |
| Whether the complexity enhances profitability is unknown | HALT (`REQUIRES_BUSINESS_INPUT`) |
| anything else | HALT (`OUT_OF_SCOPE`) |

3. Apply the profitability test to any growing complexity, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| The additional complexity does not affect the company's profits | Accidental business complexity, to be cut [DDD ch.11 p.197] `RULE` |
| The additional complexity enhances the company's profitability | A sign of a supporting subdomain becoming a core subdomain [DDD ch.11 p.197] `RULE` |
| anything else | HALT (`REQUIRES_BUSINESS_INPUT`) |

4. Where the vector is tactical, run the ordered refactoring sequence, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| Working with data becomes challenging in a transaction script | Refactor it into the active record pattern, encapsulating the complicated data structures [DDD ch.11 p.200] `RULE` |
| The business logic manipulating active records becomes complex, with inconsistencies and duplications | Refactor the implementation to the domain model pattern [DDD ch.11 p.200] `RULE` |
| The refactoring to a domain model starts | Start by identifying value objects: what data structures can be modeled as immutable objects [DDD ch.11 p.200] `RULE` |
| The value objects are in place | Make all of the active records' setters private, and let the compilation errors show where the state-modifying logic resides [DDD ch.11 p.200] `RULE` |
| The state-modifying logic is located | Move that logic inside the active record's boundary [DDD ch.11 p.201] `RULE` |
| The logic sits inside the objects | Examine what hierarchies are needed to ensure strongly consistent checking of business rules and invariants [DDD ch.11 p.201] `RULE` |
| The hierarchies are known | Look for the smallest transaction boundaries, decompose the hierarchies along them, and reference external aggregates only by their IDs [DDD ch.11 p.201] `RULE` |
| The aggregates are defined | For each aggregate, identify its root, and make the methods of all the other internal objects private [DDD ch.11 p.201] `RULE` |
| The request proposes going from transaction script or active record straight to an event-sourced domain model | Refuse the shortcut: take the intermediate step of designing state-based aggregates [DDD ch.13 p.236] `RULE` |
| anything else | HALT (`OUT_OF_SCOPE`) |

5. Where the history of existing aggregates has to move into events, present both strategies and halt on the choice, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| The request asks which of the two migration strategies to use | HALT (`AMBIGUOUS_IN_BOOK`), the book prints both and chooses neither |
| Generating past transitions is chosen outside the book | The recovered events can be tested by projecting the state and comparing it to the original data, and it is impossible to recover the complete history of state transitions [DDD ch.11 p.203] `RULE` |
| Modeling migration events is chosen outside the book | It makes the lack of past data explicit, and the traces of the legacy system will remain in the event store forever [DDD ch.11 p.203] `RULE` |
| anything else | HALT (`OUT_OF_SCOPE`) |

6. Where the vector is organizational, apply the transition table, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| New development teams are added to a wide bounded context | The existing wider bounded context boundaries split into smaller ones [DDD ch.11 p.204] `RULE` |
| Work on one of the bounded contexts is moved to a distant development center | Partnership to customer-supplier, because the change negatively affects the teams' communication [DDD ch.11 p.205] `RULE` |
| Severe communication problems are caused by geographical distance or organizational politics | Customer-supplier to separate ways, because it may become more cost-effective to duplicate the functionality [DDD ch.11 p.205] `RULE` |
| The team facts are unknown | HALT (`REQUIRES_ORG_INPUT`) |
| anything else | HALT (`OUT_OF_SCOPE`) |

7. Where the vector is growth, run the growth checklist, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| A subdomain's functionality has been expanded | Revisit the subdomains and follow the heuristic of coherent use cases to identify where to split [DDD ch.11 p.207] `HEURISTIC` |
| A bounded context has accumulated logic related to different problems | Extract bounded contexts that are laser focused at solving specific problems [DDD ch.11 p.207] `RULE` |
| Bounded contexts have become increasingly chatty over time | Redesign the boundaries to increase their autonomy [DDD ch.11 p.207] `HEURISTIC` |
| An aggregate includes data that is not needed to be strongly consistent by all of its business logic | Extract that business functionality into a dedicated aggregate [DDD ch.11 p.208] `RULE` |
| anything else | HALT (`OUT_OF_SCOPE`) |

8. Where the system is brownfield, run the strategic analysis in this order, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| The analysis begins | Identify the company's business domain, its customers, the value it provides, and the companies or products it competes with [DDD ch.13 p.228] `RULE` |
| The subdomains have to be found | Use the company's org chart, and look for what differentiates it from its competitors [DDD ch.13 p.228] `HEURISTIC` |
| Generic subdomains have to be found | Look for off-the-shelf solutions, subscription services, or integration of open source software [DDD ch.13 p.229] `RULE` |
| Supporting subdomains have to be found | Look for the remaining components that cannot be replaced with ready-made solutions yet provide no competitive advantage [DDD ch.13 p.229] `RULE` |
| The current design has to be understood | Look for the components' decoupled lifecycles: which can be evolved, tested, and deployed independently [DDD ch.13 p.229] `RULE` |
| The strategic design has to be evaluated | Chart the current design's context map and identify the relationships in terms of integration patterns [DDD ch.13 p.230] `RULE` |
| Domain knowledge has been lost | Facilitate EventStorming sessions to try to recover the knowledge [DDD ch.13 p.230] `RULE` |
| anything else | HALT (`OUT_OF_SCOPE`) |

9. Apply the two boundary questions, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| Multiple teams are working on the same codebase | Decouple the development lifecycles by defining bounded contexts for each team [DDD ch.13 p.232] `RULE` |
| Conflicting models are being used by the different components | Relocate the conflicting models into separate bounded contexts [DDD ch.13 p.232] `RULE` |
| anything else | HALT (`REQUIRES_ORG_INPUT`) |

10. Apply the modernization pattern mapping, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| A partnership relationship of multiple engineering teams is no longer sustainable | Refactor to the appropriate type of customer-supplier relationship: conformist, anticorruption layer, or open-host service [DDD ch.13 p.232] `RULE` |
| Legacy systems use inefficient models that tend to spread into downstream components | Anticorruption layer [DDD ch.13 p.232] `RULE` |
| The public interfaces of an upstream service change frequently | Anticorruption layer [DDD ch.13 p.233] `RULE` |
| Changes in the implementation details of one component ripple through the system and affect its consumers | Open-host service: decouple its implementation model from the public API it exposes [DDD ch.13 p.233] `RULE` |
| Friction among teams over a shared functionality that is not a core subdomain | Separate ways: the teams implement their own solutions [DDD ch.13 p.233] `RULE` |
| anything else | HALT (`OUT_OF_SCOPE`) |

11. Where the strangler pattern is selected, check its single shared-database condition, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| The business commits that the legacy context will be retired and the database used exclusively by the new implementation | The one-database-per-bounded-context rule can be relaxed [DDD ch.13 p.235] `RULE` |
| No such commitment exists | HALT (`REQUIRES_BUSINESS_INPUT`) |
| The legacy context keeps evolving alongside the strangler | Violates: except for hotfixes and other emergencies, the evolution and development of the legacy bounded context stops [DDD ch.13 p.234] `RULE` |
| anything else | HALT (`OUT_OF_SCOPE`) |

12. Emit the output template below, with a citation and a status token on every claim line, writing the filled slots in Portuguese per `../../rules/ddd-language.md`

## Halt conditions

| Trigger | Code |
|---|---|
| Whether the additional complexity enhances profitability is unknown | `REQUIRES_BUSINESS_INPUT` |
| No commitment exists to retire the legacy context | `REQUIRES_BUSINESS_INPUT` |
| The team or codebase ownership facts are unknown | `REQUIRES_ORG_INPUT` |
| The request asks which history-migration strategy to use | `AMBIGUOUS_IN_BOOK` |
| The request asks how much DDD to adopt | Answered, not halted: as long as the business domain drives the decisions, that is domain-driven design |
| The request asks for a bubble context or an autonomous bubble | `OUT_OF_SCOPE`, and it is never conflated with the strangler pattern |
| The request asks how to version the migrated events | `OUT_OF_SCOPE` |
| The business refuses to retire a legacy context that shares a database | `CONFLICT_WITH_PROJECT` |
| The needed claim cannot be pinned to a page in pp.195-210 or pp.227-240 | `CITATION_UNVERIFIED` |
| anything else | `OUT_OF_SCOPE` |

## Output template

```ddd-output
## DDD Evolution — <component>

- Vector of change: <business domain | organizational structure | domain knowledge | growth> [DDD ch.11 p.195] `RULE`
- Change in the subdomain type: <core to generic | generic to core | supporting to generic | supporting to core | core to supporting | generic to supporting | none> [DDD ch.11 p.196] `RULE`
- Profitability: <enhances profits | accidental business complexity> [DDD ch.11 p.197] `RULE`
- Refactor the implementation: <transaction script to active record | active record to domain model | domain model to event-sourced domain model | none> [DDD ch.11 p.200] `RULE`
- Intermediate step required: state-based aggregates before event sourcing [DDD ch.13 p.236] `RULE`
- History migration: <generating past transitions | modeling migration events | undecided, AMBIGUOUS_IN_BOOK> [DDD ch.11 p.202] `RULE`
- Change in the integration pattern: <partnership to customer-supplier | customer-supplier to separate ways | boundary split | none> [DDD ch.11 p.205] `RULE`
- Growth: <split a subdomain | extract a laser focused bounded context | redesign chatty boundaries | extract an aggregate | none> [DDD ch.11 p.207] `HEURISTIC`
- Modernization pattern: <anticorruption layer | open-host service | separate ways | customer-supplier | strangler | none> [DDD ch.13 p.233] `RULE`
- Strangler shared database: <relaxed, the legacy context will be retired | not applicable> [DDD ch.13 p.235] `RULE`
- Who supplied the facts: <business | team lead>
- Interop: <filled by the interop rule>
```

## References

`../../references/ddd-part-3-in-practice.md`,
`../../references/ddd-part-1-strategic-design.md`,
`../../references/ddd-part-2-tactical-design.md`,
`../../references/ddd-case-study.md`,
`../../references/ddd-exercise-answers.md`,
`../../rules/ddd-source-of-truth.md`, `../../rules/ddd-citation.md`,
`../../rules/ddd-heuristic-status.md`, `../../rules/ddd-halt-protocol.md`,
`../../rules/ddd-required-inputs.md`, `../../rules/ddd-determinism.md`,
`../../rules/ddd-structural-fidelity.md`, `../../rules/ddd-interop.md`,
`../../rules/ddd-language.md`,
`../../rules/ddd-answer-contract.md`.

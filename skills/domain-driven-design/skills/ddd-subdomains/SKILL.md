---
name: ddd-subdomains
description: Classifies a business activity as a core, supporting or generic subdomain, and states the implementation strategy that follows from the type. Invoke when the request asks what kind of subdomain something is, whether to build or buy a capability, whether an activity is a competitive advantage, how far to distil subdomain boundaries, or who the domain experts are.
---

# DDD Subdomains

## Source

Page scope: `[DDD ch.1 pp.29-45]`. This skill may cite no other page, except
the pack-shared ranges in `../../rules/ddd-source-of-truth.md`, which include
Table E-1 on p.293 and Appendix B on pp.315-321.

## Rules

1. A business domain defines a company's main area of activity [DDD ch.1 p.29] `RULE`
2. A subdomain is a fine-grained area of business activity, and all of a company's subdomains form its business domain [DDD ch.1 p.30] `RULE`
3. Domain-driven design distinguishes between three types of subdomains: core, generic, and supporting [DDD ch.1 p.30] `RULE`
4. A core subdomain is what a company does differently from its competitors [DDD ch.1 p.30] `RULE`
5. A core subdomain that is simple to implement can only provide a short-lived competitive advantage, therefore core subdomains are naturally complex [DDD ch.1 p.31] `RULE`
6. Core subdomains are not necessarily technical, and a company's competitive advantage can come from various sources [DDD ch.1 p.31] `RULE`
7. Generic subdomains are business activities that all companies are performing in the same way [DDD ch.1 p.32] `RULE`
8. Generic subdomains, by definition, cannot be a source for any competitive advantage [DDD ch.1 p.33] `RULE`
9. Supporting subdomains support the company's business but do not provide any competitive advantage [DDD ch.1 p.32] `RULE`
10. Supporting subdomains are simple: their business logic resembles data entry screens and ETL operations, the so-called CRUD interfaces [DDD ch.1 p.33] `RULE`
11. Only core subdomains provide a competitive advantage to a company [DDD ch.1 p.33] `RULE`
12. The intersection between the supporting and generic subdomains is a gray area: it can go either way [DDD ch.1 p.34] `RULE`
13. Core subdomains can change often, and solutions for core subdomains are emergent [DDD ch.1 p.35] `RULE`
14. Supporting subdomains do not change often [DDD ch.1 p.35] `RULE`
15. Generic subdomains can change over time: security patches, bug fixes, or entirely new solutions [DDD ch.1 p.35] `RULE`
16. All subdomains are required for the company to work in its business domain [DDD ch.1 p.36] `RULE`
17. The subdomains and their types are defined by the company's business strategy [DDD ch.1 p.37] `RULE`
18. Subdomains resemble sets of interrelated, coherent use cases, usually involving the same actor and a closely related set of data [DDD ch.1 p.38] `RULE`
19. Domain experts are subject matter experts who know all the intricacies of the business, and are knowledge authorities in the software's business domain [DDD ch.1 p.43] `RULE`
20. Domain experts are neither the analysts gathering the requirements nor the engineers designing the system [DDD ch.1 p.43] `RULE`
21. As a rule of thumb, domain experts are either the people coming up with requirements or the software's end users [DDD ch.1 p.43] `HEURISTIC`

## Inputs

No repository answers any of these. Per `../../rules/ddd-required-inputs.md`.

| Input | Reason code | Who can supply it | Citation |
|---|---|---|---|
| Whether the activity provides a competitive advantage to the company | `REQUIRES_BUSINESS_INPUT` | business | [DDD ch.1 p.33] `RULE` |
| Whether the subdomain in question can be turned into a side business, and whether someone would pay for it on its own | `REQUIRES_BUSINESS_INPUT` | business | [DDD ch.1 p.34] `RULE` |
| Whether it is simpler and cheaper to hack your own implementation rather than integrating an external one | `REQUIRES_BUSINESS_INPUT` | business | [DDD ch.1 p.34] `RULE` |
| Whether a ready-made solution exists for the functionality | `REQUIRES_BUSINESS_INPUT` | business | [DDD ch.1 p.36] `RULE` |
| How often the activity changes | `REQUIRES_BUSINESS_INPUT` | business | [DDD ch.1 p.35] `RULE` |
| Whether the business logic resembles CRUD interfaces for data entry or complex algorithms and invariants | `REQUIRES_BUSINESS_INPUT` | domain expert | [DDD ch.1 p.34] `RULE` |
| anything else | `OUT_OF_SCOPE` | n/a | HALT |

Two of these look technical and are not: a core subdomain's competitive
advantage is not necessarily technical, and a company's competitive advantage
can come from various sources [DDD ch.1 p.31] `RULE`.

## Procedure

1. Name the business activity, and name the company whose strategy defines it, per `../../rules/ddd-required-inputs.md`
2. Apply the three classification tests, first-match-wins in this order, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| The subdomain in question can be turned into a side business, and someone would pay for it on its own | This is a core subdomain [DDD ch.1 p.34] `RULE` |
| The business logic requires complex algorithms or business processes orchestrated by complex business rules and invariants | This is a typical core subdomain [DDD ch.1 p.34] `RULE` |
| A generic solution exists, and integrating it is simpler and cheaper than implementing the functionality from scratch | This is a generic subdomain [DDD ch.1 p.34] `RULE` |
| It would be simpler and cheaper to hack your own implementation rather than integrating an external one | This is a supporting subdomain [DDD ch.1 p.34] `RULE` |
| The business logic resembles CRUD interfaces for data entry | It is a sign of a supporting subdomain [DDD ch.1 p.34] `RULE` |
| Both costs are known and equal | HALT (`AMBIGUOUS_IN_BOOK`), the gray area p.34 prints |
| Any of the answers above is unavailable | HALT (`REQUIRES_BUSINESS_INPUT`) |
| anything else | HALT (`OUT_OF_SCOPE`) |

3. Cross-check the classification against the volatility criteria, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| The activity changes often and its solutions are emergent | Consistent with a core subdomain [DDD ch.1 p.35] `RULE` |
| The activity does not change often and provides no competitive advantage | Consistent with a supporting subdomain [DDD ch.1 p.35] `RULE` |
| The activity changes through security patches, bug fixes, or entirely new solutions to the generic problems | Consistent with a generic subdomain [DDD ch.1 p.35] `RULE` |
| The volatility contradicts the type of step 2 | HALT (`REQUIRES_BUSINESS_INPUT`), the business settles the type |
| anything else | HALT (`OUT_OF_SCOPE`) |

4. Read the solution strategy off Table 1-1, transcribed row for row, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| Core | Competitive advantage yes, complexity high, volatility high, implementation in-house, problem interesting [DDD ch.1 p.37] `RULE` |
| Generic | Competitive advantage no, complexity high, volatility low, implementation buy or adopt, problem solved [DDD ch.1 p.37] `RULE` |
| Supporting | Competitive advantage no, complexity low, volatility low, implementation in-house or outsource, problem obvious [DDD ch.1 p.37] `RULE` |
| anything else | HALT (`OUT_OF_SCOPE`) |

5. State the implementation consequences of the type, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| Core | Has to be implemented in-house and cannot be bought or adopted, with the organization's most skilled talent and the most advanced engineering techniques [DDD ch.1 p.36] `RULE` |
| Generic | It is more cost-effective to buy an off-the-shelf product or adopt an open source solution [DDD ch.1 p.36] `RULE` |
| Supporting | The company has no choice but to implement it itself, and the simplicity of the business logic makes it a good candidate for outsourcing [DDD ch.1 p.36] `RULE` |
| anything else | HALT (`OUT_OF_SCOPE`) |

6. Apply the distillation stopping rule, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| The subdomain is core | Distilling laser-focused boundaries is necessary [DDD ch.1 p.39] `RULE` |
| Drilling down further does not unveil any new insights that can help you make software design decisions | Stop distilling here [DDD ch.1 p.39] `RULE` |
| All of the finer-grained subdomains are of the same type as the original subdomain | Stop distilling here [DDD ch.1 p.39] `RULE` |
| The candidate set is a set of coherent use cases working on the same data with the same actors | Stop: these are the most precise boundaries of the subdomains [DDD ch.1 p.38] `RULE` |
| The business function is not related to software | Acknowledge it as such and focus on aspects of the business relevant to the software system [DDD ch.1 p.40] `RULE` |
| anything else | HALT (`OUT_OF_SCOPE`) |

7. Emit the output template below, with a citation and a status token on every claim line, writing the filled slots in Portuguese per `../../rules/ddd-language.md`

## Halt conditions

| Trigger | Code |
|---|---|
| The business cannot say whether the activity differentiates the company | `REQUIRES_BUSINESS_INPUT` |
| The cost of integrating and the cost of building are both known and equal | `AMBIGUOUS_IN_BOOK` |
| The request asks which pattern implements the subdomain | `OUT_OF_SCOPE`, and the answer routes to `ddd-design-heuristics` |
| The request asks how the subdomain becomes a bounded context | `OUT_OF_SCOPE`, and the answer routes to `ddd-bounded-contexts` |
| The request asks how a subdomain changes type over time | `OUT_OF_SCOPE`, and the answer routes to `ddd-evolving-design-decisions` |
| The codebase treats a declared core subdomain as an off-the-shelf integration | `CONFLICT_WITH_PROJECT` |
| The needed claim cannot be pinned to a page in pp.29-45 | `CITATION_UNVERIFIED` |
| anything else | `OUT_OF_SCOPE` |

## Output template

```ddd-output
## DDD Subdomain — <activity>

- Business domain: <the company's main area of activity> [DDD ch.1 p.29] `RULE`
- Subdomain type: <core | supporting | generic> [DDD ch.1 p.30] `RULE`
- Guiding principle that settled it: <side business | complex algorithms | simpler and cheaper to integrate | CRUD interfaces> [DDD ch.1 p.34] `RULE`
- Competitive advantage: <yes | no> [DDD ch.1 p.37] `RULE`
- Complexity: <high | low> [DDD ch.1 p.37] `RULE`
- Volatility: <high | low> [DDD ch.1 p.37] `RULE`
- Implementation: <in-house | buy or adopt | in-house or outsource> [DDD ch.1 p.37] `RULE`
- Problem: <interesting | solved | obvious> [DDD ch.1 p.37] `RULE`
- Distillation: <continue | stop> — drilling down further does not unveil any new insights [DDD ch.1 p.39] `RULE`
- Who supplied the classification: <business | domain expert>
- Interop: <filled by the interop rule>
```

## References

`../../references/ddd-part-1-strategic-design.md`,
`../../references/ddd-closing-words.md`,
`../../references/ddd-exercise-answers.md`,
`../../references/ddd-vocabulary.md`,
`../../rules/ddd-source-of-truth.md`, `../../rules/ddd-citation.md`,
`../../rules/ddd-heuristic-status.md`, `../../rules/ddd-halt-protocol.md`,
`../../rules/ddd-required-inputs.md`, `../../rules/ddd-determinism.md`,
`../../rules/ddd-interop.md`, `../../rules/ddd-language.md`,
`../../rules/ddd-answer-contract.md`.

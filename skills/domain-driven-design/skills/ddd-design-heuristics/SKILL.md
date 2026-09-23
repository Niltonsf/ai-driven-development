---
name: ddd-design-heuristics
description: Selects the business logic implementation pattern, the architectural pattern and the testing strategy for one component, and validates the selection back against the subdomain type. Invoke when the request asks which pattern to use, whether to use a domain model or event sourcing, which architecture fits a subdomain, what testing strategy a codebase needs, how wide to draw an initial bounded context, or mentions the tactical design decision tree.
---

# DDD Design Heuristics

## Source

Page scope: `[DDD ch.10 pp.185-194]`. This skill may cite no other page, except
the pack-shared ranges in `../../rules/ddd-source-of-truth.md`.

This is the router of the pack. It answers with one business logic pattern, one
architectural pattern and one testing strategy, and never fewer.

## Rules

1. Both wide and narrow boundaries could fit the definition of a valid bounded context encompassing a consistent ubiquitous language [DDD ch.10 p.186] `RULE`
2. Rather than making the model a function of the desired size, treat the bounded context's size as a function of the model it encompasses [DDD ch.10 p.186] `RULE`
3. Refactoring logical boundaries is much less expensive than refactoring physical boundaries [DDD ch.10 p.187] `RULE`
4. When designing bounded contexts, start with wider boundaries, and decompose the wide boundaries into smaller ones as you gain domain knowledge [DDD ch.10 p.187] `HEURISTIC`
5. This heuristic applies mainly to bounded contexts encompassing core subdomains, as both generic and supporting subdomains are more formularized and much less volatile [DDD ch.10 p.187] `HEURISTIC`
6. Both the transaction script and active record patterns are better suited for subdomains with simple business logic: supporting subdomains or integrating a third-party solution for a generic subdomain [DDD ch.10 p.187] `RULE`
7. The difference between the two patterns is the complexity of the data structures [DDD ch.10 p.187] `RULE`
8. The domain model and its variant, the event-sourced domain model, lend themselves to subdomains that have complex business logic: core subdomains [DDD ch.10 p.188] `RULE`
9. Complex business logic includes complicated business rules, invariants, and algorithms, while a simple approach mainly revolves around validating the inputs [DDD ch.10 pp.188-189] `HEURISTIC`
10. Another heuristic for evaluating complexity concerns the complexity of the ubiquitous language itself: is it mainly describing CRUD operations, or more complicated business processes and rules [DDD ch.10 p.189] `HEURISTIC`
11. The only exception to the preceding heuristics is the CQRS pattern, which can be beneficial for any other pattern if the subdomain requires representing its data in multiple persistent models [DDD ch.10 p.189] `HEURISTIC`
12. Deciding on the business logic implementation pattern according to the complexity of the business logic and its data structures is a way to validate your assumptions about the subdomain type [DDD ch.10 p.189] `HEURISTIC`
13. A core subdomain's competitive advantage is not necessarily technical [DDD ch.10 p.189] `RULE`
14. The difference between the testing strategies is their emphasis on the different types of tests: unit, integration, and end-to-end [DDD ch.10 p.191] `RULE`
15. Identifying subdomains types and following the decision tree gives you a solid starting point for making the essential design decisions, per Figure 10-7 [DDD ch.10 p.192] `HEURISTIC`
16. The decision tree is based on my preference to use the simple tools, and resort to the advanced patterns only when absolutely necessary [DDD ch.10 p.193] `PREFERENCE`
17. If you find that alternative heuristics fit you better, you are free to alter the guiding principles or build your own decision tree altogether [DDD ch.10 p.193] `HEURISTIC`
18. Making design decisions is important, but even more so is to verify the decisions' validity over time [DDD ch.10 p.193] `HEURISTIC`

The chapter grades itself, and the pack copies the grade rather than hardening
it:

```ddd-quote [DDD ch.10 p.192]
these are heuristics, not hard rules
```

## Inputs

Nothing here is readable from a codebase. Each row names the reason code the
halt carries and who answers it, per `../../rules/ddd-required-inputs.md`.

| Input | Reason code | Who can supply it | Citation |
|---|---|---|---|
| Whether the subdomain tracks money or other monetary transactions | `REQUIRES_BUSINESS_INPUT` | business | [DDD ch.10 p.188] `HEURISTIC` |
| Whether it has to provide a consistent audit log | `REQUIRES_BUSINESS_INPUT` | business | [DDD ch.10 p.188] `HEURISTIC` |
| Whether deep analysis of its behavior is required by the business | `REQUIRES_BUSINESS_INPUT` | business | [DDD ch.10 p.188] `HEURISTIC` |
| Whether the subdomain's business logic is complex | `REQUIRES_BUSINESS_INPUT` | domain expert | [DDD ch.10 p.188] `HEURISTIC` |
| Whether the subdomain includes complex data structures | `REQUIRES_BUSINESS_INPUT` | domain expert | [DDD ch.10 p.188] `HEURISTIC` |
| Whether the subdomain requires representing its data in multiple persistent models | `REQUIRES_BUSINESS_INPUT` | business | [DDD ch.10 p.189] `HEURISTIC` |
| The subdomain type the business declares, for step 8 | `REQUIRES_BUSINESS_INPUT` | business | [DDD ch.10 p.189] `HEURISTIC` |
| anything else | `OUT_OF_SCOPE` | n/a | HALT |

The complexity of the ubiquitous language, rule 10, is a second reading of the
same input rather than a replacement for it.

## Procedure

1. Name the component and the subdomain it implements; where the subdomain type is unknown, route to `ddd-subdomains` and return with its verdict, per `../../rules/ddd-required-inputs.md`
2. Apply the start-wide boundary table, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| The bounded context encompasses a core subdomain | Start with wider boundaries, and decompose them into smaller ones as you gain domain knowledge [DDD ch.10 p.187] `HEURISTIC` |
| The bounded context encompasses only generic or supporting subdomains | The heuristic does not apply: those subdomains are more formularized and much less volatile [DDD ch.10 p.187] `HEURISTIC` |
| The request asks for a size in lines, files, aggregates or use cases | HALT (`AMBIGUOUS_IN_BOOK`) |
| anything else | HALT (`OUT_OF_SCOPE`) |

3. Apply the four-question business logic table, first-match-wins in the printed order, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| The subdomain tracks money or other monetary transactions, or has to provide a consistent audit log, or deep analysis of its behavior is required by the business | Use the event-sourced domain model [DDD ch.10 p.188] `HEURISTIC` |
| The subdomain's business logic is complex | Implement a domain model [DDD ch.10 p.188] `HEURISTIC` |
| The subdomain includes complex data structures | Use the active record pattern [DDD ch.10 p.188] `HEURISTIC` |
| Any answer above is unavailable | HALT (`REQUIRES_BUSINESS_INPUT`) |
| anything else | Implement a transaction script [DDD ch.10 p.188] `HEURISTIC` |

4. Apply the architecture table to the selection of step 3, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| Event-sourced domain model | Requires CQRS, otherwise the system will be extremely limited in its data querying options [DDD ch.10 p.189] `HEURISTIC` |
| Domain model | Requires the ports & adapters architecture, otherwise the layered architecture makes it hard to make aggregates and value objects ignorant of persistence [DDD ch.10 p.189] `HEURISTIC` |
| Active record | Best accompanied by a layered architecture with the additional application service layer, for the logic controlling the active records [DDD ch.10 p.189] `HEURISTIC` |
| Transaction script | Can be implemented with a minimal layered architecture, consisting of only three layers [DDD ch.10 p.189] `HEURISTIC` |
| anything else | HALT (`OUT_OF_SCOPE`) |

5. Apply the single CQRS exception table, then stop applying exceptions, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| The subdomain requires representing its data in multiple persistent models | Add CQRS on top of the selection of step 4 [DDD ch.10 p.189] `HEURISTIC` |
| The subdomain requires one persistent model | The exception stays closed: CQRS enters only when the subdomain requires representing its data in multiple persistent models [DDD ch.10 p.189] `HEURISTIC` |
| anything else | HALT (`OUT_OF_SCOPE`) |

6. Apply the testing-strategy table to the selection of step 3, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| Domain model, or event-sourced domain model | Testing pyramid: aggregates and value objects make perfect units for effectively testing the business logic [DDD ch.10 p.191] `HEURISTIC` |
| Active record | Testing diamond, which focuses the most on integration tests [DDD ch.10 p.191] `HEURISTIC` |
| Transaction script | Reversed testing pyramid, which attributes the most attention to end-to-end tests [DDD ch.10 p.191] `HEURISTIC` |
| anything else | HALT (`OUT_OF_SCOPE`) |

For active record, p.191 prints one sentence that contradicts both Figure 10-6
and Figure 10-7. The selection stays *testing diamond*, decided 2 to 1 by the
book's own artifacts, and the sentence is printed as evidence:

```ddd-quote [DDD ch.10 p.191]
Therefore, to focus on integrating the two layers, the testing pyramid is the more effective choice.
```

7. Apply the validation table to the selection of step 3, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| The selection of step 3 is transaction script or active record | The implied subdomain type is supporting, or a third-party solution for a generic subdomain [DDD ch.10 p.187] `RULE` |
| The selection of step 3 is domain model or event-sourced domain model | The implied subdomain type is core [DDD ch.10 p.188] `RULE` |
| anything else | HALT (`OUT_OF_SCOPE`) |

8. Apply the mismatch table against the type the business declared, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| The two types are the same | The assumptions about the subdomain type are validated [DDD ch.10 p.189] `HEURISTIC` |
| The business declares core and the implied type is supporting | Record the mismatch, owner `REQUIRES_BUSINESS_INPUT`: it's an excellent opportunity to revisit your assumptions about the subdomain [DDD ch.10 p.189] `HEURISTIC` |
| The business declares supporting and the implied type is core | Record the mismatch, owner `REQUIRES_BUSINESS_INPUT`: a core subdomain's competitive advantage is not necessarily technical [DDD ch.10 p.189] `HEURISTIC` |
| anything else | HALT (`OUT_OF_SCOPE`) |

9. Record the review trigger: making design decisions is important, but even more so is to verify the decisions' validity over time [DDD ch.10 p.193] `HEURISTIC`
10. Emit the output template below, with a citation and a status token on every claim line, writing the filled slots in Portuguese per `../../rules/ddd-language.md`

A mismatch in step 8 never suppresses the answer. The selections of steps 3, 4,
5 and 6 are printed either way.

## Halt conditions

| Trigger | Code |
|---|---|
| A step 3 input cannot be obtained from the business or a domain expert | `REQUIRES_BUSINESS_INPUT` |
| The request asks to endorse one pattern for every subdomain of a company | `BOOK_DECLINES_TO_GENERALIZE` |
| The request asks for a bounded context size expressed as a number | `AMBIGUOUS_IN_BOOK` |
| The request asks for a fifth business logic pattern, a fourth architecture or a fourth testing strategy | `OUT_OF_SCOPE` |
| The request asks how to implement the selected pattern | `OUT_OF_SCOPE`, and the answer routes to the owning skill |
| The codebase implements a pattern that contradicts the selection and cannot be changed | `CONFLICT_WITH_PROJECT` |
| The needed claim cannot be pinned to a page in pp.185-194 | `CITATION_UNVERIFIED` |
| anything else | `OUT_OF_SCOPE` |

### The one halt that is not a halt

Asked to *override* the tree with a house rule, this skill does not halt. p.193
permits altering the guiding principles or building your own decision tree. The
decision is appended to `../../ddd-divergences.md` and is never laundered into
a citation.

Asked to *endorse* one team's practice for everyone, it stops at the
endorsement and prints the book declining:

```ddd-quote [DDD ch.10 p.193]
Can I recommend this approach to everyone? Of course not.
```

## Output template

```ddd-output
## DDD Design Heuristics — <component>

- Subdomain type declared by the business: <core | supporting | generic>
- Business logic pattern: <transaction script | active record | domain model | event-sourced domain model> [DDD ch.10 p.188] `HEURISTIC`
- Deciding question: <the first question of step 3 that matched>
- Architectural pattern: <layered | layered with a service layer | ports & adapters | CQRS> [DDD ch.10 p.189] `HEURISTIC`
- CQRS exception: <added | not added> — the subdomain requires representing its data in multiple persistent models [DDD ch.10 p.189] `HEURISTIC`
- Testing strategy: <testing pyramid | testing diamond | reversed testing pyramid> [DDD ch.10 p.191] `HEURISTIC`
- Bounded context boundary: <wider | unchanged> — start with wider boundaries [DDD ch.10 p.187] `HEURISTIC`
- Implied subdomain type: <core | supporting>
- Validated subdomain type: <same | mismatch, owner REQUIRES_BUSINESS_INPUT> [DDD ch.10 p.189] `HEURISTIC`
- Review trigger: making design decisions is important, but even more so is to verify the decisions' validity over time [DDD ch.10 p.193] `HEURISTIC`
- These are heuristics, not hard rules [DDD ch.10 p.192] `HEURISTIC`
- Interop: <filled by the interop rule>
```

## References

`../../references/ddd-part-3-in-practice.md`,
`../../references/ddd-part-2-tactical-design.md`,
`../../references/ddd-decision-artifacts.md`,
`../../references/ddd-exercise-answers.md`,
`../../rules/ddd-source-of-truth.md`, `../../rules/ddd-citation.md`,
`../../rules/ddd-heuristic-status.md`, `../../rules/ddd-halt-protocol.md`,
`../../rules/ddd-required-inputs.md`, `../../rules/ddd-determinism.md`,
`../../rules/ddd-interop.md`, `../../rules/ddd-language.md`,
`../../rules/ddd-answer-contract.md`.

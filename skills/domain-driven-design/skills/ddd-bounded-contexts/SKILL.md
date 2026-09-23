---
name: ddd-bounded-contexts
description: Designs or audits a bounded context boundary, its kind, and its team ownership. Invoke when the request asks where to draw a component boundary, whether two subdomains belong in the same context, how many teams may own a context, whether a context should map one-to-one to a subdomain, or how big a bounded context should be.
---

# DDD Bounded Contexts

## Source

Page scope: `[DDD ch.3 pp.59-73]`. This skill may cite no other page, except
the pack-shared ranges in `../../rules/ddd-source-of-truth.md`.

## Rules

1. Divide the ubiquitous language into multiple smaller languages, then assign each one to the explicit context in which it can be applied: its bounded context [DDD ch.3 p.61] `RULE`
2. Bounded contexts are the consistency boundaries of ubiquitous languages [DDD ch.3 p.62] `RULE`
3. A model cannot exist without a boundary; it will expand to become a copy of the real world [DDD ch.3 p.62] `RULE`
4. A ubiquitous language is ubiquitous only in the boundaries of its bounded context [DDD ch.3 p.63] `RULE`
5. The consistency of the ubiquitous language only helps to identify the widest boundary of that language [DDD ch.3 p.63] `RULE`
6. A bounded context's size, by itself, is not a deciding factor; models need to be useful [DDD ch.3 p.64] `RULE`
7. The wider the boundary of the ubiquitous language is, the harder it is to keep it consistent [DDD ch.3 p.64] `RULE`
8. The smaller bounded contexts are, the more integration overhead the design induces [DDD ch.3 p.64] `RULE`
9. Beware of splitting a coherent functionality into multiple bounded contexts [DDD ch.3 p.64] `RULE`
10. Identify sets of coherent use cases that operate on the same data and avoid decomposing them into multiple bounded contexts [DDD ch.3 p.64] `HEURISTIC`
11. Bounded contexts are designed: choosing models' boundaries is a strategic design decision [DDD ch.3 p.65] `RULE`
12. Subdomains are discovered and bounded contexts are designed [DDD ch.3 p.67] `RULE`
13. Having a one-to-one relationship between bounded contexts and subdomains can be perfectly reasonable in some scenarios, and in others different decomposition strategies can be more suitable [DDD ch.3 p.66] `RULE`
14. Limiting the design to one-to-one relationships would inhibit flexibility and force us to use a single model of a subdomain in its bounded context [DDD ch.3 p.67] `RULE`
15. Each bounded context should be implemented as an individual service or project, implemented, evolved, and versioned independently of other bounded contexts [DDD ch.3 p.67] `HEURISTIC`
16. A bounded context can contain multiple subdomains; then the bounded context is a physical boundary, while each of its subdomains is a logical boundary [DDD ch.3 p.67] `RULE`
17. Logical boundaries bear different names in different programming languages: namespaces, modules, or packages [DDD ch.3 p.67] `RULE`
18. A bounded context should be implemented, evolved, and maintained by one team only [DDD ch.3 p.68] `HEURISTIC`
19. No two teams can work on the same bounded context [DDD ch.3 p.68] `RULE`
20. A bounded context should be owned by only one team [DDD ch.3 p.68] `HEURISTIC`
21. A single team can own multiple bounded contexts [DDD ch.3 p.68] `RULE`
22. Each bounded context's lifecycle is decoupled from the rest, and each can evolve independently [DDD ch.3 p.72] `RULE`

Rules 18 and 19 sit in consecutive sentences on the same page, with two
different modalities. They stay two lines and two tokens.

## Inputs

| Input | Reason code | Who can supply it | Citation |
|---|---|---|---|
| Whether the domain experts hold conflicting mental models of the same business entity | `REQUIRES_BUSINESS_INPUT` | domain expert | [DDD ch.3 p.63] `RULE` |
| How many teams will implement the contexts in question | `REQUIRES_ORG_INPUT` | team lead | [DDD ch.3 p.68] `RULE` |
| Whether new software engineering teams are being constituted | `REQUIRES_ORG_INPUT` | team lead | [DDD ch.3 p.64] `RULE` |
| Which nonfunctional requirements demand separate development lifecycles | `REQUIRES_ORG_INPUT` | team lead | [DDD ch.3 p.64] `RULE` |
| Which functionality has to scale independently from the rest | `REQUIRES_BUSINESS_INPUT` | business | [DDD ch.3 p.64] `RULE` |
| anything else | `OUT_OF_SCOPE` | n/a | HALT |

## Procedure

1. List the candidate contexts, their subdomains and the terms in dispute, per `../../rules/ddd-required-inputs.md`
2. Apply the widest-boundary table, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| The same term bears a single meaning across the whole candidate boundary | The boundary is valid: as long as it bears a single meaning in each bounded context, each fine-grained ubiquitous language is consistent [DDD ch.3 p.62] `RULE` |
| The same term has different meanings for different domain experts | Divide the ubiquitous language into multiple smaller languages, one per bounded context [DDD ch.3 p.61] `RULE` |
| The candidate boundary has no stated problem to solve | HALT (`REQUIRES_BUSINESS_INPUT`), a model cannot exist without a boundary [DDD ch.3 p.62] `RULE` |
| anything else | HALT (`OUT_OF_SCOPE`) |

3. Apply the three extraction triggers, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| New software engineering teams are being constituted | Extract a finer-grained bounded context [DDD ch.3 p.64] `RULE` |
| Some of the system's nonfunctional requirements demand separating the development lifecycles of some components | Extract a finer-grained bounded context [DDD ch.3 p.64] `RULE` |
| One functionality has to scale independently from the rest of the bounded context's functionalities | Extract a finer-grained bounded context [DDD ch.3 p.64] `RULE` |
| The extraction would split a coherent functionality across contexts | Do not extract: such division will hinder the ability to evolve each context independently [DDD ch.3 p.64] `RULE` |
| The request asks for a size expressed as a number | HALT (`AMBIGUOUS_IN_BOOK`), size by itself is not a deciding factor [DDD ch.3 p.64] `RULE` |
| anything else | HALT (`OUT_OF_SCOPE`) |

4. Apply the coherent-use-cases check, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| A set of coherent use cases operating on the same data would be split | Keep them together and avoid decomposing them into multiple bounded contexts [DDD ch.3 p.64] `HEURISTIC` |
| No set of coherent use cases is split by the boundary | The decomposition stands [DDD ch.3 p.64] `HEURISTIC` |
| anything else | HALT (`OUT_OF_SCOPE`) |

5. Name the boundary kind, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| The boundary separates independently implemented, evolved and versioned services or projects | Physical boundary [DDD ch.3 p.67] `HEURISTIC` |
| The boundary separates subdomains inside one bounded context | Logical boundary: namespaces, modules, or packages [DDD ch.3 p.67] `RULE` |
| The division of work between teams runs along it | Ownership boundary: the division of work between teams is a strategic decision made using the bounded context pattern [DDD ch.3 p.68] `RULE` |
| anything else | HALT (`OUT_OF_SCOPE`) |

6. Apply the team-ownership cardinality table, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| One team owns the bounded context | Conforms: a bounded context should be owned by only one team [DDD ch.3 p.68] `HEURISTIC` |
| Two or more teams work on the same bounded context | Violates: no two teams can work on the same bounded context [DDD ch.3 p.68] `RULE` |
| One team owns several bounded contexts | Conforms: a single team can own multiple bounded contexts [DDD ch.3 p.68] `RULE` |
| The number of teams is unknown | HALT (`REQUIRES_ORG_INPUT`) |
| anything else | HALT (`OUT_OF_SCOPE`) |

7. Handle the subdomain relationship, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| The request asks whether a one-to-one mapping to subdomains is a good choice here | HALT (`AMBIGUOUS_IN_BOOK`): it can be perfectly reasonable in some scenarios, and in others different decomposition strategies can be more suitable [DDD ch.3 p.66] `RULE` |
| The request asks to mandate a one-to-one mapping everywhere | Answer no: limiting the design to one-to-one relationships would inhibit this flexibility [DDD ch.3 p.67] `RULE` |
| The request asks whether subdomains or contexts come first | Subdomains are discovered and bounded contexts are designed [DDD ch.3 p.67] `RULE` |
| anything else | HALT (`OUT_OF_SCOPE`) |

8. Emit the output template below, with a citation and a status token on every claim line, writing the filled slots in Portuguese per `../../rules/ddd-language.md`

## Halt conditions

| Trigger | Code |
|---|---|
| The request asks for the optimal size of a bounded context | `AMBIGUOUS_IN_BOOK` |
| The request asks whether this system should map contexts one-to-one to subdomains | `AMBIGUOUS_IN_BOOK` |
| The team count or the codebase ownership is unknown | `REQUIRES_ORG_INPUT` |
| Whether the domain experts' models conflict cannot be settled | `REQUIRES_BUSINESS_INPUT` |
| The request asks how two contexts integrate | `OUT_OF_SCOPE`, and the answer routes to `ddd-integration-patterns` |
| The request asks whether a context is a microservice | `OUT_OF_SCOPE`, and the answer routes to `ddd-microservice-boundaries` |
| The request asks for a context map notation | `UNDEFINED_IN_BOOK` |
| Two teams own one context and the ownership cannot be changed | `CONFLICT_WITH_PROJECT` |
| The needed claim cannot be pinned to a page in pp.59-73 | `CITATION_UNVERIFIED` |
| anything else | `OUT_OF_SCOPE` |

## Output template

```ddd-output
## DDD Bounded Context — <name>

- Subdomains inside it: <list>
- Widest valid boundary: <boundary> — the consistency of the ubiquitous language identifies the widest boundary [DDD ch.3 p.63] `RULE`
- Conflicting term: <term, or "none"> — its bounded context is the explicit context in which each smaller language can be applied [DDD ch.3 p.61] `RULE`
- Reason for extracting a finer-grained context: <new engineering teams | nonfunctional requirements | independent scaling | none> [DDD ch.3 p.64] `RULE`
- Coherent use cases preserved: <yes | no> — avoid decomposing them into multiple bounded contexts [DDD ch.3 p.64] `HEURISTIC`
- Boundary: <physical | logical | ownership> [DDD ch.3 p.67] `RULE`
- Teams working on it: <count> — no two teams can work on the same bounded context [DDD ch.3 p.68] `RULE`
- Ownership verdict: <conforms | violates> — a bounded context should be owned by only one team [DDD ch.3 p.68] `HEURISTIC`
- Lifecycle: decoupled from the rest, and free to evolve independently [DDD ch.3 p.72] `RULE`
- Interop: <filled by the interop rule>
```

## References

`../../references/ddd-part-1-strategic-design.md`,
`../../references/ddd-vocabulary.md`,
`../../references/ddd-case-study.md`,
`../../references/ddd-exercise-answers.md`,
`../../rules/ddd-source-of-truth.md`, `../../rules/ddd-citation.md`,
`../../rules/ddd-heuristic-status.md`, `../../rules/ddd-halt-protocol.md`,
`../../rules/ddd-required-inputs.md`, `../../rules/ddd-determinism.md`,
`../../rules/ddd-interop.md`, `../../rules/ddd-language.md`,
`../../rules/ddd-answer-contract.md`.

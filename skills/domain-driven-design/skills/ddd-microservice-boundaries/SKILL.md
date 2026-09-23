---
name: ddd-microservice-boundaries
description: Places a service boundary inside the safe zone between bounded contexts and microservices, and compresses a public interface. Invoke when the request asks how small a microservice should be, whether a bounded context is a microservice, whether an aggregate can be its own service, whether a decomposition risks a distributed big ball of mud, or how to make a service deeper.
---

# DDD Microservice Boundaries

## Source

Page scope: `[DDD ch.14 pp.251-258]`. This skill may cite no other page, except
the pack-shared ranges in `../../rules/ddd-source-of-truth.md`.

Pages 243-250 of the same chapter are deliberately outside this scope: they
argue a position and print no decidable rule. See
`../../references/ddd-microservices-argument.md`.

## Rules

1. The bounded context is the boundary of a model, a subdomain bounds a business capability, while aggregate and value objects are transactional boundaries [DDD ch.14 p.251] `RULE`
2. Both microservices and bounded contexts are physical boundaries [DDD ch.14 p.251] `RULE`
3. Microservices, as bounded contexts, are owned by a single team [DDD ch.14 p.251] `RULE`
4. As in bounded contexts, conflicting models cannot be implemented in a microservice [DDD ch.14 p.251] `RULE`
5. Microservices are indeed bounded contexts [DDD ch.14 p.251] `RULE`
6. The relationship between microservices and bounded contexts is not symmetric: although microservices are bounded contexts, not every bounded context is a microservice [DDD ch.14 p.252] `RULE`
7. Bounded contexts denote the boundaries of the largest valid monolith, a viable design option that protects the consistency of its ubiquitous language [DDD ch.14 p.252] `RULE`
8. The different decompositions to bounded contexts attribute different requirements, such as different teams' sizes and structures and lifecycle dependencies [DDD ch.14 p.252] `RULE`
9. The area between the bounded contexts and microservices is safe: these are valid design options, per Figure 14-10 [DDD ch.14 p.253] `RULE`
10. If the system is not decomposed into proper bounded contexts it will result in a big ball of mud, and if it is decomposed past the microservices threshold, in a distributed big ball of mud [DDD ch.14 p.253] `RULE`
11. While bounded contexts impose limits on the widest valid boundaries, the aggregate pattern does the opposite: the aggregate's boundary is the narrowest boundary possible [DDD ch.14 p.253] `RULE`
12. Decomposing an aggregate into multiple physical services, or bounded contexts, is not only suboptimal but leads to undesired consequences [DDD ch.14 p.253] `RULE`
13. An aggregate is an indivisible business functionality unit that encapsulates the complexities of its internal business rules, invariants, and logic [DDD ch.14 p.253] `RULE`
14. The stronger the aggregate's relationship is with the other business entities of its subdomain, the shallower it will be as an individual service [DDD ch.14 p.254] `RULE`
15. There will be cases in which having an aggregate as a service will produce a modular design, however much more often such fine-grained services will increase the overarching system's global complexity [DDD ch.14 p.254] `RULE`
16. A more balanced heuristic for designing microservices is to align the services with the boundaries of business subdomains [DDD ch.14 p.254] `HEURISTIC`
17. From a technical standpoint, subdomains represent sets of coherent use cases: using the same model, working on the same or closely related data, and having a strong functional relationship [DDD ch.14 p.254] `RULE`
18. The subdomains' granularity and the focus on the functionality makes subdomains naturally deep modules [DDD ch.14 p.255] `RULE`
19. Splitting the coherent use cases apart in many cases would result in a more complex public interface and thus shallower modules [DDD ch.14 p.255] `RULE`
20. Aligning microservices with subdomains is a safe heuristic that produces optimal solutions for the majority of microservices [DDD ch.14 p.255] `HEURISTIC`
21. There will be cases where other boundaries will be more efficient: staying in the wider, linguistic boundaries of the bounded context, or resorting to an aggregate as a microservice [DDD ch.14 p.255] `RULE`
22. The solution depends not only on the business domain but also on the organization's structure, business strategy, and nonfunctional requirements [DDD ch.14 p.255] `RULE`
23. The open-host service decouples the bounded context's model of the business domain from the model used for integration with other components [DDD ch.14 p.255] `RULE`
24. Introducing the published language reduces the system's global complexity, and having a simpler public interface over the same implementation makes the service deeper [DDD ch.14 p.255] `RULE`
25. Traditionally the anticorruption layer belongs to the bounded context it protects, and this notion can be taken a step further and implemented as a standalone service [DDD ch.14 p.256] `RULE`
26. The anticorruption layer service reduces both the local complexity of the consuming bounded context and the system's global complexity [DDD ch.14 p.256] `RULE`
27. A microservice defines the smallest valid boundary of a service, while a bounded context protects the consistency of the encompassed model and represents the widest valid boundaries [DDD ch.14 p.257] `RULE`
28. Defining boundaries to be wider than their bounded contexts will result in a big ball of mud, while boundaries that are smaller than microservices will lead to a distributed big ball of mud [DDD ch.14 p.257] `RULE`

## Inputs

| Input | Reason code | Who can supply it | Citation |
|---|---|---|---|
| The organization's structure | `REQUIRES_ORG_INPUT` | team lead | [DDD ch.14 p.255] `RULE` |
| The business strategy | `REQUIRES_BUSINESS_INPUT` | business | [DDD ch.14 p.255] `RULE` |
| The nonfunctional requirements | `REQUIRES_ORG_INPUT` | team lead | [DDD ch.14 p.255] `RULE` |
| Whether the aggregate communicates with other aggregates in its subdomain | `REQUIRES_BUSINESS_INPUT` | domain expert | [DDD ch.14 p.254] `RULE` |
| Whether it shares value objects with other aggregates | `REQUIRES_BUSINESS_INPUT` | domain expert | [DDD ch.14 p.254] `RULE` |
| How likely the aggregate's business logic changes will affect other components of the subdomain | `REQUIRES_BUSINESS_INPUT` | domain expert | [DDD ch.14 p.254] `RULE` |
| anything else | `OUT_OF_SCOPE` | n/a | HALT |

The three aggregate rows are the questions p.254 prints. The page prints no
verdict over them; see step 4.

## Procedure

1. Name the candidate service, its bounded context and the subdomains inside it, per `../../rules/ddd-required-inputs.md`
2. Place the candidate against the safe zone, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| The boundary sits between the bounded context and the microservice | Safe: the area between the bounded contexts and microservices is safe, per Figure 14-10 [DDD ch.14 p.253] `RULE` |
| The boundary is wider than the bounded context | It will result in a big ball of mud [DDD ch.14 p.257] `RULE` |
| The boundary is narrower than a microservice | It will lead to a distributed big ball of mud [DDD ch.14 p.257] `RULE` |
| anything else | HALT (`OUT_OF_SCOPE`) |

3. Resolve the bounded context question with the asymmetry of p.252, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| The candidate is a microservice | It is also a bounded context: microservices are indeed bounded contexts [DDD ch.14 p.251] `RULE` |
| The candidate is a bounded context | It is not necessarily a microservice: the relationship is not symmetric [DDD ch.14 p.252] `RULE` |
| Two conflicting models would be implemented in the candidate | Violates: conflicting models cannot be implemented in a microservice [DDD ch.14 p.251] `RULE` |
| Two teams would own the candidate | Violates: microservices, as bounded contexts, are owned by a single team [DDD ch.14 p.251] `RULE` |
| anything else | HALT (`OUT_OF_SCOPE`) |

4. Handle the aggregate-as-a-service question, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| The request asks to decompose an aggregate across services or bounded contexts | Refuse: it is not only suboptimal but leads to undesired consequences [DDD ch.14 p.253] `RULE` |
| The request asks whether one aggregate can be its own service | Print the three questions of p.254 and halt on the choice: HALT (`AMBIGUOUS_IN_BOOK`) |
| The aggregate's relationship with the other business entities of its subdomain is strong | The shallower it will be as an individual service [DDD ch.14 p.254] `RULE` |
| A nonfunctional requirement forces an aggregate to be a microservice | Legal: there will be cases where resorting to an aggregate as a microservice is more efficient [DDD ch.14 p.255] `RULE` |
| anything else | HALT (`OUT_OF_SCOPE`) |

5. Apply the balanced heuristic, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| The organization's structure, business strategy and nonfunctional requirements are known and impose nothing else | Align the services with the boundaries of business subdomains, a safe heuristic that produces optimal solutions for the majority of microservices [DDD ch.14 p.255] `HEURISTIC` |
| The candidate would split a set of coherent use cases | Do not split: it would result in a more complex public interface and thus shallower modules [DDD ch.14 p.255] `RULE` |
| Any of the three facts is unknown | HALT (`REQUIRES_ORG_INPUT`) |
| anything else | HALT (`OUT_OF_SCOPE`) |

6. Compress the public interface, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| The service's implementation model is exposed to its consumers | Open-host service: introduce the published language, which reduces the system's global complexity [DDD ch.14 p.255] `RULE` |
| The consuming bounded context carries the integration complexity of a producer | Anticorruption layer as a standalone service, which reduces both the local and the global complexity [DDD ch.14 p.256] `RULE` |
| anything else | HALT (`OUT_OF_SCOPE`) |

7. Emit the output template below, with a citation and a status token on every claim line, writing the filled slots in Portuguese per `../../rules/ddd-language.md`

## Halt conditions

| Trigger | Code |
|---|---|
| The request asks whether one aggregate should be its own service | `AMBIGUOUS_IN_BOOK`, p.254 prints three questions and no verdict |
| The organization's structure, business strategy or nonfunctional requirements are unknown | `REQUIRES_ORG_INPUT` |
| The request asks for a line count, file count or method count per microservice | `OUT_OF_SCOPE`, that definition is named mistaken in the demoted card |
| The request asks to score a service's depth numerically | `AMBIGUOUS_IN_BOOK` |
| The request asks about service or microservice definitions, deep modules or the granularity curve | `OUT_OF_SCOPE`, and the answer routes to `../../references/ddd-microservices-argument.md` |
| The request asks how the services communicate | `OUT_OF_SCOPE`, and the answer routes to `ddd-communication-patterns` |
| The request asks where the bounded context boundary itself goes | `OUT_OF_SCOPE`, and the answer routes to `ddd-bounded-contexts` |
| An aggregate is already dissected across two services and cannot be reunited | `CONFLICT_WITH_PROJECT` |
| The needed claim cannot be pinned to a page in pp.251-258 | `CITATION_UNVERIFIED` |
| anything else | `OUT_OF_SCOPE` |

## Output template

```ddd-output
## DDD Microservice Boundary — <candidate service>

- Bounded context: <name> — the widest valid boundary [DDD ch.14 p.257] `RULE`
- Aggregate: <name> — the narrowest boundary possible [DDD ch.14 p.253] `RULE`
- Candidate boundary: <bounded context | subdomain | aggregate>
- Safe boundaries: <inside | wider than the bounded context | narrower than a microservice> [DDD ch.14 p.253] `RULE`
- Result if the boundary is misplaced: <big ball of mud | distributed big ball of mud | none> [DDD ch.14 p.257] `RULE`
- Balanced heuristic: align the services with the boundaries of business subdomains [DDD ch.14 p.255] `HEURISTIC`
- Coherent use cases preserved: <yes | no> — splitting them would result in shallower modules [DDD ch.14 p.255] `RULE`
- Aggregate as a service: <not asked | AMBIGUOUS_IN_BOOK, three questions printed without a verdict> [DDD ch.14 p.254] `RULE`
- Public interface: <compressed by an open-host service | compressed by an anticorruption layer as a standalone service | unchanged> [DDD ch.14 p.255] `RULE`
- Team ownership: one team, as for any bounded context [DDD ch.14 p.251] `RULE`
- Who supplied the organization and strategy facts: <team lead | business>
- Interop: <filled by the interop rule>
```

## References

`../../references/ddd-part-4-relationships.md`,
`../../references/ddd-microservices-argument.md`,
`../../references/ddd-case-study.md`,
`../../references/ddd-exercise-answers.md`,
`../../rules/ddd-source-of-truth.md`, `../../rules/ddd-citation.md`,
`../../rules/ddd-heuristic-status.md`, `../../rules/ddd-halt-protocol.md`,
`../../rules/ddd-required-inputs.md`, `../../rules/ddd-determinism.md`,
`../../rules/ddd-interop.md`, `../../rules/ddd-language.md`,
`../../rules/ddd-answer-contract.md`.

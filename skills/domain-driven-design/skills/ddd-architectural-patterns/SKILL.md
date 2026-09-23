---
name: ddd-architectural-patterns
description: Selects or audits the architecture of one component: layered, ports & adapters, or CQRS, including the layer inventories, the service layer rule, layers versus tiers, and the projection of read models. Invoke when the request mentions layers, a service or application layer, an infrastructure layer, ports and adapters, hexagonal or onion or clean architecture, CQRS, read models, projections, or a checkpoint-based catch-up subscription.
---

# DDD Architectural Patterns

## Source

Page scope: `[DDD ch.8 pp.143-162]`. This skill may cite no other page, except
the pack-shared ranges in `../../rules/ddd-source-of-truth.md`.

This is the **sole interop origin** of the pack. See
`../../rules/ddd-interop.md`.

## Rules

1. Architectural patterns introduce organizational principles for the different aspects of a codebase and present clear boundaries between them [DDD ch.8 p.143] `RULE`
2. The layered architecture organizes the codebase into horizontal layers, with each layer addressing one technical concern [DDD ch.8 p.144] `RULE`
3. In its classic form, the layered architecture consists of three layers: the presentation layer, the business logic layer, and the data access layer [DDD ch.8 p.144] `RULE`
4. The presentation layer implements the program's user interface for interactions with its consumers [DDD ch.8 p.144] `RULE`
5. Strictly speaking, the presentation layer is the program's public interface [DDD ch.8 p.145] `RULE`
6. The business logic layer is responsible for implementing and encapsulating the program's business logic [DDD ch.8 p.145] `RULE`
7. The data access layer provides access to persistence mechanisms [DDD ch.8 p.145] `RULE`
8. The layers are integrated in a top-down communication model: each layer can hold a dependency only on the layer directly beneath it [DDD ch.8 p.146] `RULE`
9. The service layer defines an application's boundary with a layer of services that establishes a set of available operations and coordinates the application's response in each operation [DDD ch.8 p.147] `RULE`
10. The service layer is a logical boundary, not a physical service [DDD ch.8 p.148] `RULE`
11. The service layer acts as a façade for the business logic layer [DDD ch.8 p.148] `RULE`
12. A service layer is not always necessary: when the business logic is implemented as a transaction script, it essentially is a service layer [DDD ch.8 p.150] `RULE`
13. The service layer is required if the business logic pattern requires external orchestration, as in the case of the active record pattern [DDD ch.8 p.150] `RULE`
14. The dependency between the business logic and the data access layers makes the layered architecture a good fit for business logic implemented using the transaction script or active record pattern [DDD ch.8 p.150] `RULE`
15. The pattern makes it challenging to implement a domain model, because business entities should have no dependency and no knowledge of the underlying infrastructure [DDD ch.8 p.151] `HEURISTIC`
16. A layer is a logical boundary, whereas a tier is a physical boundary [DDD ch.8 p.151] `RULE`
17. All layers in the layered architecture are bound by the same lifecycle: they are implemented, evolved, and deployed as one single unit [DDD ch.8 p.151] `RULE`
18. A tier is an independently deployable service, server, or system [DDD ch.8 p.151] `RULE`
19. The dependency inversion principle states that high-level modules, which implement the business logic, should not depend on low-level modules [DDD ch.8 p.152] `HEURISTIC`
20. The business logic layer takes the central role and doesn't depend on any of the system's infrastructural components [DDD ch.8 p.152] `RULE`
21. Both the presentation layer and data access layer represent integration with external components, unified into a single infrastructure layer [DDD ch.8 p.152] `RULE`
22. The core goal of the ports & adapters architecture is to decouple the system's business logic from its infrastructural components [DDD ch.8 p.153] `RULE`
23. The business logic layer defines ports that have to be implemented by the infrastructure layer, and the infrastructure layer implements adapters [DDD ch.8 p.153] `RULE`
24. The decoupling of the business logic from all technological concerns makes ports & adapters a perfect fit for business logic implemented with the domain model pattern [DDD ch.8 p.154] `RULE`
25. The ports & adapters architecture is also known as hexagonal architecture, onion architecture, and clean architecture [DDD ch.8 p.154] `RULE`
26. The CQRS pattern enables representation of the system's data in multiple persistent models [DDD ch.8 p.154] `RULE`
27. The CQRS pattern is based on the same organizational principles for business logic and infrastructural concerns as ports & adapters [DDD ch.8 p.154] `RULE`
28. There are two types of models: the command execution model and the read models [DDD ch.8 p.155] `RULE`
29. The command execution model is also the only model representing strongly consistent data, the system's source of truth [DDD ch.8 p.156] `RULE`
30. Proper implementation of CQRS allows for wiping out all data of a projection and regenerating it from scratch [DDD ch.8 p.156] `RULE`
31. Read models are read-only: none of the system's operations can directly modify the read models' data [DDD ch.8 p.156] `RULE`
32. For the catch-up subscription to work, the command execution model has to checkpoint all the appended or updated database records [DDD ch.8 p.157] `RULE`
33. The storage mechanism should also support the querying of records based on the checkpoint [DDD ch.8 p.157] `HEURISTIC`
34. The asynchronous projection method has apparent scaling and performance advantages, and is more prone to the challenges of distributed computing [DDD ch.8 p.158] `RULE`
35. It is advisable to always implement synchronous projection and, optionally, an additional asynchronous projection on top of it [DDD ch.8 p.159] `HEURISTIC`
36. A command can only operate on the strongly consistent command execution model [DDD ch.8 p.159] `RULE`
37. A query cannot directly modify any of the system's persisted state, neither the read models nor the command execution model [DDD ch.8 p.159] `RULE`
38. A command should always let the caller know whether it has succeeded or failed [DDD ch.8 p.159] `HEURISTIC`
39. The returned data should originate from the strongly consistent model, the command execution model [DDD ch.8 p.159] `HEURISTIC`
40. CQRS naturally lends itself to event-sourced domain models, because event sourcing makes it impossible to query records based on the aggregates' states [DDD ch.8 p.160] `RULE`
41. The three patterns should not be treated as systemwide organizational principles, nor necessarily as high-level architecture patterns for a whole bounded context [DDD ch.8 p.160] `HEURISTIC`
42. Even subdomains of the same type may require different business logic and architectural patterns [DDD ch.8 p.160] `RULE`
43. Enforcing a single, bounded, contextwide architecture will inadvertently lead to accidental complexity [DDD ch.8 p.160] `RULE`

## Inputs

| Input | Reason code | Who can supply it | Citation |
|---|---|---|---|
| Whether the system needs to work with the same data in multiple models | `REQUIRES_BUSINESS_INPUT` | business | [DDD ch.8 p.159] `RULE` |
| Which business logic pattern the component implements | `REQUIRES_BUSINESS_INPUT` | business | [DDD ch.8 p.150] `RULE` |
| anything else | `OUT_OF_SCOPE` | n/a | HALT |

Two facts are readable from the project and never halt: whether the storage
mechanism supports the querying of records based on the checkpoint
[DDD ch.8 p.157] `HEURISTIC`, and whether the command execution model
checkpoints all the appended or updated database records [DDD ch.8 p.157]
`RULE`.

## Procedure

1. Name the component, its bounded context and its business logic pattern; where the pattern is unknown, route to `ddd-design-heuristics` and return with its selection, per `../../rules/ddd-required-inputs.md`
2. Set the scope of the answer, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| The request asks for one architecture for the whole system or the whole bounded context | The patterns should not be treated as systemwide organizational principles [DDD ch.8 p.160] `HEURISTIC` |
| The request asks for the architecture of one component or subdomain | Proceed: even subdomains of the same type may require different architectural patterns [DDD ch.8 p.160] `RULE` |
| anything else | HALT (`OUT_OF_SCOPE`) |

3. Select the pattern from the business logic pattern, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| Transaction script | Layered architecture; the transaction script essentially is a service layer already [DDD ch.8 p.150] `RULE` |
| Active record | Layered architecture with a service layer, because the pattern requires external orchestration [DDD ch.8 p.150] `RULE` |
| Domain model | Ports & adapters, a perfect fit for business logic implemented with the domain model pattern [DDD ch.8 p.154] `RULE` |
| Event-sourced domain model | CQRS, since event sourcing makes it impossible to query records based on the aggregates' states [DDD ch.8 p.160] `RULE` |
| The system has to work with the same data in multiple models | CQRS can be useful, whatever the business logic pattern [DDD ch.8 p.159] `RULE` |
| anything else | HALT (`OUT_OF_SCOPE`) |

4. Place each element of the component in exactly one layer, using the inventories the book prints, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| A graphical user interface, a command-line interface, an API for programmatic integration, a subscription to events in a message broker, or a message topic for publishing outgoing events | Presentation layer [DDD ch.8 p.145] `RULE` |
| The implementation of business decisions | Business logic layer, the place where business decisions are implemented [DDD ch.8 p.145] `RULE` |
| A database, a cloud-based object storage, an internal message bus, or an API provided by an external system | Data access layer [DDD ch.8 p.146] `RULE` |
| Orchestration of a public operation across the underlying layers | Service layer, a façade for the business logic layer [DDD ch.8 p.148] `RULE` |
| anything else | HALT (`OUT_OF_SCOPE`) |

5. Audit the dependency direction, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| Each layer holds a dependency only on the layer directly beneath it | Conforms to the layered architecture [DDD ch.8 p.146] `RULE` |
| The business logic layer depends on the infrastructure layer | Reverse the relationship, to conform with the dependency inversion principle [DDD ch.8 p.152] `HEURISTIC` |
| The business logic layer defines ports and the infrastructure layer implements adapters | Conforms to ports & adapters [DDD ch.8 p.153] `RULE` |
| A physical boundary is called a layer | A layer is a logical boundary, whereas a tier is a physical boundary [DDD ch.8 p.151] `RULE` |
| anything else | HALT (`OUT_OF_SCOPE`) |

6. Where CQRS is selected, apply the projection table, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| A projection is needed and the storage mechanism supports querying records based on the checkpoint | Synchronous projection through the catch-up subscription: query after the last processed checkpoint, regenerate the read models, store the checkpoint of the last processed record [DDD ch.8 p.157] `RULE` |
| The checkpoint-based query returns inconsistent results | It is important to ensure that the checkpoint-based query returns consistent results [DDD ch.8 p.157] `RULE` |
| Additional scale is needed on top of a working synchronous projection | Add an asynchronous projection on top of it [DDD ch.8 p.159] `HEURISTIC` |
| Only an asynchronous projection is proposed | It is advisable to always implement synchronous projection first [DDD ch.8 p.159] `HEURISTIC` |
| anything else | HALT (`OUT_OF_SCOPE`) |

7. Audit the model segregation, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| A command operates on the strongly consistent command execution model | Conforms: a command can only operate on that model [DDD ch.8 p.159] `RULE` |
| A query modifies a read model or the command execution model | Violates: a query cannot directly modify any of the system's persisted state [DDD ch.8 p.159] `RULE` |
| An operation writes to a read model | Violates: read models are read-only [DDD ch.8 p.156] `RULE` |
| A command returns data originating from the strongly consistent model | Conforms: the returned data should originate from the command execution model [DDD ch.8 p.159] `HEURISTIC` |
| A command returns no indication of success or failure | A command should always let the caller know whether it has succeeded or failed [DDD ch.8 p.159] `HEURISTIC` |
| anything else | HALT (`OUT_OF_SCOPE`) |

8. Fill the `Interop` line, per `../../rules/ddd-interop.md`, and never let it change any verdict above
9. Emit the output template below, with a citation and a status token on every claim line, writing the filled slots in Portuguese per `../../rules/ddd-language.md`

## Halt conditions

| Trigger | Code |
|---|---|
| The business logic pattern of the component is unknown | `REQUIRES_BUSINESS_INPUT` |
| The request asks for one architecture for the whole bounded context | `OUT_OF_SCOPE`, the three patterns are not systemwide organizational principles |
| The request asks for a fixed number of layers beyond the three the book names | `OUT_OF_SCOPE` |
| The request asks for the concentric circles, the Dependency Rule, or the other principle families | `OUT_OF_SCOPE`, only the dependency inversion principle is in this book |
| The request asks how messages reach another bounded context | `OUT_OF_SCOPE`, and the answer routes to `ddd-communication-patterns` |
| The request asks for a repository or an ORM mapping layer | `UNDEFINED_IN_BOOK` |
| Producing the code would make a read model writable | `STRUCTURE_DIVERGENCE`, per `../../rules/ddd-structural-fidelity.md` |
| The codebase forces the business logic layer to depend on infrastructure and cannot be changed | `CONFLICT_WITH_PROJECT` |
| The needed claim cannot be pinned to a page in pp.143-162 | `CITATION_UNVERIFIED` |
| anything else | `OUT_OF_SCOPE` |

## Output template

```ddd-output
## DDD Architecture — <component>

- Business logic pattern: <transaction script | active record | domain model | event-sourced domain model>
- Architectural pattern: <layered | layered with a service layer | ports & adapters | CQRS> [DDD ch.8 p.154] `RULE`
- Basis: <the matching condition, one line>
- Presentation layer holds: <list> — the program's public interface [DDD ch.8 p.145] `RULE`
- Business logic layer holds: <list> — the place where business decisions are implemented [DDD ch.8 p.145] `RULE`
- Data access layer or infrastructure layer holds: <list> — access to persistence mechanisms [DDD ch.8 p.145] `RULE`
- Service layer: <present | absent> — a logical boundary, not a physical service [DDD ch.8 p.148] `RULE`
- Dependencies: <top-down, each layer on the one directly beneath it | inverted through ports> [DDD ch.8 p.146] `RULE`
- Layers versus tiers: a layer is a logical boundary, whereas a tier is a physical boundary [DDD ch.8 p.151] `RULE`
- Projection: <synchronous | synchronous plus asynchronous | not applicable> [DDD ch.8 p.159] `HEURISTIC`
- Model segregation: <conforms | violates> — a query cannot directly modify any of the system's persisted state [DDD ch.8 p.159] `RULE`
- Interop: <filled by the interop rule>
```

## References

`../../references/ddd-part-2-tactical-design.md`,
`../../references/ddd-terminology-mapping.md`,
`../../references/ddd-vocabulary.md`,
`../../references/ddd-not-in-this-book.md`,
`../../references/ddd-exercise-answers.md`,
`../../rules/ddd-source-of-truth.md`, `../../rules/ddd-citation.md`,
`../../rules/ddd-heuristic-status.md`, `../../rules/ddd-halt-protocol.md`,
`../../rules/ddd-required-inputs.md`, `../../rules/ddd-determinism.md`,
`../../rules/ddd-structural-fidelity.md`, `../../rules/ddd-interop.md`,
`../../rules/ddd-language.md`,
`../../rules/ddd-answer-contract.md`.

---
name: ddd-domain-model
description: Designs or audits a domain model: value objects, entities, aggregate boundaries, the aggregate root, domain events and domain services. Invoke when the request mentions aggregates, value objects, entities, an aggregate root, invariants, a transaction that touches two aggregates, referencing another aggregate, immutability, domain events emitted by an aggregate, or a stateless calculation across aggregates.
---

# DDD Domain Model

## Source

Page scope: `[DDD ch.6 pp.101-123]`. This skill may cite no other page, except
the pack-shared ranges in `../../rules/ddd-source-of-truth.md`, which include
the three by-the-book rules on p.303.

## Rules

1. The domain model pattern is intended to cope with cases of complex business logic: complicated state transitions, business rules, and invariants, rules that have to be protected at all times [DDD ch.6 p.102] `RULE`
2. A domain model is an object model of the domain that incorporates both behavior and data [DDD ch.6 p.103] `RULE`
3. The model should be devoid of any infrastructural or technological concerns, such as implementing calls to databases [DDD ch.6 p.103] `HEURISTIC`
4. The model's objects are plain old objects, implementing business logic without relying on infrastructural components or frameworks [DDD ch.6 p.103] `RULE`
5. A value object is an object that can be identified by the composition of its values [DDD ch.6 p.103] `RULE`
6. No explicit identification field is needed to identify a value object [DDD ch.6 p.104] `RULE`
7. Relying exclusively on the language's primitive data types to represent concepts of the business domain is known as the primitive obsession code smell [DDD ch.6 p.104] `RULE`
8. Value objects are implemented as immutable objects: a change to one of the fields conceptually creates a different value [DDD ch.6 p.107] `RULE`
9. A useful rule of thumb is to use value objects for the domain's elements that describe properties of other objects [DDD ch.6 p.108] `HEURISTIC`
10. An entity requires an explicit identification field to distinguish between the different instances of the entity [DDD ch.6 p.109] `RULE`
11. Except for very rare exceptions, the value of an entity's identification field should remain immutable throughout the entity's lifecycle [DDD ch.6 p.109] `HEURISTIC`
12. Contrary to value objects, entities are not immutable and are expected to change [DDD ch.6 p.110] `RULE`
13. Entities are not implemented independently, but only in the context of the aggregate pattern [DDD ch.6 p.110] `RULE`
14. The aggregate is a consistency enforcement boundary: its logic has to validate all incoming modifications and ensure the changes do not contradict its business rules [DDD ch.6 p.110] `RULE`
15. All processes or objects external to the aggregate are only allowed to read the aggregate's state [DDD ch.6 p.110] `RULE`
16. Its state can only be mutated by executing corresponding methods of the aggregate's public interface [DDD ch.6 p.110] `RULE`
17. An aggregate's public interface is responsible for validating the input and enforcing all of the relevant business rules and invariants [DDD ch.6 p.111] `RULE`
18. How commands are expressed in an aggregate's code is a matter of preference [DDD ch.6 p.111] `PREFERENCE`
19. The database used for storing aggregates has to support concurrency management [DDD ch.6 p.112] `RULE`
20. Since an aggregate's state can only be modified by its own business logic, the aggregate also acts as a transactional boundary [DDD ch.6 p.113] `RULE`
21. All changes to the aggregate's state should be committed transactionally as one atomic operation [DDD ch.6 p.113] `HEURISTIC`
22. No system operation can assume a multi-aggregate transaction [DDD ch.6 p.113] `RULE`
23. A change to an aggregate's state can only be committed individually, one aggregate per database transaction [DDD ch.6 p.113] `RULE`
24. The need to commit changes in multiple aggregates signals a wrong transaction boundary, and hence, wrong aggregate boundaries [DDD ch.6 p.113] `RULE`
25. The aggregate resembles a hierarchy of entities, all sharing transactional consistency [DDD ch.6 p.113] `RULE`
26. Only the information that is required by the aggregate's business logic to be strongly consistent should be a part of the aggregate [DDD ch.6 p.115] `HEURISTIC`
27. All information that can be eventually consistent should reside outside of the aggregate's boundary, for example as a part of another aggregate [DDD ch.6 p.115] `HEURISTIC`
28. The rule of thumb is to keep the aggregates as small as possible [DDD ch.6 p.115] `HEURISTIC`
29. External aggregates are referenced by ID, to reify that these objects do not belong to the aggregate's boundary [DDD ch.6 p.116] `RULE`
30. Only one entity should be designated as the aggregate's public interface, the aggregate root [DDD ch.6 p.116] `HEURISTIC`
31. A domain event is a message describing a significant event that has occurred in the business domain [DDD ch.6 p.117] `RULE`
32. Since domain events describe something that has already happened, their names should be formulated in the past tense [DDD ch.6 p.117] `HEURISTIC`
33. Aggregates should reflect the ubiquitous language: the name, data members, actions, and domain events all should be formulated in the bounded context's ubiquitous language [DDD ch.6 p.118] `HEURISTIC`
34. A domain service is a stateless object that implements the business logic, and in the vast majority of cases orchestrates calls to various components to perform a calculation or analysis [DDD ch.6 p.119] `RULE`
35. Domain services are not a loophole: the rule of one instance per transaction still holds true [DDD ch.6 p.119] `RULE`
36. A system's degrees of freedom are the data points needed to describe its state [DDD ch.6 p.120] `RULE`
37. The invariants reduce complexity: that is what both aggregate and value object patterns do, encapsulate invariants and thus reduce complexity [DDD ch.6 p.121] `RULE`
38. An aggregate can only be modified by its own methods [DDD ch.6 p.121] `RULE`
39. The data fields are read-only for external components, so that all the business logic related to the aggregate resides in its boundaries [DDD ch.6 p.122] `RULE`
40. Each transaction would affect only one instance of an aggregate [DDD app.A p.303] `RULE`
41. Instead of an ORM, each aggregate itself would define the transactional scope [DDD app.A p.303] `RULE`
42. The service layer would go on a very strict diet, and all the business logic would be refactored into the corresponding aggregates [DDD app.A p.303] `RULE`

## Inputs

| Input | Reason code | Who can supply it | Citation |
|---|---|---|---|
| The invariants: rules that have to be protected at all times | `REQUIRES_BUSINESS_INPUT` | domain expert | [DDD ch.6 p.102] `RULE` |
| Which data the business requires to be strongly consistent | `REQUIRES_BUSINESS_INPUT` | business | [DDD ch.6 p.115] `HEURISTIC` |
| Whether working on eventually consistent data can lead to an invalid system state | `REQUIRES_BUSINESS_INPUT` | domain expert | [DDD ch.6 p.116] `RULE` |
| Whether two objects can be modified simultaneously, or the rules of one depend on the state of another | `REQUIRES_BUSINESS_INPUT` | domain expert | [DDD ch.6 p.113] `HEURISTIC` |
| The bounded context's ubiquitous language, for every name in the model | `REQUIRES_BUSINESS_INPUT` | domain expert | [DDD ch.6 p.118] `HEURISTIC` |
| anything else | `OUT_OF_SCOPE` | n/a | HALT |

One fact here is readable from the project and never halts: the database used
for storing aggregates has to support concurrency management
[DDD ch.6 p.112] `RULE`.

## Procedure

1. Confirm the pattern fits: the domain model pattern is intended to cope with cases of complex business logic [DDD ch.6 p.102] `RULE`
2. Classify each concept, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| The object can be identified by the composition of its values | Value object [DDD ch.6 p.103] `RULE` |
| The object describes properties of another object | Value object, by the rule of thumb of p.108 [DDD ch.6 p.108] `HEURISTIC` |
| The object requires an explicit identification field to distinguish between its instances | Entity, implemented only in the context of the aggregate pattern [DDD ch.6 p.109] `RULE` |
| The object protects the consistency of its data and receives commands | Aggregate [DDD ch.6 p.110] `RULE` |
| The logic belongs to no aggregate or value object, or is relevant to several aggregates | Domain service, a stateless object [DDD ch.6 p.119] `RULE` |
| anything else | HALT (`OUT_OF_SCOPE`) |

3. Apply the inside/outside consistency test to each candidate member, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| The aggregate contains business logic that can lead to an invalid system state if it works on eventually consistent data | The data belongs inside the aggregate's boundary [DDD ch.6 p.116] `RULE` |
| The information can be eventually consistent | It resides outside the aggregate's boundary, for example as a part of another aggregate [DDD ch.6 p.115] `HEURISTIC` |
| Two objects can be modified simultaneously, or the business rules of one depend on the state of another | They share a transactional boundary [DDD ch.6 p.113] `HEURISTIC` |
| The consistency requirement is unknown | HALT (`REQUIRES_BUSINESS_INPUT`) |
| anything else | HALT (`OUT_OF_SCOPE`) |

4. Size the aggregate: the rule of thumb is to keep the aggregates as small as possible [DDD ch.6 p.115] `HEURISTIC`
5. Audit the transaction boundary, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| One aggregate instance is committed per database transaction | Conforms [DDD ch.6 p.113] `RULE` |
| Changes to two aggregate instances are committed in one transaction | Violates: a change to an aggregate's state can only be committed individually [DDD ch.6 p.113] `RULE` |
| The design needs changes in multiple aggregates | It signals a wrong transaction boundary, and hence, wrong aggregate boundaries [DDD ch.6 p.113] `RULE` |
| An ORM defines the transactional scope | Violates: instead of an ORM, each aggregate itself would define the transactional scope [DDD app.A p.303] `RULE` |
| anything else | HALT (`OUT_OF_SCOPE`) |

6. Audit the boundary crossings, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| An aggregate outside the boundary is referenced by ID | Conforms: external aggregates are referenced by ID [DDD ch.6 p.116] `RULE` |
| An object reference is held to an aggregate outside the boundary | Violates: referencing external aggregates by ID ensures that each aggregate has its own transactional boundary [DDD ch.6 p.116] `RULE` |
| An external component modifies the aggregate's state directly | Violates: the data fields are read-only for external components [DDD ch.6 p.122] `RULE` |
| An operation modifies an instance of an inner entity directly | Violates: it is accessible only through its aggregate root [DDD ch.6 p.117] `RULE` |
| Business logic sits in the service layer rather than the aggregate | Violates: all the business logic would be refactored into the corresponding aggregates [DDD app.A p.303] `RULE` |
| anything else | HALT (`OUT_OF_SCOPE`) |

7. Audit the value objects, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| The value object is immutable | Conforms: value objects are implemented as immutable objects [DDD ch.6 p.107] `RULE` |
| The value object is mutable | Violates: a change to one of the value object's fields conceptually creates a different value [DDD ch.6 p.107] `RULE` |
| The value object carries an explicit identification field | Violates: no explicit identification field is needed to identify a value object [DDD ch.6 p.104] `RULE` |
| Primitive data types represent concepts of the business domain | Primitive obsession code smell [DDD ch.6 p.104] `RULE` |
| anything else | HALT (`OUT_OF_SCOPE`) |

8. Name the domain events in the past tense, and check every name against the ubiquitous language, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| The event name is formulated in the past tense | Conforms: their names should be formulated in the past tense [DDD ch.6 p.117] `HEURISTIC` |
| The event name is an imperative | Violates: domain events describe something that has already happened [DDD ch.6 p.117] `HEURISTIC` |
| A name in the model is absent from the bounded context's ubiquitous language | Violates: aggregates should reflect the ubiquitous language [DDD ch.6 p.118] `HEURISTIC` |
| anything else | HALT (`OUT_OF_SCOPE`) |

9. Check the domain services against the one-instance rule: domain services are not a loophole, and the rule of one instance per transaction still holds true [DDD ch.6 p.119] `RULE`
10. Emit the output template below, with a citation and a status token on every claim line, writing the filled slots in Portuguese per `../../rules/ddd-language.md`

## Halt conditions

| Trigger | Code |
|---|---|
| The invariants have not been stated by a domain expert | `REQUIRES_BUSINESS_INPUT` |
| Which data has to be strongly consistent is unknown | `REQUIRES_BUSINESS_INPUT` |
| The request asks for a repository to load and save the aggregate | `UNDEFINED_IN_BOOK` |
| The request asks for a factory, a specification or a unit of work | `OUT_OF_SCOPE` |
| The request asks for ORM mapping guidance | `UNDEFINED_IN_BOOK` |
| The request asks for a maximum number of entities per aggregate | `AMBIGUOUS_IN_BOOK` |
| Producing the code would break a structural rule | `STRUCTURE_DIVERGENCE`, per `../../rules/ddd-structural-fidelity.md` |
| The request asks to model the aggregate's lifecycle as events | `OUT_OF_SCOPE`, and the answer routes to `ddd-event-sourced-domain-model` |
| The codebase commits two aggregate instances per transaction and cannot be changed | `CONFLICT_WITH_PROJECT` |
| The needed claim cannot be pinned to a page in pp.101-123 | `CITATION_UNVERIFIED` |
| anything else | `OUT_OF_SCOPE` |

## Output template

```ddd-output
## DDD Domain Model — <aggregate>

- Aggregate root: <entity> — only one entity should be designated as the aggregate's public interface [DDD ch.6 p.116] `HEURISTIC`
- Inside the boundary: <list> — required by the aggregate's business logic to be strongly consistent [DDD ch.6 p.115] `HEURISTIC`
- Outside the boundary, referenced by ID: <list> [DDD ch.6 p.116] `RULE`
- Value objects: <list> — implemented as immutable objects [DDD ch.6 p.107] `RULE`
- Entities: <list> — each requires an explicit identification field [DDD ch.6 p.109] `RULE`
- Commands: <list> — the state-modifying methods exposed as the public interface [DDD ch.6 p.111] `RULE`
- Domain events: <list, past tense> [DDD ch.6 p.117] `HEURISTIC`
- Domain services: <list, or "none"> — stateless objects [DDD ch.6 p.119] `RULE`
- Transaction boundary: one aggregate per database transaction [DDD ch.6 p.113] `RULE`
- Transactional scope defined by: the aggregate itself, not an ORM [DDD app.A p.303] `RULE`
- Violations found: <list, or "none">
- Interop: <filled by the interop rule>
```

## References

`../../references/ddd-part-2-tactical-design.md`,
`../../references/ddd-case-study.md`,
`../../references/ddd-vocabulary.md`,
`../../references/ddd-not-in-this-book.md`,
`../../references/ddd-exercise-answers.md`,
`../../rules/ddd-source-of-truth.md`, `../../rules/ddd-citation.md`,
`../../rules/ddd-heuristic-status.md`, `../../rules/ddd-halt-protocol.md`,
`../../rules/ddd-required-inputs.md`, `../../rules/ddd-determinism.md`,
`../../rules/ddd-structural-fidelity.md`, `../../rules/ddd-interop.md`,
`../../rules/ddd-language.md`,
`../../rules/ddd-answer-contract.md`.

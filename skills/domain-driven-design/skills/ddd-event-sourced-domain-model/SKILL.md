---
name: ddd-event-sourced-domain-model
description: Applies or audits the event-sourced domain model: the four-step operation script, the event store contract, the advantages and disadvantages, and the snapshot decision. Invoke when the request mentions event sourcing, an event store, projecting an aggregate's state from events, snapshots, an append-only log, GDPR deletion in an event store, or asks whether a history table or a logfile would do instead.
---

# DDD Event-Sourced Domain Model

## Source

Page scope: `[DDD ch.7 pp.125-142]`. This skill may cite no other page, except
the pack-shared ranges in `../../rules/ddd-source-of-truth.md`.

## Rules

1. The event-sourced domain model uses the event sourcing pattern to manage the aggregates' states: instead of persisting an aggregate's state, the model generates domain events describing each change [DDD ch.7 p.125] `RULE`
2. The event sourcing pattern introduces the dimension of time into the data model [DDD ch.7 p.127] `RULE`
3. A state-based table documents the current states but misses the story of how each record got to its current state [DDD ch.7 p.127] `RULE`
4. For the event sourcing pattern to work, all changes to an object's state should be represented and persisted as events, and these events become the system's source of truth [DDD ch.7 p.133] `HEURISTIC`
5. The database that stores the system's events is the only strongly consistent storage: the system's source of truth [DDD ch.7 p.133] `RULE`
6. The accepted name for the database that is used for persisting events is event store [DDD ch.7 p.133] `RULE`
7. The event store should not allow modifying or deleting the events, since it's append-only storage [DDD ch.7 p.133] `HEURISTIC`
8. At a minimum the event store has to support fetch of all events belonging to a specific business entity and append of the events [DDD ch.7 p.133] `RULE`
9. The expected version argument in the append method implements optimistic concurrency management; on a stale version the event store should raise a concurrency exception [DDD ch.7 p.133] `HEURISTIC`
10. All changes to an aggregate's state have to be expressed as domain events [DDD ch.7 p.134] `RULE`
11. I prefer the longer term event-sourced domain model, to state explicitly that event sourcing represents changes in the lifecycles of the domain model's aggregates [DDD ch.7 p.136] `PREFERENCE`
12. You can always reconstitute all the past states of an aggregate, which is how retroactive debugging works [DDD ch.7 p.137] `RULE`
13. Event sourcing provides deep insight into the system's state and behavior, and new projections can be added that leverage the existing events' data [DDD ch.7 p.137] `RULE`
14. The persisted domain events represent a strongly consistent audit log of everything that has happened to the aggregates' states [DDD ch.7 p.137] `RULE`
15. Laws oblige some business domains to implement such audit logs, and event sourcing provides this out of the box [DDD ch.7 p.137] `RULE`
16. When using event sourcing, you can query the exact events that were concurrently appended to the event store and make a business domain-driven decision [DDD ch.7 p.137] `RULE`
17. Successful implementation of the pattern demands training of the team and time to get used to the new way of thinking [DDD ch.7 p.138] `RULE`
18. The strict definition of event sourcing says that events are immutable, so adjusting the event's schema is not as simple as changing a table's schema [DDD ch.7 p.138] `RULE`
19. Implementation of event sources introduces numerous architectural moving parts, making the overall design more complicated [DDD ch.7 p.138] `RULE`
20. It is important to benchmark a projection's impact on performance: the effect of working with hundreds or thousands of events [DDD ch.7 p.138] `RULE`
21. The results should be compared with the expected lifespan of an aggregate, the number of events expected to be recorded during an average lifespan [DDD ch.7 p.138] `HEURISTIC`
22. The snapshot pattern is an optimization that has to be justified: if the aggregates in your system won't persist 10,000+ events, implementing the snapshot pattern is just an accidental complexity [DDD ch.7 p.139] `RULE`
23. All events belonging to an instance of an aggregate should reside in a single shard [DDD ch.7 p.140] `HEURISTIC`
24. Physical deletion is addressed with the forgettable payload pattern: sensitive information is included in the events in encrypted form and the encryption key is deleted from an external key storage [DDD ch.7 p.140] `RULE`

## Inputs

| Input | Reason code | Who can supply it | Citation |
|---|---|---|---|
| Whether laws oblige the business domain to implement an audit log | `REQUIRES_BUSINESS_INPUT` | business | [DDD ch.7 p.137] `RULE` |
| Whether the system is managing money or monetary transactions | `REQUIRES_BUSINESS_INPUT` | business | [DDD ch.7 p.137] `RULE` |
| Whether the business needs deep insight into the system's state and behavior | `REQUIRES_BUSINESS_INPUT` | business | [DDD ch.7 p.137] `RULE` |
| The expected lifespan of an aggregate, in number of events | measurement | measurement | [DDD ch.7 p.138] `HEURISTIC` |
| The measured impact of a projection on performance | measurement | measurement | [DDD ch.7 p.138] `RULE` |
| Whether the team has experience implementing event-sourced systems | `REQUIRES_ORG_INPUT` | team lead | [DDD ch.7 p.138] `RULE` |
| anything else | `OUT_OF_SCOPE` | n/a | HALT |

The two measurement rows are the only inputs in the pack that neither the
business nor the organization answers. The book says to benchmark them, and the
HALT block fills `Who can supply it` with `measurement`.

## Procedure

1. Confirm the pattern fits: the business logic is complex and belongs to a core subdomain, and the requirement is that all changes to an aggregate's state be expressed as domain events [DDD ch.7 p.134] `RULE`
2. Apply the four-step script to every operation, in this order, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| The operation begins | Load the aggregate's domain events [DDD ch.7 p.134] `RULE` |
| The events are loaded | Reconstitute a state representation: project the events into a state representation that can be used to make business decisions [DDD ch.7 p.134] `RULE` |
| The state is projected | Execute the aggregate's command to execute the business logic, and consequently, produce new domain events [DDD ch.7 p.134] `RULE` |
| New domain events exist | Commit the new domain events to the event store [DDD ch.7 p.134] `RULE` |
| anything else | HALT (`OUT_OF_SCOPE`) |

3. Audit the event store against its minimum contract, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| The store supports fetch of all events belonging to a specific business entity, and append of the events | Conforms to the minimum the pattern needs [DDD ch.7 p.133] `RULE` |
| The store allows modifying or deleting the events | Violates: the event store should not allow modifying or deleting the events [DDD ch.7 p.133] `HEURISTIC` |
| The append method carries no expected version argument | Violates: the argument is needed to implement optimistic concurrency management [DDD ch.7 p.133] `HEURISTIC` |
| Events of one aggregate instance are spread across shards | Violates: all events belonging to an instance of an aggregate should reside in a single shard [DDD ch.7 p.140] `HEURISTIC` |
| anything else | HALT (`OUT_OF_SCOPE`) |

4. Print the four advantages and the three disadvantages that apply, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| The business needs past states of an aggregate, or retroactive debugging | Time traveling: you can always reconstitute all the past states of an aggregate [DDD ch.7 p.137] `RULE` |
| The business needs additional projections over the existing events' data | Deep insight into the system's state and behavior [DDD ch.7 p.137] `RULE` |
| Laws oblige the business domain to provide an audit log, or the system is managing money | Audit log: the persisted domain events represent a strongly consistent audit log [DDD ch.7 p.137] `RULE` |
| Concurrent appends have to be judged case by case | Advanced optimistic concurrency management [DDD ch.7 p.137] `RULE` |
| The team has no experience implementing event-sourced systems | Learning curve: the pattern demands training of the team [DDD ch.7 p.138] `RULE` |
| The event schema is expected to change | Evolving the model: events are immutable [DDD ch.7 p.138] `RULE` |
| The design cannot absorb more moving parts | Architectural complexity: numerous architectural moving parts [DDD ch.7 p.138] `RULE` |
| anything else | HALT (`OUT_OF_SCOPE`) |

5. Decide the snapshot question by measurement, not by preference, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| The aggregates in the system won't persist 10,000+ events | Implementing the snapshot pattern is just an accidental complexity [DDD ch.7 p.139] `RULE` |
| The measured projection impact justifies the optimization | Implement the snapshot pattern, an optimization that has to be justified [DDD ch.7 p.139] `RULE` |
| The expected lifespan of an aggregate has not been measured | HALT (`REQUIRES_BUSINESS_INPUT`) with `Who can supply it: measurement` |
| anything else | HALT (`OUT_OF_SCOPE`) |

Before the optimization, the page names one check in the author's own voice:

```ddd-quote [DDD ch.7 p.139]
I recommend that you take a step back and double-check the aggregate's boundaries
```

6. Answer the three cheaper-alternative questions with the book's own rejections, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| The request proposes writing logs to a text file as an audit log | Rejected: such logs are not consistent, but rather, eventually inconsistent [DDD ch.7 p.140] `RULE` |
| The request proposes appending log records to a logs table in the same transaction | Rejected: a future engineer forgets to append a log record, and the log table's schema degrades into chaos [DDD ch.7 p.141] `RULE` |
| The request proposes a database trigger copying records into a history table | Rejected: the resultant history only includes the dry facts of what fields were changed, and misses why [DDD ch.7 p.141] `RULE` |
| anything else | HALT (`OUT_OF_SCOPE`) |

7. Handle physical deletion with the forgettable payload pattern: the encryption key is deleted from the key storage, so the sensitive information contained in the events is no longer accessible [DDD ch.7 p.140] `RULE`
8. Emit the output template below, with a citation and a status token on every claim line, writing the filled slots in Portuguese per `../../rules/ddd-language.md`

## Halt conditions

| Trigger | Code |
|---|---|
| Whether the law obliges an audit log is unknown | `REQUIRES_BUSINESS_INPUT` |
| The expected lifespan of an aggregate has not been benchmarked | `REQUIRES_BUSINESS_INPUT`, with `Who can supply it: measurement` |
| The request asks how to version or upgrade an event schema | `OUT_OF_SCOPE`, p.138 defers it to another book |
| The request asks for the querying architecture around the events | `OUT_OF_SCOPE`, and the answer routes to `ddd-architectural-patterns` |
| The request asks how the events reach other bounded contexts | `OUT_OF_SCOPE`, and the answer routes to `ddd-communication-patterns` |
| The request asks how to migrate an existing state-based history into events | `OUT_OF_SCOPE`, and the answer routes to `ddd-evolving-design-decisions` |
| The request asks for a repository interface to load and save the events | `UNDEFINED_IN_BOOK` |
| The event store in the project allows updates and cannot be changed | `CONFLICT_WITH_PROJECT` |
| The needed claim cannot be pinned to a page in pp.125-142 | `CITATION_UNVERIFIED` |
| anything else | `OUT_OF_SCOPE` |

## Output template

```ddd-output
## DDD Event-Sourced Domain Model — <aggregate>

- Source of truth: the events, persisted in the event store [DDD ch.7 p.133] `RULE`
- Operation script: load the events, project a state representation, execute the command, commit the new events [DDD ch.7 p.134] `RULE`
- Event store contract: <conforms | violates> — fetch of all events belonging to a specific business entity, and append [DDD ch.7 p.133] `RULE`
- Append-only: <yes | no> — the event store should not allow modifying or deleting the events [DDD ch.7 p.133] `HEURISTIC`
- Advantages: <time traveling | deep insight | audit log | advanced optimistic concurrency management> [DDD ch.7 p.137] `RULE`
- Disadvantages: <learning curve | evolving the model | architectural complexity> [DDD ch.7 p.138] `RULE`
- Measured lifespan of an aggregate: <number of events, or "not measured"> [DDD ch.7 p.138] `HEURISTIC`
- Snapshot: <implement | accidental complexity> — 10,000+ events is the stated bar [DDD ch.7 p.139] `RULE`
- Sharding: all events of one aggregate instance in a single shard [DDD ch.7 p.140] `HEURISTIC`
- Physical deletion: forgettable payload, with the encryption key in an external key storage [DDD ch.7 p.140] `RULE`
- Interop: <filled by the interop rule>
```

## References

`../../references/ddd-part-2-tactical-design.md`,
`../../references/ddd-vocabulary.md`,
`../../references/ddd-code-listings.md`,
`../../references/ddd-exercise-answers.md`,
`../../rules/ddd-source-of-truth.md`, `../../rules/ddd-citation.md`,
`../../rules/ddd-heuristic-status.md`, `../../rules/ddd-halt-protocol.md`,
`../../rules/ddd-required-inputs.md`, `../../rules/ddd-determinism.md`,
`../../rules/ddd-structural-fidelity.md`, `../../rules/ddd-interop.md`,
`../../rules/ddd-language.md`,
`../../rules/ddd-answer-contract.md`.

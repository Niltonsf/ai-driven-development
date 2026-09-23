---
name: ddd-communication-patterns
description: Designs or audits communication across component boundaries: model translation, the outbox, sagas and process managers, and the three event types of event-driven integration. Invoke when the request mentions publishing domain events, an outbox, a message relay, a saga, a process manager, an API gateway or message proxy for translation, event notification, event-carried state transfer, or a distributed big ball of mud.
---

# DDD Communication Patterns

## Source

Page scope: `[DDD ch.9 pp.163-181]` and `[DDD ch.15 pp.259-273]`. This skill may
cite no other page, except the pack-shared ranges in
`../../rules/ddd-source-of-truth.md`.

## Rules

1. The downstream bounded context can adapt the upstream model to its needs using an anticorruption layer, while the upstream can act as an open-host service [DDD ch.9 p.164] `RULE`
2. Stateless translation happens on the fly, as incoming or outgoing requests are issued [DDD ch.9 p.164] `RULE`
3. Stateful translation involves a more complicated translation logic that requires a database [DDD ch.9 p.164] `RULE`
4. The bounded context that owns the translation implements the proxy design pattern to interject the incoming and outgoing requests [DDD ch.9 p.164] `RULE`
5. An anticorruption layer implemented using an API gateway can be consumed by multiple downstream bounded contexts, and is often referred to as an interchange context [DDD ch.9 p.165] `RULE`
6. It is a common mistake to expose a published language for the model's objects and allow domain events to be published as they are [DDD ch.9 p.166] `RULE`
7. Translating messages to the published language enables differentiating between private events and public events [DDD ch.9 p.166] `RULE`
8. Model transformation that aggregates incoming data cannot be implemented using an API gateway, and requires its own persistent storage [DDD ch.9 p.168] `RULE`
9. Publishing the domain event right from the aggregate is bad for two reasons [DDD ch.9 p.170] `RULE`
10. The outbox pattern ensures reliable publishing of domain events [DDD ch.9 p.171] `RULE`
11. With a NoSQL database that doesn't support multidocument transactions, the outgoing domain events have to be embedded in the aggregate's record [DDD ch.9 p.172] `RULE`
12. The outbox pattern guarantees delivery of the messages at least once [DDD ch.9 p.173] `RULE`
13. A saga is a long-running business process that spans multiple transactions [DDD ch.9 p.173] `RULE`
14. The saga listens to the events emitted by the relevant components and issues subsequent commands to the other components [DDD ch.9 p.173] `RULE`
15. If one of the execution steps fails, the saga is in charge of issuing relevant compensating actions [DDD ch.9 p.173] `RULE`
16. The states of the involved components are eventually consistent, and no two transactions are atomic [DDD ch.9 p.176] `RULE`
17. Only the data within an aggregate's boundaries is strongly consistent; everything outside is eventually consistent [DDD ch.9 p.176] `RULE`
18. The saga pattern manages simple, linear flow: strictly speaking, a saga matches events to the corresponding commands [DDD ch.9 p.176] `RULE`
19. The process manager pattern is a central processing unit that maintains the state of the sequence and determines the next processing steps [DDD ch.9 p.177] `RULE`
20. As a simple rule of thumb, if a saga contains if-else statements to choose the correct course of action, it is probably a process manager [DDD ch.9 p.177] `HEURISTIC`
21. A saga is instantiated implicitly when a particular event is observed; a process manager has to be instantiated explicitly [DDD ch.9 p.177] `RULE`
22. The process manager has its explicit ID and persistent state [DDD ch.9 p.180] `RULE`
23. EDA refers to the communication between services, while event sourcing happens inside a service [DDD ch.15 p.260] `RULE`
24. An event is a message, but a message is not necessarily an event [DDD ch.15 p.260] `RULE`
25. An event is a message describing a change that has already happened, and a command is a message describing an operation that has to be carried out [DDD ch.15 p.261] `RULE`
26. A command can be rejected, while a recipient of an event cannot cancel the event [DDD ch.15 p.261] `RULE`
27. The only thing that can be done to overturn an event is to issue a compensating action, a command [DDD ch.15 p.261] `RULE`
28. An event's name should be formulated in the past tense [DDD ch.15 p.261] `HEURISTIC`
29. An event notification is a message regarding a change in the business domain that other components will react to [DDD ch.15 p.262] `RULE`
30. The event notification should not be verbose: the goal is to notify the interested parties about the event [DDD ch.15 p.262] `HEURISTIC`
31. Event-carried state transfer messages notify subscribers about changes in the producer's internal state and include all the data reflecting the change [DDD ch.15 p.263] `RULE`
32. Using event-carried state transfer messages is an asynchronous data replication mechanism [DDD ch.15 p.264] `RULE`
33. Domain events include all the information describing the event, so the consumer does not need to take any further action [DDD ch.15 p.265] `RULE`
34. No single domain event is supposed to expose a model rich enough to hold a local cache of the producer's data [DDD ch.15 p.266] `RULE`
35. Choosing the correct type of event message is what makes or breaks a distributed system [DDD ch.15 p.267] `RULE`
36. Treat events as an inherent part of the bounded context's public interface [DDD ch.15 p.271] `RULE`
37. Be wary of exposing implementation details when publishing domain events, especially in event-sourced aggregates [DDD ch.15 p.271] `RULE`
38. Using inappropriate types of events will derail an EDA-based system, inadvertently turning it into a big ball of mud [DDD ch.15 p.272] `RULE`

## Inputs

| Input | Reason code | Who can supply it | Citation |
|---|---|---|---|
| Whether the consumer can settle for eventually consistent data | `REQUIRES_BUSINESS_INPUT` | business | [DDD ch.15 p.272] `HEURISTIC` |
| Whether the consumer needs to read the last write in the producer's state | `REQUIRES_BUSINESS_INPUT` | business | [DDD ch.15 p.272] `HEURISTIC` |
| Which data is sensitive enough to keep out of the messaging infrastructure | `REQUIRES_BUSINESS_INPUT` | business | [DDD ch.15 p.263] `HEURISTIC` |
| Whether the business process spans multiple transactions | `REQUIRES_BUSINESS_INPUT` | domain expert | [DDD ch.9 p.173] `RULE` |
| anything else | `OUT_OF_SCOPE` | n/a | HALT |

One fact here is readable from the project: whether the database supports
multidocument transactions [DDD ch.9 p.172] `RULE`.

## Procedure

1. Name the producer, the consumers and the boundary the messages cross, per `../../rules/ddd-required-inputs.md`
2. Select the translation kind and its owner, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| The downstream is not willing to conform, and the translation happens on the fly | Stateless translation owned by the downstream anticorruption layer [DDD ch.9 p.164] `RULE` |
| The upstream protects its consumers from changes to its implementation model | Stateless translation owned by the upstream open-host service, using a published language [DDD ch.9 p.164] `RULE` |
| The translation has to aggregate the source data or unify data from multiple sources | Stateful translation, which requires a database [DDD ch.9 p.164] `RULE` |
| anything else | HALT (`OUT_OF_SCOPE`) |

3. Select the stateless implementation, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| The bounded contexts communicate synchronously | Embed the transformation logic in the bounded context's codebase [DDD ch.9 p.164] `RULE` |
| Offloading the translation logic to an external component is more cost-effective and convenient | An API gateway, which also alleviates managing multiple versions of the API [DDD ch.9 p.165] `RULE` |
| The bounded contexts communicate asynchronously | A message proxy subscribing to messages coming from the source bounded context [DDD ch.9 p.166] `RULE` |
| The translation has to aggregate incoming data | Not an API gateway: it requires its own persistent storage [DDD ch.9 p.168] `RULE` |
| anything else | HALT (`OUT_OF_SCOPE`) |

4. Audit the publishing of domain events, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| The event is published from inside the aggregate | Violates: publishing the domain event right from the aggregate is bad for two reasons [DDD ch.9 p.170] `RULE` |
| The application layer publishes the events after committing, with no outbox | Violates: the process can fail to publish the domain events after the transaction is committed [DDD ch.9 p.171] `RULE` |
| Both the updated aggregate's state and the new domain events are committed in the same atomic transaction, and a relay publishes them | Conforms to the outbox pattern [DDD ch.9 p.171] `RULE` |
| anything else | HALT (`OUT_OF_SCOPE`) |

5. Apply the outbox four steps in this order, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| The operation commits | Both the updated aggregate's state and the new domain events are committed in the same atomic transaction [DDD ch.9 p.171] `RULE` |
| The transaction is committed | A message relay fetches newly committed domain events from the database [DDD ch.9 p.171] `RULE` |
| The relay holds the events | The relay publishes the domain events to the message bus [DDD ch.9 p.171] `RULE` |
| Publishing succeeded | The relay either marks the events as published in the database or deletes them completely [DDD ch.9 p.171] `RULE` |
| The database does not support multidocument transactions | The outgoing domain events have to be embedded in the aggregate's record [DDD ch.9 p.172] `RULE` |
| anything else | HALT (`OUT_OF_SCOPE`) |

6. Select the relay style, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| The database exposes no notification of new records | Pull, a polling publisher; proper indexes have to be in place to minimize the load [DDD ch.9 p.172] `RULE` |
| The database can notify about updated or inserted records, or expose committed changes as streams | Push, transaction log tailing [DDD ch.9 p.173] `RULE` |
| anything else | HALT (`OUT_OF_SCOPE`) |

7. Choose between saga and process manager, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| The flow matches events to the corresponding commands | Saga: the saga pattern manages simple, linear flow [DDD ch.9 p.176] `RULE` |
| The flow contains if-else statements to choose the correct course of action | As a simple rule of thumb, it is probably a process manager [DDD ch.9 p.177] `HEURISTIC` |
| There is no central entity to trigger the process | A process manager, which has to be instantiated explicitly [DDD ch.9 p.177] `RULE` |
| The flow is used to compensate for improper aggregate boundaries | Violates: business operations that have to belong to the same aggregate require strongly consistent data [DDD ch.9 p.176] `RULE` |
| anything else | HALT (`OUT_OF_SCOPE`) |

8. Select the event type from the consumer's consistency requirement, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| The components can settle for eventually consistent data | Use the event-carried state transfer message [DDD ch.15 p.272] `HEURISTIC` |
| The consumer needs to read the last write in the producer's state | Issue an event notification message, with a subsequent query to fetch the producer's up-to-date state [DDD ch.15 p.272] `HEURISTIC` |
| The message has to describe a business event rather than a state change | A domain event, modeled as close as possible to the nature of the event in the business domain [DDD ch.15 p.267] `RULE` |
| The consistency requirement is unknown | HALT (`REQUIRES_BUSINESS_INPUT`) |
| anything else | HALT (`OUT_OF_SCOPE`) |

9. Audit the coupling of the event-driven integration, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| Two components depend on a strict order of execution, enforced by a processing delay | Temporal coupling: publish an event notification message, triggering the downstream component to fetch the data it needs [DDD ch.15 pp.268-270] `RULE` |
| Two components implement the same projection of the producer's data | Functional coupling: encapsulate the projection logic in the producer [DDD ch.15 pp.269-270] `RULE` |
| Subscribers are subscribed to all the domain events generated by an event-sourced model | Implementation coupling: expose a much more restrained set of events, or a different type of events [DDD ch.15 pp.269-270] `RULE` |
| The producer projects the model needed by the consumers and makes it part of its published language | Conforms to the consumer-driven contract pattern [DDD ch.15 p.270] `RULE` |
| anything else | HALT (`OUT_OF_SCOPE`) |

10. Apply the assume-the-worst checklist before declaring the design done, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| The design assumes a fast network or healthy servers | The network is going to be slow, and servers will fail at the most inconvenient moment [DDD ch.15 p.271] `RULE` |
| The design assumes ordered, unique delivery | Events will arrive out of order, and events will be duplicated [DDD ch.15 p.271] `RULE` |
| Messages are published without an outbox | Use the outbox pattern to publish messages reliably [DDD ch.15 p.271] `RULE` |
| Subscribers are unable to deduplicate or reorder | Ensure that the subscribers will be able to deduplicate the messages and identify and reorder out-of-order messages [DDD ch.15 p.271] `RULE` |
| A cross-bounded context process requires compensating actions | Leverage the saga and process manager patterns [DDD ch.15 p.271] `RULE` |
| The request asks for the deduplication or reordering technique itself | HALT (`UNDEFINED_IN_BOOK`) |
| anything else | HALT (`OUT_OF_SCOPE`) |

11. Emit the output template below, with a citation and a status token on every claim line, writing the filled slots in Portuguese per `../../rules/ddd-language.md`

## Halt conditions

| Trigger | Code |
|---|---|
| The consumer's consistency requirement is unknown | `REQUIRES_BUSINESS_INPUT` |
| The request asks for a deduplication or reordering technique | `UNDEFINED_IN_BOOK` |
| The request asks for pessimistic locking mechanics | `UNDEFINED_IN_BOOK` |
| The request asks which integration pattern the two contexts should use | `OUT_OF_SCOPE`, and the answer routes to `ddd-integration-patterns` |
| The request asks how the aggregate produces its events | `OUT_OF_SCOPE`, and the answer routes to `ddd-domain-model` |
| Producing the code would publish a domain event from inside the aggregate | `STRUCTURE_DIVERGENCE`, per `../../rules/ddd-structural-fidelity.md` |
| The codebase publishes events before committing and cannot be changed | `CONFLICT_WITH_PROJECT` |
| The needed claim cannot be pinned to a page in pp.163-181 or pp.259-273 | `CITATION_UNVERIFIED` |
| anything else | `OUT_OF_SCOPE` |

## Output template

```ddd-output
## DDD Communication — <producer> to <consumer>

- Translation: <stateless | stateful> model translation, by the <anticorruption layer | open-host service> [DDD ch.9 p.164] `RULE`
- Translation logic sits in: <the bounded context's codebase | an API gateway | a message proxy | a stateful transformation with its own storage> [DDD ch.9 p.165] `RULE`
- Publishing: <outbox | violation> — the outbox pattern ensures reliable publishing of domain events [DDD ch.9 p.171] `RULE`
- Relay: <pull, polling publisher | push, transaction log tailing> [DDD ch.9 p.173] `RULE`
- Delivery guarantee: at least once [DDD ch.9 p.173] `RULE`
- Process pattern: <saga | process manager | none> [DDD ch.9 p.177] `HEURISTIC`
- Event type: <event notification | event-carried state transfer | domain event> [DDD ch.15 p.272] `HEURISTIC`
- Consistency requirement that decided it: <eventually consistent | needs the last write> [DDD ch.15 p.272] `HEURISTIC`
- Couplings found: <temporal | functional | implementation | none> [DDD ch.15 p.269] `RULE`
- Events treated as part of the public interface: <yes | no> [DDD ch.15 p.271] `RULE`
- Interop: <filled by the interop rule>
```

## References

`../../references/ddd-part-2-tactical-design.md`,
`../../references/ddd-part-4-relationships.md`,
`../../references/ddd-vocabulary.md`,
`../../references/ddd-not-in-this-book.md`,
`../../references/ddd-exercise-answers.md`,
`../../rules/ddd-source-of-truth.md`, `../../rules/ddd-citation.md`,
`../../rules/ddd-heuristic-status.md`, `../../rules/ddd-halt-protocol.md`,
`../../rules/ddd-required-inputs.md`, `../../rules/ddd-determinism.md`,
`../../rules/ddd-structural-fidelity.md`, `../../rules/ddd-interop.md`,
`../../rules/ddd-language.md`,
`../../rules/ddd-answer-contract.md`.

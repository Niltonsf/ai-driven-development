# DDD Part IV: Relationships to Other Methodologies and Patterns

Chapters 14-16, PDF pages 243-291. The part opener is pp.241-242; see
`ddd-part-openers.md`.

Two stretches of this part are demoted to their own cards, because they print
narrative rather than decidable rules:

- Chapter 14, pp.243-250 — `ddd-microservices-argument.md`
- Chapter 16, pp.275-291 — `ddd-analytical-data.md`

What remains here is decidable: chapter 14 from p.251, and chapter 15 in full.

## Chapter 14 from p.251 — Microservices' boundaries

### Which DDD boundary maps to a microservice, p.251

- The bounded context is the boundary of a model, a subdomain bounds a business capability, while aggregate and value objects are transactional boundaries [DDD ch.14 p.251] `RULE`

### Bounded contexts, pp.251-253

- Both microservices and bounded contexts are physical boundaries [DDD ch.14 p.251] `RULE`
- Microservices, as bounded contexts, are owned by a single team [DDD ch.14 p.251] `RULE`
- As in bounded contexts, conflicting models cannot be implemented in a microservice [DDD ch.14 p.251] `RULE`
- Microservices are indeed bounded contexts [DDD ch.14 p.251] `RULE`
- The relationship between microservices and bounded contexts is not symmetric: although microservices are bounded contexts, not every bounded context is a microservice [DDD ch.14 p.252] `RULE`
- Bounded contexts denote the boundaries of the largest valid monolith, a viable design option that protects the consistency of its ubiquitous language [DDD ch.14 p.252] `RULE`
- The different decompositions to bounded contexts attribute different requirements, such as different teams' sizes and structures and lifecycle dependencies [DDD ch.14 p.252] `RULE`

That asymmetry is the whole point of p.252, and a skill that treats bounded
context and microservice as synonyms has already drifted.

### The safe zone, p.253, restated p.257

- The area between the bounded contexts and microservices is safe: these are valid design options, per Figure 14-10 [DDD ch.14 p.253] `RULE`
- If the system is not decomposed into proper bounded contexts it will result in a big ball of mud, and if it is decomposed past the microservices threshold, in a distributed big ball of mud [DDD ch.14 p.253] `RULE`
- A microservice defines the smallest valid boundary of a service, while a bounded context protects the consistency of the encompassed model and represents the widest valid boundaries [DDD ch.14 p.257] `RULE`
- Defining boundaries to be wider than their bounded contexts will result in a big ball of mud, while boundaries that are smaller than microservices will lead to a distributed big ball of mud [DDD ch.14 p.257] `RULE`

### The three candidate boundaries, pp.251-255

| Candidate | Verdict the book prints | Citation |
|---|---|---|
| Bounded context | The widest valid boundary; not every bounded context is a microservice | [DDD ch.14 p.252] `RULE` |
| Aggregate | The narrowest boundary possible; decomposing an aggregate into multiple physical services is suboptimal | [DDD ch.14 p.253] `RULE` |
| Subdomain | A safe heuristic that produces optimal solutions for the majority of microservices | [DDD ch.14 p.255] `HEURISTIC` |
| anything else | — | HALT (`OUT_OF_SCOPE`) |

- While bounded contexts impose limits on the widest valid boundaries, the aggregate pattern does the opposite: the aggregate's boundary is the narrowest boundary possible [DDD ch.14 p.253] `RULE`
- Decomposing an aggregate into multiple physical services, or bounded contexts, is not only suboptimal but leads to undesired consequences [DDD ch.14 p.253] `RULE`
- An aggregate is an indivisible business functionality unit that encapsulates the complexities of its internal business rules, invariants, and logic [DDD ch.14 p.253] `RULE`

### The three aggregate-as-service questions, printed without a verdict, pp.253-254

1. Does the aggregate in question communicate with other aggregates in its subdomain [DDD ch.14 p.254] `RULE`
2. Does it share value objects with other aggregates [DDD ch.14 p.254] `RULE`
3. How likely will the aggregate's business logic changes affect other components of the subdomain and vice versa [DDD ch.14 p.254] `RULE`

- The stronger the aggregate's relationship is with the other business entities of its subdomain, the shallower it will be as an individual service [DDD ch.14 p.254] `RULE`
- There will be cases in which having an aggregate as a service will produce a modular design, however much more often such fine-grained services will increase the overarching system's global complexity [DDD ch.14 p.254] `RULE`

The book prints the three questions and no scoring rule. A skill asked to decide
from them halts with `AMBIGUOUS_IN_BOOK`.

### Subdomains as the balanced heuristic, pp.254-255

- A more balanced heuristic for designing microservices is to align the services with the boundaries of business subdomains [DDD ch.14 p.254] `HEURISTIC`
- From a technical standpoint, subdomains represent sets of coherent use cases: using the same model, working on the same or closely related data, and having a strong functional relationship [DDD ch.14 p.254] `RULE`
- The subdomains' granularity and the focus on the functionality makes subdomains naturally deep modules [DDD ch.14 p.255] `RULE`
- Splitting the coherent use cases apart in many cases would result in a more complex public interface and thus shallower modules [DDD ch.14 p.255] `RULE`
- Aligning microservices with subdomains is a safe heuristic that produces optimal solutions for the majority of microservices [DDD ch.14 p.255] `HEURISTIC`
- There will be cases where other boundaries will be more efficient: staying in the wider, linguistic boundaries of the bounded context, or resorting to an aggregate as a microservice [DDD ch.14 p.255] `RULE`
- The solution depends not only on the business domain but also on the organization's structure, business strategy, and nonfunctional requirements [DDD ch.14 p.255] `RULE`

### Interface compression, pp.255-257

| Pattern | How it compresses the public interface | Citation |
|---|---|---|
| Open-host service | The published language exposes a more restrained model designed around integration needs, so a simpler function over the same logic makes the service deeper | [DDD ch.14 p.255] `RULE` |
| Anticorruption layer as a stand-alone service | The consuming context's business complexity is separated from the integration complexity, which is offloaded to the ACL service | [DDD ch.14 p.256] `RULE` |
| anything else | — | HALT (`OUT_OF_SCOPE`) |

- The open-host service decouples the bounded context's model of the business domain from the model used for integration with other components [DDD ch.14 p.255] `RULE`
- It allows evolving the service's implementation without impacting its consumers: the new implementation model can be translated to the existing published language [DDD ch.14 p.255] `RULE`
- Traditionally the anticorruption layer belongs to the bounded context it protects, and this notion can be taken a step further and implemented as a standalone service [DDD ch.14 p.256] `RULE`

## Chapter 15 — Event-Driven Architecture, pp.259-273

### The style, and what it is not

- Event-driven architecture is an architectural style in which a system's components communicate with one another asynchronously by exchanging event messages [DDD ch.15 p.259] `RULE`
- Careless application of EDA can turn a modular monolith into a distributed big ball of mud [DDD ch.15 p.259] `RULE`
- EDA refers to the communication between services, while event sourcing happens inside a service [DDD ch.15 p.260] `RULE`
- The events designed for event sourcing represent state transitions and are not intended to integrate the service with other system components [DDD ch.15 p.260] `RULE`

### Event versus command, pp.260-261

| Message | Definition | Can it be refused | Citation |
|---|---|---|---|
| Event | A message describing a change that has already happened | A recipient of an event cannot cancel the event | [DDD ch.15 p.261] `RULE` |
| Command | A message describing an operation that has to be carried out | The command's target can refuse to execute the command | [DDD ch.15 p.261] `RULE` |
| anything else | — | — | HALT (`OUT_OF_SCOPE`) |

- An event is a message, but a message is not necessarily an event [DDD ch.15 p.260] `RULE`
- The only thing that can be done to overturn an event is to issue a compensating action, a command, as it's carried out in the saga pattern [DDD ch.15 p.261] `RULE`
- Since an event describes something that has already happened, an event's name should be formulated in the past tense [DDD ch.15 p.261] `HEURISTIC`
- A typical event schema includes the event's metadata and its payload [DDD ch.15 p.261] `RULE`
- An event's payload not only describes the information conveyed by the event, but also defines the event's type [DDD ch.15 p.261] `RULE`

### The three event types, pp.262-267

| Type | Definition | Citation |
|---|---|---|
| Event notification | A message regarding a change in the business domain that other components will react to; it does not carry all the information needed to react | [DDD ch.15 p.262] `RULE` |
| Event-carried state transfer | A message notifying subscribers about changes in the producer's internal state, including all the data reflecting the change | [DDD ch.15 p.263] `RULE` |
| Domain event | A message describing a significant event in the business domain, containing all the data describing the event | [DDD ch.15 p.265] `RULE` |
| anything else | — | HALT (`OUT_OF_SCOPE`) |

- The event notification should not be verbose: the goal is to notify the interested parties about the event [DDD ch.15 p.262] `HEURISTIC`
- Succinct event notifications can be preferable for security: enforcing the recipient to query for the detailed information prevents sharing sensitive information over the messaging infrastructure [DDD ch.15 p.263] `HEURISTIC`
- Succinct event notifications can be preferable for concurrency: querying explicitly allows getting the up-to-date state when the information is sensitive to race conditions [DDD ch.15 p.263] `HEURISTIC`
- ECST messages come in two forms: a complete snapshot of the modified entity's state, or only the fields that were actually modified [DDD ch.15 p.264] `RULE`
- Using event-carried state transfer messages is an asynchronous data replication mechanism, and consumers can continue functioning even if the producer is not available [DDD ch.15 p.264] `RULE`
- Domain events include all the information describing the event, so the consumer does not need to take any further action to get the complete picture [DDD ch.15 p.265] `RULE`
- The modeling intent is different: event notifications are designed to alleviate integration, while domain events are intended to model and describe the business domain [DDD ch.15 p.265] `RULE`
- No single domain event is supposed to expose a model rich enough to hold a local cache of the producer's data [DDD ch.15 p.266] `RULE`
- Having external consumers interested in all the available domain events would result in suboptimal design [DDD ch.15 p.265] `RULE`

### The three couplings, with their fixes, pp.268-270

| Coupling | What it is | Fix | Citation |
|---|---|---|---|
| Temporal | Components depend on a strict order of execution, enforced by a processing delay that does not prevent incorrect order | The upstream component publishes an event notification message, triggering the downstream component to fetch the data it needs | [DDD ch.15 pp.268-270] `RULE` |
| Functional | Multiple components implementing the same business functionality, so if it changes, both components have to change simultaneously | Encapsulate the projection logic in the producer | [DDD ch.15 pp.269-270] `RULE` |
| Implementation | Subscribers are subscribed to all the domain events generated by the producer's event-sourced model, so a change in its implementation has to be reflected in both subscribers | Expose a much more restrained set of events, or a different type of events | [DDD ch.15 pp.269-270] `RULE` |
| anything else | — | — | HALT (`OUT_OF_SCOPE`) |

- Choosing the correct type of event message is what makes or breaks a distributed system [DDD ch.15 p.267] `RULE`
- Instead of exposing its implementation details, the producer can follow the consumer-driven contract pattern: project the model needed by the consumers and make it a part of the bounded context's published language [DDD ch.15 p.270] `RULE`

### The assume-the-worst checklist, p.271

- The network is going to be slow [DDD ch.15 p.271] `RULE`
- Servers will fail at the most inconvenient moment [DDD ch.15 p.271] `RULE`
- Events will arrive out of order [DDD ch.15 p.271] `RULE`
- Events will be duplicated [DDD ch.15 p.271] `RULE`
- Use the outbox pattern to publish messages reliably [DDD ch.15 p.271] `RULE`
- When publishing messages, ensure that the subscribers will be able to deduplicate the messages and identify and reorder out-of-order messages [DDD ch.15 p.271] `RULE`
- Leverage the saga and process manager patterns when orchestrating cross-bounded context processes that require issuing compensating actions [DDD ch.15 p.271] `RULE`
- Treat events as an inherent part of the bounded context's public interface [DDD ch.15 p.271] `RULE`
- Be wary of exposing implementation details when publishing domain events, especially in event-sourced aggregates [DDD ch.15 p.271] `RULE`

No deduplication or reordering technique is supplied. The halt for one is
`UNDEFINED_IN_BOOK`; see `ddd-not-in-this-book.md`.

### The consistency-requirement rule, p.272

| Consumer's consistency need | Event type | Citation |
|---|---|---|
| The components can settle for eventually consistent data | Use the event-carried state transfer message | [DDD ch.15 p.272] `HEURISTIC` |
| The consumer needs to read the last write in the producer's state | Issue an event notification message, with a subsequent query to fetch the producer's up-to-date state | [DDD ch.15 p.272] `HEURISTIC` |
| anything else | — | HALT (`REQUIRES_BUSINESS_INPUT`) |

- Evaluate the bounded contexts' consistency requirements as an additional heuristic for choosing the event type [DDD ch.15 p.272] `HEURISTIC`
- Using inappropriate types of events will derail an EDA-based system, inadvertently turning it into a big ball of mud [DDD ch.15 p.272] `RULE`
- Design an explicit set of public and private events [DDD ch.15 p.272] `RULE`
- Ensure that the system delivers the messages, even in the face of technical issues and outages [DDD ch.15 p.272] `RULE`
- Sparingly use domain events for communication with external bounded contexts [DDD ch.15 p.272] `RULE`

## Chapter 16 — Data Mesh

Demoted. See `ddd-analytical-data.md`.

## See also

`ddd-part-3-in-practice.md`, `ddd-microservices-argument.md`,
`ddd-analytical-data.md`, `../rules/ddd-heuristic-status.md`.

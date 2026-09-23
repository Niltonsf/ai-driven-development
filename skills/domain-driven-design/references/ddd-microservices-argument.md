# DDD: the microservices argument

Chapter 14, PDF pages 243-250. **Demoted to a reference card, deliberately.**

## Why this stretch is not a skill

The pages define terms and argue a position. They print no decidable rule:

- The deep-module test has no measurable input. A module is drawn as a
  rectangle whose width is its public interface and whose area is its logic,
  and no page supplies a unit for either.
- Its only worked example is a reductio: one method per service, shown failing.
- The granularity curve is a shape, not a threshold.

Decidable content starts at p.251, and `ddd-microservice-boundaries` owns
pp.251-258. A request that lands in pp.243-250 is answered from this card, or
halts.

## Service and microservice, pp.243-245

- A service is a mechanism that enables access to one or more capabilities, where the access is provided using a prescribed interface [DDD ch.14 p.243] `RULE`
- The prescribed interface is any mechanism for getting data in or out of a service, synchronous or asynchronous [DDD ch.14 p.243] `RULE`
- A service's public interface defines the service itself: the functionality exposed by the service [DDD ch.14 p.244] `RULE`
- A well-expressed interface is enough to describe the functionality implemented by a service [DDD ch.14 p.244] `RULE`
- Since a service is defined by its public interface, a microservice is a service with a micro-public interface [DDD ch.14 p.244] `RULE`
- Having a micro-public interface makes it easier to understand both the function of a single service and its integration with other system components [DDD ch.14 p.245] `RULE`
- Reducing a service's functionality also limits its reasons for change and makes the service more autonomous for development, management, and scale [DDD ch.14 p.245] `RULE`
- Microservices encapsulate their databases: exposing a database would make the public interface huge [DDD ch.14 p.245] `RULE`

## The method-as-a-service reductio, pp.245-246

- Applying the one method per service rule forces expanding the services' interfaces to account for integration-related concerns [DDD ch.14 p.245] `RULE`
- When visualized, the integrations and data flow between the resultant services resemble a typical distributed big ball of mud [DDD ch.14 p.245] `RULE`
- By decomposing the system to such fine-grained services we minimized the services' front doors, but had to add enormous staff only entrances to each service [DDD ch.14 p.246] `RULE`

## Local versus global complexity, pp.247-248

- The goal of the microservices architecture is to produce a flexible system [DDD ch.14 p.247] `RULE`
- A system cannot be built out of independent components: however decoupled, the services still have to be integrated and communicate with each other [DDD ch.14 p.247] `RULE`
- Local complexity is the complexity of each individual microservice, whereas global complexity is the complexity of the whole system [DDD ch.14 p.247] `RULE`
- Local complexity depends on the implementation of a service; global complexity is defined by the interactions and dependencies between the services [DDD ch.14 p.247] `RULE`
- Global complexity is reduced to a minimum by eliminating any interactions between the components, which may lead to the dreaded big ball of mud [DDD ch.14 p.247] `RULE`
- Optimizing only the local complexity but neglecting the system's global complexity produces the even more dreaded distributed big ball of mud [DDD ch.14 p.248] `RULE`
- To design a proper microservices-based system, we have to optimize both global and local complexities [DDD ch.14 p.248] `RULE`
- Setting the design goal of optimizing either one individually is a local optima; the global optima balances both complexities [DDD ch.14 p.248] `RULE`

## Deep versus shallow modules, pp.248-250

- A module in a software system is defined by its function and logic [DDD ch.14 p.248] `RULE`
- A function is what the module is supposed to do, its business functionality; the logic is how the module implements it [DDD ch.14 p.248] `RULE`
- The rectangle's top edge represents the module's function, or the complexity of its public interface, and the area represents its logic [DDD ch.14 pp.248-249] `RULE`
- Effective modules are deep: a simple public interface encapsulates complex logic [DDD ch.14 p.249] `RULE`
- A shallow module's public interface encapsulates much less complexity than a deep module [DDD ch.14 p.249] `RULE`
- The extreme case of a shallow module is a method whose public interface and logic are exactly the same, which adds accidental complexity to the overarching system [DDD ch.14 p.249] `RULE`
- Modules can denote both logical and physical boundaries, while microservices are strictly physical [DDD ch.14 p.249] `RULE`
- A deep module reduces the system's global complexity, while a shallow module increases it [DDD ch.14 p.250] `RULE`
- The mistaken definitions of a microservice as a service having no more than X lines of code, or as a service easier to rewrite than to modify, concentrate on the individual service while missing the system [DDD ch.14 p.250] `RULE`
- The threshold upon which a system can be decomposed into microservices is defined by the use cases of the system that the microservices are a part of [DDD ch.14 p.250] `RULE`
- If you keep decomposing past the microservices threshold, the deep services will become more and more shallow and their interfaces will grow back up [DDD ch.14 p.250] `RULE`

## The halt for this range

| Request | Code |
|---|---|
| Score a component's depth numerically | HALT (`AMBIGUOUS_IN_BOOK`), the model has no unit |
| Pick a line-count or file-count threshold for a microservice | HALT (`OUT_OF_SCOPE`), p.250 names that definition mistaken |
| Decide a boundary | Route to `ddd-microservice-boundaries`, pp.251-258 |
| anything else | HALT (`OUT_OF_SCOPE`) |

## See also

`ddd-part-4-relationships.md`, `ddd-not-in-this-book.md`,
`../rules/ddd-halt-protocol.md`.

# DDD vocabulary

Every term this book defines, with the page that defines it, and every term it
uses without defining.

A skill asked about a term in the first table answers from its page. A skill
asked about a term in the second table halts with `UNDEFINED_IN_BOOK`. A term in
neither table halts with `OUT_OF_SCOPE`.

## Strategic design

| Term | The book's definition | Citation |
|---|---|---|
| Business domain | A company's main area of activity | [DDD ch.1 p.29] `RULE` |
| Subdomain | A fine-grained area of business activity | [DDD ch.1 p.30] `RULE` |
| Core subdomain | What a company does differently from its competitors | [DDD ch.1 p.30] `RULE` |
| Generic subdomain | Business activities that all companies are performing in the same way | [DDD ch.1 p.32] `RULE` |
| Supporting subdomain | Activities that support the company's business but provide no competitive advantage | [DDD ch.1 p.32] `RULE` |
| Domain expert | Subject matter experts who know all the intricacies of the business, the knowledge authorities in the software's business domain | [DDD ch.1 p.43] `RULE` |
| Ubiquitous language | A single language for describing the business domain, cultivated instead of continuously translating domain knowledge | [DDD ch.2 p.51] `RULE` |
| Model | A simplified representation of a thing or phenomenon that intentionally emphasizes certain aspects while ignoring others | [DDD ch.2 p.53] `RULE` |
| Bounded context | The explicit context in which one of the smaller languages can be applied | [DDD ch.3 p.61] `RULE` |
| Contract | The touchpoints between bounded contexts | [DDD ch.4 p.75] `RULE` |
| Partnership | Integration coordinated in an ad hoc manner, two-way | [DDD ch.4 p.76] `RULE` |
| Shared kernel | A limited overlapping model that belongs to all participating bounded contexts | [DDD ch.4 p.85] `RULE` |
| Conformist | The consumer conforms to the service provider's model | [DDD ch.4 p.85] `RULE` |
| Anticorruption layer | The consumer translates the service provider's model into a model that fits the consumer's needs | [DDD ch.4 p.85] `RULE` |
| Open-host service | The service provider implements a published language, a model optimized for its consumers' needs | [DDD ch.4 p.85] `RULE` |
| Published language | The supplier's public protocol, expressed in an integration-oriented language | [DDD ch.4 p.81] `RULE` |
| Separate ways | It's less expensive to duplicate particular functionality than to collaborate and integrate it | [DDD ch.4 p.85] `RULE` |
| Context map | A visual representation of the system's bounded contexts and the integrations between them | [DDD ch.4 p.83] `RULE` |
| anything else | — | HALT (`OUT_OF_SCOPE`) |

## Tactical design

| Term | The book's definition | Citation |
|---|---|---|
| Transaction script | Organizes business logic by procedures where each procedure handles a single request from the presentation | [DDD ch.5 p.89] `RULE` |
| Active record | An object that wraps a row in a database table or view, encapsulates the database access, and adds domain logic on that data | [DDD ch.5 p.95] `RULE` |
| Domain model | An object model of the domain that incorporates both behavior and data | [DDD ch.6 p.103] `RULE` |
| Value object | An object that can be identified by the composition of its values | [DDD ch.6 p.103] `RULE` |
| Primitive obsession | Relying exclusively on the language's primitive data types to represent concepts of the business domain | [DDD ch.6 p.104] `RULE` |
| Entity | It requires an explicit identification field to distinguish between the different instances | [DDD ch.6 p.109] `RULE` |
| Aggregate | An entity whose goal is to protect the consistency of its data; a consistency enforcement boundary | [DDD ch.6 p.110] `RULE` |
| Command | The state-modifying methods exposed as an aggregate's public interface | [DDD ch.6 p.111] `RULE` |
| Aggregate root | The one entity designated as the aggregate's public interface | [DDD ch.6 p.116] `RULE` |
| Domain event | A message describing a significant event that has occurred in the business domain | [DDD ch.6 p.117] `RULE` |
| Domain service | A stateless object that implements business logic that doesn't belong to any aggregate or value object | [DDD ch.6 p.119] `RULE` |
| Degrees of freedom | The data points needed to describe a system's state | [DDD ch.6 p.120] `RULE` |
| Event sourcing | Persisting events documenting every change in an aggregate's lifecycle, instead of the current state | [DDD ch.7 p.127] `RULE` |
| Event store | The accepted name for the database that is used for persisting events | [DDD ch.7 p.133] `RULE` |
| Event-sourced domain model | Uses domain events exclusively for modeling the aggregates' lifecycles | [DDD ch.7 p.134] `RULE` |
| Snapshot | A process iterates new events, generates corresponding projections, and stores them in a cache | [DDD ch.7 p.139] `RULE` |
| Forgettable payload | All sensitive information is included in the events in encrypted form, and the key is deleted from an external key storage | [DDD ch.7 p.140] `RULE` |
| anything else | — | HALT (`OUT_OF_SCOPE`) |

## Architecture and communication

| Term | The book's definition | Citation |
|---|---|---|
| Layered architecture | Organizes the codebase into horizontal layers, with each layer addressing one technical concern | [DDD ch.8 p.144] `RULE` |
| Presentation layer | Implements the program's user interface for interactions with its consumers | [DDD ch.8 p.144] `RULE` |
| Business logic layer | Responsible for implementing and encapsulating the program's business logic | [DDD ch.8 p.145] `RULE` |
| Data access layer | Provides access to persistence mechanisms | [DDD ch.8 p.145] `RULE` |
| Service layer | Defines an application's boundary with a layer of services that establishes a set of available operations | [DDD ch.8 p.147] `RULE` |
| Tier | An independently deployable service, server, or system | [DDD ch.8 p.151] `RULE` |
| Ports & adapters | The business logic doesn't depend on any of the underlying layers | [DDD ch.8 p.153] `RULE` |
| Port and adapter | The business logic layer defines ports, and the infrastructure layer implements adapters, concrete implementations of the ports' interfaces | [DDD ch.8 p.153] `RULE` |
| CQRS | Enables representation of the system's data in multiple persistent models | [DDD ch.8 p.154] `RULE` |
| Command execution model | The single model devoted to executing operations that modify the system's state | [DDD ch.8 p.155] `RULE` |
| Read model | A precached projection, which can reside in a durable database, flat file, or in-memory cache | [DDD ch.8 p.156] `RULE` |
| Interchange context | A bounded context mainly in charge of transforming models for more convenient consumption by other components | [DDD ch.9 p.165] `RULE` |
| Outbox | Ensures reliable publishing of domain events by committing state and events in the same atomic transaction | [DDD ch.9 p.171] `RULE` |
| Saga | A long-running business process that spans multiple transactions, matching events to the corresponding commands | [DDD ch.9 p.173] `RULE` |
| Process manager | A central processing unit that maintains the state of the sequence and determines the next processing steps | [DDD ch.9 p.177] `RULE` |
| anything else | — | HALT (`OUT_OF_SCOPE`) |

## Practice, microservices and analytics

| Term | The book's definition | Citation |
|---|---|---|
| EventStorming | A low-tech activity for a group of people to brainstorm and rapidly model a business process | [DDD ch.12 p.211] `RULE` |
| Pain point | A point in the process that requires attention: bottlenecks, manual steps, missing documentation or knowledge | [DDD ch.12 p.215] `RULE` |
| Pivotal event | A significant business event indicating a change in context or phase | [DDD ch.12 p.216] `RULE` |
| Automation policy | A scenario in which an event triggers the execution of a command | [DDD ch.12 p.217] `RULE` |
| External system | Any system that is not a part of the domain being explored | [DDD ch.12 p.219] `RULE` |
| Big ball of mud | A haphazardly structured, sprawling, sloppy, spaghetti-code jungle | [DDD ch.11 p.206] `RULE` |
| Accidental complexity | The complexity caused by outdated design decisions | [DDD ch.11 p.206] `RULE` |
| Essential complexity | The inherent complexity of the business domain | [DDD ch.11 p.206] `RULE` |
| Strangler | Create a new bounded context, use it to implement new requirements, and gradually migrate the legacy context's functionality into it | [DDD ch.13 p.234] `RULE` |
| Service | A mechanism that enables access to one or more capabilities, where the access is provided using a prescribed interface | [DDD ch.14 p.243] `RULE` |
| Microservice | A service with a micro-public interface | [DDD ch.14 p.244] `RULE` |
| Deep module | A simple public interface encapsulates complex logic | [DDD ch.14 p.249] `RULE` |
| Shallow module | Its public interface encapsulates much less complexity than a deep module | [DDD ch.14 p.249] `RULE` |
| Event | A message describing a change that has already happened | [DDD ch.15 p.261] `RULE` |
| Command, as a message | A message describing an operation that has to be carried out | [DDD ch.15 p.261] `RULE` |
| Event notification | A message regarding a change in the business domain that other components will react to | [DDD ch.15 p.262] `RULE` |
| Event-carried state transfer | Notifies subscribers about changes in the producer's internal state, including all the data reflecting the change | [DDD ch.15 p.263] `RULE` |
| Fact table | Facts represent business activities that have already happened | [DDD ch.16 p.276] `RULE` |
| Dimension table | A dimension describes the fact, and is referenced as a foreign key from a fact table | [DDD ch.16 p.278] `RULE` |
| Star schema | Based on the many-to-one relationships between the facts and their dimensions | [DDD ch.16 p.279] `RULE` |
| Snowflake schema | The dimensions are multilevel, each further normalized into more fine-grained dimensions | [DDD ch.16 p.279] `RULE` |
| Data mart | A database that holds data relevant for well-defined analytical needs | [DDD ch.16 p.281] `RULE` |
| Data lake | Ingests the operational systems' data and persists it in its raw form | [DDD ch.16 p.283] `RULE` |
| Data mesh | Defines and protects model and ownership boundaries for analytical data | [DDD ch.16 p.285] `RULE` |
| anything else | — | HALT (`OUT_OF_SCOPE`) |

## Used, never defined

These terms are in the PDF. None of them is defined, scoped or given rules, and
every one of them halts with `UNDEFINED_IN_BOOK`. The evidence per term is in
`ddd-not-in-this-book.md`.

| Term | Where it appears | Handling |
|---|---|---|
| Repository | In prose once, then only as identifiers, plus mono-repository and source control repository | `UNDEFINED_IN_BOOK` |
| Pessimistic locking | Named once, no mechanics | `UNDEFINED_IN_BOOK` |
| ORM mapping guidance | Named twice, both times as a constraint | `UNDEFINED_IN_BOOK` |
| Context map notation | Called a notation, none specified | `UNDEFINED_IN_BOOK` |
| Deduplication and reordering techniques | Required of subscribers, no technique given | `UNDEFINED_IN_BOOK` |
| anything else | — | HALT (`OUT_OF_SCOPE`) |

## Two terms the book renames on purpose

Both are author preferences, graded as such, and neither is a rule:

- Core subdomains are also called core domains, and the author uses core subdomain to avoid confusion with business domains [DDD ch.1 p.32] `PREFERENCE`
- I prefer the longer term event-sourced domain model, to state explicitly that event sourcing represents changes in the lifecycles of the domain model's aggregates [DDD ch.7 p.136] `PREFERENCE`
- The active record pattern is also known as an anemic domain model antipattern, and I prefer to restrain from that negative connotation [DDD ch.5 p.97] `PREFERENCE`

## See also

`ddd-not-in-this-book.md`, `ddd-terminology-mapping.md`,
`../rules/ddd-halt-protocol.md`, `../rules/ddd-source-of-truth.md`.

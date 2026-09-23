# DDD Part II: Tactical Design

Chapters 5-9, PDF pages 89-181. The part opener is pp.87-88; see
`ddd-part-openers.md`.

Tactical design answers how each component is implemented. Every bullet carries
its page and the grade the book gave it.

## Chapter 5 — Implementing Simple Business Logic, pp.89-99

### Transaction script

- The transaction script pattern organizes business logic by procedures where each procedure handles a single request from the presentation [DDD ch.5 p.89] `RULE`
- The system's public operations are used as encapsulation boundaries [DDD ch.5 p.89] `RULE`
- Each procedure is implemented as a simple, straightforward procedural script, free to access the databases directly [DDD ch.5 p.90] `RULE`
- The only requirement procedures have to fulfill is transactional behavior [DDD ch.5 p.90] `RULE`
- Each operation should either succeed or fail but can never result in an invalid state [DDD ch.5 p.90] `HEURISTIC`
- It is the easiest pattern to get wrong [DDD ch.5 p.90] `RULE`

### The three-failure transactional taxonomy, pp.91-94

| Failure | What goes wrong | Remedy | Citation |
|---|---|---|---|
| Lack of transactional behavior | Multiple updates issued without an overarching transaction | Introduce a proper transaction encompassing both data changes | [DDD ch.5 p.91] `RULE` |
| Distributed transactions | Changing data in a database and then notifying other components by publishing messages into a message bus | CQRS to populate multiple storage mechanisms, and the outbox pattern for reliable publishing after committing changes | [DDD ch.5 p.92] `RULE` |
| Implicit distributed transactions | One update, in one table, in one database, that still communicates the operation's success or failure to the caller | Make the operation idempotent, or use optimistic concurrency control | [DDD ch.5 pp.93-94] `RULE` |
| anything else | — | — | HALT (`OUT_OF_SCOPE`) |

- The fix for the first failure is easy due to relational databases' native support of transactions spanning multiple records [DDD ch.5 p.92] `RULE`
- Distributed transactions spanning multiple storage mechanisms are complex, hard to scale, error prone, and are usually avoided [DDD ch.5 p.92] `HEURISTIC`
- The third failure has no single remedy, and the book says so rather than choosing:

```ddd-quote [DDD ch.5 p.94]
there is no simple fix for this issue. It all depends on the business domain and its needs
```

- Idempotent means leading to the same result even if the operation repeated multiple times [DDD ch.5 p.94] `RULE`

### When to use transaction script, pp.94-95

- The transaction script pattern is well adapted to the most straightforward problem domains in which the business logic resembles simple procedural operations [DDD ch.5 p.94] `RULE`
- The transaction script pattern naturally fits supporting subdomains where, by definition, the business logic is simple [DDD ch.5 p.95] `RULE`
- It can also be used as an adapter for integration with external systems, for example generic subdomains, or as a part of an anticorruption layer [DDD ch.5 p.95] `RULE`
- The main advantage of the transaction script pattern is its simplicity: it introduces minimal abstractions and minimizes the overhead [DDD ch.5 p.95] `RULE`
- The more complex the business logic gets, the more it is prone to duplicate business logic across transactions [DDD ch.5 p.95] `RULE`
- Transaction script should never be used for core subdomains [DDD ch.5 p.95] `HEURISTIC`

### Active record, pp.95-97

- An active record is an object that wraps a row in a database table or view, encapsulates the database access, and adds domain logic on that data [DDD ch.5 p.95] `RULE`
- Active record supports cases where the business logic is simple, but may operate on more complex data structures [DDD ch.5 p.95] `RULE`
- Active record objects are coupled to an object-relational mapping or some other data access framework [DDD ch.5 p.96] `RULE`
- The system's business logic is still organized in a transaction script; the difference is that it manipulates active record objects instead of accessing the database directly [DDD ch.5 p.96] `RULE`
- The pattern's goal is to encapsulate the complexity of mapping the in-memory object to the database's schema [DDD ch.5 p.97] `RULE`
- The distinctive feature of an active record object is the separation of data structures and behavior [DDD ch.5 p.97] `RULE`
- An active record's fields usually have public getters and setters that allow external procedures to modify its state [DDD ch.5 p.97] `RULE`
- This pattern can only support relatively simple business logic, such as CRUD operations, which at most validate the user's input [DDD ch.5 p.97] `RULE`
- The active record pattern lends itself to supporting subdomains, integration of external solutions for generic subdomains, or model transformation tasks [DDD ch.5 p.97] `RULE`
- Using a more elaborate pattern when implementing simple business logic will result in harm by introducing accidental complexity [DDD ch.5 p.97] `RULE`
- I prefer to restrain from the negative connotation of the words anemic and antipattern [DDD ch.5 p.97] `PREFERENCE`

### Be pragmatic, p.98

- At high levels of scale, there are cases when data consistency guarantees can be relaxed [DDD ch.5 p.98] `RULE`
- Make sure you evaluate the risks and business implications [DDD ch.5 p.98] `RULE`

No threshold is printed. The page states the limit of its own guidance:

```ddd-quote [DDD ch.5 p.98]
As always, there are no universal laws. It all depends on the business domain you are working in.
```

## Chapter 6 — Tackling Complex Business Logic, pp.101-123

### Domain model

- The domain model pattern is intended to cope with cases of complex business logic: complicated state transitions, business rules, and invariants, rules that have to be protected at all times [DDD ch.6 p.102] `RULE`
- A domain model is an object model of the domain that incorporates both behavior and data [DDD ch.6 p.103] `RULE`
- The model should be devoid of any infrastructural or technological concerns, such as implementing calls to databases [DDD ch.6 p.103] `HEURISTIC`
- The model's objects are plain old objects, implementing business logic without relying on infrastructural components or frameworks [DDD ch.6 p.103] `RULE`
- The building blocks are value objects, aggregates, and domain services [DDD ch.6 p.103] `RULE`

### Value object versus entity, pp.103-110

- A value object is an object that can be identified by the composition of its values [DDD ch.6 p.103] `RULE`
- No explicit identification field is needed to identify a value object [DDD ch.6 p.104] `RULE`
- Relying exclusively on the language's primitive data types to represent concepts of the business domain is known as the primitive obsession code smell [DDD ch.6 p.104] `RULE`
- Validation logic resides in the value objects themselves, so there is no need to validate the values before the assignment [DDD ch.6 p.106] `RULE`
- Value objects shine brightest when they centralize the business logic that manipulates the values [DDD ch.6 p.106] `RULE`
- Value objects are implemented as immutable objects: a change to one of the fields conceptually creates a different value [DDD ch.6 p.107] `RULE`
- Since equality is based on values rather than on an id field or reference, it is important to override and properly implement the equality checks [DDD ch.6 p.107] `RULE`
- A useful rule of thumb is to use value objects for the domain's elements that describe properties of other objects [DDD ch.6 p.108] `HEURISTIC`
- An especially important opportunity to introduce a value object is when modeling money and other monetary values [DDD ch.6 pp.108-109] `RULE`
- An entity requires an explicit identification field to distinguish between the different instances of the entity [DDD ch.6 p.109] `RULE`
- The identification field should be unique for each instance of the entity [DDD ch.6 p.109] `HEURISTIC`
- Except for very rare exceptions, the value of an entity's identification field should remain immutable throughout the entity's lifecycle [DDD ch.6 p.109] `HEURISTIC`
- Contrary to value objects, entities are not immutable and are expected to change [DDD ch.6 p.110] `RULE`
- Entities are not implemented independently, but only in the context of the aggregate pattern [DDD ch.6 p.110] `RULE`

### Aggregate, pp.110-117

- An aggregate is an entity, and the goal of the pattern is to protect the consistency of its data [DDD ch.6 p.110] `RULE`
- The aggregate is a consistency enforcement boundary: its logic has to validate all incoming modifications and ensure the changes do not contradict its business rules [DDD ch.6 p.110] `RULE`
- All processes or objects external to the aggregate are only allowed to read the aggregate's state [DDD ch.6 p.110] `RULE`
- Its state can only be mutated by executing corresponding methods of the aggregate's public interface [DDD ch.6 p.110] `RULE`
- The state-modifying methods exposed as an aggregate's public interface are often referred to as commands [DDD ch.6 p.111] `RULE`
- An aggregate's public interface is responsible for validating the input and enforcing all of the relevant business rules and invariants [DDD ch.6 p.111] `RULE`
- How commands are expressed in an aggregate's code is a matter of preference [DDD ch.6 p.111] `PREFERENCE`
- The database used for storing aggregates has to support concurrency management [DDD ch.6 p.112] `RULE`
- In its simplest form, an aggregate should hold a version field that will be incremented after each update [DDD ch.6 p.112] `HEURISTIC`
- The application layer loads the aggregate's current state, executes the required action, persists the modified state, and returns the operation's result to the caller [DDD ch.6 p.112] `RULE`

### The transaction boundary, p.113

- Since an aggregate's state can only be modified by its own business logic, the aggregate also acts as a transactional boundary [DDD ch.6 p.113] `RULE`
- All changes to the aggregate's state should be committed transactionally as one atomic operation [DDD ch.6 p.113] `HEURISTIC`
- No system operation can assume a multi-aggregate transaction [DDD ch.6 p.113] `RULE`
- A change to an aggregate's state can only be committed individually, one aggregate per database transaction [DDD ch.6 p.113] `RULE`
- The need to commit changes in multiple aggregates signals a wrong transaction boundary, and hence, wrong aggregate boundaries [DDD ch.6 p.113] `RULE`

### Co-location criteria, pp.113-114

- There are business scenarios in which multiple objects should share a transactional boundary: when both can be modified simultaneously, or when the business rules of one object depend on the state of another object [DDD ch.6 p.113] `HEURISTIC`
- The aggregate resembles a hierarchy of entities, all sharing transactional consistency [DDD ch.6 p.113] `RULE`
- The hierarchy contains both entities and value objects, and all of them belong to the same aggregate if they are bound by the domain's business logic [DDD ch.6 p.114] `RULE`

### The inside/outside consistency test, pp.115-116

- Only the information that is required by the aggregate's business logic to be strongly consistent should be a part of the aggregate [DDD ch.6 p.115] `HEURISTIC`
- All information that can be eventually consistent should reside outside of the aggregate's boundary, for example as a part of another aggregate [DDD ch.6 p.115] `HEURISTIC`
- The rule of thumb is to keep the aggregates as small as possible [DDD ch.6 p.115] `HEURISTIC`
- To decide whether an entity belongs to an aggregate, examine whether the aggregate contains business logic that can lead to an invalid system state if it will work on eventually consistent data [DDD ch.6 p.116] `RULE`
- External aggregates are referenced by ID, to reify that these objects do not belong to the aggregate's boundary and to ensure that each aggregate has its own transactional boundary [DDD ch.6 p.116] `RULE`

### Aggregate root and domain events, pp.116-118

- Only one entity should be designated as the aggregate's public interface, the aggregate root [DDD ch.6 p.116] `HEURISTIC`
- An operation that modifies an inner entity is accessible only through its aggregate root [DDD ch.6 p.117] `RULE`
- A domain event is a message describing a significant event that has occurred in the business domain [DDD ch.6 p.117] `RULE`
- Since domain events describe something that has already happened, their names should be formulated in the past tense [DDD ch.6 p.117] `HEURISTIC`
- The goal of a domain event is to describe what has happened in the business domain and provide all the necessary data related to the event [DDD ch.6 p.117] `RULE`
- Domain events are part of an aggregate's public interface, and an aggregate publishes its domain events [DDD ch.6 p.117] `RULE`
- Aggregates should reflect the ubiquitous language: the name, data members, actions, and domain events all should be formulated in the bounded context's ubiquitous language [DDD ch.6 p.118] `HEURISTIC`

### Domain services, pp.118-119

- Business logic that either doesn't belong to any aggregate or value object, or that seems relevant to multiple aggregates, is implemented as a domain service [DDD ch.6 p.118] `RULE`
- A domain service is a stateless object that implements the business logic, and in the vast majority of cases orchestrates calls to various components to perform a calculation or analysis [DDD ch.6 p.119] `RULE`
- Domain services are not a loophole: the rule of one instance per transaction still holds true [DDD ch.6 p.119] `RULE`
- Domain services lend themselves to implementing calculation logic that requires reading the data of multiple aggregates [DDD ch.6 p.119] `RULE`
- Domain services have nothing to do with microservices or service-oriented architecture [DDD ch.6 p.119] `RULE`

### Degrees of freedom, pp.120-122

- A system's degrees of freedom are the data points needed to describe its state [DDD ch.6 p.120] `RULE`
- The class with more degrees of freedom is the one that is more difficult to control and predict [DDD ch.6 p.121] `RULE`
- The invariants reduce complexity: that is what both aggregate and value object patterns do, encapsulate invariants and thus reduce complexity [DDD ch.6 p.121] `RULE`
- An aggregate can only be modified by its own methods [DDD ch.6 p.121] `RULE`
- The data fields are read-only for external components, so that all the business logic related to the aggregate resides in its boundaries [DDD ch.6 p.122] `RULE`
- All of the data included in an aggregate's boundary has to be strongly consistent to implement its business logic [DDD ch.6 p.122] `RULE`
- An aggregate can communicate with external entities by publishing domain events [DDD ch.6 p.122] `RULE`

### The three by-the-book rules, p.303

Appendix A restates the same three as a checklist, and they are pack-shared:

- Each transaction would affect only one instance of an aggregate [DDD app.A p.303] `RULE`
- Instead of an ORM, each aggregate itself would define the transactional scope [DDD app.A p.303] `RULE`
- The service layer would go on a very strict diet, and all the business logic would be refactored into the corresponding aggregates [DDD app.A p.303] `RULE`

## Chapter 7 — Modeling the Dimension of Time, pp.125-142

### Event sourcing

- The event-sourced domain model uses the event sourcing pattern to manage the aggregates' states: instead of persisting an aggregate's state, the model generates domain events describing each change [DDD ch.7 p.125] `RULE`
- The event sourcing pattern introduces the dimension of time into the data model [DDD ch.7 p.127] `RULE`
- A state-based table documents the current states but misses the story of how each record got to its current state [DDD ch.7 p.127] `RULE`
- For the event sourcing pattern to work, all changes to an object's state should be represented and persisted as events, and these events become the system's source of truth [DDD ch.7 p.133] `HEURISTIC`
- The database that stores the system's events is the only strongly consistent storage: the system's source of truth [DDD ch.7 p.133] `RULE`
- The accepted name for the database used for persisting events is event store [DDD ch.7 p.133] `RULE`

### The event store's minimum contract, p.133

- The event store should not allow modifying or deleting the events, since it's append-only storage [DDD ch.7 p.133] `HEURISTIC`
- At a minimum the event store has to support fetch of all events belonging to a specific business entity and append of the events [DDD ch.7 p.133] `RULE`
- The expected version argument in the append method implements optimistic concurrency management; on a stale version the event store should raise a concurrency exception [DDD ch.7 p.133] `HEURISTIC`

### The four-step script every operation follows, p.134

1. Load the aggregate's domain events [DDD ch.7 p.134] `RULE`
2. Reconstitute a state representation: project the events into a state representation that can be used to make business decisions [DDD ch.7 p.134] `RULE`
3. Execute the aggregate's command to execute the business logic, and consequently, produce new domain events [DDD ch.7 p.134] `RULE`
4. Commit the new domain events to the event store [DDD ch.7 p.134] `RULE`

- All changes to an aggregate's state have to be expressed as domain events [DDD ch.7 p.134] `RULE`
- I prefer the longer term event-sourced domain model, to state explicitly that event sourcing represents changes in the lifecycles of the domain model's aggregates [DDD ch.7 p.136] `PREFERENCE`

### Four advantages, pp.136-137

| Advantage | What it gives | Citation |
|---|---|---|
| Time traveling | You can always reconstitute all the past states of an aggregate, including retroactive debugging | [DDD ch.7 p.137] `RULE` |
| Deep insight | Event sourcing provides deep insight into the system's state and behavior, and new projections can be added | [DDD ch.7 p.137] `RULE` |
| Audit log | The persisted domain events represent a strongly consistent audit log; laws oblige some business domains to implement such audit logs | [DDD ch.7 p.137] `RULE` |
| Advanced optimistic concurrency management | You can query the exact events that were concurrently appended and make a business domain-driven decision | [DDD ch.7 p.137] `RULE` |
| anything else | — | HALT (`OUT_OF_SCOPE`) |

### Three disadvantages, pp.137-138

| Disadvantage | What it costs | Citation |
|---|---|---|
| Learning curve | The pattern's sharp difference from traditional techniques demands training of the team and time to get used to the new way of thinking | [DDD ch.7 p.138] `RULE` |
| Evolving the model | Events are immutable, so adjusting the event's schema is not as simple as changing a table's schema | [DDD ch.7 p.138] `RULE` |
| Architectural complexity | Numerous architectural moving parts make the overall design more complicated | [DDD ch.7 p.138] `RULE` |
| anything else | — | HALT (`OUT_OF_SCOPE`) |

### The snapshot benchmark instruction, pp.138-139

- It is important to benchmark a projection's impact on performance: the effect of working with hundreds or thousands of events [DDD ch.7 p.138] `RULE`
- The results should be compared with the expected lifespan of an aggregate, the number of events expected to be recorded during an average lifespan [DDD ch.7 p.138] `HEURISTIC`
- The snapshot pattern is an optimization that has to be justified: if the aggregates won't persist 10,000+ events, implementing it is just an accidental complexity [DDD ch.7 p.139] `RULE`

The page adds one instruction before the optimization, in the author's own voice:

```ddd-quote [DDD ch.7 p.139]
I recommend that you take a step back and double-check the aggregate's boundaries
```

- All events belonging to an instance of an aggregate should reside in a single shard [DDD ch.7 p.140] `HEURISTIC`
- Physical deletion is addressed with the forgettable payload pattern: sensitive information is included in the events in encrypted form and the key is deleted from an external key storage [DDD ch.7 p.140] `RULE`

### The three rejected cheaper alternatives, pp.140-141

| Alternative | Why the book rejects it | Citation |
|---|---|---|
| Write logs to a text file and use it as an audit log | A transaction against two storage mechanisms; such logs are not consistent, but eventually inconsistent | [DDD ch.7 p.140] `RULE` |
| Append logs to a logs table in the same database transaction | Still error prone: a future engineer forgets to append a log record, and the log table's schema degrades into chaos | [DDD ch.7 p.141] `RULE` |
| A database trigger copying the record into a history table | The resultant history only includes the dry facts of what fields were changed, and misses why | [DDD ch.7 p.141] `RULE` |
| anything else | — | HALT (`OUT_OF_SCOPE`) |

## Chapter 8 — Architectural Patterns, pp.143-162

### The three layers and their single concerns, p.144

- The layered architecture organizes the codebase into horizontal layers, with each layer addressing one technical concern [DDD ch.8 p.144] `RULE`
- In its classic form, the layered architecture consists of three layers: the presentation layer, the business logic layer, and the data access layer [DDD ch.8 p.144] `RULE`
- The presentation layer implements the program's user interface for interactions with its consumers [DDD ch.8 p.144] `RULE`
- The business logic layer is responsible for implementing and encapsulating the program's business logic [DDD ch.8 p.145] `RULE`
- The data access layer provides access to persistence mechanisms [DDD ch.8 p.145] `RULE`

### The presentation-layer inventory, pp.144-145

The exhaustive list the book prints:

- Graphical user interface [DDD ch.8 p.144] `RULE`
- Command-line interface [DDD ch.8 p.144] `RULE`
- API for programmatic integration with other systems [DDD ch.8 p.145] `RULE`
- Subscription to events in a message broker [DDD ch.8 p.145] `RULE`
- Message topics for publishing outgoing events [DDD ch.8 p.145] `RULE`

- Strictly speaking, the presentation layer is the program's public interface [DDD ch.8 p.145] `RULE`

### The data-access-layer inventory, pp.145-146

- It is common for a system to work with multiple databases: a document store, a search index, an in-memory database [DDD ch.8 p.145] `RULE`
- Cloud-based object storage can be used to store the system's files, or a message bus to orchestrate communication between the program's functions [DDD ch.8 p.146] `RULE`
- It also includes integration with external information providers: APIs provided by external systems, or cloud vendors' managed services [DDD ch.8 p.146] `RULE`
- The layers are integrated in a top-down communication model: each layer can hold a dependency only on the layer directly beneath it [DDD ch.8 p.146] `RULE`

### The service layer, pp.147-150

- The service layer defines an application's boundary with a layer of services that establishes a set of available operations and coordinates the application's response in each operation [DDD ch.8 p.147] `RULE`
- The service layer is a logical boundary, not a physical service [DDD ch.8 p.148] `RULE`
- The service layer acts as a façade for the business logic layer [DDD ch.8 p.148] `RULE`
- A service layer is not always necessary: when the business logic is implemented as a transaction script, it essentially is a service layer [DDD ch.8 p.150] `RULE`
- The service layer is required if the business logic pattern requires external orchestration, as in the case of the active record pattern [DDD ch.8 p.150] `RULE`
- The dependency between the business logic and the data access layers makes the layered architecture a good fit for business logic implemented using the transaction script or active record pattern [DDD ch.8 p.150] `RULE`
- The pattern makes it challenging to implement a domain model, because business entities should have no dependency and no knowledge of the underlying infrastructure [DDD ch.8 p.151] `HEURISTIC`

### Layers versus tiers, p.151

- A layer is a logical boundary, whereas a tier is a physical boundary [DDD ch.8 p.151] `RULE`
- All layers in the layered architecture are bound by the same lifecycle: they are implemented, evolved, and deployed as one single unit [DDD ch.8 p.151] `RULE`
- A tier is an independently deployable service, server, or system [DDD ch.8 p.151] `RULE`

### Ports & adapters, pp.152-154

- Both the presentation layer and data access layer represent integration with external components, unified into a single infrastructure layer [DDD ch.8 p.152] `RULE`
- The dependency inversion principle states that high-level modules, which implement the business logic, should not depend on low-level modules [DDD ch.8 p.152] `HEURISTIC`
- The business logic layer takes the central role and doesn't depend on any of the system's infrastructural components [DDD ch.8 p.152] `RULE`
- The application layer is a façade for the system's public interface, describing all the operations exposed by the system [DDD ch.8 p.152] `RULE`
- The core goal of the ports & adapters architecture is to decouple the system's business logic from its infrastructural components [DDD ch.8 p.153] `RULE`
- The business logic layer defines ports that have to be implemented by the infrastructure layer, and the infrastructure layer implements adapters [DDD ch.8 p.153] `RULE`
- The abstract ports are resolved into concrete adapters in the infrastructure layer, either through dependency injection or by bootstrapping [DDD ch.8 p.154] `RULE`
- The decoupling of the business logic from all technological concerns makes ports & adapters a perfect fit for business logic implemented with the domain model pattern [DDD ch.8 p.154] `RULE`

The two alias tables of pp.150 and 154 are transcribed in
`ddd-terminology-mapping.md`.

### CQRS, pp.154-160

- The CQRS pattern enables representation of the system's data in multiple persistent models [DDD ch.8 p.154] `RULE`
- There are two types of models: the command execution model and the read models [DDD ch.8 p.155] `RULE`
- CQRS devotes a single model to executing operations that modify the system's state; this model implements the business logic, validates rules, and enforces invariants [DDD ch.8 p.155] `RULE`
- The command execution model is also the only model representing strongly consistent data, the system's source of truth [DDD ch.8 p.156] `RULE`
- The system can define as many models as it takes to present data to users or supply information to other systems [DDD ch.8 p.156] `RULE`
- A read model is a precached projection, and can reside in a durable database, flat file, or in-memory cache [DDD ch.8 p.156] `RULE`
- Proper implementation of CQRS allows for wiping out all data of a projection and regenerating it from scratch [DDD ch.8 p.156] `RULE`
- Read models are read-only: none of the system's operations can directly modify the read models' data [DDD ch.8 p.156] `RULE`

### The three-step catch-up projection, pp.156-157

1. The projection engine queries the OLTP database for added or updated records after the last processed checkpoint [DDD ch.8 p.157] `RULE`
2. The projection engine uses the updated data to regenerate or update the system's read models [DDD ch.8 p.157] `RULE`
3. The projection engine stores the checkpoint of the last processed record [DDD ch.8 p.157] `RULE`

- For the catch-up subscription to work, the command execution model has to checkpoint all the appended or updated database records [DDD ch.8 p.157] `RULE`
- The storage mechanism should also support the querying of records based on the checkpoint [DDD ch.8 p.157] `HEURISTIC`
- It is important to ensure that the checkpoint-based query returns consistent results [DDD ch.8 p.157] `RULE`
- The synchronous projection method makes it trivial to add new projections and regenerate existing ones from scratch [DDD ch.8 p.158] `RULE`
- In the asynchronous projection scenario the command execution model publishes all committed changes to a message bus [DDD ch.8 p.158] `RULE`
- The asynchronous method is more prone to the challenges of distributed computing: out-of-order or duplicated messages project inconsistent data [DDD ch.8 p.158] `RULE`
- It is advisable to always implement synchronous projection and, optionally, an additional asynchronous projection on top of it [DDD ch.8 p.159] `HEURISTIC`

### Model segregation, p.159

- A command can only operate on the strongly consistent command execution model [DDD ch.8 p.159] `RULE`
- A query cannot directly modify any of the system's persisted state, neither the read models nor the command execution model [DDD ch.8 p.159] `RULE`
- A command should always let the caller know whether it has succeeded or failed [DDD ch.8 p.159] `HEURISTIC`
- The returned data should originate from the strongly consistent model, the command execution model [DDD ch.8 p.159] `HEURISTIC`
- The claim that a command should never return any data is named on the page and refuted there [DDD ch.8 p.159] `HEURISTIC`

### Scope, p.160

- CQRS can be useful for applications that need to work with the same data in multiple models, potentially stored in different kinds of databases [DDD ch.8 p.159] `RULE`
- CQRS naturally lends itself to event-sourced domain models, because event sourcing makes it impossible to query records based on the aggregates' states [DDD ch.8 p.160] `RULE`
- The three patterns should not be treated as systemwide organizational principles, nor necessarily as high-level architecture patterns for a whole bounded context [DDD ch.8 p.160] `HEURISTIC`
- Even subdomains of the same type may require different business logic and architectural patterns [DDD ch.8 p.160] `RULE`
- Enforcing a single, bounded, contextwide architecture will inadvertently lead to accidental complexity [DDD ch.8 p.160] `RULE`
- It is crucial to define logical boundaries for modules encapsulating distinct business subdomains and use the appropriate tools for each [DDD ch.8 p.160] `RULE`

## Chapter 9 — Communication Patterns, pp.163-181

### Model translation and its owner, p.164

- The downstream bounded context can adapt the upstream model to its needs using an anticorruption layer, while the upstream can act as an open-host service [DDD ch.9 p.164] `RULE`
- Stateless translation happens on the fly, as incoming or outgoing requests are issued [DDD ch.9 p.164] `RULE`
- Stateful translation involves a more complicated translation logic that requires a database [DDD ch.9 p.164] `RULE`

### The three stateless implementations, pp.164-166

| Implementation | When | Citation |
|---|---|---|
| Proxy embedded in the bounded context's codebase | Synchronous communication: the typical way to translate models | [DDD ch.9 p.164] `RULE` |
| API gateway | Synchronous, when offloading the translation logic to an external component is more cost-effective and convenient | [DDD ch.9 p.165] `RULE` |
| Message proxy | Asynchronous: an intermediary component subscribing to messages coming from the source bounded context | [DDD ch.9 p.166] `RULE` |
| anything else | — | HALT (`OUT_OF_SCOPE`) |

- An anticorruption layer implemented using an API gateway can be consumed by multiple downstream bounded contexts, and is often referred to as an interchange context [DDD ch.9 p.165] `RULE`
- It is a common mistake to expose a published language for the model's objects and allow domain events to be published as they are [DDD ch.9 p.166] `RULE`
- Translating messages to the published language enables differentiating between private events and public events [DDD ch.9 p.166] `RULE`

### The stateful forcing cases, pp.167-169

- Aggregating incoming requests and processing them in batches for performance optimization [DDD ch.9 p.167] `RULE`
- Combining multiple fine-grained messages into a single message containing the unified data [DDD ch.9 p.167] `RULE`
- Model transformation that aggregates incoming data cannot be implemented using an API gateway, and requires its own persistent storage [DDD ch.9 p.168] `RULE`
- Unifying multiple sources, for example the backend-for-frontend pattern, or a context fronted by an anticorruption layer that aggregates data from all other bounded contexts [DDD ch.9 pp.168-169] `RULE`

### The publishing ladder and its named failures, pp.169-171

| Attempt | Named failure | Citation |
|---|---|---|
| Publish the event from inside the aggregate | The event will be dispatched before the aggregate's new state is committed, and once the transaction is rolled back there is no way to retract it | [DDD ch.9 p.170] `RULE` |
| Publish from the application layer after committing | The process can fail to publish the domain events, leaving the transaction committed and the events never published | [DDD ch.9 p.171] `RULE` |
| Outbox | Ensures reliable publishing of domain events | [DDD ch.9 p.171] `RULE` |
| anything else | — | HALT (`OUT_OF_SCOPE`) |

### The outbox four steps, p.171

1. Both the updated aggregate's state and the new domain events are committed in the same atomic transaction [DDD ch.9 p.171] `RULE`
2. A message relay fetches newly committed domain events from the database [DDD ch.9 p.171] `RULE`
3. The relay publishes the domain events to the message bus [DDD ch.9 p.171] `RULE`
4. Upon successful publishing, the relay either marks the events as published in the database or deletes them completely [DDD ch.9 p.171] `RULE`

- With a relational database it is convenient to use a dedicated table for storing the messages [DDD ch.9 p.171] `RULE`
- With a NoSQL database that doesn't support multidocument transactions, the outgoing domain events have to be embedded in the aggregate's record [DDD ch.9 p.172] `RULE`

### Pull versus push relay, pp.172-173

| Relay | How | Citation |
|---|---|---|
| Pull: polling publisher | The relay continuously queries the database for unpublished events; proper indexes have to be in place | [DDD ch.9 p.172] `RULE` |
| Push: transaction log tailing | The database's feature set proactively calls the publishing relay when new events are appended | [DDD ch.9 p.173] `RULE` |
| anything else | — | HALT (`OUT_OF_SCOPE`) |

- The outbox pattern guarantees delivery of the messages at least once [DDD ch.9 p.173] `RULE`

### Saga versus process manager, pp.173-177

- A saga is a long-running business process, long running in terms of transactions: a business process that spans multiple transactions [DDD ch.9 p.173] `RULE`
- The saga listens to the events emitted by the relevant components and issues subsequent commands to the other components [DDD ch.9 p.173] `RULE`
- If one of the execution steps fails, the saga is in charge of issuing relevant compensating actions [DDD ch.9 p.173] `RULE`
- The states of the involved components are eventually consistent, and no two transactions are atomic [DDD ch.9 p.176] `RULE`
- Only the data within an aggregate's boundaries is strongly consistent; everything outside is eventually consistent [DDD ch.9 p.176] `RULE`
- The saga pattern manages simple, linear flow: strictly speaking, a saga matches events to the corresponding commands [DDD ch.9 p.176] `RULE`
- The process manager pattern is a central processing unit that maintains the state of the sequence and determines the next processing steps [DDD ch.9 p.177] `RULE`
- As a simple rule of thumb, if a saga contains if-else statements to choose the correct course of action, it is probably a process manager [DDD ch.9 p.177] `HEURISTIC`
- A saga is instantiated implicitly when a particular event is observed; a process manager has to be instantiated explicitly [DDD ch.9 p.177] `RULE`
- The process manager has its explicit ID and persistent state [DDD ch.9 p.180] `RULE`

## See also

`ddd-part-1-strategic-design.md`, `ddd-part-3-in-practice.md`,
`ddd-terminology-mapping.md`, `../rules/ddd-structural-fidelity.md`,
`../rules/ddd-heuristic-status.md`.

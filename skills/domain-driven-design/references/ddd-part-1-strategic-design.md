# DDD Part I: Strategic Design

Chapters 1-4, PDF pages 29-86. The part opener is pp.27-28; see
`ddd-part-openers.md`.

Strategic design answers what software we are building and why. Every bullet
below carries the page it came from and the grade the book gave it.

## Chapter 1 — Analyzing Business Domains, pp.29-45

### Domain and subdomain

- A business domain defines a company's main area of activity [DDD ch.1 p.29] `RULE`
- A subdomain is a fine-grained area of business activity, and all of a company's subdomains form its business domain [DDD ch.1 p.30] `RULE`
- Domain-driven design distinguishes between three types of subdomains: core, generic, and supporting [DDD ch.1 p.30] `RULE`
- Core subdomains are also called core domains; the author uses core subdomain to avoid confusion with business domains [DDD ch.1 p.32] `PREFERENCE`

### The three types

- A core subdomain is what a company does differently from its competitors [DDD ch.1 p.30] `RULE`
- A core subdomain that is simple to implement can only provide a short-lived competitive advantage, therefore core subdomains are naturally complex [DDD ch.1 p.31] `RULE`
- Core subdomains are not necessarily technical, and a company's competitive advantage can come from various sources [DDD ch.1 p.31] `RULE`
- Generic subdomains are business activities that all companies are performing in the same way [DDD ch.1 p.32] `RULE`
- Generic subdomains do not provide any competitive edge for the company [DDD ch.1 p.32] `RULE`
- Supporting subdomains support the company's business but do not provide any competitive advantage [DDD ch.1 p.32] `RULE`
- Supporting subdomains are simple: their business logic resembles data entry screens and ETL operations, the so-called CRUD interfaces [DDD ch.1 p.33] `RULE`
- Only core subdomains provide a competitive advantage to a company [DDD ch.1 p.33] `RULE`
- Generic subdomains, by definition, cannot be a source for any competitive advantage [DDD ch.1 p.33] `RULE`
- Supporting subdomains have low entry barriers and cannot provide a competitive advantage either [DDD ch.1 p.33] `RULE`

### The three classification tests, p.34

- Complexity is a useful guiding principle: ask whether the subdomain in question can be turned into a side business, and would someone pay for it on its own [DDD ch.1 p.34] `RULE`
- For supporting versus generic: would it be simpler and cheaper to hack your own implementation, rather than integrating an external one [DDD ch.1 p.34] `RULE`
- Evaluate the complexity of the business logic to model in code: CRUD interfaces for data entry signal a supporting subdomain, complex algorithms and business rules signal a core subdomain [DDD ch.1 p.34] `RULE`
- The intersection between the supporting and generic subdomains is a gray area: it can go either way [DDD ch.1 p.34] `RULE`

### Volatility, p.35

- Core subdomains can change often, and solutions for core subdomains are emergent [DDD ch.1 p.35] `RULE`
- Supporting subdomains do not change often [DDD ch.1 p.35] `RULE`
- Generic subdomains can change over time: security patches, bug fixes, or entirely new solutions [DDD ch.1 p.35] `RULE`

### Solution strategy, p.36

- All subdomains are required for the company to work in its business domain [DDD ch.1 p.36] `RULE`
- Core subdomains have to be implemented in-house and cannot be bought or adopted [DDD ch.1 p.36] `RULE`
- The organization's most skilled talent should be assigned to work on its core subdomains [DDD ch.1 p.36] `HEURISTIC`
- Core subdomains require the most advanced engineering techniques, because the solution must be maintainable and easy to evolve [DDD ch.1 p.36] `RULE`
- For generic subdomains it is more cost-effective to buy an off-the-shelf product or adopt an open source solution [DDD ch.1 p.36] `RULE`
- A company has no choice but to implement supporting subdomains itself, since no ready-made solutions are available [DDD ch.1 p.36] `RULE`
- Supporting subdomains do not require elaborate design patterns or other advanced engineering techniques [DDD ch.1 p.36] `RULE`
- The simplicity of the business logic makes supporting subdomains a good candidate for outsourcing [DDD ch.1 p.36] `RULE`

### Table 1-1, p.37

The 3x5 matrix, transcribed row for row.

| Subdomain type | Competitive advantage | Complexity | Volatility | Implementation | Problem | Citation |
|---|---|---|---|---|---|---|
| Core | Yes | High | High | In-house | Interesting | [DDD ch.1 p.37] `RULE` |
| Generic | No | High | Low | Buy/adopt | Solved | [DDD ch.1 p.37] `RULE` |
| Supporting | No | Low | Low | In-house/outsource | Obvious | [DDD ch.1 p.37] `RULE` |
| anything else | — | — | — | — | — | HALT (`OUT_OF_SCOPE`) |

- The subdomains and their types are defined by the company's business strategy [DDD ch.1 p.37] `RULE`
- A good starting point is the company's departments and other organizational units, which are relatively coarse-grained areas of activity [DDD ch.1 p.37] `RULE`

### Distillation and the stopping rule, pp.38-39

- Subdomains resemble sets of interrelated, coherent use cases, usually involving the same actor and a closely related set of data [DDD ch.1 p.38] `RULE`
- Use the definition of subdomains as a set of coherent use cases as a guiding principle for when to stop looking for finer-grained subdomains [DDD ch.1 p.38] `RULE`
- Distilling laser-focused boundaries is necessary for core subdomains [DDD ch.1 p.39] `RULE`
- The distillation can be somewhat relaxed for supporting and generic subdomains [DDD ch.1 p.39] `RULE`
- Stop when drilling down further doesn't unveil any new insights that can help you make software design decisions [DDD ch.1 p.39] `RULE`
- That happens when all of the finer-grained subdomains are of the same type as the original subdomain [DDD ch.1 p.39] `RULE`
- Identify business functions that are not related to software, acknowledge them as such, and focus on aspects of the business relevant to the software system [DDD ch.1 p.40] `RULE`

### Worked examples

Gigmaster, a ticket sales and distribution company [DDD ch.1 p.40] `RULE`, and
BusVNext, a public transportation company [DDD ch.1 p.41] `RULE`. Both print a
full subdomain classification and the design decisions that follow from it, and
both are usable as regression cases for `ddd-subdomains`.

### Domain experts, p.43

- Domain experts are subject matter experts who know all the intricacies of the business, and are knowledge authorities in the software's business domain [DDD ch.1 p.43] `RULE`
- Domain experts are neither the analysts gathering the requirements nor the engineers designing the system [DDD ch.1 p.43] `RULE`
- As a rule of thumb, domain experts are either the people coming up with requirements or the software's end users [DDD ch.1 p.43] `HEURISTIC`

## Chapter 2 — Discovering Domain Knowledge, pp.47-58

- A software project's success depends on the effectiveness of knowledge sharing between domain experts and software engineers [DDD ch.2 p.48] `RULE`
- Domain knowledge is translated into an analysis model, a description of the system's requirements rather than an understanding of the business domain [DDD ch.2 p.49] `RULE`
- In any translation, information is lost [DDD ch.2 p.49] `RULE`
- Domain-driven design calls for cultivating a single language for describing the business domain: the ubiquitous language [DDD ch.2 p.51] `RULE`

### Language of the business, p.51

- The ubiquitous language is the language of the business, and should consist of business domain-related terms only [DDD ch.2 p.51] `HEURISTIC`
- All project-related stakeholders should use the ubiquitous language when describing the business domain [DDD ch.2 p.51] `HEURISTIC`
- Domain experts must be comfortable using the ubiquitous language when reasoning about the business domain [DDD ch.2 p.51] `RULE`

Pass and fail statement pairs the page prints, for the advertising campaign
management example:

| Verdict | Statement | Citation |
|---|---|---|
| Pass | A campaign can be published only if at least one of its placements is active | [DDD ch.2 p.51] `RULE` |
| Fail | A campaign can be published only if it has at least one associated record in the active-placements table | [DDD ch.2 p.51] `RULE` |
| Pass | Sales commissions are accounted for after transactions are approved | [DDD ch.2 p.51] `RULE` |
| Fail | Sales commissions are based on correlated records from the transactions and approved-sales tables | [DDD ch.2 p.51] `RULE` |
| anything else | — | HALT (`OUT_OF_SCOPE`) |

### Consistency, p.52

- The ubiquitous language must be precise and consistent [DDD ch.2 p.52] `RULE`
- Each term of the ubiquitous language should have one and only one meaning [DDD ch.2 p.52] `HEURISTIC`
- Ambiguous terms: ubiquitous language demands a single meaning for each term, so the ambiguous term is modeled explicitly using two terms [DDD ch.2 p.52] `RULE`
- Synonymous terms: two terms cannot be used interchangeably in a ubiquitous language [DDD ch.2 p.52] `RULE`
- It is preferable to use each term explicitly in its specific context [DDD ch.2 p.52] `HEURISTIC`

### Model, pp.53-54

- A model is a simplified representation of a thing or phenomenon that intentionally emphasizes certain aspects while ignoring others [DDD ch.2 p.53] `RULE`
- An effective model contains only the details needed to fulfill its purpose [DDD ch.2 p.54] `RULE`
- An ineffective abstraction removes necessary information or produces noise by leaving what's not required [DDD ch.2 p.54] `RULE`
- The purpose of abstracting is not to be vague but to create a new semantic level in which one can be absolutely precise [DDD ch.2 p.54] `RULE`
- The model has to reflect the involved business entities and their behavior, cause and effect relationships, and invariants [DDD ch.2 p.54] `RULE`

### Capture tools and their stated limitations, pp.55-56

| Tool | Stated limitation | Citation |
|---|---|---|
| Wiki-based glossary | Works best for nouns; behavior is much harder to document in a glossary | [DDD ch.2 p.55] `RULE` |
| Use cases or Gherkin tests | Used in tandem with a glossary, to capture the behavior | [DDD ch.2 p.55] `RULE` |
| Gherkin test suite | Managing it can be challenging at times, especially at the early stages of a project | [DDD ch.2 p.56] `RULE` |
| Static code analysis, NDepend | Secondary to the actual use of a ubiquitous language in day-to-day interactions | [DDD ch.2 p.56] `RULE` |
| anything else | — | HALT (`OUT_OF_SCOPE`) |

- Formulation of a ubiquitous language requires interaction with its natural holders, the domain experts [DDD ch.2 p.55] `RULE`
- It is important to make glossary maintenance a shared effort [DDD ch.2 p.55] `RULE`
- The only reliable way to gather domain knowledge is to converse with domain experts [DDD ch.2 p.56] `RULE`
- All of a language's terms have to be consistent: no ambiguous terms and no synonymous terms [DDD ch.2 p.57] `RULE`
- My advice is to at least use English nouns for naming the business domain's entities [DDD ch.2 p.57] `PREFERENCE`

## Chapter 3 — Managing Domain Complexity, pp.59-73

### The bounded context

- Divide the ubiquitous language into multiple smaller languages, then assign each one to the explicit context in which it can be applied: its bounded context [DDD ch.3 p.61] `RULE`
- Bounded contexts are the consistency boundaries of ubiquitous languages [DDD ch.3 p.62] `RULE`
- A model cannot exist without a boundary; it will expand to become a copy of the real world [DDD ch.3 p.62] `RULE`
- A ubiquitous language is ubiquitous only in the boundaries of its bounded context [DDD ch.3 p.63] `RULE`
- The consistency of the ubiquitous language only helps to identify the widest boundary of that language [DDD ch.3 p.63] `RULE`

### Size, p.64

- A bounded context's size, by itself, is not a deciding factor; models need to be useful [DDD ch.3 p.64] `RULE`
- The wider the boundary of the ubiquitous language is, the harder it is to keep it consistent [DDD ch.3 p.64] `RULE`
- The smaller bounded contexts are, the more integration overhead the design induces [DDD ch.3 p.64] `RULE`

### The three extraction triggers, p.64

- Constituting new software engineering teams [DDD ch.3 p.64] `RULE`
- Addressing some of the system's nonfunctional requirements, for example separating development lifecycles [DDD ch.3 p.64] `RULE`
- The ability to scale one functionality independently from the rest of the bounded context [DDD ch.3 p.64] `RULE`
- Beware of splitting a coherent functionality into multiple bounded contexts [DDD ch.3 p.64] `RULE`
- Identify sets of coherent use cases that operate on the same data and avoid decomposing them into multiple bounded contexts [DDD ch.3 p.64] `HEURISTIC`

### Discovered versus designed, pp.64-67

- Subdomains are discovered and bounded contexts are designed [DDD ch.3 p.67] `RULE`
- Bounded contexts are designed: choosing models' boundaries is a strategic design decision [DDD ch.3 p.65] `RULE`
- Having a one-to-one relationship between bounded contexts and subdomains can be perfectly reasonable in some scenarios, and in others different decomposition strategies can be more suitable [DDD ch.3 p.66] `RULE`
- Limiting the design to one-to-one relationships would inhibit flexibility and force us to use a single model of a subdomain in its bounded context [DDD ch.3 p.67] `RULE`

### Boundary kinds, pp.67-68

- Each bounded context should be implemented as an individual service or project, implemented, evolved, and versioned independently of other bounded contexts [DDD ch.3 p.67] `HEURISTIC`
- A bounded context can contain multiple subdomains; then the bounded context is a physical boundary, while each of its subdomains is a logical boundary [DDD ch.3 p.67] `RULE`
- Logical boundaries bear different names in different programming languages: namespaces, modules, or packages [DDD ch.3 p.67] `RULE`
- A bounded context should be implemented, evolved, and maintained by one team only [DDD ch.3 p.68] `HEURISTIC`
- No two teams can work on the same bounded context [DDD ch.3 p.68] `RULE`
- A bounded context should be owned by only one team [DDD ch.3 p.68] `HEURISTIC`
- A single team can own multiple bounded contexts [DDD ch.3 p.68] `RULE`
- Each bounded context's lifecycle is decoupled from the rest, and each can evolve independently [DDD ch.3 p.72] `RULE`

### Real life, pp.69-72

Four worked analogies, all narrative support rather than additional rules:

- A semantic domain is defined as an area of meaning and the words used to talk about it [DDD ch.3 p.69] `RULE`
- In the bounded context of botany the tomato is a fruit, while in the bounded context of the culinary arts it's a vegetable [DDD ch.3 p.69] `RULE`
- Newton's laws of motion and Einstein's theory of relativity can be seen as contradictory, and both are useful in their suitable contexts [DDD ch.3 p.70] `RULE`
- The piece of cardboard cut to the size of the fridge's width and depth is a model, and its problem is whether the refrigerator can fit through the kitchen door [DDD ch.3 p.70] `RULE`

## Chapter 4 — Integrating Bounded Contexts, pp.75-86

- There will always be touchpoints between bounded contexts; these are called contracts [DDD ch.4 p.75] `RULE`
- The patterns are divided into three groups, each representing a type of team collaboration: cooperation, customer-supplier, and separate ways [DDD ch.4 p.75] `RULE`

### Cooperation, pp.76-78

- Cooperation patterns relate to bounded contexts implemented by teams with well-established communication [DDD ch.4 p.76] `RULE`
- In the partnership model, the integration between bounded contexts is coordinated in an ad hoc manner, and the coordination is two-way [DDD ch.4 p.76] `RULE`
- Well-established collaboration practices, high levels of commitment, and frequent synchronizations between teams are required for successful integration in this manner [DDD ch.4 p.76] `RULE`
- The partnership pattern might not be a good fit for geographically distributed teams [DDD ch.4 p.76] `RULE`
- The shared model is designed according to the needs of all of the bounded contexts, and has to be consistent across all of them [DDD ch.4 p.77] `RULE`
- The overlapping model should be limited, exposing only that part of the model that has to be implemented by both bounded contexts [DDD ch.4 p.77] `HEURISTIC`
- Each change to the shared kernel must trigger integration tests for all the affected bounded contexts [DDD ch.4 p.77] `RULE`
- The overarching applicability criterion for the shared kernel pattern is the cost of duplication versus the cost of coordination [DDD ch.4 p.78] `RULE`
- The shared kernel should be applied only when the cost of duplication is higher than the cost of coordination [DDD ch.4 p.78] `HEURISTIC`
- The shared kernel will naturally be applied for the subdomains that change the most: the core subdomains [DDD ch.4 p.78] `RULE`

The three justified cases for a shared kernel:

- Communication or collaboration issues prevent implementing the partnership pattern, for example because of geographical constraints or organizational politics [DDD ch.4 p.78] `RULE`
- The gradual modernization of a legacy system, as a temporary intermediate solution [DDD ch.4 p.78] `RULE`
- Integrating bounded contexts owned and implemented by the same team, to define the integration contracts explicitly [DDD ch.4 p.78] `RULE`

### Customer-supplier, pp.79-81

- The service provider is upstream and the customer or consumer is downstream [DDD ch.4 p.79] `RULE`
- Both upstream and downstream teams can succeed independently, which produces an imbalance of power [DDD ch.4 p.79] `RULE`

| Balance of power | Pattern | Citation |
|---|---|---|
| Favors the upstream team, and the downstream team can accept the upstream model | Conformist: the downstream conforms to the upstream bounded context's model | [DDD ch.4 p.79] `RULE` |
| Favors the upstream team, and the downstream is not willing to conform | Anticorruption layer: the downstream translates the upstream model into a model tailored to its own needs | [DDD ch.4 p.80] `RULE` |
| Skewed toward the consumers | Open-host service: the upstream supplier decouples the implementation model from the public interface | [DDD ch.4 p.81] `RULE` |
| anything else | — | HALT (`AMBIGUOUS_IN_BOOK`) |

The three anticorruption layer criteria, p.80:

- The downstream bounded context contains a core subdomain, whose model requires extra attention [DDD ch.4 p.80] `RULE`
- The upstream model is inefficient or inconvenient for the consumer's needs, which is often the case with legacy systems [DDD ch.4 p.80] `RULE`
- The supplier's contract changes often, and the consumer wants to protect its model [DDD ch.4 p.80] `RULE`

- The supplier's public protocol is called the published language [DDD ch.4 p.81] `RULE`
- The open-host service pattern is a reversal of the anticorruption layer pattern: the supplier implements the translation of its internal model [DDD ch.4 p.81] `RULE`
- The upstream bounded context can simultaneously expose multiple versions of the published language, allowing the consumer to migrate gradually [DDD ch.4 p.81] `RULE`

### Separate ways, pp.82-83

The three reasons the book names:

- Communication issues driven by the organization's size or internal politics [DDD ch.4 p.82] `RULE`
- The subdomain in question is generic and the generic solution is easy to integrate locally in each bounded context [DDD ch.4 p.82] `RULE`
- Model differences so large that a conformist relationship is impossible and an anticorruption layer would be more expensive than duplicating the functionality [DDD ch.4 pp.82-83] `RULE`
- The separate ways pattern should be avoided when integrating core subdomains [DDD ch.4 p.83] `HEURISTIC`

### Context map, pp.83-84

- The context map is a visual representation of the system's bounded contexts and the integrations between them [DDD ch.4 p.83] `RULE`

| Level of insight | What the map gives | Citation |
|---|---|---|
| High-level design | An overview of the system's components and the models they implement | [DDD ch.4 p.83] `RULE` |
| Communication patterns | Which teams are collaborating and which use less intimate integration patterns | [DDD ch.4 p.83] `RULE` |
| Organizational issues | For example, that an upstream team's downstream consumers all resort to an anticorruption layer | [DDD ch.4 p.83] `RULE` |
| anything else | — | HALT (`OUT_OF_SCOPE`) |

- The maintenance of the context map is a shared effort: each team is responsible for updating its own integrations [DDD ch.4 p.84] `RULE`
- When a system's bounded contexts encompass multiple subdomains, there can be multiple integration patterns at play [DDD ch.4 p.84] `RULE`

### The six-pattern summary, p.85

| Pattern | Definition | Citation |
|---|---|---|
| Partnership | Bounded contexts are integrated in an ad hoc manner | [DDD ch.4 p.85] `RULE` |
| Shared kernel | Two or more bounded contexts are integrated by sharing a limited overlapping model that belongs to all participating bounded contexts | [DDD ch.4 p.85] `RULE` |
| Conformist | The consumer conforms to the service provider's model | [DDD ch.4 p.85] `RULE` |
| Anticorruption layer | The consumer translates the service provider's model into a model that fits the consumer's needs | [DDD ch.4 p.85] `RULE` |
| Open-host service | The service provider implements a published language, a model optimized for its consumers' needs | [DDD ch.4 p.85] `RULE` |
| Separate ways | It's less expensive to duplicate particular functionality than to collaborate and integrate it | [DDD ch.4 p.85] `RULE` |
| anything else | — | HALT (`OUT_OF_SCOPE`) |

## See also

`ddd-part-2-tactical-design.md`, `ddd-part-3-in-practice.md`,
`ddd-vocabulary.md`, `../rules/ddd-heuristic-status.md`,
`../rules/ddd-required-inputs.md`.

# DDD Part III: Applying Domain-Driven Design in Practice

Chapters 10-13, PDF pages 185-240. The part opener is pp.183-184; see
`ddd-part-openers.md`.

Chapter 10 is the router: it turns the strategic classification of Part I into
the tactical selections of Part II. The whole chapter is graded `HEURISTIC`,
because the chapter grades itself that way.

## Chapter 10 — Design Heuristics, pp.185-194

### Bounded context boundaries, pp.186-187

- Both wide and narrow boundaries could fit the definition of a valid bounded context encompassing a consistent ubiquitous language [DDD ch.10 p.186] `RULE`

The page answers the size question by quoting Nick Tune, and the pack prints the
quote rather than paraphrasing it:

```ddd-quote [DDD ch.10 p.186]
There are many useful and revealing heuristics for defining the boundaries of a service. Size is one of the least useful.
```

- Rather than making the model a function of the desired size, it is much more effective to treat the bounded context's size as a function of the model it encompasses [DDD ch.10 p.186] `RULE`
- Software changes affecting multiple bounded contexts are expensive and require lots of coordination [DDD ch.10 p.186] `RULE`
- Such changes that are not encapsulated in a single bounded context signal ineffective design of the contexts' boundaries [DDD ch.10 p.186] `RULE`
- Broad bounded context boundaries make it safer to be wrong about the boundaries or the models of the included subdomains [DDD ch.10 p.187] `RULE`
- Refactoring logical boundaries is much less expensive than refactoring physical boundaries [DDD ch.10 p.187] `RULE`
- Hence, when designing bounded contexts, start with wider boundaries, and decompose the wide boundaries into smaller ones as you gain domain knowledge [DDD ch.10 p.187] `HEURISTIC`
- This heuristic applies mainly to bounded contexts encompassing core subdomains, as both generic and supporting subdomains are more formularized and much less volatile [DDD ch.10 p.187] `HEURISTIC`
- When creating a bounded context that contains a core subdomain, you can protect yourself against unforeseen changes by including other subdomains that the core subdomain interacts with most often [DDD ch.10 p.187] `HEURISTIC`

### The ordered four-question business logic heuristic, p.188

Evaluated first-match-wins, in this order. The prose on p.188 is the source;
Figure 10-3 is a picture of it.

| Question | Answer | Citation |
|---|---|---|
| Does the subdomain track money or other monetary transactions, or have to provide a consistent audit log, or is deep analysis of its behavior required by the business? | Use the event-sourced domain model | [DDD ch.10 p.188] `HEURISTIC` |
| Is the subdomain's business logic complex? | Implement a domain model | [DDD ch.10 p.188] `HEURISTIC` |
| Does the subdomain include complex data structures? | Use the active record pattern | [DDD ch.10 p.188] `HEURISTIC` |
| anything else | Implement a transaction script | [DDD ch.10 p.188] `HEURISTIC` |

This is the one table in the pack whose `anything else` row is an answer rather
than a halt, because the book prints a terminal default branch.

- Both the transaction script and active record patterns are better suited for subdomains with simple business logic: supporting subdomains or integrating a third-party solution for a generic subdomain [DDD ch.10 p.187] `RULE`
- The difference between the two patterns is the complexity of the data structures [DDD ch.10 p.187] `RULE`
- The domain model and its variant, the event-sourced domain model, lend themselves to subdomains that have complex business logic: core subdomains [DDD ch.10 p.188] `RULE`
- Since there is a strong relationship between a subdomain's complexity and its type, the heuristics can be visualized using a domain-driven decision tree [DDD ch.10 p.188] `HEURISTIC`

### The complexity criteria, pp.188-189

- Complex business logic includes complicated business rules, invariants, and algorithms, while a simple approach mainly revolves around validating the inputs [DDD ch.10 pp.188-189] `HEURISTIC`
- Another heuristic for evaluating complexity concerns the complexity of the ubiquitous language itself: is it mainly describing CRUD operations, or more complicated business processes and rules [DDD ch.10 p.189] `HEURISTIC`
- The line between these two types of business logic is not terribly sharp, but it's useful [DDD ch.10 p.188] `HEURISTIC`

### The architecture mapping and its single exception, p.189

| Business logic pattern | Architectural pattern | Citation |
|---|---|---|
| Event-sourced domain model | Requires CQRS, otherwise the system will be extremely limited in its data querying options | [DDD ch.10 p.189] `HEURISTIC` |
| Domain model | Requires the ports & adapters architecture, otherwise the layered architecture makes it hard to make aggregates and value objects ignorant of persistence | [DDD ch.10 p.189] `HEURISTIC` |
| Active record | Best accompanied by a layered architecture with the additional application service layer, for the logic controlling the active records | [DDD ch.10 p.189] `HEURISTIC` |
| Transaction script | Can be implemented with a minimal layered architecture, consisting of only three layers | [DDD ch.10 p.189] `HEURISTIC` |
| anything else | — | HALT (`OUT_OF_SCOPE`) |

- The only exception to the preceding heuristics is the CQRS pattern, which can be beneficial not only for the event-sourced domain model but also for any other pattern if the subdomain requires representing its data in multiple persistent models [DDD ch.10 p.189] `HEURISTIC`

### The validation loop back onto subdomain type, p.189

- Deciding on the business logic implementation pattern according to the complexity of the business logic and its data structures is a way to validate your assumptions about the subdomain type [DDD ch.10 p.189] `HEURISTIC`
- Suppose you take it to be a core subdomain, but the best pattern is active record or transaction script: that is the mismatch [DDD ch.10 p.189] `HEURISTIC`
- Suppose what you believe is a supporting subdomain requires a domain model or an event-sourced domain model: it's an excellent opportunity to revisit your assumptions about the subdomain [DDD ch.10 p.189] `HEURISTIC`
- A core subdomain's competitive advantage is not necessarily technical [DDD ch.10 p.189] `RULE`

This loop is mandatory. A selection printed without it is an incomplete answer.

### The testing-strategy mapping, pp.190-191

- The knowledge of both the business logic implementation pattern and the architectural pattern can be used as a heuristic for choosing a testing strategy for the codebase [DDD ch.10 p.190] `HEURISTIC`
- The difference between the testing strategies is their emphasis on the different types of tests: unit, integration, and end-to-end [DDD ch.10 p.191] `RULE`

| Business logic pattern | Testing strategy | Citation |
|---|---|---|
| Domain model, and event-sourced domain model | Testing pyramid, which emphasizes unit tests: aggregates and value objects make perfect units for effectively testing the business logic | [DDD ch.10 p.191] `HEURISTIC` |
| Active record | Testing diamond, which focuses the most on integration tests, because the business logic is spread across both the service and business logic layers | [DDD ch.10 p.191] `HEURISTIC` |
| Transaction script | Reversed testing pyramid, which attributes the most attention to end-to-end tests, because the business logic is simple and the number of layers is minimal | [DDD ch.10 p.191] `HEURISTIC` |
| anything else | — | HALT (`OUT_OF_SCOPE`) |

**The active record misprint.** Two figures route active record to the testing
diamond, and one sentence under the "Testing Diamond" heading contradicts them:

```ddd-quote [DDD ch.10 p.191]
Therefore, to focus on integrating the two layers, the testing pyramid is the more effective choice.
```

The pack emits *testing diamond*, because Figure 10-6 and Figure 10-7 both route
active record there, and prints the sentence above as evidence. Halting here
would make the pack useless at the one point it was asked a question.

### The unified tree, p.192

- The business logic patterns, architectural patterns, and testing strategy heuristics can be unified and summarized with a tactical design decision tree [DDD ch.10 p.192] `HEURISTIC`
- Identifying subdomains types and following the decision tree gives you a solid starting point for making the essential design decisions, per Figure 10-7 [DDD ch.10 p.192] `HEURISTIC`

The tree's own grade, in the book's words:

```ddd-quote [DDD ch.10 p.192]
these are heuristics, not hard rules
```

```ddd-quote [DDD ch.10 p.192]
There is an exception to every rule, let alone heuristics, that by definition are not intended to be correct in 100% of the cases.
```

### Where the book declines to generalize, p.193

- The decision tree is based on my preference to use the simple tools, and resort to the advanced patterns only when absolutely necessary [DDD ch.10 p.193] `PREFERENCE`
- Teams with a lot of experience implementing the event-sourced domain model use it for all their subdomains, and for them it's simpler than using different patterns [DDD ch.10 p.193] `RULE`

The endorsement is the one thing p.193 withholds, and the halt code
`BOOK_DECLINES_TO_GENERALIZE` exists for exactly this sentence:

```ddd-quote [DDD ch.10 p.193]
Can I recommend this approach to everyone? Of course not.
```

```ddd-quote [DDD ch.10 p.193]
but not as a replacement for critical thinking
```

- If you find that alternative heuristics fit you better, you are free to alter the guiding principles or build your own decision tree altogether [DDD ch.10 p.193] `HEURISTIC`
- Making design decisions is important, but even more so is to verify the decisions' validity over time [DDD ch.10 p.193] `HEURISTIC`

The last line is why every heuristic answer records a review trigger.

## Chapter 11 — Evolving Design Decisions, pp.195-210

### The four vectors of change, p.195

- The four most common vectors of change are business domain, organizational structure, domain knowledge, and growth [DDD ch.11 p.195] `RULE`
- It is equally important to be alert to the evolution of the subdomains [DDD ch.11 p.196] `RULE`

### The six subdomain-type transitions, pp.196-198

| Transition | Trigger | Citation |
|---|---|---|
| Core to generic | An off-the-shelf product becomes available, so the optimal solution is available to all competitors | [DDD ch.11 p.196] `RULE` |
| Generic to core | The company replaces the off-the-shelf solution with its own implementation, which provides additional competitive advantage over its competitors | [DDD ch.11 pp.196-197] `RULE` |
| Supporting to generic | An open source or commercial solution implements the same functionality with more advanced features, and the company ditches the in-house solution | [DDD ch.11 p.197] `RULE` |
| Supporting to core | The company finds a way to optimize the supporting logic so that it either reduces costs or generates additional profits | [DDD ch.11 p.197] `RULE` |
| Core to supporting | The subdomain's complexity isn't justified, so the organization cuts the extraneous complexity, leaving the minimum logic needed | [DDD ch.11 p.198] `RULE` |
| Generic to supporting | The complexity of integrating the solution doesn't justify the benefits, and the company resorts back to the in-house system | [DDD ch.11 p.198] `RULE` |
| anything else | — | HALT (`OUT_OF_SCOPE`) |

### The profitability test, p.197

- The typical symptom of a supporting subdomain becoming core is the increasing complexity of the supporting subdomain's business logic [DDD ch.11 p.197] `RULE`
- If the additional complexity doesn't affect the company's profits, that's accidental business complexity [DDD ch.11 p.197] `RULE`
- If it enhances the company's profitability, it's a sign of a supporting subdomain becoming a core subdomain [DDD ch.11 p.197] `RULE`

### Strategic consequences, pp.198-199

- The core subdomains have to protect their models by using anticorruption layers, and have to protect consumers from frequent changes in the implementation models by using published languages [DDD ch.11 p.198] `RULE`
- If the subdomain morphs into a core subdomain, duplicating its functionality by multiple teams is no longer acceptable, and the teams have no choice but to integrate their implementations [DDD ch.11 p.199] `RULE`
- The customer-supplier relationship makes the most sense in that case, since the core subdomain will only be implemented by one team [DDD ch.11 p.199] `RULE`
- Core subdomains must be implemented in-house, as close as possible to the sources of domain knowledge [DDD ch.11 p.199] `RULE`
- When a supporting subdomain turns into a core subdomain, its implementation should be moved in-house [DDD ch.11 p.199] `HEURISTIC`
- The main indicator of a change in a subdomain's type is the inability of the existing technical design to support current business needs [DDD ch.11 p.199] `RULE`
- This pain is an important signal: use it as a call to reassess the business domain and design choices [DDD ch.11 p.199] `RULE`

### The ordered active record to domain model procedure, pp.200-201

1. When working with data becomes challenging in a transaction script, refactor it into the active record pattern, looking for complicated data structures [DDD ch.11 p.200] `RULE`
2. If the business logic that manipulates active records becomes complex and you notice inconsistencies and duplications, refactor the implementation to the domain model pattern [DDD ch.11 p.200] `RULE`
3. Start by identifying value objects: what data structures can be modeled as immutable objects, with their related business logic [DDD ch.11 p.200] `RULE`
4. Make all of the active records' setters private so that they can only be modified from inside the active record itself; the compilation errors will make it clear where the state-modifying logic resides [DDD ch.11 p.200] `RULE`
5. Move that logic inside the active record's boundary [DDD ch.11 p.201] `RULE`
6. Examine what hierarchies are needed to ensure strongly consistent checking of business rules and invariants; those are good candidates for aggregates [DDD ch.11 p.201] `RULE`
7. Look for the smallest transaction boundaries, decompose the hierarchies along those boundaries, and make sure the external aggregates are only referenced by their IDs [DDD ch.11 p.201] `RULE`
8. For each aggregate, identify its root, and make the methods of all the other internal objects private and only callable from within the aggregate [DDD ch.11 p.201] `RULE`

### The two history-migration strategies, pp.202-204

Both are printed with advantages and disadvantages, and neither is chosen. This
is a genuine `AMBIGUOUS_IN_BOOK` trigger.

| Strategy | Advantage | Disadvantage | Citation |
|---|---|---|---|
| Generating past transitions | The recovered events can be easily tested by projecting the state and comparing it to the original data | It's impossible to recover the complete history of state transitions | [DDD ch.11 p.203] `RULE` |
| Modeling migration events | It makes the lack of past data explicit, so no one can mistakenly assume the stream captures all domain events | The traces of the legacy system will remain in the event store forever | [DDD ch.11 p.203] `RULE` |
| anything else | — | — | HALT (`AMBIGUOUS_IN_BOOK`) |

- The most challenging aspect of refactoring a domain model into an event-sourced domain model is the history of the existing aggregates [DDD ch.11 p.202] `RULE`
- Since the fine-grained data representing all the past state changes is not there, you have to either generate past events on a best-effort basis or model migration events [DDD ch.11 p.202] `RULE`

### The organizational transitions, pp.204-205

- Changes in the organization's structure can affect teams' communication and collaboration levels and, as a result, the ways the bounded contexts should be integrated [DDD ch.11 p.204] `HEURISTIC`
- Since a bounded context can be implemented by only one team, adding new development teams can cause the existing wider bounded context boundaries to split into smaller ones [DDD ch.11 p.204] `RULE`
- Partnership to customer-supplier: when work on one of the bounded contexts is moved to a distant development center, the change negatively affects the teams' communication [DDD ch.11 p.205] `RULE`
- Customer-supplier to separate ways: with severe communication problems caused by geographical distance or organizational politics, it may become more cost-effective to duplicate the functionality [DDD ch.11 p.205] `RULE`
- From a strategic design standpoint, it's a useful heuristic to design the bounded contexts' boundaries according to the level of domain knowledge [DDD ch.11 p.205] `HEURISTIC`
- When the domain logic is unclear and changes often, it makes sense to design the bounded contexts with broader boundaries [DDD ch.11 p.205] `RULE`

### The growth checklist, pp.206-209

- The guiding principle for dealing with growth-driven complexity is to identify and eliminate accidental complexity: the complexity caused by outdated design decisions [DDD ch.11 p.206] `RULE`
- The essential complexity, the inherent complexity of the business domain, should be managed using domain-driven design tools and practices [DDD ch.11 p.206] `HEURISTIC`
- Instead of striving for boundaries that are perfect, we must strive for boundaries that are useful [DDD ch.11 p.206] `RULE`
- Revisit the identified subdomains and follow the heuristic of coherent use cases to try to identify where to split a subdomain [DDD ch.11 p.207] `HEURISTIC`
- We should always aim to distill core subdomains as much as possible from all others [DDD ch.11 p.207] `HEURISTIC`
- Revisit the bounded contexts' boundaries from time to time, and always look for opportunities to simplify the models by extracting bounded contexts that are laser focused [DDD ch.11 p.207] `RULE`
- Bounded contexts that become increasingly chatty over time can be a strong signal of an ineffective model and should be addressed by redesigning the boundaries to increase their autonomy [DDD ch.11 p.207] `HEURISTIC`
- If an aggregate grows to include data that is not needed to be strongly consistent by all of its business logic, that's accidental complexity that has to be eliminated [DDD ch.11 p.208] `RULE`
- Extracting business functionality into a dedicated aggregate not only simplifies the original aggregate, but potentially can simplify the bounded context it belongs to [DDD ch.11 p.208] `RULE`
- Make sure your aggregates' boundaries are as small as possible, using the heuristic of strongly consistent data [DDD ch.11 p.209] `HEURISTIC`

## Chapter 12 — EventStorming, pp.211-225

### What it is

- EventStorming is a low-tech activity for a group of people to brainstorm and rapidly model a business process [DDD ch.12 p.211] `RULE`
- An EventStorming session has a scope: the business process that the group is interested in exploring [DDD ch.12 p.211] `RULE`
- The participants explore the process as a series of domain events, represented by sticky notes, over a timeline [DDD ch.12 p.211] `RULE`

### The supplies checklist, pp.212-213

| Supply | Requirement | Citation |
|---|---|---|
| Modeling space | A whole wall covered with butcher paper, or a whiteboard as big as possible | [DDD ch.12 p.212] `RULE` |
| Sticky notes | Lots, of different colors, enough for everyone | [DDD ch.12 p.212] `RULE` |
| Markers | Enough for all participants | [DDD ch.12 p.212] `RULE` |
| Snacks | A typical session lasts about two to four hours | [DDD ch.12 p.212] `RULE` |
| Room | Spacious, no huge table in the middle, and chairs taken out of the room | [DDD ch.12 p.213] `RULE` |
| anything else | — | HALT (`OUT_OF_SCOPE`) |

- It's best to stick to the traditional color conventions, to be consistent with all of the currently available EventStorming books and trainings [DDD ch.12 p.212] `HEURISTIC`

### The participant caps, pp.212 and 224

- Ideally, a diverse group of people should participate: engineers, domain experts, product owners, testers, UI and UX designers, support personnel [DDD ch.12 p.212] `HEURISTIC`
- Every participant should be able to contribute to the process, but this can be challenging for groups of more than 10 participants [DDD ch.12 p.212] `HEURISTIC`
- Remote sessions are more effective with a smaller number of participants, and I prefer to limit online sessions to five participants [DDD ch.12 p.224] `PREFERENCE`
- When you need more participants to contribute their knowledge, you can facilitate multiple sessions, and afterward compare and merge the resultant models [DDD ch.12 p.224] `RULE`
- When the situation allows, return to in-person EventStorming [DDD ch.12 p.224] `RULE`

### The ten ordered steps, pp.213-221

1. Unstructured exploration: brainstorm the domain events related to the business domain being explored, formulated in the past tense, until the rate of adding new ones slows significantly [DDD ch.12 pp.213-214] `RULE`
2. Timelines: organize the events in the order in which they occur, starting with the happy path scenario, then alternative scenarios [DDD ch.12 p.214] `RULE`
3. Pain points: identify points in the process that require attention, such as bottlenecks, manual steps that require automation, missing documentation, or missing domain knowledge [DDD ch.12 p.215] `RULE`
4. Pivotal events: look for significant business events indicating a change in context or phase, marked with a vertical bar [DDD ch.12 p.216] `RULE`
5. Commands: describe what triggered the event or flow of events, formulated in the imperative, placed before the events they can produce [DDD ch.12 pp.216-217] `RULE`
6. Policies: look for automation policies that execute the commands with no specific actor, where an event triggers the execution of a command [DDD ch.12 p.217] `RULE`
7. Read models: the view of data within the domain that the actor uses to make a decision to execute a command, positioned before the commands [DDD ch.12 p.218] `RULE`
8. External systems: any system that is not a part of the domain being explored, which can execute commands or be notified about events [DDD ch.12 p.219] `RULE`
9. Aggregates: organize related concepts in aggregates; an aggregate receives commands and produces events [DDD ch.12 p.220] `RULE`
10. Bounded contexts: look for aggregates that are related to each other, either because they represent closely related functionality or because they're coupled through policies [DDD ch.12 p.220] `RULE`

### The sticky-note colour legend, pp.214-220

| Element | Sticky note | Citation |
|---|---|---|
| Domain event | Orange | [DDD ch.12 p.214] `RULE` |
| Pain point | Rotated diamond pink | [DDD ch.12 p.215] `RULE` |
| Command | Light blue | [DDD ch.12 p.217] `RULE` |
| Actor | Small yellow | [DDD ch.12 p.217] `RULE` |
| Policy | Purple, connecting events to commands | [DDD ch.12 p.217] `RULE` |
| Read model | Green | [DDD ch.12 p.218] `RULE` |
| External system | Pink | [DDD ch.12 p.219] `RULE` |
| Aggregate | Large yellow, with commands on the left and events on the right | [DDD ch.12 p.220] `RULE` |
| anything else | — | HALT (`OUT_OF_SCOPE`) |

- The actor represents a user persona within the business domain, such as customer, administrator, or editor [DDD ch.12 p.217] `RULE`
- Add the actor information only where it's obvious; not all commands will have an associated actor [DDD ch.12 p.217] `RULE`
- Pivotal events are an indicator of potential bounded context boundaries [DDD ch.12 p.216] `RULE`
- The groups of aggregates form natural candidates for bounded contexts' boundaries [DDD ch.12 p.220] `RULE`

### The step-8 completeness check, p.220

- By the end of step 8, all commands should either be executed by actors, triggered by policies, or called by external systems [DDD ch.12 p.220] `HEURISTIC`

### Variants, p.221

- Alberto Brandolini defines the EventStorming process as guidance, not hard rules, and you are free to experiment with the process [DDD ch.12 p.221] `RULE`
- When introducing EventStorming in an organization I prefer to start by exploring the big picture, following steps 1 through 4 [DDD ch.12 p.221] `PREFERENCE`
- The real value of an EventStorming session is the process itself: the sharing of knowledge among different stakeholders [DDD ch.12 p.221] `RULE`

### The six reasons to run it, and the one case not to, p.222

| Reason | Citation |
|---|---|
| Build a ubiquitous language | [DDD ch.12 p.222] `RULE` |
| Model the business process | [DDD ch.12 p.222] `RULE` |
| Explore new business requirements | [DDD ch.12 p.222] `RULE` |
| Recover domain knowledge | [DDD ch.12 p.222] `RULE` |
| Explore ways to improve an existing business process | [DDD ch.12 p.222] `RULE` |
| Onboard new team members | [DDD ch.12 p.222] `RULE` |
| anything else | HALT (`OUT_OF_SCOPE`) |

- EventStorming will be less successful when the business process you're exploring is simple or obvious, such as following a series of sequential steps without any interesting business logic or complexity [DDD ch.12 p.222] `RULE`

### Facilitation, pp.222-224

- When facilitating with a group who have never done EventStorming before, I prefer to start with a quick overview of the process and build a legend [DDD ch.12 p.222] `PREFERENCE`
- Track the energy of the group; if the dynamics are slowing down, ask questions or advance to the next stage [DDD ch.12 p.223] `RULE`
- Make sure everyone has a chance to participate in the modeling and the discussion [DDD ch.12 p.223] `RULE`
- Don't resume the session until all the participants are back in the room [DDD ch.12 p.223] `RULE`

## Chapter 13 — Domain-Driven Design in the Real World, pp.227-240

### Framing

- The projects that can benefit from DDD the most are the brownfield projects: those that already proved their business viability and need a shake-up to fight accumulated technical debt and design entropy [DDD ch.13 p.227] `RULE`
- Domain-driven design is not an all-or-nothing proposition; you don't have to apply all of the patterns and practices to gain value from it [DDD ch.13 p.227] `RULE`

### Brownfield strategic analysis, pp.228-230

- The best starting point for introducing DDD in an organization is to invest time in understanding the organization's business strategy and the current state of its systems' architecture [DDD ch.13 p.228] `RULE`
- First, identify the company's business domain, its customers, the value it provides, and the companies or products it competes with [DDD ch.13 p.228] `RULE`
- A good initial heuristic is the company's org chart: its departments and other organizational units [DDD ch.13 p.228] `HEURISTIC`
- To identify core subdomains, look for what differentiates the company from its competitors, such as intellectual property designed in-house [DDD ch.13 p.228] `RULE`
- The competitive advantage, and thus the core subdomains, are not necessarily technical [DDD ch.13 p.228] `RULE`
- Another powerful yet unfortunate heuristic for core subdomains is identifying the worst-designed software components that the business is unwilling to rewrite from scratch because of the accompanying business risk [DDD ch.13 p.229] `HEURISTIC`
- To identify generic subdomains, look for off-the-shelf solutions, subscription services, or integration of open source software [DDD ch.13 p.229] `RULE`
- For supporting subdomains, look for the remaining software components that cannot be replaced with ready-made solutions yet do not directly provide a competitive advantage [DDD ch.13 p.229] `RULE`
- You don't have to identify all of the core subdomains; identify the overall structure, but pay closer attention to the subdomains most relevant to the software systems you are working on [DDD ch.13 p.229] `RULE`
- The characteristic property to look for in high-level components is their decoupled lifecycles: which can be evolved, tested, and deployed independently [DDD ch.13 p.229] `RULE`
- Chart the current design's context map as though these high-level components were bounded contexts, and identify the relationships in terms of integration patterns [DDD ch.13 p.230] `RULE`

The suboptimal strategic design decisions p.230 names: multiple teams working on
the same high-level component, duplicate implementations of core subdomains,
implementation of a core subdomain by an outsourced company, friction because of
frequently failing integration, and awkward models spreading from external
services and legacy systems [DDD ch.13 p.230] `RULE`.

### Modernization strategy, pp.230-233

- The big rewrite endeavors are rarely successful, and even more rarely does management support such architectural makeovers [DDD ch.13 p.230] `RULE`
- A safer approach is to think big but start small [DDD ch.13 p.231] `RULE`
- Start by ensuring that at least the logical boundaries are aligned with the subdomains' boundaries [DDD ch.13 p.231] `RULE`
- Adjusting the system's modules is a relatively safe form of refactoring: you are not modifying the business logic, just repositioning the types [DDD ch.13 p.231] `RULE`
- Keep track of the subdomains' business logic implemented in different codebases, such as stored procedures in a database or serverless functions, and introduce the new boundaries there as well [DDD ch.13 p.231] `RULE`
- It can be risky to prematurely decompose the system into the smallest bounded contexts possible [DDD ch.13 p.231] `RULE`
- Look for where the most value can be gained by turning the logical boundaries into physical boundaries [DDD ch.13 p.231] `RULE`

### The two boundary questions, p.232

| Question | Action | Citation |
|---|---|---|
| Are multiple teams working on the same codebase? | Decouple the development lifecycles by defining bounded contexts for each team | [DDD ch.13 p.232] `RULE` |
| Are conflicting models being used by the different components? | Relocate the conflicting models into separate bounded contexts | [DDD ch.13 p.232] `RULE` |
| anything else | — | HALT (`REQUIRES_ORG_INPUT`) |

### The modernization pattern mapping, pp.232-233

| Problem | Pattern | Citation |
|---|---|---|
| A partnership relationship of multiple engineering teams that is no longer sustainable | Refactor to the appropriate type of customer-supplier relationship: conformist, anticorruption layer, or open-host service | [DDD ch.13 p.232] `RULE` |
| Legacy systems using inefficient models that tend to spread into downstream components | Anticorruption layer | [DDD ch.13 p.232] `RULE` |
| Frequent changes in the public interfaces of an upstream service | Anticorruption layer | [DDD ch.13 p.233] `RULE` |
| Changes in the implementation details of one component often ripple through the system and affect its consumers | Open-host service: decouple its implementation model from the public API it exposes | [DDD ch.13 p.233] `RULE` |
| Friction among engineering teams over a shared functionality that is not a core subdomain | Separate ways: the teams implement their own solutions, eliminating the source of friction | [DDD ch.13 p.233] `RULE` |
| anything else | — | HALT (`OUT_OF_SCOPE`) |

- From a tactical standpoint, look for the most painful mismatches in business value and implementation strategies, such as core subdomains implementing transaction script or active record [DDD ch.13 p.233] `RULE`
- Use EventStorming to build a ubiquitous language with the domain experts and explore the legacy codebase [DDD ch.13 p.233] `RULE`

### The strangler pattern and its single shared-database condition, pp.234-235

- The idea is to create a new bounded context, the strangler, use it to implement new requirements, and gradually migrate the legacy context's functionality into it [DDD ch.13 p.234] `RULE`
- At the same time, except for hotfixes and other emergencies, the evolution and development of the legacy bounded context stops [DDD ch.13 p.234] `RULE`
- The strangler pattern is used in tandem with the façade pattern, a thin abstraction layer that forwards the requests to either the legacy or the modernized bounded context [DDD ch.13 p.234] `RULE`
- When migration completes, the façade is removed as it is no longer necessary [DDD ch.13 p.234] `RULE`
- Contrary to the principle that each bounded context is a separate subsystem and cannot share its database with other bounded contexts, the rule can be relaxed when implementing the strangler pattern [DDD ch.13 p.235] `RULE`
- The condition for bending the one-database-per-bounded-context rule is that eventually the legacy context will be retired, and the database will be used exclusively by the new implementation [DDD ch.13 p.235] `RULE`

### The safe refactoring order, p.236

1. Small incremental steps are safer than a big rewrite, so don't refactor a transaction script or active record straight to an event-sourced domain model [DDD ch.13 p.236] `RULE`
2. Take the intermediate step of designing state-based aggregates, and invest the effort in finding effective aggregate boundaries [DDD ch.13 p.236] `RULE`
3. Refactoring to a domain model doesn't have to be an atomic change: start by looking for possible value objects [DDD ch.13 p.236] `RULE`
4. Gather the related business logic, then analyze the transactional boundaries [DDD ch.13 p.236] `RULE`
5. Only after a thorough analysis of the transactional requirements should you design the aggregate's boundaries [DDD ch.13 p.236] `HEURISTIC`
6. Protect the new codebase from old models using an anticorruption layer, and protect the consumers from changes in the legacy codebase by implementing an open-host service and exposing a published language [DDD ch.13 p.236] `RULE`

- Going from state-based to event-sourced aggregates will be orders of magnitude safer than discovering wrong transactional boundaries in an event-sourced aggregate [DDD ch.13 p.236] `RULE`
- When analyzing the codebase, don't forget that these decisions are driven by business, not technology, concerns [DDD ch.13 p.236] `RULE`

### How much DDD to adopt, pp.236-237

The question is answered, not halted:

- As long as you analyze your business domain and its strategy, look for effective models to solve particular problems, and make design decisions based on the business domain's needs: that's domain-driven design [DDD ch.13 p.237] `RULE`
- Domain-driven design is not about aggregates or value objects; domain-driven design is about letting your business domain drive software design decisions [DDD ch.13 p.237] `RULE`
- Make domain-driven design a part of your professional toolbox, not an organizational strategy [DDD ch.13 p.237] `RULE`
- Listen carefully to the language the stakeholders use, and gently steer the terminology away from technical jargon and toward its business meaning [DDD ch.13 p.237] `RULE`
- When discussing tactical design patterns, don't appeal to authority; appeal to logic [DDD ch.13 p.238] `RULE`
- When the solution calls for an event-sourced domain model, talk to domain experts, show them the state- and event-based models, and explain the differences [DDD ch.13 p.239] `RULE`
- Modernize legacy code either by refactoring or by replacing the relevant components, and either way, do it gradually [DDD ch.13 p.239] `RULE`

## See also

`ddd-part-1-strategic-design.md`, `ddd-part-2-tactical-design.md`,
`ddd-part-4-relationships.md`, `../rules/ddd-heuristic-status.md`,
`ddd-decision-artifacts.md`.

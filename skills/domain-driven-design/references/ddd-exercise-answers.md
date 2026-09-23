# DDD exercise answers

Appendix B, PDF pages 315-321. **Pack-shared**, and the pack's regression test.

`/ddd-exercise` grades a skill's output against these pages. A chapter whose
answers the skills cannot reproduce is a gap in the pack, not a gap in the book.

## How to use this card

1. Answer the chapter's exercises from the skills alone, without reading this
   card.
2. Then compare. A mismatch is a defect report against the skill that owns those
   pages.
3. Definition of done for the pack: every question of every chapter reproduces exactly.
4. A line starting with `Qn:` is the answer to that numbered exercise. Where the
   book prints only a letter, this card prints only that letter: the question's
   options live on the chapter's own page, which step 3 of `/ddd-exercise` reads.

## Chapter 1, pp.315-316 — `ddd-subdomains`

- Only core subdomains provide competitive advantages that differentiate the company from other players in its industry [DDD app.B p.315] `RULE`
- Generic subdomains are complex but do not entail any competitive advantage, so it is preferable to use an existing, battle-proven solution [DDD app.B p.315] `HEURISTIC`
- Core subdomains are expected to be the most volatile since these are areas in which the company aims to provide new solutions [DDD app.B p.315] `RULE`

WolfDesk, graded:

| Question | Answer | Citation |
|---|---|---|
| Business domain | Help Desk management systems | [DDD app.B p.315] `RULE` |
| Core subdomains | Ticket lifecycle management algorithm, fraud detection system, support autopilot | [DDD app.B p.315] `RULE` |
| Supporting subdomains | Ticket categories management, products management, entry of support agents' work schedules | [DDD app.B p.315] `RULE` |
| Generic subdomains | Authenticating and authorizing users, external providers for authentication, the serverless compute infrastructure | [DDD app.B p.316] `RULE` |
| anything else | — | HALT (`OUT_OF_SCOPE`) |

## Chapter 2, p.316 — `ddd-ubiquitous-language`

- All of the project's stakeholders should contribute their knowledge and understanding of the business domain [DDD app.B p.316] `HEURISTIC`
- A ubiquitous language should be used in all project-related communication, and the software's source code should also speak its ubiquitous language [DDD app.B p.316] `HEURISTIC`
- WolfDesk's terms: tenants, onboarding process, charging period, ticket lifecycle management algorithm, fraud detection algorithm, support autopilot, support category, product, support agent, shift schedules [DDD app.B p.316] `RULE`

## Chapter 3, pp.316-317 — `ddd-bounded-contexts`

- Bounded contexts are designed, while subdomains are discovered [DDD app.B p.316] `RULE`
- A bounded context is a boundary of a model, of a lifecycle, and of ownership [DDD app.B p.316] `RULE`
- There is no perfect size of a bounded context for all projects and cases [DDD app.B p.316] `RULE`
- Different factors, such as models, organizational constraints, and nonfunctional requirements, affect the optimum scope of a bounded context [DDD app.B p.316] `RULE`
- A bounded context should be owned by one team only, and at the same time the same team can own multiple bounded contexts [DDD app.B p.316] `HEURISTIC`
- The operation model implementing the tickets' lifecycle will be different from the one used for fraud detection and the support autopilot feature [DDD app.B p.316] `RULE`
- Fraud detection algorithms usually require more analytics-oriented modeling, whereas the autopilot feature is likely to use a model optimized for machine learning algorithms [DDD app.B pp.316-317] `RULE`

## Chapter 4, p.317 — `ddd-integration-patterns`

- Separate ways: duplicating complex, volatile, and business-critical business logic should be avoided at all costs [DDD app.B p.317] `HEURISTIC`
- A core subdomain is most likely to leverage an anticorruption layer to protect itself from ineffective models exposed by upstream services [DDD app.B p.317] `RULE`
- A core subdomain is most likely to implement the open-host service [DDD app.B p.317] `RULE`
- The shared kernel pattern is an exception to the bounded contexts' single team ownership rule [DDD app.B p.317] `RULE`
- The shared part of the model should be always kept as small as possible [DDD app.B p.317] `HEURISTIC`

## Chapter 5, pp.317-318 — `ddd-simple-business-logic`

- Q1: C, neither transaction script nor active record can be used to implement a core subdomain, since both lend themselves to simple business logic [DDD app.B p.317] `RULE`
- Q2: D, all of the issues are possible: the agent's ActiveTickets counter will be increased by more than 1, the counter will be increased while the ticket itself won't be created, and the ticket is created and assigned but the notification won't be sent [DDD app.B p.317] `RULE`
- Q3: If the execution fails after line 12 and the caller retries the operation and it succeeds, the same ticket will be persisted and assigned twice [DDD app.B p.317] `RULE`
- Q4: All of WolfDesk's supporting subdomains are good candidates for implementation as transaction script or active record, as their business logic is relatively straightforward [DDD app.B p.317] `RULE`

## Chapter 6, p.318 — `ddd-domain-model`

- Q1: C, value objects are immutable, and they can contain both data and behavior [DDD app.B p.318] `RULE`
- Q2: B, aggregates should be designed to be as small as possible, as long as the business domain's data consistency requirements are intact [DDD app.B p.318] `HEURISTIC`
- Q3: B, to ensure correct transactional boundaries [DDD app.B p.318] `RULE`
- Q4: D, A and C [DDD app.B p.318] `RULE`
- Q5: B, an aggregate encapsulates all of its business logic, but business logic manipulating an active record can be located outside of its boundary [DDD app.B p.318] `RULE`

## Chapter 7, p.318 — `ddd-event-sourced-domain-model`

- Domain events use value objects to describe what has happened in the business domain [DDD app.B p.318] `RULE`
- Multiple state representations can be projected and you can always add additional projections in the future [DDD app.B p.318] `RULE`
- The ticket lifecycle algorithm is a good candidate to be implemented as an event-sourced domain model [DDD app.B p.318] `RULE`
- Generating domain events for all state transitions makes it more convenient to project additional state representations optimized for the fraud detection algorithm and the support autopilot functionality [DDD app.B p.318] `RULE`

## Chapter 8, p.318 — `ddd-architectural-patterns`

- Q1: D, A and C [DDD app.B p.318] `RULE`
- Q2: D, B and C [DDD app.B p.318] `RULE`
- Q3: C, infrastructure layer [DDD app.B p.318] `RULE`
- Q4: E, A and D [DDD app.B p.318] `RULE`
- Q5: Working with multiple models projected by the CQRS pattern doesn't contradict the bounded context's requirement of being a model boundary, since only one of the models is defined as the source of truth and is used for making changes in the aggregates' states [DDD app.B p.318] `RULE`

## Chapter 9, p.319 — `ddd-communication-patterns`

- Q1: D, B and C [DDD app.B p.319] `RULE`
- Q2: B, reliably publish messages [DDD app.B p.319] `RULE`
- Q3: The outbox pattern can be used to implement asynchronous execution of external components, for example it can be used for sending email messages [DDD app.B p.319] `RULE`
- Q4: E, A and D are correct [DDD app.B p.319] `RULE`

## Chapter 10, p.319 — `ddd-design-heuristics`

The three graded answers the router has to reproduce:

| WolfDesk component | Business logic | Architecture | Testing | Citation |
|---|---|---|---|---|
| Ticket lifecycle management | Event-sourced domain model | CQRS | Focuses on unit tests | [DDD app.B p.319] `RULE` |
| Agents' shift management | Active records | Layered | Primarily integration tests | [DDD app.B p.319] `HEURISTIC` |
| Public holidays provider integration | Transaction script | Layered | End-to-end tests, verifying the full integration flow | [DDD app.B p.319] `RULE` |
| anything else | — | — | — | HALT (`OUT_OF_SCOPE`) |

This table is the sharpest regression test in the pack: three inputs, three
complete answers, one page.

## Chapter 11, p.319 — `ddd-evolving-design-decisions`

- Q1: A, partnership to customer-supplier: as an organization grows, it can become more challenging for teams to integrate their bounded contexts in an ad hoc fashion, so they switch to a more formal integration pattern [DDD app.B p.319] `RULE`
- Q2: D, A and B, because bounded contexts go separate ways when the cost of duplication is lower than the overhead of collaboration [DDD app.B p.319] `RULE`
- Q2: C is incorrect because it's a terrible idea to duplicate implementation of a core subdomain, and consequently the separate ways pattern can be used for supporting and generic subdomains [DDD app.B p.319] `RULE`
- Q3: D, B and C [DDD app.B p.319] `RULE`
- Q4: F, A and C [DDD app.B p.319] `RULE`
- Q5: Upon reaching a certain level of growth, WolfDesk could implement its own compute platform to further optimize its ability to scale elastically and optimize its infrastructure costs [DDD app.B p.319] `RULE`

## Chapter 12, p.320 — `ddd-eventstorming`

- All stakeholders having knowledge of the business domain that you want to explore [DDD app.B p.320] `RULE`
- All the listed answers are sound reasons to facilitate an EventStorming session [DDD app.B p.320] `RULE`
- The outcome you should expect to get depends on your initial purpose for facilitating the session [DDD app.B p.320] `HEURISTIC`

## Chapter 13, p.320 — `ddd-evolving-design-decisions`

- Q1: B, analyze the organization's business domain and its strategy [DDD app.B p.320] `RULE`
- Q2: D, A and B [DDD app.B p.320] `RULE`
- Q3: C, A and B [DDD app.B p.320] `RULE`
- Q4: An aggregate with a bounded context-wide boundary may make all of the bounded context's data a part of one big transaction [DDD app.B p.320] `RULE`
- Q4: Once the transactional boundary is removed, it will no longer be possible to assume that the information residing in the aggregate is strongly consistent [DDD app.B p.320] `RULE`

## Chapter 14, p.320 — `ddd-microservice-boundaries`

- All microservices are bounded contexts, but not all bounded contexts are microservices [DDD app.B p.320] `RULE`
- What is micro is the knowledge of the business domain and its intricacies exposed across the service's boundary and reflected by its public interface [DDD app.B p.320] `RULE`
- The safe component boundaries are between bounded contexts, the widest, and microservices, the narrowest [DDD app.B p.320] `RULE`
- Whether to align microservices with the boundaries of aggregates is a decision that depends on the business domain [DDD app.B p.320] `RULE`

The last row is the answer key's own confirmation that the three
aggregate-as-service questions of p.254 carry no verdict.

## Chapter 15, p.320 — `ddd-communication-patterns`

Appendix B prints these four as answer letters, so the graded answers are
reproduced here in the page's own words. The questions they answer are on p.273.

- Question 1: A and B are correct [DDD app.B p.320] `RULE`
- Question 2: event-carried state transfer [DDD app.B p.320] `RULE`
- Question 3: open-host service [DDD app.B p.320] `RULE`
- Question 4: S2 should publish public event notifications, which will signal S1 to issue a synchronous request to get the most up-to-date information [DDD app.B p.320] `HEURISTIC`

## Chapter 16, p.321 — `../references/ddd-analytical-data.md`

- Q1: D, A and C are correct [DDD app.B p.321] `RULE`
- Q2: B, open-host service: one of the published languages exposed by the open-host service can be OLAP data optimized for analytical processing [DDD app.B p.321] `RULE`
- Q3: C, CQRS: the CQRS pattern can be leveraged to generate projections of the OLAP model out of the transactional model [DDD app.B p.321] `RULE`
- Q4: A, bounded contexts [DDD app.B p.321] `RULE`


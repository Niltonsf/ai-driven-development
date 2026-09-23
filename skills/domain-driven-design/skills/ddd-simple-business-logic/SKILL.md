---
name: ddd-simple-business-logic
description: Applies or audits the transaction script and active record patterns, including the three ways transactional behavior is commonly broken and their remedies. Invoke when the request mentions transaction script, active record, CRUD or ETL business logic, an operation that updates a table and then publishes a message, a counter that gets incremented twice, or asks whether simple business logic fits a subdomain.
---

# DDD Simple Business Logic

## Source

Page scope: `[DDD ch.5 pp.89-99]`. This skill may cite no other page, except
the pack-shared ranges in `../../rules/ddd-source-of-truth.md`.

## Rules

1. The transaction script pattern organizes business logic by procedures where each procedure handles a single request from the presentation [DDD ch.5 p.89] `RULE`
2. The system's public operations are used as encapsulation boundaries [DDD ch.5 p.89] `RULE`
3. Each procedure is implemented as a simple, straightforward procedural script, free to access the databases directly [DDD ch.5 p.90] `RULE`
4. The only requirement procedures have to fulfill is transactional behavior [DDD ch.5 p.90] `RULE`
5. Each operation should either succeed or fail but can never result in an invalid state [DDD ch.5 p.90] `HEURISTIC`
6. It is the easiest pattern to get wrong [DDD ch.5 p.90] `RULE`
7. Distributed transactions spanning multiple storage mechanisms are complex, hard to scale, error prone, and are usually avoided [DDD ch.5 p.92] `HEURISTIC`
8. The transaction script pattern is well adapted to the most straightforward problem domains in which the business logic resembles simple procedural operations [DDD ch.5 p.94] `RULE`
9. The transaction script pattern naturally fits supporting subdomains where, by definition, the business logic is simple [DDD ch.5 p.95] `RULE`
10. It can also be used as an adapter for integration with external systems, for example generic subdomains, or as a part of an anticorruption layer [DDD ch.5 p.95] `RULE`
11. The main advantage of the transaction script pattern is its simplicity: it introduces minimal abstractions and minimizes the overhead [DDD ch.5 p.95] `RULE`
12. The more complex the business logic gets, the more it is prone to duplicate business logic across transactions [DDD ch.5 p.95] `RULE`
13. Transaction script should never be used for core subdomains [DDD ch.5 p.95] `HEURISTIC`
14. An active record is an object that wraps a row in a database table or view, encapsulates the database access, and adds domain logic on that data [DDD ch.5 p.95] `RULE`
15. Active record objects are coupled to an object-relational mapping or some other data access framework [DDD ch.5 p.96] `RULE`
16. The system's business logic is still organized in a transaction script; the difference is that it manipulates active record objects instead of accessing the database directly [DDD ch.5 p.96] `RULE`
17. The pattern's goal is to encapsulate the complexity of mapping the in-memory object to the database's schema [DDD ch.5 p.97] `RULE`
18. The distinctive feature of an active record object is the separation of data structures and behavior [DDD ch.5 p.97] `RULE`
19. An active record's fields usually have public getters and setters that allow external procedures to modify its state [DDD ch.5 p.97] `RULE`
20. This pattern can only support relatively simple business logic, such as CRUD operations, which at most validate the user's input [DDD ch.5 p.97] `RULE`
21. The active record pattern lends itself to supporting subdomains, integration of external solutions for generic subdomains, or model transformation tasks [DDD ch.5 p.97] `RULE`
22. Using a more elaborate pattern when implementing simple business logic will result in harm by introducing accidental complexity [DDD ch.5 p.97] `RULE`
23. I prefer to restrain from the negative connotation of the words anemic and antipattern [DDD ch.5 p.97] `PREFERENCE`
24. At high levels of scale, there are cases when data consistency guarantees can be relaxed [DDD ch.5 p.98] `RULE`
25. Make sure you evaluate the risks and business implications [DDD ch.5 p.98] `RULE`

## Inputs

| Input | Reason code | Who can supply it | Citation |
|---|---|---|---|
| The subdomain type the pattern will serve | `REQUIRES_BUSINESS_INPUT` | business | [DDD ch.5 p.95] `RULE` |
| Whether the business logic resembles simple procedural operations | `REQUIRES_BUSINESS_INPUT` | domain expert | [DDD ch.5 p.94] `RULE` |
| Whether the pattern has to represent complicated data structures with active records | `REQUIRES_BUSINESS_INPUT` | domain expert | [DDD ch.5 p.96] `RULE` |
| The risks and business implications of relaxing a consistency guarantee | `REQUIRES_BUSINESS_INPUT` | business | [DDD ch.5 p.98] `RULE` |
| anything else | `OUT_OF_SCOPE` | n/a | HALT |

Whether relational databases' native support of transactions spanning multiple
records is available is readable from the project and never halts
[DDD ch.5 p.92] `RULE`.

## Procedure

1. Name the operation, its subdomain and the storage mechanisms it touches, per `../../rules/ddd-required-inputs.md`
2. Confirm the pattern fits the subdomain, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| The subdomain is supporting and the business logic is simple | Transaction script naturally fits [DDD ch.5 p.95] `RULE` |
| The work is an adapter for integration with external systems, a generic subdomain, or part of an anticorruption layer | Transaction script fits [DDD ch.5 p.95] `RULE` |
| The business logic is simple but operates on complicated data structures | Active record, which encapsulates the mapping of the data to the database's schema [DDD ch.5 p.97] `RULE` |
| The subdomain is core | Transaction script should never be used for core subdomains [DDD ch.5 p.95] `HEURISTIC` |
| The subdomain type is unknown | HALT (`REQUIRES_BUSINESS_INPUT`) |
| anything else | HALT (`OUT_OF_SCOPE`) |

3. Audit the transactional behavior against the three-failure taxonomy, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| The operation issues multiple updates without an overarching transaction | Lack of transactional behavior: introduce a proper transaction encompassing both data changes [DDD ch.5 p.91] `RULE` |
| The operation changes data in a database and then publishes a message into a message bus | Distributed transaction: use CQRS to populate multiple storage mechanisms, and the outbox pattern to publish reliably after committing [DDD ch.5 p.92] `RULE` |
| The operation updates one value, in one table, in one database, and still communicates success or failure to its caller | Implicit distributed transaction: make the operation idempotent, or use optimistic concurrency control [DDD ch.5 pp.93-94] `RULE` |
| The operation either succeeds or fails, and the system remains consistent | Conforms: each operation should either succeed or fail [DDD ch.5 p.90] `HEURISTIC` |
| anything else | HALT (`OUT_OF_SCOPE`) |

The third failure has no single remedy, and the page says so rather than
choosing between the two techniques it prints:

```ddd-quote [DDD ch.5 p.94]
there is no simple fix for this issue. It all depends on the business domain and its needs
```

4. Where the database does not support transactions spanning multiple records, record that as a project fact rather than a halt [DDD ch.5 p.92] `RULE`
5. Apply the relaxation rule, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| The request asks to relax a consistency guarantee at high levels of scale | Evaluate the risks and business implications first, and name who evaluated them [DDD ch.5 p.98] `RULE` |
| The request asks for a numeric threshold at which to relax it | HALT (`AMBIGUOUS_IN_BOOK`), no threshold is printed |
| anything else | HALT (`OUT_OF_SCOPE`) |

The page states the limit of its own guidance, and the pack prints it rather
than inventing a number:

```ddd-quote [DDD ch.5 p.98]
As always, there are no universal laws. It all depends on the business domain you are working in.
```

6. Emit the output template below, with a citation and a status token on every claim line, writing the filled slots in Portuguese per `../../rules/ddd-language.md`

## Halt conditions

| Trigger | Code |
|---|---|
| The subdomain type is unknown | `REQUIRES_BUSINESS_INPUT` |
| The request asks for a scale threshold at which consistency may be relaxed | `AMBIGUOUS_IN_BOOK` |
| The request asks for the single fix for an implicit distributed transaction | `AMBIGUOUS_IN_BOOK`, p.94 prints two techniques and picks neither |
| The request asks for complex business logic with rules and invariants | `OUT_OF_SCOPE`, and the answer routes to `ddd-domain-model` |
| The request asks which architecture wraps the pattern | `OUT_OF_SCOPE`, and the answer routes to `ddd-architectural-patterns` |
| The request asks for ORM mapping guidance | `UNDEFINED_IN_BOOK` |
| A core subdomain is already implemented as a transaction script and cannot be changed | `CONFLICT_WITH_PROJECT` |
| The needed claim cannot be pinned to a page in pp.89-99 | `CITATION_UNVERIFIED` |
| anything else | `OUT_OF_SCOPE` |

## Output template

```ddd-output
## DDD Simple Business Logic — <operation>

- Subdomain: <name> — <supporting | generic integration | core>
- Pattern: <transaction script | active record> [DDD ch.5 p.97] `RULE`
- Fit: <the matching condition, one line> [DDD ch.5 p.95] `RULE`
- Core subdomain exclusion: <respected | violated> — transaction script should never be used for core subdomains [DDD ch.5 p.95] `HEURISTIC`
- Transactional behavior: <conforms | lack of transactional behavior | distributed transaction | implicit distributed transaction> [DDD ch.5 p.90] `HEURISTIC`
- Transactional fix: <proper transaction | outbox and CQRS | idempotent operation | optimistic concurrency control | none> [DDD ch.5 p.94] `RULE`
- Multirecord transactions supported by the database: <yes | no> [DDD ch.5 p.92] `RULE`
- Consistency relaxed: <no | yes, risks and business implications evaluated by <who>> [DDD ch.5 p.98] `RULE`
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

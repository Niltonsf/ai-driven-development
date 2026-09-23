# DDD: not in this book

The closed exclusion list. Every entry was checked with
`python3 tools/ddd_pdf.py search` over PDF pages 1-340, and carries the evidence
that decides its reason code.

The difference between `OUT_OF_SCOPE` and `UNDEFINED_IN_BOOK` is itself a
finding, so it is recorded per entry rather than assumed.

| Reason code | Meaning here |
|---|---|
| `OUT_OF_SCOPE` | Zero occurrences, or occurrences that are not the concept |
| `UNDEFINED_IN_BOOK` | The term is in the PDF and is never defined, scoped or given rules |

## `UNDEFINED_IN_BOOK`

### Repository as a pattern

The word is everywhere and the pattern is nowhere. It is named once in prose,
then only ever appears as a variable or interface name:

- Evans presents a set of patterns: aggregate, value objects, repositories, and others [DDD ch.6 p.101] `RULE`

Every other occurrence inside the normative range is an identifier:

| Occurrence | Where |
|---|---|
| `_ticketRepository` | [DDD ch.6 p.112] `RULE` |
| `_departmentRepository` | [DDD ch.6 p.119] `RULE` |
| `ITicketsRepository` | [DDD ch.7 p.134] `RULE` |
| `ICampaignRepository` | [DDD ch.9 p.170] `RULE` |
| `_repository` | [DDD ch.9 p.174] `RULE` |
| `_repository` | [DDD ch.11 p.200] `RULE` |

Two further occurrences are organizational, not tactical:

- The mono-repository approach, where the same source files are referenced by multiple bounded contexts [DDD ch.4 p.77] `RULE`
- The subsystems can be managed in the same source control repository [DDD ch.13 p.229] `RULE`

The halt answers `UNDEFINED_IN_BOOK` with those pages. It never borrows a
definition from elsewhere, and it never answers `OUT_OF_SCOPE`: the term is in
the book, which is exactly why the reader assumes the book taught it.

### Pessimistic locking mechanics

Named once, and no mechanics follow:

- The querying process can be integrated with pessimistic locking [DDD ch.15 p.263] `RULE`

### ORM mapping guidance

Named twice, both times as a constraint rather than a technique:

- Active record objects are coupled to an object-relational mapping or some other data access framework [DDD ch.5 p.96] `RULE`
- Instead of an ORM, each aggregate itself would define the transactional scope [DDD app.A p.303] `RULE`

### Context map notation

The book calls it a notation and specifies none. The halt says exactly that.

- The context map is a graphical notation that plots communication between the system's bounded contexts [DDD part.I p.28] `RULE`
- A context map can be managed and maintained as code, using a tool like Context Mapper [DDD ch.4 p.84] `RULE`

No U/D markers, no arrow semantics, no legend.

### Consumer deduplication and reordering techniques

The book requires both and supplies neither.

- Ensure that the subscribers will be able to deduplicate the messages and identify and reorder out-of-order messages [DDD ch.15 p.271] `RULE`

## `OUT_OF_SCOPE`

### Zero occurrences in 340 pages

| Excluded | Search evidence |
|---|---|
| Specification pattern | 0 pages |
| Unit of Work | 0 pages |
| Data Mapper, Table Module | 0 pages |
| Domain vision statement, highlighted core, segregated core, abstract core | 0 pages each |
| Responsibility layers, knowledge level, pluggable component framework, evolving order | 0 pages each |
| Bubble context, autonomous bubble | 0 pages each |
| Single responsibility principle, open-closed principle, Liskov substitution, interface segregation | 0 pages each |
| Screaming architecture, Humble Object | 0 pages each |
| Entity as an independent pattern | 0 pages for the phrase; the vocabulary card records what the book does say |

The distillation toolkit is absent although the act of distilling is present.
Distilling core subdomains is in the book; the four named artifacts are not.

### Present, but not as the concept

- Factory: teaching business domain experts about singletons and abstract factories is not your goal [DDD ch.2 p.51] `RULE`
- Supple: the only occurrence of the string is in "Supplemental material is available for download" [DDD pref. p.21] `RULE`
- Continuous integration is an engineering practice here, not a context relationship: the continuous integration of changes is required because the shared kernel belongs to multiple bounded contexts [DDD ch.4 p.78] `RULE`
- SOLID: the only occurrence of the string is in "following the decision tree gives you a solid starting point for making the essential design decisions" [DDD ch.10 p.192] `HEURISTIC`
- anything else absent from pp.17-321 — HALT (`OUT_OF_SCOPE`)

Never conflate the bubble context with the strangler pattern. The strangler
pattern **is** in this book and in scope; see `ddd-part-3-in-practice.md`.

Vernon's aggregate rules are absent. This book's sizing guidance is its own
rule of thumb and its own consistency test, both in chapter 6.

### The one Clean Architecture exception

The principle families are absent, with a single exception that **is** usable:

- The dependency inversion principle states that high-level modules, which implement the business logic, should not depend on low-level modules [DDD ch.8 p.152] `HEURISTIC`

REP, CCP, CRP, ADP, SDP, SAP, the Main component, the four concentric circles
and the Dependency Rule are absent. They may not be used, cited or paraphrased.

### This repository's own conventions

NestJS layout, Prisma, a `Result` type, and the `07-arquitetura-software-com-ia`
skills are not in this book. `OUT_OF_SCOPE`.

## Corrections to the implementation spec

Two entries the spec listed differently:

| Entry | Spec said | Search says |
|---|---|---|
| Factory, factory methods | Zero occurrences | One occurrence, PDF p.51 |
| Repository | Identifier pages only | Also named in prose on PDF p.101, and as source control on p.229 |

Both keep their reason code. The evidence line changed, not the verdict.

## See also

`../rules/ddd-source-of-truth.md`, `../rules/ddd-halt-protocol.md`,
`ddd-vocabulary.md`.

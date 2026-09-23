# DDD: analytical data and data mesh

Chapter 16, PDF pages 275-291. **Demoted to a reference card, deliberately.**

## Why this chapter is not a skill

Its supposed core is narrative:

- p.279 prints the star-versus-snowflake tradeoff, states no selection rule,
  names no threshold and picks neither.
- pp.280-285 are a platform history: data warehouse, data marts, data lake, and
  the challenges of each.
- pp.285-289 are organizational acts, such as appointing a federated governance
  body. Nothing there is auditable against a codebase.

Two items are operative, and they are the reason this card exists: the
data-as-a-product checklist of p.287, and the coupling violation of pp.282, 285
and 287.

## The two operative items

### The data-as-a-product four-criterion checklist, p.287

Analytical data should be treated the same as any public API:

1. It should be easy to discover the necessary endpoints: the data output ports [DDD ch.16 p.287] `HEURISTIC`
2. The analytical endpoints should have a well-defined schema describing the served data and its format [DDD ch.16 p.287] `HEURISTIC`
3. The analytical data should be trustworthy, and as with any API, it should have defined and monitored service-level agreements [DDD ch.16 p.287] `HEURISTIC`
4. The analytical model should be versioned as a regular API and correspondingly manage integration-breaking changes in the model [DDD ch.16 p.287] `HEURISTIC`

- The bounded context's team is in charge of ensuring that the resultant model addresses the needs of its consumers [DDD ch.16 p.287] `RULE`
- Accountability for data quality is a top-level concern [DDD ch.16 p.287] `RULE`
- The data products have to be polyglot, serving the data in formats that suit different consumers' needs [DDD ch.16 p.288] `RULE`
- In a data mesh-based system the bounded contexts serve the analytical data through well-defined output ports [DDD ch.16 p.287] `RULE`

### The coupling violation, pp.282, 285 and 287

This is the one thing in chapter 16 that can be checked against a real system: an
analytical job reading the operational database directly.

- The schema used in the operational database is not a public interface, but rather an internal implementation detail [DDD ch.16 p.282] `RULE`
- Often, data warehouse systems simply fetch all the data residing in the operational systems' databases, and a slight change in the schema is destined to break the ETL scripts [DDD ch.16 p.282] `RULE`
- Both architectures trespass the boundaries of the operational systems and create dependencies on their implementation details [DDD ch.16 p.285] `RULE`
- The resultant coupling to the implementation models creates friction between the operational and analytical systems teams [DDD ch.16 p.285] `RULE`
- The coupling to the implementation models is especially acute in domain-driven design-based projects, in which the emphasis is on continuously evolving and improving the business domain's models [DDD ch.16 p.285] `RULE`
- Instead of the analytical systems having to get the operational data from dubious sources such as an internal database or logfiles, the bounded contexts serve the analytical data through output ports [DDD ch.16 p.287] `RULE`

## Reference material, cited but not decidable

### OLAP versus OLTP, pp.275-279

- Operational models are built around the various entities from the system's business domain and have to be optimized to support real-time business transactions [DDD ch.16 p.275] `RULE`
- OLAP models ignore the individual business entities and instead focus on business activities by modeling fact tables and dimension tables [DDD ch.16 p.276] `RULE`
- Facts represent business activities that have already happened, and there is no stylistic requirement to name facts as verbs in the past tense [DDD ch.16 p.276] `RULE`
- Analytical data is append-only data: the only way to express that current data is outdated is to append a new record with the current state [DDD ch.16 p.277] `RULE`
- The data analysts working with the model decide what level of granularity will best suit their needs [DDD ch.16 p.277] `RULE`
- If a fact represents a business process or action, a dimension describes the fact, and dimensions are referenced as a foreign key from a fact table to a dimension table [DDD ch.16 p.278] `RULE`
- The reason for the high normalization of the dimensions is the analytical system's need to support flexible querying [DDD ch.16 p.278] `RULE`
- The querying patterns of the analytical models are not predictable [DDD ch.16 p.279] `RULE`

### The tradeoff p.279 prints, and refuses to resolve

| Schema | What it gives | What it costs | Citation |
|---|---|---|---|
| Star | Many-to-one relationships between the facts and their dimensions; a fact's foreign key points to a single dimension record | — | [DDD ch.16 p.279] `RULE` |
| Snowflake | Dimensions are multilevel, each further normalized, using less space to store the dimension data and easier to maintain | Querying the facts' data requires joining more tables, and therefore more computational resources | [DDD ch.16 p.279] `RULE` |
| anything else | — | — | HALT (`AMBIGUOUS_IN_BOOK`) |

- Both the star and snowflake schemas allow data analysts to analyze business performance [DDD ch.16 p.279] `RULE`

No selection rule, no threshold, no pick. A skill asked to choose halts with
`AMBIGUOUS_IN_BOOK`.

### The platform history, pp.280-285

- The data warehouse architecture extracts data from all of the enterprise's operational systems, transforms the source data into an analytical model, and loads the resultant data into a data analysis-oriented database [DDD ch.16 p.280] `RULE`
- At the heart of the data warehouse architecture is the goal of building an enterprise-wide model, which is impractical for anything but the smallest organizations [DDD ch.16 p.281] `RULE`
- A data mart is a database that holds data relevant for well-defined analytical needs, such as analysis of a single business department [DDD ch.16 p.281] `RULE`
- A data lake-based system ingests the operational systems' data and persists it in its raw form, that is, in the original operational model [DDD ch.16 p.283] `RULE`
- Since data lakes are schema-less and there is no control over the quality of the incoming data, the data lake's data becomes chaotic at certain levels of scale [DDD ch.16 p.284] `RULE`
- Both approaches tend to break under the weight of big data, converging to thousands of unmaintainable, ad hoc ETL scripts at scale [DDD ch.16 p.284] `RULE`

### The four data mesh principles, pp.285-289

| Principle | What the book asks for | Auditable against a codebase | Citation |
|---|---|---|---|
| Decompose data around domains | Use multiple analytical models and align them with the origin of the data, aligning ownership with the bounded contexts' boundaries | Partly | [DDD ch.16 p.285] `RULE` |
| Data as a product | Treat the analytical data as a first-class citizen, served through well-defined output ports | Yes | [DDD ch.16 p.287] `HEURISTIC` |
| Enable autonomy | A platform to abstract the complexity of building, executing, and maintaining interoperable data products, with a dedicated data infrastructure platform team | No | [DDD ch.16 p.288] `RULE` |
| Build an ecosystem | Appoint a federated governance body to enable interoperability and ecosystem thinking | No | [DDD ch.16 p.288] `RULE` |
| anything else | — | — | HALT (`OUT_OF_SCOPE`) |

- Each bounded context owns its operational and analytical models, and the same team owns the operational model and is in charge of transforming it into the analytical model [DDD ch.16 p.286] `RULE`
- To implement the data as a product principle, product teams require adding data-oriented specialists [DDD ch.16 p.288] `RULE`

### Where DDD patterns support the architecture, pp.289-290

- The ubiquitous language and the resultant domain knowledge are essential for designing analytical models [DDD ch.16 p.289] `RULE`
- Exposing a bounded context's data in a model that is different from its operational model is the open-host pattern, and the analytical model is an additional published language [DDD ch.16 p.289] `RULE`
- The CQRS pattern makes it easy to generate multiple models of the same data, and to generate and serve multiple versions of the analytical model simultaneously [DDD ch.16 pp.289-290] `RULE`
- The bounded context integration patterns for operational models apply for analytical models as well [DDD ch.16 p.290] `RULE`

## The halt for this range

| Request | Code |
|---|---|
| Choose between star and snowflake | HALT (`AMBIGUOUS_IN_BOOK`) |
| Set a granularity or normalization threshold | HALT (`OUT_OF_SCOPE`) |
| Appoint or structure a governance body | HALT (`REQUIRES_ORG_INPUT`) |
| Audit an analytical job that reads the operational database directly | Answer from the coupling violation above |
| Audit a data product against the four criteria | Answer from the checklist above |
| anything else | HALT (`OUT_OF_SCOPE`) |

## See also

`ddd-part-4-relationships.md`, `ddd-part-2-tactical-design.md`,
`../rules/ddd-halt-protocol.md`.

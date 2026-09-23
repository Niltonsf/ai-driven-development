# DDD rule: required inputs

Most decisions in this book need a fact that source code does not contain. The
skill halts rather than guessing, and the halt names **who to ask**. A halt that
cannot name its source is a dead end.

This file is the registry. Each entry carries the page that makes the fact
necessary, its status token, and the `Who can supply it` value the HALT block
prints.

## `REQUIRES_BUSINESS_INPUT`

`Who can supply it: business` or `domain expert`.

- Whether the activity provides a competitive advantage: only core subdomains provide a competitive advantage to a company [DDD ch.1 p.33] `RULE`
- The side-business test: can the subdomain in question be turned into a side business, would someone pay for it on its own [DDD ch.1 p.34] `RULE`
- Whether it is simpler and cheaper to hack your own implementation rather than integrating an external one [DDD ch.1 p.34] `RULE`
- Whether the business logic resembles CRUD interfaces for data entry or complex algorithms and invariants [DDD ch.1 p.34] `RULE`
- Volatility: core subdomains can change often, while supporting subdomains do not change often [DDD ch.1 p.35] `RULE`
- Whether a ready-made solution exists: generic subdomains are hard but already solved problems [DDD ch.1 p.36] `RULE`
- The subdomains and their types are defined by the company's business strategy [DDD ch.1 p.37] `RULE`
- Whether the additional complexity enhances the company's profitability, a sign of a supporting subdomain becoming a core subdomain [DDD ch.11 p.197] `RULE`
- Whether laws oblige the business domain to implement an audit log [DDD ch.7 p.137] `RULE`
- Whether the system is managing money or monetary transactions [DDD ch.7 p.137] `RULE`
- Whether deep analysis of the subdomain's behavior is required by the business [DDD ch.10 p.188] `HEURISTIC`
- Which data the business requires to be strongly consistent [DDD ch.6 p.115] `HEURISTIC`
- The invariants: rules that have to be protected at all times [DDD ch.6 p.102] `RULE`
- Whether the consumer can settle for eventually consistent data [DDD ch.15 p.272] `HEURISTIC`
- Domain experts: only interactions with actual domain experts can uncover inaccuracies or wrong assumptions [DDD ch.2 p.55] `RULE`
- The tacit knowledge that resides only in the minds of domain experts [DDD ch.2 p.56] `RULE`
- That the legacy context will be retired and the database used exclusively by the new implementation [DDD ch.13 p.235] `RULE`

Two pages make this category unavoidable rather than convenient:

- A core subdomain's competitive advantage is not necessarily technical [DDD ch.10 p.189] `RULE`
- The technical complexity ended up being much higher than the business complexity [DDD app.A p.309] `RULE`

Neither can be read off a repository.

## `REQUIRES_ORG_INPUT`

`Who can supply it: team lead`.

- Are multiple teams working on the same codebase [DDD ch.13 p.232] `RULE`
- A bounded context should be implemented, evolved, and maintained by one team only [DDD ch.3 p.68] `HEURISTIC`
- Teams with dependent goals, where one team's success depends on the success of the other [DDD ch.4 p.76] `RULE`
- Whether the teams have shared goals and adequate collaboration levels [DDD ch.13 p.232] `RULE`
- Balance of power: whether the upstream or the downstream team can dictate the integration contract [DDD ch.4 p.79] `RULE`
- Geographical constraints or organizational politics [DDD ch.4 p.78] `RULE`
- Whether work on one of the bounded contexts is moved to a distant development center [DDD ch.11 p.205] `RULE`
- Adding new development teams can cause the existing wider bounded context boundaries to split into smaller ones [DDD ch.11 p.204] `RULE`
- The reasons for extracting finer-grained bounded contexts include constituting new software engineering teams [DDD ch.3 p.64] `RULE`

## `Who can supply it: measurement`

Neither the business nor the organization answers this one. The book says to
measure it.

- It is important to benchmark a projection's impact on performance, the effect of working with hundreds or thousands of events [DDD ch.7 p.138] `RULE`
- The expected lifespan of an aggregate: the number of events expected to be recorded during an average lifespan [DDD ch.7 p.138] `RULE`

## Never a halt

These are readable from the target project. A skill that halts on one of them is
broken.

- Whether the database supports transactions spanning multiple records [DDD ch.5 p.92] `RULE`
- Whether the database supports multidocument transactions [DDD ch.9 p.172] `RULE`
- Whether the storage mechanism supports the querying of records based on the checkpoint [DDD ch.8 p.157] `RULE`

## Filling the HALT block

| Field | Value |
|---|---|
| `Missing fact` | The registry entry above, restated as one line |
| `Who can supply it` | `business`, `domain expert`, `team lead`, `measurement` or `n/a` |
| `Nearest in-book material` | The citation the registry entry carries |
| `Book coverage` | `PARTIAL` for every entry here: the book names the fact and cannot hold it |

## The reverse check that avoids the halt

Appendix A prints a way to turn a business question into a technical one, which
often removes the need to ask:

- Choose the business logic implementation pattern that fits the requirements at hand, then map the chosen pattern to a suitable subdomain type, then verify the identified subdomain type with the business vision [DDD app.A p.311] `RULE`

A mismatch is not resolved by the skill. It goes back to the business, with both
branches p.311 prints.

## See also

`ddd-halt-protocol.md`, `ddd-heuristic-status.md`, `ddd-source-of-truth.md`.

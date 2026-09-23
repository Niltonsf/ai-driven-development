---
name: ddd-ubiquitous-language
description: Audits or builds a ubiquitous language for one bounded context, checking each term for ambiguity and synonymy, checking each statement against the language of the business, and selecting a capture tool with its stated limitation. Invoke when the request mentions the ubiquitous language, a glossary, naming a business concept, technical jargon leaking into requirements, Gherkin tests, or two words that seem to mean the same thing.
---

# DDD Ubiquitous Language

## Source

Page scope: `[DDD ch.2 pp.47-58]`. This skill may cite no other page, except
the pack-shared ranges in `../../rules/ddd-source-of-truth.md`.

## Rules

1. A software project's success depends on the effectiveness of knowledge sharing between domain experts and software engineers [DDD ch.2 p.48] `RULE`
2. In any translation, information is lost [DDD ch.2 p.49] `RULE`
3. Domain-driven design calls for cultivating a single language for describing the business domain: the ubiquitous language [DDD ch.2 p.51] `RULE`
4. All project-related stakeholders should use the ubiquitous language when describing the business domain [DDD ch.2 p.51] `HEURISTIC`
5. Domain experts must be comfortable using the ubiquitous language when reasoning about the business domain [DDD ch.2 p.51] `RULE`
6. The ubiquitous language is the language of the business, and should consist of business domain-related terms only [DDD ch.2 p.51] `HEURISTIC`
7. The ubiquitous language must be precise and consistent [DDD ch.2 p.52] `RULE`
8. Each term of the ubiquitous language should have one and only one meaning [DDD ch.2 p.52] `HEURISTIC`
9. Two terms cannot be used interchangeably in a ubiquitous language [DDD ch.2 p.52] `RULE`
10. It is preferable to use each term explicitly in its specific context [DDD ch.2 p.52] `HEURISTIC`
11. A model is a simplified representation of a thing or phenomenon that intentionally emphasizes certain aspects while ignoring others [DDD ch.2 p.53] `RULE`
12. An effective model contains only the details needed to fulfill its purpose [DDD ch.2 p.54] `RULE`
13. An ineffective abstraction removes necessary information or produces noise by leaving what's not required [DDD ch.2 p.54] `RULE`
14. The purpose of abstracting is not to be vague but to create a new semantic level in which one can be absolutely precise [DDD ch.2 p.54] `RULE`
15. The model has to reflect the involved business entities and their behavior, cause and effect relationships, and invariants [DDD ch.2 p.54] `RULE`
16. Formulation of a ubiquitous language requires interaction with its natural holders, the domain experts [DDD ch.2 p.55] `RULE`
17. It is important to make glossary maintenance a shared effort [DDD ch.2 p.55] `RULE`
18. The only reliable way to gather domain knowledge is to converse with domain experts [DDD ch.2 p.56] `RULE`
19. All of a language's terms have to be consistent: no ambiguous terms and no synonymous terms [DDD ch.2 p.57] `RULE`
20. My advice is to at least use English nouns for naming the business domain's entities [DDD ch.2 p.57] `PREFERENCE`

## Inputs

| Input | Reason code | Who can supply it | Citation |
|---|---|---|---|
| The language its natural holders, the domain experts, use | `REQUIRES_BUSINESS_INPUT` | domain expert | [DDD ch.2 p.55] `RULE` |
| Whether a domain expert is available to converse with | `REQUIRES_BUSINESS_INPUT` | domain expert | [DDD ch.2 p.56] `RULE` |
| The tacit knowledge that resides only in the minds of domain experts | `REQUIRES_BUSINESS_INPUT` | domain expert | [DDD ch.2 p.56] `RULE` |
| Whether two terms denote the same concept or different roles | `REQUIRES_BUSINESS_INPUT` | domain expert | [DDD ch.2 p.52] `RULE` |
| The purpose the model has to serve | `REQUIRES_BUSINESS_INPUT` | business | [DDD ch.2 p.54] `RULE` |
| anything else | `OUT_OF_SCOPE` | n/a | HALT |

A codebase shows which terms are used. Only a domain expert says which are
right, and a glossary built without one is a guess.

## Procedure

1. Collect the terms and the statements in scope, and name the bounded context they belong to, per `../../rules/ddd-required-inputs.md`
2. Apply the business-phrasing table to each statement, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| The statement is formulated in the language of the business and reflects the domain experts' view of the business domain | Pass: a campaign can be published only if at least one of its placements is active [DDD ch.2 p.51] `RULE` |
| The statement names a table, a column, a record or a file format | Fail, strictly technical: a campaign can be published only if it has at least one associated record in the active-placements table [DDD ch.2 p.51] `RULE` |
| The statement names singletons, abstract factories or other technical jargon | Fail: teaching business domain experts about singletons and abstract factories is not your goal [DDD ch.2 p.51] `RULE` |
| The statement is unclear to domain experts | Fail: such statements are purely technical and will be unclear to domain experts [DDD ch.2 p.51] `RULE` |
| anything else | HALT (`OUT_OF_SCOPE`) |

3. Apply the consistency table to each term, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| The term has multiple meanings in the business domain | Ambiguous terms: model it explicitly using two terms, one per meaning [DDD ch.2 p.52] `RULE` |
| Two terms are used interchangeably by the domain experts | Synonymous terms: two terms cannot be used interchangeably in a ubiquitous language [DDD ch.2 p.52] `RULE` |
| Two terms denote different concepts, roles or behaviors | It is preferable to use each term explicitly in its specific context [DDD ch.2 p.52] `HEURISTIC` |
| The term has one and only one meaning in this bounded context | Consistent, no change [DDD ch.2 p.52] `HEURISTIC` |
| Whether the terms denote one concept or two cannot be settled | HALT (`REQUIRES_BUSINESS_INPUT`) |
| anything else | HALT (`OUT_OF_SCOPE`) |

4. Apply the abstraction table to each model element, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| The element contains only the details needed to fulfill its purpose | Effective: an effective model contains only the details needed to fulfill its purpose [DDD ch.2 p.54] `RULE` |
| The element removes information the purpose needs | Ineffective abstraction: it removes necessary information [DDD ch.2 p.54] `RULE` |
| The element carries details the purpose does not need | Ineffective abstraction: it produces noise by leaving what's not required [DDD ch.2 p.54] `RULE` |
| The purpose of the model is unstated | HALT (`REQUIRES_BUSINESS_INPUT`) |
| anything else | HALT (`OUT_OF_SCOPE`) |

5. Select the capture tool, and print its stated limitation with it, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| The terms to capture are nouns: names of entities, processes, roles | A wiki can be used as a glossary; glossaries work best for nouns [DDD ch.2 p.55] `RULE` |
| The behavior has to be captured, with its rules, assumptions, and invariants | Glossaries are best used in tandem with other tools: use cases or Gherkin tests [DDD ch.2 p.55] `RULE` |
| Domain experts have to read and verify the system's expected behavior | Automated tests written in the Gherkin language, whose suite can be challenging to manage at the early stages of a project [DDD ch.2 p.56] `RULE` |
| The usage of the language's terms in code has to be verified | Static code analysis tools, which are secondary to the actual use of the language in day-to-day interactions [DDD ch.2 p.56] `RULE` |
| anything else | HALT (`OUT_OF_SCOPE`) |

6. Check that the language is being used, not only documented: the main prerequisite for an effective ubiquitous language is usage [DDD ch.2 p.57] `RULE`
7. Emit the output template below, with a citation and a status token on every claim line, writing the filled slots in Portuguese per `../../rules/ddd-language.md`

## Halt conditions

| Trigger | Code |
|---|---|
| No domain expert is available to confirm the terms | `REQUIRES_BUSINESS_INPUT` |
| Whether two terms are synonyms or distinct roles cannot be settled | `REQUIRES_BUSINESS_INPUT` |
| The purpose the model serves is unstated | `REQUIRES_BUSINESS_INPUT` |
| The request asks to split the language across contexts | `OUT_OF_SCOPE`, and the answer routes to `ddd-bounded-contexts` |
| The request asks to run a workshop to build the language | `OUT_OF_SCOPE`, and the answer routes to `ddd-eventstorming` |
| The request asks for a glossary format, template or tool configuration | `UNDEFINED_IN_BOOK` |
| The codebase uses table names as domain terms and cannot be renamed | `CONFLICT_WITH_PROJECT` |
| The needed claim cannot be pinned to a page in pp.47-58 | `CITATION_UNVERIFIED` |
| anything else | `OUT_OF_SCOPE` |

## Output template

```ddd-output
## DDD Ubiquitous Language — <bounded context>

- Statements checked: <count>, pass <count>, fail <count>
- Failing statement: <statement> — strictly technical and thus does not fit the notion of the ubiquitous language [DDD ch.2 p.51] `RULE`
- Ambiguous term: <term> — modeled explicitly using <term> and <term> [DDD ch.2 p.52] `RULE`
- Synonymous terms: <term> and <term> — two terms cannot be used interchangeably [DDD ch.2 p.52] `RULE`
- Abstraction verdict: <effective | ineffective> — an effective model contains only the details needed to fulfill its purpose [DDD ch.2 p.54] `RULE`
- Capture tool: <wiki glossary | use cases | Gherkin tests | static code analysis> [DDD ch.2 p.55] `RULE`
- Stated limitation of that tool: <limitation> [DDD ch.2 p.55] `RULE`
- Naming: English nouns for the business domain's entities [DDD ch.2 p.57] `PREFERENCE`
- Who confirmed the terms: <domain expert>
- Interop: <filled by the interop rule>
```

## References

`../../references/ddd-part-1-strategic-design.md`,
`../../references/ddd-vocabulary.md`,
`../../references/ddd-exercise-answers.md`,
`../../references/ddd-case-study.md`,
`../../rules/ddd-source-of-truth.md`, `../../rules/ddd-citation.md`,
`../../rules/ddd-heuristic-status.md`, `../../rules/ddd-halt-protocol.md`,
`../../rules/ddd-required-inputs.md`, `../../rules/ddd-determinism.md`,
`../../rules/ddd-interop.md`, `../../rules/ddd-language.md`,
`../../rules/ddd-answer-contract.md`.

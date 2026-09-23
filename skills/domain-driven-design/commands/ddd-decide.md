---
name: ddd-decide
description: Runs the tactical design decision tree for one component and returns one business logic pattern, one architectural pattern and one testing strategy, with the validation loop back onto the subdomain type.
argument-hint: <component or subdomain to decide for>
---

# /ddd-decide

Decide the tactical design of `$ARGUMENTS`. This command always returns an
answer: the tree is a heuristic, and a heuristic never halts for being a
heuristic.

## Procedure

1. Read `../rules/ddd-answer-contract.md`, `../rules/ddd-heuristic-status.md`, `../rules/ddd-required-inputs.md`,
   `../rules/ddd-halt-protocol.md`, `../rules/ddd-determinism.md` and
   `../rules/ddd-language.md`. They bind every step below.
2. Where the subdomain type is unknown, run `ddd-subdomains` first and carry its
   verdict forward.
3. Run `ddd-design-heuristics` over the component. It is the router and it owns
   the answer.
4. Expand the selection with the owning skill, for detail only, never to change
   the selection.

| Selection | Skill to expand it |
|---|---|
| Transaction script, or active record | `ddd-simple-business-logic` |
| Domain model | `ddd-domain-model` |
| Event-sourced domain model | `ddd-event-sourced-domain-model` |
| Layered, ports & adapters, or CQRS | `ddd-architectural-patterns` |
| anything else | HALT (`OUT_OF_SCOPE`) |

5. Print the validation loop result and the review trigger. A selection printed
   without them is an incomplete answer.
6. Run `python3 tools/ddd_pdf.py verify` before handing the decision over.

## Report template

```
# DDD Decision — <component>

<the ddd-design-heuristics output template, verbatim>

## Expansion

<the owning skill's output template, verbatim>

## Open inputs

<the Missing fact and Who can supply it lines, or "none">

## Verification

`python3 tools/ddd_pdf.py verify` → <exit 0 | exit 1 with the report>
```

## Halts

Only three things stop this command: a missing business input, a request to
endorse one pattern for every subdomain, and a request for a pattern the book
does not print. Everything else gets an answer with its grade attached.

Asked to override the tree with a house rule, append the decision to
`../ddd-divergences.md` and proceed. Whatever is decided outside the book is
never laundered into a citation.

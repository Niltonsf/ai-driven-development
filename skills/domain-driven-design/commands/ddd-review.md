---
name: ddd-review
description: Reviews a diff, a pull request or a proposed design against the book, reporting only what a named page decides.
argument-hint: <diff, pull request or proposed design to review>
---

# /ddd-review

Review `$ARGUMENTS`. Narrower than `/ddd-audit`: this command looks at what
changed, not at the whole system.

## Procedure

1. Read `../rules/ddd-answer-contract.md`, `../rules/ddd-citation.md`, `../rules/ddd-heuristic-status.md`,
   `../rules/ddd-structural-fidelity.md`, `../rules/ddd-halt-protocol.md`,
   `../rules/ddd-determinism.md` and `../rules/ddd-language.md`.
2. List what changed: files, types, transactions, boundaries, published events.
   State what the diff does not show.
3. Route each changed element to exactly one skill.

| Changed element | Skill |
|---|---|
| An aggregate, a value object, an entity, a domain service, a transaction | `ddd-domain-model` |
| An event store, an event schema, a projection of an aggregate's state | `ddd-event-sourced-domain-model` |
| A layer, a port, an adapter, a read model, a command handler | `ddd-architectural-patterns` |
| A message publication, a relay, a saga, a process manager, an event type | `ddd-communication-patterns` |
| A transaction script or an active record | `ddd-simple-business-logic` |
| A context boundary, a module, a namespace, a package | `ddd-bounded-contexts` |
| A contract between two contexts, a translation layer, a published language | `ddd-integration-patterns` |
| A service split or merge | `ddd-microservice-boundaries` |
| A domain term, an identifier name, a test name | `ddd-ubiquitous-language` |
| A change of pattern for an existing component | `ddd-evolving-design-decisions` |
| anything else | HALT (`OUT_OF_SCOPE`) |

4. Report only findings a named page decides. A preference of the reviewer with
   no page behind it is not a finding.
5. Grade every finding with its status token. A `HEURISTIC` finding is reported
   as a heuristic, never escalated to a rule to make the review look firmer.
6. Run `python3 tools/ddd_pdf.py verify` before handing the review over.

## Report template

```
# DDD Review — <target>

- Changed elements: <n>, routed to <n> skills
- Not shown by the diff: <list, or "nothing">

## Findings

<one block per finding: element, verdict, citation, status token, correction>

## Halts

<each DDD HALT block, verbatim, or "none">

## Verification

`python3 tools/ddd_pdf.py verify` → <exit 0 | exit 1 with the report>
```

## Halts

A changed element whose subject is absent from the book halts with
`OUT_OF_SCOPE` and is listed, not silently skipped. A reviewer who cannot name
the page does not raise the finding.

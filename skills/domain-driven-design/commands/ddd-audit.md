---
name: ddd-audit
description: Audits a codebase, a diagram or a description against the book's structural rules, one skill per finding, and halts on anything the book does not cover.
argument-hint: <path, diagram or description to audit>
---

# /ddd-audit

Audit `$ARGUMENTS` against *Learning Domain-Driven Design*, and nothing else.
Structure is what this command checks; language is free, per
`../rules/ddd-structural-fidelity.md`.

## Procedure

1. Read `../rules/ddd-answer-contract.md`, `../rules/ddd-source-of-truth.md`, `../rules/ddd-citation.md`,
   `../rules/ddd-structural-fidelity.md`, `../rules/ddd-heuristic-status.md`,
   `../rules/ddd-halt-protocol.md`, `../rules/ddd-determinism.md` and
   `../rules/ddd-language.md`. They bind every step below.
2. Inventory the target: bounded contexts, subdomains, aggregates, value
   objects, transactions, read models, published events, teams. State what could
   not be determined, and from what.
3. Walk the closed structural checklist of
   `../rules/ddd-structural-fidelity.md`, item by item. Each item that fails is
   a `STRUCTURE_DIVERGENCE` finding naming its page.
4. Run each skill below over the inventory, in this order.

| Pass | Skill | Question |
|---|---|---|
| 1 | `ddd-bounded-contexts` | Is each boundary a model, lifecycle and ownership boundary, owned by one team? |
| 2 | `ddd-domain-model` | One aggregate per transaction, references by ID, no public setters, no logic in the service layer? |
| 3 | `ddd-event-sourced-domain-model` | Is the event store append-only, and does it meet its minimum contract? |
| 4 | `ddd-architectural-patterns` | Does the dependency direction match the selected pattern, and are the read models read-only? |
| 5 | `ddd-communication-patterns` | Are domain events published through an outbox rather than from inside the aggregate? |
| 6 | `ddd-integration-patterns` | Does each integration match the collaboration between its teams? |
| 7 | `ddd-microservice-boundaries` | Does every service sit inside the safe zone? |
| 8 | `ddd-ubiquitous-language` | Does the code speak the bounded context's language? |
| anything else | — | HALT (`OUT_OF_SCOPE`) |

5. Collect each skill's output template verbatim, with its status tokens.
6. Emit the report template, ordered by pass number.
7. Run `python3 tools/ddd_pdf.py verify` before handing the report over.

## Report template

```
# DDD Audit — <target>

- Source: Learning Domain-Driven Design, Vlad Khononov, O'Reilly, PDF pp.17-321
- Inventory: <n> contexts, <n> aggregates, <n> integrations, <n> items undetermined
- Structural checklist: <n> of 11 items checked, <n> divergences
- Passes run: <list> — Passes skipped: <list, with reason>

## Findings

<each skill's output template, verbatim, in pass order>

## Structure divergences

<each STRUCTURE_DIVERGENCE finding, with the page it breaks, or "none">

## Halts

<each DDD HALT block, verbatim, or "none">

## Verification

`python3 tools/ddd_pdf.py verify` → <exit 0 | exit 1 with the report>
```

## Halts

A language the book does not print is never a finding here. There is no
`CODE_STYLE_DIVERGENCE` in this pack.

A codebase that contradicts a book rule and cannot be changed is
`CONFLICT_WITH_PROJECT`, reported once, not repeated per occurrence.

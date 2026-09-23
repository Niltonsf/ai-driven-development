---
name: ca-review
description: Reviews one change, diff or proposed design against the book chapters that cover it, and halts on anything they do not.
argument-hint: <diff, file or design to review>
---

# /ca-review

Review `$ARGUMENTS` against *Clean Architecture*. Narrower than `/ca-audit`:
one change, the chapters that cover it, nothing else.

## Procedure

1. Read `../rules/ca-answer-contract.md`, `../rules/ca-source-of-truth.md`, `../rules/ca-citation.md`,
   `../rules/ca-halt-protocol.md`, `../rules/ca-code-fidelity.md`,
   `../rules/ca-determinism.md` and `../rules/ca-language.md`.
2. State the change in one line: what moves, what is added, what now names what.
3. Route the change to exactly one skill with the table. Two concerns mean two
   runs, reported separately.

| The change is about | Skill |
|---|---|
| The direction of a dependency, or what crosses a boundary | `ca-dependency-rule` |
| A class, module or interface and which principle it breaks | `ca-solid` |
| Which classes sit in which component, cycles, or stability | `ca-component-design` |
| Where a line goes, or what a crossing costs | `ca-boundaries` |
| Entities, use cases, request and response models | `ca-business-rules` |
| Presenters, views, gateways, mappers or tests | `ca-humble-object` |
| A database, the web, a framework or Main | `ca-details` |
| How the code is organized into packages | `ca-package-structure` |
| anything else | HALT (`OUT_OF_SCOPE`) |

4. Emit that skill's output template verbatim, then the verdict template below.
5. On a verdict of VIOLATES, state the structural correction the skill names.
   Do not write the code unless `../rules/ca-code-fidelity.md` allows it.
6. Run `python3 tools/ca_pdf.py verify` before handing the review over.

## Verdict template

```
# CA Review — <change>

- Change: <one line>
- Routed to: <skill> — chapters <N>
- Verdict: CONFORMS | VIOLATES | HALT

<the skill's output template, verbatim>

- Correction: <structural change, or "none">
- Out of scope in this review: <what was not examined, and why>
```

## Halts

A change the routing table does not match is a halt, not a best guess. The
halt block is the one in `../rules/ca-halt-protocol.md`.

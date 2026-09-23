---
name: ca-audit
description: Audits a codebase, a diagram or a description against the book, one skill per finding, and halts on anything the book does not cover.
argument-hint: <path, diagram or description to audit>
---

# /ca-audit

Audit `$ARGUMENTS` against *Clean Architecture*, and nothing else. Every
finding carries a PDF page. Anything the book does not cover is a halt, not a
judgment call.

## Procedure

1. Read `../rules/ca-answer-contract.md`, `../rules/ca-source-of-truth.md`, `../rules/ca-citation.md`,
   `../rules/ca-halt-protocol.md`, `../rules/ca-code-fidelity.md` and
   `../rules/ca-determinism.md` and `../rules/ca-language.md`. They bind every
   step below.
2. Inventory the target: list the components, the modules and the dependencies
   between them. State what could not be determined, and from what.
3. Run each skill below, in this order, over the inventory. Skip a skill only
   when its subject is absent from the inventory, and say which and why.

| Pass | Skill | Question |
|---|---|---|
| 1 | `ca-dependency-rule` | Does every source code dependency point inward? |
| 2 | `ca-business-rules` | Are entities and use cases separated, and are the request and response models clean? |
| 3 | `ca-boundaries` | Where are the lines, and what does each crossing cost? |
| 4 | `ca-humble-object` | Is the hard-to-test behavior split from the testable behavior? |
| 5 | `ca-details` | Is the database, the web and each framework treated as a detail? |
| 6 | `ca-component-design` | Any cycles, and where does each component sit against the Main Sequence? |
| 7 | `ca-solid` | Which principle does each remaining symptom belong to? |
| 8 | `ca-package-structure` | Presented only when the target's code organization is in question |
| anything else | — | HALT (`OUT_OF_SCOPE`) |

4. Collect each skill's output template verbatim. Do not rewrite, merge or
   soften them.
5. Emit the report template. Findings are ordered by pass number, not by
   severity: the book ranks no finding above another.
6. Run `python3 tools/ca_pdf.py verify` before handing the report over. A
   report whose citations do not resolve is withdrawn, not shipped.

## Report template

```
# CA Audit — <target>

- Source: Clean Architecture, Robert C. Martin, Pearson, 2018, PDF pp.25-240
- Inventory: <n> components, <n> dependencies, <n> items undetermined
- Passes run: <list> — Passes skipped: <list, with reason>

## Findings

<each skill's output template, verbatim, in pass order>

## Halts

<each CA HALT block, verbatim, or "none">

## Verification

`python3 tools/ca_pdf.py verify` → <exit 0 | exit 1 with the report>
```

## Halts

Any pass that cannot be grounded in its own chapters stops and emits the halt
block from `../rules/ca-halt-protocol.md`. The audit continues with the next
pass; a halt in one pass never silences another.

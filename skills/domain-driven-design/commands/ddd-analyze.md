---
name: ddd-analyze
description: Runs the strategic analysis of a business domain: subdomains and their types, the ubiquitous language, the bounded contexts and the integration patterns between them.
argument-hint: <company, product, codebase or description to analyze>
---

# /ddd-analyze

Analyze `$ARGUMENTS` strategically, against *Learning Domain-Driven Design* and
nothing else. Every finding carries a PDF page and a status token. Anything the
book does not cover is a halt, and anything only the business knows is a halt
that names who to ask.

## Procedure

1. Read `../rules/ddd-answer-contract.md`, `../rules/ddd-source-of-truth.md`, `../rules/ddd-citation.md`,
   `../rules/ddd-heuristic-status.md`, `../rules/ddd-halt-protocol.md`,
   `../rules/ddd-required-inputs.md`, `../rules/ddd-determinism.md` and
   `../rules/ddd-language.md`. They bind every step below.
2. Inventory the target: the company's business domain, the activities it
   performs, the components that exist, the teams that own them. State what
   could not be determined, and from what.
3. Run the four strategic passes, in this order, over the inventory. Skip a
   pass only when its subject is absent, and say which and why.

| Pass | Skill | Question |
|---|---|---|
| 1 | `ddd-subdomains` | Which subdomains are at play, and what type is each? |
| 2 | `ddd-ubiquitous-language` | Is the language the language of the business, consistent, and free of synonyms? |
| 3 | `ddd-bounded-contexts` | Where are the model, lifecycle and ownership boundaries? |
| 4 | `ddd-integration-patterns` | How does each pair of contexts integrate, and why that pattern? |
| anything else | — | HALT (`OUT_OF_SCOPE`) |

4. Where domain knowledge is missing rather than wrong, route to
   `ddd-eventstorming` before continuing. Do not invent the knowledge.
5. Collect each skill's output template verbatim. Do not rewrite, merge or
   soften them, and do not drop a status token.
6. Emit the report template. Findings are ordered by pass number, not by
   severity: the book ranks no finding above another.
7. Run `python3 tools/ddd_pdf.py verify` before handing the report over. A
   report whose citations do not resolve is withdrawn, not shipped.

## Report template

```
# DDD Strategic Analysis — <target>

- Source: Learning Domain-Driven Design, Vlad Khononov, O'Reilly, PDF pp.17-321
- Inventory: <n> subdomains, <n> bounded contexts, <n> integrations, <n> items undetermined
- Passes run: <list> — Passes skipped: <list, with reason>

## Findings

<each skill's output template, verbatim, in pass order>

## Halts

<each DDD HALT block, verbatim, or "none">

## Required inputs still open

<the Missing fact and Who can supply it lines of every halt, collected, or "none">

## Verification

`python3 tools/ddd_pdf.py verify` → <exit 0 | exit 1 with the report>
```

## Halts

Any pass that cannot be grounded in its own pages stops and emits the halt block
from `../rules/ddd-halt-protocol.md`. The analysis continues with the next pass;
a halt in one pass never silences another.

A pass that halts with `REQUIRES_BUSINESS_INPUT` or `REQUIRES_ORG_INPUT` is not
a failure of the analysis. It is the analysis: the report's open-inputs section
is the list of questions to take to the business.

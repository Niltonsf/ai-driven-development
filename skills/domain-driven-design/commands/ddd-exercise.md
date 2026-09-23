---
name: ddd-exercise
description: Answers a chapter's exercises from the skills alone, then grades the answers against Appendix B. The pack's regression test.
argument-hint: <chapter number, or "all">
---

# /ddd-exercise

Answer the exercises of `$ARGUMENTS` and grade them. This command is the pack's
regression test: a chapter the skills cannot answer is a gap in the pack, not a
gap in the book.

## Procedure

1. Read `../rules/ddd-answer-contract.md`, `../rules/ddd-source-of-truth.md`, `../rules/ddd-citation.md`,
   `../rules/ddd-heuristic-status.md`, `../rules/ddd-halt-protocol.md` and
   `../rules/ddd-language.md`.
2. **Do not open `../references/ddd-exercise-answers.md` yet.** Opening it first
   turns the test into a copy.
3. Read the chapter's exercise questions with
   `python3 tools/ddd_pdf.py options <range>`, never `pages`: the PDF omits
   some list markers, and `options` rebuilds them and says so. Read the
   WolfDesk description
   from `../references/ddd-preface-introduction.md` where a question refers to
   it.
4. Answer each question from the owning skill alone.

| Chapter | Owning skill |
|---|---|
| 1 | `ddd-subdomains` |
| 2 | `ddd-ubiquitous-language` |
| 3 | `ddd-bounded-contexts` |
| 4 | `ddd-integration-patterns` |
| 5 | `ddd-simple-business-logic` |
| 6 | `ddd-domain-model` |
| 7 | `ddd-event-sourced-domain-model` |
| 8 | `ddd-architectural-patterns` |
| 9, 15 | `ddd-communication-patterns` |
| 10 | `ddd-design-heuristics` |
| 11, 13 | `ddd-evolving-design-decisions` |
| 12 | `ddd-eventstorming` |
| 14 | `ddd-microservice-boundaries` |
| 16 | `../references/ddd-analytical-data.md` |
| anything else | HALT (`OUT_OF_SCOPE`) |

5. Only now open `../references/ddd-exercise-answers.md` and compare, question
   by question.
6. Grade each answer.

| Comparison | Grade |
|---|---|
| The answer matches the appendix | PASS |
| The answer differs | FAIL, and the defect is reported against the owning skill |
| The skill halted where the appendix answers | FAIL, and the missing rule is named |
| The appendix gives a judgment the skill cannot reach from its pages | Report it as a coverage gap, not as a skill defect |
| anything else | HALT (`OUT_OF_SCOPE`) |

7. Run `python3 tools/ddd_pdf.py verify` before handing the results over.

## Report template

```
# DDD Exercise — chapter <n>

- Questions: <n>, answered <n>, halted <n>
- Owning skill: <ddd-*>

## Per question

| # | Answer from the skill | Appendix B | Grade |
|---|---|---|---|

## Defects

<one line per FAIL: the skill, the missing or wrong rule, the page it should carry>

## Verification

`python3 tools/ddd_pdf.py verify` → <exit 0 | exit 1 with the report>
```

## Definition of done

Chapters 1, 5, 6, 8 and 10 reproduce Appendix B exactly, from the skills alone.
Anything less is a defect list, not a pass.

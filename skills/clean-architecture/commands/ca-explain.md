---
name: ca-explain
description: Explains a concept using only this PDF, with the pages, and halts when the concept is not in it.
argument-hint: <concept, term or question>
---

# /ca-explain

Explain `$ARGUMENTS` from *Clean Architecture*, with pages. If the book does
not cover it, say so and stop. A plausible explanation from outside the book
is the failure this command exists to prevent.

## Procedure

1. Read `../rules/ca-answer-contract.md`, `../rules/ca-source-of-truth.md`, `../rules/ca-citation.md` and
   `../rules/ca-language.md`.
2. Search before answering:

```
python3 tools/ca_pdf.py search "<the term>"
```

3. Apply the coverage table to the search result.

| Condition | Action |
|---|---|
| Hits inside PDF pp.25-240 | Read those pages with `pages`, then explain from them |
| Hits only in the index, pp.275-364 | Follow them to the body pages, then explain from those |
| Hits only in the appendix, pp.242-274 | HALT (`OUT_OF_SCOPE`): the appendix is not normative here |
| No hits, and no synonym in the book | HALT (`OUT_OF_SCOPE`) |
| Hits that present options without choosing | Present every option, then HALT (`AMBIGUOUS_IN_BOOK`) on the choice |
| anything else | HALT (`OUT_OF_SCOPE`) |

4. Write one claim per line, each ending in its citation. Restate in your own
   words; quote only where the exact wording is the rule.
5. Name the skill that owns the concept, so the reader knows where to go next.
6. Run `python3 tools/ca_pdf.py verify`.

## Output template

```
# CA Explain — <concept>

- Searched: `python3 tools/ca_pdf.py search "<term>"` → pp.<list>
- Chapters: <N> — <title> [CA ch.N pp.NNN-NNN]

<one cited claim per line>

- Owned by: <skill name, or "reference card only">
- Not in the book: <adjacent ideas the reader may be expecting, named and excluded>
```

## Halts

The halt block is the one in `../rules/ca-halt-protocol.md`, emitted verbatim,
with the search that was actually run in the `Searched` field.

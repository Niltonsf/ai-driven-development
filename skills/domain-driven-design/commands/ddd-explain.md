---
name: ddd-explain
description: Explains one term or one decision from the book, with its page, its grade, and the halt code if the book never defines it.
argument-hint: <term, pattern or decision to explain>
---

# /ddd-explain

Explain `$ARGUMENTS` from *Learning Domain-Driven Design*. One term, one page,
one grade. No synthesis across books.

## Procedure

1. Read `../rules/ddd-answer-contract.md`, `../rules/ddd-source-of-truth.md`, `../rules/ddd-citation.md`,
   `../rules/ddd-heuristic-status.md`, `../rules/ddd-halt-protocol.md` and
   `../rules/ddd-language.md`.
2. Look the term up, in this order, and stop at the first table that answers.

| Where it is found | Action |
|---|---|
| The defined terms of `../references/ddd-vocabulary.md` | Answer from that page, with its status token |
| The used-but-never-defined table of `../references/ddd-vocabulary.md` | HALT (`UNDEFINED_IN_BOOK`), naming every page the word appears on |
| The exclusion list of `../references/ddd-not-in-this-book.md` | HALT with the code that entry carries |
| The alias tables of `../references/ddd-terminology-mapping.md` | Answer with the alias and the page that grants it |
| Nowhere in the above | Run `python3 tools/ddd_pdf.py search "<term>"` and decide from the hits |
| No hits | HALT (`OUT_OF_SCOPE`) |

3. Where the term is defined, route to its owning skill for the rules around it,
   and print that skill's name in the answer.
4. Print the grade. A heuristic explained as a rule is a wrong explanation, even
   when the page number is right.
5. Where the book defers the topic to another book, name the row from
   `../references/ddd-closing-words.md` and stop there. Do not quote or apply
   the deferred book.
6. Run `python3 tools/ddd_pdf.py verify` before handing the explanation over.

## Report template

```
# DDD — <term>

- Definition: <the book's own definition, one line> <citation> <status token>
- Owning skill: <ddd-*>
- Grade: <RULE | HEURISTIC | PREFERENCE>, because <the page's own modal verb>
- Related terms: <list from the vocabulary card>
- Deferred to another book: <row from the further-reading table, or "no">

## Verification

`python3 tools/ddd_pdf.py verify` → <exit 0 | exit 1 with the report>
```

## Halts

The sharpest case is *repository*. The word is in the book as identifiers and as
an organizational term, and the pattern is never defined. The answer is
`UNDEFINED_IN_BOOK` with those pages, never `OUT_OF_SCOPE`, and never a
definition borrowed from elsewhere.

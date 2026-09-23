# DDD rule: halt protocol

Leaving the book is not an option. Stopping is.

## When to halt

The moment the answer would need material outside PDF pages 17-321, or would
need a choice the book declines to make, or would need a fact no codebase holds,
the skill stops. It does not improvise, does not apply the spirit of DDD, does
not fall back on Evans, does not write the code anyway with a caveat.

**A heuristic never halts for being a heuristic.** The book grades its own
statements and the pack copies the grade; a low grade changes the status token
and what follows the answer, never whether an answer is given. See
`ddd-heuristic-status.md`.

## The nine reason codes

| Code | When |
|---|---|
| `OUT_OF_SCOPE` | The concept is absent from the PDF |
| `UNDEFINED_IN_BOOK` | The term appears in the PDF but is never defined, scoped or given rules |
| `AMBIGUOUS_IN_BOOK` | The book presents options and refuses to choose |
| `BOOK_DECLINES_TO_GENERALIZE` | The book gives an answer scoped to its author and refuses to extend it to everyone |
| `REQUIRES_BUSINESS_INPUT` | The decision needs a fact only the business or a domain expert holds |
| `REQUIRES_ORG_INPUT` | The decision needs a fact about teams, ownership, collaboration or politics |
| `STRUCTURE_DIVERGENCE` | Producing the code would break a structural rule the book states on a named page |
| `CONFLICT_WITH_PROJECT` | The target codebase contradicts a book rule |
| `CITATION_UNVERIFIED` | A needed claim cannot be pinned to a PDF page |
| anything else | Use `OUT_OF_SCOPE` |

There is no `CODE_STYLE_DIVERGENCE` in this pack. PDF p.21 releases the
language; see `ddd-structural-fidelity.md`.

`UNDEFINED_IN_BOOK` is the code this book needs most. Its worst case is
*repository*: the word appears as identifiers and as "mono-repository", and is
never defined. Every engineer will assume the book taught it. The halt reports
those pages, not `OUT_OF_SCOPE`, and never a definition borrowed from elsewhere.

`AMBIGUOUS_IN_BOOK` is not a failure. The book declining to pick is itself the
finding: present every option it presents, cite each, halt on the choice. The
closed list of genuine triggers lives in the `## Halt conditions` section of the
skill that owns those pages.

## Output, verbatim

```
## DDD HALT — <REASON_CODE>

- Requested: <what was asked, one line>
- Book coverage: NOT FOUND | PARTIAL | PRESENT BUT UNDECIDED
- Searched: `python3 tools/ddd_pdf.py search "<terms>"` → <hits or none>
- Nearest in-book material: <citation, or "none">
- Missing fact: <the input that cannot be derived, or "none">
- Who can supply it: business | domain expert | team lead | measurement | n/a
- Reason: <one line>

No action taken. Nothing was written or changed.
To go beyond the book, say so explicitly and I will treat it as a separate,
non-book-locked task.
```

Rules for filling it:

1. Run the search before emitting the block. `Searched` reports a command that
   was actually run.
2. `Book coverage` is `NOT FOUND` when the search returns no page, `PARTIAL`
   when pages exist but do not settle the question, and `PRESENT BUT UNDECIDED`
   when the book states the question and declines to answer it.
3. `Nearest in-book material` carries a real citation or the word `none`.
4. `Missing fact` and `Who can supply it` are mandatory. A halt that cannot name
   its source is a dead end. The registry is `ddd-required-inputs.md`.
5. Nothing is written to disk in a halt. No file, no patch, no scaffold.
6. The scaffolding and the reason code are verbatim; the slots are filled in
   Portuguese, per `ddd-language.md`.

## After the halt

The user may say "go beyond the book". That is a different, non-book-locked
task, and it is not performed by a `ddd-*` skill.

Whatever is decided outside the book is appended to `../ddd-divergences.md`,
which is append-only. It is never laundered into a citation.

## See also

`ddd-source-of-truth.md`, `ddd-required-inputs.md`, `ddd-heuristic-status.md`,
`ddd-structural-fidelity.md`, `ddd-language.md`.

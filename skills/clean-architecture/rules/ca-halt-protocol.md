# CA rule: halt protocol

Leaving the book is not an option. Stopping is.

## When to halt

The moment the answer would need material that is not in pp.25-240, or would
need a choice the book declines to make, the skill stops. It does not
improvise, adapt a principle, offer a compromise, or write the thing anyway
with a caveat.

## Reason codes

| Code | When |
|---|---|
| `OUT_OF_SCOPE` | The concept is absent from the PDF |
| `CODE_STYLE_DIVERGENCE` | Producing code would leave the book's languages and style |
| `AMBIGUOUS_IN_BOOK` | The book presents options without choosing |
| `CONFLICT_WITH_PROJECT` | The target codebase contradicts a book rule |
| `CITATION_UNVERIFIED` | A needed claim cannot be pinned to a PDF page |
| anything else | Use `OUT_OF_SCOPE` |

`AMBIGUOUS_IN_BOOK` is not a failure. The book declining to pick is itself the
finding: present every option it presents, cite each, halt on the choice.

## Output, verbatim

```
## CA HALT — <REASON_CODE>

- Requested: <what was asked, one line>
- Book coverage: NOT FOUND | PARTIAL
- Searched: `python3 tools/ca_pdf.py search "<terms>"` → <hits or none>
- Nearest in-book material: <citation, or "none">
- Reason: <one line>

No action taken. Nothing was written or changed.
To go beyond the book, say so explicitly and I will treat it as a separate,
non-book-locked task.
```

Rules for filling it:

1. Run the search before emitting the block. The `Searched` field reports a
   command that was actually run.
2. `Book coverage` is `NOT FOUND` when the search returns no page, `PARTIAL`
   when pages exist but do not settle the question.
3. `Nearest in-book material` carries a real citation or the word `none`.
4. Nothing is written to disk in a halt. No file, no patch, no scaffold.
5. The scaffolding and the reason code are verbatim; the slots are filled in
   Portuguese, per `ca-language.md`.

## After the halt

The user may say "go beyond the book". That is a different, non-book-locked
task, and it is not performed by a `ca-*` skill.

Anything worth remembering from that decision goes in `../divergences.md`,
which is append-only.

## See also

`ca-source-of-truth.md`, `ca-code-fidelity.md`, `ca-language.md`.

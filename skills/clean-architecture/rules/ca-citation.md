# CA rule: citation

Every normative statement carries a page. No page, no statement.

## Format

```
[CA ch.22 p.161]        one page
[CA ch.14 pp.98-115]    a range
```

- `ch.N` is the book chapter, 1-34.
- `p.NNN` is the **PDF page number**, 1-based, as a PDF viewer shows it.
- The book's printed page numbers are different and are never used.
- A range uses `pp.` and a hyphen. A single page uses `p.`.

## Placement

| Artifact | Where the citation goes |
|---|---|
| Rule line in a skill | End of the line, one citation per line |
| Procedure step | End of the step, or in the decision-table row |
| Decision-table row | Inside the action cell, unless the action is HALT |
| Part card bullet | End of the bullet |
| Generated output | On every claim the output makes |
| HALT block | `Nearest in-book material` field |

One citation per line. Two claims need two lines, because the verifier checks
the whole line against each cited page.

## What the verifier checks

`python3 tools/ca_pdf.py verify` resolves every citation in every `.md` under
`clean-architecture/`:

1. The page falls inside that chapter's range in `../references/page-index.md`.
2. At least 60% of the citing line's content words appear in the cited page's
   extracted text, after normalizing whitespace and the small-capital artifact
   the extractor produces (`T HE C LEAN` becomes `THE CLEAN`).
3. A skill cites no chapter outside the scope declared in its `## Source`.

A citation that fails any of the three is a bug in the citing file, not in the
verifier. Fix the line or drop the claim.

## When no page can be found

`CITATION_UNVERIFIED`. See `ca-halt-protocol.md`.

## See also

`ca-source-of-truth.md`, `ca-halt-protocol.md`, `ca-determinism.md`, `ca-language.md`.

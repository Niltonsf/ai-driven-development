# DDD rule: citation

Every normative statement carries a page. No page, no statement.

## Format

```
[DDD ch.10 p.188]        one page, a chapter
[DDD ch.6 pp.115-116]    a range
[DDD pref. p.21]         the Preface
[DDD intro p.25]         the Introduction
[DDD part.I p.27]        a part opener
[DDD closing p.294]      Closing Words
[DDD app.A p.311]        Appendix A
[DDD app.B p.320]        Appendix B
```

- `p.NNN` is the **PDF page number**, 1-based, as a PDF viewer shows it, 1-340.
- The book's printed page numbers are `PDF page - 26`. They are never used.
  PDF p.103 carries the printed footer `Domain Model | 77`; the citation is
  `p.103`.
- A range uses `pp.` and a hyphen. A single page uses `p.`.
- The eight locators above are the whole grammar. Anything else is malformed and
  `verify` rejects it.

## Placement

| Artifact | Where the citation goes |
|---|---|
| Rule line in a skill | End of the line, before the status token |
| Procedure step | End of the step, or inside the decision-table row |
| Decision-table row | Inside the action cell, unless the action is HALT |
| Reference card bullet | End of the bullet |
| Generated output | On every claim the output makes |
| HALT block | The `Nearest in-book material` field |
| `ddd-quote` fence | The fence's info string, exactly one |

One citation per line. Two claims need two lines, because the verifier checks
the whole line against each cited page. The `## Source` section of a skill is
the only place several citations share a line, because it declares ranges rather
than making a claim.

## Status token

A citation alone is not enough. Every normative line also carries one of
`RULE`, `HEURISTIC` or `PREFERENCE`, and the line's modal verb matches the cited
page's. See `ddd-heuristic-status.md`.

## What the verifier checks

`python3 tools/ddd_pdf.py verify` resolves every citation in every `.md` under
`domain-driven-design/`:

1. The locator is one of the eight, and the page falls inside that locator's
   range in `../references/ddd-page-index.md`.
2. At least 60% of the citing line's content words appear in the cited page's
   extracted text, after normalizing whitespace, the soft-hyphen artifact
   (`implemen&#8208; ting` becomes `implementing`) and the spaced-capital
   artifact (`T HE` becomes `THE`).
3. A line naming a caption-only artifact is exempt from check 2. See below.
4. A skill cites no page outside its `## Source` ranges, union the pack-shared
   ranges of `ddd-source-of-truth.md`.
5. No `.md` carries a forbidden hedging phrase outside a `ddd-quote` fence.
6. Every `ddd-quote` fence matches its page 100% verbatim and carries exactly
   one citation.
7. Every skill has the seven required sections, in order, with a `name:` in
   `ddd-` equal to its directory name.
8. Every normative line carries a status token, and its modal verb is on the
   cited page.
9. No `.md` carries a Clean Architecture citation prefix. This pack never
   writes a Clean Architecture page number.

A citation that fails any check is a bug in the citing file, not in the
verifier. Fix the line or drop the claim.

## The caption-only exemption

A figure is a picture. The extractor returns its caption and nothing else, so a
line citing a figure **for the figure's own content** can never reach 60%.

`../references/ddd-decision-artifacts.md` is generated with a `Caption-only`
column, and `verify` exempts any line that names an artifact marked `yes`. The
exemption is a licence to cite a picture, not a licence to invent its content.
Where prose explains the figure, cite the prose: the four-question business
logic heuristic is prose on p.188, and that is what a rule line cites.

## When no page can be found

`CITATION_UNVERIFIED`. See `ddd-halt-protocol.md`.

## See also

`ddd-source-of-truth.md`, `ddd-heuristic-status.md`, `ddd-halt-protocol.md`,
`ddd-determinism.md`, `ddd-language.md`.

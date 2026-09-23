# CA rule: language

The reader is answered in Portuguese. The artifacts stay in English.

## Two sides of the line

| What | Language |
|---|---|
| Prose a `ca-*` skill or command emits to the reader | Portuguese |
| Slots filled inside an output template | Portuguese |
| Slots filled inside the HALT block | Portuguese |
| Explanations, findings, verdicts, reasons | Portuguese |
| The fixed scaffolding of a template: headings, field labels, table headers | Verbatim, as written in the file |
| Reason codes: `OUT_OF_SCOPE`, `CODE_STYLE_DIVERGENCE`, `AMBIGUOUS_IN_BOOK`, `CONFLICT_WITH_PROJECT`, `CITATION_UNVERIFIED` | Verbatim |
| The citation format defined in `ca-citation.md` | Verbatim |
| Terms of art the book defines: Entity, use case, Humble Object, Main, Dependency Rule, REP, CCP, CRP, ADP, SDP, SAP | Verbatim, in English, inside the Portuguese sentence |
| Everything written to a file: identifiers, comments, commit messages, these rules, the skills themselves | English |
| anything else | HALT (`OUT_OF_SCOPE`) |

## Why the scaffolding stays fixed

A template reproduced verbatim is what makes two runs comparable. Translating
its labels would make the same finding look like two different findings, which
is the drift `ca-determinism.md` exists to prevent. The labels are identifiers,
not prose.

## Quoting the book

The book is in English. A short quote, where the exact wording is the rule, is
reproduced in English and then restated in Portuguese. The citation is
unchanged.

Example of the shape, not a template to copy:

```
- Verdict: VIOLATES — "Source code dependencies must point only inward"
  [CA ch.22 p.162]. O componente de UI e nomeado pela regra de negocio.
```

## See also

`ca-determinism.md`, `ca-halt-protocol.md`, `ca-citation.md`.

# DDD rule: language

The reader is answered in Portuguese. The artifacts stay in English.

## Two sides of the line

| What | Language |
|---|---|
| Prose a `ddd-*` skill or command emits to the reader | Portuguese |
| Slots filled inside an output template | Portuguese |
| Slots filled inside the HALT block | Portuguese |
| Explanations, findings, verdicts, reasons | Portuguese |
| The fixed scaffolding of a template: headings, field labels, table headers | Verbatim, as written in the file |
| The nine reason codes | Verbatim |
| The three status tokens `RULE`, `HEURISTIC`, `PREFERENCE` | Verbatim |
| The citation format of `ddd-citation.md` | Verbatim |
| The body of a `ddd-quote` fence | Verbatim English, never translated |
| Terms of art the book defines: subdomain, bounded context, ubiquitous language, aggregate, aggregate root, value object, entity, domain event, domain service, transaction script, active record, domain model, event-sourced domain model, event store, layered architecture, ports & adapters, CQRS, outbox, saga, process manager, open-host service, anticorruption layer, shared kernel, conformist, separate ways, partnership, context map, EventStorming, data mesh | Verbatim, in English, inside the Portuguese sentence |
| Everything written to a file: identifiers, comments, commit messages, these rules, the skills themselves | English |
| anything else | HALT (`OUT_OF_SCOPE`) |

## Why the scaffolding stays fixed

A template reproduced verbatim is what makes two runs comparable. Translating
its labels would make the same finding look like two different findings, which
is the drift `ddd-determinism.md` exists to prevent. The labels are identifiers,
not prose.

## Why a quote is never translated

A `ddd-quote` fence is checked 100% verbatim against its page. A translated
quote fails `verify`, and rightly: the exact wording is the rule there. The
quote is printed in English and then restated in Portuguese outside the fence.

## The book's own answer on naming

The book is asked the same question and answers it:

- My advice is to at least use English nouns for naming the business domain's entities [DDD ch.2 p.57] `PREFERENCE`

That is the author's own preference, graded `PREFERENCE`, and it agrees with
this repository's global instruction. It is not restated as a rule.

## Example of the shape

Not a template to copy:

```
- Verdict: STRUCTURE_DIVERGENCE — "one aggregate per database transaction"
  [DDD ch.6 p.113] `RULE`. O caso de uso altera duas instancias de aggregate
  na mesma transacao.
```

## See also

`ddd-determinism.md`, `ddd-halt-protocol.md`, `ddd-citation.md`,
`ddd-heuristic-status.md`.

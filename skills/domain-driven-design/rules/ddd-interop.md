# DDD rule: interop

The optional bridge to the sibling `clean-architecture/` pack. This is the only
artifact in this pack that names it. Delete this file and the bridge is gone
without editing a single skill.

## Grounding, inside this book

The bridge is legitimate because chapter 8 prints it, and optional because
chapter 8 does not need it:

- The ports & adapters architecture is also known as hexagonal architecture, onion architecture, and clean architecture [DDD ch.8 p.154] `RULE`
- All of these patterns are based on the same design principles, have the same components, and have the same relationships between them [DDD ch.8 p.154] `RULE`
- These patterns can be mistakenly treated as conceptually different [DDD ch.8 p.154] `RULE`
- The dependency inversion principle states that high-level modules, which implement the business logic, should not depend on low-level modules [DDD ch.8 p.152] `HEURISTIC`

p.152 already gives this book its own dependency inversion principle, so the
bridge is a pointer for the reader, never a fact a DDD answer depends on.
p.150's layered terminology table supports the translation of terms; it is not a
second bridge.

## The probe

One filesystem existence check:

```
test -f ../clean-architecture/rules/ca-source-of-truth.md
```

No search, no network, no inference. Nothing inside the sibling is ever read to
produce a DDD verdict.

## When absent

`ddd-architectural-patterns` answers wholly from chapter 8, prints one line, and
finishes:

```
Interop: sibling pack absent
```

No halt, no warning, no degraded mode, no missing-dependency message. Every
other skill prints the same line, because no other skill opens the bridge.

## When present

A handoff is legal only if all three hold:

| Condition | Required value |
|---|---|
| The invoked skill | `ddd-architectural-patterns` |
| Its own architecture selection for this component | ports & adapters |
| The question | That component's internal structure |
| anything else | No handoff. Answer from chapter 8 and print `Interop: sibling pack present, bridge closed` |

A layered or CQRS selection never opens the bridge, because p.154's alias covers
ports & adapters alone.

## What crosses out

Terms are rewritten row by row through
`../references/ddd-terminology-mapping.md`. Each rewrite is printed with the
citation of the page that licenses it, so the substitution is visible rather
than assumed. A term with no row does not cross.

These never cross, because the sibling lists exactly this vocabulary as
`OUT_OF_SCOPE` and would correctly halt: aggregate, bounded context, subdomain,
ubiquitous language, domain event, transaction script, active record, domain
model, event-sourced domain model, CQRS, event sourcing, the six integration
patterns, EventStorming, data mesh.

## What crosses back

Data, never a sentence. Whatever a `ca-*` skill emits is reproduced verbatim
under one line:

```
[source: clean-architecture pack — not a DDD citation]
```

It may not be paraphrased into a DDD sentence, may not acquire a DDD citation,
and may not fill an output-template slot.

## Precedence

Where the two packs disagree, this pack's rule wins inside this pack.

The sharp case is code. The sibling halts on any language outside the ones its
book prints. That halt has no force here, per p.21 and p.103; see
`ddd-structural-fidelity.md`. A returned sibling halt is recorded as one line
and the DDD skill continues from chapter 8:

```
interop: ca halted (<code>)
```

## Optionality guarantee

A skill's output template carries at most the literal token `Interop:`, filled
by this rule. The acceptance test is run, not claimed: with
`../clean-architecture/` moved away, `python3 tools/ddd_pdf.py verify` still
exits 0 and every skill still produces its full output.

## See also

`ddd-source-of-truth.md`, `ddd-structural-fidelity.md`, `ddd-citation.md`,
`../references/ddd-terminology-mapping.md`.

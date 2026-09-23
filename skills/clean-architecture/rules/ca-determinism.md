# CA rule: determinism

Same input, same output, every run, from any model.

## The five tests

A `ca-*` artifact is deterministic when all five hold:

1. Its procedure is a numbered list of steps.
2. Every decision point is a table: condition → single action, with a final
   row `anything else → HALT (<REASON_CODE>)`.
3. Its output is a fixed template, reproduced verbatim, with only the slots
   filled.
4. It never asks the model to infer a rule. It looks the rule up and cites it.
5. No step contains a hedge. The list below is the closed set of hedges.

## Forbidden phrasings

Any of these strings in any `.md` under `clean-architecture/` fails
`python3 tools/ca_pdf.py verify`. The verifier reads this exact block as its
list, so this file is the single source of truth for it:

```ca-forbidden
best practice
best practices
recommended
recommend
generally
it depends
in most cases
consider
if appropriate
as appropriate
where appropriate
use your judgment
your judgment
typically
you may want to
might want to
should probably
as needed
feel free
presumably
safe to assume
i assume
we assume
provavelmente
costuma ser
na prática geralmente
```

A skill reaching for one of those phrasings has found a halt condition,
not a caveat. Route it through `ca-halt-protocol.md`.

## Decision tables

Exhaustive or nothing:

| Condition | Action |
|---|---|
| condition A | do X |
| condition B | do Y |
| anything else | HALT (`OUT_OF_SCOPE`) |

A table without a final `anything else` row is incomplete, and an incomplete
table is where drift enters.

## Skill shape

Six sections, in this order, enforced by `verify`:

`Source`, `Rules`, `Procedure`, `Halt conditions`, `Output template`,
`References`.

## See also

`ca-citation.md`, `ca-halt-protocol.md`, `ca-language.md`.

# DDD rule: determinism

Same input, same output, every run, from any model.

This pack is deterministic because it **transcribes**. Every decision table in a
`ddd-*` skill is a row-for-row copy of a table, figure or enumerated list the
book prints, evaluated first-match-wins, with a final `anything else` row.

## The five tests

A `ddd-*` artifact is deterministic when all five hold:

1. Its procedure is a numbered list of steps.
2. Every decision point is an exhaustive table: condition -> single action, with
   a final row `anything else`, whose action is a HALT or a cited action.
3. Its output is a fixed template, reproduced verbatim, with only the slots filled.
4. It never asks the model to infer a rule. It looks the rule up and cites it.
5. Every normative line carries a citation **and** a status token, and no line
   contains a hedge. The list below is the closed set of hedges.

## Forbidden phrasings

Any of these strings, in any `.md` under `domain-driven-design/`, outside a
`ddd-quote` fence, fails `python3 tools/ddd_pdf.py verify`. The verifier reads
this exact block as its list, so this file is the single source of truth for it:

```ddd-forbidden
best practice
best practices
recommended
recommend
generally
in general
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

A skill reaching for one of those phrasings has found a halt condition, not a
caveat. Route it through `ddd-halt-protocol.md`.

The book's own prose contains several of these strings. Quoting is handled by
the `ddd-quote` fence, never by loosening this list.

## The `ddd-quote` fence

Hedged wording is printed as evidence, never adopted as pack prose. A quote sits
in a fence whose info string carries exactly one citation, and the fence body
matches that page 100% verbatim after whitespace normalization:

````text
```ddd-quote [DDD ch.10 p.192]
these are heuristics, not hard rules
```
````

`verify` squashes both sides to alphanumerics and requires the quote to be a
substring of the cited page. A fence that paraphrases fails.

## Decision tables

Exhaustive or nothing:

| Condition | Action |
|---|---|
| condition A | do X |
| condition B | do Y |
| anything else | HALT (`OUT_OF_SCOPE`) |

A table without a final `anything else` row is incomplete, and an incomplete
table is where drift enters. `verify` rejects the skill.

The `anything else` action is a HALT in every table except the ones the book
prints with a terminal default branch. There the default is the book's own last
branch, and it carries a citation.

## Skill shape

Seven sections, in this order, enforced by `verify`:

`Source`, `Rules`, `Inputs`, `Procedure`, `Halt conditions`, `Output template`,
`References`.

One more than the sibling pack, because this book's decisions need facts a
codebase does not hold. See `ddd-required-inputs.md`.

## The output template

The `## Output template` section holds one `ddd-output` fence. Its citations are
resolved like any other: locator, range, declared scope, modality and term
coverage, with `<angle bracket>` slots removed first.

## See also

`ddd-citation.md`, `ddd-halt-protocol.md`, `ddd-heuristic-status.md`,
`ddd-source-of-truth.md`, `ddd-language.md`.

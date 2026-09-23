# DDD rule: answer contract

The pack transcribes the book. This file binds what reaches the reader: which
lines count as an answer, which facts are asked instead of filled in, and who
decides.

## The five rules

1. **Only the book's output counts.** A line without a citation that `verify`
   resolves is not a finding. It leaves the output template and moves to the
   section named below.
2. **Nothing is filled in.** Every input a skill lists under `## Inputs` with a
   `REQUIRES_*` reason code is asked of the human, never derived from a
   codebase, a repository convention or a plausible default. An unanswered input
   emits the HALT block from `ddd-halt-protocol.md`, and the analysis continues
   with the next pass.
3. **Citations are not picked to fit the conclusion.** When pages inside the
   declared `## Source` scope carry rules pointing against the answer, those
   rules are printed beside it, each with its own citation and status token. A
   resolved citation does not make a conclusion correct.
4. **The skill whose scope covers the question runs.** `ddd-design-heuristics`
   routes: it selects a business logic pattern, an architecture and a testing
   strategy, and it settles no boundary. Aggregate boundaries belong to
   `ddd-domain-model`, context boundaries to `ddd-bounded-contexts`,
   integrations to `ddd-integration-patterns`. Answering from the router alone
   is the same failure as answering without the book.
5. **The human makes the judgment call.** The pack reports what the book decides
   and what stays open. The choice between the book, the project's conventions
   and a third party's approach is the human's, and the pack never prints its
   own preference as the book's verdict.

## Before an answer leaves

| Condition | Action |
|---|---|
| The claim carries a citation resolved this session with `ddd_pdf.py pages` or `ddd_pdf.py search` | Print it inside the output template |
| The claim carries a citation not resolved this session | Resolve it first, or drop the claim |
| The claim carries no citation | Move it below the output template, under the heading named next |
| A `REQUIRES_*` input has no answer from the human | HALT, per `ddd-halt-protocol.md` |
| anything else | HALT (`OUT_OF_SCOPE`) |

## Where opinion goes

Opinion is separated, never banned. Everything outside the book sits under one
heading, after every finding:

```text
## Fora do livro

<the assistant's own reading, carrying no citation and no status token>
```

The test: a reader who deletes that section is left holding the book alone.

## See also

`ddd-source-of-truth.md`, `ddd-citation.md`, `ddd-determinism.md`,
`ddd-required-inputs.md`, `ddd-halt-protocol.md`, `ddd-language.md`.

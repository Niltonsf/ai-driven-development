# CA rule: answer contract

The pack transcribes the book. This file binds what reaches the reader: which
lines count as an answer, which facts are asked instead of filled in, and who
decides.

## The five rules

1. **Only the book's output counts.** A line without a citation that `verify`
   resolves is not a finding. It leaves the output template and moves to the
   section named below.
2. **Nothing is filled in.** A fact the book's decision needs and the codebase
   does not hold is asked of the human, never derived from a repository
   convention or a plausible default. An unanswered fact emits the HALT block
   from `ca-halt-protocol.md`, and the audit continues with the next check.
3. **Citations are not picked to fit the conclusion.** When pages inside the
   declared `## Source` scope carry rules pointing against the answer, those
   rules are printed beside it, each with its own citation. A resolved citation
   does not make a conclusion correct.
4. **The skill whose scope covers the question runs.** Every skill declares its
   chapters under `## Source`. Answering a question from a skill whose scope
   does not cover it is the same failure as answering without the book:
   `ca-solid` settles no component boundary, `ca-boundaries` settles no package
   structure, and `ca-package-structure` settles no choice at all.
5. **The human makes the judgment call.** The pack reports what the book decides
   and what stays open. The choice between the book, the project's conventions
   and a third party's approach is the human's, and the pack never prints its
   own preference as the book's verdict.

## Before an answer leaves

| Condition | Action |
|---|---|
| The claim carries a citation resolved this session with `ca_pdf.py pages` or `ca_pdf.py search` | Print it inside the output template |
| The claim carries a citation not resolved this session | Resolve it first, or drop the claim |
| The claim carries no citation | Move it below the output template, under the heading named next |
| The decision needs a fact the human has not supplied | HALT, per `ca-halt-protocol.md` |
| anything else | HALT (`OUT_OF_SCOPE`) |

## Where opinion goes

Opinion is separated, never banned. Everything outside the book sits under one
heading, after every finding:

```text
## Fora do livro

<the assistant's own reading, carrying no citation>
```

The test: a reader who deletes that section is left holding the book alone.

## See also

`ca-source-of-truth.md`, `ca-citation.md`, `ca-determinism.md`,
`ca-halt-protocol.md`, `ca-language.md`.

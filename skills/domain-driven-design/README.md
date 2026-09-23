# domain-driven-design

A book-locked pack of Claude Code skills, rules, references and commands whose
only source of truth is one PDF in this folder:

```
ddd-vlad-khononov.pdf
```

Vlad Khononov, *Learning Domain-Driven Design: Aligning Software Architecture
and Business Strategy*, O'Reilly Media. 340 PDF pages, copyright line on PDF
p.22 reads 2022, ISBN 978-1-098-10013-1.

Every rule these skills enforce exists in that PDF, at a page the pack names.
There is no standard DDD here, no Evans, no common practice. This book or a
halt.

## What makes this pack different

| Property | How it is enforced |
|---|---|
| Deterministic | Every decision point is a transcribed table, first-match-wins, with a final `anything else` row |
| Cited | Every normative line carries a 1-based PDF page number that `verify` resolves |
| Graded | Every normative line carries `RULE`, `HEURISTIC` or `PREFERENCE`, and its modal verb has to match the page's |
| Honest at the edges | Nine reason codes, including `UNDEFINED_IN_BOOK` for the terms the book uses and never defines |
| Language-free, structure-strict | There is no code-style halt: PDF p.21 releases the language. There are eleven structural rules that do not bend |

The grading is the point. The book writes "should" in places a skill would love
to harden, and the pack copies the grade instead of flattening it. A line that
turns the book's "should" into "must" fails verification.

## Reader's contract

Five rules that bind every skill in this pack. They exist because the pack once
produced a confident aggregate boundary the book never supported.

1. **Only the book's output counts.** A claim without a resolvable page is not a
   finding. It may still be said, but it is labeled as opinion and kept outside
   the output template, never mixed into it.
2. **Nothing is assumed.** Every input a skill lists as `REQUIRES_BUSINESS_INPUT`,
   `REQUIRES_ORG_INPUT` or `measurement` is asked, never inferred from the
   codebase or from what seems reasonable. An unanswered input is a HALT, and a
   HALT is a valid result, not a failure to work around.
3. **Citations are not cherry-picked.** When pages inside the declared scope
   carry rules that point against the conclusion, those rules are printed too. A
   real citation does not make a conclusion correct.
4. **The right skill runs.** `ddd-design-heuristics` routes; it does not decide
   aggregate boundaries, context boundaries or integration patterns. Answering
   from the router alone is the same failure as answering without the book.
5. **The reader makes the judgment call.** The pack reports what the book decides
   and what is still open. Choosing between the book, the project's conventions
   and a teacher's approach belongs to the reader, and the pack never presents
   its own preference as the book's verdict.

Rule 3 is the easiest to break without noticing: citing p.102 to justify putting
two entities in one aggregate while ignoring pp.115-116, which point the other
way, violates this contract. It is not a matter of emphasis.

## Getting started

```
python3 tools/ddd_pdf.py verify                  # the gate: exit 0 or a per-line report
python3 tools/ddd_pdf.py search "aggregate"      # which pages carry a term
python3 tools/ddd_pdf.py pages 185-193           # read those pages
```

Then invoke a command:

| Command | What it does |
|---|---|
| `/ddd-analyze` | Strategic analysis: subdomains, language, contexts, integrations |
| `/ddd-decide` | The tactical decision tree for one component |
| `/ddd-audit` | The structural checklist over a codebase or a design |
| `/ddd-review` | The same, narrowed to a diff or a pull request |
| `/ddd-evolve` | Evolution and brownfield modernization plans |
| `/ddd-explain` | One term, one page, one grade |
| `/ddd-exercise` | The pack's regression test, graded against Appendix B |

## Layout

```
domain-driven-design/
├── ddd-vlad-khononov.pdf         source of truth, never modified
├── README.md                     this file
├── ddd-divergences.md            append-only log of decisions made outside the book
├── tools/ddd_pdf.py              index, listings, artifacts, pages, search, verify
├── references/                   what the book says, per part and per appendix
├── rules/                        how the pack behaves: citation, halt, grading, language
└── skills/                       thirteen ddd-* skills, seven sections each
```

## The thirteen skills

| Skill | Pages | What it decides |
|---|---|---|
| `ddd-subdomains` | 29-45 | Core, supporting or generic, and the implementation strategy |
| `ddd-ubiquitous-language` | 47-58 | Ambiguity, synonymy, business phrasing, capture tool |
| `ddd-bounded-contexts` | 59-73 | Boundary, boundary kind, team ownership |
| `ddd-integration-patterns` | 75-86 | Which of the six patterns, and why |
| `ddd-simple-business-logic` | 89-99 | Transaction script or active record, and transactional behavior |
| `ddd-domain-model` | 101-123 | Aggregate boundaries, roots, value objects, domain services |
| `ddd-event-sourced-domain-model` | 125-142 | The four-step script, the event store, the snapshot question |
| `ddd-architectural-patterns` | 143-162 | Layered, ports & adapters or CQRS. Sole interop origin |
| `ddd-communication-patterns` | 163-181, 259-273 | Translation, outbox, saga, process manager, event types |
| `ddd-design-heuristics` | 185-194 | **The router.** Pattern, architecture, testing strategy |
| `ddd-evolving-design-decisions` | 195-210, 227-240 | Transitions, refactoring order, strangler |
| `ddd-eventstorming` | 211-225 | The ten steps, the colours, the completeness check |
| `ddd-microservice-boundaries` | 251-258 | The safe zone, and interface compression |

Start with `ddd-design-heuristics`. It routes to the other twelve.

## Deliberately not skills

Three stretches of the book print narrative rather than decidable rules, and are
reference cards instead: chapter 14 pp.243-250 (the microservices argument),
chapter 16 pp.275-291 (data mesh), and the front and back matter. Each card says
why, and what it still answers.

## Citation format

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

Page numbers are 1-based PDF pages. The printed book page numbers are
`PDF page - 26` and are never used.

## The optional bridge

`rules/ddd-interop.md` is the only artifact in this pack that names the sibling
pack it can hand off to, and the handoff is optional. Delete that file and the
bridge is gone without editing a single skill. With the sibling moved away,
`verify` still exits 0 and every skill still produces its full output, printing
`Interop: sibling pack absent`. That is a test this pack runs, not a claim.

## Language

The reader is answered in Portuguese. Everything written to disk is English.
See `rules/ddd-language.md`.

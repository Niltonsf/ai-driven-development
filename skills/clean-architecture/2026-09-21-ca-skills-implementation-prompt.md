# Implementation prompt — `ca-*` skills for Clean Architecture (book-locked)

## Mission

Build a set of Claude Code skills, rules and commands inside `clean-architecture/`
whose only source of truth is the PDF sitting in this same folder:

```
clean-architecture/clean-architecture-a-craftsmans-guide-to-software-structure-and-design.pdf
```

Robert C. Martin, *Clean Architecture: A Craftsman's Guide to Software Structure
and Design*, Pearson, 2018. 364 PDF pages.

Every rule these skills enforce must exist in that PDF, at a page you can name.
If it is not in the PDF, it does not go in. There is no "reasonable extension",
no "common practice", no "industry standard". The book or nothing.

## The four non-negotiables

Read these four before writing a single file. They are the whole point of this
task; everything else is plumbing.

### 1. Determinism

Same input must produce the same output, every run, from any model.

A skill is deterministic here when **all** of these hold:

- Its procedure is a numbered list of steps. No step contains "consider",
  "if appropriate", "use your judgment", "typically", "you may want to".
- Every decision point is an exhaustive table: condition → single action. Every
  table has a final row `anything else → HALT`.
- Its output is a fixed template, reproduced verbatim, with only the slots filled.
- It never asks the model to infer a rule. It looks the rule up and cites it.

Forbidden phrasings in any `SKILL.md` or rule file: "best practice",
"recommended", "generally", "it depends", "in most cases", "consider whether".
A verification script checks for these strings.

### 2. `ca-` prefix

Every skill directory and every skill `name:` starts with `ca-`. No exceptions.
Rules and commands too. This is how a reader knows the artifact is book-locked.

### 3. Page citation on everything

Every normative statement — every rule, every step, every checklist item, every
piece of generated output — carries a citation in this exact format:

```
[CA ch.22 p.161]
```

- `ch.N` is the book chapter.
- `p.NNN` is the **PDF page number** (1-based, as a PDF viewer shows it, 1–364).
- Do **not** use the book's printed page numbers. They do not match the PDF and
  are not reliably extractable. PDF page only.
- A range is `[CA ch.14 pp.98-116]`.

A statement without a citation is a bug. A citation that cannot be verified
against the PDF text is a bug. Both are caught by the verification script.

### 4. Halt instead of drifting

When a skill is asked for something the book does not cover, or when following
the request would mean leaving the book, it **stops and reports**. It does not
improvise, does not "adapt the spirit of the principle", does not offer a
compromise, does not write the code anyway with a caveat.

Fixed halt output, reproduced verbatim:

```
## CA HALT — <REASON_CODE>

- Requested: <what was asked, one line>
- Book coverage: NOT FOUND | PARTIAL
- Searched: `python3 tools/ca_pdf.py search "<terms>"` → <hits or none>
- Nearest in-book material: <citation, or "none">
- Reason: <one line>

No action taken. Nothing was written or changed.
To go beyond the book, say so explicitly and I will treat it as a separate,
non-book-locked task.
```

Reason codes, exhaustive:

| Code | When |
|---|---|
| `OUT_OF_SCOPE` | The concept is absent from the PDF |
| `CODE_STYLE_DIVERGENCE` | Producing code would leave the book's languages/style |
| `AMBIGUOUS_IN_BOOK` | The book presents options without choosing (e.g. ch.34) |
| `CONFLICT_WITH_PROJECT` | Target codebase contradicts a book rule |
| `CITATION_UNVERIFIED` | A needed claim cannot be pinned to a PDF page |

`AMBIGUOUS_IN_BOOK` is not a failure. Chapter 34 deliberately presents four
package structures and declines to pick one — the skill presents all four with
citations and halts on the choice. It does not choose for the user.

## Step 0 — build the extraction tool first

Before any skill, write `clean-architecture/tools/ca_pdf.py`. It is the reason
this whole thing can be deterministic: it turns "cite the book" from a promise
into a check.

Dependencies: `pypdf` (already installed, Python 3.10 at
`/Users/niltonsf/.pyenv/shims/python3`). Silence the `CryptographyDeprecationWarning`.

Four subcommands:

```
python3 tools/ca_pdf.py index                  # rebuild references/page-index.md
python3 tools/ca_pdf.py pages 161-166          # dump extracted text for a page range
python3 tools/ca_pdf.py search "Dependency Rule"  # regex search → page numbers
python3 tools/ca_pdf.py verify                 # validate every [CA ...] citation in the folder
```

`verify` is the gate. For each `[CA ch.N p.X]` found in any `.md` under
`clean-architecture/`:

1. Page `X` must fall inside chapter `N`'s range from `page-index.md`.
2. The citing line's significant terms must actually appear in page `X`'s text
   (normalize whitespace and the split-capital artifacts the extractor produces,
   e.g. `T HE C LEAN A RCHITECTURE` → `THE CLEAN ARCHITECTURE`).
3. It also greps every `.md` for the forbidden hedging phrasings from §1.

Exit 0 on clean, exit 1 with a per-file report otherwise. This script passing is
the definition of done.

## Verified chapter index

Extracted from the PDF, 1-based PDF pages. Chapter starts are verified; end
pages are computed as `next start − 1` and must be re-confirmed by
`ca_pdf.py index` (part-divider pages can shift an end by one).

| Part | Ch | Title | PDF pages |
|---|---|---|---|
| I | 1 | What Is Design and Architecture? | 25–32 |
| I | 2 | A Tale of Two Values | 33–37 |
| II | 3 | Paradigm Overview | 38–40 |
| II | 4 | Structured Programming | 41–45 |
| II | 5 | Object-Oriented Programming | 46–55 |
| II | 6 | Functional Programming | 56–63 |
| III | 7 | SRP: The Single Responsibility Principle | 64–69 |
| III | 8 | OCP: The Open-Closed Principle | 70–74 |
| III | 9 | LSP: The Liskov Substitution Principle | 75–79 |
| III | 10 | ISP: The Interface Segregation Principle | 80–82 |
| III | 11 | DIP: The Dependency Inversion Principle | 83–87 |
| IV | 12 | Components | 88–92 |
| IV | 13 | Component Cohesion | 93–97 |
| IV | 14 | Component Coupling | 98–116 |
| V | 15 | What Is Architecture? | 117–124 |
| V | 16 | Independence | 125–132 |
| V | 17 | Boundaries: Drawing Lines | 133–143 |
| V | 18 | Boundary Anatomy | 144–148 |
| V | 19 | Policy and Level | 149–152 |
| V | 20 | Business Rules | 153–157 |
| V | 21 | Screaming Architecture | 158–160 |
| V | 22 | The Clean Architecture | 161–166 |
| V | 23 | Presenters and Humble Objects | 167–170 |
| V | 24 | Partial Boundaries | 171–173 |
| V | 25 | Layers and Boundaries | 174–180 |
| V | 26 | The Main Component | 181–184 |
| V | 27 | Services: Great and Small | 185–191 |
| V | 28 | The Test Boundary | 192–194 |
| V | 29 | Clean Embedded Architecture | 195–208 |
| VI | 30 | The Database Is a Detail | 209–213 |
| VI | 31 | The Web Is a Detail | 214–216 |
| VI | 32 | Frameworks Are Details | 217–219 |
| VI | 33 | Case Study: Video Sales | 220–224 |
| VI | 34 | The Missing Chapter | 225–end |

## Target layout

```
clean-architecture/
├── clean-architecture-a-craftsmans-guide-....pdf   # source of truth, never modified
├── README.md                                       # what this folder is, how to use it
├── tools/
│   └── ca_pdf.py
├── references/
│   ├── page-index.md                               # generated
│   ├── code-listings.md                            # generated, see "Code fidelity"
│   ├── part-1-introduction.md                      # ch.1–2
│   ├── part-2-paradigms.md                         # ch.3–6
│   ├── part-3-design-principles.md                 # ch.7–11
│   ├── part-4-component-principles.md              # ch.12–14
│   ├── part-5-architecture.md                      # ch.15–29
│   └── part-6-details.md                           # ch.30–34
├── rules/
│   ├── ca-source-of-truth.md
│   ├── ca-citation.md
│   ├── ca-halt-protocol.md
│   ├── ca-code-fidelity.md
│   └── ca-determinism.md
├── skills/
│   ├── ca-dependency-rule/SKILL.md
│   ├── ca-solid/SKILL.md
│   ├── ca-component-design/SKILL.md
│   ├── ca-boundaries/SKILL.md
│   ├── ca-business-rules/SKILL.md
│   ├── ca-humble-object/SKILL.md
│   ├── ca-details/SKILL.md
│   └── ca-package-structure/SKILL.md
├── commands/
│   ├── ca-audit.md
│   ├── ca-review.md
│   └── ca-explain.md
└── divergences.md                                  # append-only log, starts empty
```

## The eight skills

Each one is scoped to specific chapters. A skill may cite **only** its own
chapters plus the rules files. Needing a chapter outside its scope means the
skill is wrong, or the request belongs to a different skill — route, don't stretch.

| Skill | Chapters | Scope |
|---|---|---|
| `ca-dependency-rule` | 22, 11, 19 | Source-code dependencies point inward only; nothing in an inner circle names anything in an outer one; crossing boundaries via DIP; policy and level |
| `ca-solid` | 7–11 | SRP (accidental duplication, merges), OCP (directional control, information hiding), LSP (square/rectangle), ISP, DIP (stable abstractions, factories) |
| `ca-component-design` | 12–14 | REP / CCP / CRP and the tension diagram; ADP and cycle breaking; SDP / SAP; the I, A and D metrics |
| `ca-boundaries` | 17, 18, 24, 25 | Which lines to draw and when; cost of each crossing (monolith → deployment component → thread → local process → service); partial boundaries and facades |
| `ca-business-rules` | 20, 16, 21 | Entities vs use cases; request and response models that never carry Entity references; independence; screaming architecture |
| `ca-humble-object` | 23, 28 | Presenter/View split, database gateways, data mappers, service listeners; tests as system components; the fragile test problem; the testing API |
| `ca-details` | 26, 30–32 | Database, web and frameworks as details; Main as the ultimate detail and dirtiest component |
| `ca-package-structure` | 34 | Package by layer / by feature / ports and adapters / by component; organization versus encapsulation. Presents, never chooses — `AMBIGUOUS_IN_BOOK` |

Parts I and II (ch.1–6) get reference cards, not skills. They are framing, not
procedure.

## Required `SKILL.md` shape

Identical structure across all eight. Frontmatter matches the convention already
used in `07-arquitetura-software-com-ia/commands-skills/skills/`:

```markdown
---
name: ca-<slug>
description: <when to invoke, third person, concrete triggers>
---

# CA <Title>

## Source
Book scope: `[CA ch.N pp.NNN-NNN]`. This skill may cite no other chapter.

## Rules
Numbered. One rule per line. Each ends with its citation.

## Procedure
Numbered steps. Each step is an instruction or a decision table.
Every table ends with `anything else → HALT (<REASON_CODE>)`.

## Halt conditions
The specific triggers for this skill, each mapped to a reason code.

## Output template
Verbatim block the skill must emit. Slots in `<angle brackets>`.

## References
`../../references/part-N-*.md`, `../../rules/*.md`.
```

## Code fidelity

The book's code listings are the only code style these skills may produce.

Generate `references/code-listings.md` with the script: every code listing found
in the PDF, its page, and its language. The book uses **Java**, **C**, **C++**
and **Ruby** (confirmed: C at pp.47–53, 107, 203; Java at pp.56, 182–183; Ruby
at pp.59, 67, 84 — re-derive the full list with the script, do not trust this
sample).

Therefore:

- A skill asked to produce code in a language the book does not use halts with
  `CODE_STYLE_DIVERGENCE`. It says which languages the book uses, with pages,
  and stops. It does not translate the pattern into TypeScript, Python, Go or
  anything else on its own initiative.
- A skill asked to produce code in a language the book does use must follow the
  listing on the cited page: same naming, same structure, same level of
  abstraction. Not a modernized version.
- Skills describe structure, dependency direction and boundaries — all of which
  are language-independent in the book — without needing to emit code. Prefer
  that. Code is the exception, not the default output.

This is the rule most likely to fire against this repository, whose other
folders are TypeScript/NestJS. That firing is correct behaviour, not a bug.

## Explicit non-goals

These do not appear in this PDF and must never leak into the skills:

- *Clean Code*, *The Clean Coder*, *Agile Software Development* — different books.
- DDD vocabulary: aggregate, value object, bounded context, domain event,
  repository-as-DDD-pattern, ubiquitous language.
- Hexagonal architecture beyond the four paragraphs Simon Brown gives it in ch.34.
- Onion architecture, vertical slice, CQRS, event sourcing as an architecture
  (ch.6 mentions event sourcing about immutability — cite it only for that).
- The conventions of this repository's other folders: `Result`, NestJS module
  layout, Prisma, the `07-arquitetura-software-com-ia` skills. Those are a
  different standard and must not be smuggled in as if the book endorsed them.
- The `Screaming Architecture` chapter does not prescribe a folder tree. Do not
  invent one from it.
- The four circles in ch.22 are explicitly described as schematic, not as a
  fixed count. A skill must not enforce exactly four layers.

If a skill needs any of the above to answer, that is `OUT_OF_SCOPE`.

## Order of work

1. `tools/ca_pdf.py`, all four subcommands.
2. `references/page-index.md` and `references/code-listings.md`, both generated.
3. The five `rules/` files. They are short and they bind every skill.
4. The six `references/part-*.md` cards, each claim cited and verifiable.
5. The eight skills, one at a time, running `ca_pdf.py verify` after each.
6. The three commands.
7. `README.md` and an empty `divergences.md`.

Do not write a skill before its part card exists. The card is what the skill
cites; writing the skill first is how invented rules get in.

## Copyright

Quote sparingly. Short phrases where the exact wording is the rule (principle
statements, the Dependency Rule sentence). Everything else is restated in your
own words with a citation. Do not bulk-extract chapters into `references/`.

## Definition of done

- `python3 tools/ca_pdf.py verify` exits 0.
- Every `.md` under `clean-architecture/` contains zero forbidden hedging phrases.
- Every skill directory name and `name:` field starts with `ca-`.
- Every skill has all six required sections, in order.
- Every normative line carries a citation that `verify` resolves.
- No skill cites a chapter outside its declared scope.
- `divergences.md` exists and is empty.

## Language

English, per the repository's global instruction. Chat about it in Portuguese;
nothing Portuguese lands in these files.

## Stop conditions for you, the implementer

If, while building this, you find that a skill you were told to write cannot be
grounded in its chapters — stop and report it. Do not fill the gap. The same
halt protocol you are implementing applies to the act of implementing it.

# Implementation prompt — `ddd-*` skills for Domain-Driven Design (book-locked)

## Mission

Build a set of Claude Code skills, rules, references, tools and commands inside
`domain-driven-design/` whose only source of truth is the PDF sitting in this
same folder:

```
domain-driven-design/ddd-vlad-khononov.pdf
```

Vlad Khononov, *Learning Domain-Driven Design: Aligning Software Architecture
and Business Strategy*, O'Reilly Media. 340 PDF pages. The copyright line on
PDF p.22 reads 2022, ISBN 978-1-098-10013-1.

Every rule these skills enforce must exist in that PDF, at a page you can name.
If it is not in the PDF, it does not go in. There is no "standard DDD", no
"Evans says", no "common practice". This book or nothing.

The pack must run **alongside** the sibling `clean-architecture/` pack and must
**never require it**. If `../clean-architecture/` is deleted, every `ddd-*`
skill still answers in full. See "Interop".

## The five non-negotiables

Read these five before writing a single file. They are the whole point of this
task; everything else is plumbing.

### 1. Determinism by transcription

Same input must produce the same output, every run, from any model.

The pack is deterministic because it **transcribes**, it does not infer. Every
decision table in a `ddd-*` skill is a row-for-row copy of a table, figure or
enumerated list the book prints, evaluated first-match-wins, with a final row
`anything else → HALT`.

A skill is deterministic here when **all** of these hold:

- Its procedure is a numbered list of steps. No step contains "consider",
  "if appropriate", "use your judgment", "typically", "you may want to".
- Every decision point is an exhaustive table: condition → single action. Every
  table has a final row `anything else → HALT (<REASON_CODE>)`.
- Its output is a fixed template, reproduced verbatim, with only the slots filled.
- It never asks the model to infer a rule. It looks the rule up and cites it.
- Every emitted normative line carries a status token — see non-negotiable 5.

Forbidden phrasings in any `.md` of this pack: "best practice", "recommended",
"generally", "it depends", "in most cases", "consider whether". A verification
script checks for these strings. The book's own prose contains several of them;
quoting is handled by the `ddd-quote` fence, not by loosening the list.

This spec file is the only `.md` in the folder the phrase scan skips: it quotes
the forbidden strings as data.

### 2. `ddd-` prefix on everything

Every skill directory, every skill `name:`, every rule file, every reference
card, every command starts with `ddd-`. The tool is `tools/ddd_pdf.py`
(underscore, so Python can import it). The append-only log is
`ddd-divergences.md`.

The single exception is `README.md`, which keeps its conventional name so the
folder renders. Nothing else is exempt.

### 3. Page citation on everything

Every normative statement — every rule, every step, every checklist item, every
piece of generated output — carries a citation in this exact format:

```
[DDD ch.10 p.188]        one page, a chapter
[DDD ch.6 pp.115-116]    a range
[DDD pref. p.21]         the preface
[DDD intro p.25]         the introduction
[DDD part.I p.27]        a part opener
[DDD closing p.294]      Closing Words
[DDD app.A p.311]        Appendix A
[DDD app.B p.320]        Appendix B
```

- `p.NNN` is the **PDF page number**, 1-based, as a PDF viewer shows it, 1–340.
- The book's printed page numbers are `PDF page − 26`. They are never used.
  PDF p.103 carries the printed footer `Domain Model | 77`; the citation is
  `p.103`.
- A range uses `pp.` and a hyphen. A single page uses `p.`.

A statement without a citation is a bug. A citation that cannot be verified
against the PDF text is a bug. Both are caught by the verification script.

### 4. Halt instead of drifting

When a skill is asked for something the book does not cover, or when following
the request would mean leaving the book, it **stops and reports**. It does not
improvise, does not "apply the spirit of DDD", does not fall back on Evans, does
not write the code anyway with a caveat.

Fixed halt output, reproduced verbatim:

```
## DDD HALT — <REASON_CODE>

- Requested: <what was asked, one line>
- Book coverage: NOT FOUND | PARTIAL | PRESENT BUT UNDECIDED
- Searched: `python3 tools/ddd_pdf.py search "<terms>"` → <hits or none>
- Nearest in-book material: <citation, or "none">
- Missing fact: <the input that cannot be derived, or "none">
- Who can supply it: business | domain expert | team lead | measurement | n/a
- Reason: <one line>

No action taken. Nothing was written or changed.
To go beyond the book, say so explicitly and I will treat it as a separate,
non-book-locked task.
```

Reason codes, exhaustive — nine, and the set does **not** inherit
`CODE_STYLE_DIVERGENCE` from the sibling pack:

| Code | When |
|---|---|
| `OUT_OF_SCOPE` | The concept is absent from the PDF |
| `UNDEFINED_IN_BOOK` | The term appears in the PDF but is never defined, scoped or given rules |
| `AMBIGUOUS_IN_BOOK` | The book presents options and refuses to choose |
| `BOOK_DECLINES_TO_GENERALIZE` | The book gives an answer scoped to its author and refuses to recommend it to everyone |
| `REQUIRES_BUSINESS_INPUT` | The decision needs a fact only the business or a domain expert holds |
| `REQUIRES_ORG_INPUT` | The decision needs a fact about teams, ownership, collaboration or politics |
| `STRUCTURE_DIVERGENCE` | Producing the code would break a structural rule the book states on a named page |
| `CONFLICT_WITH_PROJECT` | The target codebase contradicts a book rule |
| `CITATION_UNVERIFIED` | A needed claim cannot be pinned to a PDF page |
| anything else | Use `OUT_OF_SCOPE` |

`UNDEFINED_IN_BOOK` is the code this book needs most and the sibling does not
have. `repository` is the worst case: it appears only as the identifiers
`_ticketRepository` [p.112], `_departmentRepository` [p.119],
`ITicketsRepository` [p.134], and as "mono-repository" [p.77]. It is never
defined. Every engineer will assume the book taught it. The skill answers
`UNDEFINED_IN_BOOK` with those page numbers, not `OUT_OF_SCOPE`, and not a
definition borrowed from elsewhere.

### 5. Modality preservation

**This is the rule that makes this pack different from the sibling.** The book
grades its own statements, and the pack copies that grade instead of flattening
it.

Every normative line in the pack carries one status token from
`rules/ddd-heuristic-status.md`, keyed by claim and page:

| Token | Assigned when the cited page | Verified examples |
|---|---|---|
| `RULE` | states must / never / only / cannot, with no exception on that same page | one aggregate instance per database transaction [p.113]; a query cannot directly modify any persisted state [p.159]; no two teams can work on the same bounded context [p.68] |
| `HEURISTIC` | uses the word heuristic, rule of thumb, or "should" | transaction script should never be used for core subdomains [p.95]; separate ways should be avoided for core subdomains [p.83]; a bounded context should be owned by only one team [p.68]; everything in ch.10 [pp.185-193]; aggregates as small as possible [p.115] |
| `PREFERENCE` | marks it as the author's own | command style, "a matter of preference. I prefer" [p.111]; the simple-tools bias [p.193]; English nouns for entity names [p.57] |

**The modal verb in the pack's line must match the modal verb on the page.**
The book writes "should" in places a skill would love to harden:

- p.95 — transaction script **should never** be used for core subdomains.
- p.83 — separate ways **should be avoided** when integrating core subdomains.
- p.68 — a bounded context **should be** owned by only one team, and in the very
  next sentence, no two teams **can** work on the same bounded context. Two
  modalities, two lines, two tokens.
- p.51 — stakeholders **should use** the ubiquitous language; only the domain
  experts **must be** comfortable with it.
- p.52 — it is **preferable** to use each term in its specific context.
- p.133, p.140 — the event store **should** not allow modification; events of one
  aggregate **should** reside in one shard.

A line that hardens the book's "should" into "must" fails `verify` as
`CITATION_UNVERIFIED`. The adversarial verification of the whole book found this
to be the single most common drift: 16 chapters, 1,313 extracted claims, and
every defect worth reporting was modality inflation, not a wrong page.

## The heuristic problem, and how the pack answers it

pp.192-193 state, in the book's own words, that the decision trees are
"heuristics, not hard rules", and p.193 declines to recommend one team's practice
to everyone. The pack must be deterministic in procedure and honest in status.

The resolution, and it is not negotiable:

1. **A heuristic never halts for being a heuristic.** Figure 10-7 [p.192] always
   returns exactly one business logic pattern, one architectural pattern and one
   testing strategy. p.192 calls it "a solid starting point". A skill that
   refuses to answer at the one point the user asked a question is a broken skill.
2. **What the label changes is what follows the answer**: the mandatory
   validation loop of p.189 — the chosen pattern implies a subdomain type, and a
   mismatch sends the classification back to the business — plus a recorded
   review trigger, because p.193 says verifying decisions over time matters more
   than making them.
3. **Hedging is forbidden in the pack's own prose and permitted only inside a
   `ddd-quote` fence** carrying exactly one citation and checked at 100% verbatim
   against that page. That is how "these are heuristics, not hard rules" [p.192]
   is printed as evidence without the pack going soft:

   ````
   ```ddd-quote [DDD ch.10 p.192]
   these are heuristics, not hard rules
   ```
   ````
4. **`BOOK_DECLINES_TO_GENERALIZE`** covers the one shape p.193 creates: the tree
   prints its answer, the quote prints the book declining to generalize, and the
   skill stops only at the endorsement. Asked to *override* the tree with a house
   rule, the skill does not halt — p.193 explicitly permits altering the guiding
   principles or building your own tree. Whatever is decided outside the book is
   appended to `ddd-divergences.md`, never laundered into a citation.

## Step 0 — build the extraction tool first

Before any skill, write `domain-driven-design/tools/ddd_pdf.py`. It is the reason
this whole thing can be deterministic: it turns "cite the book" from a promise
into a check. Mirror `../clean-architecture/tools/ca_pdf.py` in structure and
CLI; do not import from it, and refuse to resolve any path outside
`domain-driven-design/`.

Dependencies: `pypdf` 4.0.0, already installed, Python 3.10 at
`/Users/niltonsf/.pyenv/shims/python3`. Silence the
`CryptographyDeprecationWarning`.

Five subcommands:

```
python3 tools/ddd_pdf.py index                    # rebuild references/ddd-page-index.md
python3 tools/ddd_pdf.py listings                 # rebuild references/ddd-code-listings.md
python3 tools/ddd_pdf.py artifacts                # rebuild references/ddd-decision-artifacts.md
python3 tools/ddd_pdf.py pages 185-193            # dump extracted text for a page range
python3 tools/ddd_pdf.py search "aggregate"       # regex search → PDF page numbers
python3 tools/ddd_pdf.py verify                   # validate everything below
```

`index` must read the PDF's own outline (`PdfReader.outline` plus
`get_destination_page_number`), which is present and reliable in this file and
gives 1-based chapter starts directly. Do not detect chapter starts heuristically
when the outline answers.

`verify` is the gate. For every `.md` under `domain-driven-design/`:

1. Every `[DDD ...]` citation resolves: the page falls inside the cited chapter's
   range from `ddd-page-index.md`, or inside the declared front/back-matter range.
2. At least 60% of the citing line's content words appear in the cited page's
   extracted text, after normalizing whitespace and the extractor's
   soft-hyphen artifact (`implemen‐ ting` → `implementing`) and its
   spaced-caps artifact.
3. **Caption-only pages are exempt from check 2** and must be marked as such in
   `ddd-decision-artifacts.md`. The extractor returns only the caption for a
   figure, so a line citing Figure 10-7 for the tree's *content* can never reach
   60%. Known caption-only artifacts: Figures 10-1 to 10-7, 11-1 to 11-3, 12-12,
   14-5, 14-7, 14-10, and Figure E-1 on p.294. Re-derive the full list; do not
   trust this sample.
4. No skill cites a page outside its declared `## Source` ranges, union the
   pack-shared ranges declared in `rules/ddd-source-of-truth.md`.
5. No `.md` contains a forbidden hedging phrase outside a `ddd-quote` fence.
6. Every `ddd-quote` fence matches its cited page **100% verbatim** after
   whitespace normalization, and carries exactly one citation.
7. Every skill has the seven required sections, in order, with a `name:` in
   `ddd-` equal to its directory name.
8. Every normative line carries a status token, and its modal verb matches the
   cited page's modal verb.
9. No `.md` under `domain-driven-design/` contains the substring `[CA `. This
   pack never writes a Clean Architecture page number.

Exit 0 on clean, exit 1 with a per-file, per-line report otherwise. This script
passing is the definition of done.

## Verified chapter index

Chapter starts are taken from the PDF's own outline and are exact. End pages are
computed as `next start − 1` and **must be re-confirmed by `ddd_pdf.py index`**:
part dividers and blank verso pages shift several of them. The sibling pack's
hand-made table was wrong on five chapters for exactly this reason; do not repeat
it.

| Part | Ch | Title | PDF pages |
|---|---|---|---|
| — | — | Preface (incl. WolfDesk, code conventions) | 17–24 |
| — | — | Introduction | 25–26 |
| I | — | Part opener: Strategic Design | 27–28 |
| I | 1 | Analyzing Business Domains | 29–45 |
| I | 2 | Discovering Domain Knowledge | 47–58 |
| I | 3 | Managing Domain Complexity | 59–73 |
| I | 4 | Integrating Bounded Contexts | 75–86 |
| II | — | Part opener: Tactical Design | 87–88 |
| II | 5 | Implementing Simple Business Logic | 89–99 |
| II | 6 | Tackling Complex Business Logic | 101–123 |
| II | 7 | Modeling the Dimension of Time | 125–142 |
| II | 8 | Architectural Patterns | 143–162 |
| II | 9 | Communication Patterns | 163–181 |
| III | — | Part opener: Applying DDD in Practice | 183–184 |
| III | 10 | Design Heuristics | 185–194 |
| III | 11 | Evolving Design Decisions | 195–210 |
| III | 12 | EventStorming | 211–225 |
| III | 13 | Domain-Driven Design in the Real World | 227–240 |
| IV | — | Part opener: Relationships to Other Methodologies | 241–242 |
| IV | 14 | Microservices | 243–258 |
| IV | 15 | Event-Driven Architecture | 259–274 |
| IV | 16 | Data Mesh | 275–292 |
| — | — | Closing Words | 293–297 |
| — | — | Appendix A — Applying DDD: A Case Study | 299–313 |
| — | — | Appendix B — Answers to Exercise Questions | 315–321 |
| — | — | Bibliography | 323–324 |
| — | — | Index | 325–338 |

Normative range for the pack: pp.17–321. The bibliography and index are not
normative material; the bibliography is citable only as evidence that a topic is
deferred to another book.

## Target layout

```
domain-driven-design/
├── ddd-vlad-khononov.pdf                  # source of truth, never modified
├── README.md                              # what this folder is, how to use it
├── tools/
│   └── ddd_pdf.py
├── references/
│   ├── ddd-page-index.md                  # generated
│   ├── ddd-code-listings.md               # generated
│   ├── ddd-decision-artifacts.md          # generated, with a caption-only column
│   ├── ddd-vocabulary.md                  # defined terms + terms used undefined
│   ├── ddd-terminology-mapping.md         # the alias tables, pp.150, 154
│   ├── ddd-not-in-this-book.md            # closed absence list, with evidence
│   ├── ddd-part-1-strategic-design.md     # ch.1-4
│   ├── ddd-part-2-tactical-design.md      # ch.5-9
│   ├── ddd-part-3-in-practice.md          # ch.10-13
│   ├── ddd-part-4-relationships.md        # ch.14-16
│   ├── ddd-part-openers.md                # pp.27-28, 87-88, 183-184, 241-242
│   ├── ddd-preface-introduction.md        # pp.17-26, incl. WolfDesk and p.21
│   ├── ddd-microservices-argument.md      # ch.14 pp.243-250, demoted
│   ├── ddd-analytical-data.md             # ch.16 pp.275-292, demoted
│   ├── ddd-closing-words.md               # pp.293-297
│   ├── ddd-case-study.md                  # app.A pp.299-313
│   └── ddd-exercise-answers.md            # app.B pp.315-321
├── rules/
│   ├── ddd-source-of-truth.md
│   ├── ddd-citation.md
│   ├── ddd-halt-protocol.md
│   ├── ddd-determinism.md
│   ├── ddd-heuristic-status.md
│   ├── ddd-required-inputs.md
│   ├── ddd-structural-fidelity.md
│   ├── ddd-interop.md
│   └── ddd-language.md
├── skills/
│   ├── ddd-subdomains/SKILL.md
│   ├── ddd-ubiquitous-language/SKILL.md
│   ├── ddd-bounded-contexts/SKILL.md
│   ├── ddd-integration-patterns/SKILL.md
│   ├── ddd-simple-business-logic/SKILL.md
│   ├── ddd-domain-model/SKILL.md
│   ├── ddd-event-sourced-domain-model/SKILL.md
│   ├── ddd-architectural-patterns/SKILL.md
│   ├── ddd-communication-patterns/SKILL.md
│   ├── ddd-design-heuristics/SKILL.md
│   ├── ddd-evolving-design-decisions/SKILL.md
│   ├── ddd-eventstorming/SKILL.md
│   └── ddd-microservice-boundaries/SKILL.md
├── commands/
│   ├── ddd-analyze.md
│   ├── ddd-decide.md
│   ├── ddd-audit.md
│   ├── ddd-review.md
│   ├── ddd-evolve.md
│   ├── ddd-explain.md
│   └── ddd-exercise.md
└── ddd-divergences.md                     # append-only log, starts empty
```

## The thirteen skills

Each is scoped to an explicit **page range**, not a chapter number: ch.6 splits
across two content units, ch.14's decidable content starts mid-chapter at p.251,
and three fragments of Appendix A are cited by skills that do not own the rest of
it. A skill may cite only its own ranges plus the pack-shared ranges. Needing a
page outside them means the skill is wrong, or the request belongs to another
skill — route, do not stretch.

**Pack-shared ranges**, citable by any skill, declared in
`rules/ddd-source-of-truth.md`: p.21 (code conventions), pp.303-304 and
pp.309-313 (Appendix A's normative fragments), p.293 (the subdomain table
restated), pp.315-321 (Appendix B).

| Skill | Pages | Deterministic core — the artifact the book prints |
|---|---|---|
| `ddd-subdomains` | 29–45 | Table 1-1 p.37, the 3×5 matrix (competitive advantage / complexity / volatility / implementation / problem); the three classification tests p.34 (side-business test; simpler-to-integrate-than-build test; CRUD-vs-complex-algorithm test); solution strategy per type p.36; volatility criteria p.35; the distillation stopping rule pp.38-39 |
| `ddd-ubiquitous-language` | 47–58 | The two named consistency failure modes with their remedies p.52 (ambiguous terms; synonymous terms); the business-phrasing pass/fail statement pairs p.51; effective-vs-ineffective abstraction p.54; the capture-tool selection table pp.55-56 with each tool's stated limitation |
| `ddd-bounded-contexts` | 59–73 | Team-ownership cardinality p.68 (one team per context; no two teams on one context; one team may own several); the three extraction triggers p.64; boundary kinds pp.67-68 (physical / logical / ownership); never split coherent use cases on the same data p.64; discovered-vs-designed pp.64-67 |
| `ddd-integration-patterns` | 75–86 | The three collaboration groups p.75; shared-kernel cost rule and its three justified cases p.78; the power table p.79 (conformist / ACL / OHS); the three ACL criteria p.80; the three separate-ways reasons pp.82-83; the core-subdomain exclusion p.83; the context map's three levels of insight p.83; the six-pattern summary p.85 |
| `ddd-simple-business-logic` | 89–99 | The three-failure transactional taxonomy with its remedies pp.91-94; the transaction-script fit list and its core-subdomain exclusion pp.94-95; the active-record fit list p.97 |
| `ddd-domain-model` | 101–123, 303 | The inside/outside consistency test pp.115-116; one aggregate instance per database transaction p.113; the co-location criteria pp.113-114; value object vs entity pp.109-110; immutability p.107; aggregate root and its public interface pp.116-117; domain events p.117; domain services pp.118-119; degrees of freedom pp.120-121; the three by-the-book rules p.303, including "the aggregate, not the ORM, defines the transactional scope" |
| `ddd-event-sourced-domain-model` | 125–142 | The four-step script every operation follows p.134; the event store's minimum contract p.133; four advantages pp.136-137 and three disadvantages pp.137-138; the snapshot benchmark instruction pp.138-139; the three rejected cheaper alternatives pp.140-141 (logfile / log table / history table) |
| `ddd-architectural-patterns` | 143–162 | The three layers and their single concerns p.144; the exhaustive presentation-layer and data-access-layer inventories pp.144-146; the service-layer necessity rule p.150; both terminology tables pp.150 and 154; layers vs tiers p.151; CQRS two model types pp.155-156; the three-step catch-up projection pp.156-157; synchronous-always p.159; the model segregation rules p.159. **Sole interop origin.** |
| `ddd-communication-patterns` | 163–181, 259–273 | Stateless-vs-stateful translation and its owner p.164; the three stateless implementations pp.164-166; the stateful forcing cases pp.167-169; the publishing ladder and its named failures pp.169-171; the outbox four steps p.171; pull-vs-push relay pp.172-173; saga vs process manager pp.176-177; event vs command p.260-261; the three event types pp.262-267; the consistency-requirement rule p.272; the three couplings with fixes pp.268-270; the assume-the-worst checklist p.271 |
| `ddd-design-heuristics` | 185–194 | **The router.** The ordered four-question business-logic heuristic p.188; the complexity criteria pp.188-189; the architecture mapping and its single CQRS exception p.189; the testing-strategy mapping p.191; the unified tree p.192; the start-wide boundary heuristic pp.186-187; the p.189 validation loop back onto subdomain type |
| `ddd-evolving-design-decisions` | 195–210, 227–240 | The four vectors of change p.195; the six subdomain-type transitions with triggers pp.196-198; the profitability test p.197; the ordered active-record → domain-model procedure pp.200-201; the two history-migration strategies pp.202-204; the organizational transitions pp.204-205; the growth checklist pp.206-209; brownfield strategic analysis pp.228-230; the two boundary questions p.232; the modernization pattern mapping pp.232-233; strangler and its single shared-database condition pp.234-235; the safe refactoring order p.236 |
| `ddd-eventstorming` | 211–225 | The ten ordered steps pp.213-221; the sticky-note colour legend pp.214-220; the step-8 completeness check p.220 (every command has an actor, a policy or an external system); the supplies checklist pp.212-213; the participant caps pp.212, 224 with the p.224 remedy; the six reasons to run it and the one stated case not to p.222 |
| `ddd-microservice-boundaries` | 251–258 | The safe zone p.253, restated p.257 (wider than bounded contexts → big ball of mud; narrower than microservices → distributed big ball of mud); the three candidate boundaries pp.251-255 with the p.252 asymmetry; the three aggregate-as-service questions pp.253-254, which the book prints **without a verdict**; interface compression via OHS and ACL pp.255-257 |

### What is deliberately *not* a skill

- **ch.16, Data Mesh, pp.275-292** → reference card. The supposed core is
  narrative: p.279 prints the star-vs-snowflake tradeoff and states no selection
  rule, names no threshold, recommends neither; pp.280-285 are a platform
  history; pp.285-289 are organizational acts ("appoint a federated governance
  body"), not auditable against a codebase. The card carries the two operative
  items: the data-as-a-product four-criterion checklist p.287, and the coupling
  violation pp.282, 285, 287 — an analytical job reading the operational
  database directly, because that schema is an internal implementation detail.
- **ch.14, pp.243-250** → reference card. Service and microservice definitions,
  the method-as-a-service reductio, local vs global complexity, deep vs shallow
  modules, the granularity curve. The deep-module test has no measurable input;
  its only worked example is a reductio. Decidable content starts at p.251.
- **Preface, Introduction, part openers, Closing Words, Appendix A, Appendix B**
  → reference cards. Framing, worked example, and answer key.

Appendix B is not decoration: `/ddd-exercise` grades against it, which makes it
the pack's regression test.

## The nine rules files

| File | What it binds |
|---|---|
| `ddd-source-of-truth.md` | The PDF, the normative range pp.17-321, the pack-shared ranges, and the closed exclusion list |
| `ddd-citation.md` | The citation forms, 1-based PDF pages only, one citation per line, what `verify` checks, the caption-only exemption |
| `ddd-halt-protocol.md` | The nine reason codes, the verbatim block, and its two extra fields: `Missing fact` and `Who can supply it` |
| `ddd-determinism.md` | The five tests, the seven required skill sections, the forbidden-phrase list in a machine-read block, the `ddd-quote` fence |
| `ddd-heuristic-status.md` | The `RULE` / `HEURISTIC` / `PREFERENCE` register keyed by claim and page, plus modality preservation |
| `ddd-required-inputs.md` | The registry of facts no codebase supplies, split by who answers |
| `ddd-structural-fidelity.md` | The closed list of structural rules code must not break, and the statement that no language halt exists here |
| `ddd-interop.md` | The optional bridge to the sibling pack. The only file in the pack that names it |
| `ddd-language.md` | Portuguese to the reader, English on disk, fixed scaffolding never translated |

### `ddd-required-inputs.md`, in detail

Most DDD decisions need a fact that source code does not contain. The skill must
halt rather than guess, and the halt must name **who to ask** — a halt that
cannot name its source is a dead end.

`REQUIRES_BUSINESS_INPUT`: whether an activity differentiates the company
[pp.30-31, 33, and p.37 where subdomain types are "defined by the company's
business strategy"]; the side-business test [p.34]; whether a ready-made solution
exists and whether integrating it is simpler than building it [pp.34, 36];
volatility [p.35]; whether new complexity enhances profitability [p.197]; legal
audit-log obligation, monetary character, need for deep behavioural analysis
[pp.137, 188]; which data the business requires to be strongly consistent [pp.115-116];
the invariants themselves [pp.102, 110]; consumer consistency tolerance [p.272];
domain-expert availability and their actual terms [pp.55-56]; commitment to
retire a legacy context [p.235].

Note p.189: a core subdomain's competitive advantage is not necessarily
technical, and p.309: business complexity and technical complexity are
independent. Neither can be read off a repository.

`REQUIRES_ORG_INPUT`: team count and codebase ownership [pp.68, 232];
collaboration quality and dependent goals [pp.76, 232]; balance of power between
teams [p.79]; geography and politics [pp.76, 78, 204-205]; planned growth
[pp.64, 204].

Neither code fits one case: an aggregate's expected lifespan in events [p.138].
The book says benchmark it. `Who can supply it: measurement`.

Conversely, these are readable from the project and must **never** halt:
multi-record or multi-document transaction support [pp.92, 171-172], and whether
the database supports checkpoint-ordered querying [p.157].

## Code fidelity — and why it is not the sibling's rule

**Do not copy `ca-code-fidelity.md`.** It would contradict this book.

PDF p.21 states: "All the code samples presented in the book are implemented in
the C# language." The same page then states the concepts are not limited to C#
or to object-oriented programming, and invites the reader to implement the
samples in another language. Footnote 2 on p.103 repeats it for functional
programming.

Therefore **there is no `CODE_STYLE_DIVERGENCE` in this pack.** A request for
TypeScript, Python or Go is legitimate and is answered.

What must not drift is **structure**. `ddd-structural-fidelity.md` holds a closed
checklist, each item a rule on a named page; a request whose code would break one
halts with `STRUCTURE_DIVERGENCE`, naming the page:

- A mutable value object [p.107].
- An explicit identification field on a value object [pp.104, 108-109].
- A public setter on an aggregate: its state can only be modified by its own
  business logic [pp.116, 121-122], and the same refactoring makes active-record
  setters private [p.200].
- Two aggregate instances modified in one transaction [p.113, restated p.238].
- An object reference held to an aggregate outside the boundary [p.116].
- A domain event published from inside the aggregate, or after the state commit
  [pp.169-171].
- A writable read model [pp.156, 159].
- Business logic in the service layer rather than the aggregate [p.303].
- An ORM, rather than the aggregate, defining the transactional scope [p.303].

Languages present in the book's listings, to be re-derived by
`ddd_pdf.py listings` and not trusted from this sample: C# throughout, SQL at
p.113, JSON documents on eight pages including pp.128, 172, 202-203, 261-266.

Prefer no code at all. Boundaries, dependency direction, consistency scope and
pattern selection are language-independent in this book. Code is the exception.

## Interop with `clean-architecture/`

The bridge exists **inside this book**, which is what makes it legitimate and
what makes it optional.

**Grounding.** p.154 states that ports & adapters "is also known as hexagonal
architecture, onion architecture, and clean architecture", that all of these are
based on the same design principles with the same components and relationships,
and that treating them as conceptually different is a mistake. It prints the
rows *application layer = service layer = use case layer* and *business logic
layer = domain layer = core layer*. p.150's layered terminology table supports
the translation; it is not a second bridge. p.152 already gives this book its own
DIP, so the bridge is a pointer for the reader, never a fact a DDD answer depends
on.

**Probe.** One filesystem existence check for
`../clean-architecture/rules/ca-source-of-truth.md`. No search, no network, no
inference. Nothing inside the sibling is ever read to produce a DDD verdict.

**When absent.** `ddd-architectural-patterns` answers wholly from ch.8, prints
one line — `Interop: sibling pack absent` — and finishes. No halt, no warning, no
degraded mode, no missing-dependency message.

**When present**, a handoff is legal only if all three hold: the invoked skill is
`ddd-architectural-patterns`; its own p.189 table has selected **ports &
adapters** for this component; and the question is that component's internal
structure. A layered or CQRS selection never opens it, because p.154's alias
covers ports & adapters alone.

**What crosses out.** Terms are rewritten row by row through
`references/ddd-terminology-mapping.md`, and the rewrite is printed with its
`[DDD ch.8 p.154]` citation so the reader sees the licensed substitution. A term
with no row does not cross. Aggregate, bounded context, subdomain, ubiquitous
language, domain event, the four business logic patterns, CQRS, event sourcing,
the integration patterns, EventStorming and data mesh never cross — the sibling
lists exactly that vocabulary as `OUT_OF_SCOPE` and would correctly halt.

**What crosses back.** Data, never a sentence. Whatever a `ca-*` skill emits is
reproduced verbatim under `[source: clean-architecture pack — not a DDD
citation]`. It may not be paraphrased into a DDD sentence, may not acquire a
`[DDD ...]` citation, and may not fill an output-template slot.

**Precedence.** Where the two packs disagree, this pack's rule wins inside this
pack. The sharp case is code: the sibling halts on any language outside C, C++,
Java, Clojure and PDP-8 assembler. That halt has no force here, per p.21 and
p.103. A returned CA halt is recorded as `interop: ca halted (<code>)` and the
DDD skill continues from ch.8.

**Optionality guarantee.** `rules/ddd-interop.md` is the only artifact in the
pack that names the sibling. A skill's output template carries at most the
literal token `Interop:`, filled by that rule. Deleting the file deletes the
bridge without editing a single skill.

## The genuine `AMBIGUOUS_IN_BOOK` triggers

These are the places the book prints options and refuses to pick. Each is
verified. A skill presents every option with its citation and halts on the choice.

1. **Bounded context size** — p.64 argues both directions and states size by
   itself is not a deciding factor; p.186 quotes Nick Tune calling size one of
   the least useful heuristics.
2. **One-to-one bounded context per subdomain, the choice** — p.66: "can be
   perfectly reasonable in some scenarios. In others, however, different
   decomposition strategies can be more suitable." The *mandate* is a separate
   matter and is refused outright on p.67 as inhibiting flexibility — that is a
   rule, not an ambiguity. Two pages, two handlings; do not merge them.
3. **Aggregate command style** — p.111: "a matter of preference. I prefer the
   more explicit way". `PREFERENCE`, author's own, stated.
4. **Fixing an implicit distributed transaction** — p.94: "there is no simple fix
   for this issue. It all depends on the business domain and its needs", then two
   techniques.
5. **Relaxing consistency at scale** — p.98, "Be Pragmatic": no threshold, only
   the instruction to evaluate risks and business implications first.
6. **Event-sourcing history migration** — pp.202-204: generating past transitions
   vs modeling migration events, advantages and disadvantages for each, neither
   chosen.
7. **Bounded context boundary strategy** — p.312: linguistic, subdomain-based and
   entity-based all tried, none fits all cases, none recommended. Only *suicidal
   boundaries* — dissecting an aggregate across two contexts — are forbidden
   outright, and the book's words are "Never try this at home".
8. **Microservice boundary among the three candidates** — p.255: subdomain
   alignment is "a safe heuristic that produces optimal solutions for the
   majority of microservices", with the stated exceptions and the dependency on
   organization structure, business strategy and nonfunctional requirements.
9. **Aggregate as its own service** — pp.253-254: three questions printed, no
   verdict, and the statement that such fine-grained services much more often
   increase global complexity.
10. **Several integration patterns at once between the same two contexts** —
    p.84, stated to happen, no tiebreak given.
11. **Whether a shared kernel is warranted** — p.78: cost of duplication versus
    cost of coordination, neither cost supplied by the book.
12. **Subdomain-type mismatch against the business's declared type** —
    pp.311-312: two branches in each direction, neither chosen, resolution comes
    from dialogue with the business. Pair with `REQUIRES_BUSINESS_INPUT`.

### Three that look ambiguous and are not

- **Active-record testing strategy, p.191.** Two figures (10-6 p.191, 10-7 p.192)
  route active record to the **testing diamond**; one sentence under the "Testing
  Diamond" heading says "the testing pyramid is the more effective choice". That
  is a misprint, decided 2:1 by the book's own artifacts. Emit *testing diamond*
  and reproduce the sentence verbatim in a `ddd-quote` fence. Halting here would
  make the pack useless at the one point it was asked a question.
- **Supporting-vs-generic gray area, p.34.** The criterion *is* named — is
  integrating simpler and cheaper than building. This is
  `REQUIRES_BUSINESS_INPUT`, and `AMBIGUOUS_IN_BOOK` only if both costs are known
  and equal.
- **"How much DDD to adopt", pp.236-237.** The book answers: it is still
  domain-driven design as long as the business domain drives the decisions.
  Answer, do not halt.

## Explicit non-goals

Verified absent from this PDF by full-text search, and therefore never in a
`ddd-*` artifact. Each item's handling is listed because the difference between
`OUT_OF_SCOPE` and `UNDEFINED_IN_BOOK` is itself a finding.

| Excluded | Evidence | Handling |
|---|---|---|
| Repository as a pattern | Appears only as identifiers pp.112, 119, 134, 170, 174-175, 200-201 and as "mono-repository" p.77. Never defined | `UNDEFINED_IN_BOOK` |
| Factory, factory methods | Zero occurrences in 340 pages | `OUT_OF_SCOPE` |
| Specification pattern | Zero occurrences | `OUT_OF_SCOPE` |
| Unit of Work | Zero occurrences | `OUT_OF_SCOPE` |
| Data Mapper, Table Module | Zero occurrences | `OUT_OF_SCOPE` |
| Supple design family | The word "supple" occurs once, in "Supplemental material" p.21 | `OUT_OF_SCOPE` |
| Distillation toolkit: domain vision statement, highlighted core, segregated core, abstract core | Absent, although pp.207, 228-230 do say to distill core subdomains | `OUT_OF_SCOPE` |
| Large-scale structure: responsibility layers, knowledge level, pluggable component framework, evolving order | Absent | `OUT_OF_SCOPE` |
| Continuous Integration as a context-relationship pattern | Present only as an engineering practice supporting the shared kernel pp.76-78 | Halt with that pointer |
| Bubble context, autonomous bubble | Absent. The strangler pattern **is** present pp.234-235 and is in scope. Never conflate them | `OUT_OF_SCOPE` |
| Vernon's aggregate rules | Absent. The book's sizing guidance is its own rule of thumb p.115 and the consistency test pp.115-116 | `OUT_OF_SCOPE` |
| Pessimistic locking mechanics | Named once, p.263, no mechanics | `UNDEFINED_IN_BOOK` |
| ORM mapping guidance | Named twice, p.96 as a coupling point and p.303 as what must not define transactional scope | `UNDEFINED_IN_BOOK` |
| Context map notation, U/D markers, arrow semantics | p.28 calls a context map "a graphical notation" and p.84 names Context Mapper as a tool; no notation is specified. The halt says the book calls it a notation and specifies none | `UNDEFINED_IN_BOOK` |
| Consumer deduplication and reordering techniques | p.271 *requires* subscribers to do both and supplies no technique | `UNDEFINED_IN_BOOK` |
| Clean Architecture vocabulary: SOLID as a family, SRP/OCP/LSP/ISP, REP/CCP/CRP, ADP/SDP/SAP, the Main component, Humble Object, screaming architecture, the four concentric circles, the Dependency Rule | Not in this book. **Exception: DIP alone is in this book, p.152**, and may be used; the other four principles may not | `OUT_OF_SCOPE` |
| This repository's conventions: NestJS layout, Prisma, `Result`, the `07-arquitetura-software-com-ia` skills | Not in this book | `OUT_OF_SCOPE` |

## Required `SKILL.md` shape

Identical structure across all thirteen. Seven sections — one more than the
sibling, because this book's decisions need inputs a codebase does not hold.

```markdown
---
name: ddd-<slug>
description: <when to invoke, third person, concrete triggers>
---

# DDD <Title>

## Source
Page scope: `[DDD ch.N pp.NNN-NNN]`. This skill may cite no other page,
except the pack-shared ranges in `../../rules/ddd-source-of-truth.md`.

## Rules
Numbered. One rule per line. Each ends with its citation and its status token.

## Inputs
What the skill needs before it can decide, each mapped to a reason code and to
who can supply it. Per `../../rules/ddd-required-inputs.md`.

## Procedure
Numbered steps. Each step is an instruction or a decision table.
Every table ends with `anything else → HALT (<REASON_CODE>)`.

## Halt conditions
The specific triggers for this skill, each mapped to a reason code.

## Output template
Verbatim block the skill must emit. Slots in `<angle brackets>`.
Every emitted claim line carries a citation and a status token.

## References
`../../references/ddd-part-N-*.md`, `../../rules/*.md`.
```

## Order of work

1. `tools/ddd_pdf.py`, all six subcommands, `verify` last and hardest.
2. `references/ddd-page-index.md`, `ddd-code-listings.md` and
   `ddd-decision-artifacts.md`, all three generated. Re-confirm the chapter end
   pages and report every place this spec's table was wrong.
3. The nine `rules/` files. They are short and they bind every skill.
   `ddd-heuristic-status.md` and `ddd-required-inputs.md` are written **before**
   any skill, because every skill line depends on them.
4. `references/ddd-vocabulary.md`, `ddd-terminology-mapping.md` and
   `ddd-not-in-this-book.md`. These three turn `UNDEFINED_IN_BOOK` and
   `OUT_OF_SCOPE` from recollection into a lookup.
5. The remaining reference cards, each claim cited and verifiable.
6. The thirteen skills, one at a time, running `ddd_pdf.py verify` after each.
   Start with `ddd-design-heuristics`: it is the router, and building it first
   exposes what the other twelve must expose to it.
7. The seven commands.
8. `README.md` and an empty `ddd-divergences.md`.

Do not write a skill before its part card exists. The card is what the skill
cites; writing the skill first is how invented rules get in.

## Copyright

Quote sparingly. Short phrases where the exact wording is the rule — the
principle statements, the modal verbs this pack preserves, the sentences inside
`ddd-quote` fences. Everything else is restated in your own words with a
citation. Do not bulk-extract chapters into `references/`.

## Definition of done

- `python3 tools/ddd_pdf.py verify` exits 0.
- Every `.md` under `domain-driven-design/` contains zero forbidden hedging
  phrases outside a `ddd-quote` fence.
- Every `ddd-quote` fence matches its page 100% verbatim.
- Every skill directory name and `name:` field starts with `ddd-`; every other
  file except `README.md` and the PDF does too.
- Every skill has all seven required sections, in order.
- Every normative line carries a resolvable citation **and** a status token whose
  modal verb matches the cited page.
- No skill cites a page outside its declared ranges plus the pack-shared ranges.
- No `.md` under `domain-driven-design/` contains the substring `[CA `.
- **Optionality acceptance test**: with `../clean-architecture/` moved away,
  `verify` still exits 0 and every skill still produces its full output, printing
  `Interop: sibling pack absent`. This is a test that gets run, not a claim.
- `/ddd-exercise` reproduces Appendix B's answers for at least chapters 1, 5, 6,
  8 and 10 from the skills alone, without reading Appendix B first.
- `ddd-divergences.md` exists and is empty.

## Language

English, per the repository's global instruction. Chat about it in Portuguese;
nothing Portuguese lands in these files.

## Stop conditions for you, the implementer

If, while building this, you find that a skill you were told to write cannot be
grounded in its pages — stop and report it. Do not fill the gap. The same halt
protocol you are implementing applies to the act of implementing it.

Two specific traps, both already hit once during the research for this spec:

- **Hardening a "should" into a "must".** It reads better, it verifies worse, and
  it is a citation that no longer says what the page says.
- **Citing a figure page for the figure's content.** The extractor returns only
  the caption. Mark the page caption-only in `ddd-decision-artifacts.md` and cite
  the prose that explains the figure instead.

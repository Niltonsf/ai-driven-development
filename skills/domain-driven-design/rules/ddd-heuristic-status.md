# DDD rule: heuristic status

This book grades its own statements. The pack copies the grade instead of
flattening it. This is the rule that makes this pack different from the sibling.

## The three tokens

Every normative line in the pack ends with exactly one token, after the
citation:

| Token | Assigned when the cited page |
|---|---|
| `RULE` | states must / never / only / cannot / has to, with no exception on that same page |
| `HEURISTIC` | uses the word heuristic, rule of thumb, advisable, preferable, avoided, or "should" |
| `PREFERENCE` | marks the statement as the author's own: "I prefer", "my preference", "my advice", "a matter of preference" |

`verify` reads the token, then checks two things:

1. **Token consistency.** A `RULE` line carries no heuristic and no preference
   wording. A `HEURISTIC` line carries at least one heuristic word. A
   `PREFERENCE` line carries at least one preference word.
2. **Modality preservation.** Every modal word in the line — must, never,
   cannot, always, should, preferable, prefer, heuristic, rule of thumb,
   advisable, advice, avoided — appears on the cited page.

A line that hardens the book's "should" into "must" fails as
`CITATION_UNVERIFIED`. The adversarial reading of all sixteen chapters found
this to be the single most common drift: not a wrong page, an inflated modal.

## Modality preservation, in one sentence

**The modal verb in the pack's line matches the modal verb on the page.**

The book writes "should" in several places a skill would love to harden. Two
modalities on one page are two lines, two tokens, never one merged line.

## The register

Keyed by claim and page. A skill line that restates one of these copies its
token. A claim absent from this register is graded by reading its page.

### `RULE`

- One aggregate instance per database transaction [DDD ch.6 p.113] `RULE`
- An aggregate's state can only be modified by executing one of its commands [DDD ch.6 p.116] `RULE`
- Value objects are implemented as immutable objects [DDD ch.6 p.107] `RULE`
- A query cannot directly modify any of the system's persisted state [DDD ch.8 p.159] `RULE`
- A command can only operate on the strongly consistent command execution model [DDD ch.8 p.159] `RULE`
- No two teams can work on the same bounded context [DDD ch.3 p.68] `RULE`
- A single team can own multiple bounded contexts [DDD ch.3 p.68] `RULE`
- Domain experts must be comfortable using the ubiquitous language when reasoning about the business domain [DDD ch.2 p.51] `RULE`
- The ubiquitous language must be precise and consistent [DDD ch.2 p.52] `RULE`
- Two terms cannot be used interchangeably in a ubiquitous language [DDD ch.2 p.52] `RULE`
- At a minimum the event store has to support fetch of all events belonging to a specific business entity and append of the events [DDD ch.7 p.133] `RULE`

### `HEURISTIC`

- A bounded context should be owned by only one team [DDD ch.3 p.68] `HEURISTIC`
- A bounded context should be implemented, evolved, and maintained by one team only [DDD ch.3 p.68] `HEURISTIC`
- Transaction script should never be used for core subdomains [DDD ch.5 p.95] `HEURISTIC`
- The separate ways pattern should be avoided when integrating core subdomains [DDD ch.4 p.83] `HEURISTIC`
- The rule of thumb is to keep the aggregates as small as possible [DDD ch.6 p.115] `HEURISTIC`
- Only the information required by the aggregate's business logic to be strongly consistent should be a part of the aggregate [DDD ch.6 p.115] `HEURISTIC`
- Only one entity should be designated as the aggregate's public interface, the aggregate root [DDD ch.6 p.116] `HEURISTIC`
- All project-related stakeholders should use the ubiquitous language when describing the business domain [DDD ch.2 p.51] `HEURISTIC`
- Each term of the ubiquitous language should have one and only one meaning [DDD ch.2 p.52] `HEURISTIC`
- It is preferable to use each term explicitly in its specific context [DDD ch.2 p.52] `HEURISTIC`
- The event store should not allow modifying or deleting the events [DDD ch.7 p.133] `HEURISTIC`
- It is advisable to always implement synchronous projection [DDD ch.8 p.159] `HEURISTIC`
- The design heuristics chapter prints its decision trees as heuristics, not hard rules [DDD ch.10 p.192] `HEURISTIC`

### `PREFERENCE`

- How commands are expressed in an aggregate's code is a matter of preference [DDD ch.6 p.111] `PREFERENCE`
- The decision tree is based on my preference to use the simple tools [DDD ch.10 p.193] `PREFERENCE`
- My advice is to at least use English nouns for naming the business domain's entities [DDD ch.2 p.57] `PREFERENCE`

## What a low grade changes

Not whether an answer is given. A heuristic never halts for being a heuristic; a
skill that refuses to answer at the one point the user asked a question is a
broken skill.

What the grade changes is what follows the answer:

1. The token is printed next to the claim, so the reader sees the book's own
   confidence.
2. The heuristic's pattern validates the assumptions about the subdomain type, and a mismatch is an excellent opportunity to revisit them [DDD ch.10 p.189] `HEURISTIC`.
3. A review trigger is recorded. Making design decisions is important, but even more so is to verify the decisions' validity over time [DDD ch.10 p.193] `HEURISTIC`.

The book's own words for the grade of its trees:

```ddd-quote [DDD ch.10 p.192]
these are heuristics, not hard rules
```

```ddd-quote [DDD ch.10 p.193]
but not as a replacement for critical thinking
```

## `BOOK_DECLINES_TO_GENERALIZE`

One shape only. The tree prints its answer; the quote prints the book declining
to extend one team's practice to everyone; the skill stops at the endorsement,
not at the answer.

Asked instead to *override* the tree with a house rule, the skill does not halt.
p.193 permits altering the guiding principles or building your own decision
tree. Whatever is decided there is appended to `../ddd-divergences.md`.

## See also

`ddd-citation.md`, `ddd-halt-protocol.md`, `ddd-determinism.md`,
`ddd-required-inputs.md`.

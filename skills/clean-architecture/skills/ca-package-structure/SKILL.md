---
name: ca-package-structure
description: Presents the four code organization approaches of the book's final chapter and the encapsulation question behind them, then halts on the choice. Invoke when the request mentions package by layer, package by feature, ports and adapters, package by component, folder or package structure, access modifiers, public types, or asks which code organization to adopt.
---

# CA Package Structure

## Source

Book scope, and no other chapter: The Missing Chapter, by Simon Brown [CA ch.34 pp.225-240].

This skill presents. It never chooses. The book presents four approaches and
declines to pick one, so the choice halts with `AMBIGUOUS_IN_BOOK`.

## Rules

1. Package by layer slices code horizontally by what it does from a technical perspective, with all dependencies pointing downward [CA ch.34 pp.225-226]
2. A layered architecture is a good way to get started, and three large buckets of code stop being sufficient as the software grows [CA ch.34 p.227]
3. A layered architecture screams nothing about the business domain: two of them from different domains look eerily similar [CA ch.34 p.227]
4. Package by feature slices vertically, placing the types of one concept into a single package named for that concept [CA ch.34 p.227]
5. Package by feature makes the top-level organization of the code scream about the business domain [CA ch.34 p.227]
6. Ports and adapters splits an inside of domain concepts from an outside of infrastructure, where the outside depends on the inside and never the other way [CA ch.34 pp.228-229]
7. Package by component bundles the responsibilities of one coarse-grained component into a single package, keeping the user interface separate [CA ch.34 p.233]
8. Brown's definition of a component: a grouping of related functionality behind a clean interface, residing inside an execution environment like an application [CA ch.34 p.234]
9. Both horizontal layering and vertical layering are suboptimal, in the words of the chapter's own author [CA ch.34 p.227]
10. A relaxed layered architecture, where a controller skips the service and calls the repository, still produces an acyclic dependency graph [CA ch.34 p.231]
11. Discipline and code reviews are what teams say they use until budgets and deadlines loom; static analysis is fallible and its feedback loop is long [CA ch.34 pp.232-233]
12. If every type is public, packages are only an organization mechanism and provide very little real value [CA ch.34 p.235]
13. With every type public, all four approaches are syntactically identical whatever their conceptual differences [CA ch.34 p.235]
14. Applying access modifiers changes which types each approach can hide, and the fewer public types, the smaller the number of potential dependencies [CA ch.34 pp.236-237]
15. Other decoupling modes: module systems that distinguish public types from published types, and separate source code trees per component [CA ch.34 p.238]

## Procedure

1. Present all four approaches in the order the chapter presents them, each with its citation, in Portuguese per `../../rules/ca-language.md` [CA ch.34 pp.225-234]
2. For each approach, state which types must be public and which can be package protected [CA ch.34 p.236]

| Condition | Action |
|---|---|
| Package by layer | The service and repository interfaces must be public; the implementation classes can be package protected [CA ch.34 p.236] |
| Package by feature | The controller is the sole entry point, so everything else can be package protected [CA ch.34 p.236] |
| Ports and adapters | The service and the domain interfaces need to be public; the implementation classes can be package protected [CA ch.34 p.236] |
| Package by component | Only the component interface has an inbound dependency from the controller, so the compiler enforces the rest [CA ch.34 p.237] |
| anything else | HALT (`OUT_OF_SCOPE`) |

3. State the encapsulation question that outranks the choice: marking every type public wastes the facilities the language provides [CA ch.34 p.235]
4. State the other ways to decouple: a module system that publishes only a subset of its public types, or splitting code across different source code trees [CA ch.34 p.238]
5. Name the trade-off of one infrastructure tree: the Périphérique anti-pattern, where a web controller calls a database repository without navigating through the domain [CA ch.34 p.239]
6. Answer the choice with the halt table below: present the four, pick none, per `../../rules/ca-halt-protocol.md`

| Condition | Action |
|---|---|
| The request asks which of the four to adopt | HALT (`AMBIGUOUS_IN_BOOK`) after presenting all four |
| The request asks for a folder tree to create | HALT (`OUT_OF_SCOPE`) |
| The request asks what each approach implies for access modifiers | Answer from the table in step 2 [CA ch.34 pp.236-237] |
| The request asks how the compiler can enforce the chosen style | Answer with access modifiers, module systems and source code trees [CA ch.34 pp.237-238] |
| anything else | HALT (`OUT_OF_SCOPE`) |

## Halt conditions

| Trigger | Code |
|---|---|
| The request asks this skill to choose, rank or endorse one approach | `AMBIGUOUS_IN_BOOK` |
| The request asks for a directory listing or a scaffold | `OUT_OF_SCOPE` |
| The request asks about hexagonal architecture beyond this chapter | `OUT_OF_SCOPE` |
| The request asks for the packages as code in a language outside the book | `CODE_STYLE_DIVERGENCE` |
| The codebase's structure matches none of the four | `CONFLICT_WITH_PROJECT` |
| anything else | HALT (`OUT_OF_SCOPE`) |

## Output template

```
## CA Package Structure — <codebase or question>

1. Package by layer — <one line> [CA ch.34 pp.225-226]
2. Package by feature — <one line> [CA ch.34 p.227]
3. Ports and adapters — <one line> [CA ch.34 pp.228-229]
4. Package by component — <one line> [CA ch.34 p.233]

- Access modifiers per approach: <from step 2> [CA ch.34 pp.236-237]
- Encapsulation: <what is public, what could be package protected here> [CA ch.34 p.235]
- Other decoupling modes: <module system | source code trees> [CA ch.34 p.238]

## CA HALT — AMBIGUOUS_IN_BOOK

- Requested: which code organization to adopt
- Book coverage: PARTIAL
- Searched: `python3 tools/ca_pdf.py search "package by"` → <hits>
- Nearest in-book material: [CA ch.34 pp.225-240]
- Reason: the chapter presents four approaches and picks none

No action taken. Nothing was written or changed.
To go beyond the book, say so explicitly and I will treat it as a separate,
non-book-locked task.
```

## References

`../../references/part-6-details.md`, `../../rules/ca-source-of-truth.md`,
`../../rules/ca-citation.md`, `../../rules/ca-halt-protocol.md`,
`../../rules/ca-code-fidelity.md`, `../../rules/ca-determinism.md`,
`../../rules/ca-language.md`,
`../../rules/ca-answer-contract.md`.

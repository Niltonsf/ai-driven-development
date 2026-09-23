---
name: ca-solid
description: Applies one of the five SOLID principles to a class, module or component, at the level the book treats them. Invoke when the request mentions SRP, OCP, LSP, ISP, DIP, a module answering to several teams, code that must be modified to be extended, a subtype that is not substitutable, a user depending on operations it never calls, or a dependency on a volatile concrete class.
---

# CA SOLID

## Source

Book scope, and no other chapter:

- The Single Responsibility Principle [CA ch.7 pp.64-69]
- The Open-Closed Principle [CA ch.8 pp.70-74]
- The Liskov Substitution Principle [CA ch.9 pp.75-79]
- The Interface Segregation Principle [CA ch.10 pp.80-82]
- The Dependency Inversion Principle [CA ch.11 pp.83-86]

## Rules

1. SRP: a module should be responsible to one, and only one, actor [CA ch.7 p.65]
2. An actor is a group of one or more people who require that change, not a single user or stakeholder [CA ch.7 pp.64-65]
3. A module is a source file, or a cohesive set of functions and data structures where source files are absent [CA ch.7 p.65]
4. Symptom one, accidental duplication: a shared function called by methods that belong to different actors [CA ch.7 pp.65-66]
5. Symptom of an SRP violation: merges, where developers from two teams change the same source file for different reasons [CA ch.7 p.67]
6. OCP: a software artifact should be open for extension but closed for modification [CA ch.8 p.70]
7. If component A should be protected from changes in component B, then component B should depend on component A [CA ch.8 p.73]
8. Information hiding: an interface protects a caller from transitive dependencies on things it does not directly use [CA ch.8 p.74]
9. LSP: programs defined in terms of a type are unchanged when a subtype object is substituted [CA ch.9 p.75]
10. The square/rectangle problem: Square is not a proper subtype of Rectangle, because height and width are independently mutable in one and change together in the other [CA ch.9 p.76]
11. A User that needs an if statement to detect the actual type proves the types are not substitutable [CA ch.9 p.77]
12. ISP: it is harmful to depend on modules that contain more than you need [CA ch.10 p.81]
13. DIP: source code dependencies refer only to abstractions, not to concretions [CA ch.11 p.83]
14. Do not refer to, derive from, or override anything volatile and concrete; use an Abstract Factory to create it [CA ch.11 p.84]

## Procedure

1. Restate the request as one symptom of violating a principle, naming the module or source file [CA ch.7 p.65]
2. Route that symptom with the principle table below: one principle per run, one action per row per `../../rules/ca-determinism.md`

| Condition | Action |
|---|---|
| Methods in one module are responsible to different actors | SRP: separate the code that different actors depend on [CA ch.7 p.66] |
| A simple extension to the requirements forces massive changes to the software | OCP: the behavior ought to be extendible without modifying the artifact [CA ch.8 p.70] |
| The behavior of the User depends on the types it uses | LSP: those types are not substitutable [CA ch.9 p.77] |
| A user is recompiled and redeployed because of operations it never calls | ISP: segregate the operations into interfaces [CA ch.10 p.81] |
| A module mentions the name of something concrete and volatile | DIP: refer to abstract interfaces instead [CA ch.11 p.84] |
| anything else | HALT (`OUT_OF_SCOPE`) |

3. Name the parties the way the payroll example names them: the accounting department, the human resources department, the database administrators [CA ch.7 p.65]
4. State the correction as a change of structure: which methods move into which classes, which share a data structure with no methods [CA ch.7 p.67]
5. State what the correction protects: the component that should be protected from change is the one depended upon [CA ch.8 p.73]
6. Emit the output template below, with a citation on every claim per `../../rules/ca-citation.md`, writing the filled slots in Portuguese per `../../rules/ca-language.md`

## Halt conditions

| Trigger | Code |
|---|---|
| The symptom matches no row of the principle table | `OUT_OF_SCOPE` |
| The request asks about component-level cohesion or coupling | `OUT_OF_SCOPE`, routes to `ca-component-design` |
| The request asks for the fix as code in a language outside the book | `CODE_STYLE_DIVERGENCE` |
| The actors cannot be named because the request does not say who asks for changes | `AMBIGUOUS_IN_BOOK` |
| The codebase forbids the structural correction the principle requires | `CONFLICT_WITH_PROJECT` |
| anything else | HALT (`OUT_OF_SCOPE`) |

## Output template

```
## CA SOLID — <principle> — <subject>

- Symptom: <one line>
- Principle: <statement> [CA ch.N p.NNN]
- Parties: <actors, components or concretions, by name>
- Verdict: CONFORMS | VIOLATES
- Correction: <structural change>
- Protects: <what is shielded from what> [CA ch.8 p.73]
```

## References

`../../references/part-3-design-principles.md`, `../../rules/ca-source-of-truth.md`,
`../../rules/ca-citation.md`, `../../rules/ca-halt-protocol.md`,
`../../rules/ca-code-fidelity.md`, `../../rules/ca-determinism.md`,
`../../rules/ca-language.md`,
`../../rules/ca-answer-contract.md`.

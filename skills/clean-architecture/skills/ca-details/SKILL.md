---
name: ca-details
description: Decides whether a thing is policy or a detail, and where a detail belongs. Invoke when the request mentions choosing or swapping a database, ORM rows passed around the system, delivering over the web or another UI, adopting or escaping a framework, dependency injection annotations in business objects, or what the Main component should do.
---

# CA Details

## Source

Book scope, and no other chapter:

- The Main Component [CA ch.26 pp.181-184]
- The Database Is a Detail [CA ch.30 pp.209-213]
- The Web Is a Detail [CA ch.31 pp.214-216]
- Frameworks Are Details [CA ch.32 pp.217-219]

## Rules

1. From an architectural point of view the database is a detail that does not rise to the level of an architectural element [CA ch.30 p.209]
2. The data model is not the database: the structure given to the data is significant, the utility that provides access to it is not [CA ch.30 p.209]
3. There is nothing architecturally significant about arranging data into rows within tables [CA ch.30 p.210]
4. Passing database rows and tables around the system as objects is an architectural error [CA ch.30 p.210]
5. Knowledge of the tabular structure is restricted to the lowest-level utility functions in the outer circles [CA ch.30 p.210]
6. The performance of data storage is a low-level concern that can be entirely encapsulated and separated from the business rules [CA ch.30 pp.211-212]
7. The GUI is a detail, the web is a GUI, therefore the web is a detail, and details go behind boundaries [CA ch.31 p.216]
8. The web is an IO device, and the value of device independence has not changed since the 1960s [CA ch.31 p.216]
9. What can be abstracted from the UI is the use case: complete input data in, resultant output data out, in data structures [CA ch.31 p.216]
10. Frameworks are not architectures, though some try to be [CA ch.32 p.217]
11. The relationship with a framework author is asymmetric: you make a huge commitment, and the author makes none to you [CA ch.32 p.218]
12. Frameworks tend to violate the Dependency Rule by asking you to inherit their code into your Entities [CA ch.32 p.218]
13. Use the framework, do not couple to it; if it wants your business objects derived from its base classes, derive proxies instead [CA ch.32 p.219]
14. Main is the ultimate detail, the lowest-level policy, and nothing other than the operating system depends on it [CA ch.26 p.181]
15. Main creates the Factories, Strategies and other global facilities, then hands control over to the high-level abstract portions of the system [CA ch.26 p.181]
16. Dependencies are injected in Main by a Dependency Injection framework, and Main distributes them afterward without the framework [CA ch.26 p.181]
17. Main is a plugin, so there can be one Main per configuration: Dev, Test, Production, or one per country or customer [CA ch.26 p.184]

## Procedure

1. Name it, then ask whether it is a low-level mechanism or an architectural element [CA ch.30 p.209]
2. Classify it with the detail table below, one action per row per `../../rules/ca-determinism.md`

| Condition | Action |
|---|---|
| It is the structure given to the data within the application | Policy: the data model is architecturally significant [CA ch.30 p.209] |
| It is a utility that provides access to the data | Detail: the database is a mechanism, kept in the outer circles [CA ch.30 pp.209-211] |
| It is the GUI, or the web | Detail: the GUI is a detail, the web is a GUI, so the web is a detail [CA ch.31 p.216] |
| It is a library of feature-laden software the application is written against | Detail: a framework belongs in one of the outer circles [CA ch.32 p.219] |
| It creates and wires the other components and then hands over control | Main: the ultimate detail and the dirtiest component [CA ch.26 p.181] |
| anything else | HALT (`OUT_OF_SCOPE`) |

3. Bolt the detail on the side of the system and name the narrow and safe data access channel to it [CA ch.30 p.213]
4. Check for leakage with the contamination table below per `../../rules/ca-determinism.md`

| Condition | Action |
|---|---|
| Database rows or tables travel through the use cases or the UI | Architectural error: it couples them to the relational structure of the data [CA ch.30 p.210] |
| Business objects carry framework annotations or derive from framework base classes | Violation: do not let the framework into the innermost circle [CA ch.32 pp.218-219] |
| The framework is used in Main only, to inject dependencies | Conforms: Main is the dirtiest, lowest-level component, so it may know about Spring [CA ch.32 p.219] |
| The framework cannot be avoided, such as the C++ STL or the Java standard library | Marry it, and record that it was a decision [CA ch.32 p.219] |
| anything else | HALT (`OUT_OF_SCOPE`) |

5. State what Main does with this detail: create it, inject it, and hand control to the high-level policy [CA ch.26 p.181]
6. Emit the output template below, one block per detail, with a citation on every claim per `../../rules/ca-citation.md`, writing the filled slots in Portuguese per `../../rules/ca-language.md`

## Halt conditions

| Trigger | Code |
|---|---|
| The request asks which database, web framework or library to pick | `OUT_OF_SCOPE`, the book classifies these as details and names no product |
| The request asks for a schema or a data model design | `OUT_OF_SCOPE` |
| The request asks for the wiring as code in a language outside the book | `CODE_STYLE_DIVERGENCE` |
| The thing is both the data model and the access mechanism, inseparably | `AMBIGUOUS_IN_BOOK` |
| The framework in the codebase requires annotations inside the business objects | `CONFLICT_WITH_PROJECT` |
| anything else | HALT (`OUT_OF_SCOPE`) |

## Output template

```
## CA Detail — <thing>

- Classification: policy | detail [CA ch.30 p.209]
- Reason: <one line from the detail table>
- Placement: <outer circle | behind interface <name> | Main> [CA ch.30 p.210]
- Interface the business rules use: <name, or "none needed">
- Leakage found: <rows in use cases | framework in entities | none> [CA ch.30 p.210]
- Main's part: <what Main creates and injects> [CA ch.26 p.181]
```

## References

`../../references/part-5-architecture.md`, `../../references/part-6-details.md`,
`../../rules/ca-source-of-truth.md`, `../../rules/ca-citation.md`,
`../../rules/ca-halt-protocol.md`, `../../rules/ca-code-fidelity.md`,
`../../rules/ca-determinism.md`, `../../rules/ca-language.md`,
`../../rules/ca-answer-contract.md`.

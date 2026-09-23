---
name: ca-humble-object
description: Splits a hard-to-test behavior from the testable behavior around it, and places the tests in the architecture. Invoke when the request mentions presenters and views, view models, database gateways, ORMs or data mappers, service listeners, tests that break whenever the UI changes, fragile tests, a testing API, or where the tests belong in the architecture.
---

# CA Humble Object

## Source

Book scope, and no other chapter:

- Presenters and Humble Objects [CA ch.23 pp.167-170]
- The Test Boundary [CA ch.28 pp.192-194]

## Rules

1. The Humble Object pattern splits behaviors into two modules: the humble one holds the hard-to-test behaviors, the other holds the testable behaviors [CA ch.23 p.167]
2. The View is the humble object: it moves data into the GUI and does not process that data [CA ch.23 p.168]
3. The Presenter is the testable object: it accepts data from the application and formats it so the View can move it to the screen [CA ch.23 p.168]
4. Everything that appears on the screen is represented in the View Model as a string, a boolean or an enum [CA ch.23 p.168]
5. The separation into testable and non-testable parts often defines an architectural boundary [CA ch.23 p.168]
6. Database gateways are polymorphic interfaces with a method for every create, read, update or delete operation the application performs [CA ch.23 p.168]
7. SQL is not allowed in the use cases layer; the gateway implementation in the database layer is the humble object [CA ch.23 pp.168-169]
8. Interactors are not humble, and stay testable because the gateways are replaced with stubs and test-doubles [CA ch.23 p.169]
9. ORMs are better named data mappers and belong in the database layer [CA ch.23 p.169]
10. Service listeners receive data from the service interface and format it into a simple data structure the application can use [CA ch.23 p.169]
11. Tests are part of the system, follow the Dependency Rule, and are the outermost circle [CA ch.28 p.192]
12. Tests strongly coupled to the system must change along with it, which is the Fragile Tests Problem [CA ch.28 p.193]
13. The first rule of design for testability: do not depend on volatile things, and GUIs are volatile [CA ch.28 p.193]
14. The testing API lets tests verify business rules while bypassing expensive resources such as databases and forcing the system into testable states [CA ch.28 p.193]
15. A test class for every production class and a test method for every production method is structural coupling, and it makes the production code rigid [CA ch.28 p.194]

## Procedure

1. Name the behavior and say why it is hard to test, in the terms the book uses for a GUI that is hard to see from a test [CA ch.23 p.167]
2. Split it with the humble table below, one action per row per `../../rules/ca-determinism.md`

| Condition | Action |
|---|---|
| The behavior moves data onto a screen | Humble: the View, kept as simple as possible [CA ch.23 p.168] |
| The behavior formats data for presentation | Testable: the Presenter, loading strings and booleans into the View Model [CA ch.23 p.168] |
| The behavior issues SQL or talks to the database | Humble: the gateway implementation in the database layer [CA ch.23 pp.168-169] |
| The behavior loads data into data structures from relational tables | Humble: a data mapper, in the database layer [CA ch.23 p.169] |
| The behavior formats data for an external service, or receives it from one | Humble: the service listener at the service boundary [CA ch.23 p.169] |
| The behavior applies application-specific business rules | Not humble: the interactor, testable through stubbed gateways [CA ch.23 p.169] |
| anything else | HALT (`OUT_OF_SCOPE`) |

3. State the boundary between the two: the separation of behaviors into testable and non-testable parts often defines an architectural boundary [CA ch.23 p.168]
4. Place the tests as the outermost circle: nothing within the system depends on them, and they always depend inward [CA ch.28 p.192]
5. Check the test suite against the fragility table below per `../../rules/ca-determinism.md`

| Condition | Action |
|---|---|
| Tests navigate the login screen and the page structure to reach a business rule | Fragile: design the system and the tests so business rules can be tested without the GUI [CA ch.28 p.193] |
| There is one test class per production class and one test method per production method | Structural coupling: hide the structure of the application from the tests [CA ch.28 p.194] |
| Tests reach the business rules through an API of their own | Conforms: the testing API decouples the structure of the tests from the structure of the application [CA ch.28 p.194] |
| anything else | HALT (`OUT_OF_SCOPE`) |

6. If a testing API is prescribed, state that its superpowers are kept in a separate, independently deployable component [CA ch.28 p.194]
7. Emit the output template below, one block per behavior, with a citation on every claim per `../../rules/ca-citation.md`, writing the filled slots in Portuguese per `../../rules/ca-language.md`

## Halt conditions

| Trigger | Code |
|---|---|
| The request asks which test framework or test style to adopt | `OUT_OF_SCOPE`, all tests are architecturally equivalent |
| The request asks for a test-to-production ratio or a coverage target | `OUT_OF_SCOPE` |
| The request asks for the split as code in a language outside the book | `CODE_STYLE_DIVERGENCE` |
| The behavior is neither hard to test nor easy to test as stated | `AMBIGUOUS_IN_BOOK` |
| The codebase requires SQL inside the use cases layer | `CONFLICT_WITH_PROJECT` |
| anything else | HALT (`OUT_OF_SCOPE`) |

## Output template

```
## CA Humble Object — <behavior>

- Hard to test because: <one line> [CA ch.23 p.167]
- Humble half: <name> — <what it moves, without processing it> [CA ch.23 p.168]
- Testable half: <name> — <what it formats or decides> [CA ch.23 p.168]
- Interface: <name>, declared by <side>, implemented by <side> [CA ch.23 p.168]
- Data between them: <View Model fields, or the gateway's methods> [CA ch.23 p.168]
- Test placement: outermost circle, depending inward [CA ch.28 p.192]
- Fragility found: <fragile tests | structural coupling | none> [CA ch.28 pp.193-194]
```

## References

`../../references/part-5-architecture.md`, `../../rules/ca-source-of-truth.md`,
`../../rules/ca-citation.md`, `../../rules/ca-halt-protocol.md`,
`../../rules/ca-code-fidelity.md`, `../../rules/ca-determinism.md`,
`../../rules/ca-language.md`,
`../../rules/ca-answer-contract.md`.

---
name: ca-business-rules
description: Classifies a rule as a Critical Business Rule or an application-specific rule, places it in an Entity or a use case, and shapes the request and response models that carry data in and out. Invoke when the request mentions entities, use cases, interactors, critical business rules, request or response models, DTOs crossing into a use case, decoupling the UI from the business rules, or an architecture that should scream what the system does.
---

# CA Business Rules

## Source

Book scope, and no other chapter:

- Business Rules [CA ch.20 pp.153-157]
- Independence [CA ch.16 pp.125-132]
- Screaming Architecture [CA ch.21 pp.158-160]

## Rules

1. Critical Business Rules make or save the business money, and would exist even if there were no system to automate them [CA ch.20 p.153]
2. Critical Business Data is the data those rules require, which would exist even if the system were not automated [CA ch.20 p.153]
3. An Entity embodies a small set of Critical Business Rules operating on Critical Business Data [CA ch.20 p.154]
4. The Entity is pure business and nothing else, unsullied by concerns about databases, user interfaces or third-party frameworks [CA ch.20 p.154]
5. An Entity does not require an object-oriented language: bind the critical data and the critical rules in a single, separate module [CA ch.20 p.154]
6. A use case describes the way an automated system is used: the input, the output, and the processing steps that produce it [CA ch.20 p.155]
7. Use cases hold application-specific business rules and control the dance of the Entities [CA ch.20 p.155]
8. From the use case it is impossible to tell whether the application is delivered on the web, a thick client, a console or a pure service [CA ch.20 p.155]
9. Use cases depend on Entities; Entities do not depend on use cases [CA ch.20 p.156]
10. The use case accepts a simple request data structure and returns a simple response data structure [CA ch.20 p.156]
11. Request and response models do not derive from framework interfaces such as HttpRequest and HttpResponse [CA ch.20 p.156]
12. Request and response models contain no references to Entity objects: they change for different reasons, and tying them together violates the CCP and the SRP [CA ch.20 p.156]
13. Application-specific rules such as field validation and application-independent rules such as interest calculation are separated, because they change at different rates [CA ch.16 p.128]
14. The use cases of the system are plainly visible in its structure, so a shopping cart application looks like a shopping cart application [CA ch.16 pp.125-126]
15. Frameworks are tools to be used, not architectures to be conformed to; an architecture based on frameworks cannot be based on use cases [CA ch.21 p.159]

## Procedure

1. Restate the rule as a rule or procedure that makes or saves the business money [CA ch.20 p.153]
2. Classify the rule with the placement table below, one action per row per `../../rules/ca-determinism.md`

| Condition | Action |
|---|---|
| The rule would make or save money even if executed manually | Critical Business Rule: it belongs in an Entity with its Critical Business Data [CA ch.20 pp.153-154] |
| The rule makes sense only as part of an automated system | Application-specific rule: it belongs in a use case [CA ch.20 p.155] |
| The rule describes how the screen looks or how the data is delivered | Not a business rule: how the data gets in and out is irrelevant to the use case [CA ch.20 p.155] |
| anything else | HALT (`OUT_OF_SCOPE`) |

3. Name it so that the top-level structure screams what the system is, an accounting system or an inventory management system [CA ch.21 p.158]
4. List the data the rule needs, and split it: Critical Business Data stays in the Entity, everything else travels in the request model [CA ch.20 pp.153-156]
5. Check the request and response models against the contamination table below per `../../rules/ca-determinism.md`

| Condition | Action |
|---|---|
| The model derives from a framework request or response type | Violates: these data structures are not dependent on anything [CA ch.20 p.156] |
| The model holds a reference to an Entity object | Violates: the purpose of the two objects is very different and they change for different reasons [CA ch.20 p.156] |
| The model is a simple structure of input and output data | Conforms: the use case accepts simple request data and returns simple response data [CA ch.20 p.156] |
| anything else | HALT (`OUT_OF_SCOPE`) |

6. State the direction: the use case names the Entity, and the Entity has no knowledge of the use case [CA ch.20 p.156]
7. Emit the output template below, one block per rule, with a citation on every claim per `../../rules/ca-citation.md`, writing the filled slots in Portuguese per `../../rules/ca-language.md`

## Halt conditions

| Trigger | Code |
|---|---|
| The request asks for a folder tree for the entities and use cases | `OUT_OF_SCOPE`, ch.21 prescribes no folder tree |
| The request uses vocabulary that is not in the book, such as aggregate or value object | `OUT_OF_SCOPE` |
| The request asks for the Entity as code in a language outside the book | `CODE_STYLE_DIVERGENCE` |
| It cannot be settled whether the rule would exist without the automated system | `AMBIGUOUS_IN_BOOK` |
| The framework in the codebase requires the Entity to derive from its base class | `CONFLICT_WITH_PROJECT` |
| anything else | HALT (`OUT_OF_SCOPE`) |

## Output template

```
## CA Business Rule — <name>

- Rule: <one line, in business words>
- Kind: Critical Business Rule | application-specific rule [CA ch.20 pp.153-155]
- Home: Entity <name> | use case <name>
- Critical Business Data: <fields that would exist without the system> [CA ch.20 p.153]
- Request model: <fields> — no framework types, no Entity references [CA ch.20 p.156]
- Response model: <fields> — no framework types, no Entity references [CA ch.20 p.156]
- Direction: <use case> names <Entity>; <Entity> knows nothing of it [CA ch.20 p.156]
```

## References

`../../references/part-5-architecture.md`, `../../rules/ca-source-of-truth.md`,
`../../rules/ca-citation.md`, `../../rules/ca-halt-protocol.md`,
`../../rules/ca-code-fidelity.md`, `../../rules/ca-determinism.md`,
`../../rules/ca-language.md`,
`../../rules/ca-answer-contract.md`.

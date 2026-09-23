---
name: ca-component-design
description: Decides which classes belong in which component, and whether the dependencies between components are allowed. Invoke when the request mentions components, jar or DLL or gem packaging, REP, CCP, CRP, the cohesion tension diagram, dependency cycles, the Acyclic Dependencies Principle, stability, instability, the I, A or D metrics, or the Main Sequence.
---

# CA Component Design

## Source

Book scope, and no other chapter:

- Components [CA ch.12 pp.88-92]
- Component Cohesion [CA ch.13 pp.93-97]
- Component Coupling [CA ch.14 pp.98-115]

## Rules

1. Components are the units of deployment, the smallest entities that can be deployed as part of a system [CA ch.12 p.88]
2. REP: the granule of reuse is the granule of release, so a component is tracked through a release process and given release numbers [CA ch.13 p.93]
3. CCP: gather into components those classes that change for the same reasons and at the same times, and separate those that change at different times and for different reasons [CA ch.13 p.94]
4. CRP: do not force users of a component to depend on things they do not need [CA ch.13 p.95]
5. The classes in a component should be inseparable: it should be impossible to depend on some and not the others [CA ch.13 p.96]
6. REP and CCP make components larger, CRP drives them smaller, and the architect resolves that tension [CA ch.13 p.96]
7. ADP: allow no cycles in the component dependency graph [CA ch.14 p.98]
8. A cycle fuses the components it touches: they must all use exactly the same release of one another [CA ch.14 p.101]
9. SDP: depend in the direction of stability [CA ch.14 p.104]
10. Stability is the amount of work required to make a change, not the frequency of change [CA ch.14 p.105]
11. I = Fan-out ÷ (Fan-in + Fan-out), range [0, 1], where 0 is maximally stable and 1 is maximally unstable [CA ch.14 p.107]
12. SAP: a component should be as abstract as it is stable [CA ch.14 p.110]
13. A = Na ÷ Nc, abstract classes and interfaces over the total number of classes [CA ch.14 p.111]
14. D = |A + I - 1|, where 0 puts the component directly on the Main Sequence [CA ch.14 p.113]
15. The component structure is not designed from the top down; it evolves as the system grows and changes [CA ch.14 pp.103-104]

## Procedure

1. List the classes and the component each one currently sits in, then count the dependencies that enter and leave each component [CA ch.14 p.106]
2. Apply the cohesion table to every component under review, one action per row per `../../rules/ca-determinism.md`

| Condition | Action |
|---|---|
| Two classes are so tightly bound that they always change together | They belong in the same component [CA ch.13 p.95] |
| Classes in the component change at different times and for different reasons | Separate them into different components [CA ch.13 p.94] |
| Users of the component depend on classes they never reuse | Split: classes not tightly bound to each other should not be in the same component [CA ch.13 p.96] |
| anything else | HALT (`OUT_OF_SCOPE`) |

3. Walk the dependency graph. Report every cycle found, by naming the components on it [CA ch.14 p.100]
4. Break each cycle with one of the two mechanisms below, and state which one per `../../rules/ca-determinism.md`

| Condition | Action |
|---|---|
| One component needs a class from the other | Apply the DIP: put an interface in the first component and inherit it into the second [CA ch.14 p.102] |
| Both components depend on the same classes | Create a new component that both depend on, and move those classes into it [CA ch.14 p.103] |
| anything else | HALT (`OUT_OF_SCOPE`) |

5. Compute the D metric for each component, so the design can be analyzed for its overall conformance to the Main Sequence [CA ch.14 p.113]
6. Apply the position table to each computed pair per `../../rules/ca-determinism.md`

| Condition | Action |
|---|---|
| The component is stable and concrete, near (0, 0) | Zone of Pain: rigid, it cannot be extended and is difficult to change [CA ch.14 p.112] |
| The component is abstract with no dependents, near (1, 1) | Zone of Uselessness: leftover abstract classes that no one implemented [CA ch.14 pp.112-113] |
| The I metric is smaller than the I metric of one of its dependencies | SDP violation: I metrics should decrease in the direction of dependency [CA ch.14 p.107] |
| D is near zero | On the Main Sequence, neither useless nor particularly painful [CA ch.14 p.113] |
| anything else | HALT (`OUT_OF_SCOPE`) |

7. Emit the output template below, one row per component, with a citation on every claim per `../../rules/ca-citation.md`, writing the filled slots in Portuguese per `../../rules/ca-language.md`

## Halt conditions

| Trigger | Code |
|---|---|
| The request asks for a component structure before any classes exist | `OUT_OF_SCOPE`, the structure evolves with the system |
| Fan-in and Fan-out cannot be counted because the dependencies are not given | `CITATION_UNVERIFIED` for the metric, report the cycles only |
| The request asks where components map onto directories | `OUT_OF_SCOPE`, routes to `ca-package-structure` |
| The request asks for the packaging as code in a language outside the book | `CODE_STYLE_DIVERGENCE` |
| The build system forbids splitting a component the CRP requires splitting | `CONFLICT_WITH_PROJECT` |
| anything else | HALT (`OUT_OF_SCOPE`) |

## Output template

```
## CA Component Design — <system>

| Component | Fan-in | Fan-out | I | A | D | Position |
|---|---|---|---|---|---|---|
| <name> | <n> | <n> | <0-1> | <0-1> | <0-1> | Main Sequence \| Zone of Pain \| Zone of Uselessness |

- Cycles: <components on the cycle, or "none"> [CA ch.14 p.98]
- Break: <DIP interface | new shared component> [CA ch.14 pp.102-103]
- SDP violations: <depender → dependee, or "none"> [CA ch.14 p.107]
- Cohesion moves: <class → component, or "none"> [CA ch.13 p.94]
```

## References

`../../references/part-4-component-principles.md`, `../../rules/ca-source-of-truth.md`,
`../../rules/ca-citation.md`, `../../rules/ca-halt-protocol.md`,
`../../rules/ca-code-fidelity.md`, `../../rules/ca-determinism.md`,
`../../rules/ca-language.md`,
`../../rules/ca-answer-contract.md`.

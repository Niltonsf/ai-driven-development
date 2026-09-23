---
name: ca-boundaries
description: Decides where an architectural boundary belongs, what a crossing of it costs, and whether to implement it fully or partially. Invoke when the request mentions drawing a boundary, separating the GUI or the database from the business rules, plugin architecture, monolith versus deployment components versus processes versus services, chattiness or latency at a crossing, partial boundaries, the Strategy pattern as a placeholder, or a Facade.
---

# CA Boundaries

## Source

Book scope, and no other chapter:

- Boundaries: Drawing Lines [CA ch.17 pp.133-143]
- Boundary Anatomy [CA ch.18 pp.144-148]
- Partial Boundaries [CA ch.24 pp.171-173]
- Layers and Boundaries [CA ch.25 pp.174-180]

## Rules

1. Software architecture is the art of drawing lines called boundaries, which restrict those on one side from knowing about those on the other [CA ch.17 p.133]
2. Boundaries are drawn where there is an axis of change, which is the Single Responsibility Principle telling us where to draw them [CA ch.17 p.142]
3. You draw lines between things that matter and things that do not: the GUI does not matter to the business rules [CA ch.17 p.137]
4. The less relevant component depends on the more relevant one [CA ch.17 p.140]
5. The core business rules are kept separate from components that are optional or can be implemented in many forms, which is a plugin architecture [CA ch.17 p.140]
6. At runtime a crossing is a function on one side calling a function on the other; the trick is managing the source code dependencies [CA ch.18 p.144]
7. The source code of a higher-level process must not contain the names, physical addresses or registry lookup keys of lower-level processes [CA ch.18 p.147]
8. The source code of a higher-level service must not contain physical knowledge, such as a URI, of any lower-level service [CA ch.18 p.148]
9. Full-fledged boundaries are expensive: reciprocal interfaces, input and output data structures, and the dependency management that keeps both sides independently deployable [CA ch.24 p.171]
10. Without reciprocal interfaces nothing prevents a backchannel other than the diligence and discipline of the developers and architects [CA ch.24 p.173]
11. Architectural boundaries exist everywhere, and fully implemented ones are expensive while ignored ones are very expensive to add later [CA ch.25 p.180]
12. The API is defined and owned by the user, rather than by the implementer [CA ch.25 p.176]
13. The decision is not made once: watch the system, and implement the boundary at the inflection point where the cost of implementing becomes less than the cost of ignoring [CA ch.25 p.180]

## Procedure

1. Name the axis of change: which two sides change at different times and for different reasons [CA ch.17 p.142]
2. State which side is the core business rules and which side is the plugin; the arrow points toward the core business [CA ch.17 p.142]
3. Pick the crossing form with the cost table below, reporting the cost with it per `../../rules/ca-determinism.md`

| Condition | Action |
|---|---|
| Both sides run in one processor and one address space | Monolith, source-level decoupling: crossings are function calls, very fast and inexpensive, so they can be chatty [CA ch.18 pp.144-146] |
| Both sides ship as separately deployable binaries | Deployment components, a DLL, a jar file, a Gem or a shared library; deployment does not involve compilation [CA ch.18 p.146] |
| The two sides run in separate address spaces on the same processor | Local processes: crossings involve system calls, marshaling and context switches, which are moderately expensive [CA ch.18 p.147] |
| The two sides assume all communication takes place over the network | Services: crossings are very slow, from tens of milliseconds to seconds, so avoid chatting [CA ch.18 p.148] |
| The request asks for threads as a boundary | Threads are not architectural boundaries or units of deployment [CA ch.18 p.147] |
| anything else | HALT (`OUT_OF_SCOPE`) |

4. Decide how much of the boundary to build with the completeness table below per `../../rules/ca-determinism.md`

| Condition | Action |
|---|---|
| The boundary is needed now | Full boundary: reciprocal interfaces plus input and output data structures [CA ch.24 p.171] |
| The boundary might be needed later and both sides can ship together | Skip the last step: build it fully, then deploy the two as a single component [CA ch.24 pp.171-172] |
| One direction of isolation is enough for now | One-dimensional boundary: the Strategy pattern, an interface used by clients and implemented by a service class [CA ch.24 p.172] |
| Even the dependency inversion is too expensive | Facade: the boundary is the Facade class, and the client keeps a transitive dependency on the service classes [CA ch.24 p.173] |
| anything else | HALT (`OUT_OF_SCOPE`) |

5. Record what degrades the choice: a partial boundary weakens when dependencies start to cross the line in the wrong direction [CA ch.24 p.172]
6. Emit the output template below, one block per boundary, with a citation on every claim per `../../rules/ca-citation.md`, writing the filled slots in Portuguese per `../../rules/ca-language.md`

## Halt conditions

| Trigger | Code |
|---|---|
| The request asks for a boundary with no axis of change behind it | `OUT_OF_SCOPE` |
| The request asks how many boundaries a system should have | `AMBIGUOUS_IN_BOOK`, the architect weighs the costs and reviews the decision frequently |
| The request asks which side holds the entities and use cases | `OUT_OF_SCOPE`, routes to `ca-business-rules` |
| The request asks for the crossing as code in a language outside the book | `CODE_STYLE_DIVERGENCE` |
| The codebase already has the arrow pointing away from the core business | `CONFLICT_WITH_PROJECT` |
| anything else | HALT (`OUT_OF_SCOPE`) |

## Output template

```
## CA Boundary — <name>

- Axis of change: <what changes at different times and for different reasons> [CA ch.17 p.142]
- Core side: <component> — Plugin side: <component> [CA ch.17 p.140]
- Arrow: <plugin> depends on <core> [CA ch.17 p.142]
- Crossing form: monolith | deployment component | local process | service
- Cost of the crossing: <from the cost table> [CA ch.18 pp.144-148]
- Completeness: full | skip-the-last-step | Strategy | Facade [CA ch.24 pp.171-173]
- Degradation to watch: <what would weaken it> [CA ch.24 p.172]
```

## References

`../../references/part-5-architecture.md`, `../../rules/ca-source-of-truth.md`,
`../../rules/ca-citation.md`, `../../rules/ca-halt-protocol.md`,
`../../rules/ca-code-fidelity.md`, `../../rules/ca-determinism.md`,
`../../rules/ca-language.md`,
`../../rules/ca-answer-contract.md`.

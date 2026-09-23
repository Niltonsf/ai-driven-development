# CA reference: Part IV — Component Principles

PDF pages 88-115, chapters 12-14. What a component is, which classes go into
one, and how components may depend on each other.

Skill scoped to this card: `ca-component-design` (ch.12-14).

## Ch.12 — Components [CA ch.12 pp.88-92]

- Components are the units of deployment, the smallest entities that can be deployed as part of a system [CA ch.12 p.88]
- In Java they are jar files, in Ruby gem files, in .Net DLLs; in all languages they are the granule of deployment [CA ch.12 p.88]
- Well-designed components always retain the ability to be independently deployable and therefore independently developable [CA ch.12 p.88]
- Relocatable binaries and the linking loader made it possible to load only the functions a program needed [CA ch.12 p.91]
- Dynamically linked files that can be plugged together at runtime are the software components of our architectures [CA ch.12 p.92]

## Ch.13 — Component Cohesion [CA ch.13 pp.93-97]

- Three principles of component cohesion: REP, CCP and CRP [CA ch.13 p.93]
- REP, the Reuse/Release Equivalence Principle: the granule of reuse is the granule of release [CA ch.13 p.93]
- Components cannot be reused unless they are tracked through a release process and given release numbers [CA ch.13 pp.93-94]
- Classes and modules grouped into a component must belong to a cohesive group and be releasable together [CA ch.13 p.94]
- CCP, the Common Closure Principle: gather into components those classes that change for the same reasons and at the same times, and separate those that change at different times and for different reasons [CA ch.13 p.94]
- The CCP is the SRP restated for components: a component should not have multiple reasons to change [CA ch.13 p.94]
- For most applications maintainability is more important than reusability, so changes are better confined to one component [CA ch.13 p.94]
- Closure must be strategic, because 100% closure is not attainable [CA ch.13 p.95]
- CRP, the Common Reuse Principle: do not force users of a component to depend on things they do not need [CA ch.13 p.95]
- Classes and modules that tend to be reused together belong in the same component, such as a container class and its iterators [CA ch.13 p.95]
- The classes in a component should be inseparable: it should be impossible to depend on some and not the others [CA ch.13 p.96]
- The CRP is the generic version of the ISP; both reduce to not depending on things you do not need [CA ch.13 p.96]
- REP and CCP are inclusive and make components larger; CRP is exclusive and drives components smaller, and the tension between them is what the architect resolves [CA ch.13 p.96]
- Early in a project the CCP matters more than the REP, because develop-ability is more important than reuse; the position on the triangle moves as the project matures [CA ch.13 p.97]

## Ch.14 — Component Coupling [CA ch.14 pp.98-115]

- ADP, the Acyclic Dependencies Principle: allow no cycles in the component dependency graph [CA ch.14 p.98]
- The morning after syndrome: many developers modifying the same source files, with no stable build for weeks [CA ch.14 p.98]
- Partitioning the development environment into releasable components lets each team decide when to adopt a new release, so no team is at the mercy of the others [CA ch.14 p.99]
- With no cycles, the dependency structure is a directed acyclic graph, and the impact of a release is found by following the dependency arrows backward [CA ch.14 p.100]
- Releasing the whole system proceeds from the bottom up, and Main goes last [CA ch.14 pp.100-101]
- A cycle fuses the components it touches into one large component: they must all use exactly the same release of one another [CA ch.14 p.101]
- Cycles make unit testing and releasing difficult and error prone, and can make the build order impossible to work out [CA ch.14 pp.101-102]
- Breaking a cycle, mechanism 1: apply the DIP, putting an interface in one component and inheriting it into the other [CA ch.14 p.102]
- Breaking a cycle, mechanism 2: create a new component that both of them depend on, and move the shared classes into it [CA ch.14 p.103]
- The component structure cannot be designed from the top down; it evolves as the system grows and changes [CA ch.14 pp.103-104]
- Component dependency diagrams are a map of buildability and maintainability, not a description of the function of the application [CA ch.14 p.104]
- The dependency graph is molded to isolate volatility: stable high-value components are protected from volatile ones [CA ch.14 p.104]
- SDP, the Stable Dependencies Principle: depend in the direction of stability [CA ch.14 p.104]
- Stability is the amount of work required to make a change, not the frequency of change [CA ch.14 p.105]
- A component with many incoming dependencies is stable, because reconciling a change with all its dependents is a great deal of work [CA ch.14 p.105]
- Fan-in counts classes outside the component that depend on classes inside it; Fan-out counts classes inside that depend on classes outside [CA ch.14 p.106]
- I, Instability: I = Fan-out ÷ (Fan-in + Fan-out), range [0, 1], where 0 is maximally stable and 1 is maximally unstable [CA ch.14 p.107]
- The SDP says the I metric of a component should be larger than the I metrics of its dependencies: I metrics decrease in the direction of dependency [CA ch.14 p.107]
- If every component were maximally stable the system would be unchangeable, so some components are designed to be unstable [CA ch.14 p.108]
- Putting the unstable components at the top of the diagram is a useful convention, because any arrow that points up is violating the SDP [CA ch.14 p.108]
- An SDP violation is fixed with the DIP: a new interface component that both the stable and the flexible component depend on [CA ch.14 p.109]
- Abstract components contain nothing but interfaces, no executable code, and are ideal targets for less stable components to depend on [CA ch.14 p.109]
- SAP, the Stable Abstractions Principle: a component should be as abstract as it is stable [CA ch.14 p.110]
- High-level policies belong in stable components, and abstract classes are what keeps a stable component extensible [CA ch.14 p.110]
- SDP plus SAP amount to the DIP for components: dependencies run in the direction of abstraction [CA ch.14 p.110]
- A, Abstractness: A = Na ÷ Nc, abstract classes and interfaces over total classes, range 0 to 1 [CA ch.14 p.111]
- The Main Sequence is the line connecting (1, 0) and (0, 1) on the A/I graph [CA ch.14 p.113]
- The Zone of Pain, near (0, 0), holds stable concrete components such as a volatile database schema [CA ch.14 p.112]
- The Zone of Uselessness, near (1, 1), holds maximally abstract components with no dependents, often leftover abstract classes nobody implemented [CA ch.14 pp.112-113]
- D, Distance: D = |A + I - 1|, range [0, 1], where 0 puts the component directly on the Main Sequence [CA ch.14 p.113]
- The D metric of a component plotted over time exposes strange dependencies creeping in over the last few releases [CA ch.14 p.114]
- A metric is a measurement against an arbitrary standard, and these metrics are imperfect [CA ch.14 p.114]

## Cited by

`ca-component-design`.

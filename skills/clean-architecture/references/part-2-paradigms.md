# CA reference: Part II — Starting with the Bricks: Programming Paradigms

PDF pages 38-61, chapters 3-6. Framing, not procedure. No `ca-*` skill is
scoped to these chapters, but three of their conclusions are load-bearing for
the ones that are: polymorphism inverts dependencies, immutability segregates
state, falsifiable units make testing possible.

## Ch.3 — Paradigm Overview [CA ch.3 pp.38-40]

- Structured programming imposes discipline on direct transfer of control [CA ch.3 p.38]
- Object-oriented programming imposes discipline on indirect transfer of control [CA ch.3 p.39]
- Functional programming imposes discipline upon assignment [CA ch.3 p.39]
- Each paradigm removes capabilities from the programmer; none adds new ones, and together they remove goto statements, function pointers and assignment [CA ch.3 p.39]
- Polymorphism is the mechanism used to cross architectural boundaries [CA ch.3 p.39]
- The three paradigms align with the three big concerns of architecture: function, separation of components, and data management [CA ch.3 p.40]

## Ch.4 — Structured Programming [CA ch.4 pp.41-45]

- Böhm and Jacopini proved that all programs can be constructed from just three structures: sequence, selection, and iteration [CA ch.4 p.42]
- Certain uses of goto prevent modules from being decomposed recursively into smaller units, which prevents the divide-and-conquer approach [CA ch.4 p.42]
- The formal proofs never came; the Euclidean hierarchy of theorems was never built [CA ch.4 p.44]
- Testing shows the presence, not the absence, of bugs: a program can be proven incorrect by a test, but it cannot be proven correct [CA ch.4 p.45]
- Structured programming forces a program to be decomposed recursively into small provable functions, which tests can then try to prove incorrect [CA ch.4 p.45]
- Architects strive to define modules, components and services that are easily falsifiable, which is to say testable [CA ch.4 p.45]

## Ch.5 — Object-Oriented Programming [CA ch.5 pp.46-55]

- Encapsulation, inheritance and polymorphism are the three magic words used to explain OO, and none of the three is unique to it [CA ch.5 p.46]
- Perfect encapsulation existed in C, where users of a header have no knowledge of the implementation of the data structure or the functions [CA ch.5 p.47]
- Polymorphism is an application of pointers to functions, used since Von Neumann architectures were implemented in the late 1940s [CA ch.5 p.52]
- IO devices are plugins to the copy program, because the source code of the copy program does not depend on the source code of the IO drivers [CA ch.5 p.52]
- Before polymorphism, source code dependencies inexorably followed the flow of control, and every caller had to mention the name of the module containing the callee [CA ch.5 p.53]
- The source code dependency between a module and the interface it implements points in the opposite direction compared to the flow of control; this is dependency inversion [CA ch.5 p.54]
- Any source code dependency, no matter where it is, can be inverted by inserting an interface between the two modules [CA ch.5 p.54]
- The database and the user interface can be made to depend on the business rules, so both become plugins to those rules [CA ch.5 p.55]
- Modules that can be deployed independently can be developed independently by different teams: independent deployability and independent developability [CA ch.5 p.55]
- OO is the ability, through polymorphism, to gain absolute control over every source code dependency in the system [CA ch.5 p.55]

## Ch.6 — Functional Programming [CA ch.6 pp.56-61]

- Variables in functional languages do not vary: the Clojure program initializes variables and never modifies them [CA ch.6 p.57]
- All race conditions, deadlock conditions and concurrent update problems are due to mutable variables [CA ch.6 p.58]
- Segregation of mutability: the application is split into immutable components and components that allow state to be mutated, with transactional memory protecting the latter [CA ch.6 pp.58-59]
- Architects push as much processing as possible into the immutable components and drive as much code as possible out of those that must mutate [CA ch.6 p.59]
- Event sourcing stores the transactions and not the state, applying all transactions from the beginning of time whenever state is required [CA ch.6 p.60]
- With enough storage and processor power, applications become entirely immutable and therefore entirely functional; nothing is deleted or updated, so applications are CR rather than CRUD [CA ch.6 p.60]
- Software is composed of sequence, selection, iteration, and indirection; nothing more, nothing less [CA ch.6 p.61]

## Cited by

No skill. Event sourcing appears here as an illustration of immutability, and
citing it as an architecture is out of scope: see `../rules/ca-source-of-truth.md`.

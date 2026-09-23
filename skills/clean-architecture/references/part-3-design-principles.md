# CA reference: Part III — Design Principles

PDF pages 64-86, chapters 7-11. The SOLID principles, at the level the book
treats them: not class-level tips, but the rules that decide how code is
arranged into modules and components.

Skill scoped to this card: `ca-solid` (ch.7-11), and `ca-dependency-rule`
for ch.11 alone.

## Ch.7 — SRP: The Single Responsibility Principle [CA ch.7 pp.64-69]

- The SRP is the least well understood of the SOLID principles, because its name makes programmers assume that every module should do just one thing [CA ch.7 p.64]
- Historically: a module should have one, and only one, reason to change [CA ch.7 p.64]
- Final version: a module should be responsible to one, and only one, actor [CA ch.7 p.65]
- A module is a source file, or a cohesive set of functions and data structures where source files are absent [CA ch.7 p.65]
- Symptom 1, accidental duplication: an Employee class with calculatePay, reportHours and save answers to the CFO, the COO and the CTO at once [CA ch.7 p.65]
- Coupling actors causes the actions of one team to affect what another team depends on; the SRP says to separate the code that different actors depend on [CA ch.7 p.66]
- Symptom 2, merges: two developers from two teams change the same class for different reasons, and the merge puts both stakeholders at risk [CA ch.7 p.67]
- Solutions move the functions into different classes, sharing a data structure with no methods, and the classes are not allowed to know about each other [CA ch.7 p.67]
- The Facade pattern holds very little code: it instantiates and delegates to the classes with the functions [CA ch.7 p.68]
- At the level of components the SRP becomes the Common Closure Principle; at the architectural level it becomes the Axis of Change that creates architectural boundaries [CA ch.7 p.69]

## Ch.8 — OCP: The Open-Closed Principle [CA ch.8 pp.70-74]

- A software artifact should be open for extension but closed for modification [CA ch.8 p.70]
- A good architecture reduces the amount of changed code to the barest minimum, ideally zero, by applying the SRP and then organizing the dependencies [CA ch.8 p.71]
- An arrow from class A to class B means the source code of A mentions the name of B, and B mentions nothing about A [CA ch.8 p.72]
- Every double line in the diagram is crossed in one direction only: all component relationships are unidirectional [CA ch.8 p.72]
- If component A should be protected from changes in component B, then component B should depend on component A [CA ch.8 p.73]
- The Interactor holds the privileged position because it contains the business rules, the highest-level policies of the application [CA ch.8 p.73]
- The hierarchy of protection is based on level: Interactors are the most protected, Views the least [CA ch.8 p.73]
- Directional control: an interface exists to invert a dependency that would otherwise point from the Interactor to the Database [CA ch.8 p.74]
- Information hiding: an interface protects the Controller from transitive dependencies on the entities inside the Interactor [CA ch.8 p.74]
- Software entities should not depend on things they do not directly use [CA ch.8 p.74]

## Ch.9 — LSP: The Liskov Substitution Principle [CA ch.9 pp.75-79]

- Liskov's substitution property defines a subtype: programs defined in terms of T are unchanged when an object of S is substituted [CA ch.9 p.75]
- License with PersonalLicense and BusinessLicense conforms, because the Billing application does not depend on which subtype it uses [CA ch.9 p.76]
- The square/rectangle problem: Square is not a proper subtype of Rectangle, because height and width are independently mutable in one and must change together in the other [CA ch.9 p.76]
- The only defense is a mechanism in the User, such as an if statement, that detects the actual type; behavior that depends on the type is not substitutable [CA ch.9 p.77]
- The LSP applies to interfaces and implementations of every form: a Java-style interface, Ruby classes sharing method signatures, or services responding to the same REST interface [CA ch.9 p.77]
- A non-substitutable REST field forced a configuration database keyed by the dispatch URI, rather than an if statement naming a company [CA ch.9 p.78]
- A simple violation of substitutability can pollute a system's architecture with a significant amount of extra mechanisms [CA ch.9 p.79]

## Ch.10 — ISP: The Interface Segregation Principle [CA ch.10 pp.80-82]

- A user that depends on a class with operations it does not call is recompiled and redeployed when those other operations change [CA ch.10 p.81]
- Segregating the operations into interfaces removes the dependency the user does not care about [CA ch.10 p.81]
- In dynamically typed languages the declarations are inferred at runtime, so there are no source code dependencies to force recompilation [CA ch.10 p.81]
- The deeper concern is architectural: it is harmful to depend on modules that contain more than you need [CA ch.10 p.81]
- A system that depends on a framework bound to a database inherits the redeployments, and the failures, of features it never uses [CA ch.10 p.82]

## Ch.11 — DIP: The Dependency Inversion Principle [CA ch.11 pp.83-86]

- The most flexible systems are those in which source code dependencies refer only to abstractions, not to concretions [CA ch.11 p.83]
- Stable background facilities such as the Java String class are tolerated, because changes to them are rare and tightly controlled [CA ch.11 p.83]
- The volatile concrete elements are the modules we are actively developing and undergoing frequent change, and those are what to avoid depending on [CA ch.11 p.84]
- Interfaces are less volatile than implementations, so stable architectures favor stable abstract interfaces [CA ch.11 p.84]
- Do not refer to volatile concrete classes; refer to abstract interfaces, which enforces the use of Abstract Factories [CA ch.11 p.84]
- Do not derive from volatile concrete classes: inheritance is the strongest and most rigid of the source code relationships [CA ch.11 p.84]
- Do not override concrete functions; make the function abstract and create multiple implementations [CA ch.11 p.84]
- Never mention the name of anything concrete and volatile [CA ch.11 p.84]
- An Abstract Factory lets the Application create instances without a source code dependency on the concrete implementation [CA ch.11 p.85]
- The curved line is an architectural boundary separating the abstract from the concrete, and all source code dependencies cross it toward the abstract side [CA ch.11 p.85]
- The flow of control crosses that line in the opposite direction of the source code dependencies, which is why the principle is called Dependency Inversion [CA ch.11 p.85]
- DIP violations cannot be entirely removed; they are gathered into a small number of concrete components, often called main [CA ch.11 p.85]
- The way dependencies cross that curved line in one direction, toward more abstract entities, becomes the Dependency Rule [CA ch.11 p.86]

## Cited by

`ca-solid` (all five chapters), `ca-dependency-rule` (ch.11).

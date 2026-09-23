# CA reference: Part VI — Details

PDF pages 209-240, chapters 30-34. What is a detail, and where the book
deliberately declines to choose.

Skills scoped to this card: `ca-details` (ch.30-32), `ca-package-structure`
(ch.34). Chapter 33 is the worked case study and is reference only.

## Ch.30 — The Database Is a Detail [CA ch.30 pp.209-213]

- From an architectural point of view the database is a detail that does not rise to the level of an architectural element [CA ch.30 p.209]
- The data model is not the database: the structure given to the data is significant to the architecture, the utility that provides access to it is not [CA ch.30 p.209]
- The relational model is elegant, disciplined and robust, and it is still just a technology, which means it is a detail [CA ch.30 p.209]
- There is nothing architecturally significant about arranging data into rows within tables [CA ch.30 p.210]
- Knowledge of the tabular structure should be restricted to the lowest-level utility functions in the outer circles [CA ch.30 p.210]
- Passing database rows and tables around the system as objects is an architectural error that couples the use cases and business rules to the relational structure [CA ch.30 p.210]
- Database systems are prevalent because of disks, and the one fatal trait of disk technology is that disks are slow [CA ch.30 p.210]
- The database is a mechanism for moving data between the surface of the disk and RAM, and the data is reorganized in RAM into lists, sets, stacks, queues or trees [CA ch.30 p.211]
- Performance of data storage is a low-level concern that can be entirely encapsulated and separated from the business rules [CA ch.30 pp.211-212]
- The anecdote: the RDBMS should have been bolted on the side with a narrow and safe data access channel, keeping the random access files in the core [CA ch.30 p.213]
- The data is significant; the database is a detail [CA ch.30 p.213]

## Ch.31 — The Web Is a Detail [CA ch.31 pp.214-216]

- The web is one of many oscillations between putting computer power in central servers and putting it out at the terminals [CA ch.31 p.214]
- Those oscillations are short-term issues to be pushed away from the central core of the business rules [CA ch.31 p.215]
- Company Q turned its desktop personal finance GUI into a browser look and feel, then gradually removed it again [CA ch.31 p.215]
- The defense against a marketing decision like that is to decouple the business rules from the UI [CA ch.31 p.215]
- The GUI is a detail, the web is a GUI, therefore the web is a detail, and details go behind boundaries [CA ch.31 p.216]
- The web is an IO device, and the value of device independence has not changed since the 1960s [CA ch.31 p.216]
- The dance between the UI and the application is chatty and specific, and abstracting that dance the way UNIX abstracts devices is unlikely [CA ch.31 p.216]
- What can be abstracted is the use case: complete input data in, resultant output data out, in data structures [CA ch.31 p.216]

## Ch.32 — Frameworks Are Details [CA ch.32 pp.217-219]

- Frameworks are not architectures, though some try to be [CA ch.32 p.217]
- Framework authors know their own problems and those of their coworkers and friends, and write their frameworks to solve those, not yours [CA ch.32 p.217]
- The relationship is asymmetric: you make a huge commitment to the framework, and the author makes none to you [CA ch.32 p.218]
- Frameworks tend to violate the Dependency Rule by asking you to inherit their code into your Entities [CA ch.32 p.218]
- As the product matures it may outgrow the facilities of the framework, and the framework may evolve in a direction that does not help [CA ch.32 p.218]
- The solution: use the framework, do not couple to it; treat it as a detail in one of the outer circles [CA ch.32 p.219]
- If the framework wants your business objects derived from its base classes, derive proxies instead and keep them in plugin components [CA ch.32 p.219]
- Spring is fine for injecting dependencies into Main, and business objects should not know about it [CA ch.32 p.219]
- Some frameworks must be married, such as the C++ STL or the Java standard library, and that should still be a decision [CA ch.32 p.219]

## Ch.33 — Case Study: Video Sales [CA ch.33 pp.220-224]

- The first step is to identify the actors and the use cases [CA ch.33 p.221]
- By the Single Responsibility Principle the four actors are the four primary sources of change, so the system is partitioned so that a change for one actor does not affect the others [CA ch.33 pp.221-222]
- An abstract use case sets a general policy that another use case fleshes out [CA ch.33 p.222]
- The preliminary component architecture shows views, presenters, interactors and controllers, broken up by their corresponding actors [CA ch.33 p.222]
- The components are a compile and build partitioning, and the right to combine them into fewer deliverables is reserved [CA ch.33 p.223]
- The flow of control proceeds from the controllers through the interactors to the presenters and views, while most dependency arrows point the other way, following the Dependency Rule [CA ch.33 p.224]
- Using relationships point with the flow of control and inheritance relationships point against it, which is the Open-Closed Principle at work [CA ch.33 p.224]
- The diagram has two dimensions of separation: actors by the SRP, and levels of policy by the Dependency Rule [CA ch.33 p.224]

## Ch.34 — The Missing Chapter, by Simon Brown [CA ch.34 pp.225-240]

This is the chapter that presents options and does not choose. A skill asked
to pick one of the four halts with `AMBIGUOUS_IN_BOOK`.

- Package by layer: a horizontal layered architecture, code sliced by what it does from a technical perspective, with all dependencies pointing downward [CA ch.34 pp.225-226]
- Adopting a layered architecture is a good way to get started, and once the software grows, three large buckets of code are not sufficient [CA ch.34 p.227]
- A layered architecture screams nothing about the business domain: two of them from different domains look eerily similar [CA ch.34 p.227]
- Package by feature: a vertical slicing based on related features or domain concepts, all types in a single package named for the concept [CA ch.34 p.227]
- Package by feature makes the top-level organization of the code scream about the business domain, and puts everything a use case change touches in one place [CA ch.34 p.227]
- Both horizontal and vertical layering are suboptimal in Simon Brown's opinion [CA ch.34 p.227]
- Ports and adapters: an inside of domain concepts and an outside of interactions with the outside world, where the outside depends on the inside and never the other way [CA ch.34 pp.228-229]
- Package by component: bundling all the responsibilities related to a single coarse-grained component into a single package, keeping the user interface separate [CA ch.34 p.233]
- Brown's definition of a component: a grouping of related functionality behind a clean interface, residing inside an execution environment like an application [CA ch.34 p.234]
- The relaxed layered architecture: a controller bypassing the service layer and calling the repository directly still yields an acyclic dependency graph [CA ch.34 p.231]
- Enforcing a principle through discipline and code reviews is what teams say until budgets and deadlines loom; static analysis tools are fallible and the feedback loop is long [CA ch.34 pp.232-233]
- Organization versus encapsulation: if every type is public, packages are only a grouping mechanism and provide very little real value [CA ch.34 p.235]
- With every type public, all four approaches are syntactically identical, whatever the conceptual differences [CA ch.34 p.235]
- Applying access modifiers changes the picture: in package by layer the interfaces are public and the implementations can be package protected [CA ch.34 p.236]
- In package by feature the controller is the sole entry point, so everything else can be package protected, and nothing outside can reach orders except through it [CA ch.34 p.236]
- In package by component only the component interface needs an inbound dependency from the controller, so the compiler enforces the principle [CA ch.34 p.237]
- The fewer public types, the smaller the number of potential dependencies [CA ch.34 p.237]
- Other decoupling modes: module systems that distinguish public types from published types, and splitting code across separate source code trees [CA ch.34 p.238]
- The Périphérique anti-pattern: one infrastructure source tree lets a web controller call a database repository directly, without navigating through the domain [CA ch.34 p.239]
- The closing advice is to map the design onto code structures, choose decoupling modes, leave options open where applicable, and let the compiler enforce the chosen style [CA ch.34 p.239]

## Cited by

`ca-details` (ch.26 and 30-32), `ca-package-structure` (ch.34).

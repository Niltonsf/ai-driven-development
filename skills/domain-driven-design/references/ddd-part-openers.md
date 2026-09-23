# DDD part openers

The four part dividers, PDF pages 27-28, 87-88, 183-184, 241-242. Pages 88, 184
and 242 are blank; the text is on the first page of each pair.

Openers are framing, not rules. They are citable for three things only: the
`what/why` versus `how` split, the context map's own description as a notation,
and the placement of each chapter in the arc. Everything else in them is
restated by the chapter it introduces.

## Part I — Strategic Design, pp.27-28

- The domain-driven design methodology can be divided into two main parts: strategic design and tactical design [DDD part.I p.27] `RULE`
- The strategic aspect of DDD deals with answering the questions of what and why: what software we are building and why we are building it [DDD part.I p.27] `RULE`
- The tactical part is all about the how: how each component is implemented [DDD part.I p.27] `RULE`
- Chapter 2 introduces the ubiquitous language, the essential practice for gaining an understanding of the business domain [DDD part.I p.27] `RULE`
- Chapter 3 discusses the bounded context pattern, used to transform discovered knowledge into a model of the business domain [DDD part.I p.28] `RULE`
- Chapter 4 covers technical and social constraints that affect how system components can be integrated [DDD part.I p.28] `RULE`
- The context map is a graphical notation that plots communication between the system's bounded contexts and provides a bird's-eye view of the project's integration and collaboration landscapes [DDD part.I p.28] `RULE`

That last line is the evidence behind the `UNDEFINED_IN_BOOK` halt for context
map notation: the book names it a notation and never specifies one. See
`ddd-not-in-this-book.md`.

## Part II — Tactical Design, pp.87-88

- In this part of the book, we will turn from strategy to tactics: the how of software design [DDD part.II p.87] `RULE`
- Chapters 5 through 7 cover business logic implementation patterns that allow the code to speak the ubiquitous language of its bounded context [DDD part.II p.87] `RULE`
- Chapter 8 explores the different ways to organize a bounded context's architecture: the layered architecture, ports & adapters, and CQRS patterns [DDD part.II p.87] `RULE`
- Chapter 9 discusses technical concerns and implementation strategies for orchestrating the interactions among components of a system [DDD part.II p.87] `RULE`

## Part III — Applying Domain-Driven Design in Practice, pp.183-184

- Chapter 10 merges what was discussed about strategic and tactical design into simple rules of thumb that streamline the process of making design decisions [DDD part.III p.183] `HEURISTIC`
- Chapter 11 applies domain-driven design tools to maintain and evolve software design decisions over time [DDD part.III p.183] `RULE`
- Chapter 12 introduces EventStorming: a hands-on activity that streamlines the process of discovering domain knowledge and building a ubiquitous language [DDD part.III p.183] `RULE`
- Chapter 13 concludes Part III with tips for introducing and incorporating domain-driven design patterns and practices in brownfield projects [DDD part.III p.183] `RULE`

The phrase "simple rules of thumb" on p.183 is the part opener's own grade for
chapter 10, and it agrees with p.192. That is why every chapter 10 line in this
pack is `HEURISTIC`.

## Part IV — Relationships to Other Methodologies and Patterns, pp.241-242

- Domain-driven design covers a lot of the software development lifecycle, but it can't cover all of software engineering [DDD part.IV p.241] `RULE`
- Chapter 14 explores the interplay between microservices and domain-driven design and how the two approaches complement each other [DDD part.IV p.241] `RULE`
- Chapter 15 covers the principles of event-driven architecture and how to leverage DDD to design effective asynchronous communication [DDD part.IV p.241] `RULE`
- Chapter 16 concludes the book with effective modeling in the context of data analytics [DDD part.IV p.241] `RULE`

## See also

`ddd-part-1-strategic-design.md`, `ddd-part-2-tactical-design.md`,
`ddd-part-3-in-practice.md`, `ddd-part-4-relationships.md`.

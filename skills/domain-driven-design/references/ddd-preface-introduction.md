# DDD preface and introduction

PDF pages 17-26. Framing, the code conventions, and the WolfDesk example domain
that every chapter's exercises use.

Two things here are normative for the whole pack: the code conventions of p.21,
and WolfDesk as the worked example `/ddd-exercise` grades against.

## Why the book exists, pp.17-19

- Business logic is indeed important: it is the heart of software [DDD pref. p.17] `RULE`
- The goal is to democratize domain-driven design, make it easier to understand and more accessible to employ [DDD pref. p.18] `RULE`
- Its strategic design decision tools help decompose a large system into components and design how the components are integrated with one another to form a system [DDD pref. p.18] `RULE`
- The book discusses not only how to design software, but also how to co-evolve the design with changes in its business context, to prevent its degradation into a big ball of mud [DDD pref. p.19] `RULE`
- The book is divided into four parts: strategic design, tactical design, DDD in practice, and DDD's relationships to other methodologies and patterns [DDD pref. p.19] `RULE`

## The code conventions, p.21 — pack-shared

This page is citable by every skill in the pack, and it is the reason there is
no language halt here.

```ddd-quote [DDD pref. p.21]
All the code samples presented in the book are implemented in the C# language.
```

- The concepts and techniques discussed in the book are not limited to the C# language or to the object-oriented programming approach [DDD pref. p.21] `RULE`
- Everything is relevant for other languages and other programming paradigms [DDD pref. p.21] `RULE`
- The code samples in the chapters are excerpts demonstrating the discussed concepts [DDD pref. p.21] `RULE`
- Italic indicates new terms, URLs, email addresses, filenames, and file extensions [DDD pref. p.21] `RULE`
- Constant width is used for program listings and for program elements such as variable or function names [DDD pref. p.21] `RULE`

See `../rules/ddd-structural-fidelity.md` for what this page does and does not
release.

## WolfDesk, the example domain, pp.20-21

Every chapter's exercises refer back to this description, so the pack keeps it
in one place.

- WolfDesk provides a help desk tickets management system as a service [DDD pref. p.20] `RULE`
- Instead of charging a fee per user, it lets tenants set up any number of users, and the tenants are charged for the number of support tickets opened per charging period [DDD pref. p.20] `RULE`
- There is no minimum fee, and there are automatic volume discounts for certain thresholds of monthly tickets: 10% for more than 500, 20% for more than 750, and 30% for more than 1,000 tickets per month [DDD pref. p.20] `RULE`
- WolfDesk's ticket lifecycle algorithm ensures that inactive tickets are closed automatically, encouraging customers to open new tickets when further support is needed [DDD pref. p.20] `RULE`
- WolfDesk implements a fraud detection system that analyzes messages and detects cases of unrelated topics being discussed in the same ticket [DDD pref. p.20] `RULE`
- The support autopilot feature analyzes new tickets and tries to automatically find a matching solution from the tenant's ticket history [DDD pref. p.20] `RULE`
- WolfDesk incorporates all the security standards and measures to authenticate and authorize its tenants' users, and also allows tenants to configure a single sign-on with their existing user management systems [DDD pref. p.21] `RULE`
- The administration interface allows tenants to configure the possible values for the tickets' categories, as well as a list of the tenant's products that it supports [DDD pref. p.21] `RULE`
- WolfDesk allows the entry of each agent's shift schedule, to be able to route new tickets to the tenant's support agents only during their working hours [DDD pref. p.21] `RULE`
- WolfDesk leverages serverless computing, which allows it to elastically scale its compute resources based on the operations on active tickets [DDD pref. p.21] `RULE`

Appendix B pp.315-316 prints the graded subdomain classification for WolfDesk;
see `ddd-exercise-answers.md`.

## The Introduction, pp.25-26

- Failure to grasp the business domain results in suboptimal implementation of the business software [DDD intro p.25] `RULE`
- According to studies, approximately 70% of software projects are not delivered on time, on budget, or according to the client's requirements [DDD intro p.25] `RULE`
- The term software crisis was introduced all the way back in 1968 [DDD intro p.25] `RULE`
- Most of the findings on project failure share a common theme: communication [DDD intro p.26] `RULE`
- Communication issues thwarting projects manifest as unclear requirements, uncertain project goals, or ineffective coordination of effort between teams [DDD intro p.26] `RULE`
- Effective communication is the central theme of the domain-driven design tools and practices [DDD intro p.26] `RULE`
- The strategic tools of DDD are used to analyze business domains and strategy, and to foster a shared understanding of the business between the different stakeholders [DDD intro p.26] `RULE`
- DDD's tactical patterns allow us to write code in a way that reflects the business domain, addresses its goals, and speaks the language of the business [DDD intro p.26] `RULE`
- The tighter the connection between the software design and its business strategy is, the easier it will be to maintain and evolve the system [DDD intro p.26] `RULE`

## See also

`ddd-part-1-strategic-design.md`, `ddd-exercise-answers.md`,
`../rules/ddd-structural-fidelity.md`, `../rules/ddd-source-of-truth.md`.

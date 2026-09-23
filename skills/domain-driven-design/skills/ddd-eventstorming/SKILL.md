---
name: ddd-eventstorming
description: Plans, facilitates or checks an EventStorming workshop: the supplies, the participants, the ten ordered steps, the sticky-note colours, and the step-8 completeness check. Invoke when the request mentions EventStorming, a modeling workshop, sticky notes on a wall, recovering lost domain knowledge, exploring a business process with domain experts, or a remote modeling session.
---

# DDD EventStorming

## Source

Page scope: `[DDD ch.12 pp.211-225]`. This skill may cite no other page, except
the pack-shared ranges in `../../rules/ddd-source-of-truth.md`.

## Rules

1. EventStorming is a low-tech activity for a group of people to brainstorm and rapidly model a business process [DDD ch.12 p.211] `RULE`
2. An EventStorming session has a scope: the business process that the group is interested in exploring [DDD ch.12 p.211] `RULE`
3. The participants are exploring the process as a series of domain events, represented by sticky notes, over a timeline [DDD ch.12 p.211] `RULE`
4. Ideally, a diverse group of people should participate: engineers, domain experts, product owners, testers, UI and UX designers, support personnel [DDD ch.12 p.212] `HEURISTIC`
5. Every participant should be able to contribute to the process, but this can be challenging for groups of more than 10 participants [DDD ch.12 p.212] `HEURISTIC`
6. It's best to stick to the traditional colour conventions, to be consistent with all of the currently available EventStorming books and trainings [DDD ch.12 p.212] `HEURISTIC`
7. A typical session lasts about two to four hours [DDD ch.12 p.212] `RULE`
8. Chairs are a big no-no for EventStorming sessions [DDD ch.12 p.213] `RULE`
9. An EventStorming workshop is usually conducted in 10 steps [DDD ch.12 p.213] `RULE`
10. It is important to formulate domain events in the past tense [DDD ch.12 p.213] `RULE`
11. The group should continue generating domain events until the rate of adding new ones slows significantly [DDD ch.12 p.214] `HEURISTIC`
12. The events should start with the happy path scenario: the flow that describes a successful business scenario [DDD ch.12 p.214] `HEURISTIC`
13. It is important to make these inefficiencies explicit so that it will be easy to return to them [DDD ch.12 p.215] `RULE`
14. Pivotal events are an indicator of potential bounded context boundaries [DDD ch.12 p.216] `RULE`
15. Commands describe the system's operations and, contrary to domain events, are formulated in the imperative [DDD ch.12 p.216] `RULE`
16. The actor represents a user persona within the business domain, such as customer, administrator, or editor [DDD ch.12 p.217] `RULE`
17. Add the actor information only where it's obvious, because not all commands will have an associated actor [DDD ch.12 p.217] `RULE`
18. An automation policy is a scenario in which an event triggers the execution of a command [DDD ch.12 p.217] `RULE`
19. A read model is the view of data within the domain that the actor uses to make a decision to execute a command [DDD ch.12 p.218] `RULE`
20. Since a command is executed after the actor has viewed the read model, the read models are positioned before the commands [DDD ch.12 p.218] `RULE`
21. An external system is defined as any system that is not a part of the domain being explored [DDD ch.12 p.219] `RULE`
22. By the end of step 8, all commands should either be executed by actors, triggered by policies, or called by external systems [DDD ch.12 p.220] `HEURISTIC`
23. An aggregate receives commands and produces events [DDD ch.12 p.220] `RULE`
24. The groups of aggregates form natural candidates for bounded contexts' boundaries [DDD ch.12 p.220] `RULE`
25. Alberto Brandolini defines the EventStorming process as guidance, not hard rules, and you are free to experiment with the process [DDD ch.12 p.221] `RULE`
26. When introducing EventStorming in an organization I prefer to start by exploring the big picture, following steps 1 through 4 [DDD ch.12 p.221] `PREFERENCE`
27. The real value of an EventStorming session is the process itself: the sharing of knowledge among different stakeholders [DDD ch.12 p.221] `RULE`
28. EventStorming will be less successful when the business process you're exploring is simple or obvious [DDD ch.12 p.222] `RULE`
29. When facilitating with a group who have never done EventStorming before, I prefer to start with a quick overview of the process and build a legend [DDD ch.12 p.222] `PREFERENCE`
30. Make sure everyone has a chance to participate in the modeling and the discussion [DDD ch.12 p.223] `RULE`
31. Don't resume the session until all the participants are back in the room [DDD ch.12 p.223] `RULE`
32. Remote sessions are more effective with a smaller number of participants, and I prefer to limit online sessions to five participants [DDD ch.12 p.224] `PREFERENCE`
33. When you need more participants to contribute their knowledge, you can facilitate multiple sessions, and afterward compare and merge the resultant models [DDD ch.12 p.224] `RULE`
34. When the situation allows, return to in-person EventStorming [DDD ch.12 p.224] `RULE`

## Inputs

| Input | Reason code | Who can supply it | Citation |
|---|---|---|---|
| The business process the group is interested in exploring | `REQUIRES_BUSINESS_INPUT` | business | [DDD ch.12 p.211] `RULE` |
| Who is related to the business domain in question and can participate | `REQUIRES_ORG_INPUT` | team lead | [DDD ch.12 p.212] `HEURISTIC` |
| Whether the group is colocated, or the session is a remote EventStorming session | `REQUIRES_ORG_INPUT` | team lead | [DDD ch.12 p.224] `RULE` |
| Whether the business process is simple or obvious | `REQUIRES_BUSINESS_INPUT` | domain expert | [DDD ch.12 p.222] `RULE` |
| anything else | `OUT_OF_SCOPE` | n/a | HALT |

## Procedure

1. Confirm the workshop is worth running, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| The goal is to build a ubiquitous language, model the business process, explore new business requirements, recover domain knowledge, improve an existing business process, or onboard new team members | Run the session [DDD ch.12 p.222] `RULE` |
| The business process is simple or obvious, a series of sequential steps without any interesting business logic or complexity | EventStorming will be less successful [DDD ch.12 p.222] `RULE` |
| anything else | HALT (`OUT_OF_SCOPE`) |

2. Check the supplies, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| The modeling space is missing | A whole wall covered with butcher paper makes the best modeling space, or a whiteboard as big as possible [DDD ch.12 p.212] `RULE` |
| The sticky notes are missing | Lots of sticky notes of different colors, enough for everyone [DDD ch.12 p.212] `RULE` |
| The markers are missing | Enough markers for all participants, so supplies are not a bottleneck for knowledge sharing [DDD ch.12 p.212] `RULE` |
| The session runs two to four hours | Bring some healthy snacks for energy replenishment [DDD ch.12 p.212] `RULE` |
| The room has a huge table in the middle, or chairs | Ensure participants can move freely, and take the chairs out of the room [DDD ch.12 p.213] `RULE` |
| anything else | HALT (`OUT_OF_SCOPE`) |

3. Check the participants against the caps, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| The session is in person and has up to 10 participants | Proceed: every participant should be able to contribute to the process [DDD ch.12 p.212] `HEURISTIC` |
| The session is in person and has more than 10 participants | Contributing becomes challenging for groups of more than 10 participants [DDD ch.12 p.212] `HEURISTIC` |
| The session is remote | I prefer to limit online sessions to five participants [DDD ch.12 p.224] `PREFERENCE` |
| More participants have to contribute their knowledge | Facilitate multiple sessions, and afterward compare and merge the resultant models [DDD ch.12 p.224] `RULE` |
| anything else | HALT (`OUT_OF_SCOPE`) |

4. Run the ten steps in this order, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| Step 1 | Unstructured exploration: brainstorm the domain events, in the past tense, until the rate of adding new ones slows significantly [DDD ch.12 p.214] `HEURISTIC` |
| Step 2 | Timelines: organize the events in the order in which they occur, starting with the happy path scenario, then alternative scenarios [DDD ch.12 p.214] `HEURISTIC` |
| Step 3 | Pain points: identify bottlenecks, manual steps that require automation, missing documentation, or missing domain knowledge [DDD ch.12 p.215] `RULE` |
| Step 4 | Pivotal events: look for significant business events indicating a change in context or phase, marked with a vertical bar [DDD ch.12 p.216] `RULE` |
| Step 5 | Commands: light blue sticky notes placed on the modeling space before the events they can produce [DDD ch.12 p.217] `RULE` |
| Step 6 | Policies: look for automation policies that execute the commands with no specific actor [DDD ch.12 p.217] `RULE` |
| Step 7 | Read models: the view of data the actor uses to make a decision to execute a command, positioned before the commands [DDD ch.12 p.218] `RULE` |
| Step 8 | External systems: any system that is not a part of the domain being explored, which can execute commands or be notified about events [DDD ch.12 p.219] `RULE` |
| Step 9 | Aggregates: organize related concepts in aggregates, with commands on the left and events on the right [DDD ch.12 p.220] `RULE` |
| Step 10 | Bounded contexts: look for aggregates related to each other by closely related functionality or by policies [DDD ch.12 p.220] `RULE` |
| anything else | HALT (`OUT_OF_SCOPE`) |

5. Use the colour legend for every note, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| A domain event | Orange sticky notes [DDD ch.12 p.214] `RULE` |
| A pain point | Rotated, diamond pink sticky notes [DDD ch.12 p.215] `RULE` |
| A command | Light blue sticky notes [DDD ch.12 p.217] `RULE` |
| An actor | A small yellow sticky note added to the command [DDD ch.12 p.217] `RULE` |
| An automation policy | Purple sticky notes connecting events to commands [DDD ch.12 p.217] `RULE` |
| A read model | Green sticky notes with a short description of the source of information [DDD ch.12 p.218] `RULE` |
| An external system | Pink sticky notes [DDD ch.12 p.219] `RULE` |
| An aggregate | Large yellow sticky notes, with commands on the left and events on the right [DDD ch.12 p.220] `RULE` |
| anything else | HALT (`OUT_OF_SCOPE`) |

6. Apply the step-8 completeness check before moving to step 9, per `../../rules/ddd-determinism.md`

| Condition | Action |
|---|---|
| The command is executed by an actor | Complete: all commands should either be executed by actors, triggered by policies, or called by external systems [DDD ch.12 p.220] `HEURISTIC` |
| The command is triggered by an automation policy | Complete: all commands should either be executed by actors, triggered by policies, or called by external systems [DDD ch.12 p.220] `HEURISTIC` |
| The command is called by an external system | Complete: all commands should either be executed by actors, triggered by policies, or called by external systems [DDD ch.12 p.220] `HEURISTIC` |
| The command has none of the three | Incomplete: all commands should either be executed by actors, triggered by policies, or called by external systems [DDD ch.12 p.220] `HEURISTIC` |
| anything else | HALT (`OUT_OF_SCOPE`) |

7. Hand the results to the owning skill: the groups of aggregates form natural candidates for bounded contexts' boundaries, and route them to `ddd-bounded-contexts` [DDD ch.12 p.220] `RULE`
8. Emit the output template below, with a citation and a status token on every claim line, writing the filled slots in Portuguese per `../../rules/ddd-language.md`

## Halt conditions

| Trigger | Code |
|---|---|
| The business process to explore is unnamed | `REQUIRES_BUSINESS_INPUT` |
| Which stakeholders hold the domain knowledge is unknown | `REQUIRES_ORG_INPUT` |
| The request asks for a remote EventStorming tool configuration | `UNDEFINED_IN_BOOK` |
| The request asks for a number of sticky notes, a wall size in metres, or a duration per step | `UNDEFINED_IN_BOOK` |
| The request asks for a facilitation script beyond the tips of pp.222-224 | `OUT_OF_SCOPE` |
| The request asks to turn the model into code | `OUT_OF_SCOPE`, and the answer routes to `ddd-design-heuristics` |
| The request asks to settle the bounded contexts the session suggested | `OUT_OF_SCOPE`, and the answer routes to `ddd-bounded-contexts` |
| No domain expert can attend | `REQUIRES_ORG_INPUT` |
| The needed claim cannot be pinned to a page in pp.211-225 | `CITATION_UNVERIFIED` |
| anything else | `OUT_OF_SCOPE` |

## Output template

```ddd-output
## DDD EventStorming — <business process>

- Scope: the business process the group is interested in exploring [DDD ch.12 p.211] `RULE`
- Reason to run it: <ubiquitous language | model the business process | explore new requirements | recover domain knowledge | improve the process | onboard new members> [DDD ch.12 p.222] `RULE`
- Participants: <count and roles> — every participant should be able to contribute to the process [DDD ch.12 p.212] `HEURISTIC`
- Remote or in person: <in person, up to 10 participants | remote, up to five participants> [DDD ch.12 p.224] `PREFERENCE`
- Supplies: modeling space, sticky notes, markers, snacks, and a room without chairs [DDD ch.12 pp.212-213] `RULE`
- Steps run: <1 to 10 | 1 to 4, the big picture> [DDD ch.12 p.221] `PREFERENCE`
- Pivotal events: <list> — an indicator of potential bounded context boundaries [DDD ch.12 p.216] `RULE`
- Step 8 check: <complete | commands with no actor, policy or external system> [DDD ch.12 p.220] `HEURISTIC`
- Aggregates: <list> — each receives commands and produces events [DDD ch.12 p.220] `RULE`
- Bounded context candidates: <list> — groups of aggregates related to each other [DDD ch.12 p.220] `RULE`
- Interop: <filled by the interop rule>
```

## References

`../../references/ddd-part-3-in-practice.md`,
`../../references/ddd-vocabulary.md`,
`../../references/ddd-exercise-answers.md`,
`../../references/ddd-decision-artifacts.md`,
`../../rules/ddd-source-of-truth.md`, `../../rules/ddd-citation.md`,
`../../rules/ddd-heuristic-status.md`, `../../rules/ddd-halt-protocol.md`,
`../../rules/ddd-required-inputs.md`, `../../rules/ddd-determinism.md`,
`../../rules/ddd-interop.md`, `../../rules/ddd-language.md`,
`../../rules/ddd-answer-contract.md`.

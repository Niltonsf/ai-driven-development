---
name: ddd-evolve
description: Plans the evolution of an existing design as the business, the organization, the domain knowledge or the system grows, including brownfield modernization and the strangler pattern.
argument-hint: <component, legacy system or change to plan for>
---

# /ddd-evolve

Plan the evolution of `$ARGUMENTS`. This command is for designs that already
exist and no longer fit.

## Procedure

1. Read `../rules/ddd-answer-contract.md`, `../rules/ddd-required-inputs.md`, `../rules/ddd-heuristic-status.md`,
   `../rules/ddd-halt-protocol.md`, `../rules/ddd-structural-fidelity.md`,
   `../rules/ddd-determinism.md` and `../rules/ddd-language.md`.
2. Name the vector of change: business domain, organizational structure, domain
   knowledge, or growth. A plan without a named vector is a guess.
3. Run `ddd-evolving-design-decisions`. It owns this command.
4. Route the follow-on work.

| Finding | Skill |
|---|---|
| A subdomain changed type | `ddd-subdomains`, then `ddd-design-heuristics` |
| The integration pattern no longer matches the teams | `ddd-integration-patterns` |
| A boundary has to split or widen | `ddd-bounded-contexts` |
| An aggregate has grown past its consistency requirement | `ddd-domain-model` |
| The history has to move into events | `ddd-event-sourced-domain-model` |
| Domain knowledge has been lost | `ddd-eventstorming` |
| A service boundary has to move | `ddd-microservice-boundaries` |
| anything else | HALT (`OUT_OF_SCOPE`) |

5. Order the work in small incremental steps. Never plan a jump from a
   transaction script or an active record straight to an event-sourced domain
   model.
6. Where the plan uses the strangler pattern, check its single shared-database
   condition before shipping the plan.
7. Run `python3 tools/ddd_pdf.py verify` before handing the plan over.

## Report template

```
# DDD Evolution Plan — <target>

- Vector of change: <business domain | organizational structure | domain knowledge | growth>
- Trigger observed: <one line, with its citation and status token>

## Plan

<the ddd-evolving-design-decisions output template, verbatim>

## Follow-on passes

<each routed skill's output template, verbatim>

## Open inputs

<the Missing fact and Who can supply it lines, or "none">

## Verification

`python3 tools/ddd_pdf.py verify` → <exit 0 | exit 1 with the report>
```

## Halts

A big rewrite is not planned here: the book states those endeavors are rarely
successful. A request for one halts with `OUT_OF_SCOPE` and the plan offers the
gradual path instead.

A strangler plan with no commitment to retire the legacy context halts with
`REQUIRES_BUSINESS_INPUT`.

# DDD terminology mapping

The book prints two alias tables. They are the only licensed term substitutions
in this pack. A term with no row here does not get rewritten, and does not cross
the interop bridge.

## Layered architecture, p.150

| The book's term | Alias the book grants | Citation |
|---|---|---|
| Presentation layer | user interface layer | [DDD ch.8 p.150] `RULE` |
| Service layer | application layer | [DDD ch.8 p.150] `RULE` |
| Business logic layer | domain layer, model layer | [DDD ch.8 p.150] `RULE` |
| Data access layer | infrastructure layer | [DDD ch.8 p.150] `RULE` |
| anything else | no alias | HALT (`OUT_OF_SCOPE`) |

The book states it presents the pattern using the original terminology, and
names its own departures from it:

- I prefer "user interface layer" and "infrastructure layer" as these terms better reflect the responsibilities of modern systems [DDD ch.8 p.150] `PREFERENCE`

## Ports & adapters, p.154

| The book's term | Alias the book grants | Citation |
|---|---|---|
| Application layer | service layer, use case layer | [DDD ch.8 p.154] `RULE` |
| Business logic layer | domain layer, core layer | [DDD ch.8 p.154] `RULE` |
| anything else | no alias | HALT (`OUT_OF_SCOPE`) |

This is the table the interop bridge runs on, and the reason the bridge exists:

- The ports & adapters architecture is also known as hexagonal architecture, onion architecture, and clean architecture [DDD ch.8 p.154] `RULE`
- All of these patterns are based on the same design principles, have the same components, and have the same relationships between them [DDD ch.8 p.154] `RULE`

p.150's table supports the translation of layer names. It is not a second
bridge: the alias to clean architecture is granted for ports & adapters alone.

## What never crosses

These terms have no row in either table. They stay inside this pack:

subdomain, core subdomain, generic subdomain, supporting subdomain, bounded
context, ubiquitous language, aggregate, aggregate root, value object, entity,
domain event, domain service, transaction script, active record, domain model,
event-sourced domain model, event sourcing, event store, CQRS, read model,
command execution model, projection, outbox, saga, process manager, partnership,
shared kernel, conformist, anticorruption layer, open-host service, separate
ways, context map, published language, EventStorming, microservice, data mesh.

## Layers are not tiers

A distinction the book makes explicitly, and a common source of a wrong
rewrite:

- A layer is a logical boundary, whereas a tier is a physical boundary [DDD ch.8 p.151] `RULE`
- All layers in the layered architecture are bound by the same lifecycle: they are implemented, evolved, and deployed as one single unit [DDD ch.8 p.151] `RULE`
- A tier is an independently deployable service, server, or system [DDD ch.8 p.151] `RULE`

## See also

`../rules/ddd-interop.md`, `ddd-part-2-tactical-design.md`,
`ddd-vocabulary.md`.

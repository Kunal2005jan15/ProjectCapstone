# Project Docs — Digital Menu, Ordering & Demand-Intelligence Platform

This is the single source of truth for the team. Read the relevant doc before starting any issue — don't build against assumptions.

| Doc | What it covers | Owner |
|---|---|---|
| [01-vision.md](./01-vision.md) | Problem statement, solution, target users, business model | Team lead |
| [02-tech-stack.md](./02-tech-stack.md) | Full frontend / backend / ML / infra stack and why | Team lead |
| [03-erd-schema.md](./03-erd-schema.md) | Entities, attributes, relationships (DB schema) | Backend lead |
| [04-api-contracts.md](./04-api-contracts.md) | Endpoint specs — frontend ↔ backend ↔ ML | Backend lead + ML lead |
| [05-ml-datasets.md](./05-ml-datasets.md) | Exact CSV schemas ML devs build/consume | ML lead |
| [06-diagrams/](./06-diagrams/) | Use-case, high-level, SAD, low-level, repo-structure diagrams | Team lead |
| [07-branching-workflow.md](./07-branching-workflow.md) | Git branching model, protection rules, PR flow | Team lead |
| [CHANGELOG.md](./CHANGELOG.md) | One-line log of every schema/contract change, with date | Whoever makes the change |

## Rules for using this folder

1. **Every issue links to a doc.** If an issue touches the schema, link `03-erd-schema.md`. If it touches an ML dataset, link the exact section in `05-ml-datasets.md`. No issue should require someone to ask "wait, what are the columns again?"
2. **Schema changes get logged.** Renaming a field, adding an entity, changing a data type — one line in `CHANGELOG.md`, same day. This is what prevents `quantity_sold` silently becoming `qty_sold` and nobody finding out until integration week.
3. **This folder is the source of truth, not the Slack/WhatsApp thread.** If a decision is made in chat, it gets written here within the day or it didn't happen.
4. **Docs are reviewed like code.** Changes to `03-erd-schema.md` or `04-api-contracts.md` go through a PR (`docs: ...` prefix) so the affected leads see the diff before it's merged to `dev`.

## Open items before this folder is "final"

- [ ] Backend Lead to confirm `CustomerSession` entity is actually being built (see flag in `03-erd-schema.md`) — ML's `/recommend` endpoint depends on `session_id` existing.
- [ ] 15-minute walkthrough of the ERD with the whole team (especially ML) before Week 1 work starts.

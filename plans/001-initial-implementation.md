# Plan 001 — Initial implementation

**Goal:** deliver the MediaMarktSaturn coding challenge: a miniature order management system exposing a GraphQL API (NestJS, Apollo Server, MongoDB, IoC), with tests and CI.

## Decisions

| Decision | Choice | Rationale |
| --- | --- | --- |
| Framework / IoC | NestJS 11 (built-in DI container) | Modular by design, first-class Apollo integration, strong testing story |
| GraphQL integration | `@nestjs/graphql` + `@nestjs/apollo` (Apollo Server 4), code-first | Single source of truth in TS classes; challenge explicitly requires Apollo |
| GraphQL version pin | `@nestjs/graphql@13` / `@nestjs/apollo@13` | v14 requires NestJS 12; v13 is the NestJS 11 line |
| Persistence | MongoDB via Mongoose (`@nestjs/mongoose`) | Challenge requires MongoDB; Mongoose gives schema validation + clean Nest integration |
| Data modeling | Customer and line items embedded in the order document | They have no lifecycle of their own in this scope; avoids joins |
| Employees | Separate seeded collection; `startOrder` validates the employee exists | Shows a real relation without building out-of-scope CRUD |
| Employee ids | Human-readable string `_id` (`emp-001`), idempotent upsert seed at startup | Employees would come from an HR system in reality; readable ids keep the demo easy to follow |
| Transitions API | Explicit mutations (`startOrder`, `completeOrder`) instead of generic `transition(to)` | The schema itself documents the business rule (employee required to start) |
| Concurrency | Conditional atomic `findOneAndUpdate` (expected state in filter) | Two concurrent transitions cannot both succeed; no read-then-write race |
| State machine | Pure TS module, no framework/DB deps | Unit-testable in isolation; single place enforcing transition rules |
| Money | Unit prices stored as integer cents | Avoids floating-point rounding bugs |
| e2e DB | `mongodb-memory-server` (pulled forward from step 7) | The app connects to MongoDB at startup, so e2e tests need a DB; tests stay Docker-independent |

## Steps

- [x] **1. Bootstrap** — NestJS scaffold, Apollo wired (code-first), health query, README, CLAUDE.md, this plan
- [x] **2. Config module** — `@nestjs/config` with env validation (Mongo URI, port); fail fast on invalid config; `.env.example`; docker-compose for MongoDB
- [x] **3. Order state machine** — pure module: states, allowed transitions, employee invariant; exhaustive unit tests (written first)
- [x] **4. Orders module (domain + persistence)** — Mongoose schemas (embedded customer & line items), repository, service using the state machine with atomic conditional updates, typed business errors
- [x] **5. GraphQL API** — object types & inputs, queries `orders` (state filter, pagination) / `order(id)`, mutations `createOrder` / `startOrder` / `completeOrder`, error mapping to GraphQL extensions codes
- [x] **6. Employees module** — schema, seed on startup, `employees` query; `startOrder` validates employee existence
- [x] **7. Integration tests** — largely delivered alongside steps 4-6 (happy path + every error case); this step added the concurrency e2e tests proving the atomic-update guarantee (one winner per transition under parallel requests)
- [x] **8. CI** — GitHub Actions: install, lint, typecheck/build, unit + e2e tests
- [ ] **9. Demo polish** — order seed script, `demo.http`/GraphQL examples file, README final pass, full local run-through

## Out of scope (reasonable assumptions)

- Authentication / authorization (not requested)
- Customer or employee CRUD (only what the order flow needs)
- Cancellation state or transition history (would be natural extensions; can be discussed in the interview)

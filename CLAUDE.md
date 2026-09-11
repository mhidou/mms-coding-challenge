# Order Management System — MediaMarktSaturn Coding Challenge

Miniature order management system exposing a GraphQL API. NestJS 11 + Apollo Server (via `@nestjs/apollo`) + MongoDB. Deliverable is presented in a live interview demo: favor clarity and correctness over feature count.

## Commands

- `npm run start:dev` — API in watch mode (GraphiQL at http://localhost:3000/graphql)
- `npm test` — unit tests (colocated `*.spec.ts`)
- `npm run test:e2e` — e2e tests in `test/`
- `npm run lint` (autofix) / `npm run lint:check` (CI, no autofix) / `npm run build`
- Node 24 via nvm (`.nvmrc`); non-interactive shells: `export PATH="$HOME/.nvm/versions/node/v24.21.0/bin:$PATH"`

## Architecture

Three layers, dependencies point downward only:

```
resolvers (GraphQL, thin — no business logic)
  → services (business rules, state machine)
    → repositories (MongoDB persistence, no business logic)
```

- One NestJS module per functional area: `orders` (core domain), `employees` (seeded), `health`.
- The order state machine is a pure TypeScript module: no NestJS or MongoDB imports, fully unit-testable.
- GraphQL is code-first: decorated TS classes generate `schema.gql` (gitignored, never edited by hand).

## Domain rules (from the challenge)

- States: `OPEN → IN_PROGRESS → COMPLETE`. No skipping, no reverting.
- Moving to `IN_PROGRESS` requires an assigned employee (must exist in the `employees` collection).
- Transitions are concurrency-safe: conditional atomic update (`findOneAndUpdate` with the expected current state in the filter) — never read-then-write.
- Business errors are typed and mapped to GraphQL error extensions codes: `ORDER_NOT_FOUND`, `INVALID_TRANSITION`, `EMPLOYEE_REQUIRED`, `EMPLOYEE_NOT_FOUND`, `BAD_USER_INPUT`.

## Conventions

- Everything in English: code, comments, commit messages, docs.
- TypeScript strict; avoid `any` and non-null assertions.
- Conventional commits (`feat:`, `fix:`, `test:`, `chore:`, `docs:`); one logical change per commit.
- Tests first for domain logic (state machine, services). Integration tests cover resolvers + error mapping.
- Plans live in `plans/` (numbered markdown). Update checkboxes as steps complete; record notable decisions in the plan's Decisions section.
- Config comes from environment variables, validated at startup — the app must fail fast on invalid config.

# Order Management System

A miniature order management system exposing a GraphQL API, built for the MediaMarktSaturn "Store Apps Platform" coding challenge.

## What it does

Orders move through a strict state machine:

```
OPEN ──▶ IN_PROGRESS ──▶ COMPLETE
```

- Transitions must follow this exact sequence — skipping or reverting is rejected.
- An order can only move to `IN_PROGRESS` with an assigned employee.
- The API exposes queries to list orders and inspect a single order, and mutations to create orders and transition them through their lifecycle.
- Invalid input and illegal transitions are answered with typed, descriptive errors.

## Tech stack

| Concern | Choice |
| --- | --- |
| Runtime | Node.js 24 (see `.nvmrc`), TypeScript |
| Framework / IoC | [NestJS](https://nestjs.com) (built-in dependency injection container) |
| API | GraphQL with Apollo Server 4 (`@nestjs/apollo`, code-first schema) |
| Database | MongoDB |
| Tests | Jest (unit + e2e) |

## Getting started

```bash
# 1. Use the right Node version
nvm use

# 2. Install dependencies
npm install

# 3. Start the API in watch mode
npm run start:dev
```

The GraphQL endpoint (with the GraphiQL IDE) is then available at http://localhost:3000/graphql — try:

```graphql
{ health }
```

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run start:dev` | Run the API in watch mode |
| `npm test` | Unit tests |
| `npm run test:e2e` | End-to-end API tests |
| `npm run lint` | ESLint (with autofix) |
| `npm run build` | Compile to `dist/` |

## Project structure

```
src/
  app.module.ts     # Root module: wires GraphQL (Apollo driver) + feature modules
  health/           # Liveness query
plans/              # Written implementation plans, kept up to date as work progresses
```

The backend is structured into functional modules (NestJS modules), each owning its resolvers, services, and persistence. Business rules live in services — resolvers stay thin.

## Status

This is the initial bootstrap (GraphQL API up and running with a health query). See [plans/001-initial-implementation.md](plans/001-initial-implementation.md) for the full roadmap: order domain & state machine, MongoDB persistence, employees, tests, CI.

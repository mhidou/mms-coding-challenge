# Order Management System

[![CI](https://github.com/mhidou/mms-coding-challenge/actions/workflows/ci.yml/badge.svg)](https://github.com/mhidou/mms-coding-challenge/actions/workflows/ci.yml)

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

# 3. Start MongoDB (used by the upcoming persistence layer)
docker compose up -d

# 4. Start the API in watch mode
npm run start:dev
```

The GraphQL endpoint (with the GraphiQL IDE) is then available at http://localhost:3000/graphql — try:

```graphql
{
  employees {
    id
    name
  }
}
```

Pick an employee id, then create an order:

```graphql
mutation {
  createOrder(
    input: {
      customer: { name: "Ada Lovelace", email: "ada@example.com" }
      lineItems: [{ productName: "Laptop", quantity: 1, unitPriceCents: 99900 }]
    }
  ) {
    id
    state
    createdAt
  }
}
```

Then start it (replace the ids) and inspect it:

```graphql
mutation {
  startOrder(orderId: "<id>", employeeId: "emp-001") {
    id
    state
    assignedEmployeeId
  }
}
```

```graphql
{
  orders(state: IN_PROGRESS) {
    totalCount
    items { id state customer { name } }
  }
}
```

Illegal transitions and malformed input are rejected with typed error codes (`INVALID_TRANSITION`, `EMPLOYEE_REQUIRED`, `ORDER_NOT_FOUND`, `BAD_USER_INPUT`).

## Configuration

Configuration comes from environment variables (optionally via a `.env` file — see [.env.example](.env.example)). All values are validated at startup and the app refuses to boot on invalid configuration.

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `3000` | HTTP port the API listens on |
| `MONGODB_URI` | `mongodb://localhost:27017/order-management` | MongoDB connection string (default matches `docker-compose.yml`) |

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run start:dev` | Run the API in watch mode |
| `npm run seed:demo` | Seed sample orders in every state (idempotent) |
| `npm test` | Unit tests |
| `npm run test:e2e` | End-to-end API tests |
| `npm run lint` | ESLint (with autofix) |
| `npm run lint:check` | ESLint without autofix (used by CI) |
| `npm run build` | Compile to `dist/` |

## Project structure

```
src/
  app.module.ts     # Root module: wires config, GraphQL (Apollo driver) + feature modules
  config/           # Environment validation (fail-fast at startup)
  health/           # Liveness query
  employees/        # Seeded employee collection + query
  orders/           # Core domain: state machine, service, MongoDB persistence
    domain/         #   Pure business rules (no framework imports) + typed errors
    graphql/        #   Types, inputs, resolver, domain-error -> GraphQL code mapping
    persistence/    #   Mongoose schema & repository (atomic conditional updates)
plans/              # Written implementation plans, kept up to date as work progresses
```

The backend is structured into functional modules (NestJS modules), each owning its resolvers, services, and persistence. Business rules live in services — resolvers stay thin.

## Status

The API is feature-complete: queries (`orders`, `order`, `employees`), mutations (`createOrder`, `startOrder`, `completeOrder`), strict state machine enforcement with typed error codes, seeded employees validated on assignment. Feature-complete. A GitHub Actions pipeline (lint, build, unit + e2e tests — no external services needed) runs on every push and pull request. See [plans/001-initial-implementation.md](plans/001-initial-implementation.md) for the build history and the decisions log. See [plans/001-initial-implementation.md](plans/001-initial-implementation.md) for the full roadmap: order domain & state machine, MongoDB persistence, employees, tests, CI.

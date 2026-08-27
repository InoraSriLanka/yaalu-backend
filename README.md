# Yaalu Backend

Backend for the **Yaalu** e-commerce mobile app, built with [NestJS](https://nestjs.com/) as a **microservices monorepo**.

## Architecture

```
Mobile App -> [HTTP] -> api-gateway -> [RabbitMQ] -> auth-service, product-service, order-service, ...
                                                            |
                                                      own Postgres DB each
```

- **`api-gateway`** — the only service that speaks HTTP. It's what the mobile app talks to, and it proxies requests to the backend microservices over RabbitMQ.
- **`auth-service`, `product-service`, `order-service`, `delivery-service`, `payment-service`, `notification-service`** — backend microservices, each listening on their own RabbitMQ queue. Each owns its own PostgreSQL database (DB-per-service).
- **`libs/common`** — small shared library (`@app/common`) for cross-service queue-name constants and shared interfaces. No entities/business logic live here on purpose.

See [`docs/ARCHITECTURE_SETUP_GUIDE.md`](docs/ARCHITECTURE_SETUP_GUIDE.md) for the full breakdown: how the monorepo was set up, the file structure per service, boilerplate code, and the Git branching strategy.

## Tech Stack

- **Framework:** NestJS 11 (monorepo mode)
- **Language:** TypeScript
- **Inter-service messaging:** RabbitMQ (`@nestjs/microservices`, `Transport.RMQ`)
- **Database / ORM:** PostgreSQL + TypeORM
- **Validation:** class-validator / class-transformer
- **Testing:** Jest + Supertest

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
```

### 3. Run it

**Option A — everything in Docker** (infra + services):
```bash
docker compose up -d --build
```
This builds and runs `postgres`, `rabbitmq`, `api-gateway`, and `auth-service` as containers, wired together on the compose network. Rebuild after code changes with `docker compose up -d --build` again (no live-reload inside containers).

**Option B — infra in Docker, services running locally with hot-reload** (better for active development):
```bash
docker compose up -d postgres rabbitmq
npx nest start api-gateway --watch
npx nest start auth-service --watch
```
Each service is started separately, in its own terminal.

> Don't run both options for the same service at once — they'll fight over port 3000 / the RabbitMQ queue. Stop the Docker container (`docker compose stop api-gateway auth-service`) before switching to local `nest start`, or vice versa.

RabbitMQ management UI: [http://localhost:15672](http://localhost:15672) (`guest` / `guest`)

> Only `api-gateway` and `auth-service` are fully wired up so far. The rest still have default boilerplate — see the [Next Steps](docs/ARCHITECTURE_SETUP_GUIDE.md#7-next-steps) section of the setup guide.

## Useful Commands

| Command | Purpose |
|---|---|
| `npx nest start <app> --watch` | Run a service in watch mode |
| `npx nest build <app>` | Build a single service |
| `npm run lint` | Lint with auto-fix |
| `npm run format` | Prettier format |
| `npm run test` | Run unit tests |
| `npm run test:e2e` | Run e2e tests |

## Git Branching Strategy

- `main` — production-ready code only.
- `dev` — integration branch. All feature branches merge here first.
- `feature/<service-name>/<short-description>` — e.g. `feature/auth-service/jwt-login`. Branch from `dev`, PR back into `dev`.

Full details in [`docs/ARCHITECTURE_SETUP_GUIDE.md`](docs/ARCHITECTURE_SETUP_GUIDE.md#1-git-branching-strategy).

# Yaalu Backend — Microservices Architecture Setup Guide

Welcome! This doc explains how the `yaalu-backend` repo was turned from a single bare NestJS app into a microservices monorepo, and how to keep building on it. It's written so you can either follow it step-by-step on a fresh repo, or just use it as a reference for how *this* repo is laid out.

**Status: this has already been done in this repo.** The `apps/`, `libs/`, `nest-cli.json`, and boilerplate code described below already exist and build successfully. Nothing has been pushed to Git yet — that's a deliberate last step, covered in [Section 6](#6-git-push-instructions), left for you to review and run.

## Prerequisites
- Node.js LTS + npm
- Docker (optional, for running Postgres + RabbitMQ locally — see [Section 5](#5-running-things-locally))

## Architecture Overview
- **`api-gateway`** is the *only* service that speaks HTTP. It's what the mobile app talks to.
- Six backend microservices — `auth-service`, `product-service`, `order-service`, `delivery-service`, `payment-service`, `notification-service` — each listen on their own **RabbitMQ queue** and never talk HTTP.
- The gateway forwards requests to the right service over RabbitMQ and returns the response to the client.
- Each service owns its own PostgreSQL database (DB-per-service). For now they can all point at one Postgres instance with separate database names — that's enough at this stage.

```
Mobile App → [HTTP] → api-gateway → [RabbitMQ] → auth-service, product-service, order-service, ...
                                                        ↓
                                                  own Postgres DB each
```

---

## 1. Git Branching Strategy

- **`main`** — production-ready code only.
- **`dev`** — our integration branch (this repo already has a `dev` branch — treat it the same way most tutorials treat a branch called `develop`; we're just using the name that already exists here instead of renaming it).
- **`feature/<service-name>/<short-description>`** — all new work. Branch from `dev`, open a PR back into `dev`. Examples:
  - `feature/auth-service/jwt-login`
  - `feature/api-gateway/rabbitmq-client-setup`
  - `feature/product-service/crud-endpoints`
- **`fix/<service-name>/<bug>`** — bug fixes.
- **`chore/<description>`** — tooling/config-only changes (no feature logic).

> **Ignore the `setup` branch.** It contains an old, abandoned Prisma experiment that's unrelated to this architecture. We've standardized on **TypeORM + PostgreSQL** — don't merge anything from `setup`.

---

## 2. Project Initialization Commands

These are the exact commands used to build this repo out. If you're ever doing this on a fresh repo, follow them in order.

### Step 1 — Convert to a monorepo by generating the first app
There's no `nest new --monorepo` flag. Instead, running `nest generate app <name>` inside an existing standard NestJS project auto-converts it into monorepo mode:

```bash
npx nest generate app api-gateway
```

Because this repo's `package.json` name was `yaalu-backend`, this command *also* creates a leftover `apps/yaalu-backend` folder (it moves your old default app there). That's normal, documented CLI behavior — not a mistake. We cleaned it up immediately so there's no dead code:

```bash
rm -rf apps/yaalu-backend
```

...then edited `nest-cli.json` by hand to remove the `yaalu-backend` project entry and point `root`/`sourceRoot` at `apps/api-gateway` instead — that way, running `nest start` or `nest build` with no app name resolves to the gateway.

### Step 2 — Generate the remaining 6 microservices

```bash
npx nest generate app auth-service
npx nest generate app product-service
npx nest generate app order-service
npx nest generate app delivery-service
npx nest generate app payment-service
npx nest generate app notification-service
```

### Step 3 — Shared library for cross-service constants
```bash
npx nest generate lib common
```
This lives at `libs/common` and is imported as `@app/common`. **Keep this small on purpose** — it only holds RabbitMQ queue-name constants and a couple of shared TypeScript interfaces. Don't put entities, DTOs, or business logic in here — each service should own its own, or you end up tightly coupling services that are supposed to be independent.

### Step 4 — Install dependencies
Nest monorepo mode shares one root `package.json`/`node_modules` for every app, so we install everything once:

```bash
npm install @nestjs/microservices amqp-connection-manager amqplib @nestjs/typeorm typeorm pg @nestjs/config class-validator class-transformer @nestjs/swagger bcrypt
npm install -D @types/bcrypt
```

Not every service needs every package yet (e.g. `notification-service` doesn't need TypeORM/Postgres) — that's fine, add what each service actually uses as you build it out.

---

## 3. Standard File Architecture

### Monorepo-level tree
```
yaalu-backend/
├── apps/
│   ├── api-gateway/
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── api-gateway.module.ts
│   │   │   ├── api-gateway.controller.ts
│   │   │   ├── api-gateway.service.ts
│   │   │   └── auth/
│   │   │       ├── auth-proxy.controller.ts    # example: gateway → auth-service call
│   │   │       └── dto/
│   │   ├── test/
│   │   └── tsconfig.app.json
│   ├── auth-service/
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── auth-service.module.ts           # root module (wires TypeORM + AuthModule)
│   │   │   ├── auth/
│   │   │   │   ├── auth.module.ts
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   └── dto/
│   │   │   │       ├── register.dto.ts
│   │   │   │       └── login.dto.ts
│   │   │   └── users/
│   │   │       └── entities/
│   │   │           └── user.entity.ts
│   │   ├── test/
│   │   └── tsconfig.app.json
│   ├── product-service/       # same shape as auth-service, own entities/dto as you build it
│   ├── order-service/
│   ├── delivery-service/
│   ├── payment-service/
│   └── notification-service/
├── libs/
│   └── common/
│       ├── src/
│       │   ├── index.ts
│       │   ├── constants/
│       │   │   └── queues.constants.ts   # AUTH_SERVICE, AUTH_QUEUE, etc.
│       │   └── interfaces/
│       │       └── user.interface.ts
│       └── tsconfig.lib.json
├── docs/
│   └── ARCHITECTURE_SETUP_GUIDE.md   # this file
├── .env.example
├── docker-compose.yml            # local Postgres + RabbitMQ
├── nest-cli.json
├── package.json
├── tsconfig.json
└── tsconfig.build.json
```

> **Naming note:** only the *root/default* project would be named `app.module.ts` — every other generated app is named after itself (`auth-service.module.ts`, `api-gateway.controller.ts`, etc.). That's the real Nest CLI convention, so we kept it rather than force-renaming things.

### `auth-service` — the reference pattern for every service
- **Root module** (`auth-service.module.ts`) — loads `ConfigModule`, connects to Postgres via `TypeOrmModule.forRootAsync`, imports the feature module.
- **Feature module** (`auth/auth.module.ts`) — registers the `User` repository via `TypeOrmModule.forFeature([User])`, declares its controller + service.
- **Controller** (`auth/auth.controller.ts`) — uses `@MessagePattern(...)` instead of `@Get()`/`@Post()`, because this is a *microservice* controller, not an HTTP one. It receives messages sent over RabbitMQ.
- **Service** (`auth/auth.service.ts`) — business logic, injects `Repository<User>` via `@InjectRepository`.
- **Entity** (`users/entities/user.entity.ts`) — the TypeORM model mapped to the `users` Postgres table.
- **DTOs** (`auth/dto/*.dto.ts`) — `class-validator`-decorated input shapes (`RegisterDto`, `LoginDto`).

Repeat this same pattern (module → controller → service → entities → dto) for `product-service`, `order-service`, etc. as you build each one out.

### Running a single app
Because this is a monorepo, `nest start` alone only runs the default project (`api-gateway`). To run any other service, name it:
```bash
nest start auth-service --watch
```

---

## 4. Foundational Boilerplate Code

### `apps/api-gateway/src/main.ts` — the HTTP entrypoint
```ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ApiGatewayModule } from './api-gateway.module';

async function bootstrap() {
  const app = await NestFactory.create(ApiGatewayModule);

  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

### `apps/auth-service/src/main.ts` — a RabbitMQ microservice
```ts
import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AUTH_QUEUE } from '@app/common';
import { AuthServiceModule } from './auth-service.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AuthServiceModule, {
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL ?? 'amqp://localhost:5672'],
      queue: AUTH_QUEUE,
      queueOptions: { durable: true }, // queue survives a broker restart
      noAck: false,                    // message is only removed after the handler succeeds
    },
  });

  await app.listen();
}
bootstrap();
```

### Gateway → microservice call, end to end
`apps/api-gateway/src/api-gateway.module.ts` registers a RabbitMQ client:
```ts
ClientsModule.registerAsync([
  {
    name: AUTH_SERVICE, // from @app/common
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (config: ConfigService) => ({
      transport: Transport.RMQ,
      options: {
        urls: [config.get<string>('RABBITMQ_URL') ?? 'amqp://localhost:5672'],
        queue: AUTH_QUEUE,
        queueOptions: { durable: true },
      },
    }),
  },
]),
```

`apps/api-gateway/src/auth/auth-proxy.controller.ts` uses it:
```ts
@Controller('auth')
export class AuthProxyController {
  constructor(@Inject(AUTH_SERVICE) private readonly authClient: ClientProxy) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authClient.send('register', dto);
  }
}
```
`authClient.send('register', dto)` publishes onto the `auth_queue`; `auth-service`'s `@MessagePattern('register')` handler picks it up, and the response flows back through the same call.

### Entity + DTOs (`auth-service`)
```ts
// users/entities/user.entity.ts
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ unique: true }) email: string;
  @Column() password: string;       // bcrypt hash, never plaintext
  @Column({ default: 'customer' }) role: string;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
```
```ts
// auth/dto/register.dto.ts
export class RegisterDto {
  @IsEmail() email: string;
  @IsString() @MinLength(6) password: string;
}
```

### `.env.example`
```
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=yaalu_auth

RABBITMQ_URL=amqp://localhost:5672
```
Copy this to `.env` locally (`.env` is already git-ignored) and fill in real values per service/environment.

---

## 5. Running Things Locally

Start Postgres + RabbitMQ with the bundled `docker-compose.yml`:
```bash
docker compose up -d
```
RabbitMQ's management UI is at `http://localhost:15672` (default login `guest`/`guest`) — handy for watching queues fill up while debugging.

Then run whichever services you're working on, each in its own terminal:
```bash
npx nest start api-gateway --watch
npx nest start auth-service --watch
```

---

## 6. Git Push Instructions

### Generic flow (for reference / a brand-new repo)
```bash
git init
git add .
git commit -m "Initial Commit - Architecture Foundation"
git branch -M main
git remote add origin https://github.com/InoraSriLanka/yaalu-backend.git
git push -u origin main
```

### What to actually run in *this* repo
Git and the `origin` remote already exist here, so skip `git init` / `git remote add`. Work on top of `dev`:
```bash
git checkout dev
git pull origin dev
git add apps libs docs .env.example docker-compose.yml nest-cli.json package.json package-lock.json tsconfig.json
git commit -m "Initial Commit - Architecture Foundation"
git push origin dev
```

### Going forward — one feature branch per piece of work
```bash
git checkout -b feature/auth-service/jwt-login dev
# ...work...
git push -u origin feature/auth-service/jwt-login
# open a PR into dev
```

---

## 7. Next Steps
- Build out `product-service`, `order-service`, `delivery-service`, `payment-service`, `notification-service` using the exact same pattern as `auth-service` (module → controller → service → entities → dto).
- Add `@nestjs/swagger` docs to `api-gateway`.
- Add health checks (`@nestjs/terminus`) to each service.
- Replace `synchronize: true` with proper TypeORM migrations before anything touches production data.
- Add JWT issuing/verification to `auth-service` and a guard in `api-gateway` once login actually needs to protect other routes.

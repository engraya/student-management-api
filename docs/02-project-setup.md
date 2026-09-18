# 2. Setup and command meanings

[Home](README.md) · [Configuration](05-bootstrap-and-configuration.md) · [Docker](14-docker.md)

## Prerequisites and safe local sequence

Use Node.js 24 and npm, matching [CI](../.github/workflows/ci.yml) and the [Dockerfile](../Dockerfile). No `engines` field or runtime version file pins local execution. Use PostgreSQL 17 to match the bundled environments, and an SMTP endpoint for email workflows. The frontend is a separate application and is not required for direct HTTP tests.

From the repository root, install the locked dependencies:

```sh
npm ci --legacy-peer-deps
```

`ci` reproduces the lockfile installation; the peer-dependency flag matches CI and Docker. The `postinstall` hook runs `prisma skills sync || exit 0`; it is tooling setup, not database migration or application startup. Client generation remains a separate step.

Copy the environment template only when you do not already have a local `.env`:

```powershell
Copy-Item .env.example .env
```

On a POSIX shell, the equivalent is `cp .env.example .env`. Fill in the variables in [the configuration table](05-bootstrap-and-configuration.md). Replace the template JWT secret: startup requires at least 32 characters. To generate your own value locally:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Keep the result in your environment or secret store, not in source control. Do not copy real credentials into issue reports or documentation.

Start a database if you are using Compose:

```sh
docker compose up -d postgres
npm run prisma:generate
npm run prisma:migrate:deploy
```

For an API on your host, `DATABASE_URL` points to a host-reachable database, usually `localhost:5432`. Compose's API uses `postgres:5432`. A placeholder shape is `postgresql://<user>:<password>@<host>:5432/<database>?schema=public`; replace and URL-encode credentials as appropriate.

`prisma:generate` creates the client under `src/generated/prisma` from the schema; it does not create tables. `prisma:migrate:deploy` applies committed SQL migrations through `prisma.config.ts`; it does not create new migration files or seed data. Review the [schema/migration discrepancy](06-database-and-data-modeling.md) before schema-changing work.

Optionally seed a **disposable development database**:

```sh
npm run prisma:seed
```

The seed creates or preserves a development administrator, a computing faculty, six departments, and inserts up to 50 sample students with duplicate skipping. It contains a fixed development password; obtain it from the local seed if needed rather than copying it into new documentation. Never use this seed to provision production credentials. Existing administrator data is left unchanged by its empty upsert update. Courses, calendar periods, registrations, and results are not seeded. Migrations already introduce the initial faculty/departments.

```sh
npm run start:dev
```

This maps to `nest start --watch`: Nest compiles the TypeScript application, executes its entry point, and rebuilds/restarts after changes. `src/main.ts` bootstraps `AppModule`, registers HTTP configuration, connects Prisma, and listens. At default settings visit `/docs` and `GET /api/v1/health` on `http://localhost:3000`.

## Command reference with consequences

| Command | Actual script / meaning |
| --- | --- |
| `npm run start` | `nest start`; compile/start without watch |
| `npm run start:debug` | `nest start --debug --watch`; debugger and file watching |
| `npm run build` | `nest build`; emits `dist`, excludes specs/test directory through build config |
| `npm run start:prod` | `node dist/main`; runs existing output, does not migrate or rebuild |
| `node dist/main.js` | Explicit compiled entry used by Docker |
| `npm run lint` | `oxlint src/ test/`; analysis, not formatting |
| `npm run format` | Prettier writes source/test TypeScript files; does not format these Markdown docs |
| `npm test` | `vitest run`; unit/spec configuration |
| `npm run test:watch` | Interactive Vitest reruns |
| `npm run test:cov` | Vitest with V8 coverage; no coverage threshold configured |
| `npm run test:debug` | Vitest debugger, file parallelism disabled |
| `npm run test:e2e` | Alternate Vitest config; real application/database assumptions |
| `npm run prisma:migrate -- --name <change>` | `prisma migrate dev`; create/apply a development migration; may require shadow database access |
| `npm run prisma:studio` | Database inspection UI; edits affect the configured database |
| `npm run prisma:reset` | `prisma migrate reset`; destructive development database reset |
| `npm run deploy` | `nest deploy`; a script exists, but no target configuration establishes a deployment procedure |

For production-style local execution, generate the client, build, apply migrations, then start compiled output. Environment validation still runs. `NODE_ENV=production` alone does not configure TLS, hide Swagger, or activate a throttling guard.

## Common mistakes

Running generation instead of migrations leaves tables absent. Running migrations against a different URL from the API leaves the API broken. Running E2E tests on a shared database creates login/token/audit activity; use an isolated database and follow [Testing](12-testing.md). Reset is not a troubleshooting command for production.

## What to remember

- Install, generate, migrate, seed, and start are separate operations.
- Node 24 is supported by repository configuration, not an `engines` declaration.
- SMTP values are required even if you only intend to read students.
- Compiled startup does not apply migrations unless Docker's command does it.
- Seed credentials are deliberately unsuitable for production.

## Check your understanding

1. Which command changes tables, and which generates TypeScript?
2. Why does `postgres` work as a hostname inside Compose but usually not on your host?
3. Why can reseeding fail to fix an existing administrator password?

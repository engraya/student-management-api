# Quick reference

[Documentation home and complete chapter map](README.md)

## Entry points and important locations

| Need | Location |
| --- | --- |
| HTTP startup | [src/main.ts](../src/main.ts) |
| Module graph/Joi configuration | [src/app.module.ts](../src/app.module.ts) |
| Database schema | [prisma/schema.prisma](../prisma/schema.prisma) |
| Prisma CLI setup | [prisma.config.ts](../prisma.config.ts) |
| Migration history / fixtures | [prisma/migrations](../prisma/migrations), [prisma/seed.ts](../prisma/seed.ts) |
| Database provider | [src/prisma/prisma.service.ts](../src/prisma/prisma.service.ts) |
| Identity / role enforcement | [src/auth](../src/auth), [guards](../src/auth/guards) |
| Core records | [src/users](../src/users), [src/students](../src/students), [src/academic](../src/academic) |
| Infrastructure concerns | [src/audit](../src/audit), [src/health](../src/health), [src/common](../src/common) |
| Tests | Adjacent `*.spec.ts`; [test](../test) for E2E |
| Delivery | [CI](../.github/workflows/ci.yml), [CD](../.github/workflows/cd.yml), [Dockerfile](../Dockerfile), [Compose](../docker-compose.yml) |

## Commands

```sh
npm ci --legacy-peer-deps
npm run prisma:generate
npm run prisma:migrate:deploy
npm run prisma:seed
npm run start:dev
npm run lint
npm test
npm run test:e2e
npm run test:cov
npm run build
npm run start:prod
docker compose up --build -d
docker compose logs --tail=100 api
docker compose down
```

Seed/E2E belong on a disposable development/test database. `prisma:migrate` creates development migrations; `prisma:migrate:deploy` applies committed ones. `prisma:reset` is destructive. See [setup](02-project-setup.md) for command explanations and [testing](12-testing.md) for isolation requirements.

## HTTP and identity

- Default base: `http://localhost:3000/api/v1`; Swagger: `http://localhost:3000/docs`.
- Health: GET `/health` relative to API base.
- Login: POST `/auth/login`; protected header: `Authorization: Bearer <access-token>`.
- Refresh/logout JSON: `{"refreshToken":"<raw-refresh-token>"}`; logout also requires access bearer.
- Roles: ADMIN and STAFF. Public signup creates STAFF.
- Access lifetime default 15m; refresh default 30 days; reset 15 minutes; verification 30 minutes.
- Password hashing cost 12; lockout after five failed attempts for 15 minutes.
- Full endpoint inventory: [API reference](10-api-reference.md).

## Environment and models

Required application settings: DATABASE_URL, JWT_SECRET (32+ characters), CORS_ORIGIN, SMTP_HOST/USER/PASSWORD, EMAIL_FROM, FRONTEND_URL. Defaults: PORT=3000, NODE_ENV=development, JWT_EXPIRES_IN=15m, SMTP_PORT=587. REFRESH_TOKEN_DAYS has a runtime fallback of 30 but no Joi rule. Compose additionally consumes POSTGRES_DB/USER/PASSWORD. See [full configuration](05-bootstrap-and-configuration.md).

Models: User, RefreshToken, PasswordResetToken, EmailVerificationToken, AuditLog, Student, Faculty, Department, Course, Session, Semester, CourseRegistration, Result, Attendance. [Database chapter](06-database-and-data-modeling.md) explains every relationship, field group, and migration.

## Verification scope for this documentation

The guide is based on application/configuration/migration/test source inspection. No production deployment, SMTP send, database migration/reset/seed, or database-backed E2E run was performed as part of documentation generation. A source-described flow is not a claim of successful live execution.

Documentation verification on 2026-09-18:

- All 33 Markdown files are indexed from the homepage; all 262 local links/anchors resolved.
- All 64 registered controller method/path combinations appear in the API reference. The unregistered scaffold controller is excluded deliberately.
- Existing unit suite: 18 test files and 18 tests passed. The initial sandbox run hit Windows `spawn EPERM`; a permitted rerun completed successfully.
- Existing lint command exited successfully with one pre-existing unused `Roles` import warning in RegistrationsController.
- Only `docs/` was added; application behavior and existing documentation were preserved.

The unit suite's limited construction assertions are explained in [Testing](12-testing.md); passing them is not evidence that all documented production concerns are resolved.

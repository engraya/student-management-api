# 3. Folder structure and dependencies

[Home](README.md) · [Architecture](04-architecture.md)

```text
student-management-api/
  src/
    main.ts                    HTTP bootstrap
    app.module.ts              dependency graph and environment validation
    app.controller.ts          unregistered scaffold controller
    app.service.ts             unregistered Hello World service
    auth/                      token workflows, strategy, guards, roles, DTOs
    users/                     staff administration and password changes
    students/                  student records and query DTOs
    academic/
      faculties/ departments/ courses/
      sessions/ semesters/ registrations/
      results/                 includes grading.util.ts
      gpa/ attendance/
    audit/                     audit writer and admin query endpoint
    health/                    Terminus database probe
    common/
      filters/                 Prisma error translation
      mail/                    SMTP transporter and identity emails
    prisma/                    globally injectable database client
    generated/prisma/          generated client, models, enums, internals
  prisma/
    schema.prisma              current declarative data model
    migrations/                ordered SQL history
    seed.ts                    development fixture loader
  test/                        two HTTP E2E specs
  .github/workflows/           CI quality/build and CD image publication
  docs/                        this learning guide
  prisma.config.ts             Prisma CLI URL, migration and seed paths
  vitest.config*.ts            unit and E2E file selection
  tsconfig*.json               TypeScript compile settings
  nest-cli.json                Nest source root/build cleanup
  package.json / package-lock.json
  Dockerfile / docker-compose.yml
  .env.example / .gitignore / .dockerignore
  oxlint.json / .prettierrc
```

Feature folders group HTTP routes, application logic, request contracts, and nearby unit specs. This makes a feature change mostly local. `common` holds cross-feature infrastructure. The global Prisma module avoids reconstructing database clients in each service. Most academic modules export their service, though current cross-feature collaboration often happens through shared database relations instead of calling each other's services.

`dist`, `node_modules`, and incremental build output are local build/install artifacts. Generated Prisma code is derived output even when available in the checkout; edit `schema.prisma` and regenerate instead of editing client internals. Agent/editor folders contain development assistance, not application runtime modules. The Prisma Composer skill present in tooling is not evidence of a Composer application: application code uses Nest and Prisma ORM.

## Dependency map

Read [package.json](../package.json) for declared ranges and [package-lock.json](../package-lock.json) for resolved versions.

| Group | Direct packages | Actual role / evidence |
| --- | --- | --- |
| HTTP and DI | `@nestjs/common`, `core`, `platform-express`, `reflect-metadata` | `main.ts`, module/controller/service decorators and constructor injection |
| Configuration | `@nestjs/config`, `joi`, `dotenv` | `AppModule` startup checks; Prisma CLI imports dotenv |
| Database | `@prisma/adapter-pg`, `pg`, `@prisma/client`, `prisma` | `PrismaService`, generated client, CLI and migrations |
| Authentication | `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `bcrypt` | Auth module/strategy, hashing and token signing |
| Requests | `class-transformer`, `class-validator` | DTO conversion/constraints through `ValidationPipe` |
| HTTP tooling | `@nestjs/swagger`, `helmet`, `@nestjs/terminus` | Swagger setup, headers, health controller |
| Throttling | `@nestjs/throttler` | Module options exist; enforcement guard not registered |
| Email | `nodemailer`, its types | MailService; runtime import despite devDependency placement |
| Tests | `@nestjs/testing`, `vitest`, `supertest`, coverage-v8, `vite-tsconfig-paths` | Mock modules, HTTP checks, test configuration |
| Compile/tooling | Nest CLI/schematics, TypeScript, tsx, Oxlint, Prettier, `@types/*` | Build, seed execution, checks, editor types |
| Other installed packages | `@nestjs/observe`, `@nestjs/mau`, `rxjs`, `source-map-support`, `install`, `npm` | Do not infer telemetry or deployment from installation; no application observability wiring was found |

Some packages support the framework without explicit application imports. Installed and actively integrated are different categories. In particular, production pruning needs review because Nodemailer and Prisma runtime-related packages are in devDependencies; the current image avoids pruning by copying the full dependency tree.

## What to remember

- Feature folders combine related layers; they are not independent deployments.
- `AppModule` determines which code becomes reachable at runtime.
- The scaffold `AppController` is not registered, so it does not provide a live root route.
- Dependency placement matters when building a smaller production image.
- Generated files explain types but are not the source of schema changes.

## Check your understanding

1. Where would you put an attendance request DTO?
2. Why does a package in the manifest not prove its feature is enabled?
3. Which files would you inspect to change a table safely?

# Learning roadmap and rebuilding the project

[Home](README.md) · [Quick reference](reference.md)

This is a proposed teaching sequence, not a claim about the author's exact development history. The migration chronology provides evidence of schema evolution; no other historical build order is assumed. Build exercises in a separate learning project or isolated branch/database.

## Level 1: HTTP and basic application structure

Read [overview](01-project-overview.md), [setup](02-project-setup.md), and [structure](03-folder-structure.md). Inspect main.ts, StudentsController, and StudentsService. Learn verbs, paths, JSON, status codes, classes, imports, and async/await.

Exercise: describe a GET student request aloud without saying “the framework handles it.” Identify the route, argument, service method, query, and response. Then start a minimal Nest project of your own with the same Node/TypeScript generation style and a health or simple read route. Use this repository's package/tsconfig/Nest config as the target reference; do not blindly copy every installed dependency.

Completion criterion: you can distinguish compile/start from migration/seed and explain why a controller alone is not a running route unless registered in a module.

## Level 2: Persistence, dependency injection, and validation

Read [architecture](04-architecture.md), [bootstrap/config](05-bootstrap-and-configuration.md), [database](06-database-and-data-modeling.md), and [lifecycle](07-request-lifecycle.md). Inspect PrismaService, schema.prisma, student DTOs, and StudentsModule.

Rebuild sequence:

1. Add validated environment loading with a required database URL. Prove startup rejects missing configuration.
2. Configure Prisma/PostgreSQL and generate a client. Build an injectable shared database provider.
3. Model Faculty, Department, and Student with explicit unique keys/relations. Review your first SQL migration before applying it.
4. Implement create/read/update/delete through controller → service → Prisma. Add decorated DTOs and UUID path validation.
5. Add bounded query pagination and explicitly chosen sort fields; inspect conceptual SQL and actual query plans when useful.

Exercise: send malformed email, an unknown field, a nonexistent valid UUID, and a duplicate student number. Explain which layer rejects each. Delete a disposable student with dependent records and predict cascade behavior first.

Completion criterion: you can explain why static types, validation, and constraints all remain necessary.

## Level 3: Identity and authorization

Read [authentication](08-authentication.md), [security](09-authorization-and-security.md), and [users](features/users.md). Trace AuthService → JwtService/Prisma/Mail/Audit and JwtAuthGuard → JwtStrategy → RolesGuard.

Rebuild password hashing/login first, then short-lived access tokens, then role guards. Add refresh/reset/verification tokens only after you can explain storage, expiry, and consumption. Choose a safer registration policy than public staff self-provisioning for your exercise. Make token consumption atomic and test competing requests; do not reproduce identified gaps merely to imitate the source.

Exercise: log in, change role, and reason about the old token under the current repository implementation. Design one explicit revocation policy and explain its latency/database tradeoff. Distinguish JWT signature checking from password hashing and opaque-token hashing.

Completion criterion: you can name exactly what logout invalidates and why metadata without a guard provides no protection.

## Level 4: Academic use cases and derived data

Read feature chapters in order: [faculties](features/faculties.md), [departments](features/departments.md), [courses](features/courses.md), [sessions](features/sessions.md), [semesters](features/semesters.md), [registrations](features/registrations.md), [results](features/results.md), [GPA](features/gpa.md), [attendance](features/attendance.md). Use [flows](11-data-flow-examples.md) to connect them.

Build a course catalog and calendar before registration. Add results with a pure grade helper, then weighted GPA, then attendance. Work through a three-credit A and two-credit C by hand. Add a failed course, a repeat attempt, and a course credit edit; explain the existing implementation's output and whether your intended school policy differs.

Exercise: define the invariant “a result requires an active registration.” Decide how concurrent drop/result creation should behave before writing code. Define attendance date/timezone semantics before designing its unique key.

Completion criterion: you can distinguish relational validity from policy validity and explain each derived calculation without opening the source.

## Level 5: Tests, integrations, and operations

Read [testing](12-testing.md), [integrations/performance](13-integrations-and-performance.md), [Docker](14-docker.md), [delivery](15-delivery-and-production.md), and [debugging](16-development-and-debugging.md).

Start with pure grading tests, then mocked service behavior, then real HTTP/database tests. Add SMTP through a test transport/service and observe a failure after a database write. Build a container; explain every Dockerfile line and trace a clean startup through migration to listening. Reproduce CI on a clean database and distinguish build, publication, and actual rollout.

Exercise: propose a deployment with a real hosting target, TLS, secret injection, database backup, and rollback plan. Mark every part not currently supplied by this repository. Specify one useful metric and an alert that indicates a user-visible failure.

Completion criterion: you can explain what a passing health probe and test suite do—and do not—prove.

## Capstone: reconstruct the whole system

Draw the module/dependency graph and schema from memory. Walk through registration, login, result creation, GPA, refresh, and student deletion. Compare with [API reference](10-api-reference.md), then review [technical debt](improvements-and-technical-debt.md) and choose a bounded improvement with an acceptance test.

Your final explanation should connect startup configuration → DI graph → HTTP guards/pipes → service policy → database constraints → side effects → response → deployment/monitoring. This is the core skill the repository can teach: reasoning about the whole execution path rather than memorizing filenames.

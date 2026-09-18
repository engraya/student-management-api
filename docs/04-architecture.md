# 4. Architecture, NestJS, and TypeScript

[Home](README.md) · [Bootstrap](05-bootstrap-and-configuration.md) · [Request lifecycle](07-request-lifecycle.md)

## The controller/service boundary

A controller decides which HTTP request reaches which use case. A service performs the use case. For example, [StudentsController](../src/students/students.controller.ts) obtains a validated `CreateStudentDto`; [StudentsService](../src/students/students.service.ts) lowercases email, converts the date, inserts the row, includes department/faculty information, and handles duplicate constraints.

This is a service-layer modular monolith. It is not a full clean/hexagonal architecture: services directly use generated Prisma types, Nest exceptions, and Prisma queries. There is no custom repository interface isolating persistence. A likely reason is simplicity for a compact CRUD-oriented backend. The benefit is less indirection; the cost is coupling business logic to the framework and ORM.

## Dependency injection through a concrete example

```ts
constructor(private readonly studentsService: StudentsService) {}
```

This is a TypeScript constructor parameter property: it declares and initializes an instance member. `private` and `readonly` primarily constrain TypeScript usage; they are not HTTP security controls. Nest supplies the actual instance because the module registers `StudentsService` as a provider.

At startup, Nest reads `@Module` metadata, discovers controllers/providers, resolves constructor dependencies, and constructs instances. A normal provider is reused across requests. The controller does not call `new StudentsService(new PrismaService())`; Nest owns that dependency graph. Removing the provider registration breaks construction unless the dependency is imported/exported through another module.

[PrismaModule](../src/prisma/prisma.module.ts) and [MailModule](../src/common/mail/mail.module.ts) are global modules, so exported providers can be injected throughout the application after import. Audit is exported explicitly and imported by Auth/Users. Global convenience reduces import boilerplate but makes dependency boundaries less visible.

## Framework mechanisms, in runtime order

| Mechanism | Purpose | Repository example |
| --- | --- | --- |
| Module | Registers related providers/controllers and imports | `StudentsModule` |
| Controller | Maps HTTP to a method | `@Controller('students')`, `@Get(':id')` |
| Provider/service | Reusable injectable behavior | `StudentsService`, `PrismaService` |
| Middleware | Runs in HTTP pipeline before handlers | Helmet registered with `app.use` |
| Guard | Allows/rejects a request before handler execution | `JwtAuthGuard`, `RolesGuard` |
| Strategy | Supplies an interchangeable authentication mechanism | Passport `JwtStrategy` |
| Decorator metadata | Describes route or required permissions | `@Roles('ADMIN')` stores metadata |
| Pipe | Transforms/validates handler arguments | `ValidationPipe`, `ParseUUIDPipe` |
| Exception filter | Translates a thrown error into HTTP | `PrismaExceptionFilter` |
| Lifecycle support | Responds to startup/shutdown | Explicit `$connect`, `enableShutdownHooks` |

Custom interceptors, event subscribers, and background workers are **Not currently implemented**. Do not confuse the exception filter with a universal response serializer.

## Language, library, and framework are different layers

`async`/`await`, `Promise.all`, object spread, `Map`, and array `reduce` are language/runtime behavior. Nest does not invent them. An awaited Prisma call yields while I/O completes; it is still part of the request, not a queued background job. `Promise.all` starts independent queries together, but does not make them a database transaction.

`@IsUUID()` is class-validator metadata; `ValidationPipe` is the Nest component that invokes validation. `bcrypt.compare` is a library operation. `crypto.randomBytes` is a Node API. Prisma's `$transaction` is an ORM API backed by database transactional behavior.

Interfaces such as `WeightedResult`, `LogInput`, and `Express.User` disappear from emitted JavaScript. They help the compiler but cannot reject JSON. `type AuthenticatedRequest = ...` describes a request for developers; the JWT strategy actually populates `req.user`. `as const` preserves narrow inferred types for Prisma selection objects; it does not deep-freeze them at runtime.

DTO classes survive compilation, allowing decorators and runtime conversion. `PartialType(CreateCourseDto)` constructs an update class with optional inherited fields. This differs from the TypeScript-only `Partial<T>` utility. Inspect each update DTO: result updates deliberately require both scores.

The project uses `module: nodenext`, `type: module`, and `.js` import specifiers in TypeScript so emitted imports target JavaScript files. Decorator metadata and experimental decorators are enabled. The Prisma generator requests CommonJS output, which deserves checking against the ESM application during build/runtime verification; successful TypeScript checking alone cannot prove module interoperability.

## Patterns and practical principles

- **Separation of concerns:** controllers parse HTTP context; services query/change state. Direct service tests can avoid a server.
- **Strategy:** Passport delegates bearer-token authentication to its named JWT strategy. Replacing authentication still requires review of guards and identity assumptions.
- **Adapter:** `PrismaPg` connects Prisma to PostgreSQL's driver. This is infrastructure adaptation, not an application-owned repository abstraction.
- **Factory configuration:** `JwtModule.registerAsync` injects `ConfigService` into a factory; tokens use runtime configuration rather than hardcoded secrets.
- **Composition and inheritance:** feature modules compose capabilities; `PrismaService extends PrismaClient` exposes database methods through an injectable class.
- **DRY with limits:** shared include/select objects prevent repeated response selections, while repeated CRUD code remains simple. Over-generalizing CRUD could hide real differences such as result recalculation or cascade deletes.

## Common mistakes

Calling a controller directly bypasses guards and pipes. Adding `@Roles` without `RolesGuard` merely adds metadata. Exporting a service does not register its controller in another module. A type assertion cannot make untrusted data safe.

## What to remember

- Nest constructs the dependency graph; HTTP requests reuse it.
- Services depend directly on Prisma in this repository.
- Runtime validators and static types solve different problems.
- Metadata needs a framework component to act on it.
- Awaited I/O is not durable background processing.

## Check your understanding

1. Why can a controller unit test compile with an empty mocked service?
2. What changes if `PrismaModule` stops exporting its provider?
3. Which part creates `req.user`: the interface, the guard, or the strategy result?

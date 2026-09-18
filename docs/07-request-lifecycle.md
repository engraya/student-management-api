# 7. Request lifecycle, validation, and errors

[Home](README.md) · [Architecture](04-architecture.md) · [API reference](10-api-reference.md)

## Follow `POST /api/v1/students`

The Express-backed Nest server receives HTTP and parses JSON. Helmet applies headers and CORS controls browser-origin access. Nest matches the prefix and StudentsController route. `JwtAuthGuard` verifies the bearer JWT through Passport; `RolesGuard` sees no role restriction on create, so a valid authenticated user can proceed. Guards execute before argument pipes; invalid credentials can therefore produce 401 before body validation produces 400.

The global `ValidationPipe` converts the body toward a DTO instance and invokes its validators. Unknown fields are rejected because both `whitelist` and `forbidNonWhitelisted` are true. `transform` and implicit conversion are enabled. The controller passes the resulting DTO to `StudentsService.create`. Prisma inserts a student and loads related department/faculty data. The resolved object becomes a JSON response; POST defaults to 201 because the controller supplies no `@HttpCode` override.

If a guard, pipe, service, or database operation throws, successful handler execution stops and Nest's exception pipeline produces an error response. There is no custom success-envelope interceptor.

## Three validation boundaries

1. **Transport shape:** DTO decorators reject invalid emails, dates, enum values, UUID formats, numeric ranges, and unknown fields.
2. **Business rules:** service logic checks things such as self-deletion, token expiry, or grade derivation.
3. **Persistence invariants:** PostgreSQL enforces uniqueness and foreign keys even if a service is called outside HTTP.

No one layer replaces the others. `@IsUUID()` proves format, not that the referenced department exists. `@IsDateString()` does not prove that a semester ends after it starts. A TypeScript interface proves neither at runtime.

## DTO behavior you should inspect closely

| DTO area | Runtime contract |
| --- | --- |
| Registration/password reset/change password | New password length 8–100 and letter+number rule |
| Admin `CreateUserDto` | Length 8–100, but no letter+number regex |
| Login | Email and string password; no new-password complexity check |
| Student | Number length 3–20; names 2–50; ISO date string; gender enum; UUID department; integer level >=100 |
| Student query | page >=1; limit 1–100, default 20; bounded sort fields and asc/desc; optional search/department/status/gender |
| Course | code 3–15; title 2–150; integer credits >=1; level >=100; semester enum; optional elective boolean |
| Faculty/Department | names 2–100; codes 2–10; Department also requires faculty UUID |
| Session/Semester | date strings; session name length 4–20, or semester FIRST/SECOND and session UUID |
| Result | CA number 0–30; exam number 0–70; create also requires three UUIDs |
| Attendance | nonempty entries array; each nested entry has student UUID and status enum |

See [source DTOs](../src) and the individual feature lessons. Optional does not always mean “undefined only”: validator optional semantics can admit null, and services differ in how they handle it. This deserves contract tests rather than an assumption that all PATCH bodies behave identically.

### Transformation is executable behavior

Query strings arrive as text. `@Type(() => Number)` lets `page=2` become number 2 before integer validation. `MarkAttendanceDto` combines `@Type(() => AttendanceEntryDto)` and `@ValidateNested({ each: true })` so nested entries are inspected rather than treated as an opaque array.

`QueryUserDto` uses `@Type(() => Boolean)`: JavaScript treats a nonempty string such as `"false"` as truthy. This makes an inactive-user query surprising. Explicit accepted-string parsing is a recommended correction, not current behavior.

AuditController uses an inline object type, and AuditService uses an interface. Those disappear at runtime, so query limits/page values do not receive the class-based validation/conversion used for students. Raw query strings can reach Prisma's numeric `take` argument. Semester list `sessionId` and attendance summary `courseId` are also raw optional strings without UUID pipes.

### PATCH is not uniform

Most update DTOs use Swagger's `PartialType`, preserving optional validation metadata. `UpdateResultDto` instead requires both `caScore` and `examScore`. `UpdateSemesterDto` inherits `sessionId`, but SemestersService.update does not write it. Student updates do not contain a status field despite the schema enum. Document the actual contract rather than inferring it from the HTTP verb or database model.

## Errors and response shapes

[PrismaExceptionFilter](../src/common/filters/prisma-exception.filter.ts) catches only `PrismaClientKnownRequestError`:

| Code | HTTP | Message |
| --- | --- | --- |
| P2002 | 409 | A record with this unique value already exists |
| P2025 | 404 | Record not found |
| P2003 | 400 | Related record does not exist |
| Other known request error | 500 | Database operation failed |

Its JSON contains `statusCode`, `message`, and an ISO `timestamp`. Nest HTTP exceptions and validation failures follow Nest's own response shape instead; there is no fully normalized error envelope. Prisma validation/initialization errors are not covered by this filter class.

Some services catch P2002 first to produce domain-specific 409 messages, such as duplicate student number/email or duplicate result. Explicit missing-record reads throw 404. Authentication throws 401; role violations and self-account restrictions throw 403. Reset/verification failures throw 400. Unknown internal failures can become 500.

Example validation failure shape (messages depend on rejected fields):

```json
{"statusCode":400,"message":["email must be an email"],"error":"Bad Request"}
```

Example database filter response with an illustrative timestamp:

```json
{"statusCode":409,"message":"A record with this unique value already exists","timestamp":"2026-09-18T00:00:00.000Z"}
```

Throwing an error after a committed database operation does not undo it. Registration can create the account/token and then fail while sending mail; an audit failure can make a completed action appear unsuccessful to the client. See [email and side effects](13-integrations-and-performance.md).

## What to remember

- Guards run before controller argument validation.
- DTO classes and decorators enable runtime checks; interfaces do not.
- Transformation can change semantics, especially booleans.
- Database constraints remain necessary after validation.
- A failed HTTP response does not always imply no state changed.

## Check your understanding

1. What happens if a client submits `role` while registering publicly?
2. Why does passing a nonexistent but valid department UUID reach the database?
3. Why does calling StudentsService directly bypass DTO enforcement?

# Audit logging and health checks

[Home](../README.md) · [Observability](../13-integrations-and-performance.md) · [Production](../15-delivery-and-production.md)

## Audit: business evidence rather than request logging

[AuditService](../../src/audit/audit.service.ts) inserts AuditLog rows. `record` is an alias forwarding to `log`. Inputs contain action/entity, optional actor/target IDs, optional JSON metadata, and optional IP/user-agent. The actor is nullable and becomes null if its User is deleted; entityId is not a foreign key, allowing a target's ID to remain after deletion.

Auth records USER_REGISTERED, LOGIN_FAILED, ACCOUNT_LOCKED, LOGIN_SUCCESS, TOKEN_REFRESHED, LOGOUT, PASSWORD_RESET_REQUESTED, PASSWORD_RESET_COMPLETED, and EMAIL_VERIFIED. Users records USER_CREATED, USER_UPDATED, USER_DELETED, USER_ROLE_CHANGED, USER_ACTIVATED/USER_DEACTIVATED, and PASSWORD_CHANGED. Login supplies IP/user-agent; most other callers do not. Students and academic services do not emit audit events.

[AuditController](../../src/audit/audit.controller.ts) exposes ADMIN-only `GET /api/v1/audit-logs`. Its class-level role metadata applies to the route. Service filters support userId/action/entity, although the controller's inline TypeScript type omits entity. Since that type does not validate at runtime, raw entity can still reach the service. Rows/count run in a transaction, ordered newest first, with pagination metadata including next/previous flags.

The controller has no decorated query DTO: numeric page/limit strings are not reliably transformed or bounded, making pagination requests a validation/runtime-error gap. No public audit-write endpoint exists. Calls to record are awaited after primary actions and normally outside their transaction. This is neither an immutable ledger nor complete request logging; a privileged database writer can modify audit rows, and an audit error may fail a request after the business change committed.

## Health: can this process reach its database?

[HealthModule](../../src/health/health.module.ts) imports Terminus. [HealthController](../../src/health/health.controller.ts) exposes public `GET /api/v1/health`, calls HealthCheckService with PrismaHealthIndicator.pingCheck('database', prisma), and returns Terminus health output. Healthy output describes a database up check; dependency failure leads to unhealthy status through Terminus.

This probe gives a useful database readiness signal. It does not test SMTP, migrations/schema correctness beyond what the probe uses, disk capacity, background workers, or every business route. There is no separate liveness/readiness split or Docker API healthcheck configured. The Compose PostgreSQL probe only controls initial API dependency startup.

## Follow the two paths

Login → AuthService records LOGIN_SUCCESS → AuditService → AuditLog INSERT → login response. Later ADMIN GET audit logs → guards → filters/read-count → audit JSON. Health GET takes a separate public path → Terminus → Prisma database ping → health JSON.

## Common mistakes and lessons

Do not mistake audit rows for traces, metrics, or full HTTP logs. Do not assume a green database ping proves result grading or SMTP delivery works. Avoid adding tokens/passwords to metadata while expanding audit coverage.

## Check your understanding

1. Can the audit log reconstruct who changed a result in this implementation?
2. Why can health succeed while registration fails to deliver email?
3. Why does nullable actor identity help retain historical audit rows?

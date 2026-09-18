# 13. Email, observability, and performance

[Home](README.md) · [Audit/health](features/audit-and-health.md) · [Production](15-delivery-and-production.md)

## SMTP integration

[MailService](../src/common/mail/mail.service.ts) creates one Nodemailer transporter with SMTP_HOST/PORT and user/password authentication from ConfigService. It sends HTML verification/reset messages using EMAIL_FROM. FRONTEND_URL supplies the link base. The two methods await `transporter.sendMail`; the return value is not exposed by the API.

Sending through SMTP means asking a mail server to accept/deliver a message. Successful acceptance is not proof the recipient read it or that it avoided spam filtering. There is no provider-specific REST integration, webhook delivery report, bounce handling, template engine, resend endpoint, or retry policy in the code.

`secure`, mandatory TLS, explicit connection/socket timeouts, and transport verification are not configured in MailService; library defaults and the SMTP server determine negotiation. Verify transport requirements against your selected server before deploying. Do not claim that setting port 587 alone establishes a fully tested security policy.

Registration and forgot-password perform database work before awaiting email. A mail failure propagates and can leave token/account records behind. Normal forgot-password responses are generic, but only existing accounts take the SMTP branch, so error/timing behavior is not fully uniform. Tests currently do not exercise delivery. For local experimentation, point these variables at an SMTP test service you control; none is bundled in Compose.

## Asynchronous does not mean background

`await sendMail()` allows Node to handle other work while I/O completes, but the current HTTP response still waits. There is no durable queue, worker, scheduler, cron, event bus, or outbox. Expired/revoked tokens remain stored until removed by a future maintenance process; expiry checks are read-time checks, not cleanup jobs.

A possible future outbox would write an email intent in the same database transaction as account creation, then let a worker deliver/retry it. That introduces operational complexity and requires idempotency and retry policy. It is a recommendation for reliable delivery, not an existing integration.

## Observability layers

Bootstrap writes startup URLs to console and Nest supplies framework logging. AuditService records selected identity/account events in PostgreSQL. Terminus exposes database health. These mechanisms answer different questions: “did the process start?”, “who changed an account?”, and “can the database be reached?”

Structured HTTP access logs, request correlation IDs, latency/error metrics, distributed traces, dashboards, alerting, and a configured log collector are **Not currently implemented**. `@nestjs/observe` being installed does not enable them. There is no application cache; ConfigModule's cache option is only configuration lookup caching.

## Performance from the current queries

| Current implementation | Benefit | Limit and useful next measurement |
| --- | --- | --- |
| Student/user pagination capped at 100 | Bounds common list payloads | Measure deep OFFSET cost and sorting ties; consider stable cursor pagination when needed |
| Academic lists load arrays without pagination | Simple client contract | Measure payload/query growth for results, registrations, and attendance |
| Prisma include/select | Loads related information and excludes unnecessary user fields | Inspect actual SQL/query counts before calling it an N+1 problem or claiming one query |
| Attendance createMany | Fewer round trips than one insert per student | Bound batch size; duplicates are skipped rather than corrected |
| GPA/attendance summaries use in-memory maps/reductions | Simple readable calculation | Full history is loaded; measure memory/latency before moving aggregation into SQL |
| Indexes on foreign keys and common filters | Help relevant access paths | Use actual EXPLAIN plans; contains search may need a different index strategy |
| One injected Prisma client with PrismaPg | Reuses client/driver resources | No explicit pool sizing, timeouts, or replica connection budget configured |
| Bcrypt cost 12 | Slows password guessing | CPU work can be abused without active throttling |

No query instrumentation or benchmark establishes current latency or capacity. Avoid asserting scalability from asynchronous code alone. Multiple replicas multiply database connection pressure and do not fix token races or unbounded queries.

Caching a GPA would require invalidating on result create/update/delete and on course-credit edits, as well as student deletion. This dependency fan-out is a reason to measure before introducing a cache. A stale transcript is a correctness issue, not merely a performance detail.

## What to remember

- Mail delivery belongs to the request's critical path today.
- Audit records, health checks, logs, metrics, and traces are distinct.
- Async code does not provide retries or durability.
- Query performance needs measurements and actual query plans.
- Derived-data caching requires explicit invalidation rules.

## Check your understanding

1. Which database writes can remain after SMTP rejects registration email?
2. Why would a GPA cache need invalidation when a course changes?
3. Why does adding API replicas require reconsidering database pool budgets?

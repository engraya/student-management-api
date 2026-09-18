# Improvements and technical debt

[Home](README.md) · [Security](09-authorization-and-security.md) · [Production](15-delivery-and-production.md)

These are code-review findings and suggested work, not changes made by this documentation task. Priority reflects likely impact, not a confirmed incident. Historical intent and deployed infrastructure outside this repository are unknown.

## High priority

| Finding and evidence | Why it matters | Suggested improvement and verification |
| --- | --- | --- |
| Public AuthService.register creates STAFF; login ignores verification | Unapproved signups obtain broad academic read/write privileges | Define invitation/approval policy; test public signup cannot gain operational access without authorization |
| JwtStrategy validates claims without current User lookup | Disabled/deleted/demoted users can retain access-token capabilities until expiry | Choose account-state checks or token-version/revocation design; test old tokens after administrative changes |
| ThrottlerModule options without ThrottlerGuard registration | Intended 100/minute policy is not enforced | Register active throttling, add auth-specific limits, test actual rejection and replica policy |
| Refresh read/revoke/issue is non-atomic; reset/verify checks precede consumption | Concurrent token reuse can pass pre-checks | Conditional atomic consume or locking/transaction design; test simultaneous requests, rollback, and active-user checks |
| Student.departmentId schema is plain String, last migration changes it to native UUID | Schema history can drift and future migrations may propose unintended changes | Reconcile native type against an isolated migrated database; inspect generated migration diff and fresh/upgrade paths |
| Fixed development admin password in seed/test/examples | Seeding a public environment can create a known credential | Separate production account provisioning, externalize fixture secrets if needed, prevent production seed use |

## Medium priority

| Finding and location | Why it matters | Suggested work |
| --- | --- | --- |
| AuthService mail and audits happen after independent writes | Client can receive failure after account/token state committed | Define partial-failure recovery; use durable outbox for mail if reliability requirements justify it |
| UsersService.changeStatus update/revocation are separate; refresh lacks isActive check | Account-disable races can undermine expected session policy | Transactional state change plus refresh-state validation; exercise concurrent deactivate/refresh |
| AuditController inline query type; QueryUserDto Boolean conversion | Invalid/unbounded pagination and misleading false filters | Decorated audit DTO, bounded limits, explicit boolean parsing, HTTP validation tests |
| Session/Semester current flags lack unique constraint; setters pre-read | Concurrent selection can leave inconsistent current periods | Define global/per-session invariant, use database constraint/locking and contention tests |
| Academic services omit registration/eligibility/calendar rules | Structurally valid but academically inconsistent data can be stored | Agree actual school policies, enforce them in services with database support where practical |
| GPA reads current Course.creditUnits and counts every attempt | Historical output changes with catalog edits; repeats may violate desired policy | Decide historical credit snapshots/course versions and repeat policy; add worked-example tests |
| Attendance timestamp uniqueness omits semester; duplicate skipping cannot correct | Daily attendance identity and correction semantics are unclear | Define timezone/day and correction policy; migrate key if appropriate; test duplicate/cross-semester cases |
| Unit specs only assert construction; E2E differs from main | Important regressions can pass the suite | Behavioral grading/auth/guard/transaction tests; reusable application configuration for HTTP parity |
| CD independent from CI, no hosting rollout | An image can publish without a passing quality workflow; release is incomplete | Gate publication or deployment explicitly and implement target-specific smoke/rollback steps |
| No explicit Prisma disconnect lifecycle implementation | Shutdown may not drain/close database resources as intended | Add and test lifecycle handling, container signals, in-flight request behavior |
| Academic lists and attendance batches unbounded | Large payloads or batches can consume excessive resources | Pagination, response selection, batch caps, measured query plans and connection budgets |

## Low priority and contract consistency

- **DTO/service drift:** UpdateSemesterDto admits sessionId but update ignores it; Student status is stored/filterable but not writable through DTOs. Decide the intended API and align contract/implementation.
- **Password policy drift:** admin user creation omits the public password regex. Centralize a chosen policy rather than duplicating rules inconsistently.
- **Error consistency:** P2003's missing-related-record text is misleading for restricted deletes; known Prisma filter and Nest exceptions have different JSON shapes. Define a deliberate client error contract.
- **Swagger completeness:** request-property documentation is limited without DTO ApiProperty metadata/compiler plugin. Check generated schemas against DTOs.
- **Response consistency:** list arrays/envelopes and relation depth differ. Document intentional differences before standardizing and breaking clients.
- **Dependency hygiene:** runtime Nodemailer is a devDependency; the image ships full dependencies. Review dependency placement before pruning; inspect unused direct packages and duplicate indexes based on evidence.
- **Source cleanup:** unregistered AppController/AppService scaffold and an unused Roles import in RegistrationsController are confusing but do not define live behavior.
- **Configuration gaps:** validate positive REFRESH_TOKEN_DAYS, forward it in Compose, and constrain JWT lifetime syntax and CORS values if needed.
- **Identity lifecycle:** profile email updates leave emailVerifiedAt unchanged; recovery does not invalidate all sibling tokens or clear lockout state. Define those policies explicitly.

## Advanced/future architecture — Not currently implemented

Distributed rate-limit storage, durable mail workers/outbox, structured logs/metrics/traces, token retention cleanup, cursor pagination, immutable academic snapshots, backup automation, and automated deployment are possible next steps. Introduce each for a measured requirement. Splitting the monolith into microservices is not automatically an improvement; it would add network failures and distributed consistency problems to a currently local dependency graph.

## What to remember

- A documented gap is not a repaired gap.
- Begin with access boundaries and data integrity before cosmetic abstraction.
- Specify business policies before encoding them as constraints.
- Concurrency tests should verify invariants, not only call order.
- Production infrastructure outside this checkout cannot be assumed.

## Check your understanding

1. Which risks remain even when all DTO validators pass?
2. Why does one database transaction not necessarily prevent all concurrent races?
3. Which improvements need a business-policy decision before implementation?

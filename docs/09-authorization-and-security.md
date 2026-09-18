# 9. Authorization and security

[Home](README.md) · [Authentication](08-authentication.md) · [Prioritized improvements](improvements-and-technical-debt.md)

## Who are you versus what may you do?

JWT authentication establishes the identity claims on `req.user`. Authorization then decides whether those claims permit the route. [Roles](../src/auth/decorators/roles.decorator.ts) writes `roles` metadata; [RolesGuard](../src/auth/guards/roles.guard.ts) reads handler metadata first, then class metadata with `getAllAndOverride`. With no required roles, it permits the request. With a mismatch or absent user, it throws 403 “Insufficient permissions.”

Protected controllers typically register `JwtAuthGuard, RolesGuard` in that order. `@ApiBearerAuth` describes Swagger security; it does not enforce authentication. Auth's logout method adds its JWT guard locally. Health and the remaining auth endpoints have no bearer guard.

## Actual permission boundaries

| Resource/action | Permission |
| --- | --- |
| Account administration except own password | ADMIN |
| Change own password | Any authenticated account |
| Students create/read/update | Any authenticated account |
| Delete student | ADMIN |
| Faculty/department/course/session/semester reads | Any authenticated account |
| Structure/calendar writes and set-current | ADMIN |
| Registrations create/read/drop | Any authenticated account |
| Results read | Any authenticated account |
| Results create/update; attendance mark | Explicit ADMIN or STAFF |
| Delete result | ADMIN |
| GPA/CGPA, attendance lists/summaries | Any authenticated account |
| Audit logs | ADMIN, class-level metadata |

This is coarse role-based access control. Department-scoped permissions, ownership checks for academic records, and student self-service authorization are **Not currently implemented**. UsersService separately prevents self-delete, self-deactivation, and self-demotion away from ADMIN. It does not implement a complete last-administrator policy across concurrent administrative actions.

## Currently implemented protections

- bcrypt cost 12 for passwords; public projections keep passwordHash out of account responses.
- Signed expiring bearer JWTs; hashed opaque refresh/reset/verification tokens; refresh revocation in relevant password/account flows.
- Five failed-login attempts trigger a 15-minute lock; failures/successes are partly audited.
- DTO allowlisting with unknown-field rejection, bounded student/user pagination, restricted student sort fields, and parameterized Prisma operations.
- Helmet response headers and a configured browser CORS allowlist.
- Database uniqueness and foreign keys protect structural integrity.
- Container runs as a non-root account; local environment files are excluded from the Docker build context.

These protections have limited scopes. Headers do not validate records. CORS does not prevent direct HTTP clients from calling public registration. SQL parameterization protects query values, while business authorization still determines whether the query should run.

## Recommended production improvements — not current features

Public signup creates STAFF accounts able to read and modify academic data. Decide whether registration should be disabled, invitation-only, approved, or constrained to an intended identity domain before public exposure. Verification alone is not sufficient authorization.

`ThrottlerModule.forRoot` configures 100 requests per 60,000 milliseconds, but no ThrottlerGuard/APP_GUARD registration is present. Do not claim active request rate limiting. Add enforcement, focused auth limits, and a shared policy/store if deploying multiple instances.

Revisit access-token revocation/account checks and atomic refresh consumption. Make reset/verification consumption conditional on unused/unexpired state within the same protected operation. Consider invalidating sibling recovery links and explicitly checking active account state during refresh.

TLS termination, proxy trust, secret rotation procedures, dependency scanning, database backup/restore procedures, and private production database networking are **Not currently implemented** in deployment configuration. Configure these for a real hosting target. Review logged IP accuracy before trusting audit IPs behind a proxy; main does not configure proxy trust.

The API does not set authentication cookies, so there is no implemented cookie-CSRF flow. If cookies are introduced, evaluate CSRF protections and cookie attributes as part of that change. A frontend must also handle XSS and token storage: this backend's Helmet configuration does not secure a separate frontend by itself.

A fixed development administrator password appears in repository seed/test/example material. Treat this as published fixture data, never a production credential. Documentation does not reproduce it. No claim is made that an actual production secret was exposed.

## What to remember

- Role metadata requires a guard to enforce it.
- Valid identity does not imply permission for every operation.
- STAFF privileges are broad and registration is public.
- Account state changes do not immediately invalidate JWT claims.
- Security configuration must be traced to active runtime enforcement.

## Check your understanding

1. Can STAFF update a student's details? Can it delete the student?
2. Why does Swagger's lock icon not prove an endpoint is protected?
3. Which guard should run before RolesGuard, and why?
4. Why is an origin allowlist not an alternative to closing public staff registration?

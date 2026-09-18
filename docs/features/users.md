# User administration

[Home](../README.md) · [Authentication](../08-authentication.md) · [API](../10-api-reference.md)

## Purpose and implementation

`User` represents a staff operator, including names, email, password hash, role, active state, verification state, and lockout counters. [UsersModule](../../src/users/users.module.ts) registers [UsersController](../../src/users/users.controller.ts) and [UsersService](../../src/users/users.service.ts), imports AuditModule/Passport, and uses global Prisma. [DTOs](../../src/users/dto) define administrative and own-password inputs.

Admin routes expose list/create and get/update/delete by ID, plus role and status PATCH operations. `POST /users/me/change-password` is available to any authenticated account and gets the target from `req.user`, not a client-supplied user ID. All routes have the `/api/v1` prefix.

## Business behavior

Create lowercases/trims email, trims names, hashes password at cost 12, and returns `publicUserSelect`. Optional role defaults through the schema when omitted. Unlike public registration, this flow does not create a verification token or send mail. Its DTO requires password length but not the public signup letter/number regex.

List builds case-insensitive OR search over firstName/lastName/email, optional role/active filters, and defaults to page 1/limit 20. It runs rows/count concurrently with `Promise.all`, sorts newest first, and returns data plus page/limit/total/totalPages. There are no hasNextPage/hasPreviousPage flags in this service. Boolean query transformation has the caveat described in [validation](../07-request-lifecycle.md).

Update checks existence, checks changed email uniqueness excluding the current ID, and updates only profile fields. Role/status use dedicated routes. Updating email does not reset emailVerifiedAt or trigger new verification. The database unique constraint still handles races after pre-checks.

Delete forbids self-deletion. Change-role forbids demoting yourself away from ADMIN. Change-status forbids disabling yourself; disabling another account revokes its unrevoked refresh tokens after the User update, without grouping those two operations in a transaction. Existing access JWT claims remain valid. Password change verifies current password and transactionally updates its hash and revokes refresh tokens.

Each mutation awaits an audit record after its principal change. This records who acted but is not atomic with the mutation; a failed audit insert can make a completed change return an error.

## Follow an account deactivation

`PATCH /api/v1/users/<id>/status` with `{"isActive":false}` → JWT guard → ADMIN role guard → ChangeUserStatusDto → self-protection/existence checks → User update → refresh-token revocation → USER_DEACTIVATED audit → selected User JSON, normally 200. Use a JSON boolean, not a string.

## Common mistakes and lessons

Do not return raw User records: publicUserSelect deliberately omits secrets and lockout internals. Do not assume administrative creation sends verification mail. Do not treat active-state changes as immediate JWT revocation. Path IDs in this controller do not use ParseUUIDPipe, unlike student/academic routes.

## Check your understanding

1. Why is the password route based on the authenticated user ID?
2. Which state changes are transactional, and which are not?
3. Why can a role downgrade fail to affect an already-issued access token?

# 8. Authentication: credentials, tokens, and account recovery

[Home](README.md) · [Authorization/security](09-authorization-and-security.md) · [User management](features/users.md)

Primary source: [AuthService](../src/auth/auth.service.ts), [AuthController](../src/auth/auth.controller.ts), [AuthModule](../src/auth/auth.module.ts), [JwtStrategy](../src/auth/jwt.strategy.ts).

## Passwords and access tokens solve different problems

A password proves knowledge of an account credential at login. A bearer access token lets subsequent requests present a short-lived proof without sending the password again. Anyone holding the bearer token can use it, so a client must protect it and transport it over HTTPS in a production deployment.

The service hashes passwords with bcrypt cost 12. The stored value is a salted one-way hash, not ciphertext to decrypt. Login uses `bcrypt.compare` to test the submitted password. Cost makes guessing more expensive but also makes login computationally expensive, reinforcing the need for request throttling.

JWT has encoded header, payload, and signature sections. The header describes signing metadata; the payload contains claims; the signature lets the verifier detect tampering using the configured secret. Encoding is not encryption: do not put passwords or private secrets in claims. This code supplies `sub` (user ID), email, and role; JWT signing adds standard time claims according to its options, including expiry. `JWT_EXPIRES_IN` defaults to `15m`.

## Registration

`POST /api/v1/auth/register` accepts email, firstName, lastName, and password. DTO validation enforces the password letter/number rule and lengths. The service lowercases email, checks for an existing user, hashes the password, and creates a selected public account response. It does not accept a client role: schema default `STAFF` applies.

It generates 32 random bytes encoded as hex, stores a SHA-256 hash in EmailVerificationToken with a 30-minute expiry, awaits the SMTP verification email, then records `USER_REGISTERED`. The raw token travels in a frontend URL and is not stored in the database.

The account, token, email, and audit operations are not one transaction. If SMTP fails, the account and verification token remain while the request fails. Retrying registration can then return duplicate email. Verification is not required by login, and no resend-verification endpoint exists.

## Login, step by step

`POST /api/v1/auth/login` looks up lowercase email. Missing users receive 401 “Invalid credentials.” For an existing user, a future `lockedUntil` is rejected before password comparison. A mismatch increments the stored failed-attempt count; attempt five and later set a 15-minute lock. The service records `LOGIN_FAILED` or `ACCOUNT_LOCKED` and returns 401.

With a matching password, it rejects disabled accounts, clears failed attempts/lock, signs an access token, issues a refresh token, and records `LOGIN_SUCCESS` with request IP/user-agent. It returns `{ accessToken, refreshToken, user }`; user contains id/email/names/role, not passwordHash.

The count resets on successful login, not merely when time passes. After a lock expires, another incorrect password can lock the account again. Count updates are read-then-write, so concurrent failures need stronger handling if precise lockout guarantees are required.

## Protected requests

`JwtAuthGuard extends AuthGuard('jwt')` delegates to Passport. JwtStrategy extracts `Authorization: Bearer <access-token>`, verifies signature and expiration, checks truthy sub/email/role claims, and returns `{ userId, email, role }`. Passport makes this available as `req.user`.

There is **no database lookup in JwtStrategy**. A previously issued token can continue to authorize requests after account disabling, deletion, password change, or role change until it expires, subject to later endpoint-specific database errors. The embedded role can be stale. Authentication is therefore not an immediate account-revocation check.

## Refresh and logout

Refresh tokens are opaque random values, not JWTs. Their high entropy permits storing a fast SHA-256 hash for lookup; this is different from hashing human-chosen passwords, which need an expensive password hash. Refresh lifetime reads `Number(REFRESH_TOKEN_DAYS ?? 30)`.

`POST /auth/refresh` is public in the bearer-guard sense but requires a valid refresh secret in its JSON body. The service hashes it, loads its row with User, checks existence/revocation/expiry, marks it revoked, signs a new access token, inserts a new refresh token, and audits `TOKEN_REFRESHED`.

Rotation reduces routine reuse, but the check/update/issue sequence is not atomic. Concurrent requests can both pass the check before either revokes. There is no token-family replay detection. Refresh also does not explicitly check `user.isActive`; account deactivation normally revokes existing refresh rows in UsersService, but that is not a substitute for a refresh-time check.

Authenticated `POST /auth/logout` hashes the supplied refresh token and revokes only a matching, unrevoked row belonging to `req.user.userId`. It records `LOGOUT` and returns a success message even if no row matched. Existing access tokens remain usable until expiry. No cookies, server session store, OAuth, or global logout-all endpoint are implemented.

## Recovery and verification

| Flow | Actual operations | Limitation |
| --- | --- | --- |
| Forgot password | For an existing email, store hashed 15-minute token, await reset email, audit request; otherwise return the same normal message | SMTP failure/timing can still distinguish paths; old reset tokens are not all invalidated |
| Reset password | Check token; hash new password; transaction updates User, marks that token used, revokes all active refresh tokens; audit completion | Check is before transaction; other outstanding reset links and access tokens remain valid |
| Verify email | Check token; transaction sets emailVerifiedAt and token usedAt; audit verification | Login does not enforce this state; pre-read/consume race not explicitly prevented |
| Change own password | UsersService verifies current password, then transaction updates hash and revokes refresh tokens | Existing access JWTs are not revoked |

Frontend routes `/verify-email?token=...` and `/reset-password?token=...` must call the corresponding POST API with the token. Following the email URL alone does not invoke the API. The repository supplies only the mail link construction and backend handlers.

## Common mistakes

Do not equate logout with immediate JWT invalidation. Do not store bearer secrets in audit metadata. Do not call SHA-256 a suitable replacement for bcrypt on passwords. Do not assume public registration is a harmless student signup: it grants a STAFF identity with broad academic access.

## What to remember

- Password verification, JWT verification, and refresh-token lookup are separate mechanisms.
- Token hashes reduce exposure from a token-table leak.
- Access-token claims are snapshots and can become stale.
- Rotation requires atomic consumption to resist concurrent reuse.
- Email verification exists but is not a login precondition.

## Check your understanding

1. Which secrets are returned to the client but stored only as hashes?
2. Why can an SMTP failure leave a newly created user behind?
3. What happens to an existing access token after a role downgrade?
4. Why does a transaction in resetPassword not fully prevent token-consumption races?

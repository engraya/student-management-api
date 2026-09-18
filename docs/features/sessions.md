# Academic sessions

[Home](../README.md) · [Semesters](semesters.md) · [Transactions](../06-database-and-data-modeling.md)

A Session is an academic calendar period, not an authentication session. It stores unique name, start/end dates, and isCurrent. [SessionsController](../../src/academic/sessions/sessions.controller.ts), [SessionsService](../../src/academic/sessions/sessions.service.ts), and [DTOs](../../src/academic/sessions/dto) are wired by SessionsModule.

Authenticated reads use `/api/v1/academic/sessions` and `/:id`. ADMIN can POST, PATCH/DELETE `/:id`, and PATCH `/:id/set-current`. There is no dedicated `GET /sessions/current` route. Create validates a 4–20 character name and two date strings; it does not require a `YYYY/YYYY` naming pattern or ensure endDate > startDate. Update fields are optional. The service converts supplied date strings to Date objects.

List sorts startDate descending and includes semesters. Detail includes semesters and returns 404 if missing. Create converts duplicate name to a specific 409; update relies on the global Prisma filter for database conflicts. Neither create nor ordinary PATCH sets isCurrent.

`setCurrent` first checks existence, then runs an interactive transaction: update all current sessions to false, update the selected session to true, return it. This prevents a partial commit within that call. It does not create a database uniqueness constraint or explicitly serialize competing set-current calls. Concurrent selection needs further design if exactly one current session is a strict invariant.

Flow: ADMIN PATCH set-current → guards/UUID pipe → findOne → transactional updates → 200 selected Session. There is no audit event or automatic change to semesters. Session and semester current flags are independent.

Deletion cascades to semesters, but semester activity relations can restrict the overall deletion. A cascade is not a guarantee that deleting the parent always succeeds.

## Common mistakes and lessons

Do not confuse academic sessions with refresh-token sessions. Do not assume current session selection activates one of its semesters. Date syntax validation is not calendar-policy validation.

## Check your understanding

1. Which failures does the transaction prevent, and which concurrent race remains?
2. Why can a session with semesters fail to delete despite a cascade relationship?

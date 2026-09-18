# Semesters

[Home](../README.md) · [Sessions](sessions.md) · [Registration](registrations.md)

Semester gives activity a calendar context. Its fields are FIRST/SECOND name, sessionId, start/end dates, and isCurrent. `(sessionId, name)` is unique, so each session can have at most one row of each name. [SemestersController](../../src/academic/semesters/semesters.controller.ts), [SemestersService](../../src/academic/semesters/semesters.service.ts), and [DTOs](../../src/academic/semesters/dto) are registered by SemestersModule.

Authenticated GET routes are `/api/v1/academic/semesters`, `/current`, and `/:id`. ADMIN can POST, PATCH/DELETE `/:id`, and PATCH `/:id/set-current`. The literal current route is declared before the parameter route. Missing current semester returns 404, not null.

Create validates enum, session UUID, and date strings; service converts dates, includes session, and converts duplicate tuple to 409. List optionally filters a raw `sessionId` query string, orders startDate descending, and includes session. This particular optional query has no ParseUUIDPipe or query DTO. Detail uses UUID validation and checks existence.

Update accepts PartialType(CreateSemesterDto), but the service writes only name/startDate/endDate. A supplied sessionId can pass validation and then be ignored. No checks enforce date ordering, containment within Session dates, or alignment between current semester and current session.

Set-current follows the same transactional unset-all/set-selected pattern as sessions, globally across semesters rather than per session. Concurrent uniqueness is not database-enforced. Deletion is restricted by registrations/results/attendance.

Example: GET current → JWT/roles guards → service findFirst(isCurrent=true) including Session → 200 or 404. If inconsistent concurrent writes produce multiple current rows, findFirst is not a policy for selecting the correct one.

## Common mistakes and lessons

Do not assume sessionId changes on PATCH because it is in the DTO. Do not assume “current” is inferred from the wall-clock date; it is an explicit stored flag. The flag does not restrict when activity may be entered.

## Check your understanding

1. Why does the unique tuple still permit FIRST in several sessions?
2. What is the difference between a date range and an explicitly selected current semester?

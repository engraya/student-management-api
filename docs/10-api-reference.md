# 10. API reference and design

[Home](README.md) · [Lifecycle](07-request-lifecycle.md) · [Feature explanations](README.md#feature-studies)

Every API route below is relative to `/api/v1`. `Auth` means a valid bearer token; `Admin` means that plus ADMIN role. Method lists enumerate distinct routes sharing a path. See the linked feature chapters for DTOs, relationships, side effects, and policy gaps. `/docs` is the Swagger UI outside the API prefix. The unregistered scaffold controller does not provide `GET /api/v1`.

## Identity and records

| Method | Path | Purpose/input | Access |
| --- | --- | --- | --- |
| POST | `/auth/register` | email, firstName, lastName, password; returns selected User | Public |
| POST | `/auth/login` | email, password; returns token pair and user | Public |
| POST | `/auth/refresh` | refreshToken; returns new token pair | Refresh secret |
| POST | `/auth/logout` | refreshToken; revoke matching own token | Auth |
| POST | `/auth/forgot-password` | email; send reset link if account exists | Public |
| POST | `/auth/reset-password` | token, newPassword | Reset secret |
| POST | `/auth/verify-email` | token | Verification secret |
| GET | `/users` | search, role, isActive, page, limit | Admin |
| POST | `/users` | email, firstName, lastName, password, optional role | Admin |
| GET, PATCH, DELETE | `/users/:id` | Read/profile update/delete | Admin |
| PATCH | `/users/:id/role` | role | Admin |
| PATCH | `/users/:id/status` | isActive | Admin |
| POST | `/users/me/change-password` | currentPassword, newPassword | Auth |
| GET | `/students` | search, departmentId, status, gender, page, limit, sortBy, sortOrder | Auth |
| POST | `/students` | Student create DTO | Auth |
| GET, PATCH | `/students/:id` | Detail / partial allowed student fields | Auth |
| DELETE | `/students/:id` | Hard delete and child cascades | Admin |
| GET | `/audit-logs` | userId, action, entity supported in service; page/limit lack DTO validation | Admin |
| GET | `/health` | Database health | Public |

## Academic structure and calendar

| Method | Path | Purpose/input | Access |
| --- | --- | --- | --- |
| GET | `/academic/faculties` | Ordered list with department counts | Auth |
| POST | `/academic/faculties` | name, code | Admin |
| GET | `/academic/faculties/:id` | Detail with departments | Auth |
| PATCH, DELETE | `/academic/faculties/:id` | Partial update / delete | Admin |
| GET | `/academic/departments` | Optional facultyId; parent and counts | Auth |
| POST | `/academic/departments` | name, code, facultyId | Admin |
| GET | `/academic/departments/:id` | Detail with faculty/courses | Auth |
| PATCH, DELETE | `/academic/departments/:id` | Partial update / delete | Admin |
| GET | `/academic/courses` | search, departmentId, level, semesterName | Auth |
| POST | `/academic/courses` | code, title, creditUnits, level, semesterName, departmentId; optional description/isElective | Admin |
| GET | `/academic/courses/:id` | Detail with department | Auth |
| PATCH, DELETE | `/academic/courses/:id` | Partial update / delete | Admin |
| GET | `/academic/sessions` | List with semesters | Auth |
| POST | `/academic/sessions` | name, startDate, endDate | Admin |
| GET | `/academic/sessions/:id` | Detail with semesters | Auth |
| PATCH, DELETE | `/academic/sessions/:id` | Partial update / delete | Admin |
| PATCH | `/academic/sessions/:id/set-current` | Select current session, no body | Admin |
| GET | `/academic/semesters` | Optional raw sessionId | Auth |
| POST | `/academic/semesters` | name, sessionId, startDate, endDate | Admin |
| GET | `/academic/semesters/current` | Current semester or 404 | Auth |
| GET | `/academic/semesters/:id` | Detail with session | Auth |
| PATCH, DELETE | `/academic/semesters/:id` | Update name/dates / delete | Admin |
| PATCH | `/academic/semesters/:id/set-current` | Select current semester, no body | Admin |

## Academic activity and derived views

| Method | Path | Purpose/input | Access |
| --- | --- | --- | --- |
| GET | `/academic/registrations` | Optional studentId/courseId/semesterId/status | Auth |
| POST | `/academic/registrations` | studentId, courseId, semesterId | Auth |
| GET | `/academic/registrations/:id` | Detail with related records | Auth |
| PATCH | `/academic/registrations/:id/drop` | Mark DROPPED, no body | Auth |
| GET | `/academic/results` | Optional studentId/courseId/semesterId | Auth |
| POST | `/academic/results` | Three IDs, caScore, examScore | ADMIN or STAFF |
| GET | `/academic/results/:id` | Detail with related records | Auth |
| PATCH | `/academic/results/:id` | Both caScore and examScore required | ADMIN or STAFF |
| DELETE | `/academic/results/:id` | Hard delete | Admin |
| GET | `/academic/students/:studentId/gpa` | Required semesterId query UUID | Auth |
| GET | `/academic/students/:studentId/cgpa` | All-result weighted average and semester breakdown | Auth |
| POST | `/academic/attendance` | courseId, semesterId, date, entries[] | ADMIN or STAFF |
| GET | `/academic/attendance` | Optional studentId/courseId/semesterId/date | Auth |
| GET | `/academic/students/:studentId/attendance-summary` | Optional raw courseId | Auth |

## HTTP behavior and conventions

Controllers do not use `@HttpCode` overrides. Nest's default success codes therefore apply: POST 201 (including login, refresh, and logout), GET/PATCH/DELETE 200. Delete methods return a message body rather than 204. A creation-style default on login is the current contract, not a deliberate REST recommendation. Errors include 400 invalid input/relations, 401 authentication, 403 role or self-management policy, 404 absence, 409 uniqueness, and 500 internal failures.

The `api/v1` prefix is literal route namespacing; there is no Nest multi-version negotiation setup. Most route names are plural resources; `drop`, `set-current`, and `change-password` are explicit actions. Read responses are ordinary Prisma/service objects, not one universal envelope. User/student/audit lists are paginated objects; academic lists are arrays.

PUT, bulk student import, result publication, and API idempotency keys are **Not currently implemented**. Repeating POST can conflict or create another token/email. Repeating attendance marking skips exact duplicates but is not an update. Repeating drop gives the same business status. Repeating DELETE can return 404 after the first success.

Swagger is built from decorators and reflected metadata. The Nest CLI config does not declare the Swagger compiler plugin and DTOs generally lack ApiProperty decorators, so do not assume the generated UI completely describes every body property. These tables plus actual DTOs are the reliable contract to review.

## Example request and response

After obtaining an access token, send:

```http
GET /api/v1/students?page=1&limit=20 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access-token>
```

An empty collection returns this shape:

```json
{"data":[],"meta":{"total":0,"page":1,"limit":20,"totalPages":0,"hasNextPage":false,"hasPreviousPage":false}}
```

Use actual stored UUIDs for relation IDs; placeholders are explanatory and will fail UUID validation if sent literally.

## What to remember

- Method decorators, not route names, determine default HTTP status.
- Authentication differs from ADMIN authorization.
- Pagination and response relation depth vary by feature.
- Action endpoints do not create an automatic state machine.
- Swagger is helpful but must be checked against DTO/service behavior.

## Check your understanding

1. What response status does login currently use?
2. Which read needs a required semesterId query parameter?
3. Why is repeating attendance POST different from correcting a row?

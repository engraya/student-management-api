# Student records

[Home](../README.md) · [Database](../06-database-and-data-modeling.md) · [Request flow](../11-data-flow-examples.md)

## Purpose, files, and model

A Student stores an academic identity and demographic/contact information, belongs to one Department, and owns registrations, results, and attendance. It has no password. [StudentsController](../../src/students/students.controller.ts), [StudentsService](../../src/students/students.service.ts), and [DTOs](../../src/students/dto) implement this feature; StudentsModule registers them with Passport support.

Authenticated accounts can POST/GET `/students`, GET/PATCH `/students/:id`; DELETE requires ADMIN. ID paths use ParseUUIDPipe. Creation requires studentNumber, firstName, lastName, email, dateOfBirth, gender, departmentId, and level; middleName/phone/address are optional. Level is any integer >=100, not limited to 100/200/300/400 increments. Date validation does not enforce a past birth date.

## Service behavior and response differences

Create lowercases email, converts the birth-date string to `Date`, and inserts explicit allowed fields. The returned object includes department with faculty. A missing related department is a database foreign-key error. Duplicate number/email becomes a domain-specific 409.

List accepts search, departmentId, status, gender, page, limit, sortBy, and sortOrder. Search uses case-insensitive contains across names, student number, and email. Page defaults 1; limit defaults 20 and is capped at 100. Sort fields are createdAt, firstName, lastName, studentNumber, level; default is createdAt descending. Rows include department only, and metadata includes total/page/limit/totalPages/hasNextPage/hasPreviousPage. At zero rows, totalPages is zero even though the default requested page is one.

The service wraps row/count reads in a Prisma transaction. Conceptually, the row query filters records, sorts them, skips `(page - 1) * limit`, then takes limit rows; count uses the same filter. This avoids loading every student just to paginate. Offset pagination still gets more expensive at very deep pages and can shift when concurrent inserts occur.

Get-one includes department/faculty and throws 404 if absent. Update checks existence, applies fields only when not undefined, converts changed date/email, and returns department only. Status is not an accepted create/update field, despite existing in the database and list filters. Delete physically removes the row, cascading academic history, and returns a message.

## End-to-end example

`GET /api/v1/students?page=2&limit=20&sortBy=lastName&sortOrder=asc` → guards → QueryStudentDto converts/validates numeric query values → controller → service builds where/skip/orderBy → Prisma queries rows/count → JSON `{data,meta}`. There is no academic-ownership filter or per-department staff restriction.

## Common mistakes and lessons

Do not expect all operations to return identical relation depth. Do not send `status` in PATCH; unknown-field rejection produces 400. Do not infer that a valid student UUID exists. Review cascades before deletion and use pagination rather than fetching everything.

## Check your understanding

1. Why does deleting a student also remove results?
2. Which layer ensures a duplicate student number cannot be created concurrently?
3. Why is level 101 valid under the current DTO?

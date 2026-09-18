# Attendance

[Home](../README.md) · [Validation](../07-request-lifecycle.md) · [Database](../06-database-and-data-modeling.md)

Attendance stores student/course/semester, a DateTime, PRESENT/ABSENT/EXCUSED status, and optional recordedById. [AttendanceController](../../src/academic/attendance/attendance.controller.ts), [AttendanceService](../../src/academic/attendance/attendance.service.ts), and [DTOs](../../src/academic/attendance/dto) are registered by AttendanceModule.

`POST /api/v1/academic/attendance` explicitly permits ADMIN/STAFF. The body has courseId, semesterId, date, and a nonempty entries array of `{studentId,status}`. Nested transformation/validation verifies every entry. The recorder comes from the verified token identity rather than an input field.

`mark` converts the date once, maps entries to rows, and calls `createMany({skipDuplicates:true})`. It returns a message plus `recorded` and `submitted` counts, normally 201. Duplicate keys are silently skipped; they do not update an earlier ABSENT record to PRESENT. There is no attendance PATCH/correction endpoint.

The unique key is `(studentId, courseId, date)` and excludes semesterId. Since date is a timestamp with no day normalization, two times on one calendar day can be separate rows, while the same exact timestamp across semesters conflicts. Foreign keys enforce referenced records, but there is no registration/semester/date-range eligibility check.

Authenticated GET `/academic/attendance` filters studentId/courseId/semesterId/date, sorts newest date first, and includes selected student identity and course code/title. The date filter matches an exact parsed timestamp, not a day interval. Results are unpaginated.

Authenticated GET `/academic/students/:studentId/attendance-summary` validates the student path UUID and checks existence; optional courseId is a raw query string. It loads all matching attendance across semesters, groups by course, counts every status in total, and counts only PRESENT as present. Percentage is `present / total * 100`, rounded to one decimal; EXCUSED lowers the percentage because it is in the denominator. It returns `{studentId,courses:[...]}` without semester breakdown.

Flow: bearer/role → nested DTO → attach actor ID → bulk insert → return inserted/submitted counts. No audit record is added, although the recorder foreign key provides attribution. Deleting a recorder sets its reference null; deleting a student cascades attendance.

## Common mistakes and lessons

Do not retry a corrected batch expecting an upsert. Define calendar-day/timezone semantics before depending on “one attendance per day.” A bulk insert reduces per-entry database round trips but needs a batch-size bound for public-facing workloads.

## Check your understanding

1. Why can recorded be smaller than submitted without an error?
2. What percentage results from one PRESENT and one EXCUSED row?
3. Why can identical timestamps collide even with different semester IDs?

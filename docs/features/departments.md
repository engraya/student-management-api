# Departments

[Home](../README.md) · [Faculties](faculties.md) · [Courses](courses.md) · [Students](students.md)

Department links a Faculty to its students and courses. [DepartmentsController](../../src/academic/departments/departments.controller.ts), [DepartmentsService](../../src/academic/departments/departments.service.ts), and [DTOs](../../src/academic/departments/dto) are registered by DepartmentsModule.

Authenticated clients can list/read `/api/v1/academic/departments`; ADMIN can create, PATCH, and DELETE. ID paths and optional `facultyId` list filtering use UUID validation through pipes/DTOs. Create needs name (2–100), code (2–10), and facultyId. Update uses PartialType, including optional parent reassignment.

The database enforces globally unique code and unique `(facultyId, name)`. Consequently, the same name can exist in different faculties but the same code cannot. The service's duplicate message mentions the faculty even when the violated constraint is globally unique code; the schema gives the precise rule.

Create/update include faculty. List orders by name, filters by faculty if supplied, and includes faculty and `_count` for courses/students. Detail includes faculty and all courses. Missing detail rows produce 404; a nonexistent faculty reference fails through the database. There is no list pagination.

Flow: ADMIN posts a department with an existing faculty UUID → JWT/ADMIN guards → DTO validation → service directly inserts → database validates parent and uniqueness → department with faculty, 201. No audit side effect is recorded. Deletion is blocked when courses/students still depend on it.

The normalized model replaced legacy free-text student department names in a backfilled migration. This is a concrete example of replacing duplicated labels with a reference to a shared entity; see [migration history](../06-database-and-data-modeling.md).

## Common mistakes and lessons

UUID validation is not a parent-existence check. Moving a department to another faculty changes the organizational relationship of all its children without editing each student. A detailed department can have a large courses array.

## Check your understanding

1. Which uniqueness rule allows repeated department names?
2. Why might parent reassignment deserve an additional policy check?

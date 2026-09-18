# Faculties

[Home](../README.md) · [Departments](departments.md) · [Database](../06-database-and-data-modeling.md)

Faculty is the top organizational grouping. Its unique name/code and native UUID ID support one-to-many Department relationships. [FacultiesController](../../src/academic/faculties/faculties.controller.ts), [FacultiesService](../../src/academic/faculties/faculties.service.ts), [DTOs](../../src/academic/faculties/dto), and FacultiesModule implement it.

`/api/v1/academic/faculties` supports authenticated GET list and ADMIN POST; `/:id` supports authenticated GET and ADMIN PATCH/DELETE. DTOs require name length 2–100 and code length 2–10; update makes both optional. Path IDs use UUID validation. Codes/names are passed through without normalization.

Create/update catch uniqueness conflicts and return a specific 409. List sorts by name and includes `_count.departments`, giving summary information without loading every department. Get-one includes department records and throws 404 if absent. Delete checks existence, then performs a hard delete; existing departments cause database restriction rather than automatic removal.

Example: ADMIN posts `{"name":"Faculty of Science","code":"SCI"}` → guards/DTO → `FacultiesService.create` → Prisma INSERT → 201 with Faculty. List later returns it with a department count. No audit event is emitted by this service.

A likely reason to model Faculty separately is to avoid repeating a faculty name on every department. The tradeoff is managing related records and delete restrictions. A foreign key protects that shared relationship even if this service is bypassed.

## Common mistakes and lessons

Do not assume uniqueness is case-insensitive: no normalization/case-insensitive unique mechanism is configured. Do not infer faculty deletion recursively deletes departments. `_count` is a related-record count, not pagination metadata.

## Check your understanding

1. Why return counts on a list and full departments on a detail route?
2. What prevents deleting a faculty still referenced by departments?

# Results and grading

[Home](../README.md) · [GPA](gpa.md) · [Data flows](../11-data-flow-examples.md)

Result stores one assessment for a student/course/semester tuple: CA, examination score, total, letter grade, and grade point. [ResultsController](../../src/academic/results/results.controller.ts), [ResultsService](../../src/academic/results/results.service.ts), [grading.util.ts](../../src/academic/results/grading.util.ts), and [DTOs](../../src/academic/results/dto) are registered by ResultsModule.

Authenticated GET list/detail uses `/api/v1/academic/results`. ADMIN/STAFF may POST or PATCH `/:id`; only ADMIN may DELETE. Create needs three UUIDs, CA 0–30, and examination score 0–70. PATCH requires **both** scores; it cannot move the result to another tuple. Decimal scores are allowed by IsNumber.

## Derived data and grading scale

`computeGrade` adds CA and exam, then finds the first descending minimum threshold that matches:

| Total interval | Grade | Point |
| --- | --- | --- |
| 70–100 | A | 5 |
| 60–less than 70 | B | 4 |
| 50–less than 60 | C | 3 |
| 45–less than 50 | D | 2 |
| 40–less than 45 | E | 1 |
| 0–less than 40 | F | 0 |

The 100 ceiling follows HTTP score validation, not an upper-bound check inside computeGrade. Calling this helper/service outside validated HTTP needs its own valid-input guarantee. The helper is a pure function: no database, network, or injected dependency, making boundary tests straightforward.

Create computes derived values before inserting, catches duplicate triples as 409, and includes selected student identity, course, semester/session. Update checks existence and recomputes all derived values from both new scores, preventing an old grade from remaining after a score edit. Lists filter student/course/semester, sort createdAt descending, and are unpaginated. Delete physically removes the row.

Example: CA 25 and exam 50 → total 75 → A → point 5 → INSERT → 201. The caller cannot submit a trusted grade/total: these are derived server-side, and unknown input fields are rejected. There is no active-registration, publication, approval, or result-locking check.

## Common mistakes and lessons

Do not average raw scores to calculate GPA; GPA uses grade points weighted by credits. Do not assume PATCH permits a single score. Changing the grade-scale code will affect future create/update calculations, but will not automatically recalculate previously stored gradePoint fields.

## Check your understanding

1. What tests would detect an incorrect boundary at 45 or 70?
2. Why are grade fields computed rather than accepted from the client?
3. What migration/recalculation policy would a grading-scale change require?

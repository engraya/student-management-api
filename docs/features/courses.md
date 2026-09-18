# Courses

[Home](../README.md) · [Registration](registrations.md) · [Results](results.md) · [GPA](gpa.md)

Course describes a catalog item: unique code, title, optional description, creditUnits, level, semesterName, elective flag, and department. [CoursesController](../../src/academic/courses/courses.controller.ts), [CoursesService](../../src/academic/courses/courses.service.ts), [DTOs](../../src/academic/courses/dto), and CoursesModule implement the feature.

At `/api/v1/academic/courses`, GET is authenticated and POST is ADMIN-only. `/:id` has authenticated GET and ADMIN PATCH/DELETE. Create validates code length 3–15, title 2–150, credits integer >=1, level integer >=100, FIRST/SECOND semester enum, optional boolean isElective, and department UUID. Update makes these fields optional.

Create/update pass DTO fields to Prisma, include department, and translate duplicate code to 409. List optionally filters departmentId/level/semesterName and searches code/title case-insensitively; it sorts level ascending then code ascending and returns an unpaginated array with department. Detail checks existence and includes department. Delete can be blocked by activity foreign keys.

Example flow: ADMIN POSTs a three-credit FIRST-semester course → guards → CreateCourseDto → service INSERT → database enforces unique code/department → 201 course JSON. A staff user can later register a student for it. Registration does not enforce that its semester's name matches Course.semesterName.

Course credit units are read **at GPA calculation time**. Updating them can change the weighting of historical results. There is no separate course-offering/version or historical credit snapshot. This is simpler for a small catalog but makes catalog edits consequential for transcripts.

## Common mistakes and lessons

Do not assume creditUnits have an upper bound: only Min(1) is configured. Do not assume listing is paginated. A code's uniqueness does not provide prerequisites, capacity rules, or schedule compatibility.

## Check your understanding

1. Why can editing a course affect an old student's CGPA?
2. What would a semester-specific course offering model add?

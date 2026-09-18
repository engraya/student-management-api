# Course registration

[Home](../README.md) · [Database](../06-database-and-data-modeling.md) · [Results](results.md)

CourseRegistration is a relationship with its own state: a student takes a course in a semester. It stores those three IDs, REGISTERED/DROPPED status, registeredAt, and timestamps. [RegistrationsController](../../src/academic/registrations/registrations.controller.ts), [RegistrationsService](../../src/academic/registrations/registrations.service.ts), and [DTOs](../../src/academic/registrations/dto) are wired by RegistrationsModule.

All operations require authentication but have no additional role restriction: POST/GET `/api/v1/academic/registrations`, GET `/:id`, PATCH `/:id/drop`. There is no DELETE, general update, or explicit reactivation route.

Create validates studentId/courseId/semesterId as UUIDs, then inserts directly. Foreign keys enforce that each exists; the unique triple prevents duplicates and becomes a 409 with a specific message. The service includes selected student identity fields, full course, and semester with session in responses.

List optionally filters student/course/semester/status, orders registeredAt descending, and returns an unpaginated array. Detail throws 404 when absent. Drop checks existence and sets status DROPPED. Repeating drop leaves the same business status, though updatedAt may change.

Flow: authenticated POST of three IDs → guards/DTO → create → FK/unique checks → 201 registration with related records. The service does not enforce active student status, level/department compatibility, semesterName compatibility, credit limits, prerequisites, or registration windows. Those are possible school policies, not implemented rules.

A dropped row still occupies its unique triple, so another POST for that triple conflicts. Dropping does not remove results or attendance, and their creation does not require a registered row. This is an example of the difference between recording state and enforcing a state machine.

## Common mistakes and lessons

Do not equate dropping with deletion. Do not infer prerequisite checks from a route named registration. A service-level pre-check would need database protection to remain safe under concurrent requests.

## Check your understanding

1. Why does a second POST after dropping still conflict?
2. Where would you enforce an active registration requirement for results?

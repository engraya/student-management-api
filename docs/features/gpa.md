# GPA and cumulative GPA

[Home](../README.md) · [Results](results.md) · [Courses](courses.md)

GPA is a derived read, not a database model. [GpaController](../../src/academic/gpa/gpa.controller.ts) and [GpaService](../../src/academic/gpa/gpa.service.ts) are registered by GpaModule. Authenticated clients request `/api/v1/academic/students/:studentId/gpa?semesterId=<uuid>` or `/cgpa`. Student and required semester IDs use UUID pipes; there is no request body.

The service first checks that the student exists. Semester GPA loads matching Result rows with current course creditUnits/code/title. It does not separately check whether the semester exists; a syntactically valid nonexistent semester ID can produce an empty result and GPA zero for an existing student.

```text
GPA = sum(gradePoint * creditUnits) / sum(creditUnits)
```

For a three-credit A (5 points) and two-credit C (3 points), GPA is `(5*3 + 3*2) / 5 = 4.20`. It is not the unweighted average 4.00. The helper returns zero GPA/credits when total units are zero and rounds to two decimals using toFixed then Number; JSON therefore need not display trailing zeros.

The semester response contains studentId, semesterId, gpa, totalCreditUnits, and courseCode/courseTitle/creditUnits/grade/gradePoint entries. CGPA loads all results with course credits and semester/session, computes one weighted average over **all result rows**, then groups by semester using a Map and produces labeled semesterBreakdown entries. It does not average already-rounded semester GPAs. No explicit ordering of breakdowns is configured.

This design includes failed-result credits in the denominator, excludes courses with no Result row, and counts repeat attempts across semesters. There is no replacement/best-attempt policy, class-of-degree classification, or persisted transcript snapshot. It does not consult registration status. Editing current course credits or deleting results changes the calculation.

Flow: valid bearer/UUID arguments → student existence query → result relation query → in-memory mapping/reduction/grouping → 200 computed JSON. The `WeightedResult` interface checks developer usage at compile time; array arithmetic actually runs in JavaScript.

## Common mistakes and lessons

Do not treat zero GPA as proof the student failed courses; it can mean no results. Do not interpret CGPA as a policy-complete transcript. Snapshot credits or course versions would be a future design choice for historical stability.

## Check your understanding

1. Why is averaging semester GPAs mathematically wrong when semester credit totals differ?
2. How does a repeated failed course affect this implementation's CGPA?

# 1. Project overview

[Documentation home](README.md) · Next: [Setup](02-project-setup.md)

## Three explanations of the same system

**Beginner:** this is the backend of a school administration system. A client sends HTTP requests to create students, record results, and retrieve summaries. PostgreSQL remembers those records between requests. This repository does not supply the screens that people click.

**Developer:** [AppModule](../src/app.module.ts) composes identity, student, academic, audit, mail, and health modules. Each feature normally has a controller, an injectable service, and request DTO classes. Services execute Prisma queries and return objects that Nest sends as JSON.

**Architecture:** one deployable application owns a shared relational schema. Module boundaries organize source and dependency injection; they do not create separate network services or databases. SMTP is an external side effect in the identity workflow. The Docker image runs migrations before starting the compiled server.

## Business problem and users

The likely users are school administrators and staff; this inference follows from the only account roles, `ADMIN` and `STAFF`, and their route permissions. A `User` is an operator. A `Student` is an academic record with no password and no relation to a `User` account. A student portal or student self-service permissions are **Not currently implemented**.

The application connects three kinds of information:

- **Identity:** staff accounts, login, refresh tokens, verification/reset tokens, audit history.
- **Academic structure:** faculty → department → courses/students, and session → semesters.
- **Academic activity:** registrations, results, and attendance connect a student, course, and semester. GPA is calculated from stored results rather than stored as another model.

These relationships reduce duplicated department names and make cross-feature queries possible. They also mean deletion can affect related records; study [database behavior](06-database-and-data-modeling.md) before using delete routes.

## Scope and boundaries

Implemented workflows include account lockout, role management, student pagination, academic CRUD, marking a current calendar period, dropping registrations, score-derived grades, weighted averages, and bulk attendance inserts. Public registration creates a staff account. Verification emails exist, but login does not require verification.

There are no payments, uploads, notifications beyond identity email, OAuth providers, API keys, scheduled tasks, queues, or distributed caches in the application source. Their absence is not a reason to add them automatically. A learning exercise should begin with a concrete requirement.

The root README and Swagger description use production-oriented language. Configuration files alone do not establish production readiness: [the delivery chapter](15-delivery-and-production.md) separates working pieces from missing operational controls.

## Likely rationale and tradeoffs

A likely technical reason for Nest modules is to keep related HTTP and business code together while reusing framework dependency injection. A likely reason for PostgreSQL is that registrations and academic records have strong relational constraints. Prisma makes these relationships usable through typed queries. The repository does not establish the author's historical reasoning.

This arrangement is easy to run as one process and to change across features. The tradeoff is shared deployment and direct coupling to Prisma. Changing the schema can affect several services at once, while some cross-feature rules are currently not enforced.

## What to remember

- Users and students serve different purposes.
- Feature modules are code boundaries inside one application.
- PostgreSQL stores state; GPA is derived on demand.
- SMTP and a frontend are outside the backend boundary.
- Existing behavior and desired school policy are not automatically identical.

## Check your understanding

1. Why does creating a student not create login credentials?
2. Which features would still work if SMTP became unavailable after startup?
3. Why is this a modular monolith rather than a microservice system?

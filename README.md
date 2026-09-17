# Student Management API

A REST API for managing student records and academic administration, built with NestJS 12, TypeScript, Prisma 7, and PostgreSQL. It includes staff authentication, academic records, attendance, and GPA calculations.

## Features

- JWT authentication with rotating refresh tokens, logout, email verification, and password reset through SMTP.
- `ADMIN` and `STAFF` roles, user management, account disabling, and login lockout after five failed attempts for 15 minutes.
- Student records with search, filtering, sorting, and pagination.
- Faculties, departments, courses, academic sessions, and semesters.
- Course registration and withdrawal, assessment results, and automatic grades.
- Credit-weighted semester GPA and cumulative GPA with semester breakdowns.
- Attendance recording and student attendance summaries.
- Authentication and user-management audit logs, database health checks, and Swagger documentation.
- Request validation, Helmet headers, and configurable CORS origins.

## Local setup

Use Node.js 24 and npm, matching the Docker image and CI configuration. You also need PostgreSQL (the bundled Compose service uses PostgreSQL 17) and SMTP credentials for registration and password-reset emails. Docker Compose is optional when running PostgreSQL separately.

### 1. Install dependencies

From the repository root:

```sh
npm ci --legacy-peer-deps
```

This matches the dependency installation command used by CI and Docker.

### 2. Configure the environment

Copy [.env.example](.env.example) to `.env`:

```sh
# macOS / Linux
cp .env.example .env
```

```powershell
# PowerShell
Copy-Item .env.example .env
```

Edit `.env` before starting the app. In particular, replace `JWT_SECRET=change-me`: startup validation requires at least 32 characters. Generate a secret with:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

| Variable             | Purpose / default                                                                                                 |
| -------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`           | `development`, `test`, or `production`; defaults to `development`.                                                |
| `PORT`               | API port; defaults to `3000`.                                                                                     |
| `DATABASE_URL`       | Required PostgreSQL connection URL. For a locally running API, use the database host reachable from your machine. |
| `POSTGRES_DB`        | Database name used by Docker Compose.                                                                             |
| `POSTGRES_USER`      | PostgreSQL user used by Docker Compose.                                                                           |
| `POSTGRES_PASSWORD`  | PostgreSQL password used by Docker Compose. Keep local `DATABASE_URL` credentials in sync.                        |
| `JWT_SECRET`         | Required JWT signing secret, at least 32 characters.                                                              |
| `JWT_EXPIRES_IN`     | Access-token lifetime; defaults to `15m`.                                                                         |
| `REFRESH_TOKEN_DAYS` | Refresh-token lifetime in days; defaults to `30`.                                                                 |
| `CORS_ORIGIN`        | Required allowed frontend origin(s), separated by commas.                                                         |
| `SMTP_HOST`          | Required SMTP server hostname.                                                                                    |
| `SMTP_PORT`          | SMTP port; defaults to `587`.                                                                                     |
| `SMTP_USER`          | Required SMTP username.                                                                                           |
| `SMTP_PASSWORD`      | Required SMTP password.                                                                                           |
| `EMAIL_FROM`         | Required valid sender email address.                                                                              |
| `FRONTEND_URL`       | Required frontend URL used to build verification and password-reset links.                                        |

SMTP settings are required by startup validation; working SMTP delivery is needed for email flows. The frontend must handle `/verify-email?token=...` and `/reset-password?token=...` and submit the token to the corresponding API endpoint. This repository contains the backend only.

### 3. Prepare the database

Start the bundled database, or use an existing PostgreSQL instance:

```sh
docker compose up -d postgres
```

Generate the Prisma client and apply the committed migrations:

```sh
npm run prisma:generate
npm run prisma:migrate:deploy
```

Optionally load development data:

```sh
npm run prisma:seed
```

On a fresh database, the seed creates one administrator, the Faculty of Computing, six departments, and 50 sample students. The development administrator credentials are:

```text
Email:    admin@example.com
Password: Admin12345
```

Use this account only for development and testing. The seed leaves an existing administrator unchanged, so rerunning it does not reset the password. It does not create courses, sessions, semesters, registrations, or results.

### 4. Start the API

```sh
npm run start:dev
```

With the default port:

- API base URL: `http://localhost:3000/api/v1`
- Swagger UI: `http://localhost:3000/docs`
- Database health check: `http://localhost:3000/api/v1/health`

## Authentication and API usage

Log in using `POST /api/v1/auth/login` with a JSON body:

```json
{
  "email": "admin@example.com",
  "password": "Admin12345"
}
```

The response contains `accessToken`, `refreshToken`, and `user`. Supply the access token on protected requests:

```http
GET /api/v1/students?page=1&limit=20 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <accessToken>
```

In Swagger UI, select **Authorize** and enter the access token to try protected endpoints.

Send `{ "refreshToken": "<refreshToken>" }` to `POST /api/v1/auth/refresh` to receive a new token pair. Refreshing revokes the previous refresh token. Logout uses the same body at `POST /api/v1/auth/logout` and also requires the bearer access token.

Public registration creates a `STAFF` account. Passwords must be 8–100 characters and contain a letter and a number. Verification emails expire after 30 minutes; password-reset links expire after 15 minutes. The current login flow does not require email verification.

### Routes and permissions

All routes below are relative to `/api/v1`. Except for health and the public authentication endpoints, routes require a bearer token. See Swagger and the [request DTOs](src) for request fields and validation rules.

| Route                                                                 | Operations and access                                                                     |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `/health`                                                             | Public `GET`; checks database connectivity.                                               |
| `/auth/register`, `/auth/login`, `/auth/refresh`                      | Public `POST` endpoints.                                                                  |
| `/auth/forgot-password`, `/auth/reset-password`, `/auth/verify-email` | Public `POST` endpoints.                                                                  |
| `/auth/logout`                                                        | Authenticated `POST`.                                                                     |
| `/users`                                                              | Admin-only list and create; read, update, and delete at `/:id`.                           |
| `/users/:id/role`, `/users/:id/status`                                | Admin-only `PATCH`.                                                                       |
| `/users/me/change-password`                                           | Authenticated `POST`.                                                                     |
| `/students`                                                           | Authenticated list and create; read and update at `/:id`; delete requires `ADMIN`.        |
| `/academic/faculties`, `/academic/departments`, `/academic/courses`   | Authenticated reads; create, update, and delete require `ADMIN`.                          |
| `/academic/sessions`, `/academic/semesters`                           | Authenticated reads; writes require `ADMIN`, including `PATCH /:id/set-current`.          |
| `/academic/semesters/current`                                         | Authenticated `GET` for the current semester.                                             |
| `/academic/registrations`                                             | Authenticated list and create, `GET /:id`, and `PATCH /:id/drop`.                         |
| `/academic/results`                                                   | Authenticated reads; create and update allow `ADMIN` or `STAFF`; delete requires `ADMIN`. |
| `/academic/students/:studentId/gpa?semesterId=<uuid>`                 | Authenticated `GET` for semester GPA.                                                     |
| `/academic/students/:studentId/cgpa`                                  | Authenticated `GET` for cumulative GPA.                                                   |
| `/academic/attendance`                                                | Authenticated `GET`; `POST` allows `ADMIN` or `STAFF`.                                    |
| `/academic/students/:studentId/attendance-summary`                    | Authenticated `GET`.                                                                      |
| `/audit-logs`                                                         | Admin-only `GET`.                                                                         |

### Student records

Create a student with `POST /api/v1/students`. Use an existing department UUID from `GET /api/v1/academic/departments`:

```json
{
  "studentNumber": "STU-0100",
  "firstName": "Ada",
  "lastName": "Okafor",
  "email": "ada.okafor@example.com",
  "dateOfBirth": "2003-05-20",
  "gender": "FEMALE",
  "departmentId": "22222222-2222-4222-8222-222222222221",
  "level": 100
}
```

The department UUID above is created by the seed on a fresh database. Optional fields include `middleName`, `phone`, and `address`. Student numbers and emails must be unique. Unknown request fields are rejected.

`GET /students` accepts `search`, `departmentId`, `status`, `gender`, `page`, `limit`, `sortBy`, and `sortOrder`. Pagination defaults to page `1` and limit `20`, with a maximum limit of `100`. Sorting defaults to `createdAt` descending; supported sort fields are `createdAt`, `firstName`, `lastName`, `studentNumber`, and `level`.

The list response contains `data` and `meta`, including `total`, `page`, `limit`, `totalPages`, `hasNextPage`, and `hasPreviousPage`.

### Academic grading

Results combine continuous assessment and exam scores. The implemented grade scale is:

| Minimum total score | Grade | Grade points |
| ------------------- | ----- | ------------ |
| 70                  | A     | 5            |
| 60                  | B     | 4            |
| 50                  | C     | 3            |
| 45                  | D     | 2            |
| 40                  | E     | 1            |
| 0                   | F     | 0            |

GPA and CGPA use `sum(gradePoint × creditUnits) / sum(creditUnits)`, rounded to two decimal places. With no credit units, the returned GPA is `0`.

## Docker

After configuring `.env`, start the API and database together:

```sh
docker compose up --build -d
```

Compose waits for PostgreSQL to become healthy. The API container applies committed migrations before starting; it does not run the seed automatically. The database persists in the `postgres_data` volume.

The bundled configuration publishes API port `3000` and PostgreSQL port `5432`. Keep `PORT=3000` unless you also adjust the API port mapping. Compose constructs the API database URL using the `postgres` service hostname and the `POSTGRES_*` variables. It currently does not forward `REFRESH_TOKEN_DAYS`, so the container uses the 30-day default unless you add that environment entry.

## Development commands

| Command                         | Purpose                                            |
| ------------------------------- | -------------------------------------------------- |
| `npm run start`                 | Start through the Nest CLI.                        |
| `npm run start:dev`             | Start with file watching.                          |
| `npm run start:debug`           | Start with debugging and file watching.            |
| `npm run build`                 | Compile to `dist/`.                                |
| `npm run start:prod`            | Run the compiled app; build first.                 |
| `npm run lint`                  | Run Oxlint over source and tests.                  |
| `npm run format`                | Format TypeScript source and tests with Prettier.  |
| `npm test`                      | Run unit tests with Vitest.                        |
| `npm run test:watch`            | Run Vitest in watch mode.                          |
| `npm run test:cov`              | Run tests with coverage.                           |
| `npm run test:e2e`              | Run end-to-end tests.                              |
| `npm run prisma:generate`       | Generate the client in `src/generated/prisma`.     |
| `npm run prisma:migrate`        | Create/apply migrations during schema development. |
| `npm run prisma:migrate:deploy` | Apply committed migrations.                        |
| `npm run prisma:studio`         | Open Prisma Studio.                                |
| `npm run prisma:seed`           | Insert development seed data.                      |
| `npm run prisma:reset`          | Reset the database, deleting its data.             |

End-to-end tests require valid environment configuration and a reachable, migrated, seeded database. The student test logs in with the seeded administrator credentials. Use a separate test database and set `DATABASE_URL` before running migrations, seeding, and tests.

For a compiled local run after environment and database setup:

```sh
npm run prisma:generate
npm run build
npm run prisma:migrate:deploy
npm run start:prod
```

## Project structure

```text
src/
  academic/       Faculties, departments, courses, sessions, semesters,
                  registrations, results, GPA, and attendance
  audit/          Audit event storage and admin queries
  auth/           Authentication, token flows, and role guards
  common/         Mail service and Prisma exception filter
  health/         Database health endpoint
  prisma/         Prisma service and module
  students/       Student endpoints, validation, and persistence
  users/          User administration and password changes
  main.ts         HTTP setup, validation, CORS, and Swagger
prisma/
  schema.prisma   Database models and enums
  migrations/     Committed database migrations
  seed.ts         Development data
test/             End-to-end tests
```

## CI and container publishing

[CI](.github/workflows/ci.yml) runs on pushes and pull requests to `main` and `develop`. It installs dependencies, generates Prisma, migrates and seeds a PostgreSQL test database, runs lint and unit/end-to-end tests, builds the app, and then checks the Docker image build.

[CD](.github/workflows/cd.yml) builds and publishes the Docker image to GitHub Container Registry on pushes to `main`, with commit SHA and default-branch `latest` tags. It does not deploy the image to a running server.

## License

The package is private and marked `UNLICENSED` in [package.json](package.json).

# 12. Testing: what the suite proves

[Home](README.md) · [Development](16-development-and-debugging.md) · [CI](15-delivery-and-production.md)

## Existing test layers

[vitest.config.ts](../vitest.config.ts) selects `**/*.spec.ts`, enables globals, and adds vite-tsconfig-paths. [vitest.config.e2e.ts](../vitest.config.e2e.ts) selects `**/*.e2e-spec.ts`. These patterns separate the named files; source unit tests sit next to their implementations, HTTP tests under `test`.

The 18 unit test files each contain a “should be defined” construction assertion. They use Nest TestingModule with mocked dependencies. They establish that selected objects can be instantiated under those test arrangements, not that authentication, permissions, grading, or database operations work. Academic services/grading do not have behavioral tests in the checked-in suite.

The two E2E specs create an application from AppModule and use Supertest. They need startup environment values and a real database. The health test checks HTTP 200. The student test logs in using the development fixture administrator, then checks that the list returns 200 and contains data/meta.

## Read a representative test conceptually

In [students.controller.spec.ts](../src/students/students.controller.spec.ts):

1. `beforeEach` creates a fresh Nest test module (**Arrange**).
2. StudentsController is registered; StudentsService is replaced with `{}`. This works because constructing the controller does not call service methods.
3. JWT and role guards are overridden with `canActivate: () => true`; this deliberately avoids real authorization.
4. `compile()` resolves the test dependency graph; `module.get` retrieves the controller (**Act**, limited to construction).
5. `expect(controller).toBeDefined()` asserts existence (**Assert**).

Removing a required constructor dependency can fail this setup, but changing result grading or student query behavior will not. `vi.fn` in some mocks creates a spy whose calls could be asserted; the existing audit controller spec still only checks construction.

In [students.e2e-spec.ts](../test/students.e2e-spec.ts), `beforeAll` builds AppModule, sets the prefix and a validation pipe, initializes the app, and calls login. Its test sends the resulting token to GET students. `afterAll` closes the Nest app. This crosses routing, guards, service, and database boundaries, but the test does not first assert successful login, making setup failures appear as later authentication failures.

## Test bootstrap is not production bootstrap

E2E tests do not invoke main.ts. The health test sets no prefix and calls `/health`; the production route is `/api/v1/health`. The student test installs prefix/validation but omits the global Prisma filter, Helmet, CORS, Swagger, and implicit conversion option from main. A passing E2E test does not establish parity with production's full HTTP pipeline.

The unit mocks also bypass PostgreSQL constraint behavior. Test migrations, concurrency, and cascades against a real disposable database rather than assuming mocked Prisma calls prove those properties.

## Running tests

```sh
npm test
npm run test:watch
npm run test:cov
npm run test:e2e
```

Use a dedicated test DATABASE_URL and all required Joi variables for E2E; the files do not automatically create an isolated test database or select `.env.test`. Generate Prisma, apply committed migrations, and seed that database first. CI does these steps with a PostgreSQL service container. E2E login writes token/audit/account state; never aim it at production. No SMTP service container is needed for the current login/list/health tests, though required configuration strings must be supplied.

Coverage uses V8 through the installed coverage package; no coverage threshold or exclusion policy is configured. File selection is broad enough to deserve review if build artifacts/spec copies are introduced outside the normal build configuration.

## Recommended behavioral tests — not currently implemented

| Risk | Meaningful assertion |
| --- | --- |
| Grading boundaries | Exactly 40/45/50/60/70 choose correct grade; score sum is preserved |
| GPA weighting | Unequal credits, zero results, failed courses, repeats, two-decimal output |
| Permission regression | STAFF cannot delete students or modify catalog; unauthenticated requests fail |
| Token replay | Concurrent refresh/reset use cannot both consume one token after the implementation is hardened |
| Data integrity | Duplicate triples conflict; parent deletes restrict/cascade as intended |
| Validation | `isActive=false`, unknown fields, partial score updates, malformed audit pagination |
| Side effects | SMTP failure after registration makes partial state visible and recoverable |

A useful service test should arrange mocked return values, call a service method, and assert the business outcome and essential persisted values. A useful HTTP test should exercise guards/pipes, not replace them all. A useful integration test should use real constraints and clean fixtures.

## What to remember

- Construction tests prove much less than behavior tests.
- Mocks improve isolation but cannot prove SQL constraints.
- Test bootstrap differences can hide production regressions.
- A test database is a configuration responsibility here.
- Coverage percentages do not replace risk-focused assertions.

## Check your understanding

1. Could all current unit tests pass if the grading thresholds were wrong?
2. Why does the health E2E URL omit the API prefix?
3. Which cases require a real database rather than an empty Prisma mock?

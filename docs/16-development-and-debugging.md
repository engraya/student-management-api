# 16. Development workflows and debugging

[Home](README.md) · [Setup](02-project-setup.md) · [Roadmap](learning-roadmap.md)

## Add a feature using existing conventions

Begin with an explicit use case and access policy. Create a feature directory with module/controller/service and DTOs. Register its controller/provider, export the service only if another module needs it, and import the module in AppModule. Follow existing `.js` import suffixes for local TypeScript modules.

Use controller decorators for HTTP mapping, JWT then role guards for protection, and ParseUUIDPipe for identifiers. Define decorated classes for body/query contracts. Put business conditions in services, inject PrismaService rather than constructing another client, and use explicit select/include shapes to control responses. Update Swagger metadata, API tables, feature documentation, and meaningful tests.

For example, a future attendance correction route would need a specific update DTO, a decision about who may correct whose record, clear timestamp identity semantics, and a service update instead of createMany(skipDuplicates). This is an exercise, not an existing endpoint.

## Add/change a model safely

Edit schema.prisma, reconcile the known Student.departmentId native-type mismatch on an isolated database, and create a named development migration:

```sh
npm run prisma:migrate -- --name <descriptive-change>
npm run prisma:generate
```

Review SQL for nullable-to-required transitions, backfills, foreign keys, indexes, and data loss. Run the full migration history against a disposable empty database and test the upgrade against representative existing data. Update seed only if useful fixture data changes. Commit schema and migration together according to repository conventions. Deploy committed migrations with `prisma:migrate:deploy`; do not use migrate dev/reset on production.

Changing generated client code manually is not a migration. Changing only DTOs does not change tables. A nullable schema field needs deliberate API null semantics rather than automatic copying into every update DTO.

## Add configuration or an external integration

For a new environment variable, update `.env.example` using a placeholder, Joi validation/defaults in AppModule, the consuming service, Compose forwarding, CI values if needed, and [configuration documentation](05-bootstrap-and-configuration.md). Prisma CLI settings may need separate handling. Test invalid/missing values. REFRESH_TOKEN_DAYS demonstrates what happens when these locations drift.

For an integration, isolate credentials and client construction in a provider, define timeouts/failure behavior, decide whether side effects belong in the request or a durable workflow, and mock the boundary in unit tests. A retry requires an idempotency decision; blindly retrying a partially completed registration is not safe behavior.

## Debug by identifying the failing boundary

| Symptom | Reasoning path |
| --- | --- |
| Process exits before listening | Read startup errors; Joi rejects missing/invalid variables before HTTP initialization. Confirm JWT length, SMTP values, sender email, URLs. Do not print .env contents. |
| Database connection/health failure | Check process/container status, database reachability and correct host (`localhost` vs `postgres`), URL encoding, credentials, and database name. Health only tests connectivity. |
| Relation/table missing | Check migrations were applied to the same database URL as runtime. Client generation does not create tables. |
| Migration failure on legacy data | Inspect exact migration; academic backfill rejects unknown department names and UUID conversion rejects non-UUID leftovers. Diagnose data on a copy, not with destructive reset. |
| Schema drift | Compare current schema with applied SQL, especially Student.departmentId. Do not assume TypeScript string types expose native column differences. |
| Prisma imports/module errors | Regenerate client; inspect generator moduleFormat=cjs against package ESM/nodenext and emitted files. Separate compile success from runtime import success. |
| 401 login | Check account existence, password, lockout, and active state. Existing seed account is not overwritten on reseed. |
| 401 protected route | Verify bearer header, expiry, and matching signing/verification secret. A refresh token is not an access JWT. |
| 403 | Inspect required role metadata and token role, then service self-management restrictions. Token role may predate account role changes. |
| 400 | Inspect DTO field names/types, UUID/date syntax, numeric ranges, and unknown fields; valid IDs may still violate foreign keys. |
| 404 current semester | Set-current is an explicit admin action; date ranges do not automatically activate a semester. |
| 409 | Read unique keys, not just pre-checks; dropped registrations still occupy their tuple. |
| `isActive=false` returns active users | QueryUserDto Boolean conversion treats a nonempty string as true. This is a code contract issue, not database corruption. |
| Audit pagination fails | Inline query types do not convert/validate numeric strings; compare default no-query call with explicit parameters in a disposable environment. |
| Registration reports failure but email exists | SMTP/audit can fail after account creation; inspect partial state instead of repeatedly submitting signup. |
| Attendance correction has no effect | createMany skips duplicates rather than updating. Compare exact timestamp and the stored unique key. |
| API container exits | Inspect `docker compose logs --tail=100 api`; migration failure prevents node startup. A port setting differing from mapping can make a running app unreachable. |
| Port already in use | Identify the process/container publishing 3000 or 5432, then choose a consistent free mapping/PORT. Avoid starting host API and Compose API on the same port. |
| E2E fails but unit tests pass | Unit mocks do not use database/real guards. Confirm dedicated test env, migrations, seed, login response, and test bootstrap differences. |
| CI differs from local | Compare Node 24, locked install flag, generated client, clean database, case-sensitive Linux paths, and environment injection. |

Use `npm run start:debug` to pause around service entry/Prisma calls. Log only safe identifiers and operation names; exclude credentials, token bodies, and sensitive student data. For a container, start with process logs and health requests before changing code.

## Prepare a reviewable change

Explain the concrete before/after behavior, migrations and data implications, access rules, and tests. Run lint/unit tests and relevant database/HTTP checks; build when code changes. Keep generated docs/source references current. Do not equate “tests pass” with coverage of a new rule that the tests never assert.

## What to remember

- Follow one request across boundaries to localize failures.
- New configuration has multiple consumers and forwarding points.
- Schema changes require migration/data review, not only generation.
- Debugging should not expose secrets or reset valuable data.
- Tests must assert the behavior being changed.

## Check your understanding

1. Which files must change when adding an environment variable used in Compose?
2. Why can rebuilding fail to solve a missing-table error?
3. How would you distinguish an authentication failure from a role failure?

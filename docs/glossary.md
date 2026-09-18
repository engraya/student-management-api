# Glossary

[Home](README.md) · [Quick reference](reference.md)

| Term | Meaning in this project |
| --- | --- |
| API | HTTP interface clients call to manage identity and academic data |
| REST | Resource-oriented HTTP conventions; this API also has action routes such as drop |
| CRUD | Create, read, update, delete; basic student/catalog operations |
| Module | Nest registration boundary for controllers/providers/imports, not a separate process |
| Controller | Class mapping HTTP requests to methods |
| Service/provider | Injectable class containing use cases or infrastructure behavior |
| Dependency injection (DI) | Receiving dependencies through construction instead of manually creating them |
| IoC container | Nest's mechanism for resolving and constructing the provider graph |
| Decorator | Syntax attaching behavior/metadata to a class/member/parameter; requires runtime consumers where applicable |
| Metadata | Information such as route mapping or required roles read by Nest/guards |
| Middleware | HTTP pipeline function, such as Helmet, executing around request processing |
| Guard | Request admission check, such as JWT or required roles |
| Strategy | Passport's named authentication implementation; JWT is registered here |
| Pipe | Argument transformation/validation, such as UUID parsing |
| DTO | Data Transfer Object; decorated input class used for runtime request checks |
| Interface | TypeScript compile-time shape, erased at runtime |
| Serialization | Turning returned objects into JSON for HTTP; no global custom serializer is configured |
| Exception filter | Converts selected thrown errors into HTTP responses |
| ORM | Object-relational mapping/query layer; Prisma exposes models as typed database operations |
| Model/entity | Schema representation of stored records, such as Student |
| Primary key | Unique row identifier, usually id here |
| UUID | Identifier format; UUID-valued strings and native database UUID columns are distinct |
| Foreign key | Database constraint requiring a referenced parent row |
| Unique constraint | Prevents duplicate values/tuples even under concurrent inserts |
| Composite key | Key involving multiple fields, such as student/course/semester uniqueness |
| Index | Lookup structure improving some queries at storage/write cost |
| Cascade | Related rows are automatically affected by a parent operation, such as student deletion |
| Restrict | Prevents parent deletion while dependent references exist |
| Migration | Ordered SQL change to database structure/data |
| Seed | Development fixture insertion, separate from schema migration |
| Transaction | Unit of database work committed or rolled back together |
| Isolation | Rules controlling interactions and visibility among concurrent transactions |
| Atomic consumption | Exactly one operation can transition a token from usable to used |
| Upsert | Update a matching record or insert when absent; seed uses empty updates |
| Offset pagination | Skip prior rows and take a bounded page |
| N+1 | Repeated per-record queries after a list query; measure before claiming it occurs |
| Authentication | Establishing an identity through credentials/token verification |
| Authorization | Deciding permitted actions after identity is established |
| RBAC | Role-based access control; ADMIN/STAFF route metadata here |
| Bearer token | Secret possession authorizes use; sent in Authorization header |
| JWT | Signed claim token; encoded payload is readable, not encrypted |
| Refresh token | Long-lived opaque credential used to issue new access tokens |
| Rotation | Replacing a refresh token and revoking its predecessor |
| Hash/salt | One-way digest and per-password randomization; bcrypt handles password hashing |
| CORS | Browser origin-access policy, not account authorization |
| CSRF | Cross-site request forgery; especially relevant if introducing ambient cookie credentials |
| XSS | Script injection into a client application; backend headers alone do not secure another frontend |
| SMTP | Protocol used by Nodemailer to submit identity emails |
| Outbox | Proposed durable database record of a side effect for later delivery; not implemented |
| Audit log | Stored account/security action evidence; not a complete HTTP trace |
| GPA/CGPA | Credit-weighted grade-point average for one semester/all results |
| Idempotency | Repeated operation has the same intended effect; not uniformly provided by POSTs |
| Image/container | Packaged runtime versus running instance |
| Volume | Persistent Docker-managed storage independent of containers |
| CI/CD | Automated quality integration / delivery activities; this CD publishes images only |
| Runner/job/step | GitHub execution host / unit of workflow / individual command or action |
| Registry | Image storage service; GHCR receives published builds |
| Reverse proxy | Front server forwarding traffic to API, often terminating TLS; not configured here |
| Liveness/readiness | Process-alive versus able-to-serve signals; only database health route is implemented |
| Observability | Ability to understand runtime behavior from logs/metrics/traces; current support is limited |
| Modular monolith | One deployed application organized into feature modules |
| Technical debt | Implementation limitations requiring future deliberate work, not automatically defects in every use case |

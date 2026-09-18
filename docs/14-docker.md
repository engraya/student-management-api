# 14. Docker and containers

[Home](README.md) · [Setup](02-project-setup.md) · [Delivery](15-delivery-and-production.md)

An image is a packaged filesystem and execution configuration. A container is a running instance of an image. A volume stores data independently of a container's writable filesystem. These distinctions matter because recreating an API container should be routine, while deleting the PostgreSQL volume destroys data.

## Read this Dockerfile stage by stage

[Dockerfile](../Dockerfile) has three stages, all based on `node:24-alpine`:

| Instruction/stage | Actual effect and reason |
| --- | --- |
| `FROM ... AS deps` | Starts dependency stage; names it for later copies |
| `WORKDIR /app` | Sets working directory for subsequent operations |
| `COPY package*.json ./` | Copies manifests before source so dependency layer can be reused |
| `RUN npm ci --legacy-peer-deps` | Installs full locked dependency tree at build time |
| `FROM ... AS builder` | Starts fresh build stage |
| `COPY --from=deps ...node_modules` | Reuses installed packages |
| `COPY . .` | Adds build context, filtered by .dockerignore |
| `RUN npx prisma generate` | Generates client from schema |
| `RUN npm run build` | Compiles application to dist |
| `FROM ... AS production` | Starts runtime stage with NODE_ENV=production |
| Copies from builder | Copies manifests, full node_modules, dist, prisma, generated source, Prisma config |
| Add group/user and `USER appuser` | Runs application under a non-root account |
| `EXPOSE 3000` | Documents intended container port; does not publish it |
| `CMD ["sh", "-c", ...]` | At container start: migrate deploy, then `node dist/main.js` if migration succeeded |

`RUN` executes while building; `CMD` defines startup behavior. No custom ENTRYPOINT is declared by this Dockerfile. The shell form inside CMD sequences migrations and node with `&&`, so a migration failure prevents the server from starting.

Multi-stage organization separates build inputs from runtime copies, but this image still includes development dependencies. This keeps Prisma CLI and Nodemailer available with current manifest placement. Do not simply switch to production-only installation without relocating/checking runtime dependencies. Shell startup and missing explicit Prisma shutdown handling also warrant a signal/draining test.

[.dockerignore](../.dockerignore) excludes node_modules, dist, git, `.env`/`.env.*`, coverage/log artifacts, README, Dockerfile, and Compose file from ordinary context copying. Secrets therefore need runtime injection. Review any additional sensitive files before adding them to the repository; ignore rules are not a secret scanner.

## Compose network and storage

[docker-compose.yml](../docker-compose.yml) runs `postgres:17-alpine` and a locally built `api`. PostgreSQL initializes from POSTGRES_DB/USER/PASSWORD, publishes host 5432, and persists under the named `postgres_data` volume. `pg_isready` runs every five seconds with configured timeout/retries/start period.

The API waits for the database service to be healthy, receives configuration explicitly, publishes host/container `3000:3000`, and uses `postgres` as its database hostname. Compose provides an implicit network and service-name resolution; no custom network is declared. `localhost` inside the API container refers to that API container, not the database container or your host.

Both services use `restart: unless-stopped`. This restarts processes; it is not a business-operation retry policy. Dependency health ordering helps initial startup but does not guarantee ongoing availability. There is no API healthcheck in Compose. `REFRESH_TOKEN_DAYS` is not forwarded, so the API container normally uses its default even if the host .env contains another value.

## Local workflow

```sh
docker compose up --build -d
docker compose ps
docker compose logs --tail=100 api
docker compose logs --tail=100 postgres
docker compose down
```

`up --build` builds/starts services; migrations run through the API CMD. `ps` checks process status; logs expose startup failures. `down` stops/removes the service containers and network while preserving the named volume by default. Do not add `-v` unless intentionally deleting the database volume. Seeding is separate from Docker startup; the image contains seed inputs, but does not run them automatically.

If the API is run on your host while only PostgreSQL is containerized, use `docker compose up -d postgres` and a localhost database URL. If changing API PORT, also update the container port mapping; the current mapping remains 3000 regardless of that variable.

## Production considerations

The Compose file is useful locally, not proof of a hardened hosted deployment. Restrict/remove host database exposure, manage secrets externally, provision backups, select a TLS/reverse-proxy setup, and consider a single controlled migration job before multiple replicas start. PostgreSQL initialization variables do not automatically change credentials inside an already initialized volume.

## What to remember

- Build-time generation/compilation differs from runtime migration/startup.
- EXPOSE does not publish a port; Compose ports does.
- Named volumes preserve data beyond container lifetimes.
- Service DNS names work inside the Compose network.
- Multi-stage does not necessarily mean production dependencies only.

## Check your understanding

1. Why can the image build successfully yet the container never start listening?
2. Why does changing POSTGRES_PASSWORD not necessarily change an existing database password?
3. What data survives `docker compose down` without `-v`?

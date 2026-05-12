# IWAP Docker Environment Design

## Goal

Make the local portfolio demo run reliably with `docker compose up --build`, even when Java, Maven, and Node are not installed on the host.

## Scope

This pass focuses on local demo stability:

- PostgreSQL with PGVector starts first and exposes a healthcheck.
- Spring Boot starts after the database is healthy and exposes a backend healthcheck.
- Next.js standalone starts after the backend is healthy.
- Frontend public API settings are passed at image build time and runtime.
- Docker build contexts exclude local caches and generated artifacts.
- Documentation explains how to run, inspect, stop, and reset the environment.

## Architecture

`docker-compose.yml` remains the single entrypoint for the local demo. The backend image is built with Maven inside Docker, so host Java and Maven are optional. The frontend image is built with Node inside Docker, and `NEXT_PUBLIC_IWAP_API_BASE_URL` is supplied as a build argument so browser-side calls point to the host-facing backend URL.

## Components

- `postgres`: `pgvector/pgvector:pg16`, named volume, readiness check with `pg_isready`.
- `backend`: Spring Boot JAR, waits for Postgres, checks `GET /api/health`.
- `frontend`: Next.js standalone server, waits for backend, checks `GET /`.
- `.env.example`: documents ports and browser-facing URLs.
- `.dockerignore`: keeps images reproducible and avoids sending generated artifacts as build context.

## Error Handling

Compose service healthchecks make startup order visible. If a service fails, the user can inspect `docker compose logs <service>` and rerun after fixing env values. Database data persists in `iwap-postgres-data`; reset instructions are documented.

## Testing

Host validation:

- `npm run typecheck`
- `npm run build`

Docker validation when Docker is installed:

- `docker compose config`
- `docker compose up --build`
- `docker compose ps`
- `curl http://localhost:8080/api/health`
- Browser smoke check at `http://localhost:3000`

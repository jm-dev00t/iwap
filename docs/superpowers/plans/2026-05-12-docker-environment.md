# Docker Environment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make IWAP's local Docker environment reliable for one-command portfolio demo startup.

**Architecture:** Keep Docker Compose as the local orchestrator. Add service healthchecks, build-time frontend public env wiring, lightweight build contexts, and operator documentation without changing application behavior.

**Tech Stack:** Docker Compose, Spring Boot 3.4, Maven, PostgreSQL 16 with PGVector, Next.js 15 standalone, Node 22.

---

### Task 1: Compose Runtime Hardening

**Files:**
- Modify: `docker-compose.yml`
- Modify: `.env.example`

- [x] **Step 1: Add explicit env-backed ports and frontend build args**

Use `${IWAP_BACKEND_PORT:-8080}` and `${IWAP_FRONTEND_PORT:-3000}` for host ports. Pass `NEXT_PUBLIC_IWAP_API_BASE_URL` and `NEXT_PUBLIC_IWAP_WS_URL` under `frontend.build.args`.

- [x] **Step 2: Add backend and frontend healthchecks**

Backend healthcheck should call `http://localhost:8080/api/health`. Frontend healthcheck should call `http://localhost:3000`.

- [x] **Step 3: Add conservative restart policy**

Use `restart: unless-stopped` for services that should survive transient local failures.

### Task 2: Docker Build Context Cleanup

**Files:**
- Create: `backend/.dockerignore`
- Create: `frontend/.dockerignore`

- [x] **Step 1: Exclude generated artifacts**

Ignore `target`, `.next`, `node_modules`, logs, env files, editor folders, and package manager caches.

- [x] **Step 2: Keep lockfiles and source included**

Do not ignore `package-lock.json`, `pom.xml`, `src`, or config files needed for reproducible builds.

### Task 3: Frontend Build-Time Env Wiring

**Files:**
- Modify: `frontend/Dockerfile`

- [x] **Step 1: Add build arguments**

Declare `ARG NEXT_PUBLIC_IWAP_API_BASE_URL` and `ARG NEXT_PUBLIC_IWAP_WS_URL` in the build stage.

- [x] **Step 2: Export args as build env**

Set matching `ENV` entries before `npm run build`, because Next.js embeds `NEXT_PUBLIC_*` values into browser bundles at build time.

- [x] **Step 3: Preserve runtime env**

Set the same env defaults in the runner stage for server-side reads and operational clarity.

### Task 4: Documentation and Verification

**Files:**
- Modify: `docs/deployment.md`
- Modify: `docs/local-dev-checklist.md`

- [x] **Step 1: Document Docker commands**

Include start, status, logs, stop, and reset commands.

- [x] **Step 2: Document current host limitation**

State that Docker verification requires Docker Desktop or compatible Docker CLI in PATH.

- [x] **Step 3: Run available verification**

Run `npm run typecheck` and `npm run build` in `frontend`. Run Docker commands only when Docker is available.

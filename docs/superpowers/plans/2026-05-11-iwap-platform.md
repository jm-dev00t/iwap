# IWAP Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a portfolio-grade Intelligent Workflow Automation Platform scaffold that demonstrates hybrid B2B AI workflow automation.

**Architecture:** Start contract-first with docs, API/event models, and a minimal agent orchestration slice. Backend, frontend, integration adapters, and documentation can then proceed in parallel because they depend on stable workflow and event contracts.

**Tech Stack:** Spring Boot 3.4.x, Spring AI, PostgreSQL + PGVector, Next.js 15, TypeScript, shadcn/ui-style components, TanStack Query, Docker Compose.

---

### Task 1: Contract And Documentation Foundation

**Files:**
- Create: `docs/architecture.md`
- Create: `docs/api-contract.md`
- Create: `docs/demo-scenarios.md`
- Create: `docs/business-impact.md`
- Create: `docs/technical-decisions.md`
- Create: `docs/security-and-operations.md`
- Create: `docs/design-system.md`

- [ ] Define workflow states, agent types, tool-call event shape, and approval event shape.
- [ ] Document the hybrid integration model for REST, DB view, CSV/Excel, and webhook adapters.
- [ ] Write portfolio-focused demo narratives for the four required scenarios.
- [ ] Convert the supplied warm editorial design reference into an IWAP-specific UI system.

### Task 2: Backend Foundation

**Files:**
- Create: `backend/pom.xml`
- Create: `backend/src/main/resources/application.yml`
- Create: `backend/src/main/java/com/iwap/IwapApplication.java`
- Create: `backend/src/main/java/com/iwap/domain/**`
- Create: `backend/src/main/java/com/iwap/application/**`
- Create: `backend/src/test/java/com/iwap/application/workflow/WorkflowOrchestratorTest.java`

- [ ] Write a failing orchestration test for the monthly sales report request.
- [ ] Implement minimal domain records and the orchestrator to pass the test.
- [ ] Add Swagger, validation, WebSocket, JPA, Flyway, PostgreSQL, PGVector, and Spring AI dependencies.

### Task 3: Frontend Foundation

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/app/**`
- Create: `frontend/components/**`
- Create: `frontend/lib/**`

- [ ] Create the Next.js App Router shell.
- [ ] Build first-screen chat plus agent timeline layout.
- [ ] Add dashboard, approval, history, and demo route placeholders.

### Task 4: Infrastructure And Samples

**Files:**
- Create: `docker-compose.yml`
- Create: `.env.example`
- Create: `backend/src/main/resources/db/migration/**`
- Create: `backend/src/main/resources/samples/**`

- [ ] Add PostgreSQL with PGVector extension.
- [ ] Add backend and frontend service definitions.
- [ ] Add sales, customer, inventory, and activity sample data.

### Task 5: Portfolio Packaging

**Files:**
- Create: `README.md`

- [ ] Add resume-ready project summary.
- [ ] Add Wishket/customer proposal summary.
- [ ] Add architecture diagram, demo flow, setup commands, and extension notes.

### Parallelization Notes

After Task 1, tracks can run in parallel:

- Track A: Backend foundation and API.
- Track B: Agent orchestration and tool interfaces.
- Track C: PostgreSQL, PGVector, Flyway, and sample data.
- Track D: Next.js UI surfaces.
- Track E: README and business documentation.

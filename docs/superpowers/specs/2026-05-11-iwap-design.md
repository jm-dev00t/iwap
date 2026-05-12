# IWAP Portfolio Design

## Positioning

Intelligent Workflow Automation Platform (IWAP) is a hybrid B2B automation platform for small and midsize companies. It looks and feels like a SaaS product, but its integration layer is designed so an SI team can attach it to a customer's existing ERP, CRM, groupware, Excel files, and messaging tools.

The portfolio goal is to make the value visible in minutes: a user writes a natural-language business request, multiple AI agents plan and execute the workflow, risky steps request human approval, and every decision is visible through live progress, reports, and audit logs.

## Primary Demo

The lead demo is monthly sales reporting:

1. A manager enters "이번 달 매출 보고서 만들어서 슬랙 채널과 이메일로 보내줘".
2. Planner Agent converts the request into a structured workflow plan.
3. Executor Agent reads sales sample data and invokes report, Slack, and Email tools.
4. Validator Agent checks that required report sections and delivery targets exist.
5. Reporter Agent creates a concise executive summary and report artifact.
6. Notifier Agent publishes delivery results.
7. The dashboard streams the full agent timeline and stores an audit trail.

Secondary demos cover customer onboarding, low-stock purchasing alerts, and weekly sales performance reporting.

## Architecture

The backend uses Spring Boot 3.4.x and Spring AI with a clean architecture layout:

- `domain`: workflow, agent, tool, approval, audit, and memory models.
- `application`: use cases, orchestration services, and business policies.
- `infrastructure`: persistence, AI provider, connectors, WebSocket, and security adapters.
- `interfaces`: REST controllers, WebSocket contracts, and DTOs.

The frontend uses Next.js 15 App Router with TypeScript, shadcn/ui-style components, TanStack Query, and a WebSocket client. The first screen combines a chat command surface with a live agent timeline so the core concept is immediately visible.

## Frontend Design System

IWAP uses a warm editorial enterprise design system documented in `docs/design-system.md`. The UI borrows the feeling of a considered AI product interface: warm canvas, coral primary actions, dark execution surfaces, and readable serif display headings. It does not reuse third-party brand marks or proprietary identity assets.

The design must still behave like an operations product. The home screen is the command center itself, not a marketing landing page. Dense workflow data, approvals, timelines, reports, and audit logs take priority over decorative content.

## Integration Model

Agents never call vendor APIs directly. They call tool interfaces. Tool implementations are adapters that can run in mock mode for demos or real mode when credentials are supplied.

Supported integration patterns:

- REST API adapter for ERP, CRM, groupware, and commerce back offices.
- Database view adapter for read-only access to sales, inventory, and customer data.
- CSV/Excel adapter for companies that still operate through files.
- Webhook adapter for event-triggered workflow starts.
- Messaging adapters for Email, Slack, KakaoWork-style notifications, and future Teams support.

## Human-In-The-Loop

IWAP asks for approval before high-impact actions such as external broadcast emails, purchase requests, bulk customer notifications, or workflows over a configurable confidence threshold. Approval decisions are recorded in the audit log and reflected in the live workflow timeline.

## Portfolio Requirements

The project must include:

- Docker Compose for backend, frontend, PostgreSQL, and PGVector.
- Swagger/OpenAPI documentation.
- Sample data that feels like a real SMB operation.
- README sections for business impact, demo scenarios, architecture, setup, and resume/marketplace summaries.
- Security and operations notes covering roles, API keys, retries, audit logs, and cost controls.

## Initial Scope

The first implementation pass creates a working scaffold and a small executable orchestration slice. It does not attempt full production-grade vendor integrations. Instead, it proves the architecture with mock providers that can be replaced by real adapters.

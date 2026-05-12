# Security And Operations

## Access Control

The initial portfolio build uses demo JWT-style roles:

- `MANAGER`: Starts workflows, approves or rejects high-impact actions, seeds demo data, and views operational records.
- `OPERATOR`: Starts workflows and views operational records.
- `VIEWER`: Views operational records only.

Demo tokens are issued by `POST /api/auth/demo-login` and must be sent as `Authorization: Bearer <token>` for protected API calls. This is intentionally lightweight for portfolio demonstration; a production deployment should replace it with an identity provider, short-lived access tokens, refresh-token rotation, and organization-scoped authorization rules.

Current API policy:

- Public: `/api/auth/demo-login`, `/api/health`, Swagger/OpenAPI, actuator endpoints.
- `MANAGER`: approval approve/reject endpoints and demo scenario seeding.
- `MANAGER` or `OPERATOR`: workflow creation.
- Any authenticated demo role: read-oriented `/api/**` endpoints.

## Human Approval

Approval is required for external broadcast messages, purchase requests, high-cost AI runs, and low-confidence plans. Approval decisions are immutable audit events.

## Secrets

API keys are loaded from environment variables. The repository provides `.env.example` only.

## Audit Trail

Every agent decision, tool call, approval decision, generated report, and notification result is recorded. The audit trail is part of the core product story because enterprise automation must be controllable.

## API Error Responses

REST controllers use standard `ProblemDetail` responses for validation and missing-resource errors. This keeps frontend handling predictable and gives API reviewers a cleaner Swagger experience.

## Cost Control

The AI provider layer supports mock mode, model selection, prompt templates, and future token usage tracking. Demo mode defaults to mock AI so the project runs without paid credentials.

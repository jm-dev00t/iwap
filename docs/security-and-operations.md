# Security And Operations

## Access Control

The initial portfolio build uses demo JWT-style roles:

- `ADMIN`: Manages settings, providers, and audit searches.
- `MANAGER`: Starts workflows and approves high-impact actions.
- `OPERATOR`: Starts safe workflows and views assigned results.

## Human Approval

Approval is required for external broadcast messages, purchase requests, high-cost AI runs, and low-confidence plans. Approval decisions are immutable audit events.

## Secrets

API keys are loaded from environment variables. The repository provides `.env.example` only.

## Audit Trail

Every agent decision, tool call, approval decision, generated report, and notification result is recorded. The audit trail is part of the core product story because enterprise automation must be controllable.

## Cost Control

The AI provider layer supports mock mode, model selection, prompt templates, and future token usage tracking. Demo mode defaults to mock AI so the project runs without paid credentials.

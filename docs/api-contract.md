# IWAP API Contract

## REST

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/workflows/runs` | Start a workflow from a natural-language command. |
| `GET` | `/api/workflows/runs/{runId}` | Read run summary, status, steps, and generated artifacts. |
| `GET` | `/api/workflows/runs` | List workflow history. |
| `GET` | `/api/approvals` | List pending human-in-the-loop approval requests. |
| `POST` | `/api/approvals/{approvalId}/approve` | Approve a human-in-the-loop request. |
| `POST` | `/api/approvals/{approvalId}/reject` | Reject a human-in-the-loop request. |
| `GET` | `/api/audit-logs` | Search workflow and tool-call audit logs. |
| `GET` | `/api/demo-scenarios` | List portfolio demo scenarios. |
| `POST` | `/api/demo-scenarios/seed` | Seed all demo workflow runs for dashboard presentation. |
| `GET` | `/api/tools` | List registered workflow tool adapters. |

## Workflow Run Request

```json
{
  "command": "이번 달 매출 보고서 만들어서 슬랙 채널과 이메일로 보내줘",
  "scenarioKey": "monthly-sales-report",
  "requestedBy": "manager@demo-company.com"
}
```

## WebSocket Event

```json
{
  "runId": "run_20260511_001",
  "sequence": 7,
  "agentType": "EXECUTOR",
  "eventType": "TOOL_CALL_COMPLETED",
  "message": "Slack notification was delivered to #sales-report.",
  "metadata": {
    "toolName": "slack",
    "durationMs": 420
  },
  "occurredAt": "2026-05-11T19:55:00+09:00"
}
```

## Agent Types

- `PLANNER`
- `EXECUTOR`
- `VALIDATOR`
- `REPORTER`
- `NOTIFIER`

## Workflow States

- `QUEUED`
- `PLANNING`
- `WAITING_FOR_APPROVAL`
- `EXECUTING`
- `VALIDATING`
- `REPORTING`
- `NOTIFYING`
- `COMPLETED`
- `FAILED`
- `REJECTED`

# IWAP API Contract

## REST

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/assistant/chat` | Send a chatbot message and receive a missing-info question or executable plan. |
| `POST` | `/api/assistant/plans/{planId}/execute` | Execute an approved assistant plan. |
| `POST` | `/api/workflows/runs` | Start a workflow from a natural-language command. |
| `GET` | `/api/workflows/runs/{runId}` | Read run summary, status, steps, and generated artifacts. |
| `GET` | `/api/workflows/runs` | List workflow history. |
| `POST` | `/api/approvals/{approvalId}/approve` | Approve a human-in-the-loop request. |
| `POST` | `/api/approvals/{approvalId}/reject` | Reject a human-in-the-loop request. |
| `GET` | `/api/audit-logs` | Search workflow and tool-call audit logs. |

## Workflow Run Request

## Assistant Chat Request

```json
{
  "sessionId": null,
  "message": "이번 달 매출 보고서 만들어서 manager@demo-company.com으로 보내줘"
}
```

## Assistant Chat Response

```json
{
  "sessionId": "chat-...",
  "assistantMessage": "실행 계획을 만들었습니다. 외부 발송이 포함되어 있어 실행 전 확인이 필요합니다.",
  "state": "PLAN_READY",
  "plan": {
    "id": "plan-...",
    "summary": "월간 매출 보고서를 생성하고 승인 후 이메일로 발송합니다.",
    "missingFields": [],
    "requiresApproval": true,
    "scenarioKey": "monthly-sales-report",
    "actions": [
      { "order": 1, "toolName": "sales-data", "title": "월간 매출 데이터 조회", "external": false },
      { "order": 2, "toolName": "report-generator", "title": "월간 매출 보고서 생성", "external": false },
      { "order": 3, "toolName": "email", "title": "보고서 이메일 발송", "external": true }
    ]
  },
  "missingFields": [],
  "run": null
}
```

## Assistant Plan Execute Request

```json
{
  "approved": true
}
```

## Legacy Workflow Run Request

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

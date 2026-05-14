# 배포 전 테스트 시나리오

이 문서는 IWAP 데모 배포 전에 실제로 확인해야 할 기능, 입력값, 기대 결과를 정리합니다.

## 테스트 환경

기본 Docker 실행 기준입니다.

| 항목 | 주소 |
| --- | --- |
| 프론트엔드 | `http://localhost:3000` |
| 백엔드 API | `http://localhost:8080` |
| Swagger UI | `http://localhost:8080/swagger-ui.html` |
| 상태 확인 | `http://localhost:8080/api/health` |
| PostgreSQL | `localhost:5432` |

## 사전 확인 명령

```powershell
docker compose ps
Invoke-RestMethod http://localhost:8080/api/health
Invoke-WebRequest http://localhost:3000 -UseBasicParsing
```

기대 결과:

- `postgres`, `backend`, `frontend`가 모두 `Up` 상태입니다.
- `postgres`는 `healthy` 상태입니다.
- 상태 확인 응답은 `{"status":"UP","service":"iwap-backend"}`입니다.
- 프론트 첫 화면에 `지능형 워크플로 자동화 플랫폼`과 `워크플로 실행` 버튼이 보입니다.

## 자동 검증 명령

4개 핵심 시나리오를 한 번에 검증합니다.

```powershell
@'
const scenarios = [
  ['monthly-sales-report', '이번 달 매출 보고서 만들어서 슬랙 채널과 이메일로 보내줘', 'manager@demo-company.com'],
  ['customer-onboarding', '신규 고객 등록 후 환영 이메일 보내고, 고객 관리 시스템에 기록하고, 담당자에게 알림', 'sales@demo-company.com'],
  ['low-inventory', '재고 부족 제품 리스트 뽑아서 구매팀 카카오톡으로 보내', 'operator@demo-company.com'],
  ['weekly-sales-report', '주간 영업 실적 분석해서 PDF 리포트 생성 후 공유', 'manager@demo-company.com'],
];

for (const [scenarioKey, command, requestedBy] of scenarios) {
  const res = await fetch('http://localhost:8080/api/workflows/runs', {
    method: 'POST',
    headers: {'content-type': 'application/json; charset=utf-8'},
    body: JSON.stringify({ scenarioKey, command, requestedBy }),
  });
  const body = await res.json();
  console.log(JSON.stringify({
    scenarioKey,
    http: res.status,
    title: body.title,
    status: body.status,
    events: body.events?.length,
    toolCalls: body.toolCalls?.map(t => t.toolName),
    approvals: body.approvals?.length,
    artifacts: body.artifacts?.map(a => ({ title: a.title, format: a.format })),
  }, null, 2));
}
'@ | node --input-type=module
```

기대 결과:

| scenarioKey | HTTP | title | status | 도구 호출 | 승인 | 산출물 |
| --- | ---: | --- | --- | --- | ---: | --- |
| `monthly-sales-report` | 201 | `Monthly Sales Report Automation` | `COMPLETED` | `sales-data`, `report-generator`, `slack`, `email` | 0 | `MARKDOWN` 1건 |
| `customer-onboarding` | 201 | `New Customer Onboarding` | `COMPLETED` | `crm`, `email`, `slack` | 0 | 없음 |
| `low-inventory` | 201 | `Low Inventory Purchasing Alert` | `WAITING_FOR_APPROVAL` | 없음 | 1 | 없음 |
| `weekly-sales-report` | 201 | `Weekly Sales Performance Report` | `COMPLETED` | `sales-data`, `report-generator`, `email` | 0 | `PDF` 1건 |

## 시나리오 1. 월간 매출 보고서 실행

목적: 정상 완료형 워크플로가 보고서 산출물까지 생성되는지 확인합니다.

입력값:

| 필드 | 값 |
| --- | --- |
| `scenarioKey` | `monthly-sales-report` |
| `command` | `이번 달 매출 보고서 만들어서 슬랙 채널과 이메일로 보내줘` |
| `requestedBy` | `manager@demo-company.com` |

기대 결과:

- API 상태는 `201`입니다.
- 응답 상태는 `COMPLETED`입니다.
- 이벤트는 5개입니다.
- 도구 호출은 `sales-data`, `report-generator`, `slack`, `email` 4개입니다.
- 보고서 화면에는 `월간 매출 보고서 자동화` 산출물이 표시됩니다.

## 시나리오 2. 신규 고객 온보딩 실행

목적: 월간 매출과 다른 고객 온보딩 흐름으로 라우팅되는지 확인합니다.

입력값:

| 필드 | 값 |
| --- | --- |
| `scenarioKey` | `customer-onboarding` |
| `command` | `신규 고객 등록 후 환영 이메일 보내고, 고객 관리 시스템에 기록하고, 담당자에게 알림` |
| `requestedBy` | `sales@demo-company.com` |

기대 결과:

- API 상태는 `201`입니다.
- 응답 상태는 `COMPLETED`입니다.
- API title은 `New Customer Onboarding`입니다.
- 도구 호출은 `crm`, `email`, `slack` 3개입니다.
- 승인 요청은 없습니다.

## 시나리오 3. 재고 부족 승인 대기 실행

목적: 구매팀 알림처럼 민감한 작업이 승인 대기 상태로 멈추는지 확인합니다.

입력값:

| 필드 | 값 |
| --- | --- |
| `scenarioKey` | `low-inventory` |
| `command` | `재고 부족 제품 리스트 뽑아서 구매팀 카카오톡으로 보내` |
| `requestedBy` | `operator@demo-company.com` |

기대 결과:

- API 상태는 `201`입니다.
- 응답 상태는 `WAITING_FOR_APPROVAL`입니다.
- API title은 `Low Inventory Purchasing Alert`입니다.
- 승인 요청이 1건 생성됩니다.
- 승인 전 도구 호출은 없습니다.

## 시나리오 4. 주간 영업 리포트 실행

목적: 주간 영업 리포트가 월간 매출과 다른 보고서 흐름으로 실행되는지 확인합니다.

입력값:

| 필드 | 값 |
| --- | --- |
| `scenarioKey` | `weekly-sales-report` |
| `command` | `주간 영업 실적 분석해서 PDF 리포트 생성 후 공유` |
| `requestedBy` | `manager@demo-company.com` |

기대 결과:

- API 상태는 `201`입니다.
- 응답 상태는 `COMPLETED`입니다.
- API title은 `Weekly Sales Performance Report`입니다.
- 도구 호출은 `sales-data`, `report-generator`, `email` 3개입니다.
- PDF 형식 산출물이 1건 생성됩니다.

## 시나리오 5. 프론트엔드 실행 버튼 확인

목적: 프론트 UI에서 백엔드 API 호출이 연결되어 있는지 확인합니다.

절차:

1. `http://localhost:3000`에 접속합니다.
2. 첫 번째 시나리오 버튼이 `월간 매출 보고서`인지 확인합니다.
3. `워크플로 실행` 버튼을 클릭합니다.
4. 다른 시나리오 버튼을 눌러 명령이 바뀌는지 확인합니다.

기대 결과:

- 버튼 클릭 후 실행 결과 카드가 표시됩니다.
- 실행 ID, 이벤트, 도구 호출 카드가 표시됩니다.
- 월간 매출 시나리오는 이벤트 5개, 도구 호출 4개입니다.
- 신규 고객 온보딩 시나리오는 도구 호출 3개입니다.
- 재고 부족 시나리오는 `승인 대기`로 표시됩니다.

## 시나리오 6. 승인함 확인

목적: 승인 대기 워크플로가 승인함에서 처리되는지 확인합니다.

절차:

1. 재고 부족 시나리오를 한 번 실행합니다.
2. `http://localhost:3000/approvals`에 접속합니다.
3. 승인 대기 항목이 보이는지 확인합니다.
4. `승인` 또는 `반려` 버튼을 클릭합니다.

기대 결과:

- 승인 또는 반려 버튼 클릭 후 항목 상태가 변경됩니다.
- API는 `/api/approvals/{approvalId}/approve` 또는 `/api/approvals/{approvalId}/reject`를 호출합니다.

## DB 리허설 데이터 적재

배포 전 리허설용 데이터는 아래 SQL 파일에 있습니다.

```text
backend/src/main/resources/db/seed/demo-test-data.sql
```

로컬 파일을 직접 흘려 넣을 때:

```powershell
Get-Content -Encoding UTF8 backend/src/main/resources/db/seed/demo-test-data.sql |
  docker compose exec -T postgres psql -U iwap -d iwap
```

적재 후 기대 데이터:

| 테이블 | 기대 건수 |
| --- | ---: |
| `workflow_runs` | 4 |
| `workflow_events` | 16 |
| `tool_calls` | 12 |
| `approval_requests` | 1 |
| `audit_logs` | 11 |
| `workflow_memories` | 4 |

## 현재 범위

- 슬랙, 이메일, 카카오워크, 고객 관리 시스템은 실제 외부 발송이 아니라 모의 어댑터입니다.
- 기본 데모에는 외부 API 키가 필요하지 않습니다.
- 화면은 한글 표시명을 사용하고, API 응답의 `title`, `status`, `toolName`은 계약값이라 영어/코드값이 포함됩니다.

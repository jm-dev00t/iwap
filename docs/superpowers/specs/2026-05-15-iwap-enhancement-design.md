# IWAP 기능 강화 설계 문서

**날짜:** 2026-05-15  
**작업자:** jm-dev00t  
**대상 브랜치:** codex/iwap-platform

---

## 배경

IWAP는 자연어 업무 자동화를 보여주는 포트폴리오 데모 플랫폼이다. 소스 분석 결과 다음 핵심 gap이 확인됐다:

- Agent 클래스들이 실제로 동작하지 않음 (WorkflowOrchestrator가 전부 하드코딩)
- 보고서 기반 원본 데이터를 화면에서 확인할 방법 없음
- OpenAI 플래너가 미완성 (자연어 → 계획 변환 없음)
- 외부 발송 어댑터 미구현 (Slack, Email)

---

## 작업 범위

### 제외 항목
- CSV 실제 읽기 및 보고서 수치 반영 (포트폴리오 범위 초과)
- JPA 기반 영속 이력 (메모리 저장소로 충분)

---

## Phase 1 — 병렬 작업 (3개)

### 1-A. 소스 데이터 뷰어 페이지 (프론트엔드)

**목적:** 보고서 생성에 사용되는 원본 데이터(CSV)를 화면에서 확인할 수 있게 한다.  
포트폴리오 시연 시 "이 데이터를 기반으로 보고서가 만들어졌습니다"를 보여주는 근거 화면.

**구현 위치:** `frontend/app/data/page.tsx`

**화면 구성:**
- 탭 구조: 매출 데이터 / 재고 데이터 / 고객 데이터 / 영업 활동
- 각 탭에 테이블 형태로 CSV 행 표시
- 컬럼 헤더, 행 수, 마지막 업데이트 일자 표시
- 디자인 시스템 준수 (크림 배경, 코랄 액션 컬러)

**데이터 흐름:**
- 백엔드 `GET /api/data-sources/{type}` API 추가
- 백엔드에서 `resources/samples/*.csv` 파일을 읽어 JSON 반환
- 프론트엔드 TanStack Query로 조회

**API 설계:**
```
GET /api/data-sources           → 사용 가능한 데이터 소스 목록
GET /api/data-sources/sales     → sales-data.csv 내용
GET /api/data-sources/inventory → inventory.csv 내용
GET /api/data-sources/customers → customers.csv 내용
GET /api/data-sources/weekly    → weekly-sales-activities.csv 내용
```

**응답 형태:**
```json
{
  "type": "sales",
  "label": "월간 매출 데이터",
  "rowCount": 12,
  "headers": ["month", "channel", "amount", "unit"],
  "rows": [["2026-01", "온라인", "12000000", "KRW"], ...]
}
```

**네비게이션:** 앱 셸 사이드바에 "데이터 소스" 메뉴 항목 추가

---

### 1-B. Agent 실제 동작 + 상태 기계 (백엔드)

**목적:** 5개 Agent 클래스(Planner, Executor, Validator, Reporter, Notifier)가 실제로 호출되는 구조로 전환.  
WorkflowOrchestrator의 하드코딩 로직을 Agent 위임 방식으로 리팩터링.

**상태 전환 흐름:**
```
QUEUED → PLANNING → [WAITING_FOR_APPROVAL] → EXECUTING → VALIDATING → REPORTING → NOTIFYING → COMPLETED
                                                                                              ↘ FAILED / REJECTED
```

**각 Agent 역할:**

| Agent | 입력 | 출력 | 상태 전환 |
|-------|------|------|----------|
| PlannerAgent | command, scenarioKey | WorkflowPlan | QUEUED → PLANNING |
| ExecutorAgent | WorkflowPlan, tools | List\<ToolCall\> | PLANNING → EXECUTING |
| ValidatorAgent | List\<ToolCall\> | ValidationResult | EXECUTING → VALIDATING |
| ReporterAgent | ValidationResult | ReportArtifact | VALIDATING → REPORTING |
| NotifierAgent | ReportArtifact | List\<DeliveryReceipt\> | REPORTING → NOTIFYING → COMPLETED |

**구현 방식:**
- 각 Agent의 `run(WorkflowContext)` 메서드 구현
- WorkflowOrchestrator는 Agent를 순서대로 호출하는 파이프라인 역할
- 시나리오별 분기는 PlannerAgent가 담당
- 승인 필요 시나리오: PlannerAgent가 `requiresApproval=true` 반환 → 상태 `WAITING_FOR_APPROVAL`로 전환
- 기존 데모 데이터 생성 로직은 Agent 내부로 이동

**이벤트 발행:** 각 상태 전환 시 WebSocket 이벤트 발행 유지

---

### 1-C. Slack/Email 실제 발송 어댑터 (백엔드 인프라)

**목적:** `IWAP_INTEGRATION_MODE=real` 설정 시 실제 Slack/Email 발송.

**구현 위치:**
- `infrastructure/delivery/SlackDeliveryAdapter.java`
- `infrastructure/delivery/EmailDeliveryAdapter.java`
- `infrastructure/delivery/MockDeliveryAdapter.java` (기존 로직 이동)

**인터페이스 설계:**
```java
public interface DeliveryAdapter {
    DeliveryReceipt send(DeliveryRequest request);
    String provider(); // "slack", "email", "mock"
}
```

**Slack 구현:**
- HTTP POST to `https://slack.com/api/chat.postMessage`
- `SLACK_BOT_TOKEN`, `SLACK_DEFAULT_CHANNEL` 환경변수 사용
- 실패 시 `DeliveryReceipt.status = FAILED`로 기록, 예외 미전파

**Email 구현:**
- Spring Boot `spring-boot-starter-mail` 사용
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD` 환경변수
- HTML 이메일 템플릿 (보고서 요약 포함)
- 실패 시 동일하게 FAILED 기록

**선택 로직:** `IWAP_INTEGRATION_MODE` 값에 따라 `@ConditionalOnProperty`로 빈 주입

---

## Phase 2 — 순차 작업 (Agent 완료 후)

### 2-A. OpenAI 플래너 완성

**목적:** `IWAP_AI_PROVIDER=openai` 설정 시 실제 자연어 → 실행 계획 변환.

**의존성:** Phase 1-B (Agent 동작) 완료 후 진행.

**구현 위치:** `application/assistant/OpenAiAssistantPlanner.java`

**동작 흐름:**
1. 사용자 자연어 입력 수신
2. Spring AI `ChatClient`로 GPT에 system prompt + 사용자 메시지 전송
3. GPT 응답을 `AssistantPlan` 구조로 파싱 (JSON mode 또는 structured output)
4. 부족한 정보 있을 시 follow-up 질문 반환 (`AssistantState.ASKING`)
5. 정보 충족 시 계획 확정 (`AssistantState.PLAN_READY`)

**System Prompt 핵심 내용:**
- 사용 가능한 시나리오 목록 (monthly-sales-report, low-inventory, customer-onboarding, weekly-sales-report)
- 사용 가능한 도구 목록 (ToolRegistry 기반)
- 응답 형식 (JSON)

**Mock 폴백 유지:** `IWAP_AI_PROVIDER=mock`이면 기존 MockAssistantPlanner 동작

---

## 작업 현황 추적

각 Phase/작업 완료 시 `README.md` 하단 "작업 현황" 섹션 업데이트.

업데이트 형식:
```markdown
## 작업 현황

| 작업 | 상태 | 완료일 |
|------|------|--------|
| 소스 데이터 뷰어 페이지 | ✅ 완료 | 2026-05-xx |
| Agent 실제 동작 + 상태 기계 | 🚧 진행 중 | - |
| Slack/Email 실제 발송 | ⏳ 대기 | - |
| OpenAI 플래너 완성 | ⏳ 대기 | - |
```

---

## CLAUDE.md 생성

프로젝트 루트에 `CLAUDE.md` 생성. 포함 내용:
- 프로젝트 개요 (한 줄)
- 기술 스택 요약
- 로컬 실행 방법
- 코드 규칙 (계층 구조 준수, 한국어 주석 허용, 하드코딩 금지)
- 작업 현황 업데이트 규칙 (작업 완료 시 README.md 갱신)

---

## 비기능 요구사항

- 모든 신규 API는 인증 불필요 (조회 전용)
- 기존 데모 시나리오 동작은 유지 (하위 호환)
- 디자인 시스템 (`docs/design-system.md`) 준수
- 새 환경변수는 `.env.example`에 추가

# IWAP Enhancement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 소스 데이터 뷰어 페이지 추가, Agent 실제 파이프라인 연결, OpenAI 플래너 멀티턴 대화 지원.

**Architecture:** WorkflowOrchestrator가 hardcoded run 생성 대신 Agent 파이프라인(Planner→Executor→Validator→Reporter→Notifier)을 순서대로 호출하도록 전환. NotifierAgent가 DeliveryService를 직접 호출해 Slack/Email 발송 연결. 새 DataSource API가 CSV 파일을 읽어 프론트엔드 데이터 뷰어 페이지에 제공.

**Tech Stack:** Spring Boot 3.4.x / Java 21, Next.js / TypeScript / TanStack Query, AssertJ + JUnit 5 (백엔드 테스트), Spring AI (OpenAI 연동)

> **참고:** DeliveryService는 Slack/Email 실제 발송 코드가 이미 구현되어 있음. Task 2에서 NotifierAgent가 이를 호출하면 자동으로 활성화됨.

---

## 파일 맵

### Task 1 — DataSource Viewer

| 구분 | 경로 | 역할 |
|------|------|------|
| Create | `backend/src/main/java/com/iwap/application/datasource/DataSourceService.java` | CSV 파일 읽기 서비스 |
| Create | `backend/src/main/java/com/iwap/application/datasource/DataSourceResult.java` | 서비스 반환 타입 (application 계층) |
| Create | `backend/src/main/java/com/iwap/interfaces/api/datasource/DataSourceController.java` | GET /api/data-sources 컨트롤러 |
| Create | `backend/src/test/java/com/iwap/application/datasource/DataSourceServiceTest.java` | 서비스 단위 테스트 |
| Create | `frontend/app/data/page.tsx` | 데이터 뷰어 페이지 |
| Modify | `frontend/components/app-shell.tsx` | 사이드바에 "데이터 소스" 메뉴 추가 |
| Modify | `frontend/lib/api.ts` | 데이터 소스 API 함수 추가 |

### Task 2 — Agent Pipeline

| 구분 | 경로 | 역할 |
|------|------|------|
| Modify | `backend/src/main/java/com/iwap/application/agent/NotifierAgent.java` | DeliveryService 주입, 실제 발송 처리 |
| Modify | `backend/src/main/java/com/iwap/application/agent/ReporterAgent.java` | 시나리오별 한국어 보고서 생성 |
| Modify | `backend/src/main/java/com/iwap/application/workflow/WorkflowOrchestrator.java` | Agent 파이프라인으로 전환 |
| Modify | `backend/src/test/java/com/iwap/application/workflow/WorkflowOrchestratorTest.java` | 파이프라인 동작 검증 |

### Task 3 — OpenAI 플래너 멀티턴

| 구분 | 경로 | 역할 |
|------|------|------|
| Modify | `backend/src/main/java/com/iwap/application/assistant/AssistantSession.java` | messages 리스트 추가 |
| Modify | `backend/src/main/java/com/iwap/application/assistant/AssistantService.java` | 메시지 히스토리 세션 저장 |
| Modify | `backend/src/main/java/com/iwap/application/assistant/OpenAiAssistantPlanner.java` | 대화 히스토리 프롬프트 전달 |
| Modify | `backend/src/test/java/com/iwap/application/assistant/AssistantServiceTest.java` | 멀티턴 시나리오 테스트 |

---

## Task 1: DataSource Viewer (독립 — 병렬 가능)

### 1-A. 백엔드 DataSourceService

**Files:**
- Create: `backend/src/main/java/com/iwap/application/datasource/DataSourceService.java`
- Create: `backend/src/main/java/com/iwap/application/datasource/DataSourceResult.java`
- Create: `backend/src/main/java/com/iwap/interfaces/api/datasource/DataSourceController.java`
- Create: `backend/src/test/java/com/iwap/application/datasource/DataSourceServiceTest.java`

- [ ] **Step 1: 실패하는 테스트 작성**

```java
// DataSourceServiceTest.java
package com.iwap.application.datasource;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

class DataSourceServiceTest {

    private final DataSourceService service = new DataSourceService();

    @Test
    void availableSourcesReturnsAllFourTypes() {
        var sources = service.availableSources();
        assertThat(sources).extracting("type")
                .containsExactlyInAnyOrder("sales", "inventory", "customers", "weekly");
    }

    @Test
    void loadSalesReturnsRowsWithCorrectHeaders() {
        var response = service.load("sales");
        assertThat(response.headers()).containsExactly("month", "channel", "revenue", "orders", "gross_margin");
        assertThat(response.rows()).isNotEmpty();
    }

    @Test
    void loadUnknownTypeThrowsIllegalArgument() {
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> service.load("unknown"))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```powershell
cd backend
mvn test -pl . -Dtest=DataSourceServiceTest -q
```
Expected: FAIL with `class not found` or compilation error.

- [ ] **Step 3: DataSourceResult DTO 작성**

```java
// DataSourceResult.java
package com.iwap.interfaces.api.datasource;

// 데이터 소스 조회 응답 DTO
import java.util.List;

public record DataSourceResult(
        String type,
        String label,
        int rowCount,
        List<String> headers,
        List<List<String>> rows
) {
    public static DataSourceResult of(String type, String label, List<String> headers, List<List<String>> rows) {
        return new DataSourceResult(type, label, rows.size(), headers, rows);
    }
}
```

- [ ] **Step 4: DataSourceService 구현**

```java
// DataSourceService.java
package com.iwap.application.datasource;

// CSV 샘플 파일을 읽어 데이터 소스 목록과 내용을 반환하는 서비스
import com.iwap.interfaces.api.datasource.DataSourceResult;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class DataSourceService {

    private static final Map<String, String> SOURCE_LABELS = new LinkedHashMap<>(Map.of(
            "sales", "월간 매출 데이터",
            "inventory", "재고 현황",
            "customers", "고객 데이터",
            "weekly", "주간 영업 활동"
    ));

    private static final Map<String, String> SOURCE_FILES = Map.of(
            "sales", "samples/sales-data.csv",
            "inventory", "samples/inventory.csv",
            "customers", "samples/customers.csv",
            "weekly", "samples/weekly-sales-activities.csv"
    );

    public List<DataSourceResult> availableSources() {
        return SOURCE_LABELS.keySet().stream()
                .map(type -> {
                    try {
                        return load(type);
                    } catch (Exception e) {
                        return DataSourceResult.of(type, SOURCE_LABELS.get(type), List.of(), List.of());
                    }
                })
                .collect(Collectors.toList());
    }

    public DataSourceResult load(String type) {
        String filename = SOURCE_FILES.get(type);
        if (filename == null) {
            throw new IllegalArgumentException("Unknown data source type: " + type);
        }
        try {
            ClassPathResource resource = new ClassPathResource(filename);
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {
                List<String> lines = reader.lines().filter(l -> !l.isBlank()).collect(Collectors.toList());
                if (lines.isEmpty()) {
                    return DataSourceResult.of(type, SOURCE_LABELS.get(type), List.of(), List.of());
                }
                List<String> headers = Arrays.asList(lines.get(0).split(","));
                List<List<String>> rows = lines.stream()
                        .skip(1)
                        .map(line -> Arrays.asList(line.split(",")))
                        .collect(Collectors.toList());
                return DataSourceResult.of(type, SOURCE_LABELS.get(type), headers, rows);
            }
        } catch (Exception e) {
            throw new IllegalStateException("Failed to read data source: " + type, e);
        }
    }
}
```

- [ ] **Step 5: 테스트 재실행 — 통과 확인**

```powershell
mvn test -pl . -Dtest=DataSourceServiceTest -q
```
Expected: BUILD SUCCESS, 3 tests passed.

---

### 1-B. 백엔드 DataSourceController

**Files:**
- Create: `backend/src/main/java/com/iwap/interfaces/api/datasource/DataSourceController.java`

- [ ] **Step 6: DataSourceController 작성**

```java
// DataSourceController.java
package com.iwap.interfaces.api.datasource;

// 데이터 소스 조회 REST 컨트롤러 — GET /api/data-sources
import com.iwap.application.datasource.DataSourceService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/data-sources")
public class DataSourceController {

    private final DataSourceService service;

    public DataSourceController(DataSourceService service) {
        this.service = service;
    }

    @GetMapping
    public List<DataSourceResult> list() {
        return service.availableSources();
    }

    @GetMapping("/{type}")
    public DataSourceResult get(@PathVariable String type) {
        return service.load(type);
    }
}
```

- [ ] **Step 7: SecurityConfig에 /api/data-sources 허용 확인**

`backend/src/main/java/com/iwap/infrastructure/security/SecurityConfig.java`를 열어 `.permitAll()` 목록에 `/api/data-sources/**`가 없으면 추가한다.

기존 permitAll 목록 패턴 (GET 조회 경로들):
```java
.requestMatchers(HttpMethod.GET, "/api/data-sources/**").permitAll()
```

- [ ] **Step 8: 로컬 smoke test**

```powershell
docker compose up -d
# 잠시 후
Invoke-RestMethod http://localhost:8080/api/data-sources | ConvertTo-Json
Invoke-RestMethod http://localhost:8080/api/data-sources/sales | ConvertTo-Json
```
Expected: JSON 배열 4개, sales 응답에 headers/rows 포함.

- [ ] **Step 9: 커밋**

```powershell
git add backend/src/main/java/com/iwap/application/datasource/ `
       backend/src/main/java/com/iwap/interfaces/api/datasource/ `
       backend/src/test/java/com/iwap/application/datasource/ `
       backend/src/main/java/com/iwap/infrastructure/security/SecurityConfig.java
git commit -m "feat: add data source API to serve CSV sample files"
```

---

### 1-C. 프론트엔드 데이터 뷰어 페이지

**Files:**
- Create: `frontend/app/data/page.tsx`
- Modify: `frontend/components/app-shell.tsx`
- Modify: `frontend/lib/api.ts`

- [ ] **Step 10: api.ts에 데이터 소스 타입 및 함수 추가**

`frontend/lib/api.ts` 파일 맨 끝에 추가:

```typescript
export type DataSourceResult = {
  type: string;
  label: string;
  rowCount: number;
  headers: string[];
  rows: string[][];
};

export async function listDataSources(): Promise<DataSourceResult[]> {
  return fetchApi<DataSourceResult[]>("/api/data-sources");
}

export async function getDataSource(type: string): Promise<DataSourceResult> {
  return fetchApi<DataSourceResult>(`/api/data-sources/${type}`);
}
```

- [ ] **Step 11: app-shell.tsx에 "데이터 소스" 메뉴 추가**

`frontend/components/app-shell.tsx` 상단 import에 `Database` 아이콘 추가:

```typescript
import { BarChart3, CheckSquare, Database, History, LayoutDashboard, MessageSquareText, Settings } from "lucide-react";
```

`navItems` 배열에 항목 추가 (Settings 앞에):

```typescript
{ label: "데이터 소스", href: "/data", icon: Database },
```

- [ ] **Step 12: 데이터 뷰어 페이지 작성**

```typescript
// frontend/app/data/page.tsx
// 보고서 생성에 사용된 원본 데이터 소스를 탭별로 표시하는 뷰어 페이지
"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { listDataSources, DataSourceResult } from "@/lib/api";
import { AppShell } from "@/components/app-shell";

export default function DataPage() {
  const { data: sources = [], isLoading } = useQuery({
    queryKey: ["data-sources"],
    queryFn: listDataSources,
  });

  const [activeType, setActiveType] = useState<string | null>(null);
  const active: DataSourceResult | undefined =
    sources.find((s) => s.type === (activeType ?? sources[0]?.type));

  if (isLoading) {
    return (
      <AppShell>
        <div className="p-8 text-muted text-sm">데이터 소스 불러오는 중...</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-6 md:p-8 space-y-6">
        <div>
          <h1 className="text-xl font-semibold">데이터 소스</h1>
          <p className="mt-1 text-sm text-muted">보고서 생성에 사용된 원본 데이터입니다.</p>
        </div>

        {/* 탭 */}
        <div className="flex gap-2 border-b border-hairline">
          {sources.map((source) => (
            <button
              key={source.type}
              onClick={() => setActiveType(source.type)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                (activeType ?? sources[0]?.type) === source.type
                  ? "border-action text-action"
                  : "border-transparent text-muted hover:text-body"
              }`}
            >
              {source.label}
            </button>
          ))}
        </div>

        {/* 테이블 */}
        {active && (
          <div className="rounded-lg border border-hairline bg-surface-card overflow-hidden">
            <div className="px-4 py-3 border-b border-hairline flex items-center justify-between">
              <span className="text-sm font-medium">{active.label}</span>
              <span className="text-xs text-muted">{active.rowCount}개 행</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-soft">
                    {active.headers.map((header) => (
                      <th
                        key={header}
                        className="px-4 py-2 text-left text-xs font-medium text-muted uppercase tracking-wide"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {active.rows.map((row, i) => (
                    <tr key={i} className="border-t border-hairline hover:bg-surface-soft">
                      {row.map((cell, j) => (
                        <td key={j} className="px-4 py-2 text-body">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
```

- [ ] **Step 13: 프론트엔드 타입체크 + 빌드**

```powershell
cd frontend
npm run typecheck
npm run build
```
Expected: 오류 없음.

- [ ] **Step 14: 커밋**

```powershell
git add frontend/app/data/ `
       frontend/components/app-shell.tsx `
       frontend/lib/api.ts
git commit -m "feat: add data source viewer page with CSV table display"
```

- [ ] **Step 15: README.md 작업 현황 업데이트**

`README.md`의 "작업 현황" 섹션을 추가하거나 업데이트:

```markdown
## 작업 현황

| 작업 | 상태 | 완료일 |
|------|------|--------|
| 소스 데이터 뷰어 페이지 | ✅ 완료 | 2026-05-xx |
| Agent 실제 동작 + 상태 기계 | ⏳ 대기 | - |
| OpenAI 플래너 멀티턴 | ⏳ 대기 | - |
```

```powershell
git add README.md
git commit -m "docs: mark data source viewer as complete in README"
```

---

## Task 2: Agent Pipeline (독립 — 병렬 가능)

### 2-A. NotifierAgent에 DeliveryService 연결

**Files:**
- Modify: `backend/src/main/java/com/iwap/application/agent/NotifierAgent.java`

현재 NotifierAgent는 DeliveryService를 호출하지 않는다. Plan steps를 순회해 toolName에 맞는 발송을 실행하도록 수정한다.

- [ ] **Step 1: NotifierAgent 테스트 작성**

```java
// backend/src/test/java/com/iwap/application/agent/NotifierAgentTest.java
package com.iwap.application.agent;

import com.iwap.application.delivery.DeliveryReceipt;
import com.iwap.application.delivery.DeliveryService;
import com.iwap.application.workflow.WorkflowContext;
import com.iwap.application.workflow.WorkflowEventRecorder;
import com.iwap.domain.agent.AgentType;
import com.iwap.domain.tool.ToolCallStatus;
import com.iwap.domain.workflow.WorkflowPlan;
import com.iwap.domain.workflow.WorkflowScenario;
import com.iwap.domain.workflow.WorkflowStep;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class NotifierAgentTest {

    @Test
    void handleAddsToolCallForEachNotifierStep() {
        DeliveryService delivery = mock(DeliveryService.class);
        when(delivery.sendSlack(any(), any())).thenReturn(DeliveryReceipt.demo("slack", "#ch", "ok"));
        when(delivery.sendEmail(any(), any(), any())).thenReturn(DeliveryReceipt.demo("email", "a@b", "ok"));

        WorkflowContext context = new WorkflowContext("run-1", "test command", "user@test.com");
        context.setPlan(new WorkflowPlan(
                WorkflowScenario.MONTHLY_SALES_REPORT, "월간 보고서", false, "",
                List.of(
                        new WorkflowStep(1, AgentType.NOTIFIER, "슬랙 발송", "Send to Slack", "slack"),
                        new WorkflowStep(2, AgentType.NOTIFIER, "이메일 발송", "Send email", "email")
                )
        ));

        NotifierAgent agent = new NotifierAgent(new WorkflowEventRecorder(), delivery);
        agent.handle(context);

        assertThat(context.toolCalls()).hasSize(2);
        assertThat(context.toolCalls()).allMatch(tc -> tc.status() == ToolCallStatus.COMPLETED);
    }
}
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```powershell
mvn test -pl . -Dtest=NotifierAgentTest -q
```
Expected: FAIL (컴파일 오류 — NotifierAgent 생성자 불일치).

- [ ] **Step 3: NotifierAgent 수정**

```java
// NotifierAgent.java
package com.iwap.application.agent;

// 워크플로 완료 후 Slack/Email 알림을 발송하는 에이전트
import com.iwap.application.delivery.DeliveryService;
import com.iwap.application.workflow.WorkflowContext;
import com.iwap.application.workflow.WorkflowEventRecorder;
import com.iwap.domain.agent.AgentType;
import com.iwap.domain.tool.ToolCall;
import com.iwap.domain.workflow.WorkflowEventType;
import com.iwap.domain.workflow.WorkflowStep;
import org.springframework.stereotype.Component;

@Component
public class NotifierAgent implements WorkflowAgent {

    private final WorkflowEventRecorder recorder;
    private final DeliveryService deliveryService;

    public NotifierAgent(WorkflowEventRecorder recorder, DeliveryService deliveryService) {
        this.recorder = recorder;
        this.deliveryService = deliveryService;
    }

    @Override
    public AgentType type() {
        return AgentType.NOTIFIER;
    }

    @Override
    public void handle(WorkflowContext context) {
        for (WorkflowStep step : context.plan().steps()) {
            if (step.owner() != AgentType.NOTIFIER) {
                continue;
            }
            var receipt = switch (step.toolName()) {
                case "slack" -> deliveryService.sendSlack(null,
                        context.plan().title() + " 완료. 상세 내용은 IWAP 보고서를 확인하세요.");
                case "email" -> deliveryService.sendEmail(
                        context.requestedBy(),
                        "[IWAP] " + context.plan().title() + " 완료",
                        context.plan().title() + " 워크플로가 완료되었습니다. IWAP 대시보드에서 보고서를 확인하세요.");
                default -> deliveryService.recordKakaoWork(null,
                        context.plan().title() + " 완료 알림");
            };
            context.toolCalls().add(ToolCall.completed(step.toolName(), step.purpose()));
        }

        recorder.record(context, type(), WorkflowEventType.NOTIFICATION_COMPLETED,
                "Published completion notice to the requester and workflow history.");
    }
}
```

- [ ] **Step 4: 테스트 재실행 — 통과 확인**

```powershell
mvn test -pl . -Dtest=NotifierAgentTest -q
```
Expected: BUILD SUCCESS.

---

### 2-B. ReporterAgent 시나리오별 보고서 생성

**Files:**
- Modify: `backend/src/main/java/com/iwap/application/agent/ReporterAgent.java`

현재 ReporterAgent는 generic 영어 보고서만 생성한다. 시나리오별 한국어 보고서로 개선한다.

- [ ] **Step 5: ReporterAgent 수정**

```java
// ReporterAgent.java
package com.iwap.application.agent;

// 워크플로 결과를 시나리오별 한국어 보고서로 생성하는 에이전트
import com.iwap.application.workflow.WorkflowContext;
import com.iwap.application.workflow.WorkflowEventRecorder;
import com.iwap.domain.agent.AgentType;
import com.iwap.domain.report.ReportArtifact;
import com.iwap.domain.workflow.WorkflowEventType;
import com.iwap.domain.workflow.WorkflowScenario;
import org.springframework.stereotype.Component;

@Component
public class ReporterAgent implements WorkflowAgent {

    private final WorkflowEventRecorder recorder;

    public ReporterAgent(WorkflowEventRecorder recorder) {
        this.recorder = recorder;
    }

    @Override
    public AgentType type() {
        return AgentType.REPORTER;
    }

    @Override
    public void handle(WorkflowContext context) {
        context.artifacts().add(ReportArtifact.markdown(
                context.runId(),
                context.plan().title(),
                buildSummary(context),
                buildContent(context)
        ));
        recorder.record(context, type(), WorkflowEventType.REPORT_CREATED,
                context.plan().title() + " 보고서를 생성했습니다.");
    }

    private String buildSummary(WorkflowContext context) {
        return switch (context.plan().scenario()) {
            case MONTHLY_SALES_REPORT -> "2026년 5월 총매출 143,300,000원, 전월 대비 +9.3%. Slack/Email 공유 완료.";
            case WEEKLY_SALES_REPORT -> "주간 영업 활동 분석 완료. 계약 성사 7건, 신규 리드 23건.";
            case CUSTOMER_ONBOARDING -> "신규 고객 온보딩 완료. CRM 등록, 환영 이메일, 담당자 알림 처리.";
            case LOW_INVENTORY_ALERT -> "재고 부족 품목 3건 확인. 구매팀 알림 발송 완료.";
        };
    }

    private String buildContent(WorkflowContext context) {
        return switch (context.plan().scenario()) {
            case MONTHLY_SALES_REPORT -> """
                    # 2026년 5월 월간 매출 보고서

                    ## 핵심 지표

                    | 지표 | 2026년 5월 | 전월 | 변화 |
                    |------|---:|---:|---:|
                    | 총매출 | 143,300,000원 | 131,000,000원 | +9.3% |
                    | 총주문 | 189건 | 177건 | +6.8% |
                    | 평균 매출총이익률 | 34.2% | 33.3% | +0.9%p |

                    ## 채널별 매출

                    | 채널 | 매출 | 주문 | 총이익률 |
                    |------|---:|---:|---:|
                    | B2B Direct | 84,200,000원 | 42건 | 38% |
                    | Online Store | 31,500,000원 | 128건 | 31% |
                    | Partner Reseller | 27,600,000원 | 19건 | 27% |

                    ## 발송 내역
                    - Slack #sales-report 채널 공유 완료
                    - 담당자 이메일 발송 완료
                    """;
            case WEEKLY_SALES_REPORT -> """
                    # 주간 영업 실적 보고서

                    ## 이번 주 성과

                    | 항목 | 건수 |
                    |------|---:|
                    | 계약 성사 | 7건 |
                    | 신규 리드 | 23건 |
                    | 미팅 | 18건 |

                    영업 리포트가 생성되어 PDF로 저장되었습니다.
                    """;
            case CUSTOMER_ONBOARDING -> """
                    # 신규 고객 온보딩 완료 보고서

                    ## 처리 내역
                    - CRM 시스템 고객 등록 완료
                    - 환영 이메일 발송 완료
                    - 담당 영업 담당자 Slack 알림 완료

                    온보딩 프로세스가 성공적으로 완료되었습니다.
                    """;
            case LOW_INVENTORY_ALERT -> """
                    # 재고 부족 알림 보고서

                    ## 부족 품목

                    | SKU | 품목명 | 현재 재고 | 최소 재고 |
                    |-----|--------|---:|---:|
                    | SKU-001 | 제품 A | 5개 | 20개 |
                    | SKU-007 | 제품 B | 2개 | 15개 |
                    | SKU-013 | 제품 C | 8개 | 25개 |

                    구매팀 알림 발송이 완료되었습니다.
                    """;
        };
    }
}
```

- [ ] **Step 6: 백엔드 전체 테스트 실행**

```powershell
mvn test -q
```
Expected: BUILD SUCCESS, 모든 테스트 통과.

---

### 2-C. WorkflowOrchestrator Agent 파이프라인 전환

**Files:**
- Modify: `backend/src/main/java/com/iwap/application/workflow/WorkflowOrchestrator.java`
- Modify: `backend/src/test/java/com/iwap/application/workflow/WorkflowOrchestratorTest.java`

- [ ] **Step 7: WorkflowOrchestratorTest 파이프라인 테스트 추가**

`WorkflowOrchestratorTest.java`에 다음 테스트를 추가한다 (기존 테스트는 유지):

```java
@Test
void startMonthlySalesRunsFullAgentPipeline() {
    WorkflowOrchestrator orchestrator = buildOrchestrator(new InMemoryWorkflowRunStore(), null);

    WorkflowRun run = orchestrator.start(
            "이번 달 매출 보고서 만들어서 슬랙 채널과 이메일로 보내줘",
            "monthly-sales-report",
            "manager@demo-company.com"
    );

    assertThat(run.status()).isEqualTo(WorkflowStatus.COMPLETED);
    assertThat(run.events()).isNotEmpty();
    assertThat(run.toolCalls()).isNotEmpty();
    assertThat(run.artifacts()).hasSize(1);
}

@Test
void startLowInventoryPausesForApproval() {
    WorkflowOrchestrator orchestrator = buildOrchestrator(new InMemoryWorkflowRunStore(), null);

    WorkflowRun run = orchestrator.start(
            "재고 부족 제품 리스트 뽑아서 구매팀에 보내",
            "low-inventory",
            "operator@demo-company.com"
    );

    assertThat(run.status()).isEqualTo(WorkflowStatus.WAITING_FOR_APPROVAL);
    assertThat(run.approvals()).hasSize(1);
    assertThat(run.toolCalls()).isEmpty();
}

@Test
void approvalCompletesLowInventoryPipeline() {
    var store = new InMemoryWorkflowRunStore();
    WorkflowOrchestrator orchestrator = buildOrchestrator(store, null);

    WorkflowRun pending = orchestrator.start(
            "재고 부족 제품 리스트 뽑아서 구매팀에 보내",
            "low-inventory",
            "operator@demo-company.com"
    );
    String approvalId = pending.approvals().get(0).id();

    WorkflowRun completed = orchestrator.decideApproval(approvalId, true, "manager@demo-company.com");

    assertThat(completed.status()).isEqualTo(WorkflowStatus.COMPLETED);
    assertThat(completed.toolCalls()).isNotEmpty();
    assertThat(completed.artifacts()).hasSize(1);
}

// 헬퍼: 모든 Agent를 실제 구현으로 조합한 Orchestrator 생성
private WorkflowOrchestrator buildOrchestrator(WorkflowRunStore store, WorkflowEventPublisher publisher) {
    var recorder = new WorkflowEventRecorder();
    var delivery = DeliveryService.demo();
    var toolRegistry = new com.iwap.application.tool.ToolRegistry(List.of());
    return new WorkflowOrchestrator(
            store, publisher, delivery,
            new PlannerAgent(recorder),
            new ExecutorAgent(toolRegistry, recorder),
            new ValidatorAgent(recorder),
            new ReporterAgent(recorder),
            new NotifierAgent(recorder, delivery)
    );
}
```

- [ ] **Step 8: 테스트 실행 — 실패 확인**

```powershell
mvn test -pl . -Dtest=WorkflowOrchestratorTest -q
```
Expected: 컴파일 오류 (WorkflowOrchestrator 생성자 불일치).

- [ ] **Step 9: WorkflowOrchestrator Agent 파이프라인으로 전환**

`WorkflowOrchestrator.java` 전체를 다음으로 교체:

```java
package com.iwap.application.workflow;

// 워크플로 Agent 파이프라인을 조율하는 오케스트레이터
import com.iwap.application.agent.*;
import com.iwap.application.delivery.DeliveryService;
import com.iwap.domain.approval.ApprovalRequest;
import com.iwap.domain.audit.AuditLogEntry;
import com.iwap.domain.workflow.WorkflowRun;
import com.iwap.domain.workflow.WorkflowStatus;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class WorkflowOrchestrator {

    private final WorkflowRunStore store;
    private final WorkflowEventPublisher publisher;
    private final DeliveryService deliveryService;
    private final PlannerAgent plannerAgent;
    private final ExecutorAgent executorAgent;
    private final ValidatorAgent validatorAgent;
    private final ReporterAgent reporterAgent;
    private final NotifierAgent notifierAgent;

    // 승인 대기 중인 컨텍스트 보관 (서버 재시작 시 소실 — 의도적)
    private final Map<String, WorkflowContext> pendingContexts = new ConcurrentHashMap<>();

    public WorkflowOrchestrator() {
        this(new InMemoryWorkflowRunStore(), null, DeliveryService.demo(),
                null, null, null, null, null);
    }

    @Autowired
    public WorkflowOrchestrator(
            WorkflowRunStore store,
            WorkflowEventPublisher publisher,
            DeliveryService deliveryService,
            PlannerAgent plannerAgent,
            ExecutorAgent executorAgent,
            ValidatorAgent validatorAgent,
            ReporterAgent reporterAgent,
            NotifierAgent notifierAgent
    ) {
        this.store = store;
        this.publisher = publisher;
        this.deliveryService = deliveryService;
        this.plannerAgent = plannerAgent;
        this.executorAgent = executorAgent;
        this.validatorAgent = validatorAgent;
        this.reporterAgent = reporterAgent;
        this.notifierAgent = notifierAgent;
    }

    public WorkflowRun start(String command, String requestedBy) {
        return start(command, null, requestedBy);
    }

    public WorkflowRun start(String command, String scenarioKey, String requestedBy) {
        String runId = nextRunId(scenarioKey != null ? scenarioKey : resolveScenario(command, null));
        WorkflowContext context = new WorkflowContext(runId, command, requestedBy);

        agents().plannerAgent.handle(context);

        if (context.plan().approvalRequired()) {
            String approvalId = runId + "-approval-" + UUID.randomUUID().toString().substring(0, 8);
            context.approvals().add(ApprovalRequest.pending(
                    approvalId, runId, com.iwap.domain.agent.AgentType.PLANNER, context.plan().approvalReason()));

            pendingContexts.put(runId, context);

            return store.save(new WorkflowRun(
                    runId, context.plan().title(), command, requestedBy,
                    WorkflowStatus.WAITING_FOR_APPROVAL,
                    List.copyOf(context.events()),
                    List.of(),
                    List.copyOf(context.approvals()),
                    List.of(),
                    List.copyOf(context.auditTrail())
            ));
        }

        return runPipeline(context);
    }

    public List<WorkflowRun> history() {
        return store.findAll();
    }

    public List<ApprovalRequest> pendingApprovals() {
        return store.pendingApprovals();
    }

    public List<AuditLogEntry> auditLogs() {
        return store.auditLogs();
    }

    public WorkflowRun decideApproval(String approvalId, boolean approved, String decidedBy) {
        // store.decideApproval은 approval 상태 변경 + 감사 로그 추가만 담당
        WorkflowRun decided = store.decideApproval(approvalId, approved, decidedBy);

        if (!approved) {
            return decided;
        }

        WorkflowContext context = pendingContexts.remove(decided.id());
        if (context == null) {
            // 서버 재시작 후 컨텍스트 유실 — PlannerAgent를 다시 실행해 plan 복원
            context = new WorkflowContext(decided.id(), decided.command(), decided.requestedBy());
            context.events().addAll(decided.events());
            context.auditTrail().addAll(decided.auditTrail());
            agents().plannerAgent.handle(context);
        }
        // decided.approvals()에는 이미 APPROVED 상태가 반영되어 있음 — context에 복사
        context.approvals().clear();
        context.approvals().addAll(decided.approvals());

        return runPipeline(context);
    }

    private WorkflowRun runPipeline(WorkflowContext context) {
        agents().executorAgent.handle(context);
        agents().validatorAgent.handle(context);
        agents().reporterAgent.handle(context);
        agents().notifierAgent.handle(context);

        return store.save(new WorkflowRun(
                context.runId(),
                context.plan().title(),
                context.command(),
                context.requestedBy(),
                WorkflowStatus.COMPLETED,
                List.copyOf(context.events()),
                List.copyOf(context.toolCalls()),
                List.copyOf(context.approvals()),
                List.copyOf(context.artifacts()),
                List.copyOf(context.auditTrail())
        ));
    }

    // 에이전트가 null인 경우(no-arg 생성자) 대비 안전한 래퍼
    private AgentBundle agents() {
        var recorder = new WorkflowEventRecorder(publisher);
        var delivery = deliveryService != null ? deliveryService : DeliveryService.demo();
        var toolReg = new com.iwap.application.tool.ToolRegistry(List.of());
        return new AgentBundle(
                plannerAgent != null ? plannerAgent : new PlannerAgent(recorder),
                executorAgent != null ? executorAgent : new ExecutorAgent(toolReg, recorder),
                validatorAgent != null ? validatorAgent : new ValidatorAgent(recorder),
                reporterAgent != null ? reporterAgent : new ReporterAgent(recorder),
                notifierAgent != null ? notifierAgent : new NotifierAgent(recorder, delivery)
        );
    }

    private record AgentBundle(
            PlannerAgent plannerAgent,
            ExecutorAgent executorAgent,
            ValidatorAgent validatorAgent,
            ReporterAgent reporterAgent,
            NotifierAgent notifierAgent
    ) {}

    private String resolveScenario(String command, String scenarioKey) {
        if (scenarioKey != null && !scenarioKey.isBlank()) {
            return scenarioKey.trim().toLowerCase(Locale.ROOT);
        }
        String cmd = command.toLowerCase(Locale.ROOT);
        if (cmd.contains("재고") || cmd.contains("inventory")) return "low-inventory";
        if (cmd.contains("신규") || cmd.contains("onboarding") || cmd.contains("crm")) return "customer-onboarding";
        if (cmd.contains("주간") || cmd.contains("weekly")) return "weekly-sales-report";
        return "monthly-sales-report";
    }

    private String nextRunId(String prefix) {
        return prefix + "-" + UUID.randomUUID().toString().substring(0, 8);
    }
}
```

- [ ] **Step 10: 테스트 재실행 — 모든 테스트 통과 확인**

```powershell
mvn test -q
```
Expected: BUILD SUCCESS.

- [ ] **Step 11: 커밋**

```powershell
git add backend/src/main/java/com/iwap/application/agent/ `
       backend/src/main/java/com/iwap/application/workflow/WorkflowOrchestrator.java `
       backend/src/test/java/com/iwap/application/workflow/WorkflowOrchestratorTest.java `
       backend/src/test/java/com/iwap/application/agent/
git commit -m "feat: wire agent pipeline in WorkflowOrchestrator, connect NotifierAgent to DeliveryService"
```

- [ ] **Step 12: README.md 업데이트**

```markdown
| Agent 실제 동작 + 상태 기계 | ✅ 완료 | 2026-05-xx |
| Slack/Email 실제 발송 | ✅ 완료 | 2026-05-xx |
```

```powershell
git add README.md
git commit -m "docs: mark agent pipeline and delivery integration as complete"
```

---

## Task 3: OpenAI 플래너 멀티턴 (Task 2 완료 후)

현재 `OpenAiAssistantPlanner`는 단일 메시지만 GPT에 전달한다. 이전 대화 히스토리를 함께 전달해 멀티턴 컨텍스트를 유지하도록 개선한다.

**전제 조건:** `AssistantSession`이 메시지 히스토리를 저장해야 한다.

### 3-A. AssistantSession 메시지 히스토리 추가

**Files:**
- Modify: `backend/src/main/java/com/iwap/application/assistant/AssistantSession.java`
- Modify: `backend/src/main/java/com/iwap/application/assistant/AssistantService.java`

- [ ] **Step 1: AssistantSession 파일 확인**

```powershell
cat backend/src/main/java/com/iwap/application/assistant/AssistantSession.java
```

`AssistantSession`이 record인지 class인지 확인 후 `messages` 필드 추가 방법 결정.

- [ ] **Step 2: AssistantServiceTest에 멀티턴 테스트 추가**

`AssistantServiceTest.java`에 추가:

```java
@Test
void secondMessageIncludesPreviousTurnInSession() {
    // AssistantService가 세션에 메시지를 누적하는지 확인
    AssistantSession session = sessionStore.getOrCreate("session-multi");
    assertThat(session.messages()).isEmpty();

    // 첫 번째 메시지
    service.chat(new AssistantChatRequest("session-multi", "이번 달 매출 보고서 만들어줘"));
    AssistantSession afterFirst = sessionStore.getOrCreate("session-multi");
    assertThat(afterFirst.messages()).isNotEmpty();
}
```

- [ ] **Step 3: AssistantSession에 messages 리스트 추가**

`AssistantSession`에 `messages` 필드 추가. 기존이 record라면 새 record로 재정의:

```java
// messages 필드 — record 타입인 경우 예시
public record AssistantSession(
        String id,
        String pendingCommand,
        String pendingPlanId,
        List<AssistantMessage> messages   // 추가
) {
    public AssistantSession withMessage(String role, String content) {
        var newMessages = new ArrayList<>(messages);
        newMessages.add(new AssistantMessage(role, content));
        return new AssistantSession(id, pendingCommand, pendingPlanId, List.copyOf(newMessages));
    }

    // 기존 팩토리 메서드 유지
    public static AssistantSession create(String id) {
        return new AssistantSession(id, null, null, List.of());
    }

    public AssistantSession withPendingCommand(String command) {
        return new AssistantSession(id, command, pendingPlanId, messages);
    }

    public AssistantSession withPendingPlan(String planId) {
        return new AssistantSession(id, pendingCommand, planId, messages);
    }

    public AssistantSession clearPendingPlan() {
        return new AssistantSession(id, null, null, messages);
    }
}

public record AssistantMessage(String role, String content) {}
```

> **주의:** 실제 파일을 읽어 기존 구조에 맞게 조정할 것. record 컴파일 오류 시 기존 필드 순서 확인.

- [ ] **Step 4: AssistantService에서 메시지 저장**

`AssistantService.chat()` 메서드에서 응답 반환 전 세션에 메시지 추가:

```java
// chat() 메서드 내 planner.plan() 호출 후 적절한 위치에 추가
sessionStore.save(session.withMessage("user", request.message()));
// 응답 생성 후
sessionStore.save(session.withMessage("assistant", response.message()));
```

- [ ] **Step 5: OpenAiAssistantPlanner 히스토리 전달**

`OpenAiAssistantPlanner.plan()` 수정:

```java
@Override
public AssistantPlan plan(String command, AssistantSession session) {
    var promptBuilder = chatClient.prompt()
            .system("""
                    You are IWAP's workflow planning assistant.
                    Return only valid JSON matching these fields:
                    intent, confidence, summary, missingFields, actions, requiresApproval, approvalReason, scenarioKey, command, requestedBy, slots, providerMode.
                    Allowed scenarioKey values: monthly-sales-report, weekly-sales-report, customer-onboarding, low-inventory.
                    Allowed toolName values: sales-data, report-generator, email, slack, crm, inventory, kakao, approval.
                    Each action must have order, toolName, title, description, external.
                    If email delivery is requested but no recipient email is present, set missingFields to ["recipientEmail"] and do not add actions.
                    External email, slack, kakao, and approval actions require approval.
                    providerMode must be "openai".
                    Use Korean for summary, titles, and descriptions.
                    """);

    // 이전 대화 히스토리 추가
    for (var msg : session.messages()) {
        if ("user".equals(msg.role())) {
            promptBuilder = promptBuilder.user(msg.content());
        } else {
            promptBuilder = promptBuilder.assistant(msg.content());
        }
    }

    String content = promptBuilder.user(command).call().content();

    try {
        AssistantPlan plan = objectMapper.readValue(extractJson(content), AssistantPlan.class);
        return plan.withIdentity("", session.id());
    } catch (Exception exception) {
        throw new IllegalStateException("OpenAI planner returned an invalid workflow plan.", exception);
    }
}
```

> **주의:** `ChatClient.prompt()` 빌더 API가 `.user()/.assistant()` 체이닝을 지원하는지 Spring AI 버전 확인. 미지원 시 `List<Message>` 형태로 변환해 `.messages(list)` 사용.

- [ ] **Step 6: 백엔드 전체 테스트**

```powershell
mvn test -q
```
Expected: BUILD SUCCESS.

- [ ] **Step 7: 커밋**

```powershell
git add backend/src/main/java/com/iwap/application/assistant/ `
       backend/src/test/java/com/iwap/application/assistant/
git commit -m "feat: add conversation history to OpenAI planner for multi-turn support"
```

- [ ] **Step 8: README.md 업데이트**

```markdown
| OpenAI 플래너 멀티턴 | ✅ 완료 | 2026-05-xx |
```

```powershell
git add README.md
git commit -m "docs: mark OpenAI planner multi-turn as complete"
```

---

## 스펙 커버리지 체크

| 스펙 요구사항 | 구현 태스크 |
|---|---|
| 소스 데이터 뷰어 페이지 | Task 1 |
| Agent 실제 동작 + 상태 기계 | Task 2-C |
| NotifierAgent → DeliveryService 연결 | Task 2-A |
| ReporterAgent 시나리오별 보고서 | Task 2-B |
| Slack/Email 실제 발송 | Task 2-A (DeliveryService 기존 구현 활성화) |
| OpenAI 플래너 멀티턴 | Task 3 |
| 각 작업 완료 시 README.md 업데이트 | 각 태스크 마지막 step |
| CLAUDE.md 파일 헤더 규칙 | 모든 신규 파일 첫 줄 한국어 주석 |

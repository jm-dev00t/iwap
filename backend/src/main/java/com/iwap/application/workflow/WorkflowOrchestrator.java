package com.iwap.application.workflow;

import com.iwap.domain.agent.AgentType;
import com.iwap.domain.approval.ApprovalRequest;
import com.iwap.domain.audit.AuditLogEntry;
import com.iwap.domain.report.ReportArtifact;
import com.iwap.domain.report.ReportFormat;
import com.iwap.domain.tool.ToolCall;
import com.iwap.domain.workflow.WorkflowEvent;
import com.iwap.domain.workflow.WorkflowEventType;
import com.iwap.domain.workflow.WorkflowRun;
import com.iwap.domain.workflow.WorkflowStatus;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * Coordinates the portfolio demo workflow in a LangGraph-style sequence.
 *
 * <p>The first implementation intentionally uses deterministic scenario routing.
 * That keeps live demos reliable while preserving the same orchestration boundary
 * that a Spring AI planner or LangGraph-like state machine can replace later.</p>
 */
@Service
public class WorkflowOrchestrator {

    private final WorkflowRunStore store;
    private final WorkflowEventPublisher publisher;

    public WorkflowOrchestrator() {
        this(new InMemoryWorkflowRunStore(), null);
    }

    public WorkflowOrchestrator(WorkflowRunStore store) {
        this(store, null);
    }

    @Autowired
    public WorkflowOrchestrator(WorkflowRunStore store, WorkflowEventPublisher publisher) {
        this.store = store;
        this.publisher = publisher;
    }

    public WorkflowRun start(String command, String requestedBy) {
        return start(command, null, requestedBy);
    }

    public WorkflowRun start(String command, String scenarioKey, String requestedBy) {
        String scenario = resolveScenario(command, scenarioKey);

        return store.save(switch (scenario) {
            case "low-inventory" -> createLowInventoryApprovalRun(command, requestedBy);
            case "customer-onboarding" -> createCustomerOnboardingRun(command, requestedBy);
            case "weekly-sales-report" -> createWeeklySalesReportRun(command, requestedBy);
            default -> createMonthlySalesReportRun(command, requestedBy);
        });
    }

    private String resolveScenario(String command, String scenarioKey) {
        if (scenarioKey != null && !scenarioKey.isBlank()) {
            return scenarioKey.trim().toLowerCase(Locale.ROOT);
        }

        String normalizedCommand = command.toLowerCase(Locale.ROOT);

        if (normalizedCommand.contains("재고") || normalizedCommand.contains("inventory")) {
            return "low-inventory";
        }
        if (normalizedCommand.contains("신규 고객") || normalizedCommand.contains("onboarding") || normalizedCommand.contains("crm")) {
            return "customer-onboarding";
        }
        if (normalizedCommand.contains("주간") || normalizedCommand.contains("weekly")) {
            return "weekly-sales-report";
        }
        return "monthly-sales-report";
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
        return store.decideApproval(approvalId, approved, decidedBy);
    }

    private WorkflowRun createMonthlySalesReportRun(String command, String requestedBy) {
        String runId = nextRunId("sales");
        List<WorkflowEvent> events = new ArrayList<>();
        List<ToolCall> toolCalls = new ArrayList<>();
        List<ReportArtifact> artifacts = new ArrayList<>();
        List<AuditLogEntry> auditTrail = new ArrayList<>();

        addEvent(events, auditTrail, runId, AgentType.PLANNER, WorkflowEventType.PLAN_CREATED,
                "Created a structured plan for monthly sales reporting.");
        addEvent(events, auditTrail, runId, AgentType.EXECUTOR, WorkflowEventType.TOOL_CALL_COMPLETED,
                "Generated report and delivered it through Slack and Email.");
        addEvent(events, auditTrail, runId, AgentType.VALIDATOR, WorkflowEventType.VALIDATION_COMPLETED,
                "Validated required sales metrics, recipients, and generated artifacts.");
        addEvent(events, auditTrail, runId, AgentType.REPORTER, WorkflowEventType.REPORT_CREATED,
                "Created executive summary and report artifact for the monthly sales workflow.");
        addEvent(events, auditTrail, runId, AgentType.NOTIFIER, WorkflowEventType.NOTIFICATION_COMPLETED,
                "Published completion notice to the requester and workflow history.");

        toolCalls.add(ToolCall.completed("sales-data", "Read monthly revenue sample data."));
        toolCalls.add(ToolCall.completed("report-generator", "Create monthly sales report artifact."));
        toolCalls.add(ToolCall.completed("slack", "Send report summary to #sales-report."));
        toolCalls.add(ToolCall.completed("email", "Email the report to management recipients."));
        artifacts.add(ReportArtifact.markdown(
                runId,
                "Monthly Sales Report Automation",
                "2026년 5월 총매출 143,300,000원, 전월 대비 9.3% 증가 리포트가 생성되고 Slack/Email 공유까지 완료되었습니다.",
                """
                # 2026년 5월 월간 매출 보고서

                ## Executive Summary

                2026년 5월 총매출은 143,300,000원으로 전월 131,000,000원 대비 9.3% 증가했습니다.
                B2B Direct 채널이 전체 매출의 58.8%를 차지했고, Online Store는 주문 수 기준으로 가장 활발했습니다.
                Partner Reseller는 매출 규모는 작지만 전월 대비 10.0% 성장해 안정적인 보조 채널로 확인됐습니다.

                ## 핵심 지표

                | 지표 | 2026년 5월 | 2026년 4월 | 변화 |
                | --- | ---: | ---: | ---: |
                | 총매출 | 143,300,000원 | 131,000,000원 | +9.3% |
                | 총주문 | 189건 | 177건 | +6.8% |
                | 가중 평균 매출총이익률 | 34.2% | 33.3% | +0.9%p |

                ## 채널별 매출

                | 채널 | 매출 | 주문 수 | 매출총이익률 | 전월 대비 |
                | --- | ---: | ---: | ---: | ---: |
                | B2B Direct | 84,200,000원 | 42 | 38% | +10.1% |
                | Online Store | 31,500,000원 | 128 | 31% | +7.1% |
                | Partner Reseller | 27,600,000원 | 19 | 27% | +10.0% |

                ## Slack 전송 요약

                - 채널: #sales-report
                - 메시지: "5월 총매출 143.3M원, 전월 대비 +9.3%. B2B Direct가 58.8% 기여. Online Store 주문 수 128건으로 최다."
                - 상태: 성공

                ## Email 전송 미리보기

                - 제목: [IWAP] 2026년 5월 월간 매출 보고서
                - 수신자: manager@demo-company.com, finance-lead@demo-company.com
                - 본문 요약: 총매출, 채널별 매출/주문/마진, 추천 액션 3건을 포함한 경영진 요약 리포트입니다.
                - 상태: 성공

                ## 추천 액션

                1. B2B Direct 고마진 고객군을 별도 세그먼트로 관리하고 업셀링 캠페인을 연결합니다.
                2. Online Store는 주문 수가 많으므로 재구매 알림과 장바구니 리마인더 자동화를 붙입니다.
                3. Partner Reseller는 성장률이 높아 리드타임과 마진 변동을 주간 리포트에서 추가 모니터링합니다.

                ## Agent 처리 결과

                - Planner Agent: 월간 매출 분석, 리포트 생성, Slack/Email 발송 계획 수립
                - Executor Agent: sales-data, report-generator, slack, email 도구 호출 완료
                - Validator Agent: 필수 지표, 수신자, 산출물 누락 여부 검증
                - Reporter Agent: 경영진 요약 리포트 생성
                - Notifier Agent: Slack/Email 전송 성공 상태와 감사 로그 기록
                """
        ));

        return new WorkflowRun(
                runId,
                "Monthly Sales Report Automation",
                command,
                requestedBy,
                WorkflowStatus.COMPLETED,
                List.copyOf(events),
                List.copyOf(toolCalls),
                List.of(),
                List.copyOf(artifacts),
                List.copyOf(auditTrail)
        );
    }

    private WorkflowRun createLowInventoryApprovalRun(String command, String requestedBy) {
        String runId = nextRunId("inventory");
        List<WorkflowEvent> events = new ArrayList<>();
        List<ToolCall> toolCalls = new ArrayList<>();
        List<ReportArtifact> artifacts = new ArrayList<>();
        List<AuditLogEntry> auditTrail = new ArrayList<>();

        addEvent(events, auditTrail, runId, AgentType.PLANNER, WorkflowEventType.APPROVAL_REQUESTED,
                "Approval is required before sending a purchase team notification.");

        ApprovalRequest approval = ApprovalRequest.pending(
                "approval-" + runId,
                runId,
                AgentType.PLANNER.name(),
                "Human approval is required because this purchase team notification can trigger buying activity."
        );

        auditTrail.add(AuditLogEntry.of(
                runId,
                auditTrail.size() + 1L,
                "HUMAN_APPROVAL_POLICY",
                "APPROVAL_REQUESTED",
                approval.reason()
        ));
        artifacts.add(ReportArtifact.markdown(
                runId,
                "Low Inventory Purchasing Alert",
                "재고 부족 구매 알림 초안이 생성되었고 구매팀 발송 전 승인 대기 상태입니다.",
                """
                # 재고 부족 구매 알림 초안

                ## 승인 상태

                - 현재 상태: 승인 대기
                - 승인 필요 사유: 구매팀 알림은 실제 발주 활동으로 이어질 수 있습니다.
                - 요청자: operator@demo-company.com
                - 발송 예정 채널: 구매팀 카카오워크/운영 알림방

                ## 재고 부족 품목

                | SKU | 품목 | 현재 재고 | 재주문 기준 | 권장 발주 |
                | --- | --- | ---: | ---: | ---: |
                | SKU-RED-001 | 레드 패키지 박스 | 12 | 50 | 120 |
                | SKU-GRN-014 | 그린 라벨 세트 | 8 | 40 | 90 |
                | SKU-BLK-021 | 블랙 완충재 | 17 | 60 | 100 |

                ## 구매팀 전송 문안

                - 메시지: "재고 부족 SKU 3건이 확인되었습니다. SKU-RED-001, SKU-GRN-014, SKU-BLK-021 우선 발주 검토가 필요합니다."
                - 상태: 사람 승인 전송 대기

                ## 추천 액션

                1. SKU-RED-001은 현재 재고가 기준 대비 가장 낮아 우선 발주합니다.
                2. SKU-GRN-014는 출고 지연 위험이 있어 대체 공급처를 함께 확인합니다.
                3. 승인 완료 후 구매팀 알림과 감사 로그를 함께 기록합니다.
                """
        ));
        toolCalls.add(ToolCall.completed("inventory", "Load low-stock items and reorder thresholds."));
        toolCalls.add(new ToolCall("kakaowork", "Prepare purchase team notification after approval.", java.util.Map.of("room", "purchase-team"), com.iwap.domain.tool.ToolCallStatus.PENDING, null));

        return new WorkflowRun(
                runId,
                "Low Inventory Purchasing Alert",
                command,
                requestedBy,
                WorkflowStatus.WAITING_FOR_APPROVAL,
                List.copyOf(events),
                List.copyOf(toolCalls),
                List.of(approval),
                List.copyOf(artifacts),
                List.copyOf(auditTrail)
        );
    }

    private WorkflowRun createCustomerOnboardingRun(String command, String requestedBy) {
        String runId = nextRunId("customer");
        List<WorkflowEvent> events = new ArrayList<>();
        List<ToolCall> toolCalls = new ArrayList<>();
        List<ReportArtifact> artifacts = new ArrayList<>();
        List<AuditLogEntry> auditTrail = new ArrayList<>();

        addEvent(events, auditTrail, runId, AgentType.PLANNER, WorkflowEventType.PLAN_CREATED,
                "Created a structured onboarding plan for the new customer.");
        addEvent(events, auditTrail, runId, AgentType.EXECUTOR, WorkflowEventType.TOOL_CALL_COMPLETED,
                "Registered the customer, sent welcome email, and notified the account owner.");
        addEvent(events, auditTrail, runId, AgentType.VALIDATOR, WorkflowEventType.VALIDATION_COMPLETED,
                "Validated customer record, welcome message, and owner notification.");
        addEvent(events, auditTrail, runId, AgentType.NOTIFIER, WorkflowEventType.NOTIFICATION_COMPLETED,
                "Published onboarding completion notice to workflow history.");

        toolCalls.add(ToolCall.completed("crm", "Register the new customer in the customer management system."));
        toolCalls.add(ToolCall.completed("email", "Send welcome email to the customer."));
        toolCalls.add(ToolCall.completed("slack", "Notify the account owner."));
        artifacts.add(ReportArtifact.markdown(
                runId,
                "New Customer Onboarding",
                "신규 고객 CRM 등록, 환영 이메일, 담당자 알림 결과가 정리되었습니다.",
                """
                # 신규 고객 온보딩 처리 결과

                ## 고객 정보

                | 항목 | 값 |
                | --- | --- |
                | 고객사 | Blue Harbor Retail |
                | 세그먼트 | Growth Retail |
                | 담당자 | account-owner@demo-company.com |
                | 상태 | CRM 등록 완료 |

                ## 처리 결과

                - CRM 등록: Blue Harbor Retail 고객 프로필과 영업 담당자 매핑을 생성했습니다.
                - 환영 이메일: 제품 소개, 초기 미팅 링크, 담당자 연락처를 포함한 메일을 발송했습니다.
                - 담당자 알림: Slack 담당자 채널에 신규 고객 온보딩 완료 알림을 게시했습니다.

                ## 환영 이메일 미리보기

                - 제목: Blue Harbor Retail 온보딩을 시작합니다
                - 수신자: contact@blueharbor.example
                - 본문 요약: 계약 감사 인사, 첫 미팅 일정 안내, 준비 자료 링크, 담당자 연락처를 포함했습니다.
                - 상태: 성공

                ## 다음 액션

                1. 3영업일 안에 첫 사용 교육 일정을 확정합니다.
                2. CRM에 초기 관심 상품과 예상 매출 규모를 보강합니다.
                3. 14일 후 온보딩 만족도 확인 알림을 예약합니다.
                """
        ));

        return new WorkflowRun(
                runId,
                "New Customer Onboarding",
                command,
                requestedBy,
                WorkflowStatus.COMPLETED,
                List.copyOf(events),
                List.copyOf(toolCalls),
                List.of(),
                List.copyOf(artifacts),
                List.copyOf(auditTrail)
        );
    }

    private WorkflowRun createWeeklySalesReportRun(String command, String requestedBy) {
        String runId = nextRunId("weekly-sales");
        List<WorkflowEvent> events = new ArrayList<>();
        List<ToolCall> toolCalls = new ArrayList<>();
        List<ReportArtifact> artifacts = new ArrayList<>();
        List<AuditLogEntry> auditTrail = new ArrayList<>();

        addEvent(events, auditTrail, runId, AgentType.PLANNER, WorkflowEventType.PLAN_CREATED,
                "Created a weekly sales performance reporting plan.");
        addEvent(events, auditTrail, runId, AgentType.EXECUTOR, WorkflowEventType.TOOL_CALL_COMPLETED,
                "Analyzed weekly sales data and generated a PDF report.");
        addEvent(events, auditTrail, runId, AgentType.VALIDATOR, WorkflowEventType.VALIDATION_COMPLETED,
                "Validated ranking, conversion summary, and report artifact.");
        addEvent(events, auditTrail, runId, AgentType.REPORTER, WorkflowEventType.REPORT_CREATED,
                "Created weekly sales performance report artifact.");
        addEvent(events, auditTrail, runId, AgentType.NOTIFIER, WorkflowEventType.NOTIFICATION_COMPLETED,
                "Published weekly report completion notice.");

        toolCalls.add(ToolCall.completed("sales-data", "Read weekly sales performance sample data."));
        toolCalls.add(ToolCall.completed("report-generator", "Create weekly sales performance PDF artifact."));
        toolCalls.add(ToolCall.completed("email", "Share the weekly report with sales managers."));
        artifacts.add(new ReportArtifact(
                "report-" + runId,
                runId,
                "Weekly Sales Performance Report",
                ReportFormat.PDF,
                "주간 영업 실적, 리드 전환율, Top Account, 다음 액션이 포함된 리포트가 생성되었습니다.",
                """
                # 주간 영업 실적 리포트

                ## Executive Summary

                이번 주 영업팀은 신규 리드 64건 중 18건을 미팅으로 전환했고, 리드 전환율은 28.1%입니다.
                Top Account 3곳의 예상 파이프라인은 94,000,000원이며, 다음 주에는 리테일/파트너 채널 후속 미팅이 중요합니다.

                ## 핵심 지표

                | 지표 | 값 | 전주 대비 |
                | --- | ---: | ---: |
                | 신규 리드 | 64건 | +12.3% |
                | 미팅 전환 | 18건 | +5.9% |
                | 리드 전환율 | 28.1% | +1.7%p |
                | 예상 파이프라인 | 94,000,000원 | +8.4% |

                ## Top Account

                | 고객 | 단계 | 예상 금액 | 다음 액션 |
                | --- | --- | ---: | --- |
                | Blue Harbor Retail | 제안 검토 | 42,000,000원 | ROI 자료 발송 |
                | Northwind Partners | 가격 협의 | 31,000,000원 | 계약 조건 조율 |
                | Urban Supply Co. | 기술 검토 | 21,000,000원 | 보안 체크리스트 회신 |

                ## Email 공유 미리보기

                - 제목: [IWAP] 주간 영업 실적 리포트
                - 수신자: director@demo-company.com
                - 첨부 형식: PDF
                - 상태: 성공

                ## 추천 액션

                1. Blue Harbor Retail에는 ROI 자료를 먼저 보내 의사결정 속도를 높입니다.
                2. Northwind Partners는 가격 협의 중이므로 할인 승인 기준을 사전 검토합니다.
                3. Urban Supply Co.는 보안 검토가 병목이므로 체크리스트 답변 SLA를 지정합니다.
                """,
                java.time.OffsetDateTime.now()
        ));

        return new WorkflowRun(
                runId,
                "Weekly Sales Performance Report",
                command,
                requestedBy,
                WorkflowStatus.COMPLETED,
                List.copyOf(events),
                List.copyOf(toolCalls),
                List.of(),
                List.copyOf(artifacts),
                List.copyOf(auditTrail)
        );
    }

    private void addEvent(
            List<WorkflowEvent> events,
            List<AuditLogEntry> auditTrail,
            String runId,
            AgentType agentType,
            WorkflowEventType eventType,
            String message
    ) {
        long sequence = events.size() + 1L;
        WorkflowEvent event = WorkflowEvent.of(runId, sequence, agentType, eventType, message);
        events.add(event);
        auditTrail.add(AuditLogEntry.of(runId, sequence, agentType.name(), eventType.name(), message));
        if (publisher != null) {
            publisher.publish(event);
        }
    }

    private String nextRunId(String scenarioKey) {
        String timestamp = java.time.OffsetDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        return "run-" + scenarioKey + "-" + timestamp + "-" + UUID.randomUUID().toString().substring(0, 8);
    }
}

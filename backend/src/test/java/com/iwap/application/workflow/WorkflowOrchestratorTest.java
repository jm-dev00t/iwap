package com.iwap.application.workflow;

import com.iwap.domain.agent.AgentType;
import com.iwap.domain.report.ReportFormat;
import com.iwap.domain.workflow.WorkflowRun;
import com.iwap.domain.workflow.WorkflowStatus;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

class WorkflowOrchestratorTest {

    @Test
    void repeatedStartsForSameScenarioProduceDistinctRunIds() {
        WorkflowOrchestrator orchestrator = new WorkflowOrchestrator();

        WorkflowRun first = orchestrator.start(
                "Generate a monthly sales report.",
                "monthly-sales-report",
                "manager@demo-company.com"
        );
        WorkflowRun second = orchestrator.start(
                "Generate a monthly sales report.",
                "monthly-sales-report",
                "manager@demo-company.com"
        );

        assertThat(second.id()).isNotEqualTo(first.id());
    }

    @Test
    void startingWorkflowPublishesEachGeneratedEvent() {
        WorkflowEventPublisher publisher = mock(WorkflowEventPublisher.class);
        WorkflowOrchestrator orchestrator = new WorkflowOrchestrator(new InMemoryWorkflowRunStore(), publisher);

        WorkflowRun run = orchestrator.start(
                "Generate a monthly sales report.",
                "monthly-sales-report",
                "manager@demo-company.com"
        );

        verify(publisher, times(run.events().size())).publish(any());
    }

    @Test
    void approvalDecisionCannotBeChangedAfterItIsResolved() {
        WorkflowOrchestrator orchestrator = new WorkflowOrchestrator();
        WorkflowRun run = orchestrator.start(
                "Find low inventory and notify the purchase team.",
                "low-inventory",
                "operator@demo-company.com"
        );
        String approvalId = run.approvals().getFirst().id();

        orchestrator.decideApproval(approvalId, true, "manager@demo-company.com");

        assertThatThrownBy(() -> orchestrator.decideApproval(approvalId, false, "manager@demo-company.com"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("already resolved");
    }

    @Test
    void monthlySalesReportCommandProducesPortfolioDemoWorkflow() {
        WorkflowOrchestrator orchestrator = new WorkflowOrchestrator();

        WorkflowRun run = orchestrator.start(
                "이번 달 매출 보고서 만들어서 슬랙 채널과 이메일로 보내줘",
                "monthly-sales-report",
                "manager@demo-company.com"
        );

        assertThat(run.status()).isEqualTo(WorkflowStatus.COMPLETED);
        assertThat(run.title()).isEqualTo("Monthly Sales Report Automation");
        assertThat(run.events())
                .extracting(event -> event.agentType())
                .containsExactly(
                        AgentType.PLANNER,
                        AgentType.EXECUTOR,
                        AgentType.VALIDATOR,
                        AgentType.REPORTER,
                        AgentType.NOTIFIER
                );
        assertThat(run.events())
                .extracting(event -> event.message())
                .contains(
                        "Created a structured plan for monthly sales reporting.",
                        "Generated report and delivered it through Slack and Email."
                );
        assertThat(run.toolCalls())
                .extracting(toolCall -> toolCall.toolName())
                .containsExactly("sales-data", "report-generator", "slack", "email");
        assertThat(run.artifacts()).hasSize(1);
        assertThat(run.artifacts().getFirst().content())
                .contains("143,300,000원")
                .contains("B2B Direct")
                .contains("Online Store")
                .contains("#sales-report")
                .contains("manager@demo-company.com")
                .contains("추천 액션");
        assertThat(run.auditTrail()).hasSizeGreaterThanOrEqualTo(5);
        assertThat(run.approvals()).isEmpty();
    }

    @Test
    void lowInventoryCommandRequiresHumanApprovalBeforePurchasingNotification() {
        WorkflowOrchestrator orchestrator = new WorkflowOrchestrator();

        WorkflowRun run = orchestrator.start(
                "재고 부족 제품 리스트 뽑아서 구매팀 카카오톡으로 보내",
                "low-inventory",
                "operator@demo-company.com"
        );

        assertThat(run.status()).isEqualTo(WorkflowStatus.WAITING_FOR_APPROVAL);
        assertThat(run.approvals()).hasSize(1);
        assertThat(run.approvals().getFirst().reason())
                .contains("purchase team notification");
        assertThat(List.copyOf(run.events()))
                .anySatisfy(event -> {
                    assertThat(event.agentType()).isEqualTo(AgentType.PLANNER);
                    assertThat(event.message()).contains("Approval is required");
                });
    }

    @Test
    void customerOnboardingScenarioCreatesOnboardingWorkflow() {
        WorkflowOrchestrator orchestrator = new WorkflowOrchestrator();

        WorkflowRun run = orchestrator.start(
                "신규 고객 등록 후 환영 이메일 보내고, 고객 관리 시스템에 기록하고, 담당자에게 알림",
                "customer-onboarding",
                "sales@demo-company.com"
        );

        assertThat(run.status()).isEqualTo(WorkflowStatus.COMPLETED);
        assertThat(run.title()).isEqualTo("New Customer Onboarding");
        assertThat(run.toolCalls())
                .extracting(toolCall -> toolCall.toolName())
                .containsExactly("crm", "email", "slack");
        assertThat(run.approvals()).isEmpty();
        assertThat(run.artifacts()).hasSize(1);
        assertThat(run.artifacts().getFirst().content())
                .contains("Blue Harbor Retail")
                .contains("환영 이메일")
                .contains("CRM 등록")
                .contains("담당자 알림");
    }

    @Test
    void weeklySalesScenarioCreatesWeeklyPerformanceReport() {
        WorkflowOrchestrator orchestrator = new WorkflowOrchestrator();

        WorkflowRun run = orchestrator.start(
                "주간 영업 실적 분석해서 PDF 리포트 생성 후 공유",
                "weekly-sales-report",
                "manager@demo-company.com"
        );

        assertThat(run.status()).isEqualTo(WorkflowStatus.COMPLETED);
        assertThat(run.title()).isEqualTo("Weekly Sales Performance Report");
        assertThat(run.toolCalls())
                .extracting(toolCall -> toolCall.toolName())
                .containsExactly("sales-data", "report-generator", "email");
        assertThat(run.artifacts()).hasSize(1);
        assertThat(run.artifacts().getFirst().format()).isEqualTo(ReportFormat.PDF);
        assertThat(run.artifacts().getFirst().content())
                .contains("주간 영업 실적")
                .contains("리드 전환율")
                .contains("Top Account")
                .contains("director@demo-company.com");
    }

    @Test
    void lowInventoryScenarioCreatesApprovalDraftArtifact() {
        WorkflowOrchestrator orchestrator = new WorkflowOrchestrator();

        WorkflowRun run = orchestrator.start(
                "재고 부족 제품 리스트 뽑아서 구매팀 카카오톡으로 보내",
                "low-inventory",
                "operator@demo-company.com"
        );

        assertThat(run.artifacts()).hasSize(1);
        assertThat(run.artifacts().getFirst().content())
                .contains("재고 부족 구매 알림 초안")
                .contains("SKU-RED-001")
                .contains("승인 대기")
                .contains("구매팀");
    }
}

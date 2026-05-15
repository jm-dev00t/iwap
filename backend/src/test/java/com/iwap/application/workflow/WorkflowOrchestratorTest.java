package com.iwap.application.workflow;

import com.iwap.application.agent.*;
import com.iwap.application.delivery.DeliveryService;
import com.iwap.application.tool.ToolRegistry;
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

    // 헬퍼: 모든 Agent를 실제 구현으로 조합한 Orchestrator 생성
    private WorkflowOrchestrator buildOrchestrator(WorkflowRunStore store, WorkflowEventPublisher publisher) {
        var recorder = new WorkflowEventRecorder();
        var delivery = DeliveryService.demo();
        var toolRegistry = new ToolRegistry(List.of());
        return new WorkflowOrchestrator(
                store, publisher, delivery,
                new PlannerAgent(recorder),
                new ExecutorAgent(toolRegistry, recorder),
                new ValidatorAgent(recorder),
                new ReporterAgent(recorder),
                new NotifierAgent(recorder, delivery)
        );
    }

    @Test
    void repeatedStartsForSameScenarioProduceDistinctRunIds() {
        WorkflowOrchestrator orchestrator = buildOrchestrator(new InMemoryWorkflowRunStore(), null);

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
        WorkflowOrchestrator orchestrator = buildOrchestrator(new InMemoryWorkflowRunStore(), publisher);

        WorkflowRun run = orchestrator.start(
                "Generate a monthly sales report.",
                "monthly-sales-report",
                "manager@demo-company.com"
        );

        verify(publisher, times(run.events().size())).publish(any());
    }

    @Test
    void approvalDecisionCannotBeChangedAfterItIsResolved() {
        WorkflowOrchestrator orchestrator = buildOrchestrator(new InMemoryWorkflowRunStore(), null);
        WorkflowRun run = orchestrator.start(
                "Find low inventory and notify the purchase team.",
                "low-inventory",
                "operator@demo-company.com"
        );

        String approvalId = run.approvals().get(0).id();
        orchestrator.decideApproval(approvalId, true, "manager@demo-company.com");

        assertThatThrownBy(() ->
                orchestrator.decideApproval(approvalId, false, "manager@demo-company.com")
        ).isInstanceOf(IllegalStateException.class);
    }

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
}

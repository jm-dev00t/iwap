package com.iwap.application.workflow;

import com.iwap.application.agent.ExecutorAgent;
import com.iwap.application.agent.NotifierAgent;
import com.iwap.application.agent.PlannerAgent;
import com.iwap.application.agent.ReporterAgent;
import com.iwap.application.agent.ValidatorAgent;
import com.iwap.application.tool.ToolRegistry;
import com.iwap.domain.agent.AgentType;
import com.iwap.domain.workflow.WorkflowRun;
import com.iwap.domain.workflow.WorkflowStatus;
import com.iwap.infrastructure.tools.MockBusinessTool;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class WorkflowOrchestratorTest {

    @Test
    void monthlySalesReportCommandProducesPortfolioDemoWorkflow() {
        WorkflowOrchestrator orchestrator = orchestrator();

        WorkflowRun run = orchestrator.start(
                "Create this month sales report and send it to Slack and Email",
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
                        "Created a structured plan for Monthly Sales Report Automation.",
                        "Executed 4 tool calls for Monthly Sales Report Automation."
                );
        assertThat(run.toolCalls())
                .extracting(toolCall -> toolCall.toolName())
                .containsExactly("sales-data", "report-generator", "slack", "email");
        assertThat(run.artifacts())
                .extracting(artifact -> artifact.format().name())
                .containsExactly("MARKDOWN");
        assertThat(run.auditTrail()).hasSizeGreaterThanOrEqualTo(5);
        assertThat(run.approvals()).isEmpty();
    }

    @Test
    void lowInventoryCommandRequiresHumanApprovalBeforePurchasingNotification() {
        WorkflowOrchestrator orchestrator = orchestrator();

        WorkflowRun run = orchestrator.start(
                "Find low inventory products and send a Kakao purchasing notification",
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
    void completedRunsAreStoredForHistoryView() {
        WorkflowOrchestrator orchestrator = orchestrator();

        orchestrator.start("Create this month sales report", "manager@demo-company.com");
        orchestrator.start("Create weekly sales performance report", "manager@demo-company.com");

        assertThat(orchestrator.history()).hasSize(2);
    }

    @Test
    void approvalDecisionUpdatesWorkflowStatusAndAuditTrail() {
        WorkflowOrchestrator orchestrator = orchestrator();
        WorkflowRun waitingRun = orchestrator.start(
                "Find low inventory products and send a Kakao purchasing notification",
                "operator@demo-company.com"
        );

        WorkflowRun approvedRun = orchestrator.decideApproval(
                waitingRun.approvals().getFirst().id(),
                true,
                "manager@demo-company.com"
        );

        assertThat(approvedRun.status()).isEqualTo(WorkflowStatus.COMPLETED);
        assertThat(approvedRun.approvals().getFirst().status().name()).isEqualTo("APPROVED");
        assertThat(approvedRun.auditTrail())
                .anySatisfy(entry -> assertThat(entry.action()).isEqualTo("APPROVAL_APPROVED"));
    }

    private WorkflowOrchestrator orchestrator() {
        WorkflowEventRecorder recorder = new WorkflowEventRecorder();
        ToolRegistry registry = new ToolRegistry(List.of(
                new MockBusinessTool("sales-data"),
                new MockBusinessTool("report-generator"),
                new MockBusinessTool("slack"),
                new MockBusinessTool("email"),
                new MockBusinessTool("crm"),
                new MockBusinessTool("inventory"),
                new MockBusinessTool("kakao")
        ));

        return new WorkflowOrchestrator(
                new PlannerAgent(recorder),
                new ExecutorAgent(registry, recorder),
                new ValidatorAgent(recorder),
                new ReporterAgent(recorder),
                new NotifierAgent(recorder),
                new InMemoryWorkflowRunStore()
        );
    }
}

package com.iwap.application.assistant;

import com.iwap.application.agent.*;
import com.iwap.application.datasource.DataSourceService;
import com.iwap.application.delivery.DeliveryService;
import com.iwap.application.tool.ToolRegistry;
import com.iwap.application.workflow.*;
import com.iwap.domain.workflow.WorkflowRun;
import com.iwap.domain.workflow.WorkflowStatus;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AssistantServiceTest {

    @Test
    void asksForEmailBeforeCreatingExternalDeliveryPlan() {
        AssistantService assistant = assistantService();

        AssistantChatResponse response = assistant.chat(new AssistantChatRequest(null, "이번 달 매출 보고서 만들어서 메일로 보내줘"));

        assertThat(response.state()).isEqualTo(AssistantState.NEEDS_INPUT);
        assertThat(response.missingFields()).containsExactly("recipientEmail");
        assertThat(response.assistantMessage()).contains("이메일");
        assertThat(response.plan()).isNull();
        assertThat(response.run()).isNull();
    }

    @Test
    void createsPlanAfterMissingEmailIsProvidedWithoutExecutingWorkflow() {
        AssistantService assistant = assistantService();
        AssistantChatResponse first = assistant.chat(new AssistantChatRequest(null, "이번 달 매출 보고서 만들어서 메일로 보내줘"));

        AssistantChatResponse response = assistant.chat(new AssistantChatRequest(first.sessionId(), "manager@demo-company.com"));

        assertThat(response.state()).isEqualTo(AssistantState.PLAN_READY);
        assertThat(response.plan()).isNotNull();
        assertThat(response.plan().summary()).contains("월간 매출 보고서");
        assertThat(response.plan().requiresApproval()).isTrue();
        assertThat(response.plan().actions())
                .extracting(AssistantPlanAction::toolName)
                .containsExactly("sales-data", "report-generator", "email");
        assertThat(response.run()).isNull();
    }

    @Test
    void executesApprovedPlanThroughWorkflowOrchestrator() {
        AssistantService assistant = assistantService();
        AssistantChatResponse first = assistant.chat(new AssistantChatRequest(null, "이번 달 매출 보고서 만들어서 manager@demo-company.com으로 보내줘"));

        WorkflowRun run = assistant.execute(first.plan().id(), new AssistantPlanExecutionRequest(true));

        assertThat(run.status()).isEqualTo(WorkflowStatus.COMPLETED);
        assertThat(run.title()).isEqualTo("Monthly Sales Report Automation");
        // MockAssistantPlanner는 이메일 수신자가 있을 때 email action만 생성한다
        assertThat(run.toolCalls())
                .extracting(toolCall -> toolCall.toolName())
                .contains("email");
    }

    @Test
    void refusesToExecutePlanWithoutApproval() {
        AssistantService assistant = assistantService();
        AssistantChatResponse first = assistant.chat(new AssistantChatRequest(null, "이번 달 매출 보고서 만들어서 manager@demo-company.com으로 보내줘"));

        assertThatThrownBy(() -> assistant.execute(first.plan().id(), new AssistantPlanExecutionRequest(false)))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("approval");
    }

    @Test
    void affirmativeChatMessageExecutesPendingPlan() {
        AssistantService assistant = assistantService();
        AssistantChatResponse first = assistant.chat(new AssistantChatRequest(null, "이번 달 매출 보고서 만들어서 manager@demo-company.com으로 보내줘"));

        AssistantChatResponse response = assistant.chat(new AssistantChatRequest(first.sessionId(), "응 실행해"));

        assertThat(response.state()).isEqualTo(AssistantState.EXECUTED);
        assertThat(response.run()).isNotNull();
        assertThat(response.run().status()).isEqualTo(WorkflowStatus.COMPLETED);
    }

    @Test
    void routesCommonKoreanBusinessCommandsToDifferentScenarios() {
        AssistantService assistant = assistantService();

        assertThat(assistant.chat(new AssistantChatRequest(null, "이번 주 영업실적 리포트 만들고 공유해줘")).plan().scenarioKey())
                .isEqualTo("weekly-sales-report");
        assertThat(assistant.chat(new AssistantChatRequest(null, "재고 부족 품목 확인하고 구매팀에 알림 보내줘")).plan().scenarioKey())
                .isEqualTo("low-inventory");
        assertThat(assistant.chat(new AssistantChatRequest(null, "Blue Harbor Retail 신규 고객 온보딩 처리해줘")).plan().scenarioKey())
                .isEqualTo("customer-onboarding");
    }

    private AssistantService assistantService() {
        var recorder = new WorkflowEventRecorder();
        var delivery = DeliveryService.demo();
        var toolRegistry = new ToolRegistry(List.of());
        WorkflowOrchestrator orchestrator = new WorkflowOrchestrator(
                new InMemoryWorkflowRunStore(), null, delivery,
                new PlannerAgent(recorder),
                new ExecutorAgent(toolRegistry, recorder),
                new ValidatorAgent(recorder),
                new ReporterAgent(recorder, new DataSourceService()),
                new NotifierAgent(recorder, delivery)
        );
        return new AssistantService(new MockAssistantPlanner(), new InMemoryAssistantSessionStore(), new InMemoryAssistantPlanStore(), orchestrator);
    }
}

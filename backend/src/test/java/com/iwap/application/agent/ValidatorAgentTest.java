// ValidatorAgent의 검증 로직(도구 실행 여부, 요청자 정보)을 테스트하는 단위 테스트
package com.iwap.application.agent;

import com.iwap.application.workflow.WorkflowContext;
import com.iwap.application.workflow.WorkflowEventRecorder;
import com.iwap.domain.agent.AgentType;
import com.iwap.domain.tool.ToolCall;
import com.iwap.domain.workflow.WorkflowEventType;
import com.iwap.domain.workflow.WorkflowPlan;
import com.iwap.domain.workflow.WorkflowScenario;
import com.iwap.domain.workflow.WorkflowStep;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class ValidatorAgentTest {

    @Test
    void emitsWarningWhenNoToolCallsExecuted() {
        WorkflowContext context = new WorkflowContext("run-1", "test", "user@test.com");
        context.setPlan(new WorkflowPlan(
                WorkflowScenario.MONTHLY_SALES_REPORT, "Test", false, "",
                List.of(new WorkflowStep(1, AgentType.EXECUTOR, "Read data", "desc", "sales-data"))
        ));
        // 도구 호출 없음

        new ValidatorAgent(new WorkflowEventRecorder()).handle(context);

        assertThat(context.events())
                .anyMatch(e -> e.eventType() == WorkflowEventType.VALIDATION_WARNING);
        assertThat(context.events())
                .anyMatch(e -> e.eventType() == WorkflowEventType.VALIDATION_COMPLETED);
    }

    @Test
    void passesValidationWhenAllToolsExecuted() {
        WorkflowContext context = new WorkflowContext("run-2", "test", "user@test.com");
        context.setPlan(new WorkflowPlan(
                WorkflowScenario.MONTHLY_SALES_REPORT, "Test", false, "",
                List.of(new WorkflowStep(1, AgentType.EXECUTOR, "Read data", "desc", "sales-data"))
        ));
        context.toolCalls().add(ToolCall.completed("sales-data", "Read sales data"));

        new ValidatorAgent(new WorkflowEventRecorder()).handle(context);

        assertThat(context.events())
                .noneMatch(e -> e.eventType() == WorkflowEventType.VALIDATION_WARNING);
        assertThat(context.events())
                .anyMatch(e -> e.eventType() == WorkflowEventType.VALIDATION_COMPLETED
                        && e.message().contains("통과"));
    }
}

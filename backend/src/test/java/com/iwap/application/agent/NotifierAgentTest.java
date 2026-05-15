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

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
            switch (step.toolName()) {
                case "slack" -> deliveryService.sendSlack(null,
                        context.plan().title() + " 완료. 상세 내용은 IWAP 보고서를 확인하세요.");
                case "email" -> deliveryService.sendEmail(
                        context.requestedBy(),
                        "[IWAP] " + context.plan().title() + " 완료",
                        context.plan().title() + " 워크플로가 완료되었습니다. IWAP 대시보드에서 보고서를 확인하세요.");
                default -> deliveryService.recordKakaoWork(null,
                        context.plan().title() + " 완료 알림");
            }
            context.toolCalls().add(ToolCall.completed(step.toolName(), step.description()));
        }

        recorder.record(context, type(), WorkflowEventType.NOTIFICATION_COMPLETED,
                "Published completion notice to the requester and workflow history.");
    }
}

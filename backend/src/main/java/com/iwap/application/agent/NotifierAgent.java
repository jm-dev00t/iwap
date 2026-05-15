// 워크플로 완료 후 Slack/Email 알림을 발송하는 에이전트
package com.iwap.application.agent;

import com.iwap.application.delivery.DeliveryReceipt;
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
        int succeeded = 0;
        int failed = 0;

        for (WorkflowStep step : context.plan().steps()) {
            if (step.owner() != AgentType.NOTIFIER) continue;

            DeliveryReceipt receipt = switch (step.toolName()) {
                case "slack" -> deliveryService.sendSlack(null,
                        context.plan().title() + " 완료. 상세 내용은 IWAP 보고서를 확인하세요.");
                case "email" -> deliveryService.sendEmail(
                        context.requestedBy(),
                        "[IWAP] " + context.plan().title() + " 완료",
                        buildEmailBody(context));
                default -> deliveryService.recordKakaoWork(null,
                        context.plan().title() + " 완료 알림");
            };

            if (receipt.successful()) {
                context.toolCalls().add(ToolCall.completed(step.toolName(), step.description()));
                succeeded++;
            } else {
                context.toolCalls().add(ToolCall.failed(step.toolName(), step.description()));
                failed++;
            }
        }

        String summary = succeeded + "건 발송 완료" + (failed > 0 ? ", " + failed + "건 실패" : "");
        recorder.record(context, type(), WorkflowEventType.NOTIFICATION_COMPLETED, summary);
    }

    private String buildEmailBody(WorkflowContext context) {
        StringBuilder sb = new StringBuilder();
        sb.append(context.plan().title()).append(" 워크플로가 완료되었습니다.\n\n");

        if (!context.artifacts().isEmpty()) {
            context.artifacts().forEach(artifact -> {
                sb.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
                sb.append("📄 ").append(artifact.title()).append("\n");
                sb.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n");
                sb.append(artifact.content()).append("\n\n");
            });
        } else {
            sb.append("IWAP 대시보드에서 보고서를 확인하세요.\n");
        }

        sb.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
        sb.append("이 메일은 IWAP 워크플로 자동화 시스템에서 발송되었습니다.");
        return sb.toString();
    }
}

package com.iwap.application.agent;

import com.iwap.application.workflow.WorkflowContext;
import com.iwap.application.workflow.WorkflowEventRecorder;
import com.iwap.domain.agent.AgentType;
import com.iwap.domain.workflow.WorkflowEventType;
import org.springframework.stereotype.Component;

@Component
public class NotifierAgent implements WorkflowAgent {

    private final WorkflowEventRecorder recorder;

    public NotifierAgent(WorkflowEventRecorder recorder) {
        this.recorder = recorder;
    }

    @Override
    public AgentType type() {
        return AgentType.NOTIFIER;
    }

    @Override
    public void handle(WorkflowContext context) {
        recorder.record(context, type(), WorkflowEventType.NOTIFICATION_COMPLETED,
                "Published completion notice to the requester and workflow history.");
    }
}

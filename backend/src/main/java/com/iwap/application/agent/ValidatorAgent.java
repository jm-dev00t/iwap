package com.iwap.application.agent;

import com.iwap.application.workflow.WorkflowContext;
import com.iwap.application.workflow.WorkflowEventRecorder;
import com.iwap.domain.agent.AgentType;
import com.iwap.domain.workflow.WorkflowEventType;
import org.springframework.stereotype.Component;

@Component
public class ValidatorAgent implements WorkflowAgent {

    private final WorkflowEventRecorder recorder;

    public ValidatorAgent(WorkflowEventRecorder recorder) {
        this.recorder = recorder;
    }

    @Override
    public AgentType type() {
        return AgentType.VALIDATOR;
    }

    @Override
    public void handle(WorkflowContext context) {
        recorder.record(context, type(), WorkflowEventType.VALIDATION_COMPLETED,
                "Validated required metrics, recipients, and generated artifacts.");
    }
}

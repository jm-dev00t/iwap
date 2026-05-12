package com.iwap.application.workflow;

import com.iwap.domain.agent.AgentType;
import com.iwap.domain.audit.AuditLogEntry;
import com.iwap.domain.workflow.WorkflowEvent;
import com.iwap.domain.workflow.WorkflowEventType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class WorkflowEventRecorder {

    private final WorkflowEventPublisher publisher;

    public WorkflowEventRecorder() {
        this.publisher = null;
    }

    @Autowired
    public WorkflowEventRecorder(WorkflowEventPublisher publisher) {
        this.publisher = publisher;
    }

    public void record(WorkflowContext context, AgentType agentType, WorkflowEventType eventType, String message) {
        long sequence = context.events().size() + 1L;
        WorkflowEvent event = WorkflowEvent.of(context.runId(), sequence, agentType, eventType, message);
        context.events().add(event);
        context.auditTrail().add(AuditLogEntry.of(
                context.runId(),
                sequence,
                agentType.name(),
                eventType.name(),
                message
        ));
        if (publisher != null) {
            publisher.publish(event);
        }
    }
}

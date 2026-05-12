package com.iwap.domain.workflow;

import com.iwap.domain.agent.AgentType;

import java.time.OffsetDateTime;
import java.util.Map;

public record WorkflowEvent(
        String runId,
        long sequence,
        AgentType agentType,
        WorkflowEventType eventType,
        String message,
        Map<String, Object> metadata,
        OffsetDateTime occurredAt
) {
    public static WorkflowEvent of(
            String runId,
            long sequence,
            AgentType agentType,
            WorkflowEventType eventType,
            String message
    ) {
        return new WorkflowEvent(runId, sequence, agentType, eventType, message, Map.of(), OffsetDateTime.now());
    }
}

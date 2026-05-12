package com.iwap.domain.workflow;

import com.iwap.domain.agent.AgentType;

public record WorkflowStep(
        int order,
        AgentType owner,
        String title,
        String description,
        String toolName
) {
}

package com.iwap.application.agent;

import com.iwap.application.workflow.WorkflowContext;
import com.iwap.domain.agent.AgentType;

public interface WorkflowAgent {
    AgentType type();

    void handle(WorkflowContext context);
}

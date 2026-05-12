package com.iwap.application.tool;

import com.iwap.domain.workflow.WorkflowStep;

public interface BusinessTool {
    String name();

    ToolExecutionResult execute(WorkflowStep step);
}

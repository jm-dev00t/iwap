package com.iwap.infrastructure.tools;

import com.iwap.application.tool.BusinessTool;
import com.iwap.application.tool.ToolExecutionResult;
import com.iwap.domain.workflow.WorkflowStep;

/**
 * Mock enterprise adapter used by the portfolio demo.
 *
 * <p>Real customer projects replace these beans with REST, DB view, CSV/Excel,
 * webhook, or vendor SDK adapters without changing agent orchestration code.</p>
 */
public class MockBusinessTool implements BusinessTool {

    private final String name;

    public MockBusinessTool(String name) {
        this.name = name;
    }

    @Override
    public String name() {
        return name;
    }

    @Override
    public ToolExecutionResult execute(WorkflowStep step) {
        return new ToolExecutionResult(name, step.description(), true, "Mock adapter completed: " + step.title());
    }
}

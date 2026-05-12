package com.iwap.application.tool;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class ToolRegistry {

    private final Map<String, BusinessTool> tools;

    public ToolRegistry(List<BusinessTool> tools) {
        this.tools = tools.stream().collect(Collectors.toMap(BusinessTool::name, Function.identity()));
    }

    public ToolExecutionResult execute(String toolName, com.iwap.domain.workflow.WorkflowStep step) {
        BusinessTool tool = tools.get(toolName);

        if (tool == null) {
            return new ToolExecutionResult(toolName, step.description(), false,
                    "No tool adapter is registered for " + toolName + ".");
        }

        return tool.execute(step);
    }

    public List<String> toolNames() {
        return tools.keySet().stream().sorted().toList();
    }
}

package com.iwap.application.agent;

import com.iwap.application.tool.ToolExecutionResult;
import com.iwap.application.tool.ToolRegistry;
import com.iwap.application.workflow.WorkflowContext;
import com.iwap.application.workflow.WorkflowEventRecorder;
import com.iwap.domain.agent.AgentType;
import com.iwap.domain.tool.ToolCall;
import com.iwap.domain.workflow.WorkflowEventType;
import com.iwap.domain.workflow.WorkflowStep;
import org.springframework.stereotype.Component;

@Component
public class ExecutorAgent implements WorkflowAgent {

    private final ToolRegistry toolRegistry;
    private final WorkflowEventRecorder recorder;

    public ExecutorAgent(ToolRegistry toolRegistry, WorkflowEventRecorder recorder) {
        this.toolRegistry = toolRegistry;
        this.recorder = recorder;
    }

    @Override
    public AgentType type() {
        return AgentType.EXECUTOR;
    }

    @Override
    public void handle(WorkflowContext context) {
        for (WorkflowStep step : context.plan().steps()) {
            if (step.owner() != AgentType.EXECUTOR && step.owner() != AgentType.REPORTER && step.owner() != AgentType.NOTIFIER) {
                continue;
            }

            ToolExecutionResult result = toolRegistry.execute(step.toolName(), step);
            if (result.successful()) {
                context.toolCalls().add(ToolCall.completed(result.toolName(), result.purpose()));
            }
        }

        recorder.record(context, type(), WorkflowEventType.TOOL_CALL_COMPLETED,
                "Executed " + context.toolCalls().size() + " tool calls for " + context.plan().title() + ".");
    }
}

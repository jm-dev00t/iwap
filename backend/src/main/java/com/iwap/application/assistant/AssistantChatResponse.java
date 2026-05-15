package com.iwap.application.assistant;

import com.iwap.domain.workflow.WorkflowRun;

import java.util.List;

public record AssistantChatResponse(
        String sessionId,
        String assistantMessage,
        AssistantState state,
        AssistantPlan plan,
        List<String> missingFields,
        WorkflowRun run
) {
}

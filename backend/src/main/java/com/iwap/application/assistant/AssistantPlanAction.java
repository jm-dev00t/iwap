package com.iwap.application.assistant;

public record AssistantPlanAction(
        int order,
        String toolName,
        String title,
        String description,
        boolean external
) {
}

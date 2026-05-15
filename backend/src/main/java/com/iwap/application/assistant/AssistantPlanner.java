package com.iwap.application.assistant;

public interface AssistantPlanner {
    AssistantPlan plan(String command, AssistantSession session);
}

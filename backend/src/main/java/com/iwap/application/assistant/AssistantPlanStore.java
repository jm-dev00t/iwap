package com.iwap.application.assistant;

public interface AssistantPlanStore {
    AssistantPlan save(AssistantPlan plan);

    AssistantPlan findById(String planId);
}

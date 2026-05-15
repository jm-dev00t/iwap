package com.iwap.application.assistant;

import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class InMemoryAssistantPlanStore implements AssistantPlanStore {

    private final Map<String, AssistantPlan> plans = new ConcurrentHashMap<>();

    @Override
    public AssistantPlan save(AssistantPlan plan) {
        plans.put(plan.id(), plan);
        return plan;
    }

    @Override
    public AssistantPlan findById(String planId) {
        AssistantPlan plan = plans.get(planId);
        if (plan == null) {
            throw new IllegalArgumentException("Assistant plan was not found: " + planId);
        }
        return plan;
    }
}

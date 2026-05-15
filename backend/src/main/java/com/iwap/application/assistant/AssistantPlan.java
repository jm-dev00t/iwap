package com.iwap.application.assistant;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

public record AssistantPlan(
        String id,
        String sessionId,
        String intent,
        double confidence,
        String summary,
        List<String> missingFields,
        List<AssistantPlanAction> actions,
        boolean requiresApproval,
        String approvalReason,
        String scenarioKey,
        String command,
        String requestedBy,
        Map<String, Object> slots,
        String providerMode,
        OffsetDateTime createdAt
) {
    public AssistantPlan withIdentity(String planId, String nextSessionId) {
        return new AssistantPlan(
                planId,
                nextSessionId,
                intent,
                confidence,
                summary,
                missingFields == null ? List.of() : List.copyOf(missingFields),
                actions == null ? List.of() : List.copyOf(actions),
                requiresApproval,
                approvalReason,
                scenarioKey,
                command,
                requestedBy,
                slots == null ? Map.of() : Map.copyOf(slots),
                providerMode,
                createdAt == null ? OffsetDateTime.now() : createdAt
        );
    }
}

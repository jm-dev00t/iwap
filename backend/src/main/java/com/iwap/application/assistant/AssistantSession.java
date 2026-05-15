// 어시스턴트 대화 세션 — 대기 중인 커맨드/플랜과 대화 히스토리를 보관
package com.iwap.application.assistant;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public record AssistantSession(
        String id,
        String pendingCommand,
        String pendingPlanId,
        Map<String, Object> slots,
        List<AssistantMessage> messages
) {
    public AssistantSession withPendingCommand(String command) {
        return new AssistantSession(id, command, null, slots == null ? Map.of() : Map.copyOf(slots), messages);
    }

    public AssistantSession withPendingPlan(String planId) {
        return new AssistantSession(id, null, planId, slots == null ? Map.of() : Map.copyOf(slots), messages);
    }

    public AssistantSession clearPendingPlan() {
        return new AssistantSession(id, pendingCommand, null, slots == null ? Map.of() : Map.copyOf(slots), messages);
    }

    public AssistantSession withMessage(String role, String content) {
        var newMessages = new ArrayList<>(messages == null ? List.of() : messages);
        newMessages.add(new AssistantMessage(role, content));
        return new AssistantSession(id, pendingCommand, pendingPlanId, slots == null ? Map.of() : Map.copyOf(slots), List.copyOf(newMessages));
    }
}

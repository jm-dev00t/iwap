package com.iwap.domain.tool;

import java.time.OffsetDateTime;
import java.util.Map;

public record ToolCall(
        String toolName,
        String purpose,
        Map<String, Object> arguments,
        ToolCallStatus status,
        OffsetDateTime completedAt
) {
    public static ToolCall completed(String toolName, String purpose) {
        return new ToolCall(toolName, purpose, Map.of(), ToolCallStatus.COMPLETED, OffsetDateTime.now());
    }

    public static ToolCall failed(String toolName, String purpose) {
        return new ToolCall(toolName, purpose, Map.of(), ToolCallStatus.FAILED, OffsetDateTime.now());
    }
}

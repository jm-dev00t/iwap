package com.iwap.application.tool;

public record ToolExecutionResult(
        String toolName,
        String purpose,
        boolean successful,
        String summary
) {
}

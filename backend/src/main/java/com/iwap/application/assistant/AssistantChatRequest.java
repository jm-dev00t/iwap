package com.iwap.application.assistant;

import jakarta.validation.constraints.NotBlank;

public record AssistantChatRequest(
        String sessionId,
        @NotBlank String message
) {
}

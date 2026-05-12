package com.iwap.interfaces.api.workflow;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record StartWorkflowRunRequest(
        @NotBlank String command,
        String scenarioKey,
        @Email @NotBlank String requestedBy
) {
}

package com.iwap.interfaces.api.approval;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record ApprovalDecisionRequest(
        @Email @NotBlank String decidedBy
) {
}

package com.iwap.domain.approval;

import java.time.OffsetDateTime;

public record ApprovalRequest(
        String id,
        String runId,
        String requestedByAgent,
        String reason,
        ApprovalStatus status,
        OffsetDateTime requestedAt
) {
    public static ApprovalRequest pending(String id, String runId, String requestedByAgent, String reason) {
        return new ApprovalRequest(id, runId, requestedByAgent, reason, ApprovalStatus.PENDING, OffsetDateTime.now());
    }
}

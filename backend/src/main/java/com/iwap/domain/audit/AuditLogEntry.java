package com.iwap.domain.audit;

import java.time.OffsetDateTime;
import java.util.Map;

public record AuditLogEntry(
        String runId,
        long sequence,
        String actor,
        String action,
        String summary,
        Map<String, Object> metadata,
        OffsetDateTime occurredAt
) {
    public static AuditLogEntry of(String runId, long sequence, String actor, String action, String summary) {
        return new AuditLogEntry(runId, sequence, actor, action, summary, Map.of(), OffsetDateTime.now());
    }
}

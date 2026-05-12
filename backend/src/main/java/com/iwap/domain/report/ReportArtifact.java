package com.iwap.domain.report;

import java.time.OffsetDateTime;

public record ReportArtifact(
        String id,
        String runId,
        String title,
        ReportFormat format,
        String summary,
        String content,
        OffsetDateTime createdAt
) {
    public static ReportArtifact markdown(String runId, String title, String summary, String content) {
        return new ReportArtifact(
                "report-" + runId,
                runId,
                title,
                ReportFormat.MARKDOWN,
                summary,
                content,
                OffsetDateTime.now()
        );
    }
}

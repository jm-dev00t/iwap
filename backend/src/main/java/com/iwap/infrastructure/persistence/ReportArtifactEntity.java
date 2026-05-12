package com.iwap.infrastructure.persistence;

import com.iwap.domain.report.ReportFormat;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;

@Entity
@Table(name = "report_artifacts")
class ReportArtifactEntity {

    @Id
    private String id;

    @Column(name = "run_id")
    private String runId;

    private String title;

    @Enumerated(EnumType.STRING)
    private ReportFormat format;

    @Column(columnDefinition = "text")
    private String summary;

    @Column(columnDefinition = "text")
    private String content;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    protected ReportArtifactEntity() {
    }

    ReportArtifactEntity(String id, String runId, String title, ReportFormat format, String summary, String content, OffsetDateTime createdAt) {
        this.id = id;
        this.runId = runId;
        this.title = title;
        this.format = format;
        this.summary = summary;
        this.content = content;
        this.createdAt = createdAt;
    }

    String getId() {
        return id;
    }

    String getRunId() {
        return runId;
    }

    String getTitle() {
        return title;
    }

    ReportFormat getFormat() {
        return format;
    }

    String getSummary() {
        return summary;
    }

    String getContent() {
        return content;
    }

    OffsetDateTime getCreatedAt() {
        return createdAt;
    }
}

package com.iwap.infrastructure.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.Map;

@Entity
@Table(name = "audit_logs")
class AuditLogEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "run_id")
    private String runId;

    @Column(name = "sequence_no")
    private long sequenceNo;

    private String actor;

    private String action;

    @Column(columnDefinition = "text")
    private String summary;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> metadata;

    @Column(name = "occurred_at")
    private OffsetDateTime occurredAt;

    protected AuditLogEntity() {
    }

    AuditLogEntity(String runId, long sequenceNo, String actor, String action, String summary, Map<String, Object> metadata, OffsetDateTime occurredAt) {
        this.runId = runId;
        this.sequenceNo = sequenceNo;
        this.actor = actor;
        this.action = action;
        this.summary = summary;
        this.metadata = metadata;
        this.occurredAt = occurredAt;
    }

    String getRunId() {
        return runId;
    }

    long getSequenceNo() {
        return sequenceNo;
    }

    String getActor() {
        return actor;
    }

    String getAction() {
        return action;
    }

    String getSummary() {
        return summary;
    }

    Map<String, Object> getMetadata() {
        return metadata;
    }

    OffsetDateTime getOccurredAt() {
        return occurredAt;
    }
}

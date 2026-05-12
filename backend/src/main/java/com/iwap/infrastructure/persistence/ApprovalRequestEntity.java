package com.iwap.infrastructure.persistence;

import com.iwap.domain.approval.ApprovalStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;

@Entity
@Table(name = "approval_requests")
class ApprovalRequestEntity {

    @Id
    private String id;

    @Column(name = "run_id")
    private String runId;

    @Column(name = "requested_by_agent")
    private String requestedByAgent;

    @Column(columnDefinition = "text")
    private String reason;

    @Enumerated(EnumType.STRING)
    private ApprovalStatus status;

    @Column(name = "requested_at")
    private OffsetDateTime requestedAt;

    @Column(name = "decided_at")
    private OffsetDateTime decidedAt;

    protected ApprovalRequestEntity() {
    }

    ApprovalRequestEntity(String id, String runId, String requestedByAgent, String reason, ApprovalStatus status, OffsetDateTime requestedAt, OffsetDateTime decidedAt) {
        this.id = id;
        this.runId = runId;
        this.requestedByAgent = requestedByAgent;
        this.reason = reason;
        this.status = status;
        this.requestedAt = requestedAt;
        this.decidedAt = decidedAt;
    }

    String getId() {
        return id;
    }

    String getRunId() {
        return runId;
    }

    String getRequestedByAgent() {
        return requestedByAgent;
    }

    String getReason() {
        return reason;
    }

    ApprovalStatus getStatus() {
        return status;
    }

    OffsetDateTime getRequestedAt() {
        return requestedAt;
    }
}

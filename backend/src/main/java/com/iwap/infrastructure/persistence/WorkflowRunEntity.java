package com.iwap.infrastructure.persistence;

import com.iwap.domain.workflow.WorkflowStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;

@Entity
@Table(name = "workflow_runs")
class WorkflowRunEntity {

    @Id
    private String id;

    private String title;

    @Column(columnDefinition = "text")
    private String command;

    @Column(name = "requested_by")
    private String requestedBy;

    @Enumerated(EnumType.STRING)
    private WorkflowStatus status;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @Column(name = "completed_at")
    private OffsetDateTime completedAt;

    protected WorkflowRunEntity() {
    }

    WorkflowRunEntity(
            String id,
            String title,
            String command,
            String requestedBy,
            WorkflowStatus status,
            OffsetDateTime createdAt,
            OffsetDateTime completedAt
    ) {
        this.id = id;
        this.title = title;
        this.command = command;
        this.requestedBy = requestedBy;
        this.status = status;
        this.createdAt = createdAt;
        this.completedAt = completedAt;
    }

    String getId() {
        return id;
    }

    String getTitle() {
        return title;
    }

    String getCommand() {
        return command;
    }

    String getRequestedBy() {
        return requestedBy;
    }

    WorkflowStatus getStatus() {
        return status;
    }

    OffsetDateTime getCreatedAt() {
        return createdAt;
    }
}

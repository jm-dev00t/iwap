package com.iwap.infrastructure.persistence;

import com.iwap.domain.agent.AgentType;
import com.iwap.domain.workflow.WorkflowEventType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.Map;

@Entity
@Table(name = "workflow_events")
class WorkflowEventEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "run_id")
    private String runId;

    @Column(name = "sequence_no")
    private long sequenceNo;

    @Enumerated(EnumType.STRING)
    @Column(name = "agent_type")
    private AgentType agentType;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type")
    private WorkflowEventType eventType;

    private String message;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> metadata;

    @Column(name = "occurred_at")
    private OffsetDateTime occurredAt;

    protected WorkflowEventEntity() {
    }

    WorkflowEventEntity(String runId, long sequenceNo, AgentType agentType, WorkflowEventType eventType, String message, Map<String, Object> metadata, OffsetDateTime occurredAt) {
        this.runId = runId;
        this.sequenceNo = sequenceNo;
        this.agentType = agentType;
        this.eventType = eventType;
        this.message = message;
        this.metadata = metadata;
        this.occurredAt = occurredAt;
    }

    String getRunId() {
        return runId;
    }

    long getSequenceNo() {
        return sequenceNo;
    }

    AgentType getAgentType() {
        return agentType;
    }

    WorkflowEventType getEventType() {
        return eventType;
    }

    String getMessage() {
        return message;
    }

    Map<String, Object> getMetadata() {
        return metadata;
    }

    OffsetDateTime getOccurredAt() {
        return occurredAt;
    }
}

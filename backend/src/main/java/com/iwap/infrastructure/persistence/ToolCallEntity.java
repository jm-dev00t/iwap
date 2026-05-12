package com.iwap.infrastructure.persistence;

import com.iwap.domain.tool.ToolCallStatus;
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
@Table(name = "tool_calls")
class ToolCallEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "run_id")
    private String runId;

    @Column(name = "tool_name")
    private String toolName;

    @Column(columnDefinition = "text")
    private String purpose;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> arguments;

    @Enumerated(EnumType.STRING)
    private ToolCallStatus status;

    @Column(name = "completed_at")
    private OffsetDateTime completedAt;

    protected ToolCallEntity() {
    }

    ToolCallEntity(String runId, String toolName, String purpose, Map<String, Object> arguments, ToolCallStatus status, OffsetDateTime completedAt) {
        this.runId = runId;
        this.toolName = toolName;
        this.purpose = purpose;
        this.arguments = arguments;
        this.status = status;
        this.completedAt = completedAt;
    }

    String getToolName() {
        return toolName;
    }

    String getPurpose() {
        return purpose;
    }

    Map<String, Object> getArguments() {
        return arguments;
    }

    ToolCallStatus getStatus() {
        return status;
    }

    OffsetDateTime getCompletedAt() {
        return completedAt;
    }
}

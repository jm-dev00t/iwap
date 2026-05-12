package com.iwap.infrastructure.persistence;

import com.iwap.domain.approval.ApprovalRequest;
import com.iwap.domain.audit.AuditLogEntry;
import com.iwap.domain.report.ReportArtifact;
import com.iwap.domain.tool.ToolCall;
import com.iwap.domain.workflow.WorkflowEvent;
import com.iwap.domain.workflow.WorkflowRun;
import com.iwap.domain.workflow.WorkflowStatus;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

@Component
class WorkflowRunJpaMapper {

    WorkflowRunEntity toRunEntity(WorkflowRun run, OffsetDateTime createdAt) {
        OffsetDateTime completedAt = switch (run.status()) {
            case COMPLETED, FAILED, REJECTED -> OffsetDateTime.now();
            default -> null;
        };
        return new WorkflowRunEntity(
                run.id(),
                run.title(),
                run.command(),
                run.requestedBy(),
                run.status(),
                createdAt,
                completedAt
        );
    }

    List<WorkflowEventEntity> toEventEntities(WorkflowRun run) {
        return run.events().stream()
                .map(event -> new WorkflowEventEntity(
                        event.runId(),
                        event.sequence(),
                        event.agentType(),
                        event.eventType(),
                        event.message(),
                        safeMap(event.metadata()),
                        event.occurredAt()
                ))
                .toList();
    }

    List<ToolCallEntity> toToolCallEntities(WorkflowRun run) {
        return run.toolCalls().stream()
                .map(call -> new ToolCallEntity(
                        run.id(),
                        call.toolName(),
                        call.purpose(),
                        safeMap(call.arguments()),
                        call.status(),
                        call.completedAt()
                ))
                .toList();
    }

    List<ApprovalRequestEntity> toApprovalEntities(WorkflowRun run) {
        return run.approvals().stream()
                .map(approval -> new ApprovalRequestEntity(
                        approval.id(),
                        approval.runId(),
                        approval.requestedByAgent(),
                        approval.reason(),
                        approval.status(),
                        approval.requestedAt(),
                        approval.status().name().equals("PENDING") ? null : OffsetDateTime.now()
                ))
                .toList();
    }

    List<ReportArtifactEntity> toReportArtifactEntities(WorkflowRun run) {
        return run.artifacts().stream()
                .map(artifact -> new ReportArtifactEntity(
                        artifact.id(),
                        artifact.runId(),
                        artifact.title(),
                        artifact.format(),
                        artifact.summary(),
                        artifact.content(),
                        artifact.createdAt()
                ))
                .toList();
    }

    List<AuditLogEntity> toAuditLogEntities(WorkflowRun run) {
        return run.auditTrail().stream()
                .map(entry -> new AuditLogEntity(
                        entry.runId(),
                        entry.sequence(),
                        entry.actor(),
                        entry.action(),
                        entry.summary(),
                        safeMap(entry.metadata()),
                        entry.occurredAt()
                ))
                .toList();
    }

    WorkflowRun toDomain(
            WorkflowRunEntity run,
            List<WorkflowEventEntity> events,
            List<ToolCallEntity> toolCalls,
            List<ApprovalRequestEntity> approvals,
            List<ReportArtifactEntity> artifacts,
            List<AuditLogEntity> auditLogs
    ) {
        return new WorkflowRun(
                run.getId(),
                run.getTitle(),
                run.getCommand(),
                run.getRequestedBy(),
                run.getStatus(),
                events.stream()
                        .map(event -> new WorkflowEvent(
                                event.getRunId(),
                                event.getSequenceNo(),
                                event.getAgentType(),
                                event.getEventType(),
                                event.getMessage(),
                                safeMap(event.getMetadata()),
                                event.getOccurredAt()
                        ))
                        .toList(),
                toolCalls.stream()
                        .map(call -> new ToolCall(
                                call.getToolName(),
                                call.getPurpose(),
                                safeMap(call.getArguments()),
                                call.getStatus(),
                                call.getCompletedAt()
                        ))
                        .toList(),
                approvals.stream()
                        .map(approval -> new ApprovalRequest(
                                approval.getId(),
                                approval.getRunId(),
                                approval.getRequestedByAgent(),
                                approval.getReason(),
                                approval.getStatus(),
                                approval.getRequestedAt()
                        ))
                        .toList(),
                artifacts.stream()
                        .map(artifact -> new ReportArtifact(
                                artifact.getId(),
                                artifact.getRunId(),
                                artifact.getTitle(),
                                artifact.getFormat(),
                                artifact.getSummary(),
                                artifact.getContent(),
                                artifact.getCreatedAt()
                        ))
                        .toList(),
                auditLogs.stream()
                        .map(entry -> new AuditLogEntry(
                                entry.getRunId(),
                                entry.getSequenceNo(),
                                entry.getActor(),
                                entry.getAction(),
                                entry.getSummary(),
                                safeMap(entry.getMetadata()),
                                entry.getOccurredAt()
                        ))
                        .toList()
        );
    }

    ApprovalRequest toDomain(ApprovalRequestEntity approval) {
        return new ApprovalRequest(
                approval.getId(),
                approval.getRunId(),
                approval.getRequestedByAgent(),
                approval.getReason(),
                approval.getStatus(),
                approval.getRequestedAt()
        );
    }

    AuditLogEntry toDomain(AuditLogEntity entry) {
        return new AuditLogEntry(
                entry.getRunId(),
                entry.getSequenceNo(),
                entry.getActor(),
                entry.getAction(),
                entry.getSummary(),
                safeMap(entry.getMetadata()),
                entry.getOccurredAt()
        );
    }

    private Map<String, Object> safeMap(Map<String, Object> value) {
        return value == null ? Map.of() : Map.copyOf(value);
    }
}

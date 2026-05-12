package com.iwap.infrastructure.persistence;

import com.iwap.application.workflow.WorkflowApprovalDecision;
import com.iwap.application.workflow.WorkflowRunStore;
import com.iwap.domain.approval.ApprovalRequest;
import com.iwap.domain.approval.ApprovalStatus;
import com.iwap.domain.audit.AuditLogEntry;
import com.iwap.domain.workflow.WorkflowRun;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

@Repository
class JpaWorkflowRunStore implements WorkflowRunStore {

    private final WorkflowRunJpaRepository runs;
    private final WorkflowEventJpaRepository events;
    private final ToolCallJpaRepository toolCalls;
    private final ApprovalRequestJpaRepository approvals;
    private final ReportArtifactJpaRepository artifacts;
    private final AuditLogJpaRepository auditLogs;
    private final WorkflowRunJpaMapper mapper;

    JpaWorkflowRunStore(
            WorkflowRunJpaRepository runs,
            WorkflowEventJpaRepository events,
            ToolCallJpaRepository toolCalls,
            ApprovalRequestJpaRepository approvals,
            ReportArtifactJpaRepository artifacts,
            AuditLogJpaRepository auditLogs,
            WorkflowRunJpaMapper mapper
    ) {
        this.runs = runs;
        this.events = events;
        this.toolCalls = toolCalls;
        this.approvals = approvals;
        this.artifacts = artifacts;
        this.auditLogs = auditLogs;
        this.mapper = mapper;
    }

    @Override
    @Transactional
    public WorkflowRun save(WorkflowRun run) {
        OffsetDateTime createdAt = runs.findById(run.id())
                .map(WorkflowRunEntity::getCreatedAt)
                .orElseGet(OffsetDateTime::now);

        runs.save(mapper.toRunEntity(run, createdAt));
        events.deleteByRunId(run.id());
        toolCalls.deleteByRunId(run.id());
        approvals.deleteByRunId(run.id());
        artifacts.deleteByRunId(run.id());
        auditLogs.deleteByRunId(run.id());
        flushChildTables();

        events.saveAll(mapper.toEventEntities(run));
        toolCalls.saveAll(mapper.toToolCallEntities(run));
        approvals.saveAll(mapper.toApprovalEntities(run));
        artifacts.saveAll(mapper.toReportArtifactEntities(run));
        auditLogs.saveAll(mapper.toAuditLogEntities(run));
        return run;
    }

    @Override
    public Optional<WorkflowRun> findById(String runId) {
        return runs.findById(runId).map(this::hydrate);
    }

    @Override
    public List<WorkflowRun> findAll() {
        return runs.findAllByOrderByIdDesc().stream()
                .map(this::hydrate)
                .toList();
    }

    @Override
    public List<AuditLogEntry> auditLogs() {
        return auditLogs.findAllByOrderByOccurredAtDesc().stream()
                .map(mapper::toDomain)
                .toList();
    }

    @Override
    public List<ApprovalRequest> pendingApprovals() {
        return approvals.findAllByStatusOrderByRequestedAtAsc(ApprovalStatus.PENDING).stream()
                .map(mapper::toDomain)
                .toList();
    }

    @Override
    @Transactional
    public WorkflowRun decideApproval(String approvalId, boolean approved, String decidedBy) {
        ApprovalRequestEntity approval = approvals.findById(approvalId)
                .orElseThrow(() -> new IllegalArgumentException("Approval request was not found: " + approvalId));
        WorkflowRun run = findById(approval.getRunId())
                .orElseThrow(() -> new IllegalArgumentException("Workflow run was not found: " + approval.getRunId()));

        return save(WorkflowApprovalDecision.apply(run, approvalId, approved, decidedBy));
    }

    private WorkflowRun hydrate(WorkflowRunEntity run) {
        return mapper.toDomain(
                run,
                events.findAllByRunIdOrderBySequenceNoAsc(run.getId()),
                toolCalls.findAllByRunIdOrderByIdAsc(run.getId()),
                approvals.findAllByRunIdOrderByRequestedAtAsc(run.getId()),
                artifacts.findAllByRunIdOrderByCreatedAtAsc(run.getId()),
                auditLogs.findAllByRunIdOrderBySequenceNoAsc(run.getId())
        );
    }

    private void flushChildTables() {
        events.flush();
        toolCalls.flush();
        approvals.flush();
        artifacts.flush();
        auditLogs.flush();
    }
}

package com.iwap.application.workflow;

import com.iwap.domain.approval.ApprovalRequest;
import com.iwap.domain.approval.ApprovalStatus;
import com.iwap.domain.audit.AuditLogEntry;
import com.iwap.domain.workflow.WorkflowRun;
import com.iwap.domain.workflow.WorkflowStatus;
import org.springframework.stereotype.Repository;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Repository
public class WorkflowRunStore {

    private final ConcurrentHashMap<String, WorkflowRun> runs = new ConcurrentHashMap<>();

    public WorkflowRun save(WorkflowRun run) {
        runs.put(run.id(), run);
        return run;
    }

    public Optional<WorkflowRun> findById(String runId) {
        return Optional.ofNullable(runs.get(runId));
    }

    public List<WorkflowRun> findAll() {
        return runs.values().stream()
                .sorted(Comparator.comparing(WorkflowRun::id).reversed())
                .toList();
    }

    public List<AuditLogEntry> auditLogs() {
        return runs.values().stream()
                .flatMap(run -> run.auditTrail().stream())
                .sorted(Comparator.comparing(AuditLogEntry::occurredAt).reversed())
                .toList();
    }

    public List<ApprovalRequest> pendingApprovals() {
        return runs.values().stream()
                .flatMap(run -> run.approvals().stream())
                .filter(approval -> approval.status() == com.iwap.domain.approval.ApprovalStatus.PENDING)
                .toList();
    }

    public WorkflowRun decideApproval(String approvalId, boolean approved, String decidedBy) {
        WorkflowRun run = runs.values().stream()
                .filter(candidate -> candidate.approvals().stream().anyMatch(approval -> approval.id().equals(approvalId)))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Approval request was not found: " + approvalId));

        ApprovalStatus nextApprovalStatus = approved ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED;
        WorkflowStatus nextWorkflowStatus = approved ? WorkflowStatus.COMPLETED : WorkflowStatus.REJECTED;

        List<ApprovalRequest> approvals = run.approvals().stream()
                .map(approval -> {
                    if (!approval.id().equals(approvalId)) {
                        return approval;
                    }
                    return new ApprovalRequest(
                            approval.id(),
                            approval.runId(),
                            approval.requestedByAgent(),
                            approval.reason(),
                            nextApprovalStatus,
                            approval.requestedAt()
                    );
                })
                .toList();

        List<AuditLogEntry> auditTrail = new java.util.ArrayList<>(run.auditTrail());
        auditTrail.add(AuditLogEntry.of(
                run.id(),
                auditTrail.size() + 1L,
                decidedBy,
                approved ? "APPROVAL_APPROVED" : "APPROVAL_REJECTED",
                "Human approval decision recorded for " + approvalId + "."
        ));

        WorkflowRun updated = new WorkflowRun(
                run.id(),
                run.title(),
                run.command(),
                run.requestedBy(),
                nextWorkflowStatus,
                run.events(),
                run.toolCalls(),
                approvals,
                run.artifacts(),
                List.copyOf(auditTrail)
        );

        return save(updated);
    }
}

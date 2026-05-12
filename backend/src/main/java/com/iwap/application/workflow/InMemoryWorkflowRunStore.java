package com.iwap.application.workflow;

import com.iwap.domain.approval.ApprovalRequest;
import com.iwap.domain.approval.ApprovalStatus;
import com.iwap.domain.audit.AuditLogEntry;
import com.iwap.domain.workflow.WorkflowRun;
import com.iwap.domain.workflow.WorkflowStatus;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

public class InMemoryWorkflowRunStore implements WorkflowRunStore {

    private final ConcurrentHashMap<String, WorkflowRun> runs = new ConcurrentHashMap<>();

    @Override
    public WorkflowRun save(WorkflowRun run) {
        runs.put(run.id(), run);
        return run;
    }

    @Override
    public Optional<WorkflowRun> findById(String runId) {
        return Optional.ofNullable(runs.get(runId));
    }

    @Override
    public List<WorkflowRun> findAll() {
        return runs.values().stream()
                .sorted(Comparator.comparing(WorkflowRun::id).reversed())
                .toList();
    }

    @Override
    public List<AuditLogEntry> auditLogs() {
        return runs.values().stream()
                .flatMap(run -> run.auditTrail().stream())
                .sorted(Comparator.comparing(AuditLogEntry::occurredAt).reversed())
                .toList();
    }

    @Override
    public List<ApprovalRequest> pendingApprovals() {
        return runs.values().stream()
                .flatMap(run -> run.approvals().stream())
                .filter(approval -> approval.status() == ApprovalStatus.PENDING)
                .toList();
    }

    @Override
    public WorkflowRun decideApproval(String approvalId, boolean approved, String decidedBy) {
        WorkflowRun run = runs.values().stream()
                .filter(candidate -> candidate.approvals().stream().anyMatch(approval -> approval.id().equals(approvalId)))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Approval request was not found: " + approvalId));

        return save(WorkflowApprovalDecision.apply(run, approvalId, approved, decidedBy));
    }
}

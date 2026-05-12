package com.iwap.application.workflow;

import com.iwap.domain.approval.ApprovalRequest;
import com.iwap.domain.audit.AuditLogEntry;
import com.iwap.domain.workflow.WorkflowRun;

import java.util.List;
import java.util.Optional;

public interface WorkflowRunStore {

    WorkflowRun save(WorkflowRun run);

    Optional<WorkflowRun> findById(String runId);

    List<WorkflowRun> findAll();

    List<AuditLogEntry> auditLogs();

    List<ApprovalRequest> pendingApprovals();

    WorkflowRun decideApproval(String approvalId, boolean approved, String decidedBy);
}

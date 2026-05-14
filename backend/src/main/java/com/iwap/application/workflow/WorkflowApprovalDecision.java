package com.iwap.application.workflow;

import com.iwap.domain.approval.ApprovalRequest;
import com.iwap.domain.approval.ApprovalStatus;
import com.iwap.domain.audit.AuditLogEntry;
import com.iwap.domain.tool.ToolCall;
import com.iwap.domain.tool.ToolCallStatus;
import com.iwap.domain.workflow.WorkflowRun;
import com.iwap.domain.workflow.WorkflowStatus;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

public final class WorkflowApprovalDecision {

    private WorkflowApprovalDecision() {
    }

    public static WorkflowRun apply(WorkflowRun run, String approvalId, boolean approved, String decidedBy) {
        ApprovalStatus nextApprovalStatus = approved ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED;
        WorkflowStatus nextWorkflowStatus = approved ? WorkflowStatus.COMPLETED : WorkflowStatus.REJECTED;

        List<ApprovalRequest> approvals = run.approvals().stream()
                .map(approval -> {
                    if (!approval.id().equals(approvalId)) {
                        return approval;
                    }
                    if (approval.status() != ApprovalStatus.PENDING) {
                        throw new IllegalStateException("Approval request is already resolved: " + approvalId);
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

        List<AuditLogEntry> auditTrail = new ArrayList<>(run.auditTrail());
        auditTrail.add(AuditLogEntry.of(
                run.id(),
                auditTrail.size() + 1L,
                decidedBy,
                approved ? "APPROVAL_APPROVED" : "APPROVAL_REJECTED",
                "Human approval decision recorded for " + approvalId + "."
        ));

        OffsetDateTime completedAt = OffsetDateTime.now();
        List<ToolCall> toolCalls = run.toolCalls().stream()
                .map(toolCall -> {
                    if (toolCall.status() != ToolCallStatus.PENDING) {
                        return toolCall;
                    }
                    return new ToolCall(
                            toolCall.toolName(),
                            toolCall.purpose(),
                            toolCall.arguments(),
                            approved ? ToolCallStatus.COMPLETED : ToolCallStatus.SKIPPED,
                            approved ? completedAt : null
                    );
                })
                .toList();

        return new WorkflowRun(
                run.id(),
                run.title(),
                run.command(),
                run.requestedBy(),
                nextWorkflowStatus,
                run.events(),
                toolCalls,
                approvals,
                run.artifacts(),
                List.copyOf(auditTrail)
        );
    }
}

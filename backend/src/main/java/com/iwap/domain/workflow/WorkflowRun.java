package com.iwap.domain.workflow;

import com.iwap.domain.approval.ApprovalRequest;
import com.iwap.domain.audit.AuditLogEntry;
import com.iwap.domain.report.ReportArtifact;
import com.iwap.domain.tool.ToolCall;

import java.util.List;

public record WorkflowRun(
        String id,
        String title,
        String command,
        String requestedBy,
        WorkflowStatus status,
        List<WorkflowEvent> events,
        List<ToolCall> toolCalls,
        List<ApprovalRequest> approvals,
        List<ReportArtifact> artifacts,
        List<AuditLogEntry> auditTrail
) {
}

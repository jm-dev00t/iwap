package com.iwap.application.workflow;

import com.iwap.domain.approval.ApprovalRequest;
import com.iwap.domain.audit.AuditLogEntry;
import com.iwap.domain.report.ReportArtifact;
import com.iwap.domain.tool.ToolCall;
import com.iwap.domain.workflow.WorkflowEvent;
import com.iwap.domain.workflow.WorkflowPlan;

import java.util.ArrayList;
import java.util.List;

/**
 * Mutable execution context for one workflow run.
 *
 * <p>The domain records stay immutable at the API boundary, while this context gives
 * agents a simple shared state object similar to a LangGraph state bag.</p>
 */
public class WorkflowContext {

    private final String runId;
    private final String command;
    private final String requestedBy;
    private WorkflowPlan plan;
    private final List<WorkflowEvent> events = new ArrayList<>();
    private final List<ToolCall> toolCalls = new ArrayList<>();
    private final List<ApprovalRequest> approvals = new ArrayList<>();
    private final List<ReportArtifact> artifacts = new ArrayList<>();
    private final List<AuditLogEntry> auditTrail = new ArrayList<>();

    public WorkflowContext(String runId, String command, String requestedBy) {
        this.runId = runId;
        this.command = command;
        this.requestedBy = requestedBy;
    }

    public String runId() {
        return runId;
    }

    public String command() {
        return command;
    }

    public String requestedBy() {
        return requestedBy;
    }

    public WorkflowPlan plan() {
        return plan;
    }

    public void setPlan(WorkflowPlan plan) {
        this.plan = plan;
    }

    public List<WorkflowEvent> events() {
        return events;
    }

    public List<ToolCall> toolCalls() {
        return toolCalls;
    }

    public List<ApprovalRequest> approvals() {
        return approvals;
    }

    public List<ReportArtifact> artifacts() {
        return artifacts;
    }

    public List<AuditLogEntry> auditTrail() {
        return auditTrail;
    }
}

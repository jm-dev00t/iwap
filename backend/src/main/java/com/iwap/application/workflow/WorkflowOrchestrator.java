package com.iwap.application.workflow;

import com.iwap.application.agent.ExecutorAgent;
import com.iwap.application.agent.NotifierAgent;
import com.iwap.application.agent.PlannerAgent;
import com.iwap.application.agent.ReporterAgent;
import com.iwap.application.agent.ValidatorAgent;
import com.iwap.domain.agent.AgentType;
import com.iwap.domain.approval.ApprovalRequest;
import com.iwap.domain.audit.AuditLogEntry;
import com.iwap.domain.workflow.WorkflowRun;
import com.iwap.domain.workflow.WorkflowStatus;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Coordinates one workflow run through the five portfolio agents.
 *
 * <p>The class is intentionally small: scenario planning lives in PlannerAgent,
 * external work lives behind ToolRegistry, and persistence is hidden behind
 * WorkflowRunStore. That split is what makes the code useful as an SI portfolio
 * example instead of a one-file demo script.</p>
 */
@Service
public class WorkflowOrchestrator {

    private final PlannerAgent plannerAgent;
    private final ExecutorAgent executorAgent;
    private final ValidatorAgent validatorAgent;
    private final ReporterAgent reporterAgent;
    private final NotifierAgent notifierAgent;
    private final WorkflowRunStore store;

    public WorkflowOrchestrator(
            PlannerAgent plannerAgent,
            ExecutorAgent executorAgent,
            ValidatorAgent validatorAgent,
            ReporterAgent reporterAgent,
            NotifierAgent notifierAgent,
            WorkflowRunStore store
    ) {
        this.plannerAgent = plannerAgent;
        this.executorAgent = executorAgent;
        this.validatorAgent = validatorAgent;
        this.reporterAgent = reporterAgent;
        this.notifierAgent = notifierAgent;
        this.store = store;
    }

    public WorkflowRun start(String command, String requestedBy) {
        WorkflowContext context = new WorkflowContext(nextRunId(), command, requestedBy);

        plannerAgent.handle(context);

        if (context.plan().approvalRequired()) {
            ApprovalRequest approval = ApprovalRequest.pending(
                    "approval-" + context.runId(),
                    context.runId(),
                    AgentType.PLANNER.name(),
                    "Human approval is required because this " + context.plan().approvalReason() + "."
            );
            context.approvals().add(approval);
            context.auditTrail().add(AuditLogEntry.of(
                    context.runId(),
                    context.auditTrail().size() + 1L,
                    "HUMAN_APPROVAL_POLICY",
                    "APPROVAL_REQUESTED",
                    approval.reason()
            ));
            return store.save(toRun(context, WorkflowStatus.WAITING_FOR_APPROVAL));
        }

        executorAgent.handle(context);
        validatorAgent.handle(context);
        reporterAgent.handle(context);
        notifierAgent.handle(context);

        return store.save(toRun(context, WorkflowStatus.COMPLETED));
    }

    public List<WorkflowRun> history() {
        return store.findAll();
    }

    public WorkflowRun getRun(String runId) {
        return store.findById(runId)
                .orElseThrow(() -> new IllegalArgumentException("Workflow run was not found: " + runId));
    }

    public List<ApprovalRequest> pendingApprovals() {
        return store.pendingApprovals();
    }

    public List<AuditLogEntry> auditLogs() {
        return store.auditLogs();
    }

    public WorkflowRun decideApproval(String approvalId, boolean approved, String decidedBy) {
        return store.decideApproval(approvalId, approved, decidedBy);
    }

    private WorkflowRun toRun(WorkflowContext context, WorkflowStatus status) {
        return new WorkflowRun(
                context.runId(),
                context.plan().title(),
                context.command(),
                context.requestedBy(),
                status,
                List.copyOf(context.events()),
                List.copyOf(context.toolCalls()),
                List.copyOf(context.approvals()),
                List.copyOf(context.artifacts()),
                List.copyOf(context.auditTrail())
        );
    }

    private String nextRunId() {
        String timestamp = OffsetDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS"));
        return "run-" + timestamp;
    }
}

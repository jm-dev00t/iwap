package com.iwap.application.workflow;

import com.iwap.domain.agent.AgentType;
import com.iwap.domain.approval.ApprovalRequest;
import com.iwap.domain.audit.AuditLogEntry;
import com.iwap.domain.report.ReportArtifact;
import com.iwap.domain.report.ReportFormat;
import com.iwap.domain.tool.ToolCall;
import com.iwap.domain.workflow.WorkflowEvent;
import com.iwap.domain.workflow.WorkflowEventType;
import com.iwap.domain.workflow.WorkflowRun;
import com.iwap.domain.workflow.WorkflowStatus;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * Coordinates the portfolio demo workflow in a LangGraph-style sequence.
 *
 * <p>The first implementation intentionally uses deterministic scenario routing.
 * That keeps live demos reliable while preserving the same orchestration boundary
 * that a Spring AI planner or LangGraph-like state machine can replace later.</p>
 */
@Service
public class WorkflowOrchestrator {

    private final WorkflowRunStore store;
    private final WorkflowEventPublisher publisher;

    public WorkflowOrchestrator() {
        this(new InMemoryWorkflowRunStore(), null);
    }

    public WorkflowOrchestrator(WorkflowRunStore store) {
        this(store, null);
    }

    @Autowired
    public WorkflowOrchestrator(WorkflowRunStore store, WorkflowEventPublisher publisher) {
        this.store = store;
        this.publisher = publisher;
    }

    public WorkflowRun start(String command, String requestedBy) {
        return start(command, null, requestedBy);
    }

    public WorkflowRun start(String command, String scenarioKey, String requestedBy) {
        String scenario = resolveScenario(command, scenarioKey);

        return store.save(switch (scenario) {
            case "low-inventory" -> createLowInventoryApprovalRun(command, requestedBy);
            case "customer-onboarding" -> createCustomerOnboardingRun(command, requestedBy);
            case "weekly-sales-report" -> createWeeklySalesReportRun(command, requestedBy);
            default -> createMonthlySalesReportRun(command, requestedBy);
        });
    }

    private String resolveScenario(String command, String scenarioKey) {
        if (scenarioKey != null && !scenarioKey.isBlank()) {
            return scenarioKey.trim().toLowerCase(Locale.ROOT);
        }

        String normalizedCommand = command.toLowerCase(Locale.ROOT);

        if (normalizedCommand.contains("재고") || normalizedCommand.contains("inventory")) {
            return "low-inventory";
        }
        if (normalizedCommand.contains("신규 고객") || normalizedCommand.contains("onboarding") || normalizedCommand.contains("crm")) {
            return "customer-onboarding";
        }
        if (normalizedCommand.contains("주간") || normalizedCommand.contains("weekly")) {
            return "weekly-sales-report";
        }
        return "monthly-sales-report";
    }

    public List<WorkflowRun> history() {
        return store.findAll();
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

    private WorkflowRun createMonthlySalesReportRun(String command, String requestedBy) {
        String runId = nextRunId("sales");
        List<WorkflowEvent> events = new ArrayList<>();
        List<ToolCall> toolCalls = new ArrayList<>();
        List<ReportArtifact> artifacts = new ArrayList<>();
        List<AuditLogEntry> auditTrail = new ArrayList<>();

        addEvent(events, auditTrail, runId, AgentType.PLANNER, WorkflowEventType.PLAN_CREATED,
                "Created a structured plan for monthly sales reporting.");
        addEvent(events, auditTrail, runId, AgentType.EXECUTOR, WorkflowEventType.TOOL_CALL_COMPLETED,
                "Generated report and delivered it through Slack and Email.");
        addEvent(events, auditTrail, runId, AgentType.VALIDATOR, WorkflowEventType.VALIDATION_COMPLETED,
                "Validated required sales metrics, recipients, and generated artifacts.");
        addEvent(events, auditTrail, runId, AgentType.REPORTER, WorkflowEventType.REPORT_CREATED,
                "Created executive summary and report artifact for the monthly sales workflow.");
        addEvent(events, auditTrail, runId, AgentType.NOTIFIER, WorkflowEventType.NOTIFICATION_COMPLETED,
                "Published completion notice to the requester and workflow history.");

        toolCalls.add(ToolCall.completed("sales-data", "Read monthly revenue sample data."));
        toolCalls.add(ToolCall.completed("report-generator", "Create monthly sales report artifact."));
        toolCalls.add(ToolCall.completed("slack", "Send report summary to #sales-report."));
        toolCalls.add(ToolCall.completed("email", "Email the report to management recipients."));
        artifacts.add(ReportArtifact.markdown(
                runId,
                "Monthly Sales Report Automation",
                "월간 매출 보고서가 생성되고 Slack/Email 공유까지 완료되었습니다.",
                """
                # Monthly Sales Report

                - Revenue summary was generated from the demo sales dataset.
                - Slack and Email delivery steps were recorded as tool calls.
                - Audit logs captured each agent transition for review.
                """
        ));

        return new WorkflowRun(
                runId,
                "Monthly Sales Report Automation",
                command,
                requestedBy,
                WorkflowStatus.COMPLETED,
                List.copyOf(events),
                List.copyOf(toolCalls),
                List.of(),
                List.copyOf(artifacts),
                List.copyOf(auditTrail)
        );
    }

    private WorkflowRun createLowInventoryApprovalRun(String command, String requestedBy) {
        String runId = nextRunId("inventory");
        List<WorkflowEvent> events = new ArrayList<>();
        List<AuditLogEntry> auditTrail = new ArrayList<>();

        addEvent(events, auditTrail, runId, AgentType.PLANNER, WorkflowEventType.APPROVAL_REQUESTED,
                "Approval is required before sending a purchase team notification.");

        ApprovalRequest approval = ApprovalRequest.pending(
                "approval-" + runId,
                runId,
                AgentType.PLANNER.name(),
                "Human approval is required because this purchase team notification can trigger buying activity."
        );

        auditTrail.add(AuditLogEntry.of(
                runId,
                auditTrail.size() + 1L,
                "HUMAN_APPROVAL_POLICY",
                "APPROVAL_REQUESTED",
                approval.reason()
        ));

        return new WorkflowRun(
                runId,
                "Low Inventory Purchasing Alert",
                command,
                requestedBy,
                WorkflowStatus.WAITING_FOR_APPROVAL,
                List.copyOf(events),
                List.of(),
                List.of(approval),
                List.of(),
                List.copyOf(auditTrail)
        );
    }

    private WorkflowRun createCustomerOnboardingRun(String command, String requestedBy) {
        String runId = nextRunId("customer");
        List<WorkflowEvent> events = new ArrayList<>();
        List<ToolCall> toolCalls = new ArrayList<>();
        List<AuditLogEntry> auditTrail = new ArrayList<>();

        addEvent(events, auditTrail, runId, AgentType.PLANNER, WorkflowEventType.PLAN_CREATED,
                "Created a structured onboarding plan for the new customer.");
        addEvent(events, auditTrail, runId, AgentType.EXECUTOR, WorkflowEventType.TOOL_CALL_COMPLETED,
                "Registered the customer, sent welcome email, and notified the account owner.");
        addEvent(events, auditTrail, runId, AgentType.VALIDATOR, WorkflowEventType.VALIDATION_COMPLETED,
                "Validated customer record, welcome message, and owner notification.");
        addEvent(events, auditTrail, runId, AgentType.NOTIFIER, WorkflowEventType.NOTIFICATION_COMPLETED,
                "Published onboarding completion notice to workflow history.");

        toolCalls.add(ToolCall.completed("crm", "Register the new customer in the customer management system."));
        toolCalls.add(ToolCall.completed("email", "Send welcome email to the customer."));
        toolCalls.add(ToolCall.completed("slack", "Notify the account owner."));

        return new WorkflowRun(
                runId,
                "New Customer Onboarding",
                command,
                requestedBy,
                WorkflowStatus.COMPLETED,
                List.copyOf(events),
                List.copyOf(toolCalls),
                List.of(),
                List.of(),
                List.copyOf(auditTrail)
        );
    }

    private WorkflowRun createWeeklySalesReportRun(String command, String requestedBy) {
        String runId = nextRunId("weekly-sales");
        List<WorkflowEvent> events = new ArrayList<>();
        List<ToolCall> toolCalls = new ArrayList<>();
        List<ReportArtifact> artifacts = new ArrayList<>();
        List<AuditLogEntry> auditTrail = new ArrayList<>();

        addEvent(events, auditTrail, runId, AgentType.PLANNER, WorkflowEventType.PLAN_CREATED,
                "Created a weekly sales performance reporting plan.");
        addEvent(events, auditTrail, runId, AgentType.EXECUTOR, WorkflowEventType.TOOL_CALL_COMPLETED,
                "Analyzed weekly sales data and generated a PDF report.");
        addEvent(events, auditTrail, runId, AgentType.VALIDATOR, WorkflowEventType.VALIDATION_COMPLETED,
                "Validated ranking, conversion summary, and report artifact.");
        addEvent(events, auditTrail, runId, AgentType.REPORTER, WorkflowEventType.REPORT_CREATED,
                "Created weekly sales performance report artifact.");
        addEvent(events, auditTrail, runId, AgentType.NOTIFIER, WorkflowEventType.NOTIFICATION_COMPLETED,
                "Published weekly report completion notice.");

        toolCalls.add(ToolCall.completed("sales-data", "Read weekly sales performance sample data."));
        toolCalls.add(ToolCall.completed("report-generator", "Create weekly sales performance PDF artifact."));
        toolCalls.add(ToolCall.completed("email", "Share the weekly report with sales managers."));
        artifacts.add(new ReportArtifact(
                "report-" + runId,
                runId,
                "Weekly Sales Performance Report",
                ReportFormat.PDF,
                "주간 영업 실적 리포트가 생성되고 공유 준비까지 완료되었습니다.",
                """
                # Weekly Sales Performance Report

                - Sales ranking and conversion summary were generated from sample data.
                - PDF report creation was recorded as a report-generator tool call.
                - Audit logs captured each agent transition for review.
                """,
                java.time.OffsetDateTime.now()
        ));

        return new WorkflowRun(
                runId,
                "Weekly Sales Performance Report",
                command,
                requestedBy,
                WorkflowStatus.COMPLETED,
                List.copyOf(events),
                List.copyOf(toolCalls),
                List.of(),
                List.copyOf(artifacts),
                List.copyOf(auditTrail)
        );
    }

    private void addEvent(
            List<WorkflowEvent> events,
            List<AuditLogEntry> auditTrail,
            String runId,
            AgentType agentType,
            WorkflowEventType eventType,
            String message
    ) {
        long sequence = events.size() + 1L;
        WorkflowEvent event = WorkflowEvent.of(runId, sequence, agentType, eventType, message);
        events.add(event);
        auditTrail.add(AuditLogEntry.of(runId, sequence, agentType.name(), eventType.name(), message));
        if (publisher != null) {
            publisher.publish(event);
        }
    }

    private String nextRunId(String scenarioKey) {
        String timestamp = java.time.OffsetDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        return "run-" + scenarioKey + "-" + timestamp + "-" + UUID.randomUUID().toString().substring(0, 8);
    }
}

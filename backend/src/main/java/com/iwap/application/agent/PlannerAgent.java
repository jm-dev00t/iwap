package com.iwap.application.agent;

import com.iwap.application.workflow.WorkflowContext;
import com.iwap.application.workflow.WorkflowEventRecorder;
import com.iwap.domain.agent.AgentType;
import com.iwap.domain.workflow.WorkflowEventType;
import com.iwap.domain.workflow.WorkflowPlan;
import com.iwap.domain.workflow.WorkflowScenario;
import com.iwap.domain.workflow.WorkflowStep;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Locale;

@Component
public class PlannerAgent implements WorkflowAgent {

    private final WorkflowEventRecorder recorder;

    public PlannerAgent(WorkflowEventRecorder recorder) {
        this.recorder = recorder;
    }

    @Override
    public AgentType type() {
        return AgentType.PLANNER;
    }

    @Override
    public void handle(WorkflowContext context) {
        WorkflowPlan plan = planFor(context.command());
        context.setPlan(plan);

        if (plan.approvalRequired()) {
            recorder.record(context, type(), WorkflowEventType.APPROVAL_REQUESTED,
                    "Approval is required before continuing: " + plan.approvalReason());
            return;
        }

        recorder.record(context, type(), WorkflowEventType.PLAN_CREATED,
                "Created a structured plan for " + plan.title() + ".");
    }

    private WorkflowPlan planFor(String command) {
        String normalized = command.toLowerCase(Locale.ROOT);

        if (normalized.contains("재고") || normalized.contains("inventory")) {
            return new WorkflowPlan(
                    WorkflowScenario.LOW_INVENTORY_ALERT,
                    WorkflowScenario.LOW_INVENTORY_ALERT.title(),
                    true,
                    "purchase team notification can trigger buying activity",
                    List.of(
                            new WorkflowStep(1, AgentType.EXECUTOR, "Find low-stock products", "Read inventory sample data.", "inventory"),
                            new WorkflowStep(2, AgentType.NOTIFIER, "Notify purchasing team", "Send KakaoWork-style purchasing alert.", "kakao")
                    )
            );
        }

        if (normalized.contains("신규") || normalized.contains("customer")) {
            return new WorkflowPlan(
                    WorkflowScenario.CUSTOMER_ONBOARDING,
                    WorkflowScenario.CUSTOMER_ONBOARDING.title(),
                    false,
                    "",
                    List.of(
                            new WorkflowStep(1, AgentType.EXECUTOR, "Create CRM record", "Register the new customer in CRM.", "crm"),
                            new WorkflowStep(2, AgentType.EXECUTOR, "Send welcome email", "Deliver onboarding welcome email.", "email"),
                            new WorkflowStep(3, AgentType.NOTIFIER, "Notify owner", "Send internal owner notification.", "slack")
                    )
            );
        }

        if (normalized.contains("주간") || normalized.contains("weekly")) {
            return new WorkflowPlan(
                    WorkflowScenario.WEEKLY_SALES_REPORT,
                    WorkflowScenario.WEEKLY_SALES_REPORT.title(),
                    false,
                    "",
                    List.of(
                            new WorkflowStep(1, AgentType.EXECUTOR, "Analyze weekly sales", "Read sales activity sample data.", "sales-data"),
                            new WorkflowStep(2, AgentType.REPORTER, "Generate PDF report", "Create weekly performance report.", "report-generator"),
                            new WorkflowStep(3, AgentType.NOTIFIER, "Share report", "Notify stakeholders that the report is ready.", "email")
                    )
            );
        }

        return new WorkflowPlan(
                WorkflowScenario.MONTHLY_SALES_REPORT,
                WorkflowScenario.MONTHLY_SALES_REPORT.title(),
                false,
                "",
                List.of(
                        new WorkflowStep(1, AgentType.EXECUTOR, "Read sales data", "Load monthly revenue and margin sample data.", "sales-data"),
                        new WorkflowStep(2, AgentType.REPORTER, "Generate report", "Create monthly sales report artifact.", "report-generator"),
                        new WorkflowStep(3, AgentType.NOTIFIER, "Send Slack summary", "Send report summary to #sales-report.", "slack"),
                        new WorkflowStep(4, AgentType.NOTIFIER, "Send Email report", "Email report to management recipients.", "email")
                )
        );
    }
}

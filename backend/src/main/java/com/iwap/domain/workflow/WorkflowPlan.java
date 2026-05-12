package com.iwap.domain.workflow;

import java.util.List;

public record WorkflowPlan(
        WorkflowScenario scenario,
        String title,
        boolean approvalRequired,
        String approvalReason,
        List<WorkflowStep> steps
) {
}

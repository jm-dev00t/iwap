package com.iwap.application.assistant;

import com.iwap.application.workflow.WorkflowOrchestrator;
import com.iwap.domain.agent.AgentType;
import com.iwap.domain.workflow.WorkflowPlan;
import com.iwap.domain.workflow.WorkflowRun;
import com.iwap.domain.workflow.WorkflowScenario;
import com.iwap.domain.workflow.WorkflowStep;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class AssistantService {

    private static final Set<String> VALID_SCENARIO_KEYS = Set.of(
            "monthly-sales-report", "weekly-sales-report", "customer-onboarding", "low-inventory"
    );

    private final AssistantPlanner planner;
    private final AssistantSessionStore sessionStore;
    private final AssistantPlanStore planStore;
    private final WorkflowOrchestrator orchestrator;

    public AssistantService(
            AssistantPlanner planner,
            AssistantSessionStore sessionStore,
            AssistantPlanStore planStore,
            WorkflowOrchestrator orchestrator
    ) {
        this.planner = planner;
        this.sessionStore = sessionStore;
        this.planStore = planStore;
        this.orchestrator = orchestrator;
    }

    public AssistantChatResponse chat(AssistantChatRequest request) {
        AssistantSession session = sessionStore.getOrCreate(request.sessionId());
        if (session.pendingPlanId() != null && isAffirmativeExecution(request.message())) {
            WorkflowRun run = execute(session.pendingPlanId(), new AssistantPlanExecutionRequest(true));
            sessionStore.save(session.clearPendingPlan());
            return new AssistantChatResponse(
                    session.id(),
                    run.title() + " 실행을 완료했습니다. 보고서와 발송 상태를 확인할 수 있습니다.",
                    AssistantState.EXECUTED,
                    null,
                    List.of(),
                    run
            );
        }

        String command = session.pendingCommand() == null
                ? request.message().trim()
                : session.pendingCommand() + "\n" + request.message().trim();
        AssistantPlan draft = planner.plan(command, session);

        boolean unsupportedKey = "unsupported".equals(draft.scenarioKey())
                || !VALID_SCENARIO_KEYS.contains(draft.scenarioKey());
        if (unsupportedKey || draft.confidence() < 0.5) {
            return new AssistantChatResponse(
                    session.id(),
                    "죄송합니다. 해당 작업은 지원하지 않습니다. 월간/주간 매출 보고서, 재고 부족 알림, 고객 온보딩 업무를 말씀해 주세요.",
                    AssistantState.UNSUPPORTED,
                    null,
                    List.of(),
                    null
            );
        }

        if (draft.missingFields() != null && !draft.missingFields().isEmpty()) {
            sessionStore.save(session.withPendingCommand(command));
            return new AssistantChatResponse(
                    session.id(),
                    missingFieldMessage(draft.missingFields()),
                    AssistantState.NEEDS_INPUT,
                    null,
                    List.copyOf(draft.missingFields()),
                    null
            );
        }

        AssistantSession cleanSession = session.withPendingCommand(null);
        sessionStore.save(cleanSession);
        AssistantPlan plan = planStore.save(draft.withIdentity("plan-" + UUID.randomUUID(), session.id()));
        String assistantReply = plan.requiresApproval()
                ? "실행 계획을 만들었습니다. 외부 발송이 포함되어 있어 실행 전 확인이 필요합니다."
                : "실행 계획을 만들었습니다. 확인 후 실행할 수 있습니다.";
        sessionStore.save(cleanSession.withPendingPlan(plan.id())
                .withMessage("user", request.message())
                .withMessage("assistant", assistantReply));
        return new AssistantChatResponse(
                session.id(),
                assistantReply,
                AssistantState.PLAN_READY,
                plan,
                List.of(),
                null
        );
    }

    public WorkflowRun execute(String planId, AssistantPlanExecutionRequest request) {
        AssistantPlan plan = planStore.findById(planId);
        if (plan.requiresApproval() && !request.approved()) {
            throw new IllegalStateException("Plan approval is required before execution.");
        }
        if (plan.actions() != null && !plan.actions().isEmpty()) {
            WorkflowPlan workflowPlan = toWorkflowPlan(plan);
            return orchestrator.startWithPlan(plan.command(), workflowPlan, plan.requestedBy(),
                    plan.slots() != null ? plan.slots() : java.util.Map.of());
        }
        return orchestrator.start(plan.command(), plan.scenarioKey(), plan.requestedBy());
    }

    private WorkflowPlan toWorkflowPlan(AssistantPlan plan) {
        List<WorkflowStep> steps = plan.actions().stream()
                .map(a -> new WorkflowStep(a.order(), agentTypeFor(a.toolName()), a.title(), a.description(), a.toolName()))
                .toList();
        WorkflowScenario scenario = Arrays.stream(WorkflowScenario.values())
                .filter(s -> s.key().equals(plan.scenarioKey()))
                .findFirst()
                .orElse(WorkflowScenario.MONTHLY_SALES_REPORT);
        String title = plan.summary() != null && !plan.summary().isBlank() ? plan.summary() : scenario.title();
        return new WorkflowPlan(scenario, title, plan.requiresApproval(), plan.approvalReason(), steps);
    }

    private AgentType agentTypeFor(String toolName) {
        return switch (toolName) {
            case "email", "slack", "kakao" -> AgentType.NOTIFIER;
            case "report-generator" -> AgentType.REPORTER;
            default -> AgentType.EXECUTOR;
        };
    }

    private boolean isAffirmativeExecution(String message) {
        String normalized = message == null ? "" : message.trim().toLowerCase();
        return normalized.equals("응")
                || normalized.equals("네")
                || normalized.equals("예")
                || normalized.contains("실행")
                || normalized.contains("승인")
                || normalized.contains("진행");
    }

    private String missingFieldMessage(List<String> missingFields) {
        if (missingFields.contains("recipientEmail")) {
            return "이메일 발송을 하려면 받을 이메일 주소가 필요합니다. 예: manager@demo-company.com";
        }
        return "실행에 필요한 정보가 더 필요합니다: " + String.join(", ", missingFields);
    }
}

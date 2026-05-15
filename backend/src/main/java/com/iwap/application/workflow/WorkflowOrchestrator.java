package com.iwap.application.workflow;

// 워크플로 Agent 파이프라인을 조율하는 오케스트레이터
import com.iwap.application.agent.*;
import com.iwap.application.delivery.DeliveryService;
import com.iwap.domain.approval.ApprovalRequest;
import com.iwap.domain.audit.AuditLogEntry;
import com.iwap.domain.workflow.WorkflowPlan;
import com.iwap.domain.workflow.WorkflowRun;
import com.iwap.domain.workflow.WorkflowStatus;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class WorkflowOrchestrator {

    private final WorkflowRunStore store;
    private final WorkflowEventPublisher publisher;
    private final DeliveryService deliveryService;
    private final PlannerAgent plannerAgent;
    private final ExecutorAgent executorAgent;
    private final ValidatorAgent validatorAgent;
    private final ReporterAgent reporterAgent;
    private final NotifierAgent notifierAgent;

    // 승인 대기 중인 컨텍스트 보관 (서버 재시작 시 소실 — 의도적)
    private final Map<String, WorkflowContext> pendingContexts = new ConcurrentHashMap<>();

    @Autowired
    public WorkflowOrchestrator(
            WorkflowRunStore store,
            WorkflowEventPublisher publisher,
            DeliveryService deliveryService,
            PlannerAgent plannerAgent,
            ExecutorAgent executorAgent,
            ValidatorAgent validatorAgent,
            ReporterAgent reporterAgent,
            NotifierAgent notifierAgent
    ) {
        this.store = store;
        this.publisher = publisher;
        this.deliveryService = deliveryService;
        this.plannerAgent = plannerAgent;
        this.executorAgent = executorAgent;
        this.validatorAgent = validatorAgent;
        this.reporterAgent = reporterAgent;
        this.notifierAgent = notifierAgent;
    }

    public WorkflowRun start(String command, String requestedBy) {
        return start(command, null, requestedBy);
    }

    /**
     * LLM이 생성한 WorkflowPlan을 그대로 실행한다. PlannerAgent의 키워드 매칭을 건너뛴다.
     */
    public WorkflowRun startWithPlan(String command, WorkflowPlan plan, String requestedBy, Map<String, Object> slots) {
        String runId = nextRunId(plan.scenario().key());
        WorkflowContext context = new WorkflowContext(runId, command, requestedBy, slots);
        context.setPlan(plan);

        if (plan.approvalRequired()) {
            String approvalId = runId + "-approval-" + UUID.randomUUID().toString().substring(0, 8);
            context.approvals().add(ApprovalRequest.pending(
                    approvalId, runId,
                    com.iwap.domain.agent.AgentType.PLANNER.name(),
                    plan.approvalReason()));
            pendingContexts.put(runId, context);
            return store.save(new WorkflowRun(
                    runId, plan.title(), command, requestedBy,
                    WorkflowStatus.WAITING_FOR_APPROVAL,
                    List.copyOf(context.events()),
                    List.of(),
                    List.copyOf(context.approvals()),
                    List.of(),
                    List.copyOf(context.auditTrail())
            ));
        }

        return runPipeline(context);
    }

    public WorkflowRun start(String command, String scenarioKey, String requestedBy) {
        String resolvedScenario = resolveScenario(command, scenarioKey);
        String runId = nextRunId(resolvedScenario);
        WorkflowContext context = new WorkflowContext(runId, command, requestedBy);

        plannerAgent.handle(context);

        if (context.plan().approvalRequired()) {
            String approvalId = runId + "-approval-" + UUID.randomUUID().toString().substring(0, 8);
            context.approvals().add(ApprovalRequest.pending(
                    approvalId, runId,
                    com.iwap.domain.agent.AgentType.PLANNER.name(),
                    context.plan().approvalReason()));

            pendingContexts.put(runId, context);

            return store.save(new WorkflowRun(
                    runId, context.plan().title(), command, requestedBy,
                    WorkflowStatus.WAITING_FOR_APPROVAL,
                    List.copyOf(context.events()),
                    List.of(),
                    List.copyOf(context.approvals()),
                    List.of(),
                    List.copyOf(context.auditTrail())
            ));
        }

        return runPipeline(context);
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
        // approval 상태 변경 + 감사 로그 추가
        WorkflowRun decided = store.decideApproval(approvalId, approved, decidedBy);

        if (!approved) {
            return decided;
        }

        WorkflowContext context = pendingContexts.remove(decided.id());
        if (context == null) {
            // 서버 재시작 후 컨텍스트 유실 — PlannerAgent를 다시 실행해 plan 복원
            context = new WorkflowContext(decided.id(), decided.command(), decided.requestedBy());
            context.events().addAll(decided.events());
            context.auditTrail().addAll(decided.auditTrail());
            plannerAgent.handle(context);
        }
        // decided.approvals()에는 이미 APPROVED 상태가 반영되어 있음 — context에 복사
        context.approvals().clear();
        context.approvals().addAll(decided.approvals());

        return runPipeline(context);
    }

    private WorkflowRun runPipeline(WorkflowContext context) {
        executorAgent.handle(context);
        validatorAgent.handle(context);
        reporterAgent.handle(context);
        notifierAgent.handle(context);

        WorkflowRun completed = new WorkflowRun(
                context.runId(),
                context.plan().title(),
                context.command(),
                context.requestedBy(),
                WorkflowStatus.COMPLETED,
                List.copyOf(context.events()),
                List.copyOf(context.toolCalls()),
                List.copyOf(context.approvals()),
                List.copyOf(context.artifacts()),
                List.copyOf(context.auditTrail())
        );
        if (publisher != null) {
            completed.events().forEach(publisher::publish);
        }
        return store.save(completed);
    }

    private String resolveScenario(String command, String scenarioKey) {
        if (scenarioKey != null && !scenarioKey.isBlank()) {
            return scenarioKey.trim().toLowerCase(Locale.ROOT);
        }
        String cmd = command.toLowerCase(Locale.ROOT);
        if (cmd.contains("재고") || cmd.contains("inventory")) return "low-inventory";
        if (cmd.contains("신규") || cmd.contains("onboarding") || cmd.contains("crm")) return "customer-onboarding";
        if (cmd.contains("주간") || cmd.contains("weekly")) return "weekly-sales-report";
        return "monthly-sales-report";
    }

    private String nextRunId(String prefix) {
        return prefix + "-" + UUID.randomUUID().toString().substring(0, 8);
    }
}

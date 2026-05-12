package com.iwap.infrastructure.persistence;

import com.iwap.domain.agent.AgentType;
import com.iwap.domain.approval.ApprovalRequest;
import com.iwap.domain.approval.ApprovalStatus;
import com.iwap.domain.audit.AuditLogEntry;
import com.iwap.domain.report.ReportArtifact;
import com.iwap.domain.tool.ToolCall;
import com.iwap.domain.workflow.WorkflowEvent;
import com.iwap.domain.workflow.WorkflowEventType;
import com.iwap.domain.workflow.WorkflowRun;
import com.iwap.domain.workflow.WorkflowStatus;
import org.junit.jupiter.api.Test;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class WorkflowRunJpaMapperTest {

    @Test
    void mapsWorkflowRunToJpaRowsAndBack() {
        OffsetDateTime now = OffsetDateTime.parse("2026-05-12T06:00:00Z");
        WorkflowRun run = new WorkflowRun(
                "run-test",
                "Inventory Approval",
                "Find low inventory and notify purchasing",
                "operator@demo-company.com",
                WorkflowStatus.WAITING_FOR_APPROVAL,
                List.of(new WorkflowEvent(
                        "run-test",
                        1,
                        AgentType.PLANNER,
                        WorkflowEventType.PLAN_CREATED,
                        "Approval is required before continuing.",
                        Map.of("scenario", "inventory"),
                        now
                )),
                List.of(ToolCall.completed("inventory", "Load low stock sample data.")),
                List.of(new ApprovalRequest(
                        "approval-run-test",
                        "run-test",
                        AgentType.PLANNER.name(),
                        "Human approval is required.",
                        ApprovalStatus.PENDING,
                        now
                )),
                List.of(ReportArtifact.markdown("run-test", "Inventory Approval", "summary", "content")),
                List.of(new AuditLogEntry(
                        "run-test",
                        1,
                        AgentType.PLANNER.name(),
                        WorkflowEventType.PLAN_CREATED.name(),
                        "Approval is required before continuing.",
                        Map.of("scenario", "inventory"),
                        now
                ))
        );

        WorkflowRunJpaMapper mapper = new WorkflowRunJpaMapper();

        WorkflowRun restored = mapper.toDomain(
                mapper.toRunEntity(run, now),
                mapper.toEventEntities(run),
                mapper.toToolCallEntities(run),
                mapper.toApprovalEntities(run),
                mapper.toReportArtifactEntities(run),
                mapper.toAuditLogEntities(run)
        );

        assertThat(restored).usingRecursiveComparison().isEqualTo(run);
    }
}

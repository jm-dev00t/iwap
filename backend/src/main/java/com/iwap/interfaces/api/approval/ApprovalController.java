package com.iwap.interfaces.api.approval;

import com.iwap.application.workflow.WorkflowOrchestrator;
import com.iwap.domain.approval.ApprovalRequest;
import com.iwap.domain.workflow.WorkflowRun;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/approvals")
public class ApprovalController {

    private final WorkflowOrchestrator orchestrator;

    public ApprovalController(WorkflowOrchestrator orchestrator) {
        this.orchestrator = orchestrator;
    }

    @GetMapping
    public List<ApprovalRequest> pendingApprovals() {
        return orchestrator.pendingApprovals();
    }

    @PostMapping("/{approvalId}/approve")
    public WorkflowRun approve(
            @PathVariable String approvalId,
            @Valid @RequestBody ApprovalDecisionRequest request
    ) {
        return orchestrator.decideApproval(approvalId, true, request.decidedBy());
    }

    @PostMapping("/{approvalId}/reject")
    public WorkflowRun reject(
            @PathVariable String approvalId,
            @Valid @RequestBody ApprovalDecisionRequest request
    ) {
        return orchestrator.decideApproval(approvalId, false, request.decidedBy());
    }
}

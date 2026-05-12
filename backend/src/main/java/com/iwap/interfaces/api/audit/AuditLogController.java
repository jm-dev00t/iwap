package com.iwap.interfaces.api.audit;

import com.iwap.application.workflow.WorkflowOrchestrator;
import com.iwap.domain.audit.AuditLogEntry;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/audit-logs")
public class AuditLogController {

    private final WorkflowOrchestrator orchestrator;

    public AuditLogController(WorkflowOrchestrator orchestrator) {
        this.orchestrator = orchestrator;
    }

    @GetMapping
    public List<AuditLogEntry> auditLogs() {
        return orchestrator.auditLogs();
    }
}

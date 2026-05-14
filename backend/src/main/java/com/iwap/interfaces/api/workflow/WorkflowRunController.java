package com.iwap.interfaces.api.workflow;

import com.iwap.application.workflow.WorkflowOrchestrator;
import com.iwap.domain.workflow.WorkflowRun;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/workflows/runs")
public class WorkflowRunController {

    private final WorkflowOrchestrator orchestrator;

    public WorkflowRunController(WorkflowOrchestrator orchestrator) {
        this.orchestrator = orchestrator;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public WorkflowRun start(@Valid @RequestBody StartWorkflowRunRequest request) {
        return orchestrator.start(request.command(), request.scenarioKey(), request.requestedBy());
    }

    @GetMapping
    public List<WorkflowRun> history() {
        return orchestrator.history();
    }
}

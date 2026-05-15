package com.iwap.interfaces.api.assistant;

import com.iwap.application.assistant.AssistantChatRequest;
import com.iwap.application.assistant.AssistantChatResponse;
import com.iwap.application.assistant.AssistantPlanExecutionRequest;
import com.iwap.application.assistant.AssistantService;
import com.iwap.domain.workflow.WorkflowRun;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/assistant")
public class AssistantController {

    private final AssistantService assistantService;

    public AssistantController(AssistantService assistantService) {
        this.assistantService = assistantService;
    }

    @PostMapping("/chat")
    public AssistantChatResponse chat(@Valid @RequestBody AssistantChatRequest request) {
        return assistantService.chat(request);
    }

    @PostMapping("/plans/{planId}/execute")
    @ResponseStatus(HttpStatus.CREATED)
    public WorkflowRun execute(@PathVariable String planId, @Valid @RequestBody AssistantPlanExecutionRequest request) {
        return assistantService.execute(planId, request);
    }
}

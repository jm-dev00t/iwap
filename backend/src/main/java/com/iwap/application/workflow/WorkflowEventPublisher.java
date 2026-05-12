package com.iwap.application.workflow;

import com.iwap.domain.workflow.WorkflowEvent;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
public class WorkflowEventPublisher {

    private final SimpMessagingTemplate messagingTemplate;

    public WorkflowEventPublisher(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void publish(WorkflowEvent event) {
        // Frontend subscribers can listen to /topic/workflows/{runId} for live agent progress.
        messagingTemplate.convertAndSend("/topic/workflows/" + event.runId(), event);
        messagingTemplate.convertAndSend("/topic/workflows", event);
    }
}

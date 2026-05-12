package com.iwap.application.agent;

import com.iwap.application.workflow.WorkflowContext;
import com.iwap.application.workflow.WorkflowEventRecorder;
import com.iwap.domain.agent.AgentType;
import com.iwap.domain.report.ReportArtifact;
import com.iwap.domain.workflow.WorkflowEventType;
import org.springframework.stereotype.Component;

@Component
public class ReporterAgent implements WorkflowAgent {

    private final WorkflowEventRecorder recorder;

    public ReporterAgent(WorkflowEventRecorder recorder) {
        this.recorder = recorder;
    }

    @Override
    public AgentType type() {
        return AgentType.REPORTER;
    }

    @Override
    public void handle(WorkflowContext context) {
        context.artifacts().add(ReportArtifact.markdown(
                context.runId(),
                context.plan().title(),
                "Agent workflow completed with " + context.toolCalls().size() + " tool calls.",
                """
                # Executive Summary

                - Workflow plan was created by Planner Agent.
                - Executor Agent completed the required tool calls.
                - Validator Agent checked recipients, metrics, and artifacts.
                - Reporter Agent generated this portfolio-ready report artifact.
                """
        ));
        recorder.record(context, type(), WorkflowEventType.REPORT_CREATED,
                "Created executive summary and report artifact for " + context.plan().title() + ".");
    }
}

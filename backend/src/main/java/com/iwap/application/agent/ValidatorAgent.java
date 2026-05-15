// 워크플로 실행 결과를 검증하고 이상 항목을 경고 이벤트로 기록하는 에이전트
package com.iwap.application.agent;

import com.iwap.application.workflow.WorkflowContext;
import com.iwap.application.workflow.WorkflowEventRecorder;
import com.iwap.domain.agent.AgentType;
import com.iwap.domain.workflow.WorkflowEventType;
import com.iwap.domain.workflow.WorkflowStep;
import org.springframework.stereotype.Component;

import java.util.Set;
import java.util.stream.Collectors;

@Component
public class ValidatorAgent implements WorkflowAgent {

    private final WorkflowEventRecorder recorder;

    public ValidatorAgent(WorkflowEventRecorder recorder) {
        this.recorder = recorder;
    }

    @Override
    public AgentType type() {
        return AgentType.VALIDATOR;
    }

    @Override
    public void handle(WorkflowContext context) {
        int warnings = 0;

        // 검사 1: 실행된 도구 호출이 하나라도 있는지 확인
        if (context.toolCalls().isEmpty()) {
            recorder.record(context, type(), WorkflowEventType.VALIDATION_WARNING,
                    "실행된 도구가 없습니다. 플랜에 정의된 도구가 실행되지 않았을 수 있습니다.");
            warnings++;
        }

        // 검사 2: EXECUTOR 소유 스텝마다 실제 도구 호출 결과가 있는지 확인
        Set<String> executedTools = context.toolCalls().stream()
                .map(tc -> tc.toolName())
                .collect(Collectors.toSet());
        for (WorkflowStep step : context.plan().steps()) {
            if (step.owner() == AgentType.EXECUTOR && !executedTools.contains(step.toolName())) {
                recorder.record(context, type(), WorkflowEventType.VALIDATION_WARNING,
                        "도구 [" + step.toolName() + "] 실행 결과가 확인되지 않았습니다.");
                warnings++;
            }
        }

        // 검사 3: 요청자 정보 존재 여부 확인
        if (context.requestedBy() == null || context.requestedBy().isBlank()) {
            recorder.record(context, type(), WorkflowEventType.VALIDATION_WARNING,
                    "요청자 정보가 누락되었습니다.");
            warnings++;
        }

        String summary = warnings > 0
                ? "검증 완료. " + warnings + "건의 경고가 발생했습니다."
                : "모든 검증 항목을 통과했습니다.";
        recorder.record(context, type(), WorkflowEventType.VALIDATION_COMPLETED, summary);
    }
}

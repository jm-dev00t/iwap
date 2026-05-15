package com.iwap.application.assistant;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

import java.util.Locale;

@Component
@Primary
@ConditionalOnProperty(prefix = "iwap.ai", name = "provider", havingValue = "openai")
@ConditionalOnBean(ChatModel.class)
public class OpenAiAssistantPlanner implements AssistantPlanner {

    private final ChatClient chatClient;
    private final ObjectMapper objectMapper;

    public OpenAiAssistantPlanner(ChatModel chatModel, ObjectMapper objectMapper) {
        this.chatClient = ChatClient.create(chatModel);
        this.objectMapper = objectMapper;
    }

    @Override
    public AssistantPlan plan(String command, AssistantSession session) {
        var spec = chatClient.prompt()
                .system("""
                        You are IWAP's workflow planning assistant. You support EXACTLY four business scenarios. Nothing else.
                        The four scenarios are:
                        1. monthly-sales-report: 월간 매출 보고서 생성 및 발송
                        2. weekly-sales-report: 주간 영업실적 리포트 생성 및 공유
                        3. low-inventory: 재고 부족 품목 확인 및 구매팀 알림
                        4. customer-onboarding: 신규 고객 온보딩 처리

                        CRITICAL RULE: If the user request is NOT clearly and specifically about one of these four scenarios,
                        you MUST set scenarioKey to "unsupported", confidence to 0.0, actions to [], missingFields to [],
                        requiresApproval to false, and summary to "지원하지 않는 업무입니다.".
                        Do NOT guess. Do NOT approximate. Do NOT be creative. Only these four scenarios are valid.

                        Return only valid JSON matching these fields:
                        intent, confidence, summary, missingFields, actions, requiresApproval, approvalReason, scenarioKey, command, requestedBy, slots, providerMode.
                        Allowed toolName values: sales-data, report-generator, email, slack, crm, inventory, kakao, approval.
                        Each action must have order, toolName, title, description, external.
                        If email delivery is requested but no recipient email is present, set missingFields to ["recipientEmail"] and do not add actions.
                        External email, slack, kakao, and approval actions require approval.
                        providerMode must be "openai".
                        Use Korean for summary, titles, and descriptions.
                        """);

        if (session.messages() != null) {
            for (var msg : session.messages()) {
                if ("user".equals(msg.role())) {
                    spec = spec.user(msg.content());
                } else if ("assistant".equals(msg.role())) {
                    spec = spec.assistant(msg.content());
                }
            }
        }

        String content = spec.user(command).call().content();

        try {
            AssistantPlan plan = objectMapper.readValue(extractJson(content), AssistantPlan.class);
            return plan.withIdentity("", session.id());
        } catch (Exception exception) {
            throw new IllegalStateException("OpenAI planner returned an invalid workflow plan.", exception);
        }
    }

    private String extractJson(String content) {
        String trimmed = content == null ? "" : content.trim();
        if (trimmed.toLowerCase(Locale.ROOT).startsWith("```json")) {
            trimmed = trimmed.substring(7).trim();
        }
        if (trimmed.startsWith("```")) {
            trimmed = trimmed.substring(3).trim();
        }
        if (trimmed.endsWith("```")) {
            trimmed = trimmed.substring(0, trimmed.length() - 3).trim();
        }
        return trimmed;
    }
}

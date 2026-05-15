// 대화 히스토리 메시지 단위 (user 또는 assistant 역할)
package com.iwap.application.assistant;

public record AssistantMessage(String role, String content) {}

package com.iwap.application.assistant;

public interface AssistantSessionStore {
    AssistantSession getOrCreate(String sessionId);

    AssistantSession save(AssistantSession session);
}

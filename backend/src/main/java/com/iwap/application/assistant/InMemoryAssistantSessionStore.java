package com.iwap.application.assistant;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class InMemoryAssistantSessionStore implements AssistantSessionStore {

    private final Map<String, AssistantSession> sessions = new ConcurrentHashMap<>();

    @Override
    public AssistantSession getOrCreate(String sessionId) {
        if (sessionId != null && !sessionId.isBlank()) {
            return sessions.computeIfAbsent(sessionId, id -> new AssistantSession(id, null, null, Map.of(), List.of()));
        }
        String nextId = "chat-" + UUID.randomUUID();
        AssistantSession session = new AssistantSession(nextId, null, null, Map.of(), List.of());
        sessions.put(nextId, session);
        return session;
    }

    @Override
    public AssistantSession save(AssistantSession session) {
        sessions.put(session.id(), session);
        return session;
    }
}

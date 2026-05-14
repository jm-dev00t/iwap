package com.iwap.infrastructure.websocket;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.Arrays;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final String allowedOriginPatterns;

    public WebSocketConfig(@Value("${iwap.web.allowed-origin-patterns:${IWAP_ALLOWED_ORIGIN_PATTERNS:http://localhost:*,http://127.0.0.1:*}}") String allowedOriginPatterns) {
        this.allowedOriginPatterns = allowedOriginPatterns;
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws/workflows")
                .setAllowedOriginPatterns(parsedAllowedOriginPatterns())
                .withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic");
        registry.setApplicationDestinationPrefixes("/app");
    }

    private String[] parsedAllowedOriginPatterns() {
        String[] origins = Arrays.stream(allowedOriginPatterns.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isBlank())
                .toArray(String[]::new);
        return origins.length == 0 ? new String[]{"http://localhost:*", "http://127.0.0.1:*"} : origins;
    }
}

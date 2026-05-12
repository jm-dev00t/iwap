package com.iwap.infrastructure.web;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class CorsConfigTest {

    @Test
    void parsesCommaSeparatedAllowedOriginPatterns() {
        CorsConfig config = new CorsConfig("https://iwap.vercel.app, https://*.onrender.com");

        List<String> origins = config.allowedOriginPatterns();

        assertThat(origins).containsExactly("https://iwap.vercel.app", "https://*.onrender.com");
    }

    @Test
    void fallsBackToLocalhostOriginsWhenBlank() {
        CorsConfig config = new CorsConfig(" ");

        List<String> origins = config.allowedOriginPatterns();

        assertThat(origins).containsExactly("http://localhost:*", "http://127.0.0.1:*");
    }
}

package com.iwap.infrastructure.web;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;
import java.util.List;

@Configuration
public class CorsConfig {

    private static final List<String> LOCAL_ORIGIN_PATTERNS = List.of("http://localhost:*", "http://127.0.0.1:*");

    private final String allowedOriginPatterns;

    CorsConfig(@Value("${iwap.web.allowed-origin-patterns:${IWAP_ALLOWED_ORIGIN_PATTERNS:http://localhost:*,http://127.0.0.1:*}}") String allowedOriginPatterns) {
        this.allowedOriginPatterns = allowedOriginPatterns;
    }

    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(allowedOriginPatterns());
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(false);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return new CorsFilter(source);
    }

    List<String> allowedOriginPatterns() {
        List<String> origins = Arrays.stream(allowedOriginPatterns.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isBlank())
                .toList();
        return origins.isEmpty() ? LOCAL_ORIGIN_PATTERNS : origins;
    }
}

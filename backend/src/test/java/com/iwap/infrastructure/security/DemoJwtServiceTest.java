package com.iwap.infrastructure.security;

import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class DemoJwtServiceTest {

    private final Clock clock = Clock.fixed(Instant.parse("2026-05-12T09:00:00Z"), ZoneOffset.UTC);
    private final DemoJwtService jwtService = new DemoJwtService(
            "test-secret-that-is-long-enough-for-demo-jwt-signing",
            clock
    );

    @Test
    void createsAndParsesManagerDemoToken() {
        DemoLoginUser user = DemoLoginUser.manager();

        String token = jwtService.createToken(user);

        DemoJwtClaims claims = jwtService.parse(token);
        assertThat(claims.email()).isEqualTo("manager@demo-company.com");
        assertThat(claims.displayName()).isEqualTo("Demo Manager");
        assertThat(claims.roles()).containsExactly("MANAGER");
    }

    @Test
    void rejectsTamperedToken() {
        String token = jwtService.createToken(DemoLoginUser.viewer());

        String tampered = token.substring(0, token.length() - 2) + "xx";

        assertThatThrownBy(() -> jwtService.parse(tampered))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid demo JWT");
    }
}

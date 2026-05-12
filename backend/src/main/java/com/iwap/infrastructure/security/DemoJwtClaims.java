package com.iwap.infrastructure.security;

import java.time.Instant;
import java.util.List;

record DemoJwtClaims(String email, String displayName, List<String> roles, Instant expiresAt) {
}

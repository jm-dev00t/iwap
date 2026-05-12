package com.iwap.interfaces.api.auth;

import java.util.List;

public record DemoLoginResponse(
        String tokenType,
        String accessToken,
        String email,
        String displayName,
        List<String> roles
) {
}

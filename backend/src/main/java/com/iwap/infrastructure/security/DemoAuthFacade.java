package com.iwap.infrastructure.security;

import com.iwap.interfaces.api.auth.DemoLoginResponse;
import org.springframework.stereotype.Component;

@Component
public class DemoAuthFacade {

    private final DemoJwtService jwtService;

    DemoAuthFacade(DemoJwtService jwtService) {
        this.jwtService = jwtService;
    }

    public DemoLoginResponse login(String role) {
        DemoLoginUser user = DemoLoginUser.fromRole(role);
        return new DemoLoginResponse(
                "Bearer",
                jwtService.createToken(user),
                user.email(),
                user.displayName(),
                user.roles()
        );
    }
}

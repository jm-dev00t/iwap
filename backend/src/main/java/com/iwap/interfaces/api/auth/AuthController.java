package com.iwap.interfaces.api.auth;

import com.iwap.infrastructure.security.DemoAuthFacade;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final DemoAuthFacade authFacade;

    public AuthController(DemoAuthFacade authFacade) {
        this.authFacade = authFacade;
    }

    @PostMapping("/demo-login")
    public DemoLoginResponse demoLogin(@RequestBody(required = false) DemoLoginRequest request) {
        return authFacade.login(request == null ? null : request.role());
    }
}

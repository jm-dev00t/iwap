package com.iwap.infrastructure.security;

import java.util.List;

record DemoLoginUser(String email, String displayName, List<String> roles) {

    static DemoLoginUser manager() {
        return new DemoLoginUser("manager@demo-company.com", "Demo Manager", List.of("MANAGER"));
    }

    static DemoLoginUser operator() {
        return new DemoLoginUser("operator@demo-company.com", "Demo Operator", List.of("OPERATOR"));
    }

    static DemoLoginUser viewer() {
        return new DemoLoginUser("viewer@demo-company.com", "Demo Viewer", List.of("VIEWER"));
    }

    static DemoLoginUser fromRole(String role) {
        String normalized = role == null ? "MANAGER" : role.trim().toUpperCase();
        return switch (normalized) {
            case "OPERATOR" -> operator();
            case "VIEWER" -> viewer();
            default -> manager();
        };
    }
}

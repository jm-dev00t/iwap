package com.iwap.interfaces.api.demo;

public record DemoScenarioResponse(
        String key,
        String title,
        String command,
        String businessValue
) {
}

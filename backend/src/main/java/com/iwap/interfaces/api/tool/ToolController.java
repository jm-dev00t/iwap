package com.iwap.interfaces.api.tool;

import com.iwap.application.tool.ToolRegistry;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/tools")
public class ToolController {

    private final ToolRegistry toolRegistry;

    public ToolController(ToolRegistry toolRegistry) {
        this.toolRegistry = toolRegistry;
    }

    @GetMapping
    public List<ToolResponse> tools() {
        return toolRegistry.toolNames().stream()
                .map(name -> new ToolResponse(name, "MOCK", "READY"))
                .toList();
    }
}

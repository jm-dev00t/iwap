package com.iwap.infrastructure.openapi;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI iwapOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("IWAP API")
                        .version("0.1.0")
                        .description("Multi-agent workflow automation API for the Intelligent Workflow Automation Platform portfolio project.")
                        .contact(new Contact()
                                .name("IWAP Portfolio")
                                .email("portfolio@example.com"))
                        .license(new License()
                                .name("Portfolio Demo")));
    }
}

package com.iwap.infrastructure.tools;

import com.iwap.application.tool.BusinessTool;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ToolAdapterConfig {

    @Bean
    public BusinessTool salesDataTool() {
        return new MockBusinessTool("sales-data");
    }

    @Bean
    public BusinessTool reportGeneratorTool() {
        return new MockBusinessTool("report-generator");
    }

    @Bean
    public BusinessTool slackTool() {
        return new MockBusinessTool("slack");
    }

    @Bean
    public BusinessTool emailTool() {
        return new MockBusinessTool("email");
    }

    @Bean
    public BusinessTool crmTool() {
        return new MockBusinessTool("crm");
    }

    @Bean
    public BusinessTool inventoryTool() {
        return new MockBusinessTool("inventory");
    }

    @Bean
    public BusinessTool kakaoTool() {
        return new MockBusinessTool("kakao");
    }
}

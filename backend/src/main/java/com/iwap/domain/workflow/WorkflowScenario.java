package com.iwap.domain.workflow;

public enum WorkflowScenario {
    MONTHLY_SALES_REPORT("monthly-sales-report", "Monthly Sales Report Automation"),
    CUSTOMER_ONBOARDING("customer-onboarding", "New Customer Onboarding"),
    LOW_INVENTORY_ALERT("low-inventory", "Low Inventory Purchasing Alert"),
    WEEKLY_SALES_REPORT("weekly-sales-report", "Weekly Sales Performance Report");

    private final String key;
    private final String title;

    WorkflowScenario(String key, String title) {
        this.key = key;
        this.title = title;
    }

    public String key() {
        return key;
    }

    public String title() {
        return title;
    }
}

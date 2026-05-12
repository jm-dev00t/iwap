package com.iwap.domain.workflow;

public enum WorkflowStatus {
    QUEUED,
    PLANNING,
    WAITING_FOR_APPROVAL,
    EXECUTING,
    VALIDATING,
    REPORTING,
    NOTIFYING,
    COMPLETED,
    FAILED,
    REJECTED
}

package com.iwap.infrastructure.persistence;

import com.iwap.domain.approval.ApprovalStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

interface WorkflowRunJpaRepository extends JpaRepository<WorkflowRunEntity, String> {
    List<WorkflowRunEntity> findAllByOrderByIdDesc();
}

interface WorkflowEventJpaRepository extends JpaRepository<WorkflowEventEntity, Long> {
    List<WorkflowEventEntity> findAllByRunIdOrderBySequenceNoAsc(String runId);

    void deleteByRunId(String runId);
}

interface ToolCallJpaRepository extends JpaRepository<ToolCallEntity, Long> {
    List<ToolCallEntity> findAllByRunIdOrderByIdAsc(String runId);

    void deleteByRunId(String runId);
}

interface ApprovalRequestJpaRepository extends JpaRepository<ApprovalRequestEntity, String> {
    List<ApprovalRequestEntity> findAllByRunIdOrderByRequestedAtAsc(String runId);

    List<ApprovalRequestEntity> findAllByStatusOrderByRequestedAtAsc(ApprovalStatus status);

    void deleteByRunId(String runId);
}

interface ReportArtifactJpaRepository extends JpaRepository<ReportArtifactEntity, String> {
    List<ReportArtifactEntity> findAllByRunIdOrderByCreatedAtAsc(String runId);

    void deleteByRunId(String runId);
}

interface AuditLogJpaRepository extends JpaRepository<AuditLogEntity, Long> {
    List<AuditLogEntity> findAllByRunIdOrderBySequenceNoAsc(String runId);

    List<AuditLogEntity> findAllByOrderByOccurredAtDesc();

    void deleteByRunId(String runId);
}

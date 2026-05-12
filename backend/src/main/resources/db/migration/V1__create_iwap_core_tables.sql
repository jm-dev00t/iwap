CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE workflow_runs (
    id VARCHAR(80) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    command TEXT NOT NULL,
    requested_by VARCHAR(200) NOT NULL,
    status VARCHAR(40) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE TABLE workflow_events (
    id BIGSERIAL PRIMARY KEY,
    run_id VARCHAR(80) NOT NULL REFERENCES workflow_runs(id),
    sequence_no BIGINT NOT NULL,
    agent_type VARCHAR(40) NOT NULL,
    event_type VARCHAR(60) NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (run_id, sequence_no)
);

CREATE TABLE tool_calls (
    id BIGSERIAL PRIMARY KEY,
    run_id VARCHAR(80) NOT NULL REFERENCES workflow_runs(id),
    tool_name VARCHAR(80) NOT NULL,
    purpose TEXT NOT NULL,
    arguments JSONB NOT NULL DEFAULT '{}'::jsonb,
    status VARCHAR(40) NOT NULL,
    completed_at TIMESTAMPTZ
);

CREATE TABLE approval_requests (
    id VARCHAR(100) PRIMARY KEY,
    run_id VARCHAR(80) NOT NULL REFERENCES workflow_runs(id),
    requested_by_agent VARCHAR(40) NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(40) NOT NULL,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    decided_at TIMESTAMPTZ
);

CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    run_id VARCHAR(80),
    sequence_no BIGINT NOT NULL,
    actor VARCHAR(120) NOT NULL,
    action VARCHAR(120) NOT NULL,
    summary TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE workflow_memories (
    id BIGSERIAL PRIMARY KEY,
    tenant_id VARCHAR(80) NOT NULL,
    source_type VARCHAR(80) NOT NULL,
    content TEXT NOT NULL,
    embedding vector(1536),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_workflow_events_run_id ON workflow_events(run_id);
CREATE INDEX idx_tool_calls_run_id ON tool_calls(run_id);
CREATE INDEX idx_audit_logs_run_id ON audit_logs(run_id);
CREATE INDEX idx_workflow_memories_tenant_id ON workflow_memories(tenant_id);

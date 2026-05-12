CREATE TABLE report_artifacts (
    id VARCHAR(120) PRIMARY KEY,
    run_id VARCHAR(80) NOT NULL REFERENCES workflow_runs(id),
    title VARCHAR(200) NOT NULL,
    format VARCHAR(40) NOT NULL,
    summary TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_report_artifacts_run_id ON report_artifacts(run_id);

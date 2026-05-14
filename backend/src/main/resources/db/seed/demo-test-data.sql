BEGIN;

DELETE FROM approval_requests
WHERE run_id IN (
    'run-demo-monthly-sales',
    'run-demo-customer-onboarding',
    'run-demo-low-inventory',
    'run-demo-weekly-sales'
);

DELETE FROM report_artifacts
WHERE run_id IN (
    'run-demo-monthly-sales',
    'run-demo-customer-onboarding',
    'run-demo-low-inventory',
    'run-demo-weekly-sales'
);

DELETE FROM tool_calls
WHERE run_id IN (
    'run-demo-monthly-sales',
    'run-demo-customer-onboarding',
    'run-demo-low-inventory',
    'run-demo-weekly-sales'
);

DELETE FROM workflow_events
WHERE run_id IN (
    'run-demo-monthly-sales',
    'run-demo-customer-onboarding',
    'run-demo-low-inventory',
    'run-demo-weekly-sales'
);

DELETE FROM audit_logs
WHERE run_id IN (
    'run-demo-monthly-sales',
    'run-demo-customer-onboarding',
    'run-demo-low-inventory',
    'run-demo-weekly-sales'
);

DELETE FROM workflow_runs
WHERE id IN (
    'run-demo-monthly-sales',
    'run-demo-customer-onboarding',
    'run-demo-low-inventory',
    'run-demo-weekly-sales'
);

DELETE FROM workflow_memories
WHERE tenant_id = 'tenant-demo';

INSERT INTO workflow_runs (id, title, command, requested_by, status, created_at, completed_at)
VALUES
    (
        'run-demo-monthly-sales',
        'Monthly Sales Report Automation',
        'Create this month sales report and send it to Slack and email.',
        'manager@demo-company.com',
        'COMPLETED',
        NOW() - INTERVAL '4 hours',
        NOW() - INTERVAL '3 hours 54 minutes'
    ),
    (
        'run-demo-customer-onboarding',
        'New Customer Onboarding',
        'Register a new customer, send a welcome email, update CRM, and notify the account owner.',
        'sales@demo-company.com',
        'COMPLETED',
        NOW() - INTERVAL '2 hours',
        NOW() - INTERVAL '1 hour 52 minutes'
    ),
    (
        'run-demo-low-inventory',
        'Low Inventory Purchasing Alert',
        'Find low inventory items and send a purchase team notification.',
        'operator@demo-company.com',
        'WAITING_FOR_APPROVAL',
        NOW() - INTERVAL '45 minutes',
        NULL
    ),
    (
        'run-demo-weekly-sales',
        'Weekly Sales Performance Report',
        'Analyze weekly sales performance and generate a PDF report.',
        'director@demo-company.com',
        'COMPLETED',
        NOW() - INTERVAL '25 minutes',
        NOW() - INTERVAL '18 minutes'
    );

INSERT INTO workflow_events (run_id, sequence_no, agent_type, event_type, message, metadata, occurred_at)
VALUES
    ('run-demo-monthly-sales', 1, 'PLANNER', 'PLAN_CREATED', 'Created a monthly sales reporting plan.', '{"scenario":"monthly-sales-report"}', NOW() - INTERVAL '3 hours 59 minutes'),
    ('run-demo-monthly-sales', 2, 'EXECUTOR', 'TOOL_CALL_COMPLETED', 'Loaded sales data and generated a draft report.', '{"rows":4,"source":"sales-data.csv"}', NOW() - INTERVAL '3 hours 58 minutes'),
    ('run-demo-monthly-sales', 3, 'VALIDATOR', 'VALIDATION_COMPLETED', 'Validated required metrics, recipients, and artifacts.', '{"requiredMetrics":["revenue","channel","growth"]}', NOW() - INTERVAL '3 hours 56 minutes'),
    ('run-demo-monthly-sales', 4, 'REPORTER', 'REPORT_CREATED', 'Created an executive summary artifact.', '{"artifact":"monthly-sales-report.md"}', NOW() - INTERVAL '3 hours 55 minutes'),
    ('run-demo-monthly-sales', 5, 'NOTIFIER', 'NOTIFICATION_COMPLETED', 'Sent completion notices to Slack and email.', '{"slackChannel":"#sales-report"}', NOW() - INTERVAL '3 hours 54 minutes'),

    ('run-demo-customer-onboarding', 1, 'PLANNER', 'PLAN_CREATED', 'Created a customer onboarding plan.', '{"scenario":"customer-onboarding"}', NOW() - INTERVAL '1 hour 59 minutes'),
    ('run-demo-customer-onboarding', 2, 'EXECUTOR', 'TOOL_CALL_COMPLETED', 'Registered the customer in CRM.', '{"customerId":"C-1004","customerName":"Blue Harbor Retail"}', NOW() - INTERVAL '1 hour 57 minutes'),
    ('run-demo-customer-onboarding', 3, 'EXECUTOR', 'TOOL_CALL_COMPLETED', 'Sent welcome email and account owner notification.', '{"email":"welcome","owner":"account-owner"}', NOW() - INTERVAL '1 hour 55 minutes'),
    ('run-demo-customer-onboarding', 4, 'VALIDATOR', 'VALIDATION_COMPLETED', 'Validated CRM and notification records.', '{"crmLogged":true,"emailQueued":true}', NOW() - INTERVAL '1 hour 53 minutes'),
    ('run-demo-customer-onboarding', 5, 'NOTIFIER', 'NOTIFICATION_COMPLETED', 'Published onboarding completion notice.', '{"requester":"sales@demo-company.com"}', NOW() - INTERVAL '1 hour 52 minutes'),

    ('run-demo-low-inventory', 1, 'PLANNER', 'APPROVAL_REQUESTED', 'Requested approval before notifying the purchase team.', '{"scenario":"low-inventory"}', NOW() - INTERVAL '44 minutes'),
    ('run-demo-low-inventory', 2, 'VALIDATOR', 'VALIDATION_COMPLETED', 'Validated low-stock items and notification draft.', '{"items":["SKU-RED-001","SKU-GRN-014"]}', NOW() - INTERVAL '43 minutes'),

    ('run-demo-weekly-sales', 1, 'PLANNER', 'PLAN_CREATED', 'Created a weekly performance reporting plan.', '{"scenario":"weekly-sales-report"}', NOW() - INTERVAL '24 minutes'),
    ('run-demo-weekly-sales', 2, 'EXECUTOR', 'TOOL_CALL_COMPLETED', 'Combined weekly activity and customer data.', '{"sources":["weekly-sales-activities.csv","customers.csv"]}', NOW() - INTERVAL '22 minutes'),
    ('run-demo-weekly-sales', 3, 'REPORTER', 'REPORT_CREATED', 'Generated a weekly PDF report draft.', '{"artifact":"weekly-sales-performance.pdf"}', NOW() - INTERVAL '20 minutes'),
    ('run-demo-weekly-sales', 4, 'NOTIFIER', 'NOTIFICATION_COMPLETED', 'Sent report sharing notification.', '{"sharedWith":["director@demo-company.com"]}', NOW() - INTERVAL '18 minutes');

INSERT INTO tool_calls (run_id, tool_name, purpose, arguments, status, completed_at)
VALUES
    ('run-demo-monthly-sales', 'sales-data', 'Load monthly sales sample data.', '{"file":"sales-data.csv"}', 'COMPLETED', NOW() - INTERVAL '3 hours 58 minutes'),
    ('run-demo-monthly-sales', 'report-generator', 'Generate monthly sales report artifact.', '{"format":"markdown"}', 'COMPLETED', NOW() - INTERVAL '3 hours 55 minutes'),
    ('run-demo-monthly-sales', 'slack', 'Send sales report to Slack.', '{"channel":"#sales-report"}', 'COMPLETED', NOW() - INTERVAL '3 hours 54 minutes'),
    ('run-demo-monthly-sales', 'email', 'Email report to management recipients.', '{"to":["manager@demo-company.com"]}', 'COMPLETED', NOW() - INTERVAL '3 hours 54 minutes'),

    ('run-demo-customer-onboarding', 'crm', 'Register new customer in CRM.', '{"customerId":"C-1004"}', 'COMPLETED', NOW() - INTERVAL '1 hour 57 minutes'),
    ('run-demo-customer-onboarding', 'email', 'Send welcome email.', '{"template":"welcome"}', 'COMPLETED', NOW() - INTERVAL '1 hour 55 minutes'),
    ('run-demo-customer-onboarding', 'notification', 'Notify account owner.', '{"owner":"account-owner"}', 'COMPLETED', NOW() - INTERVAL '1 hour 55 minutes'),

    ('run-demo-low-inventory', 'inventory', 'Load low-stock items.', '{"threshold":"reorder_point"}', 'COMPLETED', NOW() - INTERVAL '43 minutes'),
    ('run-demo-low-inventory', 'kakaowork', 'Prepare purchase team notification.', '{"room":"purchase-team"}', 'PENDING', NULL),

    ('run-demo-weekly-sales', 'activity-data', 'Load weekly sales activities.', '{"file":"weekly-sales-activities.csv"}', 'COMPLETED', NOW() - INTERVAL '22 minutes'),
    ('run-demo-weekly-sales', 'pdf-generator', 'Generate weekly PDF report.', '{"format":"pdf"}', 'COMPLETED', NOW() - INTERVAL '20 minutes'),
    ('run-demo-weekly-sales', 'email', 'Share report notification.', '{"to":["director@demo-company.com"]}', 'COMPLETED', NOW() - INTERVAL '18 minutes');

INSERT INTO approval_requests (id, run_id, requested_by_agent, reason, status, requested_at, decided_at)
VALUES
    (
        'approval-demo-low-inventory',
        'run-demo-low-inventory',
        'PLANNER',
        'Human approval is required because the purchase team notification can trigger buying activity.',
        'PENDING',
        NOW() - INTERVAL '44 minutes',
        NULL
    );

INSERT INTO report_artifacts (id, run_id, title, format, summary, content, created_at)
VALUES
    (
        'report-demo-monthly-sales',
        'run-demo-monthly-sales',
        'Monthly Sales Report',
        'MARKDOWN',
        '2026년 5월 총매출 143,300,000원, 전월 대비 9.3% 증가 리포트가 생성되고 Slack/Email 공유까지 완료되었습니다.',
        $$# 2026년 5월 월간 매출 보고서

## 핵심 지표

| 지표 | 2026년 5월 | 2026년 4월 | 변화 |
| --- | ---: | ---: | ---: |
| 총매출 | 143,300,000원 | 131,000,000원 | +9.3% |
| 총주문 | 189건 | 177건 | +6.8% |
| 가중 평균 매출총이익률 | 34.2% | 33.3% | +0.9%p |

## Slack/Email 전송

- Slack 채널: #sales-report
- Email 수신자: manager@demo-company.com, finance-lead@demo-company.com
- 상태: 성공$$,
        NOW() - INTERVAL '3 hours 55 minutes'
    ),
    (
        'report-demo-customer-onboarding',
        'run-demo-customer-onboarding',
        'New Customer Onboarding',
        'MARKDOWN',
        '신규 고객 CRM 등록, 환영 이메일, 담당자 알림 결과가 정리되었습니다.',
        $$# 신규 고객 온보딩 처리 결과

| 항목 | 값 |
| --- | --- |
| 고객사 | Blue Harbor Retail |
| 담당자 | account-owner@demo-company.com |
| 상태 | CRM 등록 완료 |

- 환영 이메일 발송: 성공
- 담당자 알림: 성공
- 다음 액션: 첫 사용 교육 일정 확정$$,
        NOW() - INTERVAL '1 hour 52 minutes'
    ),
    (
        'report-demo-low-inventory',
        'run-demo-low-inventory',
        'Low Inventory Purchasing Alert',
        'MARKDOWN',
        '재고 부족 구매 알림 초안이 생성되었고 구매팀 발송 전 승인 대기 상태입니다.',
        $$# 재고 부족 구매 알림 초안

| SKU | 품목 | 현재 재고 | 재주문 기준 | 권장 발주 |
| --- | --- | ---: | ---: | ---: |
| SKU-RED-001 | 레드 패키지 박스 | 12 | 50 | 120 |
| SKU-GRN-014 | 그린 라벨 세트 | 8 | 40 | 90 |
| SKU-BLK-021 | 블랙 완충재 | 17 | 60 | 100 |

- 발송 예정 채널: 구매팀 알림방
- 상태: 승인 대기$$,
        NOW() - INTERVAL '43 minutes'
    ),
    (
        'report-demo-weekly-sales',
        'run-demo-weekly-sales',
        'Weekly Sales Performance Report',
        'PDF',
        '주간 영업 실적, 리드 전환율, Top Account, 다음 액션이 포함된 리포트가 생성되었습니다.',
        $$# 주간 영업 실적 리포트

| 지표 | 값 | 전주 대비 |
| --- | ---: | ---: |
| 신규 리드 | 64건 | +12.3% |
| 미팅 전환 | 18건 | +5.9% |
| 리드 전환율 | 28.1% | +1.7%p |
| 예상 파이프라인 | 94,000,000원 | +8.4% |

- Top Account: Blue Harbor Retail, Northwind Partners, Urban Supply Co.
- Email 수신자: director@demo-company.com
- 상태: 성공$$,
        NOW() - INTERVAL '20 minutes'
    );

INSERT INTO audit_logs (run_id, sequence_no, actor, action, summary, metadata, occurred_at)
VALUES
    ('run-demo-monthly-sales', 1, 'PLANNER', 'PLAN_CREATED', 'Created monthly sales report plan.', '{"scenario":"monthly-sales-report"}', NOW() - INTERVAL '3 hours 59 minutes'),
    ('run-demo-monthly-sales', 2, 'EXECUTOR', 'TOOL_CALL_COMPLETED', 'Loaded data and generated report.', '{"tools":["sales-data","report-generator"]}', NOW() - INTERVAL '3 hours 55 minutes'),
    ('run-demo-monthly-sales', 3, 'NOTIFIER', 'NOTIFICATION_COMPLETED', 'Completed Slack and email delivery.', '{"channels":["slack","email"]}', NOW() - INTERVAL '3 hours 54 minutes'),

    ('run-demo-customer-onboarding', 1, 'PLANNER', 'PLAN_CREATED', 'Created customer onboarding plan.', '{"scenario":"customer-onboarding"}', NOW() - INTERVAL '1 hour 59 minutes'),
    ('run-demo-customer-onboarding', 2, 'EXECUTOR', 'TOOL_CALL_COMPLETED', 'Completed CRM update and welcome email.', '{"customerId":"C-1004"}', NOW() - INTERVAL '1 hour 55 minutes'),

    ('run-demo-low-inventory', 1, 'PLANNER', 'APPROVAL_REQUESTED', 'Created purchase notification approval request.', '{"approvalId":"approval-demo-low-inventory"}', NOW() - INTERVAL '44 minutes'),
    ('run-demo-low-inventory', 2, 'HUMAN_APPROVAL_POLICY', 'APPROVAL_PENDING', 'Waiting for approval before purchase notification.', '{"policy":"purchase-notification"}', NOW() - INTERVAL '44 minutes'),

    ('run-demo-weekly-sales', 1, 'PLANNER', 'PLAN_CREATED', 'Created weekly sales report plan.', '{"scenario":"weekly-sales-report"}', NOW() - INTERVAL '24 minutes'),
    ('run-demo-weekly-sales', 2, 'REPORTER', 'REPORT_CREATED', 'Generated weekly PDF report.', '{"artifact":"weekly-sales-performance.pdf"}', NOW() - INTERVAL '20 minutes'),
    ('run-demo-weekly-sales', 3, 'NOTIFIER', 'NOTIFICATION_COMPLETED', 'Completed report sharing notification.', '{"sharedWith":["director@demo-company.com"]}', NOW() - INTERVAL '18 minutes'),

    (NULL, 1, 'SYSTEM', 'SEED_DATA_LOADED', 'Loaded demo seed data.', '{"source":"demo-test-data.sql"}', NOW());

INSERT INTO workflow_memories (tenant_id, source_type, content, embedding, created_at)
VALUES
    ('tenant-demo', 'sales-summary', 'Monthly reports should include channel revenue, month-over-month growth, and Slack or email delivery results.', NULL, NOW() - INTERVAL '3 hours'),
    ('tenant-demo', 'crm-note', 'Customer onboarding includes CRM registration, welcome email, owner notification, and audit logs.', NULL, NOW() - INTERVAL '2 hours'),
    ('tenant-demo', 'inventory-policy', 'Low inventory purchase notifications require human approval before sending.', NULL, NOW() - INTERVAL '45 minutes'),
    ('tenant-demo', 'report-template', 'Weekly sales reports should summarize activity, conversion, key customers, and next actions as PDF.', NULL, NOW() - INTERVAL '20 minutes');

COMMIT;

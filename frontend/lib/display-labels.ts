const workflowTitleLabels: Record<string, string> = {
  "Monthly Sales Report Automation": "월간 매출 보고서 자동화",
  "Low Inventory Purchasing Alert": "재고 부족 구매팀 알림",
  "New Customer Onboarding": "신규 고객 온보딩 자동화",
  "Weekly Sales Performance Report": "주간 영업 리포트 생성",
  "Untitled Workflow": "제목 없는 워크플로",
  "demo-low-inventory": "재고 부족 구매팀 알림",
  "demo-monthly-sales": "월간 매출 보고서 자동화",
  "demo-weekly-sales": "주간 영업 리포트 생성",
  "demo-customer-onboarding": "신규 고객 온보딩 자동화",
};

const statusLabels: Record<string, string> = {
  QUEUED: "대기 중",
  PLANNING: "계획 중",
  WAITING_FOR_APPROVAL: "승인 대기",
  EXECUTING: "실행 중",
  VALIDATING: "검증 중",
  REPORTING: "보고서 생성 중",
  NOTIFYING: "알림 발송 중",
  COMPLETED: "완료",
  FAILED: "실패",
  REJECTED: "반려",
  PENDING: "대기",
  APPROVED: "승인됨",
};

const agentLabels: Record<string, string> = {
  PLANNER: "계획 에이전트",
  Planner: "계획 에이전트",
  EXECUTOR: "실행 에이전트",
  Executor: "실행 에이전트",
  VALIDATOR: "검증 에이전트",
  Validator: "검증 에이전트",
  REPORTER: "보고 에이전트",
  Reporter: "보고 에이전트",
  NOTIFIER: "알림 에이전트",
  Notifier: "알림 에이전트",
  HUMAN_APPROVAL_POLICY: "승인 정책",
  SYSTEM: "시스템",
};

const actionLabels: Record<string, string> = {
  PLAN_CREATED: "계획 생성",
  TOOL_CALL_COMPLETED: "도구 호출 완료",
  VALIDATION_COMPLETED: "검증 완료",
  REPORT_CREATED: "보고서 생성",
  NOTIFICATION_COMPLETED: "알림 완료",
  APPROVAL_REQUESTED: "승인 요청",
  APPROVAL_PENDING: "승인 대기",
  APPROVAL_APPROVED: "승인 완료",
  APPROVAL_REJECTED: "반려 완료",
  SEED_DATA_LOADED: "테스트 데이터 적재",
  ARTIFACT_MARKDOWN: "마크다운 산출물",
  ARTIFACT_PDF: "PDF 산출물",
};

const toolLabels: Record<string, string> = {
  "sales-data": "매출 데이터",
  "report-generator": "보고서 생성기",
  slack: "슬랙 알림",
  email: "이메일",
  crm: "고객 관리",
  inventory: "재고 시스템",
  kakao: "카카오워크",
  kakaowork: "카카오워크",
  approval: "승인 요청",
  notification: "담당자 알림",
  "activity-data": "영업 활동 데이터",
  "pdf-generator": "PDF 생성기",
};

export function workflowTitleLabel(value: string) {
  return workflowTitleLabels[value] ?? value;
}

export function statusLabel(value: string) {
  return statusLabels[value] ?? value;
}

export function agentLabel(value: string) {
  return agentLabels[value] ?? value;
}

export function actionLabel(value: string) {
  return actionLabels[value] ?? value;
}

export function toolLabel(value: string) {
  return toolLabels[value.toLowerCase()] ?? value;
}

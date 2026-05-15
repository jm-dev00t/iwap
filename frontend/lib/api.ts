export type WorkflowStatus =
  | "QUEUED"
  | "PLANNING"
  | "WAITING_FOR_APPROVAL"
  | "EXECUTING"
  | "VALIDATING"
  | "REPORTING"
  | "NOTIFYING"
  | "COMPLETED"
  | "FAILED"
  | "REJECTED";

export type WorkflowRun = {
  id: string;
  title: string;
  command: string;
  requestedBy: string;
  status: WorkflowStatus;
  events: Array<{
    agentType: string;
    eventType: string;
    message: string;
    occurredAt: string;
  }>;
  toolCalls: Array<{
    toolName: string;
    purpose: string;
    arguments?: Record<string, unknown>;
    status: string;
  }>;
  approvals: Array<{
    id: string;
    reason: string;
    status: string;
  }>;
  artifacts: Array<{
    id: string;
    title: string;
    format: string;
    summary: string;
    content: string;
    createdAt: string;
  }>;
  auditTrail: Array<{
    actor: string;
    action: string;
    summary: string;
  }>;
};

export type WorkflowEventPayload = WorkflowRun["events"][number] & {
  runId: string;
  sequence?: number;
  metadata?: Record<string, unknown>;
};

export type ApprovalItem = {
  id: string;
  runId: string;
  requestedByAgent: string;
  reason: string;
  status: string;
  requestedAt: string;
};

export type DemoScenario = {
  key: string;
  title: string;
  command: string;
  businessValue: string;
};

export type AssistantState = "NEEDS_INPUT" | "PLAN_READY" | "EXECUTED";

export type AssistantPlanAction = {
  order: number;
  toolName: string;
  title: string;
  description: string;
  external: boolean;
};

export type AssistantPlan = {
  id: string;
  sessionId: string;
  intent: string;
  confidence: number;
  summary: string;
  missingFields: string[];
  actions: AssistantPlanAction[];
  requiresApproval: boolean;
  approvalReason: string;
  scenarioKey: string;
  command: string;
  requestedBy: string;
  slots: Record<string, unknown>;
  providerMode: "mock" | "openai" | string;
  createdAt: string;
};

export type AssistantChatResponse = {
  sessionId: string;
  assistantMessage: string;
  state: AssistantState;
  plan: AssistantPlan | null;
  missingFields: string[];
  run: WorkflowRun | null;
};

export type ToolAdapter = {
  name: string;
  providerMode: string;
  status: string;
};

export type DemoAuthSession = {
  tokenType: "Bearer";
  accessToken: string;
  email: string;
  displayName: string;
  roles: string[];
};

const API_BASE_URL = process.env.NEXT_PUBLIC_IWAP_API_BASE_URL ?? "http://localhost:8080";
const AUTH_STORAGE_KEY = "iwap.demoAuthSession";

function normalizeWorkflowRun(run: Partial<WorkflowRun>): WorkflowRun {
  return {
    id: run.id ?? `run-${Date.now()}`,
    title: run.title ?? "제목 없는 워크플로",
    command: run.command ?? "",
    requestedBy: run.requestedBy ?? "알 수 없음",
    status: run.status ?? "QUEUED",
    events: run.events ?? [],
    toolCalls: run.toolCalls ?? [],
    approvals: run.approvals ?? [],
    artifacts: run.artifacts ?? [],
    auditTrail: run.auditTrail ?? [],
  };
}

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}, timeoutMs = 1500): Promise<Response> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  return fetch(input, { ...init, signal: controller.signal }).finally(() => window.clearTimeout(timeout));
}

function readAuthSession(): DemoAuthSession | null {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as DemoAuthSession;
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

function saveAuthSession(session: DemoAuthSession) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  }
}

function authHeaders(headers?: HeadersInit): Headers {
  const merged = new Headers(headers);
  const session = readAuthSession();
  if (session && !merged.has("Authorization")) {
    merged.set("Authorization", `${session.tokenType} ${session.accessToken}`);
  }
  return merged;
}

async function fetchApi(input: RequestInfo | URL, init: RequestInit = {}, timeoutMs = 1500): Promise<Response> {
  let response = await fetchWithTimeout(input, { ...init, headers: authHeaders(init.headers) }, timeoutMs);
  if (response.status !== 401) {
    return response;
  }

  await demoLogin("MANAGER");
  response = await fetchWithTimeout(input, { ...init, headers: authHeaders(init.headers) }, timeoutMs);
  return response;
}

export async function demoLogin(role = "MANAGER"): Promise<DemoAuthSession> {
  const response = await fetchWithTimeout(`${API_BASE_URL}/api/auth/demo-login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ role }),
  });

  if (!response.ok) {
    throw new Error(`데모 로그인 실패: ${response.status}`);
  }

  const session = (await response.json()) as DemoAuthSession;
  saveAuthSession(session);
  return session;
}

export function currentDemoSession(): DemoAuthSession | null {
  return readAuthSession();
}

export async function startWorkflow(
  command: string,
  options: { scenarioKey?: string; requestedBy?: string } = {},
): Promise<WorkflowRun> {
  const response = await fetchApi(`${API_BASE_URL}/api/workflows/runs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      command,
      scenarioKey: options.scenarioKey,
      requestedBy: options.requestedBy ?? "manager@demo-company.com",
    }),
  });

  if (!response.ok) {
    throw new Error(`워크플로 API 실패: ${response.status}`);
  }

  return normalizeWorkflowRun(await response.json());
}

export async function sendAssistantMessage(sessionId: string | null, message: string): Promise<AssistantChatResponse> {
  const response = await fetchApi(`${API_BASE_URL}/api/assistant/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sessionId,
      message,
    }),
  }, 5000);

  if (!response.ok) {
    throw new Error(`AI Assistant API 실패: ${response.status}`);
  }

  return response.json();
}

export async function executeAssistantPlan(planId: string, approved = true): Promise<WorkflowRun> {
  const response = await fetchApi(`${API_BASE_URL}/api/assistant/plans/${planId}/execute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ approved }),
  }, 5000);

  if (!response.ok) {
    throw new Error(`AI Assistant 실행 API 실패: ${response.status}`);
  }

  return normalizeWorkflowRun(await response.json());
}

export async function listWorkflowRuns(): Promise<WorkflowRun[]> {
  const response = await fetchApi(`${API_BASE_URL}/api/workflows/runs`);
  if (!response.ok) {
    throw new Error(`워크플로 이력 API 실패: ${response.status}`);
  }
  const runs = await response.json();
  return Array.isArray(runs) ? runs.map(normalizeWorkflowRun) : [];
}

export async function listApprovals(): Promise<ApprovalItem[]> {
  const response = await fetchApi(`${API_BASE_URL}/api/approvals`);
  if (!response.ok) {
    throw new Error(`승인 API 실패: ${response.status}`);
  }
  const approvals = await response.json();
  return Array.isArray(approvals) ? approvals : [];
}

export async function approveApproval(approvalId: string): Promise<WorkflowRun> {
  const response = await fetchApi(`${API_BASE_URL}/api/approvals/${approvalId}/approve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ decidedBy: "manager@demo-company.com" }),
  }, 15000);
  if (!response.ok) {
    throw new Error(`승인 API 실패: ${response.status}`);
  }
  return normalizeWorkflowRun(await response.json());
}

export async function rejectApproval(approvalId: string): Promise<WorkflowRun> {
  const response = await fetchApi(`${API_BASE_URL}/api/approvals/${approvalId}/reject`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ decidedBy: "manager@demo-company.com" }),
  }, 15000);
  if (!response.ok) {
    throw new Error(`승인 API 실패: ${response.status}`);
  }
  return normalizeWorkflowRun(await response.json());
}

export async function listDemoScenarios(): Promise<DemoScenario[]> {
  const response = await fetchApi(`${API_BASE_URL}/api/demo-scenarios`);
  if (!response.ok) {
    throw new Error(`데모 시나리오 API 실패: ${response.status}`);
  }
  return response.json();
}

export async function listTools(): Promise<ToolAdapter[]> {
  const response = await fetchApi(`${API_BASE_URL}/api/tools`);
  if (!response.ok) {
    throw new Error(`도구 API 실패: ${response.status}`);
  }
  return response.json();
}

export function demoTools(): ToolAdapter[] {
  return ["sales-data", "report-generator", "slack", "email", "crm", "inventory", "kakao"].map((name) => ({
    name,
    providerMode: "MOCK",
    status: "READY",
  }));
}

export function demoScenarioFallback(): DemoScenario[] {
  return [
    {
      key: "monthly-sales-report",
      title: "월간 매출 보고서 자동화",
      command: "이번 달 매출 보고서 만들어서 슬랙 채널과 이메일로 보내줘",
      businessValue: "월말 보고서 작성과 공유 시간을 줄이고, 경영진 보고 흐름을 표준화합니다.",
    },
    {
      key: "customer-onboarding",
      title: "신규 고객 온보딩 자동화",
      command: "신규 고객 등록 후 환영 이메일 보내고, 고객 관리 시스템에 기록하고, 담당자에게 알림",
      businessValue: "영업 전환 이후 고객 등록, 환영 메일, 담당자 알림 누락을 방지합니다.",
    },
    {
      key: "low-inventory",
      title: "재고 부족 구매팀 알림",
      command: "재고 부족 제품 리스트 뽑아서 구매팀 카카오톡으로 보내",
      businessValue: "재고 부족 상황을 구매팀에 빠르게 전달하되, 구매 영향이 있는 작업은 승인으로 통제합니다.",
    },
    {
      key: "weekly-sales-report",
      title: "주간 영업 리포트 생성",
      command: "주간 영업 실적 분석해서 PDF 리포트 생성 후 공유",
      businessValue: "반복되는 주간 영업 회고와 실적 공유를 자동화합니다.",
    },
  ];
}

export function demoWorkflowRuns(): WorkflowRun[] {
  return [
    {
      ...demoWorkflowRun("이번 달 매출 보고서 만들어서 슬랙 채널과 이메일로 보내줘"),
      id: "demo-monthly-sales",
    },
    {
      ...demoWorkflowRun("신규 고객 등록 후 환영 이메일 보내고, 고객 관리 시스템에 기록하고, 담당자에게 알림"),
      id: "demo-customer-onboarding",
      title: "신규 고객 온보딩 자동화",
      toolCalls: [
        { toolName: "crm", purpose: "신규 고객을 고객 관리 시스템에 등록합니다.", status: "COMPLETED" },
        { toolName: "email", purpose: "환영 이메일을 발송합니다.", status: "COMPLETED" },
        { toolName: "slack", purpose: "담당자에게 알립니다.", status: "COMPLETED" },
      ],
      artifacts: [
        {
          id: "report-demo-customer",
          title: "신규 고객 온보딩 자동화",
          format: "MARKDOWN",
          summary: "신규 고객 CRM 등록, 환영 이메일, 담당자 알림 결과가 정리되었습니다.",
          content:
            "# 신규 고객 온보딩 처리 결과\n\n## 고객 정보\n\n| 항목 | 값 |\n| --- | --- |\n| 고객사 | Blue Harbor Retail |\n| 세그먼트 | Growth Retail |\n| 담당자 | account-owner@demo-company.com |\n| 상태 | CRM 등록 완료 |\n\n## 처리 결과\n\n- CRM 등록: 고객 프로필과 영업 담당자 매핑을 생성했습니다.\n- 환영 이메일: 제품 소개, 초기 미팅 링크, 담당자 연락처를 포함한 메일을 발송했습니다.\n- 담당자 알림: Slack 담당자 채널에 신규 고객 온보딩 완료 알림을 게시했습니다.\n\n## 다음 액션\n\n1. 3영업일 안에 첫 사용 교육 일정을 확정합니다.\n2. CRM에 초기 관심 상품과 예상 매출 규모를 보강합니다.\n3. 14일 후 온보딩 만족도 확인 알림을 예약합니다.",
          createdAt: new Date().toISOString(),
        },
      ],
    },
    {
      ...demoWorkflowRun("재고 부족 제품 리스트 뽑아서 구매팀 카카오톡으로 보내"),
      id: "demo-low-inventory",
    },
    {
      ...demoWorkflowRun("주간 영업 실적 분석해서 PDF 리포트 생성 후 공유"),
      id: "demo-weekly-sales",
      title: "주간 영업 리포트 생성",
      toolCalls: [
        { toolName: "sales-data", purpose: "주간 영업 활동 샘플 데이터를 읽습니다.", status: "COMPLETED" },
        { toolName: "report-generator", purpose: "주간 영업 실적 PDF 산출물을 생성합니다.", status: "COMPLETED" },
        { toolName: "email", purpose: "영업 리더에게 리포트를 공유합니다.", status: "COMPLETED" },
      ],
      artifacts: [
        {
          id: "report-demo-weekly",
          title: "주간 영업 리포트 생성",
          format: "PDF",
          summary: "주간 영업 실적, 리드 전환율, Top Account, 다음 액션이 포함된 리포트가 생성되었습니다.",
          content:
            "# 주간 영업 실적 리포트\n\n## Executive Summary\n\n이번 주 영업팀은 신규 리드 64건 중 18건을 미팅으로 전환했고, 리드 전환율은 28.1%입니다. Top Account 3곳의 예상 파이프라인은 94,000,000원입니다.\n\n## 핵심 지표\n\n| 지표 | 값 | 전주 대비 |\n| --- | ---: | ---: |\n| 신규 리드 | 64건 | +12.3% |\n| 미팅 전환 | 18건 | +5.9% |\n| 리드 전환율 | 28.1% | +1.7%p |\n| 예상 파이프라인 | 94,000,000원 | +8.4% |\n\n## Top Account\n\n| 고객 | 단계 | 예상 금액 | 다음 액션 |\n| --- | --- | ---: | --- |\n| Blue Harbor Retail | 제안 검토 | 42,000,000원 | ROI 자료 발송 |\n| Northwind Partners | 가격 협의 | 31,000,000원 | 계약 조건 조율 |\n| Urban Supply Co. | 기술 검토 | 21,000,000원 | 보안 체크리스트 회신 |\n\n## Email 공유 미리보기\n\n- 제목: [IWAP] 주간 영업 실적 리포트\n- 수신자: director@demo-company.com\n- 첨부 형식: PDF\n- 상태: 성공",
          createdAt: new Date().toISOString(),
        },
      ],
    },
  ];
}

export function demoApprovals(): ApprovalItem[] {
  return [
    {
      id: "approval-demo-low-inventory",
      runId: "demo-low-inventory",
      requestedByAgent: "PLANNER",
      reason: "구매팀 알림은 실제 구매 활동으로 이어질 수 있어 담당자 승인이 필요합니다.",
      status: "PENDING",
      requestedAt: new Date().toISOString(),
    },
  ];
}

export type DataSourceResult = {
  type: string;
  label: string;
  rowCount: number;
  headers: string[];
  rows: string[][];
};

export async function listDataSources(): Promise<DataSourceResult[]> {
  const response = await fetchApi(`${API_BASE_URL}/api/data-sources`);
  if (!response.ok) {
    throw new Error(`데이터 소스 API 실패: ${response.status}`);
  }
  return response.json();
}

export async function getDataSource(type: string): Promise<DataSourceResult> {
  const response = await fetchApi(`${API_BASE_URL}/api/data-sources/${type}`);
  if (!response.ok) {
    throw new Error(`데이터 소스 API 실패: ${response.status}`);
  }
  return response.json();
}

export function demoWorkflowRun(command: string): WorkflowRun {
  const approvalRequired = command.includes("\uC7AC\uACE0") || command.toLowerCase().includes("inventory");

  return {
    id: `demo-${Date.now()}`,
    title: approvalRequired ? "재고 부족 구매팀 알림" : "월간 매출 보고서 자동화",
    command,
    requestedBy: "manager@demo-company.com",
    status: approvalRequired ? "WAITING_FOR_APPROVAL" : "COMPLETED",
    events: [
      {
        agentType: "PLANNER",
        eventType: approvalRequired ? "APPROVAL_REQUESTED" : "PLAN_CREATED",
        message: approvalRequired
          ? "구매팀 알림 발송 전 담당자 승인이 필요합니다."
          : "월간 매출 보고서 자동화를 위한 실행 계획을 만들었습니다.",
        occurredAt: new Date().toISOString(),
      },
      {
        agentType: "EXECUTOR",
        eventType: "TOOL_CALL_COMPLETED",
        message: approvalRequired ? "관리자 승인을 기다리는 중입니다." : "도구 호출 4건을 실행했습니다.",
        occurredAt: new Date().toISOString(),
      },
    ],
    toolCalls: approvalRequired
      ? [
          { toolName: "inventory", purpose: "재고 부족 품목을 조회합니다.", status: "COMPLETED" },
          { toolName: "kakaowork", purpose: "승인 후 구매팀 알림을 보냅니다.", status: "PENDING" },
        ]
      : [
          { toolName: "sales-data", purpose: "월간 매출 샘플 데이터를 읽습니다.", status: "COMPLETED" },
          { toolName: "report-generator", purpose: "월간 매출 보고서 산출물을 생성합니다.", status: "COMPLETED" },
          { toolName: "slack", purpose: "영업 리포트 채널에 요약을 보냅니다.", status: "COMPLETED" },
          { toolName: "email", purpose: "경영진 수신자에게 보고서를 이메일로 보냅니다.", status: "COMPLETED" },
        ],
    approvals: approvalRequired
      ? [
          {
            id: "approval-demo",
            reason: "구매팀 알림은 실제 구매 활동으로 이어질 수 있어 담당자 승인이 필요합니다.",
            status: "PENDING",
          },
        ]
      : [],
    artifacts: approvalRequired
      ? [
          {
            id: "report-demo-inventory",
            title: "재고 부족 구매팀 알림",
            format: "MARKDOWN",
            summary: "재고 부족 구매 알림 초안이 생성되었고 구매팀 발송 전 승인 대기 상태입니다.",
            content:
              "# 재고 부족 구매 알림 초안\n\n## 승인 상태\n\n- 현재 상태: 승인 대기\n- 승인 필요 사유: 구매팀 알림은 실제 발주 활동으로 이어질 수 있습니다.\n- 발송 예정 채널: 구매팀 카카오워크/운영 알림방\n\n## 재고 부족 품목\n\n| SKU | 품목 | 현재 재고 | 재주문 기준 | 권장 발주 |\n| --- | --- | ---: | ---: | ---: |\n| SKU-RED-001 | 레드 패키지 박스 | 12 | 50 | 120 |\n| SKU-GRN-014 | 그린 라벨 세트 | 8 | 40 | 90 |\n| SKU-BLK-021 | 블랙 완충재 | 17 | 60 | 100 |\n\n## 구매팀 전송 문안\n\n- 메시지: 재고 부족 SKU 3건이 확인되었습니다. 우선 발주 검토가 필요합니다.\n- 상태: 사람 승인 전송 대기",
            createdAt: new Date().toISOString(),
          },
        ]
      : [
          {
            id: "report-demo",
            title: "월간 매출 보고서 자동화",
            format: "MARKDOWN",
            summary: "2026년 5월 총매출 143,300,000원, 전월 대비 9.3% 증가 리포트가 생성되고 Slack/Email 공유까지 완료되었습니다.",
            content:
              "# 2026년 5월 월간 매출 보고서\n\n## Executive Summary\n\n2026년 5월 총매출은 143,300,000원으로 전월 131,000,000원 대비 9.3% 증가했습니다. B2B Direct 채널이 전체 매출의 58.8%를 차지했고, Online Store는 주문 수 기준으로 가장 활발했습니다.\n\n## 핵심 지표\n\n| 지표 | 2026년 5월 | 2026년 4월 | 변화 |\n| --- | ---: | ---: | ---: |\n| 총매출 | 143,300,000원 | 131,000,000원 | +9.3% |\n| 총주문 | 189건 | 177건 | +6.8% |\n| 가중 평균 매출총이익률 | 34.2% | 33.3% | +0.9%p |\n\n## Slack 전송 요약\n\n- 채널: #sales-report\n- 메시지: 5월 총매출 143.3M원, 전월 대비 +9.3%. B2B Direct가 58.8% 기여.\n- 상태: 성공\n\n## Email 전송 미리보기\n\n- 제목: [IWAP] 2026년 5월 월간 매출 보고서\n- 수신자: manager@demo-company.com, finance-lead@demo-company.com\n- 상태: 성공\n\n## 추천 액션\n\n1. B2B Direct 고마진 고객군을 별도 세그먼트로 관리합니다.\n2. Online Store는 재구매 알림과 장바구니 리마인더 자동화를 붙입니다.\n3. Partner Reseller는 성장률이 높아 주간 리포트에서 추가 모니터링합니다.",
            createdAt: new Date().toISOString(),
          },
        ],
    auditTrail: [
      {
        actor: "PLANNER",
        action: approvalRequired ? "APPROVAL_REQUESTED" : "PLAN_CREATED",
        summary: "프론트엔드 데모 대체 이벤트가 생성되었습니다.",
      },
    ],
  };
}

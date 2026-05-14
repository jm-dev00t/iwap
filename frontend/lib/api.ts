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
  });
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
  });
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
    },
    {
      ...demoWorkflowRun("재고 부족 제품 리스트 뽑아서 구매팀 카카오톡으로 보내"),
      id: "demo-low-inventory",
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
      ? []
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
      ? []
      : [
          {
            id: "report-demo",
            title: "월간 매출 보고서 자동화",
            format: "MARKDOWN",
            summary: "에이전트 워크플로가 도구 호출 4건과 함께 완료되었습니다.",
            content:
              "# 실행 요약\n\n- 계획 에이전트가 워크플로 실행 계획을 만들었습니다.\n- 실행 에이전트가 매출 데이터, 보고서 생성기, 슬랙, 이메일 도구 호출을 완료했습니다.\n- 검증 에이전트가 수신자와 보고서 산출물을 확인했습니다.",
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

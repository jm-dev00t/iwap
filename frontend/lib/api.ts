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

const API_BASE_URL = process.env.NEXT_PUBLIC_IWAP_API_BASE_URL ?? "http://localhost:8080";

function normalizeWorkflowRun(run: Partial<WorkflowRun>): WorkflowRun {
  return {
    id: run.id ?? `run-${Date.now()}`,
    title: run.title ?? "Untitled Workflow",
    command: run.command ?? "",
    requestedBy: run.requestedBy ?? "unknown",
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

export async function startWorkflow(command: string): Promise<WorkflowRun> {
  const response = await fetchWithTimeout(`${API_BASE_URL}/api/workflows/runs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      command,
      scenarioKey: "demo",
      requestedBy: "manager@demo-company.com",
    }),
  });

  if (!response.ok) {
    throw new Error(`Workflow API failed with ${response.status}`);
  }

  return normalizeWorkflowRun(await response.json());
}

export async function listWorkflowRuns(): Promise<WorkflowRun[]> {
  const response = await fetchWithTimeout(`${API_BASE_URL}/api/workflows/runs`);
  if (!response.ok) {
    throw new Error(`Workflow history API failed with ${response.status}`);
  }
  const runs = await response.json();
  return Array.isArray(runs) ? runs.map(normalizeWorkflowRun) : [];
}

export async function listApprovals(): Promise<ApprovalItem[]> {
  const response = await fetchWithTimeout(`${API_BASE_URL}/api/approvals`);
  if (!response.ok) {
    throw new Error(`Approval API failed with ${response.status}`);
  }
  const approvals = await response.json();
  return Array.isArray(approvals) ? approvals : [];
}

export async function approveApproval(approvalId: string): Promise<WorkflowRun> {
  const response = await fetchWithTimeout(`${API_BASE_URL}/api/approvals/${approvalId}/approve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ decidedBy: "manager@demo-company.com" }),
  });
  if (!response.ok) {
    throw new Error(`Approval API failed with ${response.status}`);
  }
  return normalizeWorkflowRun(await response.json());
}

export async function rejectApproval(approvalId: string): Promise<WorkflowRun> {
  const response = await fetchWithTimeout(`${API_BASE_URL}/api/approvals/${approvalId}/reject`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ decidedBy: "manager@demo-company.com" }),
  });
  if (!response.ok) {
    throw new Error(`Approval API failed with ${response.status}`);
  }
  return response.json();
}

export async function listDemoScenarios(): Promise<DemoScenario[]> {
  const response = await fetchWithTimeout(`${API_BASE_URL}/api/demo-scenarios`);
  if (!response.ok) {
    throw new Error(`Demo scenario API failed with ${response.status}`);
  }
  return response.json();
}

export async function listTools(): Promise<ToolAdapter[]> {
  const response = await fetchWithTimeout(`${API_BASE_URL}/api/tools`);
  if (!response.ok) {
    throw new Error(`Tool API failed with ${response.status}`);
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
      title: "Monthly Sales Report Automation",
      command: "이번 달 매출 보고서 만들어서 슬랙 채널과 이메일로 보내줘",
      businessValue: "월말 보고서 작성과 공유 시간을 줄이고, 경영진 보고 흐름을 표준화합니다.",
    },
    {
      key: "customer-onboarding",
      title: "New Customer Onboarding",
      command: "신규 고객 등록 후 환영 이메일 보내고, CRM에 기록하고, 담당자에게 알림",
      businessValue: "영업 전환 이후 고객 등록, 환영 메일, 담당자 알림 누락을 방지합니다.",
    },
    {
      key: "low-inventory",
      title: "Low Inventory Purchasing Alert",
      command: "재고 부족 제품 리스트 뽑아서 구매팀 카카오톡으로 보내",
      businessValue: "재고 부족 상황을 구매팀에 빠르게 전달하되, 구매 영향이 있는 작업은 승인으로 통제합니다.",
    },
    {
      key: "weekly-sales-report",
      title: "Weekly Sales Performance Report",
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
      ...demoWorkflowRun("신규 고객 등록 후 환영 이메일 보내고, CRM에 기록하고, 담당자에게 알림"),
      id: "demo-customer-onboarding",
      title: "New Customer Onboarding",
      toolCalls: [
        { toolName: "crm", purpose: "Register new customer.", status: "COMPLETED" },
        { toolName: "email", purpose: "Send welcome email.", status: "COMPLETED" },
        { toolName: "slack", purpose: "Notify account owner.", status: "COMPLETED" },
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
      reason: "Human approval is required because this purchase team notification can trigger buying activity.",
      status: "PENDING",
      requestedAt: new Date().toISOString(),
    },
  ];
}

export function demoWorkflowRun(command: string): WorkflowRun {
  const approvalRequired = command.includes("\uC7AC\uACE0") || command.toLowerCase().includes("inventory");

  return {
    id: `demo-${Date.now()}`,
    title: approvalRequired ? "Low Inventory Purchasing Alert" : "Monthly Sales Report Automation",
    command,
    requestedBy: "manager@demo-company.com",
    status: approvalRequired ? "WAITING_FOR_APPROVAL" : "COMPLETED",
    events: [
      {
        agentType: "PLANNER",
        eventType: approvalRequired ? "APPROVAL_REQUESTED" : "PLAN_CREATED",
        message: approvalRequired
          ? "Approval is required before sending a purchase team notification."
          : "Created a structured plan for Monthly Sales Report Automation.",
        occurredAt: new Date().toISOString(),
      },
      {
        agentType: "EXECUTOR",
        eventType: "TOOL_CALL_COMPLETED",
        message: approvalRequired ? "Waiting for manager approval." : "Executed 4 tool calls.",
        occurredAt: new Date().toISOString(),
      },
    ],
    toolCalls: approvalRequired
      ? []
      : [
          { toolName: "sales-data", purpose: "Read monthly revenue sample data.", status: "COMPLETED" },
          { toolName: "report-generator", purpose: "Create monthly sales report artifact.", status: "COMPLETED" },
          { toolName: "slack", purpose: "Send report summary to #sales-report.", status: "COMPLETED" },
          { toolName: "email", purpose: "Email the report to management recipients.", status: "COMPLETED" },
        ],
    approvals: approvalRequired
      ? [
          {
            id: "approval-demo",
            reason: "Human approval is required because this purchase team notification can trigger buying activity.",
            status: "PENDING",
          },
        ]
      : [],
    artifacts: approvalRequired
      ? []
      : [
          {
            id: "report-demo",
            title: "Monthly Sales Report Automation",
            format: "MARKDOWN",
            summary: "Agent workflow completed with 4 tool calls.",
            content:
              "# Executive Summary\n\n- Planner Agent created the workflow plan.\n- Executor Agent completed sales-data, report-generator, Slack, and Email tool calls.\n- Validator Agent checked recipients and report artifacts.",
            createdAt: new Date().toISOString(),
          },
        ],
    auditTrail: [
      {
        actor: "PLANNER",
        action: approvalRequired ? "APPROVAL_REQUESTED" : "PLAN_CREATED",
        summary: "Demo fallback event generated by the frontend.",
      },
    ],
  };
}

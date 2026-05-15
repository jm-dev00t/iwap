"use client";

import { type ReactNode, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChevronLeft, ChevronRight, Database, Download, FileText, Mail, MessageSquare } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeading } from "@/components/page-heading";
import { demoWorkflowRuns, listWorkflowRuns, type WorkflowRun } from "@/lib/api";
import { toolLabel, workflowTitleLabel } from "@/lib/display-labels";

type Report = WorkflowRun["artifacts"][number] & {
  runId: string;
  runTitle: string;
  requestedBy: string;
  runStatus: string;
  command: string;
  toolCalls: WorkflowRun["toolCalls"];
};

const REPORTS_PER_PAGE = 5;

function collectReports(runs: WorkflowRun[]): Report[] {
  return runs.flatMap((run) =>
    run.artifacts.map((artifact) => ({
      ...artifact,
      runId: run.id,
      runTitle: run.title,
      requestedBy: run.requestedBy,
      runStatus: run.status,
      command: run.command,
      toolCalls: run.toolCalls,
    })),
  );
}

const monthlySalesData = [
  { channel: "B2B Direct", current: 84.2, previous: 76.5, target: 78, orders: 42, margin: 38, share: 58.8, achievement: 107.9 },
  { channel: "Online Store", current: 31.5, previous: 29.4, target: 30, orders: 128, margin: 31, share: 22.0, achievement: 105.0 },
  { channel: "Partner", current: 27.6, previous: 25.1, target: 26, orders: 19, margin: 27, share: 19.2, achievement: 106.2 },
];

const reportChartColors = ["var(--primary)", "var(--accent-teal)", "var(--accent-amber)"];
const reportGridColor = "var(--hairline)";
const reportMutedColor = "var(--muted)";

const kpis = [
  { label: "총매출", value: "143.3M원", delta: "+9.3%" },
  { label: "총주문", value: "189건", delta: "+6.8%" },
  { label: "평균 마진", value: "34.2%", delta: "+0.9%p" },
];

const reportSourceData = {
  monthly: {
    title: "월간 매출 집계 원천 자료",
    description: "매출 데이터 커넥터가 채널별 매출, 주문 수, 목표금액, 마진율을 수집한 뒤 보고서 생성기가 요약과 차트를 만들었습니다.",
    sources: ["sales-data", "order ledger", "monthly target sheet"],
    tables: [
      {
        title: "채널별 매출 실적",
        columns: ["채널", "5월 매출", "4월 매출", "목표", "주문", "마진율"],
        rows: [
          ...monthlySalesData.map((row) => [
            row.channel,
            `${row.current.toFixed(1)}M원`,
            `${row.previous.toFixed(1)}M원`,
            `${row.target.toFixed(1)}M원`,
            `${row.orders}건`,
            `${row.margin}%`,
          ]),
          ["Reseller", "11.2M원", "9.8M원", "10.5M원", "31건", "22%"],
          ["Agency", "8.7M원", "7.6M원", "8.0M원", "14건", "19%"],
          ["Enterprise Direct", "62.1M원", "58.3M원", "60.0M원", "7건", "44%"],
          ["Marketplace", "5.3M원", "4.9M원", "5.0M원", "89건", "12%"],
        ],
      },
      {
        title: "보고서 생성 규칙",
        columns: ["검증 항목", "값", "처리"],
        rows: [
          ["전월 대비", "+9.3%", "증감 사유 요약"],
          ["목표 달성률", "106.9%", "초과 달성 채널 강조"],
          ["최고 기여 채널", "B2B Direct", "추천 액션 생성"],
          ["최저 마진 채널", "Marketplace", "수익성 경고 추가"],
          ["신규 채널", "Enterprise Direct", "성장 기회 표시"],
          ["이상 거래 감지", "없음", "정상 처리"],
        ],
      },
    ],
  },
  weekly: {
    title: "주간 영업실적 수집 자료",
    description: "CRM 활동 로그와 영업 파이프라인을 합쳐 리드 전환율, Top Account, 다음 액션을 계산했습니다.",
    sources: ["crm activity", "pipeline board", "meeting notes"],
    tables: [
      {
        title: "영업 활동 요약",
        columns: ["지표", "이번 주", "전주", "변화"],
        rows: [
          ["신규 리드", "64건", "57건", "+12.3%"],
          ["미팅 전환", "18건", "17건", "+5.9%"],
          ["리드 전환율", "28.1%", "26.4%", "+1.7%p"],
          ["예상 파이프라인", "94,000,000원", "86,700,000원", "+8.4%"],
          ["제안서 발송", "11건", "9건", "+22.2%"],
          ["계약 성사", "3건", "4건", "-25.0%"],
          ["평균 딜 사이즈", "31,333,333원", "21,675,000원", "+44.6%"],
        ],
      },
      {
        title: "Top Account 영업실적",
        columns: ["고객", "단계", "예상 금액", "다음 액션"],
        rows: [
          ["Blue Harbor Retail", "제안 검토", "42,000,000원", "ROI 자료 발송"],
          ["Northwind Partners", "가격 협의", "31,000,000원", "계약 조건 조율"],
          ["Urban Supply Co.", "기술 검토", "21,000,000원", "보안 체크리스트 회신"],
          ["Summit Logistics", "초도 미팅", "18,500,000원", "요구사항 분석 예약"],
          ["Crestline Group", "PoC 진행", "15,000,000원", "PoC 결과 보고"],
          ["Maple Retail", "계약 검토", "12,800,000원", "법무 검토 요청"],
        ],
      },
    ],
  },
  customer: {
    title: "신규 고객 온보딩 수집 자료",
    description: "영업 전환 기록과 고객 담당자 정보를 기반으로 CRM 등록, 환영 메일, 담당자 알림 작업을 만들었습니다.",
    sources: ["crm lead record", "account owner map", "welcome template"],
    tables: [
      {
        title: "고객 등록 정보",
        columns: ["항목", "값", "처리"],
        rows: [
          ["고객사", "Blue Harbor Retail", "CRM 계정 생성"],
          ["세그먼트", "Growth Retail", "온보딩 템플릿 선택"],
          ["담당자", "account-owner@demo-company.com", "내부 알림 지정"],
          ["계약 유형", "연간 구독", "청구 주기 설정"],
          ["온보딩 단계", "1단계: 환경 설정", "체크리스트 발송"],
          ["SLA 등급", "Standard", "에스컬레이션 규칙 적용"],
          ["연락처 확인", "완료", "CRM 검증 처리"],
        ],
      },
    ],
  },
  inventory: {
    title: "재고 부족 판단 자료",
    description: "재고 현황과 재주문 기준을 비교해 승인 대기 구매 알림 초안을 만들었습니다.",
    sources: ["inventory snapshot", "reorder policy", "purchase approval rule"],
    tables: [
      {
        title: "재고 부족 품목",
        columns: ["SKU", "품목", "현재 재고", "재주문 기준", "권장 발주"],
        rows: [
          ["SKU-RED-001", "레드 패키지 박스", "12", "50", "120"],
          ["SKU-GRN-014", "그린 라벨 세트", "8", "40", "90"],
          ["SKU-BLK-021", "블랙 완충재", "17", "60", "100"],
          ["SKU-WHT-033", "흰색 포장 테이프", "22", "80", "150"],
          ["SKU-BLU-007", "블루 쇼핑백 (대)", "6", "30", "80"],
          ["SKU-YLW-019", "노란 라벨 스티커", "31", "100", "200"],
          ["SKU-SLV-044", "실버 리본 세트", "4", "25", "60"],
        ],
      },
    ],
  },
};

function isMonthlySalesReport(report: Report) {
  return report.title.includes("Monthly Sales") || report.title.includes("월간 매출");
}

function reportScenario(report: Report) {
  if (isMonthlySalesReport(report)) {
    return "monthly";
  }
  if (report.title.includes("Customer") || report.title.includes("고객")) {
    return "customer";
  }
  if (report.title.includes("Inventory") || report.title.includes("재고")) {
    return "inventory";
  }
  if (report.title.includes("Weekly") || report.title.includes("주간")) {
    return "weekly";
  }
  return "default";
}

const reportScenarioOrder: Record<ReturnType<typeof reportScenario>, number> = {
  monthly: 0,
  weekly: 1,
  customer: 2,
  inventory: 3,
  default: 4,
};

function reportCreatedTime(report: Report) {
  const time = new Date(report.createdAt).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function compactReportsByScenario(reports: Report[]) {
  const latestByScenario = new Map<string, Report>();

  reports.forEach((report) => {
    const scenario = reportScenario(report);
    const key = scenario === "default" ? `default-${workflowTitleLabel(report.title)}` : scenario;
    const current = latestByScenario.get(key);

    if (!current || reportCreatedTime(report) > reportCreatedTime(current)) {
      latestByScenario.set(key, report);
    }
  });

  return Array.from(latestByScenario.values()).sort((left, right) => {
    const leftScenario = reportScenario(left);
    const rightScenario = reportScenario(right);
    const orderDiff = reportScenarioOrder[leftScenario] - reportScenarioOrder[rightScenario];
    return orderDiff === 0 ? reportCreatedTime(right) - reportCreatedTime(left) : orderDiff;
  });
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "생성 시간 확인 중";
  }
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function MarkdownPreview({ content }: { content: string }) {
  const lines = content.split(/\r?\n/);
  const rendered: ReactNode[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const key = `${index}-${line}`;

    if (line.includes("|") && lines[index + 1]?.includes("---")) {
      const header = line
        .split("|")
        .map((cell) => cell.trim())
        .filter(Boolean);
      const rows: string[][] = [];
      index += 2;
      while (index < lines.length && lines[index].includes("|")) {
        rows.push(
          lines[index]
            .split("|")
            .map((cell) => cell.trim())
            .filter(Boolean),
        );
        index += 1;
      }
      index -= 1;
      rendered.push(
        <div className="overflow-x-auto rounded-lg border border-hairline" key={key}>
          <table className="min-w-full divide-y divide-hairline text-sm">
            <thead className="bg-canvas">
              <tr>
                {header.map((cell) => (
                  <th className="px-3 py-2 text-left font-semibold text-ink" key={cell}>
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {rows.map((row, rowIndex) => (
                <tr key={`${key}-${rowIndex}`}>
                  {row.map((cell, cellIndex) => (
                    <td className="px-3 py-2 text-body" key={`${cell}-${cellIndex}`}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    if (!line.trim()) {
      rendered.push(<div className="h-1" key={key} />);
      continue;
    }
    if (line.startsWith("# ")) {
      rendered.push(
        <h3 className="font-display text-2xl text-ink" key={key}>
          {line.replace(/^#\s+/, "").replace("Executive Summary", "실행 요약")}
        </h3>,
      );
      continue;
    }
    if (line.startsWith("## ")) {
      rendered.push(
        <h4 className="text-base font-semibold text-ink" key={key}>
          {line.replace(/^##\s+/, "")}
        </h4>,
      );
      continue;
    }
    if (/^\d+\.\s/.test(line)) {
      rendered.push(
        <div className="flex gap-2" key={key}>
          <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-white">
            {line.match(/^(\d+)\./)?.[1]}
          </span>
          <p>{line.replace(/^\d+\.\s/, "")}</p>
        </div>,
      );
      continue;
    }
    if (line.startsWith("- ")) {
      rendered.push(
        <div className="flex gap-2" key={key}>
          <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-teal" />
          <p>{line.replace(/^-\s+/, "")}</p>
        </div>,
      );
      continue;
    }
    rendered.push(<p key={key}>{line}</p>);
  }

  return (
    <div className="space-y-3 text-sm leading-7 text-body">
      {rendered}
    </div>
  );
}

const TABLE_PAGE_SIZE = 5;

function PaginatedTable({ table }: { table: { title: string; columns: string[]; rows: string[][] } }) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(table.rows.length / TABLE_PAGE_SIZE));
  const pageRows = table.rows.slice((page - 1) * TABLE_PAGE_SIZE, page * TABLE_PAGE_SIZE);
  const start = (page - 1) * TABLE_PAGE_SIZE + 1;
  const end = Math.min(page * TABLE_PAGE_SIZE, table.rows.length);

  return (
    <div className="overflow-x-auto rounded-lg border border-hairline bg-surface-plain">
      <div className="border-b border-hairline px-4 py-3">
        <p className="text-sm font-semibold text-ink">{table.title}</p>
      </div>
      <table className="min-w-full text-sm">
        <thead className="bg-canvas text-muted">
          <tr>
            {table.columns.map((column) => (
              <th className="px-3 py-2 text-left font-semibold" key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-hairline">
          {pageRows.map((row, rowIndex) => (
            <tr key={`${table.title}-${rowIndex}`}>
              {row.map((cell, cellIndex) => (
                <td className={`px-3 py-2 ${cellIndex === 0 ? "font-medium text-ink" : "text-body"}`} key={`${cell}-${cellIndex}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center justify-between border-t border-hairline px-4 py-2 text-sm text-muted">
        <span>전체 {table.rows.length}건 중 {start}–{end} 표시</span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1 rounded-md px-2 py-1 hover:bg-surface-card disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
            이전
          </button>
          <span className="font-medium text-ink">{page} / {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-1 rounded-md px-2 py-1 hover:bg-surface-card disabled:opacity-30 disabled:cursor-not-allowed"
          >
            다음
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ReportSourceDataPanel({ scenario }: { scenario: ReturnType<typeof reportScenario> }) {
  if (scenario === "default") {
    return null;
  }

  const data = reportSourceData[scenario];

  return (
    <section className="rounded-xl border border-hairline bg-surface-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">리포트 생성 자료</p>
          <h3 className="mt-2 text-lg font-semibold text-ink">{data.title}</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-body">{data.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {data.sources.map((source) => (
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-plain px-3 py-1 text-xs font-medium text-muted" key={source}>
              <Database className="h-3.5 w-3.5 text-primary" />
              {source}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-4">
        {data.tables.map((table) => (
          <PaginatedTable key={table.title} table={table} />
        ))}
      </div>
    </section>
  );
}

function MonthlySalesDocument() {
  return (
    <section className="rounded-xl border border-hairline bg-surface-plain p-5 shadow-soft">
      <div className="rounded-md bg-surface-dark px-5 py-4 text-center text-xl font-bold text-canvas">2026년 5월 채널별 매출현황</div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <div>
          <h3 className="text-sm font-semibold text-ink">[ 채널별 매출 구성비(%) ]</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer height="100%" width="100%">
              <PieChart>
                <Pie data={monthlySalesData} dataKey="share" innerRadius={58} outerRadius={105} paddingAngle={1}>
                  {monthlySalesData.map((entry, index) => (
                    <Cell fill={reportChartColors[index % reportChartColors.length]} key={entry.channel} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`${value}%`, "구성비"]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid gap-2 rounded-md bg-surface-dark p-4 text-sm text-canvas">
            <div className="flex justify-between border-b border-canvas/20 pb-2">
              <span>전월 총 매출</span>
              <strong>131,000,000</strong>
            </div>
            <div className="flex justify-between border-b border-canvas/20 pb-2">
              <span>이번달 총 매출</span>
              <strong>143,300,000</strong>
            </div>
            <div className="flex justify-between border-b border-canvas/20 pb-2">
              <span>전월대비 증가액</span>
              <strong>12,300,000</strong>
            </div>
            <div className="flex justify-between border-b border-canvas/20 pb-2">
              <span>목표대비 달성률(%)</span>
              <strong>106.9%</strong>
            </div>
            <div className="flex justify-between">
              <span>최고 매출 채널</span>
              <strong>B2B Direct</strong>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-ink">[ 채널별 목표대비 실적 달성(백만원) ]</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={monthlySalesData} margin={{ left: -8, right: 8, top: 18 }}>
                <CartesianGrid stroke={reportGridColor} strokeDasharray="3 3" />
                <XAxis dataKey="channel" tick={{ fill: reportMutedColor, fontSize: 12 }} />
                <YAxis tick={{ fill: reportMutedColor, fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ background: "var(--surface-plain)", borderRadius: 8, borderColor: "var(--hairline)", color: "var(--ink)" }}
                  formatter={(value: number, name) => [`${value}M원`, name === "target" ? "목표금액" : "매출실적"]}
                />
                <Bar dataKey="target" fill="var(--surface-card)" name="목표금액" radius={[3, 3, 0, 0]} />
                <Bar dataKey="current" fill="var(--primary)" name="매출실적" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-5 overflow-x-auto rounded-md border border-hairline">
            <table className="min-w-full text-sm">
              <thead className="bg-surface-dark text-canvas">
                <tr>
                  <th className="px-3 py-2 text-left">채널</th>
                  <th className="px-3 py-2 text-right">목표금액</th>
                  <th className="px-3 py-2 text-right">매출실적</th>
                  <th className="px-3 py-2 text-right">목표대비 초과액</th>
                  <th className="px-3 py-2 text-right">총매출대비 비중(%)</th>
                  <th className="px-3 py-2 text-right">달성률(%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {monthlySalesData.map((row) => (
                  <tr key={row.channel}>
                    <td className="px-3 py-2 font-medium text-ink">{row.channel}</td>
                    <td className="px-3 py-2 text-right text-body">{(row.target * 1_000_000).toLocaleString("ko-KR")}</td>
                    <td className="px-3 py-2 text-right text-body">{(row.current * 1_000_000).toLocaleString("ko-KR")}</td>
                    <td className="px-3 py-2 text-right text-body">{((row.current - row.target) * 1_000_000).toLocaleString("ko-KR")}</td>
                    <td className="px-3 py-2 text-right text-body">{row.share}%</td>
                    <td className="px-3 py-2 text-right font-semibold text-primary">{row.achievement}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

function DeliveryStatus({ report }: { report: Report }) {
  const scenario = reportScenario(report);
  const deliveryTools = report.toolCalls.filter((tool) => ["slack", "email", "kakaowork", "kakao", "notification"].includes(tool.toolName));

  const deliveryCopy = {
    monthly: {
      slack: "5월 총매출 143.3M원, 전월 대비 +9.3%, B2B Direct 58.8% 기여 요약을 채널에 게시했습니다.",
      email: "[IWAP] 2026년 5월 월간 매출 보고서 제목으로 경영진 요약과 추천 액션을 발송했습니다.",
    },
    customer: {
      slack: "Blue Harbor Retail 신규 고객 온보딩 완료와 담당자 후속 액션 3건을 계정 담당자 채널에 게시했습니다.",
      email: "환영 이메일, 첫 미팅 링크, 담당자 연락처를 고객 수신자에게 발송했습니다.",
    },
    weekly: {
      email: "주간 영업 실적 PDF, Top Account, 다음 액션을 director@demo-company.com으로 발송했습니다.",
      slack: "주간 영업 리포트 공유 완료 알림을 영업 리더 채널에 게시했습니다.",
    },
    inventory: {
      kakaowork: "구매팀 알림 문안은 생성됐지만 실제 발송은 사람 승인 전까지 보류됩니다.",
      notification: "승인 담당자에게 재고 부족 구매 알림 검토 요청을 등록했습니다.",
    },
    default: {
      slack: "워크플로 결과 요약을 팀 채널에 게시했습니다.",
      email: "워크플로 결과 보고서를 이메일로 발송했습니다.",
    },
  } as const;

  return (
    <section className="rounded-xl border border-hairline bg-surface-plain p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">전송 결과</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {(deliveryTools.length > 0 ? deliveryTools : [{ toolName: "kakaowork", purpose: "승인 후 구매팀 알림을 보냅니다.", status: "PENDING" }]).map((tool) => {
          const normalized = tool.toolName.toLowerCase();
          const isMail = normalized === "email";
          const isPending = tool.status !== "COMPLETED" || scenario === "inventory";
          const Icon = isMail ? Mail : MessageSquare;
          const copy =
            deliveryCopy[scenario][normalized as keyof (typeof deliveryCopy)[typeof scenario]] ??
            deliveryCopy.default[normalized as keyof typeof deliveryCopy.default] ??
            tool.purpose;
          return (
            <article className="rounded-lg bg-surface-card p-4" key={tool.toolName}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="grid h-9 w-9 place-items-center rounded-md bg-canvas text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink">{toolLabel(tool.toolName)}</p>
                    <p className="text-xs text-muted">
                      {isMail
                        ? scenario === "weekly"
                          ? "director@demo-company.com"
                          : "manager@demo-company.com"
                        : scenario === "inventory"
                          ? "구매팀 알림방"
                          : "#sales-report"}
                    </p>
                  </div>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isPending ? "bg-amber/10 text-amber" : "bg-success/10 text-success"}`}>
                  {isPending ? "승인 대기" : "성공"}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-body">{copy}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

const SCENARIO_LABELS: Record<string, string> = {
  monthly: "월간 매출 보고서",
  weekly: "주간 실적 보고서",
  customer: "고객 온보딩 보고서",
  inventory: "재고 부족 보고서",
};

function ScenarioReportGroup({
  scenarioKey,
  reports,
  selectedReportId,
  onSelect,
  onPdf,
}: {
  scenarioKey: string;
  reports: Report[];
  selectedReportId: string | null;
  onSelect: (id: string) => void;
  onPdf: (report: Report) => void;
}) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(reports.length / REPORTS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pagedReports = reports.slice((currentPage - 1) * REPORTS_PER_PAGE, currentPage * REPORTS_PER_PAGE);

  if (reports.length === 0) return null;

  return (
    <div className="mt-6 first:mt-0">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
        {SCENARIO_LABELS[scenarioKey] ?? scenarioKey}{" "}
        <span className="text-ink">{reports.length}건</span>
      </p>
      <div className="grid gap-4">
        {pagedReports.map((report) => (
          <article
            className={`relative cursor-pointer rounded-xl border p-5 shadow-soft transition ${
              selectedReportId === report.id
                ? "border-primary bg-surface-plain ring-2 ring-primary/30"
                : "border-hairline bg-surface-card hover:border-primary/60"
            }`}
            key={`${report.runId}-${report.id}`}
            onClick={() => onSelect(report.id)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <span className="rounded-full bg-canvas p-2 text-primary">
                  <FileText className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs text-muted">{formatDate(report.createdAt)}</p>
                  <h2 className="mt-0.5 text-base font-semibold text-ink">{workflowTitleLabel(report.title)}</h2>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {selectedReportId === report.id ? (
                  <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-white">선택됨</span>
                ) : null}
                <button
                  className="grid h-8 w-8 place-items-center rounded-md text-muted hover:bg-surface-plain hover:text-primary"
                  onClick={(e) => { e.stopPropagation(); onPdf(report); }}
                  title="PDF 저장"
                  type="button"
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-body">{report.summary}</p>
            <div className="mt-3 rounded-lg bg-surface-plain p-3">
              <p className="text-xs font-medium text-muted">워크플로</p>
              <p className="mt-1 text-sm text-ink">{workflowTitleLabel(report.runTitle)}</p>
              <p className="mt-1 break-words font-mono text-xs leading-5 text-muted">{report.command}</p>
            </div>
          </article>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between text-sm text-muted">
        <span>
          {reports.length}건 중 {(currentPage - 1) * REPORTS_PER_PAGE + 1}–{Math.min(currentPage * REPORTS_PER_PAGE, reports.length)} 표시
        </span>
        <div className="flex items-center gap-3">
          <button
            className="flex items-center gap-1 rounded-md px-3 py-1.5 hover:bg-surface-card disabled:opacity-30 disabled:cursor-not-allowed"
            disabled={currentPage === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            type="button"
          >
            <ChevronLeft className="h-4 w-4" />
            이전
          </button>
          <span className="font-medium text-ink">{currentPage} / {totalPages}</span>
          <button
            className="flex items-center gap-1 rounded-md px-3 py-1.5 hover:bg-surface-card disabled:opacity-30 disabled:cursor-not-allowed"
            disabled={currentPage === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            type="button"
          >
            다음
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const { data, isError, isLoading } = useQuery({
    queryKey: ["workflow-reports"],
    queryFn: listWorkflowRuns,
  });

  const { reports, isFallback } = useMemo(() => {
    const apiReports = collectReports(data ?? []);
    if (apiReports.length > 0) {
      return { reports: apiReports, isFallback: false };
    }

    return { reports: collectReports(demoWorkflowRuns()), isFallback: true };
  }, [data]);

  const sortedReports = useMemo(() =>
    [...reports].sort((a, b) => {
      const orderDiff = reportScenarioOrder[reportScenario(a)] - reportScenarioOrder[reportScenario(b)];
      return orderDiff === 0 ? reportCreatedTime(b) - reportCreatedTime(a) : orderDiff;
    }),
  [reports]);

  const groupedReports = useMemo(() => ({
    monthly: sortedReports.filter((r) => reportScenario(r) === "monthly"),
    weekly: sortedReports.filter((r) => reportScenario(r) === "weekly"),
    customer: sortedReports.filter((r) => reportScenario(r) === "customer"),
    inventory: sortedReports.filter((r) => reportScenario(r) === "inventory"),
  }), [sortedReports]);

  const scenarioCounts = useMemo(() => ({
    monthly: groupedReports.monthly.length,
    weekly: groupedReports.weekly.length,
    customer: groupedReports.customer.length,
    inventory: groupedReports.inventory.length,
  }), [groupedReports]);

  const selectedReport = sortedReports.find((report) => report.id === selectedReportId) ?? null;

  function openPrintableReport(report: Report) {
    const printable = window.open("", "_blank", "noopener,noreferrer,width=980,height=1200");
    if (!printable) {
      return;
    }

    const escapedContent = report.content
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    printable.document.write(`<!doctype html>
      <html lang="ko">
        <head>
          <meta charset="utf-8" />
          <title>${workflowTitleLabel(report.title)}</title>
          <style>
            @page { size: A4; margin: 18mm; }
            body {
              background: #faf9f5;
              color: #141413;
              font-family: "Malgun Gothic", "Apple SD Gothic Neo", Arial, sans-serif;
              line-height: 1.65;
              margin: 0;
              padding: 28px;
            }
            header {
              border-bottom: 2px solid #181715;
              margin-bottom: 24px;
              padding-bottom: 14px;
            }
            .kicker {
              color: #cc785c;
              font-size: 12px;
              font-weight: 700;
              letter-spacing: .12em;
              text-transform: uppercase;
            }
            h1 { font-size: 30px; margin: 8px 0; }
            .meta { color: #6c6a64; font-size: 13px; }
            pre {
              white-space: pre-wrap;
              word-break: keep-all;
              background: #fffefa;
              border: 1px solid #e6dfd8;
              border-radius: 8px;
              padding: 18px;
              font-family: inherit;
              font-size: 13px;
            }
            .notice { color: #6c6a64; font-size: 12px; margin-top: 18px; }
          </style>
        </head>
        <body>
          <header>
            <div class="kicker">IWAP Generated Report</div>
            <h1>${workflowTitleLabel(report.title)}</h1>
            <div class="meta">${workflowTitleLabel(report.runTitle)} · ${formatDate(report.createdAt)}</div>
          </header>
          <pre>${escapedContent}</pre>
          <p class="notice">브라우저 인쇄 창에서 대상을 PDF로 저장으로 선택하면 PDF 파일로 내려받을 수 있습니다.</p>
          <script>window.addEventListener("load", () => setTimeout(() => window.print(), 200));</script>
        </body>
      </html>`);
    printable.document.close();
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-[1200px] px-5 py-8 md:px-8">
        <PageHeading
          eyebrow="생성 보고서"
          title="에이전트가 만든 업무 리포트를 검토합니다"
          description="워크플로 실행 결과에서 생성된 업무 보고서를 모아 미리보고, PDF로 저장할 수 있습니다."
        />

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-full bg-surface-card px-4 py-2 text-sm text-body">
            <span className={`h-2 w-2 shrink-0 rounded-full ${isLoading ? "bg-amber animate-pulse" : isError ? "bg-red-500" : "bg-green-500"}`} />
            {isLoading
              ? "보고서 산출물 조회 중..."
              : isError
                ? "백엔드 미연결 — 데모 보고서 표시 중"
                : isFallback
                  ? "백엔드 연결됨 — 실행 결과 없음, 데모 표시 중"
                  : "백엔드 연결됨"}
          </div>
          {(["monthly", "weekly", "customer", "inventory"] as const).map((key) => {
            const label = { monthly: "월간 매출", weekly: "주간 실적", customer: "고객 온보딩", inventory: "재고 부족" }[key];
            return (
              <div className="rounded-full bg-surface-card px-4 py-2 text-sm text-body" key={key}>
                {label} <span className="font-semibold text-ink">{scenarioCounts[key]}건</span>
              </div>
            );
          })}
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
          <div>
            {(["monthly", "weekly", "customer", "inventory"] as const).map((key) => (
              <ScenarioReportGroup
                key={key}
                scenarioKey={key}
                reports={groupedReports[key]}
                selectedReportId={selectedReportId}
                onSelect={setSelectedReportId}
                onPdf={openPrintableReport}
              />
            ))}
          </div>

          <aside className="rounded-xl border border-hairline bg-surface-plain p-5 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-auto">
            {selectedReport ? (
              <>
                <div className="border-b border-hairline pb-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">상세 보기</p>
                  <h2 className="mt-2 font-display text-3xl text-ink">{workflowTitleLabel(selectedReport.title)}</h2>
                  <p className="mt-2 text-sm text-muted">
                    {workflowTitleLabel(selectedReport.runTitle)} · {formatDate(selectedReport.createdAt)}
                  </p>
                </div>
                {isMonthlySalesReport(selectedReport) ? (
                  <div className="mt-5 space-y-5">
                    <ReportSourceDataPanel scenario="monthly" />
                    <section className="rounded-xl border border-hairline bg-surface-card p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">핵심 지표</p>
                      <div className="mt-4 grid gap-3 md:grid-cols-3">
                        {kpis.map((kpi) => (
                          <article className="flex items-center justify-between rounded-lg bg-surface-plain p-4" key={kpi.label}>
                            <div>
                              <p className="text-sm text-muted">{kpi.label}</p>
                              <p className="mt-1 text-2xl font-semibold text-ink">{kpi.value}</p>
                            </div>
                            <span className="rounded-full bg-success/10 px-3 py-1 text-sm font-semibold text-success">{kpi.delta}</span>
                          </article>
                        ))}
                      </div>
                    </section>
                    <MonthlySalesDocument />
                    <DeliveryStatus report={selectedReport} />
                  </div>
                ) : (
                  <div className="mt-5 space-y-5">
                    <ReportSourceDataPanel scenario={reportScenario(selectedReport)} />
                    <MarkdownPreview content={selectedReport.content} />
                    <DeliveryStatus report={selectedReport} />
                  </div>
                )}
              </>
            ) : (
              <div className="flex min-h-64 items-center justify-center rounded-lg bg-surface-card p-6 text-center text-sm text-muted">
                표시할 보고서가 없습니다. 워크플로를 실행하면 생성된 artifact가 여기에 표시됩니다.
              </div>
            )}
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

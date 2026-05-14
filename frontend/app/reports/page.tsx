"use client";

import { type ReactNode, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CheckCircle2, Clipboard, Download, Eye, FileText, Mail, MessageSquare, XCircle } from "lucide-react";
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

type CopyStatus = {
  reportId: string;
  kind: "success" | "error";
  message: string;
} | null;

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

const chartColors = ["#2f8795", "#4db0c1", "#b7d5de"];

const kpis = [
  { label: "총매출", value: "143.3M원", delta: "+9.3%" },
  { label: "총주문", value: "189건", delta: "+6.8%" },
  { label: "평균 마진", value: "34.2%", delta: "+0.9%p" },
];

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

function filenameFor(report: Report) {
  const base = report.title
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/gi, "-")
    .replace(/^-+|-+$/g, "");
  return `${base || "workflow-report"}.md`;
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

function MonthlySalesDocument() {
  return (
    <section className="rounded-xl border border-hairline bg-white p-5 shadow-soft">
      <div className="rounded-md bg-[#43a9bd] px-5 py-4 text-center text-xl font-bold text-white">2026년 5월 채널별 매출현황</div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <div>
          <h3 className="text-sm font-semibold text-ink">[ 채널별 매출 구성비(%) ]</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer height="100%" width="100%">
              <PieChart>
                <Pie data={monthlySalesData} dataKey="share" innerRadius={58} outerRadius={105} paddingAngle={1}>
                  {monthlySalesData.map((entry, index) => (
                    <Cell fill={chartColors[index % chartColors.length]} key={entry.channel} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`${value}%`, "구성비"]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid gap-2 rounded-md bg-[#43a9bd] p-4 text-sm text-white">
            <div className="flex justify-between border-b border-white/30 pb-2">
              <span>전월 총 매출</span>
              <strong>131,000,000</strong>
            </div>
            <div className="flex justify-between border-b border-white/30 pb-2">
              <span>이번달 총 매출</span>
              <strong>143,300,000</strong>
            </div>
            <div className="flex justify-between border-b border-white/30 pb-2">
              <span>전월대비 증가액</span>
              <strong>12,300,000</strong>
            </div>
            <div className="flex justify-between border-b border-white/30 pb-2">
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
                <CartesianGrid stroke="#e8edf0" strokeDasharray="3 3" />
                <XAxis dataKey="channel" tick={{ fill: "#6f6a61", fontSize: 12 }} />
                <YAxis tick={{ fill: "#6f6a61", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, borderColor: "#d8d0c4" }}
                  formatter={(value: number, name) => [`${value}M원`, name === "target" ? "목표금액" : "매출실적"]}
                />
                <Bar dataKey="target" fill="#c7c7c7" name="목표금액" radius={[3, 3, 0, 0]} />
                <Bar dataKey="current" fill="#43a9bd" name="매출실적" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-5 overflow-x-auto rounded-md border border-[#9ed3dc]">
            <table className="min-w-full text-sm">
              <thead className="bg-[#43a9bd] text-white">
                <tr>
                  <th className="px-3 py-2 text-left">채널</th>
                  <th className="px-3 py-2 text-right">목표금액</th>
                  <th className="px-3 py-2 text-right">매출실적</th>
                  <th className="px-3 py-2 text-right">목표대비 초과액</th>
                  <th className="px-3 py-2 text-right">총매출대비 비중(%)</th>
                  <th className="px-3 py-2 text-right">달성률(%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#cce8ed]">
                {monthlySalesData.map((row) => (
                  <tr key={row.channel}>
                    <td className="px-3 py-2 font-medium text-ink">{row.channel}</td>
                    <td className="px-3 py-2 text-right text-body">{(row.target * 1_000_000).toLocaleString("ko-KR")}</td>
                    <td className="px-3 py-2 text-right text-body">{(row.current * 1_000_000).toLocaleString("ko-KR")}</td>
                    <td className="px-3 py-2 text-right text-body">{((row.current - row.target) * 1_000_000).toLocaleString("ko-KR")}</td>
                    <td className="px-3 py-2 text-right text-body">{row.share}%</td>
                    <td className="px-3 py-2 text-right font-semibold text-[#2f8795]">{row.achievement}%</td>
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

export default function ReportsPage() {
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<CopyStatus>(null);
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

  const selectedReport = reports.find((report) => report.id === selectedReportId) ?? null;

  async function copyMarkdown(report: Report) {
    try {
      await navigator.clipboard.writeText(report.content);
      setCopyStatus({
        reportId: report.id,
        kind: "success",
        message: `"${workflowTitleLabel(report.title)}" 마크다운을 클립보드에 복사했습니다.`,
      });
    } catch {
      setCopyStatus({
        reportId: report.id,
        kind: "error",
        message: "브라우저 권한 때문에 복사하지 못했습니다. 미리보기에서 내용을 직접 선택해 주세요.",
      });
    }
  }

  function downloadMarkdown(report: Report) {
    const blob = new Blob([report.content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filenameFor(report);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-[1200px] px-5 py-8 md:px-8">
        <PageHeading
          eyebrow="생성 보고서"
          title="에이전트가 만든 업무 리포트를 검토합니다"
          description="워크플로 실행 결과에서 생성된 마크다운 보고서를 모아 미리보고, 복사하고, 배포용 파일로 내려받을 수 있습니다."
        />

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="rounded-full bg-surface-card px-4 py-2 text-sm text-body">
            {isLoading
              ? "보고서 산출물 조회 중..."
              : isError
                ? "백엔드 미연결 상태입니다. 데모 보고서를 표시합니다."
                : isFallback
                  ? "생성된 보고서가 없어 데모 보고서를 표시합니다."
                  : "보고서 산출물 정보 연결됨"}
          </div>
          {copyStatus && (
            <div
              className={`flex max-w-full items-center gap-2 rounded-full px-4 py-2 text-sm ${
                copyStatus.kind === "success" ? "bg-success/10 text-success" : "bg-error/10 text-error"
              }`}
              role="status"
            >
              {copyStatus.kind === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <XCircle className="h-4 w-4 shrink-0" />}
              <span className="min-w-0 truncate">{copyStatus.message}</span>
            </div>
          )}
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
          <div className="grid gap-4">
            {reports.map((report) => (
              <article
                className={`rounded-xl border p-5 shadow-soft transition ${
                  selectedReport?.id === report.id ? "border-primary bg-surface-plain" : "border-hairline bg-surface-card"
                }`}
                key={`${report.runId}-${report.id}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="rounded-full bg-canvas p-2 text-primary">
                      <FileText className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold uppercase tracking-[0.16em] text-teal">{report.format === "MARKDOWN" ? "마크다운" : report.format}</p>
                      <h2 className="mt-1 text-lg font-semibold text-ink">{workflowTitleLabel(report.title)}</h2>
                    </div>
                  </div>
                  <span className="rounded-full bg-canvas px-3 py-1 text-xs font-medium text-muted">{formatDate(report.createdAt)}</span>
                </div>

                <p className="mt-4 text-sm leading-6 text-body">{report.summary}</p>
                <div className="mt-4 rounded-lg bg-surface-plain p-3">
                  <p className="text-xs font-medium text-muted">워크플로</p>
                  <p className="mt-1 text-sm text-ink">{workflowTitleLabel(report.runTitle)}</p>
                  <p className="mt-2 break-words font-mono text-xs leading-5 text-muted">{report.command}</p>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <button
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-surface-dark px-3 py-2 text-sm font-semibold text-canvas transition hover:bg-primary"
                    onClick={() => setSelectedReportId(report.id)}
                    type="button"
                  >
                    <Eye className="h-4 w-4 shrink-0" />
                    <span className="whitespace-nowrap">미리보기</span>
                  </button>
                  <button
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-hairline bg-surface-plain px-3 py-2 text-sm font-semibold text-ink transition hover:border-primary"
                    onClick={() => copyMarkdown(report)}
                    type="button"
                  >
                    <Clipboard className="h-4 w-4 shrink-0" />
                    <span className="whitespace-nowrap">마크다운 복사</span>
                  </button>
                  <button
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-hairline bg-surface-plain px-3 py-2 text-sm font-semibold text-ink transition hover:border-primary"
                    onClick={() => downloadMarkdown(report)}
                    type="button"
                  >
                    <Download className="h-4 w-4 shrink-0" />
                    <span className="whitespace-nowrap">.md 다운로드</span>
                  </button>
                </div>
              </article>
            ))}
          </div>

          <aside className="rounded-xl border border-hairline bg-surface-plain p-5 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-auto">
            {selectedReport ? (
              <>
                <div className="border-b border-hairline pb-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">미리보기</p>
                  <h2 className="mt-2 font-display text-3xl text-ink">{workflowTitleLabel(selectedReport.title)}</h2>
                  <p className="mt-2 text-sm text-muted">
                    {workflowTitleLabel(selectedReport.runTitle)} · {formatDate(selectedReport.createdAt)}
                  </p>
                </div>
                {isMonthlySalesReport(selectedReport) ? (
                  <div className="mt-5 space-y-5">
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

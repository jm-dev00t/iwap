"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clipboard, Download, Eye, FileText, XCircle } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeading } from "@/components/page-heading";
import { demoWorkflowRuns, listWorkflowRuns, type WorkflowRun } from "@/lib/api";
import { workflowTitleLabel } from "@/lib/display-labels";

type Report = WorkflowRun["artifacts"][number] & {
  runId: string;
  runTitle: string;
  command: string;
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
      command: run.command,
    })),
  );
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

  return (
    <div className="space-y-3 text-sm leading-7 text-body">
      {lines.map((line, index) => {
        const key = `${index}-${line}`;
        if (!line.trim()) {
          return <div className="h-1" key={key} />;
        }
        if (line.startsWith("# ")) {
          return (
            <h3 className="font-display text-2xl text-ink" key={key}>
              {line.replace(/^#\s+/, "").replace("Executive Summary", "실행 요약")}
            </h3>
          );
        }
        if (line.startsWith("## ")) {
          return (
            <h4 className="text-base font-semibold text-ink" key={key}>
              {line.replace(/^##\s+/, "")}
            </h4>
          );
        }
        if (line.startsWith("- ")) {
          return (
            <div className="flex gap-2" key={key}>
              <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-teal" />
              <p>{line.replace(/^-\s+/, "")}</p>
            </div>
          );
        }
        return <p key={key}>{line}</p>;
      })}
    </div>
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

  const selectedReport = reports.find((report) => report.id === selectedReportId) ?? reports[0] ?? null;

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

        <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
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
                <div className="mt-5">
                  <MarkdownPreview content={selectedReport.content} />
                </div>
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

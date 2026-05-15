"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeading } from "@/components/page-heading";
import { demoWorkflowRuns, listWorkflowRuns } from "@/lib/api";
import { actionLabel, agentLabel } from "@/lib/display-labels";

const PAGE_SIZE = 10;

export default function HistoryPage() {
  const [page, setPage] = useState(1);

  const { data, isError } = useQuery({
    queryKey: ["workflow-runs-history"],
    queryFn: listWorkflowRuns,
  });

  const auditRows = (data && data.length > 0 ? data : demoWorkflowRuns()).flatMap((run) => [
    ...run.auditTrail.map((entry) => ({
      runId: run.id,
      actor: entry.actor,
      action: entry.action,
      summary: entry.summary,
    })),
    ...run.artifacts.map((artifact) => ({
      runId: run.id,
      actor: "REPORTER",
      action: `ARTIFACT_${artifact.format}`,
      summary: artifact.summary,
    })),
  ]);

  const totalPages = Math.max(1, Math.ceil(auditRows.length / PAGE_SIZE));
  const pageRows = auditRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <AppShell>
      <div className="mx-auto max-w-[1200px] px-5 py-8 md:px-8">
        <PageHeading
          eyebrow="감사 이력"
          title="에이전트 판단과 도구 호출을 추적합니다"
          description="기업 고객이 자동화를 신뢰하려면 결과뿐 아니라 누가, 언제, 왜 실행했는지 확인할 수 있어야 합니다."
        />
        <div className="mt-4 rounded-full bg-surface-card px-4 py-2 text-sm text-body">
          {isError ? "백엔드 미연결: 데모 감사 로그 표시 중" : "워크플로 감사 로그"}
        </div>

        <div className="mt-8 overflow-hidden rounded-lg border border-hairline bg-surface-plain">
          {pageRows.map((row, index) => (
            <div
              className="grid gap-2 border-b border-hairline p-4 md:grid-cols-[180px_220px_1fr]"
              key={`${row.runId}-${row.action}-${index}`}
            >
              <p className="font-mono text-sm text-primary">{agentLabel(row.actor)}</p>
              <p className="font-mono text-sm text-muted">{actionLabel(row.action)}</p>
              <p className="text-sm text-body">{row.summary}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-muted">
          <span>
            {auditRows.length}개 중 {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, auditRows.length)} 표시
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-md px-3 py-1.5 hover:bg-surface-card disabled:opacity-30 disabled:cursor-not-allowed"
            >
              이전
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`min-w-[32px] rounded-md px-2 py-1.5 ${
                  p === page
                    ? "bg-primary text-canvas font-medium"
                    : "hover:bg-surface-card"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-md px-3 py-1.5 hover:bg-surface-card disabled:opacity-30 disabled:cursor-not-allowed"
            >
              다음
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

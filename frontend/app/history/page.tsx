"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeading } from "@/components/page-heading";
import { demoWorkflowRuns, listWorkflowRuns } from "@/lib/api";
import { actionLabel, agentLabel } from "@/lib/display-labels";

const PAGE_SIZE = 10;

export default function HistoryPage() {
  const [page, setPage] = useState(1);

  const { data } = useQuery({
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
  const start = (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, auditRows.length);

  return (
    <AppShell>
      <div className="mx-auto max-w-[1200px] px-5 py-8 md:px-8">
        <PageHeading
          eyebrow="감사 이력"
          title="에이전트 판단과 도구 호출을 추적합니다"
          description="기업 고객이 자동화를 신뢰하려면 결과뿐 아니라 누가, 언제, 왜 실행했는지 확인할 수 있어야 합니다."
        />
        <div className="mt-8 overflow-hidden rounded-lg border border-hairline bg-surface-plain">
          {/* 테이블 헤더 */}
          <div className="grid gap-2 border-b border-hairline bg-surface-card px-4 py-3 md:grid-cols-[180px_220px_1fr]">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">에이전트</p>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">액션</p>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">내용</p>
          </div>

          {pageRows.map((row, index) => (
            <div
              className="grid gap-2 border-b border-hairline p-4 last:border-b-0 md:grid-cols-[180px_220px_1fr]"
              key={`${row.runId}-${row.action}-${index}`}
            >
              <p className="font-mono text-sm text-primary">{agentLabel(row.actor)}</p>
              <p className="font-mono text-sm text-muted">{actionLabel(row.action)}</p>
              <p className="text-sm text-body">{row.summary}</p>
            </div>
          ))}
        </div>

        {/* 페이지네이션 */}
        <div className="mt-4 flex items-center justify-between text-sm text-muted">
          <span>
            전체 {auditRows.length}건 중 {start}–{end} 표시
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 rounded-md px-3 py-1.5 hover:bg-surface-card disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
              이전
            </button>
            <span className="text-sm font-medium text-ink">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1 rounded-md px-3 py-1.5 hover:bg-surface-card disabled:opacity-30 disabled:cursor-not-allowed"
            >
              다음
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

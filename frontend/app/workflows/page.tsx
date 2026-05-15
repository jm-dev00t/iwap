"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeading } from "@/components/page-heading";
import { demoWorkflowRuns, listWorkflowRuns } from "@/lib/api";
import { statusLabel, workflowTitleLabel } from "@/lib/display-labels";

const PAGE_SIZE = 10;

export default function WorkflowsPage() {
  const [page, setPage] = useState(1);

  const { data, isError, isLoading } = useQuery({
    queryKey: ["workflow-runs"],
    queryFn: listWorkflowRuns,
  });
  const workflows = data && data.length > 0 ? data : demoWorkflowRuns();

  const totalPages = Math.max(1, Math.ceil(workflows.length / PAGE_SIZE));
  const pageRows = workflows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const start = (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, workflows.length);

  return (
    <AppShell>
      <div className="mx-auto max-w-[1200px] px-5 py-8 md:px-8">
        <PageHeading
          eyebrow="워크플로 대시보드"
          title="업무 자동화 상태를 한 화면에서 봅니다"
          description="진행 중, 승인 대기, 완료된 에이전트 워크플로를 운영자가 빠르게 스캔할 수 있는 대시보드입니다."
        />
        <div className="mt-4 flex items-center gap-2 rounded-full bg-surface-card px-4 py-2 text-sm text-body">
          <span className={`h-2 w-2 shrink-0 rounded-full ${isLoading ? "bg-amber animate-pulse" : isError ? "bg-red-500" : "bg-green-500"}`} />
          {isLoading ? "백엔드 조회 중..." : isError ? "백엔드 미연결 — 데모 데이터 표시 중" : "백엔드 연결됨"}
        </div>

        <div className="mt-8 overflow-hidden rounded-lg border border-hairline bg-surface-plain">
          {/* 테이블 헤더 */}
          <div className="grid border-b border-hairline bg-surface-card px-5 py-3 md:grid-cols-[1fr_auto]">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">워크플로</p>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">상태</p>
          </div>

          {pageRows.map((workflow) => (
            <article
              className="grid items-start border-b border-hairline p-5 last:border-b-0 md:grid-cols-[1fr_auto]"
              key={workflow.id}
            >
              <div>
                <p className="text-base font-semibold text-ink">{workflowTitleLabel(workflow.title)}</p>
                <p className="mt-1 text-sm text-body">{workflow.command}</p>
                <p className="mt-2 text-xs text-muted">
                  도구 호출 {workflow.toolCalls.length}건 · 이벤트 {workflow.events.length}건 · 감사 로그 {workflow.auditTrail.length}건
                </p>
              </div>
              <span className="mt-1 rounded-full bg-canvas px-3 py-1 text-xs font-medium text-body">
                {statusLabel(workflow.status)}
              </span>
            </article>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-muted">
          <span>전체 {workflows.length}건 중 {start}–{end} 표시</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 rounded-md px-3 py-1.5 hover:bg-surface-card disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
              이전
            </button>
            <span className="text-sm font-medium text-ink">{page} / {totalPages}</span>
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

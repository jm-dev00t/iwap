"use client";

import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { PageHeading } from "@/components/page-heading";
import { demoWorkflowRuns, listWorkflowRuns } from "@/lib/api";

export default function WorkflowsPage() {
  const { data, isError, isLoading } = useQuery({
    queryKey: ["workflow-runs"],
    queryFn: listWorkflowRuns,
  });
  const workflows = data && data.length > 0 ? data : demoWorkflowRuns();

  return (
    <AppShell>
      <div className="mx-auto max-w-[1200px] px-5 py-8 md:px-8">
        <PageHeading
          eyebrow="Workflow Dashboard"
          title="업무 자동화 상태를 한 화면에서 봅니다"
          description="진행 중, 승인 대기, 완료된 Agent Workflow를 운영자가 빠르게 스캔할 수 있는 대시보드입니다."
        />
        <div className="mt-4 rounded-full bg-surface-card px-4 py-2 text-sm text-body">
          {isLoading ? "Backend API 조회 중..." : isError ? "Backend 미연결: 데모 데이터 표시 중" : "Backend API 연결됨"}
        </div>
        <div className="mt-8 grid gap-4">
          {workflows.map((workflow) => (
            <article className="rounded-lg bg-surface-card p-5" key={workflow.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-ink">{workflow.title}</p>
                  <p className="mt-1 text-sm text-body">{workflow.command}</p>
                  <p className="mt-2 text-xs text-muted">
                    Tool calls {workflow.toolCalls.length} · Events {workflow.events.length} · Audit {workflow.auditTrail.length}
                  </p>
                </div>
                <span className="rounded-full bg-canvas px-3 py-1 text-xs font-medium text-body">{workflow.status}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { PageHeading } from "@/components/page-heading";
import { demoWorkflowRuns, listWorkflowRuns } from "@/lib/api";
import { actionLabel, agentLabel } from "@/lib/display-labels";

export default function HistoryPage() {
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
          {auditRows.map((row, index) => (
            <div className="grid gap-2 border-b border-hairline p-4 md:grid-cols-[180px_220px_1fr]" key={`${row.runId}-${row.action}-${index}`}>
              <p className="font-mono text-sm text-primary">{agentLabel(row.actor)}</p>
              <p className="font-mono text-sm text-muted">{actionLabel(row.action)}</p>
              <p className="text-sm text-body">{row.summary}</p>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

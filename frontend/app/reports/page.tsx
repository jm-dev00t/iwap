"use client";

import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { PageHeading } from "@/components/page-heading";
import { demoWorkflowRuns, listWorkflowRuns } from "@/lib/api";

export default function ReportsPage() {
  const { data, isError } = useQuery({
    queryKey: ["workflow-reports"],
    queryFn: listWorkflowRuns,
  });
  const reports = (data && data.length > 0 ? data : demoWorkflowRuns()).flatMap((run) =>
    run.artifacts.map((artifact) => ({
      ...artifact,
      runTitle: run.title,
      command: run.command,
    })),
  );

  return (
    <AppShell>
      <div className="mx-auto max-w-[1200px] px-5 py-8 md:px-8">
        <PageHeading
          eyebrow="Generated Reports"
          title="Agent가 만든 업무 리포트를 모아봅니다"
          description="월간 매출, 주간 영업 실적, 고객 온보딩 결과처럼 자동화된 업무 산출물을 한 화면에서 확인합니다."
        />
        <div className="mt-4 rounded-full bg-surface-card px-4 py-2 text-sm text-body">
          {isError ? "Backend 미연결: 데모 리포트 표시 중" : "Report Artifact API"}
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {reports.map((report) => (
            <article className="rounded-xl bg-surface-dark p-6 text-canvas" key={report.id}>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal">{report.format}</p>
              <h2 className="display-title mt-3 text-3xl">{report.title}</h2>
              <p className="mt-3 text-sm leading-6 text-[#a09d96]">{report.summary}</p>
              <div className="mt-5 rounded-lg bg-surface-dark-elevated p-4">
                <p className="font-mono text-xs text-[#a09d96]">{report.command}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

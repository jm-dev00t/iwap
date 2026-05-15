// 모든 페이지 상단에 고정되는 플랫폼 헤더 + 현황 타일 바
"use client";

import { BarChart3, CheckSquare, History, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { demoApprovals, demoWorkflowRuns, listApprovals, listWorkflowRuns } from "@/lib/api";

const TILES = [
  { label: "워크플로", href: "/workflows", icon: LayoutDashboard, key: "runs" as const },
  { label: "승인 대기", href: "/approvals", icon: CheckSquare, key: "approvals" as const },
  { label: "감사 로그", href: "/history", icon: History, key: "audit" as const },
  { label: "보고서", href: "/reports", icon: BarChart3, key: "reports" as const },
];

export function TopBar() {
  const { data: runs, isLoading: runsLoading, isError: runsError } = useQuery({ queryKey: ["workflow-runs"], queryFn: listWorkflowRuns });
  const { data: approvals } = useQuery({ queryKey: ["approvals"], queryFn: listApprovals });

  const workflowRuns = runs && runs.length > 0 ? runs : demoWorkflowRuns();
  const approvalList = approvals && approvals.length > 0 ? approvals : demoApprovals();

  const counts = {
    runs: workflowRuns.length,
    approvals: approvalList.filter((a) => a.status === "PENDING").length,
    audit: workflowRuns.reduce((sum, run) => sum + run.auditTrail.length, 0),
    reports: workflowRuns.reduce((sum, run) => sum + run.artifacts.length, 0),
  };

  const connDot = runsLoading ? "bg-amber animate-pulse" : runsError ? "bg-red-500" : "bg-teal";
  const connText = runsLoading ? "연결 중..." : runsError ? "백엔드 미연결" : "백엔드 연결됨";

  return (
    <header className="sticky top-0 z-20 border-b border-hairline bg-surface-card px-5 py-3 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-muted">AI 업무 자동화 콘솔</p>
          <p className="text-sm font-semibold text-ink">지능형 워크플로 자동화 플랫폼</p>
        </div>
        <div
          role="status"
          aria-live="polite"
          aria-label={`백엔드 연결 상태: ${connText}`}
          className="flex items-center gap-2 rounded-full border border-hairline bg-surface-plain px-3 py-1.5 text-xs text-body"
        >
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${connDot}`} />
          {connText}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {TILES.map((tile) => {
          const Icon = tile.icon;
          return (
            <Link
              key={tile.label}
              href={tile.href}
              className="group flex items-center justify-between gap-2 rounded-lg border border-hairline bg-surface-plain px-3 py-2 transition hover:border-primary/60 hover:bg-canvas"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Icon className="h-3.5 w-3.5 shrink-0 text-muted group-hover:text-primary transition-colors" />
                <p className="text-xs text-muted truncate">{tile.label}</p>
              </div>
              <p className="text-base font-bold leading-none text-ink group-hover:text-primary transition-colors shrink-0">
                {counts[tile.key]}
              </p>
            </Link>
          );
        })}
      </div>
    </header>
  );
}

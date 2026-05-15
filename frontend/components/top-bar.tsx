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
  const { data: runs } = useQuery({ queryKey: ["workflow-runs"], queryFn: listWorkflowRuns });
  const { data: approvals } = useQuery({ queryKey: ["approvals"], queryFn: listApprovals });

  const workflowRuns = runs && runs.length > 0 ? runs : demoWorkflowRuns();
  const approvalList = approvals && approvals.length > 0 ? approvals : demoApprovals();

  const counts = {
    runs: workflowRuns.length,
    approvals: approvalList.filter((a) => a.status === "PENDING").length,
    audit: workflowRuns.reduce((sum, run) => sum + run.auditTrail.length, 0),
    reports: workflowRuns.reduce((sum, run) => sum + run.artifacts.length, 0),
  };

  return (
    <header className="sticky top-0 z-20 border-b border-hairline bg-surface-card px-5 py-3 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-muted">AI 업무 자동화 콘솔</p>
          <p className="text-sm font-semibold text-ink">지능형 워크플로 자동화 플랫폼</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-hairline bg-surface-plain px-3 py-1.5 text-xs text-body">
          <span className="h-1.5 w-1.5 rounded-full bg-teal" />
          데모 작업공간 연결됨
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {TILES.map((tile) => {
          const Icon = tile.icon;
          return (
            <Link
              key={tile.label}
              href={tile.href}
              className="flex items-center gap-3 rounded-lg border border-hairline bg-surface-plain px-3 py-2.5 transition hover:border-primary/60 hover:bg-canvas"
            >
              <Icon className="h-4 w-4 shrink-0 text-muted" />
              <div className="min-w-0">
                <p className="text-[11px] text-muted">{tile.label}</p>
                <p className="text-lg font-bold leading-none text-ink">{counts[tile.key]}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </header>
  );
}

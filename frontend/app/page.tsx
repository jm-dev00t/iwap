"use client";

import { BarChart3, CheckSquare, History, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { CommandCenter } from "@/components/command-center";
import { demoApprovals, demoWorkflowRuns, listApprovals, listWorkflowRuns } from "@/lib/api";

export default function Home() {
  const { data: runs } = useQuery({ queryKey: ["workflow-runs"], queryFn: listWorkflowRuns });
  const { data: approvals } = useQuery({ queryKey: ["approvals"], queryFn: listApprovals });

  const workflowRuns = runs && runs.length > 0 ? runs : demoWorkflowRuns();
  const approvalList = approvals && approvals.length > 0 ? approvals : demoApprovals();

  const pendingApprovals = approvalList.filter((a) => a.status === "PENDING").length;
  const auditCount = workflowRuns.reduce((sum, run) => sum + run.auditTrail.length, 0);
  const reportCount = workflowRuns.reduce((sum, run) => sum + run.artifacts.length, 0);

  const tiles = [
    {
      label: "워크플로",
      value: workflowRuns.length,
      note: "전체 실행 이력",
      href: "/workflows",
      icon: LayoutDashboard,
      highlight: false,
    },
    {
      label: "승인 대기",
      value: pendingApprovals,
      note: "사람 확인 필요",
      href: "/approvals",
      icon: CheckSquare,
      highlight: pendingApprovals > 0,
    },
    {
      label: "감사 로그",
      value: auditCount,
      note: "에이전트 액션 추적",
      href: "/history",
      icon: History,
      highlight: false,
    },
    {
      label: "보고서",
      value: reportCount,
      note: "생성된 산출물",
      href: "/reports",
      icon: BarChart3,
      highlight: false,
    },
  ];

  return (
    <AppShell>
      <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-5 py-6 md:px-8 lg:py-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted">AI 업무 자동화 콘솔</p>
            <p className="text-lg font-semibold text-ink">지능형 워크플로 자동화 플랫폼</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-hairline bg-surface-plain px-3 py-2 text-sm text-body">
            <span className="h-2 w-2 rounded-full bg-teal" />
            데모 작업공간 연결됨
          </div>
        </header>

        <CommandCenter />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tiles.map((tile) => {
            const Icon = tile.icon;
            return (
              <Link
                className={`rounded-xl border p-5 transition hover:border-primary/60 hover:shadow-soft ${
                  tile.highlight ? "border-amber/50 bg-amber/5" : "border-hairline bg-surface-card"
                }`}
                href={tile.href}
                key={tile.label}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-muted">{tile.label}</p>
                  <Icon className={`h-4 w-4 ${tile.highlight ? "text-amber" : "text-muted"}`} />
                </div>
                <p className="display-title mt-3 text-4xl text-ink">{tile.value}</p>
                <p className="mt-2 text-sm leading-6 text-body">{tile.note}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}

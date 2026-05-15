"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeading } from "@/components/page-heading";
import { approveApproval, demoApprovals, listApprovals, rejectApproval, type ApprovalItem } from "@/lib/api";
import { agentLabel, statusLabel, workflowTitleLabel } from "@/lib/display-labels";

const APPROVALS_PER_PAGE = 3;

const approvalEvidenceRows = [
  ["SKU-RED-001", "레드 패키지 박스", "12", "50", "120"],
  ["SKU-GRN-014", "그린 라벨 세트", "8", "40", "90"],
  ["SKU-BLK-021", "블랙 완충재", "17", "60", "100"],
];

function approvalTime(approval: ApprovalItem) {
  const time = new Date(approval.requestedAt).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function compactApprovalsByScenario(approvals: ApprovalItem[]) {
  const latest = approvals.reduce<ApprovalItem | null>((current, approval) => {
    if (!current || approvalTime(approval) > approvalTime(current)) {
      return approval;
    }
    return current;
  }, null);

  return latest ? [latest] : [];
}

export default function ApprovalsPage() {
  const queryClient = useQueryClient();
  const [localDecisions, setLocalDecisions] = useState<Record<string, string>>({});
  const [approvalPage, setApprovalPage] = useState(1);
  const { data, isError, isLoading } = useQuery({
    queryKey: ["approvals"],
    queryFn: listApprovals,
  });
  const approvals = (data && data.length > 0 ? data : demoApprovals()).map((approval) => ({
    ...approval,
    status: localDecisions[approval.id] ?? approval.status,
  }));
  const scenarioApprovals = compactApprovalsByScenario(approvals);
  const totalApprovalPages = Math.max(1, Math.ceil(scenarioApprovals.length / APPROVALS_PER_PAGE));
  const currentApprovalPage = Math.min(approvalPage, totalApprovalPages);
  const pagedApprovals = scenarioApprovals.slice((currentApprovalPage - 1) * APPROVALS_PER_PAGE, currentApprovalPage * APPROVALS_PER_PAGE);

  const decide = useMutation({
    mutationFn: async ({ approval, decision }: { approval: ApprovalItem; decision: "APPROVED" | "REJECTED" }) => {
      if (decision === "APPROVED") {
        return approveApproval(approval.id);
      }
      return rejectApproval(approval.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approvals"] });
      queryClient.invalidateQueries({ queryKey: ["workflow-runs"] });
    },
    onError: (_error, variables) => {
      // Demo fallback keeps the approval action visibly responsive without a running backend.
      setLocalDecisions((current) => ({ ...current, [variables.approval.id]: variables.decision }));
    },
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-[1200px] px-5 py-8 md:px-8">
        <PageHeading
          eyebrow="사람 승인 단계"
          title="위험한 자동화는 사람이 승인합니다"
          description="외부 발송, 구매팀 알림, 대량 고객 안내처럼 실제 업무 영향이 큰 단계는 승인함에서 통제합니다."
        />
        <div className="mt-4 flex items-center gap-2 rounded-full bg-surface-card px-4 py-2 text-sm text-body">
          <span className={`h-2 w-2 shrink-0 rounded-full ${isLoading ? "bg-amber animate-pulse" : isError ? "bg-red-500" : "bg-green-500"}`} />
          {isLoading ? "승인 목록 조회 중..." : isError ? "백엔드 미연결 — 데모 승인 표시 중" : "백엔드 연결됨"}
        </div>
        <div className="mt-3 rounded-full bg-surface-card px-4 py-2 text-sm text-body">
          시나리오별 대표 {scenarioApprovals.length}건 표시
          {approvals.length > scenarioApprovals.length ? ` · 누적 ${approvals.length - scenarioApprovals.length}건 정리됨` : ""}
        </div>
        <div className="mt-8 grid gap-4">
          {pagedApprovals.map((approval) => (
            <section className="rounded-xl bg-surface-dark p-6 text-canvas" key={approval.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-amber">{statusLabel(approval.status)}</p>
                  <h2 className="display-title mt-2 text-3xl">{workflowTitleLabel("Low Inventory Purchasing Alert")}</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-[#a09d96]">{approval.reason}</p>
                  <p className="mt-3 font-mono text-xs text-[#a09d96]">
                    {approval.id} · 요청 에이전트 {agentLabel(approval.requestedByAgent)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    className="h-10 rounded-md bg-surface-dark-elevated px-4 text-sm font-medium text-canvas disabled:opacity-50"
                    disabled={approval.status !== "PENDING" || decide.isPending}
                    onClick={() => decide.mutate({ approval, decision: "REJECTED" })}
                  >
                    반려
                  </button>
                  <button
                    className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-white disabled:opacity-50"
                    disabled={approval.status !== "PENDING" || decide.isPending}
                    onClick={() => decide.mutate({ approval, decision: "APPROVED" })}
                  >
                    승인
                  </button>
                </div>
              </div>
              <div className="mt-5 overflow-x-auto rounded-lg border border-white/10 bg-surface-dark-elevated">
                <div className="border-b border-white/10 px-4 py-3">
                  <p className="text-sm font-semibold text-canvas">승인 판단 자료</p>
                  <p className="mt-1 text-xs text-[#a09d96]">재고 현황과 재주문 기준을 비교해 구매팀 전송 전 사람 승인을 요청했습니다.</p>
                </div>
                <table className="min-w-full text-sm">
                  <thead className="text-[#a09d96]">
                    <tr>
                      <th className="px-3 py-2 text-left">SKU</th>
                      <th className="px-3 py-2 text-left">품목</th>
                      <th className="px-3 py-2 text-right">현재 재고</th>
                      <th className="px-3 py-2 text-right">재주문 기준</th>
                      <th className="px-3 py-2 text-right">권장 발주</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {approvalEvidenceRows.map((row) => (
                      <tr key={row[0]}>
                        <td className="px-3 py-2 font-mono text-xs text-canvas">{row[0]}</td>
                        <td className="px-3 py-2 text-canvas">{row[1]}</td>
                        <td className="px-3 py-2 text-right text-canvas">{row[2]}</td>
                        <td className="px-3 py-2 text-right text-canvas">{row[3]}</td>
                        <td className="px-3 py-2 text-right font-semibold text-amber">{row[4]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
        {totalApprovalPages > 1 ? (
          <div className="mt-4 flex items-center justify-between rounded-lg border border-hairline bg-surface-card px-3 py-2">
            <button
              className="rounded-md px-3 py-2 text-sm font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-40"
              disabled={currentApprovalPage === 1}
              onClick={() => setApprovalPage((page) => Math.max(1, page - 1))}
              type="button"
            >
              이전
            </button>
            <span className="text-sm text-muted">
              {currentApprovalPage} / {totalApprovalPages}
            </span>
            <button
              className="rounded-md px-3 py-2 text-sm font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-40"
              disabled={currentApprovalPage === totalApprovalPages}
              onClick={() => setApprovalPage((page) => Math.min(totalApprovalPages, page + 1))}
              type="button"
            >
              다음
            </button>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}

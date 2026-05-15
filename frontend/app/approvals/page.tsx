"use client";

import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageHeading } from "@/components/page-heading";
import { approveApproval, demoApprovals, listApprovals, rejectApproval, type ApprovalItem } from "@/lib/api";
import { agentLabel, statusLabel, workflowTitleLabel } from "@/lib/display-labels";

const APPROVALS_PER_PAGE = 5;

const approvalEvidenceRows = [
  ["SKU-RED-001", "레드 패키지 박스", "12", "50", "120"],
  ["SKU-GRN-014", "그린 라벨 세트", "8", "40", "90"],
  ["SKU-BLK-021", "블랙 완충재", "17", "60", "100"],
];

function ApprovalsContent() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const highlightRunId = searchParams.get("id");
  const highlightRef = useRef<HTMLElement>(null);

  const [localDecisions, setLocalDecisions] = useState<Record<string, "APPROVED" | "REJECTED">>({});
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [processingDecision, setProcessingDecision] = useState<"APPROVED" | "REJECTED" | null>(null);
  const [approvalPage, setApprovalPage] = useState(1);

  const { data, isError, isLoading } = useQuery({
    queryKey: ["approvals"],
    queryFn: listApprovals,
  });

  const rawApprovals = data && data.length > 0 ? data : demoApprovals();
  const approvals = rawApprovals
    .map((approval) => ({
      ...approval,
      status: (localDecisions[approval.id] ?? approval.status) as string,
    }))
    .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());

  const totalApprovalPages = Math.max(1, Math.ceil(approvals.length / APPROVALS_PER_PAGE));
  const currentApprovalPage = Math.min(approvalPage, totalApprovalPages);
  const pagedApprovals = approvals.slice(
    (currentApprovalPage - 1) * APPROVALS_PER_PAGE,
    currentApprovalPage * APPROVALS_PER_PAGE,
  );
  const start = (currentApprovalPage - 1) * APPROVALS_PER_PAGE + 1;
  const end = Math.min(currentApprovalPage * APPROVALS_PER_PAGE, approvals.length);

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
      setLocalDecisions((current) => ({ ...current, [variables.approval.id]: variables.decision }));
    },
    onSettled: () => {
      setProcessingId(null);
      setProcessingDecision(null);
    },
  });

  function handleDecide(approval: ApprovalItem, decision: "APPROVED" | "REJECTED") {
    setProcessingId(approval.id);
    setProcessingDecision(decision);
    decide.mutate({ approval, decision });
  }

  useEffect(() => {
    if (highlightRunId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightRunId]);

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

        <div className="mt-8 grid gap-4">
          {pagedApprovals.map((approval) => {
            const isHighlighted = approval.runId === highlightRunId;
            const isProcessing = processingId === approval.id;
            const isPending = approval.status === "PENDING";
            const isApproved = approval.status === "APPROVED";
            const isRejected = approval.status === "REJECTED";

            return (
              <section
                ref={isHighlighted ? highlightRef : null}
                className={`rounded-xl bg-surface-dark p-6 text-canvas ${isHighlighted ? "ring-2 ring-primary" : ""}`}
                key={approval.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className={`text-sm font-semibold ${isApproved ? "text-green-400" : isRejected ? "text-red-400" : "text-amber"}`}>
                      {isApproved ? "✓ 승인됨" : isRejected ? "✗ 반려됨" : statusLabel(approval.status)}
                    </p>
                    <h2 className="display-title mt-2 text-3xl">{workflowTitleLabel("Low Inventory Purchasing Alert")}</h2>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-[#a09d96]">{approval.reason}</p>
                    <p className="mt-3 font-mono text-xs text-[#a09d96]">
                      {approval.id} · 요청 에이전트 {agentLabel(approval.requestedByAgent)}
                    </p>
                  </div>

                  {isPending ? (
                    <div className="flex gap-2">
                      <button
                        className="inline-flex h-10 items-center gap-2 rounded-md bg-surface-dark-elevated px-4 text-sm font-medium text-canvas disabled:opacity-50"
                        disabled={isProcessing}
                        onClick={() => handleDecide(approval, "REJECTED")}
                        type="button"
                      >
                        {isProcessing && processingDecision === "REJECTED" ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : null}
                        반려
                      </button>
                      <button
                        className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-white disabled:opacity-50"
                        disabled={isProcessing}
                        onClick={() => handleDecide(approval, "APPROVED")}
                        type="button"
                      >
                        {isProcessing && processingDecision === "APPROVED" ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : null}
                        승인
                      </button>
                    </div>
                  ) : (
                    <span className={`rounded-full px-4 py-2 text-sm font-semibold ${isApproved ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}`}>
                      {isApproved ? "승인 완료" : "반려 완료"}
                    </span>
                  )}
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
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-muted">
          <span>전체 {approvals.length}건 중 {start}–{end} 표시</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setApprovalPage((p) => Math.max(1, p - 1))}
              disabled={currentApprovalPage === 1}
              className="flex items-center gap-1 rounded-md px-3 py-1.5 hover:bg-surface-card disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
              이전
            </button>
            <span className="font-medium text-ink">{currentApprovalPage} / {totalApprovalPages}</span>
            <button
              onClick={() => setApprovalPage((p) => Math.min(totalApprovalPages, p + 1))}
              disabled={currentApprovalPage === totalApprovalPages}
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

export default function ApprovalsPage() {
  return (
    <Suspense>
      <ApprovalsContent />
    </Suspense>
  );
}

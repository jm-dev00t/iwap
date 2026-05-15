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
  const [mutationError, setMutationError] = useState<string | null>(null);

  const { data, isError } = useQuery({
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
    onSuccess: (_data, variables) => {
      setLocalDecisions((current) => ({ ...current, [variables.approval.id]: variables.decision }));
      setMutationError(null);
      queryClient.invalidateQueries({ queryKey: ["approvals"] });
      queryClient.invalidateQueries({ queryKey: ["workflow-runs"] });
    },
    onError: (error, variables) => {
      const label = variables.decision === "APPROVED" ? "승인" : "반려";
      const message = error instanceof Error ? error.message : "알 수 없는 오류";
      if (isError) {
        // 데모 모드: 백엔드 미연결 상태이므로 로컬에서 반영
        setLocalDecisions((current) => ({ ...current, [variables.approval.id]: variables.decision }));
        setMutationError(null);
      } else {
        setMutationError(`${label} 처리에 실패했습니다. (${message})`);
      }
    },
    onSettled: () => {
      setProcessingId(null);
      setProcessingDecision(null);
    },
  });

  function handleDecide(approval: ApprovalItem, decision: "APPROVED" | "REJECTED") {
    setMutationError(null);
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
        {mutationError ? (
          <div role="alert" aria-live="assertive" className="mt-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm font-medium text-red-500">
            {mutationError}
          </div>
        ) : null}

        <div className="mt-8 grid gap-4">
          {pagedApprovals.map((approval) => {
            const isHighlighted = approval.runId === highlightRunId;
            const isProcessing = processingId === approval.id;
            const isPending = approval.status === "PENDING";
            const isApproved = approval.status === "APPROVED";
            const isRejected = approval.status === "REJECTED";
            const cardTitle = workflowTitleLabel(approval.runId);

            return (
              <section
                ref={isHighlighted ? highlightRef : null}
                aria-label={`승인 항목: ${cardTitle} (${statusLabel(approval.status)})`}
                className={`rounded-xl bg-surface-dark p-6 text-canvas ${isHighlighted ? "ring-2 ring-primary" : ""}`}
                key={approval.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className={`text-sm font-semibold ${isApproved ? "text-success" : isRejected ? "text-red-400" : "text-amber"}`}>
                      {isApproved ? (
                        <><span aria-hidden="true">✓ </span><span className="sr-only">승인됨 — </span>승인됨</>
                      ) : isRejected ? (
                        <><span aria-hidden="true">✗ </span><span className="sr-only">반려됨 — </span>반려됨</>
                      ) : statusLabel(approval.status)}
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-canvas">{cardTitle}</h2>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-body line-clamp-3">{approval.reason}</p>
                    <p className="mt-3 font-mono text-xs text-muted">
                      요청 에이전트: {agentLabel(approval.requestedByAgent)}
                    </p>
                  </div>

                  {isPending ? (
                    <div className="flex gap-2">
                      <button
                        className="inline-flex h-11 items-center gap-2 rounded-md bg-surface-dark-elevated px-4 text-sm font-medium text-canvas disabled:opacity-50"
                        disabled={isProcessing}
                        onClick={() => handleDecide(approval, "REJECTED")}
                        aria-label={`${cardTitle} 반려`}
                        type="button"
                      >
                        {isProcessing && processingDecision === "REJECTED" ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : null}
                        반려
                      </button>
                      <button
                        className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-white disabled:opacity-50"
                        disabled={isProcessing}
                        onClick={() => handleDecide(approval, "APPROVED")}
                        aria-label={`${cardTitle} 승인`}
                        type="button"
                      >
                        {isProcessing && processingDecision === "APPROVED" ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : null}
                        승인
                      </button>
                    </div>
                  ) : (
                    <span className={`rounded-full px-4 py-2 text-sm font-semibold ${isApproved ? "bg-success/20 text-success" : "bg-red-500/20 text-red-300"}`}>
                      {isApproved ? "승인 완료" : "반려 완료"}
                    </span>
                  )}
                </div>

                {isPending ? (
                  <div className="mt-5 overflow-x-auto rounded-lg border border-white/10 bg-surface-dark-elevated">
                    <div className="border-b border-white/10 px-4 py-3">
                      <p className="text-sm font-semibold text-canvas">승인 판단 자료</p>
                    </div>
                    <table className="min-w-full text-sm" aria-label="승인 판단 자료: SKU별 재고 현황">
                      <thead className="text-muted">
                        <tr>
                          <th scope="col" className="px-3 py-2 text-left">SKU</th>
                          <th scope="col" className="px-3 py-2 text-left">품목</th>
                          <th scope="col" className="px-3 py-2 text-right">현재 재고</th>
                          <th scope="col" className="px-3 py-2 text-right">재주문 기준</th>
                          <th scope="col" className="px-3 py-2 text-right">권장 발주</th>
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
                ) : null}
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

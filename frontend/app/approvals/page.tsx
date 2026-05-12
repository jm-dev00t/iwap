"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeading } from "@/components/page-heading";
import { approveApproval, demoApprovals, listApprovals, rejectApproval, type ApprovalItem } from "@/lib/api";

export default function ApprovalsPage() {
  const queryClient = useQueryClient();
  const [localDecisions, setLocalDecisions] = useState<Record<string, string>>({});
  const { data, isError, isLoading } = useQuery({
    queryKey: ["approvals"],
    queryFn: listApprovals,
  });
  const approvals = (data && data.length > 0 ? data : demoApprovals()).map((approval) => ({
    ...approval,
    status: localDecisions[approval.id] ?? approval.status,
  }));

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
          eyebrow="Human In The Loop"
          title="위험한 자동화는 사람이 승인합니다"
          description="외부 발송, 구매팀 알림, 대량 고객 안내처럼 실제 업무 영향이 큰 단계는 승인함에서 통제합니다."
        />
        <div className="mt-4 rounded-full bg-surface-card px-4 py-2 text-sm text-body">
          {isLoading ? "승인 목록 조회 중..." : isError ? "Backend 미연결: 데모 승인 표시 중" : "Backend API 연결됨"}
        </div>
        <div className="mt-8 grid gap-4">
          {approvals.map((approval) => (
            <section className="rounded-xl bg-surface-dark p-6 text-canvas" key={approval.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-amber">{approval.status}</p>
                  <h2 className="display-title mt-2 text-3xl">Low Inventory Purchasing Alert</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-[#a09d96]">{approval.reason}</p>
                  <p className="mt-3 font-mono text-xs text-[#a09d96]">
                    {approval.id} · requested by {approval.requestedByAgent}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    className="h-10 rounded-md bg-surface-dark-elevated px-4 text-sm font-medium text-canvas disabled:opacity-50"
                    disabled={approval.status !== "PENDING" || decide.isPending}
                    onClick={() => decide.mutate({ approval, decision: "REJECTED" })}
                  >
                    Reject
                  </button>
                  <button
                    className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-white disabled:opacity-50"
                    disabled={approval.status !== "PENDING" || decide.isPending}
                    onClick={() => decide.mutate({ approval, decision: "APPROVED" })}
                  >
                    Approve
                  </button>
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

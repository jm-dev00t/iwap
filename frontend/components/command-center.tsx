"use client";

import { ArrowUpRight, Loader2, Play } from "lucide-react";
import { useState } from "react";
import { startWorkflow as requestStartWorkflow } from "@/lib/api";
import { statusLabel, workflowTitleLabel } from "@/lib/display-labels";
import { demoScenarios } from "@/lib/workflow-demo";

type WorkflowRunResponse = {
  id: string;
  title: string;
  status: string;
  events: Array<{ message: string }>;
  toolCalls: Array<{ toolName: string }>;
  approvals: Array<{ reason: string }>;
};

export function CommandCenter() {
  const [command, setCommand] = useState(demoScenarios[0].command);
  const [requestedBy, setRequestedBy] = useState("manager@demo-company.com");
  const [selectedScenario, setSelectedScenario] = useState(demoScenarios[0].key);
  const [run, setRun] = useState<WorkflowRunResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function startWorkflow() {
    setIsSubmitting(true);
    setError(null);

    try {
      setRun(await requestStartWorkflow(command, { scenarioKey: selectedScenario, requestedBy }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "워크플로 요청에 실패했습니다");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-xl border border-hairline bg-surface-plain p-6">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">포트폴리오 데모</p>
      <h1 className="display-title mt-3 max-w-2xl text-5xl leading-tight md:text-6xl">
        자연어 명령을 실제 업무 자동화 흐름으로 바꿉니다
      </h1>
      <p className="mt-5 max-w-2xl text-base leading-7 text-body">
        IWAP는 계획, 실행, 검증, 보고, 알림 에이전트가 작업 보고서 생성, 고객 관리 기록,
        알림 발송, 승인 요청, 감사 로그까지 처리하는 하이브리드형 기업 AI 자동화 플랫폼입니다.
      </p>

      <div className="mt-8 rounded-lg border border-hairline bg-canvas p-3">
        <textarea
          className="h-28 w-full resize-none bg-transparent p-3 text-base leading-7 text-ink outline-none"
          value={command}
          onChange={(event) => setCommand(event.target.value)}
          aria-label="워크플로 명령"
        />
        <div className="grid gap-3 border-t border-hairline px-3 pt-3 md:grid-cols-[1fr_auto] md:items-center">
          <label className="min-w-0 text-sm text-muted">
            <span className="sr-only">요청자 이메일</span>
            <input
              className="h-10 w-full rounded-md border border-hairline bg-surface-plain px-3 text-sm text-ink outline-none focus:border-primary"
              type="email"
              value={requestedBy}
              onChange={(event) => setRequestedBy(event.target.value)}
              aria-label="요청자 이메일"
            />
          </label>
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-white hover:bg-primary-active disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isSubmitting || command.trim().length === 0 || requestedBy.trim().length === 0}
            onClick={startWorkflow}
            type="button"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            워크플로 실행
          </button>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 px-3 pt-3">
          <p className="text-sm text-muted">모의 AI 모드 · 실제 연동 키가 있으면 운영 모드로 전환 가능</p>
          {run ? <p className="text-sm font-medium text-ink">{workflowTitleLabel(run.title)} · {statusLabel(run.status)}</p> : null}
          {error ? <p className="text-sm font-medium text-primary-active">{error}</p> : null}
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {demoScenarios.map((scenario) => {
          const Icon = scenario.icon;
          return (
            <button
              className="group flex min-h-24 items-start gap-3 rounded-lg bg-surface-card p-4 text-left"
              key={scenario.key}
              onClick={() => {
                setCommand(scenario.command);
                setSelectedScenario(scenario.key);
                setRun(null);
                setError(null);
              }}
              type="button"
            >
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-canvas text-primary">
                <Icon className="h-4 w-4" />
              </div>
              <span className="min-w-0">
                <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                  {scenario.label}
                  <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" />
                </span>
                <span className="mt-1 block text-sm leading-6 text-body">{scenario.command}</span>
              </span>
            </button>
          );
        })}
      </div>

      {run ? (
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <div className="rounded-lg bg-surface-card p-4">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">실행 ID</p>
            <p className="mt-2 break-all font-mono text-sm text-ink">{run.id}</p>
          </div>
          <div className="rounded-lg bg-surface-card p-4">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">이벤트</p>
            <p className="mt-2 text-2xl font-semibold text-ink">{run.events.length}</p>
          </div>
          <div className="rounded-lg bg-surface-card p-4">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">도구 호출</p>
            <p className="mt-2 text-2xl font-semibold text-ink">{run.toolCalls.length}</p>
          </div>
        </div>
      ) : null}
    </section>
  );
}

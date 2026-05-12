"use client";

import { useState } from "react";
import { ArrowUpRight, Play } from "lucide-react";
import { demoWorkflowRun, startWorkflow, type WorkflowRun } from "@/lib/api";
import { demoScenarios } from "@/lib/workflow-demo";

export function CommandCenter() {
  const [command, setCommand] = useState("이번 달 매출 보고서 만들어서 슬랙 채널과 이메일로 보내줘");
  const [run, setRun] = useState<WorkflowRun | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [source, setSource] = useState<"api" | "fallback" | null>(null);

  async function runWorkflow() {
    setIsRunning(true);
    try {
      const result = await startWorkflow(command);
      setRun(result);
      setSource("api");
    } catch {
      // The portfolio UI remains demoable even when the backend is not running locally.
      setRun(demoWorkflowRun(command));
      setSource("fallback");
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <section className="rounded-xl border border-hairline bg-surface-plain p-6">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">Portfolio Demo</p>
      <h1 className="display-title mt-3 max-w-2xl text-5xl leading-tight md:text-6xl">
        자연어 명령을 실제 업무 자동화 흐름으로 바꿉니다
      </h1>
      <p className="mt-5 max-w-2xl text-base leading-7 text-body">
        IWAP은 Planner, Executor, Validator, Reporter, Notifier Agent가 협업해 보고서 생성,
        CRM 기록, 알림 발송, 승인 요청, 감사 로그까지 처리하는 하이브리드형 B2B AI 자동화 플랫폼입니다.
      </p>

      <div className="mt-8 rounded-lg border border-hairline bg-canvas p-3">
        <textarea
          className="h-28 w-full resize-none bg-transparent p-3 text-base leading-7 text-ink outline-none"
          value={command}
          onChange={(event) => setCommand(event.target.value)}
          aria-label="Workflow command"
        />
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline px-3 pt-3">
          <p className="text-sm text-muted">Mock AI mode · 실제 연동 키가 있으면 Provider 전환</p>
          <button
            className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-white hover:bg-primary-active disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isRunning}
            onClick={runWorkflow}
          >
            <Play className="h-4 w-4" />
            {isRunning ? "Running..." : "Run workflow"}
          </button>
        </div>
      </div>

      {run ? (
        <div className="mt-5 rounded-lg bg-surface-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-ink">{run.title}</p>
            <span className="rounded-full bg-canvas px-3 py-1 text-xs font-medium text-body">
              {source === "api" ? "Backend API" : "Demo fallback"} · {run.status}
            </span>
          </div>
          <p className="mt-2 text-sm leading-6 text-body">{run.events[0]?.message}</p>
          <p className="mt-2 text-xs text-muted">
            Tool calls {run.toolCalls.length} · Approvals {run.approvals.length} · Audit events {run.auditTrail.length}
          </p>
          {run.artifacts[0] ? (
            <div className="mt-4 rounded-md bg-canvas p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">Generated Report</p>
              <p className="mt-1 text-sm font-semibold text-ink">{run.artifacts[0].title}</p>
              <p className="mt-1 text-sm leading-6 text-body">{run.artifacts[0].summary}</p>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {demoScenarios.map((scenario) => {
          const Icon = scenario.icon;
          return (
            <button
              className="group flex min-h-24 items-start gap-3 rounded-lg bg-surface-card p-4 text-left"
              key={scenario.key}
              onClick={() => setCommand(scenario.command)}
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
    </section>
  );
}

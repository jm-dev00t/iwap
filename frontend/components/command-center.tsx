"use client";

import { ArrowRight, Bot, CheckCircle2, Loader2, MailCheck, Play, Send, ShieldCheck, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  executeAssistantPlan,
  sendAssistantMessage,
  type AssistantChatResponse,
  type AssistantPlan,
  type WorkflowRun,
} from "@/lib/api";
import { statusLabel, toolLabel, workflowTitleLabel } from "@/lib/display-labels";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
};

const examples = [
  "이번 달 매출 보고서 만들어서 manager@demo-company.com으로 보내줘",
  "이번 주 영업실적 리포트 만들고 director@demo-company.com으로 공유해줘",
  "재고 부족 품목 확인하고 구매팀에 알림 보내줘",
  "Blue Harbor Retail 신규 고객 온보딩 처리해줘",
];

function PlanCard({
  plan,
  isExecuting,
  onExecute,
}: {
  plan: AssistantPlan;
  isExecuting: boolean;
  onExecute: () => void;
}) {
  return (
    <section className="rounded-lg border border-hairline bg-surface-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            {plan.providerMode === "openai" ? "OpenAI Planner" : "Demo Planner"}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-ink">AI가 이해한 실행 계획</h2>
          <p className="mt-2 text-sm leading-6 text-body">{plan.summary}</p>
        </div>
        <span className="rounded-full bg-canvas px-3 py-1 text-xs font-semibold text-body">
          신뢰도 {Math.round(plan.confidence * 100)}%
        </span>
      </div>

      <ol className="mt-4 space-y-3">
        {plan.actions.map((action) => (
          <li className="flex gap-3 rounded-md bg-canvas p-3" key={`${plan.id}-${action.order}-${action.toolName}`}>
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-white">
              {action.order}
            </span>
            <span className="min-w-0">
              <span className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink">
                {action.title}
                <span className="rounded-full bg-surface-plain px-2 py-0.5 text-xs font-medium text-body">
                  {toolLabel(action.toolName)}
                </span>
                {action.external ? (
                  <span className="rounded-full bg-amber/20 px-2 py-0.5 text-xs font-medium text-ink">외부 실행</span>
                ) : null}
              </span>
              <span className="mt-1 block text-sm leading-6 text-body">{action.description}</span>
            </span>
          </li>
        ))}
      </ol>

      {plan.requiresApproval ? (
        <div className="mt-4 flex gap-2 rounded-md bg-canvas p-3 text-sm leading-6 text-body">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span>{plan.approvalReason}</span>
        </div>
      ) : null}

      <button
        className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-active disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isExecuting}
        onClick={onExecute}
        type="button"
      >
        {isExecuting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
        승인하고 실행
      </button>
    </section>
  );
}

function ResultCard({ run }: { run: WorkflowRun }) {
  const deliveryTools = run.toolCalls.filter((tool) => ["email", "slack", "kakao", "kakaowork"].includes(tool.toolName));

  return (
    <section className="rounded-lg border border-hairline bg-surface-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Workflow Result</p>
          <h2 className="mt-2 text-xl font-semibold text-ink">{workflowTitleLabel(run.title)}</h2>
          <p className="mt-2 text-sm text-body">{run.command}</p>
        </div>
        <span className="rounded-full bg-canvas px-3 py-1 text-xs font-semibold text-body">{statusLabel(run.status)}</span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <a className="rounded-md bg-canvas p-3 text-sm font-semibold text-ink hover:text-primary" href="/reports">
          보고서 확인 <ArrowRight className="ml-1 inline h-3.5 w-3.5" />
        </a>
        <a className="rounded-md bg-canvas p-3 text-sm font-semibold text-ink hover:text-primary" href="/workflows">
          실행 이력 <ArrowRight className="ml-1 inline h-3.5 w-3.5" />
        </a>
        <a className="rounded-md bg-canvas p-3 text-sm font-semibold text-ink hover:text-primary" href="/approvals">
          승인함 <ArrowRight className="ml-1 inline h-3.5 w-3.5" />
        </a>
      </div>

      {deliveryTools.length > 0 ? (
        <div className="mt-4 space-y-2">
          {deliveryTools.map((tool) => (
            <div className="flex items-center gap-2 rounded-md bg-canvas p-3 text-sm text-body" key={`${run.id}-${tool.toolName}`}>
              <MailCheck className="h-4 w-4 text-primary" />
              <span className="font-semibold text-ink">{toolLabel(tool.toolName)}</span>
              <span>{tool.status === "COMPLETED" ? "데모 발송 기록 완료" : "승인 또는 실행 대기"}</span>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export function CommandCenter() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "assistant-intro",
      role: "assistant",
      text: "업무를 자연어로 말해 주세요. 필요한 정보가 빠져 있으면 제가 먼저 물어보고, 실행 전 계획을 확인받겠습니다.",
    },
  ]);
  const [plan, setPlan] = useState<AssistantPlan | null>(null);
  const [run, setRun] = useState<WorkflowRun | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = chatContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  function addMessage(role: ChatMessage["role"], text: string) {
    setMessages((current) => [...current, { id: `${role}-${Date.now()}-${current.length}`, role, text }]);
  }

  function applyAssistantResponse(response: AssistantChatResponse) {
    setSessionId(response.sessionId);
    addMessage("assistant", response.assistantMessage);
    setPlan(response.plan);
    if (response.run) {
      setRun(response.run);
    }
  }

  async function submitChat(message = chatInput.trim()) {
    const text = message.trim();
    if (!text || isSubmitting) {
      return;
    }

    setChatInput("");
    setError(null);
    setRun(null);
    addMessage("user", text);
    setIsSubmitting(true);

    try {
      const response = await sendAssistantMessage(sessionId, text);
      applyAssistantResponse(response);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "AI Assistant 요청에 실패했습니다.");
      addMessage("assistant", "요청을 처리하지 못했습니다. 백엔드 연결과 로그인 상태를 확인해 주세요.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function executePlan() {
    if (!plan || isExecuting) {
      return;
    }

    setError(null);
    setIsExecuting(true);
    addMessage("user", "승인하고 실행해줘");

    try {
      const nextRun = await executeAssistantPlan(plan.id, true);
      setRun(nextRun);
      setPlan(null);
      addMessage("assistant", `${workflowTitleLabel(nextRun.title)} 실행을 완료했습니다. 보고서와 발송 상태를 아래에서 확인할 수 있습니다.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "실행에 실패했습니다.");
      addMessage("assistant", "실행 중 문제가 생겼습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsExecuting(false);
    }
  }

  return (
    <section className="rounded-xl border border-hairline bg-surface-plain p-6">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">AI Workflow Assistant</p>
      <h1 className="display-title mt-3 max-w-2xl text-5xl leading-tight md:text-6xl">
        자연어 업무를 실행 가능한 계획으로 바꿉니다
      </h1>
      <p className="mt-5 max-w-2xl text-base leading-7 text-body">
        OpenAI 연결 시 LLM이 업무 의도와 필요한 도구를 판단합니다. 키가 없으면 데모 플래너로 동작하고, 외부 발송은 실행 전 승인받습니다.
      </p>

      <div className="mt-8 overflow-hidden rounded-xl border border-hairline bg-canvas shadow-soft">
        <div className="border-b border-hairline bg-surface-card px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">AI 업무 채팅</p>
          <p className="mt-1 text-sm text-muted">업무 지시, 추가 정보 질문, 실행 계획 확인, 결과 확인이 한 흐름으로 이어집니다.</p>
        </div>

        <div className="max-h-[380px] space-y-4 overflow-y-auto px-4 py-5" ref={chatContainerRef}>
          {messages.map((message) => {
            const isUser = message.role === "user";
            const Icon = isUser ? UserRound : Bot;
            return (
              <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`} key={message.id}>
                {!isUser ? (
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-dark text-canvas">
                    <Icon className="h-4 w-4" />
                  </span>
                ) : null}
                <div
                  className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                    isUser ? "bg-primary text-white" : "bg-surface-plain text-body"
                  }`}
                >
                  {message.text}
                </div>
                {isUser ? (
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-card text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="border-t border-hairline bg-surface-plain p-3">
          <div className="flex gap-2 rounded-lg border border-hairline bg-canvas p-2 focus-within:border-primary">
            <textarea
              className="min-h-12 flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-6 text-ink outline-none"
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void submitChat();
                }
              }}
              aria-label="AI 업무 채팅 입력"
              placeholder="예: 이번 달 매출 보고서 만들어서 내 메일로 보내줘"
            />
            <button
              className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-primary text-white hover:bg-primary-active disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting || chatInput.trim().length === 0}
              onClick={() => void submitChat()}
              type="button"
              aria-label="메시지 보내기"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
          {error ? <p className="mt-3 text-sm font-semibold text-primary-active">{error}</p> : null}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {examples.map((example) => (
          <button
            className="inline-flex min-h-10 items-center gap-2 rounded-full bg-surface-card px-4 text-sm font-medium text-body hover:text-primary"
            key={example}
            onClick={() => void submitChat(example)}
            type="button"
          >
            <CheckCircle2 className="h-4 w-4" />
            {example}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {plan ? <PlanCard isExecuting={isExecuting} onExecute={() => void executePlan()} plan={plan} /> : null}
        {run ? <ResultCard run={run} /> : null}
      </div>
    </section>
  );
}

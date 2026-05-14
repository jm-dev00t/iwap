"use client";

import { ArrowUpRight, Bot, Loader2, Send, UserRound } from "lucide-react";
import { useState } from "react";
import { demoWorkflowRun, startWorkflow as requestStartWorkflow } from "@/lib/api";
import { statusLabel, workflowTitleLabel } from "@/lib/display-labels";
import { demoScenarios } from "@/lib/workflow-demo";

type WorkflowRunResponse = {
  id: string;
  title: string;
  status: string;
  events: Array<{ message: string }>;
  toolCalls: Array<{ toolName: string }>;
  approvals: Array<{ reason: string }>;
  artifacts: Array<{ id: string; title: string }>;
};

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
};

const defaultRequester = "manager@demo-company.com";
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function needsEmail(command: string) {
  const normalized = command.toLowerCase();
  return ["이메일", "메일", "email", "발송", "보내"].some((keyword) => normalized.includes(keyword));
}

function extractEmail(value: string) {
  return value
    .split(/\s+/)
    .map((part) => part.replace(/^[<({]+|[>),;:]+$/g, ""))
    .find((part) => emailPattern.test(part));
}

export function CommandCenter() {
  const [chatInput, setChatInput] = useState(demoScenarios[0].command);
  const [recipientEmail, setRecipientEmail] = useState<string | null>(null);
  const [pendingCommand, setPendingCommand] = useState<string | null>(null);
  const [selectedScenario, setSelectedScenario] = useState(demoScenarios[0].key);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "assistant-intro",
      role: "assistant",
      text: "자연어로 업무를 지시해 주세요. 이메일 발송이 필요한 업무라면 제가 받을 이메일을 먼저 물어보고 실행합니다.",
    },
  ]);
  const [run, setRun] = useState<WorkflowRunResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function addMessage(role: ChatMessage["role"], text: string) {
    setMessages((current) => [...current, { id: `${role}-${Date.now()}-${current.length}`, role, text }]);
  }

  async function startWorkflow(nextCommand: string, nextRecipientEmail: string | null) {
    setIsSubmitting(true);
    setError(null);

    const effectiveCommand = nextRecipientEmail ? `${nextCommand}\n수신 이메일: ${nextRecipientEmail}` : nextCommand;

    try {
      const result = await requestStartWorkflow(effectiveCommand, {
        scenarioKey: selectedScenario,
        requestedBy: nextRecipientEmail ?? defaultRequester,
      });
      setRun(result);
      addMessage(
        "assistant",
        `${workflowTitleLabel(result.title)} 실행을 시작했습니다. 결과 보고서와 전송 상태는 아래 산출물 카드에서 확인할 수 있습니다.`,
      );
    } catch (caught) {
      const fallbackRun = demoWorkflowRun(effectiveCommand);
      setRun(fallbackRun);
      setError(caught instanceof Error ? caught.message : "워크플로 요청에 실패했습니다");
      addMessage("assistant", "백엔드 응답이 늦어 데모 실행 결과로 이어서 보여줄게요. 실제 배포 환경에서는 같은 명령이 API 워크플로로 실행됩니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitChat() {
    const text = chatInput.trim();
    if (!text || isSubmitting) {
      return;
    }

    addMessage("user", text);
    setChatInput("");
    setError(null);

    if (pendingCommand) {
      const email = extractEmail(text);
      if (!email) {
        addMessage("assistant", "이메일 주소 형식으로 입력해 주세요. 예: manager@demo-company.com");
        return;
      }

      setRecipientEmail(email);
      setPendingCommand(null);
      addMessage("assistant", `${email}로 보낼게요. 지금 워크플로를 실행합니다.`);
      await startWorkflow(pendingCommand, email);
      return;
    }

    const inlineEmail = extractEmail(text);
    if (inlineEmail) {
      setRecipientEmail(inlineEmail);
    }

    if (needsEmail(text) && !inlineEmail && !recipientEmail) {
      setPendingCommand(text);
      addMessage("assistant", "이 업무는 이메일 발송이 필요해 보여요. 받을 이메일 주소를 알려주세요.");
      return;
    }

    addMessage("assistant", "좋아요. 입력한 자연어 명령을 워크플로로 변환해서 실행합니다.");
    await startWorkflow(text, inlineEmail ?? recipientEmail);
  }

  return (
    <section className="rounded-xl border border-hairline bg-surface-plain p-6">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">포트폴리오 데모</p>
      <h1 className="display-title mt-3 max-w-2xl text-5xl leading-tight md:text-6xl">
        자연어 명령을 실제 업무 자동화 흐름으로 바꿉니다
      </h1>
      <p className="mt-5 max-w-2xl text-base leading-7 text-body">
        아래 입력창은 AI 업무 채팅처럼 사용하는 실행 콘솔입니다. 완전한 자유 대화형 LLM 챗봇이라기보다는, 자연어 명령을 워크플로 실행으로
        연결하는 데모 인터페이스입니다.
      </p>

      <div className="mt-8 overflow-hidden rounded-xl border border-hairline bg-canvas shadow-soft">
        <div className="border-b border-hairline bg-surface-card px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">AI 업무 채팅</p>
          <p className="mt-1 text-sm text-muted">업무를 말하면 필요한 정보만 추가로 물어보고 실행합니다.</p>
        </div>

        <div className="max-h-[360px] space-y-4 overflow-y-auto px-4 py-5">
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
              placeholder={pendingCommand ? "받을 이메일 주소를 입력하세요" : "예: 이번 달 매출 보고서 만들어서 이메일로 보내줘"}
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
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm">
            <p className="text-muted">
              {recipientEmail ? `수신 이메일: ${recipientEmail}` : "이메일 발송이 필요하면 AI가 수신 이메일을 물어봅니다."}
            </p>
            {run ? <p className="font-medium text-ink">{workflowTitleLabel(run.title)} · {statusLabel(run.status)}</p> : null}
            {error ? <p className="font-medium text-primary-active">{error}</p> : null}
          </div>
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
                setChatInput(scenario.command);
                setSelectedScenario(scenario.key);
                setRun(null);
                setError(null);
                setPendingCommand(null);
                setMessages((current) => [
                  ...current,
                  {
                    id: `assistant-scenario-${scenario.key}-${Date.now()}`,
                    role: "assistant",
                    text: `"${scenario.label}" 예시 명령을 입력창에 넣어뒀습니다. 그대로 보내거나 문장을 바꿔서 지시해 주세요.`,
                  },
                ]);
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
        <div className="mt-6 grid gap-3 md:grid-cols-4">
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
          <a
            className="flex min-h-28 flex-col justify-between rounded-lg bg-surface-dark p-4 text-canvas transition hover:bg-primary"
            href="/reports"
          >
            <span className="text-xs font-medium uppercase tracking-[0.16em] text-canvas/70">산출물</span>
            <span className="text-lg font-semibold">{run.artifacts.length > 0 ? "생성 보고서 보기" : "보고서 화면 열기"}</span>
            <span className="text-sm text-canvas/70">전송 상태와 차트 확인</span>
          </a>
        </div>
      ) : null}
    </section>
  );
}

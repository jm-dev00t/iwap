"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, CircleAlert, Loader2, PlugZap, Save, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeading } from "@/components/page-heading";
import { demoTools, listTools, type ToolAdapter } from "@/lib/api";
import { statusLabel, toolLabel } from "@/lib/display-labels";

type ProviderMode = "MOCK" | "REAL";

type TestResult = {
  tone: "success" | "warning";
  message: string;
};

const providerModeLabels: Record<ProviderMode, string> = {
  MOCK: "모의 실행",
  REAL: "실제 연동",
};

const requiredEnvGroups = [
  {
    name: "AI 모델 연동",
    required: true,
    variables: ["AI 서비스 키", "AI 모델명"],
    note: "계획, 검증, 보고 에이전트의 실제 대형 언어 모델 호출에 필요합니다.",
  },
  {
    name: "슬랙",
    required: false,
    variables: ["슬랙 봇 토큰", "슬랙 채널 ID"],
    note: "보고서와 승인 알림을 슬랙 채널로 보낼 때 사용합니다.",
  },
  {
    name: "이메일",
    required: false,
    variables: ["메일 서버 주소", "메일 서버 포트", "메일 계정", "메일 비밀번호", "발신자 주소"],
    note: "경영진 보고서와 고객 안내 메일 발송에 필요합니다.",
  },
  {
    name: "카카오워크",
    required: false,
    variables: ["카카오워크 웹훅 주소"],
    note: "구매팀, 운영팀 알림을 카카오워크로 보낼 때 연결합니다.",
  },
  {
    name: "고객 관리 시스템",
    required: false,
    variables: ["고객 관리 시스템 주소", "고객 관리 시스템 키"],
    note: "고객 등록, 영업 활동 기록을 실제 고객 관리 시스템에 반영할 때 필요합니다.",
  },
];

const toolEnvHints: Record<string, string[]> = {
  slack: ["슬랙 봇 토큰", "슬랙 채널 ID"],
  email: ["메일 서버 주소", "메일 계정", "메일 비밀번호"],
  kakao: ["카카오워크 웹훅 주소"],
  kakaowork: ["카카오워크 웹훅 주소"],
  crm: ["고객 관리 시스템 주소", "고객 관리 시스템 키"],
  "report-generator": ["AI 서비스 키", "AI 모델명"],
  "sales-data": ["데이터베이스 주소 또는 샘플 파일 경로"],
  inventory: ["데이터베이스 주소 또는 재고 시스템 연동 키"],
};

function normalizeMode(mode: string): ProviderMode {
  return mode.toUpperCase() === "REAL" ? "REAL" : "MOCK";
}

function statusTone(status: string) {
  const normalized = status.toUpperCase();
  if (normalized.includes("READY") || normalized.includes("OK") || normalized.includes("UP")) {
    return "bg-success/10 text-success";
  }
  if (normalized.includes("ERROR") || normalized.includes("FAIL")) {
    return "bg-error/10 text-error";
  }
  return "bg-warning/10 text-warning";
}

function envHintsFor(toolName: string) {
  const key = toolName.toLowerCase();
  return toolEnvHints[key] ?? ["해당 어댑터의 연동 설정값"];
}

export default function SettingsPage() {
  const [mode, setMode] = useState<ProviderMode>("MOCK");
  const [savedMessage, setSavedMessage] = useState("");
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});

  const { data, isError, isLoading, isFetching } = useQuery({
    queryKey: ["tools"],
    queryFn: listTools,
  });

  const sourceLabel = isLoading
    ? "도구 등록 정보 조회 중"
    : isError
      ? "백엔드 미연결: 데모 어댑터로 전환됨"
      : data && data.length > 0
        ? "도구 등록 정보 연결됨"
        : "등록된 어댑터 없음: 데모 어댑터 표시";

  const tools = useMemo<ToolAdapter[]>(() => {
    const registryTools = data && data.length > 0 ? data : demoTools();
    return registryTools.map((tool) => ({
      ...tool,
      providerMode: mode,
      status: mode === "MOCK" ? "READY" : tool.status || "NEEDS_ENV",
    }));
  }, [data, mode]);

  function switchMode(nextMode: ProviderMode) {
    setMode(nextMode);
    setSavedMessage("");
    setTestResults({});
  }

  function testConnection(tool: ToolAdapter) {
    const hints = envHintsFor(tool.name);
    setSavedMessage("");
    setTestResults((current) => ({
      ...current,
      [tool.name]:
        mode === "MOCK"
          ? {
              tone: "success",
              message: `${toolLabel(tool.name)} 모의 어댑터가 정상 응답했습니다.`,
            }
          : {
              tone: "warning",
              message: `실제 연동 전 ${hints.join(", ")} 환경변수를 설정해야 합니다.`,
            },
    }));
  }

  function saveSettings() {
    setSavedMessage(`${providerModeLabels[mode]} 데모 설정을 저장했습니다. 실제 서버 설정은 변경하지 않았습니다.`);
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-[1200px] px-5 py-8 md:px-8">
        <PageHeading
          eyebrow="연동 설정"
          title="어댑터 실행 모드를 관리합니다"
          description="포트폴리오 데모용 설정 콘솔입니다. 모의 실행과 실제 연동 모드를 전환하고, 어댑터 연결 테스트와 환경변수 준비 상태를 한 화면에서 확인할 수 있습니다."
        />

        <section className="mt-6 rounded-lg border border-hairline bg-surface-plain p-4 shadow-soft">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-surface-card px-3 py-1 text-sm font-medium text-body">
                  {sourceLabel}
                </span>
                {isFetching ? <Loader2 className="h-4 w-4 animate-spin text-primary" aria-label="refreshing" /> : null}
              </div>
              <p className="mt-2 text-sm leading-6 text-muted">
                이 페이지의 모드 변경, 연결 테스트, 저장 상태는 브라우저 로컬 상태로만 동작합니다.
              </p>
            </div>

            <div className="grid w-full grid-cols-2 rounded-md bg-surface-card p-1 md:w-[260px]" aria-label="연동 모드">
              {(["MOCK", "REAL"] as const).map((item) => (
                <button
                  className={`min-h-10 rounded px-3 text-sm font-semibold transition ${
                    mode === item ? "bg-surface-dark text-canvas shadow-soft" : "text-body hover:bg-surface-plain"
                  }`}
                  key={item}
                  onClick={() => switchMode(item)}
                  type="button"
                >
                  {providerModeLabels[item]}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tools.map((tool) => {
            const configuredMode = normalizeMode(tool.providerMode);
            const result = testResults[tool.name];

            return (
              <article className="rounded-lg border border-hairline bg-surface-plain p-5 shadow-soft" key={tool.name}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-words text-base font-semibold text-ink">{toolLabel(tool.name)}</p>
                    <p className="mt-1 text-sm text-muted">{providerModeLabels[configuredMode]}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-1 font-mono text-xs ${statusTone(tool.status)}`}>
                    {statusLabel(tool.status)}
                  </span>
                </div>

                <div className="mt-4 rounded-md bg-surface-soft p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">필요 환경변수</p>
                  <p className="mt-2 break-words font-mono text-xs leading-5 text-body">{envHintsFor(tool.name).join(" / ")}</p>
                </div>

                {result ? (
                  <div
                    className={`mt-4 rounded-md p-3 text-sm leading-6 ${
                      result.tone === "success" ? "bg-success/10 text-body" : "bg-warning/10 text-body"
                    }`}
                  >
                    <div className="flex gap-2">
                      {result.tone === "success" ? (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      ) : (
                        <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                      )}
                      <span>{result.message}</span>
                    </div>
                  </div>
                ) : null}

                <button
                  className="mt-5 flex min-h-10 w-full items-center justify-center gap-2 rounded-md bg-surface-dark px-4 text-sm font-semibold text-canvas transition hover:bg-surface-dark-elevated"
                  onClick={() => testConnection(tool)}
                  type="button"
                >
                  <PlugZap className="h-4 w-4" />
                  연결 테스트
                </button>
              </article>
            );
          })}
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="rounded-lg border border-hairline bg-surface-plain p-5 shadow-soft">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-ink">환경변수 체크리스트</h2>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {requiredEnvGroups.map((group) => (
                <div className="rounded-md bg-surface-soft p-4" key={group.name}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink">{group.name}</p>
                      <p className="mt-1 text-sm leading-6 text-muted">{group.note}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-surface-plain px-2 py-1 text-xs font-medium text-body">
                      {group.required ? "필수" : "선택"}
                    </span>
                  </div>
                  <ul className="mt-3 space-y-2">
                    {group.variables.map((variable) => (
                      <li className="flex gap-2 text-sm text-body" key={variable}>
                        <CheckCircle2
                          className={`mt-0.5 h-4 w-4 shrink-0 ${mode === "MOCK" ? "text-success" : "text-warning"}`}
                        />
                        <span className="break-all font-mono text-xs">{variable}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-lg bg-surface-dark p-5 text-canvas shadow-soft">
            <p className="text-sm font-semibold text-amber">데모 저장</p>
            <h2 className="display-title mt-2 text-3xl leading-tight">설정 변경을 시연합니다</h2>
            <p className="mt-3 text-sm leading-6 text-[#c8c2b8]">
              저장 버튼은 실제 서버를 호출하지 않고 현재 화면의 데모 상태만 확정합니다. 배포 환경에서도 안전하게 누를 수 있습니다.
            </p>
            {savedMessage ? (
              <div className="mt-4 rounded-md bg-surface-dark-elevated p-3 text-sm leading-6 text-canvas">
                {savedMessage}
              </div>
            ) : null}
            <button
              className="mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-active"
              onClick={saveSettings}
              type="button"
            >
              <Save className="h-4 w-4" />
              저장
            </button>
          </aside>
        </section>
      </div>
    </AppShell>
  );
}

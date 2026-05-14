import { AgentTimeline } from "@/components/agent-timeline";
import { AppShell } from "@/components/app-shell";
import { CommandCenter } from "@/components/command-center";
import { WorkflowDashboard } from "@/components/workflow-dashboard";

const approvalItems = [
  { title: "구매팀 발송 승인", meta: "재고 부족 알림 · 대기", detail: "재고 부족 SKU 7건을 구매팀에 보내기 전 담당자 확인이 필요합니다." },
  { title: "외부 고객 이메일 검토", meta: "신규 고객 온보딩 · 준비", detail: "환영 메일 본문과 고객 관리 기록 내용을 발송 전 검토합니다." },
];

const historyItems = [
  { title: "월간 매출 보고서 생성", meta: "완료 · manager@demo-company.com" },
  { title: "신규 고객 온보딩", meta: "완료 · sales@demo-company.com" },
  { title: "재고 부족 알림", meta: "승인 대기 · operator@demo-company.com" },
];

const reportItems = [
  { label: "매출 리포트", value: "마크다운/PDF 산출물 준비" },
  { label: "감사 로그", value: "요청자, 에이전트, 도구 호출 추적" },
  { label: "운영 지표", value: "실행 수, 승인 대기, 실패율 확인" },
];

export default function Home() {
  return (
    <AppShell>
      <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-5 py-6 md:px-8 lg:py-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted">하이브리드 업무 자동화 플랫폼</p>
            <p className="text-lg font-semibold text-ink">지능형 워크플로 자동화 플랫폼</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-hairline bg-surface-plain px-3 py-2 text-sm text-body">
            <span className="h-2 w-2 rounded-full bg-teal" />
            데모 작업공간 연결됨
          </div>
        </header>

        <section id="command" className="scroll-mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <CommandCenter />
          <AgentTimeline />
        </section>

        <section id="workflows" className="scroll-mt-6">
          <WorkflowDashboard />
        </section>

        <section id="approvals" className="scroll-mt-6 rounded-xl border border-hairline bg-surface-plain p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">승인함</p>
              <h2 className="display-title mt-2 text-3xl">사람 확인이 필요한 자동화</h2>
            </div>
            <span className="rounded-full bg-surface-card px-3 py-1 text-sm text-body">2건 대기</span>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {approvalItems.map((item) => (
              <article className="rounded-lg bg-surface-card p-4" key={item.title}>
                <p className="text-sm font-semibold text-ink">{item.title}</p>
                <p className="mt-1 text-xs font-medium text-primary">{item.meta}</p>
                <p className="mt-3 text-sm leading-6 text-body">{item.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="history" className="scroll-mt-6 rounded-xl border border-hairline bg-surface-plain p-6">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">실행 이력</p>
          <h2 className="display-title mt-2 text-3xl">최근 실행 이력</h2>
          <div className="mt-5 divide-y divide-hairline">
            {historyItems.map((item) => (
              <article className="flex flex-wrap items-center justify-between gap-3 py-4" key={item.title}>
                <p className="text-sm font-semibold text-ink">{item.title}</p>
                <p className="font-mono text-xs text-muted">{item.meta}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="reports" className="scroll-mt-6 rounded-xl border border-hairline bg-surface-plain p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">보고서</p>
              <h2 className="display-title mt-2 text-3xl">시연 산출물과 운영 리포트</h2>
            </div>
            <a className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary-active" href="/reports">
              보고서 콘솔 열기
            </a>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {reportItems.map((item) => (
              <article className="rounded-lg bg-surface-card p-4" key={item.label}>
                <p className="text-sm font-medium text-muted">{item.label}</p>
                <p className="mt-3 text-sm leading-6 text-ink">{item.value}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="settings" className="scroll-mt-6 rounded-xl border border-hairline bg-surface-plain p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">설정</p>
              <h2 className="display-title mt-2 text-3xl">데모 환경 설정</h2>
            </div>
            <a className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary-active" href="/settings">
              설정 콘솔 열기
            </a>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <article className="rounded-lg bg-surface-card p-4">
              <p className="text-sm font-medium text-muted">AI 제공 방식</p>
              <p className="mt-3 text-sm font-semibold text-ink">모의 실행</p>
            </article>
            <article className="rounded-lg bg-surface-card p-4">
              <p className="text-sm font-medium text-muted">연동 모드</p>
              <p className="mt-3 text-sm font-semibold text-ink">모의 연동</p>
            </article>
            <article className="rounded-lg bg-surface-card p-4">
              <p className="text-sm font-medium text-muted">연동 기본 주소</p>
              <p className="mt-3 break-all font-mono text-xs text-ink">http://localhost:8080</p>
            </article>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

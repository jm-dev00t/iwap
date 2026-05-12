"use client";

import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { PageHeading } from "@/components/page-heading";
import { demoTools, listTools } from "@/lib/api";

export default function SettingsPage() {
  const { data, isError } = useQuery({
    queryKey: ["tools"],
    queryFn: listTools,
  });
  const tools = data && data.length > 0 ? data : demoTools();

  return (
    <AppShell>
      <div className="mx-auto max-w-[1200px] px-5 py-8 md:px-8">
        <PageHeading
          eyebrow="Integration Settings"
          title="Mock에서 실제 기업 연동으로 전환합니다"
          description="Email, Slack, KakaoWork, CRM, ERP, Google Sheets 어댑터를 환경 변수와 Provider 설정으로 교체할 수 있는 구조입니다."
        />
        <div className="mt-4 rounded-full bg-surface-card px-4 py-2 text-sm text-body">
          {isError ? "Backend 미연결: 데모 Tool Adapter 표시 중" : "Tool Registry API"}
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {tools.map((tool) => (
            <article className="rounded-lg bg-surface-card p-5" key={tool.name}>
              <p className="text-sm font-semibold text-ink">{tool.name}</p>
              <p className="mt-2 text-sm text-body">{tool.providerMode} provider</p>
              <p className="mt-1 font-mono text-xs text-muted">{tool.status}</p>
            </article>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

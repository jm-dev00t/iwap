"use client";

import { useQuery } from "@tanstack/react-query";
import { FileText } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeading } from "@/components/page-heading";
import { demoScenarioFallback, listDemoScenarios } from "@/lib/api";

export default function DemoPage() {
  const { data, isError } = useQuery({
    queryKey: ["demo-scenarios"],
    queryFn: listDemoScenarios,
  });
  const scenarios = data && data.length > 0 ? data : demoScenarioFallback();

  return (
    <AppShell>
      <div className="mx-auto max-w-[1200px] px-5 py-8 md:px-8">
        <PageHeading
          eyebrow="Scenario Walkthrough"
          title="고객이 바로 이해하는 4개 업무 시나리오"
          description="위시켓과 이력서에서 설명하기 좋은 반복 업무 자동화 사례를 버튼형 데모로 구성했습니다."
        />
        <div className="mt-4 rounded-full bg-surface-card px-4 py-2 text-sm text-body">
          {isError ? "Backend 미연결: 데모 시나리오 표시 중" : "Demo Scenario API"}
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {scenarios.map((scenario) => (
            <article className="rounded-lg bg-surface-card p-5" key={scenario.key}>
              <div className="grid h-10 w-10 place-items-center rounded-md bg-canvas text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-ink">{scenario.title}</h2>
              <p className="mt-2 text-sm leading-6 text-body">{scenario.command}</p>
              <p className="mt-3 text-sm leading-6 text-muted">{scenario.businessValue}</p>
            </article>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

// 보고서 생성에 사용된 원본 데이터 소스를 탭별로 표시하는 뷰어 페이지
"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { listDataSources, DataSourceResult } from "@/lib/api";
import { AppShell } from "@/components/app-shell";

export default function DataPage() {
  const { data: sources = [], isLoading } = useQuery({
    queryKey: ["data-sources"],
    queryFn: listDataSources,
  });

  const [activeType, setActiveType] = useState<string | null>(null);
  const active: DataSourceResult | undefined =
    sources.find((s) => s.type === (activeType ?? sources[0]?.type));

  if (isLoading) {
    return (
      <AppShell>
        <div className="p-8 text-muted text-sm">데이터 소스 불러오는 중...</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-6 md:p-8 space-y-6">
        <div>
          <h1 className="text-xl font-semibold">데이터 소스</h1>
          <p className="mt-1 text-sm text-muted">보고서 생성에 사용된 원본 데이터입니다.</p>
        </div>

        {/* 탭 */}
        <div className="flex gap-2 border-b border-hairline">
          {sources.map((source) => (
            <button
              key={source.type}
              onClick={() => setActiveType(source.type)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                (activeType ?? sources[0]?.type) === source.type
                  ? "border-action text-action"
                  : "border-transparent text-muted hover:text-body"
              }`}
            >
              {source.label}
            </button>
          ))}
        </div>

        {/* 테이블 */}
        {active && (
          <div className="rounded-lg border border-hairline bg-surface-card overflow-hidden">
            <div className="px-4 py-3 border-b border-hairline flex items-center justify-between">
              <span className="text-sm font-medium">{active.label}</span>
              <span className="text-xs text-muted">{active.rowCount}개 행</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-soft">
                    {active.headers.map((header) => (
                      <th
                        key={header}
                        className="px-4 py-2 text-left text-xs font-medium text-muted uppercase tracking-wide"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {active.rows.map((row, i) => (
                    <tr key={i} className="border-t border-hairline hover:bg-surface-soft">
                      {row.map((cell, j) => (
                        <td key={j} className="px-4 py-2 text-body">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

const metrics = [
  { label: "오늘 실행", value: "18", note: "4개 시나리오 데모 포함" },
  { label: "승인 대기", value: "3", note: "구매/외부 발송 검토" },
  { label: "Tool Calls", value: "74", note: "Mock + Real provider ready" },
];

export function WorkflowDashboard() {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      {metrics.map((metric) => (
        <article className="rounded-lg bg-surface-card p-5" key={metric.label}>
          <p className="text-sm font-medium text-muted">{metric.label}</p>
          <p className="display-title mt-3 text-4xl">{metric.value}</p>
          <p className="mt-2 text-sm leading-6 text-body">{metric.note}</p>
        </article>
      ))}
    </section>
  );
}

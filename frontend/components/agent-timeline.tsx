import { statusIcon, timelineEvents } from "@/lib/workflow-demo";

const statusStyle = {
  completed: "bg-success text-ink",
  running: "bg-primary text-white",
  waiting: "bg-surface-dark-elevated text-muted",
};

export function AgentTimeline() {
  return (
    <section className="rounded-xl bg-surface-dark p-6 text-canvas">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-teal">Live Agent Graph</p>
          <h2 className="display-title mt-2 text-3xl">Multi-agent execution</h2>
        </div>
        <span className="rounded-full bg-surface-dark-elevated px-3 py-1 text-xs text-teal">streaming</span>
      </div>

      <div className="mt-6 space-y-3">
        {timelineEvents.map((event) => {
          const Icon = statusIcon[event.status];
          return (
            <article className="rounded-lg bg-surface-dark-elevated p-4" key={`${event.agent}-${event.title}`}>
              <div className="flex items-start gap-3">
                <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${statusStyle[event.status]}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-canvas">{event.agent}</p>
                    <p className="font-mono text-xs text-muted">{event.time}</p>
                  </div>
                  <p className="mt-1 text-sm font-medium text-canvas">{event.title}</p>
                  <p className="mt-1 text-sm leading-6 text-[#a09d96]">{event.detail}</p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

import { AgentTimeline } from "@/components/agent-timeline";
import { AppShell } from "@/components/app-shell";
import { CommandCenter } from "@/components/command-center";
import { WorkflowDashboard } from "@/components/workflow-dashboard";

export default function Home() {
  return (
    <AppShell>
      <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-5 py-6 md:px-8 lg:py-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted">Hybrid SaaS/SI Automation Platform</p>
            <p className="text-lg font-semibold text-ink">Intelligent Workflow Automation Platform</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-hairline bg-surface-plain px-3 py-2 text-sm text-body">
            <span className="h-2 w-2 rounded-full bg-teal" />
            Demo workspace connected
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <CommandCenter />
          <AgentTimeline />
        </div>

        <WorkflowDashboard />
      </div>
    </AppShell>
  );
}

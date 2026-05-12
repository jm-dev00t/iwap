import { BarChart3, CheckSquare, History, LayoutDashboard, MessageSquareText, Settings } from "lucide-react";

const navItems = [
  { label: "Command", href: "/", icon: MessageSquareText },
  { label: "Workflows", href: "/workflows", icon: LayoutDashboard },
  { label: "Approvals", href: "/approvals", icon: CheckSquare },
  { label: "History", href: "/history", icon: History },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-hairline bg-surface-soft px-5 py-6 lg:block">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-surface-dark text-canvas">IW</div>
          <div>
            <p className="text-sm font-semibold">IWAP</p>
            <p className="text-xs text-muted">AI Workflow Console</p>
          </div>
        </div>
        <nav className="mt-10 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <a
                className="flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-body hover:bg-surface-card"
                href={item.href}
                key={item.label}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </a>
            );
          })}
        </nav>
      </aside>
      <main className="lg:pl-64">{children}</main>
    </div>
  );
}

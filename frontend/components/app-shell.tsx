import { BarChart3, CheckSquare, History, LayoutDashboard, MessageSquareText, Settings } from "lucide-react";
import Link from "next/link";

const navItems = [
  { label: "명령 센터", href: "/", icon: MessageSquareText },
  { label: "워크플로", href: "/workflows", icon: LayoutDashboard },
  { label: "승인함", href: "/approvals", icon: CheckSquare },
  { label: "이력", href: "/history", icon: History },
  { label: "보고서", href: "/reports", icon: BarChart3 },
  { label: "설정", href: "/settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-hairline bg-surface-soft px-5 py-6 lg:block">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-surface-dark text-canvas">IW</div>
          <div>
            <p className="text-sm font-semibold">IWAP</p>
            <p className="text-xs text-muted">AI 업무 자동화 콘솔</p>
          </div>
        </div>
        <nav className="mt-10 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                className="flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-body hover:bg-surface-card"
                href={item.href}
                key={item.label}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="border-b border-hairline bg-surface-soft px-4 py-3 lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <Link className="flex items-center gap-2" href="/">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-surface-dark text-sm text-canvas">IW</span>
            <span className="text-sm font-semibold">IWAP</span>
          </Link>
          <nav className="flex max-w-[72vw] gap-1 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  aria-label={item.label}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-body hover:bg-surface-card"
                  href={item.href}
                  key={item.label}
                >
                  <Icon className="h-4 w-4" />
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
      <main className="lg:pl-64">{children}</main>
    </div>
  );
}

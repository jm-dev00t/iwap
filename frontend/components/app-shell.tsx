"use client";

import { BarChart3, CheckSquare, History, LayoutDashboard, MessageSquareText, Settings, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { currentDemoSession, demoLogin, type DemoAuthSession } from "@/lib/api";

const navItems = [
  { label: "Command", href: "/", icon: MessageSquareText },
  { label: "Workflows", href: "/workflows", icon: LayoutDashboard },
  { label: "Approvals", href: "/approvals", icon: CheckSquare },
  { label: "History", href: "/history", icon: History },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<DemoAuthSession | null>(null);

  useEffect(() => {
    const existing = currentDemoSession();
    if (existing) {
      setSession(existing);
      return;
    }
    demoLogin("MANAGER")
      .then(setSession)
      .catch(() => setSession(null));
  }, []);

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
        <div className="absolute bottom-6 left-5 right-5 rounded-lg border border-hairline bg-surface-card p-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="h-4 w-4 text-primary" />
            {session?.displayName ?? "Demo Login"}
          </div>
          <p className="mt-1 text-xs text-muted">
            {session ? `${session.email} · ${session.roles.join(", ")}` : "Preparing manager token"}
          </p>
        </div>
      </aside>
      <main className="lg:pl-64">{children}</main>
    </div>
  );
}

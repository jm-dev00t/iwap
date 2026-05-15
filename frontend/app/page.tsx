"use client";

import { AppShell } from "@/components/app-shell";
import { CommandCenter } from "@/components/command-center";

export default function Home() {
  return (
    <AppShell>
      <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-5 py-6 md:px-8 lg:py-8">
        <CommandCenter />
      </div>
    </AppShell>
  );
}

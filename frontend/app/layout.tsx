import type { Metadata } from "next";
import { QueryProvider } from "@/components/query-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "IWAP | Intelligent Workflow Automation Platform",
  description: "Portfolio-grade multi-agent workflow automation platform for SMB operations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}

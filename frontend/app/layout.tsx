import type { Metadata } from "next";
import { QueryProvider } from "@/components/query-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "IWAP | 지능형 업무 자동화 플랫폼",
  description: "중소기업 운영 업무를 위한 다중 에이전트 워크플로 자동화 포트폴리오 데모입니다.",
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

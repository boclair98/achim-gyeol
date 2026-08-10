import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { PwaRegister } from "@/components/PwaRegister";

import "./globals.css";

export const metadata: Metadata = {
  title: "아침결 — 놓친 하루를 5분 안에",
  description: "복수 출처와 검증 상태를 함께 보여주는 책임 있는 AI 모닝 브리핑.",
  manifest: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/manifest.webmanifest`,
  applicationName: "아침결",
  appleWebApp: { capable: true, title: "아침결", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#f7f7f5",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}

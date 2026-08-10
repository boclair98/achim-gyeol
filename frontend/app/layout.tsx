import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { PwaRegister } from "@/components/PwaRegister";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://achim-gyeol.coders.kr"),
  title: "아침결 — 놓친 하루를 5분 안에",
  description: "복수 출처와 검증 상태를 함께 보여주는 책임 있는 AI 모닝 브리핑.",
  manifest: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/manifest.webmanifest`,
  applicationName: "아침결",
  appleWebApp: { capable: true, title: "아침결", statusBarStyle: "default" },
  openGraph: {
    title: "아침결 — 어제의 이슈, 오늘 감각으로",
    description: "복수 출처로 확인한 핵심 뉴스만 5분 안에.",
    images: ["/hero-mz.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "아침결 — 어제의 이슈, 오늘 감각으로",
    description: "복수 출처로 확인한 핵심 뉴스만 5분 안에.",
    images: ["/hero-mz.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#101d32",
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

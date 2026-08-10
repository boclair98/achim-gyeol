import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { PwaRegister } from "@/components/PwaRegister";

import "./globals.css";
import "./enterprise.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://boclair98.github.io/achim-gyeol-pages";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const socialImageUrl = new URL("og.png", `${siteUrl.replace(/\/$/, "")}/`).toString();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "아침결 — 매일 아침 도착하는 AI 뉴스 요약 카드",
  description: "핵심 뉴스의 AI 3줄 요약, 중요성, 출처와 검증 상태를 카드 묶음으로 전달하는 모닝 브리핑.",
  manifest: `${basePath}/manifest.webmanifest`,
  applicationName: "아침결",
  appleWebApp: { capable: true, title: "아침결", statusBarStyle: "default" },
  openGraph: {
    title: "아침결 — 뉴스 요약 카드가 매일 아침 도착해요",
    description: "뉴스별 AI 3줄 요약과 출처를 넘겨 보는 카드 묶음으로 받아보세요.",
    images: [{ url: socialImageUrl, width: 1792, height: 896, alt: "아침결 뉴스룸 브리핑 OS" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "아침결 — 뉴스 요약 카드가 매일 아침 도착해요",
    description: "뉴스별 AI 3줄 요약과 출처를 넘겨 보는 카드 묶음으로 받아보세요.",
    images: [socialImageUrl],
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

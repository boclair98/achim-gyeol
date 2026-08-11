import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { PwaRegister } from "@/components/PwaRegister";

import "./globals.css";
import "./enterprise.css";
import "./landing.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://morningnews.coders.kr";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const socialImageUrl = new URL("og-v2.png", `${siteUrl.replace(/\/$/, "")}/`).toString();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "아침결 — 어제 뉴스를 매일 아침 한 번에",
  description: "전날 주요 뉴스를 교차 확인하고 AI로 짧게 요약해 원하는 시간에 PWA 알림으로 전하는 무료 뉴스 브리핑.",
  manifest: `${basePath}/manifest.webmanifest`,
  applicationName: "아침결",
  appleWebApp: { capable: true, title: "아침결", statusBarStyle: "default" },
  openGraph: {
    title: "아침결 — 어제 뉴스를 매일 아침 한 번에",
    description: "출처를 확인한 전날의 핵심 뉴스를 짧은 카드로 받아보세요.",
    images: [{ url: socialImageUrl, width: 1792, height: 896, alt: "아침결 AI 뉴스 브리핑" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "아침결 — 어제 뉴스를 매일 아침 한 번에",
    description: "출처를 확인한 전날의 핵심 뉴스를 짧은 카드로 받아보세요.",
    images: [socialImageUrl],
  },
};

export const viewport: Viewport = {
  themeColor: "#18b779",
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

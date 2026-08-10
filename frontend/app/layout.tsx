import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { PwaRegister } from "@/components/PwaRegister";

import "./globals.css";
import "./enterprise.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://boclair98.github.io/Moring_news";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const socialImageUrl = new URL("og-v2.png", `${siteUrl.replace(/\/$/, "")}/`).toString();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "아침결 — 독자 경험부터 편집 책임까지 연결하는 뉴스룸 브리핑 OS",
  description: "개인화 뉴스 카드, 검색 가능한 보관함, 주장별 근거 검수와 사람의 최종 승인을 연결하는 화이트라벨 브리핑 운영체제.",
  manifest: `${basePath}/manifest.webmanifest`,
  applicationName: "아침결",
  appleWebApp: { capable: true, title: "아침결", statusBarStyle: "default" },
  openGraph: {
    title: "아침결 — 읽는 경험부터 편집 책임까지, 한 번에",
    description: "개인화 · 근거 검수 · 사람의 승인을 연결하는 Newsroom Briefing OS",
    images: [{ url: socialImageUrl, width: 1792, height: 896, alt: "아침결 뉴스룸 브리핑 OS" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "아침결 — 읽는 경험부터 편집 책임까지, 한 번에",
    description: "개인화 · 근거 검수 · 사람의 승인을 연결하는 Newsroom Briefing OS",
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

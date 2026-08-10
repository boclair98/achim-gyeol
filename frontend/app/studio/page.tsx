import type { Metadata } from "next";
import { EditorialStudio } from "@/components/EditorialStudio";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

export const metadata: Metadata = {
  title: "편집 스튜디오 | 아침결 Briefing OS",
  description: "뉴스 검증, 승인, 정정, 브랜딩, 발송 계획과 성과를 관리하는 화이트라벨 편집 스튜디오",
};

export default function StudioPage() {
  return (
    <main className="enterprise-shell">
      <SiteHeader context="EDITORIAL WORKSPACE" />
      <EditorialStudio />
      <SiteFooter />
    </main>
  );
}

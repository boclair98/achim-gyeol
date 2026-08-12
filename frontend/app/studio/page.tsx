import type { Metadata } from "next";
import { EditorialStudio } from "@/components/EditorialStudio";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

export const metadata: Metadata = {
  title: "편집 스튜디오 시제품 | 아침결",
  description: "실제 운영과 연결되지 않은 편집 승인·브랜딩 워크플로 UI 시제품",
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

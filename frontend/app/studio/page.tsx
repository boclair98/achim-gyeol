import type { Metadata } from "next";
import { OperationsConsole } from "@/components/OperationsConsole";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import "../enterprise.css";

export const metadata: Metadata = {
  title: "운영 스튜디오 | 아침결",
  description: "뉴스 검수, 승인, 발송과 익명 지표를 관리하는 아침결 운영자 화면",
};

export default function StudioPage() {
  return (
    <main className="enterprise-shell">
      <SiteHeader context="EDITORIAL WORKSPACE" />
      <OperationsConsole />
      <SiteFooter />
    </main>
  );
}

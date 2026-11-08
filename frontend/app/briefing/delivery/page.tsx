import type { Metadata } from "next";
import { ReceivedBriefing } from "@/components/ReceivedBriefing";

export const metadata: Metadata = {
  title: "받은 뉴스레터 — 아침결",
  description: "받은 아침결 뉴스레터에서 기사 제목을 누르고 핵심 요약부터 읽어보세요.",
  robots: { index: false, follow: true },
};

export default function ReceivedBriefingPage() {
  return <ReceivedBriefing />;
}

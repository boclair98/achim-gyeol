import type { Metadata } from "next";
import { ReceivedMailPreview } from "@/components/ReceivedMailPreview";

export const metadata: Metadata = {
  title: "메일 디자인 미리보기 — 아침결",
  robots: { index: false, follow: false },
};

export default function ReceivedMailPreviewPage() {
  return <ReceivedMailPreview />;
}

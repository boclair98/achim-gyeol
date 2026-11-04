import type { Metadata } from "next";
import { ReaderPrototype } from "@/components/prototype/ReaderPrototype";

export const metadata: Metadata = {
  title: "아침결 · 리더 디자인 미리보기",
  description: "2026년 9월 16일 보관 브리핑을 활용한 로컬 디자인 프로토타입입니다.",
  robots: { index: false, follow: false },
};

export default function PrototypePage() {
  return <ReaderPrototype />;
}

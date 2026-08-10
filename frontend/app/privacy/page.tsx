import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

export const metadata: Metadata = { title: "개인정보처리방침 | 아침결", description: "아침결 구독 및 발송 서비스의 개인정보 처리 원칙" };

export default function PrivacyPage() {
  return <main className="enterprise-shell"><SiteHeader context="PRIVACY POLICY" /><LegalDocument title="개인정보처리방침" updated="시행 예정일 2026년 8월 10일 · 상용 계약 시 사업자·수탁사 정보 확정">
    <section><h2>1. 처리 원칙</h2><p>아침결은 브리핑 구독과 발송에 필요한 최소한의 정보만 처리하며, 목적이 끝난 정보는 지체 없이 파기하는 것을 기본으로 합니다. 데모 배포본은 서버에 구독자 개인정보를 저장하지 않습니다.</p></section>
    <section><h2>2. 처리 항목과 목적</h2><table><thead><tr><th>항목</th><th>목적</th><th>보유 기준</th></tr></thead><tbody><tr><td>이메일 주소 또는 채널 식별자</td><td>브리핑 발송·도달 확인</td><td>구독 철회 시까지</td></tr><tr><td>발송 시간·관심 분야</td><td>맞춤 발송</td><td>구독 철회 시까지</td></tr><tr><td>동의 시각·경로·철회 이력</td><td>수신 동의 증빙</td><td>관계 법령 및 분쟁 대응 기간</td></tr><tr><td>열람·원문 클릭 이벤트</td><td>서비스 품질 개선</td><td>통계 처리 후 원본 삭제</td></tr></tbody></table></section>
    <section><h2>3. 제3자 제공과 처리 위탁</h2><p>실제 운영 시 이메일·푸시·메신저 발송사와 클라우드 사업자를 수탁사로 고지하고 계약을 통해 안전조치와 재위탁 조건을 관리합니다. API가 연결되지 않은 현재 데모에는 외부 제공이 발생하지 않습니다.</p></section>
    <section><h2>4. 이용자의 권리</h2><p>구독자는 언제든 수신 설정 확인, 수정, 철회, 삭제를 요청할 수 있습니다. 모든 전달물에는 수신 설정 또는 해지 경로를 제공합니다.</p></section>
    <section><h2>5. 안전조치</h2><p>접근 권한 최소화, 비밀정보 분리, 전송 구간 암호화, 감사 로그, 백업·복구, 보안 사고 대응 절차를 운영 기준에 포함합니다.</p></section>
    <section><h2>6. 책임자와 문의</h2><p>상용 계약 전 고객사별 개인정보 보호책임자와 처리 담당자, 국내외 수탁사, 권리 행사 창구를 확정하여 게시해야 합니다. 데모 문의: privacy@achim-gyeol.example</p></section>
  </LegalDocument><SiteFooter /></main>;
}

function LegalDocument({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return <article className="legal-document"><header><span>LEGAL DOCUMENT</span><h1>{title}</h1><p>{updated}</p></header><div className="legal-notice"><strong>상용화 전 확인</strong><p>이 문서는 제품 동작과 고지 구조를 검토하기 위한 운영 초안입니다. 실제 사업자, 콘텐츠 계약, 수탁사와 적용 법률에 맞춰 법률 검토 후 확정해야 합니다.</p></div>{children}</article>;
}

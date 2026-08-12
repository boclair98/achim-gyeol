import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

export const metadata: Metadata = { title: "개인정보처리방침 | 아침결", description: "아침결 구독 및 발송 서비스의 개인정보 처리 원칙" };

export default function PrivacyPage() {
  return <main className="enterprise-shell"><SiteHeader context="PRIVACY POLICY" /><LegalDocument title="개인정보처리방침" updated="공개 베타 기준 · 2026년 8월 12일">
    <section><h2>1. 처리 원칙</h2><p>아침결은 PWA 뉴스 알림, 개인화와 품질 운영에 필요한 최소 정보만 처리합니다. 현재 이름, 이메일, 전화번호, 정밀 위치정보를 요구하지 않습니다. 열람 지표에는 원본 기기 UUID 대신 단방향 해시를 사용합니다.</p></section>
    <section><h2>2. 처리 항목과 목적</h2><table><thead><tr><th>항목</th><th>목적</th><th>보유 기준</th></tr></thead><tbody><tr><td>익명 기기 UUID 또는 플랫폼의 가명 사용자 키</td><td>본인 기기의 등록·테스트·해지 요청 구분</td><td>푸시 해지 시 삭제</td></tr><tr><td>웹푸시 endpoint·암호화 공개키</td><td>브리핑 알림 전송</td><td>푸시 해지 시 삭제, 만료·오류 비활성 기록은 최대 30일</td></tr><tr><td>기기·브라우저 정보, 선택 요일, 등록·갱신·마지막 발송 시각</td><td>호환성 확인과 발송 운영</td><td>푸시 해지 시 삭제</td></tr><tr><td>관심 분야·설명 밀도·수신 동의</td><td>카드 순서와 표시 분량 개인화</td><td>설정 삭제 또는 동의 철회 시까지</td></tr><tr><td>해시 처리된 브리핑 열람·카드·원문 이동·공유·완독 여부</td><td>품질·사용성 개선과 발송 운영</td><td>최대 90일, 동일 기기·동일 뉴스 이벤트 중복 저장 안 함</td></tr><tr><td>뉴스 오류 신고 내용·가명 식별자·접수 시각</td><td>내용 확인과 정정 처리</td><td>접수 후 최대 90일</td></tr></tbody></table></section>
    <section><h2>3. 외부 처리</h2><p>서비스 운영에는 coders.kr 호스팅 환경과 이용 중인 브라우저의 웹푸시 제공자가 사용됩니다. 알림 전송 시 해당 제공자에게 푸시 endpoint와 암호화된 알림이 전달될 수 있습니다. 정식 출시 전 운영 주체와 구체적인 처리 수탁사 정보를 확정해 고지합니다.</p></section>
    <section><h2>4. 이용자의 권리</h2><p>구독자는 언제든 수신 설정 확인, 수정, 철회, 삭제를 요청할 수 있습니다. 모든 전달물에는 수신 설정 또는 해지 경로를 제공합니다.</p></section>
    <section><h2>5. 안전조치</h2><p>접근 권한 최소화, 비밀정보 분리, 전송 구간 암호화, 감사 로그, 백업·복구, 보안 사고 대응 절차를 운영 기준에 포함합니다.</p></section>
    <section><h2>6. 권리 행사와 문의</h2><p>알림 설정에서 해지하면 해당 푸시 등록정보가 서버에서 삭제됩니다. 뉴스 내용 오류는 각 브리핑 카드의 ‘이 요약에 오류가 있나요?’ 기능으로 접수합니다. 정식 출시 전 운영 주체, 개인정보 보호책임자와 별도 문의 창구를 확정해야 합니다.</p></section>
  </LegalDocument><SiteFooter /></main>;
}

function LegalDocument({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return <article className="legal-document"><header><span>LEGAL DOCUMENT</span><h1>{title}</h1><p>{updated}</p></header><div className="legal-notice"><strong>공개 베타 안내</strong><p>아래 내용은 현재 제품 동작을 기준으로 작성했습니다. 정식 출시 전 실제 운영자, 콘텐츠 계약, 수탁사와 적용 법률에 맞춘 법률 검토가 필요합니다.</p></div>{children}</article>;
}

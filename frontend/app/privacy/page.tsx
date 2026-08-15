import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

export const metadata: Metadata = { title: "개인정보처리방침 | 아침결", description: "아침결 구독 및 발송 서비스의 개인정보 처리 원칙" };

export default function PrivacyPage() {
  return <main className="enterprise-shell"><SiteHeader context="PRIVACY POLICY" /><LegalDocument title="개인정보처리방침" updated="시행일 · 2026년 8월 15일">
    <section><h2>운영 주체와 문의</h2><p>아침결은 GitHub 사용자 boclair98이 운영합니다. 개인정보 열람·삭제, 서비스 문의와 권리 침해 신고는 <a href="https://github.com/boclair98/achim-gyeol/issues">아침결 GitHub 문의 창구</a>에서 접수하며, 공개 게시가 곤란한 내용은 개인정보 자체를 적지 않고 비공개 연락 방법을 요청해 주세요.</p></section>
    <section><h2>1. 처리 원칙</h2><p>아침결은 PWA 뉴스 알림, 개인화와 품질 운영에 필요한 최소 정보만 처리합니다. 현재 이름, 이메일, 전화번호, 정밀 위치정보를 요구하지 않습니다. 열람 지표에는 원본 기기 UUID 대신 단방향 해시를 사용합니다.</p></section>
    <section><h2>2. 처리 항목과 목적</h2><table><thead><tr><th>항목</th><th>목적</th><th>보유 기준</th></tr></thead><tbody><tr><td>익명 기기 UUID 또는 플랫폼의 가명 사용자 키</td><td>본인 기기의 등록·테스트·해지 요청 구분</td><td>푸시 해지 시 삭제</td></tr><tr><td>웹푸시 endpoint·암호화 공개키</td><td>브리핑 알림 전송</td><td>푸시 해지 시 삭제, 만료·오류 비활성 기록은 최대 30일</td></tr><tr><td>기기·브라우저 정보, 등록·갱신·마지막 발송 시각</td><td>호환성 확인과 발송 운영</td><td>푸시 해지 시 삭제</td></tr><tr><td>관심 분야·설명 밀도·수신 동의</td><td>카드 순서와 표시 분량 개인화</td><td>설정 삭제 또는 동의 철회 시까지</td></tr><tr><td>뉴스별 흥미·비관심 선택과 가명 식별자</td><td>공통 핵심 뉴스 이후 카드 순서 개인화</td><td>선택 후 최대 90일, 같은 뉴스의 선택 변경 시 이전 값 삭제</td></tr><tr><td>해시 처리된 브리핑 열람·카드·원문 이동·공유·완독 여부</td><td>품질·사용성 개선과 발송 운영</td><td>최대 90일, 동일 기기·동일 뉴스 이벤트 중복 저장 안 함</td></tr><tr><td>뉴스 오류 신고 내용·가명 식별자·접수 시각</td><td>내용 확인과 정정 처리</td><td>접수 후 최대 90일</td></tr></tbody></table></section>
    <section><h2>3. 외부 처리</h2><p>서비스 운영을 위해 호스팅·데이터 저장·뉴스 제공·자동화 처리·웹푸시 제공업체가 사용될 수 있습니다. 요약 작성에 독자 식별정보를 사용하지 않으며, 알림 제공자에는 전송에 필요한 정보와 암호화된 알림만 전달합니다. 외부 제공자는 각자의 개인정보처리방침과 보안 기준에 따라 정보를 처리합니다.</p></section>
    <section><h2>4. 이용자의 권리</h2><p>알림 설정에서 서버를 포함한 내 데이터를 JSON으로 내려받거나 전체 삭제할 수 있습니다. 전체 삭제는 푸시 구독·개인화 설정·피드백·가명 열람 기록과 기기 저장정보를 함께 제거하며, 모든 전달물에는 수신 설정 또는 해지 경로를 제공합니다.</p></section>
    <section><h2>5. 안전조치</h2><p>접근 권한 최소화, 비밀정보 분리, 전송 구간 암호화, 감사 로그, 백업·복구, 보안 사고 대응 절차를 운영 기준에 포함합니다.</p></section>
    <section><h2>6. 권리 행사와 정정</h2><p>알림 해지는 해당 푸시 등록정보를 즉시 삭제합니다. 전체 데이터 삭제는 동일 기기 식별자에 연결된 서버 기록을 함께 삭제합니다. 뉴스 내용 오류는 각 브리핑 카드의 ‘이 요약에 오류가 있나요?’ 기능으로 접수하며, 중대한 오류는 운영 화면에서 발행을 즉시 중단하고 정정 이력을 남깁니다.</p></section>
  </LegalDocument><SiteFooter /></main>;
}

function LegalDocument({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return <article className="legal-document"><header><span>LEGAL DOCUMENT</span><h1>{title}</h1><p>{updated}</p></header><div className="legal-notice"><strong>운영 기준</strong><p>이 문서는 현재 제품 동작과 데이터 보유 정책을 기준으로 작성했으며, 처리 방식이나 외부 제공자가 바뀌면 시행 전에 함께 갱신합니다.</p></div>{children}</article>;
}

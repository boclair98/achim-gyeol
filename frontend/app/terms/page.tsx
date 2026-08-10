import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

export const metadata: Metadata = { title: "이용약관 | 아침결", description: "아침결 AI 뉴스 브리핑 서비스 이용약관" };

export default function TermsPage() {
  return <main className="enterprise-shell"><SiteHeader context="TERMS OF SERVICE" /><article className="legal-document"><header><span>LEGAL DOCUMENT</span><h1>서비스 이용약관</h1><p>시행 예정일 2026년 8월 10일 · 상용 계약 시 운영 주체 정보 확정</p></header><div className="legal-notice"><strong>제품 운영 초안</strong><p>실제 판매 전 운영 법인, 콘텐츠 사용권, 유료 요금, 환불·해지와 관할 조항을 계약 형태에 맞춰 검토해야 합니다.</p></div>
    <section><h2>1. 서비스의 목적</h2><p>아침결은 이용자가 선택한 분야의 공개·계약 콘텐츠를 AI로 정리하고 편집 검토를 거쳐 카드, 이메일, 푸시 또는 메신저로 전달하는 브리핑 서비스입니다.</p></section>
    <section><h2>2. AI 사용과 한계</h2><p>브리핑에는 AI가 생성한 초안이 포함될 수 있으며 서비스는 이를 명확히 표시합니다. 요약은 원문 전체를 대체하지 않으며 중요한 의사결정 전 원문 확인이 필요합니다.</p></section>
    <section><h2>3. 콘텐츠와 출처</h2><p>서비스는 적법하게 이용 가능한 콘텐츠와 메타데이터만 사용해야 합니다. 원문 권리는 각 제공자에게 있으며 이용자는 서비스 결과를 허용 범위 밖으로 재판매하거나 원문인 것처럼 표시할 수 없습니다.</p></section>
    <section><h2>4. 구독과 수신 철회</h2><p>이용자는 채널별 수신 동의를 선택할 수 있고 언제든 철회할 수 있습니다. 철회 후에는 법적 보존 의무가 없는 발송 식별 정보를 삭제합니다.</p></section>
    <section><h2>5. 정정과 발행 중단</h2><p>중대한 오류나 출처 분쟁이 확인되면 해당 브리핑의 노출과 발송을 중지할 수 있습니다. 정정 내용, 시각, 이유와 재발송 여부는 정정 이력에 남깁니다.</p></section>
    <section><h2>6. 금지 행위</h2><p>무단 대량 수집, 서비스 장애 유발, 타인의 권리 침해, 출처 삭제, 오인·사칭, 불법 광고나 스팸 전송에 서비스를 사용할 수 없습니다.</p></section>
    <section><h2>7. 기업 고객 운영</h2><p>화이트라벨 고객은 자체 콘텐츠 권리, 수신 동의, 편집 승인자와 브랜드 정보를 정확히 관리할 책임이 있습니다. 서비스 제공 범위와 SLA는 별도 계약에서 정합니다.</p></section>
    <section><h2>8. 문의</h2><p>서비스·편집 문의: support@achim-gyeol.example</p></section>
  </article><SiteFooter /></main>;
}

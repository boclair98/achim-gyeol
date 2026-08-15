import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

export const metadata: Metadata = { title: "이용약관 | 아침결", description: "아침결 뉴스 브리핑 서비스 이용약관" };

export default function TermsPage() {
  return <main className="enterprise-shell"><SiteHeader context="TERMS OF SERVICE" /><article className="legal-document"><header><span>LEGAL DOCUMENT</span><h1>서비스 이용약관</h1><p>시행일 · 2026년 8월 15일</p></header><div className="legal-notice"><strong>운영자 안내</strong><p>아침결은 GitHub 사용자 boclair98이 운영하는 무료 공개 베타 서비스입니다. 문의와 권리 침해 신고는 <a href="https://github.com/boclair98/achim-gyeol/issues">GitHub 문의 창구</a>에서 접수합니다. 현재 유료 결제와 후원 기능은 제공하지 않습니다.</p></div>
    <section><h2>1. 서비스의 목적</h2><p>아침결은 전날의 중요한 뉴스를 읽기 쉽게 정리해 매일 아침 알림과 모바일 브리핑 화면으로 제공하는 무료 공개 베타 서비스입니다.</p></section>
    <section><h2>2. 요약의 한계</h2><p>요약 작성에는 자동화 도구가 사용될 수 있으며 모든 내용을 사람이 미리 검토하지는 않습니다. 요약은 원문 전체나 전문적 조언을 대체하지 않으므로 중요한 판단 전 연결된 원문과 공식 1차 자료를 확인해야 합니다.</p></section>
    <section><h2>3. 콘텐츠와 출처</h2><p>서비스는 적법하게 이용 가능한 콘텐츠와 메타데이터만 사용해야 합니다. 원문 권리는 각 제공자에게 있으며 이용자는 서비스 결과를 허용 범위 밖으로 재판매하거나 원문인 것처럼 표시할 수 없습니다.</p></section>
    <section><h2>4. 구독과 수신 철회</h2><p>이용자는 채널별 수신 동의를 선택할 수 있고 언제든 철회할 수 있습니다. 철회 후에는 법적 보존 의무가 없는 발송 식별 정보를 삭제합니다.</p></section>
    <section><h2>5. 정정과 발행 중단</h2><p>중대한 오류나 출처 분쟁이 확인되면 해당 브리핑의 노출과 발송을 중지할 수 있습니다. 정정 내용, 시각, 이유와 재발송 여부는 정정 이력에 남깁니다.</p></section>
    <section><h2>6. 금지 행위</h2><p>무단 대량 수집, 서비스 장애 유발, 타인의 권리 침해, 출처 삭제, 오인·사칭, 불법 광고나 스팸 전송에 서비스를 사용할 수 없습니다.</p></section>
    <section><h2>7. 기업 고객 운영</h2><p>화이트라벨 고객은 자체 콘텐츠 권리, 수신 동의, 편집 승인자와 브랜드 정보를 정확히 관리할 책임이 있습니다. 서비스 제공 범위와 SLA는 별도 계약에서 정합니다.</p></section>
    <section><h2>8. 콘텐츠 오류 신고</h2><p>각 실제 브리핑 뉴스의 ‘이 요약에 오류가 있나요?’ 기능에서 문제가 된 문장과 확인 가능한 근거를 접수할 수 있습니다. 일반 문의와 권리 행사는 GitHub 문의 창구에서 접수하며 개인정보를 공개 이슈에 직접 작성하지 않아야 합니다.</p></section>
  </article><SiteFooter /></main>;
}

import type { Metadata } from "next";
import { AlertTriangle, BookOpenCheck, Bot, CheckCircle2, FileClock, Fingerprint, Flag, Scale, ShieldCheck } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

export const metadata: Metadata = {
  title: "신뢰센터 | 아침결",
  description: "아침결의 출처 정책, AI 자동 요약 원칙, 품질검사, 정정 이력과 독자 권리를 공개합니다.",
};

export default function TrustPage() {
  return <main className="enterprise-shell">
    <SiteHeader context="PUBLIC TRUST CENTER" />
    <section className="trust-hero"><span>TRUST CENTER · PUBLIC BETA</span><h1>짧게 요약해도,<br /><em>근거는 짧아지지 않습니다.</em></h1><p>현재 아침결은 사람이 매일 사전 승인하는 편집 서비스가 아니라 AI 자동 브리핑 공개 베타입니다. 출처 독립성, 주장별 근거와 충돌 여부를 자동 검사하고 독자가 원문과 한계를 확인할 수 있게 합니다.</p><div><b><ShieldCheck /> 자동 품질 게이트</b><b><BookOpenCheck /> 원문 출처 공개</b><b><FileClock /> 오류 신고·정정 기록</b></div></section>
    <section className="trust-section"><div className="trust-section-head"><span>QUALITY STANDARD 01</span><h2>자동 발행 전 다섯 개 문을 통과합니다.</h2><p>기준을 통과하지 못한 사건은 브리핑에서 제외합니다.</p></div><div className="method-grid">{[
      { icon: BookOpenCheck, title: "출처 독립성", text: "동일 보도자료를 옮긴 기사 여러 건을 복수 출처로 세지 않습니다." },
      { icon: Fingerprint, title: "주장 단위 확인", text: "날짜·금액·인명·인과관계를 분리하고 각각 근거를 연결합니다." },
      { icon: Scale, title: "사실과 전망 분리", text: "확인된 사실, 당사자 주장, 전문가 전망을 같은 문장에 섞지 않습니다." },
      { icon: AlertTriangle, title: "불확실성 표시", text: "확인되지 않은 내용과 출처 간 차이를 별도 영역으로 표시합니다." },
      { icon: Flag, title: "독자 오류 신고", text: "실제 브리핑의 각 뉴스에서 문제가 된 문장과 근거를 바로 보낼 수 있습니다." },
    ].map((item) => { const Icon = item.icon; return <article key={item.title}><Icon /><strong>{item.title}</strong><p>{item.text}</p><span><CheckCircle2 /> 적용 중</span></article>; })}</div></section>
    <section className="quality-matrix"><div><span>QUALITY GATE</span><h2>자동 발행 판단 기준</h2><p>품질 점수는 출처와 근거 조건을 검사하는 자동 기준입니다. 사람의 최종 승인이라는 뜻은 아닙니다.</p></div><table><thead><tr><th>상태</th><th>기준</th><th>처리</th></tr></thead><tbody><tr><td><b className="status-pill verified">VERIFIED</b></td><td>독립 출처 2개 이상·핵심 주장 확인</td><td>자동 발행 가능</td></tr><tr><td><b className="status-pill developing">DEVELOPING</b></td><td>후속 발표 예정·일부 불확실성</td><td>불확실성 표시 후 발행 가능</td></tr><tr><td><b className="status-pill conflicting">CONFLICTING</b></td><td>출처 간 핵심 사실 불일치</td><td>자동 발행 제외</td></tr></tbody></table></section>
    <section className="ai-disclosure"><div><span>AI DISCLOSURE</span><h2>AI와 시스템,<br />운영자의 역할을 구분합니다.</h2></div><ol><li><strong>AI</strong><span>기사 군집화, 중요도 판단 보조, 요약·제목·카드 초안 생성</span></li><li><strong>시스템</strong><span>출처군 독립성, 주장별 인용, 충돌·오래된 근거·홍보성 표현과 발행 기준 자동 검사</span></li><li><strong>운영자</strong><span>실제 운영 스튜디오에서 수정·승인·보류·정정과 실패 재전송을 수행합니다. 사람 승인 여부는 브리핑에 구분해 표시합니다.</span></li><li><strong>독자</strong><span>원문 확인, 기사별 오류 신고, 관심 분야·분량 설정과 수신 철회</span></li></ol></section>
    <section className="correction-public"><div className="trust-section-head"><span>CORRECTION LOG</span><h2>고친 사실도 뉴스의 일부입니다.</h2><p>실제 정정은 해당 브리핑 뉴스 아래에 날짜·이유와 함께 표시합니다.</p></div><div><article><time><FileClock /> 공개 베타</time><h3>기사별 정정 이력을 제공합니다.</h3><p>운영자가 정정을 발행하면 PostgreSQL에 이전 내용·수정 내용·이유·시각·작업자를 남기고 독자 화면에는 이유와 시각을 공개합니다.</p><footer><span>가상 사례는 정정 이력으로 표시하지 않습니다.</span><b>운영 연결</b></footer></article></div></section>
    <section className="trust-contact"><Bot /><div><span>콘텐츠 오류 신고</span><h2>문제가 있는 요약을 발견하셨나요?</h2><p>실제 브리핑의 해당 뉴스 아래에서 문제가 된 문장과 확인 가능한 근거를 보내주세요. 개인 이메일 주소를 공개하지 않고 운영자가 확인할 수 있습니다.</p></div><a href="/briefing">브리핑에서 신고하기</a></section>
    <SiteFooter />
  </main>;
}

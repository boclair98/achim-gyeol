import type { Metadata } from "next";
import { AlertTriangle, BookOpenCheck, CheckCircle2, Clock3, FileClock, Fingerprint, Scale, ShieldCheck, UserCheck } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { corrections } from "@/lib/product";

export const metadata: Metadata = {
  title: "신뢰센터 | 아침결",
  description: "아침결의 출처 정책, AI 사용 원칙, 편집 검토, 정정 이력과 독자 권리를 공개합니다.",
};

export default function TrustPage() {
  return <main className="enterprise-shell">
    <SiteHeader context="PUBLIC TRUST CENTER" />
    <section className="trust-hero"><span>TRUST CENTER · PUBLIC RECORD</span><h1>짧게 요약해도,<br /><em>근거는 짧아지지 않습니다.</em></h1><p>아침결은 AI가 만든 초안을 그대로 발행하지 않습니다. 출처, 주장, 위험도, 편집자 승인과 정정 기록을 독자가 확인할 수 있게 설계합니다.</p><div><b><ShieldCheck /> 사람의 최종 승인</b><b><BookOpenCheck /> 원문 출처 공개</b><b><FileClock /> 정정 이력 보존</b></div></section>
    <section className="trust-section"><div className="trust-section-head"><span>EDITORIAL STANDARD 01</span><h2>발행 전 다섯 개 문을 통과합니다.</h2><p>점수가 높아도 고위험 주제는 자동 발행하지 않습니다.</p></div><div className="method-grid">{[
      { icon: BookOpenCheck, title: "출처 독립성", text: "동일 보도자료를 옮긴 기사 여러 건을 복수 출처로 세지 않습니다." },
      { icon: Fingerprint, title: "주장 단위 확인", text: "날짜·금액·인명·인과관계를 분리하고 각각 근거를 연결합니다." },
      { icon: Scale, title: "사실과 전망 분리", text: "확인된 사실, 당사자 주장, 전문가 전망을 같은 문장에 섞지 않습니다." },
      { icon: AlertTriangle, title: "위험도 분류", text: "정치·금융·의료·재난은 강화 검수 대상으로 분류합니다." },
      { icon: UserCheck, title: "편집자 승인", text: "AI 초안은 책임 편집자가 제목과 요약, 출처를 확인한 뒤 발행합니다." },
    ].map((item) => { const Icon = item.icon; return <article key={item.title}><Icon /><strong>{item.title}</strong><p>{item.text}</p><span><CheckCircle2 /> 적용 중</span></article>; })}</div></section>
    <section className="quality-matrix"><div><span>QUALITY GATE</span><h2>발행 판단 기준</h2><p>자동 점수는 편집 판단을 돕는 도구이며 사람의 승인을 대신하지 않습니다.</p></div><table><thead><tr><th>상태</th><th>기준</th><th>처리</th></tr></thead><tbody><tr><td><b className="status-pill verified">VERIFIED</b></td><td>독립 출처 2개 이상·핵심 주장 확인</td><td>편집 승인 후 발행 가능</td></tr><tr><td><b className="status-pill developing">DEVELOPING</b></td><td>사실 확인 중이거나 후속 발표 예정</td><td>불확실성 표시 또는 보류</td></tr><tr><td><b className="status-pill conflicting">CONFLICTING</b></td><td>출처 간 핵심 사실 불일치</td><td>자동 발행 금지</td></tr></tbody></table></section>
    <section className="ai-disclosure"><div><span>AI DISCLOSURE</span><h2>AI가 한 일과<br />사람이 한 일을 나눠 표시합니다.</h2></div><ol><li><strong>AI</strong><span>기사 군집화, 초안 요약, 중복 문장 감지, 카드 초안 생성</span></li><li><strong>편집자</strong><span>출처 적절성, 핵심 주장, 제목, 중요성, 위험도, 최종 발행 승인</span></li><li><strong>독자</strong><span>원문 확인, 오류 신고, 수신 철회, 정정 알림 요청</span></li></ol></section>
    <section className="correction-public"><div className="trust-section-head"><span>CORRECTION LOG</span><h2>고친 사실도 뉴스의 일부입니다.</h2><p>중요한 정정은 같은 채널로 다시 알리고 이전 문구와 변경 이유를 남깁니다.</p></div><div>{corrections.map((item) => <article key={item.date}><time><Clock3 />{item.date}</time><h3>{item.story}</h3><p>{item.change}</p><footer><span>{item.reason}</span><b>{item.status}</b></footer></article>)}</div></section>
    <section className="trust-contact"><ShieldCheck /><div><span>편집·정정 문의</span><h2>오류를 발견하셨나요?</h2><p>기사 제목, 문제가 된 문장, 확인 가능한 근거를 보내주세요. 실제 운영 시 고객사별 책임 편집 연락처로 연결됩니다.</p></div><a href="mailto:editor@achim-gyeol.example">editor@achim-gyeol.example</a></section>
    <SiteFooter />
  </main>;
}

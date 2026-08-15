import type { Metadata } from "next";
import { BookOpenCheck, Bot, CheckCircle2, FileClock, Flag, ShieldCheck } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

export const metadata: Metadata = {
  title: "신뢰센터 | 아침결",
  description: "아침결이 독자에게 약속하는 출처 표시, 불확실성 안내, 오류 신고와 정정 원칙을 공개합니다.",
};

const readerPromises = [
  { icon: BookOpenCheck, title: "원문 출처 제공", text: "모든 뉴스 카드에서 관련 언론사와 원문을 바로 확인할 수 있습니다." },
  { icon: ShieldCheck, title: "확인 상태 표시", text: "확인이 끝난 내용과 더 확인이 필요한 내용을 구분해 보여드립니다." },
  { icon: Flag, title: "오류 신고", text: "문제가 있는 요약은 해당 뉴스에서 바로 신고할 수 있습니다." },
  { icon: FileClock, title: "정정 내용 공개", text: "중요한 오류를 고치면 수정 시각과 이유를 해당 브리핑에 남깁니다." },
];

export default function TrustPage() {
  return <main className="enterprise-shell">
    <SiteHeader context="PUBLIC TRUST CENTER" />
    <section className="trust-hero"><span>TRUST CENTER · PUBLIC BETA</span><h1>짧게 요약해도,<br /><em>근거는 짧아지지 않습니다.</em></h1><p>아침결은 중요한 뉴스를 읽기 쉽게 제공하면서 독자가 원문, 확인 상태와 한계를 직접 확인할 수 있도록 합니다.</p><div><b><ShieldCheck /> 확인 상태 표시</b><b><BookOpenCheck /> 원문 출처 제공</b><b><FileClock /> 오류 신고·정정 기록</b></div></section>

    <section className="trust-section"><div className="trust-section-head"><span>OUR PROMISE</span><h2>독자가 직접 확인할 수 있게 합니다.</h2><p>실제 브리핑에서 확인할 수 있는 약속을 꾸준히 지키겠습니다.</p></div><div className="method-grid">{readerPromises.map((item) => { const Icon = item.icon; return <article key={item.title}><Icon /><strong>{item.title}</strong><p>{item.text}</p><span><CheckCircle2 /> 제공 중</span></article>; })}</div></section>

    <section className="ai-disclosure"><div><span>SUMMARY NOTICE</span><h2>요약은 시작점이고,<br />원문이 기준입니다.</h2></div><ol><li><strong>요약</strong><span>요약 작성에는 자동화 도구가 사용될 수 있으며 모든 내용을 사람이 미리 검토하지는 않습니다.</span></li><li><strong>원문</strong><span>중요한 판단이 필요한 내용은 함께 제공된 원문과 공식 자료를 확인해 주세요.</span></li><li><strong>운영자</strong><span>신고된 오류를 확인하고 필요한 경우 내용을 수정하거나 발행을 중단합니다.</span></li><li><strong>독자</strong><span>원문 확인, 기사별 오류 신고, 관심 분야 설정과 수신 철회를 할 수 있습니다.</span></li></ol></section>

    <section className="correction-public"><div className="trust-section-head"><span>CORRECTION LOG</span><h2>고친 사실도 뉴스의 일부입니다.</h2><p>정정이 필요한 경우 해당 브리핑에 수정 시각과 이유를 표시합니다.</p></div><div><article><time><FileClock /> 공개 베타</time><h3>기사별 정정 이력을 제공합니다.</h3><p>내용을 바로잡으면 독자가 무엇이 왜 달라졌는지 확인할 수 있도록 남깁니다.</p><footer><span>예시 내용은 실제 정정 이력으로 표시하지 않습니다.</span><b>운영 중</b></footer></article></div></section>

    <section className="trust-contact"><Bot /><div><span>콘텐츠 오류 신고</span><h2>문제가 있는 요약을 발견하셨나요?</h2><p>실제 브리핑의 해당 뉴스 아래에서 문제가 된 문장과 확인 가능한 근거를 보내주세요.</p></div><a href="/briefing">브리핑에서 신고하기</a></section>
    <SiteFooter />
  </main>;
}

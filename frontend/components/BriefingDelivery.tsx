"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, BellRing, BookOpen, CheckCircle2, ChevronLeft, ChevronRight, ExternalLink, FileCheck2, Settings2 } from "lucide-react";
import { BriefingCardPreview } from "@/components/DeliveryDeck";
import { demoBriefing, type Briefing } from "@/lib/briefing";
import { buildBriefingCards } from "@/lib/briefing-card";
import { defaultBrand, type BriefingBrand } from "@/lib/product";

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export function BriefingDelivery() {
  const [briefing, setBriefing] = useState<Briefing>(demoBriefing);
  const [brand, setBrand] = useState<BriefingBrand>(defaultBrand);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [subscribed, setSubscribed] = useState(false);
  const cards = useMemo(() => buildBriefingCards(briefing, brand), [briefing, brand]);
  const currentCard = cards[currentIndex];
  const currentStory = currentCard?.kind === "story" ? currentCard.story : null;

  useEffect(() => {
    const brandTimer = window.setTimeout(() => {
      const storedBrand = window.localStorage.getItem("achim-gyeol-brand");
      if (storedBrand) try { setBrand(JSON.parse(storedBrand)); } catch { window.localStorage.removeItem("achim-gyeol-brand"); }
    }, 0);
    const controller = new AbortController();
    fetch(`${apiBase}/api/briefings/today`, { cache: "no-store", signal: controller.signal })
      .then((response) => { if (!response.ok) throw new Error("briefing unavailable"); return response.json(); })
      .then((data: Briefing) => setBriefing(data))
      .catch(() => setBriefing(demoBriefing))
      .finally(() => setLoading(false));
    if ("serviceWorker" in navigator && "PushManager" in window) {
      navigator.serviceWorker.ready.then((registration) => registration.pushManager.getSubscription())
        .then((subscription) => setSubscribed(Boolean(subscription))).catch(() => setSubscribed(false));
    }
    return () => { window.clearTimeout(brandTimer); controller.abort(); };
  }, []);

  return <main className="delivered-shell">
    <header className="delivered-topbar">
      <Link href="/" className="delivered-brand"><i /> <strong>{brand.name}</strong><span>AI MORNING BRIEF</span></Link>
      <Link href="/#delivery-deck" className="delivered-settings"><Settings2 size={15} /> 알림 설정</Link>
    </header>

    <section className="delivered-heading">
      <div><span>{briefing.productionReady ? "DELIVERED THIS MORNING" : "DELIVERY PREVIEW"}</span><h1>어제 뉴스 종합이<br />도착했어요.</h1></div>
      <p>{loading ? "브리핑을 불러오는 중입니다." : briefing.lead}</p>
    </section>

    <section className="delivered-layout" aria-live="polite">
      <div className="delivered-deck">
        <div className="deck-counter">CARD {String(currentIndex + 1).padStart(2, "0")} / {String(cards.length).padStart(2, "0")}</div>
        <div className="card-stack">
          <div className="stack-sheet stack-two" aria-hidden="true" />
          <div className="stack-sheet stack-one" aria-hidden="true" />
          <BriefingCardPreview card={currentCard} />
        </div>
        <div className="deck-navigation">
          <button aria-label="이전 카드" onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))} disabled={currentIndex === 0}><ChevronLeft /></button>
          <div className="deck-dots" aria-label="카드 선택">{cards.map((card, index) => <button key={card.id} className={index === currentIndex ? "active" : ""} aria-label={`${index + 1}번 카드`} onClick={() => setCurrentIndex(index)} />)}</div>
          <button aria-label="다음 카드" onClick={() => setCurrentIndex((index) => Math.min(cards.length - 1, index + 1))} disabled={currentIndex === cards.length - 1}><ChevronRight /></button>
        </div>
      </div>

      <aside className="delivered-info">
        <span className={briefing.productionReady ? "live" : "preview"}>{briefing.productionReady ? "● 실제 전날 뉴스 종합" : "● 사용법 확인용 예시"}</span>
        <h2>{briefing.dateLabel}</h2>
        <dl><div><dt>핵심 뉴스</dt><dd>{briefing.stories.length}건</dd></div><div><dt>교차 확인</dt><dd>{briefing.verifiedCount}건</dd></div><div><dt>예상 시간</dt><dd>약 {briefing.readMinutes}분</dd></div></dl>
        {currentStory ? <StoryEvidence story={currentStory} /> : <div className="delivered-tip"><CheckCircle2 size={18} /><p>좌우 버튼으로 카드를 넘기세요. 뉴스 카드에서는 요약 문장과 그 문장을 뒷받침하는 원문을 함께 확인할 수 있습니다.</p></div>}
        {!subscribed && <Link className="delivered-register-link" href="/#delivery-deck"><BellRing size={16} /> 이 기기에 알림 등록</Link>}
        <Link className="delivered-home-link" href="/">전체 기사와 설정 보기</Link>
      </aside>
    </section>
  </main>;
}

function StoryEvidence({ story }: { story: Briefing["stories"][number] }) {
  const evidenceReady = story.evidenceAvailable && Boolean(story.claims?.length);
  return <div className="delivered-evidence">
    <strong className="evidence-title"><FileCheck2 size={15} /> 문장별 근거</strong>
    {evidenceReady ? <ol className="evidence-claims">{story.claims!.map((claim, claimIndex) => <li key={`${claim.statement}-${claimIndex}`}>
      <p>{claim.statement}</p>
      <div>{claim.sources.map((source) => {
        const sourceNumber = story.sources.findIndex((item) => item.url === source.url) + 1;
        return <a href={source.url} target="_blank" rel="noreferrer" key={`${claim.statement}-${source.url}`}>[{sourceNumber}] {source.publisher}<ExternalLink size={11} /></a>;
      })}</div>
    </li>)}</ol> : <div className="legacy-evidence"><AlertTriangle size={16} /><p>이 브리핑은 이전 형식으로 생성돼 문장별 근거 연결이 없습니다. 아래 원문 목록을 직접 확인해 주세요.</p></div>}
    {story.uncertainty && <div className="uncertainty-box"><strong><AlertTriangle size={14} /> 아직 확인되지 않은 것</strong><p>{story.uncertainty}</p></div>}
    <div className="delivered-sources"><strong><BookOpen size={15} /> 원문과 1차 자료</strong>{story.sources.map((source, index) => <a href={source.url} target="_blank" rel="noreferrer" key={`${source.publisher}-${source.url}`}><span>[{index + 1}] {source.publisher}{source.primarySource ? <small>1차 자료</small> : null}</span><ExternalLink size={13} /></a>)}</div>
  </div>;
}

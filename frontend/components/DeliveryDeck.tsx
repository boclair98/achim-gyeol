"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { BellRing, ChevronLeft, ChevronRight, Images } from "lucide-react";
import type { Briefing } from "@/lib/briefing";
import { buildBriefingCards, type BriefingCard } from "@/lib/briefing-card";
import { defaultBrand } from "@/lib/product";
import { PushControls } from "@/components/PushControls";

const assetBase = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const weekdays = ["월", "화", "수", "목", "금", "토", "일"];

type Props = {
  briefing: Briefing;
  onNotice: (message: string) => void;
};

export function DeliveryDeck({ briefing, onNotice }: Props) {
  const cards = useMemo(() => buildBriefingCards(briefing, defaultBrand), [briefing]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [deliveryTime, setDeliveryTime] = useState("07:00");
  const [selectedDays, setSelectedDays] = useState([0, 1, 2, 3, 4]);
  const currentCard = cards[currentIndex];

  useEffect(() => {
    const stored = window.localStorage.getItem("achim-gyeol-delivery");
    try {
      const setting = stored ? JSON.parse(stored) as { time?: string; days?: number[] } : {};
      const timer = window.setTimeout(() => {
        if (setting.time) setDeliveryTime(setting.time);
        if (setting.days) setSelectedDays(setting.days);
      }, 0);
      return () => window.clearTimeout(timer);
    } catch {
      window.localStorage.removeItem("achim-gyeol-delivery");
    }
  }, []);

  const toggleDay = (index: number) => {
    setSelectedDays((days) => days.includes(index) ? days.filter((day) => day !== index) : [...days, index].sort());
  };

  return (
    <section className="delivery-studio subscription-studio" id="delivery-deck">
      <div className="landing-section-heading delivery-heading-clean">
        <span>FREE SUBSCRIPTION</span>
        <h2>받을 시간을 정하면 끝이에요</h2>
        <p>회원가입도, 앱스토어 설치도 필요 없습니다. 이 기기의 브라우저 알림만 한 번 허용해 주세요.</p>
      </div>

      <div className="delivery-layout subscription-layout">
        <div className="deck-preview">
          <div className="deck-counter"><Images size={15} /> 실제로 도착하는 카드 · {currentIndex + 1}/{cards.length}</div>
          <div className="card-stack" aria-live="polite">
            <div className="stack-sheet stack-two" aria-hidden="true" />
            <div className="stack-sheet stack-one" aria-hidden="true" />
            <BriefingCardPreview card={currentCard} />
          </div>
          <div className="deck-navigation">
            <button aria-label="이전 카드" onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))} disabled={currentIndex === 0}><ChevronLeft /></button>
            <div className="deck-dots" aria-label="카드 선택">
              {cards.map((card, index) => <button key={card.id} className={index === currentIndex ? "active" : ""} aria-label={`${index + 1}번 카드`} onClick={() => setCurrentIndex(index)} />)}
            </div>
            <button aria-label="다음 카드" onClick={() => setCurrentIndex((index) => Math.min(cards.length - 1, index + 1))} disabled={currentIndex === cards.length - 1}><ChevronRight /></button>
          </div>
          <Link className="deck-detail-link" href="/briefing">오늘의 카드 전체 화면으로 보기 →</Link>
        </div>

        <div className="subscription-panel">
          <div className="subscription-panel-head">
            <div className="subscription-bell"><BellRing /></div>
            <div><span>알림 받을 시간</span><h3>언제 받아볼까요?</h3></div>
          </div>
          <p className="subscription-description">전날 뉴스 정리가 끝난 뒤, 선택한 시간에 이 기기로 알림을 보내드립니다.</p>
          <label className="time-field"><span>도착 시각</span><input type="time" value={deliveryTime} onChange={(event) => setDeliveryTime(event.target.value)} /></label>
          <div className="setting-label">받을 요일</div>
          <div className="weekday-list" aria-label="발송 요일">
            {weekdays.map((day, index) => <button key={day} className={selectedDays.includes(index) ? "active" : ""} onClick={() => toggleDay(index)}>{day}</button>)}
          </div>
          <div className="simple-onboarding">
            <span><b>1</b> 시간과 요일 선택</span>
            <i />
            <span><b>2</b> 알림 등록</span>
            <i />
            <span><b>3</b> 다음 아침부터 수신</span>
          </div>
          <PushControls deliveryTime={deliveryTime} selectedDays={selectedDays} onNotice={onNotice} />
          <div className="privacy-note">알림 발송에 필요한 익명 기기 ID만 저장하며, 이름·이메일·전화번호를 받지 않습니다.</div>
        </div>
      </div>
    </section>
  );
}

export function BriefingCardPreview({ card }: { card: BriefingCard }) {
  if (card.kind === "cover") {
    return (
      <article className="delivery-card cover-card" style={{ "--tenant-accent": card.brand.accent, backgroundImage: `linear-gradient(180deg, rgba(7,53,37,.08), rgba(7,45,32,.92)), url(${assetBase}/briefing-card-bg.png)` } as CSSProperties}>
        <span className="delivery-badge">매일 아침 · 어제의 뉴스</span>
        <div className="cover-brand">{card.brand.name}</div>
        <div className="cover-copy"><h3>어제의 소음은 빼고,<br />오늘 필요한 뉴스만.</h3><p>{card.briefing.lead}</p></div>
        <div className="cover-stats"><strong>{card.briefing.stories.length}개 핵심 뉴스</strong><span>교차 확인 {card.briefing.verifiedCount}건 · 약 {card.briefing.readMinutes}분</span></div>
      </article>
    );
  }
  if (card.kind === "closing") {
    return (
      <article className="delivery-card closing-card">
        <span>YESTERDAY IN ONE PAGE</span><h3>어제의 흐름,<br />이렇게 기억하세요.</h3>
        <ol>{card.briefing.stories.map((story, index) => <li key={story.id}><strong>{String(index + 1).padStart(2, "0")}</strong><span>{story.title}</span></li>)}</ol>
        <footer><strong>{card.brand.name}</strong><span>출처를 확인하고 · 사실과 전망을 나눕니다</span></footer>
      </article>
    );
  }
  const verified = card.story.verificationStatus === "VERIFIED";
  return (
    <article className="delivery-card summary-card">
      <header><strong>{card.brand.name} · AI NEWS SUMMARY</strong><span>{String(card.index).padStart(2, "0")} / {String(card.briefing.stories.length).padStart(2, "0")}</span></header>
      <div className="summary-kicker"><span>{card.story.category}</span><em>{verified ? "● 교차 검증 완료" : "● 추가 보도 확인 중"}</em></div>
      <h3>{card.story.title}</h3>
      <div className="ai-summary"><strong>AI 3줄 요약</strong><p>{card.story.summary}</p></div>
      <div className="matter-box"><strong>왜 중요한가</strong><p>{card.story.whyItMatters}</p></div>
      <footer><span>출처 {card.story.sources.map((source) => source.publisher).join(" · ")}</span><span>최종 확인 {card.briefing.lastVerifiedAt}</span></footer>
    </article>
  );
}

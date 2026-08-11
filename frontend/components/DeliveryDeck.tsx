"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  BellRing,
  ChevronLeft,
  ChevronRight,
  Download,
  Images,
  Mail,
  Send,
  Smartphone,
} from "lucide-react";
import type { Briefing } from "@/lib/briefing";
import { buildBriefingCards, renderBriefingCard, type BriefingCard } from "@/lib/briefing-card";
import { createBriefingEml } from "@/lib/email-template";
import { defaultBrand, type BriefingBrand } from "@/lib/product";
import { PushControls } from "@/components/PushControls";

const assetBase = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const weekdays = ["월", "화", "수", "목", "금", "토", "일"];

type Props = {
  briefing: Briefing;
  onNotice: (message: string) => void;
};

export function DeliveryDeck({ briefing, onNotice }: Props) {
  const [brand, setBrand] = useState<BriefingBrand>(defaultBrand);
  const cards = useMemo(() => buildBriefingCards(briefing, brand), [briefing, brand]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [deliveryTime, setDeliveryTime] = useState("07:00");
  const [selectedDays, setSelectedDays] = useState([0, 1, 2, 3, 4]);
  const [exporting, setExporting] = useState(false);
  const currentCard = cards[currentIndex];

  useEffect(() => {
    const stored = window.localStorage.getItem("achim-gyeol-delivery");
    const storedBrand = window.localStorage.getItem("achim-gyeol-brand");
    try {
      const setting = stored ? JSON.parse(stored) as { time?: string; days?: number[] } : {};
      const timer = window.setTimeout(() => {
        if (setting.time) setDeliveryTime(setting.time);
        if (setting.days) setSelectedDays(setting.days);
        if (storedBrand) setBrand(JSON.parse(storedBrand));
      }, 0);
      return () => window.clearTimeout(timer);
    } catch {
      window.localStorage.removeItem("achim-gyeol-delivery");
    }
  }, []);

  const savePreference = () => {
    window.localStorage.setItem("achim-gyeol-delivery", JSON.stringify({ time: deliveryTime, days: selectedDays }));
    onNotice("이 브라우저에 화면 설정을 저장했어요. 실제 예약 발송에도 반영하려면 위의 ‘시간·요일 저장’을 눌러주세요.");
  };

  const toggleDay = (index: number) => {
    setSelectedDays((days) => days.includes(index) ? days.filter((day) => day !== index) : [...days, index].sort());
  };

  const downloadCurrent = async () => {
    setExporting(true);
    try {
      const blob = await renderBriefingCard(currentCard, assetBase);
      downloadBlob(blob, cardFileName(currentCard, currentIndex));
      onNotice("현재 브리핑 카드를 1080×1350 PNG로 저장했어요.");
    } finally {
      setExporting(false);
    }
  };

  const shareCurrent = async () => {
    setExporting(true);
    try {
      const blob = await renderBriefingCard(currentCard, assetBase);
      const file = new File([blob], cardFileName(currentCard, currentIndex), { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: `${brand.name} 모닝 브리핑`, text: "어제 하루를 정리한 뉴스 요약이에요.", files: [file] });
      } else {
        downloadBlob(blob, file.name);
        onNotice("이 브라우저는 이미지 직접 공유를 지원하지 않아 파일로 저장했어요.");
      }
    } catch (error) {
      if ((error as DOMException).name !== "AbortError") onNotice("카드 공유를 완료하지 못했어요. 다시 시도해주세요.");
    } finally {
      setExporting(false);
    }
  };

  const shareDeck = async () => {
    setExporting(true);
    try {
      const files = await Promise.all(cards.map(async (card, index) => {
        const blob = await renderBriefingCard(card, assetBase);
        return new File([blob], cardFileName(card, index), { type: "image/png" });
      }));
      if (navigator.canShare?.({ files })) {
        await navigator.share({ title: `${brand.name} 어제 뉴스 종합 카드`, text: `어제 핵심 뉴스 ${briefing.stories.length}개를 카드로 정리했어요.`, files });
      } else {
        files.forEach((file, index) => window.setTimeout(() => downloadBlob(file, file.name), index * 180));
        onNotice(`카드 ${files.length}장을 모두 PNG로 저장했어요.`);
      }
    } catch (error) {
      if ((error as DOMException).name !== "AbortError") onNotice("전체 카드 생성 중 문제가 생겼어요.");
    } finally {
      setExporting(false);
    }
  };

  const testNotification = async () => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      onNotice("이 브라우저에서는 PWA 알림을 테스트할 수 없어요.");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      onNotice("브라우저 설정에서 알림을 허용해주세요.");
      return;
    }
    const registration = await navigator.serviceWorker.ready;
    const options: NotificationOptions & { image?: string } = {
      body: `${briefing.stories.length}개 핵심 뉴스 · 약 ${briefing.readMinutes}분`,
      icon: `${assetBase}/icon.svg`,
      image: `${assetBase}/briefing-card-bg.png`,
      data: { url: `${window.location.pathname}#delivery-deck` },
    };
    await registration.showNotification(`${brand.name} · 오늘의 뉴스 카드가 도착했어요`, options);
    onNotice("실제 사용자에게 보일 도착 알림을 보냈어요. 알림을 눌러 카드 덱으로 이동할 수 있어요.");
  };

  const downloadEmailPreview = () => {
    const eml = createBriefingEml(briefing, window.location.href, brand);
    downloadBlob(new Blob([eml], { type: "message/rfc822;charset=utf-8" }), `${brand.name}-테스트-브리핑.eml`);
    onNotice("실제 수신 형태의 테스트 메일 파일을 저장했어요. 메일 앱에서 열어 확인할 수 있어요.");
  };

  return (
    <section className="delivery-studio" id="delivery-deck">
      <div className="delivery-heading">
        <div>
          <span className="section-label">ACTUAL DELIVERY</span>
          <h2>사용자에게는<br />이 카드 묶음이 도착해요.</h2>
        </div>
        <p>웹 페이지를 그대로 보내지 않습니다. 표지부터 뉴스별 AI 요약과 출처까지, 넘겨 보는 카드 덱으로 전달합니다.</p>
      </div>

      <div className="delivery-layout">
        <div className="deck-preview">
          <div className="deck-counter"><Images size={15} /> CARD {String(currentIndex + 1).padStart(2, "0")} / {String(cards.length).padStart(2, "0")}</div>
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
        </div>

        <div className="delivery-control">
          <div className="control-card emphasis">
            <span className="control-eyebrow">CARD EXPORT</span>
            <h3>뉴스 요약이 들어간<br />진짜 전송용 이미지</h3>
            <p>모든 카드는 1080×1350 PNG로 생성됩니다. 카카오톡·메신저·SNS에 바로 공유할 수 있어요.</p>
            <div className="control-actions">
              <button className="primary-button" onClick={shareDeck} disabled={exporting}><Send size={16} /> {exporting ? "카드 만드는 중" : "전체 카드 공유"}</button>
              <button className="secondary-button" onClick={downloadCurrent} disabled={exporting}><Download size={16} /> 현재 카드 저장</button>
              <button className="secondary-button" onClick={shareCurrent} disabled={exporting}><Smartphone size={16} /> 현재 카드 공유</button>
              <button className="secondary-button mail-preview" onClick={downloadEmailPreview}><Mail size={16} /> 수신 메일 미리보기</button>
            </div>
          </div>

          <div className="control-card schedule-card">
            <div className="control-title"><div><span className="control-eyebrow">DELIVERY SETTING</span><h3>매일 아침 도착 시간</h3></div><BellRing /></div>
            <label className="time-field"><span>발송 시각</span><input type="time" value={deliveryTime} onChange={(event) => setDeliveryTime(event.target.value)} /></label>
            <div className="weekday-list" aria-label="발송 요일">
              {weekdays.map((day, index) => <button key={day} className={selectedDays.includes(index) ? "active" : ""} onClick={() => toggleDay(index)}>{day}</button>)}
            </div>
            <div className="push-onboarding">
              <strong>등록 한 번이면 다음 아침부터 자동으로 도착해요</strong>
              <ol>
                <li><b>1</b><span>받을 시간과 요일 선택</span></li>
                <li><b>2</b><span>‘이 기기에 알림 등록’ 누르기</span></li>
                <li><b>3</b><span>첫 한 번만 브라우저 알림 허용</span></li>
              </ol>
              <p>오전 6:15부터 어제 00:00~23:59 뉴스를 종합합니다. 준비가 끝나면 선택 시각 이후 알림이 오고, 누르면 요약 카드와 출처가 열립니다.</p>
              <small>회원가입·API 키·결제가 없습니다. 이 브라우저가 익명 기기 ID를 만들고 알림 발송에만 사용합니다.</small>
            </div>
            <PushControls deliveryTime={deliveryTime} selectedDays={selectedDays} onNotice={onNotice} />
            <div className="schedule-actions">
              <button className="secondary-button" onClick={savePreference}>화면 설정만 저장</button>
              <button className="secondary-button blue" onClick={testNotification}>로컬 알림 미리보기</button>
            </div>
            <p className="api-note"><i /> PWA 실제 예약 발송·내 기기 푸시 테스트 운영 중 · 메일·카카오 채널은 아직 미연결</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function BriefingCardPreview({ card }: { card: BriefingCard }) {
  if (card.kind === "cover") {
    return (
      <article className="delivery-card cover-card" style={{ "--tenant-accent": card.brand.accent, backgroundImage: `linear-gradient(180deg, rgba(6,20,44,.12), rgba(6,20,44,.95)), url(${assetBase}/briefing-card-bg.png)` } as CSSProperties}>
        <span className="delivery-badge">{card.brand.descriptor}</span>
        <div className="cover-brand">{card.brand.name}</div>
        <div className="cover-copy"><h3>어제의 소음은 빼고,<br />오늘 필요한 뉴스만.</h3><p>{card.briefing.lead}</p></div>
        <div className="cover-stats"><strong>{card.briefing.stories.length}개 핵심 뉴스</strong><span>교차 확인 {card.briefing.verifiedCount}건 · 약 {card.briefing.readMinutes}분</span></div>
      </article>
    );
  }
  if (card.kind === "closing") {
    return (
      <article className="delivery-card closing-card">
        <span style={{ color: card.brand.accent }}>YESTERDAY IN ONE PAGE</span><h3>어제의 흐름,<br />이렇게 기억하세요.</h3>
        <ol>{card.briefing.stories.map((story, index) => <li key={story.id}><strong>{String(index + 1).padStart(2, "0")}</strong><span>{story.title}</span></li>)}</ol>
        <footer><strong>{card.brand.name}</strong><span>출처를 확인하고 · 사실과 전망을 나눕니다</span></footer>
      </article>
    );
  }
  const verified = card.story.verificationStatus === "VERIFIED";
  return (
    <article className="delivery-card summary-card" style={{ "--card-accent": card.brand.accent } as CSSProperties}>
      <header><strong>{card.brand.name} · AI NEWS SUMMARY</strong><span>{String(card.index).padStart(2, "0")} / {String(card.briefing.stories.length).padStart(2, "0")}</span></header>
      <div className="summary-kicker"><span>{card.story.category}</span><em>{verified ? "● 교차 검증 완료" : "● 추가 보도 확인 중"}</em></div>
      <h3>{card.story.title}</h3>
      <div className="ai-summary"><strong>AI 3줄 요약</strong><p>{card.story.summary}</p></div>
      <div className="matter-box"><strong>왜 중요한가</strong><p>{card.story.whyItMatters}</p></div>
      <footer><span>출처 {card.story.sources.map((source) => source.publisher).join(" · ")}</span><span>최종 확인 {card.briefing.lastVerifiedAt}</span></footer>
    </article>
  );
}

function cardFileName(card: BriefingCard, index: number) {
  const suffix = card.kind === "story" ? card.story.category : card.kind === "cover" ? "표지" : "오늘의-정리";
  return `${card.brand.name}-${String(index + 1).padStart(2, "0")}-${suffix}.png`;
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

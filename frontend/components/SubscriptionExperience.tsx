"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { BellRing, CheckCircle2, Clock3, LockKeyhole, Smartphone, X } from "lucide-react";
import { PushControls } from "@/components/PushControls";

const openEvent = "achim:open-subscription";

export function SubscriptionTrigger({ className, children }: { className?: string; children: ReactNode }) {
  return <button type="button" className={className} onClick={() => window.dispatchEvent(new Event(openEvent))}>{children}</button>;
}

export function SubscriptionExperience({ onNotice }: { onNotice: (message: string) => void }) {
  const [open, setOpen] = useState(false);
  const deliveryTime = "07:30";
  const [subscribed, setSubscribed] = useState(false);
  const [externalBrowserHref, setExternalBrowserHref] = useState<string | null>(null);
  const [quickSubscribe, setQuickSubscribe] = useState(false);
  const [iphoneSafariSetup, setIphoneSafariSetup] = useState(false);
  const [deviceLabel, setDeviceLabel] = useState("이 브라우저에서 바로 등록할 수 있어요");
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem("achim-gyeol-delivery");
    try {
      if (stored) JSON.parse(stored);
      if (stored) window.localStorage.setItem("achim-gyeol-delivery", JSON.stringify({ time: deliveryTime }));
    } catch {
      window.localStorage.removeItem("achim-gyeol-delivery");
    }
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const detectedInAppBrowser = /KAKAOTALK|NAVER|Instagram|FBAN|FBAV/i.test(navigator.userAgent);
    const androidInAppBrowser = detectedInAppBrowser && /android/i.test(navigator.userAgent);
    const standalone = window.matchMedia("(display-mode: standalone)").matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    const detectedDeviceLabel = detectedInAppBrowser
      ? "알림 받기를 누르면 지원 브라우저로 자동 연결해요"
      : ios && !standalone
      ? "아이폰은 홈 화면에 추가한 뒤 등록할 수 있어요"
      : standalone
        ? "홈 화면에 설치된 아침결에서 등록 중이에요"
        : !("PushManager" in window)
          ? "Safari 또는 최신 Chrome·Edge에서 열어주세요"
          : "이 브라우저에서 바로 등록할 수 있어요";
    queueMicrotask(() => {
      setIphoneSafariSetup(ios && !standalone);
      setExternalBrowserHref(androidInAppBrowser ? buildAndroidBrowserHref() : null);
      setDeviceLabel(detectedDeviceLabel);
      const params = new URLSearchParams(window.location.search);
      const shouldQuickSubscribe = params.get("subscribe") === "1";
      setQuickSubscribe(shouldQuickSubscribe);
      if (params.get("ios-guide") === "1" || shouldQuickSubscribe) setOpen(true);
    });

    const show = () => {
      if (androidInAppBrowser) {
        window.location.href = buildAndroidBrowserHref();
        return;
      }
      setOpen(true);
    };
    window.addEventListener(openEvent, show);
    return () => window.removeEventListener(openEvent, show);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => closeButton.current?.focus(), 40);
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(timer);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return <>
    {externalBrowserHref ? <a className="mobile-subscribe-bar" href={externalBrowserHref}>
      <BellRing size={17} />
      <span>무료 알림 받기</span>
      <b>한 번에</b>
    </a> : <button className={subscribed ? "mobile-subscribe-bar subscribed" : "mobile-subscribe-bar"} type="button" onClick={() => setOpen(true)}>
      {subscribed ? <CheckCircle2 size={17} /> : <BellRing size={17} />}
      <span>{subscribed ? `알림 등록됨 · ${deliveryTime}` : iphoneSafariSetup ? "Safari에서 무료 알림 설정" : "무료 알림 받기"}</span>
      <b>{subscribed ? "설정" : iphoneSafariSetup ? "안내" : "30초"}</b>
    </button>}

    {open && <div className="subscription-modal-layer" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
      <section className="subscription-modal" role="dialog" aria-modal="true" aria-labelledby="subscription-title">
        <header>
          <div><span>FREE SUBSCRIPTION</span><h2 id="subscription-title">내 아침 뉴스 알림</h2></div>
          <button ref={closeButton} type="button" aria-label="알림 등록 창 닫기" onClick={() => setOpen(false)}><X /></button>
        </header>

        <div className="device-readiness"><Smartphone size={19} /><div><strong>현재 기기 확인</strong><span>{deviceLabel}</span></div></div>

        {!quickSubscribe && <div className="modal-setting-grid">
          <div className="modal-time-field"><span><Clock3 size={15} /> 매일 고정 도착</span><div className="fixed-delivery-time"><strong>매일 오전 7:30</strong><small>전날 뉴스는 오전 1시부터 종합해요</small></div></div>
        </div>}

        {!quickSubscribe && <div className="modal-arrival-preview">
          <div className="push-app-icon"><BellRing size={18} /></div>
          <div><strong>아침결 · 오늘 알아야 할 뉴스가 도착했어요</strong><span>매일 오전 7:30 · 핵심 내용과 알아야 할 것</span></div>
        </div>}

        <PushControls deliveryTime={deliveryTime} onNotice={(message) => { onNotice(message); }} onSubscriptionChange={setSubscribed} />
        <p className="modal-privacy"><LockKeyhole size={14} /> 이름·이메일 없이 익명 기기 ID와 알림 시간만 저장합니다.</p>
      </section>
    </div>}
  </>;
}

function buildAndroidBrowserHref() {
  const target = new URL(window.location.href);
  target.searchParams.set("subscribe", "1");
  target.hash = "";
  const destination = `${target.host}${target.pathname}${target.search}`;
  return `intent://${destination}#Intent;scheme=https;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;S.browser_fallback_url=${encodeURIComponent(target.toString())};end`;
}

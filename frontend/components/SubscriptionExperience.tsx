"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { BellRing, CalendarDays, CheckCircle2, Clock3, LockKeyhole, Smartphone, X } from "lucide-react";
import { PushControls } from "@/components/PushControls";

const openEvent = "achim:open-subscription";
const weekdays = ["월", "화", "수", "목", "금", "토", "일"];

export function SubscriptionTrigger({ className, children }: { className?: string; children: ReactNode }) {
  return <button type="button" className={className} onClick={() => window.dispatchEvent(new Event(openEvent))}>{children}</button>;
}

export function SubscriptionExperience({ onNotice }: { onNotice: (message: string) => void }) {
  const [open, setOpen] = useState(false);
  const [deliveryTime, setDeliveryTime] = useState("08:30");
  const [selectedDays, setSelectedDays] = useState([0, 1, 2, 3, 4]);
  const [subscribed, setSubscribed] = useState(false);
  const [deviceLabel, setDeviceLabel] = useState("이 브라우저에서 바로 등록할 수 있어요");
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem("achim-gyeol-delivery");
    let storedTime: string | undefined;
    let storedDays: number[] | undefined;
    try {
      const setting = stored ? JSON.parse(stored) as { time?: string; days?: number[] } : {};
      storedTime = setting.time === "07:00" || setting.time === "08:00" ? "08:30" : setting.time;
      storedDays = setting.days;
      if (setting.time === "07:00" || setting.time === "08:00") window.localStorage.setItem("achim-gyeol-delivery", JSON.stringify({ ...setting, time: "08:30" }));
    } catch {
      window.localStorage.removeItem("achim-gyeol-delivery");
    }
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const standalone = window.matchMedia("(display-mode: standalone)").matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    const detectedDeviceLabel = ios && !standalone
      ? "아이폰은 홈 화면에 추가한 뒤 등록할 수 있어요"
      : standalone
        ? "홈 화면에 설치된 아침결에서 등록 중이에요"
        : !("PushManager" in window)
          ? "Safari 또는 최신 Chrome·Edge에서 열어주세요"
          : "이 브라우저에서 바로 등록할 수 있어요";
    queueMicrotask(() => {
      if (storedTime) setDeliveryTime(storedTime);
      if (storedDays) setSelectedDays(storedDays);
      setDeviceLabel(detectedDeviceLabel);
    });

    const show = () => setOpen(true);
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

  const toggleDay = (index: number) => {
    setSelectedDays((days) => days.includes(index) ? days.filter((day) => day !== index) : [...days, index].sort());
  };

  return <>
    <button className={subscribed ? "mobile-subscribe-bar subscribed" : "mobile-subscribe-bar"} type="button" onClick={() => setOpen(true)}>
      {subscribed ? <CheckCircle2 size={17} /> : <BellRing size={17} />}
      <span>{subscribed ? `알림 등록됨 · ${deliveryTime}` : "무료 알림 받기"}</span>
      <b>{subscribed ? "설정" : "30초"}</b>
    </button>

    {open && <div className="subscription-modal-layer" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
      <section className="subscription-modal" role="dialog" aria-modal="true" aria-labelledby="subscription-title">
        <header>
          <div><span>FREE SUBSCRIPTION</span><h2 id="subscription-title">내 아침 뉴스 알림</h2></div>
          <button ref={closeButton} type="button" aria-label="알림 등록 창 닫기" onClick={() => setOpen(false)}><X /></button>
        </header>

        <div className="device-readiness"><Smartphone size={19} /><div><strong>현재 기기 확인</strong><span>{deviceLabel}</span></div></div>

        <div className="modal-setting-grid">
          <label className="modal-time-field"><span><Clock3 size={15} /> 도착 시각</span><input type="time" value={deliveryTime} onChange={(event) => setDeliveryTime(event.target.value)} /></label>
          <div className="modal-day-field"><span><CalendarDays size={15} /> 받을 요일</span><div className="weekday-list">{weekdays.map((day, index) => <button type="button" key={day} className={selectedDays.includes(index) ? "active" : ""} onClick={() => toggleDay(index)}>{day}</button>)}</div></div>
        </div>

        <div className="modal-arrival-preview">
          <div className="push-app-icon"><BellRing size={18} /></div>
          <div><strong>아침결 · 어제 뉴스가 도착했어요</strong><span>선택한 요일 {deliveryTime} 이후 · 핵심 뉴스와 출처 카드</span></div>
        </div>

        <PushControls deliveryTime={deliveryTime} selectedDays={selectedDays} onNotice={(message) => { onNotice(message); }} onSubscriptionChange={setSubscribed} />
        <p className="modal-privacy"><LockKeyhole size={14} /> 이름·이메일 없이 익명 기기 ID와 알림 시간만 저장합니다.</p>
      </section>
    </div>}
  </>;
}

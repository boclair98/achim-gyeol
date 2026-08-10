"use client";

import { useEffect, useState, type ReactNode } from "react";
import { BellRing, Check, Clock3, Download, RotateCcw, ShieldCheck, SlidersHorizontal, Trash2 } from "lucide-react";
import { defaultReaderPreferences, type ReaderPreferences } from "@/lib/experience";

const categories = ["정책", "경제", "사회", "테크"];
const weekdays = ["월", "화", "수", "목", "금", "토", "일"];
const channels = ["PWA", "Email", "Kakao"];

export function PreferenceCenter() {
  const [preferences, setPreferences] = useState<ReaderPreferences>(defaultReaderPreferences);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = window.localStorage.getItem("achim-gyeol-reader-preferences");
      if (stored) try { setPreferences(JSON.parse(stored)); } catch { /* Ignore malformed local demo data. */ }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const toggle = (field: "categories" | "channels", value: string) => setPreferences((current) => ({ ...current, [field]: current[field].includes(value) ? current[field].filter((item) => item !== value) : [...current[field], value] }));
  const toggleDay = (day: number) => setPreferences((current) => ({ ...current, weekdays: current.weekdays.includes(day) ? current.weekdays.filter((item) => item !== day) : [...current.weekdays, day].sort() }));
  const save = () => { window.localStorage.setItem("achim-gyeol-reader-preferences", JSON.stringify(preferences)); setNotice("내 브리핑 설정을 이 기기에 저장했습니다."); };
  const exportData = () => {
    const blob = new Blob([JSON.stringify({ preferences, savedEditions: JSON.parse(window.localStorage.getItem("achim-gyeol-saved-editions") ?? "[]") }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "achim-gyeol-my-data.json"; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice("이 기기에 저장된 내 데이터를 내려받았습니다.");
  };
  const clearData = () => { ["achim-gyeol-reader-preferences", "achim-gyeol-saved-editions", "achim-gyeol-delivery"].forEach((key) => window.localStorage.removeItem(key)); setPreferences(defaultReaderPreferences); setNotice("독자 설정과 저장한 브리핑을 이 기기에서 삭제했습니다."); };

  return <>
    <section className="preference-hero"><span>READER CONTROL CENTER</span><h1>뉴스가 나를 방해하지 않도록,<br /><em>양과 시간을 직접 정합니다.</em></h1><p>관심 분야, 읽을 분량, 도착 시각과 채널을 한곳에서 관리합니다. 현재 데모 설정은 이 기기에만 저장됩니다.</p></section>
    <section className="preference-layout">
      <div className="preference-main">
        <PreferenceBlock icon={SlidersHorizontal} title="관심 분야" description="선택한 분야를 우선해 브리핑을 구성합니다."><div className="choice-grid">{categories.map((item) => <button key={item} className={preferences.categories.includes(item) ? "active" : ""} onClick={() => toggle("categories", item)}><Check size={14} />{item}</button>)}</div></PreferenceBlock>
        <PreferenceBlock icon={Clock3} title="도착 일정" description="방해받지 않을 요일과 시간을 선택하세요."><div className="schedule-preference"><input aria-label="도착 시각" type="time" value={preferences.deliveryTime} onChange={(event) => setPreferences({ ...preferences, deliveryTime: event.target.value })} /><div>{weekdays.map((day, index) => <button key={day} className={preferences.weekdays.includes(index) ? "active" : ""} onClick={() => toggleDay(index)}>{day}</button>)}</div></div></PreferenceBlock>
        <PreferenceBlock icon={BellRing} title="분량과 채널" description="길이별 기사 수와 전달 방식을 정합니다."><div className="digest-options">{(["compact", "standard", "deep"] as const).map((size) => <button key={size} className={preferences.digestSize === size ? "active" : ""} onClick={() => setPreferences({ ...preferences, digestSize: size })}><strong>{size === "compact" ? "빠르게" : size === "standard" ? "기본" : "깊게"}</strong><span>{size === "compact" ? "3개 · 3분" : size === "standard" ? "5개 · 5분" : "8개 · 10분"}</span></button>)}</div><div className="channel-options">{channels.map((item) => <button key={item} className={preferences.channels.includes(item) ? "active" : ""} onClick={() => toggle("channels", item)}>{item}<small>{item === "PWA" ? "즉시 사용" : "API 연결 후"}</small></button>)}</div></PreferenceBlock>
      </div>
      <aside className="preference-summary"><span>LIVE PREFERENCE</span><h2>나의 아침결</h2><dl><div><dt>관심 분야</dt><dd>{preferences.categories.length}개</dd></div><div><dt>도착 시간</dt><dd>{preferences.deliveryTime}</dd></div><div><dt>요일</dt><dd>{preferences.weekdays.length}일</dd></div><div><dt>브리핑</dt><dd>{preferences.digestSize === "compact" ? "3개" : preferences.digestSize === "standard" ? "5개" : "8개"}</dd></div></dl><label><input type="checkbox" checked={preferences.consent} onChange={(event) => setPreferences({ ...preferences, consent: event.target.checked })} /><span><strong>브리핑 수신에 동의합니다</strong><small>언제든 변경하거나 철회할 수 있습니다.</small></span></label><button className="studio-primary" onClick={save}><Check size={15} /> 설정 저장</button><div className="privacy-actions"><button onClick={exportData}><Download size={14} /> 내 데이터 받기</button><button onClick={() => setPreferences(defaultReaderPreferences)}><RotateCcw size={14} /> 초기화</button><button className="danger" onClick={clearData}><Trash2 size={14} /> 기기 데이터 삭제</button></div><footer><ShieldCheck size={16} /> 서버 전송 없이 브라우저에만 저장되는 데모입니다.</footer></aside>
    </section>
    {notice && <div className="notice" role="status"><span>{notice}</span><button onClick={() => setNotice("")}>확인</button></div>}
  </>;
}

function PreferenceBlock({ icon: Icon, title, description, children }: { icon: typeof SlidersHorizontal; title: string; description: string; children: ReactNode }) {
  return <article className="preference-block"><header><Icon /><div><h2>{title}</h2><p>{description}</p></div></header>{children}</article>;
}

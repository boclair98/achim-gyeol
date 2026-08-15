"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bookmark, CalendarDays, CheckCircle2, ChevronRight, Clock3, Search, Settings2 } from "lucide-react";
import { archiveEditions } from "@/lib/experience";

const filters = ["전체", "정책", "경제", "사회", "테크"];

export function ReaderArchive() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("전체");
  const [saved, setSaved] = useState<string[]>([]);
  const [savedOnly, setSavedOnly] = useState(false);
  const [archive, setArchive] = useState(archiveEditions);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = window.localStorage.getItem("achim-gyeol-saved-editions");
      if (stored) try { setSaved(JSON.parse(stored)); } catch { /* Ignore malformed local demo data. */ }
      fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL ?? ""}/api/briefings`, { cache: "no-store" })
        .then((response) => response.ok ? response.json() : Promise.reject())
        .then((items: Array<{ briefingDate: string; dateLabel: string; lead: string; readMinutes: number; verifiedCount: number; storyCount: number; categories: string[]; headlines: string[] }>) => setArchive(items.map((item) => ({ id: item.briefingDate, date: item.dateLabel.split(" ").slice(0, 2).join(" "), weekday: item.dateLabel.split(" ").slice(2).join(" "), lead: item.lead, categories: item.categories, readMinutes: item.readMinutes, verified: item.verifiedCount, storyCount: item.storyCount, headlines: item.headlines }))))
        .catch(() => undefined);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const editions = useMemo(() => archive.filter((edition) => {
    const matchesFilter = filter === "전체" || edition.categories.includes(filter);
    const text = `${edition.lead} ${edition.headlines.join(" ")}`.toLowerCase();
    return matchesFilter && (!savedOnly || saved.includes(edition.id)) && text.includes(query.toLowerCase());
  }), [archive, filter, query, saved, savedOnly]);

  const toggleSaved = (id: string) => {
    setSaved((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      window.localStorage.setItem("achim-gyeol-saved-editions", JSON.stringify(next));
      return next;
    });
  };

  return <>
    <section className="archive-hero">
      <div><span>지난 뉴스</span><h1>읽은 뉴스는 사라지지 않고,<br /><em>내 보관함에 쌓입니다.</em></h1><p>날짜와 분야로 지난 브리핑을 찾고, 다시 볼 날짜는 이 기기에 저장하세요.</p></div>
      <aside><CalendarDays /><strong>{archive.length}개</strong><span>최근 브리핑</span><i /><CheckCircle2 /><strong>{archive.reduce((total, edition) => total + edition.storyCount, 0)}건</strong><span>보관된 뉴스</span></aside>
    </section>
    <section className="archive-workspace">
      <header><div className="archive-search"><Search size={17} /><input aria-label="브리핑 검색" placeholder="제목이나 키워드 검색" value={query} onChange={(event) => setQuery(event.target.value)} /></div><Link href="/preferences"><Settings2 size={15} /> 내 브리핑 설정</Link></header>
      <div className="archive-toolbar"><nav aria-label="보관함 분야">{filters.map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}</button>)}</nav><button className={savedOnly ? "saved active" : "saved"} onClick={() => setSavedOnly(!savedOnly)}><Bookmark size={14} fill={savedOnly ? "currentColor" : "none"} /> 저장한 브리핑</button></div>
      <div className="edition-grid">{editions.length ? editions.map((edition) => <article key={edition.id} className="edition-card">
        <header><div><time>{edition.date}</time><span>{edition.weekday}</span></div><button aria-label={`${edition.date} 저장`} className={saved.includes(edition.id) ? "active" : ""} onClick={() => toggleSaved(edition.id)}><Bookmark size={17} fill={saved.includes(edition.id) ? "currentColor" : "none"} /></button></header>
        <div className="edition-tags">{edition.categories.map((item) => <span key={item}>{item}</span>)}</div><h2>{edition.lead}</h2>
        <ol>{edition.headlines.map((headline, index) => <li key={headline}><b>0{index + 1}</b><span>{headline}</span></li>)}</ol>
        <footer><span><Clock3 size={13} /> 약 {edition.readMinutes}분</span><span><CheckCircle2 size={13} /> 뉴스 {edition.storyCount}건</span><Link href={`/briefing/?date=${edition.id}`}>읽기 <ChevronRight size={14} /></Link></footer>
      </article>) : <div className="archive-empty"><Search /><strong>조건에 맞는 브리핑이 없습니다.</strong><span>검색어나 필터를 바꿔보세요.</span></div>}</div>
    </section>
  </>;
}

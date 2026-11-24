"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Bookmark, CalendarDays, CheckCircle2, ChevronRight, Clock3, Search, Settings2 } from "lucide-react";
import type { ArchiveEdition } from "@/lib/experience";

const savedKey = "achim-gyeol-saved-editions";
const isStrings = (value: unknown): value is string[] => Array.isArray(value) && value.every((item) => typeof item === "string");

function readEditions(value: unknown): ArchiveEdition[] {
  if (!Array.isArray(value)) throw new Error("Invalid briefing list");
  return value.map((item: unknown) => {
    if (!item || typeof item !== "object") throw new Error("Invalid briefing");
    const entry = item as Record<string, unknown>;
    if (typeof entry.briefingDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(entry.briefingDate)
      || typeof entry.dateLabel !== "string" || typeof entry.lead !== "string"
      || !isStrings(entry.categories) || !isStrings(entry.headlines)
      || ![entry.readMinutes, entry.verifiedCount, entry.storyCount].every((count) => typeof count === "number" && Number.isFinite(count) && count >= 0)) {
      throw new Error("Invalid briefing data");
    }
    return {
      id: entry.briefingDate,
      date: entry.dateLabel.split(" ").slice(0, 2).join(" "),
      weekday: entry.dateLabel.split(" ").slice(2).join(" "),
      lead: entry.lead,
      categories: [...new Set(entry.categories)],
      readMinutes: entry.readMinutes as number,
      verified: entry.verifiedCount as number,
      storyCount: entry.storyCount as number,
      headlines: entry.headlines,
    };
  });
}

export function ReaderArchive() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("전체");
  const [saved, setSaved] = useState<string[]>([]);
  const [savedOnly, setSavedOnly] = useState(false);
  const [archive, setArchive] = useState<ArchiveEdition[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [reload, setReload] = useState(0);
  const [storageNotice, setStorageNotice] = useState("");
  const savedRef = useRef<string[]>([]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored = window.localStorage.getItem(savedKey);
        const parsed: unknown = stored ? JSON.parse(stored) : [];
        savedRef.current = isStrings(parsed) ? parsed.filter((id) => /^\d{4}-\d{2}-\d{2}$/.test(id)) : [];
        setSaved(savedRef.current);
      } catch { setStorageNotice("이 기기의 저장한 브리핑을 확인하지 못했어요. 지난 뉴스는 계속 읽을 수 있습니다."); }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let unmounted = false;
    const deadline = window.setTimeout(() => controller.abort(), 15_000);
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL ?? ""}/api/briefings`, { cache: "no-store", signal: controller.signal })
        .then((response) => response.ok ? response.json() : Promise.reject())
        .then(readEditions)
        .then((items) => { if (!controller.signal.aborted) { setArchive(items); setStatus("ready"); } })
        .catch(() => { if (!unmounted) setStatus("error"); })
        .finally(() => window.clearTimeout(deadline));
    return () => { unmounted = true; window.clearTimeout(deadline); controller.abort(); };
  }, [reload]);

  const filters = useMemo(() => ["전체", ...new Set(archive.flatMap((edition) => edition.categories))], [archive]);

  const editions = useMemo(() => archive.filter((edition) => {
    const matchesFilter = filter === "전체" || edition.categories.includes(filter);
    const text = `${edition.lead} ${edition.headlines.join(" ")}`.toLowerCase();
    return matchesFilter && (!savedOnly || saved.includes(edition.id)) && text.includes(query.toLowerCase());
  }), [archive, filter, query, saved, savedOnly]);

  const toggleSaved = (id: string) => {
    const next = savedRef.current.includes(id) ? savedRef.current.filter((item) => item !== id) : [...savedRef.current, id];
    savedRef.current = next;
    setSaved(next);
    try {
      window.localStorage.setItem(savedKey, JSON.stringify(next));
      setStorageNotice("저장한 브리핑 목록을 이 기기에 반영했어요.");
    } catch { setStorageNotice("기기 저장소를 사용할 수 없어 이번 화면에만 반영했어요. 저장소를 허용한 뒤 다시 저장해 주세요."); }
  };

  const resetFilters = () => { setQuery(""); setFilter("전체"); setSavedOnly(false); };

  return <>
    <section className="archive-hero">
      <div><span>다시 읽는 아침결</span><h1>지난 뉴스</h1><p>다시 읽고 싶은 아침을 찾아보세요. 저장한 날짜는 이 기기에서 다시 볼 수 있어요.</p></div>
      {status === "ready" && <aside><CalendarDays /><strong>{archive.length}개</strong><span>최근 브리핑</span><i /><CheckCircle2 /><strong>{archive.reduce((total, edition) => total + edition.storyCount, 0)}건</strong><span>보관된 뉴스</span></aside>}
    </section>
    <section className="archive-workspace">
      <header><div className="archive-search"><Search size={17} /><input aria-label="브리핑 검색" placeholder="제목이나 키워드 검색" value={query} onChange={(event) => setQuery(event.target.value)} /></div><Link href="/preferences"><Settings2 size={15} /> 내 브리핑 설정</Link></header>
      <div className="archive-toolbar"><nav aria-label="보관함 분야">{filters.map((item) => <button type="button" key={item} aria-pressed={filter === item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}</button>)}</nav><button type="button" aria-pressed={savedOnly} className={savedOnly ? "saved active" : "saved"} onClick={() => setSavedOnly(!savedOnly)}><Bookmark size={14} fill={savedOnly ? "currentColor" : "none"} /> 저장한 브리핑</button></div>
      <p className="archive-filter-hint">분야를 고르면 해당 분야가 포함된 날짜의 브리핑을 보여드려요.</p>
      {storageNotice && <p className="archive-storage-notice" role="status">{storageNotice}</p>}
      <div className="edition-grid" aria-busy={status === "loading"}>{status === "loading" ? <div className="archive-empty" role="status"><Clock3 /><strong>지난 뉴스를 불러오고 있어요.</strong></div> : status === "error" ? <div className="archive-empty" role="alert"><Search /><strong>지난 뉴스를 불러오지 못했어요.</strong><span>연결을 확인하고 다시 시도해 주세요.</span><button type="button" onClick={() => { setStatus("loading"); setReload((value) => value + 1); }}>다시 시도</button></div> : editions.length ? editions.map((edition) => <article key={edition.id} className="edition-card">
        <header><div><time dateTime={edition.id}>{edition.date}</time><span>{edition.weekday}</span></div><button type="button" aria-label={`${edition.date} ${saved.includes(edition.id) ? "저장 해제" : "저장"}`} aria-pressed={saved.includes(edition.id)} className={saved.includes(edition.id) ? "active" : ""} onClick={() => toggleSaved(edition.id)}><Bookmark size={17} fill={saved.includes(edition.id) ? "currentColor" : "none"} /></button></header>
        <div className="edition-tags">{edition.categories.map((item) => <span key={item}>{item}</span>)}</div><h2>{edition.lead}</h2>
        <ol>{edition.headlines.map((headline, index) => <li key={headline}><b>0{index + 1}</b><span>{headline}</span></li>)}</ol>
        <footer><span><Clock3 size={13} /> 약 {edition.readMinutes}분</span><span><CheckCircle2 size={13} /> 뉴스 {edition.storyCount}건</span><Link href={`/briefing/?date=${edition.id}`}>읽기 <ChevronRight size={14} /></Link></footer>
      </article>) : <div className="archive-empty"><Search /><strong>{archive.length ? "조건에 맞는 브리핑이 없습니다." : "아직 발행된 브리핑이 없습니다."}</strong><span>{archive.length ? "검색어나 필터를 바꿔보세요." : "새 브리핑이 발행되면 이곳에 표시됩니다."}</span>{archive.length > 0 && <button type="button" onClick={resetFilters}>필터 초기화</button>}</div>}</div>
    </section>
  </>;
}

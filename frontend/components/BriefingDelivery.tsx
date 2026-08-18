"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, BookOpen, CalendarDays, Check, CheckCircle2, ChevronLeft, ChevronRight, FileCheck2, Flag, Radar, RefreshCw, Share2, Sparkles, Settings2, ThumbsDown, ThumbsUp, WifiOff } from "lucide-react";
import { demoBriefing, type Briefing, type Story, type StoryInterest } from "@/lib/briefing";
import { deviceHeaders } from "@/lib/device";
import { defaultBrand, type BriefingBrand } from "@/lib/product";
import { StoryVisual } from "@/components/StoryVisual";

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
const lastBriefingKey = "achim-gyeol-last-live-briefing";
type BriefingLoadState = "loading" | "live" | "cached" | "demo";

export function BriefingDelivery() {
  const [briefing, setBriefing] = useState<Briefing>(demoBriefing);
  const [brand, setBrand] = useState<BriefingBrand>(defaultBrand);
  const [loading, setLoading] = useState(true);
  const [readerFont, setReaderFont] = useState<"small" | "normal" | "large">("normal");
  const [loadState, setLoadState] = useState<BriefingLoadState>("loading");
  const [reloadVersion, setReloadVersion] = useState(0);
  const [selectedDate, setSelectedDate] = useState(() => typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("date") ?? "");

  useEffect(() => {
    const brandTimer = window.setTimeout(() => {
      const storedBrand = window.localStorage.getItem("achim-gyeol-brand");
      if (storedBrand) try { setBrand(JSON.parse(storedBrand)); } catch { window.localStorage.removeItem("achim-gyeol-brand"); }
      const storedFont = window.localStorage.getItem("achim-gyeol-reader-font");
      if (storedFont === "small" || storedFont === "normal" || storedFont === "large") setReaderFont(storedFont);
    }, 0);
    return () => window.clearTimeout(brandTimer);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const briefingPath = selectedDate ? `/api/briefings/${encodeURIComponent(selectedDate)}` : "/api/briefings/today";
    fetch(`${apiBase}${briefingPath}`, { cache: "no-store", headers: deviceHeaders(), signal: controller.signal })
      .then((response) => { if (!response.ok) throw new Error("briefing unavailable"); return response.json(); })
      .then((data: Briefing) => {
        if (!Array.isArray(data.stories) || data.stories.length === 0) throw new Error("empty briefing");
        setBriefing(data);
        setLoadState("live");
        if (!selectedDate && data.productionReady) window.localStorage.setItem(lastBriefingKey, JSON.stringify(data));
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        const cached = !selectedDate ? readCachedBriefing() : null;
        if (cached) {
          setBriefing(cached);
          setLoadState("cached");
        } else {
          setBriefing(demoBriefing);
          setLoadState("demo");
        }
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [reloadVersion, selectedDate]);

  const changeFont = (font: "small" | "normal" | "large") => { setReaderFont(font); window.localStorage.setItem("achim-gyeol-reader-font", font); };
  const retryBriefing = () => { setLoading(true); setLoadState("loading"); setReloadVersion((current) => current + 1); };
  const chooseBriefingDate = (date: string) => {
    setLoading(true);
    setLoadState("loading");
    setSelectedDate(date);
    const query = date ? `?date=${encodeURIComponent(date)}` : "";
    window.history.replaceState(null, "", `${window.location.pathname}${query}`);
  };
  const openStoryCard = (storyId: number) => {
    const card = document.getElementById(`briefing-card-${storyId}`);
    const track = document.getElementById("briefing-card-track");
    const deck = document.getElementById("briefing-card-deck");
    if (!card || !track || !deck) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const behavior: ScrollBehavior = reduceMotion ? "auto" : "smooth";
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#briefing-card-${storyId}`);
    track.scrollTo({ left: Math.max(0, card.offsetLeft - track.offsetLeft - 14), behavior });
    deck.scrollIntoView({ behavior, block: "start" });
    card.focus({ preventScroll: true });
  };

  const liveToday = loadState === "live" && isTodayInKorea(briefing.briefingDate);
  const reportingEnabled = loadState === "live" && liveToday && briefing.productionReady === true;

  return <main className={`news-reader-shell focus-reader-shell font-${readerFont}`}>
    <header className="news-reader-topbar">
      <Link href="/" className="delivered-brand"><i /><strong>{brand.name}</strong><span>MORNING NEWS</span></Link>
      <div className="reader-top-actions"><div aria-label="글자 크기"><button className={readerFont === "small" ? "active" : ""} onClick={() => changeFont("small")}>가</button><button className={readerFont === "normal" ? "active" : ""} onClick={() => changeFont("normal")}>가</button><button className={readerFont === "large" ? "active" : ""} onClick={() => changeFont("large")}>가</button></div><Link href="/#delivery-deck" className="delivered-settings"><Settings2 size={16} /> 알림 설정</Link></div>
    </header>

    <BriefingAvailability state={loadState} briefing={briefing} liveToday={liveToday} selectedDate={selectedDate} onRetry={retryBriefing} />
    <div className="briefing-history-bar">
      <div><CalendarDays size={18} /><span><strong>지난 브리핑 다시 보기</strong><small>날짜를 고르면 해당 날의 카드와 원문 정보가 열립니다.</small></span></div>
      <div className="briefing-history-actions">
        <label><span>날짜 선택</span><input type="date" value={selectedDate} onChange={(event) => chooseBriefingDate(event.target.value)} /></label>
        {selectedDate && <button type="button" onClick={() => chooseBriefingDate("")}>오늘 브리핑</button>}
      </div>
    </div>

    <DailyBriefingSheets briefing={briefing} reportingEnabled={reportingEnabled} />

  </main>;
}

function BriefingAvailability({ state, briefing, liveToday, selectedDate, onRetry }: { state: BriefingLoadState; briefing: Briefing; liveToday: boolean; selectedDate: string; onRetry: () => void }) {
  if (state === "live" && selectedDate) return <div className="briefing-availability live" role="status"><CheckCircle2 size={16} /><span><strong>{briefing.dateLabel} 브리핑을 불러왔어요</strong> · 지난 뉴스</span></div>;
  if (state === "live" && liveToday && briefing.productionReady) return <div className="briefing-availability live" role="status"><CheckCircle2 size={16} /><span><strong>오늘 뉴스가 도착했습니다</strong> · {briefing.dateLabel}</span></div>;
  if (state === "live" && liveToday) return <div className="briefing-availability partial" role="status"><AlertTriangle size={16} /><span><strong>오늘 브리핑 보완 중</strong> · 현재 준비된 뉴스 {briefing.stories.length}건을 먼저 보여드리고 있습니다.</span><button type="button" onClick={onRetry}><RefreshCw size={14} /> 새로 확인</button></div>;
  const message = state === "loading"
    ? "오늘 브리핑을 연결하고 있습니다."
    : state === "cached"
      ? `연결이 잠시 느려 최근 브리핑(${briefing.dateLabel})을 보여드립니다.`
      : state === "demo"
        ? "실제 브리핑을 불러오지 못해 사용법 확인용 예시만 보여드립니다."
        : `오늘 뉴스를 준비 중이라 최근 브리핑(${briefing.dateLabel})을 보여드립니다.`;
  return <div className={`briefing-availability ${state}`} role="status"><WifiOff size={16} /><span><strong>{state === "demo" ? "화면 예시" : state === "cached" ? "저장된 브리핑" : state === "loading" ? "불러오는 중" : "최근 브리핑"}</strong> · {message}</span>{state !== "loading" && <button type="button" onClick={onRetry}><RefreshCw size={14} /> 새로 확인</button>}</div>;
}

function DailyBriefingSheets({ briefing, reportingEnabled }: { briefing: Briefing; reportingEnabled: boolean }) {
  const [page, setPage] = useState(0);
  const [readStories, setReadStories] = useState<number[]>([]);
  const [preferredCategories, setPreferredCategories] = useState<string[]>([]);
  const [digestSize, setDigestSize] = useState<"compact" | "standard" | "deep">("standard");
  const trackRef = useRef<HTMLDivElement>(null);
  const orderedStories = useMemo(() => {
    const coreStories = briefing.stories.slice(0, 3);
    const personalizedStories = briefing.stories.slice(3).sort((a, b) => Number(preferredCategories.includes(b.category)) - Number(preferredCategories.includes(a.category)));
    return [...coreStories, ...personalizedStories];
  }, [briefing.stories, preferredCategories]);
  const deckPages = useMemo(() => orderedStories.map((story) => ({ kind: "story" as const, story })), [orderedStories]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const savedRead = safeJsonParse<number[]>(window.localStorage.getItem(`achim-gyeol-read-${briefing.id}`), []);
      const savedPreferences = safeJsonParse<{ categories?: string[]; digestSize?: "compact" | "standard" | "deep" }>(window.localStorage.getItem("achim-gyeol-reader-preferences"), {});
      setReadStories(savedRead);
      setPreferredCategories(savedPreferences.categories ?? []);
      setDigestSize(savedPreferences.digestSize ?? "standard");
      setPage(0);
    }, 0);
    if (reportingEnabled) void trackReaderEvent("BRIEFING_OPEN", briefing.id);
    return () => window.clearTimeout(timer);
  }, [briefing.id, reportingEnabled]);

  const moveTo = (nextPage: number) => {
    const safePage = Math.max(0, Math.min(deckPages.length - 1, nextPage));
    const track = trackRef.current;
    if (!track) return;
    const target = track.querySelector<HTMLElement>(`[data-page-index="${safePage}"]`);
    if (target) track.scrollTo({ left: Math.max(0, target.offsetLeft - track.offsetLeft - 14), behavior: "smooth" });
    setPage(safePage);
  };

  const openStoryCard = (storyId: number) => {
    const card = document.getElementById(`briefing-card-${storyId}`);
    const track = document.getElementById("briefing-card-track");
    const deck = document.getElementById("briefing-card-deck");
    if (!card || !track || !deck) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#briefing-card-${storyId}`);
    track.scrollTo({ left: Math.max(0, card.offsetLeft - track.offsetLeft - 14), behavior: reduceMotion ? "auto" : "smooth" });
    deck.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    card.focus({ preventScroll: true });
  };

  const markRead = (storyId: number, pageIndex: number) => {
    setReadStories((current) => {
      const next = current.includes(storyId) ? current : [...current, storyId];
      window.localStorage.setItem(`achim-gyeol-read-${briefing.id}`, JSON.stringify(next));
      if (reportingEnabled && next.length === briefing.stories.length) void trackReaderEvent("COMPLETE", briefing.id);
      return next;
    });
    if (reportingEnabled && !readStories.includes(storyId)) void trackReaderEvent("CARD_VIEW", briefing.id, storyId);
    setPage(pageIndex);
  };

  const shareStory = async (story: Story) => {
    try {
      const url = `${window.location.origin}/briefing/#news-${story.id}`;
      if (navigator.share) await navigator.share({ title: story.title, text: story.oneLineSummary || story.summary, url });
      else await navigator.clipboard.writeText(url);
      if (reportingEnabled) void trackReaderEvent("SHARE", briefing.id, story.id);
    } catch { /* A dismissed share sheet is not an error. */ }
  };

  return <section className="brief-sheet-section" aria-label="오늘의 아침결 카드 브리핑">
    <div className="brief-sheet-deck" id="briefing-card-deck">
      <div className="brief-sheet-track" id="briefing-card-track" ref={trackRef} onScroll={(event) => {
        const track = event.currentTarget;
        if (track.clientWidth) {
          const cards = Array.from(track.querySelectorAll<HTMLElement>("[data-page-index]"));
          const center = track.scrollLeft + track.clientWidth / 2;
          const nextPage = cards.reduce((best, card, index) => {
            const distance = Math.abs(card.offsetLeft + card.clientWidth / 2 - center);
            const bestCard = cards[best];
            const bestDistance = bestCard ? Math.abs(bestCard.offsetLeft + bestCard.clientWidth / 2 - center) : Number.POSITIVE_INFINITY;
            return distance < bestDistance ? index : best;
          }, 0);
          const selected = deckPages[nextPage];
          if (nextPage !== page && selected) markRead(selected.story.id, nextPage);
        }
      }}>
        {orderedStories.map((story, storyPageIndex) => {
          const pageIndex = storyPageIndex;
          const storyIndex = briefing.stories.findIndex((item) => item.id === story.id) + 1;
          return <article className={`brief-sheet ${digestSize}`} id={`briefing-card-${story.id}`} data-page-index={pageIndex} aria-label={`${storyPageIndex + 1}번째 뉴스, ${story.title}`} tabIndex={-1} key={`sheet-${story.id}`}>
          <header>
            <div><span>ACHIMGYEOL</span><strong>어제 뉴스 · 오늘 아침 한 번에</strong></div>
            <div><b>{briefing.dateLabel}</b><small>{storyPageIndex + 1} / {orderedStories.length}</small></div>
          </header>
          <div className="brief-sheet-rule"><i /></div>
          <div className="brief-sheet-stories">
            <section className="brief-sheet-story">
              <CoreStoryCard story={story} index={storyIndex} digestSize={digestSize} />
              <OriginalStoryCard story={story} index={storyIndex} reportingEnabled={reportingEnabled} onBackToCard={openStoryCard} />
              {reportingEnabled && <StoryInterestControls key={`${story.id}-${story.viewerInterest ?? "none"}`} story={story} />}
              <footer><span>서로 다른 출처 {story.sources.length}개 · {story.sources.slice(0, 2).map((source) => source.publisher).join(" · ")}</span><div><button type="button" onClick={() => void shareStory(story)} aria-label="뉴스 공유"><Share2 size={13} /> 공유</button></div></footer>
            </section>
          </div>
        </article>})}
      </div>
      <div className="brief-sheet-progress" aria-hidden="true"><i style={{ width: `${((page + 1) / Math.max(deckPages.length, 1)) * 100}%` }} /></div>
      <div className="brief-sheet-controls">
        <button type="button" aria-label="이전 브리핑 카드" onClick={() => moveTo(page - 1)} disabled={page === 0}><ChevronLeft /></button>
        <div><strong>{page + 1}</strong><span>/ {orderedStories.length}</span><small><Check size={11} /> 옆으로 뉴스 · 아래로 핵심 내용과 원문</small></div>
        <button type="button" aria-label="다음 브리핑 카드" onClick={() => moveTo(page + 1)} disabled={page >= deckPages.length - 1}><ChevronRight /></button>
      </div>
    </div>
  </section>;
}

function StoryInterestControls({ story }: { story: Story }) {
  const [selection, setSelection] = useState<StoryInterest | null>(story.viewerInterest ?? null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const save = async (interest: StoryInterest) => {
    if (selection === interest && status === "saved") return;
    const previous = selection;
    setSelection(interest);
    setStatus("saving");
    try {
      const response = await fetch(`${apiBase}/api/stories/${story.id}/interest`, {
        method: "PUT",
        headers: deviceHeaders(),
        body: JSON.stringify({ interest }),
      });
      if (!response.ok) throw new Error("interest unavailable");
      setStatus("saved");
    } catch {
      setSelection(previous);
      setStatus("error");
    }
  };

  return <section className={`brief-sheet-interest ${status}`} aria-label="이 뉴스 관심도">
    <div className="brief-sheet-interest-copy"><Sparkles size={15} /><span><strong>이 주제가 흥미로웠나요?</strong><small>다음 브리핑의 카드 순서에만 반영돼요.</small></span></div>
    <div className="brief-sheet-interest-actions" role="group" aria-label="뉴스 관심도 선택">
      <button type="button" aria-pressed={selection === "INTERESTED"} disabled={status === "saving"} onClick={() => void save("INTERESTED")}><ThumbsUp size={14} /> 흥미로웠어요</button>
      <button type="button" aria-pressed={selection === "NOT_INTERESTED"} disabled={status === "saving"} onClick={() => void save("NOT_INTERESTED")}><ThumbsDown size={14} /> 관심 없어요</button>
    </div>
    <p role="status" aria-live="polite">{status === "saving" ? "관심사를 저장하고 있어요." : status === "saved" ? "이 기기의 다음 브리핑 순서에 반영했어요." : status === "error" ? "저장하지 못했어요. 버튼을 다시 눌러 주세요." : "핵심 뉴스는 숨기지 않고 관심 분야만 조금 앞에 보여드려요."}</p>
  </section>;
}

function CoreStoryCard({ story, index, digestSize }: { story: Story; index: number; digestSize: "compact" | "standard" | "deep" }) {
  const evidenceReady = story.evidenceAvailable && Boolean(story.claims?.length);
  const verified = story.verificationStatus === "VERIFIED";
  const claims = evidenceReady ? story.claims!.slice(0, digestSize === "deep" ? 4 : 3) : summaryPoints(story.summary).slice(0, 3).map((statement) => ({ statement, sources: [] }));
  return <section className={`brief-sheet-core-card ${digestSize}`} aria-label="핵심 내용 카드">
    <div className="brief-sheet-meta"><b>{String(index).padStart(2, "0")}</b><span>{story.category}</span><i className={verified && evidenceReady ? "priority" : ""}>{verified && evidenceReady ? "교차 확인" : "내용 정리"}</i><em className={verified && evidenceReady ? "confirmed" : "checking"}>{story.sources.length}개 출처</em></div>
    <h2>{story.title}</h2>
    <StoryVisual story={story} variant="card" />
    <div className="brief-sheet-conclusion"><strong>한 줄 결론</strong><p>{story.oneLineSummary || summaryPoints(story.summary)[0] || story.title}</p></div>
    <div className="brief-sheet-easy"><strong>이해 포인트</strong><p>{story.plainExplanation || story.summary}</p></div>
    <strong className="brief-sheet-facts-label">핵심 내용</strong>
    <ul>{claims.map((claim, claimIndex) => <li key={`${story.id}-core-${claimIndex}`}>{claim.statement}</li>)}</ul>
    <div className="brief-sheet-matter"><strong>왜 중요한가</strong><p>{story.whyItMatters}</p></div>
    {story.whatToWatch && <div className="brief-sheet-watch"><strong>다음 확인</strong><p>{story.whatToWatch}</p></div>}
  </section>;
}

function OriginalStoryCard({ story, index, reportingEnabled, onBackToCard }: { story: Story; index: number; reportingEnabled: boolean; onBackToCard: (storyId: number) => void }) {
  const evidenceReady = story.evidenceAvailable && Boolean(story.claims?.length);
  const claims = evidenceReady ? story.claims!.map((claim) => claim.statement) : summaryPoints(story.summary);
  const paragraphs = buildDetailedSourceDigest(story, claims);
  return <article className="brief-sheet-original-card" id={`news-${story.id}`} tabIndex={-1} aria-label={`${index}번째 뉴스 원문 정리`}>
    <header><span>원문 통합 정리</span><time>출처 {story.sources.length}개</time></header>
    <div className="brief-sheet-original-rule"><i /></div>
    <div className="brief-sheet-original-kicker"><b>{story.category}</b><span>여러 기사에서 공통으로 확인된 내용</span></div>
    <h3>{story.title}</h3>
    <div className="brief-sheet-original-body">{paragraphs.map((paragraph, paragraphIndex) => <section className="brief-sheet-original-item" key={`${story.id}-original-${paragraphIndex}`}><b>{String(paragraphIndex + 1).padStart(2, "0")}</b><p>{paragraph}</p></section>)}</div>
    {story.uncertainty && <div className="brief-sheet-original-note"><strong>확인되지 않은 부분</strong><p>{story.uncertainty}</p></div>}
    <footer className="brief-sheet-original-sources"><strong>출처</strong><div>{story.sources.map((source, sourceIndex) => <span key={`${source.publisher}-${sourceIndex}`}>[{sourceIndex + 1}] {source.publisher}</span>)}</div></footer>
    {reportingEnabled && <StoryFeedbackPanel storyId={story.id} />}
    <a className="reader-card-return bottom" href={`#briefing-card-${story.id}`} onClick={(event) => { event.preventDefault(); onBackToCard(story.id); }}><ChevronLeft size={16} /> 카드로 돌아가기</a>
  </article>;
}

function NewsArticle({ story, index, reportingEnabled, onBackToCard, embedded = false }: { story: Story; index: number; reportingEnabled: boolean; onBackToCard: (storyId: number) => void; embedded?: boolean }) {
  const evidenceReady = story.evidenceAvailable && Boolean(story.claims?.length);
  const verified = story.verificationStatus === "VERIFIED";
  const confirmedPoints = evidenceReady ? story.claims! : summaryPoints(story.summary).map((statement) => ({ statement, sources: [] }));
  const sourceDigest = buildSourceDigest(story, confirmedPoints.map((claim) => claim.statement));

  return <article className={`reader-article${embedded ? " brief-sheet-embedded-article" : ""}`} id={embedded ? undefined : `news-${story.id}`} tabIndex={-1}>
    {!embedded && <a className="reader-card-return top" href={`#briefing-card-${story.id}`} onClick={(event) => { event.preventDefault(); onBackToCard(story.id); }}><ChevronLeft size={15} /> 이 뉴스 카드로 돌아가기</a>}
    <div className="reader-article-meta"><b>{String(index).padStart(2, "0")}</b><span>{story.category}</span><em className={verified && evidenceReady ? "confirmed" : "checking"}><CheckCircle2 size={14} /> {evidenceReady ? (verified ? "원문 함께" : "내용 정리 중") : "원문 제공"}</em><small>핵심 요약</small></div>
    <h2>{story.title}</h2>
    <StoryVisual story={story} variant="article" />
    <section className="reader-context">
      <h3><BookOpen size={18} /> 기사 이해를 돕는 배경</h3>
      <p>{story.backgroundContext || story.oneLineSummary || story.summary}</p>
      <div><strong>이해 포인트</strong><p>{story.plainExplanation || story.summary}</p></div>
    </section>
    <section className="reader-original-brief">
      <div className="reader-original-brief-heading"><BookOpen size={17} /><span><strong>원문 통합 정리</strong><small>여러 출처의 원문 내용을 겹치는 부분은 덜어내고 한 흐름으로 묶었습니다.</small></span></div>
      <div className="reader-original-brief-body">{sourceDigest.map((paragraph, paragraphIndex) => <p key={`${story.id}-source-digest-${paragraphIndex}`}>{paragraph}</p>)}</div>
    </section>
    <section className="reader-conclusion"><span>한 줄 결론</span><p>{story.oneLineSummary || confirmedPoints[0]?.statement || story.title}</p></section>

    <section className="reader-confirmed">
      <h3><FileCheck2 size={18} /> 핵심 내용</h3>
      <ol>{confirmedPoints.map((claim, claimIndex) => <li key={`${claim.statement}-${claimIndex}`}>
        <p>{claim.statement}</p>
        {claim.sources.length > 0 && <div className="claim-citations">{claim.sources.map((source) => {
          const sourceNumber = story.sources.findIndex((item) => item.url === source.url) + 1;
          return <span key={`${claim.statement}-${source.url}`}>[{sourceNumber}] {source.publisher}</span>;
        })}</div>}
      </li>)}</ol>
      {!evidenceReady && <div className="reader-legacy"><AlertTriangle size={17} /><p>이 뉴스는 아래 원문 목록을 함께 제공합니다.</p></div>}
    </section>

    <section className="reader-why"><span>왜 중요한가</span><p>{story.whyItMatters}</p></section>
    {story.whatToWatch && <section className="reader-watch"><h3><Radar size={17} /> 다음 확인 포인트</h3><p>{story.whatToWatch}</p></section>}
    {story.uncertainty && <section className="reader-uncertainty"><h3><AlertTriangle size={17} /> 더 지켜볼 내용</h3><p>{story.uncertainty}</p></section>}
    {Boolean(story.corrections?.length) && <section className="reader-corrections"><h3>정정 이력</h3>{story.corrections!.map((correction) => <p key={correction.correctedAt}><time>{new Date(correction.correctedAt).toLocaleString("ko-KR")}</time>{correction.reason}</p>)}</section>}

    <div className="reader-source-note"><BookOpen size={16} /><p>원문 통합 정리는 여러 출처의 핵심 사실을 교차 확인해 작성했습니다. 아래에는 검증에 사용한 출처만 표시합니다.</p></div>
    <details open className="reader-sources">
      <summary><BookOpen size={17} /> 출처 {story.sources.length}개</summary>
      <div>{story.sources.map((source, sourceIndex) => <div className="reader-source-item" key={`${source.publisher}-${source.url}`}><span><b>[{sourceIndex + 1}]</b>{source.publisher}<time>{source.publishedAt}</time>{source.primarySource && <small>1차 자료</small>}</span></div>)}</div>
    </details>
    {reportingEnabled && !embedded && <StoryFeedbackPanel storyId={story.id} />}
    <a className="reader-card-return bottom" href={`#briefing-card-${story.id}`} onClick={(event) => { event.preventDefault(); onBackToCard(story.id); }}><ChevronLeft size={16} /> 이 뉴스 카드로 돌아가기</a>
  </article>;
}

function buildSourceDigest(story: Story, claims: string[]) {
  const seen = new Set<string>();
  const add = (value: string | null | undefined) => {
    const text = value?.replace(/\s+/g, " ").trim();
    if (!text) return;
    const key = text.replace(/[.,!?·]/g, "").toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    paragraphs.push(text);
  };
  const paragraphs: string[] = [];
  add(story.summary);
  claims.forEach((claim) => add(claim));
  add(story.backgroundContext);
  add(story.plainExplanation);
  add(story.whyItMatters);
  add(story.whatToWatch);
  return paragraphs.slice(0, 7);
}

function buildDetailedSourceDigest(story: Story, topClaims: string[]) {
  const topFacts = [story.oneLineSummary, story.plainExplanation, ...topClaims, story.whyItMatters, story.whatToWatch]
    .map((value) => normalizeStoryPoint(value ?? ""))
    .filter(Boolean);
  const candidates = [
    story.summary,
    ...((story.claims ?? []).map((claim) => claim.statement)),
    story.backgroundContext,
    story.plainExplanation,
    story.whyItMatters,
    story.whatToWatch,
    story.uncertainty,
    ...((story.corrections ?? []).map((correction) => correction.reason)),
  ];
  const seen = new Set<string>();
  const paragraphs: string[] = [];
  for (const candidate of candidates) {
    const text = candidate?.replace(/\s+/g, " ").trim();
    const normalized = normalizeStoryPoint(text ?? "");
    if (!text || !normalized || seen.has(normalized) || topFacts.includes(normalized)) continue;
    seen.add(normalized);
    paragraphs.push(text);
  }
  return (paragraphs.length ? paragraphs : [story.summary]).slice(0, 8);
}

function buildCommonSourceDigest(story: Story, claims: string[]) {
  const uniqueClaims = Array.from(new Set(claims.map((claim) => claim.replace(/\s+/g, " ").trim()).filter(Boolean)));
  const paragraphs = uniqueClaims.slice(0, 3);
  if (paragraphs.length < 3 && story.whatToWatch?.trim()) paragraphs.push(`현재 기사들에서 공통으로 확인된 다음 변수는 ${story.whatToWatch.trim()}`);
  return paragraphs.slice(0, 3);
}

function StoryFeedbackPanel({ storyId }: { storyId: number }) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const submit = async () => {
    if (!detail.trim()) return;
    setStatus("sending");
    try {
      const response = await fetch(`${apiBase}/api/stories/${storyId}/feedback`, {
        method: "POST",
        headers: deviceHeaders(),
        body: JSON.stringify({ type: "INCORRECT", detail: detail.trim().slice(0, 600) }),
      });
      if (!response.ok) throw new Error("feedback unavailable");
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  };

  if (status === "sent") return <div className="reader-feedback sent"><CheckCircle2 size={16} /> 신고를 접수했습니다. 확인 후 필요한 경우 정정 이력에 반영합니다.</div>;

  return <section className="reader-feedback">
    {!open ? <button type="button" onClick={() => setOpen(true)}><Flag size={15} /> 이 요약에 오류가 있나요?</button> : <>
      <label htmlFor={`feedback-${storyId}`}>문제가 된 문장과 확인한 내용을 알려주세요.</label>
      <textarea id={`feedback-${storyId}`} value={detail} maxLength={600} onChange={(event) => setDetail(event.target.value)} placeholder="예: 날짜가 원문과 다릅니다. 확인한 출처 주소…" />
      <div><span>{detail.length}/600</span><button type="button" className="cancel" onClick={() => { setOpen(false); setStatus("idle"); }}>취소</button><button type="button" disabled={!detail.trim() || status === "sending"} onClick={submit}>{status === "sending" ? "보내는 중" : "오류 신고"}</button></div>
      {status === "error" && <p role="alert">접수하지 못했습니다. 잠시 후 다시 시도해 주세요.</p>}
    </>}
  </section>;
}

function summaryPoints(summary: string) {
  const points = summary.trim().split(/(?<=[.!?])\s+/).filter(Boolean);
  return points.length ? points : [summary];
}

function uniqueStoryPoints(points: string[], excluded: string[] = []) {
  const seen = excluded.filter(Boolean);
  const unique: string[] = [];
  for (const point of points.map((value) => value.trim()).filter(Boolean)) {
    if (seen.some((previous) => pointsAreEquivalent(previous, point))) continue;
    unique.push(point);
    seen.push(point);
  }
  return unique;
}

function pointsAreEquivalent(left: string, right: string) {
  const a = normalizeStoryPoint(left);
  const b = normalizeStoryPoint(right);
  if (!a || !b) return false;
  if (a === b || a.includes(b) || b.includes(a)) return true;
  const leftTokens = new Set(left.toLocaleLowerCase("ko-KR").split(/[^\p{L}\p{N}]+/u).filter((token) => token.length >= 2));
  const rightTokens = new Set(right.toLocaleLowerCase("ko-KR").split(/[^\p{L}\p{N}]+/u).filter((token) => token.length >= 2));
  if (leftTokens.size < 2 || rightTokens.size < 2) return false;
  const overlap = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  return overlap >= 2 && overlap / Math.min(leftTokens.size, rightTokens.size) >= 0.72;
}

function normalizeStoryPoint(value: string) {
  return value.toLocaleLowerCase("ko-KR").replace(/\s+/g, "").replace(/[^\p{L}\p{N}]/gu, "");
}

function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try { return JSON.parse(value) as T; } catch { return fallback; }
}

function readCachedBriefing(): Briefing | null {
  const cached = safeJsonParse<Briefing | null>(window.localStorage.getItem(lastBriefingKey), null);
  return cached && Array.isArray(cached.stories) && cached.stories.length > 0 && cached.productionReady ? cached : null;
}

function isTodayInKorea(value?: string) {
  if (!value) return false;
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const today = `${parts.find((part) => part.type === "year")?.value}-${parts.find((part) => part.type === "month")?.value}-${parts.find((part) => part.type === "day")?.value}`;
  return value === today;
}

async function trackReaderEvent(type: string, editionId: number, storyId?: number) {
  try {
    await fetch(`${apiBase}/api/reader/events`, { method: "POST", headers: deviceHeaders(), keepalive: true, body: JSON.stringify({ type, editionId, storyId }) });
  } catch { /* Metrics must never block reading. */ }
}

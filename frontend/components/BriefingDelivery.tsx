"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, BellRing, BookOpen, Check, CheckCircle2, ChevronLeft, ChevronRight, Clock3, ExternalLink, FileCheck2, Flag, Radar, RefreshCw, Share2, Sparkles, Settings2, ThumbsDown, ThumbsUp, WifiOff } from "lucide-react";
import { briefingCategoryOrder, demoBriefing, type Briefing, type Story, type StoryInterest } from "@/lib/briefing";
import { deviceHeaders } from "@/lib/device";
import { defaultBrand, type BriefingBrand } from "@/lib/product";

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
const lastBriefingKey = "achim-gyeol-last-live-briefing";
type BriefingLoadState = "loading" | "live" | "cached" | "demo";

export function BriefingDelivery() {
  const [briefing, setBriefing] = useState<Briefing>(demoBriefing);
  const [brand, setBrand] = useState<BriefingBrand>(defaultBrand);
  const [category, setCategory] = useState<string>("전체");
  const [loading, setLoading] = useState(true);
  const [subscribed, setSubscribed] = useState(false);
  const [readerFont, setReaderFont] = useState<"small" | "normal" | "large">("normal");
  const [loadState, setLoadState] = useState<BriefingLoadState>("loading");
  const [reloadVersion, setReloadVersion] = useState(0);
  const stories = useMemo(() => category === "전체" ? briefing.stories : briefing.stories.filter((story) => story.category === category), [briefing, category]);
  const categories = useMemo(
    () => ["전체", ...briefingCategoryOrder.filter((item) => briefing.stories.some((story) => story.category === item))],
    [briefing.stories],
  );

  useEffect(() => {
    const brandTimer = window.setTimeout(() => {
      const storedBrand = window.localStorage.getItem("achim-gyeol-brand");
      if (storedBrand) try { setBrand(JSON.parse(storedBrand)); } catch { window.localStorage.removeItem("achim-gyeol-brand"); }
      const storedFont = window.localStorage.getItem("achim-gyeol-reader-font");
      if (storedFont === "small" || storedFont === "normal" || storedFont === "large") setReaderFont(storedFont);
    }, 0);
    if ("serviceWorker" in navigator && "PushManager" in window) {
      navigator.serviceWorker.ready.then((registration) => registration.pushManager.getSubscription())
        .then((subscription) => setSubscribed(Boolean(subscription))).catch(() => setSubscribed(false));
    }
    return () => window.clearTimeout(brandTimer);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const requestedDate = new URLSearchParams(window.location.search).get("date");
    const briefingPath = requestedDate ? `/api/briefings/${encodeURIComponent(requestedDate)}` : "/api/briefings/today";
    fetch(`${apiBase}${briefingPath}`, { cache: "no-store", headers: deviceHeaders(), signal: controller.signal })
      .then((response) => { if (!response.ok) throw new Error("briefing unavailable"); return response.json(); })
      .then((data: Briefing) => {
        if (!Array.isArray(data.stories) || data.stories.length === 0) throw new Error("empty briefing");
        setBriefing(data);
        setLoadState("live");
        if (!requestedDate && data.productionReady) window.localStorage.setItem(lastBriefingKey, JSON.stringify(data));
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        const cached = !requestedDate ? readCachedBriefing() : null;
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
  }, [reloadVersion]);

  const changeFont = (font: "small" | "normal" | "large") => { setReaderFont(font); window.localStorage.setItem("achim-gyeol-reader-font", font); };
  const retryBriefing = () => { setLoading(true); setLoadState("loading"); setReloadVersion((current) => current + 1); };
  const openStoryDetail = (storyId: number) => {
    setCategory("전체");
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
      const target = document.getElementById(`news-${storyId}`);
      if (!target) return;
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#news-${storyId}`);
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      target.focus({ preventScroll: true });
    }));
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

  return <main className={`news-reader-shell font-${readerFont}`}>
    <header className="news-reader-topbar">
      <Link href="/" className="delivered-brand"><i /><strong>{brand.name}</strong><span>MORNING NEWS</span></Link>
      <div className="reader-top-actions"><div aria-label="글자 크기"><button className={readerFont === "small" ? "active" : ""} onClick={() => changeFont("small")}>가</button><button className={readerFont === "normal" ? "active" : ""} onClick={() => changeFont("normal")}>가</button><button className={readerFont === "large" ? "active" : ""} onClick={() => changeFont("large")}>가</button></div><Link href="/#delivery-deck" className="delivered-settings"><Settings2 size={16} /> 알림 설정</Link></div>
    </header>

    <BriefingAvailability state={loadState} briefing={briefing} liveToday={liveToday} onRetry={retryBriefing} />
    <DailyBriefingSheets briefing={briefing} loading={loading} reportingEnabled={reportingEnabled} onOpenStory={openStoryDetail} />

    <nav className="news-category-nav" aria-label="뉴스 분야">
      <div>{categories.map((item) => <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}{item !== "전체" && <small>{briefing.stories.filter((story) => story.category === item).length}</small>}</button>)}</div>
    </nav>

    <div className="news-reader-layout">
      <section className="news-feed" aria-live="polite">
        <header className="news-feed-heading"><div><span>NEWS BRIEF</span><h2>{category === "전체" ? "품질 기준을 통과한 중요 뉴스" : `${category} 분야 중요 뉴스`}</h2></div><p>확인된 사실과 아직 확인되지 않은 내용을 구분했습니다.</p></header>
        {stories.map((story) => <NewsArticle key={story.id} story={story} editionId={briefing.id} index={briefing.stories.findIndex((item) => item.id === story.id) + 1} reportingEnabled={reportingEnabled} onBackToCard={openStoryCard} />)}
        {!loading && stories.length === 0 && <div className="reader-empty">이 분야에서 품질 기준을 통과한 중요 뉴스가 없습니다.</div>}
      </section>

      <aside className="news-reader-aside">
        <div className="reader-toc">
          <span>오늘의 뉴스</span>
          <ol>{briefing.stories.map((story, index) => <li key={story.id}><a href={`#news-${story.id}`} onClick={(event) => { event.preventDefault(); openStoryDetail(story.id); }}><b>{String(index + 1).padStart(2, "0")}</b><span>{story.title}</span></a></li>)}</ol>
        </div>
        <div className="reader-trust-note"><FileCheck2 size={20} /><div><strong>어떻게 확인했나요?</strong><p>같은 사건을 보도한 독립 출처를 묶고, 각 핵심 문장에 근거 원문을 연결합니다. 사람의 일일 사전 승인이 아닌 자동 품질검사 방식입니다.</p><Link href="/trust">품질 기준 보기</Link></div></div>
        {!subscribed && <Link className="reader-subscribe" href="/#delivery-deck"><BellRing size={17} /> 매일 오전 7:30 받기</Link>}
      </aside>
    </div>
  </main>;
}

function BriefingAvailability({ state, briefing, liveToday, onRetry }: { state: BriefingLoadState; briefing: Briefing; liveToday: boolean; onRetry: () => void }) {
  if (state === "live" && liveToday && briefing.productionReady) return <div className="briefing-availability live" role="status"><CheckCircle2 size={16} /><span><strong>오늘 브리핑 연결됨</strong> · {briefing.dateLabel} 검증본입니다.</span></div>;
  if (state === "live" && liveToday) return <div className="briefing-availability partial" role="status"><AlertTriangle size={16} /><span><strong>오늘 브리핑 보완 중</strong> · 현재 {briefing.stories.length}건은 발송 최소 기준을 충족하지 않아 다시 수집·검증하고 있습니다.</span><button type="button" onClick={onRetry}><RefreshCw size={14} /> 새로 확인</button></div>;
  const message = state === "loading"
    ? "오늘 브리핑을 연결하고 있습니다."
    : state === "cached"
      ? `서버 연결이 느려 마지막 정상 브리핑(${briefing.dateLabel})을 보여드립니다.`
      : state === "demo"
        ? "실제 브리핑을 불러오지 못해 사용법 확인용 예시만 보여드립니다."
        : `오늘 에디션을 준비 중이라 가장 최근 검증본(${briefing.dateLabel})을 보여드립니다.`;
  return <div className={`briefing-availability ${state}`} role="status"><WifiOff size={16} /><span><strong>{state === "demo" ? "예시 뉴스 · 실제 뉴스 아님" : state === "cached" ? "오프라인 안전 모드" : state === "loading" ? "연결 중" : "최신 발행본"}</strong> · {message}</span>{state !== "loading" && <button type="button" onClick={onRetry}><RefreshCw size={14} /> 다시 연결</button>}</div>;
}

function DailyBriefingSheets({ briefing, loading, reportingEnabled, onOpenStory }: { briefing: Briefing; loading: boolean; reportingEnabled: boolean; onOpenStory: (storyId: number) => void }) {
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
  const categoryCount = useMemo(() => new Set(briefing.stories.map((story) => story.category)).size, [briefing.stories]);
  const deckPages = useMemo(() => [{ kind: "overview" as const }, ...orderedStories.map((story) => ({ kind: "story" as const, story }))], [orderedStories]);

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

  const openDetail = (story: Story, pageIndex: number) => {
    markRead(story.id, pageIndex);
    if (reportingEnabled) void trackReaderEvent("STORY_DETAIL", briefing.id, story.id);
    onOpenStory(story.id);
  };

  return <section className="brief-sheet-section" aria-label="오늘의 아침결 카드 브리핑">
    <div className="brief-sheet-intro">
      <div className="reader-date"><span>{reportingEnabled ? "오늘의 실제 브리핑" : briefing.productionReady ? "최근 검증 브리핑" : "미리보기 브리핑"}</span><strong>{briefing.dateLabel}</strong></div>
      <h1>어제 핵심 {briefing.stories.length}건 · {categoryCount}개 분야,<br /><em>먼저 30초로 훑어보세요.</em></h1>
      <p>{loading ? "정확한 뉴스 브리핑을 불러오고 있습니다." : "첫 장에서 오늘의 흐름을 잡고, 옆으로 넘기며 사실·영향·다음 확인 포인트를 읽을 수 있습니다."}</p>
      <div className="reader-stats">
        <span><strong>{briefing.stories.length}</strong> 중요 뉴스</span>
        <span><strong>{briefing.verifiedCount}</strong> 근거 확인</span>
        <span><Clock3 size={16} /><strong>{briefing.readMinutes}분</strong> 예상</span>
        <span><FileCheck2 size={16} /><strong>{briefing.lastVerifiedAt}</strong> 자동 점검</span>
      </div>
      <details className="reader-disclosure"><summary>{briefing.humanReviewed ? "AI 요약 · 운영자 최종 승인" : "AI 요약 · 자동 품질검사"}</summary><p>확인된 사실, 의미, 아직 불확실한 내용을 나누고 각 문장에 근거 원문을 연결합니다.</p></details>
    </div>

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
          if (nextPage !== page) {
            if (selected?.kind === "story") markRead(selected.story.id, nextPage);
            else setPage(nextPage);
          }
        }
      }}>
        <article className="brief-sheet brief-sheet-overview" data-page-index={0} aria-label="오늘 뉴스 30초 한눈에 보기">
          <header>
            <div><span>ACHIMGYEOL</span><strong>30초 한눈에 보기</strong></div>
            <div><b>{briefing.dateLabel}</b><small>START</small></div>
          </header>
          <div className="brief-sheet-rule"><i /></div>
          <section className="brief-overview-copy">
            <span>TODAY&apos;S MAP</span>
            <h2>오늘 먼저 알아둘 흐름</h2>
            <p>{briefing.lead}</p>
            {briefing.personalized && <p className="brief-overview-personalized"><Sparkles size={14} /> 공통 핵심 3건 뒤의 카드 순서에 내 관심사를 반영했어요.</p>}
          </section>
          <ol className="brief-overview-list">
            {orderedStories.slice(0, 5).map((story, index) => <li key={story.id}><button type="button" onClick={() => moveTo(index + 1)}><b>{String(index + 1).padStart(2, "0")}</b><span><small>{story.category}</small><strong>{story.oneLineSummary || story.title}</strong></span><ChevronRight size={16} /></button></li>)}
          </ol>
          <footer className="brief-overview-footer"><span>위에는 우선 5건 · 옆으로 전체 {orderedStories.length}건 · 예상 {briefing.readMinutes}분</span><button type="button" onClick={() => moveTo(1)}>전체 뉴스 보기 <ChevronRight size={14} /></button></footer>
        </article>

        {orderedStories.map((story, storyPageIndex) => {
          const pageIndex = storyPageIndex + 1;
          const storyIndex = briefing.stories.findIndex((item) => item.id === story.id) + 1;
          const evidenceReady = story.evidenceAvailable && Boolean(story.claims?.length);
          const factLimit = digestSize === "compact" ? 2 : digestSize === "deep" ? 8 : 5;
          const facts = evidenceReady ? story.claims!.slice(0, factLimit).map((claim) => claim.statement) : summaryPoints(story.summary).slice(0, factLimit);
          const watchPoint = story.whatToWatch || story.uncertainty;
          return <article className={`brief-sheet ${digestSize}`} id={`briefing-card-${story.id}`} data-page-index={pageIndex} aria-label={`${storyPageIndex + 1}번째 뉴스, ${story.title}`} tabIndex={-1} key={`sheet-${story.id}`}>
          <header>
            <div><span>ACHIMGYEOL</span><strong>어제 뉴스 · 오늘 아침 한 번에</strong></div>
            <div><b>{briefing.dateLabel}</b><small>{storyPageIndex + 1} / {orderedStories.length}</small></div>
          </header>
          <div className="brief-sheet-rule"><i /></div>
          <div className="brief-sheet-stories">
              <section className="brief-sheet-story">
                <div className="brief-sheet-meta"><b>{String(storyIndex).padStart(2, "0")}</b><span>{story.category}</span>{storyIndex <= 3 && <i className="priority">먼저 보기</i>}{preferredCategories.includes(story.category) && <i>내 관심</i>}{story.viewerInterest === "INTERESTED" && <i>관심 반영</i>}<em className={story.verificationStatus === "VERIFIED" && evidenceReady ? "confirmed" : "checking"}>{readStories.includes(story.id) ? "읽음" : evidenceReady ? (story.verificationStatus === "VERIFIED" ? "근거 연결" : "확인 진행 중") : "원문 제공"}</em></div>
                <h2><a href={`#news-${story.id}`} onClick={(event) => { event.preventDefault(); openDetail(story, pageIndex); }}>{story.title}</a></h2>
                <p className="brief-sheet-conclusion"><strong>한 줄 결론</strong>{story.oneLineSummary || facts[0] || story.title}</p>
                <section className="brief-sheet-summary">
                  <strong>핵심 흐름</strong>
                  <p>{story.summary}</p>
                </section>
                <strong className="brief-sheet-facts-label">확인된 핵심</strong>
                <ul>{facts.map((fact, factIndex) => <li key={`${story.id}-fact-${factIndex}`}>{fact}</li>)}</ul>
                <div className="brief-sheet-matter"><strong>왜 중요한가</strong><p>{story.whyItMatters}</p></div>
                {watchPoint && <div className="brief-sheet-watch"><strong>{story.whatToWatch ? "다음 확인" : "아직 미정"}</strong><p>{watchPoint}</p></div>}
                <a className="brief-sheet-detail-jump" href={`#news-${story.id}`} onClick={(event) => { event.preventDefault(); openDetail(story, pageIndex); }}><BookOpen size={18} /><span><strong>상세 내용 바로가기</strong><small>아래 본문에서 핵심 근거와 출처까지 확인</small></span><ChevronRight size={18} /></a>
                {reportingEnabled && <StoryInterestControls key={`${story.id}-${story.viewerInterest ?? "none"}`} story={story} />}
                <footer><span>서로 다른 출처 {story.sources.length}개 · {story.sources.slice(0, 2).map((source) => source.publisher).join(" · ")}</span><div><button type="button" onClick={() => void shareStory(story)} aria-label="뉴스 공유"><Share2 size={13} /> 공유</button></div></footer>
              </section>
          </div>
        </article>})}
      </div>
      <div className="brief-sheet-progress" aria-hidden="true"><i style={{ width: `${((page + 1) / Math.max(deckPages.length, 1)) * 100}%` }} /></div>
      <div className="brief-sheet-controls">
        <button type="button" aria-label="이전 브리핑 카드" onClick={() => moveTo(page - 1)} disabled={page === 0}><ChevronLeft /></button>
        <div><strong>{page === 0 ? "한눈에" : page}</strong><span>{page === 0 ? "" : `/ ${orderedStories.length}`}</span><small><Check size={11} /> 옆으로 카드 · 아래로 상세 뉴스</small></div>
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

function NewsArticle({ story, editionId, index, reportingEnabled, onBackToCard }: { story: Story; editionId: number; index: number; reportingEnabled: boolean; onBackToCard: (storyId: number) => void }) {
  const evidenceReady = story.evidenceAvailable && Boolean(story.claims?.length);
  const verified = story.verificationStatus === "VERIFIED";
  const confirmedPoints = evidenceReady ? story.claims! : summaryPoints(story.summary).map((statement) => ({ statement, sources: [] }));

  return <article className="reader-article" id={`news-${story.id}`} tabIndex={-1}>
    <a className="reader-card-return top" href={`#briefing-card-${story.id}`} onClick={(event) => { event.preventDefault(); onBackToCard(story.id); }}><ChevronLeft size={15} /> 이 뉴스 카드로 돌아가기</a>
    <div className="reader-article-meta"><b>{String(index).padStart(2, "0")}</b><span>{story.category}</span><em className={verified && evidenceReady ? "confirmed" : "checking"}><CheckCircle2 size={14} /> {evidenceReady ? (verified ? "근거 확인" : "추가 확인 중") : "원문 제공"}</em><small>AI 요약</small></div>
    <h2>{story.title}</h2>
    <section className="reader-summary">
      <div><BookOpen size={17} /><strong>기사 전체 흐름</strong><span>핵심 사실을 빠짐없이 이어서 정리했습니다.</span></div>
      <p>{story.summary}</p>
    </section>
    <section className="reader-conclusion"><span>한 줄 결론</span><p>{story.oneLineSummary || confirmedPoints[0]?.statement || story.title}</p></section>

    <section className="reader-confirmed">
      <h3><FileCheck2 size={18} /> 확인된 핵심</h3>
      <ol>{confirmedPoints.map((claim, claimIndex) => <li key={`${claim.statement}-${claimIndex}`}>
        <p>{claim.statement}</p>
        {claim.sources.length > 0 && <div className="claim-citations">{claim.sources.map((source) => {
          const sourceNumber = story.sources.findIndex((item) => item.url === source.url) + 1;
          return <a href={source.url} target="_blank" rel="noreferrer" onClick={() => { if (reportingEnabled) void trackReaderEvent("SOURCE_OPEN", editionId, story.id); }} key={`${claim.statement}-${source.url}`}>[{sourceNumber}] {source.publisher}<ExternalLink size={12} /></a>;
        })}</div>}
      </li>)}</ol>
      {!evidenceReady && <div className="reader-legacy"><AlertTriangle size={17} /><p>이 뉴스는 이전 생성 형식이라 문장별 근거 번호가 없습니다. 아래 원문을 함께 확인해 주세요.</p></div>}
    </section>

    <section className="reader-why"><span>왜 중요한가</span><p>{story.whyItMatters}</p></section>
    {story.whatToWatch && <section className="reader-watch"><h3><Radar size={17} /> 다음 확인 포인트</h3><p>{story.whatToWatch}</p></section>}
    {story.uncertainty && <section className="reader-uncertainty"><h3><AlertTriangle size={17} /> 아직 확인되지 않은 것</h3><p>{story.uncertainty}</p></section>}
    {Boolean(story.corrections?.length) && <section className="reader-corrections"><h3>정정 이력</h3>{story.corrections!.map((correction) => <p key={correction.correctedAt}><time>{new Date(correction.correctedAt).toLocaleString("ko-KR")}</time>{correction.reason}</p>)}</section>}

    <div className="reader-source-note"><BookOpen size={16} /><p>원문 전체를 복제하지 않고, 이 브리핑에 사용한 출처와 핵심 사실을 함께 보여드립니다. 출처를 누르면 해당 언론사의 원문으로 이동합니다.</p></div>
    <details open className="reader-sources">
      <summary><BookOpen size={17} /> 근거 원문 {story.sources.length}개 보기</summary>
      <div>{story.sources.map((source, sourceIndex) => <a href={source.url} target="_blank" rel="noreferrer" onClick={() => { if (reportingEnabled) void trackReaderEvent("SOURCE_OPEN", editionId, story.id); }} key={`${source.publisher}-${source.url}`}><span><b>[{sourceIndex + 1}]</b>{source.publisher}<time>{source.publishedAt}</time>{source.primarySource && <small>1차 자료</small>}</span><ExternalLink size={14} /></a>)}</div>
    </details>
    {reportingEnabled && <StoryFeedbackPanel storyId={story.id} />}
    <a className="reader-card-return bottom" href={`#briefing-card-${story.id}`} onClick={(event) => { event.preventDefault(); onBackToCard(story.id); }}><ChevronLeft size={16} /> 이 뉴스 카드로 돌아가기</a>
  </article>;
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
      <label htmlFor={`feedback-${storyId}`}>문제가 된 문장과 확인 가능한 근거를 알려주세요.</label>
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

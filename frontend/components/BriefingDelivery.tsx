"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent as ReactMouseEvent, type UIEvent as ReactUIEvent, type WheelEvent as ReactWheelEvent } from "react";
import Link from "next/link";
import { AlertTriangle, BookOpen, CalendarDays, Check, CheckCircle2, ChevronLeft, ChevronRight, Flag, RefreshCw, Share2, Sparkles, Settings2, ThumbsDown, ThumbsUp, WifiOff } from "lucide-react";
import { briefingCategoryOrder, demoBriefing, type Briefing, type BriefingCategory, type Story, type StoryInterest } from "@/lib/briefing";
import { deviceHeaders } from "@/lib/device";
import { defaultBrand, type BriefingBrand } from "@/lib/product";
import { StoryVisual } from "@/components/StoryVisual";

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
const lastBriefingKey = "achim-gyeol-last-live-briefing";
type BriefingLoadState = "loading" | "live" | "cached" | "demo";

export function BriefingDelivery() {
  const [briefing, setBriefing] = useState<Briefing>(demoBriefing);
  const [brand, setBrand] = useState<BriefingBrand>(defaultBrand);
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
    return () => controller.abort();
  }, [reloadVersion, selectedDate]);

  const changeFont = (font: "small" | "normal" | "large") => { setReaderFont(font); window.localStorage.setItem("achim-gyeol-reader-font", font); };
  const retryBriefing = () => { setLoadState("loading"); setReloadVersion((current) => current + 1); };
  const chooseBriefingDate = (date: string) => {
    setLoadState("loading");
    setSelectedDate(date);
    const query = date ? `?date=${encodeURIComponent(date)}` : "";
    window.history.replaceState(null, "", `${window.location.pathname}${query}`);
  };
  const liveToday = loadState === "live" && isTodayInKorea(briefing.briefingDate);
  const reportingEnabled = loadState === "live" && liveToday && briefing.productionReady === true;

  return <main className={`news-reader-shell focus-reader-shell font-${readerFont}`}>
    <a className="reader-skip-link" href="#briefing-card-deck">본문으로 건너뛰기</a>
    <header className="news-reader-topbar">
      <Link href="/" className="delivered-brand"><i /><strong>{brand.name}</strong><span>MORNING NEWS</span></Link>
      <div className="reader-top-actions"><div className="reader-font-controls" role="group" aria-label="글자 크기"><button type="button" className={readerFont === "small" ? "active" : ""} aria-label="작은 글자" title="작은 글자" aria-pressed={readerFont === "small"} onClick={() => changeFont("small")}>가</button><button type="button" className={readerFont === "normal" ? "active" : ""} aria-label="기본 글자" title="기본 글자" aria-pressed={readerFont === "normal"} onClick={() => changeFont("normal")}>가</button><button type="button" className={readerFont === "large" ? "active" : ""} aria-label="큰 글자" title="큰 글자" aria-pressed={readerFont === "large"} onClick={() => changeFont("large")}>가</button></div><Link href="/#delivery-deck" className="delivered-settings"><Settings2 size={16} /> 알림 설정</Link></div>
    </header>

    <BriefingAvailability state={loadState} briefing={briefing} liveToday={liveToday} selectedDate={selectedDate} onRetry={retryBriefing} />
    <DailyBriefingSheets briefing={briefing} reportingEnabled={reportingEnabled} selectedDate={selectedDate} onChooseDate={chooseBriefingDate} />

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

function DailyBriefingSheets({ briefing, reportingEnabled, selectedDate, onChooseDate }: { briefing: Briefing; reportingEnabled: boolean; selectedDate: string; onChooseDate: (date: string) => void }) {
  const [page, setPage] = useState(0);
  const [readStories, setReadStories] = useState<number[]>([]);
  const [preferredCategories, setPreferredCategories] = useState<string[]>([]);
  const [digestSize, setDigestSize] = useState<"compact" | "standard" | "deep">("standard");
  const [activeCategory, setActiveCategory] = useState<BriefingCategory | "전체">("전체");
  const trackRef = useRef<HTMLDivElement>(null);
  const storyMapRef = useRef<HTMLElement>(null);
  const readStoriesRef = useRef<Set<number>>(new Set());
  const scrollFrameRef = useRef<number | null>(null);
  const mouseDragRef = useRef<{ startX: number; startScrollLeft: number; moved: boolean } | null>(null);
  const suppressClickRef = useRef(false);
  const orderedStories = useMemo(() => {
    const coreStories = briefing.stories.slice(0, 3);
    const personalizedStories = briefing.stories.slice(3).sort((a, b) => Number(preferredCategories.includes(b.category)) - Number(preferredCategories.includes(a.category)));
    return [...coreStories, ...personalizedStories];
  }, [briefing.stories, preferredCategories]);
  const availableCategories = useMemo(
    () => briefingCategoryOrder.filter((category) => briefing.stories.some((story) => story.category === category)),
    [briefing.stories],
  );
  const visibleStories = useMemo(
    () => activeCategory === "전체" ? orderedStories : orderedStories.filter((story) => story.category === activeCategory),
    [activeCategory, orderedStories],
  );
  const deckPages = useMemo(() => visibleStories.map((story) => ({ kind: "story" as const, story })), [visibleStories]);
  const storyPositions = useMemo(() => new Map(briefing.stories.map((story, index) => [story.id, index + 1])), [briefing.stories]);
  const readStoryIds = useMemo(() => new Set(readStories), [readStories]);
  const readCount = briefing.stories.reduce((count, story) => count + (readStoryIds.has(story.id) ? 1 : 0), 0);
  const nextUnreadIndex = visibleStories.findIndex((story) => !readStoryIds.has(story.id));
  const currentStory = visibleStories[Math.min(page, Math.max(visibleStories.length - 1, 0))];
  const featuredStories = orderedStories.slice(0, 3);
  const categoryCount = new Set(briefing.stories.map((story) => story.category)).size;
  const sourceCount = new Set(briefing.stories.flatMap((story) => story.sources.map((source) => source.publisher))).size;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const savedRead = safeJsonParse<number[]>(window.localStorage.getItem(`achim-gyeol-read-${briefing.id}`), []);
      const savedPreferences = safeJsonParse<{ categories?: string[]; digestSize?: "compact" | "standard" | "deep" }>(window.localStorage.getItem("achim-gyeol-reader-preferences"), {});
      const availableStoryIds = new Set(briefing.stories.map((story) => story.id));
      const validSavedRead = savedRead.filter((storyId) => availableStoryIds.has(storyId));
      readStoriesRef.current = new Set(validSavedRead);
      setReadStories(validSavedRead);
      setPreferredCategories(savedPreferences.categories ?? []);
      setDigestSize(savedPreferences.digestSize ?? "standard");
      setPage(0);
    }, 0);
    if (reportingEnabled) void trackReaderEvent("BRIEFING_OPEN", briefing.id);
    return () => window.clearTimeout(timer);
  }, [briefing.id, briefing.stories, reportingEnabled]);

  useEffect(() => {
    const storyMap = storyMapRef.current;
    const activeItem = storyMap?.querySelector<HTMLElement>("[aria-current='true']");
    if (!storyMap || !activeItem) return;
    const centeredLeft = activeItem.offsetLeft - (storyMap.clientWidth - activeItem.clientWidth) / 2;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    storyMap.scrollTo({ left: Math.max(0, centeredLeft), behavior: reduceMotion ? "auto" : "smooth" });
  }, [activeCategory, page]);

  useEffect(() => () => {
    if (scrollFrameRef.current !== null) window.cancelAnimationFrame(scrollFrameRef.current);
  }, []);

  const moveTo = useCallback((nextPage: number) => {
    const safePage = Math.max(0, Math.min(deckPages.length - 1, nextPage));
    const track = trackRef.current;
    if (!track) return;
    const target = track.querySelector<HTMLElement>(`[data-page-index="${safePage}"]`);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (target) track.scrollTo({ left: Math.max(0, target.offsetLeft - track.offsetLeft - 14), behavior: reduceMotion ? "auto" : "smooth" });
    setPage(safePage);
  }, [deckPages.length]);

  const selectCategory = (category: BriefingCategory | "전체") => {
    setActiveCategory(category);
    setPage(0);
    window.requestAnimationFrame(() => trackRef.current?.scrollTo({ left: 0, behavior: "auto" }));
  };

  const chooseDigestSize = (nextSize: "compact" | "standard" | "deep") => {
    setDigestSize(nextSize);
    const saved = safeJsonParse<{ categories?: string[] }>(window.localStorage.getItem("achim-gyeol-reader-preferences"), {});
    window.localStorage.setItem("achim-gyeol-reader-preferences", JSON.stringify({ ...saved, digestSize: nextSize }));
  };

  const openFeaturedStory = (storyId: number) => {
    setActiveCategory("전체");
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => openStoryCard(storyId)));
  };

  const pageForTrackScroll = (track: HTMLDivElement) => {
    const cards = Array.from(track.querySelectorAll<HTMLElement>("[data-page-index]"));
    const center = track.scrollLeft + track.clientWidth / 2;
    return cards.reduce((best, card, index) => {
      const distance = Math.abs(card.offsetLeft + card.clientWidth / 2 - center);
      const bestCard = cards[best];
      const bestDistance = bestCard ? Math.abs(bestCard.offsetLeft + bestCard.clientWidth / 2 - center) : Number.POSITIVE_INFINITY;
      return distance < bestDistance ? index : best;
    }, 0);
  };

  const updateMouseDrag = useCallback((clientX: number) => {
    const drag = mouseDragRef.current;
    const track = trackRef.current;
    if (!drag || !track) return false;
    const distance = clientX - drag.startX;
    if (Math.abs(distance) < 5 && !drag.moved) return false;
    drag.moved = true;
    track.scrollLeft = drag.startScrollLeft - distance;
    return true;
  }, []);

  const finishMouseDrag = useCallback(() => {
    const drag = mouseDragRef.current;
    const track = trackRef.current;
    if (!drag || !track) return;
    mouseDragRef.current = null;
    if (drag.moved) {
      suppressClickRef.current = true;
      moveTo(pageForTrackScroll(track));
    }
  }, [moveTo]);

  useEffect(() => {
    // Keep the drag alive even when the pointer leaves the visible track. This
    // is especially important on desktop where a long card can be wider than
    // the viewport and the browser otherwise stops dispatching track events.
    const handleWindowMouseMove = (event: MouseEvent) => {
      updateMouseDrag(event.clientX);
    };
    const handleWindowMouseUp = () => finishMouseDrag();
    window.addEventListener("mousemove", handleWindowMouseMove);
    window.addEventListener("mouseup", handleWindowMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleWindowMouseMove);
      window.removeEventListener("mouseup", handleWindowMouseUp);
    };
  }, [finishMouseDrag, updateMouseDrag]);

  const handleTrackScroll = (event: ReactUIEvent<HTMLDivElement>) => {
    const track = event.currentTarget;
    if (!track.clientWidth) return;
    if (scrollFrameRef.current !== null) window.cancelAnimationFrame(scrollFrameRef.current);
    scrollFrameRef.current = window.requestAnimationFrame(() => {
      const nextPage = pageForTrackScroll(track);
      const selected = deckPages[nextPage];
      if (nextPage !== page && selected) markRead(selected.story.id, nextPage);
      scrollFrameRef.current = null;
    });
  };

  const handleTrackWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    // Trackpad horizontal gestures should move between cards. Vertical wheel
    // input remains available for reading the long article inside a card.
    if (Math.abs(event.deltaX) < 1 || Math.abs(event.deltaX) < Math.abs(event.deltaY) * 0.35) return;
    event.preventDefault();
    event.currentTarget.scrollLeft += event.deltaX;
  };

  const handleMouseDown = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    mouseDragRef.current = {
      startX: event.clientX,
      startScrollLeft: event.currentTarget.scrollLeft,
      moved: false,
    };
  };

  const handleMouseMove = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (updateMouseDrag(event.clientX)) event.preventDefault();
  };

  const handleMouseEnd = () => finishMouseDrag();

  const handleTrackClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!suppressClickRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    suppressClickRef.current = false;
  };

  const handleTrackKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      moveTo(page + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      moveTo(page - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      moveTo(0);
    } else if (event.key === "End") {
      event.preventDefault();
      moveTo(deckPages.length - 1);
    }
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
    if (!readStoriesRef.current.has(storyId)) {
      readStoriesRef.current.add(storyId);
      const next = [...readStoriesRef.current];
      window.localStorage.setItem(`achim-gyeol-read-${briefing.id}`, JSON.stringify(next));
      if (reportingEnabled && next.length === briefing.stories.length) void trackReaderEvent("COMPLETE", briefing.id);
      if (reportingEnabled) void trackReaderEvent("CARD_VIEW", briefing.id, storyId);
      setReadStories(next);
    }
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
    <section className="morning-core" aria-labelledby="morning-core-title">
      <header className="morning-core-header">
        <div>
          <span><Sparkles size={14} /> TODAY&apos;S ESSENTIALS</span>
          <h1 id="morning-core-title">오늘 아침, 이 3가지부터</h1>
          <p>{briefing.lead}</p>
        </div>
        <div className="morning-core-date"><strong>{briefing.dateLabel}</strong><span>어제 뉴스 기준</span></div>
      </header>

      <div className="morning-core-grid">
        {featuredStories[0] && <button type="button" className="morning-lead" onClick={() => openFeaturedStory(featuredStories[0].id)}>
          <StoryVisual story={featuredStories[0]} variant="article" priority />
          <span className="morning-rank">01 · {featuredStories[0].category}</span>
          <strong>{featuredStories[0].title}</strong>
          <p>{featuredStories[0].oneLineSummary || featuredStories[0].summary}</p>
          <i>첫 번째 핵심 뉴스 읽기 <ChevronRight size={15} /></i>
        </button>}
        <div className="morning-secondary-list">
          {featuredStories.slice(1).map((story, index) => <button type="button" key={story.id} onClick={() => openFeaturedStory(story.id)}>
            <b>0{index + 2}</b>
            <span><small>{story.category}</small><strong>{story.title}</strong><p>{story.oneLineSummary || story.summary}</p></span>
            <ChevronRight size={17} />
          </button>)}
        </div>
      </div>

      <footer className="morning-core-footer">
        <div className="morning-core-stats" aria-label="오늘 브리핑 구성">
          <span><strong>{briefing.stories.length}</strong> 핵심 뉴스</span>
          <span><strong>{categoryCount}</strong>개 분야</span>
          <span><strong>{sourceCount}</strong>개 언론·기관</span>
          <span><strong>약 {briefing.readMinutes}분</strong> 전체 읽기</span>
        </div>
        <div className="morning-depth" role="group" aria-label="뉴스 읽기 깊이">
          <span>읽기 깊이</span>
          {([['compact', '짧게'], ['standard', '기본'], ['deep', '깊게']] as const).map(([value, label]) => <button type="button" key={value} className={digestSize === value ? "active" : ""} aria-pressed={digestSize === value} onClick={() => chooseDigestSize(value)}>{label}</button>)}
        </div>
      </footer>
    </section>

    <div className="briefing-history-bar">
      <div><CalendarDays size={18} /><span><strong>지난 브리핑 다시 보기</strong><small>날짜를 고르면 해당 날의 핵심 뉴스가 열립니다.</small></span></div>
      <div className="briefing-history-actions">
        <label><span>날짜 선택</span><input type="date" value={selectedDate} onChange={(event) => onChooseDate(event.target.value)} /></label>
        {selectedDate && <button type="button" onClick={() => onChooseDate("")}>오늘 브리핑</button>}
      </div>
    </div>

    <div className="briefing-category-toolbar" aria-label="분야별 뉴스 보기">
      <div className="briefing-category-heading">
        <div><span>분야별 브리핑</span><strong>{activeCategory === "전체" ? "모든 분야의 중요한 뉴스" : activeCategory}</strong></div>
        <small>{visibleStories.length}건 · {readCount}/{briefing.stories.length} 읽음</small>
      </div>
      <nav className="briefing-category-tabs" aria-label="뉴스 분야">
        <button type="button" className={activeCategory === "전체" ? "active" : ""} aria-pressed={activeCategory === "전체"} onClick={() => selectCategory("전체")}>
          전체 <b>{briefing.stories.length}</b>
        </button>
        {availableCategories.map((category) => (
          <button key={category} type="button" className={activeCategory === category ? "active" : ""} aria-pressed={activeCategory === category} onClick={() => selectCategory(category)}>
            {category} <b>{briefing.stories.filter((story) => story.category === category).length}</b>
          </button>
        ))}
      </nav>
    </div>
    <div className="briefing-reader-status" aria-live="polite">
      <div className="briefing-reader-status-copy">
        <span>읽는 흐름</span>
        <strong>{readCount} / {briefing.stories.length} 읽음</strong>
        <small>{currentStory ? `${page + 1}/${visibleStories.length} · ${currentStory.category} · 약 ${briefing.readMinutes}분` : `약 ${briefing.readMinutes}분`}</small>
      </div>
      <div className="briefing-reader-status-actions">
        {readCount === briefing.stories.length ? (
          <span className="briefing-complete"><CheckCircle2 size={14} /> 오늘 브리핑을 모두 읽었어요</span>
        ) : (
          <button type="button" onClick={() => moveTo(nextUnreadIndex)} disabled={nextUnreadIndex < 0}>다음 안 읽은 뉴스 <ChevronRight size={14} /></button>
        )}
        <button type="button" onClick={() => moveTo(0)} disabled={page === 0}>처음부터</button>
      </div>
    </div>
    <nav className="briefing-story-map" aria-label="뉴스 빠른 이동" ref={storyMapRef}>
      {visibleStories.map((story, storyIndex) => (
        <button type="button" key={story.id} className={page === storyIndex ? "active" : ""} aria-current={page === storyIndex ? "true" : undefined} onClick={() => moveTo(storyIndex)}>
          <span>{String(storyIndex + 1).padStart(2, "0")}</span>
          <div><b>{story.category}</b><strong>{story.title}</strong></div>
          {readStoryIds.has(story.id) && <Check size={14} aria-label="읽음" />}
        </button>
      ))}
    </nav>
    <div className="brief-sheet-deck" id="briefing-card-deck">
      <div
        className="brief-sheet-track"
        id="briefing-card-track"
        ref={trackRef}
        role="region"
        aria-roledescription="carousel"
        aria-label="뉴스 카드 목록. 포커스 후 좌우 방향키로 이동할 수 있습니다."
        tabIndex={0}
        onKeyDown={handleTrackKeyDown}
        onScroll={handleTrackScroll}
        onWheel={handleTrackWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseEnd}
        onDragStart={(event) => event.preventDefault()}
        onClick={handleTrackClick}
      >
        {visibleStories.map((story, storyPageIndex) => {
          const pageIndex = storyPageIndex;
          const storyIndex = storyPositions.get(story.id) ?? storyPageIndex + 1;
          return <article className={`brief-sheet ${digestSize}`} id={`briefing-card-${story.id}`} data-page-index={pageIndex} aria-label={`${storyPageIndex + 1}번째 뉴스, ${story.title}`} tabIndex={-1} key={`sheet-${story.id}`}>
          <header>
            <div><span>ACHIMGYEOL</span><strong>어제 뉴스 · 오늘 아침 한 번에</strong></div>
            <div className="brief-sheet-card-tools">
              <button type="button" aria-label={`${storyPageIndex + 1}번째 카드 이전`} onClick={() => moveTo(storyPageIndex - 1)} disabled={storyPageIndex === 0}><ChevronLeft size={15} /></button>
              <span className="brief-sheet-card-page"><b>{briefing.dateLabel}</b><small>{storyPageIndex + 1} / {visibleStories.length}</small></span>
              <button type="button" aria-label={`${storyPageIndex + 1}번째 카드 다음`} onClick={() => moveTo(storyPageIndex + 1)} disabled={storyPageIndex >= deckPages.length - 1}><ChevronRight size={15} /></button>
            </div>
          </header>
          <div className="brief-sheet-rule"><i /></div>
          <div className="brief-sheet-stories">
            <section className="brief-sheet-story">
              <div className="brief-sheet-section-label brief-sheet-summary-label"><span>상단 · 핵심 요약</span><small>제목부터 중요한 사실과 맥락까지 먼저 읽어보세요.</small></div>
              <CoreStoryCard story={story} index={storyIndex} digestSize={digestSize} />
              <div className="brief-sheet-section-label brief-sheet-detail-label"><span>하단 · 기사형 상세</span><small>여러 출처에서 확인된 내용을 한 흐름으로 정리했습니다.</small></div>
              <OriginalStoryCard story={story} index={storyIndex} reportingEnabled={reportingEnabled} onBackToCard={openStoryCard} />
              {reportingEnabled && <StoryInterestControls key={`${story.id}-${story.viewerInterest ?? "none"}`} story={story} />}
              <footer><span>서로 다른 출처 {story.sources.length}개 · {story.sources.slice(0, 2).map((source) => source.publisher).join(" · ")}</span><div><button type="button" onClick={() => void shareStory(story)} aria-label="뉴스 공유"><Share2 size={13} /> 공유</button></div></footer>
            </section>
          </div>
        </article>})}
      </div>
      <div className="brief-sheet-progress" role="progressbar" aria-label={`뉴스 카드 ${Math.min(page + 1, Math.max(deckPages.length, 1))} / ${Math.max(deckPages.length, 1)}`} aria-valuemin={1} aria-valuemax={Math.max(deckPages.length, 1)} aria-valuenow={Math.min(page + 1, Math.max(deckPages.length, 1))}><i style={{ width: `${((page + 1) / Math.max(deckPages.length, 1)) * 100}%` }} /></div>
      <p className="brief-sheet-swipe-hint" aria-live="polite"><Check size={12} /> 모바일은 좌우로 밀고, 컴퓨터는 카드 위에서 드래그하세요.</p>
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
  const paragraphs = buildFullSourceArticle(story, claims);
  return <article className="brief-sheet-original-card" id={`news-${story.id}`} tabIndex={-1} aria-label={`${index}번째 뉴스 기사형 상세 내용`}>
    <header><span>기사형 상세 내용</span><time>출처 {story.sources.length}개 · 공통 사실 중심</time></header>
    <div className="brief-sheet-original-rule"><i /></div>
    <div className="brief-sheet-original-kicker"><b>{story.category}</b><span>여러 기사에서 공통으로 확인된 내용</span></div>
    <h3>{story.title}</h3>
    <section className="reader-context" aria-label="기사 이해를 돕는 배경">
      <h3><BookOpen size={18} /> 기사 이해를 돕는 배경</h3>
      <p>{story.backgroundContext || story.oneLineSummary || story.summary}</p>
      <div><strong>이해 포인트</strong><p>{story.plainExplanation || story.summary}</p></div>
    </section>
    <div className="brief-sheet-original-body">{paragraphs.map((paragraph, paragraphIndex) => <p className={`brief-sheet-original-paragraph${paragraphIndex === 0 ? " lead" : ""}`} key={`${story.id}-original-${paragraphIndex}`}>{paragraph}</p>)}</div>
    <footer className="brief-sheet-original-sources"><strong>출처</strong><div>{story.sources.map((source, sourceIndex) => <span key={`${source.publisher}-${sourceIndex}`}>[{sourceIndex + 1}] {source.publisher}</span>)}</div></footer>
    {reportingEnabled && <StoryFeedbackPanel storyId={story.id} />}
    <a className="reader-card-return bottom" href={`#briefing-card-${story.id}`} onClick={(event) => { event.preventDefault(); onBackToCard(story.id); }}><ChevronLeft size={16} /> 카드로 돌아가기</a>
  </article>;
}

function buildFullSourceArticle(story: Story, claims: string[]) {
  const candidates = [
    story.summary,
    ...claims,
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
    if (!text || !normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    paragraphs.push(text);
  }
  return paragraphs.length ? paragraphs : [story.summary];
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

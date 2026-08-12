"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, BellRing, BookOpen, Check, CheckCircle2, ChevronLeft, ChevronRight, Clock3, ExternalLink, FileCheck2, Flag, Share2, Settings2 } from "lucide-react";
import { briefingCategoryOrder, demoBriefing, type Briefing, type Story } from "@/lib/briefing";
import { deviceHeaders } from "@/lib/device";
import { defaultBrand, type BriefingBrand } from "@/lib/product";

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export function BriefingDelivery() {
  const [briefing, setBriefing] = useState<Briefing>(demoBriefing);
  const [brand, setBrand] = useState<BriefingBrand>(defaultBrand);
  const [category, setCategory] = useState<string>("전체");
  const [loading, setLoading] = useState(true);
  const [subscribed, setSubscribed] = useState(false);
  const [readerFont, setReaderFont] = useState<"small" | "normal" | "large">("normal");
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
    const controller = new AbortController();
    const requestedDate = new URLSearchParams(window.location.search).get("date");
    const briefingPath = requestedDate ? `/api/briefings/${encodeURIComponent(requestedDate)}` : "/api/briefings/today";
    fetch(`${apiBase}${briefingPath}`, { cache: "no-store", signal: controller.signal })
      .then((response) => { if (!response.ok) throw new Error("briefing unavailable"); return response.json(); })
      .then((data: Briefing) => setBriefing(data))
      .catch(() => setBriefing(demoBriefing))
      .finally(() => setLoading(false));
    if ("serviceWorker" in navigator && "PushManager" in window) {
      navigator.serviceWorker.ready.then((registration) => registration.pushManager.getSubscription())
        .then((subscription) => setSubscribed(Boolean(subscription))).catch(() => setSubscribed(false));
    }
    return () => { window.clearTimeout(brandTimer); controller.abort(); };
  }, []);

  const changeFont = (font: "small" | "normal" | "large") => { setReaderFont(font); window.localStorage.setItem("achim-gyeol-reader-font", font); };

  return <main className={`news-reader-shell font-${readerFont}`}>
    <header className="news-reader-topbar">
      <Link href="/" className="delivered-brand"><i /><strong>{brand.name}</strong><span>MORNING NEWS</span></Link>
      <div className="reader-top-actions"><div aria-label="글자 크기"><button className={readerFont === "small" ? "active" : ""} onClick={() => changeFont("small")}>가</button><button className={readerFont === "normal" ? "active" : ""} onClick={() => changeFont("normal")}>가</button><button className={readerFont === "large" ? "active" : ""} onClick={() => changeFont("large")}>가</button></div><Link href="/#delivery-deck" className="delivered-settings"><Settings2 size={16} /> 알림 설정</Link></div>
    </header>

    <DailyBriefingSheets briefing={briefing} loading={loading} />

    <nav className="news-category-nav" aria-label="뉴스 분야">
      <div>{categories.map((item) => <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}{item !== "전체" && <small>{briefing.stories.filter((story) => story.category === item).length}</small>}</button>)}</div>
    </nav>

    <div className="news-reader-layout">
      <section className="news-feed" aria-live="polite">
        <header className="news-feed-heading"><div><span>NEWS BRIEF</span><h2>{category === "전체" ? "품질 기준을 통과한 중요 뉴스" : `${category} 분야 중요 뉴스`}</h2></div><p>확인된 사실과 아직 확인되지 않은 내용을 구분했습니다.</p></header>
        {stories.map((story) => <NewsArticle key={story.id} story={story} editionId={briefing.id} index={briefing.stories.findIndex((item) => item.id === story.id) + 1} reportingEnabled={briefing.productionReady === true} />)}
        {!loading && stories.length === 0 && <div className="reader-empty">이 분야에서 품질 기준을 통과한 중요 뉴스가 없습니다.</div>}
      </section>

      <aside className="news-reader-aside">
        <div className="reader-toc">
          <span>오늘의 뉴스</span>
          <ol>{briefing.stories.map((story, index) => <li key={story.id}><a href={`#news-${story.id}`}><b>{String(index + 1).padStart(2, "0")}</b><span>{story.title}</span></a></li>)}</ol>
        </div>
        <div className="reader-trust-note"><FileCheck2 size={20} /><div><strong>어떻게 확인했나요?</strong><p>같은 사건을 보도한 독립 출처를 묶고, 각 핵심 문장에 근거 원문을 연결합니다. 사람의 일일 사전 승인이 아닌 자동 품질검사 방식입니다.</p><Link href="/trust">품질 기준 보기</Link></div></div>
        {!subscribed && <Link className="reader-subscribe" href="/#delivery-deck"><BellRing size={17} /> 매일 오전 7:30 받기</Link>}
      </aside>
    </div>
  </main>;
}

function DailyBriefingSheets({ briefing, loading }: { briefing: Briefing; loading: boolean }) {
  const [page, setPage] = useState(0);
  const [readStories, setReadStories] = useState<number[]>([]);
  const [preferredCategories, setPreferredCategories] = useState<string[]>([]);
  const [digestSize, setDigestSize] = useState<"compact" | "standard" | "deep">("standard");
  const trackRef = useRef<HTMLDivElement>(null);
  const orderedStories = useMemo(() => [...briefing.stories].sort((a, b) => Number(preferredCategories.includes(b.category)) - Number(preferredCategories.includes(a.category))), [briefing.stories, preferredCategories]);
  const pages = useMemo(() => orderedStories.map((story) => [story]), [orderedStories]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const savedRead = JSON.parse(window.localStorage.getItem(`achim-gyeol-read-${briefing.id}`) ?? "[]") as number[];
      const savedPreferences = JSON.parse(window.localStorage.getItem("achim-gyeol-reader-preferences") ?? "{}") as { categories?: string[]; digestSize?: "compact" | "standard" | "deep" };
      setReadStories(savedRead);
      setPreferredCategories(savedPreferences.categories ?? []);
      setDigestSize(savedPreferences.digestSize ?? "standard");
    }, 0);
    if (briefing.productionReady) void trackReaderEvent("BRIEFING_OPEN", briefing.id);
    return () => window.clearTimeout(timer);
  }, [briefing.id, briefing.productionReady]);

  const moveTo = (nextPage: number) => {
    const safePage = Math.max(0, Math.min(pages.length - 1, nextPage));
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: track.clientWidth * safePage, behavior: "smooth" });
    setPage(safePage);
  };

  const markRead = (storyId: number, pageIndex: number) => {
    setReadStories((current) => {
      const next = current.includes(storyId) ? current : [...current, storyId];
      window.localStorage.setItem(`achim-gyeol-read-${briefing.id}`, JSON.stringify(next));
      if (next.length === briefing.stories.length) void trackReaderEvent("COMPLETE", briefing.id);
      return next;
    });
    if (briefing.productionReady) void trackReaderEvent("CARD_VIEW", briefing.id, storyId);
    setPage(pageIndex);
  };

  const shareStory = async (story: Story) => {
    try {
      const url = `${window.location.origin}/briefing/#news-${story.id}`;
      if (navigator.share) await navigator.share({ title: story.title, text: story.oneLineSummary || story.summary, url });
      else await navigator.clipboard.writeText(url);
      if (briefing.productionReady) void trackReaderEvent("SHARE", briefing.id, story.id);
    } catch { /* A dismissed share sheet is not an error. */ }
  };

  return <section className="brief-sheet-section" aria-label="오늘의 아침결 카드 브리핑">
    <div className="brief-sheet-intro">
      <div className="reader-date"><span>{briefing.productionReady ? "오늘의 실제 브리핑" : "미리보기 브리핑"}</span><strong>{briefing.dateLabel}</strong></div>
      <h1>정확하게 확인하고,<br />핵심만 넘겨보세요.</h1>
      <p>{loading ? "정확한 뉴스 브리핑을 불러오고 있습니다." : briefing.lead}</p>
      <div className="reader-stats">
        <span><strong>{briefing.stories.length}</strong> 중요 뉴스</span>
        <span><strong>{briefing.verifiedCount}</strong> 근거 확인</span>
        <span><Clock3 size={16} /><strong>{briefing.readMinutes}분</strong> 예상</span>
        <span><FileCheck2 size={16} /><strong>{briefing.lastVerifiedAt}</strong> 자동 점검</span>
      </div>
      <p className="reader-disclosure"><strong>{briefing.humanReviewed ? "AI 요약 · 운영자 최종 승인" : "AI 요약 · 자동 품질검사"}</strong> · 확인된 사실, 의미, 아직 불확실한 내용을 나누고 원문을 연결합니다.</p>
    </div>

    <div className="brief-sheet-deck">
      <div className="brief-sheet-track" ref={trackRef} onScroll={(event) => {
        const track = event.currentTarget;
        if (track.clientWidth) {
          const nextPage = Math.max(0, Math.min(pages.length - 1, Math.round(track.scrollLeft / track.clientWidth)));
          const story = pages[nextPage]?.[0];
          if (story && nextPage !== page) markRead(story.id, nextPage);
        }
      }}>
        {pages.map((stories, pageIndex) => <article className={`brief-sheet ${digestSize}`} key={`sheet-${pageIndex}`}>
          <header>
            <div><span>ACHIMGYEOL</span><strong>어제 뉴스 · 오늘 아침 한 번에</strong></div>
            <div><b>{briefing.dateLabel}</b><small>{pageIndex + 1} / {pages.length}</small></div>
          </header>
          <div className="brief-sheet-rule"><i /></div>
          <div className="brief-sheet-stories">
            {stories.map((story) => {
              const storyIndex = briefing.stories.findIndex((item) => item.id === story.id) + 1;
              const evidenceReady = story.evidenceAvailable && Boolean(story.claims?.length);
              const factLimit = digestSize === "compact" ? 1 : digestSize === "deep" ? 5 : 3;
              const facts = evidenceReady ? story.claims!.slice(0, factLimit).map((claim) => claim.statement) : summaryPoints(story.summary).slice(0, factLimit);
              return <section className="brief-sheet-story" key={story.id}>
                <div className="brief-sheet-meta"><b>{String(storyIndex).padStart(2, "0")}</b><span>{story.category}</span>{preferredCategories.includes(story.category) && <i>내 관심</i>}<em className={story.verificationStatus === "VERIFIED" && evidenceReady ? "confirmed" : "checking"}>{readStories.includes(story.id) ? "읽음" : evidenceReady ? (story.verificationStatus === "VERIFIED" ? "근거 연결" : "확인 진행 중") : "원문 제공"}</em></div>
                <h2><a href={`#news-${story.id}`}>{story.title}</a></h2>
                <p className="brief-sheet-conclusion"><strong>한 줄 결론</strong>{story.oneLineSummary || facts[0] || story.title}</p>
                <ul>{facts.map((fact, factIndex) => <li key={`${story.id}-fact-${factIndex}`}>{fact}</li>)}</ul>
                <div className="brief-sheet-matter"><strong>왜 중요한가</strong><p>{story.whyItMatters}</p></div>
                <footer><span>출처 {story.sources.map((source) => source.publisher).join(" · ")}</span><div><button type="button" onClick={() => void shareStory(story)} aria-label="뉴스 공유"><Share2 size={13} /> 공유</button><a href={`#news-${story.id}`} onClick={() => { markRead(story.id, pageIndex); void trackReaderEvent("STORY_DETAIL", briefing.id, story.id); }}>근거 자세히 보기 →</a></div></footer>
              </section>;
            })}
          </div>
        </article>)}
      </div>
      <div className="brief-sheet-controls">
        <button type="button" aria-label="이전 브리핑 카드" onClick={() => moveTo(page - 1)} disabled={page === 0}><ChevronLeft /></button>
        <div><strong>{page + 1}</strong><span>/ {Math.max(pages.length, 1)}</span><small><Check size={11} /> {readStories.length}건 읽음 · 옆으로 넘겨보세요</small></div>
        <button type="button" aria-label="다음 브리핑 카드" onClick={() => moveTo(page + 1)} disabled={page >= pages.length - 1}><ChevronRight /></button>
      </div>
    </div>
  </section>;
}

function NewsArticle({ story, editionId, index, reportingEnabled }: { story: Story; editionId: number; index: number; reportingEnabled: boolean }) {
  const evidenceReady = story.evidenceAvailable && Boolean(story.claims?.length);
  const verified = story.verificationStatus === "VERIFIED";
  const confirmedPoints = evidenceReady ? story.claims! : summaryPoints(story.summary).map((statement) => ({ statement, sources: [] }));

  return <article className="reader-article" id={`news-${story.id}`}>
    <div className="reader-article-meta"><b>{String(index).padStart(2, "0")}</b><span>{story.category}</span><em className={verified && evidenceReady ? "confirmed" : "checking"}><CheckCircle2 size={14} /> {evidenceReady ? (verified ? "근거 확인" : "추가 확인 중") : "원문 제공"}</em><small>AI 요약</small></div>
    <h2>{story.title}</h2>
    <section className="reader-conclusion"><span>한 줄 결론</span><p>{story.oneLineSummary || confirmedPoints[0]?.statement || story.title}</p></section>

    <section className="reader-confirmed">
      <h3><FileCheck2 size={18} /> 확인된 핵심</h3>
      <ol>{confirmedPoints.map((claim, claimIndex) => <li key={`${claim.statement}-${claimIndex}`}>
        <p>{claim.statement}</p>
        {claim.sources.length > 0 && <div className="claim-citations">{claim.sources.map((source) => {
          const sourceNumber = story.sources.findIndex((item) => item.url === source.url) + 1;
          return <a href={source.url} target="_blank" rel="noreferrer" onClick={() => void trackReaderEvent("SOURCE_OPEN", editionId, story.id)} key={`${claim.statement}-${source.url}`}>[{sourceNumber}] {source.publisher}<ExternalLink size={12} /></a>;
        })}</div>}
      </li>)}</ol>
      {!evidenceReady && <div className="reader-legacy"><AlertTriangle size={17} /><p>이 뉴스는 이전 생성 형식이라 문장별 근거 번호가 없습니다. 아래 원문을 함께 확인해 주세요.</p></div>}
    </section>

    <section className="reader-why"><span>왜 중요한가</span><p>{story.whyItMatters}</p></section>
    {story.uncertainty && <section className="reader-uncertainty"><h3><AlertTriangle size={17} /> 아직 확인되지 않은 것</h3><p>{story.uncertainty}</p></section>}
    {Boolean(story.corrections?.length) && <section className="reader-corrections"><h3>정정 이력</h3>{story.corrections!.map((correction) => <p key={correction.correctedAt}><time>{new Date(correction.correctedAt).toLocaleString("ko-KR")}</time>{correction.reason}</p>)}</section>}

    <details className="reader-sources">
      <summary><BookOpen size={17} /> 근거 원문 {story.sources.length}개 보기</summary>
      <div>{story.sources.map((source, sourceIndex) => <a href={source.url} target="_blank" rel="noreferrer" onClick={() => void trackReaderEvent("SOURCE_OPEN", editionId, story.id)} key={`${source.publisher}-${source.url}`}><span><b>[{sourceIndex + 1}]</b>{source.publisher}{source.primarySource && <small>1차 자료</small>}</span><ExternalLink size={14} /></a>)}</div>
    </details>
    {reportingEnabled && <StoryFeedbackPanel storyId={story.id} />}
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

async function trackReaderEvent(type: string, editionId: number, storyId?: number) {
  try {
    await fetch(`${apiBase}/api/reader/events`, { method: "POST", headers: deviceHeaders(), keepalive: true, body: JSON.stringify({ type, editionId, storyId }) });
  } catch { /* Metrics must never block reading. */ }
}

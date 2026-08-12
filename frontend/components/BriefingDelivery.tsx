"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, BellRing, BookOpen, CheckCircle2, Clock3, ExternalLink, FileCheck2, Settings2 } from "lucide-react";
import { demoBriefing, type Briefing, type Story } from "@/lib/briefing";
import { defaultBrand, type BriefingBrand } from "@/lib/product";

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
const categories = ["전체", "정책", "경제", "사회", "테크"] as const;

export function BriefingDelivery() {
  const [briefing, setBriefing] = useState<Briefing>(demoBriefing);
  const [brand, setBrand] = useState<BriefingBrand>(defaultBrand);
  const [category, setCategory] = useState<(typeof categories)[number]>("전체");
  const [loading, setLoading] = useState(true);
  const [subscribed, setSubscribed] = useState(false);
  const stories = useMemo(() => category === "전체" ? briefing.stories : briefing.stories.filter((story) => story.category === category), [briefing, category]);

  useEffect(() => {
    const brandTimer = window.setTimeout(() => {
      const storedBrand = window.localStorage.getItem("achim-gyeol-brand");
      if (storedBrand) try { setBrand(JSON.parse(storedBrand)); } catch { window.localStorage.removeItem("achim-gyeol-brand"); }
    }, 0);
    const controller = new AbortController();
    fetch(`${apiBase}/api/briefings/today`, { cache: "no-store", signal: controller.signal })
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

  return <main className="news-reader-shell">
    <header className="news-reader-topbar">
      <Link href="/" className="delivered-brand"><i /><strong>{brand.name}</strong><span>MORNING NEWS</span></Link>
      <Link href="/#delivery-deck" className="delivered-settings"><Settings2 size={16} /> 알림 설정</Link>
    </header>

    <section className="news-reader-hero">
      <div className="reader-date"><span>{briefing.productionReady ? "오늘의 실제 브리핑" : "미리보기 브리핑"}</span><strong>{briefing.dateLabel}</strong></div>
      <h1>오늘 꼭 알아야 할<br />어제의 뉴스</h1>
      <p>{loading ? "정확한 뉴스 브리핑을 불러오고 있습니다." : briefing.lead}</p>
      <div className="reader-stats">
        <span><strong>{briefing.stories.length}</strong> 중요 뉴스</span>
        <span><strong>{briefing.verifiedCount}</strong> 근거 확인</span>
        <span><Clock3 size={16} /><strong>{briefing.readMinutes}분</strong> 예상</span>
      </div>
    </section>

    <nav className="news-category-nav" aria-label="뉴스 분야">
      <div>{categories.map((item) => <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}{item !== "전체" && <small>{briefing.stories.filter((story) => story.category === item).length}</small>}</button>)}</div>
    </nav>

    <div className="news-reader-layout">
      <section className="news-feed" aria-live="polite">
        <header className="news-feed-heading"><div><span>NEWS BRIEF</span><h2>{category === "전체" ? "품질 기준을 통과한 중요 뉴스" : `${category} 분야 중요 뉴스`}</h2></div><p>확인된 사실과 아직 확인되지 않은 내용을 구분했습니다.</p></header>
        {stories.map((story) => <NewsArticle key={story.id} story={story} index={briefing.stories.findIndex((item) => item.id === story.id) + 1} />)}
        {!loading && stories.length === 0 && <div className="reader-empty">이 분야에서 품질 기준을 통과한 중요 뉴스가 없습니다.</div>}
      </section>

      <aside className="news-reader-aside">
        <div className="reader-toc">
          <span>오늘의 뉴스</span>
          <ol>{briefing.stories.map((story, index) => <li key={story.id}><a href={`#news-${story.id}`}><b>{String(index + 1).padStart(2, "0")}</b><span>{story.title}</span></a></li>)}</ol>
        </div>
        <div className="reader-trust-note"><FileCheck2 size={20} /><div><strong>어떻게 확인했나요?</strong><p>같은 사건을 보도한 독립 출처를 묶고, 각 핵심 문장에 근거 원문을 연결합니다.</p><Link href="/trust">품질 기준 보기</Link></div></div>
        {!subscribed && <Link className="reader-subscribe" href="/#delivery-deck"><BellRing size={17} /> 매일 오전 7:30 받기</Link>}
      </aside>
    </div>
  </main>;
}

function NewsArticle({ story, index }: { story: Story; index: number }) {
  const evidenceReady = story.evidenceAvailable && Boolean(story.claims?.length);
  const verified = story.verificationStatus === "VERIFIED";
  const confirmedPoints = evidenceReady ? story.claims! : summaryPoints(story.summary).map((statement) => ({ statement, sources: [] }));

  return <article className="reader-article" id={`news-${story.id}`}>
    <div className="reader-article-meta"><b>{String(index).padStart(2, "0")}</b><span>{story.category}</span><em className={verified && evidenceReady ? "confirmed" : "checking"}><CheckCircle2 size={14} /> {evidenceReady ? (verified ? "근거 확인" : "추가 확인 중") : "원문 제공"}</em></div>
    <h2>{story.title}</h2>
    <section className="reader-conclusion"><span>한 줄 결론</span><p>{story.oneLineSummary || confirmedPoints[0]?.statement || story.title}</p></section>

    <section className="reader-confirmed">
      <h3><FileCheck2 size={18} /> 확인된 핵심</h3>
      <ol>{confirmedPoints.map((claim, claimIndex) => <li key={`${claim.statement}-${claimIndex}`}>
        <p>{claim.statement}</p>
        {claim.sources.length > 0 && <div className="claim-citations">{claim.sources.map((source) => {
          const sourceNumber = story.sources.findIndex((item) => item.url === source.url) + 1;
          return <a href={source.url} target="_blank" rel="noreferrer" key={`${claim.statement}-${source.url}`}>[{sourceNumber}] {source.publisher}<ExternalLink size={12} /></a>;
        })}</div>}
      </li>)}</ol>
      {!evidenceReady && <div className="reader-legacy"><AlertTriangle size={17} /><p>이 뉴스는 이전 생성 형식이라 문장별 근거 번호가 없습니다. 아래 원문을 함께 확인해 주세요.</p></div>}
    </section>

    <section className="reader-why"><span>왜 중요한가</span><p>{story.whyItMatters}</p></section>
    {story.uncertainty && <section className="reader-uncertainty"><h3><AlertTriangle size={17} /> 아직 확인되지 않은 것</h3><p>{story.uncertainty}</p></section>}

    <details className="reader-sources">
      <summary><BookOpen size={17} /> 근거 원문 {story.sources.length}개 보기</summary>
      <div>{story.sources.map((source, sourceIndex) => <a href={source.url} target="_blank" rel="noreferrer" key={`${source.publisher}-${source.url}`}><span><b>[{sourceIndex + 1}]</b>{source.publisher}{source.primarySource && <small>1차 자료</small>}</span><ExternalLink size={14} /></a>)}</div>
    </details>
  </article>;
}

function summaryPoints(summary: string) {
  const points = summary.trim().split(/(?<=[.!?])\s+/).filter(Boolean);
  return points.length ? points : [summary];
}

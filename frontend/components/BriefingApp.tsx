"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  BookOpen,
  Check,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Newspaper,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { DeliveryDeck } from "@/components/DeliveryDeck";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { SubscriptionExperience, SubscriptionTrigger } from "@/components/SubscriptionExperience";
import { briefingCategoryOrder, demoBriefing, type Briefing, type Story } from "@/lib/briefing";

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export function BriefingApp() {
  const [briefing, setBriefing] = useState<Briefing>(demoBriefing);
  const [category, setCategory] = useState("전체");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("어제 뉴스 종합 브리핑을 불러오고 있어요.");

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${apiBase}/api/briefings/today`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("briefing unavailable");
        return response.json();
      })
      .then((data: Briefing) => {
        setBriefing(data);
        setNotice(data.productionReady ? "" : "현재는 사용법 확인용 예시 브리핑입니다. 실제 알림은 전날 뉴스 종합이 완료된 뒤에만 발송됩니다.");
      })
      .catch(() => setNotice("오늘의 브리핑을 불러오지 못해 예시 뉴스 카드를 보여드리고 있어요. 잠시 후 다시 확인해 주세요."))
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const stories = useMemo(
    () => category === "전체" ? briefing.stories : briefing.stories.filter((story) => story.category === category),
    [briefing, category],
  );
  const categories = useMemo(
    () => ["전체", ...briefingCategoryOrder.filter((item) => briefing.stories.some((story) => story.category === item))],
    [briefing.stories],
  );
  const leadStory = briefing.stories[0] ?? demoBriefing.stories[0];

  return (
    <main className="page-shell landing-shell">
      <SiteHeader />

      <section className="landing-hero" id="top">
        <div className="landing-hero-copy">
          <span className="landing-kicker"><Sparkles size={15} /> 바쁜 사람을 위한 AI 뉴스 브리핑</span>
          <h1>어제 뉴스를,<br /><em>매일 아침 한 번에.</em></h1>
          <p>하루 종일 뉴스를 따라가지 않아도 괜찮아요. 서로 다른 언론사의 보도를 확인하고, 꼭 알아야 할 흐름을 빠뜨리지 않은 모바일 뉴스 브리핑으로 정리해 드립니다.</p>
          <div className="landing-hero-actions">
            <SubscriptionTrigger className="landing-primary"><BellRing size={18} /> 무료 알림 받기</SubscriptionTrigger>
            <Link className="landing-text-link" href="/briefing">오늘의 뉴스 읽기 <ArrowRight size={16} /></Link>
          </div>
          <div className="landing-promises">
            <span><Check size={14} /> 회원가입 없음</span>
            <span><Check size={14} /> 무료 이용</span>
            <span><Check size={14} /> 원문 출처 제공</span>
          </div>
        </div>

        <div className="landing-hero-visual" aria-label="아침결 알림과 뉴스 카드 예시">
          <div className="hero-orbit hero-orbit-one" aria-hidden="true" />
          <div className="hero-orbit hero-orbit-two" aria-hidden="true" />
          <div className="phone-mockup">
            <div className="phone-status"><span>7:30</span><span>● ● ●</span></div>
            <div className="push-mockup">
              <div className="push-app-icon"><Newspaper size={19} /></div>
              <div><strong>아침결</strong><span>지금</span><p>어제 핵심 뉴스 {briefing.stories.length}건이 도착했어요</p></div>
            </div>
            <article className="hero-news-card">
              <div><span>{leadStory.category}</span><b>교차 확인</b></div>
              <h2>{leadStory.title}</h2>
              <p>{leadStory.summary}</p>
              <footer><span>약 {briefing.readMinutes}분</span><span>출처 {leadStory.sources.length}개</span></footer>
            </article>
          </div>
          <div className="hero-floating-note"><ShieldCheck size={18} /><div><strong>출처까지 함께</strong><span>요약만 믿지 않아도 돼요</span></div></div>
        </div>
      </section>

      <section className="landing-proof" aria-label="서비스 핵심 특징">
        <div><strong>07:30</strong><span>매일 아침 정규 도착</span></div>
        <div><strong>2+</strong><span>서로 다른 출처 확인</span></div>
        <div><strong>3줄</strong><span>뉴스별 핵심 요약</span></div>
        <div><strong>0원</strong><span>회원가입 없이 무료</span></div>
      </section>

      <section className="how-section" id="how-it-works">
        <div className="landing-section-heading">
          <span>HOW IT WORKS</span>
          <h2>아침결은 이렇게 도착해요</h2>
          <p>설정은 한 번만. 그다음부터는 전날의 중요한 흐름을 매일 아침 가볍게 확인하세요.</p>
        </div>
        <div className="how-grid">
          <article><div className="how-icon mint"><Clock3 /></div><small>01 · 뉴스 종합</small><h3>전날 뉴스를 모아요</h3><p>전날 00:00~23:59에 보도된 주요 뉴스를 분야별로 수집하고 같은 사건끼리 묶습니다.</p></article>
          <article><div className="how-icon violet"><Sparkles /></div><small>02 · AI 요약</small><h3>핵심과 출처를 정리해요</h3><p>AI가 3줄 요약과 중요성을 작성하고, 서로 다른 출처가 연결됐는지 다시 확인합니다.</p></article>
          <article><div className="how-icon yellow"><Smartphone /></div><small>03 · 아침 전달</small><h3>오전 7시 30분에 받아요</h3><p>휴대폰 알림을 누르면 큰 글자로 정리된 뉴스 전용 화면이 바로 열립니다.</p></article>
        </div>
      </section>

      <DeliveryDeck briefing={briefing} />

      <section className="archive-section" id="archive">
        <div className="landing-section-heading split-heading">
          <div><span>TODAY&apos;S BRIEFING</span><h2>오늘 아침, 이 뉴스부터</h2></div>
          <p>짧게 읽고 더 궁금한 뉴스만 원문으로 이어서 확인할 수 있습니다.</p>
        </div>
        <nav className="archive-nav" aria-label="뉴스 분야">
          {categories.map((item) => <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>)}
        </nav>
        <div className="story-list">
          {loading ? <LoadingRows /> : stories.length ? stories.slice(0, 4).map((story, index) => <StoryRow key={story.id} story={story} index={index + 1} onNotice={setNotice} />) : <div className="empty">오늘 이 분야에 선정된 브리핑은 없습니다.</div>}
        </div>
        <div className="archive-more"><Link href="/archive">지난 브리핑 전체 보기 <ArrowRight size={15} /></Link></div>
      </section>

      <section className="trust-strip">
        <div><span>WHY ACHIMGYEOL</span><h2>빠른 요약보다<br />믿을 수 있는 요약</h2><p>한 언론사의 시선만 반복하지 않습니다. 출처와 검증 상태를 독자가 직접 확인할 수 있게 남깁니다.</p><Link href="/trust">편집 원칙 자세히 보기 <ArrowRight size={15} /></Link></div>
        <ol>
          <li><ShieldCheck /><div><strong>두 곳 이상 교차 확인</strong><span>같은 사건을 다룬 독립된 출처를 우선 연결합니다.</span></div></li>
          <li><BookOpen /><div><strong>원문을 바로 확인</strong><span>모든 뉴스 카드에 언론사와 원문 링크를 표시합니다.</span></div></li>
          <li><RefreshCw /><div><strong>수정 이력을 공개</strong><span>오류를 발견하면 수정 시각과 이유를 남깁니다.</span></div></li>
        </ol>
      </section>

      <section className="faq-section">
        <div className="landing-section-heading"><span>FAQ</span><h2>자주 묻는 질문</h2></div>
        <div className="faq-list">
          <details open><summary>아침결은 무료인가요?</summary><p>네. 현재 회원가입과 결제 없이 무료로 이용할 수 있으며, 도네이트·유료 구독 기능도 사용하지 않습니다.</p></details>
          <details><summary>어떤 뉴스가 오나요?</summary><p>오늘의 속보가 아니라 전날 하루 동안 보도된 정책·경제·사회·국제·테크·생활·문화·스포츠·e스포츠의 중요한 사건을 AI가 복수 출처로 요약해 다음 날 아침에 보냅니다.</p></details>
          <details><summary>아이폰에서도 알림을 받을 수 있나요?</summary><p>네. Safari에서 아침결을 홈 화면에 추가한 뒤 홈 화면 아이콘으로 열고 ‘이 기기에 알림 등록’을 누르면 됩니다.</p></details>
          <details><summary>API 키를 직접 입력해야 하나요?</summary><p>아니요. 뉴스와 AI API는 운영자가 서버에 설정합니다. 사용자는 받을 요일만 선택하면 됩니다.</p></details>
        </div>
      </section>

      <section className="closing-cta">
        <div><span>내일부터 시작해요</span><h2>어제의 뉴스를<br />아침 한 번으로 끝내세요.</h2><p>30초면 설정이 끝납니다. 회원가입 없이 이 기기에 바로 등록하세요.</p></div>
        <SubscriptionTrigger className="landing-primary light"><BellRing size={18} /> 무료 알림 받기</SubscriptionTrigger>
      </section>

      <SiteFooter />
      <SubscriptionExperience onNotice={setNotice} />

      {notice && <div className="notice" role="status"><span>{notice}</span><button onClick={() => setNotice("")}>확인</button></div>}
    </main>
  );
}

function StoryRow({ story, index, onNotice }: { story: Story; index: number; onNotice: (message: string) => void }) {
  const verified = story.verificationStatus === "VERIFIED";
  const evidenceReady = story.evidenceAvailable && Boolean(story.claims?.length);
  return (
    <article className="story-row">
      <div className="story-index">{String(index).padStart(2, "0")}</div>
      <div className="story-body">
        <div className="story-kicker"><span className="category">{story.category}</span><span className={verified && evidenceReady ? "verified" : "verified developing"}><CheckCircle2 size={13} />{evidenceReady ? (verified ? "근거 연결" : "추가 확인 중") : "원문 제공"}</span></div>
        <h3>{story.title}</h3>
        <div className="story-conclusion"><strong>한 줄 결론</strong><p>{story.oneLineSummary || firstSentence(story.summary)}</p></div>
        <div className="story-summary"><strong>확인된 핵심</strong>{evidenceReady ? <ul>{story.claims!.slice(0, 3).map((claim, claimIndex) => <li key={`${claim.statement}-${claimIndex}`}>{claim.statement} <small>[{claim.sources.map((source) => story.sources.findIndex((item) => item.url === source.url) + 1).filter((number) => number > 0).join("·")}]</small></li>)}</ul> : <p className="summary">{story.summary}</p>}</div>
        <div className="why"><strong>알아야 할 것</strong><span>{story.whyItMatters}</span></div>
        {story.uncertainty && <div className="story-uncertainty"><strong>아직 확인되지 않은 것</strong><span>{story.uncertainty}</span></div>}
        <div className="source-row">
          <span>출처 {story.sources.map((source) => source.publisher).join(" · ")}</span>
          <div className="story-actions">
            <button aria-label="오류 신고" onClick={() => onNotice("오류 신고를 기록했어요. 검수 대기열에서 확인하겠습니다.")}><RefreshCw size={15} /></button>
            <a aria-label="첫 번째 원문 열기" href={story.sources[0]?.url ?? "#"} target="_blank" rel="noreferrer">원문 <ExternalLink size={14} /></a>
          </div>
        </div>
      </div>
    </article>
  );
}

function firstSentence(summary: string) {
  return summary.trim().split(/(?<=[.!?])\s+/)[0] || summary;
}

function LoadingRows() {
  return <>{[1, 2, 3].map((item) => <div className="story-row loading-row" key={item}><div className="story-index">0{item}</div><div className="story-body"><div className="skeleton short" /><div className="skeleton title" /><div className="skeleton copy" /></div></div>)}</>;
}

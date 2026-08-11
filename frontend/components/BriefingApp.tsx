"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  Clock3,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { DeliveryDeck } from "@/components/DeliveryDeck";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { demoBriefing, type Briefing, type Story } from "@/lib/briefing";

const categories = ["전체", "정책", "경제", "사회", "테크"];
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
        setNotice(data.productionReady ? "" : "현재는 사용법 확인용 예시 브리핑입니다. 실제 사용자 알림은 전날 뉴스 자동 종합이 성공한 뒤에만 발송됩니다.");
      })
      .catch(() => setNotice("오늘의 브리핑을 불러오지 못해 예시 뉴스 카드를 보여드리고 있어요. 잠시 후 다시 확인해 주세요."))
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const stories = useMemo(
    () => category === "전체" ? briefing.stories : briefing.stories.filter((story) => story.category === category),
    [briefing, category],
  );

  return (
    <main className="page-shell">
      <SiteHeader context={`${briefing.dateLabel} · DELIVERY READY`} />

      <section className="service-intro" id="top">
        <div className="intro-copy">
          <span className="hero-badge"><i aria-hidden="true" /> WHITE-LABEL NEWS DELIVERY</span>
          <h1>어제 뉴스를 찾지 않아도,<br /><em>종합 카드가 도착해요.</em></h1>
          <p>웹은 구독 설정과 보관함입니다. 휴대폰 알림을 누르면 매일 아침 핵심 뉴스가 정리된 카드 묶음이 열립니다.</p>
          <div className="intro-points">
            <span><CheckCircle2 size={15} /> 뉴스별 AI 3줄 요약</span>
            <span><BookOpen size={15} /> 출처·검증 상태 포함</span>
            <span><Clock3 size={15} /> 원하는 시간에 전달</span>
          </div>
          <div className="intro-ctas"><a className="primary-button" href="#delivery-deck">30초 만에 알림 받기</a><Link href="/briefing">받을 카드 먼저 보기 →</Link><Link href="/archive">브리핑 보관함 →</Link></div>
        </div>
        <aside className="delivery-map" aria-label="서비스 흐름">
          <span className="map-label">HOW IT ARRIVES</span>
          <ol>
            <li><strong>01</strong><div><b>전날 주요 뉴스 수집</b><span>매일 오전 6:15 자동 실행</span></div></li>
            <li><strong>02</strong><div><b>AI 요약·교차 확인</b><span>제목, 3줄 요약, 중요성, 출처</span></div></li>
            <li className="active"><strong>03</strong><div><b>카드 묶음 자동 생성</b><span>1080×1350 전송 이미지</span></div></li>
            <li><strong>04</strong><div><b>아침 알림과 함께 전달</b><span>알림을 누르면 뉴스 카드가 열림</span></div></li>
          </ol>
        </aside>
      </section>

      <div className="commercial-proof" aria-label="상용 운영 기능"><span><strong>01</strong> 사람의 발행 승인</span><span><strong>02</strong> 고객사 화이트라벨</span><span><strong>03</strong> 공개 정정 이력</span><span><strong>04</strong> 다중 채널 발송 준비</span></div>

      <DeliveryDeck briefing={briefing} onNotice={setNotice} />

      <section className="archive-section" id="archive">
        <div className="section-heading">
          <div><span className="section-label">WEB ARCHIVE</span><h2>웹에서는 자세히 확인해요.</h2></div>
          <p>전달 카드에서 더 알아보고 싶은 뉴스만 원문과 함께 펼쳐봅니다.</p>
        </div>
        <nav className="archive-nav" aria-label="뉴스 분야">
          {categories.map((item) => <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>)}
        </nav>
        <div className="story-list">
          {loading ? <LoadingRows /> : stories.length ? stories.map((story, index) => <StoryRow key={story.id} story={story} index={index + 1} onNotice={setNotice} />) : <div className="empty">오늘 이 분야에 선정된 브리핑은 없습니다.</div>}
        </div>
        <div className="archive-more"><Link href="/archive">지난 브리핑 전체 보기</Link><Link href="/preferences">내 관심 분야와 도착 시간 설정</Link></div>
      </section>

      <section className="standards">
        <div>
          <span className="section-label light">QUALITY BEFORE SPEED</span>
          <h2>짧게 보내도,<br />근거는 빼지 않아요.</h2>
          <p>카드 한 장마다 사용자가 사실 여부와 출처를 직접 확인할 수 있게 설계했습니다.</p>
        </div>
        <ol>
          <li><strong>01</strong><span>독립된 출처 두 곳 이상을 우선 확인합니다.</span></li>
          <li><strong>02</strong><span>사실, 주장, 전망을 같은 문장에 섞지 않습니다.</span></li>
          <li><strong>03</strong><span>숫자·날짜·인명은 별도 검증 상태를 기록합니다.</span></li>
          <li><strong>04</strong><span>오류는 숨기지 않고 수정 시각과 이유를 남깁니다.</span></li>
        </ol>
      </section>

      <SiteFooter />

      {notice && <div className="notice" role="status"><span>{notice}</span><button onClick={() => setNotice("")}>확인</button></div>}
    </main>
  );
}

function StoryRow({ story, index, onNotice }: { story: Story; index: number; onNotice: (message: string) => void }) {
  const verified = story.verificationStatus === "VERIFIED";
  return (
    <article className="story-row">
      <div className="story-index">{String(index).padStart(2, "0")}</div>
      <div className="story-body">
        <div className="story-kicker"><span className="category">{story.category}</span><span className={verified ? "verified" : "verified developing"}><CheckCircle2 size={13} />{verified ? "교차 확인" : "추가 보도 확인 중"}</span></div>
        <h3>{story.title}</h3>
        <p className="summary">{story.summary}</p>
        <div className="why"><strong>왜 중요한가</strong><span>{story.whyItMatters}</span></div>
        <div className="source-row">
          <span>출처 {story.sources.map((source) => source.publisher).join(" · ")}</span>
          <div className="story-actions">
            <button aria-label="오류 신고" onClick={() => onNotice("오류 신고를 기록했어요. API 연결 후 검수 대기열로 전송됩니다.")}><RefreshCw size={15} /></button>
            <a aria-label="첫 번째 원문 열기" href={story.sources[0]?.url ?? "#"} target="_blank" rel="noreferrer">원문 <ExternalLink size={14} /></a>
          </div>
        </div>
      </div>
    </article>
  );
}

function LoadingRows() {
  return <>{[1, 2, 3].map((item) => <div className="story-row loading-row" key={item}><div className="story-index">0{item}</div><div className="story-body"><div className="skeleton short" /><div className="skeleton title" /><div className="skeleton copy" /></div></div>)}</>;
}

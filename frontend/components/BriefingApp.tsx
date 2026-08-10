"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  BookOpen,
  CheckCircle2,
  Clock3,
  ExternalLink,
  RefreshCw,
  Share2,
  Volume2,
} from "lucide-react";
import { demoBriefing, type Briefing, type Story } from "@/lib/briefing";

const categories = ["전체", "정책", "경제", "사회", "테크"];
const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export function BriefingApp() {
  const [briefing, setBriefing] = useState<Briefing>(demoBriefing);
  const [category, setCategory] = useState("전체");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("API 연결 전이라 데모 브리핑을 보여드리고 있어요.");

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${apiBase}/api/briefings/today`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("briefing unavailable");
        return response.json();
      })
      .then((data: Briefing) => {
        setBriefing(data);
        setNotice("");
      })
      .catch(() => setNotice("API 연결 전이라 데모 브리핑을 보여드리고 있어요."))
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const stories = useMemo(
    () =>
      category === "전체"
        ? briefing.stories
        : briefing.stories.filter((story) => story.category === category),
    [briefing, category],
  );

  const enableNotifications = async () => {
    if (!("Notification" in window)) {
      setNotice("이 브라우저는 알림을 지원하지 않아요.");
      return;
    }
    const permission = await Notification.requestPermission();
    setNotice(
      permission === "granted"
        ? "매일 아침 브리핑 알림을 받을 준비가 됐어요."
        : "브라우저 설정에서 알림을 허용할 수 있어요.",
    );
  };

  const shareBriefing = async () => {
    const payload = {
      title: "아침결 모닝 브리핑",
      text: briefing.lead,
      url: window.location.href,
    };
    if (navigator.share) await navigator.share(payload);
    else {
      await navigator.clipboard.writeText(window.location.href);
      setNotice("브리핑 주소를 복사했어요.");
    }
  };

  return (
    <main className="page-shell">
      <header className="masthead">
        <div className="masthead-utility">
          <span>AI DAILY NEWS BRIEFING</span>
          <span>{briefing.dateLabel} · 오전 7시 발행</span>
        </div>
        <div className="masthead-main">
          <div className="brand"><span aria-hidden="true" />아침결</div>
          <p>어제의 핵심을 오늘의 판단으로</p>
          <div className="header-actions">
            <button className="icon-button" aria-label="브리핑 공유" onClick={shareBriefing}>
              <Share2 size={17} />
            </button>
            <button className="primary-button" onClick={enableNotifications}>
              <Bell size={16} /><span>아침 알림 받기</span>
            </button>
          </div>
        </div>
        <nav className="news-nav" aria-label="뉴스 분야">
          {categories.map((item) => (
            <button
              key={item}
              className={category === item ? "active" : ""}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </nav>
      </header>

      <section className="lead-section">
        <div className="lead-copy">
          <span className="section-label">MORNING BRIEF</span>
          <h1>놓친 하루를<br />5분 안에 읽습니다.</h1>
          <p>{briefing.lead}</p>
          <div className="lead-actions">
            <button className="primary-button" onClick={() => setNotice("음성 브리핑은 API 연결 단계에서 추가할 수 있어요.")}>
              <Volume2 size={16} /> 3분 브리핑 듣기
            </button>
            <button className="text-button" onClick={shareBriefing}>오늘 브리핑 공유 <Share2 size={14} /></button>
          </div>
        </div>
        <aside className="edition-panel" aria-label="브리핑 정보">
          <div className="edition-heading">TODAY&apos;S EDITION</div>
          <dl>
            <div><dt>예상 읽기</dt><dd>{briefing.readMinutes}분</dd></div>
            <div><dt>주요 기사</dt><dd>{briefing.stories.length}건</dd></div>
            <div><dt>교차 검증</dt><dd>{briefing.verifiedCount}건</dd></div>
            <div><dt>마지막 확인</dt><dd>{briefing.lastVerifiedAt}</dd></div>
          </dl>
          <p><CheckCircle2 size={15} /> 출처와 검증 상태를 함께 공개합니다.</p>
        </aside>
      </section>

      <div className="trust-strip" aria-label="편집 원칙">
        <span><CheckCircle2 size={14} /> 복수 출처 우선</span>
        <span><BookOpen size={14} /> 원문 바로가기</span>
        <span><Clock3 size={14} /> 수정 시각 공개</span>
        <span><RefreshCw size={14} /> 오류 신고 반영</span>
      </div>

      <section className="news-section">
        <div className="section-heading">
          <div><span className="section-label">TOP STORIES</span><h2>오늘 꼭 알아둘 이야기</h2></div>
          <p>조회 수보다 일상에 미치는 영향을 먼저 봤습니다.</p>
        </div>
        <div className="story-list">
          {loading ? (
            <LoadingRows />
          ) : stories.length ? (
            stories.map((story, index) => (
              <StoryRow key={story.id} story={story} index={index + 1} onNotice={setNotice} />
            ))
          ) : (
            <div className="empty">오늘 이 분야에 선정된 브리핑은 없습니다.</div>
          )}
        </div>
      </section>

      <section className="standards">
        <div>
          <span className="section-label light">EDITORIAL STANDARD</span>
          <h2>빠름보다<br />확인된 한 문장.</h2>
          <p>AI가 초안을 만들고, 품질 규칙을 통과한 이야기만 발행합니다.</p>
        </div>
        <ol>
          <li><strong>01</strong><span>독립된 출처 두 곳 이상을 기본으로 확인합니다.</span></li>
          <li><strong>02</strong><span>사실, 주장, 전망을 같은 문장에 섞지 않습니다.</span></li>
          <li><strong>03</strong><span>숫자·날짜·인명은 별도 검증 상태를 기록합니다.</span></li>
          <li><strong>04</strong><span>오류는 숨기지 않고 수정 시각과 이유를 남깁니다.</span></li>
        </ol>
      </section>

      <footer className="footer">
        <span>아침결은 공개 자료를 AI로 정리합니다. 중요한 판단 전에는 원문을 확인하세요.</span>
        <span>coders.kr 배포 호환 · PWA</span>
      </footer>

      {notice && (
        <div className="notice" role="status">
          <span>{notice}</span><button onClick={() => setNotice("")}>확인</button>
        </div>
      )}
    </main>
  );
}

function StoryRow({ story, index, onNotice }: { story: Story; index: number; onNotice: (message: string) => void }) {
  const verified = story.verificationStatus === "VERIFIED";
  return (
    <article className="story-row">
      <div className="story-index">{String(index).padStart(2, "0")}</div>
      <div className="story-body">
        <div className="story-kicker">
          <span className="category">{story.category}</span>
          <span className={verified ? "verified" : "verified developing"}>
            <CheckCircle2 size={13} />{verified ? "교차 확인" : "추가 보도 확인 중"}
          </span>
        </div>
        <h3>{story.title}</h3>
        <p className="summary">{story.summary}</p>
        <div className="why"><strong>왜 중요한가</strong><span>{story.whyItMatters}</span></div>
        <div className="source-row">
          <span>출처 {story.sources.map((source) => source.publisher).join(" · ")}</span>
          <div className="story-actions">
            <button aria-label="오류 신고" onClick={() => onNotice("오류 신고를 기록했어요. 확인 후 수정 이력에 반영할게요.")}>
              <RefreshCw size={15} />
            </button>
            <a aria-label="첫 번째 원문 열기" href={story.sources[0]?.url ?? "#"} target="_blank" rel="noreferrer">
              원문 <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}

function LoadingRows() {
  return <>{[1, 2, 3].map((item) => <div className="story-row loading-row" key={item}><div className="story-index">0{item}</div><div className="story-body"><div className="skeleton short" /><div className="skeleton title" /><div className="skeleton copy" /></div></div>)}</>;
}

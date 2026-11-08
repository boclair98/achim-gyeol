"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight, ChevronRight, RefreshCw } from "lucide-react";
import type { Briefing, Story } from "@/lib/briefing";
import { distinctText, fragmentStoryId, koreaToday, safeNewsUrl, storyLead } from "@/lib/daily-letter";
import { readReceivedStorage, receivedApiBase, receivedDeviceHeaders, useReceivedEdition, writeReceivedStorage, type ReceivedEditionResult } from "@/lib/use-received-edition";
import styles from "./ReceivedBriefing.module.css";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const contentsId = "received-contents";
const fontKey = "achim-gyeol-reader-font";
const fontOptions = [
  ["small", "작은 글자"], ["normal", "기본 글자"], ["large", "큰 글자"],
] as const;
type FontSize = (typeof fontOptions)[number][0];
const storyAnchor = (id: number) => `#news-${id}`;
const rowId = (id: number) => `received-story-${id}`;

export function ReceivedBriefing() {
  const { date, fragment, result, retry } = useReceivedEdition();
  const data = result.data;
  const isReadable = (result.state === "ready" || result.state === "cached") && data;
  const notice = result.state === "cached" ? "연결이 원활하지 않아 이 기기에 저장된 뉴스레터를 보여드려요."
    : data && !data.productionReady ? "먼저 준비된 뉴스를 전해요. 내용이 보완될 수 있어요."
    : !date && data?.briefingDate && data.briefingDate !== koreaToday() ? "가장 최근에 발행한 뉴스레터예요."
    : "";

  return <main className={styles.surface}>
    <div className={styles.sheet}>
      <header className={styles.masthead}>
        <Link href="/" className={styles.brand} aria-label="아침결 홈" prefetch={false}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${basePath}/newsletter-prototypes/edition-icon.svg`} width={32} height={32} alt="" />
          <span>아침결<span className={styles.brandDot}>.</span></span>
        </Link>
        <span className={styles.mastheadLabel}>뉴스레터</span>
      </header>
      {isReadable ? <>
        {notice && <p className={styles.notice} role="status">{notice}</p>}
        <ReceivedEdition key={data.id} briefing={data} fragment={fragment}
          report={result.state === "ready" && data.productionReady === true && data.briefingDate === koreaToday()} />
      </> : <ReceivedEditionStatus state={result.state} date={date} onRetry={retry} />}
      <footer className={styles.sheetFooter}>
        <nav aria-label="뉴스레터 안내">
          <Link href="/archive" prefetch={false}>지난 뉴스</Link>
          <Link href="/preferences" prefetch={false}>알림 설정</Link>
          <Link href="/trust" prefetch={false}>서비스 원칙</Link>
        </nav>
      </footer>
    </div>
  </main>;
}

export function ReceivedEditionStatus({ state, date, onRetry, heading: Heading = "h1" }: {
  state: ReceivedEditionResult["state"]; date: string | null; onRetry: () => void; heading?: "h1" | "h2";
}) {
  const loading = state === "loading";
  const title = loading ? "뉴스레터를 불러오고 있어요"
    : state === "empty" ? "아직 읽을 뉴스가 없어요"
    : state === "invalid" ? "발행일 링크를 확인해 주세요"
    : "뉴스레터를 열지 못했어요";
  const description = loading ? "잠시만 기다려 주세요."
    : state === "empty" ? "이 발행일에 준비된 뉴스가 아직 없어요."
    : state === "invalid" ? "지난 뉴스에서 원하는 날짜를 다시 선택해 주세요."
    : date ? `${date} 발행본을 불러오지 못했어요. 연결 상태를 확인하거나 지난 뉴스를 열어보세요.`
    : "연결 상태를 확인하고 다시 시도해 주세요.";
  return <section className={styles.state} aria-busy={loading}>
    <div role="status"><Heading>{title}</Heading><p>{description}</p></div>
    {!loading && <div className={styles.stateActions}>
      {state !== "invalid" && <button className={styles.action} type="button" onClick={onRetry}>
        <RefreshCw size={16} aria-hidden="true" /> 다시 불러오기
      </button>}
      <Link href="/archive" className={styles.textAction} prefetch={false}>지난 뉴스 보기 <ArrowRight size={16} aria-hidden="true" /></Link>
    </div>}
  </section>;
}

function ReceivedEdition({ briefing, fragment, report }: { briefing: Briefing; fragment: string; report: boolean }) {
  const { id, stories, dateLabel, briefingDate } = briefing;
  const requested = fragmentStoryId(fragment);
  const position = requested === null ? -1 : stories.findIndex(item => item.id === requested);
  const story = stories[position];
  const selectedId = story?.id ?? null;
  const opener = useRef<number | null>(null);
  const lastArticle = useRef<number | null>(null);
  const readKey = `achim-gyeol-read-${id}`;
  const [read, setRead] = useState(() => loadReadIds(readKey, stories));
  const readRef = useRef(read);
  const [font, setFont] = useState<FontSize>(() => {
    const saved = readReceivedStorage(fontKey);
    return saved === "small" || saved === "large" ? saved : "normal";
  });

  useEffect(() => {
    if (report) void reportReaderEvent("BRIEFING_OPEN", id);
  }, [report, id]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const previous = lastArticle.current;
      lastArticle.current = selectedId;
      if (selectedId !== null && selectedId !== previous) {
        window.scrollTo({ top: 0, behavior: "instant" });
        document.getElementById(`news-${selectedId}`)?.focus({ preventScroll: true });
        if (!readRef.current.has(selectedId)) {
          const next = new Set(readRef.current).add(selectedId);
          readRef.current = next;
          setRead(next);
          writeReceivedStorage(readKey, JSON.stringify([...next]));
          if (report) {
            void reportReaderEvent("CARD_VIEW", id, selectedId);
            if (next.size === stories.length) void reportReaderEvent("COMPLETE", id);
          }
        }
      } else if (selectedId === null && (previous !== null || fragment === `#${contentsId}`)) {
        const row = previous !== null ? document.getElementById(rowId(opener.current ?? previous)) : null;
        const target = row ?? document.getElementById(contentsId);
        target?.focus({ preventScroll: true });
        target?.scrollIntoView({ block: row ? "center" : "start", behavior: "instant" });
        opener.current = null;
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [selectedId, fragment, readKey, report, id, stories.length]);

  function rememberOpener(event: MouseEvent<HTMLAnchorElement>, id: number) {
    if (event.button === 0 && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey) opener.current = id;
  }

  if (story) {
    const date = briefingDate ? `?date=${encodeURIComponent(briefingDate)}` : "";
    return <div className={styles.reading} data-font={font}>
      <div className={styles.readingBar}>
        <a href={`#${contentsId}`} className={styles.textAction}><ArrowLeft size={18} aria-hidden="true" /> 뉴스 목록</a>
        <div className={styles.fontControls} role="group" aria-label="글자 크기">
          {fontOptions.map(([size, label]) => <button type="button" key={size} aria-label={label} aria-pressed={size === font}
            onClick={() => { setFont(size); writeReceivedStorage(fontKey, size); }}>가</button>)}
        </div>
      </div>
      <ReceivedStory key={story.id} story={story} dateLabel={dateLabel} date={briefingDate}
        position={position + 1} total={stories.length} publicHref={`/briefing/${date}${storyAnchor(story.id)}`} canReport={report} />
      <ArticleNeighbors previous={stories[position - 1]} next={stories[position + 1]} />
    </div>;
  }

  return <>
    <header className={styles.intro}>
      <p className={styles.dateline}><time dateTime={briefingDate}>{dateLabel}</time></p>
      <h1>어제의 핵심 뉴스</h1>
      <p className={styles.introCopy}>기사 제목을 누르면 핵심 요약부터 볼 수 있어요.</p>
    </header>
    {fragment.startsWith("#news-") && <p className={styles.notice} role="status">이 뉴스레터에서 해당 기사를 찾지 못했어요. 아래 목록을 확인해 주세요.</p>}
    <section className={styles.contents} id={contentsId} tabIndex={-1} aria-labelledby="received-list-title">
      <header className={styles.listHead}><h2 id="received-list-title">이 편의 뉴스</h2><span>{stories.length}건</span></header>
      <ol className={styles.storyList}>
        {stories.map((item, index) => <li key={item.id}>
          <a href={storyAnchor(item.id)} id={rowId(item.id)} className={styles.row} onClick={event => rememberOpener(event, item.id)}
            data-received-story={item.id}>
            <span className={styles.rowNumber} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
            <span className={styles.rowText}>
              <span className={styles.rowMeta}>{item.category}{read.has(item.id) && <span className={styles.readMark}>읽음</span>}</span>
              <strong>{item.title}</strong>
            </span>
            <ChevronRight className={styles.rowArrow} size={20} aria-hidden="true" />
          </a>
        </li>)}
      </ol>
    </section>
  </>;
}

function ReceivedStory({ story, dateLabel, date, position, total, publicHref, canReport }: {
  story: Story; dateLabel: string; date?: string; position: number; total: number; publicHref: string; canReport: boolean;
}) {
  const lead = storyLead(story);
  const body = story.plainExplanation?.trim() || story.summary;
  const sources = story.sources.flatMap(source => {
    const href = safeNewsUrl(source.url);
    return href ? [{ href, publisher: source.publisher }] : [];
  });
  return <article id={`news-${story.id}`} tabIndex={-1} aria-labelledby={`received-headline-${story.id}`} className={styles.story}>
    <div className={styles.articleMeta}>
      <span><strong>{story.category}</strong><time dateTime={date}>{dateLabel}</time></span>
      <span aria-label={`전체 ${total}건 중 ${position}번째`}>{position} / {total}</span>
    </div>
    <h1 id={`received-headline-${story.id}`}>{story.title}</h1>
    <section className={styles.takeaway} aria-labelledby="received-takeaway"><h2 id="received-takeaway">핵심 요약</h2><p>{lead}</p></section>
    <ReceivedPhoto story={story} />
    {(distinctText(body, lead) || distinctText(story.summary, body, lead)) && <section className={styles.storySection}>
      <h2>쉽게 읽기</h2>
      {distinctText(body, lead) && <p>{body}</p>}
      {distinctText(story.summary, body, lead) && <p>{story.summary}</p>}
    </section>}
    {distinctText(story.backgroundContext, body, story.summary, lead) && <StorySection label="배경이 궁금하다면" text={story.backgroundContext} />}
    {distinctText(story.whyItMatters, body, story.summary, lead, story.backgroundContext) && <StorySection label="왜 중요한가요" text={story.whyItMatters} />}
    {story.whatToWatch && <StorySection label="다음에 살펴볼 점" text={story.whatToWatch} />}
    {story.uncertainty && <StorySection label="아직 확인이 필요한 점" text={story.uncertainty} />}
    {!!story.corrections?.length && <section className={styles.storySection}>
      <h2>바로잡은 내용</h2>
      {story.corrections.map((correction, index) => <p key={index}>{correction.reason} <time>{correction.correctedAt}</time></p>)}
    </section>}
    {!!story.claims?.length && <details className={styles.evidence}>
      <summary>근거 확인</summary>
      <ul>{story.claims.map((claim, index) => <li key={index}>
        <p>{claim.statement}</p>
        {claim.sources.map((source, sourceIndex) => {
          const href = safeNewsUrl(source.url);
          return href && <a className={styles.textAction} key={sourceIndex} href={href} target="_blank" rel="noopener noreferrer">{source.publisher} <ArrowUpRight size={14} aria-hidden="true" /></a>;
        })}
      </li>)}</ul>
    </details>}
    <footer className={styles.articleFooter}>
      {!!sources.length && <section aria-labelledby="received-sources">
        <h2 id="received-sources">원문과 출처</h2>
        <ul>{sources.map(({ href, publisher }, index) => <li key={index}>
          <a className={styles.sourceLink} href={href} target="_blank" rel="noopener noreferrer">
            <span>{publisher || "원문 기사"}</span><ArrowUpRight size={16} aria-hidden="true" />
          </a>
        </li>)}</ul>
      </section>}
      <Link className={styles.textAction} href={publicHref} prefetch={false}>
        {canReport ? "공유·의견 남기기" : "기존 뉴스 화면에서 보기"} <ArrowRight size={15} aria-hidden="true" />
      </Link>
    </footer>
  </article>;
}

function StorySection({ label, text }: { label: string; text?: string | null }) {
  return <section className={styles.storySection}><h2>{label}</h2><p>{text}</p></section>;
}

function ReceivedPhoto({ story }: { story: Story }) {
  const [failed, setFailed] = useState(false);
  const href = safeNewsUrl(story.imageUrl);
  if (!href || failed) return null;
  return <figure className={styles.photo}>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={href} alt={`${story.title} 관련 사진`} decoding="async" referrerPolicy="no-referrer" onError={() => setFailed(true)} />
    <figcaption>{story.imagePublisher ? `사진 · ${story.imagePublisher}` : "관련 원문 기사 사진"}</figcaption>
  </figure>;
}

function ArticleNeighbors({ previous, next }: { previous?: Story; next?: Story }) {
  return <nav className={styles.neighbors} aria-label="이전·다음 기사">
    {previous && <a href={storyAnchor(previous.id)}><span><ArrowLeft size={15} aria-hidden="true" /> 이전 기사</span><strong>{previous.title}</strong></a>}
    {next && <a href={storyAnchor(next.id)}><span>다음 기사 <ArrowRight size={15} aria-hidden="true" /></span><strong>{next.title}</strong></a>}
    <a className={styles.neighborIndex} href={`#${contentsId}`}><span>뉴스 목록으로 <ArrowRight size={15} aria-hidden="true" /></span></a>
  </nav>;
}

function loadReadIds(key: string, stories: readonly Story[]) {
  try {
    const saved: unknown = JSON.parse(readReceivedStorage(key) ?? "[]");
    if (!Array.isArray(saved)) return new Set<number>();
    const ids = new Set(stories.map(story => story.id));
    return new Set(saved.filter((id): id is number => typeof id === "number" && ids.has(id)));
  } catch { return new Set<number>(); }
}

async function reportReaderEvent(type: string, editionId: number, storyId?: number) {
  try {
    await fetch(`${receivedApiBase}/api/reader/events`, {
      method: "POST", headers: receivedDeviceHeaders(), keepalive: true, body: JSON.stringify({ type, editionId, storyId }),
    });
  } catch { /* A reader event must not interrupt the edition. */ }
}

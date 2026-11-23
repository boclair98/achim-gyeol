"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import Link from "next/link";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Check, ChevronDown, ChevronRight, Mail, RefreshCw } from "lucide-react";
import type { Briefing, Story } from "@/lib/briefing";
import { fragmentStoryId, koreaToday, safeNewsUrl } from "@/lib/daily-letter";
import { composeReceivedReading, relatedGlossaryTerm } from "@/lib/received-reading";
import { readReceivedStorage, receivedApiBase, receivedDeviceHeaders, useReceivedEdition, writeReceivedStorage, type ReceivedEditionResult } from "@/lib/use-received-edition";
import styles from "./ReceivedBriefing.module.css";

const contentsId = "received-contents";
const fontKey = "achim-gyeol-reader-font";
const fontOptions = [
  ["small", "가−", "작은 글자"], ["normal", "가", "기본 글자"], ["large", "가+", "큰 글자"],
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
    <div className={styles.sheet} data-reading={!!data?.stories.some(item => item.id === fragmentStoryId(fragment))}>
      <header className={styles.masthead}>
        <Link href="/" className={styles.brand} aria-label="아침결 홈" prefetch={false}>
          <i className={styles.brandMark} aria-hidden="true"><Mail size={15} strokeWidth={2.4} /></i>
          <span>아침결</span>
        </Link>
        <span className={styles.mastheadLabel}>받은 뉴스</span>
      </header>
      {isReadable ? <>
        {notice && <p className={styles.notice} role="status">{notice}</p>}
        <ReceivedEdition key={data.id} briefing={data} fragment={fragment}
          report={result.state === "ready" && data.productionReady === true && data.briefingDate === koreaToday()} />
      </> : <ReceivedEditionStatus state={result.state} date={date} onRetry={retry} />}
      <footer className={styles.sheetFooter}>
        <p>세상을 읽는 시간, 아침결.</p>
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
  const opener = useRef<{ id: string; top: number } | null>(null);
  const lastArticle = useRef<number | null>(null);
  const readKey = `achim-gyeol-read-${id}`;
  const [read, setRead] = useState(() => loadReadIds(readKey, stories));
  const readRef = useRef(read);
  const [font, setFont] = useState<FontSize>(() => {
    const saved = readReceivedStorage(fontKey);
    return saved === "small" || saved === "large" ? saved : "normal";
  });
  const nextUnread = stories.find(item => !read.has(item.id));

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
        const origin = opener.current;
        const row = previous !== null
          ? (origin ? document.getElementById(origin.id) : null) ?? document.getElementById(rowId(previous))
          : null;
        const target = row ?? document.getElementById(contentsId);
        target?.focus({ preventScroll: true });
        if (row && origin?.id === row.id) {
          const visibleTop = Math.max(0, Math.min(origin.top, window.innerHeight - 48));
          window.scrollBy({ top: row.getBoundingClientRect().top - visibleTop, behavior: "instant" });
        } else {
          target?.scrollIntoView({ block: row ? "center" : "start", behavior: "instant" });
        }
        opener.current = null;
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [selectedId, fragment, readKey, report, id, stories.length]);

  function rememberOpener(event: MouseEvent<HTMLAnchorElement>, id: number) {
    if (event.button === 0 && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
      opener.current = { id: event.currentTarget.id || rowId(id), top: event.currentTarget.getBoundingClientRect().top };
    }
  }

  if (story) {
    const date = briefingDate ? `?date=${encodeURIComponent(briefingDate)}` : "";
    return <div className={styles.reading} data-font={font}>
      <div className={styles.readingBar}>
        <a href={`#${contentsId}`} className={styles.textAction}><ArrowLeft size={18} aria-hidden="true" /> 뉴스 목록</a>
        <div className={styles.fontControls} role="group" aria-label="글자 크기">
          {fontOptions.map(([size, label, accessibleLabel]) => <button type="button" key={size} aria-label={accessibleLabel} aria-pressed={size === font}
            onClick={() => { setFont(size); writeReceivedStorage(fontKey, size); }}>{label}</button>)}
        </div>
        {stories[position + 1] && <a href={storyAnchor(stories[position + 1].id)} className={styles.nextQuick} aria-label="다음 뉴스">
          <span>다음</span><ArrowRight size={18} aria-hidden="true" />
        </a>}
      </div>
      <ReceivedStory key={story.id} story={story} dateLabel={dateLabel} date={briefingDate}
        position={position + 1} total={stories.length} publicHref={`/briefing/${date}${storyAnchor(story.id)}`} canReport={report} />
      <ArticleNeighbors previous={stories[position - 1]} next={stories[position + 1]} />
    </div>;
  }

  return <>
    <header className={styles.intro}>
      <div className={styles.editionMeta}>
        <time className={styles.editionEyebrow} dateTime={briefingDate}>{dateLabel} 발행</time>
        <p className={styles.editionFacts}>뉴스 {stories.length}건{briefing.readMinutes > 0 && <> · 전체 약 {briefing.readMinutes}분</>}</p>
      </div>
      <h1>어제의 핵심 뉴스</h1>
      <p className={styles.editionInvitation}>관심 가는 이야기부터 편하게 읽어보세요.</p>
    </header>
    {read.size > 0 && <aside className={styles.readProgress} aria-label="이 기기의 읽기 기록">
      <div><span>{read.size === stories.length ? "이번 편을 모두 열어봤어요" : "읽던 이야기, 이어서"}</span>
        <strong>{read.size} / {stories.length}편 열어봄</strong>
        <progress value={read.size} max={stories.length} aria-label="열어본 기사 수" />
      </div>
      {nextUnread ? <a id="received-continue" href={storyAnchor(nextUnread.id)} onClick={event => rememberOpener(event, nextUnread.id)} className={styles.textAction}>이어서 읽기 <ArrowRight size={17} aria-hidden="true" /></a>
        : <Check size={24} aria-label="모든 기사 열람" />}
    </aside>}
    {fragment.startsWith("#news-") && <p className={styles.notice} role="status">이 뉴스레터에서 해당 기사를 찾지 못했어요. 아래 목록을 확인해 주세요.</p>}
    <section className={styles.contents} id={contentsId} tabIndex={-1} aria-labelledby="received-list-title">
      <header className={styles.listHead}><h2 id="received-list-title">읽고 싶은 뉴스부터</h2></header>
      <ol className={styles.storyList}>
        {stories.map((item, index) => <ReceivedStoryRow key={item.id} story={item} index={index}
          opened={read.has(item.id)} onOpen={rememberOpener} />)}
      </ol>
    </section>
  </>;
}

function ReceivedStoryRow({ story, index, opened, onOpen }: {
  story: Story; index: number; opened: boolean; onOpen: (event: MouseEvent<HTMLAnchorElement>, id: number) => void;
}) {
  const confidence = confirmationLabel(story);
  const lead = index === 0;
  const metaId = `received-meta-${story.id}`;
  const titleId = `received-title-${story.id}`;
  const teaser = index < 3 ? storyTeaser(story) : undefined;
  const teaserId = `received-teaser-${story.id}`;
  return <li className={lead ? styles.leadItem : undefined}>
    <a href={storyAnchor(story.id)} id={rowId(story.id)} className={styles.row}
      aria-labelledby={titleId} aria-describedby={teaser ? `${metaId} ${teaserId}` : metaId}
      onClick={event => onOpen(event, story.id)} data-received-story={story.id} data-lead={lead}>
      <span className={styles.rowText}>
        <span className={styles.rowMeta} id={metaId}>
          <span className={styles.rowNumber} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
          {story.category}
          {confidence && <span className={styles.confidence}>{confidence}</span>}
          {opened && <span className={styles.readMark}><Check size={12} aria-hidden="true" />열어봄</span>}
        </span>
        <strong id={titleId}>{story.title}</strong>
        {teaser && <span className={styles.teaser} id={teaserId}>{teaser}</span>}
      </span>
      <ChevronRight className={styles.rowArrow} size={20} aria-hidden="true" />
    </a>
  </li>;
}

function storyTeaser(story: Story) {
  const reading = composeReceivedReading(story);
  return [...reading.keyPoints, ...reading.explanation]
    .find(sentence => sentence.length <= 130 && !/^(복수의|여러) 기사에서.+확인된다[.!]?$/u.test(sentence));
}

function confirmationLabel(story: Story) {
  if (story.verificationStatus === "CONFLICTING") return "출처 내용 다름";
  if (story.verificationStatus === "SINGLE_SOURCE") return "원문 한 곳";
  if (story.verificationStatus === "DEVELOPING") return "추가 확인 중";
  return null;
}

function sourceLabel(story: Story) {
  const sources = story.sources.filter(source => safeNewsUrl(source.url));
  if (!sources.length) return "기사 내용 보기";
  return `${sources[0].publisher || "원문"}${sources.length > 1 ? ` 외 ${sources.length - 1}개 원문` : ""}`;
}

function ReceivedStory({ story, dateLabel, date, position, total, publicHref, canReport }: {
  story: Story; dateLabel: string; date?: string; position: number; total: number; publicHref: string; canReport: boolean;
}) {
  const { keyPoints, explanation, rest, background, impact, watch, cautions } = composeReceivedReading(story);
  const term = relatedGlossaryTerm(story);
  const confidence = confirmationLabel(story);
  const displayedCautions = cautions.length ? cautions : story.verificationStatus === "CONFLICTING"
    ? ["출처가 서로 다르게 전한 부분이 있어요. 아래 원문을 함께 확인해 주세요."] : [];
  const sources = story.sources.flatMap(source => {
    const href = safeNewsUrl(source.url);
    return href ? [{ href, publisher: source.publisher, publishedAt: source.publishedAt, primary: source.primarySource === true }] : [];
  });
  const contextTopics = [
    background.length ? "배경" : null,
    impact.length ? "중요한 이유" : null,
    watch.length ? "앞으로 확인할 점" : null,
  ].filter((topic): topic is string => topic !== null);
  const sourcesHeading = useRef<HTMLHeadingElement>(null);
  return <article id={`news-${story.id}`} tabIndex={-1} aria-labelledby={`received-headline-${story.id}`} className={styles.story}>
    <div className={styles.articleMeta}>
      <span><strong>{story.category}</strong><time dateTime={date}>{dateLabel}</time>{confidence && <span className={styles.confidence}>{confidence}</span>}</span>
      <span aria-label={`전체 ${total}건 중 ${position}번째`}>{position} / {total}</span>
    </div>
    <h1 id={`received-headline-${story.id}`}>{story.title}</h1>
    <div className={styles.articleByline}>
      {sources.length > 0 && <span>{sourceLabel(story)}</span>}
      {sources.length > 0 && <button className={styles.sourceJump} type="button" onClick={() => {
        sourcesHeading.current?.focus({ preventScroll: true });
        sourcesHeading.current?.scrollIntoView({ block: "start", behavior: "instant" });
      }}>원문 {sources.length}건 보기 <ArrowDown size={16} aria-hidden="true" /></button>}
    </div>
    {!!story.corrections?.length && <section className={styles.storySection}>
      <h2>바로잡은 내용</h2>
      {story.corrections.map((correction, index) => <p key={index}>{correction.reason} <time>{correction.correctedAt}</time></p>)}
    </section>}
    {!!explanation.length && <StorySection label="쉽게 풀어 보면" paragraphs={explanation} />}
    {!!keyPoints.length && <section className={styles.takeaway} aria-labelledby="received-takeaway">
      <h2 id="received-takeaway">핵심 내용</h2>
      {keyPoints.length === 1 ? <p>{keyPoints[0]}</p> : <ul>{keyPoints.map(point => <li key={point}>{point}</li>)}</ul>}
    </section>}
    {!!displayedCautions.length && <aside className={styles.caveat} aria-labelledby="received-caveat">
      <h2 id="received-caveat">확인할 점</h2>
      {displayedCautions.map(note => <p key={note}>{note}</p>)}
    </aside>}
    {term && <aside className={styles.glossary} aria-labelledby="received-term">
      <h2 id="received-term">낯선 말 하나만 짚고 갈게요 · {term.name}</h2>
      <p>{term.explanation}</p>
      <a href={term.url} target="_blank" rel="noopener noreferrer" className={styles.textAction}>
        {term.publisher} 설명 <ArrowUpRight size={14} aria-hidden="true" />
      </a>
    </aside>}
    {!!contextTopics.length && <details className={styles.moreContext} open>
      <summary>
        <span className={styles.contextSummaryText}>
          <strong>이 뉴스의 맥락</strong>
          <span>{contextTopics.join(" · ")}</span>
        </span>
        <span className={styles.contextControl}>
          <span className={styles.contextAction}>
            <span className={styles.contextCollapse}>접기</span>
            <span className={styles.contextExpand}>펼치기</span>
          </span>
          <ChevronDown size={20} aria-hidden="true" />
        </span>
      </summary>
      <div className={styles.contextBody}>
        <StorySection label="배경" paragraphs={background} />
        <StorySection label="중요한 이유" paragraphs={impact} />
        <StorySection label="앞으로 확인할 점" paragraphs={watch} />
      </div>
    </details>}
    <ReceivedPhoto story={story} />
    {!!rest.length && <StorySection label={explanation.length ? "이야기 이어 읽기" : "기사 내용을 살펴볼게요"} paragraphs={rest} />}
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
        <h2 id="received-sources" tabIndex={-1} ref={sourcesHeading}>원문과 출처</h2>
        <ul>{sources.map(({ href, publisher, publishedAt, primary }, index) => <li key={index}>
          <a className={styles.sourceLink} href={href} target="_blank" rel="noopener noreferrer">
            <span>{publisher || "원문 기사"}{primary && <small className={styles.sourceType}>1차 자료</small>}</span>
            <span className={styles.sourceMeta}><SourcePublication value={publishedAt} /><ArrowUpRight size={16} aria-hidden="true" /></span>
          </a>
        </li>)}</ul>
      </section>}
      <Link className={styles.textAction} href={publicHref} prefetch={false}>
        {canReport ? "공유·의견 남기기" : "기존 뉴스 화면에서 보기"} <ArrowRight size={15} aria-hidden="true" />
      </Link>
    </footer>
  </article>;
}

function SourcePublication({ value }: { value?: string }) {
  if (!value || !/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/u.test(value)) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  const text = new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
  return <time dateTime={value} aria-label={`원문 보도 ${text} (한국 시간)`}>{text}</time>;
}

function StorySection({ label, paragraphs }: { label: string; paragraphs: string[] }) {
  if (!paragraphs.length) return null;
  return <section className={styles.storySection}><h2>{label}</h2>
    {paragraphs.map(text => <p key={text}>{text}</p>)}
  </section>;
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

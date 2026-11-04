"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowUp, Check, Flag, RefreshCw, Share2, ThumbsDown, ThumbsUp } from 'lucide-react';
import type { Briefing, Story, StoryInterest } from '@/lib/briefing';
import { deviceHeaders } from '@/lib/device';
import { cachedLiveBriefing, distinctText, koreaToday, lastLiveBriefingKey, parseLiveBriefing, safeNewsUrl, storyLead, validEditionDate } from '@/lib/daily-letter';
import styles from './DailyBriefingLetter.module.css';

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
type LoadState = 'loading' | 'live' | 'cached' | 'empty' | 'error';
type FontSize = 'small' | 'normal' | 'large';

function stored(key: string): string | null { try { return localStorage.getItem(key); } catch { return null; } }
function store(key: string, value: string) { try { localStorage.setItem(key, value); } catch { /* Reading works without browser storage. */ } }
function headers() { try { return deviceHeaders(); } catch { return { 'Content-Type': 'application/json' }; } }

export function DailyBriefingLetter() {
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [font, setFont] = useState<FontSize>('normal');
  const [date, setDate] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [version, setVersion] = useState(0);
  const locationDate = useRef<string | null>(null);

  useEffect(() => {
    const initialize = () => {
      const requested = new URLSearchParams(location.search).get('date') ?? '';
      // Native contents/return anchors also emit popstate. They must not reset
      // a loaded edition when only the same document's fragment changed.
      if (locationDate.current === requested) return;
      locationDate.current = requested;
      setDate(requested);
      setLoadState('loading');
      setInitialized(true);
      const saved = stored('achim-gyeol-reader-font');
      if (saved === 'small' || saved === 'normal' || saved === 'large') setFont(saved);
    };
    const timer = window.setTimeout(initialize, 0);
    window.addEventListener('popstate', initialize);
    return () => { clearTimeout(timer); window.removeEventListener('popstate', initialize); };
  }, []);

  useEffect(() => {
    if (!initialized) return;
    let cancelled = false;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20000);
    async function load() {
      try {
        if (date && !validEditionDate(date)) throw new Error('Invalid date');
        const path = date ? `/api/briefings/${encodeURIComponent(date)}` : '/api/briefings/today';
        const response = await fetch(`${apiBase}${path}`, { signal: controller.signal, cache: 'no-store', headers: headers() });
        if (!response.ok) throw new Error('Edition unavailable');
        const data = parseLiveBriefing(await response.json());
        if (date && data.briefingDate !== date) throw new Error('Edition date mismatch');
        if (cancelled) return;
        setBriefing(data);
        setLoadState(data.stories.length ? 'live' : 'empty');
        if (!date && data.productionReady && data.stories.length) store(lastLiveBriefingKey, JSON.stringify(data));
      } catch {
        if (cancelled) return;
        const cached = !date ? cachedLiveBriefing(stored(lastLiveBriefingKey)) : null;
        setBriefing(cached);
        setLoadState(cached ? 'cached' : 'error');
      } finally { clearTimeout(timeout); }
    }
    void load();
    return () => { cancelled = true; clearTimeout(timeout); controller.abort(); };
  }, [date, initialized, version]);

  const chooseDate = (next: string) => {
    locationDate.current = next;
    setDate(next); setLoadState('loading'); setBriefing(null);
    history.pushState(null, '', `${location.pathname}${next ? `?date=${encodeURIComponent(next)}` : ''}`);
    window.scrollTo({ top: 0, behavior: 'auto' });
    if (next === date) setVersion(current => current + 1);
  };
  const retry = () => { setLoadState('loading'); setVersion(current => current + 1); };
  const reportingEnabled = loadState === 'live' && briefing?.productionReady === true && briefing.briefingDate === koreaToday();

  return <main className={`${styles.app} ${styles[font]}`}>
    <a className={styles.skip} href="#daily-letter">뉴스 본문으로 바로가기</a>
    <header className={styles.toolbar}>
      <Link href="/" className={styles.back}><ArrowLeft size={18} /> 아침결 홈</Link>
      <nav aria-label="뉴스 메뉴"><Link href="/archive">지난 뉴스</Link><Link href="/preferences">알림 설정</Link></nav>
    </header>
    <div className={styles.envelope}>
      <div><h1>{briefing ? `${briefing.dateLabel} 아침결` : '아침결 뉴스'}</h1><div className={styles.sender}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${basePath}/newsletter-prototypes/edition-icon.svg`} width={36} height={36} alt="" />
        <span><strong>아침결</strong><small>{briefing ? `${briefing.briefingDate ?? briefing.dateLabel} · 뉴스 ${briefing.stories.length}개` : '평일 아침, 한 번에 읽는 어제의 뉴스'}</small></span>
      </div></div>
      <div className={styles.fontControls} role="group" aria-label="글자 크기">
        {(['small', 'normal', 'large'] as const).map((size, index) => <button key={size} type="button" aria-label={['작은 글자', '기본 글자', '큰 글자'][index]} aria-pressed={font === size} onClick={() => { setFont(size); store('achim-gyeol-reader-font', size); }}>가</button>)}
      </div>
    </div>
    {loadState === 'loading' ? <section id="daily-letter" className={styles.state} role="status" aria-busy="true"><span className={styles.loadingLine} /><h2>아침 뉴스를 펼치고 있어요</h2><p>잠시만 기다려 주세요.</p></section> : loadState === 'error' || loadState === 'empty' ? <section id="daily-letter" className={styles.state} role="status"><h2>{loadState === 'empty' ? '아직 준비된 뉴스가 없어요' : '뉴스를 불러오지 못했어요'}</h2><p>{date ? `${date} 브리핑을 확인할 수 없어요. 날짜를 확인하거나 다시 시도해 주세요.` : '연결 상태를 확인하고 다시 시도해 주세요. 준비되지 않은 뉴스를 예시로 대신하지 않아요.'}</p><button type="button" onClick={retry}><RefreshCw size={16} /> 다시 불러오기</button><Link href="/archive">지난 뉴스 보기</Link>{date && <button type="button" onClick={() => chooseDate('')}>오늘 뉴스로</button>}</section> : briefing && <>
      {(loadState === 'cached' || briefing.briefingDate !== koreaToday() || !briefing.productionReady) && <aside className={styles.availability} role="status"><span>{loadState === 'cached' ? `연결이 원활하지 않아 이 기기에 저장된 ${briefing.dateLabel} 뉴스를 보여드려요.` : date || briefing.briefingDate !== koreaToday() ? `${briefing.dateLabel}에 발행한 뉴스입니다.` : '현재 준비된 뉴스를 먼저 전해요. 내용이 보완될 수 있어요.'}</span><button type="button" onClick={retry}><RefreshCw size={14} /> 새로 확인</button></aside>}
      <LetterContents key={briefing.id} briefing={briefing} reportingEnabled={reportingEnabled} />
    </>}
    <div className={styles.afterword}>
      <form className={styles.dateForm} onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const value = String(new FormData(event.currentTarget).get('edition-date') ?? ''); if (validEditionDate(value)) chooseDate(value); }}>
        <label htmlFor="edition-date">날짜별 뉴스</label><div><input key={date} id="edition-date" name="edition-date" type="date" required defaultValue={date} max={initialized ? koreaToday() : undefined} /><button type="submit">읽기</button></div>
      </form>
      <p>핵심은 짧게, 이해는 충분하게.<br />중요한 판단 전에는 함께 제공한 원문을 확인해 주세요.</p>
      <nav aria-label="서비스 안내"><Link href="/trust">서비스 원칙</Link><Link href="/privacy">개인정보처리방침</Link><Link href="/">홈으로</Link></nav>
    </div>
  </main>;
}

function LetterContents({ briefing, reportingEnabled }: { briefing: Briefing; reportingEnabled: boolean }) {
  const [read, setRead] = useState<number[]>([]);
  const readRef = useRef(new Set<number>());
  const [message, setMessage] = useState('');
  const markRead = useCallback((id: number) => {
    if (readRef.current.has(id)) return;
    readRef.current.add(id);
    const next = [...readRef.current];
    setRead(next); store(`achim-gyeol-read-${briefing.id}`, JSON.stringify(next));
    if (reportingEnabled) {
      void track('CARD_VIEW', briefing.id, id);
      if (next.length === briefing.stories.length) void track('COMPLETE', briefing.id);
    }
  }, [briefing.id, briefing.stories.length, reportingEnabled]);

  useEffect(() => {
    const timer = setTimeout(() => {
      try { const saved: unknown = JSON.parse(stored(`achim-gyeol-read-${briefing.id}`) ?? '[]'); if (Array.isArray(saved)) { const ids = saved.filter(id => briefing.stories.some(story => story.id === id)); readRef.current = new Set(ids); setRead(ids); } } catch { /* Invalid read history is not news. */ }
      if (reportingEnabled) void track('BRIEFING_OPEN', briefing.id);
      try {
        const target = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
        if (target) target.scrollIntoView();
      } catch { /* A malformed external fragment must not break reading. */ }
    }, 0);
    return () => clearTimeout(timer);
  }, [briefing.id, briefing.stories, reportingEnabled]);

  async function share(story: Story) {
    try {
      const url = new URL(`${basePath}/briefing/`, location.origin);
      if (briefing.briefingDate) url.searchParams.set('date', briefing.briefingDate);
      url.hash = `news-${story.id}`;
      if (navigator.share) await navigator.share({ title: story.title, url: url.href });
      else { await navigator.clipboard.writeText(url.href); setMessage('이 뉴스의 링크를 복사했어요.'); }
      if (reportingEnabled) void track('SHARE', briefing.id, story.id);
    } catch (error) { if (!(error instanceof DOMException && error.name === 'AbortError')) setMessage('링크를 공유하지 못했어요. 브라우저 주소를 복사해 주세요.'); }
  }

  return <article id="daily-letter" className={styles.paper} aria-label={`${briefing.dateLabel} 전체 뉴스`}>
    <header className={styles.masthead}><Link href="/briefing">아침결<span>.</span></Link><div><time dateTime={briefing.briefingDate}>{briefing.dateLabel}</time><small>{briefing.stories.length}개의 소식이 담긴 한 통</small></div></header>
    <div className={styles.greeting}><h2>좋은 아침이에요.</h2><p>중요한 소식은 짧게, 낯선 이야기는 쉽게 전해요.</p></div>
    <nav id="mail-contents" className={styles.contents} aria-label="이번 편의 전체 뉴스 목차" tabIndex={-1}>
      <h2>이번 편에 담았어요</h2><p>제목을 누르면 이 편 안에서 바로 읽을 수 있어요.</p>
      <ol>{briefing.stories.map(story => <li key={story.id}><a href={`#news-${story.id}`}><span>{story.category}</span><strong>{story.title}</strong>{read.includes(story.id) && <Check size={14} aria-label="읽음" />}</a></li>)}</ol>
    </nav>
    {briefing.stories.map((story, index) => <LetterStory key={story.id} story={story} position={index + 1} total={briefing.stories.length} reportingEnabled={reportingEnabled} onRead={markRead} onShare={() => void share(story)} />)}
    <footer className={styles.letterEnd}><strong>오늘의 이야기는 여기까지예요.</strong><p>다음 평일 아침에 새로운 소식으로 만나요.</p><a href="#mail-contents"><ArrowUp size={16} /> 목차로 돌아가기</a></footer>
    {message && <div role="status" className={styles.message}><span>{message}</span><button type="button" onClick={() => setMessage('')}>확인</button></div>}
  </article>;
}

function LetterStory({ story, position, total, reportingEnabled, onRead, onShare }: { story: Story; position: number; total: number; reportingEnabled: boolean; onRead: (id: number) => void; onShare: () => void }) {
  const ref = useRef<HTMLElement>(null);
  const [imageFailed, setImageFailed] = useState(false);
  const lead = storyLead(story);
  const image = safeNewsUrl(story.imageUrl);
  useEffect(() => {
    if (!ref.current || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) { onRead(story.id); observer.disconnect(); } }, { rootMargin: '0px 0px -30% 0px' });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [onRead, story.id]);
  return <section ref={ref} id={`news-${story.id}`} data-story-id={story.id} className={styles.story} tabIndex={-1} aria-labelledby={`headline-${story.id}`}>
    <div className={styles.storyMeta}><span>{story.category}</span><small>{String(position).padStart(2, '0')} / {String(total).padStart(2, '0')}</small></div>
    <h2 id={`headline-${story.id}`}>{story.title}</h2>
    <div className={styles.lead}><h3>핵심 요약</h3><p>{lead}</p></div>
    {image && !imageFailed && <figure className={styles.photo}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image} alt={`${story.title} 관련 기사 사진`} loading={position === 1 ? 'eager' : 'lazy'} decoding="async" referrerPolicy="no-referrer" onError={() => setImageFailed(true)} />
      <figcaption>{story.imagePublisher ? `사진 ${story.imagePublisher}` : '관련 원문 기사 사진'}</figcaption>
    </figure>}
    <section className={styles.explanation}><h3>쉽게 읽기</h3><p>{story.plainExplanation || story.summary}</p>{distinctText(story.summary, story.plainExplanation || story.summary, lead) && <p>{story.summary}</p>}</section>
    {story.backgroundContext && <aside className={styles.background}><h3>알고 읽으면 쉬워요</h3><p>{story.backgroundContext}</p></aside>}
    {story.whyItMatters && <section className={styles.importance}><h3>왜 중요한가요</h3><p>{story.whyItMatters}</p></section>}
    {story.whatToWatch && <section className={styles.context}><h3>앞으로 살펴볼 점</h3><p>{story.whatToWatch}</p></section>}
    {story.uncertainty && <aside className={styles.uncertainty}><h3>아직 확인이 필요한 부분</h3><p>{story.uncertainty}</p></aside>}
    {!!story.corrections?.length && <aside className={styles.uncertainty}><h3>바로잡은 내용</h3>{story.corrections.map((item, index) => <p key={index}>{item.reason} <time>{item.correctedAt}</time></p>)}</aside>}
    {!!story.claims?.length && <details className={styles.evidence}><summary>근거와 출처 더 보기</summary><ul>{story.claims.map((claim, index) => <li key={index}><p>{claim.statement}</p>{claim.sources.map((source, i) => safeNewsUrl(source.url) && <a key={i} href={safeNewsUrl(source.url)!} target="_blank" rel="noopener noreferrer">{source.publisher}</a>)}</li>)}</ul></details>}
    <footer className={styles.storyFooter}><div className={styles.sources}>{story.sources.map((source, index) => safeNewsUrl(source.url) && <a key={index} href={safeNewsUrl(source.url)!} target="_blank" rel="noopener noreferrer">원문 읽기 <span>({source.publisher})</span></a>)}</div><a className={styles.returnLink} href="#mail-contents">목차로 돌아가기</a></footer>
    <div className={styles.storyActions}><button type="button" onClick={onShare}><Share2 size={15} /> 공유</button>{reportingEnabled && <StoryFeedback storyId={story.id} />}</div>
    {reportingEnabled && <StoryInterest key={`${story.id}-${story.viewerInterest ?? 'none'}`} story={story} />}
  </section>;
}

function StoryInterest({ story }: { story: Story }) {
  const [selection, setSelection] = useState<StoryInterest | null>(story.viewerInterest ?? null);
  const [status, setStatus] = useState('idle');
  async function save(interest: StoryInterest) {
    const previous = selection; setSelection(interest); setStatus('saving');
    try { const response = await fetch(`${apiBase}/api/stories/${story.id}/interest`, { method: 'PUT', headers: headers(), body: JSON.stringify({ interest }) }); if (!response.ok) throw new Error(); setStatus('saved'); }
    catch { setSelection(previous); setStatus('error'); }
  }
  return <section className={styles.interest} aria-label="이 뉴스 관심도"><h3>이 주제가 흥미로웠나요?</h3><div><button type="button" aria-pressed={selection === 'INTERESTED'} disabled={status === 'saving'} onClick={() => void save('INTERESTED')}><ThumbsUp size={14} /> 흥미로웠어요</button><button type="button" aria-pressed={selection === 'NOT_INTERESTED'} disabled={status === 'saving'} onClick={() => void save('NOT_INTERESTED')}><ThumbsDown size={14} /> 관심 없어요</button></div><p role="status">{status === 'saved' ? '다음 브리핑의 순서에 반영했어요.' : status === 'error' ? '저장하지 못했어요. 다시 눌러 주세요.' : status === 'saving' ? '저장하고 있어요.' : '핵심 뉴스는 숨기지 않고 관심 분야를 조금 앞에 보여드려요.'}</p></section>;
}

function StoryFeedback({ storyId }: { storyId: number }) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState('');
  const [status, setStatus] = useState('idle');
  async function submit(event: FormEvent) {
    event.preventDefault(); if (!detail.trim()) return; setStatus('sending');
    try { const response = await fetch(`${apiBase}/api/stories/${storyId}/feedback`, { method: 'POST', headers: headers(), body: JSON.stringify({ type: 'INCORRECT', detail: detail.trim().slice(0, 600) }) }); if (!response.ok) throw new Error(); setStatus('sent'); }
    catch { setStatus('error'); }
  }
  if (status === 'sent') return <p role="status">신고를 접수했어요. 확인 후 필요한 내용을 바로잡겠습니다.</p>;
  return <div className={styles.feedback}>{!open ? <button type="button" onClick={() => setOpen(true)}><Flag size={15} /> 오류 알리기</button> : <form onSubmit={submit}><label htmlFor={`feedback-${storyId}`}>문제가 된 문장과 확인한 내용을 알려주세요.</label><textarea id={`feedback-${storyId}`} value={detail} onChange={event => setDetail(event.target.value)} maxLength={600} required /><div><button type="button" onClick={() => setOpen(false)}>취소</button><button type="submit" disabled={!detail.trim() || status === 'sending'}>{status === 'sending' ? '보내는 중' : '오류 신고'}</button></div>{status === 'error' && <p role="alert">접수하지 못했어요. 입력한 내용은 남아 있으니 다시 시도해 주세요.</p>}</form>}</div>;
}

async function track(type: string, editionId: number, storyId?: number) {
  try { await fetch(`${apiBase}/api/reader/events`, { method: 'POST', headers: headers(), keepalive: true, body: JSON.stringify({ type, editionId, storyId }) }); } catch { /* Analytics never blocks news. */ }
}

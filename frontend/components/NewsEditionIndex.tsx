"use client";

import { useMemo, useRef, useState, type MouseEventHandler } from 'react';
import { ArrowDown, ArrowRight, Check, ChevronRight, Search, X } from 'lucide-react';
import { briefingCategoryOrder, type Briefing, type Story } from '@/lib/briefing';
import { defaultEditionView, editionPageSize, editionSourceCount, filterEditionStories, safeNewsUrl, storyLead, type EditionView } from '@/lib/daily-letter';
import styles from './DailyBriefingLetter.module.css';

type IndexProps = {
  briefing: Briefing;
  view: EditionView;
  matches: Story[];
  read: ReadonlySet<number>;
  missingStory: boolean;
  onViewChange: (view: EditionView) => void;
  onStoryLink: MouseEventHandler<HTMLAnchorElement>;
};

const articleFragment = (story: Story) => `#news-${story.id}`;

export function NewsEditionIndex({ briefing, view, matches, read, missingStory, onViewChange, onStoryLink }: IndexProps) {
  const searchRef = useRef<HTMLInputElement>(null);
  const counts = useMemo(() => {
    const result = new Map<string, number>();
    for (const story of briefing.stories) result.set(story.category, (result.get(story.category) ?? 0) + 1);
    return result;
  }, [briefing.stories]);
  const categories = [...new Set<string>([...briefingCategoryOrder, ...counts.keys()])].filter(category => counts.has(category));
  const unfiltered = !view.category && !view.query.trim();
  const lead = unfiltered ? briefing.stories[0] : undefined;
  const visible = matches.slice(0, view.visible);
  const remaining = matches.length - visible.length;
  const update = (change: Partial<EditionView>) => onViewChange({ ...view, visible: editionPageSize, ...change });
  const clear = () => { onViewChange(defaultEditionView); searchRef.current?.focus(); };
  const showMore = () => {
    const firstNew = matches[view.visible];
    onViewChange({ ...view, visible: view.visible + editionPageSize });
    if (firstNew) window.requestAnimationFrame(() => document.getElementById('list-story-' + firstNew.id)?.focus());
  };

  return <>
    <header className={styles.editionHeader}>
      <div className={styles.editionHeading}>
        <p className={styles.kicker}><span aria-hidden="true" /> 아침결 브리핑</p>
        <h1>{briefing.dateLabel} 뉴스</h1>
        <p className={styles.editionMeta}><time dateTime={briefing.briefingDate}>{briefing.briefingDate ?? briefing.dateLabel}</time><span aria-hidden="true">·</span><strong>기사 {briefing.stories.length}건</strong><span aria-hidden="true">·</span><span>{counts.size}개 분야</span></p>
      </div>
      <div className={styles.search}>
        <Search size={18} aria-hidden="true" />
        <input ref={searchRef} type="search" value={view.query} onChange={event => update({ query: event.target.value })} aria-label="기사 검색" aria-controls="edition-results" placeholder="제목이나 키워드로 찾기" />
        {view.query && <button type="button" aria-label="검색어 지우기" onClick={() => { update({ query: '' }); searchRef.current?.focus(); }}><X size={17} aria-hidden="true" /></button>}
      </div>
    </header>
    <div className={styles.categories} role="group" aria-label="기사 분야">
      <button type="button" aria-pressed={!view.category} aria-controls="edition-results" onClick={() => update({ category: '' })}>전체</button>
      {categories.map(category => <button key={category} type="button" aria-pressed={view.category === category} aria-controls="edition-results" onClick={() => update({ category })}>{category}<span aria-hidden="true">{counts.get(category)}</span></button>)}
    </div>
    {missingStory && <p className={styles.missingStory} role="status">이 링크의 기사는 현재 편에서 찾을 수 없어요. 아래 목록에서 다시 찾아보세요.</p>}
    {lead && <EditionSpotlight lead={lead} stories={briefing.stories} onStoryLink={onStoryLink} />}
    <section id="mail-contents" tabIndex={-1} className={styles.contents} aria-labelledby="edition-list-title">
      <header className={styles.listHeader}>
        <div>
          <h2 id="edition-list-title">{view.category ? `${view.category} 기사` : '전체 기사'}</h2>
          <p role="status">{unfiltered ? `${matches.length}건` : `찾은 기사 ${matches.length}건`}{visible.length < matches.length && ` · ${visible.length}건 표시 중`}</p>
        </div>
        <select aria-label="기사 정렬" aria-controls="edition-results" value={view.order} onChange={event => update({ order: event.target.value === 'sources' ? 'sources' : 'edition' })}>
          <option value="edition">편집 순서</option>
          <option value="sources">출처 많은 순</option>
        </select>
      </header>
      {matches.length === 0 ? <div id="edition-results" className={styles.noResults}>
        <h3>조건에 맞는 기사가 없어요</h3><p>검색어를 바꾸거나 다른 분야를 골라보세요.</p>
        <button type="button" onClick={clear}>전체 기사 보기</button>
      </div> : <ul id="edition-results" className={styles.articleList}>
        {visible.map(story => <li key={story.id}>
          <a id={`list-story-${story.id}`} className={styles.listItem} href={articleFragment(story)} onClick={onStoryLink} data-list-story={story.id}>
            <div className={styles.listCopy}>
              <ArticleMeta story={story} isRead={read.has(story.id)} />
              <h3>{story.title}</h3>
              <p>{storyLead(story)}</p>
            </div>
            <NewsThumbnail story={story} />
            <ChevronRight className={styles.listArrow} size={17} aria-hidden="true" />
          </a>
        </li>)}
      </ul>}
      {remaining > 0 && <div className={styles.moreRow}>
        <button type="button" onClick={showMore}>
          기사 더 보기 <span>+{Math.min(remaining, editionPageSize)}건</span><ArrowDown size={16} aria-hidden="true" />
        </button>
      </div>}
    </section>
  </>;
}

function EditionSpotlight({ lead, stories, onStoryLink }: { lead: Story; stories: Story[]; onStoryLink: MouseEventHandler<HTMLAnchorElement> }) {
  const related = useMemo(() => {
    const rest = stories.filter(story => story.id !== lead.id);
    const manySources = filterEditionStories(rest, { query: '', category: '', order: 'sources' }).filter(story => editionSourceCount(story) >= 3);
    return { broad: manySources.length > 0, stories: (manySources.length ? manySources : rest).slice(0, 3) };
  }, [lead.id, stories]);
  return <section className={styles.spotlight} aria-label="이 편의 주요 뉴스">
    <article className={styles.feature}>
      <p className={styles.sectionLabel}><span aria-hidden="true" /> 주요 뉴스</p>
      <div className={styles.featureGrid}>
        <div className={styles.featureCopy}>
          <ArticleMeta story={lead} />
          <h2><a id={`feature-title-${lead.id}`} href={articleFragment(lead)} onClick={onStoryLink}>{lead.title}</a></h2>
          <p>{storyLead(lead)}</p>
          <div className={styles.featureActions}>
            <a id={`feature-read-${lead.id}`} className={styles.primaryLink} href={articleFragment(lead)} onClick={onStoryLink}>기사 읽기 <ArrowRight size={16} aria-hidden="true" /></a>
            <a className={styles.indexJump} href="#mail-contents">전체 기사 <ArrowDown size={15} aria-hidden="true" /></a>
          </div>
        </div>
        <NewsThumbnail story={lead} feature />
      </div>
    </article>
    {!!related.stories.length && <aside className={styles.related}>
      <h2>{related.broad ? '여러 곳에서 다룬 뉴스' : '함께 읽을 뉴스'}</h2>
      {related.broad && <p>연결된 서로 다른 출처 수 기준</p>}
      <ol>{related.stories.map((story, index) => <li key={story.id}>
        <a id={`related-story-${story.id}`} href={articleFragment(story)} onClick={onStoryLink}>
          <span className={styles.relatedNumber} aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
          <span className={styles.relatedCopy}><strong>{story.title}</strong><ArticleMeta story={story} /></span>
        </a>
      </li>)}</ol>
    </aside>}
  </section>;
}

function ArticleMeta({ story, isRead }: { story: Story; isRead?: boolean }) {
  const count = editionSourceCount(story);
  return <span className={styles.articleMeta}>
    <span>{story.category}</span>
    {count > 0 && <small>출처 {count}곳</small>}
    {isRead && <small className={styles.readMark}><Check size={13} aria-hidden="true" /> 읽음</small>}
  </span>;
}

function NewsThumbnail({ story, feature = false }: { story: Story; feature?: boolean }) {
  const href = safeNewsUrl(story.imageUrl);
  const [failed, setFailed] = useState<string | null>(null);
  if (!href || failed === href) return null;
  return <figure className={feature ? styles.featurePhoto : styles.thumbnail}>
    {/* The thumbnail repeats an adjacent title. The source photo is kept uncropped. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={href} alt={feature ? `${story.title} 관련 사진` : ''} loading={feature ? 'eager' : 'lazy'} fetchPriority={feature ? 'high' : undefined} decoding="async" referrerPolicy="no-referrer" onError={() => setFailed(href)} />
    {feature && story.imagePublisher && <figcaption>사진 {story.imagePublisher}</figcaption>}
  </figure>;
}

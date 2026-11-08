"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { ArrowDown, ArrowRight, ArrowUp, Bookmark, BookOpen, Check, ChevronRight, ExternalLink, Mail, Settings2, X } from "lucide-react";
import archive from "./archive-fixture.json";
import styles from "./ReaderPrototype.module.css";

type Story = (typeof archive)[number];
type Preferences = { saved: number[]; read: number[]; font: number };
const STORAGE_KEY = "achim-prototype-reader-v1";
const CHANGE_EVENT = "achim-prototype-change";
const defaults: Preferences = { saved: [], read: [], font: 16 };
const categories = ["전체", ...new Set(archive.map((story) => story.category))];

function scrollBehavior(): ScrollBehavior {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth";
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: scrollBehavior() });
}

function getStored() {
  try { return window.localStorage.getItem(STORAGE_KEY) ?? ""; } catch { return ""; }
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

function decode(raw: string): Preferences {
  try {
    const value = JSON.parse(raw);
    return {
      saved: Array.isArray(value?.saved) ? value.saved.filter((id: unknown) => archive.some((story) => story.id === id)) : [],
      read: Array.isArray(value?.read) ? value.read.filter((id: unknown) => archive.some((story) => story.id === id)) : [],
      font: [16, 18, 19].includes(value?.font) ? value.font : 16,
    };
  } catch { return defaults; }
}

function Picture({ story, priority = false }: { story: Story; priority?: boolean }) {
  const [failed, setFailed] = useState(false);
  if (failed || !story.imageUrl) return <p className={styles.imageUnavailable}>원문 이미지 연결 불가 · 기사 내용은 읽을 수 있어요</p>;
  return (
    <figure className={styles.figure}>
      <div className={styles.imageStage}>
        {/* Source images keep their full aspect ratio, including portrait photographs. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img ref={(node) => { if (node?.complete && node.naturalWidth === 0) setFailed(true); }} src={story.imageUrl} alt={`${story.title} — 원문 보도 사진`} loading={priority ? "eager" : "lazy"} decoding="async" referrerPolicy="no-referrer" onError={() => setFailed(true)} />
      </div>
      <figcaption>사진 · {story.imagePublisher || story.sources[0]?.publisher || "원문 출처"}</figcaption>
    </figure>
  );
}

export function ReaderPrototype() {
  const stored = useSyncExternalStore(subscribe, getStored, () => "");
  const preferences = decode(stored);
  const [volatile, setVolatile] = useState<Preferences | null>(null);
  const current = volatile ?? preferences;
  const [category, setCategory] = useState("전체");
  const [view, setView] = useState<"edition" | "saved">("edition");
  const [expanded, setExpanded] = useState(false);
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const storyDialog = useRef<HTMLDialogElement>(null);
  const settingsDialog = useRef<HTMLDialogElement>(null);
  const overview = useRef<HTMLDetailsElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const filtered = archive.filter((story) => (category === "전체" || story.category === category) && (view !== "saved" || current.saved.includes(story.id)));
  const dialogOpen = Boolean(activeStory || settingsOpen);

  function update(patch: Partial<Preferences>) {
    const next = { ...current, ...patch };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setVolatile(null);
      window.dispatchEvent(new Event(CHANGE_EVENT));
      return true;
    } catch {
      setVolatile(next);
      setNotice("브라우저 저장이 제한되어 이번 화면에서만 유지됩니다.");
      return false;
    }
  }

  function toggleSaved(story: Story) {
    const saved = current.saved.includes(story.id);
    const persisted = update({ saved: saved ? current.saved.filter((id) => id !== story.id) : [...current.saved, story.id] });
    if (persisted) setNotice(saved ? "저장한 기사에서 지웠어요." : "저장했어요. ‘저장한 기사’에서 다시 읽을 수 있어요.");
  }

  function openStory(story: Story, trigger: HTMLButtonElement) {
    returnFocus.current = trigger;
    setActiveStory(story);
    if (!current.read.includes(story.id)) update({ read: [...current.read, story.id] });
  }

  function switchView(next: "edition" | "saved") {
    setView(next);
    setCategory("전체");
    document.getElementById("prototype-articles")?.scrollIntoView({ behavior: scrollBehavior(), block: "start" });
  }

  useEffect(() => {
    if (overview.current && window.matchMedia("(max-width: 700px)").matches) overview.current.open = false;
  }, []);

  useEffect(() => {
    if (activeStory) storyDialog.current?.showModal();
    else storyDialog.current?.close();
  }, [activeStory]);

  useEffect(() => {
    if (settingsOpen) settingsDialog.current?.showModal();
    else settingsDialog.current?.close();
  }, [settingsOpen]);

  useEffect(() => {
    if (dialogOpen) {
      const style = document.body.style;
      const previous = style.getPropertyValue("overflow");
      const priority = style.getPropertyPriority("overflow");
      style.setProperty("overflow", "hidden");
      return () => { style.setProperty("overflow", previous, priority); };
    }
    const trigger = returnFocus.current;
    if (!trigger) return;
    // WebKit may not focus a clicked button. Restore the explicit opener
    // after the native dialog has finished its own close/focus handling.
    const frame = window.requestAnimationFrame(() => {
      if (trigger.isConnected) trigger.focus({ preventScroll: true });
      if (returnFocus.current === trigger) returnFocus.current = null;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [dialogOpen]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), 3500);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  function saveButton(story: Story) {
    const saved = current.saved.includes(story.id);
    return <button type="button" className={`${styles.iconButton} ${saved ? styles.isSaved : ""}`} aria-label={`${story.title} ${saved ? "저장 취소" : "저장"}`} aria-pressed={saved} onClick={() => toggleSaved(story)}><Bookmark size={19} fill={saved ? "currentColor" : "none"} /></button>;
  }

  const rootStyle = { "--reader-size": `${current.font}px` } as CSSProperties;

  return (
    <div className={styles.reader} style={rootStyle}>
      <a className={styles.skipLink} href="#prototype-articles">기사 목록으로 바로가기</a>
      <div className={styles.previewBar}><span className={styles.previewDot} />디자인 미리보기 <span className={styles.previewDivider}>/</span> 2026.09.16 보관 기사 <span className={styles.previewDesktop}>· 실제 발송 없음</span></div>
      <header className={styles.header} id="prototype-top">
        <a className={styles.brand} href="#prototype-top" aria-label="아침결 맨 위로"><span className={styles.brandMark}><Mail size={25} strokeWidth={1.7} /></span><strong>아침결<span className={styles.brandPeriod}>.</span></strong><span className={styles.brandTagline}>하루의 시작, 세상의 흐름</span></a>
        <div className={styles.headerActions}>
          <button type="button" className={styles.savedHeader} onClick={() => switchView(view === "saved" ? "edition" : "saved")} aria-pressed={view === "saved"}><Bookmark size={18} /><span>저장한 기사</span>{current.saved.length > 0 && <b>{current.saved.length}</b>}</button>
          <button type="button" className={styles.iconButton} aria-label="읽기 설정" onClick={(event) => { returnFocus.current = event.currentTarget; setSettingsOpen(true); }}><Settings2 size={21} /></button>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.intro} aria-labelledby="edition-title">
          <div className={styles.introCopy}>
            <div className={styles.editionLabel}><span>THE MORNING EDITION</span><span className={styles.editionDash} /><time dateTime="2026-09-16">2026. 09. 16 수요일</time></div>
            <h1 id="edition-title">세상을 읽는,<br /><span>가벼운 아침.</span></h1>
            <p>핵심은 짧게, 맥락은 충분하게.<span className={styles.introSecondary}> 궁금한 뉴스부터 천천히 읽어보세요.</span></p>
            <div className={styles.editionMeta}><span>9월 15일 보도 기반</span><i aria-hidden="true">·</i><span>보관 기사 {archive.length}개 미리보기</span></div>
          </div>
          <details ref={overview} className={styles.overview} open>
            <summary><span><BookOpen size={17} /> 먼저, 세 줄로 읽기</span><ArrowDown size={16} /></summary>
            <div className={styles.overviewList}>
              {[archive[0], archive[1], archive[2]].map((story, index) => <button key={story.id} type="button" onClick={(event) => openStory(story, event.currentTarget)}><span className={styles.overviewNumber}>0{index + 1}</span><span><small>{story.category}</small>{story.oneLineSummary || story.title}</span><ChevronRight size={17} /></button>)}
            </div>
          </details>
        </section>

        <section id="prototype-articles" className={styles.articlesSection} aria-labelledby="articles-title">
          <div className={styles.toolbar}>
            <nav className={styles.categories} aria-label="기사 분야">{categories.map((item) => <button type="button" key={item} aria-pressed={category === item} onClick={() => setCategory(item)}>{item}{item === "전체" && <span>{view === "saved" ? current.saved.length : archive.length}</span>}</button>)}</nav>
            <div className={styles.densityControl} role="group" aria-label="기사 설명 길이"><button type="button" aria-pressed={!expanded} onClick={() => setExpanded(false)}>핵심만</button><button type="button" aria-pressed={expanded} onClick={() => setExpanded(true)}>배경까지</button></div>
          </div>
          <div className={styles.sectionHeading}>
            <h2 id="articles-title">{view === "saved" ? "나중에, 다시 읽을 이야기" : category === "전체" ? "놓치지 말아야 할 이야기" : `${category} 이야기`} <span>{filtered.length}</span></h2>
            <span className={styles.readCount}>{current.read.length} / {archive.length} 읽음</span>
          </div>

          <div className={styles.contentLayout}>
            <div>
              {filtered.length === 0 ? <div className={styles.emptyState}><Bookmark size={32} strokeWidth={1.3} /><h3>마음에 남는 기사를 담아두세요</h3><p>기사의 책갈피를 누르면<br />이곳에서 편하게 다시 읽을 수 있어요.</p><button type="button" onClick={() => switchView("edition")}>전체 기사 둘러보기 <ArrowRight size={17} /></button></div> :
                <div className={styles.storyGrid}>
                  {filtered.map((story, index) => <article key={story.id} className={`${styles.storyCard} ${index === 0 ? styles.leadCard : ""}`} data-story-id={story.id}>
                    <div className={styles.cardImage}><Picture story={story} priority={index === 0} /></div>
                    <div className={styles.cardBody}>
                      <div className={styles.storyKicker}><span>{index === 0 && category === "전체" && view !== "saved" ? "먼저 읽는 뉴스" : story.category}</span>{index === 0 && <span className={styles.categoryMuted}>{story.category}</span>}{current.read.includes(story.id) && <span className={styles.readBadge}><Check size={12} />읽음</span>}{saveButton(story)}</div>
                      <h3><button type="button" onClick={(event) => openStory(story, event.currentTarget)}>{story.title}</button></h3>
                      <p className={styles.storySummary}>{story.plainExplanation?.split(/(?<=\.)\s/)[0] || story.oneLineSummary || story.summary.split(". ")[0]}</p>
                      {expanded && story.backgroundContext && <div className={styles.inlineContext}><h4>알고 읽으면 쉬워요</h4><p>{story.backgroundContext}</p></div>}
                      <div className={styles.cardFooter}><span>{story.sources[0]?.publisher}<i aria-hidden="true">·</i>출처 {story.sources.length}곳</span><button type="button" onClick={(event) => openStory(story, event.currentTarget)} aria-label={`${story.title} 기사 읽기`}>기사 읽기 <ArrowRight size={17} /></button></div>
                    </div>
                  </article>)}
                </div>
              }
              <div className={styles.editionEnd}><span className={styles.endMark}><Mail size={21} /></span><h3>오늘을 바라보는 시선에,<br />작은 도움이 되었길.</h3><p>이 화면은 보관 기사로 구성한 디자인 미리보기예요.<br />실제 서비스에는 적용되지 않았습니다.</p><button type="button" onClick={scrollToTop}>처음으로 <ArrowUp size={15} /></button></div>
            </div>

            <aside className={styles.sidebar} aria-label="읽기 안내">
              <div className={styles.sidebarInner}>
                <div className={styles.railHeading}><span>이번 브리핑</span><span>06 STORIES</span></div>
                <div className={styles.toc}>{archive.map((story, index) => <button type="button" key={story.id} onClick={(event) => openStory(story, event.currentTarget)}><span className={styles.tocIndex}>{current.read.includes(story.id) ? <Check size={15} /> : `0${index + 1}`}</span><span><small>{story.category}</small>{story.title}</span><ChevronRight size={14} /></button>)}</div>
                <div className={styles.readingNote}><BookOpen size={21} strokeWidth={1.5} /><h3>모르는 이야기여도 괜찮아요.</h3><p>기사를 열면 배경부터 차근차근.<br />낯선 용어도 함께 풀어드립니다.</p><button type="button" onClick={() => { setExpanded(!expanded); }}>{expanded ? "핵심만 읽기로 돌아가기" : "배경 설명 펼쳐보기"}<ArrowRight size={15} /></button></div>
                <p className={styles.archiveNote}>보관 브리핑 중 일부를 선택했습니다.<br />기사 내용은 디자인 검토용이며,<br />현재 시점의 최신 뉴스가 아닙니다.</p>
              </div>
            </aside>
          </div>
        </section>
      </main>

      <footer className={styles.footer}><span>아침결<span className={styles.brandPeriod}>.</span></span><p>당신의 아침에, 필요한 이야기만.</p><small>READER DESIGN PREVIEW</small></footer>
      <nav className={styles.mobileNav} aria-label="읽기 메뉴"><button type="button" aria-pressed={view === "edition"} onClick={() => switchView("edition")}><BookOpen size={20} />브리핑</button><button type="button" aria-pressed={view === "saved"} onClick={() => switchView("saved")}><Bookmark size={20} />저장한 기사{current.saved.length > 0 && <b>{current.saved.length}</b>}</button><button type="button" onClick={scrollToTop}><ArrowUp size={20} />맨 위로</button></nav>
      <div className={styles.toast} role="status" aria-live="polite">{notice && <span><Check size={17} />{notice}</span>}</div>

      <dialog ref={storyDialog} className={styles.articleDialog} aria-labelledby="story-dialog-title" onCancel={() => setActiveStory(null)} onClose={() => setActiveStory(null)} onClick={(event) => { if (event.target === event.currentTarget) setActiveStory(null); }}>
        {activeStory && <div className={styles.detailSurface}>
          <div className={styles.dialogBar}><span><Mail size={19} />아침결 <small>한 걸음 더 깊이</small></span><div>{saveButton(activeStory)}<button type="button" className={styles.iconButton} aria-label="기사 닫기" onClick={() => setActiveStory(null)}><X size={23} /></button></div></div>
          <div className={styles.detailContent}>
            <div className={styles.detailKicker}>{activeStory.category}<span>2026.09.16 보관 브리핑</span></div>
            <h2 id="story-dialog-title" tabIndex={-1} autoFocus>{activeStory.title}</h2>
            <p className={styles.detailDeck}>{activeStory.oneLineSummary}</p>
            <Picture story={activeStory} priority />
            <section className={styles.detailSection}><h3><span>01</span>어떤 일이 있었나요?</h3><p>{activeStory.summary}</p></section>
            {activeStory.backgroundContext && <section className={`${styles.detailSection} ${styles.detailContext}`}><h3><BookOpen size={20} />알고 읽으면 쉬워요</h3><p>{activeStory.backgroundContext}</p></section>}
            <section className={styles.detailSection}><h3><span>02</span>왜 중요한가요?</h3><p>{activeStory.whyItMatters}</p></section>
            {activeStory.uncertainty && <p className={styles.uncertainty}>더 확인할 점 · {activeStory.uncertainty}</p>}
            <section className={styles.sources}><h3>원문으로 더 읽기 <span>{activeStory.sources.length}곳</span></h3><p>아래 링크는 해당 보관 브리핑에 연결된 원문입니다.</p><div>{activeStory.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer">{source.publisher}<ExternalLink size={14} /><span className={styles.srOnly}> 새 탭에서 열기</span></a>)}</div></section>
            <button type="button" className={styles.finishButton} onClick={() => setActiveStory(null)}><Check size={18} />다 읽었어요, 브리핑으로</button>
          </div>
        </div>}
      </dialog>

      <dialog ref={settingsDialog} className={styles.settingsDialog} aria-labelledby="reading-settings-title" onCancel={() => setSettingsOpen(false)} onClose={() => setSettingsOpen(false)}>
        <div className={styles.settingsHeading}><h2 id="reading-settings-title">편안하게 읽기</h2><button type="button" className={styles.iconButton} aria-label="읽기 설정 닫기" onClick={() => setSettingsOpen(false)}><X size={22} /></button></div>
        <p>당신의 눈에 맞춰보세요.<br />이 설정은 이 브라우저의 미리보기에만 적용돼요.</p>
        <fieldset><legend>본문 글자 크기</legend><div className={styles.fontOptions}>{[{ label: "기본", value: 16 }, { label: "크게", value: 18 }, { label: "더 크게", value: 19 }].map((option) => <button type="button" key={option.value} aria-pressed={current.font === option.value} onClick={() => update({ font: option.value })}><b style={{ fontSize: option.value + 4 }}>가</b>{option.label}</button>)}</div></fieldset>
        <div className={styles.fontPreview}>바쁜 아침에도, 세상의 흐름은 놓치지 않도록.</div>
        <button type="button" className={styles.finishButton} onClick={() => setSettingsOpen(false)}>이렇게 읽을게요 <Check size={18} /></button>
      </dialog>
    </div>
  );
}

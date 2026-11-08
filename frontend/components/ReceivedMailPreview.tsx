"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { ArrowRight, Download } from "lucide-react";
import type { Briefing } from "@/lib/briefing";
import { validEditionDate } from "@/lib/daily-letter";
import { createBriefingEml, createEmailHtml } from "@/lib/email-template";
import { useReceivedEdition } from "@/lib/use-received-edition";
import { ReceivedEditionStatus } from "./ReceivedBriefing";
import styles from "./ReceivedBriefing.module.css";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function ReceivedMailPreview() {
  const { date, result, retry } = useReceivedEdition(true);
  const edition = result.data;
  const validDate = edition?.briefingDate && validEditionDate(edition.briefingDate) ? edition.briefingDate : null;
  return <main className={styles.surface}>
    <div className={styles.previewWrap}>
      <header className={styles.previewHeader}>
        <h1>메일 디자인 미리보기</h1>
        <p>받은편지함에서 볼 디자인이에요. 실제로 발송한 메일은 아니에요.</p>
      </header>
      {result.state === "ready" && edition && validDate ? <MailPreview key={edition.id} briefing={edition} date={validDate} />
        : <ReceivedEditionStatus state={result.state === "ready" ? "empty" : result.state} date={date} onRetry={retry} heading="h2" />}
    </div>
  </main>;
}

function MailPreview({ briefing, date }: { briefing: Briefing; date: string }) {
  // This child only mounts once the client has fetched a dated edition.
  const serviceUrl = `${window.location.origin}${basePath}/`;
  const html = useMemo(() => createEmailHtml(briefing, serviceUrl), [briefing, serviceUrl]);
  const frame = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = frame.current;
    if (!iframe) return;
    let observer: ResizeObserver | undefined;
    const fit = () => {
      observer?.disconnect();
      const body = iframe.contentDocument?.body;
      if (!body || iframe.contentDocument?.URL !== "about:srcdoc") return;
      const resize = () => { iframe.style.height = `${Math.ceil(body.getBoundingClientRect().height)}px`; };
      resize();
      observer = new ResizeObserver(resize);
      observer.observe(body);
    };
    iframe.addEventListener("load", fit);
    fit();
    return () => { observer?.disconnect(); iframe.removeEventListener("load", fit); };
  }, [html]);

  function downloadMail() {
    const url = URL.createObjectURL(new Blob([createBriefingEml(briefing, serviceUrl)], { type: "message/rfc822" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `achim-gyeol-${date}-preview.eml`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
  }

  return <>
    <div className={`${styles.previewHeader} ${styles.previewButtons}`}>
      <div className={styles.previewActions}>
        <Link href={`/briefing/delivery/?date=${date}`} className={styles.textAction} prefetch={false}>받은 뉴스 열기 <ArrowRight size={16} aria-hidden="true" /></Link>
        <button type="button" className={styles.action} onClick={downloadMail}><Download size={16} aria-hidden="true" /> 메일 파일 받기</button>
      </div>
    </div>
    {/* Generated HTML escapes all news text and contains only same-site edition links.
        Allow native link navigation in WebKit, but not scripts, forms or popups. */}
    <iframe ref={frame} title="아침결 이메일 본문 시안" className={styles.mailFrame} srcDoc={html}
      sandbox="allow-same-origin allow-top-navigation" referrerPolicy="no-referrer" />
  </>;
}

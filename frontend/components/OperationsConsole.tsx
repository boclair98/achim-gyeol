"use client";

import { useMemo, useState } from "react";
import { Activity, AlertTriangle, BarChart3, Check, FileCheck2, History, LockKeyhole, PauseCircle, RefreshCw, Save, Send, ShieldCheck, Smartphone, X } from "lucide-react";

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
type EditorialState = "AUTO_APPROVED" | "REVIEW" | "APPROVED" | "HELD" | "PUBLISHED";
type QueueStory = { id: number; order: number; category: string; title: string; oneLineSummary?: string; summary: string; whyItMatters: string; whatToWatch?: string; uncertainty?: string; verificationStatus: string; qualityScore: number; editorialState: EditorialState; claims: number; sources: number };
type Queue = { editionId: number; briefingDate: string; state: EditorialState; approvedAt?: string; stories: QueueStory[] };
type Metrics = { activeSubscriptions: number; uniqueReaders30d: number; opens30d: number; completed30d: number; sourceOpens30d: number; shares30d: number; recentDelivered: number; recentFailed: number };
type Audit = { id: number; action: string; targetType?: string; targetId?: number; actor: string; detail?: string; createdAt: string };
type Delivery = { id: number; editionId: number; subscriptionId: number; state: string; attempts: number; lastAttemptAt?: string; deliveredAt?: string; error?: string };
type BuildStatus = { date?: string; coverageReady: boolean; productionReady: boolean; stories: number; categories: number; minimumStories: number; minimumCategories: number; blockReasons: string[]; generationJob: { state: string; result?: { collectedArticles: number; candidateClusters: number; rejectedCandidates: number; categoryCounts: Record<string, number>; deliveryReady: boolean } } };

export function OperationsConsole() {
  const [token, setToken] = useState(() => typeof window === "undefined" ? "" : window.sessionStorage.getItem("achim-gyeol-admin-token") ?? "");
  const [actor, setActor] = useState("운영자");
  const [queue, setQueue] = useState<Queue | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [buildStatus, setBuildStatus] = useState<BuildStatus | null>(null);
  const [selected, setSelected] = useState<QueueStory | null>(null);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const headers = useMemo(() => ({ "Content-Type": "application/json", "X-Briefing-Admin-Token": token }), [token]);

  const request = async <T,>(path: string, init?: RequestInit): Promise<T> => {
    const response = await fetch(`${apiBase}${path}`, { cache: "no-store", ...init, headers: { ...headers, ...(init?.headers ?? {}) } });
    if (!response.ok) throw new Error(response.status === 403 ? "관리자 토큰이 올바르지 않습니다." : `운영 API 오류 (${response.status})`);
    return response.status === 204 ? (undefined as T) : response.json();
  };

  const refresh = async () => {
    if (!token) { setNotice("운영 서버에 설정한 BRIEFING_ADMIN_TOKEN을 입력해 주세요."); return; }
    setBusy(true);
    try {
      window.sessionStorage.setItem("achim-gyeol-admin-token", token);
      const [nextQueue, nextMetrics, nextAudits, nextDeliveries, nextBuildStatus] = await Promise.all([
        request<Queue>("/api/admin/editorial/queue"), request<Metrics>("/api/admin/editorial/metrics"),
        request<Audit[]>("/api/admin/editorial/audits"), request<Delivery[]>("/api/admin/editorial/deliveries"),
        request<BuildStatus>("/api/admin/briefings/status"),
      ]);
      setQueue(nextQueue); setMetrics(nextMetrics); setAudits(nextAudits); setDeliveries(nextDeliveries); setBuildStatus(nextBuildStatus); setNotice("운영 DB의 최신 상태를 불러왔습니다.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "운영 상태를 불러오지 못했습니다."); }
    finally { setBusy(false); }
  };

  const updateStory = async (story: QueueStory, state?: EditorialState) => {
    setBusy(true);
    try {
      await request(`/api/admin/editorial/stories/${story.id}`, { method: "PATCH", body: JSON.stringify({ actor, update: { title: story.title, oneLineSummary: story.oneLineSummary, summary: story.summary, whyItMatters: story.whyItMatters, whatToWatch: story.whatToWatch ?? "", uncertainty: story.uncertainty ?? "", state } }) });
      setSelected(null); await refresh();
    } catch (error) { setNotice(error instanceof Error ? error.message : "뉴스 상태를 저장하지 못했습니다."); setBusy(false); }
  };

  const editionAction = async (action: "approve" | "hold") => {
    if (!queue) return;
    const reason = action === "hold" ? window.prompt("보류 이유를 입력해 주세요.") : "사람 검수 완료";
    if (reason === null) return;
    setBusy(true);
    try { await request(`/api/admin/editorial/editions/${queue.editionId}/${action}`, { method: "POST", body: JSON.stringify({ actor, reason }) }); await refresh(); }
    catch (error) { setNotice(error instanceof Error ? error.message : "발행 상태를 변경하지 못했습니다."); setBusy(false); }
  };

  const publishCorrection = async (story: QueueStory) => {
    const afterText = window.prompt("독자 화면에 반영할 정정된 요약을 입력해 주세요.", story.summary);
    if (!afterText || afterText === story.summary) return;
    const reason = window.prompt("정정 이유를 입력해 주세요.");
    if (!reason) return;
    setBusy(true);
    try { await request(`/api/admin/editorial/stories/${story.id}/corrections`, { method: "POST", body: JSON.stringify({ actor, afterText, reason }) }); setSelected(null); await refresh(); }
    catch (error) { setNotice(error instanceof Error ? error.message : "정정을 반영하지 못했습니다."); setBusy(false); }
  };

  const runPipeline = async (path: "generate" | "dispatch") => {
    setBusy(true);
    try { await request(`/api/admin/briefings/${path}`, { method: "POST" }); setNotice(path === "generate" ? "뉴스 생성 작업을 시작했습니다." : "현재 시각 기준 발송 검사를 실행했습니다."); window.setTimeout(() => void refresh(), 1600); }
    catch (error) { setNotice(error instanceof Error ? error.message : "작업을 시작하지 못했습니다."); setBusy(false); }
  };

  const retryFailed = async () => {
    if (!queue || !window.confirm("실패한 기기에만 브리핑을 다시 보낼까요? 이미 성공한 기기에는 중복 발송되지 않습니다.")) return;
    setBusy(true);
    try { await request(`/api/admin/briefings/retry-failed/${queue.editionId}`, { method: "POST" }); setNotice("실패한 발송만 재시도했습니다."); await refresh(); }
    catch (error) { setNotice(error instanceof Error ? error.message : "재전송하지 못했습니다."); setBusy(false); }
  };

  return <>
    <section className="studio-hero ops-hero"><div><span className="studio-kicker"><i /> LIVE OPERATIONS</span><h1>뉴스 품질부터 발송까지<br /><em>실제 운영 데이터로 관리합니다.</em></h1><p>이 화면은 더 이상 시연 데이터가 아닙니다. 관리자 토큰을 가진 운영자만 검수·승인·보류·생성·발송 상태를 조회하고 변경할 수 있습니다.</p></div><aside className="ops-login"><LockKeyhole /><label>관리자 토큰<input type="password" value={token} onChange={(event) => setToken(event.target.value)} placeholder="BRIEFING_ADMIN_TOKEN" /></label><label>작업자 이름<input value={actor} maxLength={80} onChange={(event) => setActor(event.target.value)} /></label><button className="studio-primary" onClick={() => void refresh()} disabled={busy}><RefreshCw size={15} /> 운영 상태 연결</button></aside></section>

    {queue && metrics ? <section className="ops-console">
      <header className="ops-console-head"><div><span>{queue.briefingDate}</span><h2>오늘 브리핑 운영실</h2><p>에디션 상태 <b>{queue.state}</b> · 뉴스 {buildStatus?.stories ?? queue.stories.length}/{buildStatus?.minimumStories ?? "-"}건 · 분야 {buildStatus?.categories ?? new Set(queue.stories.map((story) => story.category)).size}/{buildStatus?.minimumCategories ?? "-"}개</p>{buildStatus && !buildStatus.productionReady && <p className="ops-coverage-warning"><AlertTriangle size={14} /> 정규 발송 보류 · {buildStatus.blockReasons.join(" · ")}</p>}</div><div><button className="studio-secondary" onClick={() => void runPipeline("generate")} disabled={busy}><RefreshCw size={14} /> 다시 생성</button><button className="studio-secondary" onClick={() => void editionAction("hold")} disabled={busy}><PauseCircle size={14} /> 발행 보류</button><button className="studio-primary" onClick={() => void editionAction("approve")} disabled={busy || buildStatus?.coverageReady === false}><ShieldCheck size={14} /> 최종 승인</button><button className="studio-primary" onClick={() => void runPipeline("dispatch")} disabled={busy || buildStatus?.productionReady === false}><Send size={14} /> 발송 검사</button><button className="studio-secondary" onClick={() => void retryFailed()} disabled={busy || metrics.recentFailed === 0}><RefreshCw size={14} /> 실패 재전송</button></div></header>
      <div className="ops-metrics">{[
        ["활성 기기", metrics.activeSubscriptions, Smartphone], ["30일 독자", metrics.uniqueReaders30d, Activity], ["브리핑 열람", metrics.opens30d, BarChart3], ["완독", metrics.completed30d, Check], ["원문 이동", metrics.sourceOpens30d, FileCheck2], ["최근 발송", `${metrics.recentDelivered}/${metrics.recentFailed}`, Send],
      ].map(([label, value, Icon]) => { const MetricIcon = Icon as typeof Activity; return <article key={String(label)}><MetricIcon /><span>{String(label)}</span><strong>{String(value)}</strong></article>; })}</div>

      <div className="ops-grid"><section className="ops-queue"><header><span>번호</span><span>발행 후보</span><span>근거</span><span>상태</span></header>{queue.stories.map((story) => <article key={story.id}><b>{String(story.order).padStart(2, "0")}</b><button onClick={() => setSelected(story)}><small>{story.category} · 품질 {story.qualityScore}</small><strong>{story.title}</strong><p>{story.oneLineSummary}</p></button><span>{story.claims}문장<br />{story.sources}출처</span><em className={story.editorialState.toLowerCase()}>{story.editorialState}</em></article>)}</section><aside className="ops-side"><section><header><History /><strong>감사 로그</strong></header>{audits.slice(0, 8).map((item) => <p key={item.id}><time>{new Date(item.createdAt).toLocaleString("ko-KR")}</time><b>{item.action}</b><span>{item.actor}</span></p>)}</section><section><header><Send /><strong>최근 발송 시도</strong></header>{deliveries.slice(0, 8).map((item) => <p key={item.id}><time>에디션 {item.editionId}</time><b>{item.state} · {item.attempts}회</b><span>{item.error || item.deliveredAt || "대기"}</span></p>)}</section></aside></div>
    </section> : <section className="ops-locked"><LockKeyhole /><h2>운영 데이터는 공개하지 않습니다</h2><p>위에서 운영 서버의 관리자 토큰을 입력하면 실제 활성 기기·뉴스 후보·발송 결과가 표시됩니다.</p></section>}

    {selected && <div className="evidence-overlay"><section className="evidence-drawer ops-editor"><header><div><span>LIVE STORY REVIEW</span><h2>뉴스 검수</h2></div><button onClick={() => setSelected(null)}><X /></button></header><label>제목<input value={selected.title} onChange={(event) => setSelected({ ...selected, title: event.target.value })} /></label><label>한 줄 결론<textarea rows={2} value={selected.oneLineSummary ?? ""} onChange={(event) => setSelected({ ...selected, oneLineSummary: event.target.value })} /></label><label>요약<textarea rows={6} value={selected.summary} onChange={(event) => setSelected({ ...selected, summary: event.target.value })} /></label><label>왜 중요한가<textarea rows={4} value={selected.whyItMatters} onChange={(event) => setSelected({ ...selected, whyItMatters: event.target.value })} /></label><label>다음 확인 포인트<textarea rows={3} value={selected.whatToWatch ?? ""} onChange={(event) => setSelected({ ...selected, whatToWatch: event.target.value })} /></label><label>불확실성<textarea rows={3} value={selected.uncertainty ?? ""} onChange={(event) => setSelected({ ...selected, uncertainty: event.target.value })} /></label><div className="ops-editor-actions"><button className="studio-secondary" onClick={() => void publishCorrection(selected)}><History size={14} /> 정정 발행</button><button className="studio-secondary" onClick={() => void updateStory(selected, "HELD")}><PauseCircle size={14} /> 보류</button><button className="studio-secondary" onClick={() => void updateStory(selected, "REVIEW")}><AlertTriangle size={14} /> 재검토</button><button className="studio-primary" onClick={() => void updateStory(selected, "APPROVED")}><Save size={14} /> 저장·승인</button></div></section></div>}
    {notice && <div className="notice"><span>{notice}</span><button onClick={() => setNotice("")}>확인</button></div>}
  </>;
}

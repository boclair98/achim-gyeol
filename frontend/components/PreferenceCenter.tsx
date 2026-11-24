"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { BellRing, BookOpen, Check, Clock3, Download, KeyRound, RotateCcw, ShieldCheck, SlidersHorizontal, Sparkles, Trash2, Users } from "lucide-react";
import { defaultReaderPreferences, type ReaderPreferences } from "@/lib/experience";
import { deviceHeaders } from "@/lib/device";

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
const categories = ["정책", "경제", "금융", "사회", "국제", "테크", "생활", "문화", "스포츠", "e스포츠"];
const discoveryFeatures = [
  { key: "deep_briefing", icon: BookOpen, title: "심화 브리핑·주간 리포트", description: "한 주의 흐름과 배경까지 이어서 보기" },
  { key: "custom_topics", icon: KeyRound, title: "내가 고른 주제·키워드", description: "관심 키워드의 변화를 따로 모아 보기" },
  { key: "team_digest", icon: Users, title: "팀·가족과 함께 보기", description: "같은 브리핑을 공유하고 읽은 흐름 확인" },
] as const;
type DiscoveryFeatureKey = (typeof discoveryFeatures)[number]["key"];
const discoveryFeatureKeys = new Set<DiscoveryFeatureKey>(discoveryFeatures.map(({ key }) => key));
const preferenceKey = "achim-gyeol-reader-preferences";
const interestKey = "achim-gyeol-feature-interest";
const digestSizes = new Set(["compact", "standard", "deep"]);
const storageUnavailable = "이 브라우저 저장소를 사용할 수 없어 기기 설정에 연결하지 못했어요. 저장소를 허용한 뒤 다시 시도해 주세요.";

function normalizePreferences(value: unknown): ReaderPreferences {
  const stored = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return {
    categories: Array.isArray(stored.categories) ? [...new Set(stored.categories.filter((category): category is string => typeof category === "string" && categories.includes(category)))] : [...defaultReaderPreferences.categories],
    deliveryTime: "07:30",
    digestSize: typeof stored.digestSize === "string" && digestSizes.has(stored.digestSize) ? stored.digestSize as ReaderPreferences["digestSize"] : defaultReaderPreferences.digestSize,
    channels: Array.isArray(stored.channels) ? stored.channels.filter((channel): channel is string => typeof channel === "string" && defaultReaderPreferences.channels.includes(channel)) : [...defaultReaderPreferences.channels],
    consent: typeof stored.consent === "boolean" ? stored.consent : defaultReaderPreferences.consent,
  };
}

function serverPreferences(value: unknown): Pick<ReaderPreferences, "categories" | "digestSize" | "consent"> {
  if (!value || typeof value !== "object") throw new Error("Invalid preferences");
  const server = value as Record<string, unknown>;
  if (typeof server.categories !== "string" || typeof server.digestSize !== "string" || !digestSizes.has(server.digestSize) || typeof server.consent !== "boolean") throw new Error("Invalid preferences");
  const normalized = normalizePreferences({ ...server, categories: server.categories.split(",").filter(Boolean) });
  return { categories: normalized.categories, digestSize: normalized.digestSize, consent: normalized.consent };
}

function storeLocally(key: string, value: unknown): boolean {
  try { window.localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch { return false; }
}

class RequestDeadlineError extends Error {}

// Aborting limits the browser's wait; it does not prove a write was rolled
// back on the server. Mutation callers therefore keep timeout outcomes unknown.
async function requestWithinDeadline<T>(operation: (signal: AbortSignal) => Promise<T>, requests: Set<AbortController>, parentSignal?: AbortSignal): Promise<T> {
  const controller = new AbortController();
  let timedOut = false;
  const abort = () => controller.abort();
  requests.add(controller);
  if (parentSignal?.aborted) controller.abort();
  else parentSignal?.addEventListener("abort", abort, { once: true });
  const timer = window.setTimeout(() => { timedOut = true; controller.abort(); }, 15_000);
  try { return await operation(controller.signal); }
  catch (error) {
    if (timedOut) throw new RequestDeadlineError("Request deadline exceeded");
    throw error;
  } finally {
    window.clearTimeout(timer);
    parentSignal?.removeEventListener("abort", abort);
    requests.delete(controller);
  }
}

export function PreferenceCenter() {
  const [preferences, setPreferences] = useState<ReaderPreferences>(defaultReaderPreferences);
  const [notice, setNotice] = useState("");
  const [privacyBusy, setPrivacyBusy] = useState(false);
  const [featureVotes, setFeatureVotes] = useState<DiscoveryFeatureKey[]>([]);
  const [interestBusy, setInterestBusy] = useState(false);
  const [interestNotice, setInterestNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadNotice, setLoadNotice] = useState("");
  const [loadingPreferences, setLoadingPreferences] = useState(true);
  const [reload, setReload] = useState(0);
  const edited = useRef(0);
  const featureEdited = useRef(false);
  const mutationLock = useRef(false);
  const knownHeaders = useRef<Record<string, string> | null>(null);
  const activeRequests = useRef(new Set<AbortController>());

  useEffect(() => {
    const requests = activeRequests.current;
    return () => { for (const request of requests) request.abort(); };
  }, []);

  // Reuse only an identity resolved by the existing device helper. Never
  // silently substitute a different subscription when storage is unavailable.
  const requestHeaders = useCallback(() => {
    if (knownHeaders.current) return knownHeaders.current;
    try {
      knownHeaders.current = deviceHeaders();
      return knownHeaders.current;
    } catch { throw new Error(storageUnavailable); }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored = window.localStorage.getItem(preferenceKey);
        if (stored && edited.current === 0) setPreferences(normalizePreferences(JSON.parse(stored)));
      } catch { /* A blocked or malformed local copy must not break the form. */ }
      try {
        const storedInterest = window.localStorage.getItem(interestKey);
        const parsed: unknown = storedInterest ? JSON.parse(storedInterest) : null;
        if (parsed && typeof parsed === "object" && !featureEdited.current) {
          const keys = (parsed as Record<string, unknown>).keys;
          setFeatureVotes(Array.isArray(keys) ? keys.filter((key): key is DiscoveryFeatureKey => typeof key === "string" && discoveryFeatureKeys.has(key as DiscoveryFeatureKey)) : []);
        }
      } catch { /* Ignore malformed opinions without blocking settings. */ }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const revision = edited.current;
    const timer = window.setTimeout(() => {
      let headers: Record<string, string>;
      try { headers = requestHeaders(); }
      catch { setLoadNotice(storageUnavailable); setLoadingPreferences(false); return; }
      requestWithinDeadline((signal) => fetch(`${apiBase}/api/reader/preferences`, { headers, cache: "no-store", signal })
        .then((response) => response.ok ? response.json() : Promise.reject())
        .then(serverPreferences), activeRequests.current, controller.signal)
        .then((server) => {
          if (!controller.signal.aborted) {
            if (edited.current === revision && revision === 0) setPreferences((current) => ({ ...current, ...server }));
            setLoadNotice("");
            setLoadingPreferences(false);
          }
        })
        .catch(() => { if (!controller.signal.aborted) { setLoadingPreferences(false); setLoadNotice("저장된 설정을 불러오지 못했어요. 지금 고른 내용은 유지되며, 다시 연결하거나 설정을 저장할 수 있어요."); } });
    }, 0);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [reload, requestHeaders]);

  const updatePreferences = (update: (current: ReaderPreferences) => ReaderPreferences) => {
    if (mutationLock.current) return;
    edited.current += 1;
    setPreferences(update);
    setNotice("");
  };
  const toggle = (field: "categories" | "channels", value: string) => updatePreferences((current) => ({ ...current, [field]: current[field].includes(value) ? current[field].filter((item) => item !== value) : [...current[field], value] }));
  const toggleFeature = (key: DiscoveryFeatureKey) => {
    if (mutationLock.current) return;
    featureEdited.current = true;
    setFeatureVotes((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]);
  };
  const saveFeatureInterest = async () => {
    if (mutationLock.current) return;
    if (featureVotes.length === 0) {
      setInterestNotice("관심 가는 기능을 하나 이상 선택해 주세요.");
      return;
    }
    mutationLock.current = true;
    setInterestBusy(true);
    const localSaved = storeLocally(interestKey, { version: 1, keys: featureVotes });
    try {
      const headers = requestHeaders();
      const events = [
        { type: "PREMIUM_INTENT", eventKey: "discovery_card" },
        ...featureVotes.map((eventKey) => ({ type: "PREMIUM_FEATURE_VOTE", eventKey })),
      ];
      const responses = await Promise.all(events.map((event) => requestWithinDeadline((signal) => fetch(`${apiBase}/api/reader/events`, {
        method: "POST",
        headers,
        body: JSON.stringify({ ...event, editionId: 0, storyId: null }),
        signal,
      }), activeRequests.current)));
      if (responses.some((response) => !response.ok)) throw new Error("interest save failed");
      setInterestNotice(localSaved ? "관심 기능을 기록했어요. 현재 결제나 자동 결제는 없습니다." : "관심 기능을 온라인에 기록했어요. 이 기기에는 저장하지 못했습니다. 결제는 없습니다.");
    } catch (error) {
      setInterestNotice(error instanceof RequestDeadlineError ? "응답이 늦어 관심 기능의 온라인 반영 여부를 확인하지 못했어요. 선택은 유지되며 다시 확인할 수 있어요. 결제는 없습니다." : localSaved ? "이 기기에만 관심 기능을 저장했어요. 온라인에 반영하려면 다시 보내 주세요. 결제는 없습니다." : "관심 기능을 저장하지 못했어요. 선택한 내용은 유지되니 저장소와 연결을 확인한 뒤 다시 시도해 주세요. 결제는 없습니다.");
    } finally {
      mutationLock.current = false;
      setInterestBusy(false);
    }
  };
  const save = async () => {
    if (mutationLock.current) return;
    mutationLock.current = true;
    edited.current += 1;
    setSaving(true);
    const snapshot = normalizePreferences(preferences);
    const localSaved = storeLocally(preferenceKey, snapshot);
    try {
      const response = await requestWithinDeadline((signal) => fetch(`${apiBase}/api/reader/preferences`, { method: "PUT", headers: requestHeaders(), body: JSON.stringify({ categories: snapshot.categories, digestSize: snapshot.digestSize, consent: snapshot.consent }), signal }), activeRequests.current);
      if (!response.ok) throw new Error("save failed");
      setLoadNotice("");
      setNotice(localSaved ? "내 관심 분야와 분량을 저장했습니다." : "온라인 설정을 저장했어요. 이 기기에는 기억하지 못했으니 저장소 설정을 확인해 주세요.");
    } catch (error) {
      setNotice(error instanceof RequestDeadlineError ? `${localSaved ? "이 기기에는 저장했지만 " : "응답이 늦어 "}온라인 설정의 반영 여부를 확인하지 못했어요. 선택은 유지되니 연결을 확인한 뒤 다시 저장해 주세요.` : localSaved ? "이 기기에는 저장했습니다. 온라인 설정에는 반영하지 못했으니 다시 저장해 주세요." : error instanceof Error && error.message === storageUnavailable ? storageUnavailable : "설정을 저장하지 못했어요. 선택한 내용은 유지되니 연결과 저장소를 확인한 뒤 다시 시도해 주세요.");
    } finally { mutationLock.current = false; setSaving(false); }
  };
  const exportData = async () => {
    if (mutationLock.current) return;
    mutationLock.current = true;
    setPrivacyBusy(true);
    try {
      const serverData = await requestWithinDeadline(async (signal) => {
        const response = await fetch(`${apiBase}/api/reader/data`, { headers: requestHeaders(), cache: "no-store", signal });
        if (!response.ok) throw new Error("export failed");
        return response.json();
      }, activeRequests.current);
      const deviceData = Object.fromEntries(
        Object.keys(window.localStorage)
          .filter((key) => key.startsWith("achim-gyeol-"))
          .map((key) => [key, window.localStorage.getItem(key)]),
      );
      const blob = new Blob([JSON.stringify({ server: serverData, device: deviceData }, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "achim-gyeol-my-data.json"; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice("아침결에 저장된 내 데이터를 내려받았습니다.");
    } catch { setNotice("내 데이터를 내려받지 못했습니다. 저장소와 연결을 확인한 뒤 다시 시도해 주세요."); }
    finally { mutationLock.current = false; setPrivacyBusy(false); }
  };
  const clearData = async () => {
    if (mutationLock.current) return;
    if (!window.confirm("아침결에 저장된 알림·설정·이용 기록을 모두 삭제할까요? 이 작업은 되돌릴 수 없습니다.")) return;
    mutationLock.current = true;
    edited.current += 1;
    setPrivacyBusy(true);
    try {
      const response = await requestWithinDeadline((signal) => fetch(`${apiBase}/api/reader/data`, { method: "DELETE", headers: requestHeaders(), signal }), activeRequests.current);
      if (!response.ok) throw new Error("delete failed");
      let alertRemoved = true;
      try {
        const registration = "serviceWorker" in navigator ? await navigator.serviceWorker.getRegistration() : undefined;
        const subscription = await registration?.pushManager?.getSubscription();
        if (subscription) alertRemoved = await subscription.unsubscribe();
      } catch {
        alertRemoved = false;
      }
      let deviceCleared = true;
      try {
        Object.keys(window.localStorage)
          .filter((key) => key.startsWith("achim-gyeol-"))
          .forEach((key) => window.localStorage.removeItem(key));
      } catch { deviceCleared = false; }
      knownHeaders.current = null;
      setPreferences(normalizePreferences(defaultReaderPreferences));
      setFeatureVotes([]);
      setInterestNotice("");
      setLoadNotice("");
      setNotice(deviceCleared && alertRemoved ? "아침결에 저장된 내 데이터를 모두 삭제했습니다." : "온라인 데이터는 삭제했습니다. 이 기기의 정보나 알림 해제를 마치지 못했으니 브라우저 설정을 확인해 주세요.");
    } catch (error) { setNotice(error instanceof RequestDeadlineError ? "응답이 늦어 데이터 삭제 여부를 확인하지 못했어요. 이 화면의 정보는 그대로 두었습니다. 연결을 확인한 뒤 삭제를 다시 시도해 주세요." : "데이터 삭제를 완료하지 못했습니다. 잠시 후 다시 시도해 주세요."); }
    finally { mutationLock.current = false; setPrivacyBusy(false); }
  };

  const busy = saving || privacyBusy || interestBusy;

  return <>
    <section className="preference-hero"><span>나에게 맞는 읽기</span><h1>내 브리핑 설정</h1><p>관심 분야와 설명의 길이를 맞춰보세요. 평일 오전 7시 30분 도착 일정은 그대로예요.</p></section>
    {(loadingPreferences || loadNotice) && <div className="preference-status" aria-live="polite"><p>{loadingPreferences ? "저장된 설정을 확인하고 있어요. 먼저 고르셔도 괜찮아요." : loadNotice}</p>{!loadingPreferences && <button type="button" disabled={busy} onClick={() => { setLoadingPreferences(true); setReload((value) => value + 1); }}>다시 연결</button>}</div>}
    <section className="preference-layout">
      <div className="preference-main">
        <PreferenceBlock icon={SlidersHorizontal} title="관심 분야" description="분야를 가리지 않고 중요한 뉴스는 모두 제공하며, 선택한 분야의 카드를 먼저 보여드립니다."><div className="choice-grid">{categories.map((item) => <button type="button" key={item} disabled={busy} aria-pressed={preferences.categories.includes(item)} className={preferences.categories.includes(item) ? "active" : ""} onClick={() => toggle("categories", item)}><Check size={14} aria-hidden="true" />{item}</button>)}</div></PreferenceBlock>
        <PreferenceBlock icon={Clock3} title="도착 일정" description="등록된 기기에는 요일 선택 없이 평일 오전 7시 30분에 브리핑을 보냅니다."><div className="schedule-preference"><time dateTime="07:30" aria-label="평일 오전 7시 30분">평일 오전 <strong>07:30</strong></time></div></PreferenceBlock>
        <PreferenceBlock icon={BellRing} title="읽을 분량" description="설명을 읽을 분량을 정해요. 어느 분량에서도 원문은 확인할 수 있습니다."><div className="digest-options">{(["compact", "standard", "deep"] as const).map((size) => <button type="button" key={size} disabled={busy} aria-pressed={preferences.digestSize === size} className={preferences.digestSize === size ? "active" : ""} onClick={() => updatePreferences((current) => ({ ...current, digestSize: size }))}><strong>{size === "compact" ? "빠르게" : size === "standard" ? "기본" : "깊게"}</strong><span>{size === "compact" ? "결론 중심" : size === "standard" ? "핵심 내용 포함" : "맥락까지 자세히"}</span></button>)}</div></PreferenceBlock>
      </div>
      <aside className="preference-summary">
        <span>선택한 설정</span><h2>나의 아침결</h2>
        <dl><div><dt>관심 분야</dt><dd>{preferences.categories.length}개</dd></div><div><dt>도착 시간</dt><dd>{preferences.deliveryTime}</dd></div><div><dt>주기</dt><dd>평일</dd></div><div><dt>브리핑</dt><dd>{preferences.digestSize === "compact" ? "빠르게" : preferences.digestSize === "standard" ? "기본" : "깊게"}</dd></div></dl>
        <label><input type="checkbox" checked={preferences.consent} disabled={busy} onChange={(event) => updatePreferences((current) => ({ ...current, consent: event.target.checked }))} /><span><strong>브리핑 수신에 동의합니다</strong><small>언제든 변경하거나 철회할 수 있습니다.</small></span></label>
        <button type="button" className="studio-primary" onClick={() => void save()} disabled={busy} aria-busy={saving}><Check size={15} /> {saving ? "저장 중…" : "설정 저장"}</button>
        <div className="privacy-actions">
          <button type="button" onClick={() => void exportData()} disabled={busy}><Download size={14} /> 내 데이터 받기</button>
          <button type="button" onClick={() => { updatePreferences(() => normalizePreferences(defaultReaderPreferences)); setNotice("기본값으로 바꿨어요. 반영하려면 설정 저장을 눌러주세요."); }} disabled={busy}><RotateCcw size={14} /> 초기화</button>
          <button type="button" className="danger" onClick={() => void clearData()} disabled={busy}><Trash2 size={14} /> 전체 데이터 삭제</button>
        </div>
        <footer><ShieldCheck size={16} /> 이름·이메일·전화번호 없이 설정을 저장합니다.</footer>
      </aside>
      <div className="preference-discovery">
        <PreferenceBlock icon={Sparkles} title="다음에 생기면 좋을 기능" description="지금은 계속 무료입니다. 어떤 기능이 생기면 더 자주 쓸지 알려주시면 다음 업데이트의 우선순위를 정하는 데 반영합니다."><div className="discovery-options">{discoveryFeatures.map(({ key, icon: Icon, title, description }) => { const selected = featureVotes.includes(key); return <button key={key} type="button" role="checkbox" aria-checked={selected} aria-label={title} disabled={busy} className={`discovery-option${selected ? " active" : ""}`} onClick={() => toggleFeature(key)}><span className="discovery-option-icon"><Icon size={17} /></span><span className="discovery-option-copy"><strong>{title}</strong><small>{description}</small></span><span className="discovery-option-check" aria-hidden="true"><Check size={14} /></span></button>; })}</div><div className="discovery-footer"><p><ShieldCheck size={15} /> 선택한 기능만 익명으로 집계합니다. 이름·연락처는 받지 않습니다.</p><button type="button" className="studio-secondary" onClick={() => void saveFeatureInterest()} disabled={busy} aria-busy={interestBusy}><Sparkles size={15} /> {interestBusy ? "저장 중…" : "관심 기능 저장"}</button></div>{interestNotice && <p className="discovery-status" role="status">{interestNotice}</p>}</PreferenceBlock>
      </div>
    </section>
    {notice && <div className="notice" role="status"><span>{notice}</span><button onClick={() => setNotice("")}>확인</button></div>}
  </>;
}

function PreferenceBlock({ icon: Icon, title, description, children }: { icon: typeof SlidersHorizontal; title: string; description: string; children: ReactNode }) {
  return <article className="preference-block"><header><Icon /><div><h2>{title}</h2><p>{description}</p></div></header>{children}</article>;
}

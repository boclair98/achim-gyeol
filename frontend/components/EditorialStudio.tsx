"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import {
  Activity,
  BarChart3,
  BellRing,
  BookOpenCheck,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  Download,
  Eye,
  FileCheck2,
  Fingerprint,
  Gauge,
  History,
  Inbox,
  LockKeyhole,
  Link2,
  MailCheck,
  MessageSquareText,
  Palette,
  PauseCircle,
  Radio,
  Save,
  Send,
  Settings2,
  ShieldCheck,
  Users,
  UserCog,
  X,
} from "lucide-react";
import { demoBriefing, type Story } from "@/lib/briefing";
import { storyEvidence, workspaceMembers } from "@/lib/experience";
import { analytics, auditTrail, brandPresets, corrections, defaultBrand, type BriefingBrand, type EditorialStatus } from "@/lib/product";

type StudioTab = "desk" | "brand" | "delivery" | "analytics" | "team" | "governance";

const tabs: Array<{ id: StudioTab; label: string; icon: typeof Activity }> = [
  { id: "desk", label: "편집 데스크", icon: BookOpenCheck },
  { id: "brand", label: "브랜드", icon: Palette },
  { id: "delivery", label: "발송", icon: Send },
  { id: "analytics", label: "성과", icon: BarChart3 },
  { id: "team", label: "팀·권한", icon: UserCog },
  { id: "governance", label: "거버넌스", icon: ShieldCheck },
];

export function EditorialStudio() {
  const [tab, setTab] = useState<StudioTab>("desk");
  const [brand, setBrand] = useState<BriefingBrand>(defaultBrand);
  const [statuses, setStatuses] = useState<Record<number, EditorialStatus>>({ 1: "READY", 2: "REVIEW", 3: "READY", 4: "READY" });
  const [publishState, setPublishState] = useState<"DRAFT" | "SCHEDULED">("DRAFT");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const savedBrand = window.localStorage.getItem("achim-gyeol-brand");
    const savedStatuses = window.localStorage.getItem("achim-gyeol-editorial");
    const timer = window.setTimeout(() => {
      if (savedBrand) runSafely(() => setBrand(JSON.parse(savedBrand)));
      if (savedStatuses) runSafely(() => setStatuses(JSON.parse(savedStatuses)));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const readyCount = Object.values(statuses).filter((status) => status === "READY").length;
  const canPublish = readyCount === demoBriefing.stories.length;

  const updateStatus = (storyId: number, status: EditorialStatus) => {
    setStatuses((current) => {
      const next = { ...current, [storyId]: status };
      window.localStorage.setItem("achim-gyeol-editorial", JSON.stringify(next));
      return next;
    });
  };

  const saveBrand = () => {
    window.localStorage.setItem("achim-gyeol-brand", JSON.stringify(brand));
    setNotice("브랜드 프리셋을 저장했습니다. 독자 카드와 이메일 템플릿에 사용할 준비가 됐습니다.");
  };

  const approveBriefing = () => {
    if (!canPublish) {
      setNotice("검토 중인 기사 1건을 먼저 승인하거나 보류해야 합니다.");
      return;
    }
    setPublishState("SCHEDULED");
    setNotice("편집 승인 완료 · 오전 8시 실제 푸시 발행 대기열에 등록했습니다.");
  };

  const exportConfig = () => {
    const blob = new Blob([JSON.stringify({ brand, statuses, schedule: "08:00", channels: ["web-push", "email", "kakao"] }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "achim-gyeol-workspace.json";
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice("워크스페이스 설정 파일을 내보냈습니다.");
  };

  return (
    <>
      <section className="studio-hero">
        <div>
          <span className="studio-kicker"><i /> LIVE WORKSPACE · DEMO TENANT</span>
          <h1>기사 수집부터 승인·정정·발송까지,<br /><em>한 데스크에서 끝냅니다.</em></h1>
          <p>뉴스 조직의 편집 책임은 유지하고 반복 작업만 자동화합니다. 모든 AI 초안은 근거, 위험도, 승인자와 함께 기록됩니다.</p>
        </div>
        <aside className="edition-health">
          <div><span>오늘 브리핑</span><strong>{publishState === "SCHEDULED" ? "발행 예약" : "검토 중"}</strong></div>
          <div className="health-score"><Gauge /><b>{readyCount}/{demoBriefing.stories.length}</b><span>발행 준비 기사</span></div>
          <div className="health-track"><i style={{ width: `${(readyCount / demoBriefing.stories.length) * 100}%` }} /></div>
          <small>최종 승인자와 변경 내역은 감사 로그에 자동 기록됩니다.</small>
        </aside>
      </section>

      <section className="studio-product">
        <aside className="studio-sidebar">
          <div className="workspace-switcher"><span className="workspace-logo" style={{ background: brand.accent }}>{brand.name.slice(0, 1)}</span><div><strong>{brand.name}</strong><small>Enterprise workspace</small></div><ChevronRight size={16} /></div>
          <nav aria-label="스튜디오 메뉴">{tabs.map((item) => { const Icon = item.icon; return <button key={item.id} className={tab === item.id ? "active" : ""} onClick={() => setTab(item.id)}><Icon size={17} />{item.label}</button>; })}</nav>
          <div className="sidebar-security"><LockKeyhole size={15} /><div><strong>데모 보호 모드</strong><span>외부 전송 API 비활성</span></div></div>
        </aside>

        <div className="studio-main">
          {tab === "desk" && <DeskPanel statuses={statuses} updateStatus={updateStatus} readyCount={readyCount} canPublish={canPublish} approveBriefing={approveBriefing} publishState={publishState} />}
          {tab === "brand" && <BrandPanel brand={brand} setBrand={setBrand} saveBrand={saveBrand} />}
          {tab === "delivery" && <DeliveryPanel />}
          {tab === "analytics" && <AnalyticsPanel />}
          {tab === "team" && <TeamPanel />}
          {tab === "governance" && <GovernancePanel exportConfig={exportConfig} />}
        </div>
      </section>

      {notice && <div className="notice" role="status"><span>{notice}</span><button onClick={() => setNotice("")}>확인</button></div>}
    </>
  );
}

function DeskPanel({ statuses, updateStatus, readyCount, canPublish, approveBriefing, publishState }: {
  statuses: Record<number, EditorialStatus>;
  updateStatus: (id: number, status: EditorialStatus) => void;
  readyCount: number;
  canPublish: boolean;
  approveBriefing: () => void;
  publishState: "DRAFT" | "SCHEDULED";
}) {
  const [reviewingStory, setReviewingStory] = useState<Story | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftSummary, setDraftSummary] = useState("");
  const openReview = (story: Story) => { setReviewingStory(story); setDraftTitle(story.title); setDraftSummary(story.summary); };
  const saveReview = () => {
    if (!reviewingStory) return;
    const stored = window.localStorage.getItem("achim-gyeol-story-drafts");
    const drafts = stored ? runJson<Record<number, { title: string; summary: string }>>(stored, {}) : {};
    window.localStorage.setItem("achim-gyeol-story-drafts", JSON.stringify({ ...drafts, [reviewingStory.id]: { title: draftTitle, summary: draftSummary } }));
    updateStatus(reviewingStory.id, "READY");
    setReviewingStory(null);
  };
  return <div className="studio-panel">
    <PanelHeader eyebrow="EDITORIAL DESK" title="오늘의 발행 대기열" description="AI 초안을 근거와 위험도 기준으로 검토합니다." action={<button className="studio-primary" onClick={approveBriefing}><Send size={15} />{publishState === "SCHEDULED" ? "오전 8시 예약됨" : canPublish ? "최종 발행 승인" : `${readyCount}/4 검토 완료`}</button>} />
    <div className="pipeline-strip">
      {[{ label: "수집", value: "126", sub: "원문" }, { label: "중복 병합", value: "37", sub: "클러스터" }, { label: "요약 초안", value: "4", sub: "기사" }, { label: "교차 검증", value: "3", sub: "완료" }, { label: "편집 승인", value: String(readyCount), sub: "준비" }].map((item, index) => <div key={item.label} className={index === 4 ? "active" : ""}><span>{item.label}</span><strong>{item.value}</strong><small>{item.sub}</small></div>)}
    </div>
    <div className="desk-grid">
      <div className="review-queue">
        <div className="queue-head"><span>발행 후보</span><span>근거</span><span>품질</span><span>편집 상태</span></div>
        {demoBriefing.stories.map((story) => <article className="queue-row" key={story.id}>
          <button className="queue-story story-open" onClick={() => openReview(story)}><span className={`risk-dot ${story.riskLevel.toLowerCase()}`} /><div><small>{story.category} · {story.sources.length}개 출처 · 눌러서 상세 검수</small><strong>{story.title}</strong><p>{story.summary}</p></div></button>
          <div className="evidence-cell"><strong>{story.checkedClaims}/{story.totalClaims}</strong><span>주장 확인</span></div>
          <div className="score-cell"><strong>{story.qualityScore}</strong><span>/100</span></div>
          <div className="review-actions">
            <button className={statuses[story.id] === "READY" ? "approved" : ""} onClick={() => updateStatus(story.id, "READY")}><Check size={13} />승인</button>
            <button className={statuses[story.id] === "REVIEW" ? "reviewing" : ""} onClick={() => updateStatus(story.id, "REVIEW")}><Eye size={13} />검토</button>
            <button className={statuses[story.id] === "HELD" ? "held" : ""} onClick={() => updateStatus(story.id, "HELD")}><PauseCircle size={13} />보류</button>
          </div>
        </article>)}
      </div>
      <aside className="desk-aside">
        <div className="decision-card"><span>자동 발행 방지</span><ShieldCheck /><strong>사람의 최종 승인이 필요합니다</strong><p>중간 위험 이상, 출처 충돌, 미확인 숫자가 있으면 발행 버튼이 잠깁니다.</p></div>
        <div className="checklist-card"><strong>오늘의 체크리스트</strong>{["AI 사용 표시", "원문 링크", "복수 출처", "정정 연락처", "수신 거부 경로"].map((item) => <span key={item}><CheckCircle2 size={14} />{item}</span>)}</div>
      </aside>
    </div>
    {reviewingStory && <EvidenceReview story={reviewingStory} title={draftTitle} summary={draftSummary} setTitle={setDraftTitle} setSummary={setDraftSummary} onClose={() => setReviewingStory(null)} onSave={saveReview} />}
  </div>;
}

function EvidenceReview({ story, title, summary, setTitle, setSummary, onClose, onSave }: { story: Story; title: string; summary: string; setTitle: (value: string) => void; setSummary: (value: string) => void; onClose: () => void; onSave: () => void }) {
  const claims = storyEvidence[story.id] ?? [];
  return <div className="evidence-overlay" role="dialog" aria-modal="true" aria-label="기사 근거 상세 검수"><section className="evidence-drawer">
    <header><div><span>CLAIM-BY-CLAIM REVIEW</span><h2>기사 상세 검수</h2></div><button aria-label="검수 닫기" onClick={onClose}><X /></button></header>
    <div className="evidence-score"><div><Gauge /><span>품질 점수</span><strong>{story.qualityScore}</strong></div><div><ShieldCheck /><span>위험도</span><strong>{story.riskLevel}</strong></div><div><FileCheck2 /><span>확인 주장</span><strong>{story.checkedClaims}/{story.totalClaims}</strong></div></div>
    <div className="editor-fields"><label><span>발행 제목</span><input value={title} onChange={(event) => setTitle(event.target.value)} /></label><label><span>AI 요약 초안</span><textarea rows={4} value={summary} onChange={(event) => setSummary(event.target.value)} /><small>{summary.length}/220자 · 수정 내역은 감사 로그에 기록됩니다.</small></label></div>
    <div className="claim-review"><h3>주장별 근거</h3>{claims.map((item, index) => <article key={item.claim} className={item.status === "검토" ? "needs-review" : ""}><b>0{index + 1}</b><div><strong>{item.claim}</strong><span><Link2 size={12} /> {item.evidence}</span></div><em>{item.status}</em></article>)}</div>
    <div className="source-review"><h3>원문 출처</h3>{story.sources.map((source) => <a key={source.publisher} href={source.url} target="_blank" rel="noreferrer"><span>{source.publisher}</span><strong>{source.publishedAt}</strong><ChevronRight size={14} /></a>)}</div>
    <footer><button className="studio-secondary" onClick={onClose}>검토 보류</button><button className="studio-primary" onClick={onSave} disabled={claims.some((item) => item.status === "검토")}><Check size={15} /> 수정 저장 후 승인</button></footer>
    {claims.some((item) => item.status === "검토") && <p className="review-lock"><CircleAlert size={14} /> 미확인 주장 1건이 있어 승인 버튼을 잠갔습니다.</p>}
  </section></div>;
}

function BrandPanel({ brand, setBrand, saveBrand }: { brand: BriefingBrand; setBrand: (brand: BriefingBrand) => void; saveBrand: () => void }) {
  return <div className="studio-panel">
    <PanelHeader eyebrow="WHITE LABEL" title="고객사 브랜드 시스템" description="카드, 이메일, 보관함에 하나의 브랜드 규칙을 적용합니다." action={<button className="studio-primary" onClick={saveBrand}><Save size={15} />프리셋 저장</button>} />
    <div className="brand-workspace">
      <div className="brand-form">
        <label><span>프리셋</span><div className="preset-list">{brandPresets.map((preset) => <button key={preset.name} className={brand.name === preset.name ? "active" : ""} onClick={() => setBrand(preset)}><i style={{ background: preset.accent }} />{preset.name}</button>)}</div></label>
        <label><span>발행 브랜드</span><input value={brand.name} onChange={(event) => setBrand({ ...brand, name: event.target.value })} /></label>
        <label><span>영문 설명</span><input value={brand.descriptor} onChange={(event) => setBrand({ ...brand, descriptor: event.target.value })} /></label>
        <label><span>대표 색상</span><div className="color-input"><input type="color" value={brand.accent} onChange={(event) => setBrand({ ...brand, accent: event.target.value })} /><code>{brand.accent}</code></div></label>
        <label><span>책임 편집자</span><input value={brand.editorName} onChange={(event) => setBrand({ ...brand, editorName: event.target.value })} /></label>
        <label><span>정정 문의</span><input type="email" value={brand.contactEmail} onChange={(event) => setBrand({ ...brand, contactEmail: event.target.value })} /></label>
      </div>
      <div className="brand-preview-wrap"><span>LIVE CARD PREVIEW</span><article className="brand-card-preview" style={{ "--tenant-accent": brand.accent } as CSSProperties}><header><strong>{brand.name}</strong><span>{brand.descriptor}</span></header><div><small>POLICY · VERIFIED</small><h3>오늘 알아야 할 정책 변화,<br />세 줄로 먼저 읽으세요.</h3><p>핵심 사실과 일상에 미치는 영향만 간결하게 전달합니다.</p></div><footer><span>{brand.editorName}</span><span>AI 초안 · 편집 검토 완료</span></footer></article><p>로고 파일 업로드와 전용 도메인은 저장소 연결 단계에서 활성화됩니다.</p></div>
    </div>
  </div>;
}

function DeliveryPanel() {
  return <div className="studio-panel">
    <PanelHeader eyebrow="DELIVERY ORCHESTRATION" title="채널별 발송 계획" description="콘텐츠는 한 번 승인하고 채널 규격에 맞게 자동 변환합니다." action={<button className="studio-secondary"><Settings2 size={15} />기본 규칙 편집</button>} />
    <div className="delivery-overview"><div><Clock3 /><span>다음 발행</span><strong>내일 오전 8:00</strong><small>Asia/Seoul · 평일</small></div><div><Users /><span>예상 수신자</span><strong>12,480명</strong><small>동의 상태 정상</small></div><div><Inbox /><span>콘텐츠</span><strong>카드 6장</strong><small>요약 4 · 표지 1 · 정리 1</small></div></div>
    <div className="channel-grid">
      <ChannelCard icon={BellRing} name="Web Push" format="도착 알림 + 카드 보관함" status="설정 준비" detail="VAPID/FCM 키 연결 대기" />
      <ChannelCard icon={MailCheck} name="Email" format="반응형 HTML + 원문 버튼" status="템플릿 준비" detail="발신 도메인·SMTP 연결 대기" />
      <ChannelCard icon={MessageSquareText} name="Kakao Channel" format="리스트 메시지 + 상세 링크" status="심사 준비" detail="비즈 앱·템플릿 ID 연결 대기" />
      <ChannelCard icon={Radio} name="Slack / Teams" format="조직별 데일리 다이제스트" status="페이로드 준비" detail="Webhook/OAuth 연결 대기" />
    </div>
    <div className="consent-panel"><div><ShieldCheck /><span><strong>수신 동의 원장</strong><small>채널별 동의 시각·경로·철회 이력을 보존하도록 설계</small></span></div><div className="consent-stats"><span><b>12,480</b>활성</span><span><b>18</b>처리 대기</span><span><b>0</b>동의 오류</span></div><button>동의 데이터 내보내기</button></div>
  </div>;
}

function AnalyticsPanel() {
  const funnel = [{ label: "발송", value: 100 }, { label: "도달", value: 99.1 }, { label: "열람", value: analytics.openRate }, { label: "완독", value: analytics.completionRate }, { label: "원문 클릭", value: analytics.clickRate }];
  return <div className="studio-panel">
    <PanelHeader eyebrow="AUDIENCE INTELLIGENCE" title="브리핑 성과" description="허영 지표보다 신뢰, 완독, 원문 확인 행동을 우선합니다." action={<button className="studio-secondary"><Download size={15} />주간 리포트</button>} />
    <div className="metric-grid"><Metric label="수신자" value={analytics.recipients.toLocaleString()} change="+4.8%" icon={Users} /><Metric label="도달률" value="99.1%" change="안정" icon={CheckCircle2} /><Metric label="열람률" value={`${analytics.openRate}%`} change="+6.2%p" icon={Eye} /><Metric label="원문 클릭" value={`${analytics.clickRate}%`} change="+2.1%p" icon={BookOpenCheck} /><Metric label="수신 거부" value={`${analytics.unsubscribeRate}%`} change="정상" icon={Inbox} /></div>
    <div className="analytics-grid"><div className="funnel-card"><span>오늘의 독자 흐름</span>{funnel.map((item) => <div key={item.label}><label><b>{item.label}</b><strong>{item.value}%</strong></label><i><em style={{ width: `${item.value}%` }} /></i></div>)}</div><div className="story-performance"><span>기사별 원문 이동</span>{demoBriefing.stories.map((story, index) => <div key={story.id}><b>0{index + 1}</b><p>{story.title}</p><strong>{[28.4, 24.1, 18.7, 15.9][index]}%</strong></div>)}</div></div>
  </div>;
}

function TeamPanel() {
  const [rules, setRules] = useState<Record<string, boolean>>({ doubleApproval: true, highRiskLock: true, guestExpiry: true, downloadLimit: false });
  const toggleRule = (key: string) => setRules((current) => {
    const next = { ...current, [key]: !current[key] };
    window.localStorage.setItem("achim-gyeol-permission-rules", JSON.stringify(next));
    return next;
  });
  return <div className="studio-panel">
    <PanelHeader eyebrow="TEAM & ACCESS" title="팀 권한과 승인선" description="작성·검증·발행 권한을 분리해 한 사람의 실수를 막습니다." action={<button className="studio-secondary"><UserCog size={15} /> 구성원 초대 준비</button>} />
    <div className="team-summary"><div><Users /><span>활성 구성원</span><strong>3명</strong></div><div><ShieldCheck /><span>최종 승인자</span><strong>1명</strong></div><div><Clock3 /><span>게스트 만료</span><strong>7일 후</strong></div><div><Fingerprint /><span>최근 권한 점검</span><strong>오늘 06:00</strong></div></div>
    <div className="team-grid">
      <section className="member-table"><header><span>구성원</span><span>역할</span><span>허용 범위</span><span>상태</span></header>{workspaceMembers.map((member) => <article key={member.name}><div><i>{member.name.slice(0, 1)}</i><strong>{member.name}</strong></div><span>{member.role}</span><span>{member.scope}</span><b className={member.status === "활성" ? "active" : "expiring"}>{member.status}</b></article>)}</section>
      <aside className="approval-rules"><span>APPROVAL POLICY</span><h3>발행 보호 규칙</h3>{[
        { key: "doubleApproval", title: "고위험 이중 승인", copy: "정치·금융·의료는 2인 승인" },
        { key: "highRiskLock", title: "충돌 출처 자동 잠금", copy: "CONFLICTING 상태 발행 차단" },
        { key: "guestExpiry", title: "게스트 자동 만료", copy: "초대 후 14일에 권한 회수" },
        { key: "downloadLimit", title: "원문 다운로드 제한", copy: "관리자만 원문 묶음 내보내기" },
      ].map((rule) => <button key={rule.key} onClick={() => toggleRule(rule.key)}><span><strong>{rule.title}</strong><small>{rule.copy}</small></span><i className={rules[rule.key] ? "active" : ""}><em /></i></button>)}<footer><LockKeyhole size={14} /> 권한 변경은 감사 로그에 남습니다.</footer></aside>
    </div>
  </div>;
}

function GovernancePanel({ exportConfig }: { exportConfig: () => void }) {
  return <div className="studio-panel">
    <PanelHeader eyebrow="TRUST & GOVERNANCE" title="책임 운영 기록" description="무엇을, 누가, 왜 바꿨는지 공개 가능한 형태로 남깁니다." action={<button className="studio-secondary" onClick={exportConfig}><Download size={15} />운영 설정 내보내기</button>} />
    <div className="governance-grid">
      <div className="governance-card"><header><History /><div><strong>정정 이력</strong><span>독자에게 공개되는 변경 기록</span></div></header>{corrections.map((item) => <article key={item.date}><time>{item.date}</time><strong>{item.story}</strong><p>{item.change}</p><small>{item.reason} · {item.status}</small></article>)}</div>
      <div className="governance-card"><header><Fingerprint /><div><strong>감사 로그</strong><span>편집·자동화 작업 추적</span></div></header>{auditTrail.map((item) => <article className="audit-item" key={`${item.time}-${item.action}`}><time>{item.time}</time><div><strong>{item.action}</strong><p>{item.target}</p><small>{item.actor}</small></div></article>)}</div>
    </div>
    <div className="policy-grid"><div><FileCheck2 /><strong>AI 투명성</strong><span>AI 초안과 사람의 편집 여부 표시</span><b>적용</b></div><div><LockKeyhole /><strong>개인정보 최소화</strong><span>구독·발송 목적 정보만 처리</span><b>설계 완료</b></div><div><CircleAlert /><strong>고위험 주제</strong><span>정치·금융·의료 자동 발행 금지</span><b>차단</b></div><div><Activity /><strong>정정 SLA</strong><span>중대 오류 인지 후 즉시 발행 중지</span><b>정책 적용</b></div></div>
    <LaunchReadiness />
  </div>;
}

function LaunchReadiness() {
  const checks = [
    { label: "독자 화면·보관함", state: "완료", ready: true }, { label: "편집 승인·감사 로그", state: "완료", ready: true },
    { label: "화이트라벨 카드·메일", state: "완료", ready: true }, { label: "개인정보·정정 정책", state: "검토 초안", ready: true },
    { label: "뉴스 공급 계약", state: "고객사 결정", ready: false }, { label: "AI·발송 API 키", state: "연결 대기", ready: false },
  ];
  return <section className="launch-readiness"><header><div><span>GO-LIVE READINESS</span><h3>파일럿 출시 준비도</h3></div><strong>4/6</strong></header><div>{checks.map((item) => <article key={item.label}><i className={item.ready ? "ready" : "blocked"}>{item.ready ? <Check size={13} /> : <Clock3 size={13} />}</i><span><strong>{item.label}</strong><small>{item.state}</small></span></article>)}</div><footer><ShieldCheck size={15} /> 제품 구현은 완료 상태이며, 외부 계약과 키 연결 두 단계만 남았습니다.</footer></section>;
}

function PanelHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action: ReactNode }) {
  return <header className="panel-header"><div><span>{eyebrow}</span><h2>{title}</h2><p>{description}</p></div>{action}</header>;
}

function ChannelCard({ icon: Icon, name, format, status, detail }: { icon: typeof Activity; name: string; format: string; status: string; detail: string }) {
  return <article className="channel-card"><header><Icon /><span>{status}</span></header><h3>{name}</h3><p>{format}</p><footer><i />{detail}</footer></article>;
}

function Metric({ label, value, change, icon: Icon }: { label: string; value: string; change: string; icon: typeof Activity }) {
  return <article className="metric-card"><header><span>{label}</span><Icon /></header><strong>{value}</strong><small>{change}</small></article>;
}

function runSafely(task: () => void) {
  try { task(); } catch { /* Ignore malformed demo preferences. */ }
}

function runJson<T>(value: string, fallback: T): T {
  try { return JSON.parse(value) as T; } catch { return fallback; }
}

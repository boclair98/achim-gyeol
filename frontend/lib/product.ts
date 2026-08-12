export type BriefingBrand = {
  name: string;
  descriptor: string;
  accent: string;
  editorName: string;
  contactEmail: string;
};

export type EditorialStatus = "READY" | "REVIEW" | "HELD";

export const defaultBrand: BriefingBrand = {
  name: "아침결",
  descriptor: "AI MORNING BRIEF",
  accent: "#d8ff3e",
  editorName: "자동 브리핑 시스템",
  contactEmail: "",
};

export const brandPresets: BriefingBrand[] = [
  defaultBrand,
  { name: "POLICY WAVE", descriptor: "PUBLIC POLICY DAILY", accent: "#74f0c1", editorName: "정책 브리핑팀", contactEmail: "desk@policy-wave.example" },
  { name: "MARKET PULSE", descriptor: "BUSINESS SIGNALS", accent: "#ffb35c", editorName: "비즈니스 인텔리전스팀", contactEmail: "brief@market-pulse.example" },
];

export const corrections = [
  { date: "8월 8일 09:14", story: "지역 교통 요금 조정안", change: "적용 예정일을 9월 1일에서 9월 15일로 바로잡았습니다.", reason: "지자체 최종 고시 확인", status: "수정 완료" },
  { date: "8월 5일 11:32", story: "소상공인 정책자금 안내", change: "신청 대상 범위에 예비 창업자를 추가했습니다.", reason: "공식 FAQ 업데이트 반영", status: "재발송 완료" },
];

export const auditTrail = [
  { time: "06:42", actor: "김 에디터", action: "최종 발행 승인", target: "8월 10일 모닝 브리핑" },
  { time: "06:31", actor: "품질 게이트", action: "경제 기사 보류 권고", target: "정산 주기 개선안" },
  { time: "06:18", actor: "AI 요약기", action: "4개 기사 초안 생성", target: "오늘의 브리핑" },
  { time: "05:48", actor: "수집 파이프라인", action: "중복 기사 37건 병합", target: "수집 기사 126건" },
];

export const analytics = {
  recipients: 12480,
  delivered: 12371,
  openRate: 68.4,
  clickRate: 21.7,
  unsubscribeRate: 0.18,
  completionRate: 72.1,
};

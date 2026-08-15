export type ArchiveEdition = {
  id: string;
  date: string;
  weekday: string;
  lead: string;
  categories: string[];
  readMinutes: number;
  verified: number;
  storyCount: number;
  headlines: string[];
};

export const archiveEditions: ArchiveEdition[] = [
  { id: "2026-08-10", date: "8월 10일", weekday: "월요일", lead: "지원 정책, 정산 제도, 이동 정보와 AI 표시 기준", categories: ["정책", "경제", "사회", "테크"], readMinutes: 5, verified: 3, storyCount: 4, headlines: ["청년 지원 통합 창구 개편", "소상공인 정산 개선안", "AI 생성물 표시 기준 논의"] },
  { id: "2026-08-09", date: "8월 9일", weekday: "일요일", lead: "이번 주 생활에 영향을 줄 제도 변화만 모았습니다", categories: ["정책", "사회"], readMinutes: 4, verified: 4, storyCount: 4, headlines: ["지역 돌봄 신청 절차 간소화", "공공 와이파이 품질 공개", "재난 알림 세분화"] },
  { id: "2026-08-08", date: "8월 8일", weekday: "토요일", lead: "시장 흐름과 기술 정책을 한 번에 정리합니다", categories: ["경제", "테크"], readMinutes: 6, verified: 5, storyCount: 5, headlines: ["온라인 판매자 보호 기준", "중소기업 AI 도입 지원", "전자문서 보관 기준"] },
  { id: "2026-08-07", date: "8월 7일", weekday: "금요일", lead: "교통·주거·금융의 달라지는 기준", categories: ["정책", "경제", "사회"], readMinutes: 5, verified: 4, storyCount: 4, headlines: ["대중교통 환승 정보 확대", "전월세 계약 안내 개선", "소액 결제 분쟁 기준"] },
  { id: "2026-08-06", date: "8월 6일", weekday: "목요일", lead: "오늘 결정에 필요한 네 가지 신호", categories: ["경제", "테크"], readMinutes: 4, verified: 3, storyCount: 4, headlines: ["플랫폼 수수료 공시 확대", "공공데이터 개방 범위", "AI 안전성 평가안"] },
  { id: "2026-08-05", date: "8월 5일", weekday: "수요일", lead: "신청 기한과 적용 시점을 놓치지 않도록", categories: ["정책", "사회"], readMinutes: 5, verified: 4, storyCount: 4, headlines: ["정책자금 신청 대상 확대", "병원 예약 정보 연계", "지역 문화패스 개편"] },
];

export type ReaderPreferences = {
  categories: string[];
  deliveryTime: string;
  digestSize: "compact" | "standard" | "deep";
  channels: string[];
  consent: boolean;
};

export const defaultReaderPreferences: ReaderPreferences = {
  categories: ["정책", "경제", "사회", "테크"],
  deliveryTime: "07:30",
  digestSize: "standard",
  channels: ["PWA"],
  consent: true,
};

export const storyEvidence: Record<number, Array<{ claim: string; evidence: string; status: "확인" | "검토" }>> = {
  1: [
    { claim: "통합 안내 체계가 개편됐다", evidence: "공식 보도자료 본문 2항", status: "확인" },
    { claim: "주거·취업·교육 정보를 함께 제공한다", evidence: "서비스 분야 목록 및 공영방송 설명", status: "확인" },
    { claim: "신청 기한 알림을 제공한다", evidence: "공식 FAQ 8번", status: "확인" },
  ],
  2: [
    { claim: "정산 주기 단축안이 공개됐다", evidence: "정책자료 3쪽", status: "확인" },
    { claim: "분쟁 처리 기준이 함께 논의된다", evidence: "정책자료 부록 및 경제지 인터뷰", status: "확인" },
    { claim: "모든 플랫폼에 즉시 적용된다", evidence: "시행 범위 최종안 미공개", status: "검토" },
  ],
  3: [
    { claim: "일부 지역에서 시범 서비스를 시작했다", evidence: "지자체 공지 및 통신사 확인", status: "확인" },
    { claim: "차량별 혼잡도를 제공한다", evidence: "서비스 화면 설명", status: "확인" },
  ],
  4: [
    { claim: "AI 생성물 표시 방식이 논의 중이다", evidence: "공식 회의자료 4항", status: "확인" },
    { claim: "플랫폼 책임 범위가 포함된다", evidence: "공식자료·IT 매체 공통 확인", status: "확인" },
  ],
};

export const workspaceMembers = [
  { name: "김 에디터", role: "책임 편집자", scope: "최종 승인·정정", status: "활성" },
  { name: "박 리서처", role: "검증 담당", scope: "근거 확인·보류", status: "활성" },
  { name: "이 운영자", role: "발송 운영", scope: "예약·채널 관리", status: "활성" },
  { name: "외부 검토자", role: "게스트", scope: "댓글만 허용", status: "만료 예정" },
];

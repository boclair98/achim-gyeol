export type Source = { publisher: string; url: string; publishedAt: string; primarySource?: boolean };
export type EvidenceClaim = { statement: string; sources: Source[] };
export type StoryInterest = "INTERESTED" | "NOT_INTERESTED";
export const briefingCategoryOrder = ["정책", "경제", "사회", "국제", "테크", "생활", "문화", "스포츠", "e스포츠"] as const;
export type BriefingCategory = (typeof briefingCategoryOrder)[number];
export type Story = {
  id: number;
  category: BriefingCategory;
  title: string;
  oneLineSummary?: string;
  summary: string;
  whyItMatters: string;
  whatToWatch?: string | null;
  verificationStatus: "VERIFIED" | "DEVELOPING" | "CONFLICTING" | "SINGLE_SOURCE";
  qualityScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  checkedClaims: number;
  totalClaims: number;
  uncertainty?: string | null;
  backgroundContext?: string;
  plainExplanation?: string;
  imageUrl?: string | null;
  imagePublisher?: string | null;
  evidenceAvailable?: boolean;
  claims?: EvidenceClaim[];
  sources: Source[];
  corrections?: Array<{ correctedAt: string; reason: string }>;
  viewerInterest?: StoryInterest | null;
};
export type Briefing = { id: number; briefingDate?: string; productionReady?: boolean; editorialState?: "AUTO_APPROVED" | "REVIEW" | "APPROVED" | "HELD" | "PUBLISHED"; humanReviewed?: boolean; dateLabel: string; lead: string; readMinutes: number; verifiedCount: number; lastVerifiedAt: string; stories: Story[]; personalized?: boolean };

export const demoBriefing: Briefing = {
  id: 1,
  productionReady: false,
  dateLabel: "데모 에디션",
  lead: "어제의 소음을 걷어내고, 서로 다른 출처에서 공통으로 확인된 사실과 오늘의 의미만 담았습니다.",
  readMinutes: 5,
  verifiedCount: 3,
  lastVerifiedAt: "오전 6:42",
  stories: [
    { id: 1, category: "정책", title: "청년 지원 정보를 한곳에서 확인하는 통합 창구가 열렸어요", summary: "흩어져 있던 주거·취업·교육 지원 정보를 하나의 안내 체계에서 찾을 수 있도록 공공기관 서비스가 개편됐습니다.", whyItMatters: "지원 자격을 일일이 찾아다니는 시간이 줄고, 신청 기한을 놓칠 가능성도 낮아집니다.", whatToWatch: "세부 지원별 신청 시작일과 실제 통합 범위를 확인해야 합니다.", verificationStatus: "VERIFIED", qualityScore: 94, riskLevel: "LOW", checkedClaims: 6, totalClaims: 6, sources: [{ publisher: "공식 발표", url: "https://www.korea.kr", publishedAt: "06:10" }, { publisher: "공영방송", url: "https://news.kbs.co.kr", publishedAt: "06:22" }] },
    { id: 2, category: "경제", title: "소상공인 정산 주기를 줄이는 개선안이 공개됐어요", summary: "온라인 거래 대금이 판매자에게 전달되는 시간을 단축하는 방안과 분쟁 처리 기준이 함께 논의되고 있습니다.", whyItMatters: "매출이 실제 현금으로 들어오기까지의 간격이 줄면 작은 사업자의 자금 흐름이 안정될 수 있습니다.", verificationStatus: "DEVELOPING", qualityScore: 78, riskLevel: "MEDIUM", checkedClaims: 4, totalClaims: 5, sources: [{ publisher: "정책자료", url: "https://www.korea.kr", publishedAt: "05:50" }, { publisher: "경제지", url: "https://www.hankyung.com", publishedAt: "06:31" }] },
    { id: 3, category: "사회", title: "대중교통 환승 안내가 실시간 혼잡도까지 보여주기 시작했어요", summary: "일부 지역에서 환승 경로와 도착 정보에 차량별 혼잡도를 함께 제공하는 시범 서비스가 시작됐습니다.", whyItMatters: "출근 시간에 덜 붐비는 차량과 경로를 고를 수 있어 이동 시간을 예측하기 쉬워집니다.", verificationStatus: "VERIFIED", qualityScore: 91, riskLevel: "LOW", checkedClaims: 5, totalClaims: 5, sources: [{ publisher: "지자체", url: "https://www.seoul.go.kr", publishedAt: "05:45" }, { publisher: "통신사", url: "https://www.yna.co.kr", publishedAt: "06:08" }] },
    { id: 4, category: "테크", title: "AI 생성물의 출처를 표시하는 공통 기준 논의가 빨라지고 있어요", summary: "콘텐츠가 AI로 만들어졌는지 이용자가 확인할 수 있도록 표시 방식과 플랫폼 책임 범위를 정하는 논의가 이어지고 있습니다.", whyItMatters: "뉴스·광고·창작물에서 실제 촬영물과 생성물을 구분할 수 있는 최소한의 신뢰 장치가 될 수 있습니다.", verificationStatus: "VERIFIED", qualityScore: 89, riskLevel: "LOW", checkedClaims: 5, totalClaims: 5, sources: [{ publisher: "공식자료", url: "https://www.korea.kr", publishedAt: "05:20" }, { publisher: "IT 매체", url: "https://www.etnews.com", publishedAt: "06:18" }] },
  ],
};

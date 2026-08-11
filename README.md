# 아침결 · Newsroom Briefing OS

아침결은 뉴스 조직과 브랜드가 매일의 핵심 뉴스를 **수집 → AI 초안 → 근거 확인 → 사람의 승인 → 채널별 카드 발행 → 정정** 순서로 운영할 수 있게 만든 화이트라벨 브리핑 서비스입니다.

현재 저장소는 NAVER API HUB와 OpenAI Responses API를 연결해 전날 뉴스를 수집·교차 검증·요약할 수 있습니다. API 키가 없는 로컬 환경에서는 샘플 기사로 동작하며, 편집·브랜드·카드 생성·PWA·신뢰 정책 화면도 함께 제공합니다.

## 공개 서비스

- 서비스: [https://morningnews.coders.kr](https://morningnews.coders.kr)
- 소스 저장소: [https://github.com/boclair98/achim-gyeol](https://github.com/boclair98/achim-gyeol) (Public)
- 배포 구성: `coders.yaml`의 Next.js 정적 웹 + Kotlin/Spring Boot API + PostgreSQL
- 현재 기능 브랜치: `agent/delivery-card-deck`
- 수익화 상태: Donate, 유료 구독, 하단 후원 배지를 모두 비활성화

운영 비밀값은 공개 저장소에 포함하지 않습니다. NAVER·OpenAI·VAPID 키와 관리자 토큰은 coders.kr의 비밀 환경변수로만 주입합니다.

## 지금 바로 확인할 수 있는 것

- 독자용 PWA: 뉴스별 3줄 요약, 중요성, 출처, 검증 상태, 원문 링크
- 개인 보관함: 날짜·키워드·분야 검색, 기기별 브리핑 저장
- 독자 설정: 관심 분야, 요일·시간, 분량, 채널, 동의 상태와 데이터 내보내기·삭제
- 전달용 카드 덱: 표지·기사별 요약·오늘의 정리, 1080×1350 PNG 저장 및 공유
- 화이트라벨: 고객사명, 설명, 대표 색상, 책임 편집자, 정정 연락처 저장
- 편집 데스크: 근거 수, 위험도, 품질 점수, 승인·검토·보류, 사람의 최종 발행 잠금
- 기사 상세 검수: 제목·요약 수정, 주장별 근거, 원문 비교, 미확인 주장 자동 잠금
- 발송 오케스트레이션: Web Push, 이메일, 카카오, Slack/Teams 채널 준비 상태
- 운영 거버넌스: AI 사용 표시, 정정 이력, 감사 로그, 고위험 주제 차단 원칙
- 팀 권한: 책임 편집자·검증 담당·발송 운영·게스트 역할과 승인 보호 규칙
- 성과 화면: 도달·열람·완독·원문 클릭·수신 거부 지표 구조
- 공개 신뢰센터와 개인정보 처리방침·이용약관 초안

주요 경로:

- `/` 독자용 오늘의 브리핑과 실제 전달 카드
- `/studio` 편집·브랜드·발송·성과·거버넌스 워크스페이스
- `/archive` 검색·필터·저장을 지원하는 독자 보관함
- `/preferences` 관심 분야·도착 일정·분량·채널·동의 설정
- `/trust` 공개 신뢰센터
- `/privacy`, `/terms` 운영 정책 초안

## API 연결 방식

백엔드는 매일 오전 6시 15분(한국 시간)에 다음 파이프라인을 실행합니다.

1. 분야별 검색어로 전날 NAVER 뉴스 검색 결과 수집
2. URL 중복 제거와 제목 유사도 기반 사건 클러스터링
3. 서로 다른 언론사 두 곳 이상이 포함된 사건만 후보 선정
4. OpenAI Structured Outputs로 공통 사실·출처 ID·불확실성 추출
5. 모든 핵심 사실에 출처 두 곳 이상이 연결된 경우에만 발행
6. 기존 날짜 브리핑을 원자적으로 갱신하고 출처 링크 보존

필수 환경 변수는 다음과 같습니다.

```env
NAVER_API_HUB_CLIENT_ID=
NAVER_API_HUB_CLIENT_SECRET=
OPENAI_API_KEY=
NEWS_PIPELINE_ENABLED=true
DEMO_DATA_ENABLED=false
```

`BRIEFING_ADMIN_TOKEN`을 설정하면 `POST /api/admin/briefings/generate`를 이용해 수동으로 생성할 수 있습니다. 요청 헤더 `X-Briefing-Admin-Token`에 동일한 값을 전달해야 합니다.

## API 없이 동작하는 범위

- 샘플 기사 기반 브리핑 전체 UI
- 화이트라벨 설정과 편집 상태의 브라우저 저장
- PNG 뉴스 카드 생성·다운로드·Web Share
- 반응형 HTML 이메일 `.eml` 미리보기
- PWA 설치·오프라인 화면·로컬 알림 미리보기
- 운영 설정 JSON 내보내기

## 실제 운영 전 추가할 외부 요소

1. **1차 자료**: OpenDART·KOSIS·ECOS·정부 보도자료를 통한 숫자와 정책 검증 강화.
2. **발송**: Web Push VAPID/FCM, 이메일 발신 도메인·SMTP/ESP, 카카오 비즈메시지, Slack/Teams OAuth 또는 Webhook.
3. **인증·운영**: 편집자 역할, 비밀값 관리, 분석 수집과 보존 정책.
4. **운영 검토**: 기사 이용 범위, 개인정보 문서, 정정·삭제·긴급 중단 절차의 최종 확인.

실제 운영용 환경 변수 예시는 `backend/.env.example`을 참고하세요. 비밀키는 프론트엔드나 Git 저장소에 넣지 않습니다.

## 기술 구성

- `frontend`: Next.js 정적 export PWA, GitHub Pages 배포 가능
- `backend`: Kotlin 2.2, Spring Boot 4.1, Spring Data JPA, H2 데모 저장소
- `coders.yaml`: coders.kr용 web/api/PostgreSQL 구성
- `.github/workflows/ci.yml`: 프론트엔드·백엔드 검증
- `.github/workflows/pages.yml`: GitHub Pages 정적 배포

## 품질 원칙

- 하나의 기사나 보도자료만으로 자동 발행하지 않습니다.
- 제목·본문·원문 링크를 구분하고, 사실과 전망을 섞지 않습니다.
- 출처 충돌, 미확인 숫자, 정치·금융·의료 등 고위험 주제는 자동 발행을 막습니다.
- 모든 카드에 AI 사용, 출처, 최종 확인 시각, 편집 책임, 정정 경로를 노출합니다.
- 정확성을 보장한다고 광고하지 않고, 오류를 발견·중단·정정하는 운영 능력을 제품 품질로 봅니다.

## 로컬 실행

```bash
docker compose up --build
```

프론트엔드는 `http://localhost:3000`, API는 `http://localhost:8080/api/briefings/today`에서 확인할 수 있습니다.

## 실제 PWA 뉴스 알림 사용법

1. 휴대폰에서 `https://morningnews.coders.kr`을 열고 coders.kr 계정으로 로그인합니다.
2. iPhone은 Safari의 공유 버튼에서 **홈 화면에 추가**한 뒤 설치된 아이콘으로 다시 엽니다. Android는 Chrome에서 바로 사용하거나 **앱 설치**를 선택합니다.
3. 메인 화면의 `ACTUAL DELIVERY`에서 시간과 요일을 고른 뒤 **이 기기에 알림 등록**을 누르고 브라우저 알림을 허용합니다.
4. **내게 테스트 발송**을 누르면 현재 로그인한 계정의 이 기기로만 테스트 뉴스 알림이 갑니다.
5. 이후 선택한 시각에 최신 발행 브리핑이 잠금화면과 알림센터에 도착하며, 알림을 누르면 뉴스 카드 묶음이 열립니다.

구독 해지는 같은 화면의 **알림 해지**에서 할 수 있습니다. 푸시 구독 주소는 coders.kr의 검증된 사용자 ID와 묶어 저장하며 다른 사용자는 테스트 발송에 이용할 수 없습니다. 하단 Donate·후원 배지와 구독 결제는 플랫폼 설정과 프론트엔드 모두에서 비활성화되어 있습니다.

운영 환경의 `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `NAVER_API_HUB_CLIENT_ID`, `NAVER_API_HUB_CLIENT_SECRET`, `OPENAI_API_KEY`, `BRIEFING_ADMIN_TOKEN`은 Git에 넣지 않고 coders.kr 비밀 환경변수로만 관리합니다.

# 아침결

핵심 뉴스를 찾으러 다니지 않아도 매일 아침 AI 요약 카드 묶음으로 받아보는 뉴스 브리핑 서비스입니다. 웹은 구독 설정·지난 브리핑 보관·원문 확인에 사용하고, 실제 전달물은 뉴스별 요약이 모두 들어간 1080×1350 이미지 카드입니다.

## API 없이 동작하는 범위

- 표지 + 뉴스별 요약 + 오늘의 정리로 구성된 카드 덱 미리보기
- 뉴스별 제목, AI 3줄 요약, 중요성, 검증 상태, 출처 표시
- 현재 카드 PNG 저장·공유와 전체 카드 묶음 공유
- 발송 시간·요일 설정의 브라우저 저장
- PWA 설치, 오프라인 셸, 실제 도착 형태의 테스트 알림
- 데모 뉴스 기반 웹 보관함과 원문 링크

실시간 뉴스 수집, AI 요약 생성, 사용자별 예약 푸시·카카오·메신저 발송만 외부 API 연결 단계로 남겨두었습니다.

## 구성

- `frontend`: Next.js 정적 export PWA. coders.kr와 GitHub Pages 배포를 모두 지원합니다.
- `backend`: Kotlin 2.2 + Spring Boot 4.1 + Spring Data JPA REST API.
- `coders.yaml`: coders.kr 네이티브 모드의 web/api/PostgreSQL 구성.
- `.github/workflows/ci.yml`: 프런트엔드와 백엔드를 푸시마다 검증합니다.
- `.github/workflows/pages.yml`: 저장소가 공개 준비됐을 때 수동으로 PWA를 GitHub Pages에 배포합니다.

API 키가 없어도 H2와 데모 브리핑으로 실행됩니다. 실제 수집·요약을 켜려면 `backend/.env.example`을 복사해 값을 설정하세요.

## 필요한 외부 API

- 필수(실제 한국 뉴스 수집): Naver Search API `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`
- 필수(AI 요약): OpenAI `OPENAI_API_KEY`
- 선택(특정 유튜브 영상 추천): YouTube Data API `YOUTUBE_API_KEY`
- 선택(예약 전송): Web Push VAPID 또는 Firebase Cloud Messaging
- 선택(메신저 전달): 카카오 비즈메시지, 텔레그램 Bot, Slack 중 서비스 채널에 맞는 API

GitHub Pages에는 서버를 실행할 수 없으므로, 저장소 변수 `NEXT_PUBLIC_API_BASE_URL`에 별도로 배포한 Spring Boot 서버 주소를 넣어야 합니다. 값이 없거나 서버가 연결되지 않으면 PWA는 검증된 데모 데이터를 표시합니다.

## 품질 기준

- 단일 출처 기사는 기본 발행 대상에서 제외합니다.
- 서로 다른 출처 두 곳 이상과 1차 자료 여부를 점수화합니다.
- 출처가 충돌하면 `CONFLICTING`으로 표시하고 자동 발행하지 않습니다.
- 기사마다 원문, 검증 상태, 마지막 확인 시각, 오류 신고 경로를 제공합니다.

## 로컬 실행

```bash
docker compose up --build
```

프런트엔드는 `http://localhost:3000`, API는 `http://localhost:8080/api/briefings/today`에서 확인할 수 있습니다.

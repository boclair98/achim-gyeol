# 아침결

복수 출처, 검증 상태, 수정 시각을 함께 보여주는 AI 모닝 브리핑 PWA입니다.

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

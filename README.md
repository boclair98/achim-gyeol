# 아침결

전날의 중요한 뉴스를 AI가 묶고 검증해, 다음 날 아침 **PWA 알림과 모바일 뉴스 리더**로 전달하는 뉴스 브리핑 서비스입니다.

- 서비스: [https://morningnews.coders.kr](https://morningnews.coders.kr)
- 정규 도착 시간: 선택한 요일 오전 7시 30분(한국 시간)
- 뉴스 범위: 전날 00:00~23:59에 보도된 뉴스
- 설치 비용: 무료
- 회원가입: 필요 없음
- 사용자 API 키: 필요 없음

> 처음 오셨나요? 아래의 **1분 사용법**만 따라 하면 됩니다. 개발자·운영자 설명은 문서 뒤쪽에 따로 모았습니다.

## 1분 사용법

### 아이폰·아이패드

아이폰은 웹사이트를 홈 화면에 한 번 추가해야 알림을 받을 수 있습니다.

1. Safari에서 [아침결](https://morningnews.coders.kr)을 엽니다.
2. Safari의 **공유** 버튼을 누릅니다.
3. **홈 화면에 추가**를 선택합니다.
4. 홈 화면에 생긴 **아침결 아이콘**으로 서비스를 다시 엽니다.
5. `무료 알림 받기`를 누릅니다.
6. 받을 요일을 확인합니다. 정규 도착 시각은 오전 7시 30분으로 고정됩니다.
7. `이 기기에 알림 등록`을 누릅니다.
8. iOS 알림 권한 창에서 **허용**을 누릅니다.

Safari 탭에서만 열면 iOS 정책상 알림 등록이 제한될 수 있습니다. 반드시 홈 화면의 아침결 아이콘으로 다시 열어 주세요.

### 안드로이드·PC

1. Chrome 또는 Edge에서 [아침결](https://morningnews.coders.kr)을 엽니다.
2. `무료 알림 받기`를 누릅니다.
3. 받을 요일을 선택합니다. 도착 시각은 오전 7시 30분입니다.
4. `이 기기에 알림 등록`을 누릅니다.
5. 브라우저 알림 권한 창에서 **허용**을 누릅니다.

홈 화면 설치는 선택 사항입니다. 설치하지 않아도 지원 브라우저에서는 웹푸시를 받을 수 있습니다.

## 등록이 제대로 된 건지 확인하기

등록에 성공하면 화면에 다음 안내가 표시됩니다.

```text
이 기기는 실제 아침 브리핑 수신 등록이 완료됐습니다.
```

이어서 `내 기기 실제 푸시 테스트`를 누르면 운영 서버가 테스트 알림을 보냅니다. 잠금화면이나 알림센터에 알림이 도착하면 설정이 끝난 것입니다.

아침결은 브라우저 내부 구독만으로 등록 완료를 표시하지 않습니다. 서버 저장까지 성공한 기기만 등록 완료로 표시합니다.

## 무엇이 도착하나요?

기본 설정에서는 평일 오전 7시 30분에 다음 내용이 담긴 푸시 알림이 옵니다.

- 전날 기사를 정책·경제·사회·국제·테크·생활·문화·스포츠·e스포츠로 수집하고 같은 사건의 반복 보도는 하나로 통합
- AI가 사건별 복수 출처를 함께 읽고 중요도와 요약을 작성하며, 중요도 70점 미만·홍보성 단신·단순 반복 보도는 제외
- 분야별 최대 3건, 전체 최대 15건 안에서 그날 실제로 중요한 뉴스만 게시(중요 뉴스가 없으면 해당 분야를 억지로 채우지 않음)
- `한 줄 결론`: 해당 사건에서 여러 출처로 확인된 가장 중요한 결론
- `확인된 핵심`: 각 문장 옆 번호로 근거 원문을 연결
- `알아야 할 것`: 생활·업무에 미치는 영향, 적용 시점, 확인할 행동
- `아직 확인되지 않은 것`: 보도 충돌·미확정 수치·추가 발표가 필요한 부분
- 1차 자료 표시와 서로 다른 원문 출처 링크
- 휴대폰에서 큰 글자로 이어 읽는 뉴스 전용 화면

알림을 누르면 홍보용 첫 화면이나 축소 카드가 아니라 실제 뉴스만 이어서 읽는 `/briefing` 화면으로 이동합니다.

메일이나 카카오톡으로 보내는 서비스가 아닙니다. 브라우저가 보관한 안전한 푸시 구독 주소를 사용해 잠금화면과 알림센터로 전달합니다.

## 언제 어떤 뉴스를 보내나요?

예를 들어 화요일 오전 7시 30분 브리핑에는 월요일 00:00~23:59에 보도된 뉴스를 담습니다.

```text
전날 00:00~23:59 뉴스 수집
              ↓
오전 6:00 사건 묶기·AI 요약·출처 교차 확인
              ↓
오전 6:45 서버 기동·브리핑 준비 상태 확인
              ↓
오전 7:30 등록 기기로 PWA 알림 발송
              ↓
알림을 눌러 모바일 뉴스 리더 열기
```

발송 시각은 모든 사용자에게 한국 시간 오전 7시 30분으로 고정되며 받을 요일만 선택합니다. 오전 8시를 넘기면 당일 미발송 알림은 보내지 않고 다음 선택 요일로 넘어갑니다. 서버나 예약 작업이 늦게 깨어나 9시에 알림이 도착하는 상황을 막기 위한 안전장치입니다.

## 사용자가 준비할 것은 없습니다

일반 사용자는 아래 항목을 입력하지 않습니다.

- NAVER API 키
- OpenAI API 키
- VAPID 키
- 사업자등록번호
- GitHub 계정
- coders.kr 계정

이 값들은 운영자가 서버에 한 번만 설정합니다. 사용자는 받을 요일을 고르고 브라우저 알림을 허용하면 됩니다.

## 뉴스의 질은 어떻게 관리하나요?

아침결은 기사 한 건을 그대로 줄여 쓰는 방식이 아닙니다.

1. NAVER API HUB 검색 결과에서 전날 기사 후보를 수집합니다.
2. 같은 URL과 비슷한 제목을 정리합니다.
3. 동일 사건을 다룬 여러 언론사의 보도를 하나의 사건군으로 묶습니다.
4. 서로 다른 출처가 두 개 이상 연결된 사건을 우선합니다.
5. OpenAI Structured Outputs로 제목·요약·중요성·핵심 사실을 정해진 형식으로 작성합니다.
6. 핵심 사실마다 **서로 독립된 출처 두 곳 이상**이 연결됐는지 다시 검사합니다. 같은 언론사의 여러 URL은 한 출처로 셉니다.
7. 문장별로 실제 근거 링크를 저장하고 카드의 `[1·2]` 같은 번호와 연결합니다.
8. 출처가 충돌하거나 근거가 부족하면 `아직 확인되지 않은 것`에 표시하거나 발행 후보에서 제외합니다.

숫자 점수만으로 정확성을 보장한다고 표현하지 않습니다. 공개 화면에서는 사용자가 직접 확인할 수 있는 문장별 근거, 1차 자료 여부, 불확실성 상태를 우선합니다. 이번 변경 이전에 만들어진 브리핑에는 문장별 근거 데이터가 없으므로 화면에 그 사실을 표시하며, 새로 생성되는 브리핑부터 근거 연결이 제공됩니다.

> 아침결은 바쁜 아침의 뉴스 탐색을 돕는 요약 서비스입니다. 투자·법률·의료·안전처럼 중요한 판단에는 반드시 연결된 원문과 공식 1차 자료를 함께 확인하세요.

현재 NAVER API HUB는 **뉴스 발견 경로**로 사용합니다. 브리핑에는 네이버 주소만 보여 주는 것이 아니라 가능한 경우 언론사 원문 주소와 출처명을 보존합니다.

현재 파이프라인은 검색 결과의 제목·설명·발행 시각·원문 링크를 중심으로 검증합니다. 유료 기사나 전문이 공개되지 않은 기사의 전체 문장을 임의로 복제하지 않습니다.

## 화면 안내

| 화면 | 용도 | 구현 상태 |
|---|---|---|
| `/` | 서비스 소개, 오늘 브리핑 미리보기, 알림 등록 | 실제 연동 |
| `/briefing` | 푸시를 눌렀을 때 열리는 모바일 뉴스 리더 | 실제 연동 |
| `/archive` | 지난 브리핑 탐색 | 일부 데모 데이터 포함 |
| `/preferences` | 관심 분야와 도착 설정 | 브라우저 저장 중심 |
| `/trust` | 뉴스 품질 기준과 투명성 설명 | 제공 중 |
| `/privacy` | 개인정보 처리 안내 | 제공 중 |
| `/terms` | 이용약관 | 제공 중 |
| `/studio` | 편집·브랜드 운영 화면 | 운영 데모 기능 포함 |

## 자주 막히는 부분

### 아이폰에 `이 기기에 알림 등록`이 안 보여요

Safari 공유 메뉴에서 **홈 화면에 추가**한 뒤, 홈 화면의 아침결 아이콘으로 다시 실행해 주세요. 일반 Safari 탭에서는 iOS 웹푸시 등록이 제한될 수 있습니다.

### 알림 권한 창이 안 떠요

이미 거절한 경우 브라우저가 다시 묻지 않을 수 있습니다.

- iPhone: `설정 → 알림 → 아침결`에서 알림을 허용합니다.
- Android: 사이트 정보 또는 Chrome 알림 설정에서 아침결을 허용합니다.
- PC: 주소창 왼쪽 사이트 설정에서 알림을 `허용`으로 변경합니다.

### 화면에는 등록됐다고 나오는데 알림이 안 와요

먼저 `내 기기 실제 푸시 테스트`를 눌러 주세요. 테스트도 오지 않으면 다음을 확인합니다.

1. 방해금지·집중 모드가 켜져 있지 않은지 확인합니다.
2. 운영체제 알림 설정에서 아침결이 허용됐는지 확인합니다.
3. PWA를 완전히 종료했다가 다시 엽니다.
4. 등록을 해지한 뒤 다시 등록합니다.

### 오전 7시 30분이 지났는데 안 왔어요

정규 발송에는 두 조건이 모두 필요합니다.

- 오늘자 실제 브리핑이 `productionReady=true` 상태일 것
- 해당 기기가 서버에 등록돼 있을 것

등록 전에는 이미 만들어진 브리핑을 보낼 주소가 없습니다. 오전 8시 이후 등록한 기기는 당일 정규 알림을 뒤늦게 받지 않고 다음 선택 요일부터 받습니다. 등록 직후에는 `[운영자 테스트]` 푸시로 기기 연결부터 확인해 주세요.

### 사이트를 열어야만 알림이 오나요?

아닙니다. 한 번 등록하면 사이트를 계속 열어 둘 필요가 없습니다. 브라우저 또는 설치된 PWA가 운영체제의 푸시 기능을 통해 알림을 받습니다.

### 앱스토어에서 앱을 설치해야 하나요?

아닙니다. 아침결은 PWA입니다. 아이폰은 Safari의 `홈 화면에 추가`, 안드로이드는 브라우저 설치 기능을 사용합니다.

### 한 사람이 여러 기기에서 받을 수 있나요?

가능합니다. 휴대전화와 PC에서 각각 등록하면 각각 하나의 활성 기기로 저장됩니다. 운영 통계는 사람 수가 아니라 활성 기기 수를 기준으로 집계합니다.

### 사용자 1,000명이면 AI 비용도 1,000배인가요?

아닙니다. 뉴스 수집과 AI 요약은 하루 브리핑을 만들 때 한 번 실행합니다. 완성된 같은 브리핑을 여러 구독자에게 보내므로 사용자 수가 늘어도 AI 생성 비용이 동일 비율로 증가하지 않습니다. 푸시 발송과 서버·데이터베이스 비용은 사용량에 따라 별도로 늘 수 있습니다.

### Codex 유료 구독이 있으면 OpenAI API도 무료인가요?

아닙니다. Codex 또는 ChatGPT 구독과 OpenAI API 사용료는 별도입니다. 운영 서버에는 별도의 `OPENAI_API_KEY`와 API 크레딧이 필요합니다.

### 결제나 후원 버튼이 있나요?

없습니다. 현재 `donations`, `subscriptions`, `support_badge`는 모두 비활성화 상태입니다.

---

# 운영자·개발자 안내

이 아래는 서비스를 직접 실행하거나 운영할 때 필요한 내용입니다. 일반 사용자는 읽지 않아도 됩니다.

## 기술 구성

- Frontend: Next.js 16, React 19, TypeScript, PWA Service Worker
- Backend: Kotlin, Spring Boot, Spring Data JPA
- Database: PostgreSQL 16, 로컬 H2 지원
- News: NAVER API HUB
- AI: OpenAI Responses API, Structured Outputs
- Push: Web Push, VAPID
- Hosting: coders.kr
- Automation: GitHub Actions

## 로컬에서 가장 빠르게 실행하기

### 준비물

- Git
- Docker Desktop와 Docker Compose
- 실제 뉴스 생성을 사용할 때만 NAVER API와 OpenAI API 키

저장소를 받은 뒤 루트에서 실행합니다.

```bash
docker compose up --build
```

실행 주소:

- 프런트엔드: [http://localhost:3000](http://localhost:3000)
- 백엔드 상태: [http://localhost:8080/actuator/health](http://localhost:8080/actuator/health)
- 최신 브리핑 API: [http://localhost:8080/api/briefings/today](http://localhost:8080/api/briefings/today)

API 키 없이 실행하면 데모 데이터로 화면을 확인할 수 있습니다.

종료:

```bash
docker compose down
```

데이터까지 제거하려면 볼륨 삭제의 영향을 이해한 뒤 별도로 실행해야 합니다. 운영 데이터베이스에는 사용하지 마세요.

## 실제 뉴스 생성 설정

`backend/.env.example`을 `backend/.env`로 복사하고 필요한 값을 입력합니다.

```env
NAVER_API_HUB_CLIENT_ID=...
NAVER_API_HUB_CLIENT_SECRET=...
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5-mini

NEWS_PIPELINE_ENABLED=true
NEWS_GENERATE_ON_STARTUP=true
DEMO_DATA_ENABLED=false

BRIEFING_ADMIN_TOKEN=충분히-긴-무작위-문자열
```

`NEWS_GENERATE_ON_STARTUP=true`는 로컬 테스트용입니다. 운영에서는 GitHub Actions와 중복 생성을 피하기 위해 `false`를 권장합니다.

## 웹푸시 설정

운영 웹푸시에는 VAPID 키 한 쌍이 필요합니다.

```env
WEB_PUSH_ENABLED=true
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=https://morningnews.coders.kr
PUBLIC_APP_URL=https://morningnews.coders.kr
```

공개키는 브라우저에 전달돼도 되지만 개인키는 GitHub나 프런트엔드 코드에 넣으면 안 됩니다.

설정 확인:

```http
GET https://morningnews.coders.kr/api/push/public-key
```

정상 응답은 HTTP 200이며 `enabled=true`여야 합니다.

## 주요 환경변수

| 변수 | 용도 | 기본값 |
|---|---|---|
| `NAVER_API_HUB_CLIENT_ID` | 뉴스 검색 클라이언트 ID | 빈 값 |
| `NAVER_API_HUB_CLIENT_SECRET` | 뉴스 검색 비밀키 | 빈 값 |
| `NAVER_API_HUB_BASE_URL` | NAVER API HUB 주소 | 공식 기본 주소 |
| `OPENAI_API_KEY` | AI 요약 | 빈 값 |
| `OPENAI_MODEL` | 요약 모델 | `gpt-5-mini` |
| `NEWS_PIPELINE_ENABLED` | 자동 뉴스 생성 활성화 | `false` |
| `NEWS_GENERATE_ON_STARTUP` | 시작 시 한 번 생성 | `false` |
| `NEWS_GENERATION_CRON` | Spring 6필드 cron | `0 0 6 * * *` |
| `DEMO_DATA_ENABLED` | 데모 브리핑 입력 | `true` |
| `BRIEFING_ADMIN_TOKEN` | 관리자 생성·발송 API 보호 | 빈 값 |
| `WEB_PUSH_ENABLED` | 실제 웹푸시 활성화 | `false` |
| `VAPID_PUBLIC_KEY` | 웹푸시 공개키 | 빈 값 |
| `VAPID_PRIVATE_KEY` | 웹푸시 개인키 | 빈 값 |
| `VAPID_SUBJECT` | 운영 주체 연락 주소 | 서비스 URL |
| `PUBLIC_APP_URL` | 알림 클릭 목적지 | 서비스 URL |
| `CORS_ALLOWED_ORIGINS` | 허용할 프런트엔드 Origin | 로컬·운영 주소 |
| `DATABASE_URL` | JDBC 데이터베이스 주소 | 인메모리 H2 |
| `DATABASE_USER` | 데이터베이스 사용자 | `sa` |
| `DATABASE_PASSWORD` | 데이터베이스 비밀번호 | 빈 값 |
| `PORT` | 백엔드 포트 | `8080` |

## 자동 운영 일정

운영 자동화 파일은 `.github/workflows/morning-briefing.yml`입니다.

- 오전 6시: 서버를 깨우고 전날 뉴스 생성 시작
- 생성 중: 10초마다 상태를 조회해 무료 호스팅이 잠들지 않도록 유지
- 오전 6시 45분: 발송 작업을 미리 시작해 서버를 깨우고 준비 상태 유지
- 오전 7시 30분: 준비된 브리핑을 등록 기기에 푸시
- 오전 8시 이후: 미발송 알림을 건너뛰어 늦은 중복 체감 방지

GitHub Actions cron은 UTC를 사용합니다.

```yaml
- cron: "0 21 * * *"   # 한국 시간 오전 6시, 뉴스 생성
- cron: "45 21 * * *"  # 한국 시간 오전 6시 45분, 서버 예열 후 7시 30분 발송
```

GitHub Actions secret과 coders.kr 운영 환경변수에는 동일한 `BRIEFING_ADMIN_TOKEN`을 등록해야 합니다.

## 관리자 API

모든 관리자 요청에는 다음 헤더가 필요합니다.

```http
X-Briefing-Admin-Token: <BRIEFING_ADMIN_TOKEN>
```

| 메서드 | 경로 | 용도 |
|---|---|---|
| `POST` | `/api/admin/briefings/generate` | 오늘자 전날 뉴스 생성 시작 |
| `POST` | `/api/admin/briefings/dispatch` | 시간이 된 구독자에게 발송 |
| `POST` | `/api/admin/briefings/run` | 생성 누락 복구 후 발송 |
| `GET` | `/api/admin/briefings/status` | 생성 상태·기사 수·활성 기기 수 확인 |

PowerShell 예시:

```powershell
$headers = @{ "X-Briefing-Admin-Token" = "운영-토큰" }

Invoke-RestMethod `
  -Method Get `
  -Uri "https://morningnews.coders.kr/api/admin/briefings/status" `
  -Headers $headers
```

관리자 토큰을 명령 기록, 로그, 이슈, README에 실제 값으로 남기지 마세요.

## 공개·사용자 API

| 메서드 | 경로 | 용도 | 인증 |
|---|---|---|---|
| `GET` | `/api/briefings/today` | 최신 브리핑 | 공개 |
| `GET` | `/api/briefings/{YYYY-MM-DD}` | 날짜별 브리핑 | 공개 |
| `POST` | `/api/stories/{storyId}/feedback` | 뉴스 피드백 | 익명 기기 ID |
| `GET` | `/api/push/session` | 기기 식별 확인 | 익명 기기 ID |
| `GET` | `/api/push/public-key` | 푸시 활성 상태·공개키 | 공개 |
| `POST` | `/api/push/subscriptions` | 푸시 등록·요일 변경(시간은 07:30 고정) | 익명 기기 ID |
| `DELETE` | `/api/push/subscriptions` | 푸시 해지 | 익명 기기 ID |
| `POST` | `/api/push/test` | 현재 기기 테스트 푸시 | 익명 기기 ID |

`X-Achim-Device`에는 브라우저가 만든 임의 UUID만 사용합니다. 이메일이나 전화번호를 익명 기기 ID로 사용하지 않습니다.

## 운영 점검 순서

1. `/api/push/public-key`가 HTTP 200이고 `enabled=true`인지 확인합니다.
2. `/api/briefings/today`의 날짜가 오늘이고 `productionReady=true`인지 확인합니다.
3. 관리자 상태 API에서 `stories`가 1개 이상인지 확인합니다.
4. `activeSubscriptions`가 1개 이상인지 확인합니다.
5. 실제 등록 기기에서 테스트 푸시를 보냅니다.
6. 오전 6시 생성 작업과 오전 6시 45분 발송 준비 작업의 GitHub Actions 결과를 확인합니다.
7. 실패 시 중복 배포하기 전에 현재 배포가 종료 상태인지 확인합니다.

## 빌드와 검사

프런트엔드:

```bash
cd frontend
pnpm install
pnpm lint
pnpm build
```

백엔드:

```bash
cd backend
mvn test
mvn -DskipTests package
```

전체 컨테이너:

```bash
docker compose build
```

## coders.kr 배포

배포 설정은 `coders.yaml`에 있습니다.

- `web`: Next.js 정적 PWA와 API 리버스 프록시
- `api`: Kotlin/Spring Boot API
- `db`: PostgreSQL
- 공개 URL: [https://morningnews.coders.kr](https://morningnews.coders.kr)

비밀키는 `coders.yaml`에 직접 작성하지 않고 coders.kr 환경변수로 등록합니다. 저장소에는 실제 API 키, 관리자 토큰, VAPID 개인키를 커밋하지 않습니다.

## 저장되는 데이터

서버 PostgreSQL:

- 날짜별 브리핑과 뉴스 카드
- 원문 출처 메타데이터
- 익명 기기 소유자 ID
- 웹푸시 endpoint와 암호화 키
- 오전 7시 30분 고정 시각·선택한 요일·한국 시간대
- 마지막 발송 시각과 오류 상태
- 뉴스 피드백

브라우저 `localStorage`:

- 임의 기기 UUID
- 오전 7시 30분 고정 발송 시각과 선택한 요일
- 서버 등록 성공을 확인하기 위한 구독 endpoint 표시값
- 일부 개인화·운영 데모 설정

현재 일반 사용자에게 이메일, 전화번호, 실명, 사업자등록번호를 요구하지 않습니다.

## 보안 원칙

- OpenAI·NAVER·VAPID 개인키는 서버 환경변수에만 둡니다.
- 관리자 API는 충분히 긴 무작위 토큰으로 보호합니다.
- 푸시 해지와 테스트는 등록 소유 기기만 실행할 수 있습니다.
- 브라우저에 전달하는 값은 VAPID 공개키뿐입니다.
- 원문 저작권을 존중하며 기사 전문을 복제하지 않습니다.
- API 오류 응답과 로그에 비밀키를 포함하지 않습니다.

## 저장소 구조

```text
.
├─ frontend/
│  ├─ app/                       # Next.js 라우트와 스타일
│  ├─ components/                # 카드·구독·운영 UI
│  ├─ lib/                       # 브리핑 데이터와 카드 렌더링
│  └─ public/                    # PWA manifest·service worker·이미지
├─ backend/
│  ├─ src/main/kotlin/kr/briefly
│  │  ├─ config/                 # CORS 등 웹 설정
│  │  ├─ domain/                 # JPA 엔티티
│  │  ├─ integration/            # NAVER·OpenAI 클라이언트
│  │  ├─ repository/             # JPA 저장소
│  │  ├─ service/                # 생성·품질검증·푸시
│  │  └─ web/                    # REST API
│  └─ src/test/kotlin/           # 백엔드 테스트
├─ .github/workflows/            # CI·Pages·아침 자동 운영
├─ compose.yaml                  # 로컬 실행
├─ coders.yaml                   # coders.kr 운영 배포
└─ README.md
```

## 현재 구현 상태

- 실제 NAVER API HUB 뉴스 수집
- OpenAI 기반 구조화 요약
- 서로 다른 출처를 이용한 사건 묶기와 품질 검사
- PostgreSQL 브리핑 저장
- PWA 설치와 실제 Web Push 등록
- 오전 7시 30분 고정 발송과 기기별 수신 요일 저장
- 실제 테스트 푸시
- 오전 6시 생성·오전 7시 30분 발송 자동화와 오전 8시 마감 안전장치
- 푸시 클릭 시 실제 뉴스 카드 열기
- 카드 이미지 내보내기
- Donate·유료 구독·후원 배지 비활성화

## 현재 한계

- 보관함과 일부 개인화 화면에는 데모 데이터가 남아 있습니다.
- 뉴스 본문 전체를 직접 크롤링하지 않고 검색 메타데이터 중심으로 처리합니다.
- 편집자 승인 워크플로 일부는 운영 데모 단계입니다.
- 카카오톡·이메일 발송은 연결돼 있지 않습니다.
- 대규모 운영 전에는 구독 정리, 실패 재시도, 모니터링과 비용 경보를 보강해야 합니다.

## 서비스 링크

- 서비스: [https://morningnews.coders.kr](https://morningnews.coders.kr)
- 오늘 브리핑: [https://morningnews.coders.kr/briefing](https://morningnews.coders.kr/briefing)
- 품질 기준: [https://morningnews.coders.kr/trust](https://morningnews.coders.kr/trust)
- 개인정보 안내: [https://morningnews.coders.kr/privacy](https://morningnews.coders.kr/privacy)

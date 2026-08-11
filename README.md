# 아침결 — 전날 뉴스를 종합해 아침에 보내는 PWA 브리핑

아침결은 **오늘 아침에 전날 00:00~23:59의 주요 뉴스를 모아**, 서로 다른 언론사의 보도를 교차 확인하고 AI로 짧게 요약한 뒤 사용자가 선택한 시각에 PWA 알림으로 전달하는 서비스입니다.

당일 속보를 계속 보내는 앱이 아닙니다. 하루 동안 쏟아진 뉴스의 소음을 걷어내고, 다음 날 아침에 꼭 알아야 할 흐름만 한 번에 읽게 하는 것이 목적입니다.

- 서비스: [https://morningnews.coders.kr](https://morningnews.coders.kr)
- GitHub: [https://github.com/boclair98/achim-gyeol](https://github.com/boclair98/achim-gyeol)
- 현재 기능 브랜치: `agent/delivery-card-deck`
- 운영 구성: Next.js PWA + Kotlin/Spring Boot/JPA + PostgreSQL
- 수익화 상태: Donate, 유료 구독, 하단 후원 배지 모두 비활성화

> 가장 중요한 답: 일반 사용자는 회원가입이나 API 키 입력을 하지 않습니다. 운영자가 뉴스·AI·푸시 API를 서버에 한 번 설정해 두면, 사용자는 알림 받을 시간과 요일을 고르고 **이 기기에 알림 등록**을 누른 뒤 브라우저 알림만 허용하면 됩니다.

## 1. 서비스가 실제로 하는 일

아침결의 하루는 아래 순서로 동작합니다.

1. 오늘 오전 7시 30분에 외부 자동 작업이 서버를 깨우고 시작됩니다.
2. 수집 대상 날짜는 오늘이 아니라 **어제 하루 전체**입니다.
3. 정책·경제·사회·테크 분야별로 NAVER API HUB 뉴스 검색 결과를 가져옵니다.
4. 같은 사건을 다룬 기사를 묶고, 서로 다른 언론사가 2곳 이상인 사건만 후보로 남깁니다.
5. OpenAI가 제목, 요약, 왜 중요한지, 핵심 사실과 근거 출처를 구조화해 작성합니다.
6. 핵심 사실마다 서로 다른 출처가 2개 이상 연결됐는지 품질 검사를 합니다.
7. 검사를 통과한 뉴스만 최대 6건으로 종합 브리핑을 발행합니다.
8. 사용자가 선택한 아침 시각이 되면 휴대폰 잠금화면·알림센터로 알림을 보냅니다.
9. 사용자가 알림을 누르면 표지, 뉴스별 AI 요약, 중요성, 출처가 들어간 카드 묶음이 열립니다.

예를 들어 화요일 오전 8시에 받는 브리핑은 월요일 00:00~23:59에 보도된 뉴스를 종합한 결과입니다.

```text
월요일 하루의 뉴스
        ↓
화요일 07:30 수집·묶기·AI 요약·교차 확인
        ↓
화요일 사용자가 선택한 시각에 PWA 알림
        ↓
알림 누르기 → 전날 뉴스 종합 카드 열기
```

자동 생성이 사용자의 선택 시각까지 끝나지 않은 경우, 오래된 브리핑을 보내지 않습니다. 오늘의 실제 생성본이 준비된 뒤 아직 발송하지 않은 사용자에게 한 번만 보냅니다. 화면 확인용 예시 브리핑도 정규 푸시 발송 대상에서 제외됩니다.

## 2. 일반 사용자 사용법 — 가장 짧은 설명

### 2.1 Android 또는 PC Chrome·Edge

1. [아침결](https://morningnews.coders.kr)을 엽니다.
2. 메인 화면에서 `ACTUAL DELIVERY` 영역까지 내려갑니다.
3. 받을 시각을 선택합니다. 기본값은 오전 8시입니다.
4. 받을 요일을 선택합니다.
5. **이 기기에 알림 등록**을 누릅니다.
6. 브라우저가 알림 허용 여부를 물으면 **허용**을 누릅니다.
7. `등록 완료` 안내가 보이면 끝입니다.

이후 브라우저를 계속 열어 둘 필요는 없습니다. 운영체제와 브라우저가 해당 사이트의 푸시 구독을 유지하고, 서버가 등록된 기기 주소로 알림을 보냅니다.

### 2.2 iPhone·iPad Safari

iOS에서는 웹사이트를 홈 화면에 설치한 뒤 푸시를 등록하는 방식이 가장 안정적입니다.

1. Safari에서 [아침결](https://morningnews.coders.kr)을 엽니다.
2. Safari의 공유 버튼을 누릅니다.
3. **홈 화면에 추가**를 선택합니다.
4. 홈 화면에 생긴 `아침결` 아이콘으로 서비스를 다시 엽니다.
5. `ACTUAL DELIVERY`에서 시간과 요일을 고릅니다.
6. **이 기기에 알림 등록**을 누릅니다.
7. 브라우저 알림을 허용합니다. 회원가입이나 로그인은 없습니다.

Safari 탭에서만 열었을 때 푸시 기능이 지원되지 않는다고 나오면, 홈 화면에 설치한 아침결 아이콘으로 다시 열었는지 먼저 확인하세요.

### 2.3 사용자가 입력하지 않아도 되는 것

일반 사용자는 아래 항목을 알거나 입력할 필요가 없습니다.

- NAVER API 키
- OpenAI API 키
- VAPID 공개키·개인키
- 관리자 생성 토큰
- 데이터베이스 주소와 비밀번호
- 서버 주소

이 값들은 모두 운영자가 배포 서버의 비밀 환경변수로 관리합니다.

## 3. 알림은 정확히 어떤 모습으로 오는가

PWA 푸시는 메일이나 카카오톡이 아닙니다. Chrome, Edge 또는 홈 화면에 설치한 Safari가 휴대폰 운영체제의 알림 기능을 통해 표시합니다.

정규 알림 예시는 다음과 같습니다.

```text
아침결 · 어제 뉴스 종합이 도착했어요
어제 핵심 뉴스 6건 · 약 6분
```

알림을 누르면 홍보·가입·설정이 섞인 메인 화면이 아니라 실제 수신용으로 분리한 카드 전용 화면이 열립니다. 홈 화면에 설치한 PWA 아이콘을 눌러도 같은 화면에서 시작합니다.

```text
https://morningnews.coders.kr/briefing/
```

운영체제 알림 자체에는 공간 제한이 있으므로 뉴스 요약 전체가 들어가지 않습니다. 알림은 “브리핑이 준비됐다”는 도착 신호이고, 뉴스별 제목·AI 요약·중요성·출처는 알림을 눌러 열린 `/briefing` 카드 묶음에서 확인합니다.

기기마다 별도로 등록해야 합니다. 휴대폰에서 등록했다고 PC에도 자동 등록되는 것은 아닙니다. 브라우저 데이터를 삭제하거나 앱을 제거하거나 시크릿 모드를 사용하면 다시 등록해야 할 수 있습니다.

## 4. 운영자인 내가 실제 푸시를 바로 테스트하는 방법

예약 시각까지 기다릴 필요가 없습니다. 운영자도 일반 사용자와 같은 실제 구독 경로로 자신의 기기를 등록한 뒤 서버 발송을 즉시 확인할 수 있습니다.

1. 테스트할 휴대폰에서 [아침결](https://morningnews.coders.kr)을 엽니다.
2. iPhone이면 먼저 홈 화면에 설치한 아침결로 엽니다.
3. `ACTUAL DELIVERY`에서 시간과 요일을 선택합니다.
4. **이 기기에 알림 등록**을 누릅니다.
5. 브라우저 알림을 **허용**합니다.
6. 초록색 `이 기기는 실제 아침 브리핑 수신 등록이 완료됐습니다` 문구를 확인합니다.
7. 새로 나타난 **내 기기 실제 푸시 테스트** 버튼을 누릅니다.
8. 휴대폰의 잠금화면 또는 알림센터를 확인합니다.
9. 알림을 눌러 카드 영역이 열리는지 확인합니다.

이 버튼은 단순히 브라우저 안에서 알림 모양만 그리는 기능이 아닙니다. 서버가 실제 Web Push 제공 경로로 현재 브라우저의 익명 기기 ID와 연결된 기기에 발송합니다.

테스트 푸시는 정규 발송 완료 기록으로 계산하지 않습니다. 오전에 테스트를 보냈더라도 해당 날짜의 정규 브리핑은 선택한 시각에 별도로 받을 수 있습니다.

### 실제 테스트와 로컬 미리보기의 차이

| 구분 | 실제 푸시 테스트 | 로컬 알림 미리보기 |
|---|---|---|
| 실행 버튼 | `내 기기 실제 푸시 테스트` | 개발용 로컬 미리보기 기능 |
| 서버 사용 | 사용 | 사용하지 않음 |
| VAPID 사용 | 사용 | 사용하지 않음 |
| 구독 소유자 확인 | 함 | 안 함 |
| 운영 검증 용도 | 적합 | 화면 모양 확인만 가능 |

운영 확인에는 반드시 **내 기기 실제 푸시 테스트**를 사용하세요.

## 5. 시간과 요일은 무엇을 뜻하는가

선택한 시간은 “뉴스 수집 시작 시각”이 아니라 “사용자에게 알림을 보내도 되는 시각”입니다.

- 뉴스 종합 자동 시작: 매일 오전 7시 30분, Asia/Seoul
- 기본 사용자 수신 시각: 오전 8시
- 선택 요일: 알림을 받는 날짜의 요일
- 수집 대상: 알림을 받는 날짜의 전날 00:00~23:59

예시:

- 화요일을 선택하면 화요일 아침에 월요일 뉴스 종합을 받습니다.
- 월~금만 선택하면 주말 아침에는 알림이 오지 않습니다.
- 월요일 알림에는 일요일 뉴스가 들어가므로 일요일 뉴스를 받고 싶다면 월요일을 선택해야 합니다.
- 모든 날의 전날 뉴스를 받고 싶다면 월~일을 전부 선택합니다.

사용자가 선택한 시각에 생성이 아직 끝나지 않았다면 예전 뉴스를 대신 보내지 않습니다. 실제 생성본이 준비된 후 발송되며, 같은 날 한 번 보낸 기기에는 중복 발송하지 않습니다.

## 6. 사이트 화면별 사용법과 실제 구현 상태

### `/briefing` — 실제 PWA 수신 카드

PWA 아이콘과 푸시 알림이 직접 여는 전송 전용 화면입니다. 서비스 소개나 가입 UI 대신 카드 덱, 카드 진행 상태, 해당 카드의 원문 링크만 보여줍니다.

- PWA manifest의 시작 화면
- 정규 푸시와 운영자 테스트 푸시의 클릭 목적지
- 표지·뉴스 요약·마지막 정리 카드 넘기기
- 뉴스별 원문 출처 바로 열기
- 알림 설정이 필요할 때만 메인 화면으로 이동

### `/` — 오늘 아침의 전날 뉴스 종합

실제 API에서 최신 브리핑을 읽어 카드와 기사 목록으로 보여주는 메인 화면입니다.

- 전날 뉴스 종합 카드 미리보기
- 표지, 뉴스별 요약, 하루 흐름 정리 카드
- 분야별 기사 필터
- 원문 출처 링크
- 1080×1350 PNG 카드 생성
- 현재 카드 저장·공유
- 전체 카드 묶음 공유
- 실제 PWA 등록·수정·해지
- 내 기기 실제 푸시 테스트

API에서 실제 자동 생성본을 아직 받지 못한 경우 예시 브리핑이 보일 수 있습니다. 이때 화면에 예시 안내가 표시되며, 예시 브리핑은 정규 푸시로 발송하지 않습니다.

### `/archive` — 보관함

날짜·분야·검색어로 브리핑을 찾아보는 사용자 경험을 보여줍니다.

현재 이 화면의 에디션 목록은 프런트엔드 데모 데이터입니다. 저장 버튼으로 선택한 항목은 해당 브라우저의 `localStorage`에만 저장됩니다. PostgreSQL의 실제 과거 브리핑 목록을 조회하는 서버 연동은 다음 단계입니다.

### `/preferences` — 개인 설정

관심 분야, 희망 분량, 시간, 요일, 채널 설정 화면입니다.

중요: 현재 이 페이지의 설정은 대부분 **브라우저 저장형 데모**입니다. 실제 PWA 예약 등록은 메인 화면의 `ACTUAL DELIVERY`에서 해야 합니다.

- PWA 실제 등록: 메인 화면에서 동작
- 관심 분야 개인화: 현재 브라우저 저장 데모
- 3개·5개·8개 분량 개인화: 현재 브라우저 저장 데모
- Email 채널: UI만 준비됨
- Kakao 채널: UI만 준비됨
- 내 데이터 받기: 브라우저에 저장된 설정을 JSON으로 다운로드
- 기기 데이터 삭제: 로컬 설정·로컬 보관함 삭제

기기 데이터 삭제 전에 실제 PWA 구독을 먼저 해지하는 것이 좋습니다. 로컬 데이터만 지우면 서버에 등록된 푸시 구독이 남을 수 있습니다.

### `/studio` — 편집·브랜드 운영 화면

화이트라벨 뉴스 서비스가 갖춰야 할 편집, 승인, 브랜드, 채널, 성과, 권한, 감사 UI를 체험하는 공간입니다.

현재 상태는 운영 제품의 화면 설계와 로컬 데모입니다. 실제 다중 사용자 CMS나 조직 권한 시스템으로 연결된 것은 아닙니다.

- 브랜드명·설명·강조색·편집자·정정 문의 저장: 브라우저 로컬 저장
- 기사 초안 편집: 브라우저 로컬 저장
- 승인·위험도·감사 로그: 데모 상태
- Web Push: 메인 화면에서 실제 동작
- Email·Kakao·Slack·Teams: 연결 준비 UI
- 분석 지표: 데모 데이터

### `/trust`, `/privacy`, `/terms`

AI 사용 고지, 품질 원칙, 개인정보 처리방침 초안, 이용약관 초안을 보여줍니다. 실제 대외 출시 전에는 변호사 또는 개인정보 담당자의 최종 검토가 필요합니다.

## 7. 카드 이미지 공유 방법

메인 화면의 카드 내보내기 기능은 웹페이지 스크린샷이 아니라 전송용 1080×1350 PNG를 새로 렌더링합니다.

- `전체 카드 공유`: 표지 + 뉴스별 카드 + 마지막 정리 카드를 한 번에 공유
- `현재 카드 저장`: 현재 보이는 카드 한 장을 PNG로 다운로드
- `현재 카드 공유`: 운영체제 공유창으로 한 장 전송
- `수신 메일 미리보기`: 반응형 HTML 이메일을 `.eml` 파일로 생성

브라우저가 여러 이미지의 직접 공유를 지원하지 않으면 PNG 파일을 다운로드하는 방식으로 자동 대체됩니다. 이 파일은 카카오톡, 문자, Slack, Teams, SNS 등에 수동으로 첨부할 수 있습니다.

PWA 푸시와 이미지 공유는 다른 기능입니다.

- PWA 푸시: 사용자 기기에 도착 알림을 자동 전송하고 `/briefing` 카드 전용 화면을 엶
- 이미지 공유: 운영자 또는 사용자가 PNG 카드 파일을 메신저 등에 직접 공유

## 8. 뉴스 수집과 AI 요약 파이프라인

### 8.1 수집 범위

기본 분야와 검색어는 다음과 같습니다.

- 정책: `정부 정책`, `복지 주거 고용 정책`
- 경제: `한국 경제 금융`, `기업 실적 공시`
- 사회: `사회 주요 뉴스`, `재난 교통 교육`
- 테크: `AI 반도체 과학 기술`, `플랫폼 개인정보 보안`

각 검색어당 최대 100개 결과를 요청하고, 게시 시각을 Asia/Seoul로 변환해 전날 날짜와 정확히 일치하는 기사만 남깁니다.

NAVER는 기사 발견 경로입니다. 카드에 연결되는 출처 URL은 검색 결과가 가리키는 원문 링크를 보존합니다. 한 언론사의 기사만으로는 자동 브리핑 후보가 되지 않습니다.

### 8.2 중복 제거와 사건 묶기

1. URL의 쿼리 문자열을 제거해 동일 기사 중복을 줄입니다.
2. 제목을 한글·영문·숫자 토큰으로 정규화합니다.
3. 일반적인 단어와 불용어를 제거합니다.
4. 토큰 포함도와 Dice 계수, 문자 bigram 유사도를 함께 계산합니다.
5. 제목 유사도가 기준 이상인 기사를 같은 사건으로 묶습니다.
6. 서로 다른 언론사가 2곳 미만이면 후보에서 제외합니다.
7. 한 사건에서는 최대 6개 독립 출처를 AI 입력으로 사용합니다.

### 8.3 AI 구조화 결과

OpenAI 요약기는 일반 자유문 대신 구조화된 결과를 만듭니다.

- 카드 제목
- 짧은 종합 요약
- 왜 중요한가
- 핵심 사실 목록
- 각 핵심 사실의 출처 ID
- 출처 간 충돌 여부
- 남아 있는 불확실성

각 핵심 사실은 입력 기사에 부여한 `S1`, `S2` 같은 출처 ID를 사용해야 하며, 서로 다른 유효 출처 2개 이상이 연결되지 않으면 품질 검사를 통과하지 못합니다.

### 8.4 자동 발행 품질 기준

- 서로 다른 언론사 2곳 이상
- 모든 핵심 사실에 유효한 출처 2개 이상
- 출처 충돌 시 자동 발행 차단
- 공식 자료 URL이 있으면 품질 점수에 반영
- 출처 URL과 게시 시각 보존
- 최대 후보 8개를 검토하고 최종 최대 6개 발행
- 기준을 통과한 뉴스가 하나도 없으면 빈 브리핑을 억지로 발행하지 않고 생성 실패 처리

“AI가 썼으니 정확하다”는 전제를 사용하지 않습니다. 이 파이프라인은 오보 가능성을 줄이는 장치이며, 법률·의료·금융·정치처럼 위험도가 높은 영역의 완전 자동 발행을 보증하는 장치는 아닙니다.

## 9. 운영자 일일 점검 순서

매일 운영자가 확인할 최소 항목입니다.

1. 오전 7시 30분 이후 메인 화면을 새로고침합니다.
2. 화면 상단의 브리핑 날짜가 오늘인지 확인합니다.
3. 예시 브리핑 안내가 사라졌는지 확인합니다.
4. 각 뉴스에 서로 다른 출처가 2개 이상인지 확인합니다.
5. 제목과 요약이 출처 내용보다 과장되지 않았는지 확인합니다.
6. 숫자, 날짜, 사람 이름, 기관 이름을 원문과 대조합니다.
7. `왜 중요한가`가 사실과 전망을 섞지 않았는지 확인합니다.
8. 자신의 운영자 기기에서 **내 기기 실제 푸시 테스트**를 누릅니다.
9. 잠금화면 수신과 알림 클릭 이동을 확인합니다.
10. 문제가 있으면 정규 사용자 홍보 전에 생성 작업과 API 키 상태를 점검합니다.

최초 출시 단계에서는 사람이 매일 브리핑을 한 번 검수하는 운영을 권장합니다.

## 10. 관리자 수동 뉴스 생성

운영 자동화는 매일 오전 7시 30분에 서버를 깨워 전날 뉴스를 수집하고 OpenAI로 비동기 요약합니다. GitHub Actions가 10초마다 생성 상태를 확인하므로 무료 호스팅 서버가 작업 도중 잠들지 않습니다. 오전 8시에는 오늘 브리핑이 준비됐는지 다시 확인하고, 누락됐으면 생성 완료까지 기다린 다음 푸시를 발송합니다.

자동화 파일은 `.github/workflows/morning-briefing.yml`입니다. GitHub 저장소의 Actions secret과 coders.kr 운영 환경변수에 **같은** `BRIEFING_ADMIN_TOKEN`을 등록해야 합니다.

```http
POST /api/admin/briefings/generate
X-Briefing-Admin-Token: <BRIEFING_ADMIN_TOKEN>
```

로컬 PowerShell 예시:

```powershell
$headers = @{ "X-Briefing-Admin-Token" = "로컬-env에-설정한-값" }
Invoke-RestMethod -Method Post -Uri "http://localhost:8080/api/admin/briefings/generate" -Headers $headers
```

운영자 브라우저의 개발자 콘솔에서 배포 서버를 호출하는 예시:

```javascript
fetch("/api/admin/briefings/generate", {
  method: "POST",
  headers: { "X-Briefing-Admin-Token": "서버에-등록한-관리자-토큰" }
}).then((response) => response.json()).then(console.log)
```

주의:

- 관리자 토큰을 Git, README, 프런트엔드 코드에 넣지 마세요.
- 화면 녹화나 스크린샷에 토큰이 보이지 않게 하세요.
- 관리자 생성 API는 일반 푸시 등록과 달리 `BRIEFING_ADMIN_TOKEN`이 반드시 필요합니다.
- 토큰을 잃어버렸다면 기존 값을 알아내려고 하지 말고 새 토큰으로 서버 환경변수를 교체한 뒤 다시 배포하세요.
- 같은 날짜에 다시 생성하면 해당 날짜의 기존 기사 묶음을 새 결과로 교체합니다.

성공 응답에는 다음 값이 포함됩니다.

```json
{
  "briefingDate": "2026-08-11",
  "coverageDate": "2026-08-10",
  "collectedArticles": 120,
  "candidateClusters": 8,
  "publishedStories": 6
}
```

숫자는 예시이며 실제 뉴스량과 품질 기준 통과 건수에 따라 달라집니다.

운영 자동화용 엔드포인트:

- `POST /api/admin/briefings/generate`: 전날 뉴스 수집·AI 요약·품질 검증·저장
- `POST /api/admin/briefings/dispatch`: 준비된 오늘 브리핑을 발송 시간이 된 구독자에게 전송
- `POST /api/admin/briefings/run`: 오늘 브리핑이 없으면 먼저 생성하고 이어서 발송
- `GET /api/admin/briefings/status`: 오늘 생성 상태, 기사 수, 활성 푸시 구독 수 확인

모든 운영 엔드포인트는 `X-Briefing-Admin-Token` 헤더가 필요합니다. 오전 8시 GitHub Actions 작업은 실패 복구를 위해 `run`을 호출합니다.

## 11. API 목록

| 메서드 | 경로 | 용도 | 인증 |
|---|---|---|---|
| `GET` | `/api/briefings/today` | 최신 브리핑 | 공개 읽기 |
| `GET` | `/api/briefings/{YYYY-MM-DD}` | 날짜별 브리핑 | 공개 읽기 |
| `POST` | `/api/stories/{storyId}/feedback` | 오류·편향·불명확·도움됨 피드백 | 익명 기기 ID |
| `GET` | `/api/push/session` | 현재 기기 식별 여부 | 익명 기기 ID |
| `GET` | `/api/push/public-key` | 웹푸시 활성 상태와 VAPID 공개키 | 공개 읽기 |
| `POST` | `/api/push/subscriptions` | 현재 기기 푸시 구독 등록·시간 변경 | 익명 기기 ID |
| `DELETE` | `/api/push/subscriptions` | 현재 기기 푸시 해지 | 익명 기기 ID |
| `POST` | `/api/push/test` | 현재 기기에 실제 테스트 발송 | 익명 기기 ID |
| `POST` | `/api/admin/briefings/generate` | 전날 뉴스 수동 생성 | 관리자 토큰 |
| `POST` | `/api/admin/briefings/dispatch` | 발송 시간이 된 구독자에게 푸시 발송 | 관리자 토큰 |
| `POST` | `/api/admin/briefings/run` | 생성 누락 복구 후 푸시 발송 | 관리자 토큰 |
| `GET` | `/api/admin/briefings/status` | 생성 상태·기사 수·활성 구독 수 점검 | 관리자 토큰 |

`GET /api/briefings/today` 핵심 필드:

```json
{
  "id": 10,
  "briefingDate": "2026-08-11",
  "productionReady": true,
  "dateLabel": "8월 11일 화요일",
  "lead": "8월 10일 보도 중 서로 다른 출처에서 공통으로 확인된 핵심만 정리했습니다.",
  "readMinutes": 6,
  "verifiedCount": 6,
  "lastVerifiedAt": "오전 6:22",
  "stories": []
}
```

`productionReady`가 `true`인 브리핑만 정규 PWA 발송 대상입니다.

피드백 요청 예시:

```json
{
  "type": "INCORRECT",
  "detail": "기사 원문의 날짜와 요약 날짜가 다릅니다."
}
```

지원 피드백 종류:

- `INCORRECT`
- `BIASED`
- `UNCLEAR`
- `HELPFUL`

푸시 구독 본문은 브라우저가 자동으로 만듭니다. 일반 사용자가 endpoint, `p256dh`, `auth` 값을 직접 작성할 필요가 없습니다.

## 12. 필요한 외부 API와 계정

### 필수

1. **NAVER API HUB 뉴스 검색**
   - 전날 기사 후보 수집
   - `NAVER_API_HUB_CLIENT_ID`
   - `NAVER_API_HUB_CLIENT_SECRET`

2. **OpenAI API**
   - 사건별 구조화 요약과 핵심 사실·출처 연결
   - `OPENAI_API_KEY`
   - 기본 모델 `gpt-5-mini`

3. **Web Push VAPID 키**
   - 휴대폰·브라우저 푸시 발송
   - `VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`
   - `VAPID_SUBJECT`

4. **PostgreSQL**
   - 브리핑, 기사, 출처, 피드백, 푸시 구독 저장
   - coders.kr 배포에서는 `coders.yaml`의 `db` 서비스가 연결 정보를 주입

OpenAI API 사용료는 Codex 또는 ChatGPT 구독과 별도입니다. 일반 사용자에게 OpenAI 키를 받는 방식이 아니라 운영자 서버가 한 번 요약한 결과를 여러 사용자에게 재사용하는 구조이므로, 사용자 1명마다 같은 뉴스를 다시 AI 요약하지 않습니다.

### 선택 또는 향후 연결

- Email SMTP/ESP: 아직 실제 발송 미연결
- Kakao 비즈메시지: 아직 실제 발송 미연결
- Slack/Teams: 아직 실제 발송 미연결
- YouTube Data API: 환경변수 자리만 있고 현재 파이프라인에서 사용하지 않음
- 공공 1차 자료 API: 품질 향상을 위한 다음 단계

## 13. 환경변수 전체 설명

`backend/.env.example`을 기준으로 설정합니다.

| 변수 | 필수 시점 | 설명 | 안전한 로컬 기본값 |
|---|---|---|---|
| `NAVER_API_HUB_CLIENT_ID` | 실제 뉴스 생성 | NAVER API HUB 클라이언트 ID | 빈 값 |
| `NAVER_API_HUB_CLIENT_SECRET` | 실제 뉴스 생성 | NAVER API HUB 비밀키 | 빈 값 |
| `NAVER_API_HUB_BASE_URL` | 선택 | 기본 API 주소를 바꿀 때만 사용 | 공식 기본 주소 |
| `OPENAI_API_KEY` | 실제 뉴스 생성 | OpenAI API 비밀키 | 빈 값 |
| `OPENAI_MODEL` | 실제 뉴스 생성 | 구조화 요약 모델 | `gpt-5-mini` |
| `NEWS_PIPELINE_ENABLED` | 예약 생성 | 매일 스케줄러 활성화 | `false` |
| `NEWS_GENERATE_ON_STARTUP` | 선택 | 서버 시작 즉시 한 번 생성 | `false` |
| `NEWS_GENERATION_CRON` | 선택 | Spring 6필드 cron | `0 15 6 * * *` |
| `DEMO_DATA_ENABLED` | 로컬 데모 | 샘플 브리핑 DB 입력 | `true` |
| `BRIEFING_ADMIN_TOKEN` | 운영 자동화 | 생성·상태·발송 엔드포인트 토큰. GitHub Actions secret과 동일 값 | 빈 값 |
| `WEB_PUSH_ENABLED` | 실제 푸시 | 웹푸시 서비스 활성화 | `false` |
| `VAPID_PUBLIC_KEY` | 실제 푸시 | 브라우저에 전달 가능한 공개키 | 빈 값 |
| `VAPID_PRIVATE_KEY` | 실제 푸시 | 서버 전용 개인키 | 빈 값 |
| `VAPID_SUBJECT` | 실제 푸시 | 운영자 연락 주체 URL 또는 메일 | 서비스 URL |
| `PUBLIC_APP_URL` | 실제 푸시 | 알림 클릭 시 열 서비스 주소 | 서비스 URL |
| `CORS_ALLOWED_ORIGINS` | 분리 개발 | 프런트엔드 허용 origin | `http://localhost:3000` |
| `DATABASE_URL` | 운영 DB | JDBC PostgreSQL 주소 | 메모리 H2 |
| `DATABASE_USER` | 운영 DB | DB 사용자 | `sa` |
| `DATABASE_PASSWORD` | 운영 DB | DB 비밀번호 | 빈 값 |
| `PORT` | 선택 | 백엔드 포트 | `8080` |
| `YOUTUBE_API_KEY` | 현재 불필요 | 향후 영상 연결용 예약 값 | 빈 값 |

배포 서버에서는 실제 비밀값을 `coders.yaml`이나 GitHub 파일에 쓰지 않습니다. coders.kr 프로젝트의 비밀 환경변수 기능으로만 주입합니다.

## 14. 로컬에서 가장 쉽게 실행하기

### 준비물

- Docker Desktop
- Git

Docker 방식이면 로컬에 Java, Maven, Node.js, pnpm을 따로 설치하지 않아도 됩니다.

### 14.1 샘플 뉴스로 실행

저장소 루트에서 다음 명령을 실행합니다.

```bash
docker compose up --build
```

접속 주소:

- 프런트엔드: [http://localhost:3000](http://localhost:3000)
- 최신 브리핑 API: [http://localhost:8080/api/briefings/today](http://localhost:8080/api/briefings/today)
- 백엔드 상태: [http://localhost:8080/actuator/health](http://localhost:8080/actuator/health)

기본 로컬 설정은 샘플 데이터를 켜고 실제 뉴스 파이프라인과 실제 웹푸시는 끕니다.

### 14.2 로컬에서 실제 뉴스 생성

1. `backend/.env.example`을 `backend/.env`로 복사합니다.
2. 실제 키를 `backend/.env`에 입력합니다.
3. 다음 값을 바꿉니다.

```env
NAVER_API_HUB_CLIENT_ID=...
NAVER_API_HUB_CLIENT_SECRET=...
OPENAI_API_KEY=...
NEWS_PIPELINE_ENABLED=true
NEWS_GENERATE_ON_STARTUP=true
DEMO_DATA_ENABLED=false
BRIEFING_ADMIN_TOKEN=충분히-긴-무작위-문자열
```

4. 다시 빌드합니다.

```bash
docker compose up --build
```

`NEWS_GENERATE_ON_STARTUP=true`이면 백엔드가 시작될 때 전날 뉴스 생성을 한 번 실행합니다. 개발 편의를 위한 옵션이므로 운영에서는 중복 호출을 피하기 위해 `false`를 권장합니다.

### 14.3 컨테이너 없이 직접 실행

필요 도구:

- Java 21
- Maven 3.9 이상
- Node.js 22
- pnpm 11.16
- PostgreSQL 또는 기본 H2

백엔드:

```bash
cd backend
mvn spring-boot:run
```

프런트엔드:

```bash
cd frontend
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

프런트엔드 개발 서버를 직접 실행하면 `/api` 프록시가 없으므로 API 주소 구성이 추가로 필요할 수 있습니다. 전체 동작 확인에는 Docker Compose 구성을 권장합니다.

## 15. 테스트와 빌드 검증

프런트엔드:

```bash
cd frontend
pnpm lint
pnpm build
```

백엔드:

```bash
cd backend
mvn test
```

백엔드 테스트에는 다음 품질 검증이 포함됩니다.

- 기사 제목 유사도와 사건 묶기
- 서로 다른 출처 수 기준
- 품질 게이트 판정
- 프런트엔드와 서버의 월요일 시작 요일 인덱스 일치
- 선택 시각 이후 생성이 끝나도 당일 발송 가능한지

## 16. coders.kr 배포 방법

현재 배포 대상은 `morningnews` 프로젝트와 다음 주소입니다.

```text
https://morningnews.coders.kr
```

오타가 있던 `moring-news`가 아니라 `morningnews`입니다.

배포 설정은 루트의 `coders.yaml`에 있습니다.

```yaml
version: "1"
mode: standalone

services:
  web:
    dockerfile: frontend/Dockerfile
    context: frontend
    port: 80
    expose: public
    env:
      BACKEND_URL: ${api.internal_url}

  api:
    dockerfile: backend/Dockerfile
    context: backend
    port: 8080
    env:
      DATABASE_URL: jdbc:postgresql://${db.host}:${db.port}/${db.name}
      DATABASE_USER: ${db.user}
      DATABASE_PASSWORD: ${db.password}
      NEWS_PIPELINE_ENABLED: "true"
      NEWS_GENERATE_ON_STARTUP: "false"
      DEMO_DATA_ENABLED: "false"
      OPENAI_MODEL: "gpt-5-mini"
      WEB_PUSH_ENABLED: "true"
      PUBLIC_APP_URL: "https://morningnews.coders.kr"

  db:
    type: postgres
    size: 1Gi
```

배포 순서:

1. GitHub 저장소를 Public 또는 플랫폼이 접근 가능한 상태로 둡니다.
2. 배포 저장소를 `https://github.com/boclair98/achim-gyeol`로 지정합니다.
3. 배포 브랜치를 `agent/delivery-card-deck`으로 지정합니다. 기본 `main`에 최신 기능이 없을 수 있으므로 브랜치를 꼭 확인합니다.
4. coders.kr 프로젝트 비밀 환경변수에 NAVER, OpenAI, VAPID, 관리자 토큰을 등록합니다.
5. `morningnews` 프로젝트로 배포합니다.
6. 상태가 `queued`이면 새 배포를 중복 생성하지 말고 기다립니다.
7. `building`, `deploying`을 거쳐 `ready`가 될 때까지 확인합니다.
8. 아래 공개 검증을 실행합니다.

```text
GET https://morningnews.coders.kr/api/push/public-key
GET https://morningnews.coders.kr/api/briefings/today
```

웹푸시 정상 응답 예시:

```json
{
  "enabled": true,
  "publicKey": "..."
}
```

브리핑 API에서는 `briefingDate`가 오늘이고 `productionReady`가 `true`인지 확인합니다.

배포 상세 규칙은 [coders.kr 사용 안내](https://coders.kr/how-to-use)와 [AI용 배포 문서](https://coders.kr/llms.txt)를 함께 참고합니다.

### Donate 비활성화

이 서비스는 현재 결제를 받지 않습니다.

- coders.kr donations: `false`
- subscriptions: `false`
- support badge: `false`
- 프런트엔드의 후원 위젯·후원 링크: CSS에서도 숨김

플랫폼 설정을 바꿀 때 이 세 값을 다시 켜지 않도록 확인하세요.

## 17. 저장되는 데이터와 개인정보 범위

### PostgreSQL에 저장

- 브리핑 날짜와 발행 상태
- 뉴스 제목·요약·왜 중요한가
- 출처 언론사·URL·게시 시각
- 사용자 피드백
- 웹푸시 구독 endpoint와 암호화 키
- 구독 소유자 ID
- 선택 시간·요일·시간대
- 마지막 정규 발송 시각
- 최근 발송 오류

푸시 endpoint는 브라우저 푸시 제공자가 발급한 기기별 주소입니다. 서버에서는 endpoint의 SHA-256 해시를 인덱스로 사용하고, 실제 발송을 위해 원본 endpoint와 공개 암호화 키를 보관합니다.

### 브라우저 `localStorage`에 저장

- `achim-gyeol-delivery`: 메인 화면 시간·요일
- `achim-gyeol-reader-preferences`: 개인 설정 데모
- `achim-gyeol-saved-editions`: 저장한 보관함 데모
- `achim-gyeol-brand`: 브랜드 설정 데모
- `achim-gyeol-editorial`: 편집 상태 데모
- `achim-gyeol-story-drafts`: 기사 초안 데모
- `achim-gyeol-permission-rules`: 권한 정책 데모

브라우저 로컬 데이터 삭제는 서버의 푸시 구독 해지와 같지 않습니다. 알림을 완전히 멈추려면 메인 화면에서 **알림 해지**를 먼저 누르세요.

## 18. 자주 발생하는 문제

### 등록 버튼을 누르니 예전 로그인 화면으로 이동합니다

이전 PWA 캐시가 남은 상태입니다. 최신 버전은 회원가입 없이 익명 기기 ID로 등록합니다. Safari 탭과 설치된 아침결을 모두 종료한 뒤 다시 열어 주세요. 계속되면 기존 홈 화면 아이콘을 삭제하고 Safari에서 다시 홈 화면에 추가합니다.

### “API” 또는 “예시 브리핑” 안내가 보입니다

일반 사용자가 API 키를 넣으라는 뜻이 아닙니다. 실제 브리핑 서버 응답을 아직 가져오지 못했거나, 오늘의 전날 뉴스 자동 생성본이 아직 준비되지 않았다는 운영 상태 안내입니다.

운영자는 다음을 확인합니다.

1. `/api/briefings/today`가 HTTP 200인지
2. `briefingDate`가 오늘인지
3. `productionReady`가 `true`인지
4. NAVER와 OpenAI 비밀 환경변수가 새 프로젝트에 등록됐는지
5. 배포 브랜치가 `agent/delivery-card-deck`인지

### 등록 버튼이 보이지만 알림 허용 창이 안 뜹니다

- 이전에 알림을 차단했을 수 있습니다.
- 주소창의 사이트 설정에서 알림을 `허용`으로 바꿉니다.
- iPhone은 홈 화면에 설치한 아침결에서 다시 시도합니다.
- 시크릿 모드가 아닌 일반 브라우저에서 시도합니다.

### 테스트 버튼이 보이지 않습니다

테스트 버튼은 이 기기의 푸시 구독이 성공한 뒤에만 나타납니다. 먼저 **이 기기에 알림 등록**을 완료하세요.

### 테스트 성공 안내는 나오는데 알림이 안 보입니다

1. 휴대폰 전체 알림 설정에서 Chrome·Safari 또는 아침결 알림이 허용됐는지 확인합니다.
2. 방해 금지, 집중 모드, 절전 모드를 확인합니다.
3. 이미 화면을 보고 있을 때 알림이 알림센터에만 쌓였는지 확인합니다.
4. 브라우저 사이트 설정에서 알림 권한을 확인합니다.
5. 알림을 해지한 뒤 다시 등록하고 테스트합니다.

### 선택 시각이 지났는데 정규 알림이 안 옵니다

- 오늘의 실제 생성본이 아직 준비되지 않았을 수 있습니다.
- 선택한 요일이 오늘을 포함하는지 확인합니다.
- 해당 기기에서 이미 오늘 한 번 받았는지 확인합니다.
- `/api/briefings/today`의 `productionReady`를 확인합니다.
- 서버 로그에서 `today's pipeline-generated briefing is not ready` 또는 push 오류를 확인합니다.

### 월요일을 골랐는데 다른 요일에 옵니다

프런트엔드와 서버 모두 `월=0, 화=1, ... 일=6` 순서를 사용합니다. 최신 브랜치가 배포됐는지 확인하세요. 이전 버전에는 요일 기준이 어긋날 수 있는 문제가 있었습니다.

### 카드 공유를 눌렀는데 다운로드됩니다

해당 브라우저가 여러 파일 Web Share를 지원하지 않으면 정상적으로 다운로드 방식으로 대체됩니다. 저장된 PNG를 원하는 메신저에 첨부하세요.

### `GET /api/briefings/today`가 404입니다

- DB에 발행된 브리핑이 없습니다.
- 운영에서 `DEMO_DATA_ENABLED=false`인데 실제 생성도 아직 성공하지 않았을 수 있습니다.
- NAVER/OpenAI 키와 생성 로그를 확인합니다.
- 관리자 수동 생성을 실행해 결과를 확인합니다.

### 실제 생성이 “교차 검증 기준을 통과한 뉴스가 없습니다”로 실패합니다

- 전날 날짜 필터에 맞는 기사가 충분한지 확인합니다.
- 같은 사건에 서로 다른 언론사 2곳 이상이 있는지 확인합니다.
- 검색어가 너무 좁지 않은지 확인합니다.
- NAVER 응답의 게시 시각과 원문 링크가 정상인지 확인합니다.
- AI 응답의 각 핵심 사실에 유효 출처 ID가 2개 이상 연결됐는지 확인합니다.

### 배포가 `queued`에 오래 머뭅니다

플랫폼 배포 대기열 상태입니다. 같은 커밋을 반복 배포하면 대기 작업만 늘 수 있으므로 기존 작업이 종료될 때까지 기다린 뒤 상태를 다시 확인합니다.

### 배포는 성공했는데 예전 화면입니다

1. 배포 브랜치가 최신 기능 브랜치인지 확인합니다.
2. 서비스 워커 캐시가 갱신되도록 페이지를 완전히 새로고침합니다.
3. PWA를 종료한 뒤 다시 엽니다.
4. 필요하면 사이트 데이터를 지우고 재설치합니다. 이 경우 푸시도 다시 등록해야 합니다.

## 19. FAQ

### 사용자는 앱스토어에서 앱을 받아야 하나요?

아니요. PWA라서 웹주소로 먼저 접속합니다. Android·PC에서는 브라우저로 바로 쓸 수 있고, iPhone 푸시는 홈 화면에 추가한 뒤 사용하는 방식입니다.

### 등록 버튼만 누르면 끝인가요?

네. Android·PC는 버튼을 누르고 운영체제 알림만 허용하면 끝입니다. 아이폰은 iOS 정책상 최초 한 번 홈 화면에 추가해야 하지만 회원가입, 로그인, API 키 입력, 결제는 없습니다.

### 메일로 오나요?

현재 자동 전달은 PWA 알림입니다. 메일 미리보기 파일은 만들 수 있지만 실제 이메일 발송 서버는 아직 연결하지 않았습니다.

### 카카오톡으로 오나요?

아직 아닙니다. 카카오 비즈메시지는 비즈 앱, 채널, 템플릿 심사와 별도 API 연결이 필요합니다.

### 네이버 뉴스만 요약하나요?

현재 기사 발견은 NAVER API HUB 검색을 사용합니다. 다만 동일 사건을 서로 다른 언론사 2곳 이상에서 확인하고 원문 링크를 보존합니다. 장기적으로 공공기관·공시·통계 같은 1차 자료 API를 추가하는 것이 좋습니다.

### 한 명이 여러 기기에서 받을 수 있나요?

가능합니다. 각 기기에서 각각 등록해야 합니다.

### 사용자 1,000명이면 AI 비용도 1,000배인가요?

아닙니다. 뉴스 요약은 하루에 한 번 생성해 DB에 저장하고 모든 사용자에게 같은 결과를 제공합니다. 사용자가 늘면 주로 푸시 발송량과 서버·DB 사용량이 증가하고, 같은 브리핑을 사용자별로 다시 OpenAI에 요청하지 않습니다.

### Codex 유료 구독이 있으면 OpenAI API도 무료인가요?

아닙니다. Codex/ChatGPT 구독과 OpenAI API 사용량은 별도입니다.

### 운영자 테스트가 그날 정규 발송을 막나요?

아니요. 실제 푸시 테스트는 연결 확인용이며 정규 발송 완료 시각으로 기록하지 않습니다.

### 후원이나 결제 버튼이 있나요?

현재 모두 꺼져 있습니다. Donate, subscription, support badge를 플랫폼과 프런트엔드 양쪽에서 비활성화합니다.

## 20. 현재 한계와 다음 개발 우선순위

실제 동작:

- 전날 NAVER 뉴스 수집
- 사건 묶기와 서로 다른 출처 2곳 이상 확인
- OpenAI 구조화 요약
- 품질 게이트
- PostgreSQL 저장
- 메인 화면 API 조회
- PWA 등록·변경·해지
- 정규 예약 푸시
- 오전 7시 30분 외부 생성 작업과 오전 8시 누락 복구·발송 작업
- 운영자 실제 푸시 테스트
- PNG 카드 생성·공유

현재 데모 또는 미연결:

- `/archive` 실제 DB 과거 브리핑 연동
- `/preferences` 관심 분야·분량 서버 개인화
- `/studio` 실제 조직 계정·역할·승인 워크플로
- Email 자동 발송
- Kakao 비즈메시지 자동 발송
- Slack/Teams 자동 발송
- 운영자용 서버 로그·생성 상태 대시보드
- 사용자별 열람·원문 클릭 분석
- 뉴스 정정의 실제 공개 이력 API

다음 개발 권장 순서:

1. 생성 실행 이력과 실패 사유를 DB에 저장하는 운영 대시보드
2. 실제 과거 브리핑 API와 `/archive` 연결
3. 사용자의 관심 분야·분량을 서버 구독 정보와 통합
4. 관리자 승인 후 발송하는 발행 잠금 기능
5. 공공기관·공시·통계 등 1차 자료 연결
6. 개인정보 문서와 정정 프로세스 법률 검토
7. 모니터링·오류 알림·비용 한도 설정
8. 필요할 때만 Email 또는 Kakao 채널 추가

## 21. 저장소 구조

```text
.
├─ frontend/
│  ├─ app/                 # Next.js 페이지·PWA manifest·스타일
│  ├─ components/          # 독자 화면·카드·푸시·스튜디오
│  ├─ lib/                 # 브리핑 타입·카드 렌더러·메일 템플릿
│  ├─ public/sw.js         # 서비스 워커·푸시 수신·알림 클릭
│  ├─ Dockerfile           # 정적 빌드 후 nginx 제공
│  └─ nginx.conf.template  # /api를 Spring Boot로 프록시
├─ backend/
│  ├─ src/main/kotlin/
│  │  ├─ domain/           # JPA 엔티티
│  │  ├─ repository/       # Spring Data JPA
│  │  ├─ integration/      # NAVER·OpenAI 클라이언트
│  │  ├─ service/          # 생성·품질·푸시 로직
│  │  └─ web/              # REST API
│  ├─ src/test/kotlin/     # 품질·클러스터·푸시 일정 테스트
│  ├─ .env.example         # 로컬 환경변수 템플릿
│  ├─ pom.xml              # Java 21·Kotlin·Spring Boot
│  └─ Dockerfile
├─ compose.yaml            # 로컬 web/api/PostgreSQL
├─ coders.yaml             # coders.kr 배포 구성
└─ README.md
```

## 22. 기술 스택

- Frontend: Next.js 16.2, React 19.2, TypeScript, PWA, Canvas PNG 렌더링
- Backend: Java 21, Kotlin 2.2.21, Spring Boot 4.1, Spring Data JPA
- Database: PostgreSQL 16, 로컬 기본 H2 지원
- Push: 표준 Web Push + VAPID
- News: NAVER API HUB
- AI: OpenAI API Structured Outputs
- Deploy: Docker, nginx, coders.kr standalone mode
- CI: GitHub Actions 프런트엔드 lint/build + 백엔드 test

## 23. 보안 원칙

- 모든 실제 비밀키는 서버 환경변수로만 관리합니다.
- 비밀키를 Git 커밋, 이슈, PR, README, 화면 코드에 넣지 않습니다.
- VAPID 개인키는 브라우저에 전달하지 않습니다.
- 프런트엔드에는 공개 VAPID 키만 제공합니다.
- 푸시 구독은 브라우저가 만든 무작위 익명 기기 ID와 묶어 다른 기기의 테스트 발송을 막습니다.
- 관리자 생성 토큰은 상수 시간 비교로 검증합니다.
- 테스트 발송은 정규 발송 완료 기록을 변경하지 않습니다.
- 실제 자동 생성본이 아닌 예시 데이터는 정규 푸시로 발송하지 않습니다.
- 만료되거나 삭제된 푸시 endpoint가 404·410을 반환하면 구독을 비활성화합니다.

이 README는 현재 구현과 데모 범위를 의도적으로 구분합니다. 화면에 준비된 기능과 실제 서버에서 동작하는 기능을 같은 것으로 오해하지 않는 것이 안정적인 출시의 첫 단계입니다.

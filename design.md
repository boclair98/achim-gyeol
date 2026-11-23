# OpenUI Design Plan

## 2026-11-23 update · Figma 호출 한도에 따라 Stitch로 명세 이관

- 사용자가 Figma Starter 호출 한도에 막혔을 때 다른 워크스페이스로 새 파일을 만드는 대신 “피그마 그 프롬포트를 스티치에게 던져”라고 방향을 바꿨다. 이에 Figma용 사용자 흐름·토큰·기사 행/상세/상태 컴포넌트 명세를 별도 비공개 Stitch 프로젝트로 옮겼다. 새 Stitch 프로젝트 URL: https://stitch.google.com/projects/15853706971965818670. 기존 프로젝트/보드는 수정하지 않았다.
- Figma의 빈 새 파일 `아침결 뉴스 읽기 — 컴포넌트와 웹 시안`(file key `22ILzj6UM8xcfSbKkdlnZi`)과 토큰/컴포넌트 9개는 Starter 팀에서 생성되었지만, 첫 캡처에서 컴포넌트 샘플이 서로 겹쳤다. Figma MCP가 추가 호출을 막아 수정·재검수가 불가능했고, 사용자가 Stitch로 진행하라고 바꾼 뒤 Figma 작업을 중단했다. 이 파일은 완료 산출물이 아니며 운영 코드에 연결하지 않는다.
- Stitch에서는 기존 화면 생성을 확인하고, 날짜·기사 수·읽기 시간·발송 시각·무단 생성 사진이 들어간 초기 모바일 목록을 정제한 별도 모바일 화면을 만들었다. 최종 Stitch 산출물: [정제된 모바일 목록](https://stitch.google.com/projects/15853706971965818670?node-id=1085e3ece7714255b338e8a11f5029ff), [데스크톱 목록](https://stitch.google.com/projects/15853706971965818670?node-id=1f8de62117204545b77c8724152cb1a0), [모바일 기사 상세](https://stitch.google.com/projects/15853706971965818670?node-id=19b8ce1ba2e14de28f03d7ee945fb368), [데스크톱 기사 상세](https://stitch.google.com/projects/15853706971965818670?node-id=569a26504c494060a5a113f1dbe7ece7), [컴포넌트 명세 보드](https://stitch.google.com/projects/15853706971965818670?node-id=5f8f370a11a1485ab1e6f56222fb1bcc). Stitch 도구는 ready 상태와 캔버스/PNG 주소를 반환했으나, 현재 세션은 원격 PNG를 미리보기로 열지 못해 시각 픽셀 검수는 미완료다. 캔버스 안의 실제 문구·크롭·모바일/PC 마감은 사용자가 화면에서 확인할 필요가 있다.
- 참고 화면은 [다음 국제](https://news.daum.net/world), [Investing.com 경제](https://kr.investing.com/news/economy), [The Guardian 국제](https://www.theguardian.com/international), [The Guardian의 벵가지 보도](https://www.theguardian.com/world/2026/nov/22/blast-russian-ship-suspected-drone-attack-benghazi-libya)를 열어 분야 탐색, 대표/보조 기사 위계, 제목·출처·시점, 불확실성 표기를 참고했다. 사용자가 준 BBC 코리아·연합뉴스 국제는 robots/restricted 접근, 네이버 뉴스도 robots 제한, 네이버 e스포츠 페이지는 본문 텍스트가 없는 응답이었다. Pinterest 공개 검색에서 실제 Pin/보드 이미지가 나오지 않았고 사용자도 제공할 레퍼런스는 없다고 했다. 보조 이미지 검색은 [Dribbble의 Reuters 앱 콘셉트](https://dribbble.com/shots/22829027--Reuters-News-Mobile-Application)와 [Washington Post의 Discover 발표](https://www.washingtonpost.com/pr/2019/08/21/washington-post-adds-browsable-visual-reading-experience-to-washington-post-app/)를 반환했으나, 전자는 컨셉 이미지·후자는 공식 설명이라 현행 운영 뉴스 화면으로 간주하거나 자산을 복사하지 않았다.
- `superpowers/using-superpowers`는 현재 로컬 스킬/사용 가능 목록에서 찾지 못했다. 사용했다고 주장하지 않고, 실제 적용 가능한 프로젝트/UI/Figma/Stitch 지침에 따라 작업했다. Pinterest 계정 ID·비밀번호는 받지 않았고 컴퓨터 유즈도 사용하지 않았다.

## 2026-11-23 · 아침결 받은 뉴스 — 운영 뉴스 흐름을 참고한 별도 시안

- **요청/범위:** 사용자가 알림이나 메일에서 브리핑으로 들어와 관심 기사를 고르고, 짧은 핵심·쉬운 설명·맥락·사진(있을 때)·출처를 확인한 뒤 목록 위치를 잃지 않고 다음 기사로 이동하는 읽기 경험을 설계한다. 현재 앱의 메인 페이지, 메일 HTML, API·DB, 기사 선택/요약 로직, 평일 오전 7시 30분 알림은 그대로 둔다. 최초 계획은 새 Figma 파일과 새 비공개 Stitch 프로젝트였으나, Figma 호출 한도 후 사용자가 Stitch로 명세를 옮기라고 지시해 실제 새 Stitch 프로젝트에 모바일·PC 목록/상세와 컴포넌트 보드를 만들었다. 이번 요청은 디자인 산출물만이며 운영 코드 변경·커밋·푸시·배포·알림 발송은 하지 않는다.
- **제품/코드 기준선:** `frontend/components/ReceivedBriefing.tsx`와 `ReceivedBriefing.module.css`에서 목록→상세 흐름, URL 해시/발행 날짜, 목록 위치 복귀, 글자 크기 선택, 열어본 기록, 로딩·빈·오류·캐시 상태, 원문/출처, 정정·불확실성, 상황에 따라 있는 설명·배경·영향·사진을 확인했다. 목록은 768px 이상에서 대표 기사 1개가 가로 전체를 쓰고 나머지는 두 열, 좁은 화면은 한 열이다. 읽기 폭/글자 크기/44px 터치 영역을 유지한다. 운영 화면을 GUI로 직접 조작하거나 캡처하지 말라는 현재 요청에 따라 이 기준선은 코드 관찰이며, 실제 배포 화면의 픽셀 관찰·실기기 검증으로 확대하지 않는다.
- **이번에 실제로 열어 본 뉴스 화면과 결정(2026-11-23 KST):** [다음 국제](https://news.daum.net/world)는 국제 주요 기사와 지역별 하위 탐색, 별도 사진 뉴스·최신 흐름을 보여 준다. 분야가 다양하되 편집 화면에 과한 포털 메뉴를 옮기지 않고, 기사 카드에 실제 분야/제목/짧은 설명·출처를 각각 구분한다. [Investing.com 경제](https://kr.investing.com/news/economy)는 최신/많이 본/속보와 경제 하위 주제, 기사별 작성자·시점을 보여 준다. 경제 비중을 아침결 전체로 확대하지 않고 작성자·원문 시점과 중요도 순서를 읽기 정보로만 채택한다. [The Guardian 국제](https://www.theguardian.com/international)는 국제·세계·정치·환경·과학·스포츠 등 넓은 분류와 대표 기사→후속 기사, 제목·설명·시점을 구분한 페이지 텍스트를 확인했다. 이는 구조 참고이며 사이트의 사진/색/브랜드를 복제하지 않는다. 사용자가 준 [BBC 코리아](https://www.bbc.com/korean)와 [연합뉴스 국제](https://www.yna.co.kr/international/all)는 웹 열람 도구의 접근 제한으로 현행 화면을 직접 확인하지 못했다. Pinterest 검색에서도 공개 Pin 이미지/보드를 열지 못해 로그인 화면으로 우회하지 않았다. 사용자가 공개 Pin/보드 URL을 주면 새 시안에 추가 반영한다.
- **레이아웃 결정:** 모바일은 한 열에서 대표 기사 제목·핵심 문장을 먼저 읽고, 1~3번 정도의 보조 설명은 기사 진입 전에 확인할 수 있게 하며 긴 목록은 동일한 정렬 축과 명확한 번호·분야·시점으로 이어 간다. 기사 상세는 카테고리/발행일/전체 중 위치 → 제목/원문 매체·시간 → 쉬운 한두 문장 → 사실 핵심 → 실제 가진 배경·중요성·앞으로 볼 점 → 사진(원본 비율 보존, 없는 경우 빈 사진 영역 없음) → 출처/원문 순서다. PC는 2열 목록과 한 화면에 보이는 대표 이야기/보조 목록의 위계를 주되, 기사 상세는 긴 한국어 제목과 본문을 읽기 적절한 폭으로 유지한다. 사용자가 지정한 알림→메일→기사 진입 맥락은 헤더/돌아가기/목록 복귀로 보존하고 푸시나 메일 자체 UI를 운영 적용하지 않는다.
- **기존 제품 시각 시스템:** 코드에 있는 `#fbfcfa` 바탕, `#17231d` 잉크, `#64716a` 보조, `#e1e8e4` 구분, `#18b779` 브랜드 행동색, `#e8f8f0` 연한 강조를 재사용한다. CSS의 Pretendard→Noto Sans KR 대체 순서를 보존하며 Figma에서 Pretendard를 사용할 수 없을 때만 확인된 `Noto Sans KR`로 작업하고 이를 산출물에 표시한다. 기존 강한 초록 면을 뉴스 전면에 반복하지 않고, 분류/상태/상호작용에서만 의미 있게 쓴다. 사진은 실물 비율로 보이고 제목 줄바꿈을 강제 생략하지 않는다.
- **시안 아티팩트/컴포넌트 경계:** Starter Figma 파일에 semantic tokens와 재사용 컴포넌트 9개를 만들었으나 샘플이 겹쳐 검수 실패 상태다(세부는 위 추가 결정 참고). 사용자의 후속 지시에 따라 Figma 보완 대신 새 비공개 Stitch 프로젝트 `아침결 뉴스 읽기 — 모바일·PC 시안`에 목록/상세 모바일·데스크톱과 컴포넌트 명세 보드를 생성했다. 기존 Figma/Stitch 보드는 편집하지 않는다. 생성 도구 결과는 제품 적용이나 사용자 검증 사실이 아니다.
- **반대 검토/제외:** 포털처럼 지역·분야 메뉴를 전부 상단에 늘어놓으면 알림을 눌러온 독자가 오늘 읽을 핵심까지 더 많이 훑어야 하므로 채택하지 않는다. 같은 무게의 카드가 길게 반복되면 중요도 비교가 약해져 대표 기사/목록/상세의 계층을 분리한다. 경제 페이지의 시장 지표·투자 도구, 타 매체의 로고·브랜드 서체·기사 사진·레이아웃 복제, 사용자가 보지 않은 Pinterest 결과, 랜딩 히어로/구독 버튼, 뉴스 없는 장식 이미지는 넣지 않는다. 전용 UI 지침 `superpowers/using-superpowers`는 현재 사용 가능한 로컬 스킬 목록과 로컬 스킬 경로에서 찾지 못했으므로 사용했다고 주장하지 않는다.
- **통과 기준/미확인:** 현행 메인·API·메일·일정·알림 동작은 손대지 않는다. 모바일 한 열, PC 2열, 긴 한글 제목/본문, 실제 이미지 유무에 따른 규칙, 불확실성·정정·출처 상태를 확인하는 것이 목표다. Figma는 프레임 캡처에서 겹침이 확인되고 호출 한도에 막혀 미완료다. Stitch 도구는 생성 완료를 보고했지만 원격 PNG 미리보기를 열 수 없어 시각 픽셀 검증은 미완료다. 실제 사용자 테스트, 이메일 클라이언트 렌더, 운영 화면·기기, BBC/연합뉴스 시각·Pinterest 공개 Pin은 해당 접근이 확보되기 전까지 미확인으로 남긴다.

## 2026-11-23 · 받은 뉴스 화면 전체를 메인 브랜드 톤으로 통일

- 요청과 범위: 사용자가 뉴스 수신 화면 전체의 색·서체·분위기가 메인과 달라 보인다고 지적하고 배포를 요청했다. 운영 메인 페이지와 수신 독서 화면의 브랜드 기반을 일치시키되, 수신 화면의 실제 사용자 흐름(발행본 확인 → 기사 선택 → 본문·맥락·출처 읽기 → 목록/이전·다음 이동)은 유지한다. 목록·기사 상세·로딩/빈/오류/안내·진행 표시·읽기 도구·출처/푸터 및 수신판 브랜드 헤더를 모두 다룬다. 메인 페이지, 기사 내용/API·메일 HTML, 발송 일정·푸시 알림 동작은 범위 밖이며 이번 작업 중 발송하지 않는다.
- 기준선/실제 화면(2026-11-23 KST): 운영 `https://morningnews.coders.kr/` 메인과 `https://morningnews.coders.kr/briefing/delivery/?date=2026-11-23` 수신판을 Chromium Playwright로 열었다. 메인은 Pretendard, Noto Sans KR, Apple SD Gothic Neo, Malgun Gothic 순의 시스템 스택, 배경 `#fbfcfa`, 본문 잉크 `#17231d`, 강조 초록 `#18b779`, 옅은 초록 `#e8f8f0`, 보조 `#64716a`, 경계 `#e1e8e4`를 사용한다. 수신판은 SUIT, 파랑 `#2157b5`, 차가운 회색/푸른 목록 면, 별도 파랑 메일 아이콘을 사용해 같은 서비스의 화면으로 보기 어렵다. 실제 11월 23일 발행본은 25개 기사를 제공하며 메인·수신판 PC 1440×900, 모바일 390×844를 캡처했다. 독립 화면 검토는 기존 기사 선택·상세·다음/목록 동작을 360×800, 390×844, 768×1024, 1440×900에서 확인했다. 동명의 `achim-gyeol.coders.kr`은 비어 있는 호스트로 직접 확인해 배포 대상으로 사용하지 않는다. 캡처는 로컬 임시 폴더에만 있고 저장소에는 추가하지 않는다.
- 시각 근거와 범위: 실제 운영 메인이 이번 제품의 주 참고다. 그 서체 스택·밝은 중성 바탕·숲색 잉크·초록 브랜드 행동색·절제된 선을 수신판 헤더, 링크/조작, 진행 표시, 목록·상세의 의미 토큰 및 상태 화면까지 공통으로 적용한다. 헤더 메일 표식도 초록 바탕의 흰 메일 아이콘으로 맞추되 현재 메인 브랜드와 동일한 Lucide 아이콘/모양만 사용한다. 메인의 78px 홍보 제목, 홈페이지 히어로와 가입 CTA는 뉴스 편집 화면의 목적에 맞지 않으므로 가져오지 않는다. 직접 본 [The Verge](https://www.theverge.com/) PC·모바일 화면은 기사 중요도 위계만 보조 참고한다. 열람 당시 PC 광고 여백과 모바일 개인정보 동의 띠가 콘텐츠를 크게 가렸으므로 색·글꼴·광고/동의 배치는 채택하지 않는다. 세계 디자인 아틀라스의 포트폴리오/작품 탐색 사례는 뉴스레터 읽기 행동과 달라 본 화면의 기준으로 쓰지 않는다.
- 화면 구성 결정: 날짜·전체 기사 수·첫 기사 강조와 기사 편집 순서는 그대로 둔다. 모바일은 제목을 충분히 읽을 수 있는 한 열, PC는 기존 2열 목록을 유지한다. 상세는 기존 약 680px 중심의 읽기 폭과 사용자의 글자 크기 설정·본문 위계·실제 맥락/주의/출처 표시를 보존한다. 종이 같은 흰색·푸른 카드 대신 메인과 어울리는 거의 흰 배경/중성 표면, 옅은 녹색 강조, 얇은 녹색 계열 경계와 숲색 잉크를 목록 첫 기사·행동 상태·세부 섹션에 사용한다. 경고·불확실성은 정보 의미를 보존하는 따뜻한 주의 색으로 초록과 구분한다. 정보는 색만으로 구별하지 않는다.
- 타이포그래피/토큰: 메인의 실제 `body` 스택을 수신판에도 사용한다: `Pretendard, "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", Arial, sans-serif`. 신규 폰트 파일/CDN/라이선스는 추가하지 않는다. 역할별 크기·줄 간격, 본문 글자 크기 조절, 긴 한국어 줄바꿈은 기존 읽기 동작을 유지한다. 브랜드 기본색은 실제 메인 값 `#18b779`, 잉크 `#17231d`, 보조 `#64716a`, 경계 `#e1e8e4`, 바탕 `#fbfcfa`, 브랜드 연색 `#e8f8f0`, 진한 브랜드 `#0b3d2e`를 사용한다. 모든 새 색을 CSS Module의 의미 토큰으로 두며 메인 전역 CSS는 수정하지 않는다.
- 목적지/계약 보존: `/` 브랜드 링크, 날짜 query와 `#news-ID`, 기사 순서·전체 수, `뉴스 목록`, 이전/다음, 원문/출처, 글자 크기 선택 저장, 열린 기록, 초점·목록 위치 복원, 공지 및 cached/loading/empty/invalid/error 상태를 보존한다. 수신 추적 분석은 기존 규칙만 유지한다. 기사 데이터·요약 모델·수집/선별·DB/API·구독/메일/푸시 알림·메인 화면은 변경하지 않는다.
- 구현 경로: `frontend/components/ReceivedBriefing.tsx`, `frontend/components/ReceivedBriefing.module.css`, 관련 수신 화면 E2E 테스트 및 본 계획만. UI 표면 외 파일/API는 불필요하게 건드리지 않는다.
- 합격 기준: 브랜드 헤더·목록·상세·경고/주의·출처·푸터·빈/오류/로딩 상태에서 서체/잉크/배경/행동색이 메인 토큰과 일치하며 이전의 파랑 테마 잔여색이 없다. 각 기사의 사실·불확실성·원문 연결, 주소/기능, 상태 안내가 보존된다. 360×800, 390×844, 768×1024, 1440×900에서 실제 발행본과 긴 제목을 렌더링해 화면 잘림·가로 넘침·컨트롤 겹침을 직접 검사하고, 기사 상세와 목록 복귀·글자 크기 키보드 조작·포커스를 확인한다. 빌드/테스트·브라우저 콘솔을 검사하고 운영 배포 후 동일 화면과 실제 운영 응답을 재확인한다. 사용자의 푸시 알림은 보내지 않는다.

## 2026-11-22 · 받은 뉴스, 쉽게 이해하고 내 속도로 읽기

- 후속 요청·결정: 실제 사용자가 짧은 요약 아래 더 상세한 정보를 원한다. 현재 발행 데이터에는 상세 요약·배경·영향·다음 확인 정보가 이미 있으나 이전 수정에서 배경·영향·다음 확인은 접혀 있고 사진 뒤에 배치되어 있다. 단순히 생성 분량을 늘리면 현재 기사 설명/제목만 있는 근거로 사실을 보태거나 향후 AI 사용량을 늘릴 수 있다. 이번에는 기존 데이터만으로 `배경·중요한 이유·다음 확인`을 `더 자세한 내용` 아래 기본 펼침으로 보여주고, 첫 요약을 읽은 독자가 원하면 접을 수 있게 한다. 영역은 사진보다 먼저 두어 긴 이미지 뒤로 상세 설명이 밀리지 않게 한다. 상세 자체가 비거나 실제 후속 확인이 없으면 그 항목을 만들지 않는다. 뉴스 수집, 모델 지침·출력, API·DB, 비용·알림은 변경하지 않는다.
- 요청 범위·결과: 알림/메일에서 들어온 독자가 관심 기사를 고르고, 낯선 표현을 이해하고, 더 읽을지·원문을 볼지 스스로 결정하게 한다. 이번 변경은 기존 수신 뉴스 목록과 기사 읽기 화면에 한정한다. 실제 사용자 조사 전이므로 ‘사용자 선호 검증’이라고 말하지 않는다.
- 현 화면의 근거: 운영 11월 20일 발행본 첫 기사(21건 중 1번)와 이전 수신판 시안에서 쉬운 설명·핵심·확인할 점은 보이지만, 사진 뒤 `맥락 더 알아보기`를 눌러야 배경·중요성을 읽을 수 있다. 실제 API에는 이 기사에 2개 주장이 연결되어 있고 배경/영향 필드도 있으나, 출처가 제공한 기사 제목·설명만으로 확인되지 않는 최종 판결 결과는 확인 메모에 남아 있다. 출처·불확실성을 유지하고 더 자세한 실제 필드를 쉽게 펼쳐 읽게 한다.
- 대안 비교: (1) 현행처럼 설명을 모두 펴 둠 — 상세가 보이지만 읽기 깊이를 고르기 어렵다. (2) 전체 기사를 접음 — 첫 화면은 짧지만 중요 세부를 숨겨 요약만 강요할 위험이 있다. (3) 선택: 짧은 핵심·쉬운 설명·주의를 먼저 보여주고, 실제로 보유한 배경·영향·다음 확인은 `더 자세한 내용` 안에 기본 펼침으로 둔다. 독자는 이 영역만 접어 읽기를 줄일 수 있고, 출처·정정은 계속 확인할 수 있다.
- 독자 흐름·행동: 날짜가 고정된 메일/알림 링크 → 전체 제목에서 관심 기사 선택 → 어려운 표현이 적은 `쉽게 풀어 보면`으로 먼저 감을 잡음 → 구체적인 `핵심 내용`과 확인 메모를 읽음 → 이어서 펼쳐진 배경·영향·확인 항목을 읽거나 상세 영역을 접음 → `원문과 출처` 또는 `다음 이야기` → 목록으로 돌아와 같은 위치에서 계속 선택. 순서 강제, 연속 출석, 점수, 시간 압박은 만들지 않는다.
- 직접 본 운영 사례(2026-11-22 KST): [토스피드 기사](https://toss.im/tossfeed/article/mymoneystory-34) PC 1440×900·모바일 390×844. 화면에서 제목·날짜·주제·읽는 분량이 앞에 모이고, 모바일은 요약/목차를 장문보다 먼저 보여 주며 소제목으로 호흡을 나눈다. PC의 사진 전체 화면 히어로와 긴 인터뷰 분량은 아침결의 짧은 기사/알림 진입에 맞지 않아 적용하지 않는다. [The New Yorker](https://www.newyorker.com/) PC 1440×900·모바일 390×844은 선별 UI 풀에서 골라 실제 홈 상단을 확인했다. PC는 설명과 실제 사진을 나누고 모바일은 제목·소개를 먼저, 사진을 다음에 배치한다. 적용은 모바일에서 핵심 설명을 사진보다 먼저 두는 읽기 순서만이며, 로고·세리프·기사·사진·듣기 버튼은 가져오지 않는다. 토스의 원칙은 [8가지 UX 라이팅 원칙](https://toss.tech/article/21022)에서 명확·간결·친근·존중, 다음 동작 예고, 빈 문구 제거, 어려운 말을 소리 내어 말할 수 있는 표현으로 바꾸는 범위를 참고한다. 브랜드 표현은 복제하지 않는다.
- 디자인: 기존 SUIT와 시스템 대체 서체, `#182334` 잉크·`#536175` 보조·`#2157b5` 행동·`#edf4ff` 연한 목록 면·`#dfe6ef` 경계·현재 주의 색을 그대로 쓴다. 기사 폭은 현재 반응형 설정을 유지하고 본문은 17px/1.76 및 사용자 글자 크기 선택을 보존한다. 모바일에서 제목/쉬운 설명/구체적인 핵심/확인 메모가 같은 축으로 이어지고 사진은 자연 비율로 나온다. `더 자세한 내용`은 네이티브 `details` 기본 펼침으로 만들고, 기사가 실제 제공하는 배경·영향·다음 확인만 보인다. 이 영역을 사진보다 위에 두어 상세 설명을 빠르게 찾게 하며 원문 출처 목록은 접지 않고, 개별 근거 주장은 기존 `근거 확인` disclosure를 유지한다. 실제 기사 근거가 부족하면 문장 수를 채우려고 세부 정보를 지어내지 않는다. 현재 수신판은 라이트 테마만 구현되어 있어 다크 모드를 추가하거나 지원한다고 표시하지 않는다.
- 콘텐츠 계약: `Story`의 `oneLineSummary`, `summary`, `plainExplanation`, `uncertainty`, `backgroundContext`, `whyItMatters`, `whatToWatch`, `claims`, `sources`, `corrections`를 재작성하거나 보충하지 않는다. `composeReceivedReading`의 보수적인 중복·근거 선별을 유지한다. 불확실성/출처 불일치/단일 출처·진행 중 상태와 정정은 읽기 쉬운 위치에서 실제 상태 문구와 함께 항상 남긴다. 사진이 없거나 로드에 실패해도 텍스트와 다음 행동은 유지한다.
- 목적지·보존할 계약: 목록 제목은 `#news-ID`와 날짜 query를 보존한다. `뉴스 목록`, 글자 크기, 이전/다음, 원문 점프/출처, 키보드 포커스와 목록 위치 복원, 로컬로 저장되는 ‘열어봄’ 상태, loading/empty/error/cached 안내는 보존한다. 읽기 상태를 실제 정독 완료로 과장하지 않는다. 메인 페이지·메일 HTML·일반 공개 뉴스·API·구독·정기 알림/발송은 제외한다.
- 구현 경로: `frontend/components/ReceivedBriefing.tsx`, `frontend/components/ReceivedBriefing.module.css`, `frontend/tests/e2e/received-briefing.spec.ts`, `frontend/tests/e2e/received-polish.spec.ts` 및 이번 계획 기록만 범위로 둔다. `frontend/lib/received-reading.ts`의 기사 팩트/선별 로직은 불필요하게 변경하지 않는다.
- 검증 기준: 실기사와 단순/복합/불확실·충돌·단일 출처/정정/용어/사진 없음·로드 실패 기사를 확인한다. 상세가 실제로 있을 때 기본 펼쳐지고 Enter/Space로 접고 펼칠 수 있으며, 빈 상세·후속 항목은 숨기고 스크린리더 요약·출처를 유지한다. 날짜·기사 ID·출처·정정·전체 문장·읽기 위치 복원을 보존한다. 360×800, 390×844, 768×1024, 1440×900에서 가로 넘침·긴 한국어·사진·포커스·컨트롤을 확인한다. 현재 구현의 라이트만 확인하고 다크 미지원은 한계로 기록한다. 관련 lint/type/build/unit/E2E를 수행하되 사용자 알림/발행/배포는 하지 않는다.

### 2026-11-22 재수정 · 상세 맥락의 발견 가능성과 읽기 흐름

- 요청 연결: 상세 뉴스가 더 잘 읽히도록 공통 UI 지침을 적용하고 배포한다. 실제 발행 데이터와 모델 출력을 늘리는 대신, 있는 맥락을 독자가 알아채고 선택해 읽을 수 있도록 수신 기사 UI를 마감한다.
- 직접 본 주 참고(2026-11-22 KST): [토스 뉴스룸 기사](https://toss.im/newsroom/GUARDIANS26) PC 1440×900·모바일 390×844. 실제 본 기사에서 제목/날짜/유형과 핵심 bullet이 본문과 구분되고, 본문은 소제목·단락으로 이어진다. 아침결에는 제목·날짜·요점·주의·기사 맥락의 역할 구분을 적용하고, 사진·공유·언론사 탐색은 복제하지 않는다. 기사 본문은 기업 보도자료이므로 아침결 뉴스가 동일한 편집/출처 구조를 쓴다고 가정하지 않는다.
- 선별 풀 보조 확인: [The Pudding](https://pudding.cool/) 홈 PC 1440×900·모바일 390×844. PC의 이미지·기사 제목·설명 그리드와 모바일 한 열의 정보 순서를 확인했다. 이는 프로젝트 목록 기준으로만 참고하고 이번 기사 상세에는 그림 중심 스타일·고유 서체·색을 적용하지 않는다. 이 홈은 기사 상세의 근거가 아니다.
- 세계 디자인 아틀라스 교차 판단: `global-design-atlas.md`의 Foreign Policy·Tátil 등 스튜디오 홈 사례는 포트폴리오/작품 그리드여서 실제 뉴스 기사 읽기와 사용 행동이 다르다. 이번 기사 본문 구도에는 채택하지 않는다. 업종이나 제작자 명성보다 직접 관찰한 뉴스 기사와 실제 아침결 기사 데이터를 우선한다.
- 추가 개선: 맥락 영역 이름을 `이 뉴스의 맥락`으로 바꾸고 현재 제공되는 배경·영향·앞으로 확인할 점을 표시한다. 기본 펼침 상태에서 `접기`, 사용자가 접은 뒤에는 `펼치기`가 보이도록 해 조작 결과를 명시한다. 각 소제목은 일상어로 정리한다. 라벨·여백·얇은 선·SUIT와 기존 폭을 유지하고 새로운 카드, 고정 탐색, 전용 서체, 애니메이션 라이브러리는 추가하지 않는다.
- 사실·비용 경계: 현재 AI 프롬프트도 상세 요약과 배경·쉬운 설명을 요구하지만 입력된 기사 근거가 짧으면 분량을 억지로 채우지 않도록 되어 있다. 11월 20일 실제 첫 기사에 최종 판결 결과를 확인할 수 없다는 주의가 남아 있다. 따라서 이 UI 변경은 설명을 만들어내지 않고 기존 API의 실제 문장만 보여준다. 입력 원문 확대나 모델/토큰 변경은 별도 작업으로 남기며 이번 배포의 비용·내용 생성 동작을 바꾸지 않는다.
- 검증: 맥락이 있는 실제·테스트 기사에서는 라벨과 `접기/펼치기`가 키보드·터치에서 작동하고, 맥락이 비면 행 전체가 없어야 한다. 사진·출처·정정·다음/목록 복귀와 날짜/ID 계약을 보존한다. 360×800·390×844·768×1024·1440×900에서 모바일/PC 본문과 상태를 시각 확인한다. UI 확인과 실제 더 긴 기사 데이터의 보유 여부는 별개의 결과로 보고한다.

## 2026-11-22 · 알림에서 바로 읽는 수신판

- 기준선: 11월 20일 발행본 21건을 기준으로 운영 수신판과 이전 번호 표시안을 비교했다. 번호를 항상 왼쪽에 두면 휴대폰에서 제목 글줄이 짧아지고, 기존 상세의 모바일 `다음`은 화살표만 남아 기능을 추측해야 한다. 현상 유지는 변경 위험이 낮지만 이 두 문제를 남긴다. 전체 검색·분류나 큰 사진 표지는 이번 알림 독자의 첫 행동을 방해하므로 제외한다.
- 운영 사례(2026-11-22 KST): [토스테크 기사](https://toss.tech/article/21022)의 실제 PC·390px 화면에서 중앙에 모은 본문, 제목과 발행 정보의 분리, 모바일에서 방해 없는 제목 폭을 확인했다. 이 세 가지를 아침결의 기사 한 열, 날짜·기사 수, 제목 폭에 적용한다. 토스의 이미지 표지·탐색과 전용 서체는 쓰지 않는다. [가디언 뉴스레터](https://www.theguardian.com/world/series/first-edition)는 쿠키 안내로 시각 비교가 제한되어 시각 기준에서 제외했다.
- 화면: 발행일과 기사 수를 짧은 메타 줄로 정리하고 첫 제목과 기존 요점을 바로 보이게 한다. 모바일은 기사 번호를 분야 앞 메타 줄에, PC는 번호를 별도 기준선에 둔다. 상세에는 `뉴스 목록`, 글자 크기, `다음`을 줄이지 않고 보여준다. 기사 해시 링크, 원문 버튼과 포커스 복원은 유지한다. 내용이 짧거나 사진이 없으면 추가 장식을 만들지 않는다.
- Stitch 반복 검토: 같은 보드의 기존 시안은 유지하고 모바일과 PC 수정안을 한 장씩 추가했다. 모바일의 분야 옆 번호, PC의 대표 기사·후속 두 열, `다음` 텍스트를 참고했다. 예시 발행 시각, 실제 상태를 모르는 ‘수신 알림 연결됨’, 되풀이되는 기사 번호·요약 칸과 별도 ‘기사 읽기’ 버튼은 제외했다. 실제 화면은 행 전체가 링크이며 날짜와 건수를 발행 데이터에서 표시한다. API 키와 생성 코드는 앱 런타임에 넣지 않았다.
- 제품에 정한 값(참고 사이트에서 복사한 값 아님): 기존 SUIT, 짙은 잉크·동작 파랑·연한 차가운 바탕, 번호 12px·제목 18–42px·상세 17px/1.76, 모바일 여백 18–20px, PC 상세 약 680px, 기능 영역 44px 이상, 자연 줄바꿈과 모션 감소. 모바일 읽기 버튼을 숨기지 않는다.
- 검증/배포: 발행일과 첫 제목이 처음 보이는지, 실제 21건·순서·원본 사진·출처 및 긴 제목이 유지되는지, 원문 포커스와 목록 위치가 돌아오는지 360/390/768/1440px 확인. React의 받은 뉴스 컴포넌트, 그 회귀 테스트와 문서에만 수정. 홈·공개 뉴스·메일 HTML·백엔드·평일 07:30 알림은 수정하지 않는다. 발송 없이 사용자 승인된 사이트 변경만 배포한다.

## 2026-11-21 · 수신판의 편집 디자인 검토 기록

- 기준선: 실제 11월 20일 발행본 21건은 모바일에서 바로 기사에 진입할 수 있다. 목록은 첫 기사와 나머지의 차이가 주로 파란 면과 제목 크기에 의존하며, 기사 화면의 색 박스 두 개가 제목에서 본문으로 흐르는 리듬을 끊는다. 뉴스가 없거나 짧아도 새 빈 자리나 가짜 자료는 만들지 않는다.
- 직접 본 사례(2026-11-21 KST): 주 참고는 [토스테크 글](https://toss.tech/article/21022)의 넉넉한 제목 크기·여백과 별도의 발행 정보, 보조는 [AI타임스](https://www.aitimes.com/)의 대표 기사와 순서가 있는 후속 목록의 빠른 구별이다. [토스피드 인터뷰](https://toss.im/tossfeed/article/mymoneystory-34)의 사진 위 제목과 대형 첫 화면도 확인했지만, 작은 휴대폰에서 첫 요점까지 거리가 길어져 제외한다. 운영 사례의 색·사진·글꼴·로고는 사용하지 않는다.
- 한 방향: 알림을 눌러 모은 뉴스를 훑는 독자에게 기존 메일 제호, 발행일·기사 수, 강조 기사, 얇은 구분선과 순서 번호를 제공한다. 순서 번호는 발행판의 편집 순서이며 인기/평가 지표를 뜻하지 않는다. 기사 링크와 날짜, 원문 바로가기, 키보드·목록 복귀를 그대로 유지한다. 요약과 확인할 점은 배경색 대신 제목과 선으로도 구분한다.
- 토큰과 조작: SUIT·시스템 대체 폰트 유지, 본문 17px/1.76, 제목 28–42px. 잉크 #182334, 동작 #2157b5, 선 #dfe6ef, 요약 #f3f7fd, 확인 글 #654512. 카드보다 가는 선·간격 8/12/16/24/32px. 360px에서 제목이 들어갈 폭을 남기고 44px 터치를 유지, PC는 발행판 2열·본문 1열. 원본 사진은 상세에서 비율을 보존하고 기존 모션 감소 설정을 지킨다.
- 범위와 확인: 수신용 React 컴포넌트와 CSS, 관련 테스트. 홈·공개 뉴스·메일 HTML·API·평일 07:30 알림은 제외. 별도 Stitch 프로젝트에서 사례의 시각 원칙을 시험한다. 생성 코드와 예시는 도입하지 않는다. 실제 21건과 길이가 긴 테스트 발행본을 360/390/768/1440px에서 확인한다. 정규 배포·알림은 실행하지 않는다.
- 비교 결정: Stitch 첫 안의 대표 뉴스/후속 목록 구분은 타당하지만, 실제 서비스에 없는 메뉴·근거 번호와 넓은 이미지가 섞여 있어 제거를 요청했다. 수정 시안은 비교용으로 유지하고 실제 화면에서는 기존 제목·본문·원문만 연결했다. Stitch MCP는 개발용 도구이며 배포 앱은 Stitch 자격 증명에 의존하지 않는다.

## 받은 뉴스 · 핵심부터, 한 편씩

- 독자 여정: 평일 알림 → 해당 발행판 → 관심 기사 → 맥락과 원문 확인 → 같은 목록 위치. 기존 수신판은 큰 표지 뒤 ‘1분 브리핑’과 전체 목록에 같은 제목이 두 번 나오고, 상세의 배경과 영향을 한 번 더 눌러야 읽을 수 있다.
- 대안: 현행의 큰 표지와 요약 카드는 익숙하지만 첫 기사까지 스크롤이 길다. 알림에서 첫 기사 전문을 곧장 여는 안은 다른 분야를 찾기 어렵다. 새 Stitch 보드의 편집 방향을 출발점으로, 독립 검토에서 지적된 중복·사진 진입 장벽·숨은 본문을 해결하는 한 가지 안을 선택했다. 사진은 상세에서 원래 비율로 보여 주고, 목록엔 같은 기사 링크를 하나만 둔다.
- Topic / Offer / Audience / Action: 전날의 주요 뉴스를 훑고, 필요한 한 편을 충분히 깊게 읽는 한국어 아침 독자. 첫 행동은 실제 기사 제목 열기. 보조 행동은 원문으로 이동과 목록 복귀. Deliverable: 기존 React 수신판과 상세 한 가지. Style: 차분한 흰 지면·짙은 잉크, 기능 아이콘만. Proof: 기존 발행판의 날짜·제목·맥락·확인할 점·근거. Motion: 추가하지 않는다.
- 첫 화면: 짧은 제호, 실제 발행일과 건수, 핵심 제목과 제목을 반복하지 않는 보충 사실. 우선 3건이 한 번만 나오고 이후 전 기사 편집 순서 유지. 상세는 제목 바로 아래 핵심·확인할 점, 본문과 배경·영향, 선택적 원본 사진, 원문·근거·이전/다음. 정정은 숨기지 않는다. 원문 이동은 기사 해시를 바꾸지 않는다.
- 토큰: 기존 SUIT와 시스템 대체 서체, 흰 지면 #fff·잉크 #182334·보조 #536175·동작 #2157b5·선 #dfe6ef·핵심 배경 #edf4ff. 간격 8/12/16/24/32px, 17px 기본 본문·1.76 행간, 28–44px 기사 제목, 상세 약 680px; 모바일 20px 여백, 최소 44px 조작, 길이 제한 없는 한국어 줄바꿈과 포커스. 토스 라이팅은 제목 반복 제거와 행동 안내에, 배민과 당근 사례는 역할 기반 CSS 토큰 및 접근성에 참고했다.
- 범위: ReceivedBriefing 및 전용 CSS, 이 동선의 테스트와 README. 홈·공개 뉴스·메일 HTML·API 계약·스케줄·알림·읽기 데이터는 유지한다. 360/390/768/1440, 작은 판/실제 21건, 사진 오류, 직접 URL, 출처·정정·읽던 위치 복귀를 확인한다. 운영에는 푸시 발송 없이 공개판 읽기로 확인한다.
- PM 수용 기준: 360px에서 발행일, 첫 제목, 핵심 근거가 불필요한 소개·권한 요청보다 앞선다. 다른 기사로 넘어간 후에도 같은 날짜·원래 링크의 초점과 화면 속 위치를 되찾고, 키보드 또는 스크린리더는 긴 설명보다 먼저 제목을 식별할 수 있다. 1440px 읽기 본문은 실제 뉴스 사진과 근거를 좁은 읽기 폭 안에 둔다. 기기·선호 개인화가 아니라 알림으로 도착한 독자의 과업에 맞춘 설계다. 실제 사용자 연구는 별도다.
- 시안 검토: Gemini가 긴 목록의 부담과 강제 순차 탐색을 지적했다. 상위 세 건의 짧은 사실, 빠른 원문 이동, 이전·다음과 목록 위치 복귀를 함께 적용하고 제목 줄임과 새 필터는 채택하지 않았다. Stitch 신규 보드에서 모바일·PC 목록과 상세를 비교한 뒤 실제 서비스에 없는 메뉴·수치의 삭제를 요청했다. Figma 새 페이지에 읽기 순서·사진 비율·로딩/오프라인/오류 명세를 편집 가능한 비교안으로 정리했다. 생성 결과는 배포 코드나 실제 독자 관찰을 대체하지 않는다.

Filled prompt: Design the delivered Achim Gyeol edition around article choice, not promotion. Keep one compact dated introduction, one editorial list carrying all headlines, and three meaningful lead snippets when available. An article opens completely with its existing source-grounded context, caveats and corrections. Preserve readable original photos, dated deep links, source-jump and keyboard return. Do not copy Toss brand assets, insert demo news, generate new notification content, or change the homepage or public feed. Output to the current ReceivedBriefing surface with its scoped CSS and regression tests.

## 현재 작업 · 2026-11-18 · 1분 브리핑과 운영 개선

- 목적·독자: 출근 중 받은 뉴스의 주요 소식부터 훑고, 필요하면 전체 기사를 읽는 한국어 구독자. 실제 11월 18일판은 16건·약 20분이라 1분용 진입점이 없다. 홈페이지, 일반 뉴스 화면, 메일 미리보기 및 평일 07:30 목표는 유지한다.
- Topic: 지난 하루 뉴스. Offer: 1분 브리핑과 전체판. Audience: 모바일·PC 구독자. Primary action: 실제 편집 순서의 앞 최대 세 건을 열기. Deliverable: 기존 수신 화면 안에 한 섹션. Style: 간결한 한국어 편집물. Tonal key: 흰색·남색. Icon policy: 기존 화살표. Proof assets: 실제 발행본 제목·요약·검증 표시. Motion: 없음.
- Composition: 기존 남색 표지 → 짧은 1분 브리핑 → 기존 이어서 읽기와 전체 기사. CTA는 각 기사 제목의 날짜 유지 `#news-ID`, 보조는 `전체 뉴스 보기` → `#received-contents`. 기사에서 돌아오면 눌렀던 항목으로 초점을 돌린다. 빈 발행본에는 노출하지 않으며 실제 기사가 1–2건이면 그대로 표시한다.
- 기존 SUIT + 시스템 글꼴, 잉크 #182334, 보조 #536175, 파랑 #2157b5, 경계 #dfe6ef, 확인 표시 #79551d. 좁은 폰은 세로 목록, 768px 이상 3열. 제목 16px/1.45, 요약 14px/1.55, 최소 조작 높이 44px, 간격 8/12/16/24px, 경계 1px/반경 16px. 줄임표 없고 기존 사진·본문·전체 기사 수 유지. 새 이미지·아이콘 에셋 없음.
- Output: `ReceivedBriefing.tsx`, CSS module, 수신용 E2E. 편집은 비교용 이전 판, 정확히 동일한 입력만 재사용, 토큰 집계와 발송 상태는 관리자 경로로 한정한다. Playwright·JDK21 테스트와 360/390/768/1440px 운영 읽기를 검증하고 실발송·실제 요약은 수동 호출하지 않는다.

Filled master prompt: Build one compact “1분 브리핑” on the existing Korean recipient edition, immediately after the dateline and cover. Present at most three stories in edition order with non-truncated titles, short existing source-grounded text, and an uncertainty cue where applicable. Use local dated anchors and restore focus. Keep the complete newsletter, homepage, notification cadence, saved data and natural photo ratios intact. Use existing typography, ink, pale rules and blue action styling, with one column on phones and up to three on wider screens. No new authoring, timers, hype, art or motion. Verify both fixtures and live read-only content.

## 이전 작업 · 2026-11-14 · 읽고 싶은 데일리 에디션

사용자가 이 수신 화면 디자인의 GitHub 반영·배포와 뉴스 품질 보강을 승인했다. 검증 후 canonical upstream → 실제 fork 동기화 → 기존 Coders 프로젝트 배포 → 운영 확인 순서로 반영했다.

### 목적과 근거

- 실제 `ReceivedBriefing`은 모든 기사가 같은 크기의 제목 행이라 읽기 시작점과 기사 맥락이 약하다. 목록에서 사진이나 요약은 보이지 않고, 길게 읽은 뒤 다음 기사로 가려면 끝까지 내려가야 한다.
- 출근길 한국어 독자에게 중요 순서가 유지된 전체 목록 → 핵심 → 필요한 깊이 → 다음 기사의 흐름을 제공한다. 디자인이 뉴스의 정확성을 보증하거나 확인 중인 사실을 확정으로 보이게 하지 않는다.
- 첫 행동은 목록의 실제 기사 선택(`#news-ID`), 보조 행동은 `이어서 읽기`(이 기기에서 아직 열지 않은 첫 기사), 상세의 `뉴스 목록`(`#received-contents`) 및 다음 기사. 기존 날짜 쿼리를 유지한다.

### OpenUI resolved inputs / composition contract

- Topic: 아침결 수신용 데일리 뉴스 에디션. Offer: 전날 중요 소식을 쉽게 이해하고 내 속도로 읽기. Audience: 한국어 모바일·PC 구독자. Primary user action: 기사 열기. Deliverable: 기존 React 수신 목록/기사 개선 1개, 새 랜딩 아님.
- Style direction: 현대적인 편집 매거진. Tonal key: 밝은 종이와 짙은 남색, 절제된 파랑. Icon policy: 기존 메일 SVG와 lucide. Proof assets: 실제 11월 10일 보관본과 원문 사진, 기존 source·verificationStatus; 인기/조회수/품질 점수/새 뉴스 생성 금지. Motion intensity: 색상·테두리 반응 160ms, reduced-motion에서는 제거.
- Hero archetype: 광고 히어로가 아닌 compact edition masthead. First viewport: 브랜드/발행일 → 제목·실제 기사 수/예상 읽기 시간 → 첫 기사 제목/짧은 맥락과 실제 사진. 첫 기사는 API 순서 그대로이며 `가장 많이 읽음` 같은 허위 배지는 없다.
- Primary visual: 첫 기사의 원본 사진과 완전한 제목. 이미지 없거나 깨지면 텍스트만 보여준다. 사진은 모든 위치에서 contain/자연비율, 잘라내지 않는다. 모든 기사 제목과 설명을 줄수 제한 없이 표시한다.
- Interaction: 읽은 기사는 열린 기록으로만 표현(읽기 완료로 과장하지 않음), 그 다음 안 연 기사로 이어 읽기. 상세 sticky toolbar에서 목록/크기/다음 이동. 목록 복귀 시 초점 복원, 근거/맥락은 네이티브 펼치기, 실제 원문 링크 보존.
- Reuse boundary: `ReceivedBriefing.tsx`/CSS module과 그 테스트, README 설명. 별도 뉴스 품질 보강은 기존 편집 파이프라인의 근거 중심 선별·설명과 회귀 테스트로 제한한다. 키·모델·호출량·수집/발송 일정·전날 범위·기사 수 기준·스포츠 부재 시에도 발송하는 원칙은 유지한다.

### 디자인 토큰과 반응형

- 기존 라이선스 포함 SUIT 400/600/700, Apple SD Gothic Neo/Malgun Gothic/system-ui 대체. 토스 고유 폰트/자산 복제 없음.
- Ink #182334, muted #536175, action #2157b5, paper #ffffff, canvas #f5f6f8, cover #172b4d, soft #edf4ff, rule #dfe6ef, caution #fff6e8/#654512. 진한 커버의 글자는 흰색, 보조는 #d6e2f3.
- 목록 컨테이너 최대 1080px, 상세 본문 최대 680px. 목록 첫 기사 1개 강조 + 다음 기사 desktop 2열, 768px 미만 1열. 모바일 여백 20px, 360px에서 18px. 목록 제목 21px, 첫 제목 26–36px, 상세 29–40px; 본문 17–18px/1.75, 메타 13–14px. 8/12/16/24/32/48px 간격, 카드 16–20px 반경, 1px 선.
- 한글 keep-all + overflow-wrap:anywhere; min-width:0. 주요 조작 44px 이상. sticky toolbar는 safe-area를 고려하고 긴 화면을 가리지 않도록 1줄 기본/좁으면 의도적 줄바꿈. 앵커 scroll-margin과 초점 복원 확인.
- loading/error/empty/offline 경로와 기사 원문 부재를 사실대로 표시한다. 원문 요약을 추가 생성하지 않으며 외부 이미지를 내려받거나 변조하지 않는다.

### Filled master prompt / output

Improve the existing 아침결 recipient edition, not the homepage. Build one polished Korean editorial reading experience from the live Briefing/Story schema. Establish a calm navy edition header, an identifiable first story with an optional uncropped original image, readable full headlines and short existing summaries for every subsequent story, with a responsive two-column desktop/one-column phone layout. Provide truthful opened-story progress and a continue action targeting the next unopened story. Keep article facts and caveats prominent, full text expandable, original sources visible, and list/font/next controls reachable. Preserve all dated deep links, local read state, focus return, cached/error states, API contracts and the whole uncapped story list. Use SUIT, white paper, restrained blue, natural photos, no fabricated popularity or guarantees, and no automatic notifications. Output to ReceivedBriefing.tsx/CSS and focused tests. Validate types/lint/build/unit and browser navigation at 360×800,390×844,768×1024,1440×900; inspect phone and desktop screenshots using actual archived content, plus long text/broken image/keyboard regressions.

### 승인된 배포와 편집 품질 검증

- 단순 기사량이나 자극적 제목 대신 확인된 변화·사회적 영향·일상과의 관련성을 중심으로 편집한다. 흥미는 사실에 근거한 의미와 맥락으로 설명하며 전망·주장·확정 사실을 구분한다. 낯선 이름·용어를 설명하되 원문에 없는 인과·수치·인용은 만들지 않는다.
- 기존 Terra 요약·Sol 최종 편집과 자격 증명을 유지한다. 추가 유료 생성·원문 호출 없이 단위/회귀 검증을 수행한다. 프롬프트·회귀 테스트의 통과를 실제 발행 기사 품질의 보증으로 표현하지 않는다.
- 홈페이지·정기 알림 설정에 diff가 없는지 확인하고, 수신 화면 브라우저 검증 및 backend verify 후 게시한다. 운영에서는 실제 보관 발행본을 GET으로 확인하며 신규 발송·구독 변경은 하지 않는다.

---

## 이전 작업 · 뉴스 품질과 휴대폰 읽기

### Resolved inputs

- Topic: 아침결 수신용 기사에서 실제로 확인된 핵심과 확인 한계를 한눈에 읽기.
- Offer: 제목을 반복하는 대신 핵심 사실·쉬운 맥락·원문을 순서대로 제공한다.
- Audience: 이동 중 휴대폰을 보는 한국어 독자와 같은 편지를 PC에서 여는 독자.
- Primary user action: 받은 편지의 기사 제목 → 핵심 요약과 확인할 점 → 필요할 때 `자세히 읽기`와 `원문과 출처`.
- Deliverable: 기존 `/briefing/delivery/`의 상세 읽기 보완과 수집·근거 확인 품질 개선. 새 메인이나 별도 사이트는 만들지 않는다.
- Style direction: 기존 아침결 편지형 에디토리얼. 한 열, 얇은 선, 섹션별 한 가지 역할. 첫 화면을 정보에 쓴다.
- Tonal key: 흰색 종이, 잉크 `#182334`, 보조 `#536175`, 액션 `#2157b5`, 핵심 `#edf4ff`, 확인할 점 `#fff6e8`과 짙은 갈색 `#654512`.
- Icon policy: 기존 메일 아이콘과 방향 아이콘만 재사용한다. 확인 상태는 색뿐 아니라 문구로 표시한다.
- Proof assets: 11월 6일 실제 발행본의 기존 제목·요약·원본 사진·출처, 별도로 표시한 합성 검증 데이터. 새 사실이나 생성 이미지는 추가하지 않는다.
- Motion intensity: 없음. 네이티브 펼치기와 기존 키보드 복귀를 사용한다.

### Composition contract

- Hero archetype: 기존 발행일과 기사 제목, 이어지는 작은 핵심 요약 블록. 휴대폰에서 사진이 읽기 시작점을 가로막지 않는다.
- First-viewport structure: 기사 제목 → 확인된 범위의 핵심 문장 또는 근거가 연결된 추가 사실(최대 두 문장) → 확인할 점이 있으면 첫 문장. 쉬운 맥락을 먼저 읽고 사진은 원본 비율로 이어진다.
- Primary visual/proof artifact: 같은 기사 내 기존 텍스트에서 고른 완결 문장과 실제 원문 링크. 같은 제목·수치의 반복은 줄이되 시점·수치·단위·확정 여부가 다른 문장은 같은 뜻으로 처리하지 않는다.
- Interaction behavior: 상세의 `자세히 읽기`는 네이티브 펼치기. 추가 배경·영향·전체 근거에 접근할 수 있고, 확인할 점과 원문은 펼치지 않아도 찾을 수 있다. 목록/이전/다음·글자 크기·정정·근거 링크를 보존한다.
- Reuse boundary: `/`, 일반 `/briefing/`, 수신 링크, 일정, 키·모델·호출량, 커버리지와 기사 수 기준 그대로. 기존 발행본 재생성·발송 없음. 출처·기사 번호는 데이터로 처리한다.

### Editorial and responsive contract

- 실제 발행본에서 제목과 한 줄 요약이 유사하고, 불확실성은 여러 문단에 흩어졌다. 기존 수집의 URL 비교는 모든 쿼리를 버려 기사 ID가 쿼리에 있는 매체의 서로 다른 기사를 합칠 수 있었다.
- 수집 시 기사 번호·의미 있는 쿼리를 유지하고 명백한 추적 파라미터만 제외한다. 묶음에는 전날에 수집한 같은 사건의 기사를 쓰고, 같은 사건에 공식 원문이 있으면 요약 입력에 우선 포함한다. 기사 근거의 소스 인덱스는 저장 순서대로 다시 읽는다.
- 제목·한 줄 요약의 측정 수치는 연결한 원문 발췌의 수치·단위와 대조한다. 두 매체에서 같은 값의 근거를 확인할 수 없으면 해당 수치가 틀렸다고 단정하지 않고 확인 상태를 낮춘다. 이 검사는 기사 탈락·발송 차단·추가 API 호출 조건이 아니다.
- 수신 상세에만 SUIT 400/600/700, 제목 27–40px, 본문 기본 17px/1.76, 메타·레이블 13–14px를 유지한다. 모바일 좌우 여백 20px, 주요 링크와 펼치기는 44px 이상, PC 본문 최대 폭 744px 유지. 12/16/24/32px 간격, 긴 한글은 keep-all + 안전 줄바꿈, 사진·본문 말줄임 없음.
- 확인할 점은 제목 가까이에 두고, 원문 링크는 분명히 표기한다. 중복 판정은 보수적이며 확정/예정, 수치가 다른 문장은 보존한다. 정보가 없으면 섹션을 만들지 않는다. API가 빈 날짜나 실패할 때의 기존 안내는 유지한다.
- 제목을 이해하는 데 필요한 용어가 있으면 한 기사에 하나만 풀이한다. 시작 용어는 [한국거래소의 사이드카 안내](https://global.krx.co.kr/contents/GLB/01/0109/0109000000/guide_to_trading_in_the_korean_stock_market.pdf), [금융위원회의 ELS 설명](https://www.fsc.go.kr/no010107/84076), [질병관리청 조류인플루엔자 문답](https://www.kdca.go.kr/bbs/kdca/42/310672/download.do)으로 근거를 제한한다. 용어 안내 출처는 뉴스 사건의 원문과 구분하고, 애매한 약어만으로는 풀이를 붙이지 않는다.

### Filled generation prompt · 수신 기사 읽기

Create one focused, responsive improvement for 아침결 수신 기사. Offer a fast, evidence-led reading path for a Korean subscriber on a small phone and the same reader on desktop. Make the article title and up to two complete, non-repetitive key points the main proof; keep uncertainty near them, then short plain context, uncropped optional photo, expandable depth and visible real sources. Use existing SUIT, white paper, restrained blue and a clearly labelled warm caveat surface. Keep headlines and facts readable with no fixed truncation or invented explanation. Use native controls with visible focus and 44px touch targets; preserve exact dated links and return focus. Do not change the homepage, delivery schedule, source verification requirement, model or credentials.

Output target: `frontend/components/ReceivedBriefing.tsx`, its existing CSS module, and `frontend/lib/received-reading.ts`. Source checks belong to the existing Kotlin editorial pipeline and do not add network calls or publication blocks.

### Verification

- 전날 기사 URL의 다른 기사 ID 유지, 추적 URL 중복 제거, 공식 원문 우선, 수치·단위 불일치와 동일 매체 중복에서 확인 상태 하향, 발행본·스포츠 유무·15건 초과 회귀를 JDK21 테스트로 확인한다.
- 동일 제목을 반복하지 않는 핵심, 숫자와 부정·예정 문장 보존, 출처와 확인 문구의 위치, 펼치기, 사진 원본 비율과 날짜 고정 링크를 단위·브라우저에서 확인한다.
- 360×800, 390×844, 768×1024, 1440×900의 기존 실발행본을 읽기 전용으로 미리 보고, 모바일과 PC 캡처를 비교한다. API 키·실제 요약 호출·커밋·푸시·배포·발송은 이 검증에 포함하지 않는다.

---

## 이전 작업 · 2026-11-08 · 받는 뉴스레터만

사용자가 확정한 범위는 **받는 뉴스의 UI·UX와 메일 미리보기**다. `/`와 기존 `/briefing/`의 코드, 스타일, 시작 주소, 보관함 링크는 그대로 둔다. 이전의 뉴스 홈 계획은 배포 이력으로 보존한다.

### Resolved inputs

- Topic: 아침결의 수신용 하루 뉴스레터와 한 편 읽기.
- Offer: 평일 아침 받은 한 편에서 제목을 빠르게 훑고, 선택한 기사만 핵심부터 읽는다.
- Audience: 출근길에 한 손으로 보는 한국어 독자와 데스크톱에서 차분하게 읽는 구독자.
- Primary user action: 기사 제목 누르기 → 같은 발행일의 `#news-ID`에서 핵심 요약 보기. 다음 동작은 원문 확인 또는 `뉴스 목록`으로 돌아가기.
- Deliverable: 실제 알림 전용 `/briefing/delivery/`와 메일 HTML·텍스트 미리보기 `/briefing/delivery/preview/`.
- Style direction: 편지형 에디토리얼. 여백·활자·얇은 구분선으로 정보 위계를 만들고, 사이트 탐색용 필터·큰 대표 사진·홍보 배너는 수신용 화면에 넣지 않는다.
- Tonal key: 밝음. 백지, 중립적인 남색 잉크, 읽기 행동에만 절제된 블루.
- Icon policy: 아침결 기존 메일 표식, 이동 방향·외부 원문에만 작은 아이콘. 장식이 텍스트를 대체하지 않는다.
- Proof assets: 기존 발행 API의 실제 발행일·선택된 기사·원문과 제공된 사진. 배포 전 캡처는 2026-11-06 공개 보관 발행본을 사용한다.
- Motion intensity: 거의 없음. 선택·포커스 색상만 사용하고, 기사 전환은 즉시 이동한다.

### Composition contract

- Hero archetype: 단일 편지 머리글. 제목과 날짜가 첫 시선을 받고, 그 아래 첫 기사 제목이 곧바로 보인다.
- First-viewport structure: 메일 표식·아침결·발행일 → `어제의 핵심 뉴스` → 기사 수와 한 줄 안내 → 편집 순서의 제목 목록. PC에도 사이드바나 큰 이미지 없이 같은 한 열을 쓴다.
- Primary visual/proof artifact: 받은 편지의 실제 제목 목록, 열린 기사에서 제목 직후의 `핵심 요약`과 원본 비율 사진. 사진이 없거나 열리지 않으면 공간 없이 본문으로 이어진다.
- Interaction behavior: 제목 링크 → 같은 날짜 기사, 이전·다음 기사, 목록에서 눌렀던 행에 키보드 포커스 복귀, 실제 원문 링크와 기존 상세의 의견 기능 연결. 이메일은 스크립트 없이 날짜가 고정된 웹 기사 링크로 연결한다.
- Reuse boundary: 기존 공개 API, 기기 글자 크기, 실제 알림 한 번, 발행일, 기사 수·편집 순서, 발송 일정, 인증/구독을 유지한다. 알림 페이로드의 목적지만 바꾸고 이미 받은 링크는 계속 열리게 한다. 메일 서버나 이메일 주소 수집은 추가하지 않는다.

### Product evidence and visual system

- 기존 `/briefing/`에는 검색·분류·대표 기사 등 직접 방문을 위한 탐색 요소가 있고, 실제 알림도 같은 주소를 열었다. 이메일 전송 제공자는 없으며 기존 HTML 메일 틀은 큰 배너와 중첩 카드로 길었다. 따라서 기존 페이지는 유지하고, 수신용 편지만 별도로 만들며 이메일은 발송 없는 시안으로 정확히 구분한다.
- [토스피드 뉴스레터 태그](https://toss.im/tossfeed/tag/%EB%89%B4%EC%8A%A4%EB%A0%88%ED%84%B0), [토스피드 토스-뉴스레터](https://toss.im/tossfeed/tag/%ED%86%A0%EC%8A%A4-%EB%89%B4%EC%8A%A4%EB%A0%88%ED%84%B0), [토스 테크](https://toss.tech/)에서 제목과 짧은 메타 정보가 먼저 읽히는 위계, 상세의 넉넉한 문장 폭과 여백만 참고했다. 토스 글꼴·자산·카피는 복제하지 않는다.
- SUIT 400/600/700과 Apple SD Gothic Neo·Malgun Gothic 대체 글꼴. 메일 HTML은 웹폰트나 이미지 없이 기기 서체로 완결한다. 웹: 머리글 제목 모바일 32px, PC 최대 44px/1.2, 목록 18–20px/1.45, 상세 제목 28–40px/1.3, 핵심 18–20px/1.6, 본문 17px/1.75. 보조 13–15px. 잉크 `#182334`, 보조 `#536175`, 액션 `#2157b5`, 핵심 바탕 `#edf4ff`, 종이 `#fff`, 배경 `#f3f6fa`, 경계 `#dfe6ef`.
- 한 열 최대 744px, PC 안쪽 48px, 모바일 20px 및 기기 안전 영역. 8/12/16/24/32/48px 간격, 기사 간 1px 구분선. 링크는 44px 이상, 한국어 keep-all + 긴 문자열 안전 줄바꿈, 제목 말줄임 없음. 이미지 본문은 `max-width:100%; height:auto`로 전체를 보여준다. 메일은 최대 640px과 한 열의 호환성 높은 표·인라인 스타일·텍스트 대체 본문을 제공한다.
- 명시된 발행일 오류·불일치에는 다른 날짜 뉴스로 대체하지 않는다. 로딩, 발행본 없음, 네트워크 오류, 저장된 동일 발행본은 구분하고 다시 시도 또는 지난 뉴스로 이어진다. HTML 메일이 매우 길어지는 예외에는 잘린 메일 대신 전체 발행본 링크와 기사 수를 보여주며 웹 기사 수는 제한하지 않는다.

### Filled generation prompt · 수신용 편지

Create one responsive reading design for 아침결 수신 뉴스레터, not a replacement homepage. The offer is a dated morning edition whose titles are quick to scan. The audience is Korean mobile and desktop subscribers; the main action is tapping a title and seeing its key point immediately. Deliver the isolated Next.js recipient view, its email-safe HTML/text rendering and an honest browser prototype. Use the existing SUIT and mail mark, a white editorial sheet and one restrained blue, not a copy of Toss assets or type.

Use one composition: quiet dateline and headline, one complete list with no article-count cap, then a focused article view with key point above optional uncropped photography, explanatory paragraphs, corrections/evidence and source links. Keep motion to state feedback, use visible focus and native links, preserve the date and the return position. On mobile keep wide text and 44px targets; on PC center the same legible column. Show actual content and fail honestly. Make the email usable without JS, web fonts or images. Do not invent a real email delivery, resend notifications, change news selection, or modify existing home/navigation.

Output target: `frontend/app/briefing/delivery/`, `frontend/components/ReceivedBriefing*`, `frontend/components/ReceivedMailPreview.tsx`, `frontend/lib/use-received-edition.ts`, `frontend/lib/email-template.ts`, `frontend/lib/newsletter/render-received-mail.mjs`. Integrate the same date-pinned destination into existing web push and service-worker fallbacks without rewriting old payload URLs.

### Verification plan

- 기존 홈과 `/briefing/`에 새 화면·링크가 섞이지 않는지 확인. 본인/정기 푸시가 사용하는 공통 링크 생성과 서비스 워커의 새·기존 URL 처리를 단위 검증하되 실제 알림을 발송하지 않는다.
- 29건 에디션의 마지막 기사, 날짜가 틀린 응답, 빈 편지·재시도, 이미지 누락·긴 한글, 키보드 열기·이전/다음·목록 포커스·큰 글씨를 확인한다. 메일 시안의 기사 링크·HTML/텍스트·다운로드와 잘림 방지 한계를 테스트한다.
- 360×800, 390×844, 768×1024, 1440×900에서 실발행본과 메일 시안의 캡처·콘솔·넘침·사진 비율을 확인한 후 원본 → 포크 → 기존 Coders 프로젝트 순서로 배포한다. 실제 수신함의 Gmail·Outlook·Apple Mail 발송 검증은 포함하지 않는다.

---

## 이전 작업 · 2026-11-08 · 뉴스 홈

이 작업의 완성안은 아래 하나다. 뒤의 기존 편지형·메일 시안과 배포 승인 기록은 보존하며, 이 작업의 새 발행이나 배포를 승인하는 문서가 아니다.

2026-11-08 후속 배포 요청: 뉴스 홈과 기사 선정 변경을 운영에 반영한다. 검증 중 구형 시안의 iPhone WebKit에서 기사 팝업을 닫은 뒤 포커스가 돌아가지 않는 문제가 발견됐다. 기존 색상·서체·레이아웃·경로는 유지하고, 팝업을 연 버튼을 직접 기억해 실제 닫힌 다음 그 버튼에 포커스를 돌려준다. 기존 Escape 테스트를 데스크톱·모바일에서 다시 실행한다. 뉴스 재생성·알림 발송은 범위 밖이다.

### Variant 1 — 아침결 뉴스 홈

#### Resolved inputs

- Topic: 아침결의 발행일별 뉴스 홈과 개별 기사 읽기
- Offer: 한 번의 알림으로 들어와 전날의 주요 이슈와 여러 출처가 다룬 소식을 훑고, 검증된 전체 기사를 읽는 서비스
- Audience: 출근길의 모바일 독자와 PC에서 분야별로 깊게 읽는 한국어 독자
- Primary user action: 대표 기사 또는 관심 분야의 제목을 눌러 기사 한 편을 읽기
- Deliverable: 기존 Next.js 정적 React /briefing/ 화면과 스코프 CSS Module
- Style direction: Editorial. 흰 종이, 아침결 블루, 조용한 본문, 헤드라인·출처에 명확한 활자 위계
- Tonal key: Light. 흰 종이와 중립적인 옅은 블루 그레이
- Icon policy: Minimal. 기존 메일 표식과 lucide의 검색·이전·다음·설정 아이콘만 사용
- Proof assets: 기존 API의 실제 발행일·기사·출처, 제공된 원본 사진과 사진 출처; 로컬 검증의 보관 뉴스는 실제 날짜 표시
- Motion intensity: Minimal. 색상·포커스 피드백만, 자동 넘김 없음, prefers-reduced-motion 준수

#### Composition contract

- Hero archetype: asymmetrical. 실제 첫 기사 한 편이 화면의 중심. 장식 배너, 자동 슬라이더, 광고 영역 없음.
- First-viewport structure: 아침결 머리글·지난 뉴스·알림 설정 → 실제 발행일과 뉴스 수 → 검색과 분야 메뉴 → 넓은 대표 뉴스 + 좁은 ‘여러 곳에서 다룬 뉴스’ → 전체 목록 첫 줄. 768px 미만에서 대표 기사의 제목·핵심·사진 순으로 쌓고 이어지는 제목 목록을 보여준다. 여러 출처 뉴스가 없으면 해당 순위를 만들지 않고 다른 주요 기사 제목을 쓴다.
- Primary visual/proof artifact: 기존 브리핑 대표 기사 제목, 한 줄 결론, 원본 사진과 표시 가능한 사진 출처. 사진이 없으면 제목과 결론의 타이포그래피가 중심이다.
- Interaction behavior: 대표 기사의 ‘기사 읽기’와 각 제목은 같은 발행일의 #news-ID를 연다. ‘전체 기사’는 #mail-contents로 이동. 목록 필터·검색·출처순과 더 보기는 모든 발행 기사에 적용. 닫기/목록 또는 브라우저 뒤로 가기 때 이전 탐색과 포커스 유지. 상세는 이전·다음 기사, 실제 원문, 글자 크기, 공유, 근거·정정·관심도·신고 보존.
- Reuse boundary: 기존 /briefing/?date=, #news-ID, #mail-contents, API/기기 세션, SUIT 글꼴, 알림 하나와 기존 평일 시간 유지. 새 카테고리 라우트, 이메일 발송, 독자 조회 통계, 새 인증, UI 프레임워크 도입 없음.

#### Product evidence and exact visual system

- 기존 운영 화면은 최대640px짜리 한 문서에 목차와 기사 본문 전체가 이어져 15건에서도 탐색 길이가 길었다. 11월8일 운영 공개 API는 최신 발행일 11월6일(금), 15건, 8개 분야, 사진15개. 주말에 오늘 뉴스라고 바꾸어 보여주지 않는다. 15건은 백엔드 발행 상한과 목표 값(둘 다 15), 카테고리별 발행 상한, 편집 재채우기에서 생겼다. 뉴스 모으기·검증·읽기 배치는 별개다.
- [AI타임스](https://www.aitimes.com/)의 헤드라인, 분야 메뉴, 최신 기사와 [인공지능신문](https://www.aitimes.kr/)의 대표 뉴스와 좁은 관련 소식 목록 구조를 참고한다. .kr PC 화면과 좁은 폭에서 관찰한 고정 폭/가로 넘침, 광고, 제목 말줄임, 사이트 로고와 사진은 복제하지 않는다.
- SUIT Regular/SemiBold/Bold, Apple SD Gothic Neo/Malgun Gothic/system sans fallback. 잉크 #172337, 보조 #506078, 링크·선택 #1d4ed8, 포커스 #2563eb, 배경 #f5f7fb, 종이 #ffffff, 경계 #dfe6ef, 얕은 블루 #edf3ff. 대표 제목 34px/1.25 PC, 26px/1.32 모바일; 목록 제목 17–19px/1.45, 본문 18px/1.75, 보조 14–16px. 굵기 400/600/700. 과도한 영문 라벨이나 반복 인사말 없음.
- 데스크톱 전체 폭 최대1200px, 32px 가터, 대표 섹션 2.15:1, 28px 간격. 주요 기사 안에는 충분한 폭에서 사진과 텍스트 나란히; 768px 이하에는 한 열, 18–24px 가터. 상세 글은 최대760px, 본문 약688px. 8/12/16/24/32/40px 리듬, 8–12px 반경은 사진과 입력/선택에 한정하고 섹션은 얇은 구분선으로 정리.
- 뉴스 제목은 자르지 않고 keep-all과 anywhere 안전 줄바꿈. 썸네일은 3:2, 대표 사진은 PC 16:10·모바일 16:9 영역 안에 contain; 원본을 자르지 않는다. 상세 사진은 max-width:100%, height:auto로 원본 비율을 유지하고 작은 원본을 확대하지 않는다. 오류/없음은 사진 영역을 제거하며 기사는 계속 읽을 수 있다. 제목과 함께 있는 목록 썸네일은 장식 alt="", 본문 사진은 제목 기반 대체 텍스트 및 제공된 사진 출처.
- 분야 메뉴는 좁은 화면에서 가로 이동 가능한 메뉴만 스크롤. 검색어·분야 변경 시 목록을 다시 12건씩 표시하며 나머지 전부는 더 보기로 접근한다. 12건은 한 번에 그리는 행 수일 뿐 발행 상한이 아니다. 필터 결과/진행 건수 표시, 검색 지우기, 링크 접근 가능, 44px 제어, 명확한 포커스와 빠진 기사 링크 안내. 최신·보관·캐시·실패·빈 에디션 표시 유지.
- 자주 보도된 소식의 기준은 해당 기사에 연결된 서로 다른 출처 수다. 조회수/검색량/실시간 인기라고 표시하지 않는다. 전체 기사에 출처순을 제공하며 오른쪽은 예시 순위나 별도 발행 제한이 아닌 탐색 바로가기다.

#### Editorial and operations contract

- 수집·요약 호출 예산, 입력 발행일, 키와 Terra/Sol 모델 및 07:30 평일 발송 일정은 유지. 발행 결과의 15건/분야 상한과 채우기 목표만 제거한다. 사용자 후속 요청에 따라 중요도·추천 기준을 낮추지 않고, 여러 출처의 보도는 통과한 기사 안에서 우선순위에만 반영한다. 반복 수집, 같은 출처 기사 수, 홍보/근거 부족/상충은 숫자 늘리기 용도로 사용하지 않는다.
- 기존 출처·교차확인·홍보·상충 검증, 사건 단위 중복 제거 유지. Sol은 선별을 다시 잘라내지 않고 제한된 후보의 앞 순서만 정한다. 나머지 적격 기사와 가능한 스포츠/e스포츠도 모두 반환. 편집 장애에는 안전한 기본 순서, 빈 실패에는 기존 에디션 보존. 기사 수에 비례해 정정·출처·근거 DB 왕복이 커지지 않게 묶어서 읽는다. 기존 API 응답에 출처 수만 선택적으로 덧붙이며 스키마 변경 없음.
- [OpenAI 공식 구조화 출력 문서](https://developers.openai.com/api/docs/guides/structured-outputs)와 [Sol 모델 문서](https://developers.openai.com/api/docs/models/gpt-6.1-sol)를 확인했다. 기존 Responses 엄격한 JSON·토큰 한도 유지. 현재 작업에서 실제 OpenAI 호출, 운영 데이터 쓰기, 푸시, 커밋, 푸시 또는 배포는 하지 않는다.

#### Verification plan

- 실제 읽기 경로 /briefing/ → 공개 브리핑 API → 실제 발행일/기존 출처 정보 → 대표 기사·전체 목록 → 한 편/원문/이전·다음/목록. 백엔드 가짜 수집·모델 응답으로 15건 초과 발행, 순서 편집 실패·누락, 출처 신호와 근거 조건, 적격 스포츠·e스포츠 보존 검증. 브라우저에서는 테스트 데이터로 15건을 넘는 전체 목록과 검색·정렬·복귀를 검증하되 사용자에게 실제 뉴스처럼 보여주지 않는다.
- 린트·단위·빌드, 360×800/390×844/768×1024/1440×900 실제 보관 뉴스 화면과 글자 크기·키보드·사진 비율·콘솔 검사. 잘못된 날짜/없어진 기사/실패 복구 및 페이지 내 이동 중 재요청 없는지 확인. 로컬 미리보기에서 운영에는 공개 GET만 사용하고 모든 쓰기는 격리.

#### Filled generation prompt

Create one high-concept page for 아침결의 발행일별 뉴스 홈과 개별 기사 읽기.

#### Inputs
- Topic: 아침결의 발행일별 뉴스 홈과 개별 기사 읽기.
- Offer: 한 번의 알림으로 들어와 전날의 주요 이슈와 여러 출처가 다룬 소식을 훑고, 검증된 전체 기사를 읽는 서비스
- Audience: 출근길의 모바일 독자와 PC에서 분야별로 깊게 읽는 한국어 독자
- Primary user action: 대표 기사 또는 관심 분야의 제목을 눌러 기사 한 편을 읽기
- Deliverable: 기존 Next.js 정적 React /briefing/ 화면과 스코프 CSS Module
- Style direction: Editorial. 흰 종이, 아침결 블루, 조용한 본문, 헤드라인·출처에 명확한 활자 위계
- Tonal key: Light. 흰 종이와 중립적인 옅은 블루 그레이
- Icon policy: Minimal. 기존 메일 표식과 lucide의 검색·이전·다음·설정 아이콘만 사용
- Proof assets: 기존 API의 실제 발행일·기사·출처, 제공된 원본 사진과 사진 출처; 로컬 검증의 보관 뉴스는 실제 날짜 표시
- Motion intensity: Minimal. 색상·포커스 피드백만, 자동 넘김 없음, prefers-reduced-motion 준수

#### Objective
Design one premium, memorable page with a dominant hero and one coherent visual world derived from the topic itself.
The result should feel specific, intentional, and action-oriented when the concept calls for action, not like a generic startup or SaaS template.

Choose the strongest clear solution.
Do not collapse the concept into a simpler generic pattern just to make execution easier.

- Treat single-file execution as a packaging constraint, not a creative constraint.
Do not reduce conceptual ambition, visual specificity, interaction richness, or production quality merely because the deliverable is concise.

#### Internal concept choice
Before composing, decide internally:
- one dominant hero archetype: centered / asymmetrical / immersive
- one dominant proof mode: none / embedded gesture / single artifact
- one palette driver derived from the topic
- one tonal key: light / mid / dark / topic-derived
- one motion role: none / minimal / ambient / interactive
- one icon approach: none / minimal / expressive / topic-native
- optionally one secondary accent only if it strengthens the main direction without creating a second visual world
Do not output this planning.

#### Non-negotiables
- Use a strong hero-first composition.
- Headline: 3-12 words, max 3 lines.
- Supporting copy: 1-2 short sentences, concise and specific.
- CTAs are optional. If used, include at most 1 primary and 1 secondary CTA.
- If a clear next step is central to the offer or concept, include a CTA; otherwise CTA omission is allowed.
- CTA labels must be specific to the offer and action, not generic.
- Supporting highlights are optional. If used, show them only once in a single lower support cluster beneath the hero.
- Keep the hero dominant, focused, readable, and uncluttered.
- Proof is optional. Use it only if it clearly strengthens the concept.
- If no real proof assets are provided, do not invent metrics, testimonials, customer logos, screenshots, or fake UI proof.
- Prefer depth inside the hero, proof gesture, CTA behavior, support copy, or background logic rather than adding extra sections by default.

#### Composition
- Choose the clearest structure for the topic; do not default to generic two-column marketing layouts.
- A top navigation bar is optional. When used, make it native to the chosen style direction and subordinate to the hero rather than a generic boxed header.
- The hero may be fully integrated rather than framed.
- The hero does not need to become a panel, dashboard, device mockup, rounded card, or floating showcase unless the topic genuinely demands that artifact.
- Build hierarchy through scale, contrast, spacing, alignment, depth, rhythm, and composition before using frames, dividers, or containers.
- Keep supporting content clearly subordinate to the hero.
- Do not interpret structural restraint as permission to flatten the concept into a generic minimal layout.
- Do not use text-on-text layering, typographic collisions, or overlapping live text as a compositional device.

#### Visual system
- Build one coherent visual world derived from the topic itself.
- Let the topic drive palette, contrast, typography, spacing, geometry, motifs, materials, and motion.
- Even restrained palettes must feel intentional and specific, not generic premium-neutral.
- The background must actively contribute mood, depth, and topic logic.
- If the topic suggests a real system language, physical behavior, or interface grammar, show that directly instead of generic abstract-tech decoration.
- Treat headline typography as part of the concept, not neutral text.
- The headline may use topic-derived color, selective emphasis, multi-tone treatment, or gradient accents when they strengthen the concept and remain readable.
- Do not default the headline to neutral black, white, or near-white unless that is clearly the strongest topic-native choice.

#### Background and tonal diversity
- Premium and atmospheric design may be light, mid-tone, or dark; do not default to dark.
- Choose the tonal key from the topic, offer, audience, and style direction rather than from generic cinematic or tech aesthetics.
- Contrast may come from hue, saturation, temperature, texture, density, or scale, not only darkness.

#### Proof and concept expression
- Prefer the minimum visual evidence needed to make the idea feel specific, credible, and native to the topic.
- If the concept is strongest with typography, atmosphere, and one precise gesture, do that.
- If a stronger proof artifact is justified, use one legible, unified artifact rather than multiple fragmented panels.
- Proof may take the form of a signal, trace, contour, command line, path, specimen, structural mark, scene fragment, or other topic-native evidence.
- Typography itself may carry part of the concept or proof.
- When appropriate, use one precise typographic gesture—such as selective word emphasis, chromatic offset, gradient emphasis, distortion, signal breakup, or structural interruption—to make the concept feel more specific and alive.
- Prefer one strong typographic intervention over many scattered decorative effects.
- Avoid decorative pseudo-proof.
- Avoid turning simple ideas into framed showcases, dashboard fragments, floating panels, softened slabs, or generic marketing geometry.

#### Icons and symbolic language
- Icons are optional.
- Use icons only when they improve scanability, recognition, navigation, proof clarity, or support-cluster legibility.
- Prefer topic-native icon logic over generic startup glyphs.
- Keep icon style consistent in stroke weight, geometry, corner logic, and detail level.
- Use icons primarily in clearly secondary roles unless a single topic-native symbol is central to the concept.
- Do not let icons compete with the hero headline, proof artifact, or CTA hierarchy.

#### Support cluster
- If used, show supporting highlights only once, in a single lower cluster beneath the hero.
- Each highlight should be short, fast to scan, and clearly secondary.
- Supporting highlights may use concise icons or symbolic marks when helpful.
- Support-cluster elements may use subtle motion when it improves scanability, continuity, or atmosphere and remains clearly secondary.
- Card-like grouping is allowed only inside this lower support cluster.
- These modules may use at most one light surface treatment, such as a subtle stroke, tonal fill, or very soft shadow.
- Keep support modules uniform, non-nested, and visually subordinate.
- Do not use card-like structures in the hero, proof, CTA area, or elsewhere on the page.

#### Motion
- Motion is optional.
- Use motion only when it supports hierarchy, continuity, feedback, atmosphere, or topic logic.
- Default to none, minimal, or ambient motion depending on what the concept actually needs.
- Motion may live in typography, background behavior, proof logic, support-cluster behavior, or interaction feedback.
- A single key word or short phrase may use subtle text-based motion such as glitch, flicker, jitter, scanline shift, chromatic split, text scramble, pulse, or reveal if it strengthens the concept.
- Keep motion controlled, readable, non-blocking, and subordinate to clarity.
- Avoid scrolljacking, attention-hijacking loops, and ornamental animation.
- Respect reduced-motion preferences.

#### Accessibility and readability
- Preserve strong readability and clear hierarchy at all viewport sizes.
- Maintain sufficient contrast between text and background.
- Do not place essential text over busy imagery unless readability remains strong.
- Avoid cramped spacing, visual collisions, and weak focal hierarchy.
- Do not place badges, pills, annotations, stickers, or floating interface fragments over essential text.
- If the deliverable is code, use semantic HTML structure, visible focus states, keyboard-friendly interactions, and reduced-motion handling.
- When in doubt, preserve legibility over expressive overlap.

#### Anti-drift rules
- Do not drift into bland corporate SaaS styling.
- Do not default to dashboard aesthetics, feature-grid thinking, boxed-section composition, or template-like modularity.
- Do not use disconnected motifs, random color choices, or interchangeable abstract-tech shapes.
- Do not use card-within-card composition, nested surfaces, floating panels, fake proof, or stock-looking UI.
- Keep one visual world, one dominant hero, and one clear structural logic.
- Do not allow text, labels, or interface elements to overlap, collide, or sit on top of one another.

#### Output
Return only the final 기존 Next.js 정적 React /briefing/ 화면과 스코프 CSS Module.

If the deliverable is code:
- Output a complete production-ready file or component.
- Keep dependencies minimal unless explicitly requested.
- Make it responsive.
- Keep support highlights in one lower support cluster only when used.

#### Final self-check
Before returning, verify that the result keeps:
- one dominant hero
- one coherent visual world
- no invented proof
- no cardification outside the lower support cluster
- no generic SaaS drift
- no unnecessary structural fragmentation
- no nested containment
- no floating sub-surfaces
- all text clearly legible and comfortably spaced

#### Output target

- Path: `frontend/components/DailyBriefingLetter.tsx`, `frontend/components/NewsEditionIndex.tsx`, `frontend/components/DailyBriefingLetter.module.css`, `frontend/lib/daily-letter.ts`. 기존 /briefing/ 라우트는 같은 데이터 계약을 유지한다.
- 관련 백엔드: `NewsBriefingGenerator.kt`, `EditorialReviewer.kt`, `BriefingService.kt`, 필요한 저장소·설정 및 테스트, README.

---


## Variant 1

### Resolved inputs

- Topic: 아침결의 독자를 위한 로컬 뉴스 리더 디자인 프로토타입
- Offer: 짧은 핵심 요약에서 배경 설명과 출처로 자연스럽게 이어지는 읽기 경험
- Audience: 출근길 휴대폰과 업무 중 데스크톱에서 전날 뉴스를 이해하려는 한국어 독자
- Primary user action: 보관 브리핑의 핵심을 훑고 관심 기사의 상세 내용을 읽기
- Deliverable: existing Next.js React component with scoped CSS, isolated /prototype/ route
- Style direction: Editorial — 따뜻한 종이색, 짙은 초록, 선명한 타이포그래피와 실제 보관 기사 사진
- Tonal key: Light, warm ivory paper and forest-green ink
- Icon policy: Minimal, consistent lucide outline icons only for reading controls
- Proof assets: 2026-09-16 아침결 보관 브리핑에서 선택한 6개 기사, 원문 링크와 제공된 이미지; 최신 뉴스 또는 독립 검증 결과가 아님
- Motion intensity: Minimal; 160ms hover and focus feedback, native dialog, respect prefers-reduced-motion

### Composition contract

- Hero archetype: asymmetrical editorial reading surface, not a marketing landing.
- First-viewport structure: small prototype disclosure strip; mail masthead and reading controls; dated edition heading; green-ink headline “세상을 읽는, 가벼운 아침.”; compact three-story overview. Below it a lead photo/article and a desktop edition index. On mobile the overview is condensed and the beginning of the first story remains discoverable by scrolling.
- Primary visual/proof artifact: one intact source photograph for the leading archived story, with visible publisher credit. No fabricated photos or data.
- Interaction behavior: category chips filter six local articles; 핵심만 / 배경까지 changes reading density; bookmarks and read markers persist only in prototype-namespaced localStorage; article detail uses a native modal dialog with Escape and focus restoration; font size is adjustable; sources open real links.
- Reuse boundary: reuse existing Next.js, React, lucide and type vocabulary. Keep production BriefingDelivery, global theme, subscription APIs, backend and schedules unchanged. Add only prototype-specific styling and a PwaRegister prototype-route early return so the preview cannot request notification permission or reconcile subscriptions.

### Product evidence and scope

The existing frontend uses Next.js 16 / React 19 / Tailwind 4 and lucide-react. The production reader is frontend/components/BriefingDelivery.tsx. Its dense story content, wide illustrations and multiple controls motivate a quieter scan → read → source hierarchy. The new route is an isolated concept, not a replacement or deployment.
The live October 22 edition returned zero stories during inspection, so this design uses SIX selected entries from the existing September 16 archive instead of inventing current news. Show the archive date and prototype label visibly. Category classification is preserved except the football article is explicitly shown in the sports category, matching its content. No e-sports article is fabricated. The fixture content has not been independently fact-checked during this design task.

### Content, actions and visual tokens

- Primary CTA: “기사 읽기”, opening the local detail dialog for the selected archived article.
- Secondary action: “나중에 읽기”, toggling a prototype-only saved item. Saved view has a useful empty state and return action.
- Page hierarchy: dated edition → three quick summaries → category navigation and density controls → six readable article cards → end-of-edition note. Desktop right rail is a quiet table of contents, not a dashboard. Mobile lower navigation offers all articles, saved items and top.
- Visual QA refinement: mobile overview starts collapsed; remove redundant introductory copy there; mobile cards show headline → first sentence of the archive's plain-language explanation → intact photo → reading action. Desktop keeps the photo alongside the lead headline. Detail photographs use a shorter contained stage so context is reached sooner. Every image fallback also checks failed images before hydration.
- No sign-up, payment, push, send, or publishing controls. All display settings are local.
- Colors: canvas #f6f5ef; paper #ffffff; ink #202d29; secondary text #5d6963; green #175c46; light green #edf3ee; warm accent #be5c36; border #dce1d9. No gradients, neon or decorative stock graphics.
- Type: Pretendard, Noto Sans KR, Apple SD Gothic Neo, Malgun Gothic, system sans-serif; large edition title uses Georgia/Batang serif where available. 16px reader base, 1.75 line height. 44–54px desktop edition headline / 32px mobile. Card title 24–28px / 21–24px. Metadata at least 12px. Body size control 16–19px.
- Layout: max-width 1220px, outer gutters 48px desktop / 20px mobile, 32px main/rail gap. Mobile one column, desktop 2:1 lead/rail. Article grid 2 columns on wide screens, one on mobile. Spacing multiples of 4px, 12–20px radius only for actual reading cards and controls.
- News is intrinsically a card-reader product requested by the user, so article card grouping takes precedence over generic master prompt restrictions on hero/card grouping. No nested dashboard slabs.
- Images: source-provided URL, publisher credit and descriptive title alt. Use object-fit:contain on a consistent subdued stage, never crop essential photo content. No image available/failed: remove the empty photo region and show a compact “원문 이미지 연결 불가” status, without pretending a generated illustration is news evidence.
- Korean keep-all with overflow-wrap:anywhere; min-width:0 for grid/flex children; all icon-only actions labelled. Touch actions 44px. Visible 3px focus outline. No hover-only controls. Respect reduced motion.
- The source detail explains context first, then significance and source links, with the original archive summary preserved. Do not label speculative/developing claims “verified”.

### Execution and verification

1. Write this plan and isolated fixture, implement route, component and CSS module.
2. Run targeted ESLint, TypeScript/build checks; fix introduced errors.
3. Start local-only server, inspect 360×800, 390×844, 768×1024, 1440×900 screenshots.
4. Test category, density, bookmark persistence and empty state, detail modal, Escape/focus return, font control, source URLs; watch for console errors, failed images, page overflow and any unexpected POST/API request.
5. Keep desktop and mobile screenshots as local deliverables and open local prototype in Codex.
6. No commit, push, deployment, subscriber message, or production data write. No backend or schedule changes.

### Filled generation prompt

Create one high-concept page for 아침결의 독자를 위한 로컬 뉴스 리더 디자인 프로토타입.

## Inputs
- Topic: 아침결의 독자를 위한 로컬 뉴스 리더 디자인 프로토타입.
- Offer: 짧은 핵심 요약에서 배경 설명과 출처로 자연스럽게 이어지는 읽기 경험
- Audience: 출근길 휴대폰과 업무 중 데스크톱에서 전날 뉴스를 이해하려는 한국어 독자
- Primary user action: 보관 브리핑의 핵심을 훑고 관심 기사의 상세 내용을 읽기
- Deliverable: existing Next.js React component with scoped CSS, isolated /prototype/ route
- Style direction: Editorial — 따뜻한 종이색, 짙은 초록, 선명한 타이포그래피와 실제 보관 기사 사진
- Tonal key: Light, warm ivory paper and forest-green ink
- Icon policy: Minimal, consistent lucide outline icons only for reading controls
- Proof assets: 2026-09-16 아침결 보관 브리핑에서 선택한 6개 기사, 원문 링크와 제공된 이미지; 최신 뉴스 또는 독립 검증 결과가 아님
- Motion intensity: Minimal; 160ms hover and focus feedback, native dialog, respect prefers-reduced-motion

## Objective
Design one premium, memorable page with a dominant hero and one coherent visual world derived from the topic itself.
The result should feel specific, intentional, and action-oriented when the concept calls for action, not like a generic startup or SaaS template.

Choose the strongest clear solution.
Do not collapse the concept into a simpler generic pattern just to make execution easier.

- Treat single-file execution as a packaging constraint, not a creative constraint.
Do not reduce conceptual ambition, visual specificity, interaction richness, or production quality merely because the deliverable is concise.

## Internal concept choice
Before composing, decide internally:
- one dominant hero archetype: centered / asymmetrical / immersive
- one dominant proof mode: none / embedded gesture / single artifact
- one palette driver derived from the topic
- one tonal key: light / mid / dark / topic-derived
- one motion role: none / minimal / ambient / interactive
- one icon approach: none / minimal / expressive / topic-native
- optionally one secondary accent only if it strengthens the main direction without creating a second visual world
Do not output this planning.

## Non-negotiables
- Use a strong hero-first composition.
- Headline: 3-12 words, max 3 lines.
- Supporting copy: 1-2 short sentences, concise and specific.
- CTAs are optional. If used, include at most 1 primary and 1 secondary CTA.
- If a clear next step is central to the offer or concept, include a CTA; otherwise CTA omission is allowed.
- CTA labels must be specific to the offer and action, not generic.
- Supporting highlights are optional. If used, show them only once in a single lower support cluster beneath the hero.
- Keep the hero dominant, focused, readable, and uncluttered.
- Proof is optional. Use it only if it clearly strengthens the concept.
- If no real proof assets are provided, do not invent metrics, testimonials, customer logos, screenshots, or fake UI proof.
- Prefer depth inside the hero, proof gesture, CTA behavior, support copy, or background logic rather than adding extra sections by default.

## Composition
- Choose the clearest structure for the topic; do not default to generic two-column marketing layouts.
- A top navigation bar is optional. When used, make it native to the chosen style direction and subordinate to the hero rather than a generic boxed header.
- The hero may be fully integrated rather than framed.
- The hero does not need to become a panel, dashboard, device mockup, rounded card, or floating showcase unless the topic genuinely demands that artifact.
- Build hierarchy through scale, contrast, spacing, alignment, depth, rhythm, and composition before using frames, dividers, or containers.
- Keep supporting content clearly subordinate to the hero.
- Do not interpret structural restraint as permission to flatten the concept into a generic minimal layout.
- Do not use text-on-text layering, typographic collisions, or overlapping live text as a compositional device.

## Visual system
- Build one coherent visual world derived from the topic itself.
- Let the topic drive palette, contrast, typography, spacing, geometry, motifs, materials, and motion.
- Even restrained palettes must feel intentional and specific, not generic premium-neutral.
- The background must actively contribute mood, depth, and topic logic.
- If the topic suggests a real system language, physical behavior, or interface grammar, show that directly instead of generic abstract-tech decoration.
- Treat headline typography as part of the concept, not neutral text.
- The headline may use topic-derived color, selective emphasis, multi-tone treatment, or gradient accents when they strengthen the concept and remain readable.
- Do not default the headline to neutral black, white, or near-white unless that is clearly the strongest topic-native choice.

## Background and tonal diversity
- Premium and atmospheric design may be light, mid-tone, or dark; do not default to dark.
- Choose the tonal key from the topic, offer, audience, and style direction rather than from generic cinematic or tech aesthetics.
- Contrast may come from hue, saturation, temperature, texture, density, or scale, not only darkness.

## Proof and concept expression
- Prefer the minimum visual evidence needed to make the idea feel specific, credible, and native to the topic.
- If the concept is strongest with typography, atmosphere, and one precise gesture, do that.
- If a stronger proof artifact is justified, use one legible, unified artifact rather than multiple fragmented panels.
- Proof may take the form of a signal, trace, contour, command line, path, specimen, structural mark, scene fragment, or other topic-native evidence.
- Typography itself may carry part of the concept or proof.
- When appropriate, use one precise typographic gesture—such as selective word emphasis, chromatic offset, gradient emphasis, distortion, signal breakup, or structural interruption—to make the concept feel more specific and alive.
- Prefer one strong typographic intervention over many scattered decorative effects.
- Avoid decorative pseudo-proof.
- Avoid turning simple ideas into framed showcases, dashboard fragments, floating panels, softened slabs, or generic marketing geometry.

## Icons and symbolic language
- Icons are optional.
- Use icons only when they improve scanability, recognition, navigation, proof clarity, or support-cluster legibility.
- Prefer topic-native icon logic over generic startup glyphs.
- Keep icon style consistent in stroke weight, geometry, corner logic, and detail level.
- Use icons primarily in clearly secondary roles unless a single topic-native symbol is central to the concept.
- Do not let icons compete with the hero headline, proof artifact, or CTA hierarchy.

## Support cluster
- If used, show supporting highlights only once, in a single lower cluster beneath the hero.
- Each highlight should be short, fast to scan, and clearly secondary.
- Supporting highlights may use concise icons or symbolic marks when helpful.
- Support-cluster elements may use subtle motion when it improves scanability, continuity, or atmosphere and remains clearly secondary.
- Card-like grouping is allowed only inside this lower support cluster.
- These modules may use at most one light surface treatment, such as a subtle stroke, tonal fill, or very soft shadow.
- Keep support modules uniform, non-nested, and visually subordinate.
- Do not use card-like structures in the hero, proof, CTA area, or elsewhere on the page.

## Motion
- Motion is optional.
- Use motion only when it supports hierarchy, continuity, feedback, atmosphere, or topic logic.
- Default to none, minimal, or ambient motion depending on what the concept actually needs.
- Motion may live in typography, background behavior, proof logic, support-cluster behavior, or interaction feedback.
- A single key word or short phrase may use subtle text-based motion such as glitch, flicker, jitter, scanline shift, chromatic split, text scramble, pulse, or reveal if it strengthens the concept.
- Keep motion controlled, readable, non-blocking, and subordinate to clarity.
- Avoid scrolljacking, attention-hijacking loops, and ornamental animation.
- Respect reduced-motion preferences.

## Accessibility and readability
- Preserve strong readability and clear hierarchy at all viewport sizes.
- Maintain sufficient contrast between text and background.
- Do not place essential text over busy imagery unless readability remains strong.
- Avoid cramped spacing, visual collisions, and weak focal hierarchy.
- Do not place badges, pills, annotations, stickers, or floating interface fragments over essential text.
- If the deliverable is code, use semantic HTML structure, visible focus states, keyboard-friendly interactions, and reduced-motion handling.
- When in doubt, preserve legibility over expressive overlap.

## Anti-drift rules
- Do not drift into bland corporate SaaS styling.
- Do not default to dashboard aesthetics, feature-grid thinking, boxed-section composition, or template-like modularity.
- Do not use disconnected motifs, random color choices, or interchangeable abstract-tech shapes.
- Do not use card-within-card composition, nested surfaces, floating panels, fake proof, or stock-looking UI.
- Keep one visual world, one dominant hero, and one clear structural logic.
- Do not allow text, labels, or interface elements to overlap, collide, or sit on top of one another.

## Output
Return only the final existing Next.js React component with scoped CSS, isolated /prototype/ route.

If the deliverable is code:
- Output a complete production-ready file or component.
- Keep dependencies minimal unless explicitly requested.
- Make it responsive.
- Keep support highlights in one lower support cluster only when used.

## Final self-check
Before returning, verify that the result keeps:
- one dominant hero
- one coherent visual world
- no invented proof
- no cardification outside the lower support cluster
- no generic SaaS drift
- no unnecessary structural fragmentation
- no nested containment
- no floating sub-surfaces
- all text clearly legible and comfortably spaced

### Output target

- Route: /prototype/
- Path: frontend/app/prototype/page.tsx
- Path: frontend/components/prototype/ReaderPrototype.tsx
- Path: frontend/components/prototype/ReaderPrototype.module.css
- Path: frontend/components/prototype/archive-fixture.json
- Isolation change: frontend/components/PwaRegister.tsx
- Verification: frontend/tests/e2e/reader-prototype.spec.ts; ignored test-results screenshots


## November newsletter prototype scope

This is an additive local-only follow-up to Variant 1. Preserve the earlier reader prototype. The current user requests multiple newsletter prototypes before choosing the service direction. There is no authorization to commit, push, deploy, buy services, send email/push, or change production subscribers.
Repository evidence: current backend supports web push, not SMTP/email. EditorialStudio lists email as pending sender-domain/SMTP connection. Names/emails are not collected by the existing subscription flow. Do not describe HTML delivery as an already connected email service.

### References and applied skills

- User reference: https://ststudio.pe.kr/community/weekly-ai-skills-2026-10-27 (read full article using direct HTML extraction after browser fetch failed).
- User catalogue: https://github.com/J-nowcow/awesome-korean-agent-skills ; read web-frontend/content-media/communication categories.
- ui-ux-pro-max: nextlevelbuilder/ui-ux-pro-max-skill at 713eef51b04efc98d6fa565323b495f7c9c89fd4; installed reference-only under ../work/newsletter-reference-skills/ui-ux-pro-max. Read SKILL.md, quick-reference.md, pro-rules.md. Ran design-system and UX typography searches.
- frontend-design: anthropics/skills at ca45fc496a3436251f191354091d557da31c15b5; reference-only under ../work/newsletter-reference-skills/frontend-design. Read complete SKILL.md and inspected license (Apache-2.0). No global hooks/CLI added.
- Installer copied only selected skill folders; no runtime third-party package, agent, hook or paid API was enabled.
- Search critique: generic hero/funnel layouts and Hebrew font recommendation did not fit a Korean newsletter, so they are NOT treated as verified guidance. Retain source-backed line length, 16px body, 1.7–1.8 line height, clear CTA and readable contrast. Mail-safe fonts and markup override Next/Image and web-only effects. No email-specific catalogue match was verified; table layout/inlined styles are the implementation fallback.
- Email constraints checked: https://www.caniemail.com/features/css-object-fit/ ; do not depend on object-fit for intact news photographs.

### Shared delivery and safety contract

- Same six static September 16 archive stories for comparison; disclose “보관 기사 · 디자인 미리보기” in the email and gallery. These are existing service records, not newly verified news. Use existing content/source URLs, no invented headlines, users, reviews or breaking-news status.
- No AI calls or news generation. Image URLs remain source-provided with publisher credit. Images use width:100%; height:auto without forced crops. Alt text contains context. No generated documentary images.
- Renderer is a pure Node-compatible .mjs module: JSON briefing in → HTML + plain text + metadata out. No network, credentials, send function or analytics.
- Produce a plain-text counterpart per variant, escaped text/attributes and allowlisted http(s) URLs. Reject javascript/data image URLs. Validate dates/variants. Limit to 15 stories and a conservative HTML-size budget. Empty editions get an honest no-news state without fake stories.
- Preview mode must clearly label the sample; production-ready rendering must require real sender identity and one-click unsubscribe URL. No fake unsubscribe link to push preferences; absent integration is labelled outside/at the footer of prototypes.
- All mail layouts table-based with inline critical styles. Responsive @media only enhances a readable single-column fallback. No scripts, SVG, remote fonts, CSS grid/flex, object-fit, fixed elements or form controls inside exported mail HTML. No tracking pixels.
- Prototype gallery may use plain CSS grid and local JavaScript for tabs/phone-vs-desktop view/download. It is a static design tool, not a new app framework or production page. Initial view is Variant 2. Tabs are labelled, keyboard accessible, no auto-rotation. iframe title and full-screen link provided.
- Send actual email only after provider/domain/consent/unsubscribe/bounce configuration and explicit permission; do not connect subscriber data now.
- Verify 360×800, 390×844, 768×1024, 1440×900 for all 3 emails and gallery; source images, image-off, CSS-off fallback, keyboard tabs, links, export plain text, malicious-input escaping, empty and long headline cases. Browser snapshots are not a claim of real Gmail/Outlook client validation.
- Output renderer frontend/lib/newsletter/render-newsletter.mjs, static preview exports frontend/public/newsletter-prototypes/, generator frontend/scripts/export-newsletter-prototypes.mjs, Node and Playwright tests, docs/newsletter-service-plan.md.

## Variant 2: 아침편지

### Resolved inputs

- Topic: 아침결 메일 프로토타입 아침편지
- Offer: 전날 중요한 뉴스를 읽기 쉬운 메일로 받아 핵심과 배경, 사진과 출처를 함께 확인
- Audience: 출근길 5~10분 동안 뉴스의 배경도 이해하고 싶은 한국어 독자
- Primary user action: 메일 본문의 요약과 배경을 읽고 선택한 기사의 원문을 열기
- Deliverable: HTML email templates plus static local prototype gallery in the existing Next.js repository
- Style direction: 친근한 편지형 에디토리얼. 짙은 초록의 브랜드, 옅은 녹색 종이, 인사와 핵심세줄 다음 사진 한 장을 천천히 읽는 흐름
- Tonal key: Light, branded Korean editorial newsletter
- Icon policy: None in email; text wordmark and semantic links
- Proof assets: Existing 2026-09-16 archive fixture: six source-linked stories and original photos, clearly labelled preview
- Motion intensity: None in mail; minimal interaction feedback in gallery, reduced-motion respected

### Composition contract

- Hero archetype: centered
- First-viewport structure: Centered letter: wordmark/date → warm greeting and 3-line overview → full-ratio lead photograph → readable explanation → compact other stories → archive CTA. Max 640px; mobile 20px padding. No marketing hero or nested cards.
- Primary visual/proof artifact: An intact original source photo with source credit and its matching headline
- Interaction behavior: source/dated archive links only in email. Gallery tabs, keyboard switching, 390px/640px width choice, HTML/plain text downloads. No real recipient input or send action.
- Reuse boundary: only resets, URL/HTML safety, source attribution, footer and file export shared. The three body renderers have distinct custom composition. Existing reader/backend/API contracts remain unchanged.
- Palette: ink #183b32; brand #14634d; soft #edf4ee; paper #ffffff; muted #52645a; border #d9e5dc
- Type: Segoe UI / Apple SD Gothic Neo / Malgun Gothic / Arial body 16px line1.8; headline 30px, greeting 32px; Georgia only small signature
- Layout: all reader prose left-aligned, max640px, desktop32–40px / mobile20px padding; 4/8 spacing, metadata12px, 44px primary links. No cramped multicolumn Korean text.
- Direction critique: the subject is a morning reading ritual, not SaaS conversion. Omit decorative hero labels, made-up urgency, promotional claims, dashboards and identical repeated boxed modules. Photo content and explanation carry the design.

### Filled generation prompt

Create one high-concept page for 아침결 메일 프로토타입 아침편지.

## Inputs
- Topic: 아침결 메일 프로토타입 아침편지.
- Offer: 전날 중요한 뉴스를 읽기 쉬운 메일로 받아 핵심과 배경, 사진과 출처를 함께 확인
- Audience: 출근길 5~10분 동안 뉴스의 배경도 이해하고 싶은 한국어 독자
- Primary user action: 메일 본문의 요약과 배경을 읽고 선택한 기사의 원문을 열기
- Deliverable: HTML email templates plus static local prototype gallery in the existing Next.js repository
- Style direction: 친근한 편지형 에디토리얼. 짙은 초록의 브랜드, 옅은 녹색 종이, 인사와 핵심세줄 다음 사진 한 장을 천천히 읽는 흐름
- Tonal key: Light, branded Korean editorial newsletter
- Icon policy: None in email; text wordmark and semantic links
- Proof assets: Existing 2026-09-16 archive fixture: six source-linked stories and original photos, clearly labelled preview
- Motion intensity: None in mail; minimal interaction feedback in gallery, reduced-motion respected

## Objective
Design one premium, memorable page with a dominant hero and one coherent visual world derived from the topic itself.
The result should feel specific, intentional, and action-oriented when the concept calls for action, not like a generic startup or SaaS template.

Choose the strongest clear solution.
Do not collapse the concept into a simpler generic pattern just to make execution easier.

- Treat single-file execution as a packaging constraint, not a creative constraint.
Do not reduce conceptual ambition, visual specificity, interaction richness, or production quality merely because the deliverable is concise.

## Internal concept choice
Before composing, decide internally:
- one dominant hero archetype: centered / asymmetrical / immersive
- one dominant proof mode: none / embedded gesture / single artifact
- one palette driver derived from the topic
- one tonal key: light / mid / dark / topic-derived
- one motion role: none / minimal / ambient / interactive
- one icon approach: none / minimal / expressive / topic-native
- optionally one secondary accent only if it strengthens the main direction without creating a second visual world
Do not output this planning.

## Non-negotiables
- Use a strong hero-first composition.
- Headline: 3-12 words, max 3 lines.
- Supporting copy: 1-2 short sentences, concise and specific.
- CTAs are optional. If used, include at most 1 primary and 1 secondary CTA.
- If a clear next step is central to the offer or concept, include a CTA; otherwise CTA omission is allowed.
- CTA labels must be specific to the offer and action, not generic.
- Supporting highlights are optional. If used, show them only once in a single lower support cluster beneath the hero.
- Keep the hero dominant, focused, readable, and uncluttered.
- Proof is optional. Use it only if it clearly strengthens the concept.
- If no real proof assets are provided, do not invent metrics, testimonials, customer logos, screenshots, or fake UI proof.
- Prefer depth inside the hero, proof gesture, CTA behavior, support copy, or background logic rather than adding extra sections by default.

## Composition
- Choose the clearest structure for the topic; do not default to generic two-column marketing layouts.
- A top navigation bar is optional. When used, make it native to the chosen style direction and subordinate to the hero rather than a generic boxed header.
- The hero may be fully integrated rather than framed.
- The hero does not need to become a panel, dashboard, device mockup, rounded card, or floating showcase unless the topic genuinely demands that artifact.
- Build hierarchy through scale, contrast, spacing, alignment, depth, rhythm, and composition before using frames, dividers, or containers.
- Keep supporting content clearly subordinate to the hero.
- Do not interpret structural restraint as permission to flatten the concept into a generic minimal layout.
- Do not use text-on-text layering, typographic collisions, or overlapping live text as a compositional device.

## Visual system
- Build one coherent visual world derived from the topic itself.
- Let the topic drive palette, contrast, typography, spacing, geometry, motifs, materials, and motion.
- Even restrained palettes must feel intentional and specific, not generic premium-neutral.
- The background must actively contribute mood, depth, and topic logic.
- If the topic suggests a real system language, physical behavior, or interface grammar, show that directly instead of generic abstract-tech decoration.
- Treat headline typography as part of the concept, not neutral text.
- The headline may use topic-derived color, selective emphasis, multi-tone treatment, or gradient accents when they strengthen the concept and remain readable.
- Do not default the headline to neutral black, white, or near-white unless that is clearly the strongest topic-native choice.

## Background and tonal diversity
- Premium and atmospheric design may be light, mid-tone, or dark; do not default to dark.
- Choose the tonal key from the topic, offer, audience, and style direction rather than from generic cinematic or tech aesthetics.
- Contrast may come from hue, saturation, temperature, texture, density, or scale, not only darkness.

## Proof and concept expression
- Prefer the minimum visual evidence needed to make the idea feel specific, credible, and native to the topic.
- If the concept is strongest with typography, atmosphere, and one precise gesture, do that.
- If a stronger proof artifact is justified, use one legible, unified artifact rather than multiple fragmented panels.
- Proof may take the form of a signal, trace, contour, command line, path, specimen, structural mark, scene fragment, or other topic-native evidence.
- Typography itself may carry part of the concept or proof.
- When appropriate, use one precise typographic gesture—such as selective word emphasis, chromatic offset, gradient emphasis, distortion, signal breakup, or structural interruption—to make the concept feel more specific and alive.
- Prefer one strong typographic intervention over many scattered decorative effects.
- Avoid decorative pseudo-proof.
- Avoid turning simple ideas into framed showcases, dashboard fragments, floating panels, softened slabs, or generic marketing geometry.

## Icons and symbolic language
- Icons are optional.
- Use icons only when they improve scanability, recognition, navigation, proof clarity, or support-cluster legibility.
- Prefer topic-native icon logic over generic startup glyphs.
- Keep icon style consistent in stroke weight, geometry, corner logic, and detail level.
- Use icons primarily in clearly secondary roles unless a single topic-native symbol is central to the concept.
- Do not let icons compete with the hero headline, proof artifact, or CTA hierarchy.

## Support cluster
- If used, show supporting highlights only once, in a single lower cluster beneath the hero.
- Each highlight should be short, fast to scan, and clearly secondary.
- Supporting highlights may use concise icons or symbolic marks when helpful.
- Support-cluster elements may use subtle motion when it improves scanability, continuity, or atmosphere and remains clearly secondary.
- Card-like grouping is allowed only inside this lower support cluster.
- These modules may use at most one light surface treatment, such as a subtle stroke, tonal fill, or very soft shadow.
- Keep support modules uniform, non-nested, and visually subordinate.
- Do not use card-like structures in the hero, proof, CTA area, or elsewhere on the page.

## Motion
- Motion is optional.
- Use motion only when it supports hierarchy, continuity, feedback, atmosphere, or topic logic.
- Default to none, minimal, or ambient motion depending on what the concept actually needs.
- Motion may live in typography, background behavior, proof logic, support-cluster behavior, or interaction feedback.
- A single key word or short phrase may use subtle text-based motion such as glitch, flicker, jitter, scanline shift, chromatic split, text scramble, pulse, or reveal if it strengthens the concept.
- Keep motion controlled, readable, non-blocking, and subordinate to clarity.
- Avoid scrolljacking, attention-hijacking loops, and ornamental animation.
- Respect reduced-motion preferences.

## Accessibility and readability
- Preserve strong readability and clear hierarchy at all viewport sizes.
- Maintain sufficient contrast between text and background.
- Do not place essential text over busy imagery unless readability remains strong.
- Avoid cramped spacing, visual collisions, and weak focal hierarchy.
- Do not place badges, pills, annotations, stickers, or floating interface fragments over essential text.
- If the deliverable is code, use semantic HTML structure, visible focus states, keyboard-friendly interactions, and reduced-motion handling.
- When in doubt, preserve legibility over expressive overlap.

## Anti-drift rules
- Do not drift into bland corporate SaaS styling.
- Do not default to dashboard aesthetics, feature-grid thinking, boxed-section composition, or template-like modularity.
- Do not use disconnected motifs, random color choices, or interchangeable abstract-tech shapes.
- Do not use card-within-card composition, nested surfaces, floating panels, fake proof, or stock-looking UI.
- Keep one visual world, one dominant hero, and one clear structural logic.
- Do not allow text, labels, or interface elements to overlap, collide, or sit on top of one another.

## Output
Return only the final HTML email templates plus static local prototype gallery in the existing Next.js repository.

If the deliverable is code:
- Output a complete production-ready file or component.
- Keep dependencies minimal unless explicitly requested.
- Make it responsive.
- Keep support highlights in one lower support cluster only when used.

## Final self-check
Before returning, verify that the result keeps:
- one dominant hero
- one coherent visual world
- no invented proof
- no cardification outside the lower support cluster
- no generic SaaS drift
- no unnecessary structural fragmentation
- no nested containment
- no floating sub-surfaces
- all text clearly legible and comfortably spaced

### Output target

- Path: frontend/public/newsletter-prototypes/letter.html
- Path: frontend/public/newsletter-prototypes/letter.txt
- Body implementation: frontend/lib/newsletter/render-newsletter.mjs (letter renderer)

## Variant 3: 모닝브리프

### Resolved inputs

- Topic: 아침결 메일 프로토타입 모닝브리프
- Offer: 전날 중요한 뉴스를 읽기 쉬운 메일로 받아 핵심과 배경, 사진과 출처를 함께 확인
- Audience: 이동 중 빠르게 훑고 필요한 기사만 골라 읽는 독자
- Primary user action: 6개 이야기의 결론을 훑고 필요한 기사의 원문으로 이동
- Deliverable: HTML email templates plus static local prototype gallery in the existing Next.js repository
- Style direction: 소요시간을 강요하지 않는 압축 브리핑. 흰 바탕과 잉크블루, 분야별 짧은 결론, 작은 사진과 제목을 대응시키는 리듬
- Tonal key: Light, branded Korean editorial newsletter
- Icon policy: None in email; text wordmark and semantic links
- Proof assets: Existing 2026-09-16 archive fixture: six source-linked stories and original photos, clearly labelled preview
- Motion intensity: None in mail; minimal interaction feedback in gallery, reduced-motion respected

### Composition contract

- Hero archetype: asymmetrical
- First-viewport structure: Asymmetrical but email-safe digest: wordmark → blue briefing header with date and count → text-only top-three → six thumbnail-and-text rows separated by ruled space → one archive CTA. Thumbnail cells stack at narrow sizes; story titles never truncated.
- Primary visual/proof artifact: Compact source-photo thumbnails subordinate to the conclusions
- Interaction behavior: source/dated archive links only in email. Gallery tabs, keyboard switching, 390px/640px width choice, HTML/plain text downloads. No real recipient input or send action.
- Reuse boundary: only resets, URL/HTML safety, source attribution, footer and file export shared. The three body renderers have distinct custom composition. Existing reader/backend/API contracts remain unchanged.
- Palette: ink #172d49; brand #234f90; soft #edf3fc; paper #ffffff; muted #53657b; border #dbe3ef
- Type: Segoe UI / Apple SD Gothic Neo / Malgun Gothic / Arial body 16px line1.7; title22px; lead36px; no external font
- Layout: all reader prose left-aligned, max640px, desktop32–40px / mobile20px padding; 4/8 spacing, metadata12px, 44px primary links. No cramped multicolumn Korean text.
- Direction critique: the subject is a morning reading ritual, not SaaS conversion. Omit decorative hero labels, made-up urgency, promotional claims, dashboards and identical repeated boxed modules. Photo content and explanation carry the design.

### Filled generation prompt

Create one high-concept page for 아침결 메일 프로토타입 모닝브리프.

## Inputs
- Topic: 아침결 메일 프로토타입 모닝브리프.
- Offer: 전날 중요한 뉴스를 읽기 쉬운 메일로 받아 핵심과 배경, 사진과 출처를 함께 확인
- Audience: 이동 중 빠르게 훑고 필요한 기사만 골라 읽는 독자
- Primary user action: 6개 이야기의 결론을 훑고 필요한 기사의 원문으로 이동
- Deliverable: HTML email templates plus static local prototype gallery in the existing Next.js repository
- Style direction: 소요시간을 강요하지 않는 압축 브리핑. 흰 바탕과 잉크블루, 분야별 짧은 결론, 작은 사진과 제목을 대응시키는 리듬
- Tonal key: Light, branded Korean editorial newsletter
- Icon policy: None in email; text wordmark and semantic links
- Proof assets: Existing 2026-09-16 archive fixture: six source-linked stories and original photos, clearly labelled preview
- Motion intensity: None in mail; minimal interaction feedback in gallery, reduced-motion respected

## Objective
Design one premium, memorable page with a dominant hero and one coherent visual world derived from the topic itself.
The result should feel specific, intentional, and action-oriented when the concept calls for action, not like a generic startup or SaaS template.

Choose the strongest clear solution.
Do not collapse the concept into a simpler generic pattern just to make execution easier.

- Treat single-file execution as a packaging constraint, not a creative constraint.
Do not reduce conceptual ambition, visual specificity, interaction richness, or production quality merely because the deliverable is concise.

## Internal concept choice
Before composing, decide internally:
- one dominant hero archetype: centered / asymmetrical / immersive
- one dominant proof mode: none / embedded gesture / single artifact
- one palette driver derived from the topic
- one tonal key: light / mid / dark / topic-derived
- one motion role: none / minimal / ambient / interactive
- one icon approach: none / minimal / expressive / topic-native
- optionally one secondary accent only if it strengthens the main direction without creating a second visual world
Do not output this planning.

## Non-negotiables
- Use a strong hero-first composition.
- Headline: 3-12 words, max 3 lines.
- Supporting copy: 1-2 short sentences, concise and specific.
- CTAs are optional. If used, include at most 1 primary and 1 secondary CTA.
- If a clear next step is central to the offer or concept, include a CTA; otherwise CTA omission is allowed.
- CTA labels must be specific to the offer and action, not generic.
- Supporting highlights are optional. If used, show them only once in a single lower support cluster beneath the hero.
- Keep the hero dominant, focused, readable, and uncluttered.
- Proof is optional. Use it only if it clearly strengthens the concept.
- If no real proof assets are provided, do not invent metrics, testimonials, customer logos, screenshots, or fake UI proof.
- Prefer depth inside the hero, proof gesture, CTA behavior, support copy, or background logic rather than adding extra sections by default.

## Composition
- Choose the clearest structure for the topic; do not default to generic two-column marketing layouts.
- A top navigation bar is optional. When used, make it native to the chosen style direction and subordinate to the hero rather than a generic boxed header.
- The hero may be fully integrated rather than framed.
- The hero does not need to become a panel, dashboard, device mockup, rounded card, or floating showcase unless the topic genuinely demands that artifact.
- Build hierarchy through scale, contrast, spacing, alignment, depth, rhythm, and composition before using frames, dividers, or containers.
- Keep supporting content clearly subordinate to the hero.
- Do not interpret structural restraint as permission to flatten the concept into a generic minimal layout.
- Do not use text-on-text layering, typographic collisions, or overlapping live text as a compositional device.

## Visual system
- Build one coherent visual world derived from the topic itself.
- Let the topic drive palette, contrast, typography, spacing, geometry, motifs, materials, and motion.
- Even restrained palettes must feel intentional and specific, not generic premium-neutral.
- The background must actively contribute mood, depth, and topic logic.
- If the topic suggests a real system language, physical behavior, or interface grammar, show that directly instead of generic abstract-tech decoration.
- Treat headline typography as part of the concept, not neutral text.
- The headline may use topic-derived color, selective emphasis, multi-tone treatment, or gradient accents when they strengthen the concept and remain readable.
- Do not default the headline to neutral black, white, or near-white unless that is clearly the strongest topic-native choice.

## Background and tonal diversity
- Premium and atmospheric design may be light, mid-tone, or dark; do not default to dark.
- Choose the tonal key from the topic, offer, audience, and style direction rather than from generic cinematic or tech aesthetics.
- Contrast may come from hue, saturation, temperature, texture, density, or scale, not only darkness.

## Proof and concept expression
- Prefer the minimum visual evidence needed to make the idea feel specific, credible, and native to the topic.
- If the concept is strongest with typography, atmosphere, and one precise gesture, do that.
- If a stronger proof artifact is justified, use one legible, unified artifact rather than multiple fragmented panels.
- Proof may take the form of a signal, trace, contour, command line, path, specimen, structural mark, scene fragment, or other topic-native evidence.
- Typography itself may carry part of the concept or proof.
- When appropriate, use one precise typographic gesture—such as selective word emphasis, chromatic offset, gradient emphasis, distortion, signal breakup, or structural interruption—to make the concept feel more specific and alive.
- Prefer one strong typographic intervention over many scattered decorative effects.
- Avoid decorative pseudo-proof.
- Avoid turning simple ideas into framed showcases, dashboard fragments, floating panels, softened slabs, or generic marketing geometry.

## Icons and symbolic language
- Icons are optional.
- Use icons only when they improve scanability, recognition, navigation, proof clarity, or support-cluster legibility.
- Prefer topic-native icon logic over generic startup glyphs.
- Keep icon style consistent in stroke weight, geometry, corner logic, and detail level.
- Use icons primarily in clearly secondary roles unless a single topic-native symbol is central to the concept.
- Do not let icons compete with the hero headline, proof artifact, or CTA hierarchy.

## Support cluster
- If used, show supporting highlights only once, in a single lower cluster beneath the hero.
- Each highlight should be short, fast to scan, and clearly secondary.
- Supporting highlights may use concise icons or symbolic marks when helpful.
- Support-cluster elements may use subtle motion when it improves scanability, continuity, or atmosphere and remains clearly secondary.
- Card-like grouping is allowed only inside this lower support cluster.
- These modules may use at most one light surface treatment, such as a subtle stroke, tonal fill, or very soft shadow.
- Keep support modules uniform, non-nested, and visually subordinate.
- Do not use card-like structures in the hero, proof, CTA area, or elsewhere on the page.

## Motion
- Motion is optional.
- Use motion only when it supports hierarchy, continuity, feedback, atmosphere, or topic logic.
- Default to none, minimal, or ambient motion depending on what the concept actually needs.
- Motion may live in typography, background behavior, proof logic, support-cluster behavior, or interaction feedback.
- A single key word or short phrase may use subtle text-based motion such as glitch, flicker, jitter, scanline shift, chromatic split, text scramble, pulse, or reveal if it strengthens the concept.
- Keep motion controlled, readable, non-blocking, and subordinate to clarity.
- Avoid scrolljacking, attention-hijacking loops, and ornamental animation.
- Respect reduced-motion preferences.

## Accessibility and readability
- Preserve strong readability and clear hierarchy at all viewport sizes.
- Maintain sufficient contrast between text and background.
- Do not place essential text over busy imagery unless readability remains strong.
- Avoid cramped spacing, visual collisions, and weak focal hierarchy.
- Do not place badges, pills, annotations, stickers, or floating interface fragments over essential text.
- If the deliverable is code, use semantic HTML structure, visible focus states, keyboard-friendly interactions, and reduced-motion handling.
- When in doubt, preserve legibility over expressive overlap.

## Anti-drift rules
- Do not drift into bland corporate SaaS styling.
- Do not default to dashboard aesthetics, feature-grid thinking, boxed-section composition, or template-like modularity.
- Do not use disconnected motifs, random color choices, or interchangeable abstract-tech shapes.
- Do not use card-within-card composition, nested surfaces, floating panels, fake proof, or stock-looking UI.
- Keep one visual world, one dominant hero, and one clear structural logic.
- Do not allow text, labels, or interface elements to overlap, collide, or sit on top of one another.

## Output
Return only the final HTML email templates plus static local prototype gallery in the existing Next.js repository.

If the deliverable is code:
- Output a complete production-ready file or component.
- Keep dependencies minimal unless explicitly requested.
- Make it responsive.
- Keep support highlights in one lower support cluster only when used.

## Final self-check
Before returning, verify that the result keeps:
- one dominant hero
- one coherent visual world
- no invented proof
- no cardification outside the lower support cluster
- no generic SaaS drift
- no unnecessary structural fragmentation
- no nested containment
- no floating sub-surfaces
- all text clearly legible and comfortably spaced

### Output target

- Path: frontend/public/newsletter-prototypes/brief.html
- Path: frontend/public/newsletter-prototypes/brief.txt
- Body implementation: frontend/lib/newsletter/render-newsletter.mjs (brief renderer)

## Variant 4: 데일리픽

### Resolved inputs

- Topic: 아침결 메일 프로토타입 데일리픽
- Offer: 전날 중요한 뉴스를 읽기 쉬운 메일로 받아 핵심과 배경, 사진과 출처를 함께 확인
- Audience: 처음 접하는 뉴스도 사진과 쉬운 설명으로 파악하고 싶은 독자
- Primary user action: 대표 사진과 설명으로 사건을 이해하고 나머지 분야의 기사를 찾아 읽기
- Deliverable: HTML email templates plus static local prototype gallery in the existing Next.js repository
- Style direction: 사진 한 장과 맥락을 함께 읽는 비주얼 매거진. 스포츠 사진이 메인이고 나머지 분야는 잘 정돈된 포토 인덱스
- Tonal key: Light, branded Korean editorial newsletter
- Icon policy: None in email; text wordmark and semantic links
- Proof assets: Existing 2026-09-16 archive fixture: six source-linked stories and original photos, clearly labelled preview
- Motion intensity: None in mail; minimal interaction feedback in gallery, reduced-motion respected

### Composition contract

- Hero archetype: immersive
- First-viewport structure: Immersive editorial artifact, not text overlay: forest masthead → oversized title → full-width football source image → matching sports headline/context → two-column image index of remaining five stories → full edition CTA. Columns stack on phones. No image crop and no invented scoreboards.
- Primary visual/proof artifact: An intact original source photo with source credit and its matching headline
- Interaction behavior: source/dated archive links only in email. Gallery tabs, keyboard switching, 390px/640px width choice, HTML/plain text downloads. No real recipient input or send action.
- Reuse boundary: only resets, URL/HTML safety, source attribution, footer and file export shared. The three body renderers have distinct custom composition. Existing reader/backend/API contracts remain unchanged.
- Palette: ink #243631; brand #184b3d; soft #f0f3ed; accent #eadb72; paper #ffffff; muted #55675d
- Type: Segoe UI / Apple SD Gothic Neo / Malgun Gothic / Arial body16px line1.8; title28px; masthead32px; metadata12px
- Layout: all reader prose left-aligned, max640px, desktop32–40px / mobile20px padding; 4/8 spacing, metadata12px, 44px primary links. No cramped multicolumn Korean text.
- Direction critique: the subject is a morning reading ritual, not SaaS conversion. Omit decorative hero labels, made-up urgency, promotional claims, dashboards and identical repeated boxed modules. Photo content and explanation carry the design.

### Filled generation prompt

Create one high-concept page for 아침결 메일 프로토타입 데일리픽.

## Inputs
- Topic: 아침결 메일 프로토타입 데일리픽.
- Offer: 전날 중요한 뉴스를 읽기 쉬운 메일로 받아 핵심과 배경, 사진과 출처를 함께 확인
- Audience: 처음 접하는 뉴스도 사진과 쉬운 설명으로 파악하고 싶은 독자
- Primary user action: 대표 사진과 설명으로 사건을 이해하고 나머지 분야의 기사를 찾아 읽기
- Deliverable: HTML email templates plus static local prototype gallery in the existing Next.js repository
- Style direction: 사진 한 장과 맥락을 함께 읽는 비주얼 매거진. 스포츠 사진이 메인이고 나머지 분야는 잘 정돈된 포토 인덱스
- Tonal key: Light, branded Korean editorial newsletter
- Icon policy: None in email; text wordmark and semantic links
- Proof assets: Existing 2026-09-16 archive fixture: six source-linked stories and original photos, clearly labelled preview
- Motion intensity: None in mail; minimal interaction feedback in gallery, reduced-motion respected

## Objective
Design one premium, memorable page with a dominant hero and one coherent visual world derived from the topic itself.
The result should feel specific, intentional, and action-oriented when the concept calls for action, not like a generic startup or SaaS template.

Choose the strongest clear solution.
Do not collapse the concept into a simpler generic pattern just to make execution easier.

- Treat single-file execution as a packaging constraint, not a creative constraint.
Do not reduce conceptual ambition, visual specificity, interaction richness, or production quality merely because the deliverable is concise.

## Internal concept choice
Before composing, decide internally:
- one dominant hero archetype: centered / asymmetrical / immersive
- one dominant proof mode: none / embedded gesture / single artifact
- one palette driver derived from the topic
- one tonal key: light / mid / dark / topic-derived
- one motion role: none / minimal / ambient / interactive
- one icon approach: none / minimal / expressive / topic-native
- optionally one secondary accent only if it strengthens the main direction without creating a second visual world
Do not output this planning.

## Non-negotiables
- Use a strong hero-first composition.
- Headline: 3-12 words, max 3 lines.
- Supporting copy: 1-2 short sentences, concise and specific.
- CTAs are optional. If used, include at most 1 primary and 1 secondary CTA.
- If a clear next step is central to the offer or concept, include a CTA; otherwise CTA omission is allowed.
- CTA labels must be specific to the offer and action, not generic.
- Supporting highlights are optional. If used, show them only once in a single lower support cluster beneath the hero.
- Keep the hero dominant, focused, readable, and uncluttered.
- Proof is optional. Use it only if it clearly strengthens the concept.
- If no real proof assets are provided, do not invent metrics, testimonials, customer logos, screenshots, or fake UI proof.
- Prefer depth inside the hero, proof gesture, CTA behavior, support copy, or background logic rather than adding extra sections by default.

## Composition
- Choose the clearest structure for the topic; do not default to generic two-column marketing layouts.
- A top navigation bar is optional. When used, make it native to the chosen style direction and subordinate to the hero rather than a generic boxed header.
- The hero may be fully integrated rather than framed.
- The hero does not need to become a panel, dashboard, device mockup, rounded card, or floating showcase unless the topic genuinely demands that artifact.
- Build hierarchy through scale, contrast, spacing, alignment, depth, rhythm, and composition before using frames, dividers, or containers.
- Keep supporting content clearly subordinate to the hero.
- Do not interpret structural restraint as permission to flatten the concept into a generic minimal layout.
- Do not use text-on-text layering, typographic collisions, or overlapping live text as a compositional device.

## Visual system
- Build one coherent visual world derived from the topic itself.
- Let the topic drive palette, contrast, typography, spacing, geometry, motifs, materials, and motion.
- Even restrained palettes must feel intentional and specific, not generic premium-neutral.
- The background must actively contribute mood, depth, and topic logic.
- If the topic suggests a real system language, physical behavior, or interface grammar, show that directly instead of generic abstract-tech decoration.
- Treat headline typography as part of the concept, not neutral text.
- The headline may use topic-derived color, selective emphasis, multi-tone treatment, or gradient accents when they strengthen the concept and remain readable.
- Do not default the headline to neutral black, white, or near-white unless that is clearly the strongest topic-native choice.

## Background and tonal diversity
- Premium and atmospheric design may be light, mid-tone, or dark; do not default to dark.
- Choose the tonal key from the topic, offer, audience, and style direction rather than from generic cinematic or tech aesthetics.
- Contrast may come from hue, saturation, temperature, texture, density, or scale, not only darkness.

## Proof and concept expression
- Prefer the minimum visual evidence needed to make the idea feel specific, credible, and native to the topic.
- If the concept is strongest with typography, atmosphere, and one precise gesture, do that.
- If a stronger proof artifact is justified, use one legible, unified artifact rather than multiple fragmented panels.
- Proof may take the form of a signal, trace, contour, command line, path, specimen, structural mark, scene fragment, or other topic-native evidence.
- Typography itself may carry part of the concept or proof.
- When appropriate, use one precise typographic gesture—such as selective word emphasis, chromatic offset, gradient emphasis, distortion, signal breakup, or structural interruption—to make the concept feel more specific and alive.
- Prefer one strong typographic intervention over many scattered decorative effects.
- Avoid decorative pseudo-proof.
- Avoid turning simple ideas into framed showcases, dashboard fragments, floating panels, softened slabs, or generic marketing geometry.

## Icons and symbolic language
- Icons are optional.
- Use icons only when they improve scanability, recognition, navigation, proof clarity, or support-cluster legibility.
- Prefer topic-native icon logic over generic startup glyphs.
- Keep icon style consistent in stroke weight, geometry, corner logic, and detail level.
- Use icons primarily in clearly secondary roles unless a single topic-native symbol is central to the concept.
- Do not let icons compete with the hero headline, proof artifact, or CTA hierarchy.

## Support cluster
- If used, show supporting highlights only once, in a single lower cluster beneath the hero.
- Each highlight should be short, fast to scan, and clearly secondary.
- Supporting highlights may use concise icons or symbolic marks when helpful.
- Support-cluster elements may use subtle motion when it improves scanability, continuity, or atmosphere and remains clearly secondary.
- Card-like grouping is allowed only inside this lower support cluster.
- These modules may use at most one light surface treatment, such as a subtle stroke, tonal fill, or very soft shadow.
- Keep support modules uniform, non-nested, and visually subordinate.
- Do not use card-like structures in the hero, proof, CTA area, or elsewhere on the page.

## Motion
- Motion is optional.
- Use motion only when it supports hierarchy, continuity, feedback, atmosphere, or topic logic.
- Default to none, minimal, or ambient motion depending on what the concept actually needs.
- Motion may live in typography, background behavior, proof logic, support-cluster behavior, or interaction feedback.
- A single key word or short phrase may use subtle text-based motion such as glitch, flicker, jitter, scanline shift, chromatic split, text scramble, pulse, or reveal if it strengthens the concept.
- Keep motion controlled, readable, non-blocking, and subordinate to clarity.
- Avoid scrolljacking, attention-hijacking loops, and ornamental animation.
- Respect reduced-motion preferences.

## Accessibility and readability
- Preserve strong readability and clear hierarchy at all viewport sizes.
- Maintain sufficient contrast between text and background.
- Do not place essential text over busy imagery unless readability remains strong.
- Avoid cramped spacing, visual collisions, and weak focal hierarchy.
- Do not place badges, pills, annotations, stickers, or floating interface fragments over essential text.
- If the deliverable is code, use semantic HTML structure, visible focus states, keyboard-friendly interactions, and reduced-motion handling.
- When in doubt, preserve legibility over expressive overlap.

## Anti-drift rules
- Do not drift into bland corporate SaaS styling.
- Do not default to dashboard aesthetics, feature-grid thinking, boxed-section composition, or template-like modularity.
- Do not use disconnected motifs, random color choices, or interchangeable abstract-tech shapes.
- Do not use card-within-card composition, nested surfaces, floating panels, fake proof, or stock-looking UI.
- Keep one visual world, one dominant hero, and one clear structural logic.
- Do not allow text, labels, or interface elements to overlap, collide, or sit on top of one another.

## Output
Return only the final HTML email templates plus static local prototype gallery in the existing Next.js repository.

If the deliverable is code:
- Output a complete production-ready file or component.
- Keep dependencies minimal unless explicitly requested.
- Make it responsive.
- Keep support highlights in one lower support cluster only when used.

## Final self-check
Before returning, verify that the result keeps:
- one dominant hero
- one coherent visual world
- no invented proof
- no cardification outside the lower support cluster
- no generic SaaS drift
- no unnecessary structural fragmentation
- no nested containment
- no floating sub-surfaces
- all text clearly legible and comfortably spaced

### Output target

- Path: frontend/public/newsletter-prototypes/magazine.html
- Path: frontend/public/newsletter-prototypes/magazine.txt
- Body implementation: frontend/lib/newsletter/render-newsletter.mjs (magazine renderer)

## Newsletter revision: uncropped reading and spacing

The user's follow-up explicitly requires no clipping, Toss-style typography and better spacing. This revision applies to all three existing mail concepts; it does not create a fourth mail design or authorize deployment/sending.

- Preserve the three composition contracts and original six archive stories. Do not crop news photographs, truncate titles, remove articles to fit a screenshot, or use line clamping.
- The previous comparison image used a fixed-height crop even though the email itself continued. Replace that artifact workflow with full-length captures and a comparison board containing the complete images at natural height. Never use fixed-height/overflow-hidden screenshot wrappers.
- The gallery must grow its iframe to the complete body height after load, image loading, font loading and width changes. Use one document scroll instead of requiring the reader to discover a nested scroll area. Keep native iframe scrolling as the failure fallback and retain a separate full-page link.
- Official font boundary: https://developers-apps-in-toss.toss.im/guide/faq says Toss Products Sans is not provided separately and is applied through TDS. Do not fetch proprietary font files from Toss's website or claim an unrelated font is Toss Product Sans. Ask for a licensed font file. While that request is unresolved, local Toss font may be listed in the CSS stack without redistribution, and an explicitly labelled Pretendard fallback may be previewed. If user declines the fallback, retain system font until the licensed file is provided.
- Pretendard is a separate OFL-1.1 typeface, not a Toss font. If used, keep its license and source/version with the local font asset. Mail webfont support is not universal: a readable system-font fallback must receive the same no-clipping checks. Do not inline a font binary into email HTML.
- Email tokens: paragraph 17px/1.7 weight400; article title 24px/1.45 weight700 with -.02em tracking; greeting28px/1.35 weight700; metadata12px/1.6. Desktop inner gutter36px, mobile24px; max mail width640px. Title→summary12px, summary→photo20px, photo→body24px, related text16px, article boundary32px, section boundary40px. Avoid arbitrary spacers and oversized introductory blocks.
- Overview: categories and conclusions share a compact text line instead of three repeated label/body slabs. Intro copy is one concise sentence. This brings the first actual article earlier without shrinking the reader text.
- Every secondary article title uses the full available text width. Thumbnail and summary sit below that title rather than squeezing the headline beside a 72px image. The magazine remains photo-led; source credits remain visible.
- Long numeric tokens such as currency values should move as a unit when they fit the column, never be sliced at a comma. Extremely long tokens must still wrap safely, especially under 200% text scaling.
- Gallery typography uses the same declared font stack; quiet 24/32/48 spacing, content-first intro, no sticky/fixed decoration over reading content. Sidebar and preview widths remain shrinkable. Keep all working tabs, downloads, source links and labels.
- Change paths: render-newsletter.mjs, gallery.css/js, export script if a licensed fallback asset is used, newsletter tests, docs and generated exports. Preserve all production backend, reader prototype and unrelated user changes.
- Verify all three emails and gallery at360/390/768/1440 widths, including the last footer in the iframe, no nested content scroll, intact image aspect ratios, long titles, 200% text, font-on/font-off, image-off, keyboard/download/source actions. Capture full-length mail screenshots and inspect the result directly. Real email-client rendering remains unverified without an authorized send test.
- User decision: supply a licensed Toss font file, not Pretendard substitution. No Pretendard file is downloaded or applied in this revision. Prepare an explicitly licensed font-face hook, retain system fallback while the attachment is missing, and report the font as pending until the supplied font is actually loaded and verified. Do not claim that merely declaring a CSS family installed the typeface.

### Revision verification — 2026-11-04

- Build/TypeScript/static export and targeted ESLint passed. Renderer tests 11/11 and Chromium scenarios 6/6 passed. All six iPhone WebKit scenarios passed after changing the enlarged screenshot to CSS-pixel resolution to avoid the capture engine's 32767px image limit; the initial 3x screenshot failure did not indicate missing page content.
- Three email layouts and the gallery were checked at 360/390/768/1440 widths, including complete iframe body height, source photo loading/aspect ratios, enlarged text, long Korean headings, keyboard selection and downloads. Full-length screenshots and `full-comparison.png` were inspected, without fixed-height crop wrappers.
- Results and remaining limitations are in `frontend/test-results/newsletter-revision/README.md`. Licensed Toss file/loading and actual email-client inbox tests remain pending. No deployment, send, commit or push was performed.

## Reader-reference typography revision — 2026-11-04

The latest user correction supersedes the previous requirement to wait for a Toss font attachment: choose and apply typography by studying familiar user-facing services, not by the implementer's preference. This remains local newsletter prototyping, not production reader changes, deploy, send, commit or push. Use `docs/newsletter-reference-audit.md` for observed values and distinguish observations from design inference and actual user-test evidence.

### Resolved inputs and composition contract update

- Topic: the existing six-story Korean morning news edition, not a new marketing page.
- Offer: a complete, readable mail preview where readers can scan the key points, understand the background and find sources.
- Audience: general Korean adult readers on mobile and desktop; age distribution and measured preferences are unknown.
- Primary user action: read the key summary, then follow the original article or the existing dated web briefing URL.
- Deliverable: refine the three existing HTML email compositions and their static gallery, preserving their filled master prompts and distinct layouts.
- Style direction: content-first Korean editorial UI grounded in observed Naver News/Newneek/Uppity/Tossfeed reading patterns.
- Tonal key: white reading surface, neutral ink, existing restrained green/blue brand accents.
- Icon policy: no new icons; retain actual text links and keyboard-operable gallery controls.
- Proof assets: existing archive fixture and real source photos; public reference computed CSS/screenshots, not traffic statistics, testimonials or user-validation claims.
- Motion intensity: none in mail; minimal gallery width feedback with reduced-motion support.
- Hero and first viewport: preserve letter greeting/top-three, brief compact digest, and magazine sports-photo lead. Do not add another hero or a fourth variant. Reduce typographic friction before adding decoration.
- Primary artifact: the actual six-story mail body from title to final footer, never a fixed-height crop.
- Interaction behavior: existing tabs, preview width, full-page link, HTML/text download and real source/dated edition links remain unchanged.
- Reuse boundary: font delivery, safe renderer helpers and tokens may be shared; the three distinct compositions remain custom.

### Concrete implementation contract

SUIT is the selected public font, obtained from the official sun-typeface/SUIT repository with a pinned commit, intact OFL and asset hashes. Initial Variable captures appeared too thin in iPhone WebKit despite successful loading, so use the official static Regular400/SemiBold600/Bold700 faces and verify their visible hierarchy. Preserve the unused variable file in research artifacts, not public assets. Do not use a proprietary Toss download or mislabel SUIT as Toss. Keep system fallbacks. Font configuration must state the real family; production mail rendering still rejects relative font URLs. Browser preview and gallery use local files; unsupported mail clients retain safe system fonts.

Body17px/1.65 weight400 tracking-.01em; article titles22–25px/1.4 weight700 tracking-.02em; main greeting28px/1.4; metadata12px/1.6. Neutral text `#191f28`, secondary `#4e5968`, existing green/blue brand accents and white content surface. Max640px mail width,36px desktop/20px mobile internal gutters. Keep12/16/24/32px reading rhythm. Mobile secondary thumbnails64px+16px separation, so summary text keeps more width. Full-width article headings, native photo aspect ratio, no line clamp or text truncation.

Apply these exact values as amendments to the already filled generation prompts for Variants2–4. Output targets remain render-newsletter.mjs, public/newsletter-prototypes/{letter,brief,magazine}.html and gallery CSS/index. Backend, API, production reader, PWA and unrelated edits are out of scope. Update font/export metadata, unit/browser tests and docs.

### Verification plan

Verify actual Korean SUIT glyphs are rendered (not merely a CSS declaration), all three mails/gallery at360/390/768/1440, complete iframe height after fonts load, no horizontal overflow or cropped text/photos, 200% text and long headlines, image-off/font-off fallbacks, font file and license integrity, keyboard/download/source links. Run renderer tests, targeted ESLint, build, Chromium and iPhone WebKit. Inspect full-length screenshots. Real Gmail/Apple Mail/Outlook delivery and representative-reader testing remain unverified; do not present site observation as user research results.

### Reader-reference revision result

Final static SUIT faces and OFL hashes passed integrity checks. Build/TypeScript/static export, targeted ESLint, renderer12/12 and browser14/14 (Chromium7, iPhone WebKit7) passed. Added a real stroke-coverage regression check after visual review discovered the initial variable face was too thin in the WebKit environment. Reviewed full comparison and all three full desktop captures directly. Results, observation limits and source links are in `docs/newsletter-reference-audit.md`; screenshots are in `frontend/test-results/newsletter-reader-first/`. No production code, subscriber settings, send operations or publishing were changed.

## Whole-preview editorial system — circled header follow-up

### Resolved inputs
- Topic: 아침결 뉴스 메일과 이를 고르는 전체 미리보기.
- Offer: 보관 기사6건으로 세 가지 읽기 방식을 비교하고 메일 전체 확인.
- Audience: 일반 한국어 모바일·PC 독자. 실제 연령·취향 분포는 미확인.
- Primary user action: 시안을 선택해 끝까지 읽고 원문 또는 날짜별 웹 브리핑으로 이동.
- Deliverable: 기존3개 메일의 스타일, 정적 갤러리, 실제 HTML 비교 페이지.
- Style direction: Tossfeed-inspired Korean editorial clarity without copying its assets, proprietary font, logo or screens.
- Tonal key: white/neutral and restrained Achim blue.
- Icon policy: text links and existing semantic controls; no decorative icons.
- Proof assets: unchanged archive fixture/source photos, annotated user screenshot and public reference reading screens; no fabricated proof.
- Motion intensity: minimal gallery feedback only, none inside mail.

### Evidence and composition contract
The circled heading in the delivered full-comparison HTML used system fonts although the mail captures used licensed SUIT. This inconsistency is in the artifact workflow. Replace screenshot-composition headers with a real compare.html loading the same SUIT faces and live local email previews. Header, intro, labels, metadata, controls, notes and mail bodies share the font and deliberate weight roles. SUIT is not Toss Product Sans.

- Hero: typography-led and left-aligned, no large fake product panels.
- First viewport: restrained 아침결 wordmark/preview label, large benefit headline with blue emphasis, concise explanation and truthful archive note, then three reading modes.
- Primary artifact: complete six-story mail bodies, not fixed-height crops or stale screenshot composites.
- Interaction: preserve tabs, keyboard, width, HTML/text download and original/dated briefing links. Add actual gallery↔compare navigation and each full-mail link.
- Reuse boundary: tokens, font delivery and frame measurement are shared infrastructure. Letter retains greeting/lead context; brief retains quick scan; magazine retains photo lead/two-column desktop. No fourth mail design.
- Scope: static prototype files, pure renderer, tests/artifact scripts and docs. Production routes/backend/PWA/API/subscriber preferences and unrelated work remain untouched. No deployment, send, commit or push.

### Exact visual tokens and content
Existing official SUIT Regular400/SemiBold600/Bold700 and OFL everywhere, including the formerly circled comparison header. No synthetic650 or font-variation settings. Prototype blue#2563eb; darker#1d4ed8; ink#191f28; secondary#4e5968; metadata#667085; border#e7ebf0; light#f4f7fc; white paper. Keep 아침결 name; production brand is not changed by this local exploration.

Page hero44px/1.28 desktop,32px/1.3 mobile,700; supporting17–18px/1.65·400; section24–28px/1.4·700; label13–14px/1.5·600; meta12px/1.6·400. Mail greeting30–32px/1.35·700; article23–26px/1.4·700; body17px/1.65·400; metadata12px/1.6. Gallery max1184, comparison max1280, outer gutters24desktop/20mobile, spacing12/16/24/32/48. White page, thin neutral separators, blue-tinted selected tabs, neutral preview stage. No extra decorative chips or oversized technical notes.

Mail max640, inner36desktop/20mobile. Shared calm blue identity without collapsing the three compositions. Letter has neutral top-three area; brief compact blue intro; magazine plain editorial title/photo and blue-tinted context instead of green banner/yellow note. Context blocks have rounded light surfaces with generous padding. Titles remain full-width and source credits remain. Photos keep native ratio; magazine mobile photos fill available columns rather than keeping a desktop max-width cap. Never truncate content or hide overflow as a fix.

Comparison: three equal shrinkable desktop columns; stack at tablet/mobile with max640. Frames grow after images/fonts/width changes. Preserve native scrolling on measurement failure and full-page fallback links. Technical research explanation goes in docs, not main headline. Show archive date and unsent state; do not pretend these are current news.

### Verification plan
Renderer and font/license integrity tests; targeted ESLint; Next build/TypeScript/export. Chromium/iPhone WebKit at360/390/768/1440. Actual SUIT glyphs in header/labels and mail;400/600/700 loaded and visibly different stroke coverage. All comparison footer/body heights, overflow, photo ratios, long Korean titles,200% text, image/style/font failures, reduced-motion and keyboard/download/navigation checks. Capture directly from served HTML in test-results/newsletter-editorial-ui and inspect full comparison plus mobile/PC mail/gallery screens. Keep old artifacts. Actual email-client delivery and representative-user tests remain unverified.

### Filled generation prompt
Create one high-concept page for 아침결의 쉬운 아침 뉴스와 전체 메일 시안 비교 경험.

## Inputs
- Topic: 아침결의 쉬운 아침 뉴스와 전체 메일 시안 비교 경험.
- Offer: 같은 보관 기사 6건을 읽는 세 가지 메일 시안과 전부 읽을 수 있는 정적 미리보기
- Audience: 휴대폰과 PC로 한국어 뉴스를 읽는 일반 성인 독자와 디자인을 검토하는 서비스 운영자
- Primary user action: 메일 시안을 읽고 원하는 읽기 방식의 전체 본문 또는 원문으로 이동
- Deliverable: 기존 Next.js 저장소의 정적 HTML·공통 CSS·최소 JavaScript와 HTML 메일 렌더러
- Style direction: 밝은 한국어 Editorial UI, 토스피드의 명확한 타입 위계와 절제된 여백을 참고한 아침결 고유 구성
- Tonal key: Light: 흰 읽기 바탕, 중립 잉크, 아침결 블루 포인트
- Icon policy: Minimal: 텍스트 링크와 기존 조작만 유지하고 새 장식 아이콘은 추가하지 않음
- Proof assets: 기존 2026-09-16 보관 기사 6건과 원문 사진. 사용자 첨부 비교 이미지와 공식 토스피드의 읽기 화면
- Motion intensity: Minimal: 미리보기 폭 전환 피드백만 사용, 메일에는 모션 없음

## Objective
Design one premium, memorable page with a dominant hero and one coherent visual world derived from the topic itself.
The result should feel specific, intentional, and action-oriented when the concept calls for action, not like a generic startup or SaaS template.

Choose the strongest clear solution.
Do not collapse the concept into a simpler generic pattern just to make execution easier.

- Treat single-file execution as a packaging constraint, not a creative constraint.
Do not reduce conceptual ambition, visual specificity, interaction richness, or production quality merely because the deliverable is concise.

## Internal concept choice
Before composing, decide internally:
- one dominant hero archetype: centered / asymmetrical / immersive
- one dominant proof mode: none / embedded gesture / single artifact
- one palette driver derived from the topic
- one tonal key: light / mid / dark / topic-derived
- one motion role: none / minimal / ambient / interactive
- one icon approach: none / minimal / expressive / topic-native
- optionally one secondary accent only if it strengthens the main direction without creating a second visual world
Do not output this planning.

## Non-negotiables
- Use a strong hero-first composition.
- Headline: 3-12 words, max 3 lines.
- Supporting copy: 1-2 short sentences, concise and specific.
- CTAs are optional. If used, include at most 1 primary and 1 secondary CTA.
- If a clear next step is central to the offer or concept, include a CTA; otherwise CTA omission is allowed.
- CTA labels must be specific to the offer and action, not generic.
- Supporting highlights are optional. If used, show them only once in a single lower support cluster beneath the hero.
- Keep the hero dominant, focused, readable, and uncluttered.
- Proof is optional. Use it only if it clearly strengthens the concept.
- If no real proof assets are provided, do not invent metrics, testimonials, customer logos, screenshots, or fake UI proof.
- Prefer depth inside the hero, proof gesture, CTA behavior, support copy, or background logic rather than adding extra sections by default.

## Composition
- Choose the clearest structure for the topic; do not default to generic two-column marketing layouts.
- A top navigation bar is optional. When used, make it native to the chosen style direction and subordinate to the hero rather than a generic boxed header.
- The hero may be fully integrated rather than framed.
- The hero does not need to become a panel, dashboard, device mockup, rounded card, or floating showcase unless the topic genuinely demands that artifact.
- Build hierarchy through scale, contrast, spacing, alignment, depth, rhythm, and composition before using frames, dividers, or containers.
- Keep supporting content clearly subordinate to the hero.
- Do not interpret structural restraint as permission to flatten the concept into a generic minimal layout.
- Do not use text-on-text layering, typographic collisions, or overlapping live text as a compositional device.

## Visual system
- Build one coherent visual world derived from the topic itself.
- Let the topic drive palette, contrast, typography, spacing, geometry, motifs, materials, and motion.
- Even restrained palettes must feel intentional and specific, not generic premium-neutral.
- The background must actively contribute mood, depth, and topic logic.
- If the topic suggests a real system language, physical behavior, or interface grammar, show that directly instead of generic abstract-tech decoration.
- Treat headline typography as part of the concept, not neutral text.
- The headline may use topic-derived color, selective emphasis, multi-tone treatment, or gradient accents when they strengthen the concept and remain readable.
- Do not default the headline to neutral black, white, or near-white unless that is clearly the strongest topic-native choice.

## Background and tonal diversity
- Premium and atmospheric design may be light, mid-tone, or dark; do not default to dark.
- Choose the tonal key from the topic, offer, audience, and style direction rather than from generic cinematic or tech aesthetics.
- Contrast may come from hue, saturation, temperature, texture, density, or scale, not only darkness.

## Proof and concept expression
- Prefer the minimum visual evidence needed to make the idea feel specific, credible, and native to the topic.
- If the concept is strongest with typography, atmosphere, and one precise gesture, do that.
- If a stronger proof artifact is justified, use one legible, unified artifact rather than multiple fragmented panels.
- Proof may take the form of a signal, trace, contour, command line, path, specimen, structural mark, scene fragment, or other topic-native evidence.
- Typography itself may carry part of the concept or proof.
- When appropriate, use one precise typographic gesture—such as selective word emphasis, chromatic offset, gradient emphasis, distortion, signal breakup, or structural interruption—to make the concept feel more specific and alive.
- Prefer one strong typographic intervention over many scattered decorative effects.
- Avoid decorative pseudo-proof.
- Avoid turning simple ideas into framed showcases, dashboard fragments, floating panels, softened slabs, or generic marketing geometry.

## Icons and symbolic language
- Icons are optional.
- Use icons only when they improve scanability, recognition, navigation, proof clarity, or support-cluster legibility.
- Prefer topic-native icon logic over generic startup glyphs.
- Keep icon style consistent in stroke weight, geometry, corner logic, and detail level.
- Use icons primarily in clearly secondary roles unless a single topic-native symbol is central to the concept.
- Do not let icons compete with the hero headline, proof artifact, or CTA hierarchy.

## Support cluster
- If used, show supporting highlights only once, in a single lower cluster beneath the hero.
- Each highlight should be short, fast to scan, and clearly secondary.
- Supporting highlights may use concise icons or symbolic marks when helpful.
- Support-cluster elements may use subtle motion when it improves scanability, continuity, or atmosphere and remains clearly secondary.
- Card-like grouping is allowed only inside this lower support cluster.
- These modules may use at most one light surface treatment, such as a subtle stroke, tonal fill, or very soft shadow.
- Keep support modules uniform, non-nested, and visually subordinate.
- Do not use card-like structures in the hero, proof, CTA area, or elsewhere on the page.

## Motion
- Motion is optional.
- Use motion only when it supports hierarchy, continuity, feedback, atmosphere, or topic logic.
- Default to none, minimal, or ambient motion depending on what the concept actually needs.
- Motion may live in typography, background behavior, proof logic, support-cluster behavior, or interaction feedback.
- A single key word or short phrase may use subtle text-based motion such as glitch, flicker, jitter, scanline shift, chromatic split, text scramble, pulse, or reveal if it strengthens the concept.
- Keep motion controlled, readable, non-blocking, and subordinate to clarity.
- Avoid scrolljacking, attention-hijacking loops, and ornamental animation.
- Respect reduced-motion preferences.

## Accessibility and readability
- Preserve strong readability and clear hierarchy at all viewport sizes.
- Maintain sufficient contrast between text and background.
- Do not place essential text over busy imagery unless readability remains strong.
- Avoid cramped spacing, visual collisions, and weak focal hierarchy.
- Do not place badges, pills, annotations, stickers, or floating interface fragments over essential text.
- If the deliverable is code, use semantic HTML structure, visible focus states, keyboard-friendly interactions, and reduced-motion handling.
- When in doubt, preserve legibility over expressive overlap.

## Anti-drift rules
- Do not drift into bland corporate SaaS styling.
- Do not default to dashboard aesthetics, feature-grid thinking, boxed-section composition, or template-like modularity.
- Do not use disconnected motifs, random color choices, or interchangeable abstract-tech shapes.
- Do not use card-within-card composition, nested surfaces, floating panels, fake proof, or stock-looking UI.
- Keep one visual world, one dominant hero, and one clear structural logic.
- Do not allow text, labels, or interface elements to overlap, collide, or sit on top of one another.

## Output
Return only the final 기존 Next.js 저장소의 정적 HTML·공통 CSS·최소 JavaScript와 HTML 메일 렌더러.

If the deliverable is code:
- Output a complete production-ready file or component.
- Keep dependencies minimal unless explicitly requested.
- Make it responsive.
- Keep support highlights in one lower support cluster only when used.

## Final self-check
Before returning, verify that the result keeps:
- one dominant hero
- one coherent visual world
- no invented proof
- no cardification outside the lower support cluster
- no generic SaaS drift
- no unnecessary structural fragmentation
- no nested containment
- no floating sub-surfaces
- all text clearly legible and comfortably spaced

### Output target
- frontend/public/newsletter-prototypes/index.html and gallery.css
- frontend/public/newsletter-prototypes/compare.html, compare.css, compare.js
- frontend/public/newsletter-prototypes/preview-frames.js
- frontend/lib/newsletter/render-newsletter.mjs and regenerated mail exports
- frontend/test-results/newsletter-editorial-ui/ generated evidence

### Whole-preview result

Build/TypeScript/static export, targeted ESLint and renderer13/13 passed. Chromium9 + iPhone WebKit9 scenarios passed using the auto-managed local test server. New checks verify custom SUIT glyphs in the actual comparison headline, support copy and column labels as well as every mail; all3 frames keep their complete body/footer at360/390/768/1440, without horizontal overflow or hidden scroll content. Font-off fallback, keyboard/download/navigation, image ratio,200% text and existing mail safety checks passed. Direct source screenshots are in test-results/newsletter-editorial-ui, not generated from a separate system-font image compositor. Desktop full comparison, mobile comparison and mobile mail typography were visually inspected. The archive fixture and production app/API/notifications are unchanged; no deployment/send/commit/push occurred. Actual email-client and user-preference testing remain outside this local prototype verification.

## Article-by-article reading — latest user clarification

### Scope and purpose

The three-column page is a design comparison for review, not the reader's consumption flow. The user clarified that each news item needs this complete reading treatment individually. Implement one article at a time with previous/next navigation and make the default letter email use a full-width, complete story block for every article, not only the lead. Preserve the existing brief/magazine alternatives and comparison for review. This is a reader/detail UI task, not a new landing concept. No production route/API/subscriber/notification changes, no new news or AI generation, no deploy/send/commit/push.

### Resolved inputs and composition contract

- Topic: a single archived news item, readable from headline through context and original source.
- Offer: title → natural-ratio photo when available → key summary → plain explanation → background/importance → original source. Do not invent any missing sections.
- Audience: Korean readers on mobile/desktop; no measured demographic or preference claim.
- Primary action: finish one item, then move to the next or previous item; original source remains available.
- Deliverable: static `read.html` and local UI metadata plus one focused HTML snapshot per article. Add the article-focused body option to the pure renderer without introducing a fourth competing mail design.
- Style/tonal key: retain the verified SUIT400/600/700, white/neutral paper, blue accents,17px/1.65 body and full-width23–26px headline. Preserve font fallback and original photo ratio.
- Icon/motion: text navigation only; no autoplay/swipe-only controls, no hidden carousel, no new icons. Respect reduced-motion if scroll/focus updates are used.
- Evidence: unchanged six-story2026-09-16 archive fixture and actual source images. Clearly label preview/archive; never call it today's live news.
- First viewport: compact 아침결 header, truthful archive date, current index/category and navigation, then actual article headline. No marketing hero or three-column comparison before the story.
- Reading layout: one centered column at every width. Viewer max760px, embedded email max640px with36px desktop/20px mobile inner gutters. Natural full article height, no inner reading scroll required.
- Interaction: previous/next buttons at both start and end, disabled at bounds; visible1/6 position and category; URL query identifies the selected article and browser Back/Forward restores it. On user navigation, scroll to the next article start and move keyboard focus to its heading after load. No new data writes or tracking.
- Reuse: share font/theme, frame height helper, safe escaping, source links and a full article block. The default letter sequentially uses that same block for all articles; focused snapshots show only one article with the same ordering.
- Focused preview footer: use a compact archive/unsent note so readers reach the next-article controls without a repeated newsletter marketing footer. Non-preview sender/unsubscribe requirements remain unchanged.
- Failure behavior: image absent/failing must never remove a story. Missing background is omitted, not fabricated. Bad metadata/index or failed snapshot shows a clear retry/working full-article link where available. Keep no-image/no-font and long title behavior.

### Implementation and verification

Change only the pure newsletter renderer/exporter, static preview files/links, tests and docs. The exporter derives safe single-article filenames from numeric fixture IDs and exports a small nav manifest; no duplicated manually authored article content. Font URLs stay at the existing root-relative preview file level so no license/URL validation is bypassed. The full letter keeps the summary overview but every story has an entire photo/summary/explanation/background/source section. Focused snapshots omit the greeting/top-three and unrelated articles.

Validate all six focused articles, article bounds, previous/next and history, source/date links, full frame/footer height, actual fonts, missing images, no API writes and no other story leaking into a focused snapshot. Check360/390/768/1440 plus long headlines/200% text. Run renderer tests, targeted lint, build and Chromium/iPhone WebKit. Inspect full mobile and PC single-article screenshots and the all-story default letter. Save fresh evidence under test-results/newsletter-one-by-one/. Keep previous artifacts. Actual email-client delivery and representative-reader testing remain unverified.

### Article-by-article result

Renderer16/16, final targeted browser12/12 (five focused-reader scenarios and one full-letter layout scenario in each of Chromium and iPhone WebKit), build/TypeScript/static export and targeted ESLint passed. The first broader run found a real browser Back issue: iframe.src added subframe history beside the reader's own pushState. Replaced subframe navigation with location.replace while the reader alone owns history; final checks restore the correct previous/next story and keyboard focus in both engines. All six focused articles were visited, and360/390/768/1440 screenshots show one centered article with full photo, summary, explanation, background and original source. Static-data/snapshot failure retries, image/font failures and enlarged text passed. Default letter includes the complete block for every story. Full mobile and PC reader screenshots were inspected. No production route, backend, API, PWA, subscriber, send or deployment operation changed.

## Notification → specific article — screenshot clarification (2026-11-04)

> Superseded by the explicit user correction below. Article-by-article alerts were a misunderstanding; they are not the desired primary flow.

The user's two screenshots show a compact notification with a headline, followed by that exact article's reading page. The core is a direct article link, not an introduction or a carousel before the headline. This supersedes the previous reader's above-article greeting and top previous/next controls. It does not authorize real OS notifications, multiple daily alerts, backend work, publishing or sending.

### Resolved inputs / composition contract

- Topic/offer: an archived 아침결 headline in a short notification preview, opening the corresponding complete article.
- Audience/action: Korean mobile and desktop readers; tap one headline, read its explanation and source. No measured preference or delivery claim.
- Deliverable/output: static `notifications.html` review inbox; existing `read.html?story=<id>` deep links; semantic single-article snapshots exported from the unchanged six-story fixture. Existing email variants stay email templates.
- Style/tonal key: familiar Korean editorial reading, white paper, restrained blue #2563eb/#1d4ed8, ink #191f28, secondary #4e5968, borders #e7ebf0; SUIT400/600/700 and native fallback. No Toss font, logo, stock chips, copied assets or fake market data.
- First viewport: compact list/back and link-copy controls → 아침결 category/byline → full headline → truthful archive date → one-sentence lead → uncropped photo. No hero, greeting, top pager, comments counter or invented publication timestamp.
- Reading composition: main width760px, article content max680px, mobile20px gutters, desktop32px; headline28px/1.4 (desktop34px), body18px/1.85, lead18px/1.65, metadata13px/1.6. Body paragraphs24px apart, sections32px apart. White article background, no nested mail card or tinted page frame. All original fixture summary/explanation/context/importance remains available; image original aspect ratio, caption12px. Duplicated exact lead/body text is omitted once, never silently shortened.
- Notification previews: one clickable row per real fixture item, own envelope icon40px, category notification title14px/600, full headline15px/1.5, no CSS truncation. Clearly dated archive/design preview, no imitation live iOS clock or delivered/now claim. Desktop list max640px, single-column mobile. This is a review list, not a change to send frequency.
- Interaction: each preview is a real link to its exact numeric story; read page opens at that headline without a second selection. Copy-link button copies the current article URL; when clipboard is unavailable show a selected readonly URL field for manual copying and truthful status. Article list link works from a direct deep link. Bottom previous/next remain supplementary. Parent history remains the sole owner; existing failure/retry and full-letter fallback stay.
- Icons/motion: simple accessible inline stroke arrow/copy in the shell and existing own mail SVG; no decorative animation, hover dependency or gesture-only controls. Keep focus visible, targets≥44px, reduced-motion, safe wrapping/min-width0 and no clipping.
- Proof/reuse boundary: same 2026-09-16 archive; do not fetch/copy the screenshot's current Samsung article, impersonate its publisher, or invent facts. Reuse font/theme, safety escaping, fixtures and frame-height helper. Add a separate pure web-article renderer; preserve email renderer and operational routes/notifications/PWA/APIs.

### Implementation / verification

Change only static prototype shell/list, exporter and pure reader renderer, relevant tests and docs. Validate all six notification links/deep links, direct reload, Back/Forward, link-copy success/manual fallback, keyboard Enter/Tab, missing metadata/snapshot/photo/font, full sources and long Korean/200% text. Run renderer tests, targeted ESLint, Next build and Chromium + iPhone WebKit at360/390/768/1440. Inspect mobile notification, mobile article and desktop screenshots. Save fresh evidence in `frontend/test-results/newsletter-notification-flow/`; preserve prior screenshots. Actual OS alert display, background delivery and real inbox compatibility are not tested or changed.

### Filled implementation prompt

Implement the existing 아침결 archive notification-to-article flow using static HTML/CSS/minimal JS in the current Next.js project. The offer is a short, recognisable notification opening one exact news item for Korean readers on phones and laptops. Output one resolved white/blue SUIT editorial design, not marketing variants. Keep the user's two screenshots as structural references only: short alert → direct article headline → archive date → original-ratio photo → natural, generously spaced explanatory text → sources. Omit greeting/hero/top carousel, unsupported buttons, fake quotes, prices, live times and proprietary Toss assets. Preserve archive facts, every available explanation/source, existing mail templates, keyboard focus/history/failure behavior and production code. Complete the real local click/copy/navigation interactions and verify360/390/768/1440 in both browser engines. Never send, deploy, commit or push.

### Result

Final unit tests20/20, targeted ESLint, Next build/TypeScript/static export and browser16/16 passed (Chromium8 + iPhone WebKit8;55.9s). Each of six notification links opens/reloads the exact article; desktop Tab/Shift+Tab/Enter and iPhone touch were checked, with Space on copy, successful copied URL and honest permission-denied manual fallback. Back/Forward, bounds, sources, data/snapshot retry, image/font failure, long headlines/200% text and360/390/768/1440 full-height layouts passed. The first run incorrectly expected iPhone's default Tab cycle to include links; the final test uses its actual touch flow and retains desktop keyboard assertions. Visual review then found WebKit splitting a currency figure, fixed with safe short numeric-unit spans in headings/body and verified again in the final16-scenario run. Full mobile list/article and desktop article plus final mobile first viewport were inspected. Fresh screenshots and report are in `frontend/test-results/newsletter-notification-flow/`; final test traces/status in `newsletter-notification-flow-final-run/`. No deployment, notification/email send, operational API/PWA/subscriber change, commit or push occurred. Actual OS alert appearance/background delivery and representative-reader testing remain unverified.

## Latest direction: ONE notification → ONE complete daily news mail

### User correction / boundaries

The user explicitly wants one overall notification, then the entire news mail, not a notification or separate reading page for each story. Change the primary prototype to exactly one edition-level alert linking directly to a complete mail with all stories stacked vertically. Articles remain individually readable sections INSIDE that same mail. This is a correction of the previous interpretation, not a second competing design. Preserve archive facts, unrelated work, production routes/APIs/PWA/subscribers/scheduling and email send safeguards. No OS notifications, email delivery, deployment, commit or push are authorized.

### Resolved inputs and composition contract

- Topic: the complete daily 아침결 news letter. Offer: one light notification opens all important news together, with individual images, explanations and source links retained.
- Audience/action: Korean mobile/desktop readers; open the single notification, then scan the overview or scroll through all stories without repeated article opening. Primary CTA is the whole-mail alert; within the mail a simple table of contents jumps to a section in the SAME document, not another article page.
- Deliverable/output target: update `notifications.html/js/css` to one alert, add `mail.html/css/js` as a dedicated opened-mail prototype using full `letter.html`, add a same-mail contents list and stable section anchors in `render-newsletter.mjs`, regenerate static files. Update gallery/comparison links to this primary flow. Keep previous detail files only as non-primary local research artifacts, not notification destinations.
- Style/tonal key: preserve white/neutral paper, SUIT400/600/700 and system fallback, ink #191f28, muted #4e5968, blue #2563eb/#1d4ed8, border #e7ebf0. The existing own envelope icon remains. No copied Toss assets, no fabricated sender email, dates, unread count or delivery time.
- Typography/spacing: alert label13px, title18px/1.5 and preview15px/1.6; alert padding20px; desktop list max640px. Mail subject24px/1.4 (desktop28), metadata13px/1.7; viewer max760px, full email max640px. Existing mail body17px/1.65, full headline26px/1.4, inner gutters36px desktop/20px mobile, article gaps32px. Keep no clipping, natural photo ratio, complete titles/body and short numeric-unit wrapping.
- First viewport: brief notification preview heading and exactly one linked alert with edition date and real6-story archive count. On open: small back-to-notification control, subject/sender/archive note then the actual whole-letter body. No hero, per-story alert list, pagers or carousel between the reader and news.
- Whole mail: greeting and three-line summary → compact complete headline index → ALL complete photo/summary/explanation/background/importance/source sections → real preview footer. The heading index links #news-1…#news-6 within the same email. The footer offers a same-document return-to-start link. The HTML email remains script-free/table-based/under90KiB; other brief/magazine variants remain alternatives, not extra messages.
- Interaction: one alert opens `mail.html?date=2026-09-16`; direct reload retains that edition. Same-mail anchors work in the iframe/full HTML without separate routes. No requirement to click through six items. The dedicated page has a working full-body fallback and return-to-alert link. Retry metadata errors, keep readable mail visible when metadata alone fails, and show an honest archive/date mismatch notice. Never claim a different date's news is available.
- Assets/motion/accessibility: existing licensed SUIT and archive photos; own icon, no added decorative motion.44px controls, keyboard focus, safe Korean wrapping, min-width0 and reduced-motion. Frame auto-height after images/fonts/viewport updates avoids nested reading scroll and cropped footer. Missing photos/fonts must not suppress articles. Links remain functional without JavaScript in the email itself.
- Reuse boundary: share fonts/theme, preview metadata and frame-height infrastructure. Existing mail renderer supplies the actual single complete body. No new service/provider integration, tracking, storage or AI generation.

### Verification and filled implementation prompt

Implement one cohesive local 아침결 daily-email flow in the existing static prototype. Korean readers receive ONE overall notification and open ONE mail containing every story. Replace the mistaken per-article alert list. Retain complete photo/explanation/background/source sections for every archive story, add an in-mail contents list and return-to-top anchor, and remove per-article navigation from the primary reading experience. Use the established white/blue SUIT system, comfortable Korean type and natural-ratio photos. Dates/counts must derive from the existing2026-09-16 six-story archive, with explicit unsent-preview status and no invented sender address. Preserve production settings and all unrelated code. Output updated notifications, a full-mail viewer, pure email renderer changes/tests and fresh browser evidence. No deploy/send/commit/push.

Validate exactly1 notification and1 complete opened mail containing all6 IDs, all contents anchors, same-page navigation, direct reload/Back and return control, metadata/date mismatch and failed-body recovery, keyboard desktop/touch mobile, font/photo-off and enlarged text. Run unit tests/lint/build and Chromium/iPhone WebKit at360/390/768/1440, inspect full mobile/desktop screenshots and save new evidence in `test-results/newsletter-digest-mail/` without overwriting previous artifacts. Actual OS notification grouping, real mailbox delivery and mail-client compatibility remain unverified.

### Whole-mail result

Final unit21/21, targeted ESLint, Next build/TypeScript/static export and browser12/12 (Chromium6 + iPhone WebKit6,53.1s) passed. Exactly one edition alert opens one mail with every6-story block, natural-ratio image, complete explanation/context/source and same-document contents entry. Desktop keyboard and mobile touch, direct reload/Back/Forward, return to alert, same-mail anchor/return-to-start, metadata failure without hiding news, wrong-date notice, body404/retry and font/photo-off/200% text passed at360/390/768/1440. The first test run exposed reversed visibility of the body-error panel; corrected it and strengthened the shared completion check to require the error panel hidden on successful reading, then reran all12. Full mobile/desktop mails, first viewport and one-alert screenshot were inspected. The letter is40,620bytes, below the90KiB guard; no content was clipped to meet that budget. Artifacts/report: `frontend/test-results/newsletter-digest-mail/`; final run: `newsletter-digest-mail-verified-run/`. No actual send, delivery/provider integration, production notification/API/PWA/subscriber/schedule change, commit, push or deployment. Actual OS/inbox behavior and reader studies remain unverified. This result supersedes the preceding per-article alert interpretation.

## Editorial polish — user permits useful plugins/tools (latest)

### Scope, audit and tool choice

Keep ONE notification → ONE complete news mail. Improve that actual mail and its opening chrome, not a new marketing/home page. Existing code stacks a separate three-story summary and a six-headline contents list before any full article, repeats the brand/instructions in the mail wrapper, and gives every explanatory label/panel similar weight. The first whole-mail screenshot shows the first article only after substantial introductory scrolling. These are the primary usability/design issues, not a lack of animation or stock imagery. Preserve the exact fixture and full explanations/background/importance/source fields, archive labels, anchors, error/retry/date behavior, pure renderer safety and other mail alternatives.

Read the installed project-ui-quality and Plugin Management skills, plus the existing local frontend-design and UI/UX Pro Max reference SKILL.md files fully. The local UX search returned line-length,1.5–1.75 body-leading, progressive heading-balance and semantic-heading guidance. Apply those verified reading outcomes to the existing HTML/table email; do not migrate frameworks or copy generic search recommendations. Official SEED typography/spacing pages and Tossfeed were revisited for roles, consistent gutters and editorial hierarchy. Taste's public overview was reviewed, but its raw redesign instruction file returned404 twice; do not claim that missing skill ran.

Plugin search found Figma, Canva, MagicPath, Product Design and Webflow as uninstalled/unconnected. Suggested only Product Design for optional external prototype review; suggestion is not installation/connection. Continue actual local implementation with available tools and the fully read design guides. Do not send private source/data externally, consume paid credits, connect accounts, change global permissions or claim external reviews occurred. No image generation is needed: all news photos must remain the actual uncropped archive photos; a new own envelope SVG is code-native. No deployment, email/OS alert sending, commit/push or operational setting changes.

### Resolved inputs and composition contract

- Topic/offer: a polished Korean daily news mail that is pleasant to scan and understand, delivered conceptually through one alert. Audience: mobile/desktop Korean readers; no preference-study claims. Primary action: open the alert and read all stories or jump within this SAME mail.
- Deliverable: one refined default letter plus cohesive mail/notification chrome and an own prototype-only blue/gold envelope SVG. Keep brief/magazine alternatives and all existing links/routes. This is reading UI/email design, not a landing-page generation task.
- Direction: bright blue ink on clean white editorial paper. Spend the expressive treatment on the 아침결 masthead and a slim blue top rule, using a small warm sun accent in the own mail icon. Keep the rest quiet: strong headline, clear short lead, natural photo, readable paragraphs. No large gradients, generic hero, fake market chips, decorative dashboards or generated news photography.
- Named colors: paper #ffffff; ink #191f28; blue #2563eb; deep blue #1d4ed8; secondary #4e5968; hairline #e7ebf0; cool paper #f6f8fb; own sun accent #ffd67c. These retain existing brand roles rather than replacing the operational green logo globally.
- Type: existing licensed SUIT400/600/700 and native fallbacks. Masthead32px/700; greeting28–30/700; article26px/1.4/700 with progressive text-wrap:balance and tested natural fallback; lead18px/1.7/600; explanation18px/1.75/400; context16px/1.75; importance17px/1.75; labels13–14px/600; metadata12–13px. No tiny-body compromise. Keep short numeric units intact and allow long strings to wrap.
- Reading width/gutters: email max640px with36px desktop and20px mobile inner gutters. Mobile letter loses the unnecessary8px outer inset, giving full photo/text width while retaining20px readable margins. Desktop photo fills the568px inner measure with height:auto;12px corners are optional polish, never a crop. Gaps follow8/12/16/20/24/32/40/48px roles; article boundaries have40–48px breathing room and one fine rule.
- First viewport/composition: compact subject/sender chrome (remove duplicated overline and verbose how-to) → distinctive mail masthead/date → short greeting → ONE compact all-headline index. Remove the redundant three-story summary panel from the default letter, without removing any article's full summary. This materially shortens the preamble. All headline links/IDs stay stable and full-length.
- Per-article hierarchy: category + true reading position (01/06 is sequence, not an invented importance rank) → full headline → short key-summary lead → uncropped source photo/caption → easy explanation → one quiet background inset → importance → original source. Keep every story, including missing photo/context cases. Labels become real subheadings subordinate to the article heading, not equally bright chips around every paragraph.
- Interaction/motion: existing real anchor navigation, return-to-start, alert/back/direct full-body fallback and retry flows; no autoplay, new persistence or tracking. No extra reading toolbar, unsupported email widgets, new account requirements or gratuitous motion.44px links/controls, visible focus, reduced-motion, Korean keep-all and min-width0. Email remains script-free and table/inline style-based with conservative90KiB safety guard.
- Reuse/output: update `render-newsletter.mjs`, regenerate three existing mail exports, refine `mail.html/css`, `notifications.css/js`, add `edition-icon.svg`, update focused tests/docs only. Prototype icon is used solely in these static previews, not production assets. Existing web-detail/archive/API/PWA code remains unchanged.

### Plan review and filled implementation prompt

Reject the initial idea of decorative hero art, a second lead-story image or multiple rounded story cards: they would either invent news visuals, duplicate images, delay real content or repeat generic component styling. Choose one paper column with an intentional masthead, compact contents and distinct text roles instead. Keep all six photos exactly once in the full letter. Prefer real paragraphs and deliberate spacing over visual effects.

Layout: compact mail envelope / masthead + date / short greeting / compact6-headline contents / full story1 / full story2…6 / return-to-start + existing valid footer. Every story reads headline → lead → photo → explanation → context → importance → source. On mobile this remains one column, never a forced narrow split. The contents may use a bounded category column and flexible full headline;200% text and long category labels must wrap without one-character columns or page overflow.

Implement that existing 아침결 one-alert/one-mail flow in its current static HTML/CSS/table-email stack. Produce ONE finished editorial design with the resolved SUIT scale, blue/white paper system and own small blue/gold envelope. Remove redundant preamble, bring actual news forward, and make each story's information hierarchy obvious while retaining all real archive fields, source photos, safe URLs, send-mode footer requirements and same-mail anchors. Do not add plugins/dependencies merely to use more tools, imitate protected Toss assets or create unverified content. Use actual browser screenshots to critique the result. Verify unit/lint/build, exact1 alert/1 mail/6 complete stories, source/photo ratios, stable anchors, body/date/metadata failure recovery, keyboard/touch, font-off and200% text at360/390/768/1440 in Chromium/iPhone WebKit. Write fresh evidence to `test-results/newsletter-editorial-polish/`, including a full mail and readable first-story screenshot; preserve old artifacts. Actual mailbox/OS delivery and user preference remain unverified. No send, deploy, commit or push.

### Editorial polish result

Unit22/22, targeted ESLint, Next build/TypeScript/static export passed. The first broader browser run passed27/28; the remaining iPhone case incorrectly required failed FontFace objects to remain in the CSS FontFaceSet with status=error. Changed the check to observable blocked font requests plus no loaded custom SUIT face, retaining complete text/layout assertions. The final focused run passed14/14 (Chromium7 + iPhone WebKit7,1.5min): all bundled-mail flows, complete-letter layout and every variant's font-off reading flow. Do not report28/28. The earlier gallery/comparison, other mail layouts, style-off, large-text and keyboard/download checks passed in the broader run.

Visual inspection also found the intentionally off-screen skip link appearing in a beyond-viewport article element screenshot. Added clip-path only while it is unfocused; focus restores the visible shortcut. The final test explicitly checks focus/unfocus states and captures a clean full article without suppressing actual keyboard indicators. Inspected final mobile first article, mobile/PC complete mails, opening view and one-alert preview. All6 stories/photos remain, lead appears before photo,18px explanation and16px background are confirmed, ordinal counters reflect real1–6 sequence, images keep their source aspect, full body/footer and same-mail anchors work at360/390/768/1440. Webfonts blocked, photos blocked, retry/date metadata failures and200% text remain readable.

Default HTML is41,236bytes with bundled font declarations, below90KiB. An initial unit check found that added presentation markup pushed the15-item regression case over budget; shortened repeated empty spacer markup (not articles) and reran all22 tests successfully, including15-item and explicit-oversize guards. No operational data, API, PWA, send schedule, subscribers or production assets were changed. No publish/send/commit/push or external plugin review occurred. Product Design remains suggested but unconfirmed/unconnected; it is optional for later review, not required for this completed local design. Fresh assets/evidence: `frontend/test-results/newsletter-editorial-polish/`; final run: `newsletter-editorial-polish-verified-run/`. Actual mailbox clients, OS delivery and representative-reader preference testing remain unverified.

## Product Design connected: current-flow audit and bounded navigation fix

### Current state and evidence

The application now confirms Product Design is installed. Stop repeating the earlier connection limitation. Read its index, user-context/preflight, critical overrides, communication protocol, audit skill and audit framework. Saved context preflight returned missing; use the current confirmed one-alert/one-complete-mail brief. The existing project remains the implementation target, so no starter/scaffold, unrelated landing page or source cloning is needed.

The Browser package was not listed separately in the skill catalog; connected through the available in-app Browser surface, read its full browser/capture/viewport/local-development documentation and selected `agent.browsers.get("iab")`. No new Playwright CLI or direct MCP run is used in this Product Design pass. Fresh screenshots were captured and inspected in the current audit; earlier screenshots are not used as audit evidence. Some early captures showed loading or an unrelated scroll position and are explicitly rejected as first-screen evidence. The accepted set is documented in `frontend/test-results/product-design-audit-20261104/notes.md`:01notification-mobile-before,02mail-top-scroll-before,03article-mobile-before,04article-end-mobile-before. All are actual local-browser captures, not mocks or composited evidence.

### Finding, resolved plan and output target

The user goal remains to read one complete mail comfortably and choose relevant stories without repeated alerts/pages. The fresh390×844 article-end screenshot shows only an original-source link and the next article; no return to the headline index is available until the very end of the mail. Add one quiet `목차로 돌아가기` link after each full letter article, targeting one unique `#mail-contents` in the SAME document. This is a bounded usability fix, not a new visual direction or generic redesign. Use existing blue #1d4ed8,14px link type,44px target,12–16px separation and natural wrapping. Preserve source links, title/summary/photo/explanation/context, existing icon/assets, font/white-paper system, reading positions and all production behavior. No new images/SVGs, plugins, tracking, send integrations or dependencies.

Change only the pure renderer, regenerated static exports, relevant unit tests and current docs/audit notes. Single-article standalone output must not acquire a dangling contents link. The index ID is constant and safe; user content remains escaped. Keep the90KiB guard,15-item regression and no-content-truncation rules. Verify node unit tests/lint/build; then reload the existing in-app Browser after static export and capture390×844 before/after, click a real headline, read down, activate the new return control, verify the same mail/index and all6 articles remain. Check1440×900 as well. Save exact accepted JPEG captures and notes in flow order; restore temporary viewport and keep a local working preview for handoff. Do not claim full WCAG/email-client/OS-delivery checks from these browser screenshots.

### Filled implementation prompt

Within the existing Korean 아침결 single-notification, single-whole-mail prototype, implement only the screenshot-backed navigation repair: every complete letter article ends with an accessible, clearly labelled same-mail return-to-contents link alongside its existing source link. Add the unique index target, keep all actual archive data/photos/formatting and the established responsive visual system, and avoid new pages/alerts or design churn. Preserve standalone snapshots without a nonexistent target. Validate markup, budget and build with the existing tests and inspect the actual in-app Browser at mobile and desktop widths. Capture a concise three-step audit with accepted screenshots and clearly distinguish observations, fixes and untested external delivery. No deployment, publishing, sending, commit or push.

### Connected audit result

Final unit23/23, targeted ESLint and Next build/TypeScript/static export passed. Default letter41,075bytes;90KiB and15-story regressions pass after compacting repeated alignment markup without truncating content. All6 full-mail articles have44px same-document return controls; standalone article exports have no dangling contents target. Current connected Browser checks cover360/390/768/1440 CSS widths, a real contents jump and mobile/desktop keyboard return to the same unique index. A viewport-transition tablet screenshot was rejected; its stable replacement was captured and inspected. Three numbered flow steps, current-run accepted images and evidence limits are recorded in `frontend/test-results/product-design-audit-20261104/notes.md`. One unattributed MutationObserver error remained in browser log history; no new occurrence was observed after reload and no target source uses that API. Do not claim a completely clean console or independent human review. No new Playwright CLI run in this phase. Actual email-client/OS delivery, screen-reader flow and representative-user testing remain unverified. Reset temporary viewport, leave the local prototype available, and perform no send/publish/commit/push.

## Approved production integration — 2026-11-04

The user now explicitly approves applying the selected design to the real service, GitHub publication and deployment. This supersedes the earlier local-only publication restriction for this scoped release, not for unrelated user edits. Current upstream main and local HEAD are3f131fc3701b9d353224b1414b6e0ee4bdca6a53. The organization repository is an actual fork of boclair98/achim-gyeol. Production /api/briefings/today returns edition71,2026-11-04,15 stories,productionReady=true. Existing production channel is Web Push, not SMTP/email. Preserve channel, all subscription records, weekday07:30 scheduling, backend/API/data/model settings and notification grouping. Do not trigger a broadcast, recollect news or spend generation credits as part of design deployment.

### Variant 1: production daily letter

Resolved inputs: Topic=아침결 daily news reading; Offer=all selected previous-day news in one readable daily edition; Audience=existing mobile/desktop Korean readers; Primary action=read the full edition from the existing notification; Deliverable=React /briefing/ reader using live API data, not a static prototype or new landing; Style=approved SUIT blue-ink/white-paper editorial letter; Tone=light, calm, explanatory; Icons=existing lucide and approved existing mail asset; Proof=real API fields and original source photos, no invented news; Motion=minimal, reduced-motion aware.

Composition contract: typography-led centered reading page, not a marketing hero; compact existing-home/archive/preferences navigation and font controls; real edition/date and clear availability notice; approved masthead/greeting/full contents followed by EVERY article inline. Each article: category/actual position, complete heading, short key summary, uncropped image, complete summary/easy explanation, background, importance, watch/uncertainty/corrections when present, actual sources, same-document return.640px paper/568px reading width,36px desktop and20px mobile gutters,blue #2563eb/deep #1d4ed8,ink #191f28,muted #4e5968,paper #fff,cool background #f6f8fb,8/12/16/24/32/48 spacing,26px headings/18px explanatory prose/16px context. Photos width100%,height:auto,object-fit:contain without fixed-height crop. Existing preferences/feedback/interest/read tracking/source claims/share remain supported without per-article alert or carousel. Preserve /briefing?date= and #news-ID deep links; return links target one contents ID. No demo news fallback in production failures; show cached real news with date or honest retry/empty state. Local storage failures must not hide fetched news.

Reuse boundary/output paths: replace delivery reader implementation using existing briefing/device contracts; new scoped DailyBriefingLetter component/CSS and pure validated loader utilities; local SUIT via next/font; approved icon asset; bump service-worker cache/version only to distribute new UI without changing subscriptions; tests and README/docs. Existing home layout, subscription modal/settings/archive routes and backend remain. No font migration to protected Toss asset, email provider or infrastructure migration.

Filled generation prompt: Apply the approved existing blue-white SUIT daily-letter design faithfully to the live Next16/React19 /briefing reader. Read real /api/briefings/today or date edition through existing same-origin API/device contracts. Keep every story and all useful editorial/source/correction information, one same-document contents and44px return actions, uncropped source photos and responsive640px paper measure. Preserve existing external operations, feedback and interest endpoint semantics, local read/font preferences, deep links, retry/empty/offline states and keyboard focus. Do not introduce demo headlines on operational failure or claim SMTP delivery. No new hero, dashboard, carousel, animations, provider accounts or AI generation. Validate build/types/lint/unit, real read API, mobile360/390/tablet768/desktop1440, sources/date navigation and focus, then inspect publication content/secrets/history, push canonical main, sync actual organization fork, confirm full SHA equality, deploy the existing morningnews project and verify its terminal status/production reader. Token expiry requires user reauthorization; no credential values in repository or output.

## 2026-11-23 · SEED 원칙을 적용한 받은 뉴스 프런트 정리

- **제품 행동/범위:** 사용자는 알림·메일을 열어 오늘 판을 훑고, 뉴스 한 편의 핵심·설명·맥락·사진(있을 때)·원문을 확인한다. `/briefing`의 목록→상세, 해시/날짜, 검색·분류·글자 크기, 읽음표시·피드백·관심도·출처, 로딩/빈/오류/저장본 상태를 보존한다. 홈 페이지의 구조·운영/API·데이터·메일 HTML·평일 07:30 알림은 이 디자인 작업에서 바꾸지 않는다. 사용자는 프런트 구현과 로컬 확인을 요청했으며 배포·커밋·푸시는 요청하지 않았다.
- **코드 근거:** 홈은 `landing.css`에서 `#fbfcfa` 바탕, `#17231d` 잉크, `#64716a` 보조, `#e1e8e4` 경계, `#18b779` 브랜드, `#0b3d2e` 진한 행동색, `#e8f8f0` 연한 강조를 사용한다. `/briefing`의 `DailyBriefingLetter.module.css`는 별도 파랑(#1d4ed8/#2563eb)과 푸른 회색 바탕을 정의해 헤더·뉴스 화면이 홈과 달라 보이는 원인이 된다. Root Layout에서 SUIT Regular/SemiBold/Bold가 실제 로컬 로드된다. 지금 스택은 Next.js/React이며 SEED 패키지는 직접 의존성에 없다.
- **실제 참고(2026-11-23 KST):** SEED 공식 [Color](https://seed-design.io/foundations/color)는 색을 의미 역할로 분리해 의도된 전경/배경 조합의 대비와 상태를 관리하는 방법을 설명한다. [Typography](https://seed-design.io/foundations/typography)는 크기·행간·굵기와 역할 기반 텍스트 스타일, 플랫폼 글꼴 맥락을 분리한다. [Layout](https://seed-design.io/foundations/layout)는 목적에 따른 콘텐츠 레이아웃과 mobile-first의 유동/중앙 정렬 조합을 설명하고, [Spacing](https://seed-design.io/foundations/spacing)는 간격을 요소 역할과 화면 가장자리 여백에 연결한다. [SEED Skill](https://seed-design.io/ai-integration/skill)과 [공식 저장소](https://github.com/daangn/seed-design)도 확인했다. 공식 웹 문서에는 ‘프리뷰 또는 이전 버전’ 표기가 있어 구체 API/토큰을 이 프로젝트의 실행 라이브러리처럼 복사하지 않는다. 이 Next 프로젝트에 SEED를 설치/이전하지 않고 설계 원칙만 적용한다. [Daum 국제 뉴스](https://news.daum.net/world)는 국제 하위 분류, 주요/새 뉴스 흐름을 보여 주고, [Investing.com 경제](https://kr.investing.com/news/economy)는 최신/많이 본/속보 분류와 기사별 작성자·시점을 보여 준다. 이번에 열린 것은 웹 콘텐츠/접근성 표현이며 픽셀 캡처·기기 측정은 아니다. 이들은 뉴스 탐색 구조의 보조 사례이지 레이아웃 복제 대상이 아니다.
- **커뮤니티 참고의 한계:** [DCInside 디자인 팁 글](https://gall.dcinside.com/mgallery/board/view/?id=thesingularity&no=1291953)은 상태에 의미를 둔 색을 토큰화하고 서로 경쟁하는 강조색을 줄이자는 작성자 의견을 제시한다. 공식 표준이나 사용자 조사 결과로 취급하지 않고, 색 과밀을 검토하는 가설로만 쓴다. 오류·주의·완료의 식별 대비를 약화하거나 색만으로 상태를 전달하지 않는다.
- **하나의 결정:** 역할 토큰을 추가해 홈 팔레트의 실제 값과 연결하고, Reader의 링크/선택/포커스·요약 강조를 읽기 좋은 진한 초록과 옅은 민트로 통일한다. 본문 잉크/보조/면/경계는 홈의 중성 토큰을 공유한다. 수신 뉴스 화면을 홈과 같은 구조로 만들지는 않고, 기사 제목-한줄 핵심-사진-쉬운 설명-맥락-중요성-출처의 편집 순서와 좁은 본문 폭은 유지한다. 상태 색(예: 주의/오류)은 의미를 보존하며 기존 라이트 테마만 검증한다. SUIT와 기존 로컬 아이콘을 유지하고 당근 로고·화면·브랜드 자산, 특정 브랜드 서체, 장식적 색상·그라디언트를 복사하지 않는다.
- **검증:** 실제 뉴스 데이터가 연결된 `/briefing`을 360×800, 390×844, 768×1024, 1440×900에서 연다. 홈/뉴스 화면 색 토큰의 실제 계산값, 한글 긴 제목·본문, 사진 비율, 메뉴/필터/상세/날짜·원문/돌아가기, 키보드 포커스·터치, loading/empty/error/cached를 확인한다. 이 제품은 현재 light mode만 지원하므로 다크 모드를 새로 만들거나 검증했다고 하지 않는다. 빌드·정적/단위 테스트와 실제 화면 검증을 분리해 보고하며, 실제 발송·운영 배포는 하지 않는다.

## 2026-11-24 · 재개 후 범위 정정과 출시 기준

- **실행 결과:** 단위 46개, 관련 Playwright 123개(Desktop Chromium/Pixel Chromium/iPhone WebKit, workers2), 변경 TSX/테스트 ESLint 통과. 실제 2026-11-23 발행본 25건으로 360/390/768/1440px 수신 목록·상세를 캡처했고 SUIT·모든 제목 보존·가로 넘침0·pageerror0 확인. 360px 실제 사진은 natural600×399→324×215로 원본 비율 유지. 독립 재검토에서 새 블로커 없음. PC/모바일 구현 캡처와 Stitch 결과를 비교해 기술 명세/가짜 버튼/자리표시를 제외했다. 현재 라이트 테마만 검증했으며 실제 사용자 선호 조사나 모바일 실기기 검증으로 확대하지 않는다.
- **시안 근거:** 내장 ChatGPT 이미지 생성으로 만든 PC 목록·모바일 목록·모바일 상세 PNG와 실제 프롬프트는 아래 절에 기록돼 있다. 이어 전용 Stitch 프로젝트에서 신규 수신 목록 `35e8974cd33f4f04883c2d33da725693`, PC 상세 `b3dbaada5c014bd0a35df6aa1af09935`로 수정했다. 다운로드한 PNG를 직접 보고 구현에 맞지 않는 프로필/기술 문구/가짜 출처를 채택하지 않았다. 산출물은 `frontend/.stitch/inputs/generated-2026-11-23` 및 `frontend/.stitch/designs/2026-11-23`에 로컬 보관하고 Git에서 제외한다.

- 새 요청에서 공통/프로젝트 지침, UI·ImageGen·Stitch 생성/업로드 스킬을 다시 읽었다. 기존 ChatGPT 생성 PNG 3장을 재사용하며 Stitch의 새 화면에만 수정 요청했다. PC 상세도 같은 이미지 기반 디자인에서 확장했다. 사용자의 승인 없이 다른 기존 보드는 수정하지 않는다.
- 독립 검토가 확인한 실제 알림 목적지는 `/briefing/delivery`다. 앞선 `/briefing` 목록 중복 제거 실험은 이번 배포에서 철회하고 검색·분류·추천·목록 순서를 보존한다. 공개 화면의 기존 미배포 브랜드 통일은 보존하며 메인 페이지의 색 값·구도·알림은 바꾸지 않는다. 받은 뉴스는 전체 25개 제목을 한 번씩 보여주는 편집 목록을 유지하고, 로컬 SUIT·공통 역할 색·민트 핵심 강조·PC 약 680px 본문 폭을 적용한다.
- Stitch 결과의 누락/오류: PC의 전체 필터 누락, 가짜 프로필 버튼, API 출처 문구, 모바일 원문 자리표시, 임의 저작권/매일 발송 문구는 채택하지 않는다. 받은 뉴스에는 현재 없는 검색·필터를 추가하지 않는다. 모든 사진은 실제 API만 쓰고 없는 경우 공간도 제거한다. 시안 텍스트는 운영 뉴스가 아니라 화면 구조 참고다.
- 독립 검토는 실제 API 응답을 로컬에서 읽기 전용으로 연결해 390/1440px 수신·공개 페이지의 가로 넘침과 콘솔 오류가 없음을 확인했다. 실제 데이터가 같은 사건을 별도 ID로 제공하는 문제는 선별 시스템 범위이므로 이번 디자인이 해결했다고 하지 않는다. 출시 전 unit/lint/build 및 수신·공개 주요 회귀 테스트, 360/390/768/1440px 실화면·글꼴·기사 진입/복귀·실패/저장본을 재검증한다. 기존 일정 코드/API/환경·수신자/전송은 수정하지 않는다.

## 2026-11-23 · 받은 뉴스 전체 화면 재설계 — ImageGen → Stitch → 실제 서비스

- **현재 요청/범위:** 사용자는 공통 제품·UI 지침을 화면 생성용 프롬프트로 구체화하고, ChatGPT ImageGen으로 PC·모바일 뉴스 읽기 전체 흐름의 시각 초안을 만든 뒤, 그 초안 이미지를 아침결 전용 Stitch 작업공간의 새 화면으로 가져와 다듬고, 최종안을 실제 서비스 `/briefing`에 적용해 검증·배포하라고 명시했다. 현재 이 요청으로 배포 권한이 명시되었다. 기존 메인/랜딩 화면, API·DB·수집/요약 모델, 메일/PWA/Web Push, 구독 레코드, 평일 07:30 알림·수신자 및 전송 실행은 범위 밖이며 그대로 보존한다. 알림/뉴스 전송을 실행하지 않는다. 이 재설계에서 생성되는 일러스트/이미지는 UI 시안에만 쓰고 사실 뉴스 사진으로 게시하지 않는다.
- **여정/성공:** 사용자는 실제 알림을 눌러 해당 일자 `briefing`에 진입하고, 첫 화면에서 판의 날짜·총 기사 수·분야를 이해하고, 검색·분야 선택·기사 목록으로 필요한 기사를 연다. 한 화면에서 핵심 요약→쉬운 설명→맥락/중요성→원문을 읽고, 같은 판의 기사 목록으로 돌아갈 수 있어야 한다. 전체 25개 기사의 실제 노출·필터·상세·뒤로가기 상태를 유지하고, 가짜 기사·임의 사진·정량 인기 표시를 만들지 않는다.
- **운영 기준선:** 2026-11-23 KST에 production `/briefing?date=2026-11-23`를 실제 1440px desktop 및 iPhone 13(390 CSS px)으로 열어 확인했다. 실데이터 25건/6분야(정책3·경제5·금융3·사회4·국제8·테크2), 첫 기사 `한전, 고객 서비스·전자조달 시스템 개인정보 유출` 및 원본 사진을 확인했다. 홈과 Reader의 공통 브랜드는 SUIT·민트/짙은 녹색·밝은 종이/중성 배경이며, 운영 Reader 캡처에서는 파랑 팔레트가 다른 인상으로 나타난다. 모바일 첫 화면은 390px 내에 큰 제목·검색·분야·주요기사/이미지가 연속해 세로로 길게 차지한다. 코드상 전체 뉴스 첫 기사와 주요 기사 추천/전체 목록이 중복될 수 있고, 전체 목록은 단일 수직 행이다. 반응형 Reader는 기존 단일 기사 읽기 폭과 접근성 기능을 갖추고 있어 유지한다.
- **참고 화면/채택 결정(2026-11-23 KST):** 이번 실제 프로젝트의 홈과 Reader를 위 운영 경로에서 다시 열었다. [다음 국제 뉴스](https://news.daum.net/world)에서 PC의 분야 탐색·제목/요약 위계와 이미지가 붙은 실제 목록 구조를, [연합뉴스 국제](https://www.yna.co.kr/international/all)에서 원문 제목·요약·시각을 읽기 좋은 행으로 묶는 편집 구조를, [BBC 코리아](https://www.bbc.com/korean)에서 선두기사와 보조 뉴스의 명확한 위계/탐색을, [토스피드 뉴스레터](https://toss.im/tossfeed/tag/%ED%86%A0%EC%8A%A4-%EB%89%B4%EC%8A%A4%EB%A0%88%ED%84%B0)와 [기사 예시](https://toss.im/tossfeed/article/mymoneystory-34)에서 모바일 글줄·제목·본문의 우선순위를 화면으로 확인했다. 관찰은 1440px desktop과 390px mobile(가능한 페이지)이며 전체 서비스의 선호 조사나 실측 토큰 분석은 아니다. 이 제품에는 짧은 실제 헤드라인/요약, 한 기사만 선두로 강조, PC 2열 목록, 모바일 1열 목록, 680px 안팎 기사 본문, 출처·시간표시를 적용한다. 브랜드 로고·색상·레이아웃, 가짜 인기순, 과한 여백/전체 이미지 배경, 전용 서체, 생성형 가짜 기사 사진은 제외한다.
- **이미지/도구 계약:** ImageGen 프롬프트는 한국어의 실제 샘플 제목과 판 메타를 사용한 실물 크기 UI 화면으로 고정한다. PC 목록, 모바일 목록, 모바일 기사 상세 3개 view를 별도 레퍼런스로 만든다. 이미지에는 실제 사진 대신 이미지 없는 편집 UI를 명시해 뉴스 사진 위조를 피한다. ImageGen 시안은 Stitch에 새 아침결 화면으로 전달해 타이포·정보밀도·breakpoint·기능 상태를 실제로 수정하게 하는 참고물이지, 완성된 코드나 실제 기사 자산이 아니다. Stitch 프로젝트 `10895683111674045225`(비공개, 아침결 전용)의 기존 화면은 수정하지 않고 새 화면만 추가한다. 해당 Stitch 시안 Noto Sans, 실제 앱 SUIT를 사용한다. `.stitch` 산출물은 사용자 로컬 미리보기로만 보관하고 앱 자산이나 공개 Git에 넣지 않는다.
- **화면/컴포넌트 계약:** 기존 `/briefing?date=...`, `#news-ID`, 검색/필터/정렬, 글자 크기, 읽음/피드백/관심도/원문, 스킵링크, 로딩·빈·오류·저장본 복구 및 기사간 이동을 보존한다. 선두기사는 목록에서 딱 한 번 표시하고, 남은 실제 기사 24건은 한 개의 “다른 기사” 2열(모바일 1열) 편집 목록에 표시하되 기사 수/더보기/정렬/필터/검색은 데이터 기준으로 정확히 맞춘다. 상세에서는 기존 실제 사진의 비율을 온전히 보이고 사진이 없는 경우 사진 틀을 강제하지 않는다. 폰트는 실제 local SUIT, 색은 현행 home의 의미 토큰을 재사용하며 UI는 실제 뉴스 본문에서만 보여 준다.
- **아웃풋/보존:** 구현 변경은 briefing 목록·기사 리더 관련 React/CSS와 집중된 테스트/계약 문서로 제한한다. 랜딩/홈·전역 인터랙션·서버·뉴스 데이터/API·알림 worker/schedule·환경설정·수신자·메일 템플릿/사진 원본은 건드리지 않는다. 별도 문서에 현재 API·서비스 contract가 없는 경우 이를 작성할 수 있지만 비밀 값은 포함하지 않는다. Git 포함은 코드·design.md·기능 문서만 하고 `.stitch`, 테스트 스크린샷, 사용자 데이터, API 계약 초안은 비공개 로컬 산출물로 제외한다.
- **구현할 시각 계약:** 실제 웹은 현재 SUIT(400/600/700, 로컬 파일과 시스템 폴백)과 홈 토큰을 사용한다: canvas `#FBFCFA`, paper `#FFFFFF`, ink `#17231D`, muted `#64716A`, border `#E1E8E4`, brand `#18B779`, action/focus `#0B3D2E`, soft brand `#E8F8F0`; 기존 의미 경고·오류 색은 별도 유지한다. Reader PC 최대폭 1200px/32px 거터, 태블릿 24px, 모바일 18px(좁은 360px에서 16px로 줄지 실제 콘텐츠로 확인), 목록은 desktop 2열·모바일 1열. 목록 헤드라인 19–22px/행간 약1.4, 설명 15–16px/1.6, 기사 제목 28–40px/1.24, 본문 17–18px/1.75, 메타 13–14px/1.5, 조작은 최소44px; 상세 본문 폭 max680px. 수치는 연구의 보편 법칙이 아니라 실제 한글 기사와 기존 SUIT에 대입해 검증할 출발값이다. 사진은 API의 안전한 `imageUrl`가 있을 때만 원본 가로세로비로 보이고, `object-fit:contain`, 사진이 없거나 오류면 프레임을 없애 텍스트 흐름을 유지한다.
- **ImageGen 프롬프트 1 — PC 브리핑 목록:** `Use case: ui-mockup. Asset type: 실제 웹 앱의 데스크톱 뉴스 리더 화면 콘셉트, wide 1440×900. Primary request: 사용자가 평일 아침 알림을 눌러 전날의 주요 뉴스 목록을 훑고 필요한 기사를 여는 아침결 뉴스 브리핑 UI. 기존 아침결 홈의 밝은 종이 바탕·짙은 초록 텍스트·절제된 민트 강조·작은 초록 메일 마크와 SUIT 기반 편집 감각은 이어받되, 홈의 프로모션 히어로를 복제하지 말고 실제 콘텐츠 중심의 신문형 목록을 설계한다. 화면 상단에는 작고 조용한 ‘아침결’ 마스트헤드와 ‘지난 뉴스’·‘알림 설정’만 둔다. 이어 ‘2026년 11월 23일 월요일 뉴스’, ‘기사 25건 · 6개 분야’, 검색창, 정책 3/경제 5/금융 3/사회 4/국제 8/테크 2의 분야 탐색을 둔다. 선두 기사 영역에는 ‘먼저 읽을 뉴스’, 정확한 제목 ‘한전, 고객 서비스·전자조달 시스템 개인정보 유출’, 쉬운 핵심 한 문장 ‘한전이 운영하는 서비스에서 고객과 기업 관계자의 개인정보가 유출됐습니다.’와 ‘기사 읽기’ 행동을 한 번만 보여준다. 원문 사진은 API에서 제공될 때만 실제 서비스에서 원본 비율로 나타난다는 빈 중립 자리 표시만 두고 뉴스 사진을 생성하거나 임의 삽입하지 않는다. 이어 ‘다른 기사 24건’의 2열 목록을 만든다. 샘플 제목은 ‘23일 전국 비·눈 예보…수도권·강원 출근길 어는 비 주의’, ‘여당, 조희대 대법원장 탄핵 12월 추진’으로 실제 전날 데이터의 제목을 그대로 쓴다. 각 행에는 분야·제목·한 줄 설명만 계층적으로 묶고 불필요한 아이콘·카드 반복은 줄인다. 검색/필터 선택과 키보드 포커스가 명확하고 긴 한국어 제목이 잘리지 않는다. 제약: 실제 제품 화면이지 마케팅 랜딩·SaaS 대시보드가 아님; 같은 기사를 리드/추천/전체에 중복하지 않음; 사용자 수·인기 순위·가짜 사진·가짜 기사·가짜 수치·가짜 기능 없음; 로고/서체/화면의 타 서비스 복제 없음; 워터마크 없음.`
- **ImageGen 프롬프트 2 — 모바일 목록:** `Use case: ui-mockup. Asset type: iPhone급 세로 모바일 뉴스 웹 화면 콘셉트, 390×844. Primary request: 알림을 눌러 도착한 날짜의 브리핑을 빠르게 파악하고 한 기사씩 읽는 아침결 뉴스 앱. PC 시안과 같은 실제 날짜·기사·분야를 사용하고 현재 아침결의 밝고 담백한 초록 브랜드 감각을 유지하되 모바일의 읽기 폭·탭 영역에 맞게 재배치한다. 상단은 작은 아침결 마크와 명확한 ‘지난 뉴스/알림 설정’ 메뉴; 다음은 ‘11월 23일 월요일 뉴스’, ‘25건 · 6개 분야’, 검색창, 가로로 스크롤할 수 있는 분야 버튼. 선두 뉴스 제목 ‘한전, 고객 서비스·전자조달 시스템 개인정보 유출’, 짧은 쉬운 요약, 명확한 ‘기사 읽기’ 버튼을 보여준다. 선두 제목은 뒤 목록에 반복하지 않고 ‘다른 기사 24건’을 세로 1열로 시작한다. 원문 사진은 실제 API가 제공하는 경우에만 원본 비율로 연결되며 이 이미지 생성물에는 기사 사진을 만들거나 넣지 않는다. 화면은 정보 위계를 위해 충분히 촘촘하지만 글자는 읽기 쉽고, 제목은 왼쪽으로 자연스럽게 2–3줄 안에서 이어지며 잘리지 않는다; 분야 탐색은 손가락으로 스크롤되고 44px 이상 조작 영역과 safe area가 확보된다. 제약: 화면 전체가 모바일 웹이며 데스크톱을 축소한 그리드가 아님; 장식용 히어로·긴 소개·광고·바닥 고정 버튼·호버 요구·모의 통계·뉴스 사진·카드/그라데이션 남발/타사 브랜딩 없음.`
- **ImageGen 프롬프트 3 — 모바일 기사 읽기:** `Use case: ui-mockup. Asset type: 기존 기사 상세의 모바일 웹 화면 콘셉트, 390×844. Primary request: 알림에서 들어온 독자가 한 뉴스의 핵심→쉬운 설명→배경과 중요성→원문 순서로 읽고 같은 목록으로 돌아가는 아침결 기사 화면. 실제 데이터 제목 ‘한전, 고객 서비스·전자조달 시스템 개인정보 유출’, 분야 ‘테크’, 날짜 ‘2026년 11월 23일’, 읽기 순서 ‘1 / 25’를 사용한다. 페이지 맨 위 ‘← 기사 목록’과 텍스트 크기 조절을 분명히 한다. 이어 분야와 날짜, 완전한 기사 제목, ‘핵심 요약’ 한 문장, ‘쉽게 읽기’ 본문 섹션을 놓는다. 뒤이어 ‘알고 읽으면 쉬워요’, ‘왜 중요한가요’, ‘앞으로 살펴볼 점’, 실제 원문 출처를 각각 명확한 제목·본문으로 구분하고, 실제 사진은 API가 제공된 경우에만 원본 비율로 표시한다. 이 mockup 안에는 기사 사진을 생성/삽입하지 않고 사진이 없으면 자리도 사라지는 흐름을 보인다. 기사 본문은 좁지만 답답하지 않은 한 열, 길고 복합적인 한글 제목과 문단 간격은 선명하며, 목록으로 돌아가면 기존 기사 위치·선택 상태가 유지되는 동작을 표현한다. 제약: 가짜 사진/출처/통계·성과·인기 표시 없음; 같은 제목·요약 반복 없음; 광고·가입·계정 요구·공유/댓글 과밀 도구 없음; 실제 아침결의 기능을 바꾸지 않음.`
- **Stitch refinement brief:** 생성된 세 mockup 이미지를 아침결 전용 private Stitch 프로젝트의 신규 screens로 업로드하고, 기존 screen은 편집하지 않는다. 프로젝트 design system은 Stitch에서 Noto Sans를 유지하고, 실제 서비스와 같은 정보 순서·반응형 동작·정확한 실제 문구로 화면을 다듬되 사진은 생성하지 않는다. PC는 1440/768, 모바일은390을 각각 명시한다. 모바일 목록에서는 한 기사가 선두와 본 목록에 동시에 나타나지 않으며, 상세 진입/목록 복귀/검색·필터가 제품 동작과 맞아야 한다. 첫 결과 뒤에는 가장 큰 가독성/중복/정보 밀도 결함을 한 가지 지정해 focused edit를 하고, 최종 화면을 받아 코드와 직접 비교한다. Stitch 시안은 실행 코드·사용자 테스트가 아니다.
- **검증/배포:** unit/lint/build/E2E를 변경 범위에 맞게 실행하고, 실제 라우트와 360×800·390×844·768×1024·1440×900에서 목록·기사 상세·검색/분야/0건·전체 기사/더보기·이미지 없음·사진 비율·키보드 이동·다시 목록 복귀를 확인한다. 배포 뒤 기존 production 라우트/API 결과/주요화면·평일 07:30 job 설정이 바뀌지 않았는지 재확인한다. Coders 정책에 따라 `boclair98/achim-gyeol`을 canonical로 먼저 push하고 실제 fork `coders-kr/achim-gyeol`을 SHA 동기화한 뒤 기존 `morningnews` 배포만 갱신한다. production ready와 운영 URL의 실제 화면 검증 전에는 완료로 보고하지 않는다.




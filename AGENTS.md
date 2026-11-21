# AGENTS.md

<!-- openui:start -->
## Mandatory OpenUI workflow

When a task asks for any of the following, use the `openui` skill before editing implementation files:
- landing page
- homepage
- marketing page
- hero page
- design concept page
- multiple landing-page variants
- high-concept page generation

## Required process

1. Before generating page code, create or replace `/design.md` at the repository root.
2. `design.md` is mandatory and is the source of truth for implementation.
3. Never leave unresolved placeholders such as `[Topic]` or `[Offer]` inside `design.md`.
4. If the user omitted inputs, resolve them first and write concrete values into `design.md`.
5. If the user explicitly fixed an input, preserve it.
6. If the user asked for multiple variants:
   - create one section per variant in `design.md`
   - resolve inputs independently for each variant
   - do not copy one variant's input set into another
   - a variant is invalid if it differs only by palette, copy polish, spacing, or superficial decoration
   - each variant must represent a materially different concept direction
   - each variant must define a distinct composition contract, not only distinct copy
7. After `design.md` is written, implement the page variants one by one in the same order they appear in `design.md`.
8. For four or more variants, implement and inspect variants in batches of at most three before continuing.
9. Do not invent proof assets, fake metrics, fake testimonials, fake logos, or fake screenshots.
10. Keep support highlights in one lower support cluster only.
11. Do not use cardified hero layouts, floating sub-surfaces, or generic SaaS dashboard patterns unless the topic explicitly requires that artifact.
12. Before final response, compare all variants together and revise any that feel weaker, repetitive, or merely reskinned.

## Multi-Variant Quality Gates

For four or more variants:

- Add a composition contract for every variant in `design.md`: hero archetype, first-viewport structure, primary visual/proof artifact, interaction behavior, and reuse boundary.
- Work in implementation batches of at most three variants.
- Before each batch, reread the relevant `design.md` sections.
- After each batch, visually inspect desktop and mobile screenshots for every route in the batch before continuing.
- Shared CSS, JS, components, or templates are allowed only for infrastructure such as resets, routing, navigation, basic accessibility helpers, and small utilities.
- Do not implement a large multi-variant request as one generic data-driven page renderer unless each variant still has a custom hero composition, custom visual/proof artifact, and custom interaction behavior.
- Do not let later variants become "same layout plus different copy."
- Ensure the first viewport shows the dominant hero and a hint of the next section on common desktop and mobile sizes unless the user explicitly requests a full-screen hero.

Final comparative gate:

- Review all variants side by side or in a fast route sweep.
- Confirm each variant has a distinct first impression, composition, visual/proof artifact, and interaction behavior.
- Revise later variants if they have degraded into thinner versions of earlier variants.

## Implementation policy

- For a single HTML deliverable, prefer `index.html`.
- For multiple HTML variants, prefer:
  - `variants/variant-01/index.html`
  - `variants/variant-02/index.html`
  - `variants/variant-03/index.html`
- For a single React deliverable, prefer one component file in the existing project structure.
- For multiple React variants, create one component per variant with clear naming.

Do not start implementation until `design.md` is complete.
<!-- openui:end -->

## Current prototype scope

The October 22 reader redesign is local-only. Do not commit, push, deploy, or send notifications unless the user explicitly authorizes it. Preserve the existing reader and API contracts; the prototype uses a static archive fixture and separate local preferences.

## 아침결 받은 뉴스: 프로젝트 전용 디자인 기준

- 알림에서 들어온 독자가 날짜와 첫 뉴스를 바로 알아보고, 기사에서 요점·확인할 점·원문을 찾은 다음 같은 목록 위치로 돌아가는 흐름을 우선한다. 가입 홍보, 통계, 유령 기능, 대형 사진 표지로 첫 제목을 미루지 않는다.
- 새 디자인 작업에서는 실제 발행본과 기존 화면을 먼저 보고, 유사 운영 매체의 모바일·PC 화면을 직접 비교한다. `design.md`에 참고 화면, 채택·배제 이유, 아침결의 적용 위치와 합격 기준을 기록한다. Stitch는 보조 시안이며 생성된 뉴스·기능·코드를 운영에 복사하지 않는다.
- 모바일 목록은 한 열과 충분한 제목 폭, PC 목록은 편집 순서를 지키는 두 열을 기본으로 한다. 기사 본문은 PC에서도 약 680px 안팎의 읽기 폭을 유지한다. 기존 SUIT, 역할별 색과 얇은 구분선을 우선하고 긴 제목과 사진은 자르지 않는다.
- 목록·다음·글자 크기·원문은 레이블을 명확히 하고 주요 터치 영역은 최소 44px로 검증한다. 발행일·기사 수·편집 순서는 실제 데이터만 사용한다. 날짜·기사 주소, 포커스·목록 위치, 실패·오프라인 상태를 보존한다.
- 변경 요청이 없는 메인 화면·공개 뉴스·메일 HTML·API·평일 오전 7시 30분 알림은 그대로 둔다. 검증은 실제 뉴스가 있는 360/390/768/1440px에서 하고, 사용자 알림을 보내지 않는다. 커밋·푸시·배포는 별도 명시 요청에 한한다.


# OpenUI Design Plan

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




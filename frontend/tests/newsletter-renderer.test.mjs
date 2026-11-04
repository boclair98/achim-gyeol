import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { escapeHtml, newsletterVariants, renderNewsletter } from "../lib/newsletter/render-newsletter.mjs";

const stories = JSON.parse(await readFile(new URL("../components/prototype/archive-fixture.json", import.meta.url), "utf8"));
const edition = { briefingDate: "2026-09-16", dateLabel: "2026년 9월 16일 수요일", stories };

for (const variant of newsletterVariants) {
  test(`${variant}: contains all six archived stories, meaningful links and plain text`, () => {
    const result = renderNewsletter(edition, { variant });
    assert.equal(result.storyCount, 6);
    assert.equal(result.preview, true);
    assert.ok(Buffer.byteLength(result.html) < 90 * 1024);
    assert.match(result.html, /보관 기사 · 디자인 미리보기/);
    assert.match(result.html, /실제 발송되지 않았습니다/);
    assert.match(result.html, /role="presentation"/);
    assert.match(result.html, /height:auto/);
    assert.doesNotMatch(result.html, /<script|<svg|<form|object-fit|display:flex|display:grid|<iframe|onerror=/i);
    for (const story of stories) {
      assert.ok(result.html.replace(/<[^>]*>/g, "").includes(escapeHtml(story.title)));
      assert.ok(result.text.includes(story.title));
      assert.ok(result.html.includes(story.sources[0].url.replaceAll("&", "&amp;")));
    }
  });
}

test("body compositions are different, not palette swaps", () => {
  const outputs = newsletterVariants.map((variant) => renderNewsletter(edition, { variant }).html);
  assert.ok(outputs[0].includes("좋은 아침이에요."));
  assert.ok(outputs[1].includes("바쁜 아침엔, 핵심부터."));
  assert.ok(outputs[2].includes("사진 한 장에서 시작하는"));
  assert.ok(outputs[2].indexOf(stories[2].imageUrl) < outputs[2].indexOf(stories[0].imageUrl));
});

test("untrusted content is escaped and unsafe URLs are never linked", () => {
  const story = { ...stories[0], title: '<img src=x onerror="alert(1)">', summary: "<script>alert(1)</script>", plainExplanation: "<script>alert(1)</script>", imageUrl: "javascript:alert(1)", sources: [{ publisher: '<a href="bad">', url: "javascript:alert(1)" }] };
  const result = renderNewsletter({ ...edition, stories: [story] });
  assert.match(result.html, /&lt;img/);
  assert.doesNotMatch(result.html, /<script>|src="javascript:|href="javascript:/);
  assert.ok(!result.html.includes('<img src=x'));
});

test("empty editions remain honest and readable", () => {
  for (const variant of newsletterVariants) {
    const result = renderNewsletter({ ...edition, stories: [] }, { variant });
    assert.match(result.html, /아직 전할 기사가 없습니다/);
    assert.equal(result.storyCount, 0);
    assert.doesNotMatch(result.html, /관련 원문 이미지/);
  }
});

test("does not pretend to support sending without real sender/unsubscribe configuration", () => {
  assert.throws(() => renderNewsletter(edition, { preview: false }), /real sender/);
  assert.throws(() => renderNewsletter(edition, { preview: false, senderName: "Example sender", senderAddress: "Example address", unsubscribeUrl: "javascript:void(0)" }), /real sender/);
  const result = renderNewsletter(edition, { preview: false, senderName: "Test-only sender", senderAddress: "Test-only contact", unsubscribeUrl: "https://example.com/unsubscribe/test-token" });
  assert.match(result.html, /href="https:\/\/example.com\/unsubscribe\/test-token"/);
  assert.doesNotMatch(result.html, /실제 발송되지 않았습니다/);
});

test("dates, variant, URL and maximum story count are validated", () => {
  assert.throws(() => renderNewsletter({ ...edition, briefingDate: "2026-02-30" }), /valid edition date/);
  assert.throws(() => renderNewsletter(edition, { variant: "unknown" }), /Unknown/);
  assert.throws(() => renderNewsletter(edition, { webUrl: "javascript:alert(1)" }), /HTTPS/);
  assert.equal(renderNewsletter({ ...edition, stories: Array(18).fill(stories[0]) }).storyCount, 15);
  assert.doesNotMatch(renderNewsletter({ ...edition, dateLabel: "Date\r\nBcc: bad" }).subject, /[\r\n]/);
});

test("oversized editions fail explicitly instead of silently losing content", () => {
  const large = { ...stories[0], plainExplanation: "긴 설명 ".repeat(20000) };
  assert.throws(() => renderNewsletter({ ...edition, stories: [large] }), /90 KiB/);
});

test("a real font face requires explicit license confirmation and safe delivery URLs", () => {
  assert.doesNotMatch(renderNewsletter(edition).html, /@font-face/);
  assert.doesNotMatch(renderNewsletter(edition).html, /Toss Product Sans/);
  const fontFaces = [{ url: "./fonts/SUIT-Regular.woff2", weight: "400" }];
  assert.throws(() => renderNewsletter(edition, { fontFaces }), /confirmed usage rights/);
  assert.match(renderNewsletter(edition, { fontFaces, fontLicenseConfirmed: true }).html, /@font-face/);
  assert.throws(() => renderNewsletter(edition, { preview: false, senderName: "Test sender", senderAddress: "Test address", unsubscribeUrl: "https://example.com/unsubscribe", fontFaces, fontLicenseConfirmed: true }), /Invalid licensed font/);
  const hosted = [{ url: "https://example.com/fonts/SUIT-Bold.woff2", weight: "700" }];
  assert.match(renderNewsletter(edition, { fontFaces: hosted, fontLicenseConfirmed: true }).html, /font-weight:700;font-style:normal/);
  for (const url of ["javascript:alert(1)", "./fonts/../../unlicensed.woff2", "https://example.com/file#\";color:red"] ) {
    assert.throws(() => renderNewsletter(edition, { fontFaces: [{ url }], fontLicenseConfirmed: true }), /Invalid licensed font/);
  }
});

test("bundled public SUIT font is intact, version-pinned and includes its OFL", async () => {
  const directory = new URL("../public/newsletter-prototypes/fonts/", import.meta.url);
  const config = JSON.parse(await readFile(new URL("font-config.json", directory), "utf8"));
  const license = await readFile(new URL("SUIT-LICENSE.txt", directory));
  assert.equal(config.family, "SUIT");
  assert.equal(config.license, "OFL-1.1");
  assert.equal(config.licenseConfirmed, true);
  assert.match(config.commit, /^[0-9a-f]{40}$/);
  assert.equal(config.source, "https://github.com/sun-typeface/SUIT");
  assert.deepEqual(config.faces.map(face => face.weight), ["400", "600", "700"]);
  for (const face of config.faces) {
    const binary = await readFile(new URL(face.url.slice("./fonts/".length), directory));
    assert.equal(binary.subarray(0, 4).toString(), "wOF2");
    assert.equal(binary.byteLength, face.bytes);
    assert.equal(createHash("sha256").update(binary).digest("hex"), face.sha256);
  }
  assert.equal(createHash("sha256").update(license).digest("hex"), config.licenseSha256);
  assert.match(license.toString(), /Copyright \(c\) 2022, SUNN/);
  assert.match(license.toString(), /SIL OPEN FONT LICENSE Version 1.1/);
  const html = renderNewsletter(edition, { fontFaces: config.faces, fontLicenseConfirmed: true }).html;
  assert.match(html, /@font-face\{font-family:'SUIT'/);
  assert.match(html, /font-size:17px;line-height:1\.65/);
});

test("headlines remain complete while short currency figures stay together", () => {
  const html = renderNewsletter(edition).html;
  assert.match(html, /white-space:nowrap;">1,359\.4원<\/span>/);
  assert.doesNotMatch(html, /line-clamp|text-overflow:ellipsis|max-height:(?!0)/);
});

test("the whole preview uses one real typography system, not a system-font screenshot header", async () => {
  const directory = new URL("../public/newsletter-prototypes/", import.meta.url);
  for (const stylesheet of ["gallery.css", "compare.css", "read.css"]) {
    assert.match(await readFile(new URL(stylesheet, directory), "utf8"), /@import url\("theme.css"\)/);
  }
  const theme = await readFile(new URL("theme.css", directory), "utf8");
  assert.match(theme, /@import url\("fonts\/font-config.css"\)/);
  assert.match(theme, /--font-sans: "SUIT"/);
  assert.match(theme, /--blue: #2563eb/);
  assert.doesNotMatch(theme, /font-weight: 650/);
  const comparison = await readFile(new URL("compare.html", directory), "utf8");
  assert.equal((comparison.match(/data-mail-frame/g) || []).length, 3);
  assert.match(comparison, /preview-frames.js/);
  assert.doesNotMatch(comparison, /letter-mobile.png|brief-mobile.png|magazine-mobile.png/);
  for (const variant of newsletterVariants) {
    const html = renderNewsletter(edition, { variant }).html;
    assert.match(html, /#1d4ed8/);
    assert.doesNotMatch(html, /#14634d|#184b3d|#f3f2df/);
  }
});

test("every letter article gets the same full summary, explanation and context", () => {
  const html = renderNewsletter(edition, { variant: "letter" }).html;
  assert.equal((html.match(/data-story-id=/g) || []).length, stories.length);
  assert.equal((html.match(/핵심 요약/g) || []).length, stories.length);
  assert.equal((html.match(/쉽게 읽기/g) || []).length, stories.length);
  for (const story of stories) {
    assert.ok(html.includes(escapeHtml(story.plainExplanation)));
    assert.ok(html.includes(escapeHtml(story.backgroundContext)));
    assert.ok(html.includes(escapeHtml(story.whyItMatters)));
  }
});

test("focused articles show only the requested story and keep the full photo and explanation", () => {
  for (const story of stories) {
    const result = renderNewsletter({ ...edition, stories: [story] }, { articleOnly: true });
    assert.equal(result.articleOnly, true);
    assert.equal(result.storyCount, 1);
    assert.equal((result.html.match(/<h1 /g) || []).length, 1);
    assert.ok(result.subject.includes(story.title));
    assert.ok(result.html.includes(escapeHtml(story.plainExplanation)));
    assert.ok(result.html.includes(escapeHtml(story.backgroundContext)));
    assert.doesNotMatch(result.html, /좋은 아침이에요|먼저, 핵심 세 가지/);
    for (const other of stories.filter(other => other.id !== story.id)) assert.ok(!result.html.includes(`data-story-id="${other.id}"`));
  }
  assert.throws(() => renderNewsletter(edition, { articleOnly: true }), /exactly one story/);
  assert.throws(() => renderNewsletter({ ...edition, stories: [] }, { articleOnly: true }), /exactly one story/);
});

test("a missing photo or background never removes a focused article or fabricates context", () => {
  const story = { ...stories[0], imageUrl: "", backgroundContext: "", whyItMatters: "" };
  const html = renderNewsletter({ ...edition, stories: [story] }, { articleOnly: true }).html;
  assert.ok(html.includes(escapeHtml(story.plainExplanation)));
  assert.doesNotMatch(html, /<img |알고 읽으면 쉬워요|왜 중요한가요/);
});

test("one daily letter contains every story with same-mail contents and no separate reader links", () => {
  const html = renderNewsletter(edition, { variant: "letter" }).html;
  assert.equal((html.match(/data-mail-contents style=/g) || []).length, stories.length);
  assert.equal((html.match(/data-story-id=/g) || []).length, stories.length);
  for (let index = 1; index <= stories.length; index++) {
    assert.equal((html.match(new RegExp(`href="#news-${index}"`, "g")) || []).length, 1);
    assert.equal((html.match(new RegExp(`id="news-${index}"`, "g")) || []).length, 1);
  }
  assert.match(html, /href="#mail-start"/);
  assert.match(html, /id="mail-start"/);
  assert.doesNotMatch(html, /read.html|story-\d+.html|이전 기사|다음 기사|<script/);
  assert.ok(Buffer.byteLength(html) < 90 * 1024);
});

test("editorial letter uses one compact index, complete lead-first stories and real reading positions", () => {
  const html = renderNewsletter(edition, { variant: "letter" }).html;
  assert.equal((html.match(/data-editorial-story=/g) || []).length, stories.length);
  assert.equal((html.match(/data-reading-position style=/g) || []).length, stories.length);
  assert.equal((html.match(/data-mail-contents-list=/g) || []).length, 1);
  assert.doesNotMatch(html, /먼저, 핵심 세 가지/);
  assert.match(html, /class="letter-email"/);
  assert.match(html, /font-size:18px;line-height:1\.75/);
  assert.match(html, /font-size:18px;line-height:1\.7;font-weight:600/);
  assert.match(html, /text-wrap:balance/);
  for (let index = 0; index < stories.length; index++) {
    const start = html.indexOf(`data-story-id="${stories[index].id}"`);
    const end = index + 1 < stories.length ? html.indexOf(`data-story-id="${stories[index + 1].id}"`) : html.length;
    const block = html.slice(start, end);
    assert.ok(block.indexOf("data-key-summary") < block.indexOf("<img src="));
    assert.ok(block.includes(`${String(index + 1).padStart(2, "0")} / 06`));
    assert.ok(block.includes(escapeHtml(stories[index].plainExplanation)));
    assert.ok(block.includes(escapeHtml(stories[index].backgroundContext)));
    assert.match(block, /<h3 /);
  }
});

test("each full-mail article returns to the same contents without adding alerts or pages", () => {
  const html = renderNewsletter(edition, { variant: "letter" }).html;
  assert.equal((html.match(/id="mail-contents"/g) || []).length, 1);
  assert.equal((html.match(/href="#mail-contents" data-mail-return/g) || []).length, stories.length);
  assert.equal((html.match(/data-story-id=/g) || []).length, stories.length);
  assert.doesNotMatch(html, /read.html|story-\d+.html|<script/);
  for (const story of stories) {
    const focused = renderNewsletter({ ...edition, stories: [story] }, { articleOnly: true }).html;
    assert.doesNotMatch(focused, /href="#mail-contents"|data-mail-return/);
  }
});

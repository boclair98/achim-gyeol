import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { renderReaderArticle } from "../lib/newsletter/render-reader-article.mjs";
import { escapeHtml } from "../lib/newsletter/render-newsletter.mjs";

const stories = JSON.parse(await readFile(new URL("../components/prototype/archive-fixture.json", import.meta.url), "utf8"));
const archive = { briefingDate: "2026-09-16", dateLabel: "2026년 9월 16일" };

test("each standalone web article has one exact headline, all paragraphs, photo and sources", () => {
  for (const story of stories) {
    const html = renderReaderArticle(story, archive);
    const continuousText = html.replace(/<\/?span\b[^>]*>/g, "");
    assert.equal((html.match(/<h1>/g) || []).length, 1);
    assert.match(html, new RegExp(`data-story-id="${story.id}"`));
    for (const text of [story.title, story.summary, story.plainExplanation, story.backgroundContext, story.whyItMatters, story.uncertainty].filter(Boolean)) assert.ok(continuousText.includes(escapeHtml(text)));
    for (const source of story.sources) assert.ok(html.includes(escapeHtml(new URL(source.url).href)));
    assert.match(html, /보관판 · 디자인 미리보기/);
    assert.match(html, /article.css/);
    assert.doesNotMatch(html, /<script|<form|한 편씩, 더 분명하게|좋은 아침이에요|먼저, 핵심 세 가지/);
    for (const other of stories.filter(other => other.id !== story.id)) assert.ok(!html.includes(`data-story-id="${other.id}"`));
  }
});

test("missing optional content never suppresses a valid news item", () => {
  const story = { id: 1, title: "이미지가 없는 중요한 뉴스", summary: "기사 본문은 그대로 읽힙니다." };
  const html = renderReaderArticle(story, archive);
  assert.ok(html.includes(story.title));
  assert.ok(html.includes(story.summary));
  assert.match(html, /연결 가능한 원문이 없습니다/);
  assert.doesNotMatch(html, /<figure|<img|이해를 돕는 배경|우리에게 어떤 의미인가요|아직 확인되지 않은 내용/);
});

test("web article escapes every content field and rejects unsafe source and image URLs", () => {
  const story = { ...stories[0], title: '<img src=x onerror="alert(1)">', summary: "<script>unsafe</script>", imageUrl: "javascript:alert(1)", sources: [{ publisher: "<script>", url: "javascript:alert(2)" }, { publisher: "private", url: "https://user:password@example.com" }] };
  const html = renderReaderArticle(story, archive);
  assert.ok(html.replace(/<\/?span\b[^>]*>/g, "").includes(escapeHtml(story.title)));
  assert.doesNotMatch(html, /<script|<img|javascript:|user:password|href="https:\/\/user/);
  assert.throws(() => renderReaderArticle({ ...story, id: "../../private" }, archive), /valid article/);
  for (const briefingDate of ["bad", "2026-02-30", undefined]) assert.throws(() => renderReaderArticle(story, { briefingDate }), /valid archive date/);
});

test("web layout has no clipped copy, fixed picture height or tiny mobile body", async () => {
  const css = await readFile(new URL("../public/newsletter-prototypes/article.css", import.meta.url), "utf8");
  assert.match(css, /font-size: 18px; line-height: 1.85/);
  assert.match(css, /width: 100%; height: auto/);
  assert.match(css, /font-size: 28px/);
  assert.doesNotMatch(css, /line-clamp|text-overflow|object-fit:\s*cover/);
  assert.match(renderReaderArticle(stories[0], archive), /class="number-unit">1,359\.4원<\/span>/);
});

/** Local web-article preview only. No API, provider, credentials or send operation. */
import { escapeHtml } from "./render-newsletter.mjs";

function safeLink(value) {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

// WebKit can break decimal/currency figures even with Korean keep-all.
// Protect only short numeric units; long strings must still wrap safely.
function readableText(value) {
  return String(value).split(/(\d[\d,.]*(?:[-:]\d[\d,.]*)?(?:%|조|억|만|원|명|개|건|분|년|달러)?)/g).map(part => /^\d/.test(part) && part.length <= 10 ? `<span class="number-unit">${escapeHtml(part)}</span>` : escapeHtml(part)).join("");
}

export function renderReaderArticle(story, { briefingDate, dateLabel = briefingDate } = {}) {
  if (!Number.isSafeInteger(story?.id) || story.id <= 0 || typeof story.title !== "string" || !story.title.trim()) throw new Error("A valid article ID and headline are required");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(briefingDate ?? "") || Number.isNaN(Date.parse(briefingDate)) || new Date(briefingDate).toISOString().slice(0, 10) !== briefingDate) throw new Error("A valid archive date is required");
  const lead = String(story.oneLineSummary || "").trim();
  const paragraphs = [...new Set([story.summary, story.plainExplanation].filter(value => typeof value === "string" && value.trim()).map(value => value.trim()))].filter(value => value !== lead);
  const image = safeLink(story.imageUrl);
  const sources = Array.isArray(story.sources) ? story.sources.map(source => ({ ...source, safeUrl: safeLink(source?.url) })).filter(source => source.safeUrl) : [];
  const section = (heading, text, extra = "") => text ? `<section class="article-section" ${extra}><h2>${escapeHtml(heading)}</h2><p>${readableText(text)}</p></section>` : "";
  return `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${escapeHtml(story.title)} | 아침결 보관 기사</title><link rel="stylesheet" href="article.css"></head>
<body class="article-document"><main class="news-article" data-story-id="${story.id}">
<header class="article-header"><p class="article-byline"><strong>아침결<span>.</span></strong><span>${escapeHtml(story.category || "뉴스")}</span></p><h1>${readableText(story.title)}</h1><p class="article-meta"><time datetime="${briefingDate}">${escapeHtml(dateLabel)}</time> 보관판 · 디자인 미리보기</p>${lead ? `<p class="article-lead">${readableText(lead)}</p>` : ""}</header>
${image ? `<figure><img src="${escapeHtml(image)}" alt="${escapeHtml(story.imageAlt || `${story.category || "뉴스"} 관련 원문 사진`)}" referrerpolicy="no-referrer"><figcaption>사진 · ${escapeHtml(story.imagePublisher || story.sources?.[0]?.publisher || "원문 출처")}</figcaption></figure>` : ""}
<div class="article-copy">${paragraphs.map(text => `<p>${readableText(text)}</p>`).join("")}</div>
${section("이해를 돕는 배경", story.backgroundContext)}
${story.whyItMatters !== story.backgroundContext ? section("우리에게 어떤 의미인가요", story.whyItMatters) : ""}
${section("앞으로 볼 부분", story.whatToWatch)}
${story.uncertainty ? `<aside class="article-caveat"><h2>아직 확인되지 않은 내용</h2><p>${readableText(story.uncertainty)}</p></aside>` : ""}
<section class="article-sources" aria-labelledby="sources-heading"><h2 id="sources-heading">참고한 보도</h2><p>아침결이 여러 보도를 바탕으로 정리한 내용입니다. 자세한 내용은 원문에서 확인하세요.</p>${sources.length ? `<ul>${sources.map(source => `<li><a href="${escapeHtml(source.safeUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.publisher || new URL(source.safeUrl).hostname)}<span class="sr-only"> 원문, 새 창</span><span aria-hidden="true"> ↗</span></a></li>`).join("")}</ul>` : "<p>연결 가능한 원문이 없습니다.</p>"}</section>
<footer data-article-end><strong>아침결.</strong><p>보관 기사로 만든 디자인 시안입니다.<br>실제 발송·배포되지 않았습니다.</p></footer>
</main></body></html>`;
}

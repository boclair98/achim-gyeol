/** Pure email rendering. No credentials, network, recipient store or send operation. */
export const newsletterVariants = ["letter", "brief", "magazine"];

// Public reading-service observations informed this choice. This is SUIT, not
// Toss's proprietary font. Mail clients without webfonts keep native fallbacks.
const font = "'SUIT',-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Malgun Gothic','Segoe UI',sans-serif";
const themes = {
  letter: { ink: "#191f28", brand: "#1d4ed8", soft: "#eef4ff", muted: "#4e5968", border: "#e7ebf0", canvas: "#f6f8fb" },
  brief: { ink: "#191f28", brand: "#1d4ed8", soft: "#eef4ff", muted: "#4e5968", border: "#e7ebf0", canvas: "#f6f8fb" },
  magazine: { ink: "#191f28", brand: "#1d4ed8", soft: "#eef4ff", muted: "#4e5968", border: "#e7ebf0", canvas: "#f6f8fb" },
};

export function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

function safeUrl(value, httpsOnly = false) {
  try {
    const parsed = new URL(value);
    if (!(httpsOnly ? ["https:"] : ["https:", "http:"]).includes(parsed.protocol) || parsed.username || parsed.password) return null;
    return parsed.href;
  } catch { return null; }
}

function licensedFontCss(options, preview) {
  if (!options.fontFaces?.length) return "";
  if (options.fontLicenseConfirmed !== true) throw new Error("A supplied font requires confirmed usage rights");
  return options.fontFaces.map(({ url, weight = "400", format = "woff2" }) => {
    const source = safeUrl(url, true) || (preview && /^\.\/fonts\/[a-zA-Z0-9_.-]+\.(woff2?|ttf|otf)$/.test(url) ? url : null);
    if (!source || /["\\<>\r\n]/.test(String(url)) || /["\\<>\r\n]/.test(source) || !/^(?:[1-9]00|[1-9]00 [1-9]00)$/.test(String(weight)) || !["woff2", "woff", "truetype", "opentype"].includes(format)) throw new Error("Invalid licensed font configuration");
    return `@font-face{font-family:'SUIT';src:url("${source}") format("${format}");font-weight:${weight};font-style:normal;font-display:swap;}`;
  }).join("");
}

const table = (content, style = "", extra = "") => `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;${style}" ${extra}>${content}</table>`;
const row = (content, style = "", extra = "") => `<tr><td style="text-align:left;${style}" ${extra}>${content}</td></tr>`;
// HTML height works in table-based mail clients without repeating a long
// inline style on every spacer. Keep the HTML budget for content, not padding.
const gap = (height = 24) => `<tr aria-hidden="true"><td height="${height}" style="font-size:0;line-height:0;">&nbsp;</td></tr>`;
const p = (content, color, size = 17, margin = "0", leading = size <= 13 ? "1.6" : "1.65", weight = 400) => `<p style="margin:${margin};color:${color};font-size:${size}px;line-height:${leading};font-weight:${weight};letter-spacing:-.01em;word-break:keep-all;overflow-wrap:anywhere;">${content}</p>`;
function headlineMarkup(value) {
  return String(value).split(/(\d[\d,.]*(?:[-:]\d[\d,.]*)?(?:%|조|억|만|원|명|개|건|분|년|달러)?)/g).map((part) => /^\d/.test(part) && part.length <= 9 ? `<span style="white-space:nowrap;">${escapeHtml(part)}</span>` : escapeHtml(part)).join("");
}
const title = (text, color, size = 24, level = 2) => `<h${level} style="margin:0;color:${color};font-size:${size}px;line-height:1.4;letter-spacing:-.025em;font-weight:700;word-break:keep-all;overflow-wrap:anywhere;text-wrap:balance;">${headlineMarkup(text)}</h${level}>`;
const firstSentence = (text) => String(text ?? "").trim().split(/(?<=[.!?])\s+/)[0];
const sourceLink = (story) => safeUrl(story.sources?.[0]?.url);

function badge(text, t) {
  return `<span style="display:inline-block;margin-bottom:12px;padding:4px 8px;background:${t.soft};color:${t.brand};font-size:12px;line-height:1.5;font-weight:600;border-radius:6px;">${escapeHtml(text)}</span>`;
}

function readLink(story, t, label = "원문 읽기") {
  const url = sourceLink(story);
  return url ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:12px 0;min-height:44px;color:${t.brand};font-size:14px;line-height:20px;font-weight:700;text-decoration:underline;text-underline-offset:3px;">${escapeHtml(label)}<span style="font-size:12px;font-weight:400;"> (${escapeHtml(story.sources[0].publisher)})</span></a>` : p("연결 가능한 원문이 없습니다.", t.muted, 12);
}

function image(story, t, width = 560, caption = true, rounded = false) {
  const url = safeUrl(story.imageUrl);
  if (!url) return "";
  return `<img src="${escapeHtml(url)}" width="${width}" referrerpolicy="no-referrer" alt="${escapeHtml(story.imageAlt || `${story.category} 기사 원문 사진`)}" style="display:block;width:100%;max-width:${width}px;height:auto;border:0;${rounded ? "border-radius:12px;" : ""}color:${t.muted};font-size:13px;line-height:1.5;background:${t.soft};" />${caption ? p(`사진 ${escapeHtml(story.imagePublisher || story.sources?.[0]?.publisher || "원문 출처")}`, t.muted, 12, "10px 0 0") : ""}`;
}

function masthead(edition, t, number = false) {
  return table(`<tr><td style="font-size:26px;font-weight:700;letter-spacing:-1px;color:${t.brand};white-space:nowrap;padding-right:16px;">아침결<span style="color:${t.muted};">.</span></td><td align="right" style="font-size:12px;line-height:1.7;color:${t.muted};">${escapeHtml(edition.dateLabel)}<br />${number ? `${edition.stories.length}개의 이야기` : "평일 아침에 만나는 뉴스"}</td></tr>`);
}

function button(url, label, t) {
  return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;min-height:48px;padding:14px 22px;background:${t.brand};border:1px solid ${t.brand};color:#ffffff;text-decoration:none;font-size:15px;line-height:22px;font-weight:600;border-radius:12px;mso-padding-alt:14px 22px;">${escapeHtml(label)}</a>`;
}

function thumbnailRow(story, t, compact = false) {
  const photo = image(story, t, compact ? 104 : 96, false);
  const description = table(`<tr>${photo ? `<td class="thumb" valign="top" width="${compact ? 120 : 112}" style="width:${compact ? 120 : 112}px;padding:0 20px 0 0;">${photo}</td>` : ""}<td class="thumb-copy" valign="top" style="padding:0;">${p(escapeHtml(firstSentence(story.plainExplanation || story.summary)), t.muted)}</td></tr>`, "table-layout:fixed;");
  return row(badge(story.category, t) + title(story.title, t.ink, 23) + `<div style="height:16px;font-size:1px;" aria-hidden="true">&nbsp;</div>` + description + readLink(story, t), `padding:28px 0 20px;border-bottom:1px solid ${t.border};`);
}

function fullStoryBlock(story, t, level = 2, anchor = "", position = null) {
  // This table establishes left alignment once. Child cells inherit it rather
  // than repeating the same style for every paragraph in a long daily mail.
  const storyRow = (content, extra = "") => `<tr><td${extra ? ` ${extra}` : ""}>${content}</td></tr>`;
  const photo = image(story, t, 568, true, true);
  const summary = story.oneLineSummary || firstSentence(story.summary);
  const explanation = story.plainExplanation || story.summary;
  const label = text => `<h${level + 1} style="margin:0;font-size:14px;line-height:1.6;font-weight:600;color:${t.muted};letter-spacing:-.01em;">${escapeHtml(text)}</h${level + 1}>`;
  const order = position ? `<td align="right" valign="top" data-reading-position style="font-size:13px;line-height:1.7;color:${t.muted};white-space:nowrap;">${String(position.current).padStart(2, "0")} / ${String(position.total).padStart(2, "0")}</td>` : "";
  let rows = storyRow(table(`<tr><td style="text-align:left;">${badge(story.category, t)}</td>${order}</tr>`)) + storyRow(title(story.title, t.ink, 26, level));
  if (summary) rows += gap(16) + storyRow(`<div data-key-summary style="border-left:3px solid ${t.brand};padding:0 0 0 14px;">${label("핵심 요약")}${p(escapeHtml(summary), t.ink, 18, "6px 0 0", "1.7", 600)}</div>`);
  if (photo) rows += gap(24) + storyRow(photo);
  if (explanation && explanation !== summary) rows += gap(24) + storyRow(label("쉽게 읽기") + p(escapeHtml(explanation), t.ink, 18, "8px 0 0", "1.75"), 'data-editorial-explanation=""');
  if (story.backgroundContext) rows += gap(24) + storyRow(`<div data-editorial-context style="background:#f6f8fb;padding:20px;border-radius:12px;">${label("알고 읽으면 쉬워요")}${p(escapeHtml(story.backgroundContext), t.muted, 16, "8px 0 0", "1.75")}</div>`);
  if (story.whyItMatters && story.whyItMatters !== story.backgroundContext) rows += gap(24) + storyRow(label("왜 중요한가요") + p(escapeHtml(story.whyItMatters), t.muted, 17, "8px 0 0", "1.75"));
  const returnToContents = position ? `<a href="#mail-contents" data-mail-return style="display:inline-block;margin-left:16px;color:${t.brand};font-size:14px;line-height:44px;">목차로 돌아가기</a>` : "";
  rows += gap(8) + storyRow(readLink(story, t) + returnToContents);
  return table(rows, "text-align:left;", `data-editorial-story="" data-story-id="${escapeHtml(story.id ?? "preview")}"${anchor ? ` id="${escapeHtml(anchor)}"` : ""}`);
}

function mailContents(stories, t) {
  return table(row(title("이번 편에 담았어요", t.ink, 18) + p("제목을 누르면 이 메일 안에서 바로 읽을 수 있어요.", t.muted, 13, "6px 0 10px"))
    + stories.map((story, index) => row(`<a href="#news-${index + 1}" data-mail-contents style="display:block;min-height:44px;padding:12px 0;color:${t.ink};font-size:15px;line-height:1.6;text-decoration:none;word-break:keep-all;overflow-wrap:anywhere;"><span style="display:inline-block;margin-right:10px;color:${t.brand};font-size:12px;font-weight:600;">${escapeHtml(story.category)}</span> ${headlineMarkup(story.title)}</a>`, `border-bottom:1px solid ${t.border};`)).join(""), "", 'data-mail-contents-list="" id="mail-contents"');
}

function letterBody(edition, t) {
  const header = table(`<tr><td style="font-size:32px;line-height:1.2;font-weight:700;letter-spacing:-1.4px;color:${t.ink};white-space:nowrap;padding-right:16px;">아침결<span style="color:${t.brand};">.</span></td><td align="right" style="font-size:12px;line-height:1.7;color:${t.muted};">${escapeHtml(edition.dateLabel)}<br />${edition.stories.length}개의 소식이 담긴 한 통</td></tr>`);
  return table(row(header, `padding:24px 0;border-top:3px solid ${t.brand};border-bottom:1px solid ${t.border};`) + gap(28)
    + row(title("좋은 아침이에요.", t.ink, 28, 1) + p("중요한 소식은 짧게, 낯선 이야기는 쉽게 전해요.", t.muted, 16, "10px 0 0"))
    + gap(28) + row(mailContents(edition.stories, t)) + gap(40)
    + edition.stories.map((story, index) => row(fullStoryBlock(story, t, 2, `news-${index + 1}`, { current: index + 1, total: edition.stories.length }), index ? `padding-top:40px;border-top:1px solid ${t.border};` : "") + (index < edition.stories.length - 1 ? gap(40) : "")).join("")
    + gap(24) + row(`<a href="#mail-start" style="display:inline-block;min-height:44px;padding:12px 0;color:${t.brand};font-size:14px;line-height:20px;text-underline-offset:4px;">메일 처음으로 돌아가기 ↑</a>`), "", 'id="mail-start"');
}

function briefBody(edition, t) {
  return table(row(masthead(edition, t, true)) + gap(24)
    + row(table(row(title("바쁜 아침엔, 핵심부터.", "#ffffff", 30, 1) + p(`${edition.stories.length}개 소식 중 필요한 이야기를 골라 읽으세요.`, "#edf3ff", 17, "12px 0 0"), "padding:28px 24px;")), `background:${t.brand};border-radius:16px;`)
    + gap(24) + row(title("한눈에 보는 주요 소식", t.ink, 20)) + gap(12)
    + row(table(edition.stories.slice(0, 3).map((story) => row(p(`<strong style="color:${t.brand};">${escapeHtml(story.category)}</strong> &nbsp;${escapeHtml(story.oneLineSummary || story.title)}`, t.ink, 16), `padding:12px 0;border-bottom:1px solid ${t.border};`)).join("")))
    + gap(24) + row(table(edition.stories.map((story) => thumbnailRow(story, t, true)).join(""))));
}

function magazineTile(story, t) {
  return image(story, t, 266) + `<div style="padding-top:16px;">${badge(story.category, t)}${title(story.title, t.ink, 22)}${p(escapeHtml(firstSentence(story.plainExplanation || story.summary)), t.muted, 17, "12px 0 0")}${readLink(story, t)}</div>`;
}

function magazineBody(edition, t) {
  const lead = edition.stories.find((story) => story.category === "스포츠" && safeUrl(story.imageUrl)) || edition.stories.find((story) => safeUrl(story.imageUrl)) || edition.stories[0];
  const rest = edition.stories.filter((story) => story !== lead);
  let tiles = "";
  for (let index = 0; index < rest.length; index += 2) {
    tiles += `<tr><td class="tile" width="50%" valign="top" style="width:50%;padding:0 12px 32px 0;">${magazineTile(rest[index], t)}</td><td class="tile" width="50%" valign="top" style="width:50%;padding:0 0 32px 12px;">${rest[index + 1] ? magazineTile(rest[index + 1], t) : ""}</td></tr>`;
  }
  return table(row(masthead(edition, t)) + gap(26)
    + row(p("사진 한 장에서 시작하는", t.brand, 14) + title("어제의 이야기.", t.ink, 32, 1) + p("낯선 뉴스도 조금 더 쉽게 읽어보세요.", t.muted, 17, "12px 0 0")) + gap(24)
    + row(image(lead, t)) + gap(24)
    + row(badge(lead.category, t) + title(lead.title, t.ink, 25) + p(escapeHtml(lead.plainExplanation || lead.summary), t.ink, 17, "16px 0 0"))
    + gap(16) + row(`<div style="padding:20px;background:${t.soft};border-radius:14px;">${p("이 배경까지 함께", t.brand, 13)}${p(escapeHtml(lead.backgroundContext || lead.whyItMatters), t.ink, 17, "8px 0 0")}</div>`)
    + row(readLink(lead, t)) + gap(32) + row(title("다른 분야의 이야기", t.ink, 22)) + gap(24) + row(table(tiles)));
}

/** A send integration must explicitly opt out of preview and supply real footer URLs. */
export function renderNewsletter(input, options = {}) {
  const { variant = "letter", preview = true } = options;
  if (!newsletterVariants.includes(variant)) throw new Error("Unknown newsletter variant");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input?.briefingDate ?? "") || Number.isNaN(Date.parse(input.briefingDate)) || new Date(input.briefingDate).toISOString().slice(0, 10) !== input.briefingDate) throw new Error("A valid edition date is required");
  if (!Array.isArray(input.stories)) throw new Error("Edition stories must be an array");
  const articleOnly = options.articleOnly === true;
  if (articleOnly && input.stories.length !== 1) throw new Error("Single-article layout requires exactly one story");
  const edition = { ...input, dateLabel: String(input.dateLabel || input.briefingDate).replace(/[\r\n]+/g, " "), stories: input.stories.slice(0, 15) };
  const t = themes[variant];
  const webUrl = safeUrl(options.webUrl || `https://morningnews.coders.kr/briefing/?date=${input.briefingDate}`, true);
  if (!webUrl) throw new Error("A valid HTTPS web edition URL is required");
  const unsubscribeUrl = safeUrl(options.unsubscribeUrl, true);
  if (!preview && (!unsubscribeUrl || !options.senderName?.trim() || !options.senderAddress?.trim())) throw new Error("Sending mode requires a real sender identity, address and unsubscribe URL");
  const subject = `${preview ? "[디자인 미리보기] " : ""}아침결 | ${articleOnly ? String(edition.stories[0].title).replace(/[\r\n]+/g, " ") : `${edition.dateLabel} ${edition.stories.length}개의 이야기`}`;
  const preheader = edition.stories.slice(0, 3).map((story) => story.oneLineSummary || story.title).join(" / ").slice(0, 180);
  const body = articleOnly ? fullStoryBlock(edition.stories[0], t, 1) : edition.stories.length ? { letter: letterBody, brief: briefBody, magazine: magazineBody }[variant](edition, t) : table(row(masthead(edition, t)) + gap(32) + row(title("아직 전할 기사가 없습니다", t.ink, 28, 1) + p("확인된 새 기사가 없어 뉴스 내용을 임의로 만들지 않았습니다. 아래에서 보관 브리핑을 확인할 수 있습니다.", t.muted, 16, "14px 0 0")));
  const footer = table(gap(32) + row(button(webUrl, "이 날짜 브리핑 전체 읽기", t), "text-align:center;") + gap(32) + row(p("당신의 아침에, 필요한 이야기만.", t.ink, 17) + p("아침결", t.brand, 18, "10px 0 0") + (preview ? p("보관 기사로 만든 디자인 시안입니다. 실제 발송되지 않았습니다.<br />메일 수신 설정은 실제 발송 연결 후 제공됩니다.", t.muted, 12, "16px 0 0") : p(`${escapeHtml(options.senderName)}<br />${escapeHtml(options.senderAddress)}<br /><a href="${escapeHtml(unsubscribeUrl)}" style="display:inline-block;padding:12px 0;color:${t.brand};text-decoration:underline;">메일 수신 거부</a>`, t.muted, 12, "16px 0 0")), `padding-top:25px;border-top:1px solid ${t.border};text-align:center;`));
  const articleFooter = table(gap(24) + row(p(`아침결 · ${escapeHtml(edition.dateLabel)} 보관 기사`, t.muted, 12) + p("디자인 미리보기입니다. 실제 발송되지 않았습니다.", t.muted, 12, "8px 0 0"), `padding-top:20px;border-top:1px solid ${t.border};`), "", 'data-article-end=""');
  const renderedFooter = articleOnly && preview ? articleFooter : footer;
  const fontStyles = licensedFontCss(options, preview);
  const responsiveStyles = `
    body{margin:0;padding:0}
    table{mso-table-lspace:0pt;mso-table-rspace:0pt}
    a:focus-visible{outline:3px solid #2563eb;outline-offset:3px}
    img{border:0;max-width:100%;height:auto}
    h1,h2,h3,p{word-break:keep-all;overflow-wrap:anywhere}
    @media screen and (max-width:620px){
      .email-shell{width:100%!important}
      .email-pad{padding:28px 20px!important}
      .outer-pad{padding:16px 8px!important}
      .tile{display:block!important;width:100%!important;padding:0 0 32px!important}
      .tile img{max-width:100%!important}
      .thumb{width:80px!important;padding-right:16px!important}
      .thumb img{max-width:64px!important}
      .letter-email .outer-pad{padding:16px 0!important}
      .letter-email .email-shell{border-radius:0!important}
    }
    @media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}}
  `;
  const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>${escapeHtml(subject)}</title><style>${fontStyles}${responsiveStyles}</style></head><body class="${variant}-email" style="margin:0;padding:0;background:${t.canvas};font-family:${font};color:${t.ink};-webkit-text-size-adjust:100%;text-size-adjust:100%;"><div style="display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;mso-hide:all;" aria-hidden="true">${escapeHtml(preheader)}</div>${table(row(`${preview ? p(`${escapeHtml(edition.dateLabel)} 보관 기사 · 디자인 미리보기`, t.muted, 12, "0 0 12px") : ""}<!--[if mso]><table role="presentation" width="640" align="center"><tr><td><![endif]-->${table(row(body + renderedFooter, "padding:32px 36px;", 'class="email-pad"'), "max-width:640px;width:100%;margin:0 auto;background:#ffffff;border-radius:12px;", 'class="email-shell" align="center"')}<!--[if mso]></td></tr></table><![endif]-->`, "padding:24px 16px;text-align:center;", 'class="outer-pad"'), "width:100%;")}</body></html>`;
  // Keep below conservative email clipping thresholds; never silently truncate articles.
  if (new TextEncoder().encode(html).length > 90 * 1024) throw new Error("Newsletter exceeds the 90 KiB HTML budget; shorten the source summaries");
  const text = `${preview ? "디자인 미리보기 · 실제 발송 없음\n" : ""}아침결 | ${edition.dateLabel}\n\n${edition.stories.length ? edition.stories.map((story) => `${story.category}\n${story.title}\n${story.plainExplanation || story.summary || ""}\n${story.backgroundContext || ""}\n원문: ${sourceLink(story) || "연결 없음"}`).join("\n\n") : "확인된 새 기사가 없습니다."}\n\n브리핑 전체: ${webUrl}\n${preview ? "보관 기사로 만든 시안이며 메일 발송 기능은 연결 전입니다." : `${options.senderName}\n${options.senderAddress}\n수신 거부: ${unsubscribeUrl}`}`;
  return { html, text, subject, preheader, variant, preview, articleOnly, storyCount: edition.stories.length };
}

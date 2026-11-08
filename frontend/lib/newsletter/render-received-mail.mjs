const maxHtmlBytes = 88 * 1024;
const font = "'Apple SD Gothic Neo','Malgun Gothic',Arial,sans-serif";
const ink = "#182334";
const muted = "#536175";
const blue = "#2157b5";
const rule = "#dfe6ef";
const wrapping = "word-break:keep-all;word-wrap:break-word;overflow-wrap:anywhere";

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
}

/** @param {string} serviceUrl @param {string | undefined} date */
function editionLink(serviceUrl, date) {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) {
    throw new Error("A valid edition date is required for a mail link");
  }
  const base = new URL(serviceUrl);
  if (!["http:", "https:"].includes(base.protocol) || base.username || base.password) throw new Error("Invalid mail link base");
  base.pathname = base.pathname.replace(/\/?$/, "/");
  const url = new URL("briefing/delivery/", base);
  url.searchParams.set("date", date);
  return url;
}

function renderHtml(name, dateLabel, link, stories, rows, compact) {
  const summary = stories ? `전날 중요 뉴스 ${stories}건. 기사 제목을 누르면 핵심 요약을 볼 수 있어요.` : "아직 읽을 수 있는 뉴스가 없어요.";
  return `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light"><title>${escapeHtml(name)} 뉴스레터</title></head>
<body style="margin:0;background:#f3f6fa;color:${ink};font-family:${font};${wrapping}">
<div style="display:none;max-height:0;overflow:hidden" aria-hidden="true">${summary}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f6fa"><tr><td align="center" style="padding:12px 8px">
<!--[if mso]><table role="presentation" width="640" align="center"><tr><td><![endif]-->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;table-layout:fixed;background:#fff;text-align:left;font-family:${font}">
  <tr><td style="padding:22px 20px 15px;border-bottom:1px solid ${rule}">
    <strong style="font-size:22px;color:${ink}">${escapeHtml(name)}<span style="color:${blue}">.</span></strong>
    <span style="padding-left:7px;color:${muted};font-size:14px">뉴스레터</span>
  </td></tr>
  <tr><td style="padding:24px 20px 22px">
    <p style="margin:0;color:${blue};font-size:14px;font-weight:bold;line-height:1.5">${escapeHtml(dateLabel)}</p>
    <h1 style="margin:7px 0 8px;color:${ink};font-size:31px;line-height:1.23;letter-spacing:-.04em">어제의 핵심 뉴스</h1>
    <p style="margin:0;color:${muted};font-size:16px;line-height:1.6">${compact ? `뉴스 ${stories}건을 담았어요. 전체 제목과 요약은 아래에서 읽을 수 있어요.` : summary}</p>
  </td></tr>
  ${rows ? `<tr><td style="padding:0 20px"><h2 style="margin:0 0 8px;color:${ink};font-size:18px;line-height:1.4">이 편의 뉴스</h2></td></tr>${rows}` : ""}
  <tr><td style="padding:22px 20px 12px">
    <a href="${escapeHtml(link)}" target="_top" style="display:inline-block;min-height:20px;padding:12px 14px;border-radius:8px;background:#edf4ff;color:${blue};font-weight:bold;text-decoration:none;font-size:15px;line-height:20px">전체 뉴스 열기 →</a>
  </td></tr>
  <tr><td style="padding:8px 20px 22px;color:${muted};font-size:13px;line-height:1.6">${escapeHtml(name)} · 기사마다 요약과 원문을 함께 볼 수 있어요.</td></tr>
</table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr></table>
</body></html>`;
}

/**
 * One accessible title list linking to the matching web edition. The email has
 * no script, image, or web-font requirement and does not send anything.
 * @param {{briefingDate?: string, dateLabel: string, stories: ReadonlyArray<{id: number, category: string, title: string}>}} briefing
 * @param {string} serviceUrl
 * @param {string} [brandName]
 */
export function renderReceivedMail(briefing, serviceUrl, brandName = "아침결") {
  const { dateLabel, stories } = briefing;
  const url = editionLink(serviceUrl, briefing.briefingDate);
  const count = stories.length;
  const entries = stories.map((story, index) => {
    if (!Number.isSafeInteger(story.id) || story.id <= 0) throw new Error("Invalid story link");
    const article = new URL(url);
    article.hash = `news-${story.id}`;
    return { ...story, number: String(index + 1).padStart(2, "0"), href: article.href };
  });
  const rows = entries.map(({ number, category, title, href }) =>
    `<tr><td style="padding:0 20px"><a href="${escapeHtml(href)}" target="_top" style="display:block;padding:11px 0;border-top:1px solid ${rule};color:${ink};font-size:17px;line-height:1.45;text-decoration:none;${wrapping}"><span style="display:block;color:${blue};font-size:13px">${number} · ${escapeHtml(category)}</span><strong>${escapeHtml(title)}</strong></a></td></tr>`
  ).join("");
  let html = renderHtml(brandName, dateLabel, url.href, count, rows, false);
  const compact = new TextEncoder().encode(html).byteLength > maxHtmlBytes;
  if (compact) html = renderHtml(brandName, dateLabel, url.href, count, "", true);

  const subject = `[${brandName}] ${dateLabel} · 핵심 뉴스 ${count}건`.replace(/[\r\n]+/g, " ");
  const text = [
    `${brandName} 뉴스레터 · ${dateLabel}`, "", `어제의 핵심 뉴스 ${count}건`, "",
    ...(compact ? ["전체 제목과 요약은 아래 링크에서 읽을 수 있어요.", ""]
      : entries.flatMap(({ number, category, title, href }) => [`${number} · ${category} · ${title}`, href, ""])),
    `전체 뉴스 열기: ${url.href}`,
  ].join("\r\n");
  return { html, text, subject, storyCount: count, compact };
}

function toBase64(value) {
  return btoa(Array.from(new TextEncoder().encode(value), byte => String.fromCharCode(byte)).join(""));
}

/** @param {{subject: string, html: string, text: string}} message @param {string} [brandName] */
export function renderPreviewEml(message, brandName = "아침결") {
  const boundary = "achim-gyeol-received-preview";
  const encodeLines = value => toBase64(value).match(/.{1,76}/g)?.join("\r\n") ?? "";
  return [
    `From: =?UTF-8?B?${toBase64(brandName)}?= <no-reply@achim-gyeol.example>`,
    `Subject: =?UTF-8?B?${toBase64(message.subject)}?=`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`, "",
    ...[["plain", message.text], ["html", message.html]].flatMap(([format, value]) => [
      `--${boundary}`, `Content-Type: text/${format}; charset=UTF-8`, "Content-Transfer-Encoding: base64", "", encodeLines(value), "",
    ]),
    `--${boundary}--`, "",
  ].join("\r\n");
}

import type { Briefing } from "@/lib/briefing";
import { defaultBrand, type BriefingBrand } from "@/lib/product";

export function createBriefingEml(briefing: Briefing, serviceUrl: string, brand: BriefingBrand = defaultBrand) {
  const subject = `[${brand.name}] 어제 핵심 뉴스 ${briefing.stories.length}개를 종합했어요`;
  const html = createEmailHtml(briefing, serviceUrl, brand);
  const encodedSubject = toBase64(subject);
  return [
    `From: =?UTF-8?B?${toBase64(brand.name)}?= <no-reply@achim-gyeol.example>`,
    "To: ",
    `Subject: =?UTF-8?B?${encodedSubject}?=`,
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    html,
  ].join("\r\n");
}

export function createEmailHtml(briefing: Briefing, serviceUrl: string, brand: BriefingBrand = defaultBrand) {
  const storyCards = briefing.stories.map((story, index) => {
    const verified = story.verificationStatus === "VERIFIED";
    const sources = story.sources.map((source) => `<a href="${escapeHtml(source.url)}" style="color:#1558e9;text-decoration:none;font-weight:700">${escapeHtml(source.publisher)}</a>`).join(" · ");
    const summaryItems = summaryPoints(story.summary).map((point) => `<li style="margin:0 0 7px">${escapeHtml(point)}</li>`).join("");
    return `
      <tr><td style="padding:0 18px 16px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:2px solid #101722;border-radius:22px;background:#fffdf7;box-shadow:6px 6px 0 #101722">
          <tr><td style="padding:26px 26px 8px">
            <table role="presentation" width="100%"><tr>
              <td><span style="display:inline-block;border-radius:999px;background:#1558e9;color:#fff;padding:7px 11px;font-size:11px;font-weight:900">${escapeHtml(story.category)}</span></td>
              <td align="right" style="color:${verified ? "#147a56" : "#9a6517"};font-size:11px;font-weight:800">${verified ? "● 원문 함께 보기" : "● 내용 정리 중"}</td>
            </tr></table>
          </td></tr>
          <tr><td style="padding:8px 26px 0;color:#101722;font-size:25px;line-height:1.35;font-weight:900;letter-spacing:-1px">${String(index + 1).padStart(2, "0")}. ${escapeHtml(story.title)}</td></tr>
          <tr><td style="padding:18px 26px 0"><div style="border-top:4px solid #1558e9;padding-top:14px"><b style="color:#1558e9;font-size:12px">핵심 내용</b><ul style="margin:9px 0 0;padding-left:20px;color:#46505b;font-size:15px;line-height:1.65">${summaryItems}</ul></div></td></tr>
          <tr><td style="padding:18px 26px 0"><div style="border-radius:15px;background:#eef1f4;padding:16px 18px"><b style="color:#1558e9;font-size:12px">알아야 할 것</b><p style="margin:7px 0 0;color:#101722;font-size:14px;line-height:1.7">${escapeHtml(story.whyItMatters)}</p></div></td></tr>
          <tr><td style="padding:17px 26px 25px;color:#68707a;font-size:11px">관련 원문 ${sources}</td></tr>
        </table>
      </td></tr>`;
  }).join("");

  return `<!doctype html>
  <html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body style="margin:0;background:#f4f1e8;font-family:Arial,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;color:#101722">
    <div style="display:none;max-height:0;overflow:hidden">어제의 소음을 걷어낸 ${briefing.stories.length}개 핵심 뉴스와 출처를 확인하세요.</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1e8"><tr><td align="center" style="padding:26px 10px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px">
        <tr><td style="padding:0 18px 12px;color:#68707a;font-size:10px;font-weight:800;letter-spacing:1px">MORNING NEWS · ${escapeHtml(briefing.dateLabel)}</td></tr>
        <tr><td style="padding:0 18px 18px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:2px solid #101722;border-radius:26px;background:#101d32;box-shadow:7px 7px 0 #1558e9">
            <tr><td style="padding:34px 32px 12px"><span style="display:inline-block;border-radius:999px;background:${escapeHtml(brand.accent)};color:#101722;padding:8px 12px;font-size:10px;font-weight:900;letter-spacing:1px">${escapeHtml(brand.descriptor)}</span></td></tr>
            <tr><td style="padding:4px 32px;color:#fff;font-size:34px;line-height:1.25;font-weight:900">뉴스를 찾지 않아도,<br><span style="color:#d8ff3e">요약 카드가 도착해요.</span></td></tr>
            <tr><td style="padding:18px 32px 12px;color:#c7cfda;font-size:14px;line-height:1.8">${escapeHtml(briefing.lead)}</td></tr>
            <tr><td style="padding:14px 32px 32px;color:#fff;font-size:12px"><b style="color:${escapeHtml(brand.accent)}">${briefing.stories.length}개 핵심 뉴스</b> · 원문 함께 제공 · 약 ${briefing.readMinutes}분</td></tr>
          </table>
        </td></tr>
        ${storyCards}
        <tr><td align="center" style="padding:22px 18px 8px"><a href="${escapeHtml(serviceUrl)}" style="display:inline-block;border:2px solid #101722;border-radius:13px;background:#d8ff3e;color:#101722;padding:14px 22px;text-decoration:none;font-size:13px;font-weight:900">지난 뉴스에서 원문 확인</a></td></tr>
        <tr><td align="center" style="padding:16px 24px;color:#7b838c;font-size:10px;line-height:1.7">${escapeHtml(brand.name)} · ${escapeHtml(brand.editorName)}<br>요약은 빠른 이해를 돕기 위한 내용입니다. 중요한 판단 전에는 원문을 확인하세요.</td></tr>
      </table>
    </td></tr></table>
  </body></html>`;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character);
}

function summaryPoints(summary: string) {
  const points = summary.trim().split(/(?<=[.!?])\s+/).filter(Boolean);
  return points.length > 1 ? points.slice(0, 3) : [summary];
}

function toBase64(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

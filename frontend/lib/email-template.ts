import type { Briefing } from "@/lib/briefing";

export function createBriefingEml(briefing: Briefing, serviceUrl: string) {
  const subject = `[아침결] ${briefing.stories.length}개 핵심 뉴스가 카드로 도착했어요`;
  const html = createEmailHtml(briefing, serviceUrl);
  const encodedSubject = toBase64(subject);
  return [
    "From: =?UTF-8?B?7JWE7Lmo6rKw?= <no-reply@achim-gyeol.example>",
    "To: ",
    `Subject: =?UTF-8?B?${encodedSubject}?=`,
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    html,
  ].join("\r\n");
}

export function createEmailHtml(briefing: Briefing, serviceUrl: string) {
  const storyCards = briefing.stories.map((story, index) => {
    const verified = story.verificationStatus === "VERIFIED";
    const sources = story.sources.map((source) => `<a href="${escapeHtml(source.url)}" style="color:#1558e9;text-decoration:none;font-weight:700">${escapeHtml(source.publisher)}</a>`).join(" · ");
    return `
      <tr><td style="padding:0 18px 16px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:2px solid #101722;border-radius:22px;background:#fffdf7;box-shadow:6px 6px 0 #101722">
          <tr><td style="padding:26px 26px 8px">
            <table role="presentation" width="100%"><tr>
              <td><span style="display:inline-block;border-radius:999px;background:#1558e9;color:#fff;padding:7px 11px;font-size:11px;font-weight:900">${escapeHtml(story.category)}</span></td>
              <td align="right" style="color:${verified ? "#147a56" : "#9a6517"};font-size:11px;font-weight:800">${verified ? "● 교차 검증 완료" : "● 추가 보도 확인 중"}</td>
            </tr></table>
          </td></tr>
          <tr><td style="padding:8px 26px 0;color:#101722;font-size:25px;line-height:1.35;font-weight:900;letter-spacing:-1px">${String(index + 1).padStart(2, "0")}. ${escapeHtml(story.title)}</td></tr>
          <tr><td style="padding:18px 26px 0"><div style="border-top:4px solid #1558e9;padding-top:14px"><b style="color:#1558e9;font-size:12px">AI 3줄 요약</b><p style="margin:8px 0 0;color:#46505b;font-size:15px;line-height:1.75">${escapeHtml(story.summary)}</p></div></td></tr>
          <tr><td style="padding:18px 26px 0"><div style="border-radius:15px;background:#eef1f4;padding:16px 18px"><b style="color:#1558e9;font-size:12px">왜 중요한가</b><p style="margin:7px 0 0;color:#101722;font-size:14px;line-height:1.7">${escapeHtml(story.whyItMatters)}</p></div></td></tr>
          <tr><td style="padding:17px 26px 25px;color:#68707a;font-size:11px">출처 ${sources} · 최종 확인 ${escapeHtml(briefing.lastVerifiedAt)}</td></tr>
        </table>
      </td></tr>`;
  }).join("");

  return `<!doctype html>
  <html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body style="margin:0;background:#f4f1e8;font-family:Arial,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;color:#101722">
    <div style="display:none;max-height:0;overflow:hidden">어제의 소음을 걷어낸 ${briefing.stories.length}개 핵심 뉴스와 출처를 확인하세요.</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1e8"><tr><td align="center" style="padding:26px 10px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px">
        <tr><td style="padding:0 18px 12px;color:#68707a;font-size:10px;font-weight:800;letter-spacing:1px">AI-CURATED DAILY NEWS · ${escapeHtml(briefing.dateLabel)}</td></tr>
        <tr><td style="padding:0 18px 18px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:2px solid #101722;border-radius:26px;background:#101d32;box-shadow:7px 7px 0 #1558e9">
            <tr><td style="padding:34px 32px 12px"><span style="display:inline-block;border-radius:999px;background:#d8ff3e;color:#101722;padding:8px 12px;font-size:10px;font-weight:900;letter-spacing:1px">AI MORNING BRIEF</span></td></tr>
            <tr><td style="padding:4px 32px;color:#fff;font-size:34px;line-height:1.25;font-weight:900">뉴스를 찾지 않아도,<br><span style="color:#d8ff3e">요약 카드가 도착해요.</span></td></tr>
            <tr><td style="padding:18px 32px 12px;color:#c7cfda;font-size:14px;line-height:1.8">${escapeHtml(briefing.lead)}</td></tr>
            <tr><td style="padding:14px 32px 32px;color:#fff;font-size:12px"><b style="color:#d8ff3e">${briefing.stories.length}개 핵심 뉴스</b> · 교차 확인 ${briefing.verifiedCount}건 · 약 ${briefing.readMinutes}분</td></tr>
          </table>
        </td></tr>
        ${storyCards}
        <tr><td align="center" style="padding:22px 18px 8px"><a href="${escapeHtml(serviceUrl)}" style="display:inline-block;border:2px solid #101722;border-radius:13px;background:#d8ff3e;color:#101722;padding:14px 22px;text-decoration:none;font-size:13px;font-weight:900">웹 보관함에서 원문 확인</a></td></tr>
        <tr><td align="center" style="padding:16px 24px;color:#7b838c;font-size:10px;line-height:1.7">아침결은 공개 자료를 AI로 정리합니다.<br>중요한 판단 전에는 반드시 원문을 확인하세요.</td></tr>
      </table>
    </td></tr></table>
  </body></html>`;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character);
}

function toBase64(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

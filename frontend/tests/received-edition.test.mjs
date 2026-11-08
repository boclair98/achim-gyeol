import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import { renderPreviewEml, renderReceivedMail } from "../lib/newsletter/render-received-mail.mjs";
import { composeReceivedReading, relatedGlossaryTerm } from "../lib/received-reading.ts";

const origin = "https://morningnews.coders.kr";
const date = "2026-11-06";
const delivery = `${origin}/briefing/delivery/?date=${date}`;
const edition = count => ({
  briefingDate: date, dateLabel: "11월 6일 금요일",
  stories: Array.from({ length: count }, (_, i) => ({
    id: 200 + i, category: i === 27 ? "e스포츠" : "사회", title: `검증용으로 작성한 긴 기사 제목 ${i + 1}번 — 한국어 문장을 길게 써도 모든 링크가 남습니다.`,
  })),
});

const crossLinks = [
  { publisher: "출처 A", url: "https://a.example/news" },
  { publisher: "출처 B", url: "https://b.example/news" },
];
const startDate = "새 기준은 2027년 3월부터 적용된다.";
const primaryCaveat = "지역별 접수 일정은 아직 확인되지 않았다.";
const plainCaveat = "제공된 기사 설명만으로는 신청 서류를 확인할 수 없다.";
const sameAsHeadline = "서울시가 어린이 버스 지원 대상을 확대했다.";
const readingFixture = {
  title: "서울시 어린이 버스 지원 대상 확대",
  oneLineSummary: sameAsHeadline,
  summary: `${sameAsHeadline} ${startDate} 지역별 접수 창구는 지자체가 안내한다.`,
  plainExplanation: `지원 대상을 넓혀 이용할 수 있는 가족이 늘어난다. ${plainCaveat}`,
  backgroundContext: "기존에는 정해진 연령대에만 지원을 제공했다.",
  whyItMatters: "대상이 달라지면 기존에 이용하지 못하던 가족도 확인할 필요가 있다.",
  uncertainty: primaryCaveat,
  verificationStatus: "DEVELOPING",
  claims: [
    { statement: startDate, sources: crossLinks },
    { statement: "전국에 태풍 경보가 발령됐다.", sources: crossLinks },
  ],
};

test("mobile copy elevates a distinct, linked fact already in the article instead of the headline echo", () => {
  const reading = composeReceivedReading(readingFixture);
  assert.deepEqual(reading.keyPoints, [startDate]);
  assert.deepEqual(reading.cautions, [primaryCaveat, plainCaveat]);
  assert.deepEqual(reading.explanation, ["지원 대상을 넓혀 이용할 수 있는 가족이 늘어난다.", "지역별 접수 창구는 지자체가 안내한다."]);
  assert.ok(reading.background.length);
  assert.doesNotMatch(JSON.stringify(reading), /태풍|서울시가 어린이 버스 지원 대상을 확대했다/);
});

test("article notes keep negation, proposed dates and different numeric units or values", () => {
  const reading = composeReceivedReading({
    title: "지원금 5만 원 지급 확정",
    oneLineSummary: "지원금 5만 원 지급은 아직 확정되지 않았다.",
    summary: "지원금 7만 원 지급은 검토 중이다. 지원 대상은 1,000명이다. 안내 발송 건수는 1,000건이다.",
    whyItMatters: "",
  });
  assert.ok(reading.cautions.includes("지원금 5만 원 지급은 아직 확정되지 않았다."));
  const content = [...reading.keyPoints, ...reading.explanation, ...reading.rest].join(" ");
  assert.match(content, /7만 원 지급은 검토 중이다/);
  assert.match(content, /1,000명/);
  assert.match(content, /1,000건/);
});

test("a fact already in either headline clause is not treated as new information", () => {
  const secondClause = "지원 신청 기간이 연장됐다.";
  const newDetail = "온라인 접수 창구는 2027년에 연다.";
  const reading = composeReceivedReading({
    title: "대상 2만 가구로 확대…지원 신청 기간 연장",
    oneLineSummary: secondClause,
    summary: `${secondClause} ${newDetail}`,
    whyItMatters: "",
    claims: [{ statement: secondClause, sources: crossLinks }, { statement: newDetail, sources: crossLinks }],
  });
  assert.deepEqual(reading.keyPoints, [newDetail]);
  assert.ok(!reading.explanation.includes(secondClause));
});

test("unrelated or same-outlet claims do not get promoted ahead of existing simple copy", () => {
  const lead = "서울시가 신청 절차를 지역별로 안내한다.";
  const reading = composeReceivedReading({
    ...readingFixture,
    oneLineSummary: lead,
    claims: [{
      statement: startDate,
      sources: [{ url: "https://a.example/news/1" }, { url: "https://m.a.example/news/2" }],
    }],
  });
  assert.deepEqual(reading.keyPoints, [lead]);
  assert.match([...reading.explanation, ...reading.rest].join(" "), /2027년 3월부터 적용된다/);
});

test("a long, complete sentence is readable in the expanded body rather than cut off", () => {
  const long = "내용을 덜어내지 않는지 확인하는 검증 문장".repeat(12) + "입니다.";
  const reading = composeReceivedReading({ title: "검증 기사", oneLineSummary: "", summary: long, whyItMatters: "" });
  assert.deepEqual(reading.keyPoints, []);
  assert.deepEqual(reading.explanation, []);
  assert.deepEqual(reading.rest, [long]);
});

test("glossary terms have a primary source and ambiguous abbreviations alone do not match", () => {
  const term = relatedGlossaryTerm({ title: "증시 급락에 매도 사이드카 발동", category: "금융" });
  assert.equal(term.name, "사이드카");
  assert.equal(new URL(term.url).hostname, "global.krx.co.kr");
  assert.match(term.explanation, /모든 주식 거래가 멈추는 건 아니에요/);
  assert.equal(relatedGlossaryTerm({ title: "고병원성 AI 확인", category: "사회" }).publisher, "질병관리청");
  assert.equal(relatedGlossaryTerm({ title: "AI 수사 도구 논의", category: "사회" }), null);
  assert.equal(relatedGlossaryTerm({ title: "오토바이 사이드카 경주", category: "스포츠" }), null);
});

test("email links to every headline including articles beyond 15 with the edition date pinned", () => {
  const mail = renderReceivedMail(edition(120), origin);
  assert.equal(mail.storyCount, 120);
  assert.equal(mail.compact, false);
  assert.equal([...mail.html.matchAll(/href="[^"]+#news-\d+"/g)].length, 120);
  assert.ok(mail.html.includes(`href="${delivery}#news-319"`));
  assert.ok(mail.text.includes(`${delivery}#news-319`));
  assert.doesNotMatch(mail.html, /<script|<img|<iframe|@font-face/i);
});

test("mail content and links are escaped, validated and usable under a base path", () => {
  const sample = edition(1);
  sample.stories[0].title = '<script>alert("x")</script>';
  sample.dateLabel += "\r\nBcc: example";
  const mail = renderReceivedMail(sample, origin + "/subdir");
  assert.ok(mail.html.includes("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;"));
  assert.ok(mail.html.includes(`href="${origin}/subdir/briefing/delivery/?date=${date}#news-200"`));
  assert.doesNotMatch(mail.subject, /[\r\n]/);
  assert.throws(() => renderReceivedMail(sample, "javascript:alert(1)"), /Invalid mail link base/);
  assert.throws(() => renderReceivedMail({ ...sample, briefingDate: "2026-02-30" }, origin), /valid edition date/);
});

test("a message that would be clipped retains the complete web edition without a false count", () => {
  const sample = edition(29);
  sample.stories[0].title = "아".repeat(32_000);
  const mail = renderReceivedMail(sample, origin);
  assert.equal(mail.storyCount, 29);
  assert.equal(mail.compact, true);
  assert.ok(Buffer.byteLength(mail.html) < 88 * 1024);
  assert.ok(mail.html.includes(`href="${delivery}"`));
  assert.match(mail.html, /뉴스 29건/);
  assert.match(mail.text, /전체 제목과 요약/);
});

test("downloadable mail preview has both matching MIME bodies and no recipient", () => {
  const mail = renderReceivedMail(edition(2), origin);
  const eml = renderPreviewEml(mail);
  assert.match(eml, /multipart\/alternative/);
  assert.doesNotMatch(eml, /^To:|^Bcc:/m);
  for (const [format, expected] of [["plain", mail.text], ["html", mail.html]]) {
    const encoded = eml.split(`Content-Type: text/${format}; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n`)[1].split("\r\n\r\n")[0];
    assert.ok(encoded.split("\r\n").every(line => line.length <= 76));
    assert.equal(Buffer.from(encoded, "base64").toString("utf8"), expected);
  }
});

const workerSource = await readFile(new URL("../public/sw.js", import.meta.url), "utf8");

function worker() {
  const handlers = new Map();
  const seen = { opened: [], notified: [] };
  const clients = {
    matchAll: async () => [],
    openWindow: async url => { seen.opened.push(url); },
  };
  const context = {
    URL, Response, clients,
    fetch: async () => { throw new Error("Offline fixture"); },
    caches: { match: async key => ({ "./briefing/": "public shell", "./briefing/delivery/": "received shell" })[key] },
    self: {
      location: { origin },
      registration: {
        scope: origin + "/",
        showNotification: async (title, options) => { seen.notified.push({ title, options }); },
      },
      addEventListener: (name, callback) => handlers.set(name, callback),
    },
  };
  vm.runInNewContext(workerSource, context);
  return { handlers, seen, clients };
}

test("push keeps the supplied dated link and the fallback also opens the received edition", async () => {
  const { handlers, seen } = worker();
  for (const data of [{ title: "테스트", body: "검증", url: delivery }, { title: "테스트", body: "검증" }]) {
    let completion;
    handlers.get("push")({ data: { json: () => data }, waitUntil: task => { completion = task; } });
    await completion;
  }
  assert.equal(seen.notified[0].options.data.url, delivery);
  assert.equal(seen.notified[1].options.data.url, origin + "/briefing/delivery/");
});

test("notification click routes new and already received links without changing either date", async () => {
  const { handlers, seen, clients } = worker();
  const previous = `${origin}/briefing/?date=2026-11-05`;
  async function click(url) {
    let completion;
    handlers.get("notificationclick")({
      notification: { close() {}, data: { url } },
      waitUntil: task => { completion = task; },
    });
    await completion;
  }
  await click(previous);
  assert.deepEqual(seen.opened, [previous]);
  const actions = [];
  clients.matchAll = async () => [{
    url: origin, navigate: async url => { actions.push(url); }, focus: async () => { actions.push("focused"); },
  }];
  await click(delivery);
  assert.deepEqual(actions, [delivery, "focused"]);
});

test("offline navigation chooses the same surface for dated recipient and public links", async () => {
  const { handlers } = worker();
  async function navigate(url) {
    let response;
    handlers.get("fetch")({
      request: { method: "GET", mode: "navigate", url },
      respondWith: task => { response = task; },
    });
    return await response;
  }
  assert.equal(await navigate(delivery), "received shell");
  assert.equal(await navigate(`${origin}/briefing/?date=${date}`), "public shell");
});

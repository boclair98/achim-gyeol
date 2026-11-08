import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import { renderPreviewEml, renderReceivedMail } from "../lib/newsletter/render-received-mail.mjs";

const origin = "https://morningnews.coders.kr";
const date = "2026-11-06";
const delivery = `${origin}/briefing/delivery/?date=${date}`;
const edition = count => ({
  briefingDate: date, dateLabel: "11월 6일 금요일",
  stories: Array.from({ length: count }, (_, i) => ({
    id: 200 + i, category: i === 27 ? "e스포츠" : "사회", title: `검증용으로 작성한 긴 기사 제목 ${i + 1}번 — 한국어 문장을 길게 써도 모든 링크가 남습니다.`,
  })),
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

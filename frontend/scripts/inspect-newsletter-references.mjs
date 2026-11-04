// Public reference observation only. Does not copy service code or font assets.
import { chromium, devices } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const folder = "test-results/newsletter-user-research";
const targets = [
  ["naver-news", "https://news.naver.com/section/100"],
  ["newneek", "https://newneek.co/"],
  ["uppity", "https://uppity.co.kr/"],
  ["tossfeed", "https://toss.im/tossfeed"],
];

async function observe(page) {
  return page.evaluate(() => {
    const visible = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 120 && r.height > 10 && s.display !== "none" && s.visibility !== "hidden"; };
    const text = (el) => el.textContent.trim().replace(/\s+/g, " ").slice(0, 90);
    const elements = [...document.querySelectorAll("h1,h2,h3,p,#dic_area,[class*=article-content],[class*=title],[class*=summary]")].filter(el => visible(el) && text(el).length > 12).slice(0, 28);
    const samples = elements.map(el => { const s = getComputedStyle(el); const r = el.getBoundingClientRect(); return { tag: el.tagName, className: String(el.className).slice(0, 100), text: text(el), fontFamily: s.fontFamily, fontSize: s.fontSize, fontWeight: s.fontWeight, lineHeight: s.lineHeight, letterSpacing: s.letterSpacing, width: Math.round(r.width), marginBottom: s.marginBottom, color: s.color }; });
    const links = [...document.querySelectorAll("a[href]")].filter(el => visible(el) && text(el).length > 15 && text(el).length < 85).slice(0, 10).map(el => ({ text: text(el), url: el.href }));
    return { pageTitle: document.title, url: location.href, bodyFont: getComputedStyle(document.body).fontFamily, viewport: { width: innerWidth, height: innerHeight }, horizontalOverflow: document.documentElement.scrollWidth > innerWidth, samples, links };
  });
}

(async () => {
  await mkdir(folder, { recursive: true });
  const browser = await chromium.launch();
  const reports = [];
  const details = process.argv.includes("--details");
  const observed = details ? JSON.parse(await readFile(`${folder}/references.json`, "utf8")) : null;
  const pages = details ? observed.reports.filter(r => r.desktop?.links?.[0]).map(r => [`${r.id}-article`, r.desktop.links[0].url]) : targets;
  for (const [id, url] of pages) {
    const page = await browser.newPage({ ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1000 } });
    try {
      const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForTimeout(1500);
      await Promise.race([page.evaluate(() => document.fonts.ready), page.waitForTimeout(8000)]);
      const desktop = await observe(page);
      await page.screenshot({ path: `${folder}/${id}-desktop.png` });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(300);
      const mobile = await observe(page);
      await page.screenshot({ path: `${folder}/${id}-mobile.png` });
      reports.push({ id, status: response?.status(), desktop, mobile });
      console.log(JSON.stringify({ id, status: response?.status(), fonts: [...new Set(desktop.samples.map(s => s.fontFamily))], samples: desktop.samples.filter(s => ["H1", "H2", "H3", "P"].includes(s.tag) || s.className.includes("article")).slice(0, 7), links: details ? [] : desktop.links.slice(0, 5) }));
    } catch (error) {
      reports.push({ id, url, error: error.message });
      console.log(JSON.stringify({ id, error: error.message }));
    } finally { await page.close(); }
  }
  await writeFile(`${folder}/${details ? "article-references" : "references"}.json`, JSON.stringify({ observedAt: new Date().toISOString(), method: "Public pages; computed CSS and viewport screenshots, not user testing or traffic ranking", reports }, null, 2));
  await browser.close();
})();

import { test, expect, type Page } from "@playwright/test";
import stories from "../../components/prototype/archive-fixture.json";

const base = `${process.env.NEWSLETTER_PREVIEW_BASE_URL ?? "http://127.0.0.1:4173"}/newsletter-prototypes/`;
const folder = "test-results/newsletter-notification-flow";
const viewports = [{ name: "small-mobile", width: 360, height: 800 }, { name: "mobile", width: 390, height: 844 }, { name: "tablet", width: 768, height: 1024 }, { name: "desktop", width: 1440, height: 900 }];

async function articleIsComplete(page: Page, index: number) {
  const article = page.frameLocator("#article-frame");
  const story = stories[index];
  await expect(page.locator("#article-frame")).toHaveAttribute("data-story-file", `story-${story.id}.html`);
  await expect(article.getByRole("heading", { level: 1 })).toHaveText(story.title);
  await expect(article.locator("[data-story-id]")).toHaveCount(1);
  await expect(article.getByText(story.plainExplanation, { exact: true })).toBeVisible();
  await expect(article.getByText(story.backgroundContext, { exact: true })).toBeVisible();
  await expect(article.locator("[data-article-end]")).toBeVisible();
  expect(await article.locator("h1 .number-unit").evaluateAll(elements => elements.every(element => element.getClientRects().length === 1))).toBe(true);
  await expect.poll(() => page.locator("#article-frame").evaluate(element => {
    const frame = element as HTMLIFrameElement;
    const doc = frame.contentDocument!;
    return frame.clientHeight >= Math.ceil(doc.body.getBoundingClientRect().height) && doc.documentElement.scrollHeight <= frame.clientHeight + 2 && doc.documentElement.scrollWidth <= frame.clientWidth;
  })).toBe(true);
}

test("one-by-one: six complete articles, readable viewport, controls and browser history", async ({ page }) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  const writes: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("request", request => { if (!["GET", "HEAD"].includes(request.method()) || request.url().includes("/api/") || request.url().includes("sw.js")) writes.push(request.method() + " " + request.url()); });
  await page.goto(`${base}read.html`, { waitUntil: "networkidle" });
  await articleIsComplete(page, 0);
  await expect(page.locator("iframe")).toHaveCount(1);
  for (const button of await page.getByRole("button", { name: "이전 기사", exact: true }).all()) await expect(button).toBeDisabled();
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await articleIsComplete(page, 0);
    await page.frameLocator("#article-frame").locator("img").evaluateAll(async images => { await Promise.all(images.map(image => (image as HTMLImageElement).decode())); });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `${folder}/reader-${viewport.name}.png`, fullPage: true, scale: "css" });
    await page.screenshot({ path: `${folder}/reader-${viewport.name}-top.png`, scale: "css" });
  }
  await page.getByRole("button", { name: "다음 기사", exact: true }).first().click();
  await articleIsComplete(page, 1);
  await expect(page.frameLocator("#article-frame").getByRole("heading", { level: 1 })).toBeFocused();
  await expect(page).toHaveURL(new RegExp(`story=${stories[1].id}`));
  await page.goBack();
  await articleIsComplete(page, 0);
  await page.goForward();
  await articleIsComplete(page, 1);
  for (let index = 2; index < stories.length; index++) {
    await page.getByRole("button", { name: "다음 기사", exact: true }).last().click();
    await articleIsComplete(page, index);
  }
  for (const button of await page.getByRole("button", { name: "다음 기사", exact: true }).all()) await expect(button).toBeDisabled();
  await expect(page.locator("#standalone")).toHaveAttribute("href", `story-${stories.at(-1)!.id}.html`);
  await page.getByRole("button", { name: "이전 기사", exact: true }).first().click();
  await articleIsComplete(page, stories.length - 2);
  expect(errors).toEqual([]);
  expect(writes).toEqual([]);
});

test("one-by-one: unknown article is identified honestly and does not invent content", async ({ page }) => {
  await page.goto(`${base}read.html?story=not-found`, { waitUntil: "networkidle" });
  await expect(page.locator("#article-notice")).toBeVisible();
  await articleIsComplete(page, 0);
  await expect(page).toHaveURL(new RegExp(`story=${stories[0].id}`));
});

test("one-by-one: static data and article failures offer a working retry", async ({ page }) => {
  let unavailable = true;
  await page.route("**/reader-manifest.json", route => unavailable ? route.fulfill({ status: 503, body: "unavailable" }) : route.continue());
  await page.goto(`${base}read.html`, { waitUntil: "networkidle" });
  await expect(page.locator("#reader-error")).toBeVisible();
  await expect(page.locator("#article-frame")).toBeHidden();
  unavailable = false;
  await page.getByRole("button", { name: "다시 불러오기", exact: true }).click();
  await articleIsComplete(page, 0);
  await expect(page.locator("#reader-error")).toBeHidden();
  await page.route(`**/story-${stories[0].id}.html`, route => route.fulfill({ status: 404, contentType: "text/plain", body: "Not found" }));
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("#reader-error-text")).toContainText("기사 화면");
  await page.unroute(`**/story-${stories[0].id}.html`);
  await page.getByRole("button", { name: "다시 불러오기", exact: true }).click();
  await articleIsComplete(page, 0);
});

test("one-by-one: blocked photo and font still leave the complete article", async ({ page }) => {
  await page.route(/\.(jpg|jpeg|png)(\?|$)/, route => route.abort());
  await page.route("**/*.woff2", route => route.abort());
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto(`${base}read.html`, { waitUntil: "networkidle" });
  await articleIsComplete(page, 0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `${folder}/reader-images-font-off.png`, fullPage: true, scale: "css" });
});

test("one-by-one: enlarged article text and long title are not clipped", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto(`${base}read.html`, { waitUntil: "networkidle" });
  await articleIsComplete(page, 0);
  await page.frameLocator("#article-frame").locator("body").evaluate(body => {
    for (const element of body.querySelectorAll<HTMLElement>("h1,h2,h3,p,a")) element.style.fontSize = `${parseFloat(getComputedStyle(element).fontSize) * 2}px`;
    const heading = body.querySelector("h1");
    if (heading) heading.textContent = "한 편의 뉴스 제목이 길어지더라도 충분한 폭에서 자연스럽게 읽을 수 있어야 해요";
  });
  await expect.poll(() => page.locator("#article-frame").evaluate(element => {
    const frame = element as HTMLIFrameElement;
    const doc = frame.contentDocument!;
    return frame.clientHeight >= Math.ceil(doc.body.getBoundingClientRect().height) && doc.documentElement.scrollWidth <= frame.clientWidth;
  })).toBe(true);
  await page.screenshot({ path: `${folder}/reader-large-text.png`, fullPage: true, scale: "css" });
});

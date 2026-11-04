import { test, expect, type Page } from "@playwright/test";
import stories from "../../components/prototype/archive-fixture.json";

const base = `${process.env.NEWSLETTER_PREVIEW_BASE_URL ?? "http://127.0.0.1:4173"}/newsletter-prototypes/`;
const folder = "test-results/newsletter-editorial-polish";
const viewports = [{ width: 360, height: 800 }, { width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1440, height: 900 }];

async function completeMail(page: Page) {
  const mail = page.frameLocator("#mail-body");
  await expect(page.locator("#mail-body-error")).toBeHidden();
  await expect(mail.locator("[data-story-id]")).toHaveCount(stories.length);
  await expect(mail.locator("[data-mail-contents]")).toHaveCount(stories.length);
  for (const story of stories) {
    const block = mail.locator(`[data-story-id="${story.id}"]`);
    await expect(block.getByRole("heading", { name: story.title, exact: true })).toBeVisible();
    await expect(block.getByText(story.plainExplanation, { exact: true })).toBeVisible();
    await expect(block.getByText(story.backgroundContext, { exact: true })).toBeVisible();
  }
  await expect(mail.getByText("당신의 아침에, 필요한 이야기만.", { exact: true })).toBeVisible();
  await expect.poll(() => page.locator("#mail-body").evaluate(element => {
    const frame = element as HTMLIFrameElement;
    const doc = frame.contentDocument!;
    return frame.clientHeight >= Math.ceil(doc.body.getBoundingClientRect().height) && doc.documentElement.scrollHeight <= frame.clientHeight + 2 && doc.documentElement.scrollWidth <= frame.clientWidth;
  })).toBe(true);
}

test("bundled mail: exactly one notification opens one complete mail on mobile and PC", async ({ page, isMobile }) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  const writes: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("request", request => { if (!["GET", "HEAD"].includes(request.method()) || request.url().includes("/api/") || request.url().includes("sw.js")) writes.push(request.url()); });
  await page.goto(`${base}notifications.html`, { waitUntil: "networkidle" });
  await expect(page.locator(".notification-card")).toHaveCount(1);
  await expect(page.locator(".notification-card")).toHaveAttribute("href", "mail.html?date=2026-09-16");
  await expect(page.locator(".notification-description")).toContainText("뉴스 6개");
  await expect(page.locator('a[href*="read.html"],a[href*="story="]')).toHaveCount(0);
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `${folder}/one-notification-${viewport.width}.png`, fullPage: true, scale: "css" });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  const notification = page.locator(".notification-card");
  if (isMobile) await notification.tap();
  else {
    await notification.focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    await expect(notification).toBeFocused();
    await page.keyboard.press("Enter");
  }
  await expect(page).toHaveURL(`${base}mail.html?date=2026-09-16`);
  await expect(page.locator("iframe")).toHaveCount(1);
  await expect(page.locator("[data-step]")).toHaveCount(0);
  await completeMail(page);
  const skip = page.locator(".skip");
  await skip.focus();
  await expect(skip).toBeFocused();
  expect(await skip.evaluate(element => getComputedStyle(element).clipPath)).toBe("none");
  expect(await skip.evaluate(element => element.getBoundingClientRect().top)).toBeGreaterThanOrEqual(0);
  await skip.evaluate(element => (element as HTMLElement).blur());
  expect(await skip.evaluate(element => getComputedStyle(element).clipPath)).toBe("inset(50%)");
  const mail = page.frameLocator("#mail-body");
  await expect(mail.locator("[data-reading-position]")).toHaveCount(stories.length);
  await expect(mail.locator("[data-reading-position]").first()).toHaveText("01 / 06");
  await expect(mail.getByText("먼저, 핵심 세 가지", { exact: true })).toHaveCount(0);
  const firstStory = mail.locator("#news-1");
  const leadTop = await firstStory.locator("[data-key-summary]").evaluate(element => element.getBoundingClientRect().top);
  const photoTop = await firstStory.locator("img").evaluate(element => element.getBoundingClientRect().top);
  expect(leadTop).toBeLessThan(photoTop);
  expect(await firstStory.locator("[data-editorial-explanation] p").evaluate(element => getComputedStyle(element).fontSize)).toBe("18px");
  await page.frameLocator("#mail-body").locator("img").evaluateAll(async images => { await Promise.all(images.map(image => (image as HTMLImageElement).decode())); });
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await completeMail(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const ratios = await page.frameLocator("#mail-body").locator("img").evaluateAll(images => images.map(image => {
      const img = image as HTMLImageElement;
      return Math.abs(img.clientWidth / img.clientHeight - img.naturalWidth / img.naturalHeight);
    }));
    expect(ratios.every(ratio => ratio < .03)).toBe(true);
    await page.screenshot({ path: `${folder}/whole-mail-${viewport.width}.png`, fullPage: true, scale: "css" });
    await page.screenshot({ path: `${folder}/whole-mail-${viewport.width}-top.png`, scale: "css" });
    if (viewport.width === 390 || viewport.width === 1440) {
      await firstStory.screenshot({ path: `${folder}/first-story-${viewport.width}.png`, scale: "css" });
      await page.evaluate(() => window.scrollTo(0, 0));
    }
  }
  await page.reload({ waitUntil: "networkidle" });
  await completeMail(page);
  await page.goBack();
  await expect(page.locator(".notification-card")).toHaveCount(1);
  await page.goForward();
  await completeMail(page);
  await page.getByRole("link", { name: "알림으로", exact: true }).click();
  await expect(page.locator(".notification-card")).toHaveCount(1);
  expect(errors).toEqual([]);
  expect(writes).toEqual([]);
});

test("bundled mail: contents jumps inside the same complete email, without a separate article", async ({ page, isMobile }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}mail.html?date=2026-09-16`, { waitUntil: "networkidle" });
  await completeMail(page);
  const mail = page.frameLocator("#mail-body");
  const contents = mail.locator("[data-mail-contents]");
  for (let index = 0; index < stories.length; index++) await expect(contents.nth(index)).toHaveAttribute("href", `#news-${index + 1}`);
  if (isMobile) await contents.last().tap();
  else { await contents.last().focus(); await page.keyboard.press("Enter"); }
  await expect(mail.locator("#news-6")).toBeInViewport();
  await expect(page).toHaveURL(`${base}mail.html?date=2026-09-16`);
  await expect(mail.locator("[data-story-id]")).toHaveCount(stories.length);
  await expect(page.locator("iframe")).toHaveCount(1);
  await mail.getByRole("link", { name: "메일 처음으로 돌아가기" }).click();
  await expect(mail.getByRole("heading", { name: "좋은 아침이에요." })).toBeInViewport();
});

test("bundled mail: metadata errors and wrong dates do not hide or misdate readable news", async ({ page }) => {
  let broken = true;
  await page.route("**/reader-manifest.json", route => broken ? route.fulfill({ status: 503, body: "unavailable" }) : route.continue());
  await page.goto(`${base}notifications.html`, { waitUntil: "networkidle" });
  await expect(page.locator("#notification-error")).toBeVisible();
  await expect(page.locator("#notification-loading")).toBeHidden();
  await expect(page.locator(".notification-card")).toHaveCount(0);
  broken = false;
  await page.getByRole("button", { name: "다시 불러오기", exact: true }).click();
  await expect(page.locator(".notification-card")).toHaveCount(1);
  broken = true;
  await page.goto(`${base}mail.html`, { waitUntil: "networkidle" });
  await expect(page.locator("#mail-metadata-error")).toBeVisible();
  await completeMail(page);
  broken = false;
  await page.getByRole("button", { name: "메일 정보 다시 불러오기" }).click();
  await expect(page.locator("#mail-metadata-error")).toBeHidden();
  await expect(page.locator("#mail-date")).toContainText("뉴스 6개");
  await page.goto(`${base}mail.html?date=2099-01-01`, { waitUntil: "networkidle" });
  await expect(page.locator("#mail-date-notice")).toContainText("2026년 9월 16일 보관판");
  await expect(page).toHaveURL(`${base}mail.html?date=2026-09-16`);
  await completeMail(page);
});

test("bundled mail: failed mail body has a real recovery", async ({ page }) => {
  let broken = true;
  await page.route("**/letter.html", route => broken ? route.fulfill({ status: 404, contentType: "text/plain", body: "Not found" }) : route.continue());
  await page.goto(`${base}mail.html`, { waitUntil: "networkidle" });
  await expect(page.locator("#mail-body-error")).toBeVisible();
  await expect(page.getByRole("link", { name: "메일 본문 직접 열기" })).toHaveAttribute("href", "letter.html");
  broken = false;
  await page.getByRole("button", { name: "본문 다시 불러오기" }).click();
  await expect(page.locator("#mail-body-error")).toBeHidden();
  await completeMail(page);
});

test("bundled mail: missing fonts/photos and large text still keep every article", async ({ page }) => {
  await page.route(/\.(jpg|jpeg|png)(\?|$)/, route => route.abort());
  await page.route("**/*.woff2", route => route.abort());
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto(`${base}mail.html`, { waitUntil: "networkidle" });
  await completeMail(page);
  await page.screenshot({ path: `${folder}/whole-mail-images-font-off.png`, fullPage: true, scale: "css" });
  await page.frameLocator("#mail-body").locator("body").evaluate(body => {
    for (const element of body.querySelectorAll<HTMLElement>("h1,h2,h3,p,a")) element.style.fontSize = `${parseFloat(getComputedStyle(element).fontSize) * 2}px`;
  });
  await page.locator(".mail-envelope").evaluate(envelope => {
    for (const element of envelope.querySelectorAll<HTMLElement>("h1,p")) element.style.fontSize = `${parseFloat(getComputedStyle(element).fontSize) * 2}px`;
  });
  await completeMail(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

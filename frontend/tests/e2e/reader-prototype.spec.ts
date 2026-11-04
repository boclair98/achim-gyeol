import { expect, test } from "@playwright/test";

const url = `${process.env.PROTOTYPE_BASE_URL ?? "http://127.0.0.1:4173"}/prototype/`;
const artifactFolder = "test-results/reader-prototype";

for (const [name, width, height] of [["small-mobile", 360, 800], ["mobile", 390, 844], ["tablet", 768, 1024], ["desktop", 1440, 900]] as const) {
  test(`prototype ${name}: readable with intact images and no outbound writes`, async ({ page }) => {
    test.setTimeout(90000);
    await page.setViewportSize({ width, height });
    const errors: string[] = [];
    const forbidden: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("request", (request) => {
      if (request.url().includes("/api/") || !["GET", "HEAD"].includes(request.method()) || request.url().includes("/sw.js")) forbidden.push(`${request.method()} ${request.url()}`);
    });
    await page.goto(url, { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: /세상을 읽는/ })).toBeVisible();
    await expect(page.locator("article[data-story-id]")).toHaveCount(6);
    // Visit each image to trigger lazy loading before full-page capture.
    for (const article of await page.locator("article[data-story-id]").all()) await article.scrollIntoViewIfNeeded();
    await page.locator("article img").evaluateAll(async (images) => {
      await Promise.all(images.map((image) => (image as HTMLImageElement).decode().catch(() => undefined)));
    });
    const imageChecks = await page.locator("article img").evaluateAll((images) => images.map((image) => ({ loaded: (image as HTMLImageElement).naturalWidth > 0, fit: getComputedStyle(image).objectFit })));
    expect(imageChecks.length).toBeGreaterThanOrEqual(3);
    expect(imageChecks.every((image) => image.loaded && image.fit === "contain")).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.screenshot({ path: `${artifactFolder}/${name}.png`, fullPage: true });
    await page.screenshot({ path: `${artifactFolder}/${name}-viewport.png` });
    await page.locator("article").first().scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${artifactFolder}/${name}-card.png` });
    expect(errors).toEqual([]);
    expect(forbidden).toEqual([]);
  });
}

test("prototype reader: filter, save, detail, focus and local settings", async ({ page }) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(url, { waitUntil: "networkidle" });
  const category = page.getByRole("navigation", { name: "기사 분야" });
  await category.getByRole("button", { name: "스포츠", exact: true }).click();
  await expect(page.locator("article")).toHaveCount(1);
  await expect(page.locator("article h3")).toContainText("카타르 4-1");
  await category.getByRole("button", { name: "전체" }).click();
  await page.getByRole("button", { name: "배경까지", exact: true }).click();
  await expect(page.getByRole("heading", { name: "알고 읽으면 쉬워요" })).toHaveCount(6);
  await page.getByRole("button", { name: "핵심만", exact: true }).click();
  const first = page.locator("article").first();
  const save = first.getByRole("button", { name: / 저장$/ });
  await save.click();
  await expect(first.getByRole("button", { name: /저장 취소$/ })).toHaveAttribute("aria-pressed", "true");
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("article").first().getByRole("button", { name: /저장 취소$/ })).toHaveAttribute("aria-pressed", "true");
  await page.locator("header").getByRole("button", { name: /저장한 기사/ }).click();
  await expect(page.locator("article")).toHaveCount(1);
  await page.locator("article").getByRole("button", { name: /저장 취소$/ }).click();
  await expect(page.getByRole("heading", { name: "마음에 남는 기사를 담아두세요" })).toBeVisible();
  await page.getByRole("button", { name: /전체 기사 둘러보기/ }).click();
  const trigger = page.locator("article").first().getByRole("button", { name: /기사 읽기$/ });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "원·달러 환율 12.1원 올라 1,359.4원" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("heading", { name: "알고 읽으면 쉬워요" })).toBeVisible();
  expect(await dialog.getByRole("link").count()).toBeGreaterThan(1);
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => Boolean(document.activeElement?.closest("dialog")))).toBe(true);
  await page.keyboard.press("Shift+Tab");
  expect(await page.evaluate(() => Boolean(document.activeElement?.closest("dialog")))).toBe(true);
  await page.screenshot({ path: `${artifactFolder}/desktop-detail.png` });
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await expect(page.locator("article").first()).toContainText("읽음");
  await page.getByRole("button", { name: "읽기 설정", exact: true }).click();
  await page.getByRole("button", { name: /더 크게/ }).click();
  await page.getByRole("button", { name: /이렇게 읽을게요/ }).click();
  await expect(page.locator("article").first().locator("p").last()).toHaveCSS("font-size", "19px");
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("article").first().locator("p").last()).toHaveCSS("font-size", "19px");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("article").first().getByRole("button", { name: /기사 읽기$/ }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.screenshot({ path: `${artifactFolder}/mobile-detail.png` });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("prototype remains readable when photos or browser storage fail", async ({ page }) => {
  await page.route(/\.(jpg|jpeg|png)(\?|$)/, (route) => route.abort());
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", { get() { throw new Error("Storage unavailable"); } });
  });
  await page.goto(url);
  await expect(page.locator("article")).toHaveCount(6);
  await expect(page.locator("article").first()).toContainText("원문 이미지 연결 불가");
  await page.locator("article").first().getByRole("button", { name: / 저장$/ }).click();
  await expect(page.locator("article").first().getByRole("button", { name: /저장 취소$/ })).toHaveAttribute("aria-pressed", "true");
  await page.locator("article").first().getByRole("button", { name: /기사 읽기$/ }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
});

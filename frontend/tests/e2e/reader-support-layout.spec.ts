import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/**", route => {
    if (new URL(route.request().url()).pathname === "/api/reader/preferences") return route.fulfill({ json: { categories: "사회,테크", digestSize: "standard", consent: true } });
    return route.fulfill({ json: [] });
  });
});

test("reader support routes fit product widths and leave the home font unchanged", async ({ page }) => {
  await page.goto("/");
  const originalFont = await page.locator("body").evaluate(el => getComputedStyle(el).fontFamily);
  for (const [width, height] of [[360, 800], [390, 844], [768, 1024], [1440, 900]]) {
    await page.setViewportSize({ width, height });
    for (const route of ["/archive/", "/preferences/", "/trust/", "/privacy/", "/terms/"]) {
      await page.goto(route);
      await expect(page.locator(".reader-system h1")).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    }
  }
  await page.locator(".site-brand").click();
  await expect(page.locator(".reader-system")).toHaveCount(0);
  expect(await page.locator("body").evaluate(el => getComputedStyle(el).fontFamily)).toBe(originalFont);
});

test("settings prioritize save before feature voting and keep 2x text readable", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/preferences/");
  await expect(page.locator(".preference-status")).toHaveCount(0);
  const order = await page.evaluate(() => ({ save: document.querySelector(".preference-summary")!.getBoundingClientRect().top, vote: document.querySelector(".preference-discovery")!.getBoundingClientRect().top }));
  expect(order.save).toBeLessThan(order.vote);
  await page.evaluate(() => {
    const sizes = Array.from(document.querySelectorAll<HTMLElement>(".reader-system *")).filter(el => el instanceof HTMLElement).map(el => ({ el, size: parseFloat(getComputedStyle(el).fontSize) }));
    sizes.forEach(({ el, size }) => { el.style.fontSize = `${size * 2}px`; });
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  const label = page.locator(".digest-options button strong").first();
  await expect(label).toHaveText("빠르게");
  const lineCount = await label.evaluate(el => {
    const range = document.createRange(); range.selectNodeContents(el);
    return new Set(Array.from(range.getClientRects(), rect => Math.round(rect.top))).size;
  });
  expect(lineCount).toBe(1);
  await page.locator(".choice-grid button").first().focus();
  await page.keyboard.press("Space");
  await expect(page.locator(".choice-grid button").first()).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.locator(".choice-grid button").nth(1)).toBeFocused();
});

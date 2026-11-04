import { test, expect } from "@playwright/test";

const base = `${process.env.NEWSLETTER_PREVIEW_BASE_URL ?? "http://127.0.0.1:4173"}/newsletter-prototypes/`;
const folder = "test-results/newsletter-editorial-polish";
const viewports = [{ name: "small-mobile", width: 360, height: 800 }, { name: "mobile", width: 390, height: 844 }, { name: "tablet", width: 768, height: 1024 }, { name: "desktop", width: 1440, height: 900 }];

for (const variant of ["letter", "brief", "magazine"]) {
  test(`${variant}: mobile/PC email layout, source photos and no writes`, async ({ page, browserName }) => {
    test.setTimeout(90000);
    const errors: string[] = [];
    const writes: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("request", (request) => { if (!["GET", "HEAD"].includes(request.method()) || request.url().includes("/api/") || request.url().includes("sw.js")) writes.push(request.method() + " " + request.url()); });
    await page.goto(`${base}${variant}.html`, { waitUntil: "networkidle" });
    expect(await page.evaluate(async () => {
      await Promise.all([400, 600, 700].map(weight => document.fonts.load(`${weight} 17px "SUIT"`, "아침결 뉴스 이해하기")));
      return [400, 600, 700].every(weight => [...document.fonts].some(face => face.family.replace(/["']/g, "") === "SUIT" && face.weight === String(weight) && face.status === "loaded"));
    })).toBe(true);
    // A variable face previously reported loaded in WebKit yet all text looked
    // too thin. Check visible stroke coverage, not only computed font-weight.
    expect(await page.evaluate(() => {
      const canvas = document.createElement("canvas");
      canvas.width = 240;
      canvas.height = 60;
      const ctx = canvas.getContext("2d")!;
      const ink = (weight: number) => {
        ctx.clearRect(0, 0, 240, 60);
        ctx.font = `${weight} 28px "SUIT"`;
        ctx.fillText("아침결 뉴스", 4, 42);
        const data = ctx.getImageData(0, 0, 240, 60).data;
        let alpha = 0;
        for (let i = 3; i < data.length; i += 4) alpha += data[i];
        return alpha;
      };
      return ink(700) / ink(400);
    })).toBeGreaterThan(1.15);
    await expect(page.locator("h1")).toHaveCount(1);
    if (browserName === "chromium") {
      const client = await page.context().newCDPSession(page);
      await client.send("DOM.enable");
      await client.send("CSS.enable");
      const { root } = await client.send("DOM.getDocument");
      const { nodeId } = await client.send("DOM.querySelector", { nodeId: root.nodeId, selector: "h1" });
      const { fonts } = await client.send("CSS.getPlatformFontsForNode", { nodeId });
      expect(fonts.some(font => font.isCustomFont && font.familyName.includes("SUIT") && font.glyphCount > 0)).toBe(true);
      await client.detach();
    }
    await expect(page.getByText("원·달러 환율 12.1원 올라 1,359.4원", { exact: true })).toBeVisible();
    await page.locator("img").evaluateAll(async (images) => { await Promise.all(images.map((image) => (image as HTMLImageElement).decode())); });
    expect(await page.locator("img").count()).toBe(6);
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const photoSizes = await page.locator("img").evaluateAll((images) => images.map((image) => {
        const img = image as HTMLImageElement;
        return Math.abs((img.clientWidth / img.clientHeight) - (img.naturalWidth / img.naturalHeight));
      }));
      expect(photoSizes.every((difference) => difference < .03)).toBe(true);
      await page.screenshot({ path: `${folder}/${variant}-${viewport.name}.png`, fullPage: true, scale: "css" });
      await page.screenshot({ path: `${folder}/${variant}-${viewport.name}-top.png` });
    }
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).not.toBe("rgba(0, 0, 0, 0)");
    const sourceLinks = await page.locator("a").evaluateAll((links) => links.map((link) => link.href));
    expect(sourceLinks.every((href) => /^https?:\/\//.test(href))).toBe(true);
    expect(errors).toEqual([]);
    expect(writes).toEqual([]);
  });
}

test("gallery: actual tabs, keyboard controls, responsive view and download", async ({ page }) => {
  test.setTimeout(90000);
  await page.goto(base, { waitUntil: "networkidle" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: `${folder}/gallery-desktop.png`, fullPage: true, scale: "css" });
  await page.getByRole("tab", { name: /아침편지/ }).focus();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("tab", { name: /모닝브리프/ })).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("iframe")).toHaveAttribute("src", "brief.html");
  await page.keyboard.press("End");
  await expect(page.getByRole("tab", { name: /데일리픽/ })).toHaveAttribute("aria-selected", "true");
  await page.getByRole("button", { name: "컴퓨터", exact: true }).click();
  await expect(page.locator("iframe")).toHaveClass("desktop");
  const download = page.waitForEvent("download");
  await page.getByRole("link", { name: "메일 HTML 다운로드" }).click();
  expect((await download).suggestedFilename()).toBe("achim-magazine-preview.html");
  await expect(page.getByRole("link", { name: "새 창으로 보기" })).toHaveAttribute("href", "magazine.html");
  await page.getByRole("tab", { name: /아침편지/ }).click();
  for (const variant of ["letter", "brief", "magazine"]) {
    await page.goto(`${base}?variant=${variant}`, { waitUntil: "networkidle" });
    await page.frameLocator("iframe").locator("img").evaluateAll(async (images) => { await Promise.all(images.map((image) => (image as HTMLImageElement).decode())); });
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await expect.poll(() => page.locator("iframe").evaluate((element) => {
        const frame = element as HTMLIFrameElement;
        const doc = frame.contentDocument!;
        return frame.clientHeight >= Math.ceil(doc.body.getBoundingClientRect().height) && doc.documentElement.scrollHeight <= frame.clientHeight + 2;
      })).toBe(true);
      await expect(page.frameLocator("iframe").getByText("당신의 아침에, 필요한 이야기만.", { exact: true })).toBeVisible();
      if (variant === "letter") await page.screenshot({ path: `${folder}/gallery-${viewport.name}.png`, fullPage: true, scale: "css" });
    }
  }
});

test("emails: image-off and style-off reading fallback", async ({ page }) => {
  await page.route(/\.(jpg|jpeg|png)(\?|$)/, (route) => route.abort());
  await page.setViewportSize({ width: 360, height: 800 });
  for (const variant of ["letter", "brief", "magazine"]) {
    await page.goto(`${base}${variant}.html`, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => document.querySelectorAll("style").forEach((node) => node.remove()));
    await expect(page.getByText("한국 남자축구, 아시안게임 첫 경기서 카타르 4-1 완파", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "이 날짜 브리핑 전체 읽기" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `${folder}/${variant}-images-off.png`, fullPage: true, scale: "css" });
  }
});

test("emails: long Korean headlines and enlarged reading text", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  for (const variant of ["letter", "brief", "magazine"]) {
    await page.goto(`${base}${variant}.html`, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => {
      const heading = document.querySelector("h2");
      if (heading) heading.textContent = "아주 긴 한국어 뉴스 제목도 내용이 사라지거나 한 글자씩 잘리지 않고 자연스럽게 이어져야 합니다";
      for (const element of document.querySelectorAll<HTMLElement>("h1,h2,h3,p,a")) element.style.fontSize = `${parseFloat(getComputedStyle(element).fontSize) * 2}px`;
    });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    // Keep the entire enlarged page; CSS-pixel capture avoids WebKit's 32767px
    // bitmap limit on 3x iPhone displays without cropping any reading content.
    await page.screenshot({ path: `${folder}/${variant}-large-text.png`, fullPage: true, scale: "css" });
  }
});

test("emails: blocked webfont keeps the complete reading flow", async ({ page }) => {
  const blockedFonts: string[] = [];
  await page.route("**/*.woff2", route => { blockedFonts.push(route.request().url()); return route.abort(); });
  await page.setViewportSize({ width: 360, height: 800 });
  for (const variant of ["letter", "brief", "magazine"]) {
    await page.goto(`${base}${variant}.html`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await expect(page.getByText("원·달러 환율 12.1원 올라 1,359.4원", { exact: true })).toBeVisible();
    await expect(page.getByText("당신의 아침에, 필요한 이야기만.", { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    // WebKit may remove failed FontFace entries instead of retaining status
    // "error". Verify the real network denial and no custom font loaded.
    expect(await page.evaluate(() => [...document.fonts].some(face => face.family.includes("SUIT") && face.status === "loaded"))).toBe(false);
    await page.screenshot({ path: `${folder}/${variant}-font-off.png`, fullPage: true, scale: "css" });
  }
  expect(blockedFonts.length).toBeGreaterThan(0);
});

test("comparison: the circled header and every mail share real fonts, complete height and navigation", async ({ page, browserName }) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  const writes: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("request", request => { if (!["GET", "HEAD"].includes(request.method()) || request.url().includes("/api/") || request.url().includes("sw.js")) writes.push(request.method() + " " + request.url()); });
  await page.goto(`${base}compare.html`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator("iframe")).toHaveCount(3);
  for (const selector of [".intro h1", ".intro-copy", ".context", ".scope-note strong", ".comparison-heading h2", ".section-kicker", ".header-link"]) {
    expect(await page.locator(selector).first().evaluate(el => getComputedStyle(el).fontFamily)).toContain("SUIT");
  }
  if (browserName === "chromium") {
    const client = await page.context().newCDPSession(page);
    await client.send("DOM.enable");
    await client.send("CSS.enable");
    const { root } = await client.send("DOM.getDocument");
    for (const selector of [".intro h1", ".intro-copy", ".comparison-heading h2"]) {
      const { nodeId } = await client.send("DOM.querySelector", { nodeId: root.nodeId, selector });
      const { fonts } = await client.send("CSS.getPlatformFontsForNode", { nodeId });
      expect(fonts.some(font => font.isCustomFont && font.familyName.includes("SUIT") && font.glyphCount > 0)).toBe(true);
    }
    await client.detach();
  }
  for (const variant of ["letter", "brief", "magazine"]) {
    await page.frameLocator(`iframe[src="${variant}.html"]`).locator("img").evaluateAll(async images => { await Promise.all(images.map(image => (image as HTMLImageElement).decode())); });
  }
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    for (const variant of ["letter", "brief", "magazine"]) {
      await expect.poll(() => page.locator(`iframe[src="${variant}.html"]`).evaluate(element => {
        const frame = element as HTMLIFrameElement;
        const doc = frame.contentDocument!;
        return frame.clientHeight >= Math.ceil(doc.body.getBoundingClientRect().height) && doc.documentElement.scrollHeight <= frame.clientHeight + 2 && doc.documentElement.scrollWidth <= frame.clientWidth;
      })).toBe(true);
      await expect(page.frameLocator(`iframe[src="${variant}.html"]`).getByText("당신의 아침에, 필요한 이야기만.", { exact: true })).toBeVisible();
    }
    // Keep all three full mails even when stacked on a 3x iPhone display.
    await page.screenshot({ path: `${folder}/comparison-${viewport.name}.png`, fullPage: true, scale: "css" });
    await page.screenshot({ path: `${folder}/comparison-${viewport.name}-top.png`, scale: "css" });
  }
  await expect(page.getByRole("link", { name: "아침편지 전체 열기" })).toHaveAttribute("href", "letter.html");
  await page.getByRole("link", { name: "하나씩 살펴보기", exact: true }).click();
  await expect(page.getByRole("tab", { name: /아침편지/ })).toHaveAttribute("aria-selected", "true");
  await page.getByRole("link", { name: "한눈에 비교", exact: true }).click();
  await expect(page.locator("iframe")).toHaveCount(3);
  expect(errors).toEqual([]);
  expect(writes).toEqual([]);
});

test("preview pages: readable full hierarchy when the shared font is blocked", async ({ page }) => {
  test.setTimeout(60000);
  await page.route("**/*.woff2", route => route.abort());
  await page.setViewportSize({ width: 360, height: 800 });
  for (const path of ["", "compare.html"]) {
    await page.goto(`${base}${path}`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator(".intro h1")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `${folder}/${path ? "comparison" : "gallery"}-font-off-top.png`, scale: "css" });
  }
});

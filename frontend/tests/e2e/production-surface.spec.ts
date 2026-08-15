import { expect, test } from "@playwright/test";

test("landing page communicates the service without internal operations", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /어제 뉴스를/ })).toBeVisible();
  await expect(page.getByText("꼭 필요한 뉴스를 한눈에", { exact: true })).toBeVisible();
  await expect(page.getByText("오전 7:30", { exact: true })).toBeVisible();
  await expect(page.getByText(/API 키/)).toHaveCount(0);
  await expect(page.getByText(/오전 1시/)).toHaveCount(0);
});

test("privacy center exposes data download and complete deletion", async ({ page }) => {
  await page.goto("/preferences/");
  await expect(page.getByRole("button", { name: "내 데이터 받기" })).toBeVisible();
  await expect(page.getByRole("button", { name: "전체 데이터 삭제" })).toBeVisible();
});

test("complete deletion clears every app-owned device key", async ({ page }) => {
  await page.route("**/api/reader/data", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ deletedPreferences: 1 }) });
  });
  await page.goto("/preferences/");
  await page.evaluate(() => {
    window.localStorage.setItem("achim-gyeol-reader-preferences", "saved");
    window.localStorage.setItem("achim-gyeol-read-42", "[1]");
    window.localStorage.setItem("unrelated-key", "keep");
  });
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "전체 데이터 삭제" }).click();
  await expect(page.getByRole("status")).toContainText("모두 삭제했습니다");
  await expect.poll(() => page.evaluate(() => Object.keys(window.localStorage).filter((key) => key.startsWith("achim-gyeol-")))).toEqual([]);
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem("unrelated-key"))).toBe("keep");
});

test("legal pages identify the operator and correction channel", async ({ page }) => {
  await page.goto("/privacy/");
  await expect(page.getByRole("heading", { name: "개인정보처리방침" })).toBeVisible();
  await expect(page.getByText(/GitHub 사용자 boclair98/)).toBeVisible();
  await expect(page.getByRole("link", { name: "아침결 GitHub 문의 창구" })).toHaveAttribute("href", "https://github.com/boclair98/achim-gyeol/issues");
});

test("public trust copy does not expose implementation vendors or models", async ({ page }) => {
  await page.goto("/trust/");
  await expect(page.getByRole("heading", { name: /더 궁금하면 원문까지/ })).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/OpenAI|NAVER|GDELT|gpt-/i);
  await expect(page.locator("body")).not.toContainText(/오전 1시|API 키/);
});

test("public pages avoid technical implementation copy", async ({ page }) => {
  const publicPages = ["/", "/briefing/", "/archive/", "/preferences/", "/trust/", "/privacy/", "/terms/"];
  const technicalCopy = /오전 1시|API 키|OpenAI|NAVER API|GDELT|gpt-|PWA|웹푸시|endpoint|UUID|기기 ID|자동화 도구|자동 품질|AI NEWS SUMMARY|서버 포함|JSON/i;
  for (const path of publicPages) {
    await page.goto(path);
    await expect(page.locator("body")).not.toContainText(technicalCopy);
  }
});

test("PWA manifest and service worker assets are deployable", async ({ request }) => {
  await expect((await request.get("/manifest.webmanifest")).status()).toBe(200);
  await expect((await request.get("/sw.js")).status()).toBe(200);
  await expect((await request.get("/mail-icon.svg")).status()).toBe(200);
});

test("browser tab uses the branded mail icon", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute("href", /mail-icon\.svg$/);
});

import { expect, test } from "@playwright/test";

test("landing page communicates the production schedule", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /어제 뉴스를/ })).toBeVisible();
  await expect(page.getByText("전날 뉴스를 오전 1시부터 종합", { exact: true })).toBeVisible();
  await expect(page.getByText("오전 7:30", { exact: true })).toBeVisible();
});

test("privacy center exposes server export and complete deletion", async ({ page }) => {
  await page.goto("/preferences/");
  await expect(page.getByRole("button", { name: "서버 포함 내 데이터 받기" })).toBeVisible();
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

test("PWA manifest and service worker assets are deployable", async ({ request }) => {
  await expect((await request.get("/manifest.webmanifest")).status()).toBe(200);
  await expect((await request.get("/sw.js")).status()).toBe(200);
});

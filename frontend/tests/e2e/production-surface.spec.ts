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

test("news reader shows an available article image and beginner-friendly explanation", async ({ page }) => {
  await page.route("**/api/briefings/today", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: 77,
        briefingDate: new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date()),
        productionReady: true,
        dateLabel: "8월 17일 월요일",
        lead: "오늘의 중요한 흐름을 쉽게 정리했습니다.",
        readMinutes: 3,
        verifiedCount: 1,
        lastVerifiedAt: "오전 6:40",
        stories: [{
          id: 701,
          category: "경제",
          title: "기준금리 결정이 생활비에 미치는 영향",
          oneLineSummary: "기준금리는 대출과 예금 금리에 영향을 주는 기준입니다.",
          summary: "기준금리 결정이 발표됐습니다.",
          backgroundContext: "한국은행은 물가와 경기 상황을 살펴 기준금리를 정합니다.",
          plainExplanation: "쉽게 말하면 돈을 빌리거나 맡길 때 적용되는 이자의 기준이 달라질 수 있다는 뜻입니다.",
          whyItMatters: "대출 이자와 예금 수익에 영향을 줄 수 있습니다.",
          verificationStatus: "VERIFIED",
          qualityScore: 90,
          evidenceAvailable: true,
          claims: [{ statement: "기준금리 결정이 발표됐습니다.", sources: [{ publisher: "한국은행", url: "https://www.bok.or.kr", publishedAt: "2026-08-16T09:00:00+09:00" }] }],
          sources: [{ publisher: "한국은행", url: "https://www.bok.or.kr", publishedAt: "2026-08-16T09:00:00+09:00", primarySource: true }],
          imageUrl: "/og-v2.png",
          imagePublisher: "한국은행",
        }],
      }),
    });
  });
  await page.goto("/briefing/");
  await expect(page.getByRole("img", { name: /기준금리 결정이 생활비에 미치는 영향 관련 기사 대표 이미지/ }).first()).toBeVisible();
  await expect(page.getByText("처음 보는 분을 위한 배경")).toBeVisible();
  await expect(page.getByText(/돈을 빌리거나 맡길 때 적용되는 이자의 기준/).first()).toBeVisible();
});

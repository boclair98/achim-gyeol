import { expect, test, type Page } from "@playwright/test";

const date = "2024-04-15";
const recipient = `/briefing/delivery/?date=${date}`;
const preview = `/briefing/delivery/preview/?date=${date}`;
const viewports = [
  { width: 360, height: 800 }, { width: 390, height: 844 },
  { width: 768, height: 1024 }, { width: 1440, height: 900 },
];
const longTitle = "한글제목을절대로자르지않고읽기쉽게줄바꿈하는지확인하는검증용제목".repeat(3);

function edition(count = 29) {
  return {
    id: 203, briefingDate: date, dateLabel: "4월 15일 월요일", productionReady: true,
    stories: Array.from({ length: count }, (_, index) => ({
      id: 700 + index,
      title: index === 0 ? longTitle : `검증용 기사 ${index + 1}번`,
      category: index === 27 ? "e스포츠" : "경제",
      summary: "첫 소식의 전체 맥락입니다. 요약에는 두 번째 문장도 남아 있어요.",
      oneLineSummary: "검증용 핵심 한 줄입니다.",
      plainExplanation: "어려운 표현을 풀어서 설명합니다.",
      whyItMatters: "왜 확인할 가치가 있는지 전합니다.",
      sources: [{ publisher: "검증 원문", url: "https://news.example/article" }, { publisher: "열면 안 되는 링크", url: "javascript:alert(1)" }],
      imageUrl: index === 0 ? "http://127.0.0.1:4173/og-v2.png" : undefined,
      imagePublisher: "검증 사진",
    })),
  };
}

async function mockEdition(page: Page, data = edition()) {
  await page.route(`**/api/briefings/${date}`, route => route.fulfill({ json: data }));
}

test("all titles stay in the received edition and keyboard open/return preserves position", async ({ page }) => {
  let requests = 0;
  await page.route(`**/api/briefings/${date}`, route => { requests++; return route.fulfill({ json: edition() }); });
  await page.goto(recipient);
  await expect(page.getByRole("heading", { name: "어제의 핵심 뉴스" })).toBeVisible();
  await expect(page.locator("[data-received-story]")).toHaveCount(29);
  await expect(page.getByRole("searchbox")).toHaveCount(0);
  await expect(page.locator("article")).toHaveCount(0);
  const last = page.locator("#received-story-728");
  await last.press("Enter");
  await expect(page).toHaveURL(/date=2024-04-15#news-728$/);
  await expect(page.locator("#news-728")).toBeFocused();
  await expect(page.getByRole("heading", { name: "핵심 요약" })).toBeVisible();
  await expect(page.getByText("검증용 핵심 한 줄입니다.")).toBeVisible();
  await expect(page.getByRole("link", { name: "검증 원문" })).toHaveAttribute("href", "https://news.example/article");
  await expect(page.getByText("열면 안 되는 링크")).toHaveCount(0);
  await page.getByRole("link", { name: /이전 기사/ }).click();
  await expect(page.locator("#news-727")).toBeFocused();
  await page.getByRole("link", { name: "뉴스 목록", exact: true }).click();
  await expect(page.locator("[data-received-story]")).toHaveCount(29);
  await expect(last).toBeFocused();
  await expect(last).toContainText("읽음");
  await page.goBack();
  await expect(page.locator("#news-727")).toBeFocused();
  expect(requests).toBe(1);
});

test("article photos keep their aspect ratio and long Korean wraps at every viewport", async ({ page }) => {
  test.setTimeout(45_000);
  await mockEdition(page, edition(2));
  await page.setViewportSize(viewports[0]);
  await page.goto(recipient);
  const first = page.locator("#received-story-700");
  await expect(first).toBeVisible({ timeout: 10_000 });
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await expect(first).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect((await first.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await first.click();
    const article = page.locator("#news-700");
    const image = article.getByRole("img");
    await expect(article).toBeFocused();
    await expect(article.getByRole("heading", { level: 1 })).toHaveText(longTitle);
    await expect.poll(() => image.evaluate(img => (img as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    const dimensions = await image.evaluate(element => {
      const img = element as HTMLImageElement;
      return { actual: img.width / img.height, original: img.naturalWidth / img.naturalHeight };
    });
    expect(dimensions.actual).toBeCloseTo(dimensions.original, 1);
    const summary = await article.getByRole("heading", { name: "핵심 요약" }).boundingBox();
    expect(summary!.y).toBeLessThan((await image.boundingBox())!.y);
    await page.getByRole("button", { name: "큰 글자" }).press("Space");
    await expect(page.getByRole("button", { name: "큰 글자" })).toHaveAttribute("aria-pressed", "true");
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole("link", { name: "뉴스 목록", exact: true }).click();
    await expect(first).toBeFocused();
  }
});

test("dated links fail honestly, retry, and fall back only to the same saved edition", async ({ page }) => {
  let reply: "wrong" | "correct" | "offline" = "wrong";
  await page.route(`**/api/briefings/${date}`, route => reply === "offline"
    ? route.fulfill({ status: 503, body: "" })
    : route.fulfill({ json: { ...edition(2), briefingDate: reply === "wrong" ? "2024-04-16" : date } }));
  await page.route("**/api/briefings/2024-04-16", route => route.fulfill({ status: 503, body: "" }));
  await page.goto(recipient + "#news-701");
  await expect(page.getByRole("heading", { name: "뉴스레터를 열지 못했어요" })).toBeVisible();
  await expect(page.locator("article")).toHaveCount(0);
  reply = "correct";
  await page.getByRole("button", { name: "다시 불러오기" }).click();
  await expect(page.locator("#news-701")).toBeFocused();
  reply = "offline";
  await page.reload();
  await expect(page.getByText("이 기기에 저장된 뉴스레터", { exact: false })).toBeVisible();
  await expect(page.locator("#news-701")).toBeVisible();
  await page.goto("/briefing/delivery/?date=2024-04-16");
  await expect(page.getByRole("heading", { name: "뉴스레터를 열지 못했어요" })).toBeVisible();
  await expect(page.locator("[data-received-story]")).toHaveCount(0);
  await page.goto("/briefing/delivery/?date=2024-02-30");
  await expect(page.getByRole("heading", { name: "발행일 링크를 확인해 주세요" })).toBeVisible();
});

test("missing images and outdated article links do not hide the remaining headlines", async ({ page }) => {
  await mockEdition(page, edition(2));
  await page.route("**/og-v2.png", route => route.fulfill({ status: 404, body: "" }));
  await page.goto(recipient + "#news-999");
  await expect(page.getByText("해당 기사를 찾지 못했어요", { exact: false })).toBeVisible();
  await expect(page.locator("[data-received-story]")).toHaveCount(2);
  await page.locator("#received-story-700").click();
  await expect(page.locator("#news-700 figure")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "쉽게 읽기" })).toBeVisible();
  await mockEdition(page, edition(0));
  await page.goto(recipient);
  await expect(page.getByRole("heading", { name: "아직 읽을 뉴스가 없어요" })).toBeVisible();
  await expect(page.getByRole("link", { name: "지난 뉴스 보기" })).toHaveAttribute("href", "/archive/");
});

test("email prototype fits the complete message and a title opens the same dated web article", async ({ page }) => {
  const previewCalls: string[] = [];
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.route(`**/api/briefings/${date}`, route => {
    if (page.url().includes("/preview/")) previewCalls.push(route.request().headers()["x-achim-device"] ?? "anonymous");
    return route.fulfill({ json: edition() });
  });
  await page.goto(preview);
  await expect(page.getByText("실제로 발송한 메일은 아니에요", { exact: false })).toBeVisible();
  const iframe = page.locator("iframe[title='아침결 이메일 본문 시안']");
  const mail = iframe.contentFrame();
  await expect(mail.getByRole("heading", { name: "어제의 핵심 뉴스" })).toBeVisible();
  const last = mail.getByRole("link", { name: /검증용 기사 29번/ });
  await expect(last).toHaveAttribute("href", `http://127.0.0.1:4173${recipient}#news-728`);
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await expect.poll(() => iframe.evaluate(element => {
      const frame = element as HTMLIFrameElement;
      const doc = frame.contentDocument;
      return !!doc?.body && frame.clientHeight >= doc.body.getBoundingClientRect().height
        && doc.documentElement.scrollWidth <= frame.clientWidth
        && document.documentElement.scrollWidth <= innerWidth;
    })).toBe(true);
  }
  const filePromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "메일 파일 받기" }).click();
  expect((await filePromise).suggestedFilename()).toBe(`achim-gyeol-${date}-preview.eml`);
  expect(previewCalls).toEqual(["anonymous"]);
  await last.click();
  await expect(page).toHaveURL(/delivery\/\?date=2024-04-15#news-728$/);
  await expect(page.locator("#news-728")).toBeFocused();
  await expect(page.getByRole("heading", { name: "핵심 요약" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("public reader and its existing article links do not switch to the newsletter surface", async ({ page }) => {
  await mockEdition(page, edition(2));
  await page.goto(`/briefing/?date=${date}`);
  await expect(page.getByRole("searchbox", { name: "기사 검색" })).toBeVisible();
  await expect(page.locator("[data-received-story]")).toHaveCount(0);
  await page.goto(`/briefing/?date=${date}#news-701`);
  await expect(page.locator("#news-701")).toBeFocused();
  await expect(page.getByRole("link", { name: "기사 목록", exact: true })).toBeVisible();
});

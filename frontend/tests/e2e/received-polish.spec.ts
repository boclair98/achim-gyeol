import { expect, test, type Page } from "@playwright/test";

const date = "2024-04-15";
const recipient = `/briefing/delivery/?date=${date}`;
const longTitle = "긴한글제목도사진과함께전체내용을읽을수있도록안전하게줄바꿈하는뉴스".repeat(3);
const viewports = [
  { width: 360, height: 800 }, { width: 390, height: 844 },
  { width: 768, height: 1024 }, { width: 1440, height: 900 },
];

function edition(count = 3) {
  return {
    id: 503, briefingDate: date, dateLabel: "4월 15일 월요일", productionReady: true,
    readMinutes: 7, lead: "이 발행본에 담긴 소식을 차례로 읽어보세요.",
    stories: Array.from({ length: count }, (_, index) => ({
      id: 1700 + index,
      title: index === 0 ? longTitle : `다음으로 읽을 검증 기사 ${index + 1}번`,
      category: index === count - 1 ? "e스포츠" : "경제",
      oneLineSummary: "새로운 제도는 다음 달부터 시행됩니다.",
      summary: "적용 범위를 정리한 세부 기준이 공개됐습니다. 접수는 각 기관에서 진행합니다.",
      plainExplanation: "신청할 수 있는 대상을 먼저 확인할 수 있어요.",
      whyItMatters: "변경된 기준이 이용자의 신청 방법에 영향을 줍니다.",
      verificationStatus: "VERIFIED", qualityScore: 90,
      sources: [{ publisher: "검증 원문", url: "https://news.example/article" }],
      imageUrl: index === 0 ? "http://127.0.0.1:4173/og-v2.png" : undefined,
      imagePublisher: "검증 사진",
    })),
  };
}

async function mockArchivedEdition(page: Page, data = edition()) {
  const methods: string[] = [];
  await page.route("**/api/**", route => {
    const request = route.request();
    methods.push(request.method());
    if (request.method() !== "GET") return route.fulfill({ status: 204 });
    if (new URL(request.url()).pathname === `/api/briefings/${date}`) {
      return route.fulfill({ json: data });
    }
    return route.fulfill({ status: 404 });
  });
  return methods;
}

test("the flat editorial list keeps every dated story once with a lead summary and explicit reading actions", async ({ page }) => {
  const data = edition(18);
  data.stories.forEach((story, index) => { story.oneLineSummary = `지역 센터는 ${index + 1}곳에서 신청을 받습니다.`; });
  await mockArchivedEdition(page, data);
  await page.goto(recipient);
  const rows = page.locator("[data-received-story]");
  await expect(rows).toHaveCount(data.stories.length);
  const expected = data.stories.map(story => `#news-${story.id}`);
  await expect(rows.getByText("기사 읽기", { exact: true })).toHaveCount(data.stories.length);
  // Check all article anchors on the fresh edition, not just card ids: a second
  // digest of the same articles would still pass a row-only count.
  const links = page.locator('main a[href^="#news-"]');
  await expect(links).toHaveCount(expected.length);
  expect(await links.evaluateAll(nodes => nodes.map(node => node.getAttribute("href")))).toEqual(expected);
  await expect(rows.first()).toContainText(data.stories[0].oneLineSummary);
  await expect(rows.first().getByRole("img", { name: `${data.stories[0].title} 관련 사진` })).toHaveAttribute("src", data.stories[0].imageUrl!);
  await expect(rows.nth(1)).not.toContainText(data.stories[1].oneLineSummary);
  await expect(rows.nth(1).getByRole("img")).toHaveCount(0);
  await expect(rows.first()).toContainText("검증 원문");
  await expect(rows.nth(3)).not.toContainText(data.stories[3].oneLineSummary);
  await expect(rows.last()).toContainText("e스포츠");
  const link = rows.nth(1);
  await link.press("Enter");
  await expect(page).toHaveURL(/date=2024-04-15#news-1701$/);
  await expect(page.locator("#news-1701")).toBeFocused();
  await page.getByRole("link", { name: "뉴스 목록", exact: true }).press("Enter");
  await expect(link).toBeFocused();
});

for (const size of [1, 2, 3]) {
  test(`a ${size}-story edition has no padded slots, duplicates or missing links`, async ({ page }) => {
    const data = edition(size);
    await mockArchivedEdition(page, data);
    await page.goto(recipient);
    await expect(page.getByRole("heading", { level: 1, name: "어제의 핵심 뉴스" })).toBeVisible();
    const links = page.locator('main a[href^="#news-"]');
    await expect(links).toHaveCount(size);
    expect(await links.evaluateAll(nodes => nodes.map(node => node.getAttribute("href"))))
      .toEqual(data.stories.map(story => `#news-${story.id}`));
    await expect(page.locator(`#received-story-${data.stories[0].id}`)).toContainText(data.stories[0].oneLineSummary);
    for (const story of data.stories) await expect(page.locator(`#received-story-${story.id}`)).toContainText(story.title);
  });
}

test("opened progress and the first unopened article survive returning and reloading", async ({ page }) => {
  const methods = await mockArchivedEdition(page);
  await page.goto(recipient);
  await expect(page.locator("[data-received-story]")).toHaveCount(3);
  await expect(page.getByText("0 / 3편 열어봄", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "이어서 읽기", exact: true })).toHaveCount(0);

  const first = page.locator("#received-story-1700");
  await first.press("Enter");
  await expect(page.locator("#news-1700")).toBeFocused();
  await page.getByRole("link", { name: "뉴스 목록", exact: true }).click();
  await expect(first).toBeFocused();
  await expect(page.getByText("1 / 3편 열어봄", { exact: true })).toBeVisible();
  const resume = page.getByRole("link", { name: "이어서 읽기", exact: true });
  await expect(resume).toHaveAttribute("href", "#news-1701");

  await page.reload();
  await expect(page.getByText("1 / 3편 열어봄", { exact: true })).toBeVisible();
  await expect(resume).toHaveAttribute("href", "#news-1701");
  await resume.press("Enter");
  await expect(page).toHaveURL(/date=2024-04-15#news-1701$/);
  await expect(page.locator("#news-1701")).toBeFocused();
  expect(methods.length).toBeGreaterThan(0);
  expect(methods.every(method => method === "GET")).toBe(true);
});

test("editorial reading actions align across unequal headlines and remain usable with 2x text", async ({ page }) => {
  const data = edition(3);
  data.stories[1].title = longTitle;
  await mockArchivedEdition(page, data);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(recipient);
  const actions = page.locator('[data-received-story]').getByText('기사 읽기', { exact: true });
  const firstAction = await actions.nth(1).boundingBox();
  const secondAction = await actions.nth(2).boundingBox();
  expect(Math.abs(firstAction!.y - secondAction!.y)).toBeLessThanOrEqual(1);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('main').evaluate(root => {
    const sizes = [...root.querySelectorAll<HTMLElement>('*')].map(element => [element, parseFloat(getComputedStyle(element).fontSize)] as const);
    for (const [element, size] of sizes) element.style.fontSize = `${size * 2}px`;
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(false);
  const rows = page.locator('[data-received-story]');
  await expect(rows).toHaveCount(3);
  for (const action of await actions.all()) expect((await action.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await expect(rows.nth(1)).toContainText(longTitle);
});

test("the reading toolbar advances with the keyboard and returns focus to the opener", async ({ page }) => {
  const methods = await mockArchivedEdition(page);
  await page.goto(recipient);
  const first = page.locator("#received-story-1700");
  await first.press("Enter");
  const next = page.getByRole("link", { name: "다음 뉴스", exact: true });
  await expect(next).toHaveAttribute("href", "#news-1701");
  await expect(next.getByText("다음", { exact: true })).toBeVisible();
  expect((await next.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await next.press("Enter");
  await expect(page.locator("#news-1701")).toBeFocused();
  await expect(next).toHaveAttribute("href", "#news-1702");
  await page.getByRole("link", { name: "뉴스 목록", exact: true }).press("Enter");
  await expect(first).toBeFocused();
  await expect(page.getByText("2 / 3편 열어봄", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "이어서 읽기", exact: true })).toHaveAttribute("href", "#news-1702");
  expect(methods).toEqual(["GET"]);
});

test("opening the whole edition does not leave a misleading continue action", async ({ page }) => {
  const methods = await mockArchivedEdition(page, edition(2));
  await page.goto(recipient);
  await expect(page.locator("[data-received-story]")).toHaveCount(2);
  await page.locator("#received-story-1700").click();
  await page.getByRole("link", { name: "다음 뉴스", exact: true }).click();
  await expect(page.locator("#news-1701")).toBeFocused();
  await expect(page.getByRole("link", { name: "다음 뉴스", exact: true })).toHaveCount(0);
  await page.getByRole("link", { name: "뉴스 목록", exact: true }).click();
  await expect(page.getByText("2 / 2편 열어봄", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "이어서 읽기", exact: true })).toHaveCount(0);
  await expect(page.locator("[data-received-story]")).toHaveCount(2);
  await expect(page.locator("#received-story-1701")).toContainText("e스포츠");
  await page.reload();
  await expect(page.getByText("2 / 2편 열어봄", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "이어서 읽기", exact: true })).toHaveCount(0);
  expect(methods.every(method => method === "GET")).toBe(true);
});

test("returning from a story restores the original row at the same viewport position", async ({ page }) => {
  const methods = await mockArchivedEdition(page, edition(18));
  await page.goto(recipient);
  const row = page.locator("#received-story-1707");
  await expect(row).toBeVisible({ timeout: 10_000 });
  const originalTop = await row.evaluate(element => {
    element.scrollIntoView({ block: "center", behavior: "instant" });
    return element.getBoundingClientRect().top;
  });
  await row.click();
  await expect(page.locator("#news-1707")).toBeFocused();
  await page.getByRole("link", { name: "뉴스 목록", exact: true }).click();
  await expect(row).toBeFocused();
  await expect.poll(async () => {
    const currentTop = await row.evaluate(element => element.getBoundingClientRect().top);
    return Math.abs(currentTop - originalTop);
  }).toBeLessThanOrEqual(2);
  expect(methods).toEqual(["GET"]);
});

test("the lead image is omitted when its URL is unsafe or the image fails", async ({ page }) => {
  const unsafe = edition(3);
  unsafe.stories[0].imageUrl = "javascript:alert(1)";
  await mockArchivedEdition(page, unsafe);
  await page.goto(recipient);
  const lead = page.locator("#received-story-1700");
  await expect(lead.getByRole("img")).toHaveCount(0);
  await expect(lead).toContainText(unsafe.stories[0].title);

  const failure = edition(3);
  await page.route("http://127.0.0.1:4173/og-v2.png", route => route.abort());
  await page.route("**/api/**", route => {
    if (route.request().method() !== "GET") return route.fulfill({ status: 204 });
    if (new URL(route.request().url()).pathname === `/api/briefings/${date}`) return route.fulfill({ json: failure });
    return route.fulfill({ status: 404 });
  });
  await page.goto(recipient);
  const failedLead = page.locator("#received-story-1700");
  await expect(failedLead.locator("[data-news-photo]")).toHaveCount(0);
  await expect(failedLead).toContainText(failure.stories[0].title);
});

for (const viewport of viewports) {
  test(`the list keeps long headlines and photos uncropped at ${viewport.width}px`, async ({ page }) => {
    const data = edition(18);
    const photoUrl = data.stories[0].imageUrl!;
    const methods = await mockArchivedEdition(page, data);
    await page.setViewportSize(viewport);
    await Promise.all([
      page.waitForResponse(response => response.ok() && new URL(response.url()).pathname === `/api/briefings/${date}`,
        { timeout: 20_000 }),
      page.goto(recipient),
    ]);
    await expect(page.locator("[data-received-story]")).toHaveCount(18);
    const first = page.locator("#received-story-1700");
    const listImage = first.getByRole("img", { name: `${longTitle} 관련 사진`, exact: true });
    await expect(listImage).toHaveAttribute("src", photoUrl);
    await expect(listImage).toBeVisible();
    await expect.poll(() => listImage.evaluate(element => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    await expect(page.locator("#received-story-1701").getByRole("img")).toHaveCount(0);
    const title = first.getByText(longTitle, { exact: true });
    await expect(title).toBeVisible();
    expect(await title.evaluate(element => {
      const text = document.createRange();
      text.selectNodeContents(element);
      const lines = Array.from(text.getClientRects());
      const bounds = element.closest("a")!.getBoundingClientRect();
      return lines.length > 0 && lines.every(line =>
        line.left >= bounds.left - 1 && line.right <= bounds.right + 1 &&
        line.top >= bounds.top - 1 && line.bottom <= bounds.bottom + 1);
    })).toBe(true);
    await expect(page.locator("#received-story-1717")).toContainText("e스포츠");
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect((await first.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await first.press("Enter");
    await expect(page).toHaveURL(url => url.pathname + url.search + url.hash === recipient + "#news-1700");
    const article = page.locator("#news-1700");
    await expect(article).toBeFocused();
    await expect(article.getByRole("heading", { level: 1, name: longTitle, exact: true })).toBeVisible();
    const image = article.getByRole("img", { name: longTitle + " 관련 사진", exact: true });
    await expect(image).toHaveAttribute("src", photoUrl);
    await expect(image).toBeVisible();
    await expect.poll(() => image.evaluate(element => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    const dimensions = await image.evaluate(element => {
      const photo = element as HTMLImageElement;
      const bounds = photo.getBoundingClientRect();
      return { actual: bounds.width / bounds.height, original: photo.naturalWidth / photo.naturalHeight, bottom: bounds.bottom };
    });
    expect(dimensions.actual).toBeCloseTo(dimensions.original, 1);
    expect(dimensions.bottom).toBeLessThanOrEqual((await article.locator("#received-sources").boundingBox())!.y);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole("link", { name: "뉴스 목록", exact: true }).press("Enter");
    await expect(first).toBeFocused();
    await expect(page).toHaveURL(url => url.pathname + url.search === recipient && !url.hash.startsWith("#news-"));
    expect(methods).toEqual(["GET"]);
  });
}

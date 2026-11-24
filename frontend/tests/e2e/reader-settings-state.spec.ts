import { expect, test, type Page } from "@playwright/test";

const allCategories = ["정책", "경제", "금융", "사회", "국제", "테크", "생활", "문화", "스포츠", "e스포츠"];
const serverSettings = { categories: allCategories.join(","), digestSize: "standard", consent: true };
const archiveEntry = {
  briefingDate: "2026-11-23", dateLabel: "11월 23일 월요일", lead: "회귀 검증용 실제 응답 제목",
  readMinutes: 5, verifiedCount: 2, storyCount: 3,
  categories: ["국제", "스포츠"], headlines: ["검증 응답의 첫 소식", "검증 응답의 두 번째 소식"],
};

async function localRequestsOnly(page: Page) {
  await page.route("**/api/**", route => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/reader/preferences" && route.request().method() === "GET") return route.fulfill({ json: serverSettings });
    if (path === "/api/briefings") return route.fulfill({ json: [archiveEntry] });
    return route.fulfill({ status: 200, json: {} });
  });
}

async function accelerateRequestDeadlines(page: Page) {
  await page.addInitScript(() => {
    const originalTimeout = window.setTimeout.bind(window);
    window.setTimeout = ((handler: TimerHandler, delay?: number, ...args: unknown[]) => originalTimeout(handler, delay === 15_000 ? 100 : delay, ...args)) as typeof window.setTimeout;
  });
}

test.beforeEach(async ({ page }) => {
  await localRequestsOnly(page);
});

test("archive separates loading, failure, and successful retry without fixture news", async ({ page }) => {
  let release: (() => void) | undefined;
  let calls = 0;
  await page.route("**/api/briefings", async route => {
    calls += 1;
    if (calls === 1) {
      await new Promise<void>(resolve => { release = resolve; });
      return route.fulfill({ status: 503, json: {} });
    }
    return route.fulfill({ json: [archiveEntry] });
  });
  await page.goto("/archive/");
  await expect(page.getByText("지난 뉴스를 불러오고 있어요.")).toBeVisible();
  await expect(page.locator(".edition-card")).toHaveCount(0);
  await expect(page.getByText("청년 지원 통합 창구 개편")).toHaveCount(0);
  await expect.poll(() => Boolean(release)).toBe(true);
  release?.();
  await expect(page.locator("main").getByRole("alert")).toContainText("불러오지 못했어요");
  await expect(page.locator(".edition-card")).toHaveCount(0);
  await page.getByRole("button", { name: "다시 시도", exact: true }).click();
  await expect(page.locator(".edition-card")).toHaveCount(1);
  await expect(page.locator(".edition-card h2")).toHaveText(archiveEntry.lead);
});

test("archive distinguishes no published editions from filtered zero results", async ({ page }) => {
  await page.route("**/api/briefings", route => route.fulfill({ json: [] }));
  await page.goto("/archive/");
  await expect(page.getByText("아직 발행된 브리핑이 없습니다.")).toBeVisible();
  await expect(page.getByRole("button", { name: "필터 초기화" })).toHaveCount(0);
  await page.route("**/api/briefings", route => route.fulfill({ json: [archiveEntry] }));
  await page.reload();
  await expect(page.getByRole("navigation", { name: "보관함 분야" }).getByRole("button")).toHaveText(["전체", "국제", "스포츠"]);
  await expect(page.getByText("분야를 고르면 해당 분야가 포함된 날짜의 브리핑을 보여드려요.")).toBeVisible();
  await page.getByRole("button", { name: "스포츠", exact: true }).click();
  await expect(page.locator(".edition-card")).toHaveCount(1);
  await page.getByRole("textbox", { name: "브리핑 검색" }).fill("없는검색어");
  await expect(page.getByText("조건에 맞는 브리핑이 없습니다.")).toBeVisible();
  await page.getByRole("button", { name: "필터 초기화" }).click();
  await expect(page.locator(".edition-card")).toHaveCount(1);
});

test("archive rejects malformed API data instead of showing a fixture or crashing", async ({ page }) => {
  await page.route("**/api/briefings", route => route.fulfill({ json: [{ ...archiveEntry, categories: null }] }));
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/archive/");
  await expect(page.locator("main").getByRole("alert")).toContainText("불러오지 못했어요");
  await expect(page.locator(".edition-card")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("blocked storage never blocks public archive reads or pretends a bookmark is persistent", async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new DOMException("blocked", "SecurityError"); };
    Storage.prototype.setItem = () => { throw new DOMException("blocked", "SecurityError"); };
  });
  await page.goto("/archive/");
  await expect(page.locator(".edition-card")).toHaveCount(1);
  const save = page.getByRole("button", { name: "11월 23일 저장", exact: true });
  await save.click();
  await expect(page.getByRole("button", { name: "11월 23일 저장 해제", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".archive-storage-notice")).toContainText("이번 화면에만");
});

test("malformed stored bookmarks do not break archive filters", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("achim-gyeol-saved-editions", '{"unexpected":true}'));
  await page.goto("/archive/");
  await expect(page.locator(".edition-card")).toHaveCount(1);
  await page.getByRole("button", { name: "저장한 브리핑", exact: true }).click();
  await expect(page.getByText("조건에 맞는 브리핑이 없습니다.")).toBeVisible();
});

test("malformed stored settings fall back safely while fixed delivery stays unchanged", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("achim-gyeol-reader-preferences", JSON.stringify({ categories: null, digestSize: "bogus", channels: 4, consent: null, deliveryTime: "00:00" })));
  await page.route("**/api/reader/preferences", route => route.fulfill({ status: 503, json: {} }));
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/preferences/");
  await expect(page.locator(".preference-status")).toContainText("불러오지 못했어요");
  await expect(page.locator(".choice-grid button[aria-pressed=true]")).toHaveCount(10);
  await expect(page.locator(".schedule-preference time")).toHaveAttribute("dateTime", "07:30");
  await expect(page.locator(".digest-options button.active")).toContainText("기본");
  expect(errors).toEqual([]);
});

test("a late preferences response cannot overwrite an edit or the saved request", async ({ page }) => {
  let release: (() => void) | undefined;
  let body: Record<string, unknown> | undefined;
  await page.route("**/api/reader/preferences", async route => {
    if (route.request().method() === "GET") {
      await new Promise<void>(resolve => { release = resolve; });
      return route.fulfill({ json: { ...serverSettings, digestSize: "deep" } });
    }
    body = route.request().postDataJSON();
    return route.fulfill({ json: {} });
  });
  await page.goto("/preferences/");
  const sports = page.locator(".choice-grid").getByRole("button", { name: "스포츠", exact: true });
  await expect.poll(() => Boolean(release)).toBe(true);
  await expect(page.locator(".preference-status")).toContainText("저장된 설정을 확인하고 있어요");
  await sports.click();
  release?.();
  await expect(sports).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator(".digest-options button.active")).toContainText("기본");
  await page.getByRole("button", { name: "설정 저장", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("저장했습니다");
  expect(body?.categories).not.toContain("스포츠");
  expect(body?.digestSize).toBe("standard");
  expect(body).not.toHaveProperty("deliveryTime");
});

test("failed online save retains local input and can be retried", async ({ page }) => {
  let saves = 0;
  await page.route("**/api/reader/preferences", route => {
    if (route.request().method() === "GET") return route.fulfill({ json: serverSettings });
    saves += 1;
    return route.fulfill({ status: saves === 1 ? 503 : 200, json: {} });
  });
  await page.goto("/preferences/");
  await page.locator(".digest-options button").filter({ hasText: "깊게" }).click();
  const save = page.getByRole("button", { name: "설정 저장", exact: true });
  await save.click();
  await expect(page.getByRole("status")).toContainText("온라인 설정에는 반영하지 못했으니");
  expect(await page.evaluate(() => JSON.parse(window.localStorage.getItem("achim-gyeol-reader-preferences")!).digestSize)).toBe("deep");
  await save.click();
  await expect(page.getByRole("status")).toContainText("내 관심 분야와 분량을 저장했습니다.");
  expect(saves).toBe(2);
});

test("save locks duplicate clicks and restores the action after completion", async ({ page }) => {
  let release: (() => void) | undefined;
  let saves = 0;
  await page.route("**/api/reader/preferences", async route => {
    if (route.request().method() === "GET") return route.fulfill({ json: serverSettings });
    saves += 1;
    await new Promise<void>(resolve => { release = resolve; });
    return route.fulfill({ json: {} });
  });
  await page.goto("/preferences/");
  await page.getByRole("button", { name: "설정 저장", exact: true }).evaluate((button: HTMLButtonElement) => { button.click(); button.click(); });
  await expect(page.getByRole("button", { name: "저장 중…", exact: true })).toBeDisabled();
  await expect.poll(() => saves).toBe(1);
  release?.();
  await expect(page.getByRole("button", { name: "설정 저장", exact: true })).toBeEnabled();
  await expect(page.getByRole("status")).toContainText("저장했습니다");
});

test("blocked identity storage cannot create a replacement device or claim a save", async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new DOMException("blocked", "SecurityError"); };
    Storage.prototype.setItem = () => { throw new DOMException("blocked", "SecurityError"); };
  });
  const requests: string[] = [];
  await page.route("**/api/reader/**", route => { requests.push(route.request().method()); return route.fulfill({ json: {} }); });
  await page.goto("/preferences/");
  await expect(page.locator(".preference-status")).toContainText("기기 설정에 연결하지 못했어요");
  await page.getByRole("button", { name: "설정 저장", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("기기 설정에 연결하지 못했어요");
  await expect(page.getByRole("button", { name: "설정 저장", exact: true })).toBeEnabled();
  expect(requests).toEqual([]);
});

test("known device identity survives a later local write failure without fake local success", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("achim-gyeol-device-id", "existing-regression-device"));
  let usedIdentity: string | undefined;
  await page.route("**/api/reader/preferences", route => {
    if (route.request().method() === "GET") return route.fulfill({ json: serverSettings });
    usedIdentity = route.request().headers()["x-achim-device"];
    return route.fulfill({ json: {} });
  });
  await page.goto("/preferences/");
  await expect(page.locator(".choice-grid button[aria-pressed=true]")).toHaveCount(10);
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new DOMException("blocked", "SecurityError"); }; });
  await page.getByRole("button", { name: "설정 저장", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("온라인 설정을 저장했어요");
  await expect(page.getByRole("status")).toContainText("이 기기에는 기억하지 못했으니");
  expect(usedIdentity).toBe("existing-regression-device");
});

test("feature feedback recovers when local and online persistence both fail", async ({ page }) => {
  await page.route("**/api/reader/events", route => route.fulfill({ status: 503, json: {} }));
  await page.goto("/preferences/");
  const discovery = page.locator(".preference-block").filter({ hasText: "다음에 생기면 좋을 기능" });
  await discovery.getByRole("checkbox", { name: "내가 고른 주제·키워드" }).click();
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new DOMException("blocked", "SecurityError"); }; });
  await discovery.getByRole("button", { name: "관심 기능 저장" }).click();
  await expect(discovery.getByRole("status")).toContainText("저장하지 못했어요");
  await expect(discovery.getByRole("button", { name: "관심 기능 저장" })).toBeEnabled();
  await expect(discovery.getByRole("checkbox", { name: "내가 고른 주제·키워드" })).toHaveAttribute("aria-checked", "true");
});

test("online deletion does not claim all data is gone when local cleanup fails", async ({ page }) => {
  let deletes = 0;
  await page.route("**/api/reader/data", route => {
    if (route.request().method() === "DELETE") deletes += 1;
    return route.fulfill({ json: { deletedPreferences: 1 } });
  });
  await page.goto("/preferences/");
  await page.evaluate(() => {
    window.localStorage.setItem("achim-gyeol-regression-note", "keep-until-cleanup");
    Storage.prototype.removeItem = () => { throw new DOMException("blocked", "SecurityError"); };
  });
  page.once("dialog", dialog => dialog.accept());
  await page.getByRole("button", { name: "전체 데이터 삭제", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("온라인 데이터는 삭제했습니다");
  await expect(page.getByRole("status")).not.toContainText("모두 삭제했습니다");
  await expect(page.getByRole("button", { name: "전체 데이터 삭제", exact: true })).toBeEnabled();
  expect(deletes).toBe(1);
});

test("an archive request deadline leaves loading and permits retry", async ({ page }) => {
  await accelerateRequestDeadlines(page);
  let calls = 0;
  await page.route("**/api/briefings", route => {
    calls += 1;
    // The first local mock deliberately never responds. No external request is sent.
    if (calls === 1) return;
    return route.fulfill({ json: [archiveEntry] });
  });
  await page.goto("/archive/");
  await expect(page.locator("main").getByRole("alert")).toContainText("불러오지 못했어요");
  await page.getByRole("button", { name: "다시 시도", exact: true }).click();
  await expect(page.locator(".edition-card")).toHaveCount(1);
  expect(calls).toBe(2);
});

test("save and delete deadlines preserve input and identity with unknown outcomes", async ({ page }) => {
  await accelerateRequestDeadlines(page);
  await page.addInitScript(() => window.localStorage.setItem("achim-gyeol-device-id", "unchanged-timeout-device"));
  await page.route("**/api/reader/preferences", route => {
    if (route.request().method() === "GET") return route.fulfill({ json: serverSettings });
    // Hold the mocked PUT until the browser's deadline; do not simulate a failure response.
  });
  await page.route("**/api/reader/data", () => { /* Hold the mocked DELETE too. */ });
  await page.goto("/preferences/");
  const sports = page.locator(".choice-grid").getByRole("button", { name: "스포츠", exact: true });
  await sports.click();
  await page.getByRole("button", { name: "설정 저장", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("반영 여부를 확인하지 못했어요");
  await expect(page.getByRole("button", { name: "설정 저장", exact: true })).toBeEnabled();
  await expect(sports).toHaveAttribute("aria-pressed", "false");
  page.once("dialog", dialog => dialog.accept());
  await page.getByRole("button", { name: "전체 데이터 삭제", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("삭제 여부를 확인하지 못했어요");
  await expect(page.getByRole("status")).not.toContainText("모두 삭제했습니다");
  await expect(page.getByRole("button", { name: "전체 데이터 삭제", exact: true })).toBeEnabled();
  await expect(sports).toHaveAttribute("aria-pressed", "false");
  expect(await page.evaluate(() => window.localStorage.getItem("achim-gyeol-device-id"))).toBe("unchanged-timeout-device");
  expect(await page.evaluate(() => window.localStorage.getItem("achim-gyeol-reader-preferences"))).not.toBeNull();
});

import { expect, test } from '@playwright/test';

function edition(count = 15) {
  return { id: 700, briefingDate: '2026-11-04', dateLabel: '11월 4일 수요일', productionReady: true, stories: Array.from({ length: count }, (_, index) => ({ id: 900 + index, title: `검증용 뉴스 ${index + 1}`, category: '경제', oneLineSummary: '검증용 핵심입니다.', summary: '검증용 전체 요약입니다. 두 번째 문장도 생략하지 않습니다.', plainExplanation: '검증용 쉬운 설명입니다.', backgroundContext: '검증용 배경입니다.', whyItMatters: '검증용 의미입니다.', sources: [{ publisher: '검증 출처', url: 'https://example.com/news' }], imageUrl: 'http://127.0.0.1:4173/og-v2.png', imagePublisher: '검증 이미지' })) };
}

test('whole daily letter keeps all15 stories and anchors never restart loading', async ({ page }) => {
  let requests = 0;
  await page.route('**/api/briefings/today', route => { requests++; return route.fulfill({ json: edition() }); });
  await page.route('**/api/reader/events', route => route.fulfill({ json: { recorded: true } }));
  await page.goto('/briefing/');
  await expect(page.locator('[data-story-id]')).toHaveCount(15);
  await page.locator('#mail-contents a').first().click();
  await expect(page).toHaveURL(/#news-900$/);
  await expect(page.locator('[data-story-id]')).toHaveCount(15);
  await page.locator('#news-900 a[href="#mail-contents"]').click();
  await expect(page).toHaveURL(/#mail-contents$/);
  await page.goBack();
  await expect(page).toHaveURL(/#news-900$/);
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
  await expect(page.locator('[data-story-id]')).toHaveCount(15);
  expect(requests).toBe(1);
  await expect(page.locator('#news-900')).toContainText('두 번째 문장도 생략하지 않습니다.');
});

test('few stories without sports still render in full on every product viewport', async ({ page }) => {
  await page.route('**/api/briefings/today', route => route.fulfill({ json: edition(2) }));
  for (const viewport of [{ width: 360, height: 800 }, { width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/briefing/');
    await expect(page.locator('[data-story-id]')).toHaveCount(2);
    await page.getByRole('button', { name: '큰 글자', exact: true }).click();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.locator('#news-900 img')).toHaveCSS('object-fit', 'contain');
    await expect(page.locator('#news-900 a[href="#mail-contents"]')).toHaveCSS('min-height', '44px');
  }
});

test('unavailable API displays no invented headlines and retry recovers', async ({ page }) => {
  let unavailable = true;
  await page.route('**/api/briefings/today', route => unavailable ? route.fulfill({ status: 503, json: {} }) : route.fulfill({ json: edition(1) }));
  await page.goto('/briefing/');
  await expect(page.getByRole('heading', { name: '뉴스를 불러오지 못했어요' })).toBeVisible();
  await expect(page.locator('[data-story-id]')).toHaveCount(0);
  unavailable = false;
  await page.getByRole('button', { name: '다시 불러오기' }).click();
  await expect(page.locator('[data-story-id]')).toHaveCount(1);
});

test('blocked storage never changes a successful API read into an error', async ({ page }) => {
  await page.addInitScript(() => { Storage.prototype.getItem = () => { throw new Error('blocked'); }; Storage.prototype.setItem = () => { throw new Error('blocked'); }; });
  await page.route('**/api/briefings/today', route => route.fulfill({ json: edition(1) }));
  await page.goto('/briefing/');
  await expect(page.locator('[data-story-id]')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: '뉴스를 불러오지 못했어요' })).toHaveCount(0);
});

test('requested date never silently shows a different edition', async ({ page }) => {
  await page.route('**/api/briefings/2026-11-03', route => route.fulfill({ json: edition(1) }));
  await page.goto('/briefing/?date=2026-11-03');
  await expect(page.getByRole('heading', { name: '뉴스를 불러오지 못했어요' })).toBeVisible();
  await expect(page.locator('[data-story-id]')).toHaveCount(0);
});

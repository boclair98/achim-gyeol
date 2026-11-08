import { expect, test } from '@playwright/test';

function edition(count = 29) {
  return {
    id: 700, briefingDate: '2026-11-04', dateLabel: '11월 4일 수요일', productionReady: true,
    stories: Array.from({ length: count }, (_, index) => ({
      id: 900 + index,
      title: '검증용 뉴스 ' + (index + 1) + (index === 27 ? ' e스포츠 결승' : ''),
      category: index === 27 ? 'e스포츠' : index % 4 === 2 ? '국제' : '경제',
      oneLineSummary: '검증용 핵심입니다.',
      summary: '검증용 전체 요약입니다. 두 번째 문장도 생략하지 않습니다.',
      plainExplanation: '검증용 쉬운 설명입니다.',
      backgroundContext: '검증용 배경입니다.',
      whyItMatters: '검증용 의미입니다.',
      sources: Array.from({ length: index === 27 ? 5 : index % 3 + 2 }, (_, source) => ({
        publisher: '검증 출처 ' + (source + 1), url: 'https://paper-' + source + '.example/news',
      })),
      imageUrl: 'http://127.0.0.1:4173/og-v2.png', imagePublisher: '검증 이미지',
    })),
  };
}

test('29-story edition keeps every headline accessible without mounting every article', async ({ page }) => {
  let requests = 0;
  await page.route('**/api/briefings/today', route => { requests++; return route.fulfill({ json: edition() }); });
  await page.goto('/briefing/');
  const rows = page.locator('[data-list-story]');
  await expect(rows).toHaveCount(12);
  await expect(page.locator('[data-story-id]')).toHaveCount(0);
  await expect(page.locator('#mail-contents').getByRole('status')).toContainText('29건');
  await page.getByRole('button', { name: /기사 더 보기/ }).click();
  await expect(rows).toHaveCount(24);
  await page.getByRole('button', { name: /기사 더 보기/ }).click();
  await expect(rows).toHaveCount(29);
  const last = page.locator('#list-story-928');
  await last.press('Enter');
  await expect(page).toHaveURL(/#news-928$/);
  await expect(page.locator('[data-story-id]')).toHaveCount(1);
  await expect(page.locator('#news-928')).toBeFocused();
  await expect(page.locator('#news-928')).toContainText('두 번째 문장도 생략하지 않습니다.');
  await expect(page.getByRole('link', { name: /원문 읽기/ }).first()).toHaveAttribute('href', 'https://paper-0.example/news');
  await page.getByRole('navigation', { name: '이전·다음 기사' }).getByRole('link', { name: /이전 기사/ }).click();
  await expect(page).toHaveURL(/#news-927$/);
  await expect(page.locator('#news-927')).toBeFocused();
  await page.getByRole('link', { name: '기사 목록', exact: true }).click();
  await expect(page).toHaveURL(/#mail-contents$/);
  await expect(rows).toHaveCount(29);
  await expect(last).toBeFocused();
  await expect(last).toContainText('읽음');
  await page.goBack();
  await expect(page).toHaveURL(/#news-927$/);
  await expect(page.locator('[data-story-id]')).toHaveCount(1);
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
  expect(requests).toBe(1);
});

test('search and category include stories beyond the first page and restore the filter on return', async ({ page }) => {
  await page.route('**/api/briefings/today', route => route.fulfill({ json: edition() }));
  await page.goto('/briefing/');
  await page.getByRole('combobox', { name: '기사 정렬' }).selectOption('sources');
  await expect(page.locator('[data-list-story]').first()).toHaveAttribute('data-list-story', '927');
  await page.getByRole('button', { name: 'e스포츠', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'e스포츠 기사' })).toBeVisible();
  await expect(page.locator('[data-list-story]')).toHaveCount(1);
  const search = page.getByRole('searchbox', { name: '기사 검색' });
  await search.fill('결승 뉴스');
  await expect(page.locator('[data-list-story]')).toHaveCount(1);
  await page.locator('#list-story-927').click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('e스포츠 결승');
  await page.getByRole('link', { name: '기사 목록', exact: true }).click();
  await expect(search).toHaveValue('결승 뉴스');
  await expect(page.getByRole('button', { name: 'e스포츠', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await search.fill('없는키워드');
  await expect(page.getByRole('heading', { name: '조건에 맞는 기사가 없어요' })).toBeVisible();
  await page.getByRole('button', { name: '전체 기사 보기', exact: true }).click();
  await expect(search).toBeFocused();
  await expect(search).toHaveValue('');
  await expect(page.locator('[data-list-story]')).toHaveCount(12);
});

test('two stories without sports remain readable at all four viewports', async ({ page }) => {
  await page.route('**/api/briefings/today', route => route.fulfill({ json: edition(2) }));
  for (const viewport of [{ width: 360, height: 800 }, { width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/briefing/');
    await expect(page.locator('[data-list-story]')).toHaveCount(2);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole('link', { name: '기사 읽기', exact: true }).click();
    await expect(page.locator('[data-story-id]')).toHaveCount(1);
    await page.getByRole('button', { name: '큰 글자', exact: true }).click();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.locator('#news-900 img')).toHaveCSS('object-fit', 'contain');
    await expect(page.getByRole('link', { name: '기사 목록', exact: true })).toHaveCSS('min-height', '44px');
  }
});

test('exact edition links open later articles directly and recover stale ids', async ({ page }) => {
  await page.route('**/api/briefings/2026-11-04', route => route.fulfill({ json: edition() }));
  await page.goto('/briefing/?date=2026-11-04#news-928');
  await expect(page.locator('#news-928')).toBeFocused();
  await expect(page.locator('[data-story-id]')).toHaveCount(1);
  await expect(page.locator('#news-928')).toContainText('29 / 29');
  await page.goto('/briefing/?date=2026-11-04#news-999');
  await expect(page.getByText('이 링크의 기사는 현재 편에서 찾을 수 없어요.', { exact: false })).toBeVisible();
  await expect(page.locator('[data-list-story]')).toHaveCount(12);
});

test('image errors leave the actual story and its sources readable', async ({ page }) => {
  await page.route('**/api/briefings/today', route => route.fulfill({ json: edition(1) }));
  await page.route('**/og-v2.png', route => route.fulfill({ status: 404, body: '' }));
  await page.goto('/briefing/');
  await page.getByRole('link', { name: '기사 읽기', exact: true }).click();
  await expect(page.locator('#news-900 img')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: '쉽게 읽기' })).toBeVisible();
  await expect(page.getByRole('link', { name: /원문 읽기/ }).first()).toBeVisible();
});

test('unavailable API displays no invented headlines and retry recovers', async ({ page }) => {
  let unavailable = true;
  await page.route('**/api/briefings/today', route => unavailable ? route.fulfill({ status: 503, json: {} }) : route.fulfill({ json: edition(1) }));
  await page.goto('/briefing/');
  await expect(page.getByRole('heading', { name: '뉴스를 불러오지 못했어요' })).toBeVisible();
  await expect(page.locator('[data-list-story]')).toHaveCount(0);
  unavailable = false;
  await page.getByRole('button', { name: '다시 불러오기' }).click();
  await expect(page.locator('[data-list-story]')).toHaveCount(1);
});

test('an offline read labels the actual cached edition', async ({ page }) => {
  let unavailable = false;
  await page.route('**/api/briefings/today', route => unavailable ? route.fulfill({ status: 503, json: {} }) : route.fulfill({ json: edition(2) }));
  await page.goto('/briefing/');
  await expect(page.locator('[data-list-story]')).toHaveCount(2);
  unavailable = true;
  await page.reload();
  await expect(page.getByText(/이 기기에 저장된 11월 4일 수요일 뉴스/)).toBeVisible();
  await expect(page.locator('[data-list-story]')).toHaveCount(2);
});

test('blocked storage never changes a successful API read into an error', async ({ page }) => {
  await page.addInitScript(() => { Storage.prototype.getItem = () => { throw new Error('blocked'); }; Storage.prototype.setItem = () => { throw new Error('blocked'); }; });
  await page.route('**/api/briefings/today', route => route.fulfill({ json: edition(1) }));
  await page.goto('/briefing/');
  await expect(page.locator('[data-list-story]')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: '뉴스를 불러오지 못했어요' })).toHaveCount(0);
});

test('requested date never silently shows a different edition', async ({ page }) => {
  await page.route('**/api/briefings/2026-11-03', route => route.fulfill({ json: edition(1) }));
  await page.goto('/briefing/?date=2026-11-03');
  await expect(page.getByRole('heading', { name: '뉴스를 불러오지 못했어요' })).toBeVisible();
  await expect(page.locator('[data-list-story]')).toHaveCount(0);
});

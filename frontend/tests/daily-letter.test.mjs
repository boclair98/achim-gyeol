import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { cachedLiveBriefing, distinctText, editionSourceCount, filterEditionStories, fragmentStoryId, parseLiveBriefing, safeNewsUrl, storyLead, validEditionDate } from '../lib/daily-letter.ts';

const story = { id: 9, category: '스포츠', title: '검사 기사', summary: '첫 문장입니다. 전체 맥락도 남습니다.', sources: [{ publisher: '검사 출처', url: 'https://example.com/news' }] };
const edition = { id: 7, dateLabel: '11월 4일 수요일', briefingDate: '2026-11-04', productionReady: true, stories: [story] };

test('live editions keep every story, complete prose, optional images and missing sports', () => {
  const many = { ...edition, stories: Array.from({ length: 29 }, (_, index) => ({ ...story, id: index + 1, category: '경제' })) };
  assert.deepEqual(parseLiveBriefing(many), many);
  assert.equal(parseLiveBriefing({ ...edition, stories: [] }).stories.length, 0);
});
test('malformed editions fail rather than turning into demo news', () => {
  for (const value of [null, {}, { ...edition, stories: null }, { ...edition, stories: [story, story] }, { ...edition, stories: [{ ...story, sources: [{}] }] }]) assert.throws(() => parseLiveBriefing(value));
});
test('cached fallback requires a genuine dated production edition', () => {
  assert.deepEqual(cachedLiveBriefing(JSON.stringify(edition)), edition);
  for (const value of ['bad', null, JSON.stringify({ ...edition, productionReady: false }), JSON.stringify({ ...edition, briefingDate: '2026-02-30' }), JSON.stringify({ ...edition, stories: [] })]) assert.equal(cachedLiveBriefing(value), null);
});
test('source and image URLs reject scripts, credentials and malformed values', () => {
  assert.equal(safeNewsUrl('https://example.com/a'), 'https://example.com/a');
  for (const value of ['javascript:alert(1)', 'data:text/html,test', 'https://name:password@example.com', '//example.com/a', '/local', 'bad']) assert.equal(safeNewsUrl(value), null);
});
test('calendar dates are validated, not normalized to a different day', () => {
  assert.equal(validEditionDate('2026-11-04'), true);
  assert.equal(validEditionDate('2024-02-29'), true);
  for (const value of ['2026-02-29', '2026-02-30', '2026-13-01', '../today', '2026-1-1', '']) assert.equal(validEditionDate(value), false);
});
test('lead is short but full original summary is not mutated', () => {
  assert.equal(storyLead(story), '첫 문장입니다.');
  assert.equal(storyLead({ ...story, oneLineSummary: '한 줄 핵심' }), '한 줄 핵심');
  assert.equal(story.summary, '첫 문장입니다. 전체 맥락도 남습니다.');
  assert.equal(distinctText('같은 내용', '같은\n내용'), false);
  assert.equal(distinctText('추가 맥락', '요약'), true);
});
test('source rank counts different linked domains and not copied URLs or subdomains', () => {
  const sources = ['https://www.paper.co.kr/news/1', 'https://m.paper.co.kr/news/2', 'https://another.co.kr/news', 'javascript:alert(1)'].map(url => ({ url, publisher: '출처' }));
  assert.equal(editionSourceCount({ ...story, sources }), 2);
  assert.equal(editionSourceCount({ ...story, sources, sourceCount: 99 }), 2);
  assert.equal(editionSourceCount({ ...story, sources, sourceCount: 2 }), 2);
});
test('search and source sorting operate on the full edition without changing its original order', () => {
  const stories = Array.from({ length: 27 }, (_, index) => ({ ...story, id: index + 1, category: '경제' }));
  const final = { ...story, id: 28, category: 'e스포츠', title: 'LCK 결승전', sources: [{ publisher: 'A', url: 'https://a.example/story' }, { publisher: 'B', url: 'https://b.example/story' }] };
  stories.push(final);
  assert.deepEqual(filterEditionStories(stories, { category: 'e스포츠', query: '  ｌｃｋ 결승 ', order: 'edition' }), [final]);
  assert.equal(filterEditionStories(stories, { category: '', query: '', order: 'sources' })[0].id, 28);
  assert.equal(filterEditionStories(stories, { category: '', query: '', order: 'edition' }).length, 28);
  assert.equal(stories[0].id, 1);
});
test('shared story fragments use positive safe integer IDs', () => {
  assert.equal(fragmentStoryId('#news-928'), 928);
  for (const value of ['', '#mail-contents', '#news-0', '#news--2', '#news-9007199254740992', '#news-%ZZ']) assert.equal(fragmentStoryId(value), null);
});
test('production route uses the live edition and preserves sharing and article actions', async () => {
  const route = await readFile(new URL('../app/briefing/page.tsx', import.meta.url), 'utf8');
  const reader = await readFile(new URL('../components/DailyBriefingLetter.tsx', import.meta.url), 'utf8');
  const index = await readFile(new URL('../components/NewsEditionIndex.tsx', import.meta.url), 'utf8');
  const css = await readFile(new URL('../components/DailyBriefingLetter.module.css', import.meta.url), 'utf8');
  assert.match(route, /DailyBriefingLetter/);
  assert.doesNotMatch(reader, /demoBriefing|archive-fixture|dangerouslySetInnerHTML|\.slice\(0,\s*\d+\)\.map/);
  assert.match(reader, /\/api\/briefings\/today/);
  assert.match(reader, /\/api\/stories\/\$\{story.id\}\/interest/);
  assert.match(reader, /\/api\/stories\/\$\{storyId\}\/feedback/);
  assert.match(index, /id="mail-contents"/);
  assert.match(reader, /href="#mail-contents"/);
  assert.match(reader, /if \(locationDate.current === requested\) return/);
  assert.match(css, /height: auto; object-fit: contain/);
  assert.doesNotMatch(css, /line-clamp|text-overflow:\s*ellipsis|(?:^|[;{])\s*height:\s*100vh/);
});

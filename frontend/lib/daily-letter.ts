import type { Briefing, Story } from './briefing';

export const lastLiveBriefingKey = 'achim-gyeol-last-live-briefing';
export const editionPageSize = 12;
export type EditionView = {
  category: string;
  query: string;
  order: 'edition' | 'sources';
  visible: number;
};
export const defaultEditionView: EditionView = {
  category: '', query: '', order: 'edition', visible: editionPageSize,
};

export function safeNewsUrl(value?: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

export function validEditionDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}

export function koreaToday(): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  return `${parts.find(part => part.type === 'year')?.value}-${parts.find(part => part.type === 'month')?.value}-${parts.find(part => part.type === 'day')?.value}`;
}

export function parseLiveBriefing(value: unknown): Briefing {
  if (!value || typeof value !== 'object') throw new Error('Invalid edition');
  const data = value as Briefing;
  if (!Number.isSafeInteger(data.id) || typeof data.dateLabel !== 'string' || !Array.isArray(data.stories)) throw new Error('Invalid edition');
  const ids = new Set<number>();
  for (const story of data.stories) {
    if (!Number.isSafeInteger(story.id) || ids.has(story.id) || typeof story.title !== 'string' || typeof story.summary !== 'string' || typeof story.category !== 'string' || !Array.isArray(story.sources)) throw new Error('Invalid story');
    if (story.sources.some(source => !source || typeof source.publisher !== 'string' || typeof source.url !== 'string')) throw new Error('Invalid source');
    ids.add(story.id);
  }
  return data;
}

export function cachedLiveBriefing(value: string | null): Briefing | null {
  try {
    const data = parseLiveBriefing(JSON.parse(value ?? 'null'));
    return data.productionReady === true && data.stories.length > 0 && !!data.briefingDate && validEditionDate(data.briefingDate) ? data : null;
  } catch { return null; }
}

export function storyLead(story: Story): string {
  return story.oneLineSummary?.trim() || story.summary.trim().split(/(?<=[.!?。])\s+/)[0] || story.title;
}

export function distinctText(value?: string | null, ...others: Array<string | null | undefined>): boolean {
  const normalize = (text?: string | null) => text?.replace(/\s+/g, '').trim() ?? '';
  const text = normalize(value);
  return !!text && !others.some(other => normalize(other) === text);
}

const koreanDomainSuffixes = new Set(['co.kr', 'or.kr', 'go.kr', 'ac.kr', 'ne.kr']);

// Older cached editions predate the additive sourceCount field. Count distinct
// linked domains for those editions too, not headlines, views, or search traffic.
export function editionSourceCount(story: Story): number {
  const supplied = story.sourceCount;
  if (typeof supplied === 'number' && Number.isSafeInteger(supplied) && supplied >= 0 && supplied <= story.sources.length) return supplied;
  const families = new Set<string>();
  for (const source of story.sources) {
    const href = safeNewsUrl(source.url);
    if (!href) continue;
    const parts = new URL(href).hostname.toLowerCase().replace(/^www\./, '').split('.');
    const suffix = parts.slice(-2).join('.');
    families.add(parts.slice(koreanDomainSuffixes.has(suffix) ? -3 : -2).join('.'));
  }
  return families.size;
}

export function filterEditionStories(stories: readonly Story[], view: Pick<EditionView, 'category' | 'query' | 'order'>): Story[] {
  const normalize = (value: string) => value.normalize('NFKC').toLowerCase();
  const tokens = normalize(view.query).trim().split(/\s+/).filter(Boolean);
  const matches = stories.filter(story => {
    if (view.category && story.category !== view.category) return false;
    if (!tokens.length) return true;
    const content = normalize([story.title, story.category, story.oneLineSummary, story.summary].join(' '));
    return tokens.every(token => content.includes(token));
  });
  return view.order === 'sources'
    ? matches.map(story => ({ story, count: editionSourceCount(story) })).sort((a, b) => b.count - a.count).map(item => item.story)
    : matches;
}

export function fragmentStoryId(fragment: string): number | null {
  const match = /^#news-(\d+)$/.exec(fragment);
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

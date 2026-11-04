import type { Briefing, Story } from './briefing';

export const lastLiveBriefingKey = 'achim-gyeol-last-live-briefing';

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

import { getCollection, type CollectionEntry } from 'astro:content';

export type Article = CollectionEntry<'clanky'>;

export const formatDate = (d: Date) =>
  d.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric', timeZone: 'Europe/Prague' });

export const isoDate = (d: Date) => d.toISOString();

export async function getArticles() {
  const all = await getCollection('clanky', ({ data }) => import.meta.env.DEV || !data.draft);
  return all.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

/** Odhad doby čtení (200 slov za minutu) */
export const readingTime = (body = '') => Math.max(1, Math.round(body.split(/\s+/).filter(Boolean).length / 200));

// Tematické skupiny pro automatické propojení souvisejících článků
const topics: Record<string, string[]> = {
  kastrace: ['kastrace', 'pooperacni', 'operac'],
  plazi: ['zelv', 'gekon'],
  paraziti: ['parazit', 'bravecto', 'koprolog', 'trus'],
  pes: ['psa', 'psu', 'psincov', 'zima', 'centralni-evidence', 'cipovani'],
  zuby: ['zubni', 'zub'],
  kocka: ['kock', 'kocour'],
};

const topicsOf = (slug: string) =>
  Object.entries(topics)
    .filter(([, words]) => words.some((w) => slug.includes(w)))
    .map(([t]) => t);

export function relatedArticles(current: Article, all: Article[], count = 3) {
  const manual = (current.data.related ?? [])
    .map((id) => all.find((a) => a.id === id))
    .filter((a): a is Article => Boolean(a));
  const mine = topicsOf(current.id);
  const scored = all
    .filter((a) => a.id !== current.id && !manual.includes(a))
    .map((a) => ({ a, score: topicsOf(a.id).filter((t) => mine.includes(t)).length }))
    .sort((x, y) => y.score - x.score || y.a.data.pubDate.valueOf() - x.a.data.pubDate.valueOf())
    .map((x) => x.a);
  return [...manual, ...scored].slice(0, count);
}

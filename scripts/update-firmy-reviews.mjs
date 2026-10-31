// Doplní nové recenze z Firmy.cz do src/data/reviews.json (spouští se jednou týdně, viz README).
//   npm run reviews:firmy            – stáhne stránku kliniky na Firmy.cz
//   npm run reviews:firmy -- soubor  – načte uloženou stránku (pro testování)
//
// Firmy.cz nemají API a bez přihlášení ukazují jen několik nejnovějších hodnocení, proto se recenze
// nepřepisují, ale postupně doplňují. Ukládáme jen 4+ hvězdičky s textem, nejvýš MAX_FIRMY recenzí.
// Přístup pro Claude povoluje robots.txt Firmy.cz (User-agent: Claude-User / ClaudeBot).

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const URL_FIRMY =
  'https://www.firmy.cz/detail/2290030-veterinarni-klinika-hloubetin-praha-hloubetin.html?sortReviews=newest';
const OUT = new URL('../src/data/reviews.json', import.meta.url);
const MIN_RATING = 4;
const MAX_FIRMY = 12;

const months = ['ledna', 'února', 'března', 'dubna', 'května', 'června', 'července', 'srpna', 'září', 'října', 'listopadu', 'prosince'];

const decode = (s) =>
  s
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();

// „6. září 2026“ → „06/09/2026“
const toDate = (cz) => {
  const m = cz.trim().match(/^(\d{1,2})\.\s*(\S+)\s+(\d{4})$/);
  if (!m) return null;
  const month = months.indexOf(m[2]) + 1;
  if (!month) return null;
  return `${m[1].padStart(2, '0')}/${String(month).padStart(2, '0')}/${m[3]}`;
};

export function parse(html) {
  return html
    .split('class="detailReview"')
    .slice(1)
    .map((block) => {
      const name = block.match(/class="authorName"><span>([^<]+)<\/span>/)?.[1];
      const full = (block.match(/ratingStar full/g) ?? []).length;
      const half = (block.match(/ratingStar half/g) ?? []).length;
      const date = block.match(/class="date subtle">([^<]+)</)?.[1];
      const comment = block.match(/class="comment">([\s\S]*?)<\/div>/)?.[1];
      const url = block.match(/class="author" href="([^"]+)"/)?.[1]?.replace(/&amp;/g, '&');
      // Odkaz pochází z cizí stránky – na web smí jen https
      const safeUrl = url?.startsWith('https://') ? url : undefined;
      return {
        name: name ? decode(name) : null,
        date: date ? toDate(date) : null,
        rating: full + (half ? 0.5 : 0),
        text: comment ? decode(comment) : '',
        url: safeUrl,
        source: 'firmy',
      };
    })
    .filter((r) => r.name && r.date);
}

async function main() {
  const file = process.argv[2];
  const html = file
    ? await readFile(file, 'utf8')
    : await fetch(URL_FIRMY, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Claude-User/1.0; +https://www.anthropic.com)' } }).then(
        (r) => {
          if (!r.ok) throw new Error(`Firmy.cz ${r.status}`);
          return r.text();
        },
      );

  const found = parse(html);
  if (found.length === 0) throw new Error('Na stránce Firmy.cz nebyla nalezena žádná recenze – změnila se struktura stránky?');

  const usable = found.filter((r) => r.rating >= MIN_RATING && r.text.length >= 3);
  const current = JSON.parse(await readFile(OUT, 'utf8'));
  const key = (r) => `${r.source ?? 'google'}|${r.name}|${r.date}`;
  const known = new Set(current.map(key));
  const added = usable.filter((r) => !known.has(key(r)));

  console.log(`Firmy.cz: na stránce ${found.length} recenzí, vhodných ${usable.length}, nových ${added.length}.`);
  if (added.length === 0) return;

  const toTime = (d) => {
    const [dd, mm, yy] = d.split('/').map(Number);
    return Date.UTC(yy, mm - 1, dd);
  };
  const firmy = [...current.filter((r) => r.source === 'firmy'), ...added]
    .sort((a, b) => toTime(b.date) - toTime(a.date))
    .slice(0, MAX_FIRMY);
  const next = [...current.filter((r) => r.source !== 'firmy'), ...firmy];
  await writeFile(OUT, JSON.stringify(next, null, 2) + '\n');
  added.forEach((r) => console.log(`+ ${r.date} ${r.name} (${r.rating} ★): ${r.text.slice(0, 60)}`));
}

// Při importu z testů se nic nestahuje ani nezapisuje
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}

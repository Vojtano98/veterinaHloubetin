// Kontrola sestaveného webu před nasazením (spouští se po buildu, viz README):
//   npm run check            – zkontroluje dist/
//   npm run check -- složka  – zkontroluje jinou složku
//
// Ověřuje interní odkazy a kotvy, jednu H1, title, description, canonical, strukturovaná data a hlavně režim
// indexace: meta robots ⇔ robots.txt ⇔ X-Robots-Tag v .htaccess. Indexaci očekává jen s PUBLIC_INDEXING=true
// (a bez PUBLIC_PREVIEW=1) – stejné pravidlo jako astro.config.mjs. S PUBLIC_SITE_URL ověří i doménu v canonical.
// Náhled na GitHub Pages: s BASE_PATH počítá s podsložkou v odkazech.
import fs from 'node:fs';
import path from 'node:path';

const dist = path.resolve(process.argv[2] || 'dist');
const base = (process.env.BASE_PATH || '').replace(/\/$/, '');
const expectIndex = process.env.PUBLIC_INDEXING === 'true' && process.env.PUBLIC_PREVIEW !== '1';
const expectedOrigin = process.env.PUBLIC_SITE_URL;

const errors = [];
const fail = (msg) => errors.push(msg);
const read = (name) => (fs.existsSync(path.join(dist, name)) ? fs.readFileSync(path.join(dist, name), 'utf8') : null);

if (!fs.existsSync(path.join(dist, 'index.html'))) {
  console.error(`Ve složce ${dist} není sestavený web – nejdřív spusťte npm run build.`);
  process.exit(1);
}

const files = [];
(function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p);
    else files.push(p);
  }
})(dist);

// Stránky podle adresy: /kontakty/ → HTML
const pages = new Map(
  files
    .filter((f) => f.endsWith('.html'))
    .map((f) => ['/' + path.relative(dist, f).split(path.sep).join('/').replace(/index\.html$/, ''), fs.readFileSync(f, 'utf8')]),
);

const match = (html, re) => html.match(re)?.[1];
const metaRobots = (html) => match(html, /<meta name="robots" content="([^"]*)"/) ?? '';
const idsOf = new Map([...pages].map(([url, html]) => [url, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]))]));

// ---------- Režim indexace ----------
const indexed = metaRobots(pages.get('/')).startsWith('index');
const robotsLines = (read('robots.txt') ?? '').split('\n').map((l) => l.trim());
const htaccess = read('.htaccess');
const xRobots = /X-Robots-Tag/i.test(htaccess ?? '');

if (indexed !== expectIndex) {
  fail(
    `Režim indexace: web je ${indexed ? 'INDEXOVATELNÝ' : 'noindex'}, ale podle proměnných se čeká ${expectIndex ? 'indexace' : 'noindex'}` +
      ' (indexace jen s PUBLIC_INDEXING=true při ostrém spuštění)',
  );
}
if (!read('robots.txt')) fail('chybí robots.txt');
else if (indexed) {
  if (!robotsLines.includes('Allow: /') || robotsLines.includes('Disallow: /')) fail('robots.txt nepovoluje procházení, ačkoli stránky jsou indexovatelné');
  if (!robotsLines.some((l) => l.startsWith('Sitemap: '))) fail('robots.txt neodkazuje na sitemapu');
} else if (!robotsLines.includes('Disallow: /') || robotsLines.includes('Allow: /')) {
  fail('robots.txt nezakazuje procházení celého webu, ačkoli stránky jsou noindex');
}
if (htaccess !== null && xRobots === indexed) {
  fail(indexed ? '.htaccess obsahuje X-Robots-Tag – ostrý web by se neindexoval' : '.htaccess neobsahuje X-Robots-Tag: noindex');
}

// ---------- Stránky ----------
const origins = new Set();
let links = 0;
let anchors = 0;

const stripBase = (url) => (base && url.startsWith(base + '/') ? url.slice(base.length) : url);
const exists = (p) => {
  const f = path.join(dist, decodeURIComponent(p));
  return (fs.existsSync(f) && fs.statSync(f).isFile()) || fs.existsSync(path.join(f, 'index.html'));
};

for (const [url, html] of pages) {
  const is404 = url === '/404.html';
  const robots = metaRobots(html);
  if (!robots) fail(`${url}: chybí meta robots`);
  else if (!robots.startsWith(indexed && !is404 ? 'index' : 'noindex')) fail(`${url}: meta robots „${robots}“ neodpovídá režimu webu`);

  const h1 = (html.match(/<h1\b/g) ?? []).length;
  if (h1 !== 1) fail(`${url}: ${h1}× H1, má být právě jedna`);
  if (!match(html, /<title>([^<]+)<\/title>/)?.trim()) fail(`${url}: chybí title`);
  if (!match(html, /<meta name="description" content="([^"]+)"/)?.trim()) fail(`${url}: chybí meta description`);

  const canonical = match(html, /<link rel="canonical" href="([^"]+)"/);
  if (is404) {
    if (canonical) fail('/404.html: stránka 404 nemá mít canonical');
  } else if (!canonical) {
    fail(`${url}: chybí canonical`);
  } else {
    const c = new URL(canonical);
    origins.add(c.origin);
    if (c.pathname !== url) fail(`${url}: canonical míří na ${canonical}`);
  }

  if (/<link rel="sitemap"/.test(html) !== indexed) fail(`${url}: odkaz na sitemapu ${indexed ? 'chybí' : 'nemá být (web je noindex)'}`);

  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      JSON.parse(m[1]);
    } catch {
      fail(`${url}: neplatný JSON-LD`);
    }
  }

  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const dup = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
  if (dup.length) fail(`${url}: duplicitní id ${dup.join(', ')}`);

  // Interní odkazy (href, src, action, srcset) a kotvy
  const refs = [
    ...[...html.matchAll(/\s(?:href|src|action)="([^"]+)"/g)].map((m) => m[1]),
    ...[...html.matchAll(/\ssrcset="([^"]+)"/g)].flatMap((m) => m[1].split(',').map((s) => s.trim().split(/\s+/)[0])),
  ];
  for (const ref of refs) {
    if (/^(https?:|mailto:|tel:|data:|\/\/)/.test(ref)) continue;
    if (ref.startsWith('#')) {
      anchors++;
      if (ref.length > 1 && !idsOf.get(url).has(decodeURIComponent(ref.slice(1)))) fail(`${url}: kotva ${ref} na stránce neexistuje`);
      continue;
    }
    if (!ref.startsWith('/')) continue;
    links++;
    if (base && !ref.startsWith(base + '/')) {
      fail(`${url}: odkaz ${ref} bez podsložky náhledu ${base}`);
      continue;
    }
    const [target, hash] = stripBase(ref).split('#');
    const p = target.split('?')[0];
    if (!exists(p)) {
      fail(`${url}: odkaz na neexistující ${ref}`);
      continue;
    }
    if (!/\.[a-z0-9]{2,5}$/i.test(p) && !p.endsWith('/')) fail(`${url}: odkaz ${ref} bez lomítka na konci (zbytečné přesměrování)`);
    if (hash) {
      anchors++;
      const ids = idsOf.get(p);
      if (ids && !ids.has(decodeURIComponent(hash))) fail(`${url}: kotva ${ref} na cílové stránce neexistuje`);
    }
  }
}

if (origins.size > 1) fail(`canonical míří na různé domény: ${[...origins].join(', ')}`);
const origin = [...origins][0];
if (expectedOrigin && origin !== expectedOrigin) fail(`canonical míří na ${origin}, PUBLIC_SITE_URL je ${expectedOrigin}`);

// ---------- Sitemapa (jen při indexaci) ----------
if (indexed) {
  const sitemaps = fs.readdirSync(dist).filter((n) => /^sitemap-\d+\.xml$/.test(n));
  if (!read('sitemap-index.xml') || !sitemaps.length) fail('chybí sitemapa');
  for (const name of sitemaps) {
    for (const [, loc] of read(name).matchAll(/<loc>([^<]+)<\/loc>/g)) {
      const u = new URL(loc);
      if (u.origin !== origin) fail(`${name}: adresa ${loc} je na jiné doméně než canonical`);
      else if (!pages.has(u.pathname)) fail(`${name}: adresa ${loc} nemá stránku`);
    }
  }
}

// ---------- Výsledek ----------
console.log(`Kontrola ${path.relative(process.cwd(), dist) || dist}: ${pages.size} stránek, ${links} interních odkazů, ${anchors} kotev`);
console.log(`  indexace: ${indexed ? 'ZAPNUTÁ' : 'vypnutá (noindex)'} · adresa webu: ${origin ?? '–'}`);
if (errors.length) {
  console.error(`\n${errors.length} ${errors.length === 1 ? 'chyba' : errors.length < 5 ? 'chyby' : 'chyb'}:`);
  errors.slice(0, 50).forEach((e) => console.error('  - ' + e));
  if (errors.length > 50) console.error(`  … a dalších ${errors.length - 50}`);
  process.exit(1);
}
console.log('  vše v pořádku');

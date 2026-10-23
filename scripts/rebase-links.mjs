// Po sestavení náhledu pro GitHub Pages přidá podsložku (BASE_PATH) ke všem
// odkazům začínajícím „/“, které Astro samo neupravilo (menu, odkazy v článcích…).
// Produkční build na WEDOS tento skript nepoužívá.
import fs from 'node:fs';
import path from 'node:path';

const base = (process.env.BASE_PATH || '').replace(/\/$/, '');
if (!base) {
  console.log('BASE_PATH není nastavená – nic neměním.');
  process.exit(0);
}

const dist = path.resolve('dist');
const files = [];
(function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (/\.(html|css|xml|txt)$/.test(name)) files.push(p);
  }
})(dist);

const prefix = (url) => (url.startsWith(base + '/') || url === base ? url : base + url);

for (const file of files) {
  let s = fs.readFileSync(file, 'utf8');
  const before = s;
  // href="/…", src="/…", action="/…"
  s = s.replace(/\b(href|src|action|content)="(\/(?!\/)[^"]*)"/g, (m, attr, url) =>
    attr === 'content' && !url.startsWith('/_astro') ? m : `${attr}="${prefix(url)}"`,
  );
  // srcset="/a.webp 400w, /b.webp 800w"
  s = s.replace(/\bsrcset="([^"]*)"/g, (_, v) =>
    `srcset="${v.replace(/(^|,\s*)(\/(?!\/)[^\s,]+)/g, (m, sep, url) => sep + prefix(url))}"`,
  );
  // url(/…) v CSS a inline stylech
  s = s.replace(/url\((['"]?)(\/(?!\/)[^)'"]+)\1\)/g, (_, q, url) => `url(${q}${prefix(url)}${q})`);
  if (s !== before) fs.writeFileSync(file, s);
}

// Náhled nesmí indexovat vyhledávače
fs.writeFileSync(path.join(dist, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
console.log(`Odkazy upraveny pro ${base} (${files.length} souborů).`);

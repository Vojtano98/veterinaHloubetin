import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import fs from 'node:fs';
import path from 'node:path';

// Adresa webu – jediné místo, odkud se berou canonical, sitemapa, OG obrázky a strukturovaná data
// (src/data/site.ts ji přebírá z import.meta.env.SITE). Jiná adresa se zadá proměnnou PUBLIC_SITE_URL.
const DEFAULT_SITE_URL = 'https://veterinahloubetin.cz';

// Indexace vyhledávači se zapíná jen výslovně při ostrém spuštění: PUBLIC_INDEXING=true (jiná hodnota = vypnuto).
// Náhled na GitHub Pages (PUBLIC_PREVIEW=1) se neindexuje nikdy. Bez indexace: meta robots noindex,
// robots.txt „Disallow: /“ a hlavička X-Robots-Tag v .htaccess (chrání i PDF a obrázky).
// Proměnné se zadávají v příkazu (viz README), soubor .env se pro ně nepoužívá.
const isPreview = process.env.PUBLIC_PREVIEW === '1';
const indexing = process.env.PUBLIC_INDEXING === 'true' && !isPreview;

if (indexing && !process.env.PUBLIC_SITE_URL) {
  throw new Error('PUBLIC_INDEXING=true vyžaduje i PUBLIC_SITE_URL – při ostrém spuštění musí být adresa webu zadaná výslovně.');
}
const siteUrl = process.env.PUBLIC_SITE_URL || DEFAULT_SITE_URL;
if (!/^https:\/\/[a-z0-9.-]+$/i.test(siteUrl)) {
  throw new Error(`PUBLIC_SITE_URL musí mít tvar https://domena.cz (bez cesty a lomítka na konci), zadáno: ${siteUrl}`);
}
if (process.env.PUBLIC_INDEXING && !indexing) {
  console.warn(`[indexace] PUBLIC_INDEXING=${process.env.PUBLIC_INDEXING} se ignoruje${isPreview ? ' (náhled se neindexuje)' : ' (indexaci zapíná jen hodnota true)'}.`);
}
console.log(indexing ? `[indexace] ZAPNUTÁ – ${siteUrl}` : `[indexace] vypnutá (noindex) – ${siteUrl}`);

// Bez indexace přidá do dist/.htaccess hlavičku X-Robots-Tag (při ostrém spuštění tam nesmí být)
const noindexHeader = {
  name: 'noindex-htaccess',
  hooks: {
    'astro:build:done': ({ dir }) => {
      if (indexing) return;
      fs.appendFileSync(
        new URL('.htaccess', dir),
        '\n# ---------- Neindexovat (build bez PUBLIC_INDEXING=true) ----------\n' +
          '<IfModule mod_headers.c>\n  Header always set X-Robots-Tag "noindex, nofollow"\n</IfModule>\n',
      );
    },
  },
};

// Staré adresy obrázků z WordPressu (Google Obrázky, odkazy z jiných webů) dál fungují: originály zůstávají ve wp-content/uploads
const wpUploads = {
  name: 'wp-uploads',
  hooks: {
    'astro:build:done': ({ dir }) => {
      fs.cpSync('./src/assets/uploads', new URL('wp-content/uploads', dir), { recursive: true });
    },
  },
};

// Datum poslední změny článků pro <lastmod> v sitemapě (z frontmatteru)
const articleDates = Object.fromEntries(
  fs
    .readdirSync('./src/content/clanky')
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const src = fs.readFileSync(path.join('./src/content/clanky', f), 'utf8');
      const date = src.match(/^updatedDate:\s*(.+)$/m)?.[1] ?? src.match(/^pubDate:\s*(.+)$/m)?.[1];
      return [`/${f.replace(/\.md$/, '')}/`, date ? new Date(date).toISOString() : undefined];
    }),
);

// Náhled na GitHub Pages běží v podsložce (např. /veterinaHloubetin/), produkce v kořeni domény
const base = process.env.BASE_PATH || '/';

export default defineConfig({
  site: siteUrl,
  base,
  // Zachováváme URL ve tvaru /stranka/ jako na původním WordPressu
  trailingSlash: 'always',
  build: {
    format: 'directory',
    inlineStylesheets: 'auto',
  },
  integrations: [
    sitemap({
      serialize(item) {
        const lastmod = articleDates[new URL(item.url).pathname];
        return lastmod ? { ...item, lastmod } : item;
      },
    }),
    noindexHeader,
    wpUploads,
  ],
  vite: {
    // Režim indexace pro stránky a robots.txt (src/lib/indexing.ts) – stejná hodnota jako pro .htaccess výše
    define: { __INDEXING__: JSON.stringify(indexing) },
  },
  devToolbar: { enabled: false },
  image: {
    responsiveStyles: true,
  },
});

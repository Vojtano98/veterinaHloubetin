import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import fs from 'node:fs';
import path from 'node:path';

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
  site: 'https://veterinahloubetin.cz',
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
  ],
  devToolbar: { enabled: false },
  image: {
    responsiveStyles: true,
  },
});

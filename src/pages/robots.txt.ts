import type { APIRoute } from 'astro';
import { indexing } from '../lib/indexing';

// robots.txt podle režimu indexace: bez výslovného PUBLIC_INDEXING=true zakazuje procházení celého webu
export const GET: APIRoute = () => {
  const body = indexing
    ? [
        '# Veterinární klinika Hloubětín',
        '# Obsah je otevřený pro vyhledávače i AI asistenty (Google, Bing, ChatGPT, Perplexity, Claude…)',
        'User-agent: *',
        'Allow: /',
        'Disallow: /odeslat.php',
        '',
        `Sitemap: ${new URL('/sitemap-index.xml', import.meta.env.SITE).href}`,
      ]
    : ['# Web zatím není spuštěný – neindexovat', 'User-agent: *', 'Disallow: /'];
  return new Response(body.join('\n') + '\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};

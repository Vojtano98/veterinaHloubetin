import type { APIRoute } from 'astro';
import { indexing } from '../lib/indexing';

const aiBots = [
  'OAI-SearchBot',
  'ChatGPT-User',
  'GPTBot',
  'ClaudeBot',
  'Claude-SearchBot',
  'Claude-User',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot-Extended',
];

// robots.txt podle režimu indexace: bez výslovného PUBLIC_INDEXING=true zakazuje procházení celého webu
export const GET: APIRoute = () => {
  const body = indexing
    ? [
        '# Veterinární klinika Hloubětín',
        '# Obsah je otevřený pro vyhledávače i AI asistenty',
        `# Stručný přehled webu pro AI asistenty: ${new URL('/llms.txt', import.meta.env.SITE).href}`,
        '',
        'User-agent: *',
        'Allow: /',
        'Disallow: /odeslat.php',
        '',
        '# Výslovné povolení AI robotů. Pojmenovaná skupina nepřebírá pravidla z *, proto se opakují.',
        ...aiBots.map((bot) => `User-agent: ${bot}`),
        'Allow: /',
        'Disallow: /odeslat.php',
        '',
        `Sitemap: ${new URL('/sitemap-index.xml', import.meta.env.SITE).href}`,
      ]
    : ['# Web zatím není spuštěný – neindexovat', 'User-agent: *', 'Disallow: /'];
  return new Response(body.join('\n') + '\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};

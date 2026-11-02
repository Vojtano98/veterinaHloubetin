import type { APIRoute } from 'astro';
import { getArticles } from '../lib/articles';
import { services } from '../data/services';
import { site } from '../data/site';

const url = (path: string) => `${site.url}${path}`;
const oneLine = (text: string) => text.replace(/\s+/g, ' ').trim();

// Přehled webu pro AI asistenty (formát llmstxt.org): vzniká z dat webu, takže nemůže zastarat jinak než stránky
export const GET: APIRoute = async () => {
  const articles = await getArticles();
  const body = [
    `# ${site.name}`,
    '',
    `> ${site.description}`,
    '',
    `- Adresa: ${site.address.full} (${site.address.note})`,
    `- Telefon: ${site.phones.main.label}`,
    `- E-mail: ${site.email}`,
    `- Otevírací doba: ${site.hours.map((h) => `${h.days} ${h.time}`).join(', ')}`,
    `- Provozovatel: ${site.company}, IČO ${site.ico}`,
    '',
    '## Hlavní stránky',
    '',
    `- [Rezervace služeb](${url('/rezervace-sluzeb/')}): online rezervace termínu`,
    `- [Ceník](${url('/cenik-zakroku-a-vysetreni/')}): ceny zákroků a vyšetření`,
    `- [Kontakty](${url('/kontakty/')}): adresa, telefon, otevírací doba a kontaktní formulář`,
    `- [Články](${url('/clanky/')}): rady pro majitele zvířat`,
    '',
    '## Služby',
    '',
    ...services.map((s) => `- [${s.title}](${url(`/#${s.id}`)}): ${s.items.join('; ')}`),
    '',
    '## Články',
    '',
    ...articles.map((a) => `- [${a.data.title}](${url(`/${a.id}/`)}): ${oneLine(a.data.summary ?? a.data.description)}`),
    '',
    '## Optional',
    '',
    `- [Ochrana osobních údajů](${url('/ochrana-osobnich-udaju/')})`,
    `- [Facebook](${site.social.facebook})`,
    `- [Instagram](${site.social.instagram})`,
    `- [Firmy.cz](${site.firmyCz})`,
  ];
  return new Response(body.join('\n') + '\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};

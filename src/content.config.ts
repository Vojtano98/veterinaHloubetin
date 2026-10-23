import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const clanky = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/clanky' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      // Titulek do <title> a výsledků vyhledávání, pokud se liší od nadpisu H1
      seoTitle: z.string().optional(),
      description: z.string().default(''),
      // Perex pro výpis článků (když chybí, použije se description)
      excerpt: z.string().optional(),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      cover: image(),
      heroImage: image().optional(),
      heroAlt: z.string().optional(),
      // Autor a odborný garant – vyplňovat jen skutečné, ověřené údaje (klíč z src/data/team.ts)
      author: z.string().optional(),
      reviewedBy: z.string().optional(),
      // Ručně vybrané související články (slugy); jinak se doplní automaticky
      related: z.array(z.string()).optional(),
      // Odkazy na služby, ke kterým se článek vztahuje (zobrazí výzvu k objednání)
      cta: z.enum(['rezervace', 'telefon', 'zadna']).default('rezervace'),
      // Shrnutí pod nadpisem a časté otázky (SEO/GEO). Na produkci se zobrazí,
      // až když je veterinář schválí (aiContentApproved: true). Ve vývoji se ukazují jako návrh.
      summary: z.string().optional(),
      faq: z.array(z.object({ q: z.string(), a: z.string() })).optional(),
      aiContentApproved: z.boolean().default(false),
      draft: z.boolean().default(false),
    }),
});

const stranky = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/stranky' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
  }),
});

export const collections = { clanky, stranky };

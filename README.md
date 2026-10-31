# Veterinární klinika Hloubětín – web

Nový web [veterinahloubetin.cz](https://veterinahloubetin.cz) postavený na [Astro](https://astro.build) (statické HTML)
a malém PHP skriptu pro kontaktní formulář. Nahrazuje původní WordPress + Divi, vzhled, obsah i URL adresy zůstávají.

## Spuštění

```bash
npm install
npm run dev       # vývoj na http://localhost:4321
npm run build     # výstup do složky dist/
npm run preview   # náhled sestaveného webu
npm run typecheck # typová kontrola (astro check)
npm test          # testy mimořádných časů a otevírací doby (tests/)
npm run check     # kontrola sestaveného webu v dist/: odkazy, kotvy, H1, canonical, režim indexace
```

Na GitHubu se všechny kontroly spouští před každým nasazením náhledu – když některá selže, náhled se nenasadí.
Chybně zapsaná výjimka v `site.ts` (tvar data, letní/zimní čas, pořadí časů) zastaví build s popisem chyby.

## Kde co upravit

| Co | Soubor |
| --- | --- |
| Telefony, e-mail, adresa, otevírací doba, mimořádné časy (`vyjimky`), sociální sítě, GTM, CookieYes, Reservanto | `src/data/site.ts` |
| Ceník | `src/data/cenik.ts` |
| Služby na úvodní stránce | `src/data/services.ts` |
| Tým (lékaři, sestry, fotky) | `src/data/team.ts` |
| Recenze z Google a Firmy.cz (viz níže) | `src/data/reviews.json` |
| Články | `src/content/clanky/*.md` (jeden soubor = jeden článek, název souboru = URL) |
| Ochrana osobních údajů | `src/content/stranky/ochrana-osobnich-udaju.md` |
| Barvy, fonty, základní styly | `src/styles/global.css` |
| Přesměrování, cache, HTTPS | `public/.htaccess` |
| Indexace a adresa webu (viz níže) | `astro.config.mjs`, `src/lib/indexing.ts`, `src/pages/robots.txt.ts` |
| Kontaktní formulář (odeslání e-mailu) | `public/odeslat.php` |
| Kontrola polí formuláře v prohlížeči (stejná pravidla jako PHP) | `src/lib/kontaktni-formular.ts` |

### Nový článek

Vytvořte `src/content/clanky/nazev-clanku.md`:

```markdown
---
title: "Nadpis článku (H1)"
description: "Popis pro Google, cca 140–160 znaků."
excerpt: "Volitelný perex do výpisu článků."
pubDate: 2026-10-23
cover: "../../assets/uploads/2026/10/nahled.webp"     # náhled ve výpisu (8:5)
heroImage: "../../assets/uploads/2026/10/hlavni.webp" # obrázek v článku
author: helena-pavelkova        # volitelné – id z src/data/team.ts
reviewedBy: petr-skubal         # volitelné – odborný garant
related: [kastrace-psa-vse-co-potrebujete-vedet]      # volitelné
---

Text článku v Markdownu…
```

Obrázky se při sestavení automaticky zmenší a převedou do WebP. Markdown je jen zdrojový formát –
na web se publikuje výhradně vygenerované HTML.

## Recenze

Všechny recenze jsou v `src/data/reviews.json`; na webu se zobrazují jen 4 a 5 hvězdiček.

- **Firmy.cz** – jednou týdně je doplňuje `npm run reviews:firmy` (`scripts/update-firmy-reviews.mjs`).
  Firmy.cz nemají API a bez přihlášení ukazují jen pár nejnovějších hodnocení, proto se recenze
  postupně doplňují (nejvýš 12 nejnovějších, jen s textem). Položky mají `"source": "firmy"`.
- **Google** – doplňují se ručně (položky bez `source`). Automaticky jen přes placené Places API,
  kopírování z Map Google podmínky nedovolují.

## Indexace a adresa webu

Web je ve výchozím stavu **neindexovatelný**. Indexace se zapíná jen výslovně při ostrém spuštění.
Proměnné se zadávají přímo v příkazu (soubor `.env` se pro ně nepoužívá):

| Proměnná | Význam |
| --- | --- |
| `PUBLIC_INDEXING` | jen hodnota `true` povolí indexaci. Jinak má každá stránka `noindex, nofollow`, `robots.txt` zakazuje celý web a `dist/.htaccess` posílá hlavičku `X-Robots-Tag: noindex` (i pro PDF a obrázky) |
| `PUBLIC_SITE_URL` | adresa webu ve tvaru `https://domena.cz` – canonical, sitemapa, OG obrázky, strukturovaná data. Bez ní se použije `https://veterinahloubetin.cz` (`astro.config.mjs`); s `PUBLIC_INDEXING=true` je povinná |
| `PUBLIC_PREVIEW` | `1` = náhled na GitHub Pages: bez GTM a CookieYes, bez sitemapy, nikdy se neindexuje |

Režim vypíše build hned na začátku: `[indexace] vypnutá (noindex)` nebo `[indexace] ZAPNUTÁ – https://…`.
Přesměrování v `public/.htaccess` berou doménu z požadavku, adresa webu je tak jen v `astro.config.mjs`.

## Nasazení na WEDOS

Hosting musí mít **PHP 8.1+** (kvůli `odeslat.php`). Web leží ve složce `www/domains/veterinahloubetin.cz/`, obsah `dist/`
(včetně skrytého `.htaccess`) se nahrává tam přes FTP. Soubor `www/.htaccess` patří hostingu a směruje do této složky, **nepřepisovat**.

**Testovací nasazení** do `www/domains/test.veterinahloubetin.cz/` (neindexované, výchozí):

```bash
npm run build
```

**Ostré spuštění** – jen podle [MIGRATION_CHECKLIST.md](MIGRATION_CHECKLIST.md), indexace se zapíná výslovně:

```bash
PUBLIC_SITE_URL=https://veterinahloubetin.cz PUBLIC_INDEXING=true npm run build
```

Před nahráním spusťte kontrolu se stejnými proměnnými – ověří mimo jiné, že web je opravdu indexovatelný
(`robots.txt` s `Allow: /`, `.htaccess` bez `X-Robots-Tag`, canonical a sitemapa na správné doméně):

```bash
PUBLIC_SITE_URL=https://veterinahloubetin.cz PUBLIC_INDEXING=true npm run check
```

Formulář:

1. Volitelně vytvořte vedle `odeslat.php` soubor `odeslat.config.php` a přepište výchozí nastavení:

```php
<?php
return [
    'to'   => 'ordinace@veterinahloubetin.cz',
    'from' => 'ordinace@veterinahloubetin.cz', // schránka na doméně webu
];
```

2. Po nasazení odešlete zkušební zprávu z formuláře na `/kontakty/` a ověřte doručení.
3. Až po ostrém spuštění: v Google Search Console odešlete `https://veterinahloubetin.cz/sitemap-index.xml`.

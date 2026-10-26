# Veterinární klinika Hloubětín – web

Nový web [veterinahloubetin.cz](https://veterinahloubetin.cz) postavený na [Astro](https://astro.build) (statické HTML)
a malém PHP skriptu pro kontaktní formulář. Nahrazuje původní WordPress + Divi, vzhled, obsah i URL adresy zůstávají.

## Spuštění

```bash
npm install
npm run dev       # vývoj na http://localhost:4321
npm run build     # výstup do složky dist/
npm run preview   # náhled sestaveného webu
```

## Kde co upravit

| Co | Soubor |
| --- | --- |
| Telefony, e-mail, adresa, otevírací doba, mimořádné časy (`vyjimky`), sociální sítě, GTM, CookieYes, Reservanto | `src/data/site.ts` |
| Ceník | `src/data/cenik.ts` |
| Služby na úvodní stránce | `src/data/services.ts` |
| Tým (lékaři, sestry, fotky) | `src/data/team.ts` |
| Recenze z Google (aktualizují se samy, viz níže) | `src/data/reviews.json` |
| Články | `src/content/clanky/*.md` (jeden soubor = jeden článek, název souboru = URL) |
| Ochrana osobních údajů | `src/content/stranky/ochrana-osobnich-udaju.md` |
| Barvy, fonty, základní styly | `src/styles/global.css` |
| Přesměrování, cache, HTTPS | `public/.htaccess` |
| Kontaktní formulář (odeslání e-mailu) | `public/odeslat.php` |

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

## Recenze z Google (automaticky jednou týdně)

Každé pondělí ráno spustí GitHub Actions (`.github/workflows/reviews.yml`) skript
`scripts/update-google-reviews.mjs`. Ten přes Google Places API (New) stáhne aktuální recenze,
ponechá jen 4 a 5 hvězdiček a přepíše `src/data/reviews.json`. Když se recenze změní, uloží je
do repozitáře a spustí nové sestavení webu.

- Google vrací nejvýš 5 recenzí (vybírá je sám) a podle jeho pravidel se nesmí ukládat natrvalo,
  proto se soubor pokaždé přepíše aktuální várkou.
- Když API nevrátí žádnou vhodnou recenzi nebo nastane chyba, soubor zůstane beze změny.

Nastavení (jednorázově, v repozitáři na GitHubu → Settings → Secrets and variables → Actions):

1. **Secret** `GOOGLE_PLACES_API_KEY` – API klíč s povoleným „Places API (New)“.
2. **Variable** `GOOGLE_PLACE_ID` – volitelné; když chybí, skript provozovnu najde sám a ID vypíše do logu.

Ruční spuštění: na GitHubu Actions → „Aktualizace Google recenzí“ → Run workflow,
nebo lokálně `GOOGLE_PLACES_API_KEY=… npm run reviews`.

## Nasazení na WEDOS

1. `npm run build`
2. Obsah složky `dist/` (včetně skrytého `.htaccess`) nahrajte do kořene webu (`www/`) přes FTP/SFTP.
3. Hosting musí mít **PHP 8.1+** (kvůli `odeslat.php`).
4. Volitelně vytvořte vedle `odeslat.php` soubor `odeslat.config.php` a přepište výchozí nastavení:

```php
<?php
return [
    'to'   => 'ordinace@veterinahloubetin.cz',
    'from' => 'ordinace@veterinahloubetin.cz', // schránka na doméně webu
];
```

5. Po nasazení odešlete zkušební zprávu z formuláře na `/kontakty/` a ověřte doručení.
6. V Google Search Console odešlete `https://veterinahloubetin.cz/sitemap-index.xml`.

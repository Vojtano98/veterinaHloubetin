# Checklist migrace na finální doménu

Navazuje na [AUDIT.md](AUDIT.md) a [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md).
Stav k 27. 10. 2026: nový web běží jen jako náhled na GitHub Pages (`noindex`), na `veterinahloubetin.cz` je stále WordPress.

**Ověřená výchozí situace**

- Produkční hostitel je dnes `https://veterinahloubetin.cz` **bez www**: `www.` přesměrovává na hostitele bez www
  a canonical WordPressu je bez www. Nový web používá stejného hostitele → nemění se adresa webu, jen technologie.
- Sitemapa WordPressu (Yoast) obsahuje 23 adres. Nový web má pro všech 23 stránku nebo 301 přesměrování.
- Od 27. 10. 2026 (etapa 0) je každý build ve výchozím stavu neindexovatelný. Indexaci zapne jen `PUBLIC_INDEXING=true`
  spolu s `PUBLIC_SITE_URL`; náhled na GitHub Pages se neindexuje nikdy.

Značky: ☐ = udělat · **[teď]** = lze připravit už teď · **[spuštění]** = jen při ostrém spuštění · **[klinika]** = rozhoduje/dodává klinika

---

## A. Co lze připravit už teď

| | Úkol | Kde | Stav |
| --- | --- | --- | --- |
| ☑ | Indexace jen přes `PUBLIC_INDEXING=true`, jinak `noindex` + `Disallow: /` + `X-Robots-Tag` | etapa 0 | hotovo 27. 10. 2026 |
| ☑ | Doména z jedné proměnné `PUBLIC_SITE_URL` (canonical, OG, JSON-LD, sitemap, robots); navíc jen v `.htaccess` | etapa 0 | hotovo 27. 10. 2026 |
| ☐ | **[teď]** Kontrolní skript výstupu (odkazy, H1, canonical, režim indexace) | etapa 1 | připraveno k implementaci |
| ☐ | **[teď]** Testy logiky výjimek a otevírací doby | etapa 1 | připraveno k implementaci |
| ☑ | Struktura HTML, jedna H1 na stránku, hierarchie nadpisů | celý web | hotovo (ověřeno skriptem) |
| ☑ | Dynamické `title` a `description` na každé stránce | `Base.astro`, frontmatter | hotovo |
| ☑ | Canonical na každé stránce | `Base.astro` | hotovo (po etapě 0 z proměnné) |
| ☑ | Open Graph a Twitter karty 1200 × 630 | `Base.astro` | hotovo |
| ☑ | Strukturovaná data (VeterinaryCare, WebSite, BlogPosting, FAQPage jen u schválených, BreadcrumbList) | `Base.astro`, `[slug].astro`, `Breadcrumbs.astro` | hotovo |
| ☑ | Sitemapa s `lastmod` u článků | `astro.config.mjs` | hotovo |
| ☑ | Zachované URL a přesměrování z WordPressu | `public/.htaccess` | hotovo, 23/23 adres pokryto |
| ☑ | Stránka 404 s `noindex` | `src/pages/404.astro`, `.htaccess` | hotovo |
| ☐ | **[teď]** Seznam dalších starých adres mimo sitemapu (nejnavštěvovanější vstupní stránky z GA4, odkazy z Firmy.cz/Google profilu, obrázky `wp-content/uploads`) a doplnění přesměrování | `.htaccess` | k udělání – vyžaduje přístup do GA4 / Search Console |
| ☐ | **[klinika]** Text zásad ochrany osobních údajů | `src/content/stranky/` | čeká na klinika (P1-3) |
| ☐ | **[teď]** Návrh změn GTM (spouštěč `contactFormSubmit`, tel. spouštěč, kontrola `reservationComplete`) sepsaný k odsouhlasení – **nepublikovat** | GTM | připraveno v paměti z auditu GTM |

## B. Co musí zůstat neaktivní až do spuštění

- `PUBLIC_INDEXING=true` – nikdy na náhledu ani na testovací adrese.
- `robots.txt` s `Allow: /` a odkazem na sitemapu – jen v produkčním buildu.
- Odeslání sitemapy do Search Console, žádost o indexaci nových URL.
- Publikace změn v GTM (úpravy jen v pracovním prostoru, publikovat v den spuštění po odsouhlasení).
- HSTS `preload` – nepřidávat (nevratné rozhodnutí, není potřeba).
- Ostrá `Content-Security-Policy` – nejdřív týden `Report-Only` v produkci.
- Vypnutí nebo smazání WordPressu – až po úspěšném spuštění a záloze (viz E).

## C. Rozhodnutí před spuštěním

| | Otázka | Kdo | Poznámka |
| --- | --- | --- | --- |
| ☐ | Potvrdit finální adresu `https://veterinahloubetin.cz` (bez www, jako dnes) | klinika | doporučuji zachovat |
| ☐ | Schválený text zásad ochrany osobních údajů | klinika | P1-3 |
| ☐ | Příjemce a odesílatel e-mailů z formuláře (`odeslat.config.php`) | klinika | odesílatel na doméně webu kvůli SPF/DKIM |
| ☐ | Mapa a logo Firmy.cz až po souhlasu s cookies? | klinika | P1-6 |
| ☐ | Povinný souhlas u formuláře, nebo informační věta | klinika | P2-4 |
| ☐ | Kde dnes běží WordPress a DNS (stejný hosting jako WEDOS, nebo přepnutí DNS?) | klinika/správce | určuje postup v D |
| ☐ | Kdo má přístup do GTM, GA4, Search Console, Sklik, Google profilu firmy | klinika | nutné pro D a F |
| ☐ | Sklik retargeting zapnout/vypnout (dnes pozastavený) | klinika | z auditu GTM |

## D. Postup spuštění

### Týden před (T−7)

1. ☐ Etapy 0, 1 a 7 z plánu hotové; testovací adresa WEDOS prošla testy formuláře.
2. ☐ **Úplná záloha WordPressu** (soubory + databáze) stažená mimo hosting; ověřit, že jde otevřít.
3. ☐ Z GA4 / Search Console vypsat 50 nejnavštěvovanějších vstupních URL za 12 měsíců a ověřit, že každá má na novém webu stránku
   nebo přesměrování (doplnit `.htaccess`).
4. ☐ Pokud se mění hosting nebo DNS: snížit TTL DNS záznamů na 300 s.
5. ☐ Zkontrolovat SPF/DKIM/DMARC domény pro odesílání z WEDOS (`dig TXT veterinahloubetin.cz`).
6. ☐ V GTM připravit (nepublikovat) změny podle auditu GTM.

### Den spuštění (T−0)

1. ☐ Produkční build s výslovným zapnutím indexace:

   ```bash
   PUBLIC_SITE_URL=https://veterinahloubetin.cz PUBLIC_INDEXING=true npm run build
   ```

   Build musí na začátku vypsat `[indexace] ZAPNUTÁ – https://veterinahloubetin.cz`. Po etapě 1 navíc musí projít `npm run check`.
2. ☐ Kontrola výstupu před nahráním:
   - `dist/robots.txt` obsahuje `Allow: /` a `Sitemap: https://veterinahloubetin.cz/sitemap-index.xml`;
   - `dist/index.html` obsahuje `index, follow` a canonical `https://veterinahloubetin.cz/`;
   - `dist/.htaccess` **neobsahuje** `X-Robots-Tag`;
   - `dist/sitemap-0.xml` obsahuje jen adresy `https://veterinahloubetin.cz/...`.
3. ☐ Přesunout WordPress mimo kořen webu (ne mazat) a nahrát obsah `dist/` včetně `.htaccess` do `www/`.
4. ☐ Nahrát `odeslat.config.php` (není v repozitáři).
5. ☐ Smoke test (níže, oddíl F) – do 30 minut.
6. ☐ Publikovat připravené změny GTM po odsouhlasení; ověřit v Tag Assistantu a v GA4 Realtime.
7. ☐ Search Console: ověřit doménovou vlastnost, odeslat `https://veterinahloubetin.cz/sitemap-index.xml`, zkontrolovat úvod a 2–3 články
   nástrojem Kontrola URL. Hostitel se nemění, nástroj „Změna adresy“ není potřeba.

### Po spuštění

- ☐ T+1: zprávy z formuláře chodí; GA4 vidí `contactFormSubmit`, `reservationComplete` a kliky na telefon.
- ☐ T+1: logy WEDOS – nejčastější 404 → doplnit přesměrování.
- ☐ T+7: Search Console – stránky indexované, žádné neočekávané chyby; CSP Report-Only bez hlášení → zvážit ostrou CSP.
- ☐ T+7: PageSpeed Insights (mobil) úvod, rezervace, článek – porovnat s měřením z testovací adresy.
- ☐ T+30: porovnat návštěvnost a konverze s předchozím měsícem; teprve potom WordPress z hostingu odstranit (záloha zůstává).
- ☐ Aktualizovat adresu webu, pokud by se lišila, na Firmy.cz, v Google profilu firmy, na Facebooku a Instagramu (při stejném hostiteli jen kontrola).

## E. Plán návratu (rollback)

1. Obsah `www/` přesunout stranou, vrátit adresář WordPressu (nebo obnovit ze zálohy).
2. Pokud se měnilo DNS: vrátit původní záznamy (díky TTL 300 s do několika minut).
3. V GTM vrátit předchozí verzi kontejneru (verze jsou v historii).
4. Search Console: nic nerušit, jen znovu odeslat starou sitemapu, pokud je potřeba.

## F. Jak ověřit, že po spuštění vše funguje

Kontroly lze spustit z terminálu (každý příkaz zvlášť):

```bash
curl -sI http://veterinahloubetin.cz/ | head -3
```

```bash
curl -sI https://www.veterinahloubetin.cz/kontakty | grep -i -E "^(HTTP|location)"
```

```bash
curl -s https://veterinahloubetin.cz/robots.txt
```

```bash
curl -sI https://veterinahloubetin.cz/ | grep -i -E "x-robots-tag|strict-transport|x-content-type|referrer-policy|x-frame"
```

```bash
curl -sI https://veterinahloubetin.cz/odeslat.config.php | head -1
```

```bash
curl -sI https://veterinahloubetin.cz/o-nas/ | grep -i -E "^(HTTP|location)"
```

Očekávané výsledky:

| Kontrola | Očekávání |
| --- | --- |
| `http://` → `https://` | 301 na `https://veterinahloubetin.cz/` |
| `www` + bez lomítka | jedno nebo dvě 301, výsledek `https://veterinahloubetin.cz/kontakty/` |
| `robots.txt` | `Allow: /`, `Disallow: /odeslat.php`, řádek `Sitemap:` |
| Hlavičky | HSTS, nosniff, Referrer-Policy, X-Frame-Options; **žádný** `X-Robots-Tag` |
| `odeslat.config.php` | 403 |
| Staré adresy (`/o-nas/`, `/sluzby/`, `/cenik/`, `/category/…`, `/feed/`) | 301 na novou adresu |
| Neexistující adresa | 404 se stránkou „Tuto stránku jsme nenašli“ |
| Formulář | zpráva dorazí, odpověď jde klientovi (Reply-To) |
| Rezervace | Reservanto se načte, testovací rezervaci zrušit hned v Reservantu (nebo jen projít bez odeslání) |
| Lišta a pilulka | ukazují správný stav podle aktuálního času; výjimky v `site.ts` odpovídají skutečnosti |
| CookieYes | lišta se objeví jednou; po odmítnutí se nenačte GA4 (Tag Assistant) |
| Sdílení odkazu | náhled s obrázkem (Facebook Sharing Debugger) |

## G. Monitoring po spuštění

- Search Console – e-mailová upozornění na chyby indexace (zapnout).
- GA4 – konverze `contactFormSubmit`, `reservationComplete`, klik na telefon; týdně zkontrolovat, že nepadají na nulu.
- Logy WEDOS – 404 a chyby PHP (`[kontaktni-formular] mail() selhal`).
- Volitelně jednoduchý monitor dostupnosti úvodní stránky (např. bezplatná služba s e-mailovým upozorněním) – jen se souhlasem kliniky.
- Týdenní úloha recenzí: po spuštění ověřit, že build a nasazení po doplnění recenzí míří na WEDOS, ne jen na náhled.

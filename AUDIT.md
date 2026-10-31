# Audit webu Veterinární klinika Hloubětín

Datum: 27. 10. 2026 · Stav kódu: commit `e930fae` · Prostředí: vývoj + náhled na GitHub Pages (web zatím není na finální doméně)

Tento dokument je kritický technický a produktový audit celého projektu. Nic z něj zatím není implementováno –
pořadí změn je v [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md), postup spuštění v [MIGRATION_CHECKLIST.md](MIGRATION_CHECKLIST.md).

**Legenda**

- **Prokázáno** – ověřeno měřením, buildem, skriptem nebo přímo v kódu (uveden důkaz).
- **Hypotéza** – pravděpodobné, ale nebylo možné ověřit; uveden způsob ověření.
- **Náročnost:** S = do 2 h, M = půl dne až den, L = víc než den.
- **Blokuje spuštění** – musí být vyřešeno před přepnutím domény.

---

## 1. Celkové hodnocení

Projekt je technicky v dobrém stavu: čistý statický web na Astru, prakticky bez JavaScriptu (4,6 kB celkem),
bez nefunkčních interních odkazů, s jednou H1 na každé stránce, strukturovanými daty a centrálními daty
v `src/data/`. Kód je čitelný a komentovaný česky, komponenty mají jasnou odpovědnost.

Hlavní slabiny nejsou v kvalitě kódu, ale v **připravenosti na ostrý provoz**:

1. **Indexace je zapnutá ve výchozím stavu.** Jakýkoli build bez proměnné `PUBLIC_PREVIEW=1` je indexovatelný –
   to je v rozporu s pravidlem, že indexace musí být vědomý krok (P0-1).
2. **Kritické cesty nejsou ověřené v cílovém prostředí** – kontaktní formulář (PHP na WEDOS) ani měření konverzí
   v GTM po spuštění (P1-1, P1-2).
3. **Právní obsah neodpovídá webu** – zásady ochrany osobních údajů jsou převzatá šablona e-shopu (P1-3).
4. **Hlavní tlačítka nesplňují kontrast** pro čitelnost (bílý text na oranžové 2,26 : 1, P1-4).
5. **Neexistují žádné automatické testy** – časově citlivá logika (výjimky, otevírací doba) se zatím ověřovala ručně (P2-1).

Hodnocení po oblastech (subjektivní, s odůvodněním v nálezech):

| Oblast | Stav | Hlavní důvod |
| --- | --- | --- |
| Architektura a kód | dobrý | jednoduchá, bez zbytečných závislostí; chybí typová kontrola a testy |
| Výkon | velmi dobrý | minimum JS, WebP, lazy loading; drobné rezervy ve fontech a mobilním banneru |
| UX/UI | dobrý | jasné CTA, mobilní lišta; slabý kontrast, opakované bloky kontaktů |
| Přístupnost | průměrný | kontrast pod WCAG AA u hlavních prvků, drobnosti v ARIA |
| Bezpečnost | dobrý | rozumný PHP handler, hlavičky; chybí CSP, nic kritického |
| Konverze | dobrý | krátké cesty k objednání; chybí záloha při výpadku Reservanta |
| Připravenost na migraci | slabý | indexace opt-out, doména na pěti místech, neověřený formulář a měření |

---

## 2. Pochopení projektu

### Účel a uživatelé

Web malé veterinární kliniky v Praze 9 (Hloubětín). Hlavní návštěvníci jsou majitelé psů, koček, drobných savců
a plazů z okolí, převážně na mobilu. Hlavní úkoly návštěvníka, seřazené podle obchodní hodnoty:

1. **Zavolat** (akutní problém, pohotovost) – klinika pohotovost poskytuje po telefonické domluvě.
2. **Objednat se online** přes Reservanto (vakcinace, čipování, vyšetření).
3. **Zjistit, zda je otevřeno**, kde klinika je a jak se k ní dostat.
4. **Zjistit cenu** (ceník).
5. **Napsat zprávu** (kontaktní formulář → PHP → e-mail).
6. Přečíst odborný článek (vstup z vyhledávání, důvěra).

### Stack a architektura

| Vrstva | Řešení |
| --- | --- |
| Framework | Astro 5.18.2, čistě statický výstup (`output` výchozí), `trailingSlash: 'always'`, `build.format: 'directory'` |
| Obsah | Content collections: `clanky` (14 článků v Markdownu), `stranky` (ochrana osobních údajů) |
| Data | `src/data/site.ts` (kontakty, hodiny, výjimky, integrace), `cenik.ts`, `services.ts`, `team.ts`, `reviews.json` |
| Logika v prohlížeči | `src/lib/vyjimky.ts` (mimořádné časy), skripty v `OpenStatus`, `TopBar`, `Header`, `MobileBar`, `Reviews`, `ContactForm`, `kontakty`, `clanky` |
| Styly | `src/styles/global.css` + scoped CSS v komponentách, fonty z `@fontsource-variable` (Nunito, Open Sans, Nunito Sans) |
| Obrázky | `astro:assets` (Sharp) → WebP, responzivní `srcset`, OG obrázek 1200 × 630 |
| Formulář | `public/odeslat.php` (PHP 8.1+, `mail()`), volitelně `odeslat.config.php` |
| Server | Apache na WEDOS – `public/.htaccess` (HTTPS, bez www, přesměrování z WordPressu, hlavičky, cache) |
| Integrace | GTM `GTM-K4QX5VTT`, CookieYes, Reservanto (iframe skript), Google Maps (iframe), odkazy na Firmy.cz/Facebook/Instagram |
| Náhled | GitHub Actions → GitHub Pages (`BASE_PATH`, `PUBLIC_PREVIEW=1`, `PUBLIC_SITE_ORIGIN`, `scripts/rebase-links.mjs`) |
| Automatizace | týdenní doplnění recenzí z Firmy.cz (`npm run reviews:firmy`) |
| Závislosti | jen 5 runtime balíčků (astro, @astrojs/sitemap, 3× fontsource); žádné vývojové nástroje (lint, typecheck, testy) |

### Stránky (21 HTML výstupů)

`/` (úvod), `/rezervace-sluzeb/`, `/kontakty/`, `/cenik-zakroku-a-vysetreni/`, `/clanky/`, 14 článků na `/{slug}/`,
`/ochrana-osobnich-udaju/`, `/404.html`. URL odpovídají původnímu WordPressu, staré adresy (kategorie, feedy,
Yoast sitemapy, `wp-admin`) řeší `.htaccess`.

### Tok dat a stavů

Veškerý obsah je známý při buildu. Jediný „stav“ v prohlížeči je čas: lišta, pilulka „Otevřeno/Zavřeno“
a mimořádná oznámení se počítají z aktuálního času v Praze (`Intl.DateTimeFormat`, `Europe/Prague`) a přepočítávají
se každou minutu. Data výjimek se do stránky vkládají jako JSON v `data-` atributu. API ani databáze nejsou;
jedinou serverovou částí je `odeslat.php`.

---

## 3. Co bylo skutečně ověřeno

| Kontrola | Jak | Výsledek |
| --- | --- | --- |
| Produkční build | `astro build --outDir` do dočasné složky (bez `PUBLIC_PREVIEW`) | prošel, 21 stránek, bez varování |
| Interní odkazy a kotvy | vlastní skript nad HTML výstupem (všechny `href/src/action`, existence souborů a `id`) | **0 chyb** |
| Nadpisy | týž skript | každá stránka 1× H1, žádné přeskočené úrovně |
| Meta, canonical, robots | týž skript | canonical všude na `https://veterinahloubetin.cz/...`; produkční build má `index, follow` |
| JSON-LD | `JSON.parse` všech bloků | bez chyb; typy VeterinaryCare, WebSite, BlogPosting, FAQPage, BreadcrumbList, CollectionPage, ContactPage |
| Velikosti | skript | JS 4,6 kB, CSS 68 kB (≈ 10 kB gzip na stránku), HTML 28–85 kB (8–17 kB gzip), hero WebP 43 kB / mobil 14 kB |
| Kontrast barev | výpočet podle WCAG 2.x | viz P1-4 |
| Typová kontrola | **nelze** – projekt nemá `tsconfig.json` ani `@astrojs/check` (P2-1) | neprovedeno |
| Lint | **nelze** – žádný linter není nainstalovaný | neprovedeno |
| Testy | **neexistují** | neprovedeno |
| Kontaktní formulář | **nelze bezpečně** – na náhledu (GitHub Pages) PHP neběží, WEDOS zatím není nasazený | neprovedeno, viz P1-1 |
| Vykreslení v prohlížeči | náhled na GitHub Pages, 10 šířek displeje, viz kapitola 6 | bez vodorovného přetékání, bez chyb v konzoli |
| Pokrytí starých URL | sitemapa živého WordPressu vs. nový build | 23 z 23 adres má stránku nebo přesměrování |

---

## 4. Nálezy podle priorit

Seřazeno podle skutečného dopadu, ne podle snadnosti.

### P0 – kritické

#### P0-1 Indexace je ve výchozím stavu zapnutá (opt-out místo opt-in)

- **Problém:** Indexace se vypíná jen proměnnou `PUBLIC_PREVIEW=1`. Každý jiný build – včetně postupu v README
  („`npm run build` a nahrajte `dist/`“) – vytvoří web s `<meta name="robots" content="index, follow…">`,
  `robots.txt` s `Allow: /` a sitemapou. Kdyby se `dist/` nahrál na testovací adresu na WEDOS (subdoména,
  podsložka, dočasná doména hostingu), začne se indexovat dřív, než je to vědomé rozhodnutí.
- **Kde:** `src/layouts/Base.astro:42-43`, `public/robots.txt`, `astro.config.mjs` (sitemap se generuje vždy), `README.md` (Nasazení).
- **Důkaz (prokázáno):** produkční build v dočasné složce – `index.html` obsahuje `index, follow, max-image-preview:large…`,
  `robots.txt` obsahuje `Allow: /` a `Sitemap: https://veterinahloubetin.cz/sitemap-index.xml`.
- **Řešení:** Obrátit logiku na explicitní souhlas: indexace jen při `PUBLIC_INDEXING=true` (název k potvrzení).
  Bez ní: `noindex, nofollow` na všech stránkách, `robots.txt` s `Disallow: /` generovaný v `src/pages/robots.txt.ts`,
  bez odkazu na sitemapu a v `.htaccess` hlavička `X-Robots-Tag: noindex` (chrání i PDF a obrázky).
  Kontrolní skript po buildu (P2-1) selže, pokud se režim indexace a výstup neshodují.
- **Přínos:** Nulové riziko předčasné indexace, předvídatelná aktivace jedním přepínačem při spuštění.
- **Náročnost:** S. **Riziko regrese:** nízké. Jediné riziko je zapomenout přepínač při spuštění – kryje ho checklist a kontrolní skript.
- **Blokuje spuštění:** ano (musí být hotové před prvním nahráním na WEDOS).

### P1 – vysoký dopad

#### P1-1 Kontaktní formulář nebyl ověřen v cílovém prostředí

- **Problém:** `odeslat.php` nikdy neběžel na WEDOS. Neověřené jsou: verze PHP (handler vyžaduje 8.1+ kvůli typu `never`),
  funkčnost `mail()` s parametrem `-f`, doručitelnost (SPF/DKIM domény), zápis do `sys_get_temp_dir()` pro rate-limit.
  Na náhledu GitHub Pages formulář vždy skončí chybou (statický hosting POST nepřijme) – to je očekávané, ale
  návštěvník náhledu to neví.
- **Kde:** `public/odeslat.php`, `src/components/ContactForm.astro`.
- **Důkaz:** GitHub Pages neumí PHP; WEDOS nasazení zatím neexistuje (README, kap. Nasazení).
- **Řešení:** Nasadit na testovací adresu WEDOS (s noindex dle P0-1, ideálně i s HTTP heslem) a projít testovací
  scénáře z [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) (validace, honeypot, rychlé odeslání, rate-limit, doručení,
  odpověď na Reply-To, diakritika v předmětu). Na náhledu formulář nahradit informací „Na náhledu se zprávy neodesílají“.
- **Přínos:** Jistota, že druhá nejdůležitější konverze funguje od prvního dne.
- **Náročnost:** M (závisí na přístupu k WEDOS). **Riziko regrese:** žádné.
- **Blokuje spuštění:** ano.

#### P1-2 Měření konverzí v GTM po spuštění přestane fungovat

- **Problém:** Spouštěče v GTM jsou navázané na starý web (podrobně v paměti z auditu GTM z 26. 10. 2026):
  klik na telefon sleduje odstraněnou pevnou linku `tel:+420281863796`, odeslání formuláře sleduje třídy Divi
  `et_pb_contact_submit`. Nový web po odeslání formuláře posílá `dataLayer` událost **`contactFormSubmit`**
  (s `formSource`), na kterou v GTM zatím nic nereaguje. Rezervace posílá `reservationComplete` včetně
  `customerId`, `reservationId` a ceny – je potřeba ověřit, že se ID zákazníka neposílá do GA4 jako parametr.
- **Kde:** GTM `GTM-K4QX5VTT`; `src/components/ContactForm.astro:246`; `src/pages/rezervace-sluzeb.astro:65-75`.
- **Důkaz:** kód webu (prokázáno); stav GTM z auditu jen pro čtení (26. 10. 2026).
- **Řešení:** Při spuštění (ne dřív – rozhodnutí uživatele) přepojit tel. značky na obecný spouštěč „Click URL starts with tel:“,
  přidat Custom Event spouštěč `contactFormSubmit`, zkontrolovat proměnné u `reservationComplete`. Vše až po
  odsouhlasení a s náhledem v Tag Assistantu.
- **Přínos:** Zachování dat o konverzích (hovory, formuláře, rezervace) – bez nich nejde vyhodnotit ani Sklik.
- **Náročnost:** S. **Riziko regrese:** nízké (změny v GTM jsou verzované).
- **Blokuje spuštění:** ano (provést v den spuštění).

#### P1-3 Zásady ochrany osobních údajů neodpovídají webu ani skutečnému zpracování

- **Problém:** Text je převzatá šablona e-shopu: „vytvoření objednávky“, „registrace zákazníka“, zasílatelské společnosti,
  využití údajů z kontaktního formuláře k marketingu (SMS, personalizovaná reklama). Jako zpracovatel je uveden
  „Blueboard.cz Webhosting s.r.o., **IČ 28381416**“ – to je IČO samotné kliniky. Chybí: cookies a měření (GTM, GA4,
  Sklik, CookieYes), Reservanto, Google Mapy, hosting WEDOS, právní základy, doby uchování, kontakt správce pro uplatnění práv.
  Souhlas u formuláře přitom říká „za účelem vyřízení mého dotazu“ – text zásad tomu odporuje.
- **Kde:** `src/content/stranky/ochrana-osobnich-udaju.md`; odkaz z formuláře a patičky.
- **Důkaz:** obsah souboru (prokázáno).
- **Řešení:** Nový text musí dodat nebo schválit klinika (případně právník) – **nebudu ho vymýšlet**. Můžu připravit
  osnovu se seznamem skutečně používaných služeb a zpracovatelů k doplnění.
- **Přínos:** Soulad s GDPR, důvěryhodnost, menší riziko stížnosti.
- **Náročnost:** S technicky, obsah závisí na klinice. **Riziko regrese:** žádné.
- **Blokuje spuštění:** ano (doporučení).

#### P1-4 Nedostatečný kontrast hlavních tlačítek a oranžového textu

- **Problém:** Bílý text na značkové oranžové `#f99420` má kontrast **2,26 : 1** (WCAG AA požaduje 4,5 : 1, u velkého
  tučného textu 3 : 1). Týká se všech hlavních CTA: „Objednat se online“ v banneru, „Objednat se“ v hlavičce
  a v mobilní liště, `.btn`, filtr článků, „Navigovat/Zavolat“ v dlaždicích. Horní lišta s hodinami (`#f99521`) má 2,25 : 1.
  Oranžový text `--c-orange-deep #ff7000` na bílé má 2,77 : 1 (nadtitulky, štítky „Veterinární lékař“, popisky
  dlaždic v 11 px, „Číst článek →“). Šedé popisky `#888` / `#8a8a8a` mají 3,5 : 1 (datum recenze, meta článku, poznámka u formuláře).
- **Kde:** `src/styles/global.css:13-17` (proměnné), `.btn`, `Header.astro` `.header-cta`, `MobileBar.astro`, `TopBar.astro`, `InfoBox.astro`, `TeamSection.astro`, `Reviews.astro`, `[slug].astro`.
- **Důkaz (prokázáno výpočtem):** `#fff` na `#f99420` = 2,26; `#ff7000` na `#fff` = 2,77; `#888` na `#fff` = 3,54.
  Pro srovnání `--c-link #b45309` = 5,02 (už dnes v pořádku).
- **Řešení (k odsouhlasení, mění vzhled):** Varianta A – tmavý text `#2b2b2b` na stávající oranžové (6,26 : 1, značka zůstane);
  varianta B – tmavší oranžová pro pozadí tlačítek, např. `#c2410c` (5,18 : 1). Malý oranžový text nahradit `--c-link`.
  Oranžovou ponechat pro plochy, ikony a dekorace. Ukážu obě varianty vedle sebe před změnou.
- **Přínos:** Čitelnost CTA na slunci a pro starší klienty, splnění WCAG AA, pravděpodobně i vyšší proklikovost hlavních tlačítek (hypotéza).
- **Náročnost:** S–M. **Riziko regrese:** nízké technicky, střední vizuálně (změna dojmu ze značky).
- **Rozhodnutí (27. 10. 2026):** po porovnání osmi barevných řešení na náhledu zůstávají barvy původní – žádná varianta
  vzhledově nevyhovovala. Nález zůstává otevřený jako vědomě přijaté riziko; podrobnosti a změřené odstíny v IMPLEMENTATION_PLAN.md (etapa 3).

#### P1-5 CookieYes se pravděpodobně načítá dvakrát a synchronně blokuje vykreslení (hypotéza)

- **Problém:** `Base.astro` vkládá skript CookieYes synchronně jako první v `<head>`. Audit GTM zároveň zjistil značku
  „CookieYes CMP“ na spouštěči Consent Initialization. Pokud obě cesty načtou CookieYes, hrozí dvojí inicializace
  (dvě lišty, dvojí události souhlasu). Synchronní externí skript je navíc jediný bod selhání – když CDN CookieYes
  odpovídá pomalu, stránka čeká.
- **Kde:** `src/layouts/Base.astro:143`; GTM.
- **Důkaz:** kód (prokázáno); duplicitu nelze ověřit, dokud nový web neběží s GTM (na náhledu jsou obě integrace vypnuté).
- **Ověření:** na testovací adrese WEDOS se zapnutým GTM spočítat v síťovém panelu požadavky na `cdn-cookieyes.com/.../script.js`
  a zkontrolovat v konzoli objekt CookieYes.
- **Řešení:** Ponechat jen jednu cestu – buď přímý skript (a v GTM značku pozastavit), nebo jen GTM šablonu. Rozhodnout po ověření.
- **Přínos:** Spolehlivý souhlas, rychlejší první vykreslení.
- **Náročnost:** S. **Riziko regrese:** střední (souhlasy a Consent Mode – testovat s Tag Assistantem).

#### P1-6 Google Mapa a obrázek z Firmy.cz se načítají bez ohledu na souhlas s cookies

- **Problém:** Iframe Google Map na `/kontakty/` se načte (lazy) vždy, i když návštěvník cookies odmítne; Google Maps
  embed běžně ukládá vlastní cookies. Úvodní stránka načítá logo „TOP firma“ přímo z `www.firmy.cz` (předání IP adresy).
- **Kde:** `src/pages/kontakty.astro:136-141`, `src/pages/index.astro:68`.
- **Důkaz:** kód (prokázáno). Zda to vyžaduje souhlas, je právní výklad – **hypotéza** k posouzení klinikou.
- **Řešení:** Zachovat iframe s lazy loadingem (dřívější rozhodnutí), ale napojit ho na kategorii souhlasu v CookieYes
  (blokování iframe podle dokumentace CookieYes) s náhradním odkazem „Otevřít v Mapách Google“. Logo Firmy.cz
  uložit lokálně, pokud to podmínky Firmy.cz dovolují.
- **Přínos:** Soulad s nastavením souhlasu, které web návštěvníkovi nabízí.
- **Náročnost:** S. **Riziko regrese:** nízké.

#### P1-7 Rezervace: při výpadku Reservanta zůstane prázdná plocha

- **Problém:** Online rezervace je hlavní konverze. Pokud se skript `booking.reservanto.cz` nenačte (výpadek, blokátor
  reklam, pomalá síť), uživatel uvidí jen prázdný rámeček vysoký 520–820 px bez vysvětlení. `<noscript>` pokrývá jen vypnutý JavaScript.
- **Kde:** `src/pages/rezervace-sluzeb.astro:20-26, 62`.
- **Důkaz:** kód (prokázáno); chování při blokaci ověřit v prohlížeči zablokováním domény.
- **Řešení:** Náhradní text v kontejneru („Rezervační formulář se nenačetl – zavolejte nám na … nebo napište“), který
  se schová, jakmile Reservanto vloží iframe (CSS `:has(iframe)` nebo kontrola po načtení skriptu).
- **Přínos:** Žádná ztracená rezervace kvůli technickému výpadku; uživatel vždy dostane další krok.
- **Náročnost:** S. **Riziko regrese:** nízké.

### P2 – doporučená zlepšení

#### P2-1 Chybí jakékoli automatické kontroly

- **Problém:** Není `tsconfig.json`, `@astrojs/check`, linter ani testy. Logika výjimek a otevírací doby (letní/zimní čas,
  půlnoc, „zítra“) se opakovaně upravovala a ověřovala ručně. GitHub Action jen sestaví náhled.
- **Kde:** kořen projektu, `.github/workflows/pages.yml`, `src/lib/vyjimky.ts`, `src/components/OpenStatus.astro`.
- **Důkaz:** soubory neexistují (prokázáno); typová kontrola bez `tsconfig.json` nedává smysluplný výsledek.
- **Řešení (minimum, bez těžkých nástrojů):** `tsconfig.json` (`extends: astro/tsconfigs/strict`) + `@astrojs/check` a `typescript`
  jako dev závislosti; jednotkové testy `vyjimky.ts` přes vestavěný `node:test` (bez knihovny); kontrolní skript po buildu
  (odkazy, kotvy, H1, canonical, režim indexace) jako `npm run check`; spouštět v GitHub Action před nasazením náhledu.
- **Přínos:** Chyby v čase a odkazech se zachytí před nasazením; bezpečnější refaktoring dalších etap.
- **Náročnost:** M. **Riziko regrese:** žádné (nemění web).

#### P2-2 Mobilní banner nemá přednačtený obrázek (LCP – hypotéza)

- **Problém:** Na desktopu se obrázek psa přednačítá (`<link rel="preload" media="(min-width: 768px)">`), na mobilu se
  menší verze objeví až po stažení CSS (je v `background-image` přes CSS proměnnou). Mobil je přitom hlavní zařízení.
- **Kde:** `src/pages/index.astro:24, 27, 304`.
- **Důkaz:** kód (prokázáno); dopad na LCP je **hypotéza** – ověřit v Lighthouse / PageSpeed na testovací adrese (mobil, 4G).
- **Řešení:** Druhý `preload` pro `heroSm` s `media="(max-width: 767px)"`.
- **Přínos:** Rychlejší první zobrazení úvodu na telefonu (odhad stovky ms na pomalé síti).
- **Náročnost:** S. **Riziko regrese:** velmi nízké.

#### P2-3 Fonty: zbytečné rodiny a varianty

- **Problém:** CSS deklaruje 4 rodiny (Nunito, Nunito kurzíva, Open Sans, Nunito Sans; 25 souborů WOFF2, 676 kB ve výstupu).
  `--f-sans` (Nunito Sans) se nikde nepoužívá. Open Sans (`--f-body`) se používá jen u `body`, horní lišty a textu zásad
  ochrany údajů, ale kvůli horní liště a `body` se stáhne na každé stránce.
- **Kde:** `src/styles/global.css:6-9, 35-37, 102`, `TopBar.astro:82`, `ochrana-osobnich-udaju.astro:46`.
- **Důkaz (prokázáno):** skript: `var(--f-sans)` 0×, `var(--f-body)` 3×, `var(--f-head)` 86×; 25 deklarací `@font-face`.
  V prohlížeči se na úvodní stránce (mobil) stáhly 4 soubory: Nunito latin + latin-ext (74,7 kB) a **Open Sans latin + latin-ext (83,5 kB)**.
  Odebráním Open Sans ušetří první návštěva ≈ 83 kB, tj. víc než polovinu dat fontů.
- **Řešení:** Odebrat import Nunito Sans; sjednotit lištu a tělo na Nunito a Open Sans odebrat (vizuální změna drobná – ukázat).
- **Přínos:** Jeden font na stránku místo dvou → méně požadavků, méně přeskakování písma.
- **Náročnost:** S. **Riziko regrese:** nízké (vizuálně zkontrolovat lištu a zásady).
- **Rozhodnutí (31. 10. 2026):** Nunito Sans je odstraněné; Open Sans po porovnání na náhledu zůstává (nález v této části vědomě ponechán).

#### P2-4 Kontaktní formulář: zpětná vazba a překážky

- **Problém:** Při chybě se zobrazí jen obecné „Vyplňte prosím všechna povinná pole“ – u konkrétního pole není text, jen červený
  rámeček (barva nestačí jako jediný signál). Bez JavaScriptu se při chybě ztratí vyplněná data i důvod chyby (přesměrování
  s `?odeslano=0`). Povinné zaškrtnutí souhlasu je další krok navíc; pro vyřízení dotazu obvykle není souhlas právním základem
  (oprávněný zájem / jednání o smlouvě) – **rozhodnutí kliniky**, nevymýšlím právní text.
- **Kde:** `src/components/ContactForm.astro`, `public/odeslat.php:38`.
- **Důkaz:** kód (prokázáno).
- **Řešení:** Text chyby pod polem (`aria-describedby`), konkrétní hláška pro e-mail a telefon (stejná pravidla jako v PHP);
  bez JS vrátit přesnější kód chyby. Souhlas případně nahradit informační větou s odkazem na zásady – po schválení.
- **Přínos:** Méně opuštěných formulářů, lepší přístupnost.
- **Náročnost:** M. **Riziko regrese:** nízké (pokrýt testem formuláře).

#### P2-5 Stejné kontaktní údaje se na stránce opakují třikrát

- **Problém:** Na `/kontakty/` jsou adresa, telefon a e-mail v blocích nahoře, znovu v kartách pod mapou a potřetí v patičce.
  Na článcích je pod textem box „Máte nějaké dotazy?“, pod ním karty kontaktů a pak patička. Stránky jsou zbytečně dlouhé,
  na mobilu je cesta k patičce dlouhá a opakování snižuje váhu hlavní výzvy.
- **Kde:** `src/pages/kontakty.astro:146`, `src/pages/[slug].astro:235-241`, `src/pages/clanky.astro:83-89`, `src/components/ContactCards.astro`.
- **Důkaz:** struktura stránek (prokázáno).
- **Řešení:** Na Kontaktech karty vynechat (údaje už jsou nahoře); na článcích ponechat jen jeden blok (box s CTA) a karty vynechat.
- **Přínos:** Kratší, přehlednější stránky; výrazněji vynikne CTA.
- **Náročnost:** S. **Riziko regrese:** nízké (vizuálně ověřit konce stránek a vlnky).

#### P2-6 Karta „Zanechte nám zprávu“ otevírá e-mailového klienta

- **Problém:** Karta na každé stránce vede na `mailto:`. Na mobilu bez nastaveného e-mailu se nestane nic užitečného
  a zpráva se neměří. Kontaktní formulář přitom existuje.
- **Kde:** `src/components/ContactCards.astro:10`.
- **Řešení:** Odkaz na `/kontakty/#napiste-nam`, e-mail ponechat jako text.
- **Přínos:** Měřitelná konverze, funguje na každém zařízení.
- **Náročnost:** S. **Riziko regrese:** žádné.

#### P2-7 Bezpečnostní hlavičky: chybí Content-Security-Policy

- **Problém:** `.htaccess` nastavuje `nosniff`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy` a HSTS – dobře.
  Chybí CSP, která by omezila vkládání cizích skriptů. PHP může posílat `X-Powered-By` s verzí.
- **Kde:** `public/.htaccess:44-58`.
- **Řešení:** Nejdřív `Content-Security-Policy-Report-Only` se seznamem skutečně používaných domén (GTM, GA4, Sklik, CookieYes,
  Reservanto, Google Maps, Firmy.cz) a teprve po týdnu bez chyb ostrá verze. `Header unset X-Powered-By`.
- **Přínos:** Ochrana proti vložení škodlivého skriptu (např. přes kompromitovanou značku).
- **Náročnost:** M (GTM značky mění domény). **Riziko regrese:** střední → proto režim Report-Only.

#### P2-8 Náhled na GitHub Pages: ochrana proti indexaci je jen částečná

- **Problém:** `rebase-links.mjs` zapisuje `robots.txt` do `/veterinaHloubetin/robots.txt`. Vyhledávače čtou jen
  `https://vojtano98.github.io/robots.txt`, takže tento soubor nemá účinek. HTML stránky chrání `noindex` (funguje),
  ale PDF (`/wp-content/uploads/2026/06/Info-letak-CEP-2026.pdf`) a obrázky žádnou ochranu nemají a GitHub Pages
  neumí nastavit `X-Robots-Tag`.
- **Kde:** `scripts/rebase-links.mjs:41-42`, `.github/workflows/pages.yml`.
- **Důkaz (prokázáno v prohlížeči):** `https://vojtano98.github.io/robots.txt` vrací 404 (procházení není omezené);
  `/veterinaHloubetin/robots.txt` existuje, ale robots.txt platí jen v kořeni hostitele; PDF vrací 200 bez `X-Robots-Tag`.
- **Řešení:** Ponechat `noindex` (hlavní ochrana); zvážit nenasazovat PDF a velké originály na náhled, nebo náhled přesunout
  na WEDOS s `X-Robots-Tag` a HTTP heslem. Ověřit, zda je repozitář veřejný (GitHub Pages zdarma vyžaduje veřejný repozitář).
- **Přínos:** Žádné duplicitní soubory z náhledu ve výsledcích vyhledávání.
- **Náročnost:** S. **Riziko regrese:** žádné.

#### P2-9 Logika otevírací doby je rozdělená a netestovatelná

- **Problém:** `OpenStatus.astro` obsahuje vlastní výpočet pražského času, rozvrhu a textů, který se částečně překrývá
  s `vyjimky.ts` (formátování času, názvy dnů). Okrajové případy: zvýraznění dnešního dne v liště se nepřepočítá po půlnoci;
  `hoursIn(i)` přičítá 24 h, což v noc změny času může u výjimky na neděli vrátit špatný den.
- **Kde:** `src/components/OpenStatus.astro:92-175`, `src/components/TopBar.astro:68-72`, `src/lib/vyjimky.ts`.
- **Řešení:** Přesunout výpočet stavu do čisté funkce ve `vyjimky.ts` (vstup: čas, rozvrh, výjimky → výstup: text a stav),
  komponenta jen vykreslí. Pokrýt testy (P2-1) včetně přechodu na zimní čas.
- **Přínos:** Méně chyb v nejcitlivější části webu, rychlejší úpravy výjimek.
- **Náročnost:** M. **Riziko regrese:** střední → jen s testy.

#### P2-10 Rezervační widget na mobilu: vnořené posouvání (ověřit)

- **Problém:** Kontejner Reservanta má na mobilu výšku `100svh − 190px`; pokud je obsah widgetu delší, posouvá se uvnitř
  iframe a zároveň stránka. To bývá na telefonu matoucí. **Hypotéza** – chování záleží na obsahu Reservanta.
- **Kde:** `src/pages/rezervace-sluzeb.astro:193-238`.
- **Ověření:** projít celou rezervaci na telefonu (bez dokončení).
- **Řešení:** podle výsledku – např. vyšší kontejner nebo automatická výška, pokud ji Reservanto podporuje.
- **Náročnost:** S. **Riziko regrese:** nízké.

#### P2-11 Produkční doména je zapsaná natvrdo na pěti místech

- **Problém:** `https://veterinahloubetin.cz` je zapsaná zvlášť v `astro.config.mjs` (`site`), `src/data/site.ts` (`url`),
  `public/.htaccess` (přesměrování), `public/robots.txt` (sitemap) a `README.md`. Na náhledu ji pro OG obrázky přepisuje jen
  `PUBLIC_SITE_ORIGIN`; canonical, JSON-LD i sitemapa míří vždy na produkci. Při jakékoli změně (testovací adresa, jiná doména)
  je snadné jedno místo zapomenout. Hostitel bez www přitom **odpovídá současnému webu** – ověřeno: `www.veterinahloubetin.cz`
  přesměrovává na `veterinahloubetin.cz` a canonical starého WordPressu je bez www. Změna hostitele tedy nehrozí.
- **Kde:** viz výše.
- **Důkaz (prokázáno):** soubory; v prohlížeči `https://www.veterinahloubetin.cz/kontakty/` → `https://veterinahloubetin.cz/kontakty/`,
  `<link rel="canonical" href="https://veterinahloubetin.cz/kontakty/">`. Sitemapa náhledu obsahuje nesmyslné adresy
  `https://veterinahloubetin.cz/veterinaHloubetin/...` (kombinace produkční domény a podsložky náhledu).
- **Řešení:** Jeden zdroj pravdy `PUBLIC_SITE_URL` (env) → `site` v `astro.config.mjs`, `site.url` odvozené z `import.meta.env.SITE`,
  `robots.txt` generovaný (P0-1). Pravidlo hostitele v `.htaccess` ponechat jako jediné ručně udržované místo s komentářem
  a kontrolou v kontrolním skriptu. Na náhledu sitemapu negenerovat.
- **Přínos:** Testovací nasazení i migrace změnou jedné proměnné, žádné zapomenuté místo.
- **Náročnost:** S. **Riziko regrese:** nízké (pokryje kontrolní skript).

### P3 – drobnosti a kosmetika

| ID | Problém | Kde | Řešení | Náročnost |
| --- | --- | --- | --- | --- |
| P3-1 | Titulky článků mají 72–108 znaků, popisy u 6 stránek přes 160 znaků (ořízne se ve výsledcích) – **SEO až po spuštění** | `[slug].astro`, frontmatter článků | kratší přípona titulku nebo `seoTitle`; zkrátit popisy | S |
| P3-2 | Stránka 404 má canonical `/404/` | `Base.astro:44` | u `noindex` stránek canonical vynechat | S |
| P3-3 | Recenze: `aria-label="Recenze klientů z Google"` i u Firmy.cz; datum `06/09/2026` místo českého formátu; půl hvězdy se nezobrazí | `Reviews.astro:31, 48, 62` | opravit popisek, formát `6. 9. 2026` | S |
| P3-4 | Pilulka v hlavičce má `aria-label="Ordinační hodiny"`, který přebije text „Otevřeno do 19“ – čtečka stav nepřečte | `Header.astro:43` | `aria-label` odstranit nebo doplnit stav | S |
| P3-5 | Mobilní menu: po Esc se fokus nevrátí na tlačítko, fokus se do menu nepřesune | `Header.astro:398-413` | vrátit fokus na burger | S |
| P3-6 | Duplicity a mrtvý kód: `footerNav` je shodné s `nav`; silueta sestry bez fotky se nikdy nevykreslí; telefon v JSON-LD natvrdo (`Base.astro:71`); třída `.nowrap` ve 4 komponentách | `site.ts`, `TeamSection.astro`, `Base.astro` | sjednotit, kde to zjednoduší údržbu | S |
| P3-7 | Build obsahuje ~15,8 MB originálů obrázků, na které žádná stránka neodkazuje (např. 3,9 MB `Tortoise-Head-Close-Up.webp`) – návštěvníky nezatěžují, jen prodlužují nahrávání na FTP | `src/assets/uploads`, `dist/_astro` | originály ve zdroji zmenšit na max. ~2000 px | S |
| P3-8 | `.htaccess` dává 1 rok `immutable` i souborům bez otisku v názvu (`/logo.png`, `/img/firmy-cz.svg`); `http://www…/stranka` projde dvěma přesměrováními | `public/.htaccess:52-57, 13-40` | kratší cache pro `public/`; spojit pravidla | S |
| P3-9 | PHP: kontrola doby vyplnění se dá obejít vynecháním `ts`; čas v e-mailu podle časové zóny serveru; do logu se zapisuje e-mail klienta; rate-limit ve sdíleném `/tmp` | `public/odeslat.php:72-75, 118, 142, 79` | `date_default_timezone_set('Europe/Prague')`, log bez e-mailu, vlastní složka mimo web | S |
| P3-10 | Články převzaté z WordPressu mají „volné“ seznamy (prázdné řádky s mezerami → větší mezery) a dvojité prázdné řádky | `src/content/clanky/*.md` | jednorázové vyčištění Markdownu | S |
| P3-11 | Rok v patičce se počítá při buildu (bez nového buildu zůstane starý) | `Footer.astro:8` | přijatelné; případně obnovit při týdenním buildu | – |
| P3-12 | Skript recenzí neověřuje, že odkaz začíná `https://`; nové recenze jdou na web bez lidské kontroly (pokud týdenní úloha i nasazuje) | `scripts/update-firmy-reviews.mjs:50` | povolit jen `https://`; zvážit ruční potvrzení | S |
| P3-13 | Nejednotné názvy stejné akce: „Objednat se online“, „Objednat se“, „Online rezervace“, „Rezervace služeb“ | více komponent | sjednotit na jeden pojem (návrh: „Objednat se online“) | S |
| P3-14 | Článek generuje druhý 1200px JPG jen pro JSON-LD (OG má jiný ořez); JSON-LD nezná mimořádné hodiny | `[slug].astro:33`, `Base.astro:82` | použít OG obrázek; `specialOpeningHoursSpecification` až v SEO fázi | S |
| P3-15 | Karty kontaktů mají každá vlastní H2 („Zanechte nám zprávu“…) – zbytečně zahlcují osnovu stránky | `ContactCards.astro` | popisky jako `<p>`, sekce s jedním skrytým H2 | S |
| P3-16 | Přímá čísla lékařů na úvodní stránce vs. „jen mobilní číslo“ jinde – ověřit, že je to záměr | `team.ts:24, 33` | otázka pro kliniku | – |

---

## 5. Hodnocení po fázích (shrnutí důvodů)

### UX/UI a logika
Navigace má 6 položek a odpovídá hlavním úkolům; „Objednat se“ a „Zavolat“ jsou vidět všude (hlavička, mobilní lišta, banner).
Nejvíc přemýšlení stojí: rozlišení, co jde objednat online a co jen telefonicky (stránka Rezervace to řeší dlouhým textem
s VELKÝMI PÍSMENY), opakované bloky kontaktů (P2-5) a nejednotné názvy akcí (P3-13). Dobře funguje živý stav
„Otevřeno/Zavřeno“ a mimořádná oznámení v liště.

### Responzivita
Mobilní varianty jsou pečlivě řešené (zlomy 360/380/480/767/980/1100/1360 px, skládačky, schovávání mobilní lišty u banneru).
Výsledky testů vykreslení viz kapitola 6.

### Architektura a kód
Bez nadbytečných abstrakcí a závislostí. Slabší místa: chybějící typová kontrola (P2-1), logika času rozdělená mezi komponentu
a knihovnu (P2-9), drobné duplicity (P3-6). Úniky paměti nehrozí – intervaly běží po celou dobu života stránky záměrně,
posluchače se neregistrují opakovaně. Refaktoring doporučuji jen tam, kde přinese testovatelnost.

### Výkon
Změřeno: JS 4,6 kB, CSS ≈ 10 kB gzip na stránku, HTML 8–17 kB gzip, obrázky ve WebP s `srcset` a `loading="lazy"` mimo první obrazovku,
mapa i Reservanto se načítají až na svých stránkách. Hypotézy k ověření: mobilní LCP (P2-2), skutečný přenos fontů (P2-3),
vliv synchronního CookieYes (P1-5). Core Web Vitals nejde věrohodně změřit na náhledu bez GTM a CookieYes – měřit na testovací adrese WEDOS.

### Bezpečnost a spolehlivost
XSS: Astro escapuje výstup; JSON-LD obsahuje jen obsah z repozitáře; recenze z Firmy.cz se vykreslují jako text. Formulář:
honeypot, minimální doba, rate-limit, kontrola Origin/Referer (jako ochrana proti CSRF dostačující – web nemá přihlášení ani cookies
relace), hlavičky e-mailu jsou ošetřené proti vložení (`Reply-To` přes validovaný e-mail a base64 jméno). Tajemství v repozitáři nejsou;
`odeslat.config.php` je v `.htaccess` blokovaný. Rizika: chybějící CSP (P2-7), závislost na dostupnosti CookieYes (P1-5) a Reservanta (P1-7).

### Konverze
Cesty jsou krátké: z každé stránky 1 klik k objednání nebo hovoru. Největší rezervy: kontrast CTA (P1-4), záloha při výpadku Reservanta (P1-7),
formulář (P2-4, P2-6), důvěra – recenze nemají souhrn (počet a průměr); ten lze doplnit jen ze skutečných čísel od kliniky, ne odhadem.
Strukturovaná data `AggregateRating` pro vlastní recenze nedoporučuji (Google je u vlastních stránek firmy nezobrazuje).

### Příprava na migraci
Viz [MIGRATION_CHECKLIST.md](MIGRATION_CHECKLIST.md). Klíčové jsou P0-1 (indexace jen na výslovný pokyn) a P2-11 (doména z jedné proměnné). Všech 23 adres ze sitemapy starého webu má na novém webu stránku nebo přesměrování.

---

## 6. Testy vykreslení v prohlížeči

Testováno na náhledu `https://vojtano98.github.io/veterinaHloubetin/` (stejný kód jako produkce, bez GTM a CookieYes).

| Test | Jak | Výsledek |
| --- | --- | --- |
| Vodorovné přetékání | 9 stránek (úvod, kontakty, rezervace, ceník, články, 2 články, zásady, 404) v iframe o šířce 320, 375, 414, 768, 1024 a 1440 px, úvod navíc 360, 390, 1280 a 1920 px; měřeno `scrollWidth` a prvky přesahující okraj mimo posuvné pásy | **žádné přetékání** na žádné stránce a šířce |
| Velikost klikacích ploch (< 24 px) | týž test; ignorovány odkazy v textu článků | jen řádkové odkazy (horní lišta 19–21 px, „Naše služby“, jméno u recenze 20 px); tlačítka a menu vyhovují |
| Nejmenší písmo | týž test | 10 px (nadtitulek banneru při 320 px), jinak 11 px popisky dlaždic – spolu s kontrastem viz P1-4 |
| Délka stránek na mobilu (375 px) | týž test | úvod ≈ 7 600 px, Články ≈ 9 800 px, článek 7 900–9 900 px – viz P2-5 |
| Konzole | ~60 načtení stránek v iframe | žádná chyba JavaScriptu webu; jediné hlášky pocházely z testu (404 pro neexistující stránku, 405 pro testovací POST) a varování skriptu Reservanta „DataLayer not found“ (na náhledu chybí GTM, v produkci se neobjeví) |
| Reservanto (375 × 812) | načtení stránky, měření kontejneru | iframe se vloží, výška 622 px, začíná 486 px od horního okraje; posouvání uvnitř viz P2-10 |
| Náhled a indexace | `fetch` robots.txt, PDF, sitemapy | viz P2-8 a P2-11 |
| Staré adresy | sitemapa živého WordPressu (23 adres) vs. nový build a `.htaccess` | **23/23 pokryto** (19 stránek existuje, `/o-nas/`, `/sluzby/` a `/category/nezarazene/` mají 301) |
| Hostitel starého webu | otevření `https://www.veterinahloubetin.cz/kontakty/` | přesměruje na `https://veterinahloubetin.cz/kontakty/`, canonical bez www – shodné s novým webem |

**Co nebylo možné věrohodně ověřit:** Core Web Vitals (panel prohlížeče běžel skrytě a z mezipaměti, náhled nemá GTM a CookieYes –
měřit PageSpeed Insights na testovací adrese WEDOS), chování mobilní lišty při posouvání (IntersectionObserver ve skrytém panelu
nespouští; dříve ověřeno ručně), odeslání formuláře (PHP na náhledu neběží), skutečné čtečky obrazovky.

---

## 7. Otázky, které musí rozhodnout klinika (nebudu je odhadovat)

1. Potvrdit, že finální adresa zůstává `https://veterinahloubetin.cz` bez www (stejně jako dnes, P2-11).
2. Nový text zásad ochrany osobních údajů – kdo ho dodá/schválí? (P1-3)
3. Má mapa a obrázek Firmy.cz čekat na souhlas s cookies? (P1-6)
4. Ponechat povinný souhlas u formuláře, nebo jen informační větu? (P2-4)
5. Barevná varianta tlačítek A (tmavý text) nebo B (tmavší oranžová)? (P1-4)
6. Kam mají chodit zprávy z formuláře a z jaké adresy se mají odesílat (SPF/DKIM na WEDOS)? (P1-1)
7. Souhrnné hodnocení u recenzí – jaká skutečná čísla a z jakého zdroje? (kap. 5, Konverze)
8. Mají být na webu přímá čísla lékařů? (P3-16)

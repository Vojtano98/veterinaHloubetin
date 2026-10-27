# Plán implementace

Navazuje na [AUDIT.md](AUDIT.md) (ID nálezů v závorkách). Etapy jsou seřazené tak, aby každá byla samostatně nasaditelná,
měla jasný test a dala se vrátit jedním commitem. **Nic z toho zatím není provedeno – čeká na schválení.**

Zásady pro všechny etapy:

- Žádná etapa nezapne indexaci. Indexace se zapíná jen při ostrém spuštění podle [MIGRATION_CHECKLIST.md](MIGRATION_CHECKLIST.md).
- Žádné nové knihovny kromě vývojových nástrojů v etapě 1 (`@astrojs/check`, `typescript`).
- Vizuální změny (barvy, fonty, odebrání bloků) ukážu před nasazením na náhledu vedle stávající podoby.
- Změny v GTM se dělají až při spuštění a jen po odsouhlasení.
- Obsah (zásady ochrany údajů, texty souhlasu, odborné texty) dodává nebo schvaluje klinika.

## Přehled a závislosti

```text
Etapa 0  Pojistky indexace + doména z jedné proměnné      ← musí být první (před jakýmkoli nahráním na WEDOS)
   │
Etapa 1  Kontrolní skript, typová kontrola, testy výjimek  ← síť pro všechny další úpravy
   │
   ├── Etapa 2  Konverzní cesty (Reservanto záloha, formulář, karty kontaktů)
   ├── Etapa 3  Kontrast a přístupnost                      ← vyžaduje volbu barevné varianty
   ├── Etapa 4  Výkon (fonty, mobilní banner, originály obrázků)
   └── Etapa 5  Úklid kódu a logika otevírací doby          ← až s testy z etapy 1
   │
Etapa 6  Bezpečnost serveru (.htaccess, CSP Report-Only, PHP)
   │
Etapa 7  Testovací nasazení na WEDOS + test formuláře      ← vyžaduje přístup k hostingu
   │
Etapa 8  Ostré spuštění (MIGRATION_CHECKLIST.md)           ← vyžaduje text zásad (P1-3) a výsledky etapy 7
```

Etapy 2–5 na sobě nezávisí a lze je dělat v libovolném pořadí; doporučené pořadí je podle dopadu: 2 → 3 → 4 → 5.

---

## Etapa 0 – Pojistky indexace a konfigurace domény (P0-1, P2-11, P2-8) – ✅ hotovo 27. 10. 2026

**Cíl:** Build je ve výchozím stavu neindexovatelný. Indexace i doména se nastavují výslovně a na jednom místě.

**Jak je to provedené:**

- `astro.config.mjs` rozhoduje o režimu (`PUBLIC_INDEXING=true` a zároveň ne náhled), vypíše ho na začátku buildu
  a předá stránkám jako `__INDEXING__` (`src/lib/indexing.ts`). Meta robots, `robots.txt` i `.htaccess` tak vychází z jedné hodnoty.
- `PUBLIC_INDEXING=true` bez `PUBLIC_SITE_URL` build zastaví; `PUBLIC_SITE_URL` ve špatném tvaru také. Jiná hodnota než `true`
  (např. `1`) a kombinace s náhledem vypíšou varování a indexace zůstane vypnutá.
- `X-Robots-Tag` do `dist/.htaccess` přidává malá integrace v `astro.config.mjs` (hook `astro:build:done`) – běží automaticky s každým buildem, nedá se zapomenout.
- Na náhledu odstraní sitemapu `scripts/rebase-links.mjs` (přibyl volitelný argument se složkou kvůli testům).
- Pravidlo hostitele v `.htaccess` zůstalo beze změny, jen s komentářem (doména + upozornění, že testovací adresa musí běžet na HTTPS).

**Výsledky testů:** výchozí build – 21/21 stránek `noindex`, `robots.txt` `Disallow: /`, `X-Robots-Tag` v `.htaccess`;
ostrý build (`PUBLIC_INDEXING=true PUBLIC_SITE_URL=…`) – shodný s buildem před změnou až na odstraněný canonical u 404 a komentář
v `.htaccess`; náhled – `noindex`, bez sitemapy a bez odkazu na ni; chybné kombinace proměnných se chovají podle popisu výše;
interní odkazy 0 chyb; vývojový server bez chyb.

**Původní zadání etapy:**

1. Nové proměnné prostředí (názvy k odsouhlasení):
   - `PUBLIC_SITE_URL` – adresa webu (produkce `https://veterinahloubetin.cz`). Čte ji `astro.config.mjs` (`site`)
     a `src/data/site.ts` odvodí `url` z `import.meta.env.SITE`.
   - `PUBLIC_INDEXING` – jen hodnota `true` zapne indexaci. Cokoli jiného = `noindex, nofollow`.
   - `PUBLIC_PREVIEW` zůstává pro vypnutí GTM a CookieYes na náhledu.
2. `src/pages/robots.txt.ts` místo `public/robots.txt`:
   - bez indexace: `User-agent: *` + `Disallow: /`, bez odkazu na sitemapu;
   - s indexací: dnešní obsah (`Allow: /`, `Disallow: /odeslat.php`, `Sitemap: {PUBLIC_SITE_URL}/sitemap-index.xml`).
3. `Base.astro`: `robots` podle `PUBLIC_INDEXING`; u `noindex` stránek (404) nevypisovat canonical (P3-2).
4. Sitemapa: generovat vždy (kvůli kontrole), ale na náhledu GitHub Pages ji z výstupu odstranit (adresy by byly špatně).
5. `.htaccess`: blok s `Header set X-Robots-Tag "noindex, nofollow"`, který se do výstupu zapíše jen bez `PUBLIC_INDEXING=true`
   (malý krok po buildu ve skriptu, stejně jako dnes `rebase-links.mjs`). Chrání i PDF a obrázky.
6. README: postup nasazení rozdělit na „testovací“ (výchozí) a „ostré spuštění“ (s `PUBLIC_INDEXING=true`).
7. Workflow náhledu: beze změny chování (náhled zůstane `noindex`).

**Testy po etapě:**

- `npm run build` bez proměnných → všechny stránky `noindex, nofollow`, `robots.txt` = `Disallow: /`, `.htaccess` obsahuje `X-Robots-Tag`.
- `PUBLIC_INDEXING=true PUBLIC_SITE_URL=https://veterinahloubetin.cz npm run build` → výstup shodný s dnešním produkčním buildem
  (porovnat `diff -r` s dnešním výstupem; rozdíl smí být jen v robots a .htaccess).
- Náhled na GitHub Pages: stránky `noindex`, bez sitemapy.

**Riziko:** nízké. **Návrat:** revert commitu.

---

## Etapa 1 – Minimální automatické kontroly (P2-1) – ✅ hotovo 27. 10. 2026

**Cíl:** Chyby v odkazech, indexaci a časové logice se zachytí před nasazením, bez těžkých nástrojů.

**Jak je to provedené:**

- `tsconfig.json` (`astro/tsconfigs/strict`), dev závislosti `@astrojs/check` a `typescript`, `npm run typecheck`.
  Výsledek: 0 chyb, 0 varování (opravena jedna nápověda – nepoužitý parametr v `rebase-links.mjs`).
- `scripts/check-dist.mjs` (`npm run check`): režim indexace ve všech třech signálech + očekávání podle proměnných, odkazy
  včetně `srcset` a kotev, H1, title, description, canonical (cesta i doména, s `PUBLIC_SITE_URL` i shoda), odkaz na sitemapu,
  JSON-LD, duplicitní `id`, odkazy bez lomítka; při indexaci i adresy v sitemapě. Na náhledu ověří podsložku v odkazech.
- `tests/vyjimky.test.ts` (`npm test`, vestavěný `node:test`): 24 testů – okno čtvrtka 29. 10., výchozí oznámení 7 dní předem,
  pohotovost přes půlnoc, „zítra/zítřka“, obě změny času, den podle Prahy místo UTC, přednost pohotovosti.
- Navíc: `validateVyjimky()` ve `vyjimky.ts` – build se zastaví, když je výjimka v `site.ts` zapsaná špatně
  (tvar data/času, **posun letního/zimního času**, pořadí časů). Do kódu pro prohlížeč se nedostane.
- GitHub Action: typová kontrola → testy → build → úprava odkazů → kontrola výstupu; při chybě se náhled nenasadí.

**Ověření, že kontroly chyby opravdu zachytí:** podstrčený rozbitý odkaz, neexistující kotva, druhá H1 a chybějící
`X-Robots-Tag` → `check` našel všechny 4; změna `<` na `<=` u konce oznámení → 1 test selhal; posun `+02:00` u zimního
data v `site.ts` → build skončil chybou s popisem. Vše vráceno, celý postup pak prošel.

**Původní zadání etapy:**

1. `tsconfig.json` s `"extends": "astro/tsconfigs/strict"`; dev závislosti `@astrojs/check` a `typescript`; skript `npm run typecheck` (`astro check`).
2. `scripts/check-dist.mjs` (vychází z kontrolního skriptu použitého při auditu), `npm run check`:
   - všechny interní odkazy a kotvy existují;
   - každá stránka má právě jednu H1, `title`, `description`, canonical na `PUBLIC_SITE_URL`;
   - režim indexace odpovídá proměnné (`noindex` ⇔ `Disallow: /` ⇔ `X-Robots-Tag`);
   - JSON-LD jde naparsovat;
   - selže s nenulovým kódem a čitelným výpisem.
3. `tests/vyjimky.test.ts` přes vestavěný `node:test` (Node 22+ s `--experimental-strip-types`), `npm test`:
   - `barInfo`: okno `announceFrom`/`announceTo` (např. čt 29. 10. 0:00, 0:01, 18:59, 19:00);
   - `hoursOn`: zavřeno vs. jiné hodiny vs. beze změny;
   - pohotovost přes půlnoc, „zítra“ / „zítřka“, přechod letní → zimní čas (25. 10. 2026) a zimní → letní (28. 3. 2027).
4. GitHub Action: `npm run typecheck && npm test && npm run build && npm run check` před nasazením náhledu.

**Testy po etapě:** úmyslně rozbít jeden odkaz a jedno datum výjimky → `check` / `test` musí selhat; vrátit.

**Riziko:** žádné (web se nemění). Pokud `astro check` najde typové chyby, opravím je v rámci etapy (bez změny chování).

---

## Etapa 2 – Konverzní cesty (P1-7, P2-4, P2-5, P2-6, P3-13) – ✅ hotovo 27. 10. 2026

**Jak je to provedené:**

- **Reservanto:** při načítání text „Načítám rezervační formulář…“, po 8 s bez formuláře karta „Rezervační formulář se
  nepodařilo načíst“ s telefonem a odkazem na kontaktní formulář; prázdný rámeček se schová. Když formulář dorazí později,
  zobrazí se normálně (sleduje se vložení iframe). Ověřeno i se schválně rozbitou adresou skriptu Reservanta.
- **Formulář:** chyba přímo u pole (`aria-describedby`), kurzor na první chybné pole, chyba zmizí hned po opravě. Pravidla
  jsou v `src/lib/kontaktni-formular.ts` (stejná jako v PHP) a mají 8 testů. Bez JavaScriptu `odeslat.php` vrací kód důvodu
  (`?odeslano=0&chyba=pole|rychle|limit|…`) a stránka ukáže konkrétní text. Na náhledu GitHub Pages se formulář jen zkontroluje
  a místo odeslání ukáže, že se zprávy z náhledu neodesílají. Povinný souhlas zůstal – rozhodne klinika.
  Barva chybových textů ztmavena na `#b42318` (kontrast nad 4,5 : 1).
- **Karta „Zanechte nám zprávu“** vede na `/kontakty/#napiste-nam`, e-mail zůstal vidět jako text.
- **Kontaktní karty** odebrány z `/kontakty/` a z článků; konec stránky tvoří vlnka do patičky jako dřív.
  Na telefonu (375 px) jsou stránky kratší: článek o ~390 px, Kontakty o ~370 px. Stránka Články karty ponechává.
- **Názvy akcí:** „Online rezervace“ a „Rezervace služeb“ u tlačítek nahrazeny „Objednat se online“; v hlavičce a mobilní
  liště zůstává krátké „Objednat se“, položka menu a název stránky zůstávají „Rezervace služeb“.
- **Neověřeno:** změnu v `odeslat.php` nešlo spustit (PHP není na počítači ani na náhledu) – otestovat v etapě 7.

1. **Záloha Reservanta (P1-7):** v `rezervace-sluzeb.astro` text „Rezervační formulář se nenačetl…“ s telefonem a odkazem
   na formulář; skrýt, jakmile se v kontejneru objeví iframe (CSS `:has(iframe)`, záložně kontrola po 8 s).
2. **Formulář (P2-4):** chybové texty u polí (`aria-describedby`), kontrola e-mailu a telefonu se stejnými pravidly jako PHP,
   přesnější hláška bez JavaScriptu (kód chyby v URL → konkrétní text). Na náhledu GitHub Pages místo odeslání informace, že se zprávy
   z náhledu neodesílají. Povinnost souhlasu jen podle rozhodnutí kliniky.
3. **Karta „Zanechte nám zprávu“ (P2-6):** odkaz na `/kontakty/#napiste-nam`.
4. **Opakované kontakty (P2-5):** vynechat `ContactCards` na `/kontakty/` a na článcích (na článcích zůstane box „Máte nějaké dotazy?“).
   Ukázat před/po.
5. **Názvy akcí (P3-13):** sjednotit texty tlačítek – návrh „Objednat se online“ (dlouhé místo) a „Objednat se“ (hlavička, lišta).

**Testy:** `npm run check`; ruční průchod: úvod → rezervace; článek → rezervace/telefon; kontakty → formulář (chyby polí,
klávesnice, čtečka – VoiceOver); simulace výpadku Reservanta (zablokovat `booking.reservanto.cz` v DevTools) na mobilu i desktopu.

**Riziko:** nízké; vizuálně zkontrolovat konce stránek (vlnky pod sekcemi).

---

## Etapa 3 – Kontrast a přístupnost (P1-4, P3-3, P3-4, P3-5, P3-15) – ⏳ varianty připravené k výběru (27. 10. 2026)

**Stav:**

- Barvy textu jsou rozdělené podle účelu do proměnných v `global.css` (`--c-cta`, `--c-on-cta`, `--c-accent-text`, `--c-label`,
  `--c-muted`, `--c-bar`, `--c-alert-*`, `--c-burger`, `--c-focus` …) – výchozí hodnoty jsou původní, ostrý web se nezměnil
  (ověřeno porovnáním vypočtených barev všech prvků na 8 stránkách proti nasazenému náhledu).
- Varianty **A** (tmavý text na značkové oranžové) a **B** (tmavší oranžová `#b45309` s bílým textem) jsou jen na náhledu:
  přepínač vlevo dole nebo odkaz `?barvy=a` / `?barvy=b` / `?barvy=puvodni` (`src/components/BarvyPrepinac.astro`, dočasné).
  U B je místo navrhovaného `#c2410c` použitá `#b45309` – má stejný odstín jako značková oranžová (jen tmavší, `#c2410c` je do červena)
  a web ji už používá pro odkazy.
- Změřený kontrast (8 stránek, všechny texty kromě textu přes fotografii): původní 285 z 960 pod WCAG AA, A i B shodně 36 –
  zbývají jen iniciály v kolečkách recenzí a hvězdičky (dekorace, řešit zvlášť).
- **Čeká na volbu kliniky.** Pak: vybrané hodnoty do `:root`, odstranit přepínač a blok variant, ARIA úpravy (body 3–4 níže).

1. Připravit dvě varianty barev na náhledu (A: tmavý text na oranžové, B: tmavší oranžová `#c2410c`) → volba kliniky.
2. Úprava proměnných v `global.css` (nová `--c-cta`, malý oranžový text → `--c-link`, šedé popisky ≥ 4,5 : 1).
3. ARIA: popisek recenzí, `aria-label` pilulky v hlavičce, návrat fokusu po zavření menu, popisky karet kontaktů místo H2.
4. Česky formátované datum u recenzí.

**Testy:** přepočet kontrastu (skript z auditu) – všechny páry ≥ 4,5 : 1 (velký text ≥ 3 : 1); ovládání klávesnicí na všech
stránkách; screenshoty 375 / 1440 px před a po.

**Riziko:** střední vizuálně (dojem ze značky), nízké technicky.

---

## Etapa 4 – Výkon (P2-2, P2-3, P3-7)

1. Mobilní preload obrázku banneru (`media="(max-width: 767px)"`).
2. Fonty: odebrat Nunito Sans; Open Sans nahradit Nunito v `body`, horní liště a zásadách → odebrat import (≈ 83 kB méně na první návštěvu).
3. Originály obrázků ve `src/assets/uploads` zmenšit na max. ~2000 px (výstup pro návštěvníky se nezmění, build bude menší).

**Testy:** porovnání velikosti výstupu před/po; v prohlížeči jen 2 soubory fontů na stránce; vizuální kontrola lišty a zásad;
PageSpeed Insights (mobil) až na testovací adrese WEDOS – změřit před a po.

**Riziko:** nízké.

---

## Etapa 5 – Úklid kódu a logika otevírací doby (P2-9, P3-6, P3-10, P3-11, P3-12, P3-14)

1. Výpočet stavu „Otevřeno/Zavřeno“ přesunout z `OpenStatus.astro` do čisté funkce ve `vyjimky.ts`, komponenta jen vykreslí;
   pokrýt testy z etapy 1 (včetně přechodu času a výjimky na neděli).
2. Zvýraznění dnešního dne v liště přepočítávat spolu s ostatním (po půlnoci).
3. Sjednotit `nav`/`footerNav`, odstranit nepoužitou siluetu sestry jen pokud ji klinika nechce (jinak ponechat pro budoucí fotky),
   telefon v JSON-LD ze `site.phones`.
4. JSON-LD článku použít OG obrázek místo dalšího 1200px JPG.
5. Vyčistit „volné“ seznamy v Markdownu článků (beze změny textu).
6. Skript recenzí: povolit jen odkazy `https://`.

**Testy:** `npm test` (stejné výsledky jako před refaktoringem), `npm run check`, porovnat HTML výstup článků před/po
(rozdíl jen v seznamech a JSON-LD).

**Riziko:** střední u bodu 1 → proto až po etapě 1.

---

## Etapa 6 – Bezpečnost serveru (P2-7, P3-8, P3-9)

1. `.htaccess`: `Content-Security-Policy-Report-Only` s doménami GTM, GA4, Sklik, CookieYes, Reservanto, Google Maps, Firmy.cz;
   `Header unset X-Powered-By`; kratší cache pro soubory bez otisku (`/logo.png`, `/img/*`).
2. `odeslat.php`: `date_default_timezone_set('Europe/Prague')`, log bez e-mailu klienta, rate-limit do vlastní složky,
   chybějící `ts` brát jako podezřelé jen u JS odeslání (bez JS ponechat projít, aby formulář fungoval).

**Testy:** na testovací adrese WEDOS – hlavičky (`curl -I`), konzole bez porušení CSP při běžném procházení, odeslání formuláře,
rezervace, mapa, GTM v Tag Assistantu. Ostrou CSP až po týdnu bez hlášení v produkci.

**Riziko:** střední u CSP → proto jen Report-Only.

---

## Etapa 7 – Testovací nasazení na WEDOS (P1-1, P1-5, P2-10)

Předpoklad: přístup k WEDOS (FTP/SFTP) a rozhodnutí o testovací adrese (subdoména nebo podsložka).

1. Build bez `PUBLIC_INDEXING` (= `noindex` + `X-Robots-Tag`), volitelně HTTP heslo přes `.htaccess`.
2. Ověřit verzi PHP (8.1+), `mail()`, doručení na `ordinace@…`, SPF/DKIM (hlavičky přijaté zprávy).
3. Testy formuláře (bezpečně, jen na vlastní adresu kliniky):
   - prázdný formulář → 422 s výčtem polí; neplatný e-mail; neplatný telefon;
   - vyplněný honeypot `web` → tváří se úspěšně, e-mail neodejde;
   - odeslání do 3 s → 429;
   - 6. odeslání z jedné IP za hodinu → 429;
   - diakritika v jméně a předmětu, odpověď přes Reply-To jde klientovi;
   - bez JavaScriptu → přesměrování s `?odeslano=1`; s chybou `?odeslano=0&chyba=pole` (prázdné pole), `chyba=rychle`,
     `chyba=limit` a na stránce se ukáže odpovídající text.
4. Ověřit dvojí načtení CookieYes (P1-5) se zapnutým GTM (síťový panel).
5. PageSpeed Insights mobil/desktop pro úvod, rezervace a jeden článek (výchozí hodnoty pro etapu 4).
6. Projít rezervaci na telefonu až po poslední krok bez odeslání (P2-10).

**Riziko:** žádné pro ostrý web (testovací adresa je neindexovaná).

---

## Etapa 8 – Ostré spuštění

Podle [MIGRATION_CHECKLIST.md](MIGRATION_CHECKLIST.md). Předpoklady: etapy 0, 1 a 7 hotové, schválený text zásad (P1-3),
připravené změny GTM (P1-2) k odsouhlasení.

---

## Odhad náročnosti

| Etapa | Náročnost | Blokuje spuštění |
| --- | --- | --- |
| 0 Pojistky indexace a doména | S – ✅ hotovo | ano |
| 1 Automatické kontroly | M – ✅ hotovo | doporučeno |
| 2 Konverzní cesty | M – ✅ hotovo | ne (záloha Reservanta doporučena) |
| 3 Kontrast a přístupnost | S–M + volba varianty | ne |
| 4 Výkon | S | ne |
| 5 Úklid kódu | M | ne |
| 6 Bezpečnost serveru | M | ne (CSP Report-Only lze i po spuštění) |
| 7 Testovací nasazení WEDOS | M | ano |
| 8 Ostré spuštění | M | – |

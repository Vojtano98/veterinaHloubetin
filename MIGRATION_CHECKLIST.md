# Přechod z WordPressu na nový web (WEDOS)

Navazuje na [AUDIT.md](AUDIT.md) a [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md).
Stav k 31. 10. 2026: nový web běží jen jako náhled na GitHub Pages (`noindex`), na `veterinahloubetin.cz` je stále WordPress.

Pořadí: **A** podklady → **B** zálohy a výchozí data → **C** test na testovací adrese → **D** výměna webu → **E** Google a ostatní vyhledávače → **F** první měsíc.
Oddíl **G** je plán návratu, **H** kontrolní příkazy.

## Výchozí situace (ověřeno 31. 10. 2026)

- **Doména, DNS, e-mail i web jsou u WEDOS.** DNS se nemění, TTL se nesnižuje, Change of Address v Search Console není potřeba: adresa webu zůstává stejná, mění se jen obsah složky na hostingu.
- **WordPress leží ve `www/domains/veterinahloubetin.cz/`** (ověřeno: soubory WordPressu jsou dostupné i přes tuto cestu). Soubor `www/.htaccess` obsluhuje směrování do této složky, **nenahrazuje se**. Vlastní `.htaccess` nového webu patří do složky webu.
- Před webem stojí **WEDOS Global Protection** (CDN). Po výměně je nutné vyčistit její cache.
- `test.veterinahloubetin.cz` už míří na hosting a má platný certifikát (`*.veterinahloubetin.cz`).
- Doména má ověření Google v DNS (`google-site-verification`), to zůstává a výměna webu ho neovlivní.
- Na e-maily z formuláře jsou v DNS připravené DKIM klíče `key1/key2.wedos-dkim`, SPF končí `-all`, DMARC je `p=none`.

**Porovnání živého WordPressu s novým webem** (všech 20 stránek ze sitemapy):

| Co | Výsledek |
| --- | --- |
| `title` | 20 z 20 shodných |
| `canonical` | 20 z 20 shodných |
| `description` | 10 shodných, 7 stránek ho na starém webu nemělo a teď ho má, 3 mírně upravené |
| Text | zachovaný; rozdíly jsou drobná vylepšení (úvodní text, aktualizace čipování o Centrální evidenci psů, ceny v článcích o kastraci nahrazené odkazem na ceník) |
| H1 | na každé stránce právě jedna (starý web měl na stránce i 10 H1, na Ceníku, Kontaktech, Rezervaci a Článcích žádnou skutečnou) |
| Sitemapa | 23 starých adres: 20 stránek, 3 přesměrování (`/sluzby/`, `/o-nas/`, `/category/nezarazene/`) |
| Strukturovaná data | `VeterinaryCare`, `BlogPosting` s autorem, `FAQPage`, `BreadcrumbList` (starý web měl jen obecné `Organization` a `Article`) |

**Doplněno při porovnání:** 131 starých adres obrázků zůstává funkčních (originály ve `wp-content/uploads`, zmenšeniny 301 na originál),
7 starých PDF letáků přesměrovává na svůj článek (obsahovaly staré ceny a informace o čipování), archivy `/2024/…` vedou na `/clanky/`.

## Co nikdy nedělat

- `PUBLIC_INDEXING=true` jinde než v buildu pro ostré spuštění (oddíl D).
- Nahrát ostrý build bez kontroly z D2. **Nahraný `noindex` je největší riziko celé výměny.**
- Přepsat nebo smazat `www/.htaccess`. Na hostingu není koš, obnova zálohy WEDOS je placená.
- Nechat starý WordPress kdekoli ve složce `www/`, byl by dál dostupný přes web.
- Smazat WordPress nebo jeho databázi dřív než po 30 dnech (F).
- Přidat HSTS `preload` nebo zapnout ostrou CSP dřív než po týdnu bez hlášení.

---

## A. Podklady a rozhodnutí

| | Co | Kdo | Poznámka |
| --- | --- | --- | --- |
| ☐ | Přístup do administrace WEDOS a hlavní FTP účet | klinika/správce | hesla zadává majitel účtu sám |
| ☐ | Přístup do GTM, GA4, Search Console, Bing Webmaster, Sklik, Google profilu firmy | klinika/správce | nutné pro B, D, E |
| ☐ | Schválený text zásad ochrany osobních údajů | klinika | P1-3, blokuje spuštění |
| ☐ | Příjemce e-mailů z formuláře | klinika | výchozí `ordinace@veterinahloubetin.cz` |
| ☐ | Mapa a logo Firmy.cz až po souhlasu s cookies? | klinika | P1-6 |
| ☐ | Povinný souhlas u formuláře, nebo informační věta | klinika | P2-4 |
| ☐ | **Hlavní telefon:** starý web používá v části odkazů `+420 281 863 796`, nový všude `+420 773 665 751`. Potvrdit, že je to správně | klinika | stejné číslo musí být na Google profilu a Firmy.cz (E4) |
| ☐ | Sklik retargeting zapnout/vypnout | klinika | z auditu GTM |
| ☐ | Termín výměny: **úterý nebo středa po 19:00** | vy | druhý den je čas na opravy, ne v pátek |

## B. Zálohy a výchozí data (před čímkoli dalším)

1. ☐ **Soubory:** přes FileZillu stáhnout celou složku `www/domains/veterinahloubetin.cz/` do počítače. Soubor `www/.htaccess` zvlášť.
2. ☐ **Databáze:** administrace WEDOS → Webhosting → databáze → phpMyAdmin → Export. Ověřit, že soubor není prázdný.
3. ☐ **Search Console:** Výkon → 12 měsíců → Exportovat (stránky, dotazy). Podle tohoto souboru se bude měřit, jestli se pozice udržely.
4. ☐ **GA4:** 50 nejnavštěvovanějších vstupních stránek za 12 měsíců. Každá musí mít na novém webu stránku nebo přesměrování. Co chybí, doplnit do `public/.htaccess`.
5. ☐ **GTM:** v pracovním prostoru připravit změny podle auditu (`contactFormSubmit`, telefon, kontrola `reservationComplete`). **Nepublikovat.**

## C. Test na `test.veterinahloubetin.cz` (etapa 7)

Na ostrý web to nemá vliv, WordPress běží dál.

1. ☐ Administrace WEDOS → Konfigurace PHP: verze musí být **8.1 nebo vyšší**. Pokud je nižší, nejdřív ověřit, že ji WordPress zvládne; změna se projeví do 30 minut.
2. ☐ Sestavit neindexovaný build (výchozí režim):

   ```bash
   npm ci
   ```

   ```bash
   npm run build
   ```

   Na začátku výpisu musí být `[indexace] vypnutá (noindex)`.
3. ☐ Přes FileZillu vytvořit `www/domains/test.veterinahloubetin.cz/` a nahrát do ní **obsah** složky `dist/` včetně `.htaccess`.
4. ☐ Vedle `odeslat.php` vytvořit dočasně `odeslat.config.php`, aby zkušební zprávy chodily do Gmailu (tam jdou přečíst výsledky SPF/DKIM):

   ```php
   <?php
   return ['to' => 'vas-gmail@gmail.com'];
   ```

5. ☐ Otestovat formulář podle etapy 7 v [plánu](IMPLEMENTATION_PLAN.md). Navíc:
   - v Gmailu „Zobrazit originál“: **DKIM a DMARC musí být PASS**. Když SPF selže, přidat do SPF adresy webhostingu podle návodu WEDOS pro doménu za Protection (`v=spf1 mx a ip4:… include:_spf.we.wedos.net -all`);
   - po 5 zprávách z Wi-Fi odeslat šestou z telefonu **přes mobilní data**. Musí projít. Když ne, server vidí místo návštěvníka adresu proxy a limit by platil pro všechny dohromady, je potřeba opravit `odeslat.php`.
6. ☐ Spustit [kontroly z oddílu H](#h-kontrolní-příkazy) nad testovací adresou, jen s tím, že `X-Robots-Tag: noindex` tam být **musí**.
7. ☐ Rezervace na telefonu do posledního kroku bez odeslání, souhlas s cookies, konzole prohlížeče bez hlášení CSP, PageSpeed mobil (úvod, rezervace, článek).
8. ☐ Hotové výsledky si zapsat. Bez úspěšného testu formuláře se do D nejde.

## D. Výměna webu

Trvá asi 30 minut, web je nedostupný jen několik sekund mezi dvěma přejmenováními.

**D1. Ostrý build**

```bash
PUBLIC_SITE_URL=https://veterinahloubetin.cz PUBLIC_INDEXING=true npm run build
```

Na začátku výpisu musí být `[indexace] ZAPNUTÁ – https://veterinahloubetin.cz`.

**D2. Kontrola před nahráním** (tohle je pojistka proti nahranému `noindex`)

```bash
PUBLIC_SITE_URL=https://veterinahloubetin.cz PUBLIC_INDEXING=true npm run check
```

Musí skončit `vše v pořádku` a `indexace: ZAPNUTÁ`.

**D3. Nahrání vedle běžícího webu**

1. ☐ Přes FileZillu vytvořit `www/domains/novy-web/` a nahrát do ní obsah `dist/` včetně `.htaccess`. WordPress zatím běží.
2. ☐ Ve FileZille zapnout Server → Vynutit zobrazení skrytých souborů a ověřit, že je `.htaccess` nahraný.
3. ☐ Pokud se příjemce formuláře liší od výchozího, nahrát `odeslat.config.php` (není v repozitáři).

**D4. Přepnutí** (hned po sobě, v tomto pořadí)

1. ☐ Přesunout `www/domains/veterinahloubetin.cz` do kořene FTP (vedle `www`) jako `wp-zaloha`. Pokud to hosting nedovolí, napsat do ní `.htaccess` s řádkem `Require all denied`.
2. ☐ Přejmenovat `www/domains/novy-web` na `www/domains/veterinahloubetin.cz`.
3. ☐ Vyčistit cache: [client.wedos.global](https://client.wedos.global/) → doména → **CDN Cache** → vyčistit.
4. ☐ Pokud web hlásí 403: administrace WEDOS → Nástroje → Opravit práva souborů.

**D5. Lomítko na konci adresy**

V `www/.htaccess` (po záloze) změnit u dvou řádků `[R]` na `[R=301,L]`, jinak by `/kontakty` přesměrovávalo dočasně (302):

```apache
RewriteRule ^domains/[^/]+/(.+[^/])$ /$1/ [R=301,L]
RewriteRule ^subdom/[^/]+/(.+[^/])$ /$1/ [R=301,L]
```

**D6. Kontrola do 30 minut**

1. ☐ [Oddíl H](#h-kontrolní-příkazy) celý. **Žádný `X-Robots-Tag`, `robots.txt` s `Allow: /`.**
2. ☐ Zkušební zpráva z formuláře dorazí do ordinace, odpověď jde na adresu odesílatele.
3. ☐ Rezervace se načte, lišta ukazuje správný stav, cookie lišta se objeví jednou.
4. ☐ Publikovat připravené změny GTM (jen po odsouhlasení), ověřit v Tag Assistantu a GA4 Realtime.
5. ☐ Administrace WEDOS → Doplňkové služby → Accesslog → aktivovat dočasně na 24 hodin zdarma (jednou za 30 dní). Druhý den z něj vypsat 404.
6. ☐ Smazat `www/domains/test.veterinahloubetin.cz/`.

Když cokoli z bodů 1–3 selže a nejde to opravit do 30 minut, následuje [plán návratu](#g-plán-návratu).

## E. Google, Seznam, Bing a AI asistenti (hned po D)

1. ☐ **Search Console, Sitemapy:** odebrat `sitemap_index.xml`, přidat `https://veterinahloubetin.cz/sitemap-index.xml`.
2. ☐ **Search Console, Kontrola URL:** úvod, Kontakty, Rezervace, Ceník a 3 nejnavštěvovanější články → Otestovat živou URL (musí vyjít „lze indexovat“ a vykreslená stránka s obsahem) → Požádat o indexaci.
3. ☐ **Bing Webmaster Tools:** import vlastnosti ze Search Console, odeslat sitemapu. Z Bingu vychází i Copilot a část odpovědí ChatGPT.
4. ☐ **Stejné údaje všude:** Google profil firmy, Firmy.cz, Facebook, Instagram, Mapy.cz: název, adresa, telefon, hodiny a web přesně jako na novém webu. Pro místní výsledky a AI odpovědi je tahle shoda důležitější než cokoli na webu.
5. ☐ **Blokace robotů:** WEDOS Protection při testu odmítla zkušební požadavky s označením Googlebot, Bingbot, SeznamBot, GPTBot a OAI-SearchBot (kód 455). Důvodem je pravděpodobně ochrana proti falešným robotům, ClaudeBot a PerplexityBot prošly. Skutečné roboty ověří živý test z bodu 2 a stejný nástroj v Bingu; v `client.wedos.global` projít pravidla pro boty a povolit `OAI-SearchBot` a `GPTBot`.
6. ☐ **Rich Results Test** na úvodní stránce a jednom článku: `VeterinaryCare`, `FAQPage`, `BreadcrumbList` bez chyb.

### Co je pro AI vyhledávání (GEO) hotové

- Obsah je v čistém HTML bez závislosti na JavaScriptu, `robots.txt` nikoho neomezuje.
- Klinika je popsaná jako `VeterinaryCare` s adresou, GPS, hodinami, spádovou oblastí a odkazy na profily (`sameAs`).
- Články mají autora, shrnutí na začátku, otázky a odpovědi (`FAQPage`) a datum aktualizace.
- `llms.txt` záměrně není: velcí poskytovatelé nepotvrdili, že ho používají, a robots a sitemapa pokrývají totéž.

Další růst už nezáleží na technice, ale na recenzích, zmínkách na jiných webech a pravidelných článcích.

## F. První měsíc

| Kdy | Co |
| --- | --- |
| T+1 | Accesslog: nejčastější 404 → doplnit přesměrování. GA4 vidí formulář, rezervaci a kliky na telefon. |
| T+3 | Search Console → Stránky: žádné neočekávané `noindex`, 404 ani chyby serveru. |
| T+7 | Výkon proti exportu z B3. PageSpeed mobil. Konzole bez hlášení CSP → rozhodnout o ostré CSP. |
| T+14 | Odpojit od Search Console staré sitemapy, pokud tam ještě jsou. Zkontrolovat pozice hlavních dotazů. |
| T+30 | Porovnat návštěvnost a konverze s minulým měsícem. Teprve potom smazat `wp-zaloha` a databázi WordPressu (zálohy v počítači zůstávají). |

**Co čekat:** adresy, titulky i obsah zůstávají, takže jde o nejbezpečnější typ výměny. Výkyvy pozic v řádu dnů až několika týdnů jsou přesto běžné a nikdo nemůže zaručit, že nenastanou. Znepokojivý je až propad, který po 2 až 3 týdnech neodeznívá, nebo nárůst chyb v Search Console.

Týdenní úloha recenzí: po spuštění ověřit, že se doplněné recenze dostanou i na WEDOS, ne jen na náhled (GitHub Action nasazuje jen náhled).

## G. Plán návratu

1. Přejmenovat `www/domains/veterinahloubetin.cz` na `www/domains/novy-web`.
2. Přesunout `wp-zaloha` zpět na `www/domains/veterinahloubetin.cz`.
3. Vyčistit CDN cache (`client.wedos.global` → CDN Cache).
4. V GTM vrátit předchozí verzi kontejneru.
5. V Search Console vrátit `sitemap_index.xml`.

Trvá několik minut. DNS se neměnilo, nic dalšího vracet nejde.

## H. Kontrolní příkazy

Každý příkaz zvlášť. Pro testovací adresu nahradit doménu za `test.veterinahloubetin.cz`.

```bash
curl -sI http://veterinahloubetin.cz/ | grep -i -E "^(HTTP|location)"
```

```bash
curl -sI https://www.veterinahloubetin.cz/kontakty | grep -i -E "^(HTTP|location)"
```

```bash
curl -s https://veterinahloubetin.cz/robots.txt
```

```bash
curl -sI https://veterinahloubetin.cz/ | grep -i -E "^HTTP|x-robots-tag|strict-transport|x-content-type|referrer-policy|x-frame"
```

```bash
curl -sI https://veterinahloubetin.cz/odeslat.config.php | head -1
```

```bash
curl -sI https://veterinahloubetin.cz/o-nas/ | grep -i -E "^(HTTP|location)"
```

```bash
curl -sI https://veterinahloubetin.cz/wp-content/uploads/2024/05/Sleeping-Cat-Close-up-300x200.jpg | grep -i -E "^(HTTP|location)"
```

```bash
curl -s https://veterinahloubetin.cz/ | grep -o '<meta name="robots"[^>]*>'
```

Očekávané výsledky:

| Kontrola | Očekávání |
| --- | --- |
| `http://` → `https://` | jedna 301 na `https://veterinahloubetin.cz/` |
| `www` + bez lomítka | 301 na `https://veterinahloubetin.cz/kontakty`, potom 301 na `/kontakty/` |
| `robots.txt` | `Allow: /`, `Disallow: /odeslat.php`, řádek `Sitemap:` |
| Hlavičky | HSTS, nosniff, Referrer-Policy, X-Frame-Options; **žádný** `X-Robots-Tag` |
| `odeslat.config.php` | 403 |
| Staré adresy (`/o-nas/`, `/sluzby/`, `/cenik/`, `/category/…`, `/feed/`, `/2024/`) | 301 na novou adresu |
| Zmenšenina obrázku | 301 na originál ve `wp-content/uploads` |
| `meta robots` | `index, follow, …` |
| Přesměrování nevrací `http://` | všechny `location` začínají `https://` |
| Neexistující adresa | 404 se stránkou „Tuto stránku jsme nenašli“ |
| Sdílení odkazu | náhled s obrázkem (Facebook Sharing Debugger) |

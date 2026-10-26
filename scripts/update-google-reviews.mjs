// Stáhne aktuální recenze kliniky z Google Places API (New) a uloží je do src/data/reviews.json.
// Spouští se jednou týdně v GitHub Actions (.github/workflows/reviews.yml), lze spustit i ručně:
//   GOOGLE_PLACES_API_KEY=… node scripts/update-google-reviews.mjs
//
// Proměnné prostředí:
//   GOOGLE_PLACES_API_KEY  API klíč s povoleným „Places API (New)“ (povinný, bez něj se nic nemění)
//   GOOGLE_PLACE_ID        ID provozovny; když chybí, skript ji najde podle názvu a adresy a ID vypíše
//   GOOGLE_PLACES_MOCK     cesta k JSON s odpovědí API (jen pro testování bez klíče)
//
// Podle pravidel Googlu se recenze nesmí ukládat natrvalo – soubor se proto při každém běhu
// přepíše aktuální várkou z API (Google vrací nejvýš 5 recenzí). Zobrazujeme jen 4 a 5 hvězdiček.

import { readFile, writeFile } from 'node:fs/promises';

const OUT = new URL('../src/data/reviews.json', import.meta.url);
const SEARCH = 'Veterinární klinika Hloubětín, Mochovská 535, Praha';
const MIN_RATING = 4;

const key = process.env.GOOGLE_PLACES_API_KEY;
const mock = process.env.GOOGLE_PLACES_MOCK;
let placeId = process.env.GOOGLE_PLACE_ID;

async function api(url, { method = 'GET', fields, body } = {}) {
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask': fields,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Google API ${res.status}: ${data.error?.message ?? res.statusText}`);
  return data;
}

async function loadPlace() {
  if (mock) return JSON.parse(await readFile(mock, 'utf8'));
  if (!placeId) {
    const found = await api('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      fields: 'places.id,places.displayName,places.formattedAddress',
      body: { textQuery: SEARCH, languageCode: 'cs' },
    });
    const first = found.places?.[0];
    if (!first) throw new Error(`Provozovna „${SEARCH}“ nebyla nalezena`);
    placeId = first.id;
    console.log(`Nalezena provozovna: ${first.displayName?.text} – ${first.formattedAddress}`);
    console.log(`Tip: uložte GOOGLE_PLACE_ID=${placeId}, ať se nemusí pokaždé hledat.`);
  }
  return api(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=cs`, {
    fields: 'id,displayName,rating,userRatingCount,reviews',
  });
}

// Datum ve formátu DD/MM/RRRR (stejný jako dosavadní ručně vložené recenze)
const toDate = (iso) => {
  const [d, m, y] = new Intl.DateTimeFormat('cs-CZ', {
    timeZone: 'Europe/Prague',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
    .format(new Date(iso))
    .split('.')
    .map((p) => p.trim());
  return `${d}/${m}/${y}`;
};

async function main() {
  if (!key && !mock) {
    console.log('GOOGLE_PLACES_API_KEY není nastavený – recenze zůstávají beze změny.');
    return;
  }

  const place = await loadPlace();
  const reviews = (place.reviews ?? [])
    .filter((r) => (r.rating ?? 0) >= MIN_RATING)
    .map((r) => ({
      name: r.authorAttribution?.displayName ?? 'Uživatel Google',
      date: toDate(r.publishTime),
      rating: r.rating,
      text: (r.originalText?.text ?? r.text?.text ?? '').trim(),
      url: r.authorAttribution?.uri,
    }))
    .filter((r) => r.text);

  console.log(
    `Google: hodnocení ${place.rating ?? '?'} z ${place.userRatingCount ?? '?'} recenzí, ` +
      `API vrátilo ${place.reviews?.length ?? 0}, zobrazíme ${reviews.length} (${MIN_RATING}+ hvězdičky).`,
  );

  // Pojistka: prázdná odpověď nesmí smazat recenze z webu
  if (reviews.length === 0) {
    console.log('Žádné vhodné recenze – soubor zůstává beze změny.');
    return;
  }

  const next = JSON.stringify(reviews, null, 2) + '\n';
  const prev = await readFile(OUT, 'utf8').catch(() => '');
  if (prev === next) {
    console.log('Recenze se nezměnily.');
    return;
  }
  await writeFile(OUT, next);
  console.log('Soubor src/data/reviews.json aktualizován.');
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});

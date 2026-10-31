// Mimořádné časy. Vyhodnocují se až v prohlížeči podle aktuálního času v Praze,
// takže se výjimka sama zobrazí a po skončení sama zmizí – bez nového nasazení webu.
//
// Dva druhy (pole `kind`):
//   pohotovost – časové okno mimořádné pohotovosti (lišta s telefonem, pilulka „Pohotovost do …“)
//   hodiny     – jiná otevírací doba pro konkrétní den, nebo zavřeno (lišta s oznámením, pilulka počítá s ní)

export type Pohotovost = {
  kind?: 'pohotovost';
  /** Začátek a konec ve formátu ISO s časovou zónou, např. 2026-10-25T20:30:00+01:00 */
  from: string;
  to: string;
  /** Od kdy se má v horní liště předem oznamovat (výchozí: začátek výjimky) */
  announceFrom?: string;
};

export type Hodiny = {
  kind: 'hodiny';
  /** Den ve formátu RRRR-MM-DD */
  date: string;
  /** Otevírací doba v ten den, např. '09:00' a '19:00'; vynechat = celý den zavřeno */
  opens?: string;
  closes?: string;
  /** Od kdy se má v horní liště předem oznamovat (ISO s časovou zónou; výchozí: 7 dní předem) */
  announceFrom?: string;
  /** Do kdy se má v liště oznamovat (ISO s časovou zónou; výchozí: do konce dne) */
  announceTo?: string;
};

export type Vyjimka = Pohotovost | Hodiny;

const TZ = 'Europe/Prague';
const DAY = 86_400_000;

const isHodiny = (v: Vyjimka): v is Hodiny => v.kind === 'hodiny';
const isPohotovost = (v: Vyjimka): v is Pohotovost => v.kind !== 'hodiny';

/** Kalendářní den v Praze jako RRRR-MM-DD */
export const dateKey = (d: Date) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);

/** Kalendářní den v Praze jako číslo (pro porovnání dnes / zítra) */
const dayNum = (d: Date) => Date.parse(`${dateKey(d)}T00:00:00Z`) / DAY;
const keyNum = (key: string) => Date.parse(`${key}T00:00:00Z`) / DAY;

export const time = (d: Date) =>
  new Intl.DateTimeFormat('cs-CZ', { timeZone: TZ, hour: 'numeric', minute: '2-digit' }).format(d);

const date = (d: Date) => new Intl.DateTimeFormat('cs-CZ', { timeZone: TZ, day: 'numeric', month: 'numeric' }).format(d);
const fmt = (t: string) => t.replace(/^0/, '');

/** „dnes“ / „zítra“ / „26. 10.“ vůči aktuálnímu dni */
const when = (d: Date, now: Date) => {
  const diff = dayNum(d) - dayNum(now);
  return diff === 0 ? 'dnes' : diff === 1 ? 'zítra' : date(d);
};

/** „“ / „zítřka“ / „26. 10.“ – pro spojení „do …“ */
const until = (d: Date, now: Date) => {
  const diff = dayNum(d) - dayNum(now);
  return diff === 0 ? '' : diff === 1 ? 'zítřka ' : `${date(d)} `;
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const parse = (list: Vyjimka[]) =>
  list.filter(isPohotovost).map((v) => ({
    from: new Date(v.from),
    to: new Date(v.to),
    announceFrom: new Date(v.announceFrom ?? v.from),
  }));

/** Právě probíhající pohotovost */
export function current(list: Vyjimka[], now = new Date()) {
  return parse(list).find((v) => now >= v.from && now < v.to);
}

/** Pohotovost, která dnes ještě začne */
export function laterToday(list: Vyjimka[], now = new Date()) {
  return parse(list).find((v) => now < v.from && dayNum(v.from) === dayNum(now));
}

/** Jiná otevírací doba pro den, ve kterém leží `d`: [otevírá, zavírá], null = zavřeno, undefined = beze změny */
export function hoursOn(list: Vyjimka[], d: Date): [string, string] | null | undefined {
  const h = list.filter(isHodiny).find((v) => v.date === dateKey(d));
  if (!h) return undefined;
  return h.opens && h.closes ? [h.opens, h.closes] : null;
}

const dayIn = ['v neděli', 'v pondělí', 'v úterý', 've středu', 've čtvrtek', 'v pátek', 'v sobotu'];

/** Oznámení do horní lišty: pohotovost (s telefonem) má přednost před změnou hodin */
export function barInfo(list: Vyjimka[], now = new Date()): { kind: 'pohotovost' | 'hodiny'; text: string } | null {
  const v = parse(list).find((x) => now >= x.announceFrom && now < x.to);
  if (v) {
    // Text vždy končí slovem „pohotovost:“, aby na mobilu mohlo zůstat na řádku s telefonem
    const text =
      now >= v.from
        ? `Do ${until(v.to, now)}${time(v.to)} mimořádná pohotovost:`
        : `${cap(when(v.from, now))} od ${time(v.from)} do ${until(v.to, now)}${time(v.to)} mimořádná pohotovost:`;
    return { kind: 'pohotovost', text };
  }

  const today = dayNum(now);
  const h = list
    .filter(isHodiny)
    .filter((x) => keyNum(x.date) >= today)
    .filter((x) => now >= (x.announceFrom ? new Date(x.announceFrom) : new Date((keyNum(x.date) - 7) * DAY)))
    .filter((x) => !x.announceTo || now < new Date(x.announceTo))
    .sort((a, b) => keyNum(a.date) - keyNum(b.date))[0];
  if (!h) return null;

  const diff = keyNum(h.date) - today;
  const d = new Date(`${h.date}T12:00:00Z`);
  const den = diff === 0 ? 'Dnes' : diff === 1 ? `Zítra (${date(d)})` : cap(`${dayIn[d.getUTCDay()]} ${date(d)}`);
  const what = h.opens && h.closes ? `výjimečně otevřeno ${fmt(h.opens)}–${fmt(h.closes)}` : 'výjimečně zavřeno';
  return { kind: 'hodiny', text: `${den} ${what}.` };
}

/** Konec probíhající pohotovosti pro pilulku („8:00“ nebo „zítřka 8:00“) */
export const untilText = (to: Date, now = new Date()) => `${until(to, now)}${time(to)}`;

/** Týdenní rozvrh: index 0 = neděle, [otevírá, zavírá] nebo null = zavřeno */
export type Rozvrh = ([string, string] | null)[];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const dayShort = ['ne', 'po', 'út', 'st', 'čt', 'pá', 'so'];

const toMin = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

/** Den v týdnu (0 = neděle) a minuta dne v Praze */
function nowInPrague(d: Date) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return { day: WEEKDAYS.indexOf(get('weekday')), min: Number(get('hour')) * 60 + Number(get('minute')) };
}

/** Stav pro pilulku „Otevřeno / Zavřeno“; compact = krátký text do hlavičky a patičky */
export function openStatus(schedule: Rozvrh, list: Vyjimka[], compact: boolean, now = new Date()) {
  const ex = current(list, now);
  if (ex) {
    const text = compact ? `Pohotovost do ${time(ex.to)}` : `Mimořádná pohotovost · do ${untilText(ex.to, now)}`;
    return { open: false, emergency: true, text };
  }

  const { day, min } = nowInPrague(now);
  // Otevírací doba za `i` dní: výjimka pro ten den (např. 9:00–19:00 nebo zavřeno), jinak běžný rozvrh.
  // Poledne daného kalendářního dne, aby změna času nikdy nepřeskočila na vedlejší den.
  const hoursIn = (i: number) => {
    const exception = hoursOn(list, new Date((dayNum(now) + i + 0.5) * DAY));
    return exception === undefined ? schedule[(day + i) % 7] : exception;
  };

  const today = hoursIn(0);
  const open = Boolean(today && min >= toMin(today[0]) && min < toMin(today[1]));
  const opensLaterToday = Boolean(today && min < toMin(today[0]));
  let text = '';
  if (open) {
    text = compact ? `Otevřeno do ${fmt(today![1])}` : `Nyní otevřeno · zavíráme v ${fmt(today![1])}`;
  } else if (opensLaterToday) {
    text = compact ? `Zavřeno · dnes ${fmt(today![0])}` : `Nyní zavřeno · otevíráme dnes v ${fmt(today![0])}`;
  } else {
    for (let i = 1; i <= 7; i++) {
      const hours = hoursIn(i);
      if (!hours) continue;
      const d = (day + i) % 7;
      text = compact
        ? `Zavřeno · ${i === 1 ? 'zítra' : dayShort[d]} ${fmt(hours[0])}`
        : `Nyní zavřeno · otevíráme ${i === 1 ? 'zítra' : dayIn[d]} v ${fmt(hours[0])}`;
      break;
    }
  }

  // Po zavírací době, ale ještě dnes začne mimořádná pohotovost: oranžově, ne červeně jako „zavřeno“
  const later = laterToday(list, now);
  if (!open && later && !opensLaterToday) {
    const text = compact ? `Pohotovost od ${time(later.from)}` : `Dnes mimořádná pohotovost od ${time(later.from)}`;
    return { open: false, emergency: true, text };
  }
  return { open, emergency: false, text };
}

const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(Z|[+-]\d{2}:\d{2})$/;
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Posun času v Praze v daném okamžiku: „+01:00“ v zimě, „+02:00“ v létě */
const pragueOffset = (d: Date) =>
  new Intl.DateTimeFormat('en-US', { timeZone: TZ, timeZoneName: 'longOffset' })
    .formatToParts(d)
    .find((p) => p.type === 'timeZoneName')
    ?.value.replace('GMT', '') || '+00:00';

/** Kontrola zápisu výjimek v site.ts (tvar data, letní/zimní čas, pořadí časů). Prázdný seznam = v pořádku. */
export function validateVyjimky(list: Vyjimka[]): string[] {
  const problems: string[] = [];
  const instant = (label: string, value?: string) => {
    if (value === undefined) return undefined;
    if (!ISO.test(value) || Number.isNaN(Date.parse(value))) {
      problems.push(`${label}: „${value}“ není datum a čas ve tvaru 2026-10-25T20:30:00+01:00`);
      return undefined;
    }
    const d = new Date(value);
    const offset = value.endsWith('Z') ? '+00:00' : value.slice(-6);
    if (offset !== pragueOffset(d)) problems.push(`${label}: „${value}“ má posun ${offset}, v Praze tehdy platí ${pragueOffset(d)} (letní/zimní čas)`);
    return d;
  };

  list.forEach((v, i) => {
    const name = `výjimka č. ${i + 1}`;
    if (isHodiny(v)) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(v.date) || new Date(`${v.date}T12:00:00Z`).toISOString().slice(0, 10) !== v.date) {
        problems.push(`${name}: datum „${v.date}“ musí být skutečný den ve tvaru RRRR-MM-DD`);
      }
      if (Boolean(v.opens) !== Boolean(v.closes)) problems.push(`${name}: zadejte opens i closes, nebo ani jedno (= celý den zavřeno)`);
      else if (v.opens && v.closes) {
        if (!HHMM.test(v.opens) || !HHMM.test(v.closes)) problems.push(`${name}: časy musí mít tvar HH:MM, např. '09:00'`);
        else if (v.opens >= v.closes) problems.push(`${name}: otevírá (${v.opens}) až po zavření (${v.closes})`);
      }
      const from = instant(`${name} announceFrom`, v.announceFrom);
      const to = instant(`${name} announceTo`, v.announceTo);
      if (from && to && from >= to) problems.push(`${name}: announceFrom musí být dřív než announceTo`);
    } else {
      const from = instant(`${name} from`, v.from);
      const to = instant(`${name} to`, v.to);
      const announce = instant(`${name} announceFrom`, v.announceFrom);
      if (from && to && from >= to) problems.push(`${name}: začátek (from) musí být dřív než konec (to)`);
      if (from && announce && announce > from) problems.push(`${name}: announceFrom nesmí být až po začátku pohotovosti`);
    }
  });
  return problems;
}

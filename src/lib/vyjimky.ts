// Mimořádné časy (např. noční pohotovost). Vyhodnocují se až v prohlížeči podle aktuálního času v Praze,
// takže se výjimka sama zobrazí a po skončení sama zmizí – bez nového nasazení webu.

export type Vyjimka = {
  /** Začátek a konec ve formátu ISO s časovou zónou, např. 2026-10-25T20:30:00+01:00 */
  from: string;
  to: string;
  /** Od kdy se má v horní liště předem oznamovat (výchozí: začátek výjimky) */
  announceFrom?: string;
};

const TZ = 'Europe/Prague';

/** Kalendářní den v Praze jako číslo (pro porovnání dnes / zítra) */
const dayKey = (d: Date) => {
  const [y, m, day] = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' })
    .format(d)
    .split('-')
    .map(Number);
  return Date.UTC(y, m - 1, day) / 86_400_000;
};

export const time = (d: Date) =>
  new Intl.DateTimeFormat('cs-CZ', { timeZone: TZ, hour: 'numeric', minute: '2-digit' }).format(d);

const date = (d: Date) => new Intl.DateTimeFormat('cs-CZ', { timeZone: TZ, day: 'numeric', month: 'numeric' }).format(d);

/** „dnes“ / „zítra“ / „26. 10.“ vůči aktuálnímu dni */
const when = (d: Date, now: Date) => {
  const diff = dayKey(d) - dayKey(now);
  return diff === 0 ? 'dnes' : diff === 1 ? 'zítra' : date(d);
};

/** „“ / „zítřka“ / „26. 10.“ – pro spojení „do …“ */
const until = (d: Date, now: Date) => {
  const diff = dayKey(d) - dayKey(now);
  return diff === 0 ? '' : diff === 1 ? 'zítřka ' : `${date(d)} `;
};

const parse = (list: Vyjimka[]) =>
  list.map((v) => ({
    from: new Date(v.from),
    to: new Date(v.to),
    announceFrom: new Date(v.announceFrom ?? v.from),
  }));

/** Právě probíhající výjimka */
export function current(list: Vyjimka[], now = new Date()) {
  return parse(list).find((v) => now >= v.from && now < v.to);
}

/** Výjimka, která dnes ještě začne */
export function laterToday(list: Vyjimka[], now = new Date()) {
  return parse(list).find((v) => now < v.from && dayKey(v.from) === dayKey(now));
}

/** Text oznámení do horní lišty, nebo null, když se nic neoznamuje */
export function barText(list: Vyjimka[], now = new Date()) {
  const v = parse(list).find((x) => now >= x.announceFrom && now < x.to);
  if (!v) return null;
  if (now >= v.from) return `Mimořádná pohotovost do ${until(v.to, now)}${time(v.to)}:`;
  const start = when(v.from, now);
  const startCap = start.charAt(0).toUpperCase() + start.slice(1);
  return `${startCap} od ${time(v.from)} do ${until(v.to, now)}${time(v.to)} mimořádná pohotovost:`;
}

/** Konec probíhající výjimky pro pilulku („8:00“ nebo „zítřka 8:00“) */
export const untilText = (to: Date, now = new Date()) => `${until(to, now)}${time(to)}`;

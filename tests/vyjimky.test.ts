// Testy mimořádných časů (src/lib/vyjimky.ts): npm test
// Časy jsou zapsané s posunem pro Prahu, takže výsledek nezávisí na časovém pásmu počítače.
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { barInfo, current, hoursOn, laterToday, openStatus, untilText, validateVyjimky, type Rozvrh, type Vyjimka } from '../src/lib/vyjimky.ts';

const at = (iso: string) => new Date(iso);

describe('barInfo – jiné hodiny s oknem announceFrom/announceTo (čt 29. 10. 2026)', () => {
  const list: Vyjimka[] = [
    {
      kind: 'hodiny',
      date: '2026-10-29',
      opens: '09:00',
      closes: '19:00',
      announceFrom: '2026-10-29T00:01:00+01:00',
      announceTo: '2026-10-29T19:00:00+01:00',
    },
  ];
  const text = 'Dnes výjimečně otevřeno 9:00–19:00.';

  test('středa večer a čtvrtek 0:00 – běžná lišta', () => {
    assert.equal(barInfo(list, at('2026-10-28T23:59:00+01:00')), null);
    assert.equal(barInfo(list, at('2026-10-29T00:00:30+01:00')), null);
  });
  test('čtvrtek 0:01 až 18:59 – oznámení', () => {
    assert.deepEqual(barInfo(list, at('2026-10-29T00:01:00+01:00')), { kind: 'hodiny', text });
    assert.deepEqual(barInfo(list, at('2026-10-29T18:59:00+01:00')), { kind: 'hodiny', text });
  });
  test('čtvrtek od 19:00 – zpět běžná lišta', () => {
    assert.equal(barInfo(list, at('2026-10-29T19:00:00+01:00')), null);
    assert.equal(barInfo(list, at('2026-10-30T10:00:00+01:00')), null);
  });
});

describe('barInfo – zavřeno, výchozí oznámení 7 dní předem do konce dne', () => {
  const list: Vyjimka[] = [{ kind: 'hodiny', date: '2026-12-24' }];

  test('víc než 7 dní předem nic', () => {
    assert.equal(barInfo(list, at('2026-12-16T12:00:00+01:00')), null);
  });
  test('týden předem se dnem v týdnu', () => {
    assert.deepEqual(barInfo(list, at('2026-12-17T12:00:00+01:00')), { kind: 'hodiny', text: 'Ve čtvrtek 24. 12. výjimečně zavřeno.' });
  });
  test('den předem „Zítra“, v ten den „Dnes“', () => {
    assert.equal(barInfo(list, at('2026-12-23T20:00:00+01:00'))?.text, 'Zítra (24. 12.) výjimečně zavřeno.');
    assert.equal(barInfo(list, at('2026-12-24T23:59:00+01:00'))?.text, 'Dnes výjimečně zavřeno.');
  });
  test('druhý den zmizí', () => {
    assert.equal(barInfo(list, at('2026-12-25T00:00:30+01:00')), null);
  });
});

describe('pohotovost přes půlnoc (25.–26. 10. 2026, den změny na zimní čas)', () => {
  const okno = { from: '2026-10-25T20:30:00+01:00', to: '2026-10-26T08:00:00+01:00' };
  const list: Vyjimka[] = [{ ...okno, announceFrom: '2026-10-24T12:00:00+02:00' }];

  test('před oznámením nic', () => {
    assert.equal(barInfo(list, at('2026-10-24T11:59:00+02:00')), null);
  });
  test('den předem: „Zítra od … do 26. 10. …“', () => {
    assert.equal(barInfo(list, at('2026-10-24T18:00:00+02:00'))?.text, 'Zítra od 20:30 do 26. 10. 8:00 mimořádná pohotovost:');
  });
  test('v den začátku: „Dnes od … do zítřka …“', () => {
    assert.deepEqual(barInfo(list, at('2026-10-25T10:00:00+01:00')), { kind: 'pohotovost', text: 'Dnes od 20:30 do zítřka 8:00 mimořádná pohotovost:' });
  });
  test('během pohotovosti před a po půlnoci', () => {
    assert.equal(barInfo(list, at('2026-10-25T21:00:00+01:00'))?.text, 'Do zítřka 8:00 mimořádná pohotovost:');
    assert.equal(barInfo(list, at('2026-10-26T01:00:00+01:00'))?.text, 'Do 8:00 mimořádná pohotovost:');
  });
  test('v 8:00 skončí', () => {
    assert.equal(barInfo(list, at('2026-10-26T08:00:00+01:00')), null);
  });
  test('current, laterToday a untilText pro pilulku', () => {
    assert.equal(current(list, at('2026-10-25T10:00:00+01:00')), undefined);
    assert.ok(laterToday(list, at('2026-10-25T10:00:00+01:00')));
    assert.equal(laterToday(list, at('2026-10-24T18:00:00+02:00')), undefined);
    const now = at('2026-10-25T21:00:00+01:00');
    const ex = current(list, now);
    assert.ok(ex);
    assert.equal(laterToday(list, now), undefined);
    assert.equal(untilText(ex.to, now), 'zítřka 8:00');
    assert.equal(untilText(ex.to, at('2026-10-26T01:00:00+01:00')), '8:00');
  });
  test('bez announceFrom se oznamuje až od začátku', () => {
    assert.equal(barInfo([okno], at('2026-10-25T20:29:00+01:00')), null);
    assert.equal(barInfo([okno], at('2026-10-25T20:30:00+01:00'))?.kind, 'pohotovost');
  });
});

describe('přechody letního a zimního času', () => {
  test('noc změny na zimní čas: 2:30 letního i zimního času', () => {
    const list: Vyjimka[] = [{ from: '2026-10-24T20:00:00+02:00', to: '2026-10-25T08:00:00+01:00' }];
    assert.equal(barInfo(list, at('2026-10-25T02:30:00+02:00'))?.text, 'Do 8:00 mimořádná pohotovost:');
    assert.equal(barInfo(list, at('2026-10-25T02:30:00+01:00'))?.text, 'Do 8:00 mimořádná pohotovost:');
  });
  test('noc změny na letní čas (28. 3. 2027)', () => {
    const list: Vyjimka[] = [{ from: '2027-03-27T20:00:00+01:00', to: '2027-03-28T08:00:00+02:00' }];
    assert.equal(barInfo(list, at('2027-03-27T21:00:00+01:00'))?.text, 'Do zítřka 8:00 mimořádná pohotovost:');
    assert.equal(barInfo(list, at('2027-03-28T01:30:00+01:00'))?.text, 'Do 8:00 mimořádná pohotovost:');
    assert.equal(barInfo(list, at('2027-03-28T07:59:00+02:00'))?.text, 'Do 8:00 mimořádná pohotovost:');
    assert.equal(barInfo(list, at('2027-03-28T08:00:00+02:00')), null);
  });
  test('hoursOn počítá den podle Prahy, ne podle UTC', () => {
    const list: Vyjimka[] = [{ kind: 'hodiny', date: '2026-10-25' }];
    assert.equal(hoursOn(list, at('2026-10-24T22:30:00Z')), null); // v Praze už 25. 10. 0:30
    assert.equal(hoursOn(list, at('2026-10-25T23:30:00Z')), undefined); // v Praze už 26. 10.
  });
});

describe('hoursOn a přednost pohotovosti', () => {
  const list: Vyjimka[] = [
    { kind: 'hodiny', date: '2026-10-29', opens: '09:00', closes: '19:00' },
    { kind: 'hodiny', date: '2026-12-24' },
    { from: '2026-12-24T08:00:00+01:00', to: '2026-12-24T12:00:00+01:00' },
  ];
  test('jiné hodiny, zavřeno, beze změny', () => {
    assert.deepEqual(hoursOn(list, at('2026-10-29T12:00:00+01:00')), ['09:00', '19:00']);
    assert.equal(hoursOn(list, at('2026-12-24T12:00:00+01:00')), null);
    assert.equal(hoursOn(list, at('2026-10-30T12:00:00+01:00')), undefined);
  });
  test('probíhající pohotovost má v liště přednost před změnou hodin', () => {
    assert.equal(barInfo(list, at('2026-12-24T09:00:00+01:00'))?.kind, 'pohotovost');
    assert.equal(barInfo(list, at('2026-12-24T13:00:00+01:00'))?.kind, 'hodiny');
  });
  test('bez výjimek nic', () => {
    assert.equal(barInfo([], at('2026-10-29T12:00:00+01:00')), null);
  });
});

describe('validateVyjimky – kontrola zápisu v site.ts', () => {
  test('správné zápisy projdou (zimní i letní čas)', () => {
    assert.deepEqual(
      validateVyjimky([
        { kind: 'hodiny', date: '2026-10-29', opens: '09:00', closes: '19:00', announceFrom: '2026-10-29T00:01:00+01:00', announceTo: '2026-10-29T19:00:00+01:00' },
        { kind: 'hodiny', date: '2026-12-24' },
        { from: '2026-07-01T20:00:00+02:00', to: '2026-07-02T08:00:00+02:00', announceFrom: '2026-07-01T00:00:00+02:00' },
        { from: '2026-10-25T02:30:00+02:00', to: '2026-10-25T02:30:00+01:00' },
      ]),
      [],
    );
  });
  test('špatný letní/zimní čas', () => {
    const [p] = validateVyjimky([{ from: '2026-11-02T20:00:00+02:00', to: '2026-11-03T08:00:00+01:00' }]);
    assert.match(p, /posun \+02:00, v Praze tehdy platí \+01:00/);
  });
  test('chybějící časové pásmo a přehozené časy', () => {
    assert.equal(validateVyjimky([{ from: '2026-11-02T20:00:00', to: '2026-11-03T08:00:00+01:00' }]).length, 1);
    assert.match(validateVyjimky([{ from: '2026-11-03T08:00:00+01:00', to: '2026-11-02T20:00:00+01:00' }])[0], /musí být dřív/);
    assert.match(validateVyjimky([{ from: '2026-11-03T08:00:00+01:00', to: '2026-11-03T10:00:00+01:00', announceFrom: '2026-11-03T09:00:00+01:00' }])[0], /announceFrom/);
  });
  test('chyby u jiných hodin', () => {
    assert.match(validateVyjimky([{ kind: 'hodiny', date: '2026-02-30' }])[0], /skutečný den/);
    assert.match(validateVyjimky([{ kind: 'hodiny', date: '2026-10-29', opens: '09:00' }])[0], /opens i closes/);
    assert.match(validateVyjimky([{ kind: 'hodiny', date: '2026-10-29', opens: '9:00', closes: '19:00' }])[0], /HH:MM/);
    assert.match(validateVyjimky([{ kind: 'hodiny', date: '2026-10-29', opens: '19:00', closes: '09:00' }])[0], /až po zavření/);
    assert.match(
      validateVyjimky([{ kind: 'hodiny', date: '2026-10-29', announceFrom: '2026-10-29T19:00:00+01:00', announceTo: '2026-10-29T00:01:00+01:00' }])[0],
      /announceFrom musí být dřív/,
    );
  });
});

describe('openStatus – pilulka Otevřeno / Zavřeno', () => {
  // ne 16–18, po–pá 8–19, so 8–12
  const week = ['08:00', '19:00'] as [string, string];
  const rozvrh: Rozvrh = [['16:00', '18:00'], week, week, week, week, week, ['08:00', '12:00']];
  const stav = (list: Vyjimka[], iso: string, compact = true) => openStatus(rozvrh, list, compact, at(iso));

  test('běžný den: před otevřením, otevřeno, po zavření', () => {
    assert.deepEqual(stav([], '2026-11-03T07:30:00+01:00'), { open: false, emergency: false, text: 'Zavřeno · dnes 8:00' });
    assert.deepEqual(stav([], '2026-11-03T12:00:00+01:00'), { open: true, emergency: false, text: 'Otevřeno do 19:00' });
    assert.deepEqual(stav([], '2026-11-03T19:00:00+01:00'), { open: false, emergency: false, text: 'Zavřeno · zítra 8:00' });
  });
  test('o půlnoci je 0:00, ne 24:00', () => {
    assert.equal(stav([], '2026-11-03T00:00:00+01:00').text, 'Zavřeno · dnes 8:00');
  });
  test('dlouhý text', () => {
    assert.equal(stav([], '2026-11-03T12:00:00+01:00', false).text, 'Nyní otevřeno · zavíráme v 19:00');
    assert.equal(stav([], '2026-11-07T13:00:00+01:00', false).text, 'Nyní zavřeno · otevíráme zítra v 16:00');
  });
  test('jiné hodiny a zavřeno přeskočí na další otevřený den', () => {
    const list: Vyjimka[] = [{ kind: 'hodiny', date: '2026-10-29', opens: '09:00', closes: '19:00' }, { kind: 'hodiny', date: '2026-12-24' }, { kind: 'hodiny', date: '2026-12-25' }];
    assert.equal(stav(list, '2026-10-29T08:30:00+01:00').text, 'Zavřeno · dnes 9:00');
    assert.equal(stav(list, '2026-10-28T20:00:00+01:00').text, 'Zavřeno · zítra 9:00');
    assert.equal(stav(list, '2026-12-23T20:00:00+01:00').text, 'Zavřeno · so 8:00');
  });
  test('probíhající a dnešní pohotovost', () => {
    const list: Vyjimka[] = [{ from: '2026-11-07T20:30:00+01:00', to: '2026-11-08T08:00:00+01:00' }];
    assert.deepEqual(stav(list, '2026-11-07T21:00:00+01:00'), { open: false, emergency: true, text: 'Pohotovost do 8:00' });
    assert.equal(stav(list, '2026-11-07T21:00:00+01:00', false).text, 'Mimořádná pohotovost · do zítřka 8:00');
    assert.deepEqual(stav(list, '2026-11-07T13:00:00+01:00'), { open: false, emergency: true, text: 'Pohotovost od 20:30' });
    assert.equal(stav(list, '2026-11-07T10:00:00+01:00').open, true);
  });
  test('v noci změny času zůstává „zítra“ správný den (dřív přeskakoval)', () => {
    const zima: Vyjimka[] = [{ kind: 'hodiny', date: '2026-10-25' }];
    assert.equal(stav(zima, '2026-10-25T00:15:00+02:00').text, 'Zavřeno · zítra 8:00');
    const leto: Vyjimka[] = [{ kind: 'hodiny', date: '2027-03-28' }, { kind: 'hodiny', date: '2027-03-29', opens: '10:00', closes: '14:00' }];
    assert.equal(stav(leto, '2027-03-27T23:15:00+01:00').text, 'Zavřeno · po 10:00');
  });
});

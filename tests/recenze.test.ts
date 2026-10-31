// Testy čtení recenzí z Firmy.cz (scripts/update-firmy-reviews.mjs): npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse } from '../scripts/update-firmy-reviews.mjs';

const block = (href: string) =>
  `<div class="detailReview"><a class="author" href="${href}"><span class="authorName"><span>Jana N.</span></span></a>` +
  `<span class="ratingStar full"></span><span class="ratingStar full"></span><span class="date subtle">6. září 2026</span>` +
  `<div class="comment">Skvělá péče &amp; ochota</div></div>`;

test('přečte jméno, datum, hodnocení a text', () => {
  const [r] = parse(block('https://mapy.com/?a=1&amp;b=2'));
  assert.deepEqual(r, { name: 'Jana N.', date: '06/09/2026', rating: 2, text: 'Skvělá péče & ochota', url: 'https://mapy.com/?a=1&b=2', source: 'firmy' });
});

test('odkaz jiný než https se zahodí', () => {
  assert.equal(parse(block('javascript:alert(1)'))[0].url, undefined);
  assert.equal(parse(block('http://example.com/'))[0].url, undefined);
});

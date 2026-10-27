// Testy kontroly kontaktního formuláře (src/lib/kontaktni-formular.ts): npm test
// Pravidla mají odpovídat public/odeslat.php.
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { consentError, fieldError, resultText } from '../src/lib/kontaktni-formular.ts';

describe('fieldError', () => {
  test('povinné jméno, e-mail a zpráva', () => {
    assert.match(fieldError('jmeno', '  '), /jméno/);
    assert.equal(fieldError('jmeno', 'Jana Nováková'), '');
    assert.match(fieldError('email', ''), /Vyplňte/);
    assert.match(fieldError('zprava', 'a'), /Napište/);
    assert.equal(fieldError('zprava', 'Dobrý den'), '');
  });
  test('e-mail musí mít @ a doménu s tečkou', () => {
    assert.equal(fieldError('email', 'jana@seznam.cz'), '');
    assert.equal(fieldError('email', ' jana.novakova+pes@firma.co.uk '), '');
    for (const bad of ['jana', 'jana@', 'jana@seznam', 'ja na@seznam.cz', '@seznam.cz']) assert.match(fieldError('email', bad), /tvar/, bad);
  });
  test('telefon je nepovinný, ale když je vyplněný, jako v PHP', () => {
    assert.equal(fieldError('telefon', ''), '');
    for (const ok of ['777 123 456', '+420 777 123 456', '(+420) 777-123-456', '777/123.456']) assert.equal(fieldError('telefon', ok), '', ok);
    for (const bad of ['12345', '777 abc 456', '777123456;', '1'.repeat(41)]) assert.match(fieldError('telefon', bad), /číslicemi/, bad);
  });
  test('ostatní pole se nekontrolují', () => {
    assert.equal(fieldError('zvire', ''), '');
  });
  test('souhlas', () => {
    assert.match(consentError(false), /souhlas/);
    assert.equal(consentError(true), '');
  });
});

describe('resultText – výsledek odeslání bez JavaScriptu', () => {
  test('odesláno', () => {
    assert.deepEqual(resultText('1', null), { ok: true, text: 'Děkujeme, zpráva byla odeslána. Ozveme se Vám co nejdříve.' });
  });
  test('kódy chyb z odeslat.php', () => {
    assert.match(resultText('0', 'pole').text, /povinné pole/);
    assert.match(resultText('0', 'rychle').text, /příliš rychle/);
    assert.match(resultText('0', 'limit').text, /příliš mnoho/);
  });
  test('neznámý nebo chybějící kód → obecná chyba', () => {
    for (const reason of [null, 'odeslani', 'metoda', 'nesmysl']) {
      const r = resultText('0', reason);
      assert.equal(r.ok, false);
      assert.match(r.text, /nepodařilo odeslat/);
    }
  });
});

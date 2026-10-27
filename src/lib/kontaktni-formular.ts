// Kontrola kontaktního formuláře v prohlížeči. Pravidla odpovídají public/odeslat.php –
// při změně upravit obojí. Konečné slovo má vždy PHP.

const PHONE = /^[0-9 +()/.-]{6,40}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Text chyby pro pole formuláře, prázdný řetězec = v pořádku */
export function fieldError(name: string, value: string): string {
  const v = value.trim();
  switch (name) {
    case 'jmeno':
      return v ? '' : 'Vyplňte prosím jméno a příjmení.';
    case 'email':
      if (!v) return 'Vyplňte prosím e-mail, ať vám můžeme odpovědět.';
      return EMAIL.test(v) ? '' : 'E-mail nemá správný tvar, např. jmeno@seznam.cz.';
    case 'telefon':
      return !v || PHONE.test(v) ? '' : 'Telefon zadejte číslicemi, např. 777 123 456.';
    case 'zprava':
      return v.length >= 2 ? '' : 'Napište nám prosím, s čím vám můžeme pomoci.';
    default:
      return '';
  }
}

/** Chyba souhlasu se zpracováním údajů */
export const consentError = (checked: boolean) => (checked ? '' : 'Pro odeslání je potřeba souhlas se zpracováním osobních údajů.');

/** Výsledek odeslání bez JavaScriptu (odeslat.php přesměruje zpět s ?odeslano=…&chyba=…) */
export function resultText(sent: string, reason: string | null): { ok: boolean; text: string } {
  if (sent === '1') return { ok: true, text: 'Děkujeme, zpráva byla odeslána. Ozveme se Vám co nejdříve.' };
  const texts: Record<string, string> = {
    pole: 'Zprávu se nepodařilo odeslat – některé povinné pole nebylo vyplněné správně. Vyplňte prosím formulář znovu.',
    rychle: 'Formulář byl odeslán příliš rychle. Vyplňte ho prosím znovu.',
    limit: 'Odeslali jste příliš mnoho zpráv. Zkuste to prosím později nebo nám zavolejte.',
  };
  return { ok: false, text: texts[reason ?? ''] ?? 'Zprávu se nepodařilo odeslat. Zkuste to prosím znovu nebo nám zavolejte.' };
}

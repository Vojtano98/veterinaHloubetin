import type { Vyjimka } from '../lib/vyjimky';

// Centrální údaje o klinice – změna zde se projeví na celém webu.

export const site = {
  name: 'Veterinární klinika Hloubětín',
  company: 'Veterina Hloubětín s.r.o.',
  ico: '28381416',
  url: 'https://veterinahloubetin.cz',
  description:
    'Veterinární klinika Hloubětín se zaměřuje na prevenci, diagnostiku a léčbu nemocí malých zvířat od roku 2008. Klinika pro Prahu 9, Prahu 14 a široké okolí.',

  email: 'ordinace@veterinahloubetin.cz',

  phones: {
    // Hlavní číslo ordinace a pohotovosti (uváděné na webu)
    main: { label: '+420 773 665 751', href: 'tel:+420773665751' },
  },

  address: {
    street: 'Mochovská 535',
    city: 'Praha',
    zip: '198 00',
    note: 'Obchodní dům Havana',
    short: 'Mochovská 535, Praha 198 00',
    full: 'Mochovská 535, Praha, 198 00',
    lat: 50.1069901,
    lng: 14.537373,
  },

  mapsUrl:
    'https://www.google.com/maps/place/VETERIN%C3%81RN%C3%8D+KLINIKA+HLOUB%C4%9AT%C3%8DN+s.+r.+o./@50.1069901,14.5347981,17z/data=!3m1!4b1!4m6!3m5!1s0x470bed2f46575e65:0x7edbbbd0fb9cb791!8m2!3d50.1069901!4d14.537373!16s%2Fg%2F1td36z72?entry=ttu',
  mapsEmbed:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3250.1855752310225!2d14.537770081605533!3d50.106935262122015!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x470bed2f46575e65%3A0x7edbbbd0fb9cb791!2sVeterinary%20Clinic%20HLOUB%C4%9AT%C3%8DN%20s.%20R.%20O.!5e0!3m2!1scs!2scz!4v1716880224646!5m2!1scs!2scz',

  hours: [
    { days: 'Pondělí – Pátek', short: 'Po–Pá', time: '8:00–19:00', schema: ['Mo', 'Tu', 'We', 'Th', 'Fr'], opens: '08:00', closes: '19:00' },
    { days: 'Sobota', short: 'So', time: '8:00–12:00', schema: ['Sa'], opens: '08:00', closes: '12:00' },
    { days: 'Neděle', short: 'Ne', time: '16:00–18:00', schema: ['Su'], opens: '16:00', closes: '18:00' },
  ],

  // Mimořádné časy (pohotovost, svátky…). Zobrazí se jen v daném okně a pak samy zmizí.
  // Pozor na letní (+02:00) a zimní (+01:00) čas.
  // Vzory:
  //   pohotovost: { from: '2026-10-25T20:30:00+01:00', to: '2026-10-26T08:00:00+01:00', announceFrom: '2026-10-25T00:00:00+01:00' }
  //   jiné hodiny: { kind: 'hodiny', date: '2026-10-29', opens: '09:00', closes: '19:00' }  (bez opens/closes = zavřeno)
  //   Změna hodin se v liště oznamuje 7 dní předem do konce dne, nebo v okně announceFrom–announceTo.
  vyjimky: [
    {
      kind: 'hodiny',
      date: '2026-10-29',
      opens: '09:00',
      closes: '19:00',
      // V liště jen ve čtvrtek 0:01–19:00, jinak běžná lišta s hodinami
      announceFrom: '2026-10-29T00:01:00+01:00',
      announceTo: '2026-10-29T19:00:00+01:00',
    },
  ] as Vyjimka[],

  social: {
    facebook: 'https://www.facebook.com/veterinahloubetin',
    instagram: 'https://www.instagram.com/veterinahloubetin/',
  },

  firmyCz: 'https://www.firmy.cz/detail/2290030-veterinarni-klinika-hloubetin-praha-hloubetin.html',

  integrations: {
    gtm: 'GTM-K4QX5VTT',
    cookieyes: 'https://cdn-cookieyes.com/client_data/d5b6c77aecb3df59a7c59563/script.js',
    reservantoId: '16767',
  },
};

export const nav = [
  { label: 'Služby', href: '/#sluzby' },
  { label: 'Ceník', href: '/cenik-zakroku-a-vysetreni/' },
  { label: 'O nás', href: '/#onas' },
  { label: 'Články', href: '/clanky/' },
  { label: 'Rezervace služeb', href: '/rezervace-sluzeb/' },
  { label: 'Kontakty', href: '/kontakty/' },
];

export const footerNav = [
  { label: 'Služby', href: '/#sluzby' },
  { label: 'Ceník', href: '/cenik-zakroku-a-vysetreni/' },
  { label: 'O nás', href: '/#onas' },
  { label: 'Články', href: '/clanky/' },
  { label: 'Rezervace služeb', href: '/rezervace-sluzeb/' },
  { label: 'Kontakty', href: '/kontakty/' },
];

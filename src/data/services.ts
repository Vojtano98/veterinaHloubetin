import akutni from '../assets/uploads/2024/05/pes-zakroky.webp';
import interni from '../assets/uploads/2024/05/pes-zakroky-2.webp';
import stomatologie from '../assets/uploads/2024/05/kocka-zakroky-3.webp';
import prevence from '../assets/uploads/2025/05/Zakrok1.webp';
import ortopedie from '../assets/uploads/2025/05/Zakrok.png';
import chirurgie from '../assets/uploads/2024/05/pes-zakroky-5.webp';
import exoti from '../assets/uploads/2024/05/gekon-zakroky-6.webp';
import vybaveni from '../assets/uploads/2024/06/Frame-1.jpg';

export type Service = {
  id: string;
  title: string;
  image: ImageMetadata;
  items: string[];
  /** Související články (slug a krátký popisek odkazu) */
  articles?: { slug: string; label: string }[];
};

export const services: Service[] = [
  {
    id: 'akutni-medicina',
    title: 'Akutní medicína',
    image: akutni,
    items: [
      'Torze žaludku u psa (přetočení žaludku)',
      'Problematický porod u feny a kočky (císařský řez)',
      'Křeče (epilepsie, otravy, intoxikace)',
      'Krvavý průjem, zvracení krve',
    ],
  },
  {
    id: 'interni-medicina',
    title: 'Interní medicína',
    image: interni,
    items: ['Kardiologie', 'Endokrinologie', 'Dermatologie', 'Gynekologie', 'Gastroenterologie', 'Urologie'],
    articles: [
      { slug: 'psincovy-kasel-u-psu-priznaky-lecba-a-prevence', label: 'Psincový kašel' },
      { slug: 'koprologicke-vysetreni-trusu-vse-co-potrebujete-vedet', label: 'Vyšetření trusu' },
    ],
  },
  {
    id: 'stomatologie',
    title: 'Stomatologie',
    image: stomatologie,
    items: [
      'Preventivní stomatologie (odstranění zubního kamene ultrazvukem)',
      'Konzervační (záchovná) stomatologie (výplně zubů)',
      'Dentoalveolární chirurgie',
      'Ortodoncie (rovnátka)',
    ],
    articles: [
      { slug: 'zubni-kamen-u-psu-a-kocek-vse-co-potrebujete-vedet', label: 'Zubní kámen' },
    ],
  },
  {
    id: 'prevence',
    title: 'Prevence',
    image: prevence,
    items: ['Vakcinace psů a koček', 'Čipování', 'Vystavení evropského pasu', 'Preventivní diagnostika a geriatrická péče'],
    articles: [
      { slug: 'cipovani-zvirat-co-potrebujete-vedet', label: 'Čipování' },
      { slug: 'centralni-evidence-psu-od-1-cervence-2026-co-potrebuji-vedet-majitele-psu', label: 'Centrální evidence psů' },
      { slug: 'celorocni-ochrana-proti-parazitum-pro-psy-vyzkousejte-bravecto', label: 'Ochrana proti klíšťatům' },
    ],
  },
  {
    id: 'ortopedie',
    title: 'Ortopedie',
    image: ortopedie,
    items: [
      'Klinická diagnostika ortopedických problémů psů a koček',
      'Rentgenologická diagnostika ortopedických problémů',
      'Chirurgická terapie ortopedických problémů (ruptury předních zkřížených vazů, luxace patel, ošetření zlomenin)',
      'Zhotovení RTG kyčlí pro posouzení',
    ],
  },
  {
    id: 'chirurgie',
    title: 'Chirurgie měkkých tkání',
    image: chirurgie,
    items: ['Kastrace feny, kočky, psa a kocoura', 'Chirurgie urogenitálního traktu', 'Excize tumorů', 'Korekce očních víček'],
    articles: [
      { slug: 'kastrace-psa-vse-co-potrebujete-vedet', label: 'Kastrace psa' },
      { slug: 'kastrace-kocky-vse-co-potrebujete-vedet', label: 'Kastrace kočky' },
      { slug: 'kastrace-kocoura-vse-co-potrebujete-vedet', label: 'Kastrace kocoura' },
      { slug: 'pooperacni-pece-jak-se-starat-o-mazlicka-po-operaci', label: 'Pooperační péče' },
    ],
  },
  {
    id: 'exoticka-zvirata',
    title: 'Exotická zvířata a drobní savci',
    image: exoti,
    items: [
      'Medicína králíků, morčat a jiných drobných savců',
      'Medicína plazů a ptáků',
      'Zobrazovací diagnostika (RTG, USG)',
      'Laboratorní diagnostika',
      'Chirurgie včetně kastrace drobných savců',
    ],
    articles: [
      { slug: 'chov-suchozemskych-zelv', label: 'Suchozemské želvy' },
      { slug: 'chov-vodnich-zelv', label: 'Vodní želvy' },
      { slug: 'gekoncik-nocni-kompletni-pruvodce-chovem-peci-a-terariem', label: 'Gekončík noční' },
    ],
  },
  {
    id: 'vybaveni',
    title: 'Přístrojové vybavení',
    image: vybaveni,
    items: [
      'USG včetně echokardiografie',
      'RTG',
      'Hematologie a biochemie – analyzátor v ordinaci',
      'Plně vybavený operační sál s inhalační anestezií',
    ],
  },
];

// Ceník zákroků a vyšetření – ceny upravujte zde.
// Mezery v číslech se při zobrazení automaticky nahradí nezlomitelnými.

export type PriceSection = { title: string; subtitle?: string; items: { name: string; price: string }[]; note?: string };

export const cenik: PriceSection[] = [
  {
    title: "Vakcinace psů",
    subtitle: "(cena dle typu vakcíny)",
    items: [
      {
        name: "infekční choroby",
        price: "1 270 – 1 445 Kč"
      },
      {
        name: "infekční choroby + vzteklina",
        price: "1 370 – 1 535 Kč"
      },
      {
        name: "vzteklina",
        price: "1 170 Kč"
      }
    ]
  },
  {
    title: "Vakcinace koček",
    subtitle: "(cena dle typu vakcíny)",
    items: [
      {
        name: "infekční choroby",
        price: "1 320 Kč"
      },
      {
        name: "vzteklina",
        price: "1 170 Kč"
      },
      {
        name: "infekční choroby + chlamydie",
        price: "1 575 Kč"
      }
    ]
  },
  {
    title: "Vakcinace králíků",
    subtitle: "(cena dle typu vakcíny)",
    items: [
      {
        name: "myxomatóza + králičí mor I. i II.",
        price: "1 380 Kč"
      }
    ]
  },
  {
    title: "Kastrace",
    items: [
      {
        name: "kočka",
        price: "3 000 Kč"
      },
      {
        name: "kocour",
        price: "2 200 Kč"
      },
      {
        name: "fena – 1 – 10 kg (inhalační anestezie *)",
        price: "7 000 – 8 000 Kč"
      },
      {
        name: "fena – 10 – 20 kg (inhalační anestezie *)",
        price: "9 000 Kč"
      },
      {
        name: "fena – 20 – 40 kg (inhalační anestezie *)",
        price: "10 000 Kč"
      },
      {
        name: "fena – nad 40 kg (inhalační anestezie *)",
        price: "od 12 000 Kč"
      },
      {
        name: "pes – dle velikosti (inhalační anestezie *)",
        price: "6 000 – 8 000 Kč"
      },
      {
        name: "králík – samice (inhalační anestezie *)",
        price: "4 000 Kč"
      },
      {
        name: "králík – samec (inhalační anestezie *)",
        price: "2 500 Kč"
      }
    ],
    note: "* inhalační anestezie je nejmodernější metoda narkózy s minimálním kardiodepresivním účinkem, pacient se po ukončení zákroku začne ihned probouzet."
  },
  {
    title: "Ostatní vyšetření",
    items: [
      {
        name: "klinické vyšetření",
        price: "1 080 Kč"
      },
      {
        name: "klinické vyšetření + konzultace – exotické zvíře",
        price: "1 200 Kč"
      },
      {
        name: "ortopedické vyšetření",
        price: "3 000 Kč"
      },
      {
        name: "kontrola",
        price: "840 Kč"
      },
      {
        name: "krácení drápků",
        price: "200 Kč"
      },
      {
        name: "čištění análních žlázek",
        price: "400 Kč"
      },
      {
        name: "čipování",
        price: "1 080 Kč"
      },
      {
        name: "vystavení europasu",
        price: "1 080 Kč"
      },
      {
        name: "echokardiografické vyšetření srdce",
        price: "3 000 Kč"
      },
      {
        name: "sonografické vyšetření celé břišní dutiny",
        price: "1 800 Kč"
      },
      {
        name: "sonografické vyšetření jednoho orgánu",
        price: "960 Kč"
      },
      {
        name: "sonografické vyšetření kontrolní",
        price: "960 Kč"
      },
      {
        name: "RTG – první projekce",
        price: "1 440 Kč"
      },
      {
        name: "RTG – další projekce",
        price: "600 Kč"
      },
      {
        name: "RTG – kontrolní",
        price: "960 Kč"
      },
      {
        name: "předoperační vyšetření krve (biochemie + hematologie)",
        price: "2 000 Kč"
      },
      {
        name: "čištění zubů ultrazvukem – malý pes, kočka (bez extrakcí zubů)",
        price: "cca 3 500 Kč"
      },
      {
        name: "čištění zubů ultrazvukem – velký pes (bez extrakcí zubů)",
        price: "od 5 000 Kč"
      },
      {
        name: "pohotovostní příplatek",
        price: "2 400 Kč"
      },
      {
        name: "víkendový příplatek (nevztahuje se na plánované kontroly)",
        price: "840 Kč"
      }
    ]
  }
];

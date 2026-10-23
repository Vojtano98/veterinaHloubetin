import petr from '../assets/uploads/2025/05/Petr.webp';
import helena from '../assets/uploads/2025/05/Stastna.webp';
import veronika from '../assets/uploads/2025/05/Sestra2.jpg';
import nikola from '../assets/uploads/2025/05/NikolaB.webp';

export type Member = {
  id: string;
  name: string;
  role: string;
  /** Pracovní pozice tak, jak se zobrazuje na webu */
  title: string;
  doctor: boolean;
  phone?: { label: string; href: string };
  photo?: ImageMetadata;
};

export const team: Member[] = [
  {
    id: 'petr-skubal',
    name: 'MVDr. Petr Škubal',
    role: 'chirurgie, ortopedie, stomatologie',
    title: 'Veterinární lékař',
    doctor: true,
    phone: { label: '+420 773 665 752', href: 'tel:+420773665752' },
    photo: petr,
  },
  {
    id: 'helena-pavelkova',
    name: 'MVDr. Helena Pavelková',
    role: 'kardiologie, herpetologie',
    title: 'Veterinární lékařka',
    doctor: true,
    phone: { label: '+420 777 658 968', href: 'tel:+420777658968' },
    photo: helena,
  },
  { id: 'veronika-zemlickova', name: 'Veronika Žemličková', role: 'veterinární sestra', title: 'Veterinární sestra', doctor: false, photo: veronika },
  { id: 'nikola-buchtelova', name: 'Nikola Buchtelová', role: 'veterinární sestra', title: 'Veterinární sestra', doctor: false, photo: nikola },
  { id: 'karolina-kulmova', name: 'Karolína Kulmová', role: 'veterinární sestra', title: 'Veterinární sestra', doctor: false },
];

export const memberById = (id?: string) => team.find((m) => m.id === id);

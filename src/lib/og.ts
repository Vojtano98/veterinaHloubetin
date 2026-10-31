import { getImage } from 'astro:assets';

// Náhled při sdílení odkazu (WhatsApp, Messenger, Facebook…): 1200 × 630, oříznutý s ohledem na nejzajímavější část.
// Bez zvětšování: menší fotka dá menší obrázek, ale vždy v poměru 1200 : 630.
export async function ogImage(src: ImageMetadata) {
  const width = Math.min(1200, src.width);
  const height = Math.round((width * 630) / 1200);
  const image = await getImage({ src, width, height, fit: 'cover', position: 'attention', format: 'jpg', quality: 82 });
  return { src: image.src, width, height };
}

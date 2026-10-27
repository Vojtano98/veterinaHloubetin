// Režim indexace vyhledávači. Rozhoduje astro.config.mjs (indexace jen při PUBLIC_INDEXING=true)
// a předává ho jako __INDEXING__, aby meta robots, robots.txt i hlavička v .htaccess vycházely ze stejné hodnoty.
declare const __INDEXING__: boolean;

/** Náhled na GitHub Pages: bez GTM a CookieYes, nikdy se neindexuje */
export const isPreview = import.meta.env.PUBLIC_PREVIEW === '1';

/** Indexace povolená výslovně při ostrém spuštění */
export const indexing = __INDEXING__ && !isPreview;
